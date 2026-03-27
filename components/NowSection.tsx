const NOW_ITEMS = [
  {
    tag: "Automation",
    title: "Python & PyTest depth",
    description:
      "Expanding automation coverage, improving test architecture, and building reusable fixtures for faster regression cycles.",
  },
  {
    tag: "Certification",
    title: "ISTQB Foundation (CTFL)",
    description:
      "Formalizing test methodology knowledge with ISTQB certification to complement 10+ years of hands-on expertise.",
  },
  {
    tag: "AI tooling",
    title: "Local LLM & Claude integration",
    description:
      "Exploring AI-accelerated debugging, test design, and workflow automation — including building Claude Code skills.",
  },
];

export default function NowSection() {
  return (
    <section
      id="now"
      className="px-6 py-24"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p className="label label-amber mb-3 flex items-center gap-2">
              <span style={{ color: "var(--amber)" }}>—</span>
              What I&apos;m building toward
            </p>
            <h2
              className="font-display font-bold text-fg"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Now
            </h2>
          </div>
          <p className="label" style={{ color: "var(--fg-faint)", maxWidth: "22rem" }}>
            Current focus areas as of {new Date().getFullYear()}
          </p>
        </div>

        {/* Items — horizontal list on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {NOW_ITEMS.map(({ tag, title, description }, i) => (
            <div
              key={title}
              className="p-6"
              style={{
                border: "1px solid var(--border-hi)",
                background: "var(--surface)",
                borderRadius: "2px",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="label label-amber">{tag}</span>
                <span className="label" style={{ color: "var(--fg-faint)" }}>
                  0{i + 1}
                </span>
              </div>
              <h3
                className="font-display font-semibold text-fg mb-3"
                style={{ fontSize: "1rem" }}
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
