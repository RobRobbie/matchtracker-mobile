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
  let squadContainer = null;
  let opponentsContainer = null;
  let preSeasonSquadSelectionContainer = null;
  let preSeasonStartingXIContainer = null;


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


  function createSimpleContainer(id) {
    const container = document.createElement("div");
    container.id = id;
    container.style.display = "none";
    document.body.appendChild(container);
    return container;
  }


  // ----------------------------------------------------------
  // CREATE PRE SEASON SQUAD SELECTION CONTAINER
  // ----------------------------------------------------------

  function createPreSeasonSquadSelectionContainer() {
    if (preSeasonSquadSelectionContainer) return preSeasonSquadSelectionContainer;

    preSeasonSquadSelectionContainer = document.createElement("div");
    preSeasonSquadSelectionContainer.id = "matchtrackerPreSeasonSquadSelection";
    preSeasonSquadSelectionContainer.style.display = "none";
    document.body.appendChild(preSeasonSquadSelectionContainer);
    return preSeasonSquadSelectionContainer;
  }


  // ----------------------------------------------------------
  // CREATE PRE SEASON STARTING XI CONTAINER
  // ----------------------------------------------------------

  function createPreSeasonStartingXIContainer() {
    if (preSeasonStartingXIContainer) return preSeasonStartingXIContainer;

    preSeasonStartingXIContainer = document.createElement("div");
    preSeasonStartingXIContainer.id = "matchtrackerPreSeasonStartingXI";
    preSeasonStartingXIContainer.style.display = "none";
    document.body.appendChild(preSeasonStartingXIContainer);
    return preSeasonStartingXIContainer;
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


    if (newPreSeasonMatchContainer) newPreSeasonMatchContainer.style.display = "none";
    if (squadContainer) squadContainer.style.display = "none";
    if (opponentsContainer) opponentsContainer.style.display = "none";
    if (preSeasonSquadSelectionContainer) preSeasonSquadSelectionContainer.style.display = "none";
    if (preSeasonStartingXIContainer) preSeasonStartingXIContainer.style.display = "none";

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
          console.log("MatchTracker: Settings screen not connected yet.");
        },

        onSquad: function () {
          showSquad();
        },

        onOpponents: function () {
          showOpponents();
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
        },

        onOpenMatch: function (match) {
          // Enter Match opens the editable match record first.
          // Team selection only begins when the coach chooses Start Match.
          showEditPreSeasonMatch(match);
        },

        onEditMatch: function (match) {
          showEditPreSeasonMatch(match);
        },

        onDeleteMatch: function (match) {
          if (!match || !window.MatchTrackerPreSeasonService) return;
          const opponent = match.opponent || "this match";
          if (!window.confirm("Remove the match against " + opponent + "? This cannot be undone.")) return;
          window.MatchTrackerPreSeasonService.deleteMatch(match.id);
          showPreSeason();
        }

      });


      window.MatchTrackerPreSeason.render(
        container
      );

    }

  }


  // ----------------------------------------------------------
  // SHOW SQUAD
  // ----------------------------------------------------------

  function showSquad(options = {}) {
    if (!squadContainer) squadContainer = createSimpleContainer("matchtrackerSquad");
    hideAllScreens();
    squadContainer.style.display = "block";
    if (window.MatchTrackerSquad) {
      window.MatchTrackerSquad.init({
        onBack: typeof options.onBack === "function" ? options.onBack : showHome
      });
      window.MatchTrackerSquad.render(squadContainer);
    }
  }


  // ----------------------------------------------------------
  // SHOW OPPONENTS
  // ----------------------------------------------------------

  function showOpponents() {
    if (!opponentsContainer) opponentsContainer = createSimpleContainer("matchtrackerOpponents");
    hideAllScreens();
    opponentsContainer.style.display = "block";
    if (window.MatchTrackerOpponents) {
      window.MatchTrackerOpponents.init({ onBack: showHome });
      window.MatchTrackerOpponents.render(opponentsContainer);
    }
  }


  // ----------------------------------------------------------
  // SHOW NEW PRE SEASON MATCH
  // ----------------------------------------------------------

  function showNewPreSeasonMatch() {

    const container =
      createNewPreSeasonMatchContainer();
    createPreSeasonSquadSelectionContainer();
    createPreSeasonStartingXIContainer();


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
        // Creating a match only creates the fixture record.
        // Team selection starts later from Enter Match → Start Match.
        showPreSeason();
      }

    });


    window.MatchTrackerNewPreSeasonMatch.render(
      container
    );

  }


  // ----------------------------------------------------------
  // SHOW EDIT PRE SEASON MATCH
  // ----------------------------------------------------------

  function showEditPreSeasonMatch(match) {
    const container = createNewPreSeasonMatchContainer();
    hideAllScreens();
    container.style.display = "block";

    if (!window.MatchTrackerNewPreSeasonMatch) {
      console.error("MatchTrackerScreenManager: New Pre Season Match screen not available.");
      return;
    }

    window.MatchTrackerNewPreSeasonMatch.init({
      match: match,
      onCancel: function () {
        showPreSeason();
      },
      onUpdated: function () {
        showPreSeason();
      },
      onStartMatch: function (updatedMatch) {
        showPreSeasonSquadSelection(updatedMatch || match);
      },
      onDeleteMatch: function (matchToDelete) {
        if (!matchToDelete || !window.MatchTrackerPreSeasonService) return;
        window.MatchTrackerPreSeasonService.deleteMatch(matchToDelete.id);
        showPreSeason();
      }
    });

    window.MatchTrackerNewPreSeasonMatch.render(container);
  }


  // ----------------------------------------------------------
  // SHOW PRE SEASON SQUAD SELECTION
  // ----------------------------------------------------------

  function showPreSeasonSquadSelection(match) {
    const container = createPreSeasonSquadSelectionContainer();
    hideAllScreens();
    container.style.display = "block";

    if (!window.MatchTrackerPreSeasonSquadSelection) {
      console.error("MatchTrackerScreenManager: Pre Season Squad Selection not available.");
      return;
    }

    window.MatchTrackerPreSeasonSquadSelection.init({
      match: match,
      onCancel: function () {
        showEditPreSeasonMatch(match);
      },
      onManageSquad: function () {
        showSquad({
          onBack: function () {
            const refreshed = window.MatchTrackerPreSeasonService
              ? window.MatchTrackerPreSeasonService.getMatch(match.id)
              : match;
            showPreSeasonSquadSelection(refreshed || match);
          }
        });
      },
      onContinue: function (updatedMatch) {
        console.log("MatchTracker: Match squad selected.", updatedMatch);
        showPreSeasonStartingXI(updatedMatch);
      }
    });

    window.MatchTrackerPreSeasonSquadSelection.render(container);
  }


  // ----------------------------------------------------------
  // SHOW PRE SEASON STARTING XI
  // ----------------------------------------------------------

  function showPreSeasonStartingXI(match) {
    const container = createPreSeasonStartingXIContainer();
    hideAllScreens();
    container.style.display = "block";

    if (!window.MatchTrackerPreSeasonStartingXI) {
      console.error("MatchTrackerScreenManager: Pre Season Starting XI not available.");
      return;
    }

    window.MatchTrackerPreSeasonStartingXI.init({
      match: match,
      onBack: function () {
        showPreSeasonSquadSelection(match);
      },
      onSaved: function (updatedMatch) {
        console.log("MatchTracker: Starting XI saved.", updatedMatch);
        alert("Starting XI saved. Bench selection is the next stage.");
      }
    });

    window.MatchTrackerPreSeasonStartingXI.render(container);
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
    createPreSeasonSquadSelectionContainer();
    createPreSeasonStartingXIContainer();


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