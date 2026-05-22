/**
 * @file scoring.js
 * @description Calcul des points (Skull King, Rascal), bonus de manche et variantes de distribution.
 * @namespace SKScoring
 */
(function (window) {
  'use strict';

  /**
   * Presets de variantes de distribution.
   * @type {Record<string, {nom: string, manches: number[]}>}
   */
  const VARIANTES = {
    standard: {
      nom: 'Standard',
      manches: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    pasImpair: {
      nom: "Pas d'impair",
      manches: [2, 2, 4, 4, 6, 6, 8, 8, 10, 10]
    },
    pretAuCombat: {
      nom: 'Prêt au combat',
      manches: [6, 7, 8, 9, 10]
    },
    attaqueEclair: {
      nom: 'Attaque éclair',
      manches: [5, 5, 5, 5, 5]
    },
    tirDeBarrage: {
      nom: 'Tir de barrage',
      manches: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
    },
    tourbillon: {
      nom: 'Tourbillon',
      manches: [9, 9, 7, 7, 5, 5, 3, 3, 1, 1]
    },
    heureDuDodo: {
      nom: "L'heure du dodo",
      manches: [1]
    }
  };

  /**
   * Calcule le multiplicateur Rascal selon l'écart mise/résultat.
   * @param {number} ecart
   * @param {'chevrotine'|'boulet'} [typeChoix='chevrotine']
   * @returns {number}
   */
  function multiplicateurRascal(ecart, typeChoix) {
    const choix = typeChoix || 'chevrotine';

    if (choix === 'boulet') {
      return ecart === 0 ? 1 : 0;
    }

    if (ecart === 0) {
      return 1;
    }
    if (ecart === 1) {
      return 0.5;
    }
    return 0;
  }

  /**
   * Système Skull King (classique).
   * @param {number} mise
   * @param {number} plisFaits
   * @param {number} cartesManche
   * @returns {number}
   */
  function calculerPointsSkullKing(mise, plisFaits, cartesManche) {
    const m = Number(mise) || 0;
    const plis = Number(plisFaits) || 0;
    const cartes = Number(cartesManche) || 0;

    if (m === 0) {
      return plis === 0 ? cartes * 10 : cartes * -10;
    }

    if (plis === m) {
      return m * 20;
    }

    return Math.abs(plis - m) * -10;
  }

  /**
   * Système Rascal avec Chevrotine ou Boulet de canon.
   * @param {number} mise
   * @param {number} plisFaits
   * @param {number} cartesManche
   * @param {'chevrotine'|'boulet'} [typeChoix='chevrotine']
   * @returns {number}
   */
  function calculerPointsRascal(mise, plisFaits, cartesManche, typeChoix) {
    const m = Number(mise) || 0;
    const plis = Number(plisFaits) || 0;
    const cartes = Number(cartesManche) || 0;
    const choix = typeChoix || 'chevrotine';
    const ecart = Math.abs(m - plis);

    if (choix === 'boulet') {
      return ecart === 0 ? cartes * 15 : 0;
    }

    const potentiel = cartes * 10;
    const mult = multiplicateurRascal(ecart, choix);
    return Math.floor(potentiel * mult);
  }

  /**
   * Points de mise selon le système choisi.
   * @param {'skull_king'|'rascal'} systeme
   * @param {number} mise
   * @param {number} plisFaits
   * @param {number} cartesManche
   * @param {'chevrotine'|'boulet'} [typeChoix]
   * @returns {number}
   */
  function calculerPointsMise(systeme, mise, plisFaits, cartesManche, typeChoix) {
    if (systeme === 'rascal') {
      return calculerPointsRascal(mise, plisFaits, cartesManche, typeChoix);
    }
    return calculerPointsSkullKing(mise, plisFaits, cartesManche);
  }

  /**
   * Type effectif d'une entrée de pli (Tigresse incluse).
   * @param {Object} entree
   * @returns {string}
   */
  function getTypeEffectifEntree(entree) {
    if (entree.carte.type === 'tigresse') {
      return entree.modeTigresse === 'pirate' ? 'pirate' : 'fuite';
    }
    return entree.carte.type;
  }

  /**
   * Détecte les captures spéciales dans un pli gagné.
   * @param {Object} pli
   * @returns {Array<{type: string, points: number, description: string}>}
   */
  function detecterCapturesPli(pli) {
    const bonus = [];
    if (!pli || !pli.cartes || pli.cartes.length === 0) {
      return bonus;
    }

    const entreeGagnante = pli.cartes.find((e) => e.joueurIndex === pli.joueurIndex);
    if (!entreeGagnante) {
      return bonus;
    }

    const typeGagnant = getTypeEffectifEntree(entreeGagnante);
    const aSK = pli.cartes.some((e) => e.carte.type === 'skull_king');
    const nbPirates = pli.cartes.filter((e) => getTypeEffectifEntree(e) === 'pirate').length;
    const nbSirenes = pli.cartes.filter((e) => e.carte.type === 'sirene').length;

    if (typeGagnant === 'sirene' && aSK) {
      bonus.push({
        type: 'sirene_capture_sk',
        points: 40,
        description: 'Sirène capture Skull King'
      });
    }

    if (typeGagnant === 'skull_king' && nbPirates > 0) {
      bonus.push({
        type: 'sk_capture_pirate',
        points: 30 * nbPirates,
        description: `Skull King capture ${nbPirates} pirate(s)`
      });
    }

    if (typeGagnant === 'pirate' && nbSirenes > 0) {
      bonus.push({
        type: 'pirate_capture_sirene',
        points: 20 * nbSirenes,
        description: `Pirate capture ${nbSirenes} sirène(s)`
      });
    }

    pli.cartes.forEach((entree) => {
      if (entree.carte.type === 'couleur' && entree.carte.valeur === 14) {
        if (entree.carte.couleur === 'noir') {
          bonus.push({
            type: 'quatorze_noir',
            points: 20,
            description: '14 Drapeau Pirate capturé'
          });
        } else if (['vert', 'violet', 'jaune'].includes(entree.carte.couleur)) {
          bonus.push({
            type: 'quatorze_couleur',
            points: 10,
            description: `14 ${entree.carte.couleur} capturé`
          });
        }
      }
    });

    return bonus;
  }

  /**
   * Calcule tous les bonus d'une manche pour un joueur.
   * @param {Object[]} tricksGagnes
   * @param {Object} [config={}]
   * @returns {{total: number, details: Array}}
   */
  function calculerBonusManche(tricksGagnes, config) {
    const cfg = config || {};
    const plis = tricksGagnes || [];
    const details = [];
    let total = 0;

    plis.forEach((pli) => {
      const captures = detecterCapturesPli(pli);
      captures.forEach((cap) => {
        details.push(cap);
        total += cap.points;
      });

      if (pli.allianceButin && pli.joueurButin != null && cfg.joueursButin) {
        const butinJoueur = cfg.joueursButin[pli.joueurButin];
        const gagnantJoueur = cfg.joueursButin[pli.joueurIndex] || cfg;

        if (butinJoueur && gagnantJoueur) {
          const butinOk = butinJoueur.mise === butinJoueur.plisFaits;
          const gagnantOk = gagnantJoueur.mise === gagnantJoueur.plisFaits;

          if (butinOk && gagnantOk) {
            details.push({
              type: 'alliance_butin',
              points: 20,
              description: 'Alliance Butin réussie'
            });
            total += 20;
          }
        }
      }
    });

    if (cfg.systemeScore === 'rascal' && cfg.mise != null && cfg.plisFaits != null) {
      const ecart = Math.abs(cfg.mise - cfg.plisFaits);
      const mult = multiplicateurRascal(ecart, cfg.typeMiseRascal);
      if (mult < 1) {
        const brut = total;
        total = Math.floor(total * mult);
        if (brut > 0 && total !== brut) {
          details.push({
            type: 'rascal_mult_bonus',
            points: total - brut,
            description: `Bonus ajustés (×${mult})`
          });
        }
      }
    }

    return { total, details };
  }

  /**
   * Ajuste les manches pour 7–8 joueurs selon la taille du paquet.
   * @param {number[]} manches
   * @param {number} nbJoueurs
   * @param {number} taillePaquet
   * @returns {number[]}
   */
  function ajusterManchesPourJoueurs(manches, nbJoueurs, taillePaquet) {
    if (nbJoueurs < 7) {
      return [...manches];
    }
    const maxParJoueur = Math.floor(taillePaquet / nbJoueurs);
    return manches.map((cartes) => Math.min(cartes, maxParJoueur));
  }

  /**
   * Configuration complète des manches pour une variante.
   * @param {string} varianteId
   * @param {number} nbJoueurs
   * @param {number} [taillePaquet=70]
   * @returns {{nom: string, manches: number[]}}
   */
  function getVarianteConfig(varianteId, nbJoueurs, taillePaquet) {
    const ALIASES = {
      pas_impair: 'pasImpair',
      pret_combat: 'pretAuCombat',
      attaque_eclair: 'attaqueEclair',
      tir_barrage: 'tirDeBarrage',
      heure_dodo: 'heureDuDodo',
      personnalise: 'standard'
    };
    const key = ALIASES[varianteId] || varianteId;
    const preset = VARIANTES[key] || VARIANTES.standard;
    return {
      nom: preset.nom,
      manches: ajusterManchesPourJoueurs(preset.manches, nbJoueurs, taillePaquet || 70)
    };
  }

  /**
   * Pari bonus de Rascal le Flambeur.
   * @param {number} pariBonus
   * @param {boolean} miseCorrecte
   * @returns {number}
   */
  function calculerPariRascalFlambeur(pariBonus, miseCorrecte) {
    const pari = Number(pariBonus) || 0;
    if (pari === 0) {
      return 0;
    }
    return miseCorrecte ? pari : -pari;
  }

  /**
   * Score total d'une manche pour un joueur.
   * @param {Object} params
   * @returns {{pointsMise: number, bonus: number, total: number, detailsBonus: Array}}
   */
  function calculerScoreMancheJoueur(params) {
    const {
      systemeScore,
      mise,
      plisFaits,
      cartesManche,
      typeMiseRascal,
      tricksGagnes,
      configBonus,
      pariRascalFlambeur
    } = params;

    const pointsMise = calculerPointsMise(
      systemeScore,
      mise,
      plisFaits,
      cartesManche,
      typeMiseRascal
    );

    const bonusCfg = {
      ...(configBonus || {}),
      systemeScore,
      typeMiseRascal,
      mise,
      plisFaits
    };

    const { total: bonus, details: detailsBonus } = calculerBonusManche(tricksGagnes, bonusCfg);
    let total = pointsMise + bonus;

    if (pariRascalFlambeur != null) {
      total += calculerPariRascalFlambeur(pariRascalFlambeur, mise === plisFaits);
    }

    return { pointsMise, bonus, total, detailsBonus };
  }

  window.SKScoring = {
    VARIANTES,
    calculerPointsSkullKing,
    calculerPointsRascal,
    calculerPointsMise,
    calculerBonusManche,
    calculerPariRascalFlambeur,
    calculerScoreMancheJoueur,
    getVarianteConfig,
    ajusterManchesPourJoueurs,
    multiplicateurRascal
  };
})(window);
