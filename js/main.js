/**
 * @file main.js
 * @description Point d'entrée global, configuration DEBUG et initialisation des pages.
 */
(function (window, $) {
  'use strict';

  /** @type {boolean} Active les logs de débogage en console */
  window.DEBUG = false;

  /**
   * Log conditionnel selon le flag DEBUG.
   * @param {...*} args
   */
  window.skLog = function skLog() {
    if (window.DEBUG && window.console) {
      console.log.apply(console, arguments);
    }
  };

  const PREFS = {
    sound: true,
    vibration: true,
    animations: true
  };

  /**
   * Charge les préférences depuis le stockage.
   */
  function loadPrefs() {
    if (window.SKStorage) {
      const saved = window.SKStorage.loadPreferences();
      Object.assign(PREFS, saved);
    }
  }

  /**
   * Joue un son si activé.
   * @param {string} id - Identifiant du son
   */
  window.skPlaySound = function skPlaySound(id) {
    if (!PREFS.sound) return;
    const map = {
      yoho: 'assets/sounds/Yo-ho-ho.m4a'
    };
    if (map[id]) {
      try {
        const audio = new Audio(map[id]);
        audio.volume = id === 'yoho' ? 0.6 : 0.4;
        audio.play().catch(function () { /* autoplay bloqué */ });
      } catch (e) { /* ignore */ }
    }
  };

  /**
   * Vibration mobile si activée.
   * @param {number|number[]} pattern
   */
  window.skVibrate = function skVibrate(pattern) {
    if (!PREFS.vibration || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  };

  /**
   * Initialise la page d'accueil (index.html).
   */
  function initIndex() {
    loadPrefs();
  }

  /**
   * Initialise la page de jeu (game.html).
   */
  function initGamePage() {
    loadPrefs();

    const params = new URLSearchParams(window.location.search);
    const resume = params.get('resume') === '1';
    let config = null;

    if (resume && window.SKStorage && window.SKStorage.hasSavedGame()) {
      const saved = window.SKStorage.loadGame();
      if (saved && window.SKGame) {
        window.SKGame.restore(saved);
        if (window.SKUI) window.SKUI.renderAll(window.SKGame.getState());
        window.SKGame.processAI();
        return;
      }
    }

    try {
      const raw = sessionStorage.getItem('sk_new_game_config');
      if (raw) {
        config = JSON.parse(raw);
        sessionStorage.removeItem('sk_new_game_config');
      }
    } catch (e) { /* ignore */ }

    if (!config && window.SKStorage) {
      config = window.SKStorage.loadPreferences();
    }

    if (!config || !config.players) {
      window.location.href = 'index.html';
      return;
    }

    if (window.SKGame) {
      window.SKGame.init(config);
      if (window.SKUI) window.SKUI.renderAll(window.SKGame.getState());
      window.SKGame.processAI();
    }
  }

  /**
   * Initialise la page des scores.
   */
  function initScoresPage() {
    if (!window.SKStorage) return;
    const history = window.SKStorage.loadHistory();
    const $list = $('#history-list');
    if (!$list.length) return;

    if (!history.length) {
      $list.html('<p class="text-muted-custom">Aucune partie enregistrée pour le moment.</p>');
      return;
    }

    history.forEach(function (entry) {
      const date = new Date(entry.date).toLocaleString('fr-FR');
      const winner = entry.winner || '—';
      const scores = (entry.rankings || []).map(function (r) {
        return r.name + ' : ' + r.score;
      }).join(' · ');
      $list.append(
        '<article class="history-card">' +
          '<header><strong>' + winner + '</strong> <span class="history-date">' + date + '</span></header>' +
          '<p class="history-meta">' + (entry.variant || 'Standard') + ' · ' + (entry.playerCount || '?') + ' joueurs</p>' +
          '<p class="history-scores">' + scores + '</p>' +
        '</article>'
      );
    });
  }

  $(function () {
    const page = document.body.dataset.page || '';
    if (page === 'game') {
      initGamePage();
    } else if (page === 'scores') {
      initScoresPage();
    } else {
      initIndex();
    }

    $('#setting-sound, #btn-sound').on('click change', function () {
      const muted = $('#setting-sound').length
        ? !$('#setting-sound').is(':checked')
        : $('#btn-sound').text() === '🔇';
      if ($(this).is('#btn-sound')) {
        PREFS.sound = !muted;
        $('#btn-sound').text(PREFS.sound ? '🔊' : '🔇');
        if ($('#setting-sound').length) $('#setting-sound').prop('checked', PREFS.sound);
      } else {
        PREFS.sound = $('#setting-sound').is(':checked');
        $('#btn-sound').text(PREFS.sound ? '🔊' : '🔇');
      }
      if (window.SKStorage) window.SKStorage.savePreferences(PREFS);
    });
  });
})(window, jQuery);
