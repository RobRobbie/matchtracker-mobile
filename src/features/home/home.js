// ============================================================
// MATCHTRACKER — HOME FEATURE
// ============================================================
// Home screen only.
// This file does not contain match logic, player logic,
// season logic, or report logic.
//
// Other features can connect to Home through the callbacks
// supplied to MatchTrackerHome.init().
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
    onPreSeason: null,
    onSeason: null,
    onSettings: null,
    onSquad: null,
    onOpponents: null
  };

  // ----------------------------------------------------------
  // INITIALISE HOME
  // ----------------------------------------------------------

  function init(options = {}) {

    callbacks.onPreSeason =
      typeof options.onPreSeason === "function"
        ? options.onPreSeason
        : null;

    callbacks.onSeason =
      typeof options.onSeason === "function"
        ? options.onSeason
        : null;

    callbacks.onSettings = typeof options.onSettings === "function" ? options.onSettings : null;
    callbacks.onSquad = typeof options.onSquad === "function" ? options.onSquad : null;
    callbacks.onOpponents = typeof options.onOpponents === "function" ? options.onOpponents : null;
  }

  // ----------------------------------------------------------
  // CREATE HOME SCREEN
  // ----------------------------------------------------------

  function render(container) {

    if (!container) {
      console.error("MatchTrackerHome: container not found.");
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
    header.style.padding = "24px 20px";
    header.style.marginBottom = "20px";
    header.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";

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
        font-size:30px;
        font-weight:800;
        line-height:1.1;
      ">
        Coach Home
      </div>

      <div style="
        font-size:14px;
        margin-top:8px;
        opacity:0.85;
      ">
        Manage your team, matches and season.
      </div>
    `;

    container.appendChild(header);

    // --------------------------------------------------------
    // PRE SEASON CARD
    // --------------------------------------------------------

    const preSeasonCard = createFeatureCard({
      title: "PRE SEASON",
      description:
        "Create individual practice or trial matches, manage your test squad and record match statistics.",
      buttonText: "Open Pre Season",
      accent: COLORS.blueGreen,
      onClick: callbacks.onPreSeason
    });

    container.appendChild(preSeasonCard);

    // --------------------------------------------------------
    // SEASON CARD
    // --------------------------------------------------------

    const seasonCard = createFeatureCard({
      title: "SEASON",
      description:
        "Set up your season, manage your squad, record fixtures and build your season statistics.",
      buttonText: "Open Season",
      accent: COLORS.navy,
      onClick: callbacks.onSeason
    });

    container.appendChild(seasonCard);

    // --------------------------------------------------------
    // TEAM MANAGEMENT
    // --------------------------------------------------------

    const managementHeading = document.createElement("div");
    managementHeading.innerText = "TEAM MANAGEMENT";
    managementHeading.style.cssText = "font-size:13px;font-weight:800;letter-spacing:1.5px;margin:26px 4px 10px;color:" + COLORS.darkText;
    container.appendChild(managementHeading);

    container.appendChild(createFeatureCard({
      title: "SQUAD",
      description: "Add and manage your players at any time. Players can also be added while preparing a match.",
      buttonText: "Open Squad",
      accent: COLORS.navy,
      onClick: callbacks.onSquad
    }));

    container.appendChild(createFeatureCard({
      title: "OPPONENTS",
      description: "Keep a reusable list of opponents. Add a new opponent whenever you need one.",
      buttonText: "Open Opponents",
      accent: COLORS.blueGreen,
      onClick: callbacks.onOpponents
    }));

    // --------------------------------------------------------
    // QUICK ACCESS
    // --------------------------------------------------------

    const quickHeading = document.createElement("div");

    quickHeading.innerText = "QUICK ACCESS";

    quickHeading.style.fontSize = "13px";
    quickHeading.style.fontWeight = "800";
    quickHeading.style.letterSpacing = "1.5px";
    quickHeading.style.margin = "26px 4px 10px";

    quickHeading.style.color = COLORS.darkText;

    container.appendChild(quickHeading);

    // --------------------------------------------------------
    // SETTINGS
    // --------------------------------------------------------

    const settingsButton = document.createElement("button");

    settingsButton.type = "button";
    settingsButton.innerText = "⚙  Settings";

    settingsButton.style.width = "100%";
    settingsButton.style.minHeight = "58px";
    settingsButton.style.border = "1px solid " + COLORS.silver;
    settingsButton.style.borderRadius = "14px";
    settingsButton.style.background = COLORS.white;
    settingsButton.style.color = COLORS.darkText;
    settingsButton.style.fontSize = "17px";
    settingsButton.style.fontWeight = "700";
    settingsButton.style.cursor = "pointer";
    settingsButton.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";

    settingsButton.onclick = function () {

      if (callbacks.onSettings) {
        callbacks.onSettings();
      } else {
        console.log("MatchTracker Home: Settings not connected yet.");
      }

    };

    container.appendChild(settingsButton);

  }

  // ----------------------------------------------------------
  // FEATURE CARD
  // ----------------------------------------------------------

  function createFeatureCard(options) {

    const card = document.createElement("div");

    card.style.background = COLORS.white;
    card.style.borderRadius = "18px";
    card.style.padding = "20px";
    card.style.marginBottom = "16px";
    card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.07)";
    card.style.borderLeft =
      "6px solid " + options.accent;
    card.style.boxSizing = "border-box";

    const title = document.createElement("div");

    title.innerText = options.title;

    title.style.fontSize = "22px";
    title.style.fontWeight = "800";
    title.style.color = COLORS.darkText;
    title.style.letterSpacing = "0.5px";

    card.appendChild(title);

    const description = document.createElement("div");

    description.innerText = options.description;

    description.style.fontSize = "14px";
    description.style.lineHeight = "1.5";
    description.style.color = "#5C6B78";
    description.style.marginTop = "8px";
    description.style.marginBottom = "16px";

    card.appendChild(description);

    const button = document.createElement("button");

    button.type = "button";
    button.innerText = options.buttonText;

    button.style.width = "100%";
    button.style.minHeight = "52px";
    button.style.border = "none";
    button.style.borderRadius = "12px";
    button.style.background = options.accent;
    button.style.color = COLORS.white;
    button.style.fontSize = "16px";
    button.style.fontWeight = "800";
    button.style.cursor = "pointer";

    button.onclick = function () {

      if (typeof options.onClick === "function") {
        options.onClick();
      } else {
        console.log(
          "MatchTracker Home: " +
          options.title +
          " is not connected yet."
        );
      }

    };

    card.appendChild(button);

    return card;
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

    window.MatchTrackerHome = {
    init: init,
    render: render
  };

  document.addEventListener("DOMContentLoaded", function () {

    const homeContainer =
      document.getElementById("matchtrackerHome");

    if (homeContainer) {
      MatchTrackerHome.init();
      MatchTrackerHome.render(homeContainer);
    }

  });

})();