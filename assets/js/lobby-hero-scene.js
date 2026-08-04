import photo1 from "./scene-photo/jar-photo-1.js";
import photo2 from "./scene-photo/jar-photo-2.js";
import photo3 from "./scene-photo/jar-photo-3.js";
import photo4 from "./scene-photo/jar-photo-4.js";
import photo5 from "./scene-photo/jar-photo-5.js";
import photo6 from "./scene-photo/jar-photo-6.js";
import photo7 from "./scene-photo/jar-photo-7.js";

const HERO_ART_URL = `data:image/jpeg;base64,${photo1}${photo2}${photo3}${photo4}${photo5}${photo6}${photo7}`;
const PHOTO_STYLE_ID = "uploaded-jar-scene-style-v2";

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
        aspect-ratio: 1 / 1;
      }
      .hero-live-scene {
        background: #1a1109;
      }
      .hero-live-scene__art {
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: 48% 58%;
        opacity: 1;
        filter: saturate(1.05) contrast(1.04) brightness(.94);
      }
      .hero-live-scene::before {
        background:
          linear-gradient(180deg, rgba(9, 7, 5, .93) 0%, rgba(9, 7, 5, .72) 39%, rgba(9, 7, 5, .20) 63%, rgba(9, 7, 5, .08) 79%, rgba(9, 7, 5, .32) 100%),
          linear-gradient(90deg, rgba(9, 7, 5, .42), transparent 76%);
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
