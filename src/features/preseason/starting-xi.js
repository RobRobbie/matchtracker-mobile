// ============================================================
// MATCHTRACKER — STARTING XI SELECTION
// ============================================================
// Select the starting eleven from the matchday squad using a
// simple player list. No drag-and-drop pitch interaction.
// Remaining matchday players are automatically assigned to bench.
// ============================================================
(function (window) {
  "use strict";

  const COLORS = {
    navy: "#1E3A5F", blueGreen: "#3F7D70", lightGrey: "#F1F4F6",
    darkText: "#243447", white: "#FFFFFF", silver: "#B8C2CC",
    muted: "#5C6B78", danger: "#B42318"
  };

  const POSITIONS = [
    "Goalkeeper", "Right Back", "Centre Back", "Left Back",
    "Defensive Midfield", "Central Midfield", "Attacking Midfield",
    "Right Midfield", "Left Midfield", "Right Wing", "Left Wing", "Striker"
  ];
  const FORMATIONS = ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "4-1-4-1", "4-3-2-1"];

  let callbacks = { onBack: null, onSaved: null };
  let currentMatch = null;
  let availablePlayers = [];
  let selected = new Map();
  let selectedFormation = "4-3-3";
  let containerRef = null;

  function init(options = {}) {
    callbacks.onBack = typeof options.onBack === "function" ? options.onBack : null;
    callbacks.onSaved = typeof options.onSaved === "function" ? options.onSaved : null;
    currentMatch = options.match || null;
    availablePlayers = Array.isArray(currentMatch?.matchdaySquad) ? currentMatch.matchdaySquad.slice(0, 17) : [];
    selected = new Map();
    selectedFormation = FORMATIONS.includes(currentMatch?.formation) ? currentMatch.formation : "4-3-3";

    const saved = Array.isArray(currentMatch?.startingXI) ? currentMatch.startingXI : [];
    saved.slice(0, 11).forEach((savedPlayer, index) => {
      const player = availablePlayers.find(p => String(p.id) === String(savedPlayer.id));
      if (!player) return;
      selected.set(String(player.id), {
        player: normalisePlayer(player),
        position: typeof savedPlayer.position === "string"
          ? savedPlayer.position
          : (savedPlayer.position?.label || POSITIONS[index] || "Central Midfield")
      });
    });
  }

  function render(container) {
    if (!container) return;
    containerRef = container;
    container.innerHTML = "";
    container.style.cssText = `background:${COLORS.lightGrey};color:${COLORS.darkText};min-height:100vh;box-sizing:border-box;padding:16px;`;

    const header = document.createElement("div");
    header.style.cssText = `background:${COLORS.navy};color:${COLORS.white};border-radius:18px;padding:20px;margin-bottom:14px;box-shadow:0 4px 12px rgba(0,0,0,.08);`;
    header.innerHTML = `<div style="font-size:12px;font-weight:800;letter-spacing:2px;opacity:.75;margin-bottom:5px">PRE SEASON</div><div style="font-size:27px;font-weight:800;line-height:1.15">Starting XI</div><div style="font-size:14px;margin-top:7px;opacity:.9">Select your 11 starters from the match squad and assign their positions. No pitch dragging required.</div>`;
    container.appendChild(header);

    const matchCard = document.createElement("div");
    matchCard.style.cssText = `background:${COLORS.white};border-radius:14px;padding:14px 16px;margin-bottom:14px;box-shadow:0 3px 10px rgba(0,0,0,.06);`;
    matchCard.innerHTML = `<div style="font-size:19px;font-weight:800">vs ${escapeHtml(currentMatch?.opponent || "Opponent TBC")}</div><div style="font-size:13px;color:${COLORS.muted};margin-top:5px">Choose a formation, then select and position your starting players.</div>`;
    container.appendChild(matchCard);

    const formationCard = card();
    formationCard.innerHTML = `<div style="font-size:17px;font-weight:800;margin-bottom:8px">Formation</div>`;
    const formationSelect = document.createElement("select");
    formationSelect.style.cssText = inputStyle();
    FORMATIONS.forEach(value => {
      const option = document.createElement("option"); option.value = value; option.textContent = value;
      formationSelect.appendChild(option);
    });
    formationSelect.value = selectedFormation;
    formationSelect.onchange = () => { selectedFormation = formationSelect.value; };
    formationCard.appendChild(formationSelect);
    container.appendChild(formationCard);

    const selectedCard = card();
    selectedCard.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="font-size:17px;font-weight:800">Starting XI</div><div id="mtXIStatus" style="font-size:14px;font-weight:900;color:${COLORS.blueGreen}">0 / 11</div></div><div style="font-size:12px;color:${COLORS.muted};margin-top:4px">Set a position for each selected player. Tap Remove to return them to the available list.</div>`;
    const selectedList = document.createElement("div"); selectedList.id = "mtXISelectedList";
    selectedList.style.cssText = "display:flex;flex-direction:column;gap:9px;margin-top:12px;";
    selectedCard.appendChild(selectedList);
    container.appendChild(selectedCard);

    const availableCard = card();
    availableCard.innerHTML = `<div style="font-size:17px;font-weight:800">Available Match Squad</div><div style="font-size:12px;color:${COLORS.muted};margin-top:4px">Select up to 11 players. The remaining players will automatically be placed on the bench.</div>`;
    const availableList = document.createElement("div"); availableList.id = "mtXIAvailableList";
    availableList.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-top:12px;";
    availableCard.appendChild(availableList);
    container.appendChild(availableCard);

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;flex-direction:column;gap:9px;margin:14px auto 0;max-width:650px;";
    const save = button("Save Starting XI", COLORS.blueGreen, COLORS.white);
    save.onclick = saveStartingXI;
    const back = button("← Back to Match Squad", COLORS.white, COLORS.darkText);
    back.style.border = `1px solid ${COLORS.silver}`;
    back.onclick = () => callbacks.onBack && callbacks.onBack();
    actions.append(save, back); container.appendChild(actions);
    refresh();
  }

  function refresh() {
    if (!containerRef) return;
    const selectedList = containerRef.querySelector("#mtXISelectedList");
    const availableList = containerRef.querySelector("#mtXIAvailableList");
    const status = containerRef.querySelector("#mtXIStatus");
    if (!selectedList || !availableList) return;
    selectedList.innerHTML = ""; availableList.innerHTML = "";
    status.textContent = `${selected.size} / 11`;
    status.style.color = selected.size === 11 ? COLORS.blueGreen : COLORS.navy;

    if (!selected.size) {
      const empty = document.createElement("div");
      empty.textContent = "No starting players selected yet.";
      empty.style.cssText = `padding:14px;border:1px dashed ${COLORS.silver};border-radius:10px;color:${COLORS.muted};text-align:center;font-size:13px;`;
      selectedList.appendChild(empty);
    }

    selected.forEach((entry, id) => {
      const row = document.createElement("div");
      row.style.cssText = `display:grid;grid-template-columns:minmax(0,1fr) minmax(130px, .9fr);gap:8px;align-items:center;padding:10px;border:1px solid #E1E6EA;border-radius:10px;background:${COLORS.lightGrey};`;
      const name = document.createElement("div");
      name.innerHTML = `<div style="font-weight:800;font-size:14px">${escapeHtml(entry.player.name)}</div><div style="font-size:11px;color:${COLORS.muted};margin-top:2px">Shirt #${escapeHtml(entry.player.number || "—")}</div>`;
      const controls = document.createElement("div"); controls.style.cssText = "display:flex;gap:5px;align-items:center;";
      const position = document.createElement("select"); position.style.cssText = inputStyle(); position.setAttribute("aria-label", `Position for ${entry.player.name}`);
      POSITIONS.forEach(value => { const option = document.createElement("option"); option.value=value; option.textContent=value; position.appendChild(option); });
      position.value = entry.position;
      position.onchange = () => { entry.position = position.value; };
      const remove = document.createElement("button"); remove.type="button"; remove.textContent="Remove";
      remove.style.cssText = `border:1px solid ${COLORS.silver};border-radius:8px;background:${COLORS.white};color:${COLORS.navy};font-size:11px;font-weight:800;padding:8px 6px;min-height:38px;`;
      remove.onclick = () => { selected.delete(id); refresh(); };
      controls.append(position, remove); row.append(name, controls); selectedList.appendChild(row);
    });

    availablePlayers.forEach(player => {
      const id = String(player.id); if (selected.has(id)) return;
      const add = document.createElement("button"); add.type="button";
      add.style.cssText = `display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;min-height:52px;padding:10px 12px;border:1px solid ${COLORS.silver};border-radius:10px;background:${COLORS.white};color:${COLORS.navy};text-align:left;cursor:pointer;`;
      add.innerHTML = `<span><strong>${escapeHtml(player.name || "Unnamed Player")}</strong><small style="display:block;color:${COLORS.muted};margin-top:3px">Shirt #${escapeHtml(player.number || "—")}</small></span><strong style="font-size:20px;color:${COLORS.blueGreen}">＋</strong>`;
      add.disabled = selected.size >= 11;
      if (add.disabled) add.style.opacity = ".45";
      add.onclick = () => {
        if (selected.size >= 11) return;
        selected.set(id, { player: normalisePlayer(player), position: defaultPosition(selected.size) });
        refresh();
      };
      availableList.appendChild(add);
    });
  }

  function defaultPosition(index) {
    const defaults = ["Goalkeeper", "Right Back", "Centre Back", "Centre Back", "Left Back", "Right Midfield", "Central Midfield", "Central Midfield", "Left Midfield", "Striker", "Striker"];
    return defaults[index] || "Central Midfield";
  }

  function saveStartingXI() {
    if (!currentMatch || !window.MatchTrackerPreSeasonService) return;
    if (selected.size !== 11) { alert(`Please select exactly 11 starting players. You currently have ${selected.size}/11.`); return; }
    const startingXI = Array.from(selected.values()).map(entry => ({
      id: entry.player.id, sourceId: entry.player.sourceId || entry.player.id,
      isBorrowed: !!entry.player.isBorrowed,
      name: entry.player.name, number: entry.player.number,
      position: entry.position
    }));
    const selectedIds = new Set(startingXI.map(player => String(player.id)));
    const substitutes = availablePlayers.filter(player => !selectedIds.has(String(player.id)))
      .slice(0, 6).map(player => ({ id: player.id, sourceId: player.sourceId || player.id, isBorrowed: !!player.isBorrowed, name: player.name || "", number: player.number || "" }));
    const updated = window.MatchTrackerPreSeasonService.updateMatch(currentMatch.id, {
      matchFormat: "11-a-side", formation: selectedFormation, startingXI,
      startingXIPositions: startingXI.map((player, index) => ({ id: player.id, name: player.name, number: player.number, position: player.position, order: index + 1 })),
      substitutes, status: "preparing"
    });
    if (!updated) { alert("The Starting XI could not be saved."); return; }
    currentMatch = updated;
    if (callbacks.onSaved) callbacks.onSaved(updated);
  }

  function normalisePlayer(player) { return { id: player?.id, sourceId: player?.sourceId || player?.id, isBorrowed: !!player?.isBorrowed, name: player?.name || "Unnamed Player", number: player?.number || "" }; }
  function card() { const el=document.createElement("div"); el.style.cssText=`background:${COLORS.white};border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 3px 10px rgba(0,0,0,.06);`; return el; }
  function inputStyle() { return "width:100%;min-width:0;min-height:40px;padding:7px;border:1px solid #C8D0D8;border-radius:8px;background:#fff;color:#243447;font-size:12px;box-sizing:border-box;"; }
  function button(text, background, color) { const btn=document.createElement("button");btn.type="button";btn.textContent=text;btn.style.cssText=`width:100%;min-height:52px;border:none;border-radius:12px;background:${background};color:${color};font-size:16px;font-weight:800;cursor:pointer;`;return btn; }
  function escapeHtml(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }

  window.MatchTrackerPreSeasonStartingXI = { init, render };
})(window);
