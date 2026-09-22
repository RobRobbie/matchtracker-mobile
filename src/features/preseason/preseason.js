// ============================================================
// MATCHTRACKER — PRE SEASON FEATURE
// ============================================================
// Pre Season screen only.
//
// This module will eventually handle:
// - Standalone pre-season matches
// - Opponent selection
// - Pre-season squad management
// - Starting XI and substitutes
// - Match statistics
// - Match reports
//
// Existing match logic is NOT moved here yet.
// We are building the new feature safely in stages.
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
    onNewMatch: null
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

    const newMatchCard =
      document.createElement("div");

    newMatchCard.style.background = COLORS.white;
    newMatchCard.style.borderRadius = "18px";
    newMatchCard.style.padding = "20px";
    newMatchCard.style.marginBottom = "16px";
    newMatchCard.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.07)";
    newMatchCard.style.borderLeft =
      "6px solid " + COLORS.blueGreen;
    newMatchCard.style.boxSizing = "border-box";

    const newMatchTitle =
      document.createElement("div");

    newMatchTitle.innerText =
      "NEW PRE-SEASON MATCH";

    newMatchTitle.style.fontSize = "20px";
    newMatchTitle.style.fontWeight = "800";
    newMatchTitle.style.color = COLORS.darkText;

    newMatchCard.appendChild(newMatchTitle);


    const newMatchDescription =
      document.createElement("div");

    newMatchDescription.innerText =
      "Create a standalone match and choose the opponent for this game.";

    newMatchDescription.style.fontSize = "14px";
    newMatchDescription.style.lineHeight = "1.5";
    newMatchDescription.style.color = "#5C6B78";
    newMatchDescription.style.marginTop = "8px";
    newMatchDescription.style.marginBottom = "16px";

    newMatchCard.appendChild(
      newMatchDescription
    );


    const newMatchButton =
      document.createElement("button");

    newMatchButton.type = "button";
    newMatchButton.innerText =
      "＋  New Pre-Season Match";

    newMatchButton.style.width = "100%";
    newMatchButton.style.minHeight = "54px";
    newMatchButton.style.border = "none";
    newMatchButton.style.borderRadius = "12px";
    newMatchButton.style.background =
      COLORS.blueGreen;
    newMatchButton.style.color =
      COLORS.white;
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

    newMatchCard.appendChild(
      newMatchButton
    );

    container.appendChild(
      newMatchCard
    );


    // --------------------------------------------------------
    // PREVIOUS MATCHES
    // --------------------------------------------------------

    const previousCard =
      document.createElement("div");

    previousCard.style.background =
      COLORS.white;
    previousCard.style.borderRadius =
      "18px";
    previousCard.style.padding =
      "20px";
    previousCard.style.marginBottom =
      "20px";
    previousCard.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.07)";

    previousCard.innerHTML = `
      <div style="
        font-size:20px;
        font-weight:800;
        color:${COLORS.darkText};
      ">
        PREVIOUS MATCHES
      </div>

      <div style="
        font-size:14px;
        line-height:1.5;
        color:#5C6B78;
        margin-top:8px;
      ">
        Completed pre-season matches will appear here.
      </div>

      <div style="
        margin-top:16px;
        padding:16px;
        border:1px dashed ${COLORS.silver};
        border-radius:12px;
        text-align:center;
        color:#71808C;
        font-size:14px;
      ">
        No pre-season matches yet.
      </div>
    `;

    container.appendChild(
      previousCard
    );


    // --------------------------------------------------------
    // BACK BUTTON
    // --------------------------------------------------------

    const backButton =
      document.createElement("button");

    backButton.type = "button";
    backButton.innerText =
      "←  Back to Home";

    backButton.style.width = "100%";
    backButton.style.minHeight = "52px";
    backButton.style.border =
      "1px solid " + COLORS.silver;
    backButton.style.borderRadius = "12px";
    backButton.style.background =
      COLORS.white;
    backButton.style.color =
      COLORS.darkText;
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

    container.appendChild(
      backButton
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