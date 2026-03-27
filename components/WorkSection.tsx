const PROJECTS = [
  {
    index: "01",
    title: "Claude Code QA Skills",
    tag: "Agentic · Python",
    description:
      "Custom Claude Code skills that automate end-to-end QA workflows — from test planning to artifact capture — triggered by a single prompt.",
  },
  {
    index: "02",
    title: "Intelligent Log Triage",
    tag: "LLM · Diagnostics",
    description:
      "Crash logs, proxy traffic, and diagnostic artifacts fed to local and hosted models for instant signal extraction and failure classification.",
  },
  {
    index: "03",
    title: "Agentic Defect Reproduction",
    tag: "Agents · Automation",
    description:
      "Agents that autonomously reproduce, diagnose, and document bugs — producing high-fidelity reproduction steps and artifacts without manual intervention.",
  },
  {
    index: "04",
    title: "AI Test Generation",
    tag: "LLM · PyTest",
    description:
      "Converting bug reports, tickets, and specs into structured test cases using LLMs — covering edge cases a human reviewer would miss under time pressure.",
  },
  {
    index: "05",
    title: "Visual QA Agents",
    tag: "Vision · Regression",
    description:
      "Vision-capable agents that inspect screenshots and UI renders for regressions, rendering artifacts, and visual defects — no manual eyeballing required.",
  },
  {
    index: "06",
    title: "Localization QA Agents",
    tag: "Agents · i18n",
    description:
      "Agents that validate localized builds — catching string truncation, layout breaks, and translation errors across locales at scale.",
  },
  {
    index: "07",
    title: "Debugging Agents",
    tag: "Agents · Diagnostics",
    description:
      "Agents that ingest stack traces, logs, and system state to isolate root causes, suggest fixes, and generate structured bug reports ready for engineering.",
  },
];

/* Robot emoji depth layer — mirrors the parallax flourish from the original site */
const ROBOTS = [
  { size: 96,  top: "12%", left: "5%",   opacity: 0.13 },
  { size: 140, top: "55%", left: "18%",  opacity: 0.09 },
  { size: 72,  top: "30%", left: "72%",  opacity: 0.16 },
  { size: 180, top: "70%", left: "82%",  opacity: 0.07 },
  { size: 56,  top: "85%", left: "45%",  opacity: 0.18 },
  { size: 110, top: "20%", left: "90%",  opacity: 0.11 },
  { size: 64,  top: "48%", left: "55%",  opacity: 0.14 },
];

export default function WorkSection() {
  return (
    <section
      id="work"
      className="relative px-6 py-24 overflow-hidden"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      {/* Robot emoji parallax background */}
      {ROBOTS.map(({ size, top, left, opacity }, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            fontSize: size,
            top,
            left,
            opacity,
            lineHeight: 1,
            filter: `blur(${Math.round((1 - opacity) * 6)}px)`,
            transform: "translateZ(0)",
          }}
        >
          🤖
        </span>
      ))}

      <div className="relative mx-auto max-w-6xl">

        {/* Section header */}
        <div className="flex items-baseline justify-between mb-14">
          <div>
            <p className="label label-amber mb-3 flex items-center gap-2">
              <span style={{ color: "var(--amber)" }}>—</span>
              Agentic QA
            </p>
            <h2
              className="font-display font-bold text-fg"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Work
            </h2>
          </div>
          <p className="label hidden sm:block" style={{ maxWidth: "22rem", textAlign: "right" }}>
            The next QA stack runs on agents
          </p>
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROJECTS.map(({ index, title, tag, description }) => (
            <div
              key={index}
              className="group relative flex flex-col justify-between p-6"
              style={{
                border: "1px solid var(--border-hi)",
                background: "rgba(17,17,17,0.85)",
                backdropFilter: "blur(8px)",
                minHeight: "220px",
                borderRadius: "2px",
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <span className="label" style={{ color: "var(--fg-faint)" }}>— {index}</span>
                <span className="label label-amber">{tag}</span>
              </div>

              {/* Title + description */}
              <div>
                <h3
                  className="font-display font-semibold text-fg mb-2"
                  style={{ fontSize: "1rem" }}
                >
                  {title}
                </h3>
                <p className="text-muted leading-relaxed" style={{ fontSize: "0.75rem" }}>
                  {description}
                </p>
              </div>

              {/* Amber corner */}
              <div
                aria-hidden="true"
                className="absolute bottom-0 right-0 w-4 h-4"
                style={{
                  borderTop: "1px solid var(--amber)",
                  borderLeft: "1px solid var(--amber)",
                  opacity: 0.25,
                  transform: "rotate(180deg)",
                }}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
