import { describe, expect, it } from "vitest";
import { parseReceipt, type KnownIngredient } from "./receipt";

const known: KnownIngredient[] = [
  { name: "špagety", zone: "spiz" },
  { name: "cherry rajčata", zone: "lednice" },
  { name: "rajčata", zone: "lednice" },
  { name: "avokádo", zone: "lednice" },
  { name: "řecký jogurt", zone: "lednice" },
  { name: "rýžový olej", zone: "spiz" },
  { name: "olivový olej", zone: "spiz" },
  { name: "tortilly", zone: "spiz" },
  { name: "parmazán", zone: "lednice" },
  { name: "zakysaná smetana", zone: "lednice" },
];

const RECEIPT = `ALBERT Česká republika s.r.o.
DIČ: CZ44012373
ŠPAGETY BARILLA 500G      32,90 A
RAJČ.CHERRY 250G          39,90 A
2 x 24,90
AVOKÁDO HASS              49,80 A
JOGURT ŘECKÝ 2% 140G      18,90 A
OLEJ RÝŽOVÝ 1L            89,90 A
TORTILLA PŠENIČNÁ 6KS     34,90 A
PARMIGIANO REGG. 100G     59,90 A
ZAK.SMETANA 15% 200G      19,90 A
BANÁNY                    27,40 A
FÍKY SUŠENÉ 200G          69,90 A
OBALOVANÝ SÝR             54,90 A
TOFU NATURAL 180G         39,90 A
MRAŽ.ZELENINA ČÍNSKÁ      44,90 A
SLEVA                     -5,00
CELKEM                   477,40
PLATBA KARTOU            477,40
DPH 12%                   51,15`;

describe("parseReceipt", () => {
  const items = parseReceipt(RECEIPT, known);
  const names = items.map((i) => i.name);

  it("maps abbreviated receipt lines to known ingredients", () => {
    expect(names).toEqual(expect.arrayContaining(["špagety", "cherry rajčata", "avokádo", "řecký jogurt", "rýžový olej", "tortilly", "zakysaná smetana"]));
    expect(names).not.toContain("olivový olej");
    expect(names).not.toContain("rajčata");
  });

  it("keeps unknown food with a cleaned name and a guessed zone", () => {
    expect(items.find((i) => i.name === "banány")?.zone).toBe("spiz");
    expect(items.find((i) => i.name === "fíky sušené")?.zone).toBe("spiz");
    expect(items.find((i) => i.name === "obalovaný sýr")?.zone).toBe("lednice");
    expect(items.find((i) => i.name.startsWith("tofu"))?.zone).toBe("lednice");
    expect(items.find((i) => i.name.startsWith("mraž"))?.zone).toBe("mrazak");
  });

  it("skips totals, payments, tax and quantity lines", () => {
    expect(items.some((i) => /celkem|platba|dph|sleva|dič|albert/i.test(i.raw))).toBe(false);
    expect(items.some((i) => i.raw.startsWith("2 x"))).toBe(false);
  });
});
