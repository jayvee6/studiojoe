const SKILLS = [
  {
    title: "Risk-based testing",
    description:
      "Deep defect reproduction and high-signal diagnostics that turn ambiguous issues into actionable evidence engineering teams can fix fast.",
  },
  {
    title: "Multi-platform coverage",
    description:
      "iPhone, Mac, Apple TV, Watch, and Vision Pro — quality validation across the full Apple platform stack.",
  },
  {
    title: "Trust & Safety",
    description:
      "Policy enforcement, technical investigations, and privacy/network compliance — where quality meets integrity.",
  },
  {
    title: "Performance & graphics",
    description:
      "Xcode Instruments, GPU frame capture, and CLI profiling to catch regressions before they reach users.",
  },
  {
    title: "Tooling & automation",
    description:
      "Python, PyTest, and custom workflows that cut cycle time, improve log capture, and scale QA teams.",
  },
  {
    title: "Escalation & incident response",
    description:
      "Cross-functional partner to engineering, program teams, and external developers — unblocking launches under pressure.",
  },
];

export default function ExpertiseSection() {
  return (
    <section
      id="expertise"
      className="px-6 py-24"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-14">
          <p className="label label-amber mb-3 flex items-center gap-2">
            <span style={{ color: "var(--amber)" }}>—</span>
            Full-spectrum quality engineering
          </p>
          <h2
            className="font-display font-bold text-fg"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Expertise
          </h2>
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ background: "var(--border)" }}
        >
          {SKILLS.map(({ title, description }) => (
            <div
              key={title}
              className="p-7"
              style={{ background: "var(--bg)" }}
            >
              <div
                className="mb-4"
                style={{ width: "1.5rem", height: "1px", background: "var(--amber)", opacity: 0.7 }}
              />
              <h3
                className="font-display font-semibold text-fg mb-3"
                style={{ fontSize: "0.95rem" }}
              >
                {title}
              </h3>
              <p className="text-muted leading-relaxed" style={{ fontSize: "0.75rem" }}>
                {description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
