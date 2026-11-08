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
    container.className = "mt-home";
    container.style.cssText = "min-height:100vh;box-sizing:border-box;padding:16px;background:#F1F4F6;color:#243447;";

    const primaryGrid = document.createElement("div");
    primaryGrid.className = "mt-home-primary-grid";
    primaryGrid.appendChild(createVisualCard({
      title:"Pre Season", description:"Practice, trials & squad testing",
      icon:"▦", accent:COLORS.blueGreen, image:"preseason-training.jpg", onClick:callbacks.onPreSeason
    }));
    primaryGrid.appendChild(createVisualCard({
      title:"Season", description:"Fixtures, matches & statistics",
      icon:"🏆", accent:COLORS.navy, image:"season-stadium.jpg", onClick:callbacks.onSeason
    }));
    container.appendChild(primaryGrid);

    const managementHeading = document.createElement("div");
    managementHeading.className = "mt-section-label";
    managementHeading.innerText = "TEAM MANAGEMENT";
    container.appendChild(managementHeading);

    const managementGrid = document.createElement("div");
    managementGrid.className = "mt-home-secondary-grid";
    managementGrid.appendChild(createVisualCard({
      title:"Squad", description:"Manage your players",
      iconMarkup:`<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="14" r="5.5"/><circle cx="11.5" cy="18" r="4.2"/><circle cx="36.5" cy="18" r="4.2"/><path d="M12 36c0-6.2 5.1-11 12-11s12 4.8 12 11v2H12z"/><path d="M3.5 36v-1.5c0-4.6 3.1-8.1 7.5-8.8M44.5 36v-1.5c0-4.6-3.1-8.1-7.5-8.8"/></g></svg>`,
      accent:COLORS.navy, image:"squad-team.jpg", onClick:callbacks.onSquad
    }));
    managementGrid.appendChild(createVisualCard({
      title:"Opponents", description:"Teams & match history",
      iconMarkup:`<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h14l4 4 4-4h16v25H27l-4 4-4-4H5z"/><path d="M23 14v25"/></g><text x="23" y="29" text-anchor="middle" fill="currentColor" font-size="9" font-weight="800">VS</text></svg>`,
      accent:COLORS.blueGreen, image:"opponents-tactics.jpg", onClick:callbacks.onOpponents
    }));
    container.appendChild(managementGrid);

    const settings = document.createElement("button");
    settings.type = "button";
    settings.className = "mt-settings-button";
    settings.innerHTML = `<span class="mt-settings-icon">⚙</span><span>Settings</span><span class="mt-card-chevron">›</span>`;
    settings.onclick = function () {
      if (callbacks.onSettings) callbacks.onSettings();
      else console.log("MatchTracker Home: Settings not connected yet.");
    };
    container.appendChild(settings);

    const buildInfo = document.createElement("div");
    buildInfo.className = "mt-build-info";
    buildInfo.innerHTML = "<strong>MatchTracker 2027.028</strong><span>Build code: MT27-028 · Availability order, substitution reasons and visual consistency</span>";
    container.appendChild(buildInfo);
  }

  function createVisualCard(options) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "mt-feature-card" + (options.image ? " mt-feature-card-image" : "");
    if (options.image) card.style.setProperty("--mt-card-image", `url("assets/${options.image}")`);
    card.style.setProperty("--mt-accent", options.accent);
    card.innerHTML = `
      <span class="mt-feature-photo" aria-hidden="true"></span>
      <span class="mt-feature-icon" aria-hidden="true">${options.iconMarkup || options.icon}</span>
      <span class="mt-feature-copy">
        <strong>${options.title}</strong>
        <small>${options.description}</small>
      </span>
      <span class="mt-card-chevron" aria-hidden="true"></span>
    `;
    card.onclick = function () {
      if (typeof options.onClick === "function") options.onClick();
      else console.log("MatchTracker Home: " + options.title + " is not connected yet.");
    };
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