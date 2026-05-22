/**
 * @file ai.js
 * @description Intelligence artificielle — 4 niveaux de difficulté.
 * @namespace SKAI
 */
(function (window) {
  'use strict';

  /**
   * Compte les cartes fortes dans une main.
   * @param {Object[]} hand
   * @returns {number}
   */
  function compterForces(hand) {
    let score = 0;
    hand.forEach(function (c) {
      if (c.type === 'skull_king') score += 5;
      else if (c.type === 'sirene') score += 4;
      else if (c.type === 'pirate') score += 3;
      else if (c.type === 'tigresse') score += 2;
      else if (c.type === 'couleur' && c.couleur === 'noir' && c.valeur >= 10) score += 2;
      else if (c.type === 'couleur' && c.valeur >= 12) score += 1;
    });
    return score;
  }

  /**
   * Niveau 1 — Moussaillon : aléatoire.
   */
  function bidMoussaillon(state, playerIndex) {
    const max = window.SKGame.cardsThisRound();
    return { bid: Math.floor(Math.random() * (max + 1)) };
  }

  /**
   * Niveau 2 — Matelot : comptage simple.
   */
  function bidMatelot(state, playerIndex) {
    const hand = state.hands[playerIndex];
    const max = window.SKGame.cardsThisRound();
    let bid = Math.min(max, Math.floor(compterForces(hand) / 2) + 1);
    if (Math.random() < 0.2) bid = Math.max(0, bid - 1);
    return { bid: bid };
  }

  /**
   * Niveau 3 — Corsaire : stratégie intermédiaire.
   */
  function bidCorsaire(state, playerIndex) {
    const hand = state.hands[playerIndex];
    const max = window.SKGame.cardsThisRound();
    let bid = 0;
    hand.forEach(function (c) {
      if (c.type === 'couleur' && c.valeur >= 11) bid += 1;
      if (c.type === 'pirate' || c.type === 'skull_king') bid += 1;
      if (c.type === 'fuite') bid -= 0.3;
    });
    bid = Math.round(Math.max(0, Math.min(max, bid)));
    return { bid: bid };
  }

  /**
   * Niveau 4 — Capitaine : estimation avancée.
   */
  function bidCapitaine(state, playerIndex) {
    const hand = state.hands[playerIndex];
    const max = window.SKGame.cardsThisRound();
    let bid = compterForces(hand);
    const atouts = hand.filter(function (c) {
      return c.type === 'couleur' && c.couleur === 'noir';
    }).length;
    bid = Math.min(max, Math.max(0, Math.round(atouts * 0.5 + bid * 0.4)));
    return { bid: bid };
  }

  const BID_FNS = [bidMoussaillon, bidMoussaillon, bidMatelot, bidCorsaire, bidCapitaine];

  /**
   * Choisit une mise pour l'IA.
   * @param {Object} state
   * @param {number} playerIndex
   * @returns {{bid: number, rascalChoice?: string}}
   */
  function chooseBid(state, playerIndex) {
    const level = state.players[playerIndex].aiLevel || 2;
    const fn = BID_FNS[Math.min(4, Math.max(1, level))];
    const result = fn(state, playerIndex);
    if (state.config.scoring.system === 'rascal') {
      result.rascalChoice = Math.random() < 0.7 ? 'chevrotine' : 'boulet';
    }
    return result;
  }

  /**
   * Choisit une carte à jouer.
   * @param {Object} state
   * @param {number} playerIndex
   * @returns {{cardId: string, modeTigresse?: string}}
   */
  function chooseCard(state, playerIndex) {
    const level = state.players[playerIndex].aiLevel || 2;
    const legal = window.SKGame.getLegalCards(playerIndex);
    if (!legal.length) {
      const hand = state.hands[playerIndex];
      return { cardId: hand[0].id };
    }

    if (level === 1) {
      const c = legal[Math.floor(Math.random() * legal.length)];
      return wrapTigresse(c, level);
    }

    const pli = state.currentTrick.cards;
    const isLeading = pli.length === 0;
    const tricksWon = state.players[playerIndex].tricksWon;
    const bid = state.players[playerIndex].bid || 0;
    const wantWin = tricksWon < bid;

    if (!wantWin && level >= 2) {
      const fuites = legal.filter(function (c) {
        return c.type === 'fuite' || c.type === 'tigresse';
      });
      if (fuites.length) {
        const f = fuites[0];
        return wrapTigresse(f, level, 'fuite');
      }
      const low = legal.filter(function (c) {
        return c.type === 'couleur';
      }).sort(function (a, b) { return (a.valeur || 0) - (b.valeur || 0); });
      if (low.length) return { cardId: low[0].id };
    }

    if (wantWin && level >= 3) {
      const strong = legal.filter(function (c) {
        return c.type === 'skull_king' || c.type === 'pirate' || c.type === 'sirene' ||
          (c.type === 'couleur' && c.couleur === 'noir') ||
          (c.type === 'couleur' && c.valeur >= 12);
      });
      if (strong.length && (isLeading || Math.random() < 0.6)) {
        return wrapTigresse(strong[0], level);
      }
    }

    if (level >= 2 && isLeading) {
      const mid = legal.filter(function (c) {
        return c.type === 'couleur' && c.valeur >= 8 && c.valeur <= 11;
      });
      if (mid.length) return { cardId: mid[0].id };
    }

    const sorted = legal.slice().sort(function (a, b) {
      const va = a.type === 'couleur' ? a.valeur : 0;
      const vb = b.type === 'couleur' ? b.valeur : 0;
      return wantWin ? vb - va : va - vb;
    });

    return wrapTigresse(sorted[0], level, wantWin ? 'pirate' : 'fuite');
  }

  /**
   * Gère le choix Tigresse pour l'IA.
   */
  function wrapTigresse(carte, level, preferMode) {
    if (carte.type !== 'tigresse') {
      return { cardId: carte.id };
    }
    const mode = preferMode || (level >= 3 ? 'pirate' : 'fuite');
    return { cardId: carte.id, modeTigresse: mode };
  }

  window.SKAI = {
    chooseBid,
    chooseCard,
    compterForces
  };
})(window);
