\# SKULL KING — DÉVELOPPEMENT WEB COMPLET (Agent Cursor)



\## CONTEXTE \& RÔLE

Tu es un développeur front-end expert et maître du jeu Skull King. Tu dois développer une version web jouable et complète de Skull King, fidèle à 100% aux règles officielles du livret de règles (version française). Le jeu doit fonctionner en local (pas de backend), être mobile-first pour Samsung A25, et aussi parfait sur desktop.



\---



\## STACK TECHNIQUE IMPOSÉE

\- HTML5 (index.html unique ou multi-pages liées)

\- CSS3 + Bootstrap 5.3 (CDN)

\- JavaScript ES6+ vanilla + jQuery 3.7 (CDN)

\- Animate.css (CDN) pour les animations de cartes

\- SortableJS (CDN) si besoin pour drag-and-drop des cartes

\- Google Fonts : "Cinzel" (titres pirates) + "Lato" (texte)

\- Pas de framework JS (pas de React/Vue) — vanilla + jQuery uniquement

\- Toutes les ressources en CDN sauf les images des cartes (dossier local /cartes/)

\- Responsive : breakpoints Bootstrap (xs, sm, md, lg)

\- Thème visuel : pirate/aventure, dark theme avec dorures



\---



\## STRUCTURE DU PROJET À CRÉER



```

skull-king/

├── index.html               # Page d'accueil / menu principal

├── game.html                # Page de jeu principale

├── css/

│   ├── style.css            # Styles globaux + thème pirate

│   ├── cards.css            # Styles des cartes (flip, hover, sélection)

│   └── mobile.css           # Overrides mobile Samsung A25 (360px+)

├── js/

│   ├── main.js              # Init, navigation, config globale

│   ├── game.js              # Moteur principal du jeu (state machine)

│   ├── cards.js             # Logique des cartes (valeurs, pouvoirs, priorités)

│   ├── bidding.js           # Phase de mise (Yo-ho-ho)

│   ├── tricks.js            # Résolution des plis (qui gagne)

│   ├── scoring.js           # Décompte des points (Skull King + Rascal)

│   ├── ai.js                # IA des joueurs CPU

│   ├── ui.js                # Rendu UI, animations, DOM manipulation

│   └── storage.js           # LocalStorage : sauvegarde scores/config

├── cartes/                  # (EXISTANT) Images des cartes du jeu

│   └── \[toutes les cartes]

└── assets/

&#x20;   ├── sounds/              # Sons optionnels (splash, fanfare)

&#x20;   └── img/                 # Fond marin, logo, icônes pirates

```



\---



\## LECTURE DU DOSSIER /cartes/ — ÉTAPE OBLIGATOIRE



\*\*AVANT TOUT CODE\*\*, scanne le dossier /cartes/ et liste tous les fichiers images. Déduis automatiquement la convention de nommage (ex: pirate\_1.png, fuite\_3.jpg, skull\_king.png, sirene\_1.png, etc.) et mappe-les dans cards.js dans un objet CONFIG\_CARTES avec pour chaque carte :

\- id unique

\- nom français

\- type (couleur | pirate | fuite | skull\_king | sirene | tigresse | kraken | baleine | butin | vierge)

\- couleur si applicable (vert | violet | jaune | noir)

\- valeur si applicable (1–14)

\- chemin image relatif (cartes/nom\_du\_fichier.ext)

\- pouvoir spécial si applicable



\---



\## CATALOGUE COMPLET DES CARTES (à mapper depuis /cartes/)



\### Cartes de couleur (56 cartes numérotées 1–14)

\- 14x Perroquet (vert) — valeur 1 à 14

\- 14x Carte au trésor (violet) — valeur 1 à 14

\- 14x Coffre (jaune) — valeur 1 à 14

\- 14x Drapeau pirate (noir = ATOUT) — valeur 1 à 14



\### Cartes spéciales (base)

\- 5x Pirate (personnages : Rosie la Douce, Will le Bandit, Rascal le Flambeur, Juanita Jade, Harry le Géant)

\- 1x Tigresse

\- 1x Skull King

\- 2x Sirène

\- 5x Fuite



\### Cartes d'extension (optionnelles)

\- 2x Butin

\- 1x Kraken

\- 1x Baleine blanche



\### Cartes utilitaires

\- 4x Carte vierge (non jouables, décoratives)



\---



\## RÈGLES DU JEU — IMPLÉMENTATION EXACTE



\### 1. STRUCTURE DE LA PARTIE

\- 10 manches (configurable via règles avancées)

\- Manche N = N cartes distribuées à chaque joueur

\- Toutes les cartes remélangées à chaque manche (y compris celles jouées)

\- 2 à 8 joueurs (humains et/ou IA)

\- Pour 7–8 joueurs : ajuster les manches 9 et 10 pour équité du nombre de cartes



\### 2. PHASE DE MISE

\- Tous les joueurs regardent leurs cartes

\- Révélation simultanée : animation "Yo-ho-ho" avec compte à rebours (3 frappes)

\- Chaque joueur révèle sa mise simultanément (0 à N)

\- Affichage des rappels de mises (cartes visuelles superposées)

\- Mise sur 10 : deux cartes faces cachées



\### 3. HIÉRARCHIE DES CARTES (ordre de force croissant)

```

Fuite / Tigresse-fuite

< Cartes numérotées classiques (vert, violet, jaune) — plus haute valeur l'emporte

< Cartes noires (atout, Drapeau pirate) — battent toutes les couleurs classiques

< Piratesx5 + Tigresse-pirate — battent toutes les cartes numérotées

< Skull King — bat tous les pirates (sauf Sirène)

< Sirènes — battent Skull King uniquement

```



\### 4. RÈGLES DE RÉSOLUTION D'UN PLI

Implémenter la fonction resoudrePli(cartes\[]) qui retourne l'index du gagnant :



```javascript

// Priorités strictes (du plus fort au plus faible) :

// 1. Sirène > Skull King > Pirates > Atout noir > Couleur suivie > Autres couleurs > Fuites

// 2. Si couleur de départ est jouée : la plus haute de cette couleur gagne (sauf si atout/perso joué)

// 3. Si atout joué sans couleur de départ : le plus haut atout gagne

// 4. Plusieurs pirates : le PREMIER joué gagne

// 5. Deux sirènes : la PREMIÈRE jouée gagne

// 6. Pirate + Skull King + Sirène dans même pli : la SIRÈNE gagne toujours

// 7. Tous Fuites (ou Tigresse-fuite + Butin) : la PREMIÈRE carte jouée gagne

```



\#### Règle de suivre la couleur :

\- Si carte de couleur (numérotée) ouvre le pli → les autres DOIVENT jouer cette couleur s'ils en ont

\- Les cartes spéciales (sans numéro) peuvent être jouées librement

\- Si une spéciale ouvre le pli → pas de couleur obligatoire



\#### Tigresse :

\- Au moment de jouer : le joueur choisit "Pirate" ou "Fuite"

\- Elle a alors TOUTES les caractéristiques du rôle choisi



\#### Débuter avec Fuite/Butin :

\- C'est le joueur suivant qui détermine la couleur à suivre

\- Si lui aussi joue Fuite/Butin → au joueur d'après, etc.



\#### Débuter avec un Personnage (Sirène, Pirate, Skull King, Tigresse-pirate) :

\- Aucune couleur à suivre pour ce pli

\- Chaque joueur joue ce qu'il veut



\### 5. RÈGLES EXTENSION : KRAKEN

\- Quand joué : le pli entier est DÉTRUIT (cartes mises de côté)

\- Personne ne gagne ce pli

\- Le pli suivant est lancé par le joueur qui AURAIT gagné (sans le Kraken)



\### 6. RÈGLES EXTENSION : BALEINE BLANCHE

\- Cartes spéciales dans ce pli → DÉTRUITES (ne peuvent pas gagner)

\- Cartes numérotées (atouts compris) → perdent leur couleur, seule la VALEUR compte

\- La valeur la plus haute gagne, quelle que soit la couleur

\- Égalité → première carte jouée l'emporte

\- Si seules des spéciales ont été jouées → pli défaussé comme Kraken

\- Pli suivant lancé par le joueur qui a joué la Baleine blanche



\#### Kraken vs Baleine blanche dans même pli :

\- La DEUXIÈME carte jouée l'emporte → son action s'applique



\### 7. RÈGLES EXTENSION : BUTIN

