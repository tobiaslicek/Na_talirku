import { useEffect, useState } from "react";

export type View = "dnes" | "jidla" | "doma" | "nakup";
const VIEWS: View[] = ["dnes", "jidla", "doma", "nakup"];

const read = (): View => {
  const h = location.hash.slice(1) as View;
  return VIEWS.includes(h) ? h : "dnes";
};

export function useView() {
  const [view, setView] = useState<View>(read);
  useEffect(() => {
    const on = () => setView(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return view;
}
