// ============================================================
// MATCHTRACKER — SCREEN MANAGER
// ============================================================
// Controls which major MatchTracker screen is visible.
//
// The screen manager connects features together without putting
// navigation logic inside the individual feature modules.
//
// Current screens:
// - Home
// - Pre Season
//
// The existing MatchTracker application remains protected and
// hidden while the new structure is being developed.
// ============================================================

(function () {

  "use strict";


  // ----------------------------------------------------------
  // SCREEN REFERENCES
  // ----------------------------------------------------------

  let homeContainer = null;
  let preseasonContainer = null;


  // ----------------------------------------------------------
  // CREATE PRE SEASON CONTAINER
  // ----------------------------------------------------------

  function createPreSeasonContainer() {

    if (preseasonContainer) {
      return preseasonContainer;
    }

    preseasonContainer =
      document.createElement("div");

    preseasonContainer.id =
      "matchtrackerPreSeason";

    preseasonContainer.style.display =
      "none";

    document.body.appendChild(
      preseasonContainer
    );

    return preseasonContainer;
  }


  // ----------------------------------------------------------
  // SHOW HOME
  // ----------------------------------------------------------

  function showHome() {

    if (!homeContainer) {
      return;
    }

    if (preseasonContainer) {
      preseasonContainer.style.display =
        "none";
    }

    homeContainer.style.display =
      "block";

    if (window.MatchTrackerHome) {

      window.MatchTrackerHome.init({

        onPreSeason: function () {
          showPreSeason();
        },

        onSeason: function () {
          console.log(
            "MatchTracker: Season screen not connected yet."
          );
        },

        onSettings: function () {
          console.log(
            "MatchTracker: Settings screen not connected yet."
          );
        }

      });

      window.MatchTrackerHome.render(
        homeContainer
      );
    }

  }


  // ----------------------------------------------------------
  // SHOW PRE SEASON
  // ----------------------------------------------------------

  function showPreSeason() {

    const container =
      createPreSeasonContainer();

    homeContainer.style.display =
      "none";

    container.style.display =
      "block";

    if (window.MatchTrackerPreSeason) {

      window.MatchTrackerPreSeason.init({

        onBack: function () {
          showHome();
        },

        onNewMatch: function () {
          console.log(
            "MatchTracker: New Pre-Season Match not connected yet."
          );
        }

      });

      window.MatchTrackerPreSeason.render(
        container
      );
    }

  }


  // ----------------------------------------------------------
  // INITIALISE SCREEN MANAGER
  // ----------------------------------------------------------

  function init() {

    homeContainer =
      document.getElementById(
        "matchtrackerHome"
      );

    if (!homeContainer) {

      console.error(
        "MatchTrackerScreenManager: Home container not found."
      );

      return;
    }

    createPreSeasonContainer();

    // Keep the original application hidden
    // while the new screen structure is being built.

    const oldApp =
      document.getElementById(
        "matchtrackerApp"
      );

    if (oldApp) {
      oldApp.style.display =
        "none";
    }

    showHome();
  }


  // ----------------------------------------------------------
  // START AFTER PAGE LOAD
  // ----------------------------------------------------------

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      init();
    }
  );


  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  window.MatchTrackerScreenManager = {

    init: init,
    showHome: showHome,
    showPreSeason: showPreSeason

  };

})();