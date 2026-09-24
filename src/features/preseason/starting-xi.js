// ============================================================
// MATCHTRACKER — PRE SEASON STARTING XI
// ============================================================
// Build the Starting XI by dragging players onto a football
// pitch. The coach does NOT choose a named formation first.
//
// Players are dropped approximately where the coach wants them.
// MatchTracker snaps each player to the nearest invisible grid
// position and derives a simple shape from the vertical lines.
// The saved match keeps both the selected players and their
// visual pitch positions so this same pitch model can later be
// reused by the live match screen.
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
    pitch: "#5B8E62",
    pitchLine: "rgba(255,255,255,.72)",
    danger: "#B42318"
  };

  // 13 columns x 13 rows gives the coach finer tactical control
  // while still keeping positions clean and consistent.
  const GRID_COLS = 17;
  const GRID_ROWS = 21;

  let callbacks = { onBack: null, onSaved: null };
  let currentMatch = null;
  let availablePlayers = [];
  let placed = new Map(); // playerId -> { player, col, row }
  let activeDrag = null;
  let tapPlayerId = null;

  function init(options = {}) {
    callbacks.onBack = typeof options.onBack === "function" ? options.onBack : null;
    callbacks.onSaved = typeof options.onSaved === "function" ? options.onSaved : null;
    currentMatch = options.match || null;
    availablePlayers = Array.isArray(currentMatch?.matchdaySquad)
      ? currentMatch.matchdaySquad.slice()
      : [];

    placed = new Map();

    const saved = Array.isArray(currentMatch?.startingXIPositions)
      ? currentMatch.startingXIPositions
      : [];

    saved.forEach(item => {
      if (!item || item.id == null) return;
      const player = availablePlayers.find(p => String(p.id) === String(item.id));
      if (!player) return;
      placed.set(String(player.id), {
        player: normalisePlayer(player),
        col: clamp(Number(item.col), 0, GRID_COLS - 1),
        row: clamp(Number(item.row), 0, GRID_ROWS - 1)
      });
    });
  }

  function render(container) {
    if (!container) return;
    container.innerHTML = "";
    container.style.cssText = `background:${COLORS.lightGrey};color:${COLORS.darkText};min-height:100vh;box-sizing:border-box;padding:16px;`;

    const header = document.createElement("div");
    header.style.cssText = `background:${COLORS.navy};color:${COLORS.white};border-radius:18px;padding:20px;margin-bottom:14px;box-shadow:0 4px 12px rgba(0,0,0,.08);`;
    header.innerHTML = `
      <div style="font-size:12px;font-weight:800;letter-spacing:2px;opacity:.75;margin-bottom:5px">PRE SEASON</div>
      <div style="font-size:27px;font-weight:800;line-height:1.15">Starting XI</div>
      <div style="font-size:14px;margin-top:7px;opacity:.9">Drag players onto the pitch. MatchTracker will snap them into a clean grid.</div>
    `;
    container.appendChild(header);

    const matchCard = document.createElement("div");
    matchCard.style.cssText = `background:${COLORS.white};border-radius:14px;padding:14px 16px;margin-bottom:14px;box-shadow:0 3px 10px rgba(0,0,0,.06);`;
    matchCard.innerHTML = `
      <div style="font-size:19px;font-weight:800">vs ${escapeHtml(currentMatch?.opponent || "Opponent TBC")}</div>
      <div id="mtXIShape" style="font-size:13px;color:${COLORS.muted};margin-top:5px">Shape: Not set</div>
    `;
    container.appendChild(matchCard);

    const pitchCard = document.createElement("div");
    pitchCard.style.cssText = `background:${COLORS.white};border-radius:16px;padding:12px;box-shadow:0 3px 10px rgba(0,0,0,.06);`;
    container.appendChild(pitchCard);

    const pitch = document.createElement("div");
    pitch.id = "mtStartingXIPitch";
    pitch.style.cssText = `position:relative;width:100%;max-width:460px;aspect-ratio:72/105;margin:0 auto;border-radius:12px;background:${COLORS.pitch};overflow:hidden;touch-action:none;box-sizing:border-box;border:2px solid rgba(255,255,255,.8);`;
    pitch.setAttribute("aria-label", "Starting XI football pitch");
    pitchCard.appendChild(pitch);
    drawPitch(pitch);

    const helper = document.createElement("div");
    helper.style.cssText = `max-width:460px;margin:10px auto 0;color:${COLORS.muted};font-size:13px;text-align:center;`;
    helper.innerHTML = `<strong>Drag</strong> a player roughly where you want them. The player will snap to the nearest grid position. You can also <strong>tap a player</strong>, then tap a pitch position.`;
    pitchCard.appendChild(helper);

    const poolCard = document.createElement("div");
    poolCard.style.cssText = `background:${COLORS.white};border-radius:16px;padding:15px;margin-top:14px;box-shadow:0 3px 10px rgba(0,0,0,.06);`;
    poolCard.innerHTML = `<div style="font-size:19px;font-weight:800">Available Players</div><div style="font-size:13px;color:${COLORS.muted};margin-top:3px">Players not yet placed on the pitch.</div>`;
    const pool = document.createElement("div");
    pool.id = "mtXIPlayerPool";
    pool.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:12px;";
    poolCard.appendChild(pool);
    container.appendChild(poolCard);

    const status = document.createElement("div");
    status.id = "mtXIStatus";
    status.style.cssText = `margin-top:12px;background:${COLORS.white};border:1px solid #E1E6EA;border-radius:12px;padding:12px 14px;font-size:14px;font-weight:700;`;
    container.appendChild(status);

    const actions = document.createElement("div");
    actions.style.cssText = "max-width:460px;margin:14px auto 0;display:flex;flex-direction:column;gap:9px;";

    const save = button("Save Starting XI", COLORS.blueGreen, COLORS.white);
    save.onclick = () => saveStartingXI();
    actions.appendChild(save);

    const clear = button("Clear Pitch", COLORS.white, COLORS.navy);
    clear.style.border = `1px solid ${COLORS.silver}`;
    clear.onclick = () => {
      placed.clear();
      tapPlayerId = null;
      refresh(container);
    };
    actions.appendChild(clear);

    const back = button("← Back to Match Squad", COLORS.white, COLORS.darkText);
    back.style.border = `1px solid ${COLORS.silver}`;
    back.onclick = () => callbacks.onBack && callbacks.onBack();
    actions.appendChild(back);

    container.appendChild(actions);

    refresh(container);
    installPitchPointerHandlers(pitch, container);
  }

  function refresh(container) {
    const pitch = container.querySelector("#mtStartingXIPitch");
    const pool = container.querySelector("#mtXIPlayerPool");
    const status = container.querySelector("#mtXIStatus");
    const shape = container.querySelector("#mtXIShape");
    if (!pitch || !pool) return;

    pitch.querySelectorAll(".mt-xi-player").forEach(node => node.remove());
    pool.innerHTML = "";

    const occupied = new Set();
    placed.forEach(item => occupied.add(`${item.col}:${item.row}`));

    placed.forEach(item => {
      const card = createPitchPlayer(item, pitch, container);
      pitch.appendChild(card);
    });

    availablePlayers.forEach(player => {
      const id = String(player.id);
      if (placed.has(id)) return;
      const card = createPoolPlayer(player, container);
      pool.appendChild(card);
    });

    const count = placed.size;
    const total = availablePlayers.length;
    const inferred = inferShape();
    if (shape) shape.textContent = inferred ? `Detected shape: ${inferred}` : "Detected shape: Not set";
    if (status) {
      status.innerHTML = `<strong>${count}</strong> of <strong>${total}</strong> match-squad players placed` +
        (tapPlayerId ? ` <span style="color:${COLORS.blueGreen}">• Select a pitch position.</span>` : "") +
        (count > 0 && inferred ? ` <span style="color:${COLORS.muted}">• ${escapeHtml(inferred)} shape</span>` : "");
    }
  }

  function createPoolPlayer(player, container) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mt-xi-pool-player";
    btn.style.cssText = `min-height:52px;border:1px solid ${COLORS.silver};border-radius:10px;background:${COLORS.white};color:${COLORS.navy};font-weight:800;padding:8px 9px;cursor:pointer;touch-action:none;`;
    btn.innerHTML = `<span style="display:block;font-size:15px">${escapeHtml(player.name || "Unnamed")}</span><span style="display:block;font-size:11px;color:${COLORS.muted};margin-top:2px">#${escapeHtml(String(player.number || "—"))}</span>`;
    btn.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      startDrag(player, event, null, container);
    });
    btn.addEventListener("click", function () {
      tapPlayerId = String(player.id);
      refresh(container);
    });
    return btn;
  }

  function createPitchPlayer(item, pitch, container) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mt-xi-player";
    btn.dataset.playerId = String(item.player.id);
    btn.style.cssText = `position:absolute;width:68px;min-height:46px;transform:translate(-50%,-50%);border:2px solid ${COLORS.white};border-radius:10px;background:${COLORS.navy};color:${COLORS.white};font-weight:800;padding:5px 6px;z-index:5;box-shadow:0 2px 6px rgba(0,0,0,.22);cursor:grab;touch-action:none;box-sizing:border-box;`;
    positionNode(btn, item.col, item.row);
    btn.innerHTML = `<span style="display:block;font-size:13px;line-height:1.1">${escapeHtml(item.player.name || "Unnamed")}</span><span style="display:block;font-size:10px;opacity:.82;margin-top:2px">#${escapeHtml(String(item.player.number || "—"))}</span>`;

    btn.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      startDrag(item.player, event, { col: item.col, row: item.row }, container);
    });
    btn.addEventListener("click", function () {
      tapPlayerId = String(item.player.id);
      refresh(container);
    });
    return btn;
  }

  function startDrag(player, event, originalPosition, container) {
    activeDrag = {
      player: normalisePlayer(player),
      originalPosition,
      pointerId: event.pointerId
    };
    tapPlayerId = null;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch (_) {}

    const move = function (moveEvent) {
      if (!activeDrag || moveEvent.pointerId !== activeDrag.pointerId) return;
      // We deliberately don't redraw on every pointer move. The pitch
      // remains stable and the final drop position is calculated from
      // the pointer location on release.
    };
    const up = function (upEvent) {
      if (!activeDrag || upEvent.pointerId !== activeDrag.pointerId) return;
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      finishDrag(upEvent, container);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
  }

  function finishDrag(event, container) {
    const pitch = container.querySelector("#mtStartingXIPitch");
    if (!pitch || !activeDrag) return;
    const rect = pitch.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    const player = activeDrag.player;

    if (inside) {
      const point = pointerToGrid(event.clientX, event.clientY, rect);
      const playerId = String(player.id);
      const oldPosition = activeDrag.originalPosition;
      const occupant = findPlayerAtCell(point.col, point.row, playerId);

      if (occupant && oldPosition) {
        // A placed player can swap positions with another placed player.
        const other = placed.get(occupant);
        placed.set(playerId, { player, col: point.col, row: point.row });
        if (other) {
          placed.set(occupant, { player: other.player, col: oldPosition.col, row: oldPosition.row });
        }
      } else {
        const snapped = findNearestFreeCell(point.col, point.row, playerId);
        if (snapped) {
          placed.set(playerId, { player, col: snapped.col, row: snapped.row });
        }
      }
    } else if (activeDrag.originalPosition) {
      // Dragging an existing player outside the pitch returns them to the pool.
      placed.delete(String(player.id));
    }

    activeDrag = null;
    refresh(container);
  }

  function installPitchPointerHandlers(pitch, container) {
    pitch.addEventListener("click", function (event) {
      if (!tapPlayerId) return;
      const rect = pitch.getBoundingClientRect();
      const point = pointerToGrid(event.clientX, event.clientY, rect);
      const snapped = findNearestFreeCell(point.col, point.row, tapPlayerId);
      if (!snapped) return;
      placed.delete(tapPlayerId);
      placed.set(tapPlayerId, {
        player: normalisePlayer(availablePlayers.find(p => String(p.id) === tapPlayerId)),
        col: snapped.col,
        row: snapped.row
      });
      tapPlayerId = null;
      refresh(container);
    });
  }

  function drawPitch(pitch) {
    const lines = document.createElement("div");
    lines.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    lines.innerHTML = `
      <div style="position:absolute;inset:4%;border:2px solid ${COLORS.pitchLine};border-radius:2px"></div>
      <div style="position:absolute;left:4%;right:4%;top:50%;height:0;border-top:2px solid ${COLORS.pitchLine}"></div>
      <div style="position:absolute;left:50%;top:4%;bottom:4%;width:0;border-left:2px solid ${COLORS.pitchLine}"></div>
      <div style="position:absolute;left:32%;width:36%;height:16%;top:4%;border:2px solid ${COLORS.pitchLine};border-top:none"></div>
      <div style="position:absolute;left:42%;width:16%;height:7%;top:4%;border:2px solid ${COLORS.pitchLine};border-top:none"></div>
      <div style="position:absolute;left:32%;width:36%;height:16%;bottom:4%;border:2px solid ${COLORS.pitchLine};border-bottom:none"></div>
      <div style="position:absolute;left:42%;width:16%;height:7%;bottom:4%;border:2px solid ${COLORS.pitchLine};border-bottom:none"></div>
      <div style="position:absolute;left:50%;top:50%;width:9%;aspect-ratio:1;border:2px solid ${COLORS.pitchLine};border-radius:50%;transform:translate(-50%,-50%)"></div>
    `;
    pitch.appendChild(lines);
  }

  function positionNode(node, col, row) {
    const x = 10 + (col / (GRID_COLS - 1)) * 80;
    const y = 7 + (row / (GRID_ROWS - 1)) * 86;
    node.style.left = `${x}%`;
    node.style.top = `${y}%`;
  }

  function pointerToGrid(clientX, clientY, rect) {
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    return {
      col: Math.round(x * (GRID_COLS - 1)),
      row: Math.round(y * (GRID_ROWS - 1))
    };
  }

  function findNearestFreeCell(col, row, playerId) {
    const occupied = new Set();
    placed.forEach((item, id) => {
      if (id !== playerId) occupied.add(`${item.col}:${item.row}`);
    });
    if (!occupied.has(`${col}:${row}`)) return { col, row };

    const cells = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!occupied.has(`${c}:${r}`)) {
          const dx = c - col;
          const dy = r - row;
          const distance = (dx * dx) + (dy * dy);
          cells.push({ col: c, row: r, distance });
        }
      }
    }
    cells.sort((a, b) => a.distance - b.distance || a.row - b.row || a.col - b.col);
    return cells[0] || null;
  }

  function findPlayerAtCell(col, row, excludeId) {
    for (const [id, item] of placed.entries()) {
      if (id !== excludeId && item.col === col && item.row === row) return id;
    }
    return null;
  }

  function inferShape() {
    if (!placed.size) return "";
    const rows = new Map();
    placed.forEach(item => {
      const band = Math.round(item.row);
      rows.set(band, (rows.get(band) || 0) + 1);
    });

    const groups = Array.from(rows.entries())
      .sort((a, b) => a[0] - b[0])
      .map(entry => entry[1]);

    // The lowest row is normally the goalkeeper. Do not force this
    // interpretation for very small test groups.
    if (placed.size >= 7) {
      const nonKeeper = groups.slice();
      const lowest = Math.max(...rows.keys());
      const keeperCount = rows.get(lowest) || 0;
      if (keeperCount === 1 && nonKeeper.length > 1) {
        nonKeeper[nonKeeper.length - 1] = nonKeeper[nonKeeper.length - 1] - 1;
        if (nonKeeper[nonKeeper.length - 1] <= 0) nonKeeper.pop();
      }
      const clean = nonKeeper.filter(n => n > 0).sort((a, b) => b - a);
      return keeperCount === 1 && clean.length ? `1-${clean.join("-")}` : clean.join("-");
    }

    return groups.slice().sort((a, b) => b - a).join("-");
  }

  function saveStartingXI() {
    if (!currentMatch || !window.MatchTrackerPreSeasonService) return;

    if (!placed.size) {
      alert("Please place at least one player on the pitch.");
      return;
    }

    const startingXIPositions = Array.from(placed.values()).map(item => ({
      id: item.player.id,
      name: item.player.name || "",
      number: item.player.number || "",
      col: item.col,
      row: item.row,
      x: Math.round((item.col / (GRID_COLS - 1)) * 100),
      y: Math.round((item.row / (GRID_ROWS - 1)) * 100)
    }));

    const startingXI = startingXIPositions.map(item => ({
      id: item.id,
      name: item.name,
      number: item.number,
      position: {
        col: item.col,
        row: item.row,
        x: item.x,
        y: item.y
      }
    }));

    const updated = window.MatchTrackerPreSeasonService.updateMatch(currentMatch.id, {
      formation: inferShape(),
      startingXI,
      startingXIPositions
    });

    if (!updated) {
      alert("The Starting XI could not be saved.");
      return;
    }

    currentMatch = updated;
    if (callbacks.onSaved) callbacks.onSaved(updated);
  }

  function normalisePlayer(player) {
    return {
      id: player?.id,
      name: player?.name || "Unnamed Player",
      number: player?.number || ""
    };
  }

  function button(text, background, color) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    btn.style.cssText = `width:100%;min-height:54px;border:none;border-radius:12px;background:${background};color:${color};font-size:16px;font-weight:800;cursor:pointer;`;
    return btn;
  }

  function clamp(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.MatchTrackerPreSeasonStartingXI = { init, render };
})(window);
