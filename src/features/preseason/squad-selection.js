// ============================================================
// MATCHTRACKER — PRE SEASON SQUAD SELECTION
// ============================================================
// Select the players available for a specific Pre Season match.
// This uses the central current squad as the source of truth.
// Starting XI and Bench are handled in later match-preparation
// stages.
// ============================================================

(function (window) {
  "use strict";

  const COLORS = {
    navy: "#1E3A5F",
    blueGreen: "#3F7D70",
    lightGrey: "#F1F4F6",
    darkText: "#243447",
    white: "#FFFFFF",
    silver: "#B8C2CC",
    muted: "#5C6B78",
    danger: "#B42318"
  };

  let callbacks = {
    onCancel: null,
    onContinue: null,
    onManageSquad: null
  };

  let currentMatch = null;
  let selectedIds = new Set();

  function init(options = {}) {
    callbacks.onCancel = typeof options.onCancel === "function" ? options.onCancel : null;
    callbacks.onContinue = typeof options.onContinue === "function" ? options.onContinue : null;
    callbacks.onManageSquad = typeof options.onManageSquad === "function" ? options.onManageSquad : null;
    currentMatch = options.match || null;

    const existing = currentMatch && Array.isArray(currentMatch.matchdaySquad)
      ? currentMatch.matchdaySquad
      : [];

    selectedIds = new Set(existing.map(player => String(player.id)));
  }

  function render(container) {
    if (!container) return;
    container.innerHTML = "";
    container.style.cssText = `background:${COLORS.lightGrey};color:${COLORS.darkText};min-height:100vh;box-sizing:border-box;padding:20px;`;

    const header = document.createElement("div");
    header.style.cssText = `background:${COLORS.navy};color:${COLORS.white};border-radius:18px;padding:22px 20px;margin-bottom:16px;box-shadow:0 4px 12px rgba(0,0,0,.08);`;
    header.innerHTML = `
      <div style="font-size:13px;font-weight:700;letter-spacing:2px;opacity:.75;margin-bottom:6px">PRE SEASON</div>
      <div style="font-size:28px;font-weight:800;line-height:1.15">Match Squad</div>
      <div style="font-size:14px;margin-top:8px;opacity:.85">Choose the players available for this match.</div>
    `;
    container.appendChild(header);

    const matchCard = document.createElement("div");
    matchCard.style.cssText = `background:${COLORS.white};border-radius:16px;padding:16px;margin-bottom:16px;box-shadow:0 3px 10px rgba(0,0,0,.06);`;
    matchCard.innerHTML = `
      <div style="font-size:20px;font-weight:800">vs ${escapeHtml((currentMatch && currentMatch.opponent) || "Opponent TBC")}</div>
      <div style="font-size:14px;color:${COLORS.muted};margin-top:6px">${escapeHtml(formatDetails(currentMatch))}</div>
    `;
    container.appendChild(matchCard);

    const squad = window.MatchTrackerStorage ? window.MatchTrackerStorage.loadPlayers() : [];
    const players = Array.isArray(squad) ? squad.slice().sort(sortPlayers) : [];

    const section = document.createElement("div");
    section.style.cssText = `background:${COLORS.white};border-radius:16px;padding:16px;box-shadow:0 3px 10px rgba(0,0,0,.06);`;

    const heading = document.createElement("div");
    heading.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:12px;";
    heading.innerHTML = `<div><div style="font-size:20px;font-weight:800">Current Squad</div><div style="font-size:14px;color:${COLORS.muted};margin-top:4px">Select everyone available for this match.</div></div>`;
    section.appendChild(heading);

    const count = document.createElement("div");
    count.id = "mtMatchSquadCount";
    count.style.cssText = `background:${COLORS.lightGrey};color:${COLORS.navy};border-radius:20px;padding:7px 12px;font-size:13px;font-weight:800;white-space:nowrap;`;
    heading.appendChild(count);

    if (!players.length) {
      const empty = document.createElement("div");
      empty.style.cssText = `margin-top:16px;padding:22px 16px;border:1px dashed ${COLORS.silver};border-radius:12px;text-align:center;color:${COLORS.muted};`;
      empty.innerHTML = `<div style="font-size:18px;font-weight:800;color:${COLORS.darkText};margin-bottom:6px">No players in the squad yet</div><div>Add players to the squad before preparing this match.</div>`;
      section.appendChild(empty);
    } else {
      const list = document.createElement("div");
      list.style.marginTop = "14px";

      players.forEach(player => {
        const id = String(player.id);
        const row = document.createElement("label");
        row.style.cssText = `display:flex;align-items:center;gap:12px;background:${COLORS.lightGrey};border:1px solid #E1E6EA;border-radius:12px;padding:12px;margin-bottom:9px;cursor:pointer;`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedIds.has(id);
        checkbox.style.width = "22px";
        checkbox.style.height = "22px";
        checkbox.style.flex = "none";
        checkbox.onchange = function () {
          if (checkbox.checked) selectedIds.add(id);
          else selectedIds.delete(id);
          updateCount(count);
        };

        const details = document.createElement("div");
        details.style.flex = "1";
        details.innerHTML = `<div style="font-size:17px;font-weight:800">${escapeHtml(player.name || "Unnamed Player")}</div><div style="font-size:13px;color:${COLORS.muted};margin-top:2px">Shirt #${escapeHtml(String(player.number || "—"))}</div>`;

        row.append(checkbox, details);
        list.appendChild(row);
      });
      section.appendChild(list);
    }

    container.appendChild(section);

    const actions = document.createElement("div");
    actions.style.cssText = "width:100%;max-width:650px;margin-top:16px;display:flex;flex-direction:column;gap:10px;";

    const manage = document.createElement("button");
    manage.type = "button";
    manage.innerText = "＋  Manage Squad";
    manage.style.cssText = `width:100%;min-height:52px;border:1px solid ${COLORS.silver};border-radius:12px;background:${COLORS.white};color:${COLORS.navy};font-size:16px;font-weight:800;cursor:pointer;`;
    manage.onclick = function () {
      saveSelection(false);
      if (callbacks.onManageSquad) callbacks.onManageSquad();
    };
    actions.appendChild(manage);

    const continueButton = document.createElement("button");
    continueButton.type = "button";
    continueButton.innerText = "Continue to Starting XI →";
    continueButton.style.cssText = `width:100%;min-height:56px;border:none;border-radius:12px;background:${COLORS.blueGreen};color:${COLORS.white};font-size:17px;font-weight:800;cursor:pointer;`;
    continueButton.onclick = function () { saveSelection(true); };
    actions.appendChild(continueButton);

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.innerText = "←  Back to Match Details";
    cancel.style.cssText = `width:100%;min-height:52px;border:1px solid ${COLORS.silver};border-radius:12px;background:${COLORS.white};color:${COLORS.darkText};font-size:16px;font-weight:800;cursor:pointer;`;
    cancel.onclick = function () { if (callbacks.onCancel) callbacks.onCancel(); };
    actions.appendChild(cancel);

    container.appendChild(actions);
    updateCount(count);
  }

  function saveSelection(continueToNext) {
    if (!currentMatch || !window.MatchTrackerPreSeasonService) return;

    const players = window.MatchTrackerStorage.loadPlayers();
    const selected = (Array.isArray(players) ? players : [])
      .filter(player => selectedIds.has(String(player.id)))
      .map(player => ({ id: player.id, name: player.name || "", number: player.number || "" }));

    if (!selected.length) {
      alert("Please select at least one player for the match.");
      return;
    }

    const updated = window.MatchTrackerPreSeasonService.updateMatch(currentMatch.id, {
      matchdaySquad: selected,
      startingXI: Array.isArray(currentMatch.startingXI) ? currentMatch.startingXI : [],
      substitutes: Array.isArray(currentMatch.substitutes) ? currentMatch.substitutes : []
    });

    if (!updated) {
      alert("The match squad could not be saved.");
      return;
    }

    currentMatch = updated;

    if (continueToNext && callbacks.onContinue) callbacks.onContinue(updated);
  }

  function updateCount(element) {
    if (element) element.textContent = `${selectedIds.size} selected`;
  }

  function sortPlayers(a, b) {
    const na = Number(a.number);
    const nb = Number(b.number);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return String(a.name || "").localeCompare(String(b.name || ""));
  }

  function formatDetails(match) {
    if (!match) return "";
    return [match.date || "Date TBC", match.kickOff || "Kick Off TBC", match.venue || "Venue TBC", match.matchFormat || ""].filter(Boolean).join(" • ");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.MatchTrackerPreSeasonSquadSelection = { init, render };

})(window);
