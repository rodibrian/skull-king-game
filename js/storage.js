/**
 * @file storage.js
 * @description Persistance locale (LocalStorage) : partie en cours, historique et préférences.
 * @namespace SKStorage
 */
(function (window) {
  'use strict';

  const PREFIX = 'sk_';

  /**
   * Clés LocalStorage utilisées par le jeu.
   * @constant
   */
  const STORAGE = {
    PARTIE_EN_COURS: `${PREFIX}game_state`,
    HISTORIQUE: `${PREFIX}score_history`,
    PREFERENCES: `${PREFIX}preferences`,
    FIRST_LAUNCH: `${PREFIX}first_launch`
  };

  const MAX_HISTORIQUE = 10;

  /**
   * Vérifie la disponibilité du LocalStorage.
   * @returns {boolean}
   */
  function isStorageAvailable() {
    try {
      const test = '__sk_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Écrit une valeur JSON dans le LocalStorage.
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  function ecrire(key, value) {
    if (!isStorageAvailable()) {
      return false;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[SKStorage] Impossible de sauvegarder :', e);
      return false;
    }
  }

  /**
   * Lit une valeur JSON depuis le LocalStorage.
   * @param {string} key
   * @param {*} [defaut=null]
   * @returns {*}
   */
  function lire(key, defaut) {
    if (!isStorageAvailable()) {
      return defaut !== undefined ? defaut : null;
    }
    try {
      const brut = window.localStorage.getItem(key);
      if (brut === null) {
        return defaut !== undefined ? defaut : null;
      }
      return JSON.parse(brut);
    } catch (e) {
      console.warn('[SKStorage] Impossible de lire :', e);
      return defaut !== undefined ? defaut : null;
    }
  }

  /**
   * Sauvegarde l'état complet de la partie en cours.
   * @param {Object} gameState
   * @returns {boolean}
   */
  function saveGame(gameState) {
    if (!gameState) {
      return false;
    }
    return ecrire(STORAGE.PARTIE_EN_COURS, {
      ...gameState,
      savedAt: new Date().toISOString(),
      version: 1
    });
  }

  /**
   * Charge la partie en cours sauvegardée.
   * @returns {Object|null}
   */
  function loadGame() {
    return lire(STORAGE.PARTIE_EN_COURS, null);
  }

  /**
   * Supprime la sauvegarde de partie en cours.
   * @returns {boolean}
   */
  function clearGame() {
    if (!isStorageAvailable()) {
      return false;
    }
    try {
      window.localStorage.removeItem(STORAGE.PARTIE_EN_COURS);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Indique si une partie sauvegardée existe.
   * @returns {boolean}
   */
  function hasSavedGame() {
    if (!isStorageAvailable()) {
      return false;
    }
    return window.localStorage.getItem(STORAGE.PARTIE_EN_COURS) !== null;
  }

  /**
   * Ajoute une partie terminée à l'historique (10 dernières max).
   * @param {Object} entree
   * @returns {boolean}
   */
  function saveHistory(entree) {
    const historique = loadHistory();
    historique.unshift({
      ...entree,
      id: entree.id || `partie_${Date.now()}`,
      date: entree.date || new Date().toISOString()
    });

    if (historique.length > MAX_HISTORIQUE) {
      historique.length = MAX_HISTORIQUE;
    }

    return ecrire(STORAGE.HISTORIQUE, historique);
  }

  /**
   * Charge l'historique des parties.
   * @returns {Object[]}
   */
  function loadHistory() {
    const data = lire(STORAGE.HISTORIQUE, []);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Efface tout l'historique.
   * @returns {boolean}
   */
  function clearHistory() {
    return ecrire(STORAGE.HISTORIQUE, []);
  }

  /**
   * Sauvegarde les préférences utilisateur (fusion partielle).
   * @param {Object} prefs
   * @returns {boolean}
   */
  function savePreferences(prefs) {
    return ecrire(STORAGE.PREFERENCES, { ...loadPreferences(), ...prefs });
  }

  /**
   * Charge les préférences utilisateur.
   * @returns {Object}
   */
  function loadPreferences() {
    return lire(STORAGE.PREFERENCES, {}) || {};
  }

  /**
   * Indique si c'est le premier lancement.
   * @returns {boolean}
   */
  function isFirstLaunch() {
    return lire(STORAGE.FIRST_LAUNCH, true) !== false;
  }

  /**
   * Marque le premier lancement comme effectué.
   * @returns {boolean}
   */
  function markFirstLaunchDone() {
    return ecrire(STORAGE.FIRST_LAUNCH, false);
  }

  window.SKStorage = {
    STORAGE,
    KEYS: STORAGE,
    MAX_HISTORIQUE,
    saveGame,
    loadGame,
    clearGame,
    hasSavedGame,
    saveHistory,
    loadHistory,
    clearHistory,
    savePreferences,
    loadPreferences,
    isFirstLaunch,
    markFirstLaunchDone,
    isStorageAvailable,
    get: lire,
    set: ecrire,
    remove: function (key) {
      if (isStorageAvailable()) {
        window.localStorage.removeItem(key);
      }
    }
  };
})(window);
