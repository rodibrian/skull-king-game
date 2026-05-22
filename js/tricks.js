/**
 * @file tricks.js
 * @description Résolution des plis, couleur à suivre et légalité des cartes jouées.
 * @namespace SKTricks
 */
(function (window) {
  'use strict';

  /**
   * @typedef {Object} EntreePli
   * @property {number} joueurIndex
   * @property {Object} carte
   * @property {'pirate'|'fuite'|null|undefined} [modeTigresse]
   * @property {number} [ordre]
   */

  /**
   * @typedef {Object} ResultatPli
   * @property {number} gagnant
   * @property {boolean} pliDetruit
   * @property {number|null} [prochainMeneur]
   * @property {string|null} [raison]
   */

  /**
   * Retourne le type effectif d'une entrée (Tigresse → pirate ou fuite).
   * @param {EntreePli} entree
   * @returns {string}
   */
  function getTypeEffectif(entree) {
    if (entree.carte.type === 'tigresse') {
      return entree.modeTigresse === 'pirate' ? 'pirate' : 'fuite';
    }
    return entree.carte.type;
  }

  /**
   * Normalise les entrées du pli avec un ordre explicite.
   * @param {EntreePli[]} cartesPli
   * @returns {EntreePli[]}
   */
  function normaliserPli(cartesPli) {
    return cartesPli.map((entree, index) => ({
      ...entree,
      ordre: entree.ordre != null ? entree.ordre : index
    }));
  }

  /**
   * Filtre les entrées par type effectif.
   * @param {EntreePli[]} pli
   * @param {string|string[]} types
   * @returns {EntreePli[]}
   */
  function filtrerParType(pli, types) {
    const liste = Array.isArray(types) ? types : [types];
    return pli.filter((e) => liste.includes(getTypeEffectif(e)));
  }

  /**
   * Retourne la première entrée jouée parmi un sous-ensemble.
   * @param {EntreePli[]} entrees
   * @returns {EntreePli|null}
   */
  function premiereJouee(entrees) {
    if (!entrees.length) {
      return null;
    }
    return [...entrees].sort((a, b) => a.ordre - b.ordre)[0];
  }

  /**
   * Indique si toutes les cartes sont Fuite-like (Fuite, Butin, Tigresse-fuite).
   * @param {EntreePli[]} pli
   * @returns {boolean}
   */
  function toutesFuites(pli) {
    return pli.every((e) => {
      const type = getTypeEffectif(e);
      return type === 'fuite' || e.carte.type === 'butin';
    });
  }

  /**
   * Détermine la couleur menée dans un pli.
   * @param {EntreePli[]} cartesPli
   * @returns {string|null}
   */
  function determinerCouleurMenee(cartesPli) {
    const pli = normaliserPli(cartesPli);
    const SK = window.SKCards;

    for (const entree of [...pli].sort((a, b) => a.ordre - b.ordre)) {
      if (SK.estFuiteLike(entree.carte, entree.modeTigresse)) {
        continue;
      }
      if (SK.estPersonnageSansCouleur(entree.carte, entree.modeTigresse)) {
        return null;
      }
      if (entree.carte.type === 'couleur') {
        return entree.carte.couleur;
      }
    }

    return null;
  }

  /**
   * Résout un pli standard (sans effet Kraken/Baleine actif).
   * @param {EntreePli[]} pli
   * @param {string|null} couleurMenee
   * @returns {EntreePli|null}
   */
  function resoudrePliStandard(pli, couleurMenee) {
    if (pli.length === 0) {
      return null;
    }

    if (toutesFuites(pli)) {
      return premiereJouee(pli);
    }

    const hasSirene = filtrerParType(pli, 'sirene').length > 0;
    const hasSK = filtrerParType(pli, 'skull_king').length > 0;
    const hasPirate = filtrerParType(pli, 'pirate').length > 0;
    const sirenes = filtrerParType(pli, 'sirene');
    const pirates = filtrerParType(pli, 'pirate');
    const sk = filtrerParType(pli, 'skull_king')[0] || null;

    // Sirène + Skull King + Pirate → Sirène gagne toujours
    if (hasSirene && hasSK && hasPirate) {
      return premiereJouee(sirenes);
    }

    if (hasSirene) {
      if (hasPirate && !hasSK) {
        return premiereJouee(pirates);
      }
      return premiereJouee(sirenes);
    }

    if (hasSK) {
      return sk;
    }

    if (hasPirate) {
      return premiereJouee(pirates);
    }

    const atouts = pli.filter((e) => e.carte.type === 'couleur' && e.carte.couleur === 'noir');
    if (atouts.length > 0) {
      return atouts.reduce((best, cur) =>
        (cur.carte.valeur || 0) > (best.carte.valeur || 0) ? cur : best
      );
    }

    if (couleurMenee) {
      const couleur = pli.filter(
        (e) => e.carte.type === 'couleur' && e.carte.couleur === couleurMenee
      );
      if (couleur.length > 0) {
        return couleur.reduce((best, cur) =>
          (cur.carte.valeur || 0) > (best.carte.valeur || 0) ? cur : best
        );
      }
    }

    return premiereJouee(pli.filter((e) => getTypeEffectif(e) !== 'fuite'));
  }

  /**
   * Résout un pli sous l'effet de la Baleine blanche.
   * @param {EntreePli[]} pli
   * @param {EntreePli} entreeBaleine
   * @returns {ResultatPli}
   */
  function resoudrePliBaleine(pli, entreeBaleine) {
    const numerotees = pli.filter((e) => e.carte.type === 'couleur');

    if (numerotees.length === 0) {
      return {
        gagnant: -1,
        pliDetruit: true,
        prochainMeneur: entreeBaleine.joueurIndex,
        raison: 'baleine_sans_numerote'
      };
    }

    let gagnant = numerotees[0];
    for (const entree of numerotees) {
      const val = entree.carte.valeur || 0;
      const bestVal = gagnant.carte.valeur || 0;
      if (val > bestVal) {
        gagnant = entree;
      } else if (val === bestVal && entree.ordre < gagnant.ordre) {
        gagnant = entree;
      }
    }

    return {
      gagnant: gagnant.joueurIndex,
      pliDetruit: false,
      raison: 'baleine_valeur_pure'
    };
  }

  /**
   * Résout un pli complet en appliquant toutes les règles officielles.
   * @param {EntreePli[]} cartesPli
   * @returns {ResultatPli}
   */
  function resoudrePli(cartesPli) {
    const pli = normaliserPli(cartesPli || []);

    if (pli.length === 0) {
      return { gagnant: -1, pliDetruit: false, raison: 'pli_vide' };
    }

    const krakens = pli.filter((e) => e.carte.type === 'kraken');
    const baleines = pli.filter((e) => e.carte.type === 'baleine');
    const couleurMenee = determinerCouleurMenee(pli);

    // Kraken + Baleine : la deuxième jouée l'emporte
    if (krakens.length > 0 && baleines.length > 0) {
      const ordreKraken = premiereJouee(krakens).ordre;
      const ordreBaleine = premiereJouee(baleines).ordre;

      if (ordreKraken < ordreBaleine) {
        return resoudrePliBaleine(pli, premiereJouee(baleines));
      }

      const hypothetique = resoudrePliStandard(
        pli.filter((e) => e.carte.type !== 'kraken' && e.carte.type !== 'baleine'),
        couleurMenee
      );
      return {
        gagnant: hypothetique ? hypothetique.joueurIndex : -1,
        pliDetruit: true,
        prochainMeneur: hypothetique ? hypothetique.joueurIndex : pli[0].joueurIndex,
        raison: 'kraken_apres_baleine'
      };
    }

    if (krakens.length > 0) {
      const pliSansLeviathan = pli.filter((e) => e.carte.type !== 'kraken');
      const hypothetique = resoudrePliStandard(pliSansLeviathan, couleurMenee);
      return {
        gagnant: hypothetique ? hypothetique.joueurIndex : -1,
        pliDetruit: true,
        prochainMeneur: hypothetique ? hypothetique.joueurIndex : pli[0].joueurIndex,
        raison: 'kraken'
      };
    }

    if (baleines.length > 0) {
      return resoudrePliBaleine(pli, premiereJouee(baleines));
    }

    const gagnantEntree = resoudrePliStandard(pli, couleurMenee);
    return {
      gagnant: gagnantEntree ? gagnantEntree.joueurIndex : -1,
      pliDetruit: false,
      raison: 'standard'
    };
  }

  /**
   * Détermine la couleur à suivre pour le prochain joueur.
   * @param {EntreePli[]} cartesPli
   * @returns {string|null}
   */
  function determinerCouleurASuivre(cartesPli) {
    const pli = normaliserPli(cartesPli || []);
    const SK = window.SKCards;

    if (pli.length === 0) {
      return null;
    }

    for (const entree of [...pli].sort((a, b) => a.ordre - b.ordre)) {
      if (SK.estFuiteLike(entree.carte, entree.modeTigresse)) {
        continue;
      }
      if (SK.estPersonnageSansCouleur(entree.carte, entree.modeTigresse)) {
        return null;
      }
      if (entree.carte.type === 'couleur') {
        return entree.carte.couleur;
      }
    }

    return null;
  }

  /**
   * Indique si un personnage a ouvert le pli (aucune couleur imposée).
   * @param {EntreePli[]} cartesPli
   * @returns {boolean}
   */
  function pliSansContrainteCouleur(cartesPli) {
    const pli = normaliserPli(cartesPli || []);
    if (pli.length === 0) {
      return false;
    }
    const premiere = premiereJouee(pli);
    if (!premiere) {
      return false;
    }
    const SK = window.SKCards;
    if (SK.estPersonnageSansCouleur(premiere.carte, premiere.modeTigresse)) {
      return true;
    }
    if (premiere.carte.type === 'kraken' || premiere.carte.type === 'baleine') {
      return true;
    }
    return false;
  }

  /**
   * Vérifie si une carte peut être jouée légalement.
   * @param {Object} carte
   * @param {Object[]} main
   * @param {EntreePli[]} pliEnCours
   * @param {string|null} couleurASuivre
   * @param {Object} [options]
   * @param {'pirate'|'fuite'|null} [options.modeTigresse]
   * @param {boolean} [options.barbeGrise=false]
   * @returns {boolean}
   */
  function estCarteLegale(carte, main, pliEnCours, couleurASuivre, options) {
    const opts = options || {};
    const SK = window.SKCards;

    if (opts.barbeGrise) {
      return true;
    }

    if (!carte || carte.type === 'vierge') {
      return false;
    }

    const pli = pliEnCours || [];

    if (main && !main.some((c) => c.id === carte.id)) {
      return false;
    }

    if (pli.length === 0 || pliSansContrainteCouleur(pli)) {
      return true;
    }

    const couleur = couleurASuivre != null
      ? couleurASuivre
      : determinerCouleurASuivre(pli);

    if (couleur === null) {
      return true;
    }

    if (SK.estCarteSpeciale(carte) && carte.type !== 'vierge') {
      return true;
    }

    const possedeCouleur = main.some(
      (c) => c.type === 'couleur' && c.couleur === couleur
    );

    if (!possedeCouleur) {
      return true;
    }

    return carte.type === 'couleur' && carte.couleur === couleur;
  }

  window.SKTricks = {
    resoudrePli,
    determinerCouleurASuivre,
    determinerCouleurMenee,
    estCarteLegale,
    pliSansContrainteCouleur,
    getTypeEffectif,
    toutesFuites
  };
})(window);
