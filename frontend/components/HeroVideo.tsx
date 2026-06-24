"use client";
import { useState } from "react";

const STEPS = [
  { icon: "🌐", label: "Webhook received", color: "#f59e0b", delay: 0 },
  { icon: "⚙️", label: "Processing trigger", color: "#6366f1", delay: 600 },
  { icon: "📧", label: "Sending email", color: "#10b981", delay: 1200 },
  { icon: "✅", label: "Action complete", color: "#10b981", delay: 1800 },
];

export const HeroVideo = () => {
  const [active, setActive] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  function runDemo() {
    if (running) return;
    setRunning(true);
    setActive(null);

    STEPS.forEach((step, i) => {
      setTimeout(() => {
        setActive(i);
        if (i === STEPS.length - 1) {
          setTimeout(() => {
            setActive(null);
            setRunning(false);
          }, 1200);
        }
      }, step.delay);
    });
  }

  return (
    <div className="flex justify-center px-4 py-8">
      <div className="w-full max-w-3xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        {/* terminal top bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-3 text-xs text-gray-400 font-mono">zap-runner — live execution</span>
        </div>

        {/* flow diagram */}
        <div className="p-8">
          <div className="flex flex-col gap-0 items-center">
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                {/* step card */}
                <div
                  className="flex items-center gap-4 w-full max-w-sm px-5 py-4 rounded-xl border transition-all duration-300"
                  style={{
                    borderColor: active === i ? step.color : "#374151",
                    backgroundColor: active === i ? `${step.color}18` : "#1f2937",
                    boxShadow: active === i ? `0 0 20px ${step.color}40` : "none",
                    transform: active === i ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 transition-all duration-300"
                    style={{ backgroundColor: active === i ? `${step.color}30` : "#374151" }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{step.label}</div>
                    <div className="text-gray-400 text-xs font-mono mt-0.5">
                      {active === i ? (
                        <span style={{ color: step.color }}>● running...</span>
                      ) : active !== null && active > i ? (
                        <span className="text-green-400">✓ done</span>
                      ) : (
                        <span>○ waiting</span>
                      )}
                    </div>
                  </div>
                  {/* pulse dot when active */}
                  {active === i && (
                    <div className="ml-auto">
                      <div
                        className="w-3 h-3 rounded-full animate-ping"
                        style={{ backgroundColor: step.color }}
                      />
                    </div>
                  )}
                </div>

                {/* connector */}
                {i < STEPS.length - 1 && (
                  <div className="flex flex-col items-center my-1">
                    <div
                      className="w-0.5 h-5 transition-all duration-300"
                      style={{
                        backgroundColor:
                          active !== null && active > i ? "#10b981" : "#374151",
                      }}
                    />
                    <svg width="10" height="6" viewBox="0 0 10 6">
                      <path
                        d="M5 6L0 0h10L5 6z"
                        fill={active !== null && active > i ? "#10b981" : "#374151"}
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* run button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={runDemo}
              disabled={running}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: running ? "#374151" : "#f59e0b",
                color: running ? "#9ca3af" : "#000",
                cursor: running ? "not-allowed" : "pointer",
              }}
            >
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <span>▶</span> Run demo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};