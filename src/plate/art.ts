type Rng = () => number;
type Pt = [number, number];

export const PB = "#23398E";
export const PG = "#8197D3";

const n1 = (v: number) => v.toFixed(1);
const rad = (d: number) => (d * Math.PI) / 180;
export const pol = (a: number, r: number, cx = 100, cy = 100): Pt => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];

export function rng(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smooth(pts: Pt[]) {
  const m = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const s = m(pts[pts.length - 1], pts[0]);
  let d = `M${n1(s[0])} ${n1(s[1])}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = m(p, pts[(i + 1) % pts.length]);
    d += `Q${n1(p[0])} ${n1(p[1])} ${n1(q[0])} ${n1(q[1])}`;
  }
  return d + "Z";
}

function blob(cx: number, cy: number, R: number, r: Rng, amp = 0.08, n = 18) {
  const a = r() * 6.28, b = r() * 6.28, c = r() * 6.28;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const k = R * (1 + amp * (0.6 * Math.sin(3 * t + a) + 0.4 * Math.sin(5 * t + b) + 0.25 * Math.sin(7 * t + c)));
    pts.push([cx + k * Math.cos(t), cy + k * Math.sin(t)]);
  }
  return smooth(pts);
}

function inDisc(r: Rng, cx: number, cy: number, R: number): Pt {
  const a = r() * Math.PI * 2, k = Math.sqrt(r()) * R;
  return [cx + k * Math.cos(a), cy + k * Math.sin(a)];
}

function dots(r: Rng, n: number, cx: number, cy: number, R: number, colors: string[], rmin: number, rmax: number, op = 1) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const [x, y] = inDisc(r, cx, cy, R);
    s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${(rmin + r() * (rmax - rmin)).toFixed(2)}" fill="${colors[i % colors.length]}"${op < 1 ? ` opacity="${op}"` : ""}/>`;
  }
  return s;
}

function strokes(r: Rng, n: number, cx: number, cy: number, R: number, len: number, colors: string[], w: number) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const [x, y] = inDisc(r, cx, cy, R);
    const [qx, qy] = pol(r() * 360, len, x, y);
    s += `<path d="M${n1(x)} ${n1(y)}L${n1(qx)} ${n1(qy)}" stroke="${colors[i % colors.length]}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  return s;
}

function squares(r: Rng, n: number, cx: number, cy: number, R: number, size: number, fill: string, stroke: string) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const [x, y] = inDisc(r, cx, cy, R);
    s += `<rect x="${n1(x - size / 2)}" y="${n1(y - size / 2)}" width="${size}" height="${size}" rx="${(size * 0.24).toFixed(1)}" transform="rotate(${(r() * 90).toFixed(0)} ${n1(x)} ${n1(y)})" fill="${fill}" stroke="${stroke}" stroke-width=".4"/>`;
  }
  return s;
}

export const SCALLOP = (() => {
  const pts: Pt[] = [];
  for (let i = 0; i < 208; i++) {
    const t = (i / 208) * 360;
    pts.push(pol(t, 97.5 + 0.8 * Math.cos(rad(t) * 26)));
  }
  return smooth(pts);
})();

export function rimMarkup() {
  const vine: Pt[] = [];
  for (let i = 0; i < 128; i++) {
    const t = (i / 128) * 360;
    vine.push(pol(t, 83 + 2.3 * Math.sin(rad(t) * 16)));
  }
  let s = `<circle cx="100" cy="100" r="71.6" fill="none" stroke="${PB}" stroke-width="1.1"/><circle cx="100" cy="100" r="67.9" fill="none" stroke="${PB}" stroke-width=".45"/><circle cx="100" cy="100" r="69.8" fill="none" stroke="${PB}" stroke-width="1.05" stroke-linecap="round" stroke-dasharray="0 3.655"/>`;
  s += `<path class="vine" d="${smooth(vine)}" fill="none" stroke="${PB}" stroke-width=".7"/>`;
  const pome = `<path d="M-6.6 .8C-6.6-4-3.6-6.6 0-6.6S6.6-4 6.6 .8 3.6 7 0 7-6.6 5.6-6.6 .8Z" fill="${PG}" fill-opacity=".5" stroke="${PB}" stroke-width=".8"/><path d="M-3-5.6C-4.7-1.2-4.6 3-2.4 6.6M3-5.6C4.7-1.2 4.6 3 2.4 6.6M0-6.6V7" fill="none" stroke="${PB}" stroke-width=".5"/><path d="M-2.8-6.1-1.7-9.2 0-7.1 1.7-9.2 2.8-6.1Z" fill="${PB}"/><path d="M-7 3.2C-9.6 1.6-11.8-.6-13.6-3.6-10.4-3.2-8.2-1.2-7 3.2Z" fill="${PB}"/><path d="M7 3.2C9.6 1.6 11.8-.6 13.6-3.6 10.4-3.2 8.2-1.2 7 3.2Z" fill="${PB}"/>`;
  let petals = "";
  for (let i = 0; i < 5; i++) {
    const [x, y] = pol(i * 72 - 90, 2.4, 0, 0);
    petals += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.45" fill="${PB}"/>`;
  }
  const flower = `${petals}<circle r="1" fill="${PG}"/><path d="M-6.2 4.8-4.1 3.6-2.1 4.9-4.2 6.1Z" fill="${PB}"/><path d="M6.2 4.8 4.1 3.6 2.1 4.9 4.2 6.1Z" fill="${PB}"/><circle cx="0" cy="6.4" r=".7" fill="${PB}"/>`;
  for (let k = 0; k < 8; k++) {
    s += `<g transform="rotate(${k * 45} 100 100)"><g class="motif"><g transform="translate(100 16.6)">${pome}</g></g></g>`;
    s += `<g transform="rotate(${k * 45 + 22.5} 100 100)"><g class="motif"><g transform="translate(100 18.2)">${flower}</g></g></g>`;
  }
  return s;
}

