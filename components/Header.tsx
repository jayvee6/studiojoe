const NAV_LINKS = [
  { label: "Work",      href: "#work"      },
  { label: "Expertise", href: "#expertise" },
  { label: "Now",       href: "#now"       },
  { label: "Contact",   href: "#contact"   },
];

export default function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(10,10,10,0.88)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <a
          href="/"
          className="font-display font-bold text-base tracking-tight text-fg hover:text-amber transition-colors duration-200"
        >
          Studio Joe
        </a>

        <nav className="flex items-center gap-7">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="label hover:text-fg transition-colors duration-200"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
