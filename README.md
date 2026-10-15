# TasteAI Enterprise

TasteAI Enterprise is a responsive business-intelligence workspace for restaurants, cafés, catering companies, bakeries, hotels, and multi-location food businesses.

## Included in this starter

- Next.js App Router + TypeScript
- Supabase browser/server clients
- Supabase email/password sign-up, sign-in, sign-out, and auth callback
- Dashboard shell with modules for AI Insights, Sales, Orders, Customers, Menu Intelligence, Inventory, Forecasting, Reports, and Settings
- Initial SQL schema and Row Level Security policies for profiles, businesses, products, customers, sales, sale items, expenses, and AI insights
- Responsive desktop/mobile styling
- Dashboard sample values are clearly labelled as demo data until you connect real records and analytics.

## Requirements

- Node.js 20.9+ recommended
- npm
- Supabase project

## Run locally

1. Extract this ZIP.
2. Open the extracted `tasteai-enterprise` folder in VS Code.
3. Open a terminal in that folder and run:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env.local`.
5. In Supabase, open **Project Settings → API** and copy your project URL and publishable key into `.env.local`. Do not put a service-role/secret key in a `NEXT_PUBLIC_` variable.
6. In Supabase **SQL Editor**, run `supabase/schema.sql`.
7. In Supabase **Authentication → URL Configuration**, set your local Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs.
8. Run:

   ```bash
   npm run dev
   ```

9. Open http://localhost:3000.

## Supabase schema

The SQL creates the foundation for:
- `profiles`
- `businesses`
- `products`
- `customers`
- `sales`
- `sale_items`
- `expenses`
- `ai_insights`

Every business-owned table uses Row Level Security policies based on the authenticated user's ownership. Review the schema and policies against your organisation's requirements before production use.

## Current implementation boundaries

This is a runnable MVP foundation, not a finished enterprise deployment. Dashboard charts and KPI cards currently use demo values where noted. The AI Insights/Forecasting screens are interface foundations; generating real predictions requires a server-side AI provider integration and business data. Orders and product/customer management screens need their create/edit workflows wired to the schema before operational use. Do not use demo numbers for real business decisions.

## Build and deployment

Run `npm run build` before deployment. In Vercel, import the GitHub repository and add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` environment variables. Then configure the Supabase production Site URL and redirect URLs to match your deployed domain.
