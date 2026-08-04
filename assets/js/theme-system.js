import photo1 from "./scene-photo/jar-photo-1.js";
import photo2 from "./scene-photo/jar-photo-2.js";
import photo3 from "./scene-photo/jar-photo-3.js";
import photo4 from "./scene-photo/jar-photo-4.js";
import photo5 from "./scene-photo/jar-photo-5.js";
import photo6 from "./scene-photo/jar-photo-6.js";
import photo7 from "./scene-photo/jar-photo-7.js";

export const GAME_TITLE = "콩쥐야 줘때써 - 화학편";

const JAR_SCENE_URL = `data:image/jpeg;base64,${photo1}${photo2}${photo3}${photo4}${photo5}${photo6}${photo7}`;
const JAR_THUMBNAIL_STYLE_ID = "jar-photo-preview-style-v2";

const ids = [
  "atomic_number", "atomic_mass", "period_group", "valence_electron",
  "electron_configuration", "ion_charge", "electronegativity", "atomic_radius",
  "ionization_energy", "bond_type", "bond_polarity", "ionic_formula",
  "formula_mass", "mole_mass", "mole_particles", "gas_molar_volume",
  "concentration", "equation_balancing", "stoichiometry", "oxidation_number",
  "redox", "acid_base", "ph", "reaction_energy", "equilibrium"
];

const names = {
  atomic_number: ["bronze", "dots", "green"],
  atomic_mass: ["umber", "waves", "brown"],
  period_group: ["green", "grid", "striped"],
  valence_electron: ["violet", "orbit", "orbit"],
  electronegativity: ["yellow", "lightning", "electric"],
  mole_mass: ["red", "molecule", "heavy"],
  gas_molar_volume: ["sky", "bubbles", "balloon"],
  redox: ["rust", "split", "split"],
  acid_base: ["two-tone", "yin-yang", "acid-base"]
};

const palettes = [
  ["#9b6136", "#4b281d", "#39d8ed"], ["#76523b", "#321f18", "#58e8e4"],
  ["#39785a", "#183c2c", "#76e3bb"], ["#7250a3", "#321d55", "#bb8cff"],
  ["#426b9b", "#1a355a", "#72d9ff"], ["#8f647d", "#44283b", "#ff9cd4"],
  ["#a67b22", "#4e380c", "#ffe14e"], ["#4f8275", "#203f38", "#6fe2cf"],
  ["#9b4e6a", "#482234", "#ff81ad"], ["#4e7193", "#21384f", "#77c9ff"],
  ["#7e5598", "#362347", "#cf92ff"], ["#986744", "#472d1e", "#ffbd72"],
  ["#536f82", "#243947", "#80d8ef"], ["#9c4b41", "#4b211e", "#ff8a55"],
  ["#517c8a", "#213f49", "#71e6ef"], ["#4e8fb1", "#1c485d", "#a6efff"],
  ["#7c6b3a", "#3f3518", "#d8e56a"], ["#8a5d47", "#43291d", "#f3aa72"],
  ["#436f62", "#203a33", "#71d9aa"], ["#7b526d", "#382333", "#ee91ca"],
  ["#9b4d31", "#482117", "#ff675d"], ["#85506b", "#273c69", "#ff7190"],
  ["#536f9b", "#27364f", "#8daeff"], ["#a16932", "#4d3017", "#ffc354"],
  ["#456f63", "#223b35", "#72d9bd"]
];

export const JAR_THEMES = Object.freeze(Object.fromEntries(ids.map((id, index) => {
  const named = names[id] || [
    `theme-${index + 1}`,
    index % 4 === 0 ? "rings" : index % 4 === 1 ? "hex" : index % 4 === 2 ? "lines" : "stars",
    `toad-${index + 1}`
  ];
  const palette = palettes[index];
  return [id, Object.freeze({
    id,
    jar: named[0],
    pattern: named[1],
    toad: named[2],
    jarColor: palette[0],
    jarDark: palette[1],
    waterColor: palette[2],
    hue: index * 14,
    photoIndex: index
  })];
})));

export const displayJarName = mode => `${String(mode?.title || "화학")
  .replace(/\s*(?:훈련|장독대 채우기)\s*$/, " ")
  .trim()} 장독대 채우기`;

export function themeFor(trainingId) {
  return JAR_THEMES[trainingId] || JAR_THEMES.atomic_number;
}

function decorate(root, theme) {
  root.dataset.jarTheme = theme.jar;
  root.dataset.jarPattern = theme.pattern;
  root.dataset.toadTheme = theme.toad;
  root.style.setProperty("--jar-main", theme.jarColor);
  root.style.setProperty("--jar-dark", theme.jarDark);
  root.style.setProperty("--theme-water", theme.waterColor);
  root.style.setProperty("--mode-accent", theme.waterColor);
  root.style.setProperty("--toad-hue", `${theme.hue}deg`);
}

function ensureJarPhotoStyle() {
  if (document.getElementById(JAR_THUMBNAIL_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = JAR_THUMBNAIL_STYLE_ID;
  style.textContent = `
    #trainingGrid .jar-preview.jar-preview-photo {
      min-height: 0;
      isolation: isolate;
      background-color: #3a2417;
      background-position: center 53% !important;
      background-repeat: no-repeat !important;
      background-size: cover !important;
    }
    #trainingGrid .jar-preview.jar-preview-photo::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      background:
        linear-gradient(180deg, rgba(255, 246, 218, .08), transparent 45%, rgba(18, 8, 3, .24)),
        linear-gradient(135deg, color-mix(in srgb, var(--jar-main) 24%, transparent), transparent 58%, color-mix(in srgb, var(--theme-water) 17%, transparent));
      mix-blend-mode: color;
    }
    #trainingGrid .jar-preview.jar-preview-photo::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      border: 1px solid rgba(255, 232, 184, .09);
      background: radial-gradient(circle at 68% 45%, transparent 0 37%, rgba(15, 7, 3, .14) 100%);
      box-shadow: inset 0 -28px 34px rgba(12, 6, 3, .22);
    }
    @media (max-width: 760px), (max-device-width: 760px) {
      #trainingGrid .jar-preview.jar-preview-photo {
        height: auto !important;
        aspect-ratio: 1536 / 834;
        background-position: center 51% !important;
      }
    }
  `;
  document.head.append(style);
}

function thumbnailFilter(theme) {
  const index = Number(theme.photoIndex || 0);
  const hue = (index * 37) % 360;
  const saturation = 0.86 + (index % 5) * 0.12;
  const brightness = 0.88 + (index % 4) * 0.055;
  const contrast = 1.02 + (index % 3) * 0.08;
  const sepia = index % 6 === 0 ? 0.16 : index % 6 === 3 ? 0.08 : 0;
  return `hue-rotate(${hue}deg) saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)}) sepia(${sepia.toFixed(2)})`;
}

export function applyJarTheme(root, trainingId) {
  if (!root) return null;
  const theme = themeFor(trainingId);
  decorate(root, theme);
  return theme;
}

export function createJarPreview(mode) {
  const preview = document.createElement("div");
  const theme = themeFor(mode.id);
  ensureJarPhotoStyle();
  preview.className = "jar-preview jar-preview-photo";
  preview.setAttribute("aria-hidden", "true");
  decorate(preview, theme);
  preview.style.backgroundImage = `url("${JAR_SCENE_URL}")`;
  preview.style.filter = thumbnailFilter(theme);
  return preview;
}
