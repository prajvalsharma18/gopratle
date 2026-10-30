import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { Navbar } from "@/components/Navbar";
import { ProfessionalCategories } from "@/components/ProfessionalCategories";
import { Testimonials } from "@/components/Testimonials";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <ProfessionalCategories />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
