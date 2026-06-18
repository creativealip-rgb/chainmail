import { Link } from "react-router-dom";
import { Button } from "@ui/ui";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Architecture } from "@/components/landing/Architecture";
import { CallToAction } from "@/components/landing/CallToAction";
import { TopNav } from "@/components/landing/TopNav";

import { Footer } from "@/components/landing/Footer";
import styles from "./LandingPage.module.css";

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <TopNav />
      <main>
        <Hero />
        <Features />
        <Architecture />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
