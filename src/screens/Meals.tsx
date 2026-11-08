import { useRef, useState } from "react";
import { Chips } from "../components/Chips";
import { useSheets } from "../components/sheets";
import { Plate, Stitch } from "../plate/Plate";
import { HeartIcon } from "../components/VoteIcons";
import { ago, minutes, plural, tidy } from "../lib/format";
import { FILTER_OPTIONS } from "../lib/labels";
import { gsap, pageIntro, revealPlates, ScrollTrigger, useGSAP, withMotion } from "../lib/motion";
import { useStore } from "../lib/store";
import type { Tag } from "../lib/types";

export function Meals() {
  const store = useStore();
  const { openMeal, openEdit, openIdea } = useSheets();
  const root = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<Tag | "all">("all");
  const changed = useRef(false);

  const usedTags = new Set([...store.snap.meals, ...store.ideas].flatMap((m) => m.tags));
  const filterOptions = FILTER_OPTIONS.filter(([k]) => k === "all" || usedTags.has(k));
  const shown = filterOptions.some(([k]) => k === filter) ? filter : "all";
  const meals = store.snap.meals.filter((m) => shown === "all" || m.tags.includes(shown)).sort((a, b) => a.name.localeCompare(b.name, "cs"));
  const ideas = store.ideas
    .filter((i) => shown === "all" || i.tags.includes(shown))
    .map((i) => ({ i, ...store.ideaInfo(i) }))
    .sort((a, b) => Number(b.wanted) - Number(a.wanted) || b.taste - a.taste || a.i.name.localeCompare(b.i.name, "cs"));
  const c = meals.length;
  const word = plural(c, "jídlo", "jídla", "jídel");

  useGSAP(
    () =>
      withMotion(() => {
        pageIntro(root.current!);
        revealPlates(gsap.utils.toArray<HTMLElement>(".grid .m-card", root.current), { y: 30, scale: 0.92, rot: -80, text: ".m-text" });
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }),
    { scope: root },
  );

  useGSAP(
    () => {
      if (!changed.current) return;
      return withMotion(() => {
        const cards = gsap.utils.toArray<HTMLElement>(".grid .m-card", root.current);
        gsap.fromTo(cards.map((x) => x.querySelector(".dish")), { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out", stagger: 0.04 });
        gsap.fromTo(cards.map((x) => x.querySelector(".plate")), { rotation: -70 }, { rotation: 0, duration: 0.9, ease: "expo.out", stagger: 0.04 });
        gsap.set(cards.map((x) => x.querySelector(".m-text")), { autoAlpha: 1, y: 0 });
        ScrollTrigger.refresh();
      });
    },
    { scope: root, dependencies: [filter] },
  );

  return (
    <section ref={root}>
      <header className="page-head">
        <div className="page-head-row">
          <h1 className="title">Naše jídla</h1>
          <button className="btn primary" onClick={() => openEdit()}>
            Přidat jídlo
          </button>
        </div>
        <p className="sub">{shown === "all" ? `${c} ${word}, která děláme dokola` : `${c} ${word}`}</p>
      </header>
      <Stitch />
      <Chips
        className="filter"
        label="Filtr jídel"
        options={filterOptions}
        value={shown}
        onChange={(f) => {
          changed.current = true;
          setFilter(f);
        }}
      />
      {meals.length ? (
        <div className="grid">
          {meals.map((m) => (
            <button key={m.id} className="m-card" onClick={() => openMeal(m.id)}>
              <Plate meal={m} photoUrl={store.snap.photoUrls[m.id]} />
              <span className="m-text">
                <span className="m-name">{tidy(m.name)}</span>
                <span className="m-sub">{minutes(m.minutes)}</span>
                <span className="m-sub">naposled {ago(store.daysSinceCooked(m.id))}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="quiet">{store.snap.meals.length ? "S tímhle štítkem zatím nic nemáme." : "Katalog je prázdný. Přidej první jídlo."}</p>
      )}
      {ideas.length > 0 && (
        <section className="ideas">
          <div className="sec-head">
            <h2>Nápady na nová jídla</h2>
          </div>
          <p className="sub">Vybrané podle toho, co vaříte. V detailu dáte srdíčko, nebo palec dolů.</p>
          <div className="grid">
            {ideas.map(({ i, wanted }) => (
              <button key={i.id} className="m-card" onClick={() => openIdea(i.id)}>
                <Plate meal={{ id: i.id, name: i.name }} />
                <span className="m-text">
                  <span className="new-badge">
                    {wanted ? (
                      <>
                        <HeartIcon filled size={12} /> chcete zkusit
                      </>
                    ) : (
                      "nové"
                    )}
                  </span>
                  <span className="m-name">{tidy(i.name)}</span>
                  <span className="m-sub">{minutes(i.minutes)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
