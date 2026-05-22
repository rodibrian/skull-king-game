# SKULL KING — DÉVELOPPEMENT WEB COMPLET (Agent Cursor)

## IDENTITÉ & RÔLE DE L'AGENT

Tu es simultanément :
- **Développeur senior full-stack de 30 ans d'expérience** : architecture solide, code propre, maintenable, commenté, sans dette technique
- **Designer UI/UX professionnel** : chaque pixel est intentionnel, le thème pirate est immersif, les animations sont fluides et purposeful
- **Expert Skull King de 20 ans** : tu connais chaque règle par cœur, chaque cas limite, chaque subtilité stratégique

**Tu dois élaborer un plan de développement complet AVANT de coder**, puis implémenter le projet de A à Z, phase par phase, avec un niveau de professionnalisme de production commerciale.

---

## ÉTAPE 0 — PLAN OBLIGATOIRE AVANT TOUT CODE

Avant d'écrire la première ligne de code, rédige un plan structuré :
1. Architecture des fichiers
2. Ordre des dépendances (quel module dépend de quel autre)
3. Modèle de données (state global, structure des cartes, état de la partie)
4. Wireframes textuels de chaque écran principal
5. Liste exhaustive des cas limites à gérer (règles du jeu)
6. Stratégie de tests manuels

---

## CONTEXTE & OBJECTIF

Développer une version web **jouable et complète** de Skull King, fidèle à 100 % aux règles officielles (livret FR + fichier `skull_king_regles.md` fourni dans le projet). Le jeu tourne **entièrement en local**, directement en ouvrant `index.html` dans un navigateur — **aucun serveur, aucun backend, aucun build step**.

Plateformes cibles :
- **Smartphone Android (Samsung A25, 360 px)** — priorité absolue
- **Desktop (1920×1080)** — support complet

---

## STACK TECHNIQUE IMPOSÉE

| Technologie | Usage | Source |
|---|---|---|
| HTML5 | Structure des pages | — |
| CSS3 + Bootstrap 5.3 | Layout responsive | CDN |
| JavaScript ES6+ vanilla | Moteur de jeu | — |
| jQuery 3.7 | Manipulation DOM, événements | CDN |
| Animate.css 4 | Animations de cartes | CDN |
| SortableJS | Drag-and-drop de cartes | CDN |
| Google Fonts (Cinzel + Lato) | Typographie pirate | CDN |

**Interdit :** React, Vue, Angular, tout framework JS. Vanilla + jQuery uniquement.  
**Toutes les images** viennent du dossier local `assets/img/` — ne rien inventer.  
**Tous les chemins d'assets** (CSS, JS, images) doivent être **relatifs** pour fonctionner en `file://` sans serveur.

---

## STRUCTURE DU PROJET

```
skull-king/
├── index.html                  # Accueil / menu principal
├── game.html                   # Écran de jeu principal
├── rules.html                  # Guide des règles interactif
├── scores.html                 # Historique des scores
├── skull_king_regles.md        # Livret officiel (source de vérité)
│
├── css/
│   ├── style.css               # Thème global pirate (variables CSS, dark theme, dorures)
│   ├── cards.css               # Cartes : flip 3D, hover, sélection, orientation latérale
│   ├── table.css               # Table de jeu 2D : zones, positions joueurs, pli central
│   ├── animations.css          # Keyframes custom (vol de carte, brillance, Yo-ho-ho)
│   ├── scoring.css             # Tableau de score pro, badges, icônes
│   └── mobile.css              # Overrides Samsung A25 (360 px, touch targets, swipe)
│
├── js/
│   ├── main.js                 # Config globale, DEBUG flag, init, routing entre pages
│   ├── game.js                 # Machine à états : SETUP→DEAL→BID→PLAY→SCORE→NEXT/END
│   ├── cards.js                # CONFIG_CARTES, tri, filtrage, cartes jouables
│   ├── bidding.js              # Phase Yo-ho-ho : saisie, révélation simultanée, animation
│   ├── tricks.js               # resoudrePli() avec tous les cas de règles
│   ├── scoring.js              # Systèmes Skull King & Rascal + bonus + historique
│   ├── ai.js                   # IA 4 niveaux : Moussaillon / Matelot / Corsaire / Capitaine
│   ├── ui.js                   # Rendu DOM, positionnement joueurs, animations, messages
│   ├── guide.js                # Système d'aide contextuelle et tutoriel in-game
│   └── storage.js              # LocalStorage : partie en cours, historique, préférences
│
└── assets/
    ├── cartes/                 # Images de toutes les cartes (EXISTANT — ne pas modifier)
    │   └── couverture.png      # Dos de carte (utilisé pour piles face cachée)
    ├── img/                    # Fond marin, logo, avatars pirates, icônes
    ├── sounds/                 # Ambiance, sons de cartes, fanfare Yo-ho-ho
    └── fonts/                  # Polices préchargées si offline
```

---

## ÉTAPE 1 — SCAN OBLIGATOIRE DES ASSETS

**Avant tout code**, exécuter :
```
ls assets/img/
```

Puis construire dans `cards.js` l'objet `CONFIG_CARTES` complet avec pour chaque carte :

```javascript
{
  id: "noir_14",
  nom: "Drapeau Pirate 14",
  type: "couleur",           // couleur | pirate | fuite | skull_king | sirene | tigresse | kraken | baleine | butin | vierge
  couleur: "noir",           // vert | violet | jaune | noir | null
  valeur: 14,                // 1–14 | null
  image: "assets/img/drapeau_14.png",   // chemin RELATIF exact depuis le fichier HTML
  pouvoir: null,             // description texte du pouvoir spécial ou null
  extension: false           // true = carte d'extension (Kraken, Baleine, Butin)
}
```

Mapper **chaque fichier trouvé** dans ce dossier — ne rien ignorer, ne rien inventer.

---

## CATALOGUE COMPLET DES CARTES

### Cartes de couleur (56 cartes)
- 14× **Perroquet** (vert) — valeur 1 à 14
- 14× **Carte au trésor** (violet) — valeur 1 à 14
- 14× **Coffre** (jaune) — valeur 1 à 14
- 14× **Drapeau Pirate** (noir = ATOUT) — valeur 1 à 14

### Cartes spéciales (base)
- 5× **Pirates** : Rosie la Douce, Will le Bandit, Rascal le Flambeur, Juanita Jade, Harry le Géant
- 1× **Tigresse** (choix Pirate ou Fuite au moment du jeu)
- 1× **Skull King**
- 2× **Sirènes**
- 5× **Fuites**

### Extensions (activables séparément)
- 2× **Butin**
- 1× **Kraken**
- 1× **Baleine Blanche**

### Utilitaires
- 4× **Cartes Vierges** (non jouables, décoratives)

---

## TABLE DE JEU 2D — INTERFACE VISUELLE

### Concept de la table
La table de jeu est une **surface 2D professionnelle** simulant une vraie table de jeu de cartes en bois sombre avec texture, éclairage doux depuis le centre, et léger vignettage sur les bords. Inspiration : Hearthstone, Legends of Runeterra, Tabletop Simulator.

### Positionnement des joueurs autour de la table

```
          ┌──────────────────────────────────────┐
          │    JOUEUR 3          JOUEUR 4         │  ← cartes orientées vers le bas (face à nous)
          │  [█][█][█][█]      [█][█][█][█]      │
          │                                        │
JOUEUR 2  │         ┌──────────────┐              │  JOUEUR 5
[█]       │         │   PLI EN     │              │  [█]
[█]  ←    │         │   COURS      │              │  → ← cartes verticales, tournées vers le centre
[█]       │         │  (centre)    │              │  [█]
[█]       │         └──────────────┘              │
          │                                        │
          │    JOUEUR 8          JOUEUR 7         │
          │  [█][█][█][█]      [█][█][█][█]      │
          ├──────────────────────────────────────┤
          │         JOUEUR HUMAIN (vous)           │  ← cartes horizontales face visible
          │   [carte1][carte2][carte3][carte4]     │
          └──────────────────────────────────────┘
```

**Règles d'orientation des cartes selon la position :**
- **Bas (joueur humain)** : cartes horizontales, face visible, légèrement surélevées
- **Haut** : cartes horizontales, dos visible (face cachée), retournées
- **Gauche** : cartes **pivotées à 90° dans le sens antihoraire**, dos visible
- **Droite** : cartes **pivotées à 90° dans le sens horaire**, dos visible
- **Le dos de carte** = `assets/img/couverture.png` utilisé systématiquement
- Les **piles de cartes en main** des adversaires sont **superposées en éventail** avec léger décalage (effet pile de cartes réaliste)

### Zone centrale — Pli en cours
- Zone circulaire ou octogonale au centre de la table
- Chaque carte jouée "vole" depuis la main du joueur vers le centre (animation CSS)
- La carte du joueur gagnant est mise en évidence (lueur dorée + légère pulsation)
- Après résolution : les cartes se "raclent" vers le gagnant avec animation

### Animations de cartes (détail)

