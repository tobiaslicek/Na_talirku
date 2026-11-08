import { useRef } from "react";
import { cookLabel, DayChips, useDay } from "../components/day";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { HeartIcon, ThumbDownIcon } from "../components/VoteIcons";
import { ideaById, type Idea } from "../data/ideas";
import { cap, minutes, tidy } from "../lib/format";
import { STATE_LABEL, TAG_LABEL } from "../lib/labels";
import { gsap, motionOK, useGSAP, withMotion } from "../lib/motion";
import { useStore } from "../lib/store";
import { Plate } from "../plate/Plate";
import { Alike } from "./Alike";
import { useIdeaActions } from "./useIdeaActions";

export function Recipe({ steps }: { steps: string[] }) {
  if (!steps.length) return null;
  return (
    <div className="recipe">
      <h3>Postup</h3>
      <ol>
        {steps.map((s, i) => (
          <li key={i}>{tidy(s)}</li>
        ))}
      </ol>
    </div>
  );
}

export function IdeaDetail({ id }: { id: string }) {
  const store = useStore();
  const toast = useToast();
  const { close } = useSheets();
  const { cookIdea } = useIdeaActions();
  const [day] = useDay();
  const root = useRef<HTMLDivElement>(null);
  const heart = useRef<HTMLSpanElement>(null);
  const idea: Idea | undefined = ideaById.get(id);

  useGSAP(
    () =>
      withMotion(() => {
        gsap.from(".dish.big .plate", { rotation: -140, duration: 1.1, ease: "expo.out", delay: 0.04 });
        gsap.from(".vote", { autoAlpha: 0, duration: 0.4, ease: "power2.out", stagger: 0.08, delay: 0.25 });
        gsap.from(".vote-ico", { scale: 0.6, duration: 0.6, ease: "back.out(2)", stagger: 0.08, delay: 0.25 });
      }),
    { scope: root, dependencies: [id] },
  );

  if (!idea) return <p className="quiet">Tenhle nápad už v knihovně není.</p>;

  const own = store.adoptedMeal(idea);
  const wanted = store.isWanted(idea.id);
  const used = own ? store.historyOf(own.id).length + (store.plannedOn(own.id) ? 1 : 0) : 0;
  const okToDrop = () => !used || confirm(`Odebrat „${idea.name}“ z vašich jídel? Smaže se i historie a plán.`);

  const pop = () => {
    const el = heart.current;
    if (!el || !motionOK()) return;
    gsap.fromTo(el.querySelector("svg"), { scale: 0.5 }, { scale: 1, duration: 0.55, ease: "back.out(3)" });
    gsap.fromTo(el.querySelector(".ring"), { scale: 0.8, autoAlpha: 0.7 }, { scale: 1.8, autoAlpha: 0, duration: 0.6, ease: "power2.out" });
  };

  const toggleFav = async () => {
    if (own) {
      if (!okToDrop()) return;
      await store.deleteMeal(own.id);
      toast("Jídlo už mezi vašimi není.");
      return;
    }
    pop();
    await store.adoptIdea(idea, null);
    toast("Jídlo je mezi vašimi. Pod popisem máte podobná.");
  };

  const reject = async () => {
    if (own && !okToDrop()) return;
    close();
    if (own) await store.deleteMeal(own.id);
    await store.voteIdea(idea.id, "ne");
    toast("Dobře, tohle už nenabídnu.");
  };

  return (
    <div ref={root}>
      <div className="verdict">
        <button className="vote no" onClick={reject} aria-label="Tohle nechceme">
          <span className="vote-ico">
            <ThumbDownIcon />
          </span>
          nechceme
        </button>
        <Plate meal={{ id: idea.id, name: idea.name }} size="big" />
        <button className="vote fav" onClick={toggleFav} data-on={!!own || undefined} aria-label={own ? "V oblíbených, odebrat" : "Přidat do oblíbených"}>
          <span className="vote-ico" ref={heart}>
            <span className="ring" />
            <HeartIcon filled={!!own} size={28} />
          </span>
          {own ? tidy("v oblíbených") : "do oblíbených"}
        </button>
      </div>
      <p className="new-badge">{own ? "mezi vašimi jídly" : wanted ? "chcete zkusit" : "nové jídlo"}</p>
      <h2 className="sheet-title" id="sheet-title">
        {tidy(idea.name)}
      </h2>
      <p className="meta">{minutes(idea.minutes)}</p>
      <p className="about">{tidy(idea.about)}</p>
      {idea.tags.length > 0 && (
        <div className="tags">
          {idea.tags.map((t) => (
            <span key={t} className="tag-pill">
              {TAG_LABEL[t]}
            </span>
          ))}
        </div>
      )}
      {own && <Alike target={idea} title="Podobná jídla" />}
      <ul className="ing">
        {idea.ingredients.map((name) => {
          const st = store.stateOf(name) ?? "doslo";
          return (
            <li key={name} data-s={st}>
              <span className="dot" />
              {cap(name)}
              <span className="st">{st === "doslo" ? "nemáme" : STATE_LABEL[st]}</span>
            </li>
          );
        })}
      </ul>
      <Recipe steps={idea.steps} />
      <div className="sheet-day">
        <span className="pref-label" id="l-idea-day">
          Na kdy
        </span>
        <DayChips labelledBy="l-idea-day" />
      </div>
      <div className="sheet-actions">
        <button className="btn primary" onClick={() => cookIdea(idea, day)}>
          {cookLabel(day)}
        </button>
      </div>
    </div>
  );
}
