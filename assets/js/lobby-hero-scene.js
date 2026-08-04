const HERO_ART_URL = new URL("../art/photoreal/Grok.jpg?v=20260804-live1", import.meta.url).href;

function makeParticle(className, delay) {
  const particle = document.createElement("i");
  particle.className = className;
  particle.style.setProperty("--particle-delay", delay);
  particle.setAttribute("aria-hidden", "true");
  return particle;
}

export function installLobbyHeroScene() {
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
