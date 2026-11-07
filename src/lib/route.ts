import { useEffect, useState } from "react";

export type View = "dnes" | "jidla" | "spiz" | "nakup";
const VIEWS: View[] = ["dnes", "jidla", "spiz", "nakup"];

export interface Route {
  view: View;
  param: string | null;
}

const read = (): Route => {
  const [v, param] = location.hash.slice(1).split("/") as [View, string | undefined];
  if (VIEWS.includes(v)) return { view: v, param: param || null };
  if ((v as string) === "doma") return { view: "spiz", param: null };
  return { view: "dnes", param: null };
};

export function useRoute() {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const on = () => setRoute(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

export const linkTo = (view: View, param?: string) => `${location.origin}${location.pathname}#${view}${param ? `/${param}` : ""}`;
