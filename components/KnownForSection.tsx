const ITEMS = [
  {
    index: "01",
    title: "Leading high-visibility releases",
    description:
      "DRI on go/no-go decisions, driving launch readiness and aligning stakeholders on risk across engineering and program teams.",
  },
  {
    index: "02",
    title: "Coaching and leveling up teams",
    description:
      "Runbooks, best practices, and hands-on mentoring — including interns and new hires — that raise the quality bar across the whole team.",
  },
  {
    index: "03",
    title: "High-fidelity debugging artifacts",
    description:
      "Xcode/CLI diagnostics, proxy traffic inspection, and performance profiling that give engineering teams everything they need to fix fast.",
  },
  {
    index: "04",
    title: "Cross-functional unblocking",
    description:
      "Trusted partner across engineering, program management, and external developers — resolving escalations and keeping launches on track.",
  },
  {
    index: "05",
    title: "Self-serve workflows that scale",
    description:
      "Automation and tooling that reduce friction, eliminate repeat work, and improve operational consistency without adding headcount.",
  },
];

export default function KnownForSection() {
  return (
    <section
      id="known"
      className="px-6 py-24"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-14">
          <p className="label label-amber mb-3 flex items-center gap-2">
            <span style={{ color: "var(--amber)" }}>—</span>
            Where I move the needle
          </p>
          <h2
            className="font-display font-bold text-fg"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Known for
          </h2>
        </div>

        {/* Items — stacked list with index marks */}
        <div className="flex flex-col" style={{ gap: "0" }}>
          {ITEMS.map(({ index, title, description }, i) => (
            <div
              key={index}
              className="grid gap-6 py-7"
              style={{
                gridTemplateColumns: "3rem 1fr 2fr",
                borderTop: i === 0 ? "1px solid var(--border-hi)" : "1px solid var(--border)",
                borderBottom: i === ITEMS.length - 1 ? "1px solid var(--border-hi)" : undefined,
              }}
            >
              {/* Index */}
              <span className="label" style={{ color: "var(--fg-faint)", paddingTop: "2px" }}>
                {index}
              </span>

              {/* Title */}
              <h3
                className="font-display font-semibold text-fg"
                style={{ fontSize: "0.95rem" }}
              >
                {title}
              </h3>

              {/* Description */}
              <p className="text-muted leading-relaxed" style={{ fontSize: "0.8rem" }}>
                {description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
