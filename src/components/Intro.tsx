import { useEffect } from "react";
import { Brand } from "./Brand";
export function Intro({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(
      onComplete,
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 2900,
    );
    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <main className="intro">
      <Brand />
      <div className="intro-scene">
        <span className="eyebrow">EVERY JOURNEY STARTS WITH A CONNECTION</span>
        <svg
          viewBox="0 0 760 260"
          role="img"
          aria-label="Parcels loading from a warehouse into a departing truck"
        >
          <defs>
            <pattern
              id="lines"
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 0V12" stroke="#33445b" />
            </pattern>
          </defs>
          <path d="M30 220H730" stroke="#33445b" strokeWidth="2" />
          <path
            d="M80 210V65L220 25l140 40v145"
            fill="#182538"
            stroke="#425671"
            strokeWidth="2"
          />
          <path d="M80 65h280M220 25v40" fill="none" stroke="#425671" />
          <rect
            x="120"
            y="100"
            width="170"
            height="110"
            rx="3"
            fill="url(#lines)"
            stroke="#425671"
          />
          <text
            x="220"
            y="86"
            textAnchor="middle"
            fill="#8fa5bf"
            fontSize="12"
            letterSpacing="4"
          >
            APEXPATH HUB
          </text>
          <rect x="133" y="170" width="30" height="30" fill="#9c7949" />
          {[0, 1, 2].map((i) => (
            <g key={i} className={`parcel parcel-${i}`}>
              <rect
                x="185"
                y="180"
                width="25"
                height="25"
                rx="2"
                fill="#e6b779"
              />
              <path d="M197 180v10" stroke="#8e6433" />
            </g>
          ))}
          <g className="intro-truck">
            <rect
              x="360"
              y="115"
              width="165"
              height="90"
              rx="5"
              fill="#263d5a"
              stroke="#70b9ef"
              strokeWidth="2"
            />
            <path d="M525 144h49l30 33v28h-79z" fill="#4b96d5" />
            <path d="M536 153h30l21 25h-51z" fill="#132538" />
            <path d="M367 196h229" stroke="#98c6e9" />
            <circle
              cx="397"
              cy="210"
              r="17"
              fill="#101722"
              stroke="#50617a"
              strokeWidth="4"
            />
            <circle
              cx="566"
              cy="210"
              r="17"
              fill="#101722"
              stroke="#50617a"
              strokeWidth="4"
            />
            <circle cx="397" cy="210" r="6" fill="#91a5bb" />
            <circle cx="566" cy="210" r="6" fill="#91a5bb" />
            <text
              x="443"
              y="164"
              textAnchor="middle"
              fill="#cce5fa"
              fontSize="14"
              fontWeight="700"
              letterSpacing="2"
            >
              APEXPATH
            </text>
          </g>
        </svg>
        <h1>
          Moving together.
          <br />
          <span>Delivering further.</span>
        </h1>
        <div className="loading-track">
          <span />
        </div>
        <p>Preparing your operations workspace</p>
      </div>
      <button className="quiet intro-skip" onClick={onComplete}>
        Skip intro →
      </button>
    </main>
  );
}