| Action | Animation |
|---|---|
| Jouer une carte | Translation + rotation légère vers le centre, 300ms ease-out |
| Gagner le pli | Lueur dorée sur toutes les cartes, puis elles "sautent" vers le gagnant |
| Distribuer les cartes | Les cartes volent depuis un deck central vers chaque joueur, one by one |
| Retourner sa mise | Flip 3D (CSS rotateY 180°) avec délai par joueur pour effet "simultané" |
| Carte jouable (hover) | Élévation de 8px, bordure dorée, légère ombre |
| Carte non jouable | Opacité 0.5, curseur interdit, pas de hover |
| Skull King capture | Flash rouge + son + animation spéciale |
| Sirène capture SK | Flash cyan + animation tourbillon |

---

## SYSTÈME DE GUIDE & INSTRUCTIONS IN-GAME

### Philosophie
Le jeu doit être **auto-suffisant** : un joueur qui n'a jamais joué à Skull King doit pouvoir apprendre en jouant, grâce aux aides contextuelles.

### Composantes du guide

#### 1. Tutoriel interactif (première partie)
- Proposition automatique au premier lancement
- Overlay pas-à-pas sur chaque phase du jeu
- Flèches et highlights sur les éléments UI concernés
- Texte explicatif clair avec exemples visuels

#### 2. Page Règles complète (`rules.html`)
- Reprend intégralement le contenu de `skull_king_regles.md`
- Navigation par sections (accordéon)
- Tableaux des hiérarchies de cartes avec illustrations
- Exemples de calculs de score
- Cas spéciaux (Kraken, Baleine, Butin) avec exemples visuels
- Consultable depuis le jeu sans perdre la partie

#### 3. Aide contextuelle in-game (icône `?`)
- Disponible à chaque phase de jeu
- Contenu adapté à la situation actuelle :
  - Phase de mise : "Combien de plis pensez-vous gagner ?"
  - Phase de jeu : "Vous devez suivre la couleur [X] si vous en avez"
  - Résolution spéciale : explication du pouvoir du Kraken/Baleine en temps réel

#### 4. Tooltips sur les cartes
- Au survol (desktop) ou appui long (mobile) sur une carte :
  - Nom de la carte, type, valeur
  - Pouvoir spécial si applicable
  - Force relative dans la hiérarchie actuelle du pli

#### 5. Messages contextuels flottants
- Bandeau discret en haut ou bas de l'écran pour expliquer ce qui vient de se passer :
  - "La Sirène a battu le Skull King ! +40 points bonus"
  - "Le Kraken a détruit le pli ! Personne ne marque."
  - "Mise parfaite ! +20 pts × 3 plis = +60 pts"
  - "Tigresse jouée en mode Pirate par [Nom]"

#### 6. Indicateur de légalité des cartes
- Cartes jouables : **bordure verte** + légère lueur
- Cartes illégales (couleur à suivre non respectée) : **grisées** + icône `🚫`
- Tooltip explicatif : "Vous devez jouer du [Violet] si vous en avez"

---

## SYSTÈME DE SCORING PROFESSIONNEL

### Tableau de score en temps réel

Le tableau de score est un élément de jeu à part entière, pas une simple liste. Il est inspiré des jeux de cartes professionnels et des apps de scoring de tournois.

#### Structure du tableau (colonnes)
```
| # | Joueur | M | F | Pts Mise | Bonus | Total Manche | 🏴‍☠️ Cumul |
```
- `#` = numéro de manche
- `M` = mise déclarée
- `F` = plis faits (en temps réel, mis à jour à chaque pli)
- `Pts Mise` = points de la mise (rouge si négatif, vert si positif)
- `Bonus` = bonus de la manche (14s capturés, captures spéciales)
- `Total Manche` = sous-total avec animation de comptage
- `Cumul` = score total avec rang et couronne si leader

#### Effets visuels du scoring
- **Mise parfaite** : cellule qui pulse en vert doré + son de pièces
- **Mise ratée** : cellule qui tremble + flash rouge + -pts en chute
- **Bonus Skull King** : icône animée du Skull King + +40 pts qui "surgit"
- **Nouveau leader** : couronne animée qui change de tête avec transition
- **Record battu** : bannière spéciale dorée

#### Détail des bonus (affiché avec icônes)
```
💰 14 Vert/Violet/Jaune capturé    +10 pts  (par carte)
⚫ 14 Noir (Atout) capturé          +20 pts
🗡️ Pirate capture Sirène            +20 pts
💀 Skull King capture Pirate        +30 pts
🧜 Sirène capture Skull King        +40 pts
📦 Alliance Butin réussie           +20 pts (×2 joueurs)
```

