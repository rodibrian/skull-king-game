/**
 * @file powers.js
 * @description Pouvoirs avancés des pirates (activables via config.advancedPowers).
 * @namespace SKPowers
 */
(function (window) {
  'use strict';

  const PIRATE_INFO = {
    tessi: { nom: 'Rosie la Douce', icon: '🌹' },
    bendt: { nom: 'Will le Bandit', icon: '🎭' },
    rascal: { nom: 'Rascal le Flambeur', icon: '🎲' },
    juanita: { nom: 'Juanita Jade', icon: '💎' },
    harry: { nom: 'Harry le Géant', icon: '💪' }
  };

  /**
   * Indique si une entrée de pli compte comme un pirate gagnant.
   * @param {Object} entree
   * @returns {boolean}
   */
  function estPirateEntree(entree) {
    if (!entree || !entree.carte) return false;
    if (entree.carte.type === 'pirate') return true;
    if (entree.carte.type === 'tigresse' && entree.modeTigresse === 'pirate') return true;
    return false;
  }

  /**
   * Retourne le pirateId d'une entrée.
   * @param {Object} entree
   * @returns {string|null}
   */
  function getPirateId(entree) {
    if (entree.carte.type === 'pirate') return entree.carte.pirateId || null;
    if (entree.carte.type === 'tigresse' && entree.modeTigresse === 'pirate') return 'tigresse';
    return null;
  }

  /**
   * Détecte si le gagnant a remporté le pli avec un pirate (pouvoir activable).
   * @param {Object[]} cartesPli
   * @param {number} gagnantIndex
   * @param {boolean} pliDetruit
   * @returns {Object|null}
   */
  function detecterPouvoir(cartesPli, gagnantIndex, pliDetruit) {
    if (pliDetruit || gagnantIndex < 0 || !cartesPli || !cartesPli.length) {
      return null;
    }

    const entreeGagnant = cartesPli.find(function (e) {
      return e.joueurIndex === gagnantIndex;
    });

    if (!entreeGagnant || !estPirateEntree(entreeGagnant)) {
      return null;
    }

    const pirateId = entreeGagnant.carte.type === 'pirate'
      ? entreeGagnant.carte.pirateId
      : null;

    if (!pirateId) {
      return null;
    }

    const info = PIRATE_INFO[pirateId] || { nom: entreeGagnant.carte.nom, icon: '🏴‍☠️' };

    return {
      pirateId: pirateId,
      playerIndex: gagnantIndex,
      carteId: entreeGagnant.carte.id,
      nom: info.nom,
      icon: info.icon
    };
  }

  /**
   * Rosie — choisir qui entame le prochain pli.
   * @param {Object} state
   * @param {number} targetIndex
   */
  function appliquerRosie(state, targetIndex) {
    state.trickStarter = targetIndex;
    state.currentPlayer = targetIndex;
    state.messages.push('🌹 ' + state.players[state.pendingPower.playerIndex].name +
      ' désigne ' + state.players[targetIndex].name + ' pour entamer le prochain pli.');
  }

  /**
   * Will — pioche 2 cartes depuis le deck.
   * @param {Object} state
   * @param {number} playerIndex
   * @returns {Object[]} cartes piochées
   */
  function piocherWill(state, playerIndex) {
    const pioches = [];
    for (let i = 0; i < 2; i += 1) {
      if (!state.deck.length) break;
      const carte = state.deck.shift();
      state.hands[playerIndex].push(carte);
      pioches.push(carte);
    }
    state.hands[playerIndex] = window.SKCards.trierMain(state.hands[playerIndex]);
    return pioches;
  }

  /**
   * Will — défausse des cartes de la main.
   * @param {Object} state
   * @param {number} playerIndex
   * @param {string[]} cardIds
   */
  function defausserWill(state, playerIndex, cardIds) {
    const hand = state.hands[playerIndex];
    cardIds.forEach(function (id) {
      const idx = hand.findIndex(function (c) { return c.id === id; });
      if (idx >= 0) {
        state.discard.push(hand.splice(idx, 1)[0]);
      }
    });
    state.hands[playerIndex] = window.SKCards.trierMain(hand);
    state.messages.push('🎭 Will le Bandit : pioche et défausse terminées.');
  }

  /**
   * Rascal le Flambeur — pari bonus 0/10/20.
   * @param {Object} state
   * @param {number} playerIndex
   * @param {number} montant
   */
  function appliquerRascalFlambeur(state, playerIndex, montant) {
    const val = [0, 10, 20].indexOf(montant) >= 0 ? montant : 0;
    state.players[playerIndex].pariRascalFlambeur = val;
    if (val > 0) {
      state.messages.push('🎲 Rascal le Flambeur parie +' + val + ' pts bonus !');
    }
  }

  /**
   * Juanita — retourne les cartes restantes du deck (vue secrète).
   * @param {Object} state
   * @returns {Object[]}
   */
  function voirDeckJuanita(state) {
    return state.deck.map(function (c) { return { ...c }; });
  }

  /**
   * Harry — modifie la mise de ±1 ou inchangée.
   * @param {Object} state
   * @param {number} playerIndex
   * @param {number} delta - -1, 0, ou +1
   */
  function appliquerHarry(state, playerIndex, delta) {
    const p = state.players[playerIndex];
    const max = window.SKGame.cardsThisRound();
    const nouvelle = Math.max(0, Math.min(max, (p.bid || 0) + delta));
    const ancienne = p.bid;
    p.bid = nouvelle;
    state.bids[playerIndex] = nouvelle;
    state.messages.push('💪 Harry le Géant : mise ' + ancienne + ' → ' + nouvelle);
  }

  /**
   * Résolution automatique IA d'un pouvoir.
   * @param {Object} state
   * @param {Object} power
   * @returns {Object|null} résultat pour resolvePower
   */
  function resoudreIA(state, power) {
    const idx = power.playerIndex;
    const level = state.players[idx].aiLevel || 2;

    switch (power.pirateId) {
      case 'tessi': {
        const cibles = state.players.filter(function (p) { return !p.isBarbeGrise; });
        const self = level >= 3 ? idx : cibles[Math.floor(Math.random() * cibles.length)].index;
        return { type: 'rosie', targetIndex: self };
      }
      case 'bendt':
        return { type: 'will_start' };
      case 'rascal': {
        const pari = level >= 3 ? 10 : (Math.random() < 0.5 ? 0 : 10);
        return { type: 'rascal', montant: pari };
      }
      case 'juanita':
        return { type: 'juanita' };
      case 'harry': {
        const p = state.players[idx];
        const delta = p.tricksWon === p.bid ? 0 : (p.tricksWon > p.bid ? -1 : 1);
        return { type: 'harry', delta: delta };
      }
      default:
        return null;
    }
  }

  /**
   * Will IA — choisit 2 cartes à défausser (les plus faibles).
   * @param {Object} state
   * @param {number} playerIndex
   * @returns {string[]}
   */
  function choisirDefausseIA(state, playerIndex) {
    const hand = state.hands[playerIndex].slice();
    hand.sort(function (a, b) {
      const va = a.type === 'couleur' ? a.valeur : 0;
      const vb = b.type === 'couleur' ? b.valeur : 0;
      return va - vb;
    });
    return hand.slice(0, 2).map(function (c) { return c.id; });
  }

  window.SKPowers = {
    PIRATE_INFO,
    detecterPouvoir,
    estPirateEntree,
    appliquerRosie,
    piocherWill,
    defausserWill,
    appliquerRascalFlambeur,
    voirDeckJuanita,
    appliquerHarry,
    resoudreIA,
    choisirDefausseIA
  };
})(window);
