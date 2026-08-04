import photo1 from "./scene-photo/jar-photo-1.js";
import photo2 from "./scene-photo/jar-photo-2.js";
import photo3 from "./scene-photo/jar-photo-3.js";
import photo4 from "./scene-photo/jar-photo-4.js";
import photo5 from "./scene-photo/jar-photo-5.js";
import photo6 from "./scene-photo/jar-photo-6.js";
import photo7 from "./scene-photo/jar-photo-7.js";

const HERO_ART_URL = `data:image/jpeg;base64,${photo1}${photo2}${photo3}${photo4}${photo5}${photo6}${photo7}`;
const PHOTO_STYLE_ID = "uploaded-jar-scene-style-v3";

function installPhotoStyles() {
  if (document.getElementById(PHOTO_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PHOTO_STYLE_ID;
  style.textContent = `
    .hero-live-scene__art {
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 52%;
      transform: none !important;
      animation: none !important;
      filter: saturate(1.04) contrast(1.04) brightness(.96);
    }
    .hero-live-scene::before {
      background:
        linear-gradient(90deg, rgba(11, 8, 5, .91) 0%, rgba(11, 8, 5, .72) 39%, rgba(11, 8, 5, .10) 68%, rgba(11, 8, 5, .02) 100%),
        linear-gradient(180deg, rgba(0, 0, 0, .06), transparent 58%, rgba(0, 0, 0, .36));
    }
    .jar-selection-scene {
      position: relative;
      margin: 0 0 18px;
      overflow: hidden;
      border: 1px solid var(--line-strong);
      border-radius: 18px;
      background: #120f0c;
      box-shadow: var(--shadow-soft);
    }
    .jar-selection-scene img {
      display: block;
      width: 100%;
      max-height: 390px;
      aspect-ratio: 1536 / 834;
      object-fit: cover;
      object-position: center;
    }
    @media (max-width: 760px), (max-device-width: 760px) {
      .lobby-hero {
        min-height: 0 !important;
        aspect-ratio: auto !important;
      }
      #lobbyTitle[tabindex="-1"]:focus {
        outline: none !important;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-copy {
        width: 100%;
        padding: clamp(14px, 2.2vh, 18px) 14px 78px;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-copy h1 {
        max-width: 100%;
        font-size: clamp(28px, 8.6vw, 36px);
        line-height: 1.08;
        letter-spacing: -.055em;
        text-wrap: balance;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-copy > p:not(.eyebrow, .cta-hint) {
        max-width: 33rem;
        margin-top: 8px;
        font-size: 11px;
        line-height: 1.42;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-actions {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr);
        gap: 7px;
        margin-top: 13px;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-actions > * {
        width: 100%;
        min-width: 0;
        min-height: 40px;
        padding: 8px 7px;
        font-size: 10px;
        white-space: nowrap;
      }
      html[data-lobby-view="home"] #lobbyTop .cta-hint {
        min-height: 0;
        margin-top: 6px;
        font-size: 8px;
        line-height: 1.35;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-badges {
        right: 11px;
        bottom: 9px;
        left: 11px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-badges span {
        min-width: 0;
        min-height: 38px;
        padding: 6px 8px;
        border-radius: 13px;
        font-size: 8px;
        line-height: 1.3;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-badges span:nth-child(3) {
        display: none;
      }
      .hero-live-scene {
        background: #1a1109;
      }
      .hero-live-scene__art {
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: 49% 59%;
        opacity: 1;
        filter: saturate(1.08) contrast(1.04) brightness(1.07);
      }
      .hero-live-scene::before {
        background:
          linear-gradient(180deg, rgba(9, 7, 5, .84) 0%, rgba(9, 7, 5, .60) 34%, rgba(9, 7, 5, .18) 57%, rgba(9, 7, 5, .04) 76%, rgba(9, 7, 5, .24) 100%),
          linear-gradient(90deg, rgba(9, 7, 5, .24), transparent 74%);
      }
      .hero-live-scene__water-glow,
      .hero-live-scene__atmosphere {
        display: none;
      }
      .jar-selection-scene {
        margin-bottom: 14px;
        border-radius: 14px;
      }
      .jar-selection-scene img {
        max-height: none;
        aspect-ratio: 1536 / 834;
        object-position: center;
      }
    }
  `;
  document.head.append(style);
}

function simplifyHomeScreen() {
  const home = document.getElementById("homeView");
  if (!home) return;

  home.querySelector(".quick-start-card")?.remove();
  home.querySelector(".research-summary")?.remove();

  const homeGrid = home.querySelector(".home-grid");
  if (homeGrid) homeGrid.style.gridTemplateColumns = "minmax(0, 1fr)";
}

function installJarSelectionScene() {
  const trainingSection = document.getElementById("trainingSection");
  if (!trainingSection || trainingSection.querySelector(".jar-selection-scene")) return;

  const figure = document.createElement("figure");
  figure.className = "jar-selection-scene";

  const image = document.createElement("img");
  image.src = HERO_ART_URL;
  image.alt = "눈물을 흘리는 두꺼비와 물이 새는 장독대";
  image.decoding = "async";
  image.loading = "eager";

  figure.append(image);
  const heading = trainingSection.querySelector(".section-heading");
  if (heading) heading.insertAdjacentElement("afterend", figure);
  else trainingSection.prepend(figure);
}

function makeParticle(className, delay) {
  const particle = document.createElement("i");
  particle.className = className;
  particle.style.setProperty("--particle-delay", delay);
  particle.setAttribute("aria-hidden", "true");
  return particle;
}

export function installLobbyHeroScene() {
  installPhotoStyles();
  simplifyHomeScreen();
  installJarSelectionScene();

  const hero = document.getElementById("lobbyTop");
  if (!hero || hero.dataset.liveScene === "ready") return;
  hero.dataset.liveScene = "ready";

  const stage = document.createElement("div");
  stage.className = "hero-live-scene";
  stage.setAttribute("aria-hidden", "true");

  const art = document.createElement("img");
  art.className = "hero-live-scene__art";
  art.src = HERO_ART_URL;
  art.alt = "";
  art.decoding = "async";
  art.fetchPriority = "high";

  const atmosphere = document.createElement("div");
  atmosphere.className = "hero-live-scene__atmosphere";
  atmosphere.append(
    makeParticle("hero-live-scene__firefly firefly-a", "0s"),
    makeParticle("hero-live-scene__firefly firefly-b", ".8s"),
    makeParticle("hero-live-scene__firefly firefly-c", "1.6s"),
    makeParticle("hero-live-scene__drop drop-a", "0s"),
    makeParticle("hero-live-scene__drop drop-b", ".55s"),
    makeParticle("hero-live-scene__drop drop-c", "1.1s")
  );

  const waterGlow = document.createElement("div");
  waterGlow.className = "hero-live-scene__water-glow";

  art.addEventListener("load", () => {
    hero.classList.add("has-live-scene");
    hero.classList.remove("has-scene-load-error");
  }, { once: true });

  art.addEventListener("error", () => {
    hero.classList.add("has-scene-load-error");
    stage.remove();
  }, { once: true });

  stage.append(art, waterGlow, atmosphere);
  hero.prepend(stage);
}