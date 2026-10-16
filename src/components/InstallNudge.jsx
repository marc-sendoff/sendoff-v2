import React, { useEffect, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { T, SH, SPRING } from "../theme.js";

/* "Add Sendoff to your home screen." Android/Chrome hand us a real install
   prompt; iPhone has no API, so we show the two taps instead. Shows once per
   device after the second visit, never inside the installed app itself. */
const KEY = "sendoff_install_nudge";
const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

export default function InstallNudge() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (standalone()) return;
    let seen = 0; try { seen = Number(localStorage.getItem(KEY) || 0); } catch {}
    if (seen === -1) return;                 // dismissed for good
    try { localStorage.setItem(KEY, String(seen + 1)); } catch {}
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); if (seen >= 1) setShow(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (isIOS() && seen >= 1) setShow(true);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  const dismiss = () => { setShow(false); try { localStorage.setItem(KEY, "-1"); } catch {} };
  const install = async () => {
    if (!prompt) return;
    prompt.prompt(); const r = await prompt.userChoice.catch(() => null);
    if (r?.outcome === "accepted") dismiss(); else setShow(false);
  };
  return (
    <AnimatePresence>
      {show && (
        <m.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={SPRING}
          style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 90, background: T.ink, color: T.paper,
            border: `2px solid ${T.ink}`, borderRadius: 18, boxShadow: SH.big, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 28 }}>📲</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15 }}>Put Sendoff on your home screen</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.8, marginTop: 2, lineHeight: 1.4 }}>
              {prompt ? "Opens like an app, no download." : isIOS() ? "Tap Share, then “Add to Home Screen”." : "Use your browser menu: “Add to Home screen”."}
            </div>
          </div>
          {prompt ? (
            <button onClick={install} style={{ background: T.sun, color: T.onAccent, border: "none", borderRadius: 999, padding: "9px 14px",
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
          ) : null}
          <button onClick={dismiss} aria-label="Not now" style={{ background: "transparent", color: T.paper, border: "none", fontSize: 20, cursor: "pointer", padding: 4 }}>×</button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