\- En jouant Butin, alliance avec le joueur qui le remportera

\- Si les deux misent correctement → +20 points bonus chacun

\- Si Butin ouvre le pli et que tous jouent des Fuites → Butin gagne, pas d'alliance



\### 8. POUVOIRS AVANCÉS DES PIRATES (optionnel, activable)

Déclenché UNIQUEMENT si le joueur gagne un pli AVEC ce pirate (le pouvoir doit être immédiatement utilisé) :



\- \*\*Rosie la Douce\*\* : Choisit n'importe quel joueur pour commencer le pli suivant

\- \*\*Will le Bandit\*\* : Piocher 2 cartes, puis défausser 2 cartes

\- \*\*Rascal le Flambeur\*\* : Parier 0, 10 ou 20 pts (gagné si mise correcte, perdu sinon)

\- \*\*Juanita Jade\*\* : Regarder secrètement les cartes non distribuées

\- \*\*Harry le Géant\*\* : Modifier sa mise de ±1 (ou la laisser) — utilisable après le dernier pli de la manche



\---



\## DÉCOMPTE DES POINTS — DEUX SYSTÈMES



\### Système "Skull King" (classique, audacieux)

```javascript

function calculerPointsSkullKing(mise, plisFaits, mancheNum) {

&#x20; if (mise === 0) {

&#x20;   if (plisFaits === 0) return mancheNum \* 10;        // Succès zéro

&#x20;   else return mancheNum \* -10;                        // Échec zéro

&#x20; } else {

&#x20;   if (plisFaits === mise) return mise \* 20;           // Mise exacte

&#x20;   else return Math.abs(plisFaits - mise) \* -10;       // Écart → pénalité

&#x20; }

}

```



\### Système "Rascal" (équilibré, stratégique)

```javascript

function calculerPointsRascal(mise, plisFaits, mancheNum, typeChoix) {

&#x20; const pointsPotentiels = mancheNum \* 10;

&#x20; const ecart = Math.abs(mise - plisFaits);

&#x20; // typeChoix: "chevrotine" (main ouverte) | "boulet" (poing fermé)

&#x20; if (typeChoix === "boulet") {

&#x20;   // Boulet de canon : 15pts/carte si exact, 0 sinon

&#x20;   return (ecart === 0) ? mancheNum \* 15 : 0;

&#x20; }

&#x20; // Chevrotine (défaut Rascal)

&#x20; if (ecart === 0) return pointsPotentiels;             // Coup direct : tout

&#x20; if (ecart === 1) return Math.floor(pointsPotentiels / 2); // Frappe à revers : moitié

&#x20; return 0;                                             // Échec cuisant : rien

}

```



\### Points bonus (s'appliquent aux deux systèmes)

```javascript

// Pour chaque carte 14 remportée dans le pli gagné :

// +10 pts par 14 de couleur classique (vert, violet, jaune)

// +20 pts pour le 14 noir (Drapeau pirate)



// Cartes Personnage capturées (dans le pli gagné) :

// Pirate capture Sirène → +20 pts pour le vainqueur du pli

// Skull King capture Pirate → +30 pts pour le vainqueur du pli

// Sirène capture Skull King → +40 pts pour le vainqueur du pli



// En mode Rascal : bonus × 1 (coup direct), bonus × 0.5 (frappe à revers), bonus × 0 (échec)

// L'ordre de jeu des cartes ne change PAS l'attribution des bonus

```



\---



\## MODE 2 JOUEURS (Barbe Grise, le fantôme)



\- 3 paquets mélangés ensemble

\- Barbe Grise = joueur IA fantôme (pas de mise, pas de score)

\- Barbe Grise joue TOUJOURS en 2ème position

\- Sa carte : retourner la carte du dessus de son paquet → ajoutée au pli

\- Barbe Grise n'est PAS obligé de suivre la couleur

\- Quand Barbe Grise gagne un pli → il commence le suivant

\- Sinon → toujours en 2ème

\- Si Tigresse dans son paquet → il la joue en "Fuite"



\---



\## RÈGLES AVANCÉES : VARIANTES DU NOMBRE DE CARTES

Permettre de choisir parmi ces configurations (ou personnalisé) :

\- \*\*Standard\*\* : 10 manches, 1 à 10 cartes (défaut)

