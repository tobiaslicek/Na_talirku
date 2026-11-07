import { useRef, useState } from "react";
import { Chips } from "../components/Chips";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { HeroPlate, Plate, Stitch } from "../plate/Plate";
import { ago, list, minutes, tidy, todayLabel } from "../lib/format";
import { MOOD_OPTIONS, TIME_OPTIONS } from "../lib/labels";
import { gsap, motionOK, revealPlates, ScrollTrigger, stitchIn, useGSAP, withMotion } from "../lib/motion";
import { recommend, type Prefs } from "../lib/recommend";
import { useStore } from "../lib/store";
import type { Meal } from "../lib/types";
import { useCookAction } from "./useCook";

const PREFS_KEY = "talirek-prefs";
let introPlayed = false;

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
    if (p && typeof p.time === "number" && typeof p.mood === "string") return p;
  } catch {
    /* empty */
  }
  return { time: 999, mood: "any" };
}

function SuggestCard({ meal }: { meal: Meal }) {
  const store = useStore();
  const { openMeal } = useSheets();
  const cook = useCookAction();
  const miss = store.missingOf(meal.id);
  return (
    <article className="s-card">
      <button className="dish-btn" onClick={() => openMeal(meal.id)} aria-label={`Detail: ${meal.name}`}>
        <Plate meal={meal} photoUrl={store.snap.photoUrls[meal.id]} />
      </button>
      <div className="s-body">
        <h3 className="s-name">{tidy(meal.name)}</h3>
        <p className="s-meta">
          {minutes(meal.minutes)}, naposled {ago(store.daysSinceCooked(meal.id))}
        </p>
        <p className="need">
          {miss.length ? (
            <>
              <span className="need-label">Dokoupit:</span> {list(miss.map((i) => i.name))}
            </>
          ) : (
            <span className="ok">Všechno máme doma</span>
          )}
        </p>
        <button className="btn primary" onClick={() => cook(meal.id)}>
          Tohle uvaříme
        </button>
      </div>
    </article>
  );
}

export function Today() {
  const store = useStore();
  const { openMeal } = useSheets();
  const toast = useToast();
  const root = useRef<HTMLElement>(null);
  const suggestRef = useRef<HTMLElement>(null);
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [picks, setPicks] = useState<string[] | null>(null);
  const spinNext = useRef(false);
  const [round, setRound] = useState(0);

  const facts = (m: Meal) => ({ coverage: store.coverageOf(m.id), daysSince: store.daysSinceCooked(m.id) });

  const advise = (withSpin: boolean, nextPrefs = prefs) => {
    const next = recommend(store.snap.meals, facts, nextPrefs, picks ?? []).map((m) => m.id);
    const first = picks === null;
    setPicks(next);
    setRound((r) => r + 1);
    spinNext.current = withSpin;
    const delay = withSpin && motionOK() ? 600 : 0;
    if (withSpin || first) {
      window.setTimeout(() => suggestRef.current?.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto", block: "start" }), delay);
    }
  };

  const setPref = (p: Prefs) => {
    setPrefs(p);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch {
      /* empty */
    }
    if (picks !== null) advise(false, p);
  };

  useGSAP(
    () =>
      withMotion(() => {
        const el = root.current!;
        if (!introPlayed) {
          const vine = el.querySelector<SVGPathElement>(".hero-spin .vine");
          const L = vine?.getTotalLength() ?? 0;
          const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onStart: () => void (introPlayed = true) });
          tl.from(".hero .date, .hero .display", { y: 28, autoAlpha: 0, duration: 0.9, stagger: 0.08 })
            .from(".stage", { autoAlpha: 0, scale: 0.94, duration: 1 }, 0.1)
            .from(".hero-spin", { rotation: -160, duration: 1.7, ease: "expo.out" }, 0.1)
            .from(".hero-spin .motif", { autoAlpha: 0, y: -5, scale: 0.6, transformOrigin: "50% 50%", duration: 0.45, stagger: 0.045 }, 0.45)
            .from(".advise-wrap", { scale: 0.82, autoAlpha: 0, duration: 0.7, ease: "back.out(1.5)" }, 0.95)
            .from(".prefs .pref", { y: 14, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, 0.7);
          if (vine) tl.fromTo(vine, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 0.3);
          gsap.from(".wreath .lf", { scale: 0.2, autoAlpha: 0, transformOrigin: "0% 50%", duration: 0.55, ease: "power3.out", stagger: { each: 0.025, from: "center" }, delay: 0.7 });
          gsap.from(".wreath .fl", { scale: 0.2, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(1.8)", stagger: { each: 0.04, from: "center" }, delay: 0.85 });
        }
        const st = { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 };
        gsap.to(".hero-scroll", { yPercent: -6, scale: 0.9, ease: "none", scrollTrigger: st });
        gsap.to(".hero-turn", { rotation: 80, ease: "none", scrollTrigger: { ...st } });
        stitchIn(el, true);
        revealPlates(gsap.utils.toArray<HTMLElement>(".forgotten .f-row", el), { x: -28, rot: -170, text: ".f-text" });
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }),
    { scope: root },
  );

  useGSAP(
    () => {
      if (!round) return;
      const spin = spinNext.current;
      return withMotion(() => {
        if (spin) {
          gsap.to(".hero-spin", { rotation: "+=360", duration: 1.05, ease: "power3.inOut" });
          gsap.fromTo(".advise-wrap", { scale: 1 }, { scale: 0.9, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out" });
        }
        const cards = gsap.utils.toArray<HTMLElement>(".suggest .s-card", root.current);
        const delay = spin ? 0.7 : 0.05;
        const q = (s: string) => cards.map((c) => c.querySelector(s));
        gsap.from(q(".dish"), { autoAlpha: 0, x: -50, scale: 0.9, duration: 0.9, ease: "power3.out", stagger: 0.12, delay });
        gsap.from(q(".plate"), { rotation: -220, duration: 1.4, ease: "expo.out", stagger: 0.12, delay });
        gsap.from(q(".s-body"), { autoAlpha: 0, y: 14, duration: 0.6, ease: "power3.out", stagger: 0.1, delay: delay + 0.2 });
        ScrollTrigger.refresh();
      });
    },
    { scope: root, dependencies: [round] },
  );

  const shown = (picks ?? []).map(store.mealById).filter(Boolean) as Meal[];
  const forgotten = store.snap.meals
    .map((m) => ({ m, d: store.daysSinceCooked(m.id) }))
    .filter((x) => x.d === null || x.d >= 21)
    .sort((a, b) => (b.d ?? Infinity) - (a.d ?? Infinity))
    .slice(0, 6);
  const low = store.snap.ingredients.filter((i) => i.tracked && i.state === "dochazi");

  const addLow = async () => {
    const added = await store.addLowToShop();
    toast(added.length ? `Do nákupu přibylo: ${list(added)}.` : "Všechno už v nákupu je.");
  };

  return (
    <section ref={root}>
      <header className="hero">
        <div className="hero-copy">
          <p className="date">{todayLabel()}</p>
          <h1 className="display">Co si dnes dáme?</h1>
        </div>
        <HeroPlate>
          <div className="advise-wrap">
            <button className="advise" onClick={() => advise(true)}>
              Poraď mi
            </button>
          </div>
        </HeroPlate>
        <div className="prefs">
          <div className="pref">
            <span className="pref-label" id="l-time">
              Kolik máme času
            </span>
            <Chips options={TIME_OPTIONS} value={prefs.time} labelledBy="l-time" onChange={(time) => setPref({ ...prefs, time })} />
          </div>
          <div className="pref">
            <span className="pref-label" id="l-mood">
              Na co je chuť
            </span>
            <Chips options={MOOD_OPTIONS} value={prefs.mood} labelledBy="l-mood" onChange={(mood) => setPref({ ...prefs, mood })} />
          </div>
        </div>
      </header>

      <Stitch />

      <section ref={suggestRef} className="suggest" hidden={picks === null} aria-live="polite">
        <div className="sec-head">
          <h2>Tohle by dnes šlo</h2>
          <button className="link" onClick={() => advise(false)}>
            Jiné tři
          </button>
        </div>
        <div className="suggest-track">
          {shown.length ? shown.map((m) => <SuggestCard key={`${round}-${m.id}`} meal={m} />) : <p className="quiet">Na tohle teď nic nemáme. Zkus jiný čas nebo chuť.</p>}
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Dlouho jsme neměli</h2>
        </div>
        <div className="forgotten">
          {forgotten.length ? (
            forgotten.map(({ m, d }) => (
              <button key={m.id} className="f-row" onClick={() => openMeal(m.id)}>
                <Plate meal={m} photoUrl={store.snap.photoUrls[m.id]} size="sm" />
                <span className="f-text">
                  <span className="f-name">{tidy(m.name)}</span>
                  <span className="f-when">Naposled {ago(d)}</span>
                </span>
              </button>
            ))
          ) : (
            <p className="quiet">Všechno jste měli v posledních třech týdnech.</p>
          )}
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Dochází</h2>
        </div>
        {low.length ? (
          <>
            <div className="low-box">
              {low.map((i) => (
                <span key={i.id} className="item static" data-s="dochazi">
                  <span className="dot" />
                  <span className="label">{i.name}</span>
                </span>
              ))}
            </div>
            <button className="btn ghost" onClick={addLow}>
              Přidat do nákupu
            </button>
          </>
        ) : (
          <p className="quiet">Nic nedochází.</p>
        )}
      </section>
    </section>
  );
}
