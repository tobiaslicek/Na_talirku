import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, motionOK, ScrollTrigger } from "./motion";

let lenis: Lenis | null = null;

export function scrollToEl(el: Element, offset = 0) {
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset, duration: 1.1 });
  else el.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto", block: "start" });
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function useSmoothScroll() {
  useEffect(() => {
    if (!motionOK()) return;
    const instance = new Lenis({ autoRaf: false, prevent: (node) => node.closest?.(".sheet, .chips, .suggest-track") !== null });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // bottom sheet zamyká scroll přes třídu na <html>; Lenis by jinak scrolloval stránku pod ním
    const lock = new MutationObserver(() => (document.documentElement.classList.contains("lock") ? instance.stop() : instance.start()));
    lock.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      lock.disconnect();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      lenis = null;
    };
  }, []);
}
