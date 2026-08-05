import photo1 from "./scene-photo/jar-photo-1.js";
import photo2 from "./scene-photo/jar-photo-2.js";
import photo3 from "./scene-photo/jar-photo-3.js";
import photo4 from "./scene-photo/jar-photo-4.js";
import photo5 from "./scene-photo/jar-photo-5.js";
import photo6 from "./scene-photo/jar-photo-6.js";
import photo7 from "./scene-photo/jar-photo-7.js";

const HERO_ART_URL = `data:image/jpeg;base64,${photo1}${photo2}${photo3}${photo4}${photo5}${photo6}${photo7}`;
const PHOTO_STYLE_ID = "uploaded-jar-scene-style-v6";

function installPhotoStyles() {
  if (document.getElementById(PHOTO_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = PHOTO_STYLE_ID;
  style.textContent = `
    #lobbyTop.lobby-hero {
      background-color: #17110d;
      background-image: var(--hero-photo) !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
      background-size: cover !important;
    }

    #lobbyTop .hero-shade {
      z-index: 1;
    }

    #lobbyTop .hero-copy {
      z-index: 2;
    }

    #lobbyTop .hero-badges {
      position: static;
      right: auto;
      bottom: auto;
      left: auto;
      margin: 18px 0 0;
    }

    #lobbyTop .hero-actions {
      margin-top: 10px;
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
      html[data-lobby-view="home"] .lobby-page .lobby-app,
      html[data-device-layout="mobile"][data-lobby-view="home"] .lobby-page .lobby-app {
        overflow-y: auto !important;
        overscroll-behavior-y: contain !important;
      }

      html[data-lobby-view="home"] .lobby-page #homeView,
      html[data-device-layout="mobile"][data-lobby-view="home"] .lobby-page #homeView {
        display: block !important;
        height: auto !important;
        min-height: 100% !important;
        overflow: visible !important;
      }

      #lobbyTop.lobby-hero {
        display: block !important;
        width: 100% !important;
        height: calc(100vw - 18px) !important;
        min-height: 0 !important;
        max-height: none !important;
        aspect-ratio: 1 / 1 !important;
        overflow: hidden !important;
        border-radius: 20px;
        background-color: #17110d !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        background-size: contain !important;
      }

      #lobbyTitle[tabindex="-1"]:focus {
        outline: none !important;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-shade {
        position: absolute;
        z-index: 1;
        inset: 0;
        background:
          linear-gradient(180deg, rgba(8, 6, 4, .92) 0%, rgba(8, 6, 4, .62) 19%, rgba(8, 6, 4, .08) 39%, rgba(8, 6, 4, .05) 64%, rgba(8, 6, 4, .62) 82%, rgba(8, 6, 4, .94) 100%),
          linear-gradient(90deg, rgba(8, 6, 4, .18), transparent 42%, transparent 72%, rgba(8, 6, 4, .14));
      }

      html[data-lobby-view="home"] #lobbyTop .hero-copy {
        position: relative !important;
        z-index: 2;
        display: flex !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        flex-direction: column !important;
        padding: 13px !important;
        overflow: hidden;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-copy .eyebrow {
        margin: 0 0 4px;
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
        color: rgba(248, 239, 220, .88);
        font-size: 9.5px;
        line-height: 1.4;
      }

      html[data-lobby-view="home"] #lobbyTop .cta-hint {
        display: block !important;
        min-height: 0;
        margin: 5px 0 0 !important;
        color: rgba(242, 213, 141, .9);
        font-size: 7.8px !important;
        font-weight: 800;
        line-height: 1.35;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-badges {
        position: static !important;
        display: grid !important;
        right: auto !important;
        bottom: auto !important;
        left: auto !important;
        grid-template-columns: 1fr !important;
        gap: 0;
        margin: auto 0 7px !important;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-badges span {
        display: none !important;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-badges span:first-child {
        display: grid !important;
        grid-template-columns: 22px minmax(0, 1fr);
        align-items: center;
        gap: 7px;
        min-width: 0;
        min-height: 32px;
        padding: 5px 8px;
        border: 1px solid rgba(242, 213, 141, .25);
        border-radius: 10px;
        background: rgba(13, 10, 7, .78);
        color: #eee2ca;
        font-size: 7.9px;
        font-weight: 850;
        line-height: 1.28;
        box-shadow: 0 7px 18px rgba(0, 0, 0, .2);
        backdrop-filter: blur(9px);
      }

      html[data-lobby-view="home"] #lobbyTop .hero-badges b {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border-radius: 7px;
        background: rgba(213, 160, 62, .2);
        color: var(--gold-2);
        font-size: 7.5px;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-actions {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px !important;
        width: 100%;
        margin: 0 !important;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-actions > * {
        width: 100% !important;
        min-width: 0 !important;
        min-height: 40px !important;
        padding: 8px 7px !important;
        overflow: hidden;
        border-radius: 12px;
        font-size: 9.3px !important;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      html[data-lobby-view="home"] .lobby-page #homeView .home-grid {
        margin-top: 8px !important;
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

    @media (max-width: 360px) {
      html[data-lobby-view="home"] #lobbyTop .hero-copy {
        padding: 11px !important;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-copy h1 {
        font-size: 25px;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-copy > p:not(.eyebrow, .cta-hint) {
        font-size: 8.8px;
      }

      html[data-lobby-view="home"] #lobbyTop .hero-actions > * {
        font-size: 8.6px !important;
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

export function installLobbyHeroScene() {
  installPhotoStyles();
  simplifyHomeScreen();
  installJarSelectionScene();

  const hero = document.getElementById("lobbyTop");
  if (!hero || hero.dataset.liveScene === "ready") return;

  hero.dataset.liveScene = "ready";
  hero.classList.remove("has-scene-art", "has-live-scene");
  hero.classList.add("has-single-photo");
  hero.style.setProperty("--hero-photo", `url("${HERO_ART_URL}")`);
}
