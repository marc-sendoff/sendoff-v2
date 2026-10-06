/* ============ DESIGN TOKENS ============ */
export const T = { paper: "#F4F1E8", ink: "#1B1D2A", cobalt: "#2547F0", sun: "#FFC838", poppy: "#FF5A3C", white: "#FFFFFF" };
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
