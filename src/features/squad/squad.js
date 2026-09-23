// ============================================================
// MATCHTRACKER — SQUAD FEATURE
// ============================================================
// Current squad management only.
// Players can be added, edited and removed at any time.
// Match selection will use this same source of truth later.
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

  let callbacks = { onBack: null };
  let players = [];

  function init(options = {}) {
    callbacks.onBack = typeof options.onBack === "function" ? options.onBack : null;
    players = window.MatchTrackerStorage.loadPlayers();
    if (!Array.isArray(players)) players = [];
  }

  function save() {
    window.MatchTrackerStorage.savePlayers(players);
  }

  function nextId() {
    return "player_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function render(container) {
    if (!container) return;
    container.innerHTML = "";
    container.style.background = COLORS.lightGrey;
    container.style.color = COLORS.darkText;
    container.style.minHeight = "100vh";
    container.style.boxSizing = "border-box";
    container.style.padding = "20px";

    const header = document.createElement("div");
    header.style.cssText = `background:${COLORS.navy};color:${COLORS.white};border-radius:18px;padding:22px 20px;margin-bottom:16px;`;
    header.innerHTML = `<div style="font-size:13px;font-weight:700;letter-spacing:2px;opacity:.75;margin-bottom:6px">SQUAD</div><div style="font-size:28px;font-weight:800">Current Players</div><div style="font-size:14px;margin-top:8px;opacity:.85">Add players whenever they join the squad.</div>`;
    container.appendChild(header);

    const add = document.createElement("button");
    add.type = "button";
    add.innerText = "＋  ADD PLAYER";
    add.style.cssText = `width:100%;min-height:56px;border:none;border-radius:12px;background:${COLORS.blueGreen};color:white;font-size:17px;font-weight:800;cursor:pointer;margin-bottom:16px;`;
    add.onclick = () => openPlayerForm();
    container.appendChild(add);

    const list = document.createElement("div");
    container.appendChild(list);

    if (!players.length) {
      const empty = document.createElement("div");
      empty.style.cssText = `background:white;border:1px dashed ${COLORS.silver};border-radius:14px;padding:28px 18px;text-align:center;color:${COLORS.muted};font-size:15px;`;
      empty.innerHTML = `<div style="font-size:18px;font-weight:800;color:${COLORS.darkText};margin-bottom:6px">No players added yet</div><div>Add the first player above. Players can also be added later while preparing a match.</div>`;
      list.appendChild(empty);
    } else {
      players.slice().sort((a,b) => Number(a.number || 999) - Number(b.number || 999) || String(a.name).localeCompare(String(b.name))).forEach(player => {
        list.appendChild(createPlayerRow(player));
      });
    }

    const back = document.createElement("button");
    back.type = "button";
    back.innerText = "←  Back to Home";
    back.style.cssText = `width:100%;min-height:52px;border:1px solid ${COLORS.silver};border-radius:12px;background:white;color:${COLORS.darkText};font-size:16px;font-weight:800;cursor:pointer;margin-top:18px;`;
    back.onclick = () => callbacks.onBack && callbacks.onBack();
    container.appendChild(back);
  }

  function createPlayerRow(player) {
    const row = document.createElement("div");
    row.style.cssText = `background:white;border-radius:14px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.05);`;

    const number = document.createElement("div");
    number.innerText = player.number || "—";
    number.style.cssText = `width:46px;height:46px;border-radius:50%;background:${COLORS.lightGrey};color:${COLORS.navy};display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;flex:none;`;

    const info = document.createElement("div");
    info.style.cssText = "flex:1;min-width:0;";
    info.innerHTML = `<div style="font-size:17px;font-weight:800">${escapeHtml(player.name)}</div><div style="font-size:12px;color:${COLORS.muted};margin-top:3px">Player #${escapeHtml(player.number || "—")}</div>`;

    const edit = document.createElement("button");
    edit.type = "button";
    edit.innerText = "Edit";
    edit.style.cssText = `min-height:44px;padding:0 13px;border:1px solid ${COLORS.silver};border-radius:10px;background:white;color:${COLORS.navy};font-weight:800;cursor:pointer;`;
    edit.onclick = () => openPlayerForm(player);

    row.append(number, info, edit);
    return row;
  }

  function openPlayerForm(existing = null) {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:20px;box-sizing:border-box;overflow:auto;";

    const card = document.createElement("div");
    card.style.cssText = "width:100%;max-width:480px;background:white;border-radius:18px;padding:20px;box-sizing:border-box;margin-top:30px;";
    card.innerHTML = `<div style="font-size:24px;font-weight:800;color:${COLORS.navy};margin-bottom:18px">${existing ? "Edit Player" : "Add Player"}</div>`;

    const name = field("Player Name", "text", existing ? existing.name : "", "Enter player name");
    const number = field("Shirt Number", "number", existing ? existing.number : "", "Enter shirt number");
    card.append(name.wrapper, number.wrapper);

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:10px;margin-top:18px;";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.innerText = existing ? "Save Changes" : "Add Player";
    saveBtn.style.cssText = `flex:1;min-height:50px;border:none;border-radius:12px;background:${COLORS.blueGreen};color:white;font-size:16px;font-weight:800;cursor:pointer;`;
    saveBtn.onclick = () => {
      const playerName = name.input.value.trim();
      const shirt = number.input.value.trim();
      if (!playerName) return alert("Enter the player name.");
      if (!shirt || Number(shirt) < 0 || Number(shirt) > 99) return alert("Enter a valid shirt number.");
      const duplicate = players.find(p => String(p.number) === shirt && (!existing || p.id !== existing.id));
      if (duplicate) return alert("That shirt number is already in the squad.");
      if (existing) {
        existing.name = playerName;
        existing.number = shirt;
      } else {
        players.push({ id: nextId(), name: playerName, number: shirt });
      }
      save();
      overlay.remove();
      const c = document.getElementById("matchtrackerSquad");
      if (c) render(c);
    };

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.innerText = "Cancel";
    cancel.style.cssText = `min-height:50px;padding:0 18px;border:1px solid ${COLORS.silver};border-radius:12px;background:white;color:${COLORS.darkText};font-weight:800;cursor:pointer;`;
    cancel.onclick = () => overlay.remove();
    actions.append(saveBtn, cancel);

    if (existing) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.innerText = "Remove Player";
      remove.style.cssText = `width:100%;min-height:48px;margin-top:10px;border:1px solid #E3B4B0;border-radius:12px;background:white;color:${COLORS.danger};font-weight:800;cursor:pointer;`;
      remove.onclick = () => {
        if (!confirm(`Remove ${existing.name} from the squad?`)) return;
        players = players.filter(p => p.id !== existing.id);
        save();
        overlay.remove();
        const c = document.getElementById("matchtrackerSquad");
        if (c) render(c);
      };
      card.append(actions, remove);
    } else {
      card.appendChild(actions);
    }

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    name.input.focus();
  }

  function field(labelText, type, value, placeholder) {
    const wrapper = document.createElement("label");
    wrapper.style.cssText = "display:block;margin-bottom:14px;font-weight:800;";
    wrapper.innerText = labelText;
    const input = document.createElement("input");
    input.type = type;
    input.value = value == null ? "" : value;
    input.placeholder = placeholder;
    input.style.cssText = `display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:13px;border:1px solid ${COLORS.silver};border-radius:10px;font-size:17px;color:${COLORS.darkText};`;
    wrapper.appendChild(input);
    return { wrapper, input };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
  }

  window.MatchTrackerSquad = { init, render };
})(window);
