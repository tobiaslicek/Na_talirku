import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export const motionOK = () => typeof matchMedia === "function" && matchMedia(MOTION_OK).matches;

export function withMotion(setup: () => void) {
  const mm = gsap.matchMedia();
  mm.add(MOTION_OK, setup);
  return () => mm.revert();
}

export function revealPlates(items: HTMLElement[], opts: { x?: number; y?: number; scale?: number; rot: number; text: string }) {
  if (!items.length) return;
  const q = (sel: string) => items.map((i) => i.querySelector(sel)).filter(Boolean) as Element[];
  gsap.set(q(".dish"), { autoAlpha: 0, x: opts.x ?? 0, y: opts.y ?? 0, scale: opts.scale ?? 1 });
  gsap.set(q(".plate"), { rotation: opts.rot });
  gsap.set(q(opts.text), { autoAlpha: 0, y: 10 });
  ScrollTrigger.batch(items, {
    start: "top 92%",
    once: true,
    interval: 0.08,
    onEnter: (batch) => {
      const pick = (sel: string) => (batch as HTMLElement[]).map((i) => i.querySelector(sel)).filter(Boolean) as Element[];
      gsap.to(pick(".dish"), { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.8, ease: "power3.out", stagger: 0.08 });
      gsap.to(pick(".plate"), { rotation: 0, duration: 1.3, ease: "expo.out", stagger: 0.08 });
      gsap.to(pick(opts.text), { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, delay: 0.12 });
    },
  });
}

export function stitchIn(scope: HTMLElement, scrub: boolean) {
  scope.querySelectorAll<HTMLElement>(".stitch-wrap").forEach((el) => {
    const cover = el.querySelector(".stitch-cover");
    if (!cover) return;
    if (scrub) {
      gsap.fromTo(cover, { scaleX: 1 }, { scaleX: 0, ease: "none", scrollTrigger: { trigger: el, start: "top 96%", end: "top 55%", scrub: 0.4 } });
    } else {
      gsap.fromTo(cover, { scaleX: 1 }, { scaleX: 0, duration: 1.2, ease: "power2.inOut", delay: 0.12 });
    }
  });
}

export function pageIntro(scope: HTMLElement) {
  gsap.from(scope.querySelectorAll(".page-head > *"), { y: 22, autoAlpha: 0, duration: 0.75, ease: "power3.out", stagger: 0.07 });
  stitchIn(scope, false);
}
