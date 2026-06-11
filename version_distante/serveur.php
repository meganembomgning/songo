<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Fichier de stockage des parties
define('FICHIER_PARTIES', '/opt/lampp/htdocs/songo-megane/parties.json');

// Charger les parties
function chargerParties() {
    if (!file_exists(FICHIER_PARTIES)) {
        file_put_contents(FICHIER_PARTIES, json_encode([]));
        return [];
    }
    return json_decode(file_get_contents(FICHIER_PARTIES), true) ?? [];
}

// Sauvegarder les parties
function sauvegarderParties($parties) {
    file_put_contents(FICHIER_PARTIES, json_encode($parties));
}

// Récupérer l'action
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {

    // ===== CRÉER UN SALON =====
    case 'creer':
        $parties = chargerParties();
        $code = strtoupper($data['code'] ?? '');
        $nom = $data['nom'] ?? 'Joueur 1';

        if (empty($code)) {
            echo json_encode(['succes' => false, 'message' => 'Code invalide']);
            exit;
        }

        $parties[$code] = [
            'code' => $code,
            'joueur1' => $nom,
            'joueur2' => null,
            'plateau' => array_fill(0, 14, 5),
            'scores' => [0, 0],
            'tour' => 1,
            'statut' => 'attente',
            'message' => 'En attente du joueur 2...',
            'timestamp' => time()
        ];

        sauvegarderParties($parties);
        echo json_encode(['succes' => true, 'code' => $code, 'joueur' => 1]);
        break;

    // ===== REJOINDRE UN SALON =====
    case 'rejoindre':
        $parties = chargerParties();
        $code = strtoupper($data['code'] ?? '');
        $nom = $data['nom'] ?? 'Joueur 2';

        if (!isset($parties[$code])) {
            echo json_encode(['succes' => false, 'message' => 'Salon introuvable !']);
            exit;
        }
        if ($parties[$code]['joueur2'] !== null) {
            echo json_encode(['succes' => false, 'message' => 'Salon déjà complet !']);
            exit;
        }

        $parties[$code]['joueur2'] = $nom;
        $parties[$code]['statut'] = 'en_cours';
        $parties[$code]['message'] = 'La partie commence !';
        sauvegarderParties($parties);

        echo json_encode(['succes' => true, 'code' => $code, 'joueur' => 2]);
        break;

    // ===== ÉTAT DE LA PARTIE =====
    case 'etat':
        $parties = chargerParties();
        $code = strtoupper($_GET['code'] ?? '');

        if (!isset($parties[$code])) {
            echo json_encode(['succes' => false, 'message' => 'Partie introuvable']);
            exit;
        }

        echo json_encode(['succes' => true, 'partie' => $parties[$code]]);
        break;

    // ===== JOUER UN COUP =====
    case 'jouer':
        $parties = chargerParties();
        $code = strtoupper($data['code'] ?? '');
        $joueur = intval($data['joueur'] ?? 0);
        $index = intval($data['index'] ?? -1);

        if (!isset($parties[$code])) {
            echo json_encode(['succes' => false, 'message' => 'Partie introuvable']);
            exit;
        }

        $partie = &$parties[$code];

        if ($partie['tour'] !== $joueur) {
            echo json_encode(['succes' => false, 'message' => 'Ce n\'est pas votre tour !']);
            exit;
        }

        if ($partie['plateau'][$index] === 0) {
            echo json_encode(['succes' => false, 'message' => 'Case vide !']);
            exit;
        }

        // Distribution
        $plateau = $partie['plateau'];
        $graines = $plateau[$index];
        $plateau[$index] = 0;
        $pos = $index;

        while ($graines > 0) {
            $pos = prochaineCase($pos, $joueur);
            if ($pos === $index) continue;
            $plateau[$pos]++;
            $graines--;
        }

        // Capture
        $scores = $partie['scores'];
        $dansAdverse = ($joueur === 1 && $pos >= 7) || ($joueur === 2 && $pos <= 6);

        if ($dansAdverse) {
            $caseInterdite = $joueur === 1 ? 7 : 6;
            if ($pos !== $caseInterdite) {
                $p = $pos;
                while (true) {
                    if ($plateau[$p] >= 2 && $plateau[$p] <= 4 && $p !== $caseInterdite) {
                        $scores[$joueur - 1] += $plateau[$p];
                        $plateau[$p] = 0;
                        $p = $joueur === 1 ? $p - 1 : $p + 1;
                        if (($joueur === 1 && $p < 7) || ($joueur === 2 && $p > 6)) break;
                    } else {
                        break;
                    }
                }
            }
        }

        $partie['plateau'] = $plateau;
        $partie['scores'] = $scores;

        // Vérifier fin
        $message = '';
        $fin = false;
        if ($scores[0] >= 40) {
            $message = '🏆 ' . $partie['joueur1'] . ' gagne avec ' . $scores[0] . ' graines !';
            $partie['statut'] = 'termine';
            $fin = true;
        } elseif ($scores[1] >= 40) {
            $message = '🏆 ' . $partie['joueur2'] . ' gagne avec ' . $scores[1] . ' graines !';
            $partie['statut'] = 'termine';
            $fin = true;
        }

        if (!$fin) {
            $partie['tour'] = $joueur === 1 ? 2 : 1;
            $message = 'Tour du Joueur ' . $partie['tour'];
        }

        $partie['message'] = $message;
        sauvegarderParties($parties);

        echo json_encode(['succes' => true, 'partie' => $partie]);
        break;

    // ===== QUITTER =====
    case 'quitter':
        $parties = chargerParties();
        $code = strtoupper($data['code'] ?? '');
        if (isset($parties[$code])) {
            unset($parties[$code]);
            sauvegarderParties($parties);
        }
        echo json_encode(['succes' => true]);
        break;

    default:
        echo json_encode(['succes' => false, 'message' => 'Action inconnue']);
}

// ===== FONCTION PROCHAINE CASE =====
function prochaineCase($pos, $joueur) {
    if ($joueur === 1) {
        if ($pos > 0 && $pos <= 6) return $pos - 1;
        if ($pos === 0) return 7;
        if ($pos >= 7 && $pos < 13) return $pos + 1;
        if ($pos === 13) return 6;
    } else {
        if ($pos > 7 && $pos <= 13) return $pos - 1;
        if ($pos === 7) return 0;
        if ($pos >= 0 && $pos < 6) return $pos + 1;
        if ($pos === 6) return 13;
    }
    return $pos;
}
?>