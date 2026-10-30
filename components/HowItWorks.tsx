import { ArrowUpRight, ClipboardList, MessagesSquare, PartyPopper, SlidersHorizontal } from "lucide-react";

const steps = [
  { number: "01", title: "Submit requirements", description: "Share your event type, budget, and preferences in just a few steps.", icon: ClipboardList },
  { number: "02", title: "Receive proposals", description: "Receive tailored quotes from professionals based on your requirements.", icon: MessagesSquare },
  { number: "03", title: "Compare & choose", description: "Compare options and choose the professionals that best fit your event.", icon: SlidersHorizontal },
  { number: "04", title: "Celebrate stress-free", description: "Focus on your event while your chosen professionals handle their responsibilities.", icon: PartyPopper },
];

export function HowItWorks() {
  return (
    <section className="section how-section" id="how-it-works">
      <div className="container">
        <div className="section-heading section-heading-row">
          <div><p className="eyebrow">A little less planning, a lot more living</p><h2>How it works</h2></div>
          <p className="section-intro">Finding the right professionals for your event should be simple.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <article className="step-card" key={number}>
              <div className="step-top"><span className="step-icon"><Icon size={20} strokeWidth={1.7} aria-hidden="true" /></span><span className="step-number">{number}</span></div>
              <h3>{title}</h3><p>{description}</p><span className="step-arrow" aria-hidden="true"><ArrowUpRight size={17} /></span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
