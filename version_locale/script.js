// ========== VARIABLES GLOBALES ==========
let plateau = [];
let scores = [0, 0];
let joueurActuel = 1;
let partieTerminee = false;

// ========== INITIALISATION ==========
function initJeu() {
  plateau = new Array(14).fill(5);
  scores = [0, 0];
  joueurActuel = 1;
  partieTerminee = false;
  afficherPlateau();
  afficherScores();
  setMessage("Cliquez sur une case pour jouer !");
  document.getElementById('tourIndicator').textContent = "Tour du Joueur 1";
}

// ========== AFFICHAGE DU PLATEAU ==========
function afficherPlateau() {
  const rangee1 = document.getElementById('rangee1');
  const rangee2 = document.getElementById('rangee2');
  rangee1.innerHTML = '';
  rangee2.innerHTML = '';

  // Rangée joueur 1 : cases 0 à 6
  for (let i = 0; i <= 6; i++) {
    rangee1.appendChild(creerCase(i, 1));
  }

  // Rangée joueur 2 : cases 13 à 7
  for (let i = 13; i >= 7; i--) {
    rangee2.appendChild(creerCase(i, 2));
  }
}

function creerCase(index, joueur) {
  const div = document.createElement('div');
  div.className = `case case-joueur${joueur}`;
  if (plateau[index] === 0) div.classList.add('vide');

  div.innerHTML = `
    <span class="graines-count">${plateau[index]}</span>
    <span class="case-numero">C${index}</span>
  `;

  if (!partieTerminee) {
    div.onclick = () => jouerCoup(index);
  }
  return div;
}

// ========== JOUER UN COUP ==========
function jouerCoup(index) {
  if (partieTerminee) return;

  if (joueurActuel === 1 && (index < 0 || index > 6)) {
    setMessage("Joueur 1 : choisissez une case dans votre rangée (bas) !");
    return;
  }
  if (joueurActuel === 2 && (index < 7 || index > 13)) {
    setMessage("Joueur 2 : choisissez une case dans votre rangée (haut) !");
    return;
  }
  if (plateau[index] === 0) {
    setMessage("Cette case est vide ! Choisissez une autre case.");
    return;
  }

  const dernierCase = distribuer(index);
  capturer(dernierCase);
  afficherPlateau();
  afficherScores();

  if (verifierFin()) return;
  changerTour();
}

// ========== DISTRIBUTION ==========
function distribuer(index) {
  let graines = plateau[index];
  plateau[index] = 0;
  let pos = index;

  while (graines > 0) {
    pos = prochaineCase(pos, joueurActuel);
    if (pos === index) continue;
    plateau[pos]++;
    graines--;
  }
  return pos;
}

// ========== PROCHAINE CASE ==========
function prochaineCase(pos, joueur) {
  if (joueur === 1) {
    if (pos > 0 && pos <= 6) return pos - 1;
    if (pos === 0) return 7;
    if (pos >= 7 && pos < 13) return pos + 1;
    if (pos === 13) return 6;
  } else {
    if (pos > 7 && pos <= 13) return pos - 1;
    if (pos === 7) return 0;
    if (pos >= 0 && pos < 6) return pos + 1;
    if (pos === 6) return 13;
  }
  return pos;
}

// ========== CAPTURE ==========
function capturer(dernierCase) {
  const dansAdverse = (joueurActuel === 1 && dernierCase >= 7) ||
                      (joueurActuel === 2 && dernierCase <= 6);
  if (!dansAdverse) return;

  const caseInterdite = joueurActuel === 1 ? 7 : 6;
  if (dernierCase === caseInterdite) return;

  let pos = dernierCase;
  while (true) {
    if (plateau[pos] >= 2 && plateau[pos] <= 4 && pos !== caseInterdite) {
      scores[joueurActuel - 1] += plateau[pos];
      plateau[pos] = 0;
      pos = caseAdverse(pos, joueurActuel);
      if (pos === -1) break;
    } else {
      break;
    }
  }
}

function caseAdverse(pos, joueur) {
  if (joueur === 1) {
    if (pos > 7) return pos - 1;
  } else {
    if (pos < 6) return pos + 1;
  }
  return -1;
}

// ========== CHANGER DE TOUR ==========
function changerTour() {
  joueurActuel = joueurActuel === 1 ? 2 : 1;
  document.getElementById('tourIndicator').textContent = `Tour du Joueur ${joueurActuel}`;
  setMessage(`C'est au tour du Joueur ${joueurActuel} !`);
}

// ========== FIN DE PARTIE ==========
function verifierFin() {
  if (scores[0] >= 40) {
    setMessage("Joueur 1 (SARAH) gagne avec " + scores[0] + " graines !");
    partieTerminee = true;
    return true;
  }
  if (scores[1] >= 40) {
    setMessage("Joueur 2 (AUDREY) gagne avec " + scores[1] + " graines !");
    partieTerminee = true;
    return true;
  }

  const debut = joueurActuel === 1 ? 0 : 7;
  const fin = joueurActuel === 1 ? 6 : 13;
  let peutJouer = false;
  for (let i = debut; i <= fin; i++) {
    if (plateau[i] > 0) { peutJouer = true; break; }
  }
  if (!peutJouer) {
    setMessage(`Joueur ${joueurActuel} ne peut plus jouer ! Fin de partie.`);
    partieTerminee = true;
    return true;
  }
  return false;
}

// ========== SCORES ==========
function afficherScores() {
  document.getElementById('score1').textContent = scores[0];
  document.getElementById('score2').textContent = scores[1];
}

// ========== MESSAGE ==========
function setMessage(msg) {
  document.getElementById('message').textContent = msg;
}

// ========== NAVIGATION ==========
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ========== LANCEMENT ==========
window.onload = initJeu;