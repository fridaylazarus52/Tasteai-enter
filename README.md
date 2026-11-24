# TasteAI Enterprise

TasteAI Enterprise is a Supabase-backed business workspace for restaurants, cafés, catering companies, bakeries, hotels, food trucks, and other food-service businesses.

## Working features in this version

- Supabase email/password sign-up, sign-in, sign-out, and authenticated dashboard routes.
- Automatic creation of a starter business workspace for a newly signed-in account.
- Live Overview metrics from Supabase: completed sales revenue, sale count, average sale, customer count, stock snapshot, and recorded expenses.
- Menu Intelligence: create products, set category/SKU, selling price, unit cost and opening stock; archive/restore products.
- Inventory: edit stock quantities and identify products with five or fewer units.
- Customers: create and delete customer records.
- Sales: record a transaction for a product, optionally link a customer, calculate total, store a sale item, and decrement stock.
- Orders: view transactions and update status. Stock is restored when a completed sale is refunded/cancelled and deducted when a sale is marked completed again.
- Reports: record operating expenses, view basic revenue/expense summaries, and export loaded sales as CSV.
- Forecasting: a transparent baseline using average revenue on recent days with completed sales; this is not a trained predictive model.
- AI Insights: generate and save rule-based business checks for low stock, recorded margins and sales activity; review/action/dismiss saved insights.
- Business Q&A: asks about business data. With an OpenAI API key configured, it can use an AI model server-side; without it, it falls back to transparent rules-based answers for supported questions.
- Responsive dashboard styling and existing navigation retained.

## Requirements

- Node.js 20.9+ recommended
- npm
- The existing TasteAI Supabase project

## Run locally

1. Extract the ZIP and open the `tasteai-enterprise` folder in VS Code or a terminal.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local`.
4. In Supabase, open **Project Settings → API** (or the project's **Connect** panel) and set the public browser configuration values in `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

   Do not append `/rest/v1/` to the URL. Do not put a service-role/secret key in a `NEXT_PUBLIC_` variable.

5. The project already has `supabase/schema.sql` defining the required tables and Row Level Security policies. The connected TasteAI project was inspected and already has the core tables (`businesses`, `products`, `customers`, `sales`, `sale_items`, `expenses`, `ai_insights`, and `profiles`). **Do not blindly rerun schema changes on a production database without reviewing them first.** If setting up a new Supabase project, review and run `supabase/schema.sql` in its SQL Editor.
6. In Supabase **Authentication → URL Configuration**, set the local Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs.
7. Optional: to enable model-generated AI insights and Q&A, set a server-only API key in `.env.local`:

   ```env
   OPENAI_API_KEY=YOUR_SERVER_SIDE_OPENAI_API_KEY
   OPENAI_MODEL=gpt-4.1-mini
   ```

   Never prefix this key with `NEXT_PUBLIC_` and never commit `.env.local`. Without this key, the product still offers rule-based insights and answers.

8. Start the development server:

   ```bash
   npm run dev
   ```

9. Open http://localhost:3000, sign in, and use the dashboard.

## Data and security notes

- Business records are queried through the authenticated Supabase client and existing Row Level Security policies.
- This version selects the first business workspace owned by the signed-in account. A full multi-workspace switcher and team-membership/roles workflow are future work.
- The sales form creates one-product sale records. Before production, sales creation and inventory updates should be moved into a database transaction/RPC to make the combined operation atomic under concurrent sales.
- Forecasting is a simple baseline, not machine-learning forecasting.
- AI Insights without `OPENAI_API_KEY` are deterministic rule-based checks, not LLM-generated insights. With the key configured, server-side routes send a limited business-data snapshot to the configured AI provider. Review your privacy requirements before enabling that feature.
- Revenue and expense summaries do not by themselves equal accounting-grade profit. Accurate profit requires reliable product costs, all expenses, taxes, refunds, and reconciled records.
- Test with separate user accounts before production and review Supabase RLS policies, authentication settings, backups, and rate limits.

## Build and deployment

Run `npm run build` before deploying. In Vercel, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Configure `OPENAI_API_KEY` only if you want the optional model-backed AI routes. Also configure the Supabase production Site URL and redirect URLs to match your deployed domain.
