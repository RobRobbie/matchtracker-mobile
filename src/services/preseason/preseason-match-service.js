// ============================================================
// MATCHTRACKER — PRE SEASON MATCH SERVICE
// ============================================================
// Handles Pre Season match data.
//
// Responsibilities:
// - Create Pre Season matches
// - Save Pre Season matches
// - Load Pre Season matches
// - Update Pre Season matches
// - Delete Pre Season matches
//
// UI code does not belong here.
// Match structure comes from MatchTrackerMatchModel.
// Storage is handled by MatchTrackerStorage.
// ============================================================

(function () {

  "use strict";


  const STORAGE_KEY =
    "matchtracker.preseason.matches";


  // ----------------------------------------------------------
  // GET ALL PRE SEASON MATCHES
  // ----------------------------------------------------------

  function getMatches() {

    if (
      !window.MatchTrackerStorage ||
      typeof window.MatchTrackerStorage.load !== "function"
    ) {

      console.error(
        "MatchTrackerPreSeasonService: Storage service not available."
      );

      return [];

    }


    const matches =
      window.MatchTrackerStorage.load(
        STORAGE_KEY,
        []
      );


    return Array.isArray(matches)
      ? matches
      : [];

  }


  // ----------------------------------------------------------
  // SAVE ALL PRE SEASON MATCHES
  // ----------------------------------------------------------

  function saveMatches(matches) {

    if (
      !window.MatchTrackerStorage ||
      typeof window.MatchTrackerStorage.save !== "function"
    ) {

      console.error(
        "MatchTrackerPreSeasonService: Storage service not available."
      );

      return false;

    }


    return window.MatchTrackerStorage.save(
      STORAGE_KEY,
      Array.isArray(matches)
        ? matches
        : []
    );

  }


  // ----------------------------------------------------------
  // CREATE PRE SEASON MATCH
  // ----------------------------------------------------------

  function createMatch(options = {}) {

    if (
      !window.MatchTrackerMatchModel ||
      typeof window.MatchTrackerMatchModel.createMatch !== "function"
    ) {

      console.error(
        "MatchTrackerPreSeasonService: Match model not available."
      );

      return null;

    }


    const match =
      window.MatchTrackerMatchModel.createMatch({

        ...options,

        type: "preseason",

        status: "setup"

      });


    const matches =
      getMatches();


    matches.push(match);


    const saved =
      saveMatches(matches);


    if (!saved) {

      console.error(
        "MatchTrackerPreSeasonService: Match could not be saved."
      );

      return null;

    }


    return match;

  }


  // ----------------------------------------------------------
  // GET ONE MATCH
  // ----------------------------------------------------------

  function getMatch(matchId) {

    const matches =
      getMatches();


    return matches.find(function (match) {

      return match &&
        match.id === matchId;

    }) || null;

  }


  // ----------------------------------------------------------
  // UPDATE MATCH
  // ----------------------------------------------------------

  function updateMatch(
    matchId,
    changes = {}
  ) {

    const matches =
      getMatches();


    const index =
      matches.findIndex(function (match) {

        return match &&
          match.id === matchId;

      });


    if (index === -1) {

      console.error(
        "MatchTrackerPreSeasonService: Match not found."
      );

      return null;

    }


    if (
      !window.MatchTrackerMatchModel ||
      typeof window.MatchTrackerMatchModel.updateMatch !== "function"
    ) {

      console.error(
        "MatchTrackerPreSeasonService: Match model not available."
      );

      return null;

    }


    const updatedMatch =
      window.MatchTrackerMatchModel.updateMatch(
        matches[index],
        changes
      );


    if (!updatedMatch) {
      return null;
    }


    matches[index] =
      updatedMatch;


    const saved =
      saveMatches(matches);


    if (!saved) {

      console.error(
        "MatchTrackerPreSeasonService: Match could not be saved."
      );

      return null;

    }


    return updatedMatch;

  }


  // ----------------------------------------------------------
  // DELETE MATCH
  // ----------------------------------------------------------

  function deleteMatch(matchId) {

    const matches =
      getMatches();


    const filtered =
      matches.filter(function (match) {

        return !(
          match &&
          match.id === matchId
        );

      });


    if (
      filtered.length ===
      matches.length
    ) {

      return false;

    }


    return saveMatches(
      filtered
    );

  }


  // ----------------------------------------------------------
  // CLEAR ALL PRE SEASON MATCHES
  // ----------------------------------------------------------
  // Useful during development and eventually when we reset
  // the temporary test data.
  // ----------------------------------------------------------

  function clearAllMatches() {

    return saveMatches([]);

  }


  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  window.MatchTrackerPreSeasonService = {

    getMatches:
      getMatches,

    getMatch:
      getMatch,

    createMatch:
      createMatch,

    updateMatch:
      updateMatch,

    deleteMatch:
      deleteMatch,

    clearAllMatches:
      clearAllMatches

  };


})();