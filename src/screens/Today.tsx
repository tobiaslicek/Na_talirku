import { useRef, useState } from "react";
import { Chips } from "../components/Chips";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { HeroPlate, Plate, Stitch } from "../plate/Plate";
import { ago, list, minutes, tidy, todayLabel } from "../lib/format";
import { MOOD_OPTIONS, TIME_OPTIONS } from "../lib/labels";
import { gsap, motionOK, revealPlates, ScrollTrigger, SplitText, stitchIn, useGSAP, withMotion, wordsUp } from "../lib/motion";
import { scrollToEl } from "../lib/smooth";
import { recommend, type Prefs } from "../lib/recommend";
import { useStore } from "../lib/store";
import type { Meal } from "../lib/types";
import { useCookAction } from "./useCook";
import { ShareIcon } from "../components/ShareIcon";
import { useShareMeal } from "./useShare";

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
  const share = useShareMeal();
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
        <div className="s-actions">
          <button className="btn primary" onClick={() => cook(meal.id)}>
            Tohle uvaříme
          </button>
          <button className="btn ghost icon" onClick={() => share(meal.id)} aria-label={`Poslat ${meal.name} ve zprávě`}>
            <ShareIcon />
          </button>
        </div>
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
      window.setTimeout(() => suggestRef.current && scrollToEl(suggestRef.current, -24), delay);
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
        let intro: gsap.core.Timeline | null = null;
        if (!introPlayed) {
          const vine = el.querySelector<SVGPathElement>(".hero-spin .vine");
          const L = vine?.getTotalLength() ?? 0;
          intro = gsap.timeline({ defaults: { ease: "power3.out" }, onStart: () => void (introPlayed = true) });
          intro
            .from(".eyebrow > *", { y: 12, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, 0)
            .from(".stage", { autoAlpha: 0, scale: 0.9, duration: 1.1 }, 0.15)
            .from(".hero-spin", { rotation: -200, duration: 1.9, ease: "expo.out" }, 0.15)
            .from(".hero-spin .motif", { autoAlpha: 0, y: -5, scale: 0.6, transformOrigin: "50% 50%", duration: 0.45, stagger: 0.04 }, 0.55)
            .from(".caption", { rotation: -90, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0.7)
            .from(".advise-wrap", { scale: 0.7, autoAlpha: 0, duration: 0.8, ease: "back.out(1.6)" }, 1)
            .from(".wreath .lf", { scale: 0.2, autoAlpha: 0, transformOrigin: "0% 50%", duration: 0.55, stagger: { each: 0.022, from: "center" } }, 0.8)
            .from(".wreath .fl", { scale: 0.2, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(1.8)", stagger: { each: 0.035, from: "center" } }, 0.95)
            .from(".prefs .pref", { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, 1.1);
          if (vine) intro.fromTo(vine, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, 0.4);
        }

        SplitText.create(".dl", {
          type: "words,chars",
          aria: "none",
          autoSplit: true,
          onSplit: (self) => {
            if (intro && intro.progress() < 1) {
              gsap.from(self.words, { yPercent: 115, rotation: 6, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.09, delay: Math.max(0, 0.1 - intro.time()) });
            }
            const rand = gsap.utils.random;
            return gsap
              .timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "+=70%", pin: true, scrub: 0.7 } })
              .to(self.chars, { yPercent: () => rand(-320, -140), xPercent: () => rand(-60, 60), rotation: () => rand(-40, 40), autoAlpha: 0, ease: "power2.in", stagger: { each: 0.025, from: "random" } }, 0)
              .to(".eyebrow", { y: -24, autoAlpha: 0, ease: "none" }, 0)
              .fromTo(".caption", { rotation: 0, scale: 1, autoAlpha: 1 }, { rotation: -120, scale: 1.12, autoAlpha: 0, ease: "power1.in", immediateRender: false }, 0)
              .to(".hero-turn", { rotation: 140, ease: "none" }, 0)
              .to(".wreath", { yPercent: -4, scale: 1.04, ease: "none" }, 0)
              .to(".hero-scroll", { scale: 0.82, ease: "power1.inOut" }, 0)
              .to(".stage", { yPercent: 24, ease: "power1.inOut" }, 0);
          },
        });

        gsap.utils.toArray<HTMLElement>(".split-on-scroll", el).forEach((h) => wordsUp(h, { scroll: true }));
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
        <p className="eyebrow">
          <span>{todayLabel()}</span>
          <span>{store.snap.household.name}</span>
        </p>
        <h1 className="sr-only">Co si dnes dáme?</h1>
        <p className="dl dl-1" aria-hidden="true">
          Co si dnes
        </p>
        <HeroPlate>
          <div className="advise-wrap">
            <button className="advise" onClick={() => advise(true)}>
              Poraď mi
            </button>
          </div>
        </HeroPlate>
        <p className="dl dl-2" aria-hidden="true">
          dáme?
        </p>
      </header>

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
          <h2 className="split-on-scroll">Dlouho jsme neměli</h2>
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
          <h2 className="split-on-scroll">Dochází</h2>
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
