import { ArrowUpRight, Music2, Sparkles, UsersRound } from "lucide-react";

const categories = [
  { title: "Event planners", description: "Organize your event with the right planning professionals.", icon: Sparkles, className: "category-planners", note: "THE VISIONARIES" },
  { title: "Performers", description: "Find singers, DJs, musicians, and other performers.", icon: Music2, className: "category-performers", note: "THE SPOTLIGHT" },
  { title: "Event crew", description: "Find the people and support needed to bring your event together.", icon: UsersRound, className: "category-crew", note: "THE MAKERS" },
];

export function ProfessionalCategories() {
  return (
    <section className="section categories-section" id="professionals">
      <div className="container">
        <div className="categories-heading">
          <div><p className="eyebrow">Good company for every occasion</p><h2>From planner to performer,<br /><span>find the right people.</span></h2></div>
          <p>Discover planners, performers, artists, and crew for celebrations, campaigns, concerts, corporate events, and more.</p>
        </div>
        <div className="category-grid">
          {categories.map(({ title, description, icon: Icon, className, note }, index) => (
            <article className={`category-card ${className}`} key={title}>
              <div className="category-card-top"><span className="category-index">0{index + 1} / 03</span><span className="category-arrow"><ArrowUpRight size={17} aria-hidden="true" /></span></div>
              <div className="category-art"><div className="category-art-ring ring-outer" /><div className="category-art-ring ring-inner" /><span className="category-icon"><Icon size={27} strokeWidth={1.6} aria-hidden="true" /></span></div>
              <div className="category-note">{note}</div>
              <h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
        <div className="curated-strip"><span className="curated-mark"><Sparkles size={19} aria-hidden="true" /></span><div><h3>Curated, not crowded.</h3><p>Browse professionals based on your style, budget, and event requirements.</p></div><span className="curated-aside">A BETTER WAY TO FIND YOUR PEOPLE</span></div>
      </div>
    </section>
  );
}
