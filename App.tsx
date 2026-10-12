import { lazy, Suspense, useCallback, useState } from "react";
import { Intro } from "./src/components/Intro";
import { Access } from "./src/features/access/Access";
import type { Vehicle } from "./src/types";
import "./src/apexpath-white-orange.css";
const Operations = lazy(() =>
  import("./src/features/operations/Operations").then((module) => ({
    default: module.Operations,
  })),
);
export default function App() {
  const [screen, setScreen] = useState<"intro" | "access" | "app">(() =>
    sessionStorage.getItem("apexpath:intro") ? "access" : "intro",
  );
  const [partners, setPartners] = useState<Vehicle[]>([]);
  const completeIntro = useCallback(() => {
    sessionStorage.setItem("apexpath:intro", "seen");
    setScreen("access");
  }, []);
  if (screen === "intro") return <Intro onComplete={completeIntro} />;
  if (screen === "app")
    return (
      <Suspense
        fallback={
          <main className="intro">
            <p className="form-note">Opening operations workspace…</p>
          </main>
        }
      >
        <Operations partners={partners} />
      </Suspense>
    );
  return (
    <Access
      onEnter={() => setScreen("app")}
      onRegister={(v) => setPartners((p) => [...p, v])}
    />
  );
}
