/**
 * @file ui.js
 * @description Rendu DOM, table de jeu et interactions utilisateur.
 * @namespace SKUI
 */
(function (window, $) {
  'use strict';

  let selectedCardId = null;
  let selectedDiscardIds = [];
  let sortableHand = null;
  let powerModalShowing = false;

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

    if (state.pendingPower) {
      $btn.prop('disabled', true).text('Pouvoir pirate en cours…');
      return;
    }

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
      openModal('#tigresseModal');
      $('#tigresse-pirate, #tigresse-fuite').off('click').on('click', function () {
        const mode = $(this).data('mode');
        closeModal('#tigresseModal', function () {
          window.SKGame.confirmTigresse(mode);
        });
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
    openModal('#gameEndModal');
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
    handlePendingPower(state);

    if (window.SKGuide) window.SKGuide.updateHelp(state);
  }

  /**
   * Supprime les backdrops Bootstrap orphelins qui bloquent l'écran.
   */
  function cleanupModalBackdrops() {
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open').css({ overflow: '', paddingRight: '' });
    $('.modal.show').each(function () {
      $(this).removeClass('show').attr('aria-hidden', 'true').css('display', 'none');
    });
    powerModalShowing = false;
  }

  /**
   * Ouvre une modale Bootstrap (instance unique par élément).
   * @param {string} selector
   * @param {Function} [onShown]
   * @returns {bootstrap.Modal|null}
   */
  function openModal(selector, onShown) {
    const el = document.querySelector(selector);
    if (!el) return null;
    cleanupModalBackdrops();
    const inst = bootstrap.Modal.getOrCreateInstance(el);
    if (onShown) {
      $(el).one('shown.bs.modal', onShown);
    }
    inst.show();
    return inst;
  }

  /**
   * Ferme une modale puis nettoie le backdrop.
   * @param {string} selector
   * @param {Function} [callback]
   */
  function closeModal(selector, callback) {
    const el = document.querySelector(selector);
    if (!el) {
      cleanupModalBackdrops();
      if (callback) callback();
      return;
    }
    const inst = bootstrap.Modal.getInstance(el);
    if (inst) {
      $(el).one('hidden.bs.modal', function () {
        cleanupModalBackdrops();
        if (callback) callback();
      });
      inst.hide();
    } else {
      cleanupModalBackdrops();
      if (callback) callback();
    }
  }

  /**
   * Ferme la modale de pouvoir pirate active.
   * @param {Function} [callback]
   */
  function closePowerModal(callback) {
    powerModalShowing = false;
    closeModal('#powerActiveModal', callback);
  }

  /** @deprecated alias */
  function hidePowerModal(callback) {
    closePowerModal(callback);
  }
  /**
   * Affiche la modale de pouvoir pirate pour le joueur humain.
   * @param {Object} state
   */
  function showPowerModal(state) {
    if (powerModalShowing) return;

    const power = state.pendingPower;
    if (!power) return;

    if (power.pirateId === 'bendt' && power.step === 'will_draw') {
      window.SKGame.executerActionPouvoir({ type: 'will_start' });
      return;
    }

    const $body = $('#power-active-body');
    const $footer = $('#power-active-footer');
    $body.empty();
    $footer.empty();

    $('#powerActiveModalLabel').text(power.icon + ' ' + power.nom);

    if (power.pirateId === 'tessi') {
      $body.append('<p>Choisissez qui entame le <strong>prochain pli</strong> :</p>');
      const $list = $('<div class="power-player-list d-flex flex-wrap gap-2">');
      state.players.forEach(function (p) {
        if (p.isBarbeGrise) return;
        $list.append(
          $('<button type="button" class="btn btn-pirate btn-pirate-sm">').text(p.name).data('target', p.index)
        );
      });
      $body.append($list);
      $list.on('click', 'button', function () {
        const target = $(this).data('target');
        closePowerModal(function () {
          window.SKGame.executerActionPouvoir({ type: 'rosie', targetIndex: target });
        });
      });
    } else if (power.step === 'will_discard') {
      selectedDiscardIds = [];
      const hi = power.playerIndex;
      const need = Math.min(2, (state.hands[hi] || []).length);
      $body.append('<p>Will le Bandit : choisissez <strong>' + need + ' carte(s) à défausser</strong> :</p>');
      const $cards = $('<div class="power-discard-hand d-flex flex-wrap gap-2">');
      (state.hands[hi] || []).forEach(function (carte) {
        $cards.append(createCardEl(carte, { faceUp: true }).addClass('power-discard-pick'));
      });
      $body.append($cards);
      $footer.append('<button type="button" class="btn btn-pirate" id="btn-will-discard" disabled>Défausser (0/' + need + ')</button>');
      $cards.on('click', '.power-discard-pick', function () {
        const id = $(this).data('card-id');
        const idx = selectedDiscardIds.indexOf(id);
        if (idx >= 0) {
          selectedDiscardIds.splice(idx, 1);
          $(this).removeClass('selected');
        } else if (selectedDiscardIds.length < need) {
          selectedDiscardIds.push(id);
          $(this).addClass('selected');
        }
        $('#btn-will-discard').prop('disabled', selectedDiscardIds.length !== need)
          .text('Défausser (' + selectedDiscardIds.length + '/' + need + ')');
      });
      $('#btn-will-discard').on('click', function () {
        const ids = selectedDiscardIds.slice();
        closePowerModal(function () {
          window.SKGame.executerActionPouvoir({ type: 'will_discard', cardIds: ids });
        });
      });
    } else if (power.pirateId === 'rascal') {
      $body.append('<p>Rascal le Flambeur : pariez des points supplémentaires :</p>');
      $body.append(
        '<div class="d-flex gap-2 justify-content-center">' +
          '<button type="button" class="btn btn-pirate" data-montant="0">0 pt</button>' +
          '<button type="button" class="btn btn-pirate" data-montant="10">+10 pts</button>' +
          '<button type="button" class="btn btn-pirate" data-montant="20">+20 pts</button>' +
        '</div>'
      );
      $body.find('button').on('click', function () {
        const montant = parseInt($(this).data('montant'), 10);
        closePowerModal(function () {
          window.SKGame.executerActionPouvoir({ type: 'rascal', montant: montant });
        });
      });
    } else if (power.pirateId === 'juanita') {
      $body.append('<p>Juanita Jade révèle les cartes restantes du deck…</p>');
      $footer.append('<button type="button" class="btn btn-pirate" id="btn-juanita-ok">Voir les cartes</button>');
      $('#btn-juanita-ok').on('click', function () {
        window.SKGame.executerActionPouvoir({ type: 'juanita' });
      });
    } else if (power.pirateId === 'harry') {
      const p = state.players[power.playerIndex];
      $body.append(
        '<p>Harry le Géant : modifiez votre mise (actuelle : <strong>' + p.bid + '</strong>) :</p>' +
        '<div class="d-flex gap-2 justify-content-center">' +
          '<button type="button" class="btn btn-pirate-outline btn-pirate" data-delta="-1">−1</button>' +
          '<button type="button" class="btn btn-pirate" data-delta="0">Inchangée</button>' +
          '<button type="button" class="btn btn-pirate-outline btn-pirate" data-delta="1">+1</button>' +
        '</div>'
      );
      $body.find('button').on('click', function () {
        const delta = parseInt($(this).data('delta'), 10);
        closePowerModal(function () {
          window.SKGame.executerActionPouvoir({ type: 'harry', delta: delta });
        });
      });
    }

    powerModalShowing = true;
    openModal('#powerActiveModal');
  }

  /**
   * Affiche les cartes vues par Juanita.
   * @param {Object[]} cartes
   * @param {Function} [onClose]
   */
  function showJuanitaCards(cartes, onClose) {
    const $row = $('#juanita-cards');
    $row.empty();
    if (!cartes.length) {
      $row.append('<p class="text-muted-custom">Aucune carte restante dans le deck.</p>');
    } else {
      cartes.forEach(function (c) {
        $row.append(createCardEl(c, { faceUp: true }));
      });
    }
    const $modal = $('#juanitaModal');
    $modal.off('hidden.juanita').on('hidden.juanita', function () {
      cleanupModalBackdrops();
      if (onClose) onClose();
    });
    openModal('#juanitaModal');
  }

  /**
   * Gère l'affichage du pouvoir en attente.
   * @param {Object} state
   */
  function handlePendingPower(state) {
    if (!state.pendingPower) {
      powerModalShowing = false;
      return;
    }
    const power = state.pendingPower;
    if (power.playerIndex === state.humanIndex &&
        power.step !== 'will_draw' &&
        !powerModalShowing &&
        !$('#powerActiveModal').hasClass('show')) {
      showPowerModal(state);
    }
    updateActionButton(state);
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
    createCardEl,
    showPowerModal,
    showJuanitaCards,
    hidePowerModal,
    closePowerModal,
    cleanupModalBackdrops,
    openModal,
    closeModal
  };
})(window, jQuery);
