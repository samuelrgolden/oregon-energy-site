import Nav from "./components/Nav";
import Hero from "./components/Hero";
import GridIntro from "./components/GridIntro";
import Trends from "./components/Trends";
import Cliff from "./components/Cliff";
import Catch from "./components/Catch";
import Books from "./components/Books";
import Today from "./components/Today";
import Footer from "./components/Footer";
import ToTop from "./components/ToTop";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <div className="rule mx-auto max-w-[1440px]" />
        <GridIntro />
        <Trends />
        <Cliff />
        <Catch />
        <Books />
        <Today />
      </main>
      <Footer />
      <ToTop />
    </>
  );
}
