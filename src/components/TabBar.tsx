import type { ReactNode } from "react";
import type { View } from "../lib/route";

const TABS: { v: View; label: string; icon: ReactNode }[] = [
  { v: "dnes", label: "Dnes", icon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.2" /></> },
  { v: "jidla", label: "Jídla", icon: <><circle cx="7.5" cy="7.5" r="3.6" /><circle cx="16.5" cy="7.5" r="3.6" /><circle cx="7.5" cy="16.5" r="3.6" /><circle cx="16.5" cy="16.5" r="3.6" /></> },
  { v: "spiz", label: "Ve spíži", icon: <><rect x="7" y="3" width="10" height="3.2" rx="1" /><path d="M6.5 8.2h11V18a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3z" /><path d="M9.5 12.5h5" /></> },
  { v: "nakup", label: "Nákup", icon: <><path d="M3.8 9.5h16.4l-1.7 9.1a2 2 0 0 1-2 1.6H7.5a2 2 0 0 1-2-1.6z" /><path d="M8.5 9.5 11 4.2M15.5 9.5 13 4.2" /></> },
];

export function TabBar({ view, badge }: { view: View; badge: number }) {
  return (
    <nav className="tabbar" aria-label="Hlavní navigace">
      {TABS.map((t) => (
        <a key={t.v} className="tab" href={`#${t.v}`} aria-current={view === t.v ? "page" : undefined}>
          <span className="ico">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {t.icon}
            </svg>
            {t.v === "nakup" && badge > 0 && <span className="badge">{badge}</span>}
          </span>
          {t.label}
        </a>
      ))}
    </nav>
  );
}
