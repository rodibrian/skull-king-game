/**
 * @file cards.js
 * @description Définition du catalogue de cartes Skull King, construction du paquet et utilitaires de main.
 * @namespace SKCards
 */
(function (window) {
  'use strict';

  /** @type {string} Chemin relatif vers le dos de carte */
  const DOS_CARTE = 'assets/img/couverture.png';

  /** @typedef {'couleur'|'pirate'|'fuite'|'skull_king'|'sirene'|'tigresse'|'kraken'|'baleine'|'butin'|'vierge'} TypeCarte */
  /** @typedef {'vert'|'violet'|'jaune'|'noir'|null} CouleurCarte */

  /**
   * @typedef {Object} CarteConfig
   * @property {string} id
   * @property {string} nom
   * @property {TypeCarte} type
   * @property {CouleurCarte} couleur
   * @property {number|null} valeur
   * @property {string} image
   * @property {string|null} pouvoir
   * @property {boolean} extension
   * @property {string} [pirateId]
   */

  /**
   * Crée une carte numérotée de couleur.
   * @param {CouleurCarte} couleur
   * @param {number} valeur
   * @param {string} prefixeDossier
   * @param {string} nomPrefixe
   * @returns {CarteConfig}
   */
  function creerCarteCouleur(couleur, valeur, prefixeDossier, nomPrefixe) {
    return {
      id: `${couleur}_${valeur}`,
      nom: `${nomPrefixe} ${valeur}`,
      type: 'couleur',
      couleur: couleur,
      valeur: valeur,
      image: `assets/img/cartes-de-couleurs/${prefixeDossier}/${valeur}.png`,
      pouvoir: null,
      extension: false
    };
  }

  /** @type {CarteConfig[]} Catalogue complet des cartes du jeu */
  const CONFIG_CARTES = [
    ...Array.from({ length: 14 }, (_, i) =>
      creerCarteCouleur('vert', i + 1, 'perroquet[vert]', 'Perroquet')
    ),
    ...Array.from({ length: 14 }, (_, i) =>
      creerCarteCouleur('violet', i + 1, 'carte-au-tresor[violet]', 'Carte au Trésor')
    ),
    ...Array.from({ length: 14 }, (_, i) =>
      creerCarteCouleur('jaune', i + 1, 'coffre[jaune]', 'Coffre')
    ),
    ...Array.from({ length: 14 }, (_, i) =>
      creerCarteCouleur('noir', i + 1, 'drapeau-pirate[noir]', 'Drapeau Pirate')
    ),
    {
      id: 'pirate_tessi',
      nom: 'Rosie la Douce',
      type: 'pirate',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/[pirate]tessi.png',
      pouvoir: 'Choisir le joueur qui commence le prochain pli.',
      extension: false,
      pirateId: 'tessi'
    },
    {
      id: 'pirate_bendt',
      nom: 'Will le Bandit',
      type: 'pirate',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/[pirate]bendt.png',
      pouvoir: 'Piocher 2 cartes et en défausser 2.',
      extension: false,
      pirateId: 'bendt'
    },
    {
      id: 'pirate_rascal',
      nom: 'Rascal le Flambeur',
      type: 'pirate',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/[pirate]rascal.png',
      pouvoir: 'Parier 0, 10 ou 20 points supplémentaires.',
      extension: false,
      pirateId: 'rascal'
    },
    {
      id: 'pirate_juanita',
      nom: 'Juanita Jade',
      type: 'pirate',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/[pirate]juanita.png',
      pouvoir: 'Regarder secrètement les cartes non distribuées.',
      extension: false,
      pirateId: 'juanita'
    },
    {
      id: 'pirate_harry',
      nom: 'Harry le Géant',
      type: 'pirate',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/[pirate]harry.png',
      pouvoir: 'Modifier sa mise de ±1 après le dernier pli.',
      extension: false,
      pirateId: 'harry'
    },
    {
      id: 'tigresse',
      nom: 'Tigresse',
      type: 'tigresse',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/tigresse.png',
      pouvoir: 'Jouée en mode Pirate ou Fuite au moment du jeu.',
      extension: false
    },
    {
      id: 'skull_king',
      nom: 'Skull King',
      type: 'skull_king',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/skull-king.png',
      pouvoir: 'Bat tous les pirates et cartes numérotées ; perd uniquement contre les Sirènes.',
      extension: false
    },
    {
      id: 'sirene_1',
      nom: 'Sirène',
      type: 'sirene',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/mermaid.png',
      pouvoir: 'Bat le Skull King et les cartes numérotées ; perd contre les pirates.',
      extension: false
    },
    {
      id: 'sirene_2',
      nom: 'Sirène',
      type: 'sirene',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/mermaid.png',
      pouvoir: 'Bat le Skull King et les cartes numérotées ; perd contre les pirates.',
      extension: false
    },
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `fuite_${i + 1}`,
      nom: 'Fuite',
      type: 'fuite',
      couleur: null,
      valeur: null,
      image: 'assets/img/cartes-speciales/escape.png',
      pouvoir: 'Perd contre toutes les autres cartes.',
      extension: false
    })),
    {
      id: 'butin_1',
      nom: 'Butin',
      type: 'butin',
      couleur: null,
      valeur: null,
      image: 'assets/img/carte-d-extensions/or.png',
      pouvoir: 'Alliance avec le gagnant du pli (+20 pts si les deux misent correctement).',
      extension: true
    },
    {
      id: 'butin_2',
      nom: 'Butin',
      type: 'butin',
      couleur: null,
      valeur: null,
      image: 'assets/img/carte-d-extensions/or.png',
      pouvoir: 'Alliance avec le gagnant du pli (+20 pts si les deux misent correctement).',
      extension: true
    },
    {
      id: 'kraken',
      nom: 'Kraken',
      type: 'kraken',
      couleur: null,
      valeur: null,
      image: 'assets/img/carte-d-extensions/kraken.png',
      pouvoir: 'Annule entièrement le pli ; personne ne le remporte.',
      extension: true
    },
    {
      id: 'baleine',
      nom: 'Baleine Blanche',
      type: 'baleine',
      couleur: null,
      valeur: null,
      image: 'assets/img/carte-d-extensions/baleine.png',
      pouvoir: 'Les spéciales sont détruites ; seule la valeur numérique compte.',
      extension: true
    },
    ...Array.from({ length: 4 }, (_, i) => ({
      id: `vierge_${i + 1}`,
      nom: 'Carte vierge',
      type: 'vierge',
      couleur: null,
      valeur: null,
      image: 'assets/img/couverture.png',
      pouvoir: null,
      extension: true
    }))
  ];

  const CARTES_PAR_ID = Object.fromEntries(CONFIG_CARTES.map((c) => [c.id, c]));

  const ORDRE_COULEURS = { vert: 0, violet: 1, jaune: 2, noir: 3 };

  const ORDRE_TYPES = {
    couleur: 0,
    fuite: 1,
    butin: 2,
    pirate: 3,
    tigresse: 4,
    skull_king: 5,
    sirene: 6,
    kraken: 7,
    baleine: 8
  };

  /**
   * Retourne la configuration d'une carte par son identifiant.
   * @param {string} id
   * @returns {CarteConfig|undefined}
   */
  function getCarteById(id) {
    return CARTES_PAR_ID[id];
  }

  /**
   * Instancie une carte jouable à partir de sa configuration.
   * @param {string} id
   * @returns {CarteConfig}
   */
  function instancierCarte(id) {
    const config = getCarteById(id);
    if (!config) {
      throw new Error(`Carte inconnue : ${id}`);
    }
    return { ...config };
  }

  /**
   * Trie une main pour l'affichage.
   * @param {CarteConfig[]} main
   * @returns {CarteConfig[]}
   */
  function trierMain(main) {
    return [...main].sort((a, b) => {
      const typeA = ORDRE_TYPES[a.type] ?? 99;
      const typeB = ORDRE_TYPES[b.type] ?? 99;
      if (typeA !== typeB) {
        return typeA - typeB;
      }
      if (a.type === 'couleur' && b.type === 'couleur') {
        const couleurA = ORDRE_COULEURS[a.couleur] ?? 99;
        const couleurB = ORDRE_COULEURS[b.couleur] ?? 99;
        if (couleurA !== couleurB) {
          return couleurA - couleurB;
        }
        return (a.valeur || 0) - (b.valeur || 0);
      }
      return a.nom.localeCompare(b.nom, 'fr');
    });
  }

  /**
   * Indique si une carte est une spéciale jouable librement.
   * @param {CarteConfig} carte
   * @returns {boolean}
   */
  function estCarteSpeciale(carte) {
    return carte.type !== 'couleur';
  }

  /**
   * Indique si la carte se comporte comme une Fuite (ouverture sans couleur fixée).
   * @param {CarteConfig} carte
   * @param {'pirate'|'fuite'|null|undefined} [modeTigresse]
   * @returns {boolean}
   */
  function estFuiteLike(carte, modeTigresse) {
    if (carte.type === 'fuite' || carte.type === 'butin') {
      return true;
    }
    if (carte.type === 'tigresse') {
      return modeTigresse === 'fuite';
    }
    return false;
  }

  /**
   * Indique si la carte ouvre un pli sans imposer de couleur à suivre.
   * @param {CarteConfig} carte
   * @param {'pirate'|'fuite'|null|undefined} [modeTigresse]
   * @returns {boolean}
   */
  function estPersonnageSansCouleur(carte, modeTigresse) {
    if (carte.type === 'pirate' || carte.type === 'skull_king' || carte.type === 'sirene') {
      return true;
    }
    if (carte.type === 'kraken' || carte.type === 'baleine') {
      return true;
    }
    if (carte.type === 'tigresse' && modeTigresse === 'pirate') {
      return true;
    }
    return false;
  }

  /**
   * Retourne les cartes légales à jouer depuis une main.
   * @param {CarteConfig[]} main
   * @param {Array<{carte: CarteConfig, modeTigresse?: string}>} pliEnCours
   * @param {CouleurCarte|null} couleurASuivre
   * @returns {CarteConfig[]}
   */
  function cartesJouables(main, pliEnCours, couleurASuivre) {
    if (!main || main.length === 0) {
      return [];
    }

    if (!pliEnCours || pliEnCours.length === 0 || couleurASuivre === null) {
      return [...main];
    }

    const cartesCouleur = main.filter(
      (c) => c.type === 'couleur' && c.couleur === couleurASuivre
    );
    const cartesSpeciales = main.filter((c) => estCarteSpeciale(c) && c.type !== 'vierge');

    if (cartesCouleur.length > 0) {
      return trierMain([...cartesCouleur, ...cartesSpeciales]);
    }

    return [...main];
  }

  /**
   * @typedef {Object} ExtensionsConfig
   * @property {boolean} [butin]
   * @property {boolean} [kraken]
   * @property {boolean} [baleine]
   */

  const TYPES_HORS_PAQUET = ['vierge'];

  /**
   * Construit le paquet de jeu selon les extensions activées.
   * @param {ExtensionsConfig} [extensions={}]
   * @returns {CarteConfig[]}
   */
  function buildDeck(extensions) {
    const ext = extensions || {};

    return CONFIG_CARTES.filter((carte) => {
      if (TYPES_HORS_PAQUET.includes(carte.type)) {
        return false;
      }
      if (!carte.extension) {
        return true;
      }
      if (carte.type === 'butin') {
        return !!ext.butin;
      }
      if (carte.type === 'kraken') {
        return !!ext.kraken;
      }
      if (carte.type === 'baleine') {
        return !!ext.baleine;
      }
      return false;
    }).map((carte) => ({ ...carte }));
  }

  /**
   * Mélange un paquet (Fisher-Yates).
   * @param {CarteConfig[]} deck
   * @returns {CarteConfig[]}
   */
  function shuffleDeck(deck) {
    const paquet = [...deck];
    for (let i = paquet.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [paquet[i], paquet[j]] = [paquet[j], paquet[i]];
    }
    return paquet;
  }

  /**
   * Calcule la taille du paquet pour un jeu donné.
   * @param {ExtensionsConfig} [extensions={}]
   * @returns {number}
   */
  function taillePaquet(extensions) {
    return buildDeck(extensions).length;
  }

  window.SKCards = {
    DOS_CARTE,
    CONFIG_CARTES,
    ORDRE_COULEURS,
    getCarteById,
    instancierCarte,
    trierMain,
    cartesJouables,
    buildDeck,
    shuffleDeck,
    taillePaquet,
    estCarteSpeciale,
    estFuiteLike,
    estPersonnageSansCouleur
  };

  // Compatibilité avec les scripts existants
  window.CONFIG_CARTES = CONFIG_CARTES;
})(window);
