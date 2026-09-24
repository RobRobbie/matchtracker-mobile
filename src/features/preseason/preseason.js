// ============================================================
// MATCHTRACKER — PRE SEASON FEATURE
// ============================================================
// Pre Season home screen.
//
// Current responsibility:
// - Create a new Pre Season match
// - Show upcoming matches
// - Show previous/completed matches
//
// Match creation and match data remain handled by their
// dedicated service/model modules.
// ============================================================

(function () {

  "use strict";

  const COLORS = {
    navy: "#1E3A5F",
    blueGreen: "#3F7D70",
    lightGrey: "#F1F4F6",
    darkText: "#243447",
    white: "#FFFFFF",
    silver: "#B8C2CC"
  };

  let callbacks = {
    onBack: null,
    onNewMatch: null,
    onOpenMatch: null,
    onEditMatch: null,
    onDeleteMatch: null
  };

  // ----------------------------------------------------------
  // INITIALISE
  // ----------------------------------------------------------

  function init(options = {}) {

    callbacks.onBack =
      typeof options.onBack === "function"
        ? options.onBack
        : null;

    callbacks.onNewMatch =
      typeof options.onNewMatch === "function"
        ? options.onNewMatch
        : null;

    callbacks.onOpenMatch =
      typeof options.onOpenMatch === "function"
        ? options.onOpenMatch
        : null;

    callbacks.onEditMatch =
      typeof options.onEditMatch === "function"
        ? options.onEditMatch
        : null;

    callbacks.onDeleteMatch =
      typeof options.onDeleteMatch === "function"
        ? options.onDeleteMatch
        : null;
  }


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  function render(container) {

    if (!container) {
      console.error(
        "MatchTrackerPreSeason: container not found."
      );
      return;
    }

    container.innerHTML = "";

    container.style.background = COLORS.lightGrey;
    container.style.color = COLORS.darkText;
    container.style.minHeight = "100vh";
    container.style.boxSizing = "border-box";
    container.style.padding = "20px";


    // --------------------------------------------------------
    // HEADER
    // --------------------------------------------------------

    const header = document.createElement("div");

    header.style.background = COLORS.navy;
    header.style.color = COLORS.white;
    header.style.borderRadius = "18px";
    header.style.padding = "20px";
    header.style.marginBottom = "20px";
    header.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.08)";

    header.innerHTML = `
      <div style="
        font-size:13px;
        font-weight:700;
        letter-spacing:2px;
        opacity:0.75;
        margin-bottom:6px;
      ">
        MATCHTRACKER
      </div>

      <div style="
        font-size:28px;
        font-weight:800;
        line-height:1.1;
      ">
        Pre Season
      </div>

      <div style="
        font-size:14px;
        margin-top:8px;
        opacity:0.85;
      ">
        Standalone matches, squad testing and player statistics.
      </div>
    `;

    container.appendChild(header);


    // --------------------------------------------------------
    // NEW MATCH CARD
    // --------------------------------------------------------

    const newMatchCard = document.createElement("div");

    newMatchCard.style.background = COLORS.white;
    newMatchCard.style.borderRadius = "18px";
    newMatchCard.style.padding = "20px";
    newMatchCard.style.marginBottom = "16px";
    newMatchCard.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.07)";
    newMatchCard.style.borderLeft =
      "6px solid " + COLORS.blueGreen;
    newMatchCard.style.boxSizing = "border-box";

    const newMatchTitle = document.createElement("div");

    newMatchTitle.innerText = "NEW PRE-SEASON MATCH";
    newMatchTitle.style.fontSize = "20px";
    newMatchTitle.style.fontWeight = "800";
    newMatchTitle.style.color = COLORS.darkText;

    newMatchCard.appendChild(newMatchTitle);

    const newMatchDescription = document.createElement("div");

    newMatchDescription.innerText =
      "Create a standalone match and choose the opponent for this game.";

    newMatchDescription.style.fontSize = "14px";
    newMatchDescription.style.lineHeight = "1.5";
    newMatchDescription.style.color = "#5C6B78";
    newMatchDescription.style.marginTop = "8px";
    newMatchDescription.style.marginBottom = "16px";

    newMatchCard.appendChild(newMatchDescription);

    const newMatchButton = document.createElement("button");

    newMatchButton.type = "button";
    newMatchButton.innerText = "＋  New Pre-Season Match";
    newMatchButton.style.width = "100%";
    newMatchButton.style.minHeight = "54px";
    newMatchButton.style.border = "none";
    newMatchButton.style.borderRadius = "12px";
    newMatchButton.style.background = COLORS.blueGreen;
    newMatchButton.style.color = COLORS.white;
    newMatchButton.style.fontSize = "16px";
    newMatchButton.style.fontWeight = "800";
    newMatchButton.style.cursor = "pointer";

    newMatchButton.onclick = function () {
      if (callbacks.onNewMatch) {
        callbacks.onNewMatch();
      } else {
        console.log(
          "MatchTracker Pre Season: New Match not connected yet."
        );
      }
    };

    newMatchCard.appendChild(newMatchButton);
    container.appendChild(newMatchCard);


    // --------------------------------------------------------
    // UPCOMING / PREVIOUS MATCHES
    // --------------------------------------------------------

    renderSavedMatches(container);


    // --------------------------------------------------------
    // BACK BUTTON
    // --------------------------------------------------------

    const backButton = document.createElement("button");

    backButton.type = "button";
    backButton.innerText = "←  Back to Home";
    backButton.style.width = "100%";
    backButton.style.minHeight = "52px";
    backButton.style.border =
      "1px solid " + COLORS.silver;
    backButton.style.borderRadius = "12px";
    backButton.style.background = COLORS.white;
    backButton.style.color = COLORS.darkText;
    backButton.style.fontSize = "16px";
    backButton.style.fontWeight = "800";
    backButton.style.cursor = "pointer";

    backButton.onclick = function () {
      if (callbacks.onBack) {
        callbacks.onBack();
      } else {
        console.log(
          "MatchTracker Pre Season: Back not connected yet."
        );
      }
    };

    container.appendChild(backButton);
  }


  function previousStatusesForRender(match) {
    const status = String(match && match.status || "").toLowerCase();
    return ["completed", "complete", "finished"].indexOf(status) !== -1;
  }


  // ----------------------------------------------------------
  // RENDER MATCH SECTION
  // ----------------------------------------------------------

  function renderMatchSection(
    container,
    titleText,
    descriptionText,
    matches,
    emptyText,
    options = {}
  ) {

    const sectionCard = document.createElement("div");

    sectionCard.style.background = COLORS.white;
    sectionCard.style.borderRadius = "18px";
    sectionCard.style.padding = "20px";
    sectionCard.style.marginBottom = "20px";
    sectionCard.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.07)";

    const title = document.createElement("div");

    title.innerText = titleText;
    title.style.fontSize = "20px";
    title.style.fontWeight = "800";
    title.style.color = COLORS.darkText;

    sectionCard.appendChild(title);

    const description = document.createElement("div");

    description.innerText = descriptionText;
    description.style.fontSize = "14px";
    description.style.lineHeight = "1.5";
    description.style.color = "#5C6B78";
    description.style.marginTop = "8px";

    sectionCard.appendChild(description);

    if (!matches || matches.length === 0) {

      const empty = document.createElement("div");

      empty.innerText = emptyText;
      empty.style.marginTop = "16px";
      empty.style.padding = "16px";
      empty.style.border =
        "1px dashed " + COLORS.silver;
      empty.style.borderRadius = "12px";
      empty.style.textAlign = "center";
      empty.style.color = "#71808C";
      empty.style.fontSize = "14px";

      sectionCard.appendChild(empty);

    } else {

      const list = document.createElement("div");
      list.style.marginTop = "16px";

      matches.forEach(function (match) {

        const matchRow = document.createElement("div");

        matchRow.style.border = "1px solid #E1E6EA";
        matchRow.style.borderRadius = "12px";
        matchRow.style.padding = "16px";
        matchRow.style.marginBottom = "12px";
        matchRow.style.background = COLORS.lightGrey;

        const opponent = document.createElement("div");

        opponent.innerText =
          "vs " + (match.opponent || "Opponent TBC");

        opponent.style.fontSize = "18px";
        opponent.style.fontWeight = "800";
        opponent.style.color = COLORS.darkText;

        const details = document.createElement("div");

        details.innerText = [
          match.date || "Date TBC",
          match.kickOff || "Kick Off TBC",
          match.venue || "Venue TBC"
        ].join(" • ");

        details.style.fontSize = "14px";
        details.style.color = "#5C6B78";
        details.style.marginTop = "6px";

        matchRow.appendChild(opponent);
        matchRow.appendChild(details);

        const actionArea = document.createElement("div");
        actionArea.style.marginTop = "14px";

        const enterButton = document.createElement("button");
        enterButton.type = "button";
        enterButton.innerText = "Enter Match →";
        enterButton.style.width = "100%";
        enterButton.style.minHeight = "48px";
        enterButton.style.border = "none";
        enterButton.style.borderRadius = "10px";
        enterButton.style.background = COLORS.blueGreen;
        enterButton.style.color = COLORS.white;
        enterButton.style.fontWeight = "800";
        enterButton.style.cursor = "pointer";
        enterButton.onclick = function () {
          if (callbacks.onOpenMatch) callbacks.onOpenMatch(match);
        };

        actionArea.appendChild(enterButton);
        matchRow.appendChild(actionArea);

        list.appendChild(matchRow);
      });

      sectionCard.appendChild(list);
    }

    container.appendChild(sectionCard);
  }


  // ----------------------------------------------------------
  // RENDER SAVED MATCHES
  // ----------------------------------------------------------

  function renderSavedMatches(container) {

    if (!window.MatchTrackerPreSeasonService) {
      console.error(
        "MatchTrackerPreSeason: Match service not available."
      );
      return;
    }

    const matches =
      window.MatchTrackerPreSeasonService.getMatches();

    console.log(
      "MatchTracker Pre Season: Saved matches",
      matches
    );

    // Matches become Previous only when the match workflow marks
    // them completed/complete/finished. New setup records therefore
    // remain in Upcoming until the match is actually completed.
    const previousStatuses = [
      "completed",
      "complete",
      "finished"
    ];

    const previousMatches = (matches || []).filter(function (match) {
      return match &&
        previousStatuses.indexOf(
          String(match.status || "").toLowerCase()
        ) !== -1;
    });

    const upcomingMatches = (matches || []).filter(function (match) {
      return match &&
        previousStatuses.indexOf(
          String(match.status || "").toLowerCase()
        ) === -1;
    });

    renderMatchSection(
      container,
      "UPCOMING MATCHES",
      "Matches that have been created and are still to be played.",
      upcomingMatches,
      "No upcoming pre-season matches yet."
    );

    renderMatchSection(
      container,
      "PREVIOUS MATCHES",
      "Completed pre-season matches will appear here.",
      previousMatches,
      "No previous pre-season matches yet.",
      {}
    );
  }


  // ----------------------------------------------------------
  // PUBLIC MODULE
  // ----------------------------------------------------------

  window.MatchTrackerPreSeason = {
    init: init,
    render: render
  };

})();
