import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  open: boolean;
  contentKey?: string;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, labelledBy, contentKey, children }: Props) {
  const sheet = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const [content, setContent] = useState<ReactNode>(children);
  const drag = useRef<{ y0: number; t0: number; dy: number } | null>(null);

  useEffect(() => {
    if (open) setContent(children);
  }, [open, children]);

  useEffect(() => {
    if (body.current) body.current.scrollTop = 0;
  }, [contentKey]);

  useEffect(() => {
    const el = sheet.current!;
    if (open) {
      lastFocus.current = document.activeElement;
      document.documentElement.classList.add("lock");
      if (body.current) body.current.scrollTop = 0;
      requestAnimationFrame(() => closeBtn.current?.focus({ preventScroll: true }));
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
    el.style.transform = "";
    document.documentElement.classList.remove("lock");
    const f = lastFocus.current as HTMLElement | null;
    if (f && document.contains(f)) f.focus({ preventScroll: true });
  }, [open, onClose]);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { y0: e.clientY, t0: performance.now(), dy: 0 };
    sheet.current!.style.transition = "none";
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    d.dy = Math.max(0, e.clientY - d.y0);
    sheet.current!.style.transform = `translate(-50%,${d.dy}px)`;
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const v = d.dy / Math.max(1, performance.now() - d.t0);
    sheet.current!.style.transition = "";
    if (d.dy > 110 || v > 0.6) onClose();
    else sheet.current!.style.transform = "";
  };

  return (
    <>
      <div className={open ? "scrim open" : "scrim"} onClick={onClose} />
      <div ref={sheet} className={open ? "sheet open" : "sheet"} role="dialog" aria-modal="true" aria-labelledby={labelledBy} inert={!open}>
        <div className="sheet-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <span />
        </div>
        <button ref={closeBtn} className="sheet-close" aria-label="Zavřít" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
        <div ref={body} className="sheet-body">
          {open ? children : content}
        </div>
      </div>
    </>
  );
}
