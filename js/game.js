/**
 * @file game.js
 * @description Machine à états principale du jeu Skull King.
 * @namespace SKGame
 */
(function (window) {
  'use strict';

  const PHASE = {
    SETUP: 'SETUP',
    DEAL: 'DEAL',
    BID: 'BID',
    PLAY: 'PLAY',
    SCORE: 'SCORE',
    END: 'END'
  };

  const AI_NAMES = [
    'Calico Jack', 'Anne Bonny', 'Barbe Rouge', 'Morgan',
    'Blackbeard', 'Mary Read', 'Edward Teach', 'Jack Rackham'
  ];

  /** @type {Object|null} */
  let state = null;

  /** @type {Function[]} */
  const listeners = [];

  /**
   * Notifie les abonnés UI.
   */
  function emit() {
    listeners.forEach(function (fn) { fn(state); });
    if (window.SKStorage) window.SKStorage.saveGame(serializeState());
  }

  /**
   * Sérialise l'état pour le stockage (IDs de cartes uniquement).
   * @returns {Object}
   */
  function serializeState() {
    if (!state) return null;
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Restaure une partie sauvegardée.
   * @param {Object} saved
   */
  function restore(saved) {
    state = saved;
    rehydrateHands();
    emit();
  }

  /**
   * Reconstruit les objets carte depuis les IDs.
   */
  function rehydrateHands() {
    if (!state || !window.SKCards) return;
    state.hands = state.hands.map(function (hand) {
      return hand.map(function (id) {
        return typeof id === 'string' ? window.SKCards.instancierCarte(id) : id;
      });
    });
    if (state.currentTrick && state.currentTrick.cards) {
      state.currentTrick.cards = state.currentTrick.cards.map(function (e) {
        return {
          joueurIndex: e.joueurIndex,
          carte: typeof e.carte === 'string' ? window.SKCards.instancierCarte(e.carte) : e.carte,
          modeTigresse: e.modeTigresse,
          ordre: e.ordre
        };
      });
    }
  }

  /**
   * Initialise une nouvelle partie.
   * @param {Object} config
   */
  function init(config) {
    const nb = config.playerCount || config.players.length;
    const extensions = config.extensions || {};
    const deckSize = window.SKCards.taillePaquet(extensions);
    const variante = window.SKScoring.getVarianteConfig(
      config.variant || 'standard',
      nb,
      deckSize
    );

    const players = config.players.slice(0, nb).map(function (p, i) {
      return {
        index: i,
        name: p.name || (p.type === 'human' ? 'Vous' : AI_NAMES[i % AI_NAMES.length]),
        type: p.type || 'ai',
        aiLevel: p.aiLevel || 2,
        isHuman: p.type === 'human' || i === 0,
        isBarbeGrise: false,
        score: 0,
        bid: null,
        rascalChoice: config.scoring && config.scoring.system === 'rascal'
          ? (config.scoring.rascalVariant || 'chevrotine') : null,
        tricksWon: 0,
        tricksWonDetails: [],
        roundScore: { pointsMise: 0, bonus: 0, total: 0 },
        pariRascalFlambeur: 0
      };
    });

    if (nb === 2 && config.barbeGrise !== false) {
      players.splice(1, 0, {
        index: 1,
        name: 'Barbe Grise',
        type: 'ghost',
        aiLevel: 0,
        isHuman: false,
        isBarbeGrise: true,
        score: 0,
        bid: null,
        tricksWon: 0,
        tricksWonDetails: []
      });
      players.forEach(function (p, i) { p.index = i; });
    }

    state = {
      phase: PHASE.DEAL,
      config: {
        extensions: extensions,
        scoring: config.scoring || { system: 'skull_king', rascalVariant: 'chevrotine' },
        variant: config.variant || 'standard',
        advancedPowers: !!config.advancedPowers,
        barbeGrise: nb === 2
      },
      variante: variante,
      roundIndex: 0,
      dealer: 0,
      deck: [],
      discard: [],
      hands: [],
      bids: [],
      bidsSubmitted: [],
      currentTrick: { cards: [], leadPlayer: null },
      currentPlayer: 0,
      trickStarter: 0,
      tricksPlayed: 0,
      players: players,
      humanIndex: players.findIndex(function (p) { return p.isHuman; }),
      pendingTigresse: null,
      pendingPower: null,
      messages: [],
      barbeGriseDeck: []
    };

    startRound();
  }

  /**
   * Nombre de cartes pour la manche courante.
   * @returns {number}
   */
  function cardsThisRound() {
    return state.variante.manches[state.roundIndex] || 1;
  }

  /**
   * Démarre une nouvelle manche.
   */
  function startRound() {
    const n = cardsThisRound();
    const nb = state.players.length;
    let deck = window.SKCards.shuffleDeck(
      window.SKCards.buildDeck(state.config.extensions)
    );

    if (state.config.barbeGrise) {
      const bgSize = n;
      state.barbeGriseDeck = deck.splice(0, bgSize);
    }

    state.deck = deck;
    state.hands = state.players.map(function () { return []; });
    state.bids = state.players.map(function () { return null; });
    state.bidsSubmitted = state.players.map(function () { return false; });
    state.players.forEach(function (p) {
      p.tricksWon = 0;
      p.tricksWonDetails = [];
      p.bid = null;
      p.roundScore = { pointsMise: 0, bonus: 0, total: 0 };
    });

    let cardIndex = 0;
    for (let c = 0; c < n; c += 1) {
      for (let p = 0; p < nb; p += 1) {
        if (state.players[p].isBarbeGrise) continue;
        if (cardIndex < deck.length) {
          state.hands[p].push({ ...deck[cardIndex] });
          cardIndex += 1;
        }
      }
    }
    state.deck = deck.slice(cardIndex);

    state.hands = state.hands.map(function (h) {
      return window.SKCards.trierMain(h);
    });

    state.trickStarter = (state.dealer + 1) % nb;
    if (state.config.barbeGrise) {
      state.trickStarter = state.humanIndex;
    }
    state.currentPlayer = state.trickStarter;
    state.currentTrick = { cards: [], leadPlayer: state.trickStarter };
    state.tricksPlayed = 0;
    state.phase = PHASE.BID;
    emit();
    processAI();
  }

  /**
   * Soumet une mise pour un joueur.
   * @param {number} playerIndex
   * @param {number} bid
   * @param {string} [rascalChoice]
   */
  function submitBid(playerIndex, bid, rascalChoice) {
    if (state.phase !== PHASE.BID) return false;
    if (state.players[playerIndex].isBarbeGrise) return false;
    if (state.bidsSubmitted[playerIndex]) return false;

    const max = cardsThisRound();
    const b = Math.max(0, Math.min(max, bid));
    state.bids[playerIndex] = b;
    state.bidsSubmitted[playerIndex] = true;
    state.players[playerIndex].bid = b;
    if (rascalChoice) state.players[playerIndex].rascalChoice = rascalChoice;

    emit();

    if (state.bidsSubmitted.every(function (ok, i) {
      return ok || state.players[i].isBarbeGrise;
    })) {
      revealBidsAndStartPlay();
    } else {
      processAI();
    }
    return true;
  }

  /**
   * Révèle les mises et passe en phase de jeu.
   */
  function revealBidsAndStartPlay() {
    if (window.SKBidding) {
      window.SKBidding.animationYoHoHo(function () {
        const bids = state.players.filter(function (p) { return !p.isBarbeGrise; }).map(function (p) {
          return { name: p.name, bid: p.bid, rascalChoice: p.rascalChoice };
        });
        window.SKBidding.afficherMisesRevelees(bids);
        state.phase = PHASE.PLAY;
        emit();
        processAI();
      });
    } else {
      state.phase = PHASE.PLAY;
      emit();
      processAI();
    }
  }

  /**
   * Couleur à suivre pour le pli en cours.
   * @returns {string|null}
   */
  function getCouleurASuivre() {
    return window.SKTricks.determinerCouleurASuivre(state.currentTrick.cards);
  }

  /**
   * Cartes jouables pour un joueur.
   * @param {number} playerIndex
   * @returns {Object[]}
   */
  function getLegalCards(playerIndex) {
    const hand = state.hands[playerIndex];
    const pli = state.currentTrick.cards;
    const couleur = getCouleurASuivre();
    const barbeGrise = state.players[playerIndex].isBarbeGrise;

    if (barbeGrise) return hand;

    return hand.filter(function (carte) {
      return window.SKTricks.estCarteLegale(carte, hand, pli, couleur, { barbeGrise: barbeGrise });
    });
  }

  /**
   * Joue une carte.
   * @param {number} playerIndex
   * @param {string} cardId
   * @param {'pirate'|'fuite'|null} [modeTigresse]
   * @returns {boolean}
   */
  function playCard(playerIndex, cardId, modeTigresse) {
    if (state.phase !== PHASE.PLAY) return false;
    if (state.currentPlayer !== playerIndex) return false;

    const hand = state.hands[playerIndex];
    const idx = hand.findIndex(function (c) { return c.id === cardId; });
    if (idx === -1) return false;

    const carte = hand[idx];
    if (carte.type === 'tigresse' && !modeTigresse) {
      state.pendingTigresse = { playerIndex: playerIndex, cardId: cardId };
      emit();
      return false;
    }

    if (!state.players[playerIndex].isBarbeGrise) {
      const legal = getLegalCards(playerIndex);
      if (!legal.some(function (c) { return c.id === cardId; })) return false;
    }

    hand.splice(idx, 1);
    const entree = {
      joueurIndex: playerIndex,
      carte: carte,
      modeTigresse: modeTigresse || null,
      ordre: state.currentTrick.cards.length
    };
    state.currentTrick.cards.push(entree);
    state.tricksPlayed += 0;

    const nb = state.players.length;
    const played = state.currentTrick.cards.length;

    if (played >= nb) {
      resolveCurrentTrick();
    } else {
      state.currentPlayer = nextActivePlayer(playerIndex);
      emit();
      processAI();
    }
    return true;
  }

  /**
   * Joueur actif suivant (sens horaire).
   * @param {number} from
   * @returns {number}
   */
  function nextActivePlayer(from) {
    const nb = state.players.length;
    return (from + 1) % nb;
  }

  /**
   * Résout le pli en cours.
   */
  function resolveCurrentTrick() {
    const result = window.SKTricks.resoudrePli(state.currentTrick.cards);
    const msg = [];

    if (result.pliDetruit) {
      if (result.raison && result.raison.indexOf('kraken') >= 0) {
        msg.push('LE KRAKEN A TOUT DÉTRUIT ! 🐙');
      }
      state.discard.push(...state.currentTrick.cards);
      state.trickStarter = result.prochainMeneur != null
        ? result.prochainMeneur
        : state.trickStarter;
    } else if (result.gagnant >= 0) {
      const winner = state.players[result.gagnant];
      winner.tricksWon += 1;

      const butinEntry = state.currentTrick.cards.find(function (e) {
        return e.carte.type === 'butin';
      });
      const pliDetail = {
        joueurIndex: result.gagnant,
        cartes: state.currentTrick.cards.map(function (e) { return { ...e }; }),
        allianceButin: !!butinEntry && butinEntry.joueurIndex !== result.gagnant,
        joueurButin: butinEntry ? butinEntry.joueurIndex : null
      };
      winner.tricksWonDetails.push(pliDetail);
      state.trickStarter = result.gagnant;
      msg.push(winner.name + ' remporte le pli !');
      window.skVibrate && window.skVibrate([200]);
    }

    state.messages = msg;
    state.currentTrick = { cards: [], leadPlayer: state.trickStarter };
    state.currentPlayer = state.trickStarter;
    state.tricksPlayed += 1;

    const cardsPerRound = cardsThisRound();
    if (state.tricksPlayed >= cardsPerRound) {
      endRound();
    } else {
      emit();
      processAI();
    }
  }

  /**
   * Termine la manche et calcule les scores.
   */
  function endRound() {
    const cartes = cardsThisRound();
    const systeme = state.config.scoring.system || 'skull_king';

    state.players.forEach(function (p) {
      if (p.isBarbeGrise) return;

      const joueursButin = {};
      state.players.forEach(function (jp) {
        if (!jp.isBarbeGrise) {
          joueursButin[jp.index] = { mise: jp.bid, plisFaits: jp.tricksWon };
        }
      });

      const score = window.SKScoring.calculerScoreMancheJoueur({
        systemeScore: systeme,
        mise: p.bid,
        plisFaits: p.tricksWon,
        cartesManche: cartes,
        typeMiseRascal: p.rascalChoice,
        tricksGagnes: p.tricksWonDetails,
        configBonus: { joueursButin: joueursButin },
        pariRascalFlambeur: p.pariRascalFlambeur || null
      });

      p.roundScore = score;
      p.score += score.total;
    });

    state.phase = PHASE.SCORE;
    emit();

    setTimeout(function () {
      if (state.roundIndex + 1 >= state.variante.manches.length) {
        endGame();
      } else {
        state.roundIndex += 1;
        state.dealer = (state.dealer + 1) % state.players.length;
        state.phase = PHASE.DEAL;
        startRound();
      }
    }, 2500);
  }

  /**
   * Termine la partie.
   */
  function endGame() {
    state.phase = PHASE.END;
    const rankings = state.players
      .filter(function (p) { return !p.isBarbeGrise; })
      .map(function (p) { return { name: p.name, score: p.score }; })
      .sort(function (a, b) { return b.score - a.score; });

    if (window.SKStorage) {
      window.SKStorage.saveHistory({
        winner: rankings[0] ? rankings[0].name : '—',
        rankings: rankings,
        variant: state.variante.nom,
        playerCount: state.players.filter(function (p) { return !p.isBarbeGrise; }).length,
        scoresByRound: []
      });
      window.SKStorage.clearGame();
    }

    emit();
    if (window.SKUI) window.SKUI.showGameEnd(rankings);
  }

  /**
   * Confirme le mode Tigresse en attente.
   * @param {'pirate'|'fuite'} mode
   */
  function confirmTigresse(mode) {
    if (!state.pendingTigresse) return;
    const { playerIndex, cardId } = state.pendingTigresse;
    state.pendingTigresse = null;
    playCard(playerIndex, cardId, mode);
  }

  /**
   * Déclenche l'IA pour le joueur courant.
   */
  function processAI() {
    if (!state || state.phase === PHASE.END) return;

    if (state.phase === PHASE.BID) {
      state.players.forEach(function (p, i) {
        if (p.isHuman || p.isBarbeGrise || state.bidsSubmitted[i]) return;
        setTimeout(function () {
          if (!window.SKAI || state.bidsSubmitted[i]) return;
          const bid = window.SKAI.chooseBid(state, i);
          submitBid(i, bid.bid, bid.rascalChoice);
        }, 400 + i * 300 + Math.random() * 400);
      });
      return;
    }

    const p = state.players[state.currentPlayer];
    if (!p || p.isHuman) return;

    if (p.isBarbeGrise && state.phase === PHASE.PLAY) {
      setTimeout(playBarbeGrise, 400);
      return;
    }

    if (state.phase === PHASE.PLAY && state.currentPlayer === p.index) {
      setTimeout(function () {
        if (!window.SKAI) return;
        const choice = window.SKAI.chooseCard(state, p.index);
        if (choice.modeTigresse) {
          playCard(p.index, choice.cardId, choice.modeTigresse);
        } else {
          playCard(p.index, choice.cardId);
        }
      }, 500 + p.aiLevel * 200 + Math.random() * 500);
    }
  }

  /**
   * Barbe Grise joue automatiquement en 2e position.
   */
  function playBarbeGrise() {
    if (!state.barbeGriseDeck || !state.barbeGriseDeck.length) return;
    const bgIndex = state.players.findIndex(function (p) { return p.isBarbeGrise; });
    if (bgIndex < 0) return;

    const carte = state.barbeGriseDeck.shift();
    state.hands[bgIndex] = [carte];
    const mode = carte.type === 'tigresse' ? 'fuite' : null;
    playCard(bgIndex, carte.id, mode);
  }

  function getState() { return state; }
  function onChange(fn) { listeners.push(fn); return function () {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  }; }

  window.SKGame = {
    PHASE,
    init,
    restore,
    getState,
    onChange,
    submitBid,
    playCard,
    confirmTigresse,
    getLegalCards,
    getCouleurASuivre,
    cardsThisRound,
    processAI,
    serializeState
  };
})(window);
