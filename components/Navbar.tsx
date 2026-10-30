import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";

const links = [
  { label: "Home", href: "#home" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Professionals", href: "#professionals" },
];

export function Navbar() {
  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Main navigation">
        <Link href="/#home" className="wordmark" aria-label="GoPratle home">GoPratle<span>.</span></Link>
        <div className="nav-links">
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </div>
        <Link href="/requirements/new" className="button button-primary nav-cta">
          Submit Requirements <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <details className="mobile-nav">
          <summary aria-label="Open navigation menu"><Menu size={22} aria-hidden="true" /></summary>
          <div className="mobile-nav-panel">
            {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
            <Link href="/requirements/new">Submit Requirements</Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
