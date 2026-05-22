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
   * @returns {Object|null}
   */
  function carteToId(c) {
    if (!c) return c;
    return typeof c === 'string' ? c : c.id;
  }

  function serialiserCartes(liste) {
    return (liste || []).map(carteToId);
  }

  function serialiserEntreesPli(entrees) {
    return (entrees || []).map(function (e) {
      return {
        joueurIndex: e.joueurIndex,
        carte: carteToId(e.carte),
        modeTigresse: e.modeTigresse || null,
        ordre: e.ordre
      };
    });
  }

  function serializeState() {
    if (!state) return null;
    return {
      phase: state.phase,
      config: state.config,
      variante: state.variante,
      roundIndex: state.roundIndex,
      dealer: state.dealer,
      deck: serialiserCartes(state.deck),
      discard: state.discard,
      hands: state.hands.map(serialiserCartes),
      bids: state.bids,
      bidsSubmitted: state.bidsSubmitted,
      currentTrick: {
        cards: serialiserEntreesPli(state.currentTrick.cards),
        leadPlayer: state.currentTrick.leadPlayer
      },
      currentPlayer: state.currentPlayer,
      trickStarter: state.trickStarter,
      tricksPlayed: state.tricksPlayed,
      players: state.players.map(function (p) {
        return {
          index: p.index,
          name: p.name,
          type: p.type,
          aiLevel: p.aiLevel,
          isHuman: p.isHuman,
          isBarbeGrise: p.isBarbeGrise,
          score: p.score,
          bid: p.bid,
          rascalChoice: p.rascalChoice,
          tricksWon: p.tricksWon,
          tricksWonDetails: (p.tricksWonDetails || []).map(function (pli) {
            return {
              joueurIndex: pli.joueurIndex,
              cartes: serialiserEntreesPli(pli.cartes),
              allianceButin: pli.allianceButin,
              joueurButin: pli.joueurButin
            };
          }),
          roundScore: p.roundScore,
          pariRascalFlambeur: p.pariRascalFlambeur || 0,
          harryPowerAvailable: !!p.harryPowerAvailable
        };
      }),
      humanIndex: state.humanIndex,
      pendingTigresse: state.pendingTigresse,
      pendingPower: state.pendingPower,
      messages: state.messages || [],
      barbeGriseDeck: serialiserCartes(state.barbeGriseDeck)
    };
  }

  /**
   * Instancie une carte depuis un id ou un objet.
   * @param {string|Object} ref
   * @returns {Object}
   */
  function instancierRef(ref) {
    if (!ref) return ref;
    if (typeof ref === 'string') {
      return window.SKCards.instancierCarte(ref);
    }
    if (ref.id && ref.type) {
      return { ...ref };
    }
    return ref;
  }

  /**
   * Reconstruit les objets carte depuis les IDs.
   */
  function rehydrateHands() {
    if (!state || !window.SKCards) return;

    state.hands = (state.hands || []).map(function (hand) {
      return hand.map(instancierRef);
    });
    state.deck = (state.deck || []).map(instancierRef);
    state.barbeGriseDeck = (state.barbeGriseDeck || []).map(instancierRef);

    if (state.currentTrick && state.currentTrick.cards) {
      state.currentTrick.cards = state.currentTrick.cards.map(function (e) {
        return {
          joueurIndex: e.joueurIndex,
          carte: instancierRef(e.carte),
          modeTigresse: e.modeTigresse,
          ordre: e.ordre
        };
      });
    }

    state.players.forEach(function (p) {
      (p.tricksWonDetails || []).forEach(function (pli) {
        pli.cartes = (pli.cartes || []).map(function (e) {
          return {
            joueurIndex: e.joueurIndex,
            carte: instancierRef(e.carte),
            modeTigresse: e.modeTigresse,
            ordre: e.ordre
          };
        });
      });
    });
  }

  /**
   * Restaure une partie sauvegardée.
   * @param {Object} saved
   */
  function restore(saved) {
    state = saved;
    rehydrateHands();
    if (window.SKUI) window.SKUI.cleanupModalBackdrops();
    emit();
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
      p.pariRascalFlambeur = 0;
      p.harryPowerAvailable = false;
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
    if (state.pendingPower) return false;
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
   * Poursuit le déroulement après résolution d'un pli (pli suivant ou fin de manche).
   */
  function continueAfterTrick() {
    const cardsPerRound = cardsThisRound();
    if (state.tricksPlayed >= cardsPerRound) {
      endRound();
    } else {
      emit();
      processAI();
    }
  }

  /**
   * Déclenche le pouvoir pirate après victoire au pli.
   * @param {Object[]} cartesPli
   * @param {number} gagnantIndex
   * @param {boolean} pliDetruit
   */
  function declencherPouvoirPirate(cartesPli, gagnantIndex, pliDetruit) {
    if (!state.config.advancedPowers || !window.SKPowers) {
      return false;
    }

    const pouvoir = window.SKPowers.detecterPouvoir(cartesPli, gagnantIndex, pliDetruit);
    if (!pouvoir) {
      return false;
    }

    const joueur = state.players[pouvoir.playerIndex];
    if (joueur.isBarbeGrise) {
      return false;
    }

    if (pouvoir.pirateId === 'harry') {
      joueur.harryPowerAvailable = true;
      state.messages.push('💪 ' + joueur.name + ' peut modifier sa mise en fin de manche (Harry le Géant).');
      return false;
    }

    state.pendingPower = {
      pirateId: pouvoir.pirateId,
      playerIndex: pouvoir.playerIndex,
      nom: pouvoir.nom,
      icon: pouvoir.icon,
      step: pouvoir.pirateId === 'bendt' ? 'will_draw' : 'choose'
    };
    state.phase = PHASE.PLAY;
    emit();

    if (!joueur.isHuman) {
      setTimeout(function () { resoudrePouvoirIA(); }, 600);
    } else if (window.SKUI) {
      window.SKUI.showPowerModal(state);
    }
    return true;
  }

  /**
   * Résout automatiquement un pouvoir pour l'IA.
   */
  function resoudrePouvoirIA() {
    if (!state.pendingPower || !window.SKPowers) return;
    const action = window.SKPowers.resoudreIA(state, state.pendingPower);
    if (action) {
      executerActionPouvoir(action);
    } else {
      terminerPouvoir();
    }
  }

  /**
   * Exécute une action de pouvoir pirate.
   * @param {Object} action
   */
  function executerActionPouvoir(action) {
    if (!state.pendingPower || !window.SKPowers) return;

    const idx = state.pendingPower.playerIndex;

    switch (action.type) {
      case 'rosie':
        window.SKPowers.appliquerRosie(state, action.targetIndex);
        terminerPouvoir();
        break;

      case 'will_start':
        window.SKPowers.piocherWill(state, idx);
        state.pendingPower.step = 'will_discard';
        state.pendingPower.discardCount = Math.min(2, state.hands[idx].length);
        emit();
        if (state.players[idx].isHuman) {
          if (window.SKUI) window.SKUI.showPowerModal(state);
        } else {
          const ids = window.SKPowers.choisirDefausseIA(state, idx);
          window.SKPowers.defausserWill(state, idx, ids.slice(0, state.pendingPower.discardCount));
          terminerPouvoir();
        }
        break;

      case 'will_discard':
        window.SKPowers.defausserWill(state, idx, action.cardIds || []);
        terminerPouvoir();
        break;

      case 'rascal':
        window.SKPowers.appliquerRascalFlambeur(state, idx, action.montant);
        terminerPouvoir();
        break;

      case 'juanita': {
        const cartes = window.SKPowers.voirDeckJuanita(state);
        state.messages.push('💎 Juanita Jade consulte ' + cartes.length + ' cartes restantes.');
        if (state.players[idx].isHuman && window.SKUI) {
          window.SKUI.cleanupModalBackdrops();
          const el = document.getElementById('powerActiveModal');
          if (el) {
            const inst = bootstrap.Modal.getInstance(el);
            if (inst) inst.hide();
          }
          window.SKUI.showJuanitaCards(cartes, function () {
            terminerPouvoir();
          });
        } else {
          terminerPouvoir();
        }
        break;
      }

      case 'harry':
        window.SKPowers.appliquerHarry(state, idx, action.delta);
        state.players[idx].harryPowerAvailable = false;
        terminerPouvoirHarry();
        break;

      default:
        terminerPouvoir();
    }
  }

  /**
   * Termine la phase de pouvoir et reprend le jeu.
   */
  function terminerPouvoir() {
    state.pendingPower = null;
    if (window.SKUI) window.SKUI.cleanupModalBackdrops();
    emit();
    continueAfterTrick();
  }

  /**
   * Termine le pouvoir Harry en fin de manche.
   */
  function terminerPouvoirHarry() {
    state.pendingPower = null;
    if (window.SKUI) window.SKUI.cleanupModalBackdrops();
    emit();
    calculerScoresManche();
  }

  /**
   * Résout le pli en cours.
   */
  function resolveCurrentTrick() {
    const cartesPli = state.currentTrick.cards.map(function (e) { return { ...e }; });
    const result = window.SKTricks.resoudrePli(cartesPli);
    const msg = [];

    if (result.pliDetruit) {
      if (result.raison && result.raison.indexOf('kraken') >= 0) {
        msg.push('LE KRAKEN A TOUT DÉTRUIT ! 🐙');
      }
      state.discard.push(...cartesPli);
      state.trickStarter = result.prochainMeneur != null
        ? result.prochainMeneur
        : state.trickStarter;
    } else if (result.gagnant >= 0) {
      const winner = state.players[result.gagnant];
      winner.tricksWon += 1;

      const butinEntry = cartesPli.find(function (e) {
        return e.carte.type === 'butin';
      });
      const pliDetail = {
        joueurIndex: result.gagnant,
        cartes: cartesPli.map(function (e) { return { ...e }; }),
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

    if (result.gagnant >= 0 && !result.pliDetruit &&
        declencherPouvoirPirate(cartesPli, result.gagnant, false)) {
      return;
    }

    continueAfterTrick();
  }

  /**
   * Propose le pouvoir Harry avant le calcul des scores.
   * @returns {boolean}
   */
  function declencherHarryFinManche() {
    if (!state.config.advancedPowers || !window.SKPowers) return false;

    const joueurHarry = state.players.find(function (p) {
      return p.harryPowerAvailable && !p.isBarbeGrise;
    });

    if (!joueurHarry) return false;

    state.pendingPower = {
      pirateId: 'harry',
      playerIndex: joueurHarry.index,
      nom: 'Harry le Géant',
      icon: '💪',
      step: 'harry_bid',
      harryFinManche: true
    };

    emit();

    if (!joueurHarry.isHuman) {
      setTimeout(function () { resoudrePouvoirIA(); }, 600);
    } else if (window.SKUI) {
      window.SKUI.showPowerModal(state);
    }
    return true;
  }

  /**
   * Calcule et applique les scores de la manche.
   */
  function calculerScoresManche() {
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
      p.harryPowerAvailable = false;
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
   * Termine la manche et calcule les scores.
   */
  function endRound() {
    if (declencherHarryFinManche()) {
      return;
    }
    calculerScoresManche();
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
    if (state.pendingPower) return;

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
    serializeState,
    executerActionPouvoir,
    terminerPouvoir,
    resoudrePouvoirIA
  };
})(window);
