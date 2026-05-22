/**
 * @file guide.js
 * @description Aide contextuelle et tutoriel in-game.
 * @namespace SKGuide
 */
(function (window, $) {
  'use strict';

  const HELP = {
    BID: '<p>Examinez votre main et estimez combien de plis vous pouvez remporter.</p>' +
         '<p>Frappez la table mentalement… puis confirmez votre mise !</p>',
    PLAY: '<p>Jouez une carte en respectant la <strong>couleur menée</strong> si vous en possédez une.</p>' +
          '<p>Les cartes spéciales (Pirates, Sirène, Skull King…) ignorent cette règle.</p>',
    SCORE: '<p>Les scores de la manche sont calculés selon le système choisi.</p>' +
           '<p>Les bonus s\'ajoutent pour les captures spéciales et les 14 remportés.</p>',
    END: '<p>Partie terminée ! Consultez le podium pour voir le Capitaine des Sept Mers.</p>'
  };

  /**
   * Met à jour le texte d'aide selon la phase.
   * @param {Object} state
   */
  function updateHelp(state) {
    const $text = $('#help-phase-text');
    if (!$text.length) return;

    let html = HELP[state.phase] || HELP.PLAY;

    if (state.phase === 'PLAY' && state.currentTrick.cards.length === 0) {
      html += '<p class="form-text mt-2">Vous <strong>entamez</strong> le pli — toute carte est permise.</p>';
    } else if (state.phase === 'PLAY') {
      const couleur = window.SKGame.getCouleurASuivre();
      if (couleur) {
        html += '<p class="form-text mt-2">Couleur à suivre : <strong>' + couleur + '</strong></p>';
      }
    }

    $text.html(html);
  }

  /**
   * Propose le tutoriel au premier lancement.
   */
  function maybeShowTutorial() {
    if (!window.SKStorage || !window.SKStorage.isFirstLaunch()) return;
    setTimeout(function () {
      if (confirm('Bienvenue à bord ! Souhaitez-vous un tutoriel rapide ?')) {
        new bootstrap.Modal('#helpModal').show();
      }
      window.SKStorage.markFirstLaunchDone();
    }, 800);
  }

  $(function () {
    if (document.body.dataset.page === 'game') {
      maybeShowTutorial();
    }
  });

  window.SKGuide = {
    updateHelp,
    maybeShowTutorial
  };
})(window, jQuery);