#### Historique des parties
- Consultable depuis `scores.html`
- Les 10 dernières parties avec :
  - Date, joueurs, variante utilisée
  - Graphique d'évolution des scores manche par manche (SVG/Canvas simple)
  - Gagnant avec sa photo/avatar
  - Bouton "Rejouer avec les mêmes paramètres"

#### Écran de fin de partie
```
╔════════════════════════════════════╗
║  🏆  CAPITAINE DES SEPT MERS  🏆   ║
║         [Nom du gagnant]           ║
║      ★ ★ ★ ★ ★   [Score]          ║
╠════════════════════════════════════╣
║  🥇 [Joueur 1]     XXX pts        ║
║  🥈 [Joueur 2]     XXX pts        ║
║  🥉 [Joueur 3]     XXX pts        ║
║  4. [Joueur 4]     XXX pts        ║
╠════════════════════════════════════╣
║  [🔄 Rejouer]  [🆕 Nouveau jeu]   ║
║  [📊 Détails]  [🏠 Accueil]       ║
╚════════════════════════════════════╝
```

---

## RÈGLES DU JEU — IMPLÉMENTATION EXACTE

> **Source de vérité absolue** : lire `skull_king_regles.md` en intégralité avant d'implémenter quoi que ce soit.

### Structure d'une partie
- 10 manches (configurable)
- Manche N = N cartes par joueur
- Toutes les cartes remélangées à chaque manche
- 2 à 8 joueurs (humains et/ou IA)
- 7–8 joueurs : ajuster manches 9 et 10 pour l'équité

### Phase de mise — Yo-ho-ho
1. Distribution des cartes (animation vol depuis le deck)
2. Temps de réflexion (joueur humain consulte sa main)
3. Chaque joueur choisit sa mise secrètement
4. Animation Yo-ho-ho : 3 coups de poing sur la table animés + son + vibration mobile
5. Révélation simultanée avec flip 3D de toutes les mises
6. Mise = 10 → affichée comme "10" avec deux jetons visuels superposés

### Hiérarchie des cartes (force croissante)

```
Fuite / Tigresse-fuite
< Couleurs classiques (vert, violet, jaune) — valeur la plus haute gagne
< Noir/Atout (Drapeau Pirate) — bat toutes les couleurs classiques
< Pirates × 5 + Tigresse-pirate — battent tous les numérotés
< Skull King — bat tous les pirates (sauf Sirène)
< Sirènes — battent Skull King UNIQUEMENT
```

### Fonction resoudrePli() — Tous les cas

```javascript
/**
 * Résout un pli et retourne l'index du joueur gagnant.
 * @param {Array} cartesPli - [{joueurIndex, carte, modetigresse?}]
 * @returns {number} index du gagnant (ou -1 si pli détruit)
 */
function resoudrePli(cartesPli) {
  // Cas 1 : Kraken présent → pli détruit, retourner le joueur qui AURAIT gagné
  // Cas 2 : Baleine blanche présente → ignorer les spéciales, valeur pure
  // Cas 3 : Kraken + Baleine → la DEUXIÈME jouée l'emporte
  // Cas 4 : Sirène présente → bat Skull King
  // Cas 5 : Skull King présent → bat tous les pirates
  // Cas 6 : Pirates présents → le PREMIER joué gagne (ordre de jeu)
  // Cas 7 : Deux Sirènes → la PREMIÈRE jouée gagne
  // Cas 8 : Atout noir joué → le plus haut atout gagne
  // Cas 9 : Couleur de départ jouée → la plus haute de cette couleur
  // Cas 10 : Tous Fuites (+ Butin éventuel) → le PREMIER joué gagne
  // Cas 11 : Tigresse → appliquer le mode choisi par le joueur
}
```

### Règle de suivre la couleur
- Carte numérotée ouvre le pli → les autres **doivent** jouer cette couleur s'ils en ont
- Cartes spéciales (sans numéro) : jouables **librement** à tout moment
- Spéciale ouvre le pli → **aucune couleur obligatoire**

### Tigresse
- Au moment de jouer : modale de choix "🗡️ Pirate" ou "🏃 Fuite"
- Elle adopte **toutes** les caractéristiques du rôle choisi
- Si jouée en Fuite sur un pli de couleur : pas besoin d'avoir cette couleur

### Cas : Fuite/Butin ouvre le pli
- C'est le **joueur suivant** qui détermine la couleur à suivre
- Si lui aussi joue Fuite/Butin → au joueur d'après, etc.

