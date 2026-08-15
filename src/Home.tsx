import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Rain from "../components/Rain";


// ─── App ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#16120D" }}
    >
      {/* warm ambient light from above */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180, 110, 40, 0.12) 0%, transparent 65%)",
          zIndex: 0,
        }}
      />
      {/* warm glow behind content */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "35%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(160, 90, 30, 0.08) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      <Rain />

      {/* content */}
      <div
        className="relative flex flex-col items-center text-center px-6 gap-8"
        style={{ zIndex: 2 }}
      >
        {/* ambient status */}
        <div
          className="flex items-center gap-2 text-xs tracking-widest uppercase"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "#7A6A54",
            letterSpacing: "0.18em",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#C8924A", boxShadow: "0 0 6px #C8924A" }}
          />
          Rainy evening · quiet hours
        </div>

        {/* title */}
        <h1
          className="text-7xl sm:text-8xl font-medium leading-none tracking-tight"
          style={{
            fontFamily: "'Lora', serif",
            color: "#F0E8DA",
            textShadow: "0 2px 40px rgba(200, 146, 74, 0.18)",
          }}
        >
          FocusFlow
        </h1>

        {/* tagline */}
        <p
          className="text-lg sm:text-xl font-light max-w-sm leading-relaxed"
          style={{
            fontFamily: "'Lora', serif",
            fontStyle: "italic",
            color: "#7A6A54",
          }}
        >
          Find your rhythm. Protect your time.
          <br />
          Do the work that matters.
        </p>

        {/* cta */}
        <button
          onClick={() => navigate("/dash")}
          className="mt-2 flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-medium transition-all duration-200 hover:brightness-110 active:scale-95"
          style={{
            background: "#C8924A",
            color: "#16120D",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.02em",
            boxShadow: "0 0 32px rgba(200, 146, 74, 0.25)",
          }}
        >
          Start Your First Session
          <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