\- \*\*Pas d'impair\*\* : 2 manches chacune de 2, 4, 6, 8, 10 cartes

\- \*\*Prêt au combat\*\* : 5 manches de 6, 7, 8, 9, 10 cartes

\- \*\*Attaque éclair\*\* : 5 manches de 5 cartes

\- \*\*Tir de barrage\*\* : 10 manches de 10 cartes

\- \*\*Tourbillon\*\* : 2 manches chacune de 9, 7, 5, 3, 1 carte(s)

\- \*\*L'heure du dodo\*\* : 1 manche, 1 carte



\---



\## INTERFACE UTILISATEUR — DÉTAILS COMPLETS



\### Page d'accueil (index.html)

\- Logo Skull King stylisé (titre avec police Cinzel, couleur dorée)

\- Fond sombre marin avec texture subtile

\- Boutons : \[Nouvelle Partie] \[Reprendre] \[Règles] \[Scores]

\- Config rapide de la partie avant de démarrer



\### Écran de configuration (modal ou page)

\- Nombre de joueurs (2–8) avec toggle Humain/IA par joueur

\- Nom de chaque joueur (éditable)

\- Système de score : Skull King | Rascal

&#x20; - Si Rascal : option Chevrotine/Boulet activable

\- Variante de cartes (coches) :

&#x20; - \[ ] Kraken

&#x20; - \[ ] Baleine blanche

&#x20; - \[ ] Cartes Butin

&#x20; - \[ ] Pouvoirs avancés des pirates

\- Nombre de manches / variante de distribution

\- Bouton \[Commencer — Yo-ho-ho!]



\### Écran de jeu principal (game.html)

Layout vertical mobile-first (360px minimum, Samsung A25) :



```

┌────────────────────────────┐

│ \[Manche 3/10]  \[Score]  \[⚙]│  ← Header compact

├────────────────────────────┤

│  Zone du pli en cours       │  ← Centre : cartes jouées

│  (cartes face visible)      │

├────────────────────────────┤

│  Infos joueurs + mises      │  ← Avatars + mises révélées

├────────────────────────────┤

│  Main du joueur humain      │  ← Cartes du joueur (scrollable)

│  \[carte1]\[carte2]\[carte3]   │

├────────────────────────────┤

│  \[Actions contextuelles]    │  ← Bouton jouer / miser / choisir

└────────────────────────────┘

```



\### Affichage des cartes

\- Chaque carte = image depuis /cartes/ avec overlay nom/valeur si petit écran

\- Cartes jouables : hover/tap → légèrement surélevée + bordure dorée

\- Cartes non jouables (mauvaise couleur, pas son tour) : grisées/désactivées

\- Animation de jeu : carte "vole" vers la zone du pli (CSS transition)

\- Animation de victoire du pli : gagnant des cartes avec effet brillance



\### Phase Yo-ho-ho (mise simultanée)

\- Compteur animé : 3 coups avec vibration (mobile)

\- Chaque joueur cache sa mise → révélation simultanée avec animation flip

\- Modal de saisie de mise : boutons 0 à N (N = nombre de cartes distribuées)



\### Tableau de score intégré

\- Fidèle à la feuille de score officielle

\- Colonnes : Manche | Cartes | Mise/Résultat | Points mise | Bonus | Total manche | Cumul

\- Ligne mise en évidence pour le joueur courant

\- Consultable à tout moment via bouton \[Score]



\### Fin de manche

\- Résumé animé : qui a gagné quoi, bonus accordés

\- Score mis à jour avec animation de comptage

\- Bouton \[Manche suivante]



\### Fin de partie

\- Podium animé (1er, 2ème, 3ème)

\- "CAPITAINE DES SEPT MERS" affiché pour le vainqueur

\- Boutons : \[Rejouer] \[Nouveau jeu] \[Voir scores]



\---



\## INTELLIGENCE ARTIFICIELLE (joueurs CPU)



Niveaux : Débutant | Intermédiaire | Capitaine



\### Stratégie IA générale

\- Analyser la main : identifier les cartes fortes (hauts atouts, pirates, Skull King)

\- Calculer une mise initiale basée sur la force estimée de la main

\- Pendant le jeu :

