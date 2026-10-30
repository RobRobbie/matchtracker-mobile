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
    silver: "#B8C2CC",
    muted: "#5C6B78"
  };

  let callbacks = {
    onBack: null,
    onNewMatch: null,
    onOpenMatch: null,
    onEditMatch: null,
    onDeleteMatch: null
  };

  // Local escaping helper used by the completed-match review modal.
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

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

        // Show the most recent saved meeting against this opponent before a rematch.
        if (!previousStatusesForRender(match)) {
          const savedLog = window.MatchTrackerStorage ? window.MatchTrackerStorage.loadMatchLog() : [];
          const previous = (Array.isArray(savedLog) ? savedLog : [])
            .filter(record => String(record.opponent || "").trim().toLowerCase() === String(match.opponent || "").trim().toLowerCase())
            .sort((a, b) => String(b.completedAt || b.date || "").localeCompare(String(a.completedAt || a.date || "")))[0];
          if (previous) {
            const history = document.createElement("div");
            history.style.cssText = `margin-top:10px;padding:10px 12px;border-radius:10px;background:#E7F1EE;border:1px solid #C5DDD6;color:${COLORS.navy};font-size:13px;line-height:1.4;`;
            const home = Number(previous.score?.home ?? previous.berwick?.goals ?? 0);
            const away = Number(previous.score?.away ?? previous.opp?.goals ?? 0);
            history.innerHTML = `<strong>Previous meeting${previous.date ? ` · ${escapeHtml(previous.date)}` : ''}</strong><div style="margin-top:3px">${home} – ${away} · Previous match record available for review.</div>`;
            matchRow.appendChild(history);
          }
        }

        const actionArea = document.createElement("div");
        actionArea.style.marginTop = "14px";

        const enterButton = document.createElement("button");
        enterButton.type = "button";
        const completedMatch = previousStatusesForRender(match);
        enterButton.innerText = completedMatch ? "Review Match Summary →" : "ENTER MATCH →";
        enterButton.style.width = "100%";
        enterButton.style.minHeight = "48px";
        enterButton.style.border = "none";
        enterButton.style.borderRadius = "10px";
        enterButton.style.background = COLORS.blueGreen;
        enterButton.style.color = COLORS.white;
        enterButton.style.fontWeight = "800";
        enterButton.style.cursor = "pointer";
        enterButton.onclick = function () {
          if (completedMatch) showMatchReview(match);
          else if (callbacks.onOpenMatch) callbacks.onOpenMatch(match);
        };

        actionArea.appendChild(enterButton);
        matchRow.appendChild(actionArea);

        list.appendChild(matchRow);
      });

      sectionCard.appendChild(list);
    }

    container.appendChild(sectionCard);
  }


  function showMatchReview(match) {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.62);display:flex;align-items:flex-start;justify-content:center;padding:12px;overflow:auto;box-sizing:border-box";
    const panel = document.createElement("div");
    panel.style.cssText = `width:100%;max-width:620px;background:${COLORS.white};border-radius:16px;padding:16px;box-sizing:border-box;margin:auto;box-shadow:0 12px 40px rgba(0,0,0,.2);text-align:left`;
    const score = match.score || {home:match.berwick?.goals || 0,away:match.opp?.goals || 0};
    const stats = match.statistics?.team || {};
    const home = stats.home || match.berwick || {};
    const away = stats.away || match.opp || {};
    panel.innerHTML = `<div style="font-size:11px;font-weight:900;letter-spacing:2px;color:${COLORS.blueGreen}">MATCH REVIEW</div><div style="font-size:24px;font-weight:900;color:${COLORS.navy};margin-top:4px">${escapeHtml(match.opponent || "Opponent")}</div><div style="font-size:13px;color:${COLORS.muted};margin-top:4px">${escapeHtml(match.date || "Date not recorded")} · ${escapeHtml(match.venue || "Venue not recorded")}</div><div style="text-align:center;padding:18px 8px;margin:12px 0;background:${COLORS.lightGrey};border-radius:12px"><div style="font-size:38px;font-weight:900;color:${COLORS.navy}">${Number(score.home || 0)} – ${Number(score.away || 0)}</div><div style="font-size:12px;color:${COLORS.muted};font-weight:800">FULL TIME</div></div>`;
    const statRows = [["Shots on target",home.shotsOn ?? home.on,away.shotsOn ?? away.on],["Shots off target",home.shotsOff ?? home.off,away.shotsOff ?? away.off],["Corners",home.corners,away.corners],["Free kicks",home.freeKicks,away.freeKicks],["Offsides",home.offsides,away.offsides],["Yellow cards",home.yellow,away.yellow],["Red cards",home.red,away.red]];
    const statsTitle=document.createElement("div");statsTitle.style.cssText="font-size:17px;font-weight:900;margin:8px 0";statsTitle.textContent="Team Statistics";panel.appendChild(statsTitle);
    statRows.forEach(([label,a,b])=>{const row=document.createElement("div");row.style.cssText="display:grid;grid-template-columns:1fr 1.6fr 1fr;gap:8px;padding:8px 0;border-bottom:1px solid #edf0f2;font-size:13px";row.innerHTML=`<strong style="text-align:center">${Number(a||0)}</strong><span style="text-align:center">${label}</span><strong style="text-align:center">${Number(b||0)}</strong>`;panel.appendChild(row);});
    const players=match.statistics?.players || {};
    if(Object.keys(players).length){const h=document.createElement("div");h.style.cssText="font-size:17px;font-weight:900;margin:14px 0 6px";h.textContent="Player Statistics";panel.appendChild(h);Object.entries(players).forEach(([name,p])=>{const row=document.createElement("div");row.style.cssText="display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #edf0f2;font-size:13px";row.innerHTML=`<strong>${escapeHtml(name)}</strong><span>⚽ ${Number(p.goals||0)} · 🟨 ${Number(p.yellow||0)} · ${Number(p.minutes||0)} min</span>`;panel.appendChild(row);});}
    const events=Array.isArray(match.events)?match.events:[];const eh=document.createElement("div");eh.style.cssText="font-size:17px;font-weight:900;margin:14px 0 6px";eh.textContent="Timeline";panel.appendChild(eh);
    if(!events.length){const no=document.createElement("div");no.style.cssText=`font-size:13px;color:${COLORS.muted};padding:8px 0`;no.textContent="No timeline events were saved for this match.";panel.appendChild(no);} else events.slice().reverse().forEach(e=>{const row=document.createElement("div");row.style.cssText="padding:7px 0;border-bottom:1px solid #edf0f2;font-size:13px";row.textContent=`${Math.floor(Number(e.seconds||0)/60)}' · ${e.type||"Event"}${e.player?" · "+e.player:""}`;panel.appendChild(row);});
    const close=document.createElement("button");close.type="button";close.textContent="Close Match Review";close.style.cssText=`width:100%;margin-top:16px;min-height:48px;border:0;border-radius:10px;background:${COLORS.navy};color:white;font-weight:900`;close.onclick=()=>overlay.remove();panel.appendChild(close);overlay.appendChild(panel);overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove();});document.body.appendChild(overlay);
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
