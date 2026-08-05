import photo1 from './scene-photo/jar-photo-1.js';
import photo2 from './scene-photo/jar-photo-2.js';
import photo3 from './scene-photo/jar-photo-3.js';
import photo4 from './scene-photo/jar-photo-4.js';
import photo5 from './scene-photo/jar-photo-5.js';
import photo6 from './scene-photo/jar-photo-6.js';
import photo7 from './scene-photo/jar-photo-7.js';

const HERO_ART_URL = 'data:image/jpeg;base64,' + photo1 + photo2 + photo3 + photo4 + photo5 + photo6 + photo7;

function simplifyHomeScreen() {
  const home = document.getElementById('homeView');
  if (!home) return;
  home.querySelector('.quick-start-card')?.remove();
  home.querySelector('.research-summary')?.remove();
}

function installJarSelectionScene() {
  const trainingSection = document.getElementById('trainingSection');
  if (!trainingSection || trainingSection.querySelector('.jar-selection-scene')) return;
  const figure = document.createElement('figure');
  figure.className = 'jar-selection-scene';
  const image = document.createElement('img');
  image.src = HERO_ART_URL;
  image.alt = '물 새는 장독대와 구멍을 지키는 두꺼비';
  image.decoding = 'async';
  image.loading = 'eager';
  figure.append(image);
  const heading = trainingSection.querySelector('.section-heading');
  if (heading) heading.insertAdjacentElement('afterend', figure);
  else trainingSection.prepend(figure);
}

export function installLobbyHeroScene() {
  simplifyHomeScreen();
  installJarSelectionScene();
  const hero = document.getElementById('lobbyTop');
  if (!hero) return;
  hero.classList.remove('has-scene-art', 'has-live-scene');
  hero.classList.add('has-single-photo');
  hero.style.setProperty('--hero-photo', 'url(' + HERO_ART_URL + ')');
}