### Extension : Kraken
- Pli entier détruit (cartes mises de côté, personne ne gagne)
- Pli suivant lancé par le joueur qui **aurait** gagné (hors Kraken)
- Afficher message animé : "LE KRAKEN A TOUT DÉTRUIT ! 🐙"

### Extension : Baleine Blanche
- Cartes spéciales dans ce pli → **détruites** (ne peuvent pas gagner)
- Cartes numérotées → perdent leur couleur, **seule la valeur compte**
- Valeur la plus haute gagne, quelle que soit la couleur
- Égalité → première carte jouée
- Si seules des spéciales → pli défaussé comme Kraken
- Pli suivant lancé par le joueur ayant joué la Baleine

### Extension : Butin
- En jouant Butin : alliance avec celui qui remporte le pli
- Si les deux misent correctement → +20 pts bonus chacun
- Si Butin ouvre + tous jouent Fuite → Butin gagne, pas d'alliance

### Pouvoirs avancés des pirates (activable)
Déclenché **uniquement** si le joueur **gagne le pli avec ce pirate** (pas s'il est juste présent) :

| Pirate | Pouvoir (déclenché si gagne avec lui) |
|---|---|
| **Rosie la Douce** | Choisit le joueur qui commence le pli suivant |
| **Will le Bandit** | Pioche 2 cartes du deck, défausse 2 cartes de sa main |
| **Rascal le Flambeur** | Parie 0, 10 ou 20 pts supplémentaires (gagné si mise correcte, perdu sinon) |
| **Juanita Jade** | Regarde secrètement les cartes non distribuées restantes |
| **Harry le Géant** | Modifie sa mise de ±1 (ou la laisse) — utilisable après le dernier pli |

---

## DÉCOMPTE DES POINTS — DEUX SYSTÈMES

### Système "Skull King" (classique)

```javascript
function calculerPointsSkullKing(mise, plisFaits, mancheNum) {
  if (mise === 0) {
    return plisFaits === 0 ? mancheNum * 10 : mancheNum * -10;
  } else {
    return plisFaits === mise ? mise * 20 : Math.abs(plisFaits - mise) * -10;
  }
}
```

### Système "Rascal" (stratégique)

```javascript
function calculerPointsRascal(mise, plisFaits, mancheNum, typeChoix) {
  const pts = mancheNum * 10;
  const ecart = Math.abs(mise - plisFaits);
  if (typeChoix === "boulet") {
    return ecart === 0 ? mancheNum * 15 : 0;
  }
  // Chevrotine (défaut)
  if (ecart === 0) return pts;
  if (ecart === 1) return Math.floor(pts / 2);
  return 0;
}
```

### Bonus (les deux systèmes)

```javascript
// Par carte 14 remportée dans un pli gagné :
// +10 pts par 14 de couleur classique (vert, violet, jaune)
// +20 pts pour le 14 noir

// Captures spéciales dans un pli gagné :
// Pirate capture Sirène      → +20 pts vainqueur
// Skull King capture Pirate  → +30 pts vainqueur
// Sirène capture Skull King  → +40 pts vainqueur

// Mode Rascal : bonus × 1 (exact), × 0.5 (écart 1), × 0 (raté)
```

---

## MODE 2 JOUEURS — BARBE GRISE

- 3 paquets mélangés
- Barbe Grise = fantôme (pas de mise, pas de score, pas de contrainte de couleur)
- Joue **toujours en 2ème position**
- Sa carte = carte du dessus de son paquet, retournée automatiquement
- Si Tigresse dans son paquet → jouée en "Fuite" automatiquement
- Si Barbe Grise gagne → commence le pli suivant
- Sinon → toujours en 2ème

---

## INTELLIGENCE ARTIFICIELLE — 4 NIVEAUX

### Niveau 1 : Moussaillon 🦜
- Mise aléatoire (entre 0 et N)
- Joue aléatoirement parmi les cartes légales
- Ne comprend pas les combinaisons spéciales
- Parfait pour les enfants ou les débutants absolus

### Niveau 2 : Matelot ⚓
- Mise basée sur le comptage simple des cartes fortes (atouts ≥ 10, pirates)
- Respecte les priorités de couleur
- Joue une Fuite si ne peut pas/veut pas gagner
- Utilise Tigresse en "Pirate" si la main est forte

### Niveau 3 : Corsaire 🗡️
- Compte les cartes jouées au fil des plis (mémoire partielle)
- Adapte sa stratégie en cours de manche
- Optimise la capture des bonus (14s, captures spéciales)
- Gère le Skull King et les Sirènes stratégiquement
- Mise ajustée en fonction du contexte (cartes déjà jouées)

### Niveau 4 : Capitaine 💀 (Expert)
- Mémoire complète : suit toutes les cartes jouées
- Analyse probabiliste : calcule la probabilité de gagner chaque pli
- Optimise l'ordre de jeu pour maximiser les bonus
- Anticipe les coups adverses (déduit les mains selon les mises déclarées)
- Utilise chaque pouvoir de pirate de manière optimale
- Gère les alliances Butin
- Adapte la stratégie selon le score global (attaque/défense selon l'écart de points)

### Interface IA
- Chaque joueur IA a un **avatar pirate unique** et un **nom thématique**
- Une **bulle de réflexion animée** (...)  apparaît pendant 0.5–1.5s avant de jouer
- Le délai varie selon le niveau (Capitaine "réfléchit" plus longtemps)
- Un commentaire textuel aléatoire apparaît parfois ("Bien joué !", "Haha !")

---

## VARIANTES DE DISTRIBUTION

| Variante | Configuration | Bouton |
|---|---|---|
| **Standard** | 10 manches, 1 à 10 cartes | Défaut |
| **Pas d'impair** | 2×2, 2×4, 2×6, 2×8, 2×10 | Toggle |
| **Prêt au combat** | 5 manches : 6,7,8,9,10 | Toggle |
| **Attaque éclair** | 5 manches de 5 | Toggle |
| **Tir de barrage** | 10 manches de 10 | Toggle |
| **Tourbillon** | 2×9, 2×7, 2×5, 2×3, 2×1 | Toggle |
| **L'heure du dodo** | 1 manche, 1 carte | Toggle |
| **Personnalisé** | Libre (nb manches + cartes par manche) | Input |

---

## INTERFACE UTILISATEUR — SPÉCIFICATIONS DÉTAILLÉES

### Variables CSS globales (style.css)
```css
:root {
  --bg-table:     #1a1208;
  --bg-felt:      #0d3b1e;
  --gold-primary: #d4a017;
  --gold-bright:  #f5c842;
  --gold-shadow:  #8b6900;
  --card-border:  #c8a84b;
  --text-primary: #f0e6c8;
  --text-muted:   #a89070;
  --danger:       #c0392b;
  --success:      #27ae60;
  --info:         #2980b9;
  --radius-card:  8px;
  --shadow-card:  0 4px 15px rgba(0,0,0,0.6);
  --font-title:   'Cinzel', serif;
  --font-body:    'Lato', sans-serif;
}
```

### Page d'accueil (index.html)
- Logo Skull King animé à l'entrée (fade-in + scale)
- Fond : image de mer nocturne avec brume animée (CSS)
- Boutons principaux avec icônes pirates :
  - `⚔️ Nouvelle Partie`
  - `🔄 Reprendre la partie`
  - `📖 Règles du jeu`
  - `🏆 Scores & Historique`
- Clic "Reprendre" désactivé (grisé) si aucune sauvegarde

### Écran de configuration (modal Bootstrap)
1. **Joueurs** : 2 à 8, toggle Humain 👤 / IA 🤖 par slot, nom éditable, niveau IA si IA
2. **Extensions** : checkboxes visuelles avec icône + description courte + badge "Extension"
3. **Système de score** : radio Skull King / Rascal, sous-option Chevrotine/Boulet si Rascal
4. **Variante de distribution** : sélecteur avec prévisualisation du nombre de manches
5. **Pouvoirs avancés** : toggle avec description de chaque pirate
6. **Bouton** : `🏴‍☠️ Yo-ho-ho ! Commençons !` (désactivé si < 2 joueurs configurés)

### Écran de jeu (game.html) — Layout Mobile First

```
┌─────────────────────────────┐  360px
│ 🏴‍☠️ Skull King  M.3/10  [?]⚙🔊│  ← header fixe 50px
├─────────────────────────────┤
│  ┌──────[J3]──────┐         │
│  │ [▓][▓][▓] pile │  [J4]  │  ← adversaires en haut
│  └────────────────┘         │
│ [J2]                  [J5]  │  ← adversaires côtés (cartes verticales)
│  │                     │    │
│  │    ┌──────────┐     │    │
│  │    │  PLI EN  │     │    │  ← zone centrale
│  │    │  COURS   │     │    │
│  │    └──────────┘     │    │
│ [J8]                  [J7]  │
│  │                     │    │
│  └──────[J6]──────┘         │
├─────────────────────────────┤
│  Mise: 2/3 plis ✅          │  ← infos joueur humain
│ ──────────────────────────  │
│ [🃏1][🃏2][🃏3][🃏4][🃏5]  │  ← main joueur (scrollable)
│ ────────────────────────── │
│        [JOUER LA CARTE]     │  ← bouton action contextuel
└─────────────────────────────┘
```

### Responsivité

| Écran | Layout |
|---|---|
| 360px (mobile portrait) | Empilement vertical, cartes scrollables, touch optimisé |
| 576px (mobile large) | Légèrement plus d'espace, même structure |
| 768px (tablette) | Table centrée, plus de place pour les cartes adversaires |
| 1024px+ (desktop) | Table de jeu complète, toutes les zones visibles sans scroll |
| 1440px+ | Marges latérales, table centrée, taille de cartes maximale |

### Touch & Mobile (Samsung A25)
- Touch targets minimum **48×48px**
- Swipe horizontal sur la main pour parcourir les cartes
- **Tap** sur une carte = sélection (bordure dorée)
- **Double-tap** ou bouton **[Jouer]** = confirmer le jeu
- **Appui long** (500ms) = afficher le tooltip de la carte
- Vibration API : 
  - Coup Yo-ho-ho : `navigator.vibrate([100, 50, 100, 50, 100])`
  - Gain pli : `navigator.vibrate([200])`
  - Pénalité : `navigator.vibrate([50, 30, 50])`

---

## SAUVEGARDE & PERSISTANCE (LocalStorage)

```javascript
// Clés utilisées
const STORAGE = {
  PARTIE_EN_COURS: 'sk_game_state',      // état complet JSON
  HISTORIQUE:      'sk_score_history',    // tableau des 10 dernières parties
  PREFERENCES:     'sk_preferences',      // config par défaut joueurs, extensions
  FIRST_LAUNCH:    'sk_first_launch',     // booléen pour le tutoriel
};

// Auto-save après CHAQUE pli terminé
// Sauvegarde complète : état de la manche, scores cumulés, ordre de jeu, mises
// Reprise : restaure exactement là où on en était (y compris phase de jeu)
```

---

## SONS (tous désactivables via `🔊/🔇`)

| Son | Déclencheur |
|---|---|
| Ambiance marine | En boucle, volume 20% |
| Carte jouée | Chaque carte posée sur la table |
| Yo-ho-ho | Compte à rebours des mises (3 frappes) |
| Victoire de pli | Le gagnant ramasse les cartes |
| Bonus capturé | SK capture pirate, sirène capture SK, etc. |
| Kraken | Son de tentacules + eau |
| Baleine | Son de baleine + vague |
| Fin de manche | Fanfare courte |
| Fin de partie | Fanfare complète + cris de pirates |
| Pénalité | Son de raté / grognement |

---

## CAS LIMITES — LISTE EXHAUSTIVE À GÉRER

1. **Joueur humain joue une carte illégale** → blocage visuel + message explicatif
2. **Toutes les cartes du pli sont des Fuites** → premier joué gagne, même le Butin
3. **Deux Sirènes dans le même pli sans SK** → première jouée gagne
4. **Pirate + Sirène + SK dans le même pli** → Sirène gagne toujours
5. **Kraken + Baleine dans le même pli** → deuxième jouée applique sa règle
6. **Baleine avec uniquement des cartes spéciales** → pli défaussé
7. **Tigresse jouée en Fuite sur une couleur dominante** → légale même sans avoir la couleur
8. **Tigresse jouée par Barbe Grise** → automatiquement Fuite
9. **Harry le Géant modifie sa mise après le dernier pli** → mise ±1, recalcul du score
10. **Rascal le Flambeur parie 0/10/20 puis rate sa mise** → perte du bonus pari
11. **Alliance Butin : l'un des deux rate sa mise** → aucun des deux ne touche le bonus
12. **Deck vide pendant le pouvoir de Will le Bandit** → piocher ce qui reste
13. **Juanita Jade : pas de cartes non distribuées** → pouvoir sans effet, message
14. **Manche 1 : 1 seule carte par joueur** → pas de choix, juste "suivre" ou "spéciale"
15. **7-8 joueurs manches 9-10** → ajuster le nombre de cartes pour équité
16. **Score Rascal "boulet" exactement à 0 plis avec mise 0** → cas particulier selon règles
17. **Plusieurs joueurs à égalité en fin de partie** → afficher ex-aequo sur le podium
18. **Déconnexion / fermeture pendant le jeu** → reprise automatique à l'ouverture suivante

---

## ORDRE DE DÉVELOPPEMENT — PHASES

### Phase 0 — Analyse (avant tout code)
- [ ] Lire `skull_king_regles.md` intégralement
- [ ] Scanner `assets/img/` et mapper toutes les images
- [ ] Valider le plan d'architecture
- [ ] Définir le modèle de données complet (state object)

### Phase 1 — Fondations
- [ ] Structure HTML des 4 pages (index, game, rules, scores)
- [ ] `style.css` : thème pirate complet, variables CSS, typographie
- [ ] `cards.css` : flip 3D, orientations (horizontal/vertical), hover, sélection
- [ ] `table.css` : layout de la table de jeu, zones par joueur
- [ ] `cards.js` : CONFIG_CARTES complet mappé depuis les images scannées

### Phase 2 — Moteur de jeu
- [ ] `game.js` : machine à états complète
- [ ] `tricks.js` : `resoudrePli()` avec tous les cas listés ci-dessus
- [ ] `scoring.js` : deux systèmes + bonus complets
- [ ] Tests unitaires manuels de toutes les combinaisons de règles

### Phase 3 — Interface principale
- [ ] `ui.js` : rendu complet de la table de jeu
- [ ] Positionnement dynamique des joueurs (2 à 8) autour de la table
- [ ] Cartes orientées selon la position (haut/bas/gauche/droite)
- [ ] `animations.css` : vol de cartes, victoire de pli, distribution
- [ ] `bidding.js` : animation Yo-ho-ho complète

### Phase 4 — Scoring & Guide
- [ ] Tableau de score professionnel avec animations
- [ ] Page `scores.html` avec historique et graphiques
- [ ] Écran de fin de partie avec podium animé
- [ ] `guide.js` : tutoriel + aide contextuelle + tooltips
- [ ] Page `rules.html` depuis `skull_king_regles.md`

### Phase 5 — IA & Modes spéciaux
- [ ] `ai.js` : 4 niveaux complets (Moussaillon → Capitaine)
- [ ] Mode Barbe Grise (2 joueurs)
- [ ] Pouvoirs avancés des pirates (si activés)
- [ ] Extensions : Kraken, Baleine, Butin

### Phase 6 — Polish & Accessibilité
- [ ] `mobile.css` : optimisations Samsung A25, swipe, touch targets
- [ ] Sons : intégration + toggle
- [ ] `storage.js` : sauvegarde complète + reprise
- [ ] Gestion de tous les cas limites listés
- [ ] Tests sur mobile réel (360px, `file://`)
- [ ] `animations.css` : respect de `prefers-reduced-motion`
- [ ] Service worker (optionnel) pour mode hors-ligne

---

## CONTRAINTES ABSOLUES — LISTE DE VÉRIFICATION FINALE

- [ ] **Zéro backend** : fonctionne avec `double-clic sur index.html`
- [ ] **Zéro framework JS** : vanilla + jQuery uniquement
- [ ] **Tous les chemins d'assets sont relatifs** (pas de `/` absolu, pas de `http://localhost`)
- [ ] **Toutes les images viennent de `assets/img/`** (aucune image inventée)
- [ ] **Code commenté en français** avec JSDoc pour les fonctions complexes
- [ ] **`DEBUG = false`** en production (un flag dans `main.js` active/désactive les `console.log`)
- [ ] **Responsive validé à 360px** (Samsung A25, portrait)
- [ ] **Responsive validé à 1920px** (desktop)
- [ ] **Règles conformes à `skull_king_regles.md`** — chaque règle a un test manuel
- [ ] **Tous les cas limites** de la liste ci-dessus sont gérés avec un message clair
- [ ] **Sauvegarde fonctionnelle** : fermer et rouvrir reprend la partie exactement
- [ ] **IA niveau Capitaine** constitue un vrai challenge pour un joueur expérimenté

---

## LIVRABLES FINAUX

À la fin de l'implémentation, le jeu doit permettre de :

1. ✅ Configurer une partie complète (joueurs, extensions, variante, niveau IA)
2. ✅ Jouer une partie de A à Z avec les deux systèmes de score
3. ✅ Utiliser toutes les cartes spéciales (base + extensions activées)
4. ✅ Voir toutes les règles et recevoir une aide contextuelle pendant le jeu
5. ✅ Sauvegarder et reprendre une partie interrompue
6. ✅ Consulter l'historique des 10 dernières parties avec graphiques
7. ✅ Jouer confortablement sur Samsung A25 (360px, portrait, `file://`)
8. ✅ Jouer confortablement sur desktop (1920px)
9. ✅ Affronter une IA représentant un vrai défi au niveau Capitaine
10. ✅ Voir un scoring professionnel avec animations, icônes, détails et historique

---

*Commencer par : lire `skull_king_regles.md` en entier, puis `ls assets/img/`, puis élaborer le plan complet, puis coder.*