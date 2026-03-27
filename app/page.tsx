import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WorkSection from "@/components/WorkSection";
import KnownForSection from "@/components/KnownForSection";
import ExpertiseSection from "@/components/ExpertiseSection";
import NowSection from "@/components/NowSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-14">
        <Hero />
        <WorkSection />
        <KnownForSection />
        <ExpertiseSection />
        <NowSection />
      </main>
      <Footer />
    </>
  );
}
