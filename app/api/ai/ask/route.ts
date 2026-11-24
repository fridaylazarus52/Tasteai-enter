import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ configured: false, message: "AI provider is not configured yet." }, { status: 503 });
  try {
    const body = await request.json() as { question?: unknown };
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (question.length < 3 || question.length > 600) return NextResponse.json({ error: "Enter a question between 3 and 600 characters." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    const { data: business, error: businessError } = await supabase.from("businesses").select("id,name,business_type,currency,timezone").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
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
    const context = { business, products: products.data ?? [], sales: sales.data ?? [], expenses: expenses.data ?? [], customer_count: customers.count ?? 0 };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", input: `You are TasteAI Enterprise, a careful business analyst for a food-service business. Answer the owner's question using only the supplied business data. Be concise and practical. If the data cannot answer the question, say so and suggest what should be recorded. Do not invent numbers or present estimates as facts. Currency: ${business.currency}. BUSINESS DATA: ${JSON.stringify(context)}\nOWNER QUESTION: ${question}`, max_output_tokens: 900 }),
    });
    const payload = await response.json() as { output_text?: string; error?: { message?: string }; output?: Array<{ content?: Array<{ text?: string }> }> };
    if (!response.ok) return NextResponse.json({ error: payload.error?.message || "The AI provider could not answer this question." }, { status: 502 });
    const answer = payload.output_text ?? payload.output?.flatMap(item => item.content ?? []).map(item => item.text ?? "").join("") ?? "";
    if (!answer.trim()) return NextResponse.json({ error: "The AI provider returned an empty answer." }, { status: 502 });
    return NextResponse.json({ configured: true, answer });
  } catch (error) {
    console.error("TasteAI business question failed:", error);
    return NextResponse.json({ error: "Could not answer from the current business records." }, { status: 500 });
  }
}
