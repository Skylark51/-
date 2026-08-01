const STYLE_ID = "real-art-seal-scene-style";
const STYLE_VERSION = "20260802-sealart1";

export function ensureRealArtStyles() {
  if (typeof document === "undefined") return null;
  const existing = document.getElementById(STYLE_ID);
  if (existing) return existing;
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = new URL(`../css/jar-seal-scene.css?v=${STYLE_VERSION}`, import.meta.url).href;
  document.head.append(link);
  return link;
}

ensureRealArtStyles();
