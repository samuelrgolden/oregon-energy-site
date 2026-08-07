import { ProgressRail } from "./lib/scroll";
import ThesisNav from "./components/thesis/ThesisNav";
import HeroScene from "./components/thesis/HeroScene";
import Finding1 from "./components/thesis/Finding1";
import Finding2 from "./components/thesis/Finding2";
import Finding3 from "./components/thesis/Finding3";
import MethodsStrip from "./components/thesis/MethodsStrip";
import ThesisFooter from "./components/thesis/ThesisFooter";

const SECTIONS = [
  { id: "top", label: "Oregon is warming" },
  { id: "finding-1", label: "A grid that heats" },
  { id: "finding-2", label: "Turn up the temperature" },
  { id: "finding-3", label: "Why: the days migrate" },
  { id: "methods", label: "How I did it" },
];

export default function ThesisApp() {
  return (
    <ProgressRail sections={SECTIONS}>
      <ThesisNav />
      <main>
        <HeroScene />
        <Finding1 />
        <Finding2 />
        <Finding3 />
        <MethodsStrip />
      </main>
      <ThesisFooter />
    </ProgressRail>
  );
}
