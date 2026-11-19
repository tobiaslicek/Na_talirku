import { describe, expect, it } from "vitest";
import { parsePantryText } from "./pantryText";
import type { KnownIngredient } from "./receipt";

const known: KnownIngredient[] = [
  { name: "vejce", zone: "lednice" },
  { name: "mléko", zone: "lednice" },
  { name: "máslo", zone: "lednice" },
  { name: "paprika", zone: "lednice" },
  { name: "okurka", zone: "lednice" },
  { name: "rýže", zone: "spiz" },
  { name: "cibule", zone: "spiz" },
  { name: "rajčata", zone: "lednice" },
  { name: "cherry rajčata", zone: "lednice" },
  { name: "rýžové nudle", zone: "spiz" },
  { name: "sójová omáčka", zone: "spiz" },
  { name: "řecký jogurt", zone: "lednice" },
  { name: "tortilly", zone: "spiz" },
];

const pick = (text: string) => Object.fromEntries(parsePantryText(text, known).map((i) => [i.name, i.state]));

describe("parsePantryText", () => {
  it("reads states from a typical sentence", () => {
    expect(pick("Máme vejce, mléko a rýži, dochází máslo, nemáme papriku ani okurku.")).toEqual({
      vejce: "mame", mléko: "mame", rýže: "mame", máslo: "dochazi", paprika: "doslo", okurka: "doslo",
    });
  });

  it("applies a trailing keyword to the item before it", () => {
    expect(pick("mléko došlo, tortilly skoro došly")).toEqual({ mléko: "doslo", tortilly: "dochazi" });
    expect(pick("máme vejce a mléko došlo")).toEqual({ vejce: "mame", mléko: "doslo" });
  });

  it("matches inflected and multi-word names", () => {
    expect(pick("máme rýžové nudle, cherry rajčata a sójovku, nemáme řecký jogurt")).toEqual({
      "rýžové nudle": "mame", "cherry rajčata": "mame", "sójová omáčka": "mame", "řecký jogurt": "doslo",
    });
    expect(pick("nemáme cibuli")).toEqual({ cibule: "doslo" });
  });

  it("adds unknown items in nominative with the zone that was mentioned", () => {
    const items = parsePantryText("v mrazáku máme hrášek, ve spíži máme cizrnu a kokosové mléko", known);
    expect(items.map((i) => [i.name, i.zone, i.known])).toEqual([
      ["hrášek", "mrazak", false],
      ["cizrna", "spiz", false],
      ["kokosové mléko", "spiz", false],
    ]);
  });

  it("ignores filler and amounts", () => {
    expect(pick("ještě máme 2 kila rýže a trochu másla")).toEqual({ rýže: "mame", máslo: "mame" });
  });
});
