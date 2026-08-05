import photo1 from "./scene-photo/jar-photo-1.js";
import photo2 from "./scene-photo/jar-photo-2.js";
import photo3 from "./scene-photo/jar-photo-3.js";
import photo4 from "./scene-photo/jar-photo-4.js";
import photo5 from "./scene-photo/jar-photo-5.js";
import photo6 from "./scene-photo/jar-photo-6.js";
import photo7 from "./scene-photo/jar-photo-7.js";

const HERO_ART_URL = `data:image/jpeg;base64,${photo1}${photo2}${photo3}${photo4}${photo5}${photo6}${photo7}`;
const PHOTO_STYLE_ID = "uploaded-jar-scene-style-v4";

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
      #lobbyTop.lobby-hero {
        display: block;
        min-height: 0 !important;
        aspect-ratio: 1 / 1 !important;
        border-radius: 20px;
        background: #17110d;
      }
      #lobbyTitle[tabindex="-1"]:focus {
        outline: none !important;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-live-scene {
        background-color: #17110d;
        background-image: var(--mobile-hero-art);
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-live-scene__art {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        padding: 0;
        object-fit: contain;
        object-position: center;
        opacity: 1;
        transform: none !important;
        filter: saturate(1.05) contrast(1.03) brightness(.94);
      }
      html[data-lobby-view="home"] #lobbyTop .hero-live-scene::before {
        background:
          linear-gradient(180deg, rgba(8, 6, 4, .88) 0%, rgba(8, 6, 4, .56) 18%, rgba(8, 6, 4, .10) 38%, rgba(8, 6, 4, .08) 62%, rgba(8, 6, 4, .52) 80%, rgba(8, 6, 4, .90) 100%),
          linear-gradient(90deg, rgba(8, 6, 4, .22), transparent 42%, transparent 72%, rgba(8, 6, 4, .18));
      }
      html[data-lobby-view="home"] #lobbyTop .hero-shade {
        z-index: 2;
        background: linear-gradient(180deg, rgba(0, 0, 0, .12), transparent 43%, transparent 66%, rgba(0, 0, 0, .16));
      }
      html[data-lobby-view="home"] #lobbyTop .hero-copy {
        position: relative;
        z-index: 4;
        display: flex;
        width: 100%;
        height: 100%;
        min-height: 0;
        flex-direction: column;
        padding: 15px 13px 13px;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-copy .eyebrow {
        margin-bottom: 4px;
        font-size: 7.5px;
        line-height: 1.25;
        letter-spacing: .08em;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-copy h1 {
        max-width: 100%;
        margin: 0;
        font-size: clamp(26px, 7.9vw, 32px);
        line-height: 1.06;
        letter-spacing: -.058em;
        text-wrap: balance;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-copy > p:not(.eyebrow, .cta-hint) {
        max-width: 100%;
        margin: 7px 0 0;
        color: rgba(248, 239, 220, .86);
        font-size: 9.5px;
        line-height: 1.4;
      }
      html[data-lobby-view="home"] #lobbyTop .cta-hint {
        min-height: 0;
        margin: 5px 0 0;
        color: rgba(242, 213, 141, .82);
        font-size: 7.5px;
        line-height: 1.35;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-badges {
        position: static;
        display: grid;
        grid-template-columns: 1fr;
        gap: 5px;
        margin: auto 0 7px;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-badges span {
        display: grid;
        grid-template-columns: 21px minmax(0, 1fr);
        align-items: center;
        gap: 7px;
        min-width: 0;
        min-height: 31px;
        padding: 5px 8px;
        border: 1px solid rgba(242, 213, 141, .22);
        border-radius: 10px;
        background: rgba(13, 10, 7, .74);
        color: #eee2ca;
        font-size: 7.8px;
        font-weight: 850;
        line-height: 1.28;
        box-shadow: 0 7px 18px rgba(0, 0, 0, .16);
        backdrop-filter: blur(9px);
      }
      html[data-lobby-view="home"] #lobbyTop .hero-badges b {
        display: grid;
        place-items: center;
        width: 21px;
        height: 21px;
        border-radius: 7px;
        background: rgba(213, 160, 62, .18);
        color: var(--gold-2);
        font-size: 7.5px;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-badges span:nth-child(3) {
        display: none;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-actions {
        display: grid;
        grid-template-columns: minmax(0, 1.12fr) minmax(0, .88fr);
        gap: 7px;
        margin: 0;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-actions > * {
        width: 100%;
        min-width: 0;
        min-height: 40px;
        padding: 8px 7px;
        border-radius: 12px;
        font-size: 9.5px;
        white-space: nowrap;
      }
      html[data-lobby-view="home"] #lobbyTop .hero-live-scene__water-glow,
      html[data-lobby-view="home"] #lobbyTop .hero-live-scene__atmosphere {
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

function arrangeHeroContent() {
  const hero = document.getElementById("lobbyTop");
  const copy = hero?.querySelector(".hero-copy");
  const actions = copy?.querySelector(".hero-actions");
  const hint = copy?.querySelector(".cta-hint");
  const badges = hero?.querySelector(".hero-badges");
  if (!copy || !actions) return;

  if (hint) copy.insertBefore(hint, actions);
  if (badges) copy.insertBefore(badges, actions);
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
  arrangeHeroContent();
  installJarSelectionScene();

  const hero = document.getElementById("lobbyTop");
  if (!hero || hero.dataset.liveScene === "ready") return;
  hero.dataset.liveScene = "ready";
  hero.style.setProperty("--mobile-hero-art", `url("${HERO_ART_URL}")`);

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