const FL: Record<string, string> = {
  rose:
    [0, 1, 2, 3, 4, 5].map((i) => { const [x, y] = pol(i * 60 - 90, 3.5, 0, 0); return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.5" fill="#EC97AB"/>`; }).join("") +
    `<circle r="3.9" fill="#DB6A86"/><circle r="2" fill="#C24A6A"/><path d="M-1.6-2.6a3 3 0 0 1 3.4.2" fill="none" stroke="#F6C3CF" stroke-width=".7" stroke-linecap="round"/>`,
  red:
    [0, 1, 2, 3, 4].map((i) => { const [x, y] = pol(i * 72 - 90, 3.4, 0, 0); return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.2" fill="#C8262E"/>`; }).join("") +
    `<circle r="1.9" fill="#2A1A1E"/><circle r=".8" fill="#F2C14E"/>`,
  daisy:
    Array.from({ length: 10 }, (_, i) => `<ellipse cy="-3.9" rx="1.25" ry="3.1" fill="#FFFFFF" stroke="#D6CCBE" stroke-width=".5" transform="rotate(${i * 36})"/>`).join("") +
    `<circle r="2.1" fill="#F2B93B"/>`,
  corn: (() => {
    const p: string[] = [];
    for (let i = 0; i < 16; i++) {
      const [x, y] = pol(i * 22.5 - 90, i % 2 ? 2.6 : 6, 0, 0);
      p.push(x.toFixed(2) + " " + y.toFixed(2));
    }
    return `<path d="M${p.join("L")}Z" fill="#4E6FC9"/><circle r="1.6" fill="#2C3E86"/>`;
  })(),
  yellow:
    [0, 1, 2, 3, 4, 5].map((i) => { const [x, y] = pol(i * 60, 2.7, 0, 0); return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="2.3" fill="#F2C14E"/>`; }).join("") +
    `<circle r="1.4" fill="#D9862B"/>`,
};

export function wreathMarkup() {
  const r = rng("venecek");
  const types = ["daisy", "red", "rose", "corn", "yellow", "rose", "red", "daisy", "rose", "corn", "red", "rose", "yellow", "red", "daisy"];
  const n = types.length, a0 = 198, a1 = 342;
  let leaves = "", baby = "", fl = "";
  for (let i = 0; i < n + 5; i++) {
    const a = a0 - 8 + ((a1 - a0 + 16) * i) / (n + 4);
    const [x, y] = pol(a, 82.5 + (r() - 0.5) * 4);
    const rot = a + 90 + (i % 2 ? 35 : -35) + (r() - 0.5) * 20;
    leaves += `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${rot.toFixed(0)})"><path class="lf" d="M0 0C3-3.2 9-3.4 12.5 0 9 3.4 3 3.2 0 0Z" fill="${i % 3 ? "#5E8A45" : "#44703A"}"/></g>`;
  }
  for (let i = 0; i < 20; i++) {
    const [x, y] = pol(a0 + r() * (a1 - a0), 86 + r() * 7);
    baby += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${(0.6 + r() * 0.5).toFixed(2)}" class="bb"/>`;
  }
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), a = a0 + (a1 - a0) * t;
    const [x, y] = pol(a, 82 + (i % 2 ? 3 : -2.5) + (r() - 0.5) * 2);
    const sc = (0.82 + r() * 0.25) * (1 + 0.28 * (1 - Math.abs(t - 0.5) * 2));
    fl += `<g transform="translate(${n1(x)} ${n1(y)}) scale(${sc.toFixed(2)}) rotate(${(r() * 360).toFixed(0)})"><g class="fl">${FL[types[i]]}</g></g>`;
  }
  return `<g>${leaves}</g><g>${baby}</g>${fl}`;
}

interface DishSpec {
  sauce?: [string, string];
  sauceR?: number;
  soup?: [string, string];
  top?: [string, string];
  lentils?: boolean;
  side?: keyof typeof SIDE;
  nest?: [number, number, number];
  protein?: keyof typeof PROT;
  meat?: [string, string];
  garnish?: [keyof typeof GAR, number, number][];
}

const SIDE = {
  knedlik: (r: Rng) => {
    let s = "";
    [142, 168, 194, 220].forEach((a) => {
      const [x, y] = pol(a, 33), rot = a + 90 + (r() - 0.5) * 12;
      let p = "";
      for (let i = 0; i < 7; i++) p += `<circle cx="${n1((r() - 0.5) * 19)}" cy="${n1((r() - 0.5) * 10)}" r="${(0.45 + r() * 0.5).toFixed(2)}" fill="#D7C59B"/>`;
      s += `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${rot.toFixed(0)})"><rect x="-12.5" y="-8.2" width="25" height="16.4" rx="7.2" fill="#F3EAD2" stroke="#D3C196" stroke-width=".7"/>${p}</g>`;
    });
    return s;
  },
  brambory: (r: Rng) => {
    let s = "";
    [132, 160, 188, 216, 244].forEach((a) => {
      const [x, y] = pol(a, 31);
      s += `<path d="${blob(x, y, 8, r, 0.14, 12)}" fill="url(#gPot)" stroke="#C49A3C" stroke-width=".5"/><ellipse cx="${n1(x - 2.2)}" cy="${n1(y - 2.6)}" rx="2.6" ry="1.4" fill="#FFF5D0" opacity=".55"/>`;
    });
    return s;
  },
  testoviny: (r: Rng, D: DishSpec) => {
    const [cx, cy, R] = D.nest || [100, 100, 30];
    const col = ["#E9C463", "#DDB04E", "#F0D17C"];
    let s = "";
    for (let i = 0; i < 26; i++) {
      const p = [0, 1, 2, 3].map(() => inDisc(r, cx, cy, R).map(n1).join(" "));
      s += `<path d="M${p[0]}C${p[1]} ${p[2]} ${p[3]}" fill="none" stroke="${col[i % 3]}" stroke-width="3" stroke-linecap="round"/>`;
    }
    return s;
  },
  hranolky: (r: Rng) => {
    let s = "";
    for (let i = 0; i < 12; i++) {
      const x = 62 + r() * 32, y = 72 + r() * 56;
      s += `<rect x="${n1(x - 1.9)}" y="${n1(y - 9)}" width="3.8" height="18" rx="1.4" transform="rotate(${((r() - 0.5) * 120).toFixed(0)} ${n1(x)} ${n1(y)})" fill="#EBBE55" stroke="#C7952F" stroke-width=".45"/>`;
    }
    return s;
  },
  salat: (r: Rng) =>
    `<path d="${blob(80, 100, 25, r, 0.1, 16)}" fill="#EEDFA8" stroke="#DCC983" stroke-width=".5"/>` +
    squares(r, 16, 80, 100, 20, 3.8, "#F7EDC6", "#DCC88C") +
    dots(r, 8, 80, 100, 19, ["#E7883A"], 1, 1.5) +
    dots(r, 7, 80, 100, 19, ["#7D9C44"], 1, 1.4),
  bramborak: (r: Rng) => {
    let s = "";
    ([[84, 80], [78, 118], [118, 98]] as Pt[]).forEach(([x, y]) => {
      s += `<path d="${blob(x, y, 18, r, 0.12, 16)}" fill="url(#gBram)" stroke="#A4652A" stroke-width=".6"/>` + dots(r, 16, x, y, 14, ["#8A5220", "#9B6128"], 0.4, 0.9, 0.75) + dots(r, 6, x, y, 12, ["#EAC07A"], 0.4, 0.8, 0.9);
    });
    return s;
  },
  buchticky: () => {
    let s = `<g transform="rotate(-8 100 100)">`;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const x = 100 + (i - 1) * 12.6, y = 100 + (j - 1) * 12.6;
        s += `<rect x="${n1(x - 6)}" y="${n1(y - 6)}" width="12" height="12" rx="3.8" fill="#DFAA5B" stroke="#BF8A3C" stroke-width=".5"/><rect x="${n1(x - 4.4)}" y="${n1(y - 4.6)}" width="8.8" height="6" rx="3" fill="#EBC47F"/>`;
      }
    return s + "</g>";
  },
  ovocne: (r: Rng) => {
    let s = "";
    ([[84, 86], [116, 86], [84, 116], [116, 116]] as Pt[]).forEach(([x, y]) => {
      x += (r() - 0.5) * 3;
      y += (r() - 0.5) * 3;
      const [bx, by] = pol(r() * 360, 8, x, y);
      s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="12.6" fill="#F8F4EA" stroke="#E3DAC3" stroke-width=".8"/><path d="${blob(bx, by, 3.2, r, 0.2, 8)}" fill="#4B3A72" opacity=".85"/><ellipse cx="${n1(x - 4)}" cy="${n1(y - 4.5)}" rx="3.4" ry="2" fill="#FFFFFF" opacity=".7"/>`;
    });
    return s;
  },
};

const PROT = {
  maso: (r: Rng, D: DishSpec) => {
    const [c, e] = D.meat!;
    let s = "";
    [-36, -4, 28].forEach((a) => {
      const [x, y] = pol(a, 25);
      s += `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${(a + 90 + (r() - 0.5) * 16).toFixed(0)})"><rect x="-13.5" y="-7.4" width="27" height="14.8" rx="3.6" fill="${c}" stroke="${e}" stroke-opacity=".55" stroke-width=".6"/><path d="M-9-2C-4-3.4 3-.6 9.5-2.4M-8 3.2C-2 2 4 4 8.5 2.6" fill="none" stroke="#FFFFFF" stroke-opacity=".2" stroke-width=".7"/></g>`;
    });
    return s;
  },
  cubes: (r: Rng, D: DishSpec) => squares(r, 7, 118, 98, 15, 9.2, D.meat![0], D.meat![1]),
  rizek: (r: Rng) => `<path d="${blob(114, 97, 25, r, 0.15, 16)}" fill="url(#gGold)" stroke="#B7762A" stroke-width=".7"/>` + dots(r, 46, 114, 97, 21, ["#B86F24", "#EDC570", "#C98535"], 0.35, 0.8, 0.9),
  kure: (r: Rng, _D: DishSpec, key: string) => {
    let s = "";
    [-34, 4, 42].forEach((a) => {
      const [x, y] = pol(a, 24);
      s += `<path d="${blob(x, y, 10, r, 0.16, 12)}" fill="#D99E68" stroke="#B57843" stroke-width=".6"/>`;
    });
    return s + `<path d="${blob(118, 100, 16, r, 0.2, 14)}" fill="url(#s-${key})" opacity=".6"/>`;
  },
  vejce2: () =>
    ([[123, 86], [125, 114]] as Pt[])
      .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="7.6" fill="#FCFBF6" stroke="#E7E1D2" stroke-width=".6"/><circle cx="${x + 0.6}" cy="${y}" r="4.6" fill="#F1B43B"/><circle cx="${x - 0.6}" cy="${y - 1.3}" r="1.3" fill="#F8D688"/>`)
      .join(""),
  volske: (r: Rng) => `<path d="${blob(120, 96, 15.5, r, 0.16, 16)}" fill="#FDFCF8" stroke="#ECE7DA" stroke-width=".6"/><circle cx="121" cy="95" r="6" fill="url(#gYolk)"/><circle cx="119.4" cy="93.2" r="1.6" fill="#FBE0A0"/>`,
  syrsmazeny: (r: Rng) =>
    `<g transform="rotate(-18 116 100)"><rect x="100" y="88.5" width="32" height="23" rx="6.5" fill="url(#gGold)" stroke="#B7762A" stroke-width=".7"/></g>` +
    dots(r, 30, 116, 100, 12, ["#B86F24", "#EDC570"], 0.35, 0.75, 0.9) +
    `<path d="${blob(101, 109, 3.4, r, 0.2, 8)}" fill="#F5DD86"/>`,
};

const GAR = {
  smetana: (r: Rng, x: number, y: number) => `<path d="${blob(x, y, 7.2, r, 0.14, 14)}" fill="#FCF9F1" stroke="#E9E1CE" stroke-width=".5"/><path d="M${n1(x - 3.2)} ${n1(y + 0.6)}c.4-2.6 4.6-3 5.4-.4.6 2-2 3.2-3.2 2" fill="none" stroke="#E6DDC8" stroke-width=".7" stroke-linecap="round"/>`,
  brusinky: (r: Rng, x: number, y: number) => {
    let s = `<path d="${blob(x, y, 7.4, r, 0.12, 14)}" fill="#FBF5EA"/>`;
    for (let i = 0; i < 7; i++) {
      const [px, py] = inDisc(r, x, y, 4.6);
      s += `<circle cx="${n1(px)}" cy="${n1(py)}" r="2.2" fill="#A2212E"/><circle cx="${n1(px - 0.7)}" cy="${n1(py - 0.7)}" r=".6" fill="#E3767C"/>`;
    }
    return s;
  },
  citron: (_r: Rng, x: number, y: number) => {
    let s = `<circle cx="${x}" cy="${y}" r="6.6" fill="#F6DC5E" stroke="#E2B12B" stroke-width="1.3"/>`;
    for (let i = 0; i < 8; i++) {
      const [a, b] = pol(i * 45, 5.2, x, y);
      s += `<path d="M${x} ${y}L${n1(a)} ${n1(b)}" stroke="#FCF1BD" stroke-width=".6"/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r=".9" fill="#FCF1BD"/>`;
  },
  petrzel: (r: Rng, x: number, y: number) => {
    let s = "";
    for (let i = 0; i < 11; i++) {
      const [px, py] = inDisc(r, x, y, 26);
      s += `<ellipse cx="${n1(px)}" cy="${n1(py)}" rx="1.5" ry=".9" transform="rotate(${(r() * 180).toFixed(0)} ${n1(px)} ${n1(py)})" fill="${i % 2 ? "#5A8C3A" : "#7DAA55"}"/>`;
    }
    return s;
  },
  kopr: (r: Rng, x: number, y: number) => strokes(r, 16, x, y, 28, 3.4, ["#6A9844", "#7FAE57"], 0.7),
  okurka: (_r: Rng, x: number, y: number) =>
    ([[x, y], [x + 10, y - 5]] as Pt[]).map(([a, b]) => `<circle cx="${a}" cy="${b}" r="5.6" fill="#AFC86E" stroke="#4E7A2C" stroke-width="1.3"/><circle cx="${a}" cy="${b}" r="2.4" fill="#D9E6AE"/>`).join(""),
  cibulka: (_r: Rng, x: number, y: number) =>
    ([[0, 0], [6, 4], [-2, 7]] as Pt[]).map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="4.2" fill="none" stroke="#F4EEE1" stroke-width="1.3"/>`).join(""),
  cukr: (r: Rng, x: number, y: number) => dots(r, 46, x, y, 30, ["#FFFFFF", "#FBF7EE"], 0.35, 0.75, 0.95),
  kakao: (r: Rng, x: number, y: number) => dots(r, 70, x, y, 24, ["#6A3D23", "#83522F"], 0.35, 0.8, 0.85),
  maslo: (r: Rng, x: number, y: number) => `<path d="${blob(x, y, 7, r, 0.18, 12)}" fill="#F3CD5E" opacity=".92"/><ellipse cx="${n1(x - 1.8)}" cy="${n1(y - 2)}" rx="2" ry="1.1" fill="#FBE7A6"/>`,
  syr: (r: Rng, x: number, y: number) => strokes(r, 18, x, y, 20, 3.2, ["#F3D57C", "#E8C55E", "#F6DE93"], 1.3),
  bazalka: (_r: Rng, x: number, y: number) => `<g transform="translate(${x} ${y}) rotate(-25)"><ellipse rx="4.4" ry="2.4" cx="-3.4" fill="#3F7F35"/><ellipse rx="4" ry="2.2" cx="3.6" cy="1" fill="#4E9140"/><path d="M-7.4 0H7.2" stroke="#2E6328" stroke-width=".4"/></g>`,
  houby: (r: Rng, x: number, y: number) => {
    let s = "";
    for (let i = 0; i < 6; i++) {
      const [px, py] = inDisc(r, x, y, 34);
      s += `<path transform="translate(${n1(px)} ${n1(py)}) rotate(${(r() * 360).toFixed(0)})" d="M-3.4 0A3.4 3.4 0 0 1 3.4 0H1.1V3.2H-1.1V0Z" fill="#9C7450" stroke="#7A5638" stroke-width=".4"/>`;
    }
    return s;
  },
  krutony: (r: Rng, x: number, y: number) => squares(r, 10, x, y, 32, 4.6, "#D59C47", "#AE762C"),
  kostky: (r: Rng, x: number, y: number) => squares(r, 8, x, y, 36, 5.2, "#F2E3A9", "#DCC783"),
  zeli: (r: Rng, x: number, y: number) => {
    let s = "";
    for (let i = 0; i < 18; i++) {
      const [px, py] = inDisc(r, x, y, 14), a = r() * 360;
      const [qx, qy] = pol(a, 5, px, py), [cx, cy] = pol(a + 40, 3, px, py);
      s += `<path d="M${n1(px)} ${n1(py)}Q${n1(cx)} ${n1(cy)} ${n1(qx)} ${n1(qy)}" fill="none" stroke="${i % 2 ? "#D8CF86" : "#E4DD9F"}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    return s;
  },
  tatarka: (r: Rng, x: number, y: number) => `<path d="${blob(x, y, 7.6, r, 0.14, 14)}" fill="#F7F2DD" stroke="#E5DDC0" stroke-width=".5"/>` + dots(r, 7, x, y, 5, ["#6F9A48"], 0.35, 0.55),
  tvaroh: (r: Rng, x: number, y: number) => {
    let s = "";
    for (let i = 0; i < 14; i++) {
      const [px, py] = inDisc(r, x, y, 26);
      s += `<path d="${blob(px, py, 1.3 + r() * 1.3, r, 0.25, 7)}" fill="#FFFFFF" stroke="#ECE6D6" stroke-width=".3"/>`;
    }
    return s;
  },
  pose: (r: Rng, x: number, y: number) => `<path d="${blob(x, y, 9.5, r, 0.14, 14)}" fill="#FDFCF7" stroke="#EDE8DA" stroke-width=".5"/><circle cx="${x + 1}" cy="${y - 0.5}" r="4.4" fill="#F1B33C"/><circle cx="${x - 0.3}" cy="${y - 1.8}" r="1.2" fill="#F8D688"/>`,
};

