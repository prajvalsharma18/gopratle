import { Quote } from "lucide-react";

export function Testimonials() {
  return (
    <section className="section testimonial-section" aria-labelledby="testimonial-title">
      <div className="container testimonial-inner">
        <div className="testimonial-heading"><p className="eyebrow">A good word travels</p><h2 id="testimonial-title">Don’t just take our word for it.<br /><span>Take theirs.</span></h2><p>What our customers say about their experience.</p></div>
        <figure className="quote-card"><span className="quote-icon"><Quote size={23} fill="currentColor" aria-hidden="true" /></span><blockquote>“The team executed our tech conference flawlessly. From AV setup to catering, everything was perfect. Our 500+ attendees were thoroughly impressed!”</blockquote></figure>
      </div>
    </section>
  );
}
