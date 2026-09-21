/*
 * MatchTracker Storage Service
 * ----------------------------
 * Centralised access to browser localStorage.
 *
 * Phase 1:
 * - Preserve the existing MatchTracker storage keys.
 * - Do not change the existing data structure.
 * - Provide one safe place for future storage changes.
 */

(function (window) {
    "use strict";

    const KEYS = Object.freeze({
        borrowedPlayers: "borrowedPlayers",
        lastMatch: "lastMatch",
        matchLog: "matchLog",
        seasonStats: "seasonStats"
    });

    function load(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);

            if (raw === null) {
                return fallback;
            }

            return JSON.parse(raw);

        } catch (error) {
            console.error(
                `[MatchTracker Storage] Failed to load "${key}"`,
                error
            );

            return fallback;
        }
    }

    function save(key, value) {
        try {
            window.localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {
            console.error(
                `[MatchTracker Storage] Failed to save "${key}"`,
                error
            );

            return false;
        }
    }

    function remove(key) {
        try {
            window.localStorage.removeItem(key);

            return true;

        } catch (error) {
            console.error(
                `[MatchTracker Storage] Failed to remove "${key}"`,
                error
            );

            return false;
        }
    }

    const MatchTrackerStorage = {

        /*
         * Generic storage functions
         */

        KEYS: KEYS,

        load: load,

        save: save,

        remove: remove,


        /*
         * Borrowed Players
         */

        loadBorrowedPlayers: function () {
            return load(KEYS.borrowedPlayers, []);
        },

        saveBorrowedPlayers: function (players) {
            return save(KEYS.borrowedPlayers, players);
        },


        /*
         * Last Match
         */

        loadLastMatch: function () {
            return load(KEYS.lastMatch, null);
        },

        saveLastMatch: function (match) {
            return save(KEYS.lastMatch, match);
        },


        /*
         * Match Log
         */

        loadMatchLog: function () {
            return load(KEYS.matchLog, []);
        },

        saveMatchLog: function (matches) {
            return save(KEYS.matchLog, matches);
        },


        /*
         * Season Statistics
         */

        loadSeasonStats: function () {
            return load(KEYS.seasonStats, {});
        },

        saveSeasonStats: function (stats) {
            return save(KEYS.seasonStats, stats);
        },

        clearSeasonStats: function () {
            return remove(KEYS.seasonStats);
        }
    };


    /*
     * Make the storage service available to MatchTracker.
     *
     * The current MatchTracker app uses normal script files,
     * so this service is exposed through the window object.
     */

    window.MatchTrackerStorage = Object.freeze(
        MatchTrackerStorage
    );

})(window);