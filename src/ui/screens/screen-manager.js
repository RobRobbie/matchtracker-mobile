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
// - New Pre Season Match
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

  let newPreSeasonMatchContainer = null;


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
  // CREATE NEW PRE SEASON MATCH CONTAINER
  // ----------------------------------------------------------

  function createNewPreSeasonMatchContainer() {

    if (newPreSeasonMatchContainer) {
      return newPreSeasonMatchContainer;
    }


    newPreSeasonMatchContainer =
      document.createElement("div");


    newPreSeasonMatchContainer.id =
      "matchtrackerNewPreSeasonMatch";


    newPreSeasonMatchContainer.style.display =
      "none";


    document.body.appendChild(
      newPreSeasonMatchContainer
    );


    return newPreSeasonMatchContainer;

  }


  // ----------------------------------------------------------
  // HIDE ALL NEW SCREENS
  // ----------------------------------------------------------

  function hideAllScreens() {

    if (homeContainer) {

      homeContainer.style.display =
        "none";

    }


    if (preseasonContainer) {

      preseasonContainer.style.display =
        "none";

    }


    if (newPreSeasonMatchContainer) {

      newPreSeasonMatchContainer.style.display =
        "none";

    }

  }


  // ----------------------------------------------------------
  // SHOW HOME
  // ----------------------------------------------------------

  function showHome() {

    if (!homeContainer) {
      return;
    }


    hideAllScreens();


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


    hideAllScreens();


    container.style.display =
      "block";


    if (window.MatchTrackerPreSeason) {

      window.MatchTrackerPreSeason.init({

        onBack: function () {

          showHome();

        },


        onNewMatch: function () {

          showNewPreSeasonMatch();

        }

      });


      window.MatchTrackerPreSeason.render(
        container
      );

    }

  }


  // ----------------------------------------------------------
  // SHOW NEW PRE SEASON MATCH
  // ----------------------------------------------------------

  function showNewPreSeasonMatch() {

    const container =
      createNewPreSeasonMatchContainer();


    hideAllScreens();


    container.style.display =
      "block";


    if (
      !window.MatchTrackerNewPreSeasonMatch
    ) {

      console.error(
        "MatchTrackerScreenManager: " +
        "New Pre Season Match screen not available."
      );

      return;

    }


    window.MatchTrackerNewPreSeasonMatch.init({

      onCancel: function () {

        showPreSeason();

      },


      onCreated: function (match) {

        console.log(
          "MatchTracker: Pre Season match created.",
          match
        );


        // ----------------------------------------------------
        // The next stage will take the coach from here into
        // squad/player selection.
        //
        // For now we simply confirm that the match was created.
        // ----------------------------------------------------

        alert(
          "Pre Season match created successfully."
        );
        showPreSeason();
      }

    });


    window.MatchTrackerNewPreSeasonMatch.render(
      container
    );

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
        "MatchTrackerScreenManager: " +
        "Home container not found."
      );

      return;

    }


    createPreSeasonContainer();

    createNewPreSeasonMatchContainer();


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

    init:
      init,

    showHome:
      showHome,

    showPreSeason:
      showPreSeason,

    showNewPreSeasonMatch:
      showNewPreSeasonMatch

  };


})();