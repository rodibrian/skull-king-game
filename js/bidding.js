/**
 * @file bidding.js
 * @description Phase de mise Yo-ho-ho : animation et révélation simultanée.
 * @namespace SKBidding
 */
(function (window, $) {
  'use strict';

  /**
   * Lance l'animation Yo-ho-ho (3 coups) puis révèle les mises.
   * @param {Function} onComplete - Callback après révélation
   * @returns {Promise<void>}
   */
  function animationYoHoHo(onComplete) {
    const $overlay = $('#yoho-overlay');
    if (!$overlay.length) {
      if (onComplete) onComplete();
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      $overlay.show().attr('aria-hidden', 'false');
      let count = 0;

      function punch() {
        count += 1;
        $overlay.find('.yo-ho-ho-fist').addClass('animate__animated animate__rubberBand');
        window.skPlaySound && window.skPlaySound('yoho');
        window.skVibrate && window.skVibrate([100, 50, 100]);

        setTimeout(function () {
          $overlay.find('.yo-ho-ho-fist').removeClass('animate__animated animate__rubberBand');
          if (count < 3) {
            setTimeout(punch, 400);
          } else {
            setTimeout(function () {
              $overlay.hide().attr('aria-hidden', 'true');
              if (onComplete) onComplete();
              resolve();
            }, 500);
          }
        }, 350);
      }

      punch();
    });
  }

  /**
   * Affiche les mises révélées dans le panneau.
   * @param {Array<{name: string, bid: number, rascalChoice?: string}>} bids
   */
  function afficherMisesRevelees(bids) {
    const $row = $('#bid-reveal-row');
    if (!$row.length) return;

    $row.empty().show();
    bids.forEach(function (b) {
      const tokens = b.bid >= 10 ? '🔟+' + (b.bid - 10) : String(b.bid);
      $row.append(
        '<div class="bid-reveal-chip">' +
          '<span class="bid-reveal-name">' + b.name + '</span>' +
          '<span class="bid-reveal-value">' + tokens + '</span>' +
        '</div>'
      );
    });
  }

  /**
   * Met à jour les boutons de mise selon le nombre de cartes.
   * @param {number} maxBid
   */
  function configurerSelecteurMise(maxBid) {
    $('.bid-btn').each(function () {
      const bid = parseInt($(this).data('bid'), 10);
      $(this).toggle(bid <= maxBid).removeClass('selected');
    });
    $('.bid-btn[data-bid="0"]').addClass('selected');
  }

  window.SKBidding = {
    animationYoHoHo,
    afficherMisesRevelees,
    configurerSelecteurMise
  };
})(window, jQuery);
