const YEAR = new Date().getFullYear();

const LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/joey-v-287ba5394",
  },
  {
    label: "GitHub",
    href: "https://github.com/jayvee6",
  },
];

export default function Footer() {
  return (
    <footer
      id="contact"
      className="px-6 py-10"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-display font-bold text-sm text-fg mb-1">
            Joey Villarreal
          </p>
          <p className="label">
            Senior Software Quality Engineer · © {YEAR}
          </p>
          <p className="label mt-1" style={{ color: "var(--fg-faint)" }}>
            10+ years · Mobile · Desktop · TV · Wearable · AR
          </p>
        </div>

        <nav className="flex items-center gap-6">
          {LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="label hover:text-fg transition-colors duration-200"
            >
              {label} ↗
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
