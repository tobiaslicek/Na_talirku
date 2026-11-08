import { useRef } from "react";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { CrossIcon, HeartIcon } from "../components/VoteIcons";
import type { Idea } from "../data/ideas";
import { minutes, tidy } from "../lib/format";
import { gsap, motionOK, useGSAP, withMotion } from "../lib/motion";
import { useStore } from "../lib/store";
import { Plate } from "../plate/Plate";
import type { Tag } from "../lib/types";

interface Props {
  target: { id?: string; ingredients: string[]; tags: Tag[] };
  title: string;
}

export function Alike({ target, title }: Props) {
  const store = useStore();
  const toast = useToast();
  const { openIdea } = useSheets();
  const root = useRef<HTMLElement>(null);
  const items = store.similarIdeas(target, 6);

  useGSAP(
    () =>
      withMotion(() => {
        const cards = gsap.utils.toArray<HTMLElement>(".a-card", root.current);
        gsap.from(cards, { autoAlpha: 0, x: 36, duration: 0.6, ease: "power3.out", stagger: 0.06 });
        gsap.from(cards.map((c) => c.querySelector(".plate")), { rotation: -120, duration: 1.1, ease: "expo.out", stagger: 0.06 });
      }),
    { scope: root },
  );

  if (!items.length) return null;

  const want = async (idea: Idea) => {
    const on = store.isWanted(idea.id);
    await store.voteIdea(idea.id, on ? null : "chceme");
    toast(on ? "Dobře, už ho nebudu upřednostňovat." : "Příště ho navrhnu.");
  };

  const drop = (idea: Idea, card: HTMLElement | null) => {
    let sent = false;
    const done = () => {
      if (sent) return;
      sent = true;
      store.voteIdea(idea.id, "ne");
      toast("Dobře, tohle už nenabídnu.");
    };
    if (!card || !motionOK()) return done();
    gsap.to(card, { autoAlpha: 0, scale: 0.86, duration: 0.22, ease: "power2.in", onComplete: done });
    window.setTimeout(done, 320);
  };

  return (
    <section ref={root} className="alike" aria-labelledby="alike-title">
      <h3 id="alike-title">{title}</h3>
      <p className="hint">Srdíčkem je přidáte do návrhů, křížkem je skryjete.</p>
      <div className="alike-track">
        {items.map((idea) => {
          const on = store.isWanted(idea.id);
          return (
            <article key={idea.id} className="a-card">
              <button className="dish-btn" onClick={() => openIdea(idea.id)} aria-label={`Recept: ${idea.name}`}>
                <Plate meal={{ id: idea.id, name: idea.name }} />
              </button>
              <p className="a-name">{tidy(idea.name)}</p>
              <p className="a-meta">{minutes(idea.minutes)}</p>
              <div className="a-actions">
                <button className="vote-sm" onClick={(e) => drop(idea, e.currentTarget.closest("article"))} aria-label={`Nenabízet ${idea.name}`}>
                  <CrossIcon />
                </button>
                <button className="vote-sm fav" aria-pressed={on} onClick={() => want(idea)} aria-label={on ? `Už nenavrhovat ${idea.name}` : `Navrhnout ${idea.name} příště`}>
                  <HeartIcon filled={on} size={20} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
