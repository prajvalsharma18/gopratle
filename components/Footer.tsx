import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main"><div><Link href="/#home" className="wordmark footer-wordmark">GoPratle<span>.</span></Link><p>Connecting event hosts with the right professionals.</p></div><nav aria-label="Footer navigation" className="footer-links"><Link href="/#home">Home</Link><Link href="/#how-it-works">How it works</Link><Link href="/#professionals">Professionals</Link></nav></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} GoPratle. All rights reserved.</span><span>MADE FOR MOMENTS THAT MATTER</span></div>
      </div>
    </footer>
  );
}