&#x20; - Si doit gagner un pli : jouer la carte la plus forte nécessaire (pas gaspiller)

&#x20; - Si doit perdre : jouer une Fuite ou la carte la plus faible possible

&#x20; - Tigresse : choisir "Fuite" si pas besoin de plis, "Pirate" si besoin

\- Skull King : jouer pour capturer des pirates si possiblement rentable

\- Sirène : jouer pour capturer Skull King si présent dans le pli



\---



\## ACCESSIBILITÉ ET PERFORMANCE MOBILE (Samsung A25)



\- Touch targets minimum 44px × 44px pour tous les boutons et cartes

\- Swipe horizontal pour parcourir les cartes en main

\- Tap sur carte = sélection, double-tap ou bouton \[Jouer] = confirmation

\- Animations légères (prefers-reduced-motion respecté)

\- Fonts préchargées, images en lazy loading

\- Service worker simple pour mode hors-ligne (optionnel mais recommandé)

\- Viewport : <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">

\- Rotation écran : portrait préféré, paysage supporté



\---



\## SAUVEGARDE ET PERSISTANCE



Utiliser localStorage pour :

\- Partie en cours (état complet sérialisé en JSON)

\- Historique des scores des 10 dernières parties

\- Préférences : système de score, extensions activées, noms des joueurs

\- Auto-save après chaque pli



\---



\## SONS (optionnel mais souhaitable)



\- Bruit de vague / ambiance marine en boucle (volume faible)

\- Son de carte jouée

\- Fanfare Yo-ho-ho pour les mises

\- Son de victoire de pli

\- Musique de fin de partie



Tous les sons désactivables via un bouton \[🔊/🔇] dans le header.



\---



\## ORDRE DE DÉVELOPPEMENT RECOMMANDÉ



\### Phase 1 — Fondations

1\. Scanner /cartes/ et construire CONFIG\_CARTES complet

2\. Créer index.html + game.html avec Bootstrap

3\. Implémenter css/style.css (thème pirate dark)

4\. Créer la config de partie (nombre joueurs, noms, extensions)



\### Phase 2 — Moteur de jeu

5\. cards.js : catalogue complet, fonctions de tri et filtrage

6\. game.js : machine à états (SETUP → DEAL → BID → PLAY → SCORE → NEXT/END)

7\. tricks.js : fonction resoudrePli() avec toutes les règles

8\. scoring.js : les deux systèmes + bonus



\### Phase 3 — Interface

9\. ui.js : rendu des cartes, animations, DOM updates

10\. bidding.js : phase Yo-ho-ho interactive

11\. Tableau de score live



\### Phase 4 — IA et extras

12\. ai.js : IA multi-niveaux

13\. Mode 2 joueurs avec Barbe Grise

14\. Pouvoirs avancés des pirates (si activés)

15\. Kraken + Baleine blanche (si activées)



\### Phase 5 — Polish

16\. Animations CSS (Animate.css)

17\. Sons

18\. localStorage / save

19\. Tests sur mobile Samsung A25 (360px)

20\. Optimisation performance



\---



\## CONTRAINTES ABSOLUES

\- ZÉRO dépendance backend — tout tourne en local dans le navigateur

\- Pas de React, pas de Vue, pas d'Angular — vanilla JS + jQuery uniquement

\- Bootstrap 5.3 pour le layout, pas d'autre CSS framework

\- Toutes les images viennent du dossier /cartes/ existant — ne pas inventer de cartes

\- Respect TOTAL des règles du livret Skull King (version FR)

\- Le jeu doit être JOUABLE et COMPLET, pas une maquette

\- Code commenté en français

\- Console.log de debug désactivables par un flag DEBUG = false dans main.js



\---



\## LIVRABLES ATTENDUS

À la fin de l'implémentation, le projet doit permettre de :

1\. Configurer une partie complète (joueurs, extensions, variante)

2\. Jouer une partie complète de A à Z avec les deux systèmes de score

3\. Utiliser toutes les cartes spéciales (base + extensions si activées)

4\. Sauvegarder et reprendre une partie

5\. Consulter l'historique des scores

6\. Jouer confortablement sur Samsung A25 en mode portrait



Commencer par : `ls cartes/` pour lister les images disponibles, puis construire CONFIG\_CARTES.

