import React from 'react';
import Navbar from '../../components/landing/Navbar';
import HeroSection from '../../components/landing/HeroSection';
import FeaturesGrid from '../../components/landing/FeaturesGrid';
import SolutionsSection from '../../components/landing/SolutionsSection';
import ReviewsSection from '../../components/landing/ReviewsSection';
import PricingSection from '../../components/landing/PricingSection';
import FaqSection from '../../components/landing/FaqSection';
import Footer from '../../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesGrid />
        <SolutionsSection />
        <ReviewsSection />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
