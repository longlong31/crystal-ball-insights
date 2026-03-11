import { AppHeader } from "@/components/layout/AppHeader";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <HeroSection />
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
