import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      message: "OPENAI_API_KEY is not configured. The dashboard can still generate explainable rule-based business signals.",
    }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id,name,business_type,currency,timezone")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business) return NextResponse.json({ error: "No business workspace was found." }, { status: 404 });

    const since = new Date(); since.setDate(since.getDate() - 90);
    const [products, sales, expenses, customers] = await Promise.all([
      supabase.from("products").select("name,category,unit_price,cost_price,stock_quantity,is_active").eq("business_id", business.id).limit(200),
      supabase.from("sales").select("status,total_amount,sold_at,currency").eq("business_id", business.id).gte("sold_at", since.toISOString()).order("sold_at", { ascending: true }).limit(1000),
      supabase.from("expenses").select("category,amount,spent_at").eq("business_id", business.id).gte("spent_at", since.toISOString().slice(0, 10)).limit(500),
      supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    ]);
    const failure = products.error || sales.error || expenses.error || customers.error;
    if (failure) throw failure;

    const businessContext = {
      business: { name: business.name, type: business.business_type, currency: business.currency, timezone: business.timezone },
      products: products.data ?? [],
      sales: sales.data ?? [],
      expenses: expenses.data ?? [],
      customer_count: customers.count ?? 0,
      period_days: 90,
    };
    const prompt = `You are TasteAI Enterprise, a cautious business analyst for a food/hospitality business. Analyze only the supplied data. Do not invent missing values, trends, or causes. Return a JSON object with an "insights" array. Each item must have insight_type (one of sales, inventory, customer, forecast, recommendation, alert, general), title (short), summary (2-4 practical sentences), details (JSON object), and confidence (number 0 to 1). Give 2-5 useful insights when the data supports them. If data is sparse, explicitly say what is missing and recommend what to record next. Keep recommendations actionable and avoid presenting correlation as causation. Never claim that an estimate is a guarantee. Currency is ${business.currency}. Business data: ${JSON.stringify(businessContext)}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
        text: { format: { type: "json_object" } },
        max_output_tokens: 1600,
      }),
      cache: "no-store",
    });
    const payload = await response.json() as { output_text?: string; error?: { message?: string }; output?: Array<{ content?: Array<{ text?: string }> }> };
    if (!response.ok) return NextResponse.json({ error: payload.error?.message || "The AI provider could not generate insights." }, { status: 502 });
    const outputText = payload.output_text ?? payload.output?.flatMap(item => item.content ?? []).map(item => item.text ?? "").join("") ?? "";
    const parsed = JSON.parse(outputText) as { insights?: Array<{ insight_type?: string; title?: string; summary?: string; details?: Record<string, unknown>; confidence?: number }> };
    const allowed = new Set(["sales", "inventory", "customer", "forecast", "recommendation", "alert", "general"]);
    const insights = (parsed.insights ?? []).filter(item => typeof item.title === "string" && typeof item.summary === "string").slice(0, 5).map(item => ({
      insight_type: allowed.has(item.insight_type ?? "") ? item.insight_type : "general",
      title: String(item.title).slice(0, 180),
      summary: String(item.summary).slice(0, 1500),
      details: item.details && typeof item.details === "object" ? item.details : {},
      confidence: Math.min(1, Math.max(0, Number(item.confidence ?? 0.7))),
    }));
    if (!insights.length) return NextResponse.json({ error: "The AI response did not contain usable insights." }, { status: 502 });
    return NextResponse.json({ configured: true, insights });
  } catch (error) {
    console.error("TasteAI insight generation failed:", error);
    return NextResponse.json({ error: "Could not generate insights from the current business records." }, { status: 500 });
  }
}
