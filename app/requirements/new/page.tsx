import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequirementWizard } from "@/components/requirements/RequirementWizard";

export default function RequirementsPage() {
  return (
    <main className="requirement-page">
      <header className="requirement-header">
        <div className="requirement-header-inner">
          <Link href="/" className="wordmark" aria-label="GoPratle home">GoPratle<span>.</span></Link>
          <Link href="/" className="requirement-home-link"><ArrowLeft size={15} aria-hidden="true" /> Back to home</Link>
        </div>
      </header>
      <RequirementWizard />
    </main>
  );
}
