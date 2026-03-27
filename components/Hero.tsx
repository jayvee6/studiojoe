export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-end pb-20 px-6">

      {/* Faint vertical grid lines */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px)",
          backgroundSize: "calc(100% / 6) 100%",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.3) 70%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl w-full">

        {/* Eyebrow */}
        <p className="label label-amber mb-6 flex items-center gap-2">
          <span style={{ color: "var(--amber)" }}>—</span>
          Senior Software Quality Engineer
        </p>

        {/* Display headline */}
        <h1
          className="font-display font-extrabold text-fg leading-none tracking-tight mb-8"
          style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}
        >
          Joey<br />Villarreal<span style={{ color: "var(--amber)" }}>.</span>
        </h1>

        {/* Divider */}
        <div
          className="mb-8"
          style={{ width: "3rem", height: "2px", background: "var(--amber)", opacity: 0.7 }}
        />

        {/* Bio */}
        <p
          className="text-muted max-w-lg leading-relaxed"
          style={{ fontSize: "0.875rem" }}
        >
          10+ years shipping high-visibility releases and protecting platform
          integrity across mobile, desktop, TV, wearable, and AR. I turn
          ambiguous issues into actionable evidence — fast.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-5 mt-10">
          <a
            href="https://www.linkedin.com/in/joey-v-287ba5394"
            target="_blank"
            rel="noopener noreferrer"
            className="label label-amber hover:opacity-80 transition-opacity flex items-center gap-1.5"
          >
            LinkedIn ↗
          </a>
          <span style={{ color: "var(--fg-faint)" }}>·</span>
          <a
            href="https://github.com/jayvee6"
            target="_blank"
            rel="noopener noreferrer"
            className="label hover:text-fg transition-colors flex items-center gap-1.5"
          >
            GitHub ↗
          </a>
        </div>

      </div>
    </section>
  );
}
