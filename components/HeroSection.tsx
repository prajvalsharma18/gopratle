import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarDays, Check, Sparkles } from "lucide-react";
import { RequirementSearch } from "@/components/RequirementSearch";

export function HeroSection() {
  return (
    <section className="hero-section" id="home">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> You post. Professionals respond.</div>
          <h1>Find trusted professionals <span>for your event.</span></h1>
          <p className="hero-description">Share your requirement, receive proposals from trusted professionals, compare options, and book with confidence.</p>
          <RequirementSearch />
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/requirements/new">Submit Requirements <ArrowRight size={17} aria-hidden="true" /></Link>
            <a className="text-link" href="#how-it-works">See how it works <ArrowDown size={15} aria-hidden="true" /></a>
          </div>
          <div className="hero-note"><Check size={15} aria-hidden="true" /> A simpler way to plan something memorable</div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="visual-card main-visual-card">
            <div className="visual-card-top"><span className="visual-icon"><CalendarDays size={20} /></span><span className="visual-status"><span /> Your event, your way</span></div>
            <div className="visual-headline">The right team<br />makes the moment.</div>
            <div className="visual-rule" />
            <div className="visual-list"><span><i><Check size={11} /></i> Planners who get your vision</span><span><i><Check size={11} /></i> Talent that brings the energy</span><span><i><Check size={11} /></i> Crew that makes it all happen</span></div>
            <div className="visual-card-bottom"><span>Made for moments that matter</span><Sparkles size={16} /></div>
          </div>
          <div className="floating-note"><span className="floating-note-icon"><Sparkles size={17} /></span><span><strong>Good things happen</strong><small>when the right people meet</small></span></div>
          <div className="decor decor-a" /><div className="decor decor-b" />
        </div>
      </div>
      <div className="hero-bottom container"><span>PLAN WITH PEOPLE, NOT PRESSURE</span><span className="hero-bottom-line" /><span>01 — 04</span></div>
    </section>
  );
}
