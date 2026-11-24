
"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  MessageSquareText,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import {
  getOrCreateBusiness,
  money,
  type TasteBusiness,
} from "@/lib/business-client";

type BusinessSnapshot = {
  revenue: number;
  salesCount: number;
  customerCount: number;
  productCount: number;
  lowStock: string[];
  expenses: number;
  currency: string;
};

type AskPayload = {
  answer?: string;
  message?: string;
  error?: string;
  configured?: boolean;
};

const SUGGESTED_QUESTIONS = [
  "How much revenue did I record in the last 30 days?",
  "Which products should I check for low stock?",
  "What should I know about my expenses and profit?",
  "How can I improve menu margins?",
];

export default function BusinessAsk() {
  const [business, setBusiness] = useState<TasteBusiness | null>(null);
  const [snapshot, setSnapshot] = useState<BusinessSnapshot | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [contextError, setContextError] = useState("");
  const [error, setError] = useState("");
  const [answeredQuestion, setAnsweredQuestion] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBusinessContext() {
      try {
        const { business: workspace, supabase } =
          await getOrCreateBusiness();

        const since = new Date();
        since.setDate(since.getDate() - 30);

        const [
          salesResult,
          productsResult,
          customersResult,
          expensesResult,
        ] = await Promise.all([
          supabase
            .from("sales")
            .select("total_amount,status")
            .eq("business_id", workspace.id)
            .gte("sold_at", since.toISOString()),

          supabase
            .from("products")
            .select("name,stock_quantity,is_active")
            .eq("business_id", workspace.id),

          supabase
            .from("customers")
            .select("id", { count: "exact", head: true })
            .eq("business_id", workspace.id),

          supabase
            .from("expenses")
            .select("amount")
            .eq("business_id", workspace.id)
            .gte("spent_at", since.toISOString().slice(0, 10)),
        ]);

        const failure =
          salesResult.error ||
          productsResult.error ||
          customersResult.error ||
          expensesResult.error;

        if (failure) throw failure;
        if (!active) return;

        const completedSales = (salesResult.data ?? []).filter(
          (sale) => sale.status === "completed"
        );

        const products = productsResult.data ?? [];

        setBusiness(workspace);

        setSnapshot({
          revenue: completedSales.reduce(
            (total, sale) =>
              total + Number(sale.total_amount || 0),
            0
          ),
          salesCount: completedSales.length,
          customerCount: customersResult.count ?? 0,
          productCount: products.length,
          lowStock: products
            .filter(
              (product) =>
                product.is_active &&
                Number(product.stock_quantity) <= 5
            )
            .map((product) => product.name),
          expenses: (expensesResult.data ?? []).reduce(
            (total, expense) =>
              total + Number(expense.amount || 0),
            0
          ),
          currency: workspace.currency,
        });

        setContextError("");
      } catch (err) {
        if (!active) return;

        setContextError(
          err instanceof Error
            ? err.message
            : "Could not load your business data."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBusinessContext();

    return () => {
      active = false;
    };
  }, []);

  function buildLocalAnswer(
    prompt: string,
    data: BusinessSnapshot
  ): string {
    const lower = prompt.toLowerCase();

    if (
      /(revenue|sales|sold|income|money made)/.test(lower)
    ) {
      return (
        `In the last 30 days, your workspace recorded ` +
        `${data.salesCount} completed sale(s) and revenue of ` +
        `${money(data.revenue, data.currency)}. ` +
        "This total includes only sales saved with the completed status."
      );
    }

    if (
      /(stock|inventory|restock|running low|low stock)/.test(
        lower
      )
    ) {
      if (data.lowStock.length === 0) {
        return (
          "I did not find active products with five or fewer " +
          "units recorded. Confirm your actual kitchen and shelf " +
          "quantities to ensure the inventory records are current."
        );
      }

      return (
        "These active products have five or fewer units recorded: " +
        `${data.lowStock.join(", ")}. Review the actual quantities ` +
        "before deciding what to reorder."
      );
    }

    if (/(customer|customers|loyal|repeat)/.test(lower)) {
      return (
        `Your workspace contains ${data.customerCount} customer ` +
        "record(s). This is a record count, not a repeat-customer " +
        "or customer-retention calculation. Sales need to be linked " +
        "to customer records to measure those metrics accurately."
      );
    }

    if (
      /(expense|expenses|cost|profit|profitable)/.test(lower)
    ) {
      const difference = data.revenue - data.expenses;

      return (
        `Expenses recorded in the last 30 days total ` +
        `${money(data.expenses, data.currency)}. Completed sales ` +
        `revenue is ${money(data.revenue, data.currency)}. ` +
        `The difference is ${money(difference, data.currency)}, ` +
        "but it is not net profit: product costs, taxes, payroll, " +
        "and other expenses may be missing."
      );
    }

    if (/(menu|product|products|price|margin)/.test(lower)) {
      return (
        `Your workspace contains ${data.productCount} product ` +
        "record(s). Review Menu Intelligence and check each item's " +
        "selling price against its recorded cost. Reliable margin " +
        "calculations depend on accurate cost data."
      );
    }

    return (
      "Here is your current business snapshot: " +
      `${data.salesCount} completed sale(s), ` +
      `${money(data.revenue, data.currency)} in revenue, ` +
      `${data.customerCount} customer record(s), and ` +
      `${data.productCount} product record(s). ` +
      "I can provide a rule-based summary for supported topics " +
      "such as sales, stock, customers, expenses, and menu margins. " +
      "Configure your server-side AI key for AI-generated answers."
    );
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = question.trim();

    if (prompt.length < 3) {
      setError("Please enter a question with at least 3 characters.");
      return;
    }

    if (prompt.length > 600) {
      setError("Your question must be no longer than 600 characters.");
      return;
    }

    setAsking(true);
    setError("");
    setAnswer("");
    setAnsweredQuestion("");

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: prompt }),
      });

      let payload: AskPayload = {};

      try {
        payload = (await response.json()) as AskPayload;
      } catch {
        payload = {};
      }

      if (response.ok && payload.answer?.trim()) {
        setAnswer(payload.answer.trim());
        setAnsweredQuestion(prompt);
      } else if (response.status === 503 && snapshot) {
        setAnswer(buildLocalAnswer(prompt, snapshot));
        setAnsweredQuestion(prompt);
      } else {
        throw new Error(
          payload.error ||
            payload.message ||
            (response.status === 503
              ? "AI is not configured yet, and business data is unavailable for a fallback answer."
              : `The request failed (HTTP ${response.status}). Please try again.`)
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while answering your question."
      );
    } finally {
      setAsking(false);
    }
  }

  function chooseQuestion(prompt: string) {
    setQuestion(prompt);
    setError("");
  }

  function startNewQuestion() {
    setQuestion("");
    setAnswer("");
    setAnsweredQuestion("");
    setError("");
  }

  return (
    <div className="module-page business-ask-page">
      <Link href="/dashboard/insights" className="back-link">
        <ArrowLeft size={16} />
        <span>Back to AI Insights</span>
      </Link>

      <header className="ask-hero">
        <div className="ask-orb">
          <BrainCircuit size={30} />
        </div>

        <div className="eyebrow">TASTEAI BUSINESS ASSISTANT</div>

        <h1>Ask your business a better question.</h1>

        <p className="ask-hero-description">
          Understand your sales, customers, inventory, expenses, and
          menu performance using your business workspace.
        </p>

        <div className="ask-context-pill">
          {loading ? (
            <LoaderCircle size={15} className="spin" />
          ) : contextError ? (
            <CircleAlert size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}

          <span>
            {loading
              ? "Loading business context..."
              : contextError
                ? "Business context unavailable"
                : `Connected to ${business?.name ?? "your workspace"}`}
          </span>
        </div>

        {!loading && snapshot && !contextError && (
          <div className="ask-context-summary">
            <span>
              <strong>{snapshot.salesCount}</strong> completed sales
            </span>
            <span className="ask-summary-divider" />
            <span>
              <strong>
                {money(snapshot.revenue, snapshot.currency)}
              </strong>{" "}
              recorded revenue
            </span>
            <span className="ask-summary-period">Last 30 days</span>
          </div>
        )}
      </header>

      {contextError && (
        <div
          className="live-alert live-alert-error ask-context-warning"
          role="status"
        >
          <CircleAlert size={18} />
          <div>
            <strong>Business data could not be loaded.</strong>
            <p>{contextError}</p>
            You can still try the AI service, but a local fallback
            answer will not be available without the business snapshot.
          </div>
        </div>
      )}

      {error && (
        <div className="live-alert live-alert-error" role="alert">
          <CircleAlert size={18} />
          <div>{error}</div>
        </div>
      )}

      <section className="panel ask-chat-panel">
        <div className="panel-heading ask-panel-heading">
          <div className="ask-panel-icon">
            <MessageSquareText size={19} />
          </div>

          <div>
            <h2>Business question</h2>
            <p>
              Ask one clear question to get started. Answers depend on
              your saved records and available AI configuration.
            </p>
          </div>
        </div>

        <form className="ask-question-form" onSubmit={ask}>
          <label className="ask-input-label" htmlFor="business-question">
            What would you like to know?
          </label>

          <textarea
            id="business-question"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
              if (error) setError("");
            }}
            placeholder="For example: Which products should I review for restocking?"
            rows={4}
            maxLength={600}
            required
            aria-describedby="ask-character-count"
          />

          <div className="ask-question-footer">
            <span id="ask-character-count">
              {question.length}/600 characters
            </span>

            <button
              className="button button-primary ask-submit-button"
              type="submit"
              disabled={asking || question.trim().length < 3}
            >
              {asking ? (
                <>
                  <LoaderCircle size={17} className="spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Ask TasteAI
                </>
              )}
            </button>
          </div>
        </form>

        {asking && (
          <div className="ask-thinking" role="status" aria-live="polite">
            <span className="ask-thinking-icon">
              <Sparkles size={18} />
            </span>
            <div>
              <strong>Analyzing your question</strong>
              <p>TasteAI is preparing your response.</p>
            </div>
          </div>
        )}

        {answer && !asking && (
          <section className="ask-answer" aria-live="polite">
            <div className="ask-answer-title">
              <span className="ask-answer-icon">
                <Sparkles size={17} />
              </span>

              <div>
                <strong>TasteAI response</strong>
                <span className="ask-answer-subtitle">
                  {answeredQuestion}
                </span>
              </div>

              <button
                type="button"
                className="ask-reset-button"
                onClick={startNewQuestion}
                aria-label="Start a new question"
                title="Start a new question"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <div className="ask-answer-body">{answer}</div>

            <p className="ask-answer-disclaimer">
              Verify important business decisions against your source
              records. Summaries are only as accurate as the available
              data.
            </p>
          </section>
        )}

        <div className="ask-suggestions">
          <div className="ask-suggestions-heading">
            <div>
              <strong>Need an idea?</strong>
              <p>Choose a suggested question to fill in the box.</p>
            </div>
            <Sparkles size={19} />
          </div>

          <div className="ask-suggestion-list">
            {SUGGESTED_QUESTIONS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ask-suggestion"
                onClick={() => chooseQuestion(prompt)}
              >
                <span>{prompt}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="workspace-security-note ask-security-note">
        <CircleAlert size={17} />
        <p>
          <strong>About your answers:</strong> The external AI model
          requires a server-side <code>OPENAI_API_KEY</code>. When the
          API returns HTTP 503 and business data is available, TasteAI
          can provide supported rule-based summaries instead. Keep
          private API keys on the server, never in browser code.
        </p>
      </div>
    </div>
  );
}
