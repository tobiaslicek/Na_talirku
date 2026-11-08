import { useRef } from "react";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { ideaById, type Idea } from "../data/ideas";
import { cap, minutes, tidy } from "../lib/format";
import { STATE_LABEL, TAG_LABEL } from "../lib/labels";
import { gsap, useGSAP, withMotion } from "../lib/motion";
import { useStore } from "../lib/store";
import { Plate } from "../plate/Plate";
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
  const { cookIdea, keepIdea } = useIdeaActions();
  const root = useRef<HTMLDivElement>(null);
  const idea: Idea | undefined = ideaById.get(id);

  useGSAP(
    () =>
      withMotion(() => {
        gsap.from(".dish.big .plate", { rotation: -140, duration: 1.1, ease: "expo.out", delay: 0.04 });
      }),
    { scope: root, dependencies: [id] },
  );

  if (!idea) return <p className="quiet">Tenhle nápad už v knihovně není.</p>;

  const hide = async () => {
    close();
    await store.hideIdea(idea.id);
    toast("Dobře, tohle už nenabídnu.");
  };

  return (
    <div ref={root}>
      <Plate meal={{ id: idea.id, name: idea.name }} size="big" />
      <p className="new-badge">nové jídlo</p>
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
      <div className="sheet-actions">
        <button className="btn primary" onClick={() => cookIdea(idea)}>
          Tohle uvaříme
        </button>
        <button className="btn ghost" onClick={() => keepIdea(idea)}>
          Přidat do našich jídel
        </button>
      </div>
      <div className="sheet-foot">
        <button className="link danger" onClick={hide}>
          Tohle nechceme
        </button>
      </div>
    </div>
  );
}
