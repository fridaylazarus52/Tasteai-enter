import Link from "next/link";
import { ArrowLeft, BrainCircuit, Sparkles } from "lucide-react";

export default function AskPage() {
  return <div className="module-page"><Link href="/dashboard/insights" className="back-link"><ArrowLeft size={15} /> Back to AI Insights</Link><div className="ask-hero"><span className="ask-orb"><BrainCircuit size={30} /></span><div className="eyebrow">TASTEAI CONCIERGE</div><h1>Ask your business a better question.</h1><p>The AI assistant interface is planned here. It will become useful when it can securely retrieve your business records and explain answers with evidence.</p><div className="ask-coming-soon"><Sparkles size={17} /><span>AI provider and server-side retrieval are not connected yet.</span></div><Link className="button button-primary" href="/dashboard">Return to overview</Link></div></div>;
}