export const DISHES: Record<string, DishSpec> = {
  citronove: { side: "testoviny", nest: [100, 100, 36], garnish: [["syr", 100, 98], ["citron", 134, 72], ["maslo", 92, 106]] },
  paprikove: { side: "testoviny", nest: [100, 100, 36], top: ["#C2532B", "#E07A45"], garnish: [["syr", 100, 98], ["krutony", 100, 100]] },
  pecene: { side: "testoviny", nest: [100, 100, 36], top: ["#B83A22", "#D9603F"], garnish: [["syr", 100, 98], ["bazalka", 109, 90], ["bazalka", 90, 108]] },
  aglio: { side: "testoviny", nest: [100, 100, 36], garnish: [["cibulka", 104, 96], ["brusinky", 114, 88]] },
  ramen: { soup: ["#C99A55", "#E8C98C"], garnish: [["kostky", 100, 100], ["houby", 100, 100], ["cibulka", 112, 84]] },
  wrap: { side: "salat", protein: "rizek", garnish: [["tatarka", 126, 129], ["okurka", 74, 80]] },
  zavitky: { side: "salat", garnish: [["okurka", 74, 80], ["smetana", 126, 129], ["bazalka", 112, 92]] },
  tacos: { sauce: ["#7A4A2A", "#9C6A44"], sauceR: 40, garnish: [["smetana", 116, 86], ["syr", 100, 100], ["cibulka", 121, 80]] },
  shakshuka: { sauce: ["#B83A22", "#D9603F"], sauceR: 44, protein: "volske", garnish: [["petrzel", 86, 110]] },
  tofu: { sauce: ["#D4552C", "#EE8450"], protein: "cubes", meat: ["#F1E2BC", "#D9BF85"], garnish: [["tvaroh", 84, 104], ["bazalka", 118, 112]] },
};

const SEED_ART: Record<string, string> = {
  "citronové špagety": "citronove",
  "paprikové špagety": "paprikove",
  "špagety s pečenou omáčkou": "pecene",
  "aglio e olio": "aglio",
  "vege ramen": "ramen",
  "řecký wrap": "wrap",
  "letní závitky": "zavitky",
  "tacos": "tacos",
  "shakshuka": "shakshuka",
  "tofu ve sladkokyselé chilli omáčce": "tofu",
};

export const artKeyFor = (name: string) => SEED_ART[name.trim().toLowerCase().replace(/\s+/g, " ")] ?? null;

const FALLBACK: [string, string][] = [["#D9A66A", "#F0CF9C"], ["#B9603C", "#D98A62"], ["#C9B27A", "#E8DAB0"], ["#8C9A55", "#B6C27E"], ["#A86A4A", "#CC9473"]];

export function dishMarkup(key: string | null, seed: string) {
  if (!key || !DISHES[key]) {
    const r = rng(seed);
    const [a, b] = FALLBACK[Math.floor(r() * FALLBACK.length)];
    return `<path d="${blob(100, 100, 38, r, 0.12, 18)}" fill="${a}" opacity=".85"/><path d="${blob(96, 95, 22, r, 0.18, 14)}" fill="${b}" opacity=".7"/>`;
  }
  const D = DISHES[key];
  const r = rng(key);
  let s = "";
  if (D.soup) s += `<circle cx="100" cy="100" r="58" fill="url(#s-${key})"/><circle cx="100" cy="100" r="53" fill="none" stroke="#FFFFFF" stroke-opacity=".28" stroke-width="1.2"/>`;
  else if (D.sauce) s += `<path d="${blob(100, 100, D.sauceR || 41, r, 0.1, 20)}" fill="url(#s-${key})"/>`;
  if (D.lentils) s += dots(r, 110, 100, 100, 40, ["#6A4C2A", "#A08259", "#836338"], 0.6, 1.1, 0.9);
  if (D.side) s += SIDE[D.side](r, D);
  if (D.top) s += `<path d="${blob(100, 98, 17, r, 0.18, 16)}" fill="url(#s-${key})"/>` + dots(r, 14, 100, 98, 13, ["#7A2614", "#8F3A22"], 0.6, 1.2);
  if (D.protein) s += PROT[D.protein](r, D, key);
  (D.garnish || []).forEach(([g, x, y]) => (s += GAR[g](r, x, y)));
  return s;
}

const cache = new Map<string, string>();
export function cachedDish(key: string | null, seed: string) {
  const k = `${key}|${seed}`;
  let v = cache.get(k);
  if (!v) {
    v = dishMarkup(key, seed);
    cache.set(k, v);
  }
  return v;
}

export function defsMarkup() {
  let g = "";
  for (const [key, D] of Object.entries(DISHES)) {
    const c = D.soup || D.sauce || D.top;
    if (c) g += `<radialGradient id="s-${key}" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/></radialGradient>`;
  }
  return `
<radialGradient id="gPlate" gradientUnits="userSpaceOnUse" cx="100" cy="100" r="98"><stop offset=".63" stop-color="#FFFFFF"/><stop offset=".685" stop-color="#EAEEF7"/><stop offset=".72" stop-color="#FDFEFF"/><stop offset=".95" stop-color="#F7F9FC"/><stop offset="1" stop-color="#E9EDF6"/></radialGradient>
<radialGradient id="gPot" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#F3DC8C"/><stop offset="1" stop-color="#D3A642"/></radialGradient>
<radialGradient id="gGold" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#EBBE62"/><stop offset="1" stop-color="#C27D2B"/></radialGradient>
<radialGradient id="gBram" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#DEA44F"/><stop offset="1" stop-color="#B26F31"/></radialGradient>
<radialGradient id="gYolk" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#F8CB55"/><stop offset="1" stop-color="#E49B1C"/></radialGradient>
<clipPath id="cWell"><circle cx="100" cy="100" r="64"/></clipPath>
<g id="pbase"><path d="${SCALLOP}" fill="url(#gPlate)" stroke="${PB}" stroke-opacity=".16" stroke-width=".6"/><circle cx="100" cy="100" r="94.2" fill="none" stroke="${PB}" stroke-width=".9"/></g>
<g id="rim">${rimMarkup()}</g>
<pattern id="pRibbon" width="30" height="26" patternUnits="userSpaceOnUse">
<rect class="rb" width="30" height="26"/><rect width="30" height="2.6" fill="#C9A040"/><rect y="23.4" width="30" height="2.6" fill="#C9A040"/>
<g fill="#C9A040" opacity=".85">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${2.5 + i * 5}" cy="5.4" r=".75"/><circle cx="${2.5 + i * 5}" cy="20.6" r=".75"/>`).join("")}</g>
<path d="M15 13C11.5 9.6 7.8 9.4 5.6 11.2 8.4 13.2 11.6 13.8 15 13Z" fill="#5E8A45"/><path d="M15 13C18.5 16.4 22.2 16.6 24.4 14.8 21.6 12.8 18.4 12.2 15 13Z" fill="#5E8A45"/>
<circle cx="15" cy="13" r="4.4" fill="#E88AA0"/><circle cx="15" cy="13" r="3" fill="#D8607E"/><path d="M13.4 13.3a1.6 1.6 0 1 1 2 1.5" fill="none" stroke="#AE3B5B" stroke-width=".7" stroke-linecap="round"/>
<circle cx="0" cy="13" r="2" fill="#C8262E"/><circle cx="30" cy="13" r="2" fill="#C8262E"/><circle cx="0" cy="13" r=".7" fill="#F2C14E"/><circle cx="30" cy="13" r=".7" fill="#F2C14E"/>
<circle cx="7" cy="17.6" r=".8" fill="#F6F1E8"/><circle cx="23" cy="8.4" r=".8" fill="#F6F1E8"/>
</pattern>
${g}`;
}
