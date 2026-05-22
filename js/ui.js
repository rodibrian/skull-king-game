/**
 * @file ui.js
 * @description Rendu DOM, table de jeu et interactions utilisateur.
 * @namespace SKUI
 */
(function (window, $) {
  'use strict';

  let selectedCardId = null;
  let sortableHand = null;

  const SEAT_POSITIONS = {
    2: ['bottom', 'top'],
    3: ['bottom', 'left', 'right'],
    4: ['bottom', 'left', 'top', 'right'],
    5: ['bottom', 'left', 'top-left', 'top-right', 'right'],
    6: ['bottom', 'left', 'top-left', 'top', 'top-right', 'right'],
    7: ['bottom', 'left', 'top-left', 'top', 'top-right', 'right', 'bottom-extra'],
    8: ['bottom', 'left', 'top-left', 'top-left2', 'top', 'top-right2', 'top-right', 'right']
  };

  /**
   * Crée un élément DOM pour une carte.
   * @param {Object} carte
   * @param {Object} opts
   * @returns {jQuery}
   */
  function createCardEl(carte, opts) {
    opts = opts || {};
    const faceUp = opts.faceUp !== false;
    const classes = ['card-game'];
    if (opts.playable) classes.push('playable');
    if (opts.illegal) classes.push('illegal');
    if (opts.selected) classes.push('selected');
    if (opts.orient) classes.push('orient-' + opts.orient);

    const $el = $('<div>', {
      class: classes.join(' '),
      'data-card-id': carte.id,
      role: 'listitem',
      tabindex: faceUp ? 0 : -1
    });

    const $inner = $('<div class="card-game-inner">');
    if (faceUp) {
      $inner.append(
        $('<div class="card-face card-face-front">').append(
          $('<img>', { src: carte.image, alt: carte.nom, loading: 'lazy' })
        )
      );
      $inner.append(
        $('<div class="card-face card-face-back">').append(
          $('<img>', { src: window.SKCards.DOS_CARTE, alt: 'Dos de carte' })
        )
      );
    } else {
      $inner.append(
        $('<div class="card-face card-face-back face-only">').append(
          $('<img>', { src: window.SKCards.DOS_CARTE, alt: 'Dos de carte' })
        )
      );
    }
    $el.append($inner);
    return $el;
  }

  /**
   * Met à jour le header (manche, cartes).
   * @param {Object} state
   */
  function renderHeader(state) {
    $('#current-round').text(state.roundIndex + 1);
    $('#total-rounds').text(state.variante.manches.length);
    $('#cards-dealt').text(window.SKGame.cardsThisRound());
  }

  /**
   * Affiche la main du joueur humain.
   * @param {Object} state
   */
  function renderHumanHand(state) {
    const hi = state.humanIndex;
    const hand = state.hands[hi] || [];
    const legal = state.phase === 'PLAY' && state.currentPlayer === hi
      ? window.SKGame.getLegalCards(hi) : hand;
    const legalIds = legal.map(function (c) { return c.id; });
    const couleur = state.phase === 'PLAY' ? window.SKGame.getCouleurASuivre() : null;

    const $hand = $('#human-hand');
    $hand.empty();

    hand.forEach(function (carte) {
      const isLegal = legalIds.indexOf(carte.id) >= 0;
      const isSelected = selectedCardId === carte.id;
      const $card = createCardEl(carte, {
        faceUp: true,
        playable: state.phase === 'PLAY' && state.currentPlayer === hi && isLegal,
        illegal: state.phase === 'PLAY' && state.currentPlayer === hi && !isLegal,
        selected: isSelected
      });
      if (!isLegal && state.phase === 'PLAY' && couleur) {
        $card.attr('title', 'Vous devez jouer du ' + couleur + ' si vous en avez');
      }
      $hand.append($card);
    });

    const p = state.players[hi];
    $('#human-bid').text(p.bid != null ? p.bid : '—');
    $('#human-tricks').text(p.tricksWon);
    $('#human-bid-target').text(p.bid != null ? p.bid : '—');

    updateActionButton(state);
  }

  /**
   * Affiche les adversaires autour de la table.
   * @param {Object} state
   */
  function renderOpponents(state) {
    const nb = state.players.length;
    $('#game-table').attr('class', 'game-table players-' + nb);

    state.players.forEach(function (p, i) {
      if (p.isHuman) return;
      const handSize = (state.hands[i] || []).length;
      const $pile = $('#hand-opponent-' + i);
      if (!$pile.length) return;
      $pile.empty();
      for (let c = 0; c < handSize; c += 1) {
        $pile.append(createCardEl({ id: 'back', image: '' }, { faceUp: false }));
      }
      const $badge = $('#player-badge-' + i);
      if ($badge.length) {
        $badge.find('.player-name').text(p.name);
        $badge.toggleClass('is-ai', p.type === 'ai');
        $badge.toggleClass('active-turn', state.currentPlayer === i);
        $badge.find('.bid-count').text(p.bid != null ? p.bid : '—');
        $badge.closest('.player-slot-top, .player-slot-side').find('.trick-count').text(p.tricksWon);
      }
    });

    const $humanBadge = $('#player-badge-' + state.humanIndex);
    $humanBadge.toggleClass('active-turn', state.currentPlayer === state.humanIndex);
  }

  /**
   * Affiche le pli en cours.
   * @param {Object} state
   */
  function renderTrick(state) {
    const $zone = $('#trick-zone-cards');
    $zone.empty();
    state.currentTrick.cards.forEach(function (e) {
      $zone.append(createCardEl(e.carte, { faceUp: true }));
    });
  }

  /**
   * Tableau de scores.
   * @param {Object} state
   */
  function renderScoreTable(state) {
    const $body = $('#score-table-body');
    $body.empty();
    state.players.filter(function (p) { return !p.isBarbeGrise; }).forEach(function (p) {
      const rs = p.roundScore || {};
      const ptsClass = rs.pointsMise > 0 ? 'score-positive' : rs.pointsMise < 0 ? 'score-negative' : 'score-neutral';
      $body.append(
        '<tr>' +
          '<td class="col-player">' + p.name + '</td>' +
          '<td>' + (p.bid != null ? p.bid : '—') + '</td>' +
          '<td>' + p.tricksWon + '</td>' +
          '<td class="' + ptsClass + '">' + (rs.pointsMise != null ? rs.pointsMise : '—') + '</td>' +
          '<td>' + (rs.bonus || '—') + '</td>' +
          '<td>' + (rs.total != null ? rs.total : '—') + '</td>' +
          '<td class="score-cumulative">' + p.score + '</td>' +
        '</tr>'
      );
    });
  }

  /**
   * Panneau de mise.
   * @param {Object} state
   */
  function renderBidPanel(state) {
    const isBid = state.phase === 'BID';
    $('#bid-panel').toggle(isBid || state.phase === 'PLAY');
    if (isBid && window.SKBidding) {
      window.SKBidding.configurerSelecteurMise(window.SKGame.cardsThisRound());
    }
    const showRascal = state.config.scoring.system === 'rascal';
    $('#rascal-choice-panel').toggle(isBid && showRascal);
  }

  /**
   * Bannière contextuelle.
   * @param {Object} state
   */
  function renderMessages(state) {
    const $banner = $('#context-banner');
    if (state.messages && state.messages.length) {
      $banner.text(state.messages.join(' ')).addClass('visible');
      setTimeout(function () { $banner.removeClass('visible'); }, 3000);
      state.messages = [];
    }

    if (state.phase === 'BID' && state.currentPlayer === state.humanIndex) {
      $banner.text('Choisissez votre mise !').addClass('visible');
    } else if (state.phase === 'PLAY' && state.currentPlayer === state.humanIndex) {
      const couleur = window.SKGame.getCouleurASuivre();
      $banner.text(couleur
        ? 'À vous de jouer — couleur : ' + couleur
        : 'À vous de jouer').addClass('visible');
    }
  }

  /**
   * Bouton d'action principal.
   * @param {Object} state
   */
  function updateActionButton(state) {
    const $btn = $('#btn-action');
    const hi = state.humanIndex;

    if (state.phase === 'BID' && !state.bidsSubmitted[hi]) {
      $btn.prop('disabled', false).text('Confirmer la mise').off('click').on('click', function () {
        const bid = parseInt($('.bid-btn.selected').data('bid'), 10) || 0;
        const rascal = $('input[name="rascal-choice"]:checked').val() ||
          $('.btn-rascal.selected').data('choice');
        window.SKGame.submitBid(hi, bid, rascal);
      });
      return;
    }

    if (state.phase === 'PLAY' && state.currentPlayer === hi) {
      $btn.prop('disabled', !selectedCardId).text('Jouer la carte').off('click').on('click', function () {
        if (selectedCardId) window.SKGame.playCard(hi, selectedCardId);
      });
      return;
    }

    $btn.prop('disabled', true).text(
      state.phase === 'BID' ? 'En attente des mises…' :
      state.phase === 'SCORE' ? 'Calcul des scores…' :
      'En attente…'
    );
  }

  /**
   * Modal Tigresse.
   * @param {Object} state
   */
  function handleTigresseModal(state) {
    if (state.pendingTigresse && state.pendingTigresse.playerIndex === state.humanIndex) {
      const modal = new bootstrap.Modal('#tigresseModal');
      modal.show();
      $('#tigresse-pirate, #tigresse-fuite').off('click').on('click', function () {
        modal.hide();
        window.SKGame.confirmTigresse($(this).data('mode'));
      });
    }
  }

  /**
   * Podium de fin de partie.
   * @param {Array<{name: string, score: number}>} rankings
   */
  function showGameEnd(rankings) {
    if (!rankings.length) return;
    $('#podium-winner-name').text(rankings[0].name);
    $('#podium-winner-score').text(rankings[0].score + ' pts');
    const $rank = $('#podium-rankings');
    $rank.empty();
    const medals = ['🥇', '🥈', '🥉'];
    rankings.forEach(function (r, i) {
      $rank.append(
        '<div class="podium-row" role="listitem">' +
          (medals[i] || (i + 1) + '.') + ' ' + r.name + ' — ' + r.score + ' pts' +
        '</div>'
      );
    });
    new bootstrap.Modal('#gameEndModal').show();
  }

  /**
   * Rendu complet.
   * @param {Object} state
   */
  function renderAll(state) {
    if (!state) return;
    renderHeader(state);
    renderHumanHand(state);
    renderOpponents(state);
    renderTrick(state);
    renderScoreTable(state);
    renderBidPanel(state);
    renderMessages(state);
    handleTigresseModal(state);

    if (window.SKGuide) window.SKGuide.updateHelp(state);
  }

  /**
   * Initialise les événements UI.
   */
  function bindEvents() {
    $(document).on('click', '#human-hand .card-game.playable', function () {
      selectedCardId = $(this).data('card-id');
      $('#human-hand .card-game').removeClass('selected');
      $(this).addClass('selected');
      const state = window.SKGame.getState();
      updateActionButton(state);
    });

    $(document).on('click', '.bid-btn', function () {
      $('.bid-btn').removeClass('selected');
      $(this).addClass('selected');
    });

    $(document).on('click', '.btn-rascal', function () {
      $('.btn-rascal').removeClass('selected');
      $(this).addClass('selected');
    });

    if (window.SKGame) {
      window.SKGame.onChange(renderAll);
    }

    $('#btn-replay').on('click', function () {
      window.location.href = 'index.html';
    });
    $('#btn-new-game').on('click', function () {
      window.location.href = 'index.html';
    });
  }

  $(function () {
    bindEvents();
  });

  window.SKUI = {
    renderAll,
    showGameEnd,
    createCardEl
  };
})(window, jQuery);
