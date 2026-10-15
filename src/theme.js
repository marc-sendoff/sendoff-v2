/* ============ DESIGN TOKENS ============ */
export const T = {
  paper: "#F4F1E8", ink: "#1B1D2A", cobalt: "#2547F0", sun: "#FFC838", poppy: "#FF5A3C", white: "#FFFFFF",
  /* derived roles so dark themes stay readable: text on a sun/cobalt fill,
     text on an ink fill, a soft tinted fill for chips, a muted surface */
  onAccent: "#1B1D2A", onInk: "#FFC838", tint: "#E8F5EC", muted: "#ECE8DB", mutedFg: "#5A5C6B",
};

/* ---- themes: a Founders Club perk. Every component reads colours off T at
   render time, so switching is: copy the theme's colours onto T, refresh the
   few derived recipes below, and re-render. `original` is the site. ---- */
export const THEMES = {
  original: { label: "Original", paper: "#F4F1E8", ink: "#1B1D2A", cobalt: "#2547F0", sun: "#FFC838", poppy: "#FF5A3C", white: "#FFFFFF",
              onAccent: "#1B1D2A", onInk: "#FFC838", tint: "#E8F5EC", muted: "#ECE8DB", mutedFg: "#5A5C6B" },
  /* Founders Black: near-black, ivory type, hot yellow where the site is
     usually cobalt. Cards go charcoal with ivory borders. */
  black:    { label: "Founders Black", paper: "#0B0B0D", ink: "#F1EADB", cobalt: "#F5B700", sun: "#F5B700", poppy: "#FF7A5C", white: "#16161B",
              onAccent: "#0B0B0D", onInk: "#0B0B0D", tint: "rgba(245,183,0,0.14)", muted: "#1E1E25", mutedFg: "#A9A395" },
  /* Cobalt: deep navy rather than electric blue, so it's calm to read. */
  blue:     { label: "Cobalt", paper: "#0F1B4D", ink: "#F4F1E8", cobalt: "#FFC838", sun: "#FFC838", poppy: "#FF8A6B", white: "#182866",
              onAccent: "#0F1B4D", onInk: "#0F1B4D", tint: "rgba(255,255,255,0.10)", muted: "#223379", mutedFg: "#B9C3E8" },
};
export const DEFAULT_THEME = "original";
export function applyTheme(name) {
  const th = THEMES[name] || THEMES[DEFAULT_THEME];
  const { label, ...colors } = th;
  Object.assign(T, colors);
  SH.card = `4px 4px 0 ${T.ink}`; SH.pop = `4px 4px 0 ${T.ink}`; SH.big = `6px 6px 0 ${T.ink}`;
  Object.assign(surface, { background: T.white, border: `2px solid ${T.ink}`, boxShadow: SH.card, color: T.ink });
  slotStyle.color = T.cobalt; slotStyle.borderBottom = `4px solid ${T.sun}`;
  if (typeof document !== "undefined") {
    document.body.style.background = T.paper; document.body.style.color = T.ink;
    /* the Tailwind-built pieces (trip cards, rails) read these */
    const v = {
      background: T.paper, foreground: T.ink, card: T.white, "card-foreground": T.ink, popover: T.white, "popover-foreground": T.ink,
      primary: T.cobalt, "primary-foreground": T.onAccent, secondary: T.sun, "secondary-foreground": T.onAccent,
      muted: T.muted, "muted-foreground": T.mutedFg, accent: T.sun, "accent-foreground": T.onAccent,
      border: T.ink, input: T.ink, ring: T.cobalt,
    };
    for (const [k, val] of Object.entries(v)) document.documentElement.style.setProperty(`--${k}`, val);
  }
  return name in THEMES ? name : DEFAULT_THEME;
}
export const PALETTE = ["#FFC838","#9BD3AE","#8FD8E8","#FFB088","#F9E285","#E8A0BF","#C9E4A5","#7EE0D0","#B8A9E8","#A5D8C5","#FF9ECF","#AFC8E8"];

export const VIBES = [
  { id: "all", label: "Everything", emoji: "✨" },
  { id: "nature", label: "Nature reset", emoji: "🌲" },
  { id: "party", label: "Party capital", emoji: "🪩" },
  { id: "music", label: "Music pilgrimage", emoji: "🎶" },
  { id: "culture", label: "Museums + culture", emoji: "🏛️" },
  { id: "intl", label: "International", emoji: "🌍" },
  { id: "road", label: "Road trip", emoji: "🚗" },
  { id: "beach", label: "Beach brain", emoji: "🏝️" },
];

export const BUDGET_MIN = 150, BUDGET_MAX = 2000, BUDGET_STEP = 50;
export const FRIENDS = [0, 1, 2, 3, 4, 5, 6, 7];
export const crewLabel = (n) => (n === 0 ? "solo" : n === 1 ? "1 friend" : `${n} friends`);

export const slotStyle = {
  fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "inherit", color: T.cobalt,
  background: "transparent", border: "none", borderBottom: `4px solid ${T.sun}`, cursor: "pointer",
  padding: "0 2px 1px", lineHeight: 1.15,
};

/* ---- shared surface recipe (v2 views): one radius/border/shadow language
   so every card on the page agrees. Cards get SH.card, floating panels SH.pop. ---- */
export const R = { card: 16, panel: 14, pill: 999 };
export const SH = { card: `4px 4px 0 ${T.ink}`, pop: `4px 4px 0 ${T.ink}`, big: `6px 6px 0 ${T.ink}` };
export const surface = {
  background: T.white, border: `2px solid ${T.ink}`, borderRadius: R.card, boxShadow: SH.card, color: T.ink,
};
/* spring used for all layout/entrance motion — one feel everywhere */
export const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 };
