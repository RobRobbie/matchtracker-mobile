// ============================================================
// MATCHTRACKER — MATCH MODEL
// ============================================================
// Core match data structure.
//
// This file contains match DATA only.
// It does not contain:
// - Screen/UI code
// - Button handling
// - Match event recording
// - Player selection
// - Report generation
//
// Features such as Pre Season and Season can create matches
// using this model.
// ============================================================

(function () {

  "use strict";


  // ----------------------------------------------------------
  // CREATE MATCH
  // ----------------------------------------------------------

  function createMatch(options = {}) {

    const now = new Date().toISOString();

    return {

      // --------------------------------------------------------
      // IDENTITY
      // --------------------------------------------------------

      id:
        options.id ||
        createMatchId(),

      type:
        options.type ||
        "preseason",

      status:
        options.status ||
        "setup",

      createdAt:
        options.createdAt ||
        now,

      updatedAt:
        now,


      // --------------------------------------------------------
      // MATCH DETAILS
      // --------------------------------------------------------

      opponent:
        options.opponent ||
        "",

      venue:
        options.venue ||
        "",

      date:
        options.date ||
        "",

      kickOff:
        options.kickOff ||
        "",


      // --------------------------------------------------------
      // TEAM
      // --------------------------------------------------------

      teamName:
        options.teamName ||
        "",

      squadId:
        options.squadId ||
        null,


      // --------------------------------------------------------
      // MATCH FORMAT
      // --------------------------------------------------------

      matchFormat:
        options.matchFormat ||
        "11-a-side",

      matchLength:
        options.matchLength ||
        null,


      // --------------------------------------------------------
      // FORMATION
      // --------------------------------------------------------

      formation:
        options.formation ||
        "",


      // --------------------------------------------------------
      // PLAYERS
      // --------------------------------------------------------

      startingXI:
        Array.isArray(options.startingXI)
          ? options.startingXI
          : [],

      substitutes:
        Array.isArray(options.substitutes)
          ? options.substitutes
          : [],


      // --------------------------------------------------------
      // MATCH EVENTS
      // --------------------------------------------------------

      events:
        Array.isArray(options.events)
          ? options.events
          : [],


      // --------------------------------------------------------
      // SCORE
      // --------------------------------------------------------

      score: {

        home:
          Number.isFinite(options.score?.home)
            ? options.score.home
            : 0,

        away:
          Number.isFinite(options.score?.away)
            ? options.score.away
            : 0

      },


      // --------------------------------------------------------
      // STATISTICS
      // --------------------------------------------------------

      statistics:
        options.statistics ||
        {},


      // --------------------------------------------------------
      // REPORT
      // --------------------------------------------------------

      report: {

        generated:
          options.report?.generated === true,

        generatedAt:
          options.report?.generatedAt ||
          null

      }

    };

  }


  // ----------------------------------------------------------
  // CREATE MATCH ID
  // ----------------------------------------------------------

  function createMatchId() {

    return (
      "MATCH-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()
    );

  }


  // ----------------------------------------------------------
  // UPDATE MATCH
  // ----------------------------------------------------------

  function updateMatch(match, changes = {}) {

    if (!match || typeof match !== "object") {

      console.error(
        "MatchTrackerMatchModel: Invalid match."
      );

      return null;
    }

    Object.keys(changes).forEach(function (key) {

      if (key === "id") {
        return;
      }

      match[key] = changes[key];

    });

    match.updatedAt =
      new Date().toISOString();

    return match;

  }


  // ----------------------------------------------------------
  // VALIDATE MATCH
  // ----------------------------------------------------------

  function validateMatch(match) {

    const errors = [];


    if (!match || typeof match !== "object") {

      errors.push(
        "Match data is missing."
      );

      return {
        valid: false,
        errors: errors
      };

    }


    if (!match.id) {

      errors.push(
        "Match ID is missing."
      );

    }


    if (!match.type) {

      errors.push(
        "Match type is missing."
      );

    }


    if (!match.status) {

      errors.push(
        "Match status is missing."
      );

    }


    return {

      valid:
        errors.length === 0,

      errors:
        errors

    };

  }


  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  window.MatchTrackerMatchModel = {

    createMatch:
      createMatch,

    updateMatch:
      updateMatch,

    validateMatch:
      validateMatch

  };


})();