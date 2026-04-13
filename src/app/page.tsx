import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { ProblemSection } from '@/components/landing/problem-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { RoadmapSection } from '@/components/landing/roadmap-section'
import { CtaSection } from '@/components/landing/cta-section'
import { LandingFooter } from '@/components/landing/landing-footer'

export const metadata: Metadata = {
  title: 'CTB — The Uncensored Crypto Community',
  description:
    'The free-speech alternative to X/Twitter for crypto discussion. No shadow bans, no algorithmic censorship — just community-owned crypto conversation.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <RoadmapSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
