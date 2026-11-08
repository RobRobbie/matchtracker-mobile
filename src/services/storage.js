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
        // All rebuild-test records are namespaced so this package cannot
        // overwrite or delete the original 2026 MatchTracker data.
        borrowedPlayers: "matchtracker.test.borrowedPlayers",
        lastMatch: "matchtracker.test.lastMatch",
        matchLog: "matchtracker.test.matchLog",
        seasonStats: "matchtracker.test.seasonStats",
        players: "matchtracker.test.players",
        opponents: "matchtracker.test.opponents",
        availability: "matchtracker.test.availability"
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
         * Current Squad Players
         */

        loadPlayers: function () {
            return load(KEYS.players, []);
        },

        savePlayers: function (players) {
            return save(KEYS.players, players);
        },

        clearPlayers: function () {
            return remove(KEYS.players);
        },


        /*
         * Opponents
         */

        loadOpponents: function () {
            return load(KEYS.opponents, []);
        },

        saveOpponents: function (opponents) {
            return save(KEYS.opponents, opponents);
        },

        clearOpponents: function () {
            return remove(KEYS.opponents);
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
        },

        loadAvailability: function () {
            return load(KEYS.availability, []);
        },

        saveAvailability: function (records) {
            return save(KEYS.availability, records);
        }
    };


    /*
     * Make the storage service available to MatchTracker.
     *
     * The current MatchTracker app uses normal script files,
     * so this service is exposed through the window object.
     */

    // One-time setup for this isolated test build. Carry across only the
    // reusable master squad/opponent lists when safe; clear old match records
    // and season totals from the TEST namespace only. Original keys are read
    // but never changed or removed.
    try {
        const resetKey = "matchtracker.test.dataReset.v1";
        if (!window.localStorage.getItem(resetKey)) {
            const copyIfMissing = (oldKey, newKey, fallback) => {
                if (window.localStorage.getItem(newKey) === null) {
                    const oldValue = window.localStorage.getItem(oldKey);
                    if (oldValue !== null) window.localStorage.setItem(newKey, oldValue);
                    else window.localStorage.setItem(newKey, JSON.stringify(fallback));
                }
            };
            copyIfMissing("matchtracker.players", KEYS.players, []);
            copyIfMissing("matchtracker.opponents", KEYS.opponents, []);
            window.localStorage.setItem("matchtracker.test.preseason.matches", "[]");
            window.localStorage.setItem(KEYS.lastMatch, "null");
            window.localStorage.setItem(KEYS.matchLog, "[]");
            window.localStorage.setItem(KEYS.seasonStats, "{}");
            window.localStorage.setItem(KEYS.borrowedPlayers, "[]");
            window.localStorage.setItem(resetKey, "done");
        }
    } catch (error) {
        console.warn("MatchTracker test data setup could not complete safely.", error);
    }

    // One-time demonstration roster for MatchTracker 2027 testing.
    // Seed only empty registers; never overwrite players entered by the user.
    try {
        const seedKey = "matchtracker.test.demoRosterSeed.v1";
        if (!window.localStorage.getItem(seedKey)) {
            const regularRaw = window.localStorage.getItem(KEYS.players);
            const borrowedRaw = window.localStorage.getItem(KEYS.borrowedPlayers);
            const regular = regularRaw ? JSON.parse(regularRaw) : [];
            const borrowed = borrowedRaw ? JSON.parse(borrowedRaw) : [];

            if (!Array.isArray(regular) || !Array.isArray(borrowed)) {
                throw new Error("Player register data is not in the expected format.");
            }

            if (regular.length === 0) {
                const demoPlayers = Array.from({ length: 20 }, (_, index) => ({
                    id: `mt27_test_player_${String(index + 1).padStart(2, "0")}`,
                    name: `Test Player ${String(index + 1).padStart(2, "0")}`,
                    number: String(index + 1)
                }));
                window.localStorage.setItem(KEYS.players, JSON.stringify(demoPlayers));
            }

            if (borrowed.length === 0) {
                const demoBorrowed = Array.from({ length: 5 }, (_, index) => ({
                    id: `mt27_test_borrowed_${String(index + 1).padStart(2, "0")}`,
                    name: `Borrowed Test ${String(index + 1).padStart(2, "0")}`,
                    number: String(index + 21)
                }));
                window.localStorage.setItem(KEYS.borrowedPlayers, JSON.stringify(demoBorrowed));
            }

            window.localStorage.setItem(seedKey, "done");
        }
    } catch (error) {
        console.warn("MatchTracker demonstration roster could not be seeded safely.", error);
    }

    window.MatchTrackerStorage = Object.freeze(
        MatchTrackerStorage
    );

})(window);