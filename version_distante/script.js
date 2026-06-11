// ========== VARIABLES GLOBALES ==========
let monJoueur = 0;
let codeSalon = '';
let monNom = '';
let intervalSondage = null;

// ========== ACCUEIL ==========
function creerSalon() {
  const nom = document.getElementById('nom-joueur').value.trim();
  const code = document.getElementById('code-salon').value.trim().toUpperCase();

  if (!nom || !code) {
    document.getElementById('msg-accueil').textContent = '⚠️ Remplissez tous les champs !';
    return;
  }

  ajaxPost('serveur.php?action=creer', { nom, code }, (data) => {
    if (data.succes) {
      monJoueur = 1;
      codeSalon = code;
      monNom = nom;
      document.getElementById('code-affiche').textContent = code;
      showScreen('screen-attente');
      attendreJoueur2();
    } else {
      document.getElementById('msg-accueil').textContent = '❌ ' + data.message;
    }
  });
}

function rejoindreSalon() {
  const nom = document.getElementById('nom-joueur').value.trim();
  const code = document.getElementById('code-salon').value.trim().toUpperCase();

  if (!nom || !code) {
    document.getElementById('msg-accueil').textContent = '⚠️ Remplissez tous les champs !';
    return;
  }

  ajaxPost('serveur.php?action=rejoindre', { nom, code }, (data) => {
    if (data.succes) {
      monJoueur = 2;
      codeSalon = code;
      monNom = nom;
      showScreen('screen-jeu');
      demarrerSondage();
    } else {
      document.getElementById('msg-accueil').textContent = '❌ ' + data.message;
    }
  });
}

// ========== ATTENDRE JOUEUR 2 ==========
function attendreJoueur2() {
  intervalSondage = setInterval(() => {
    ajaxGet('serveur.php?action=etat&code=' + codeSalon, (data) => {
      if (data.succes && data.partie.statut === 'en_cours') {
        clearInterval(intervalSondage);
        showScreen('screen-jeu');
        demarrerSondage();
      }
    });
  }, 2000);
}

// ========== SONDAGE ÉTAT ==========
function demarrerSondage() {
  mettreAJourEtat();
  intervalSondage = setInterval(mettreAJourEtat, 2000);
}

function mettreAJourEtat() {
  ajaxGet('serveur.php?action=etat&code=' + codeSalon, (data) => {
    if (data.succes) {
      afficherPartie(data.partie);
    }
  });
}

// ========== AFFICHER LA PARTIE ==========
function afficherPartie(partie) {
  document.getElementById('nom-j1').textContent = '👤 ' + partie.joueur1;
  document.getElementById('nom-j2').textContent = '👤 ' + (partie.joueur2 || 'En attente...');
  document.getElementById('label-j1').textContent = '👤 ' + partie.joueur1;
  document.getElementById('label-j2').textContent = '👤 ' + (partie.joueur2 || '...');

  document.getElementById('score1').textContent = partie.scores[0];
  document.getElementById('score2').textContent = partie.scores[1];

  const tourEl = document.getElementById('tourIndicator');
  if (partie.tour === monJoueur) {
    tourEl.textContent = '🎯 C\'est votre tour !';
    tourEl.style.borderColor = '#ffd700';
  } else {
    tourEl.textContent = '⏳ Tour de l\'adversaire...';
    tourEl.style.borderColor = '#888';
  }

  document.getElementById('message').textContent = partie.message || '';
  afficherPlateau(partie.plateau, partie.tour);

  if (partie.statut === 'termine') {
    clearInterval(intervalSondage);
  }
}

// ========== AFFICHER LE PLATEAU ==========
function afficherPlateau(plateau, tourActuel) {
  const rangee1 = document.getElementById('rangee1');
  const rangee2 = document.getElementById('rangee2');
  rangee1.innerHTML = '';
  rangee2.innerHTML = '';

  for (let i = 0; i <= 6; i++) {
    rangee1.appendChild(creerCase(i, 1, plateau, tourActuel));
  }
  for (let i = 13; i >= 7; i--) {
    rangee2.appendChild(creerCase(i, 2, plateau, tourActuel));
  }
}

function creerCase(index, joueur, plateau, tourActuel) {
  const div = document.createElement('div');
  div.className = `case case-joueur${joueur}`;

  if (plateau[index] === 0) div.classList.add('vide');

  const estMonCamp = joueur === monJoueur;
  const estMonTour = tourActuel === monJoueur;

  if (estMonCamp && estMonTour && plateau[index] > 0) {
    div.classList.add('mon-tour');
    div.onclick = () => jouerCoup(index);
  } else {
    div.classList.add('pas-mon-tour');
  }

  div.innerHTML = `
    <span class="graines-count">${plateau[index]}</span>
    <span class="case-numero">C${index}</span>
  `;
  return div;
}

// ========== JOUER UN COUP ==========
function jouerCoup(index) {
  ajaxPost('serveur.php?action=jouer', {
    code: codeSalon,
    joueur: monJoueur,
    index: index
  }, (data) => {
    if (data.succes) {
      afficherPartie(data.partie);
    } else {
      document.getElementById('message').textContent = '❌ ' + data.message;
    }
  });
}

// ========== QUITTER ==========
function quitterPartie() {
  clearInterval(intervalSondage);
  ajaxPost('serveur.php?action=quitter', { code: codeSalon }, () => {
    showScreen('screen-accueil');
  });
}

// ========== NAVIGATION ==========
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
}