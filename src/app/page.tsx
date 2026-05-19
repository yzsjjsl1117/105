import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BrandStory from "@/components/BrandStory";
import CraftProcess from "@/components/CraftProcess";
import ProductShowcase from "@/components/ProductShowcase";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <BrandStory />
      <CraftProcess />
      <ProductShowcase />
      <Footer />
    </>
  );
}
