// ============================================================
// MATCHTRACKER — SQUAD MANAGEMENT
// ============================================================
// Owns the regular squad and borrowed-player registers.
// Match preparation consumes these records through shared storage;
// this module does not alter match-selection behaviour.
// ============================================================
(function (window) {
  "use strict";

  const COLORS = {
    navy: "#1E3A5F", blueGreen: "#3F7D70", lightGrey: "#F1F4F6",
    darkText: "#243447", white: "#FFFFFF", silver: "#B8C2CC",
    muted: "#5C6B78", danger: "#B42318"
  };

  let callbacks = { onBack: null };
  let players = [];
  let borrowedPlayers = [];
  let currentView = "dashboard";

  function init(options = {}) {
    callbacks.onBack = typeof options.onBack === "function" ? options.onBack : null;
    refreshData();
    currentView = "dashboard";
  }

  function refreshData() {
    players = window.MatchTrackerStorage.loadPlayers();
    borrowedPlayers = window.MatchTrackerStorage.loadBorrowedPlayers();
    if (!Array.isArray(players)) players = [];
    if (!Array.isArray(borrowedPlayers)) borrowedPlayers = [];
  }

  function savePlayers() { window.MatchTrackerStorage.savePlayers(players); }
  function saveBorrowedPlayers() { window.MatchTrackerStorage.saveBorrowedPlayers(borrowedPlayers); }
  function nextId(prefix) { return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8); }

  function render(container) {
    if (!container) return;
    refreshData();
    container.innerHTML = "";
    container.className = (container.className || "").replace(/\bmt-squad-screen\b/g, "").trim();
    container.classList.add("mt-squad-screen");
    if (currentView === "regular") renderPlayerRegister(container);
    else if (currentView === "borrowed") renderBorrowedRegister(container);
    else if (currentView === "availability") renderAvailability(container);
    else renderDashboard(container);
  }

  function renderDashboard(container) {
    const header = document.createElement("div");
    header.className = "mt-sm-header";
    header.innerHTML = `<div><div class="mt-sm-eyebrow">TEAM MANAGEMENT</div><h1>Squad</h1><p>Manage your team for the season</p></div><div class="mt-sm-header-icon" aria-hidden="true">♜</div>`;
    container.appendChild(header);

    const stats = document.createElement("div");
    stats.className = "mt-sm-stats";
    stats.innerHTML = `<div class="mt-sm-stat"><span class="mt-sm-stat-label"><span>●</span> REGULAR SQUAD</span><strong>${players.length}</strong><small>Registered players</small></div><div class="mt-sm-stat"><span class="mt-sm-stat-label"><span>●</span> BORROWED</span><strong>${borrowedPlayers.length}</strong><small>Available players</small></div>`;
    container.appendChild(stats);

    const regular = dashboardAction("regular", "Regular Players", "Your registered team members", `${players.length} ${players.length === 1 ? "player" : "players"}`, "♟", COLORS.navy, () => { currentView = "regular"; render(container); });
    const borrowed = dashboardAction("borrowed", "Borrowed Players", "Players available when needed", `${borrowedPlayers.length} ${borrowedPlayers.length === 1 ? "player" : "players"}`, "＋", COLORS.blueGreen, () => { currentView = "borrowed"; render(container); });
    const availability = dashboardAction("availability", "Availability", "Injuries, holidays and other absences", `${activeAbsenceCount()} active`, "♥", COLORS.danger, () => { currentView = "availability"; render(container); });
    container.append(regular, borrowed, availability);
    addBackButton(container, "Back to Home", () => callbacks.onBack && callbacks.onBack());
  }

  function dashboardAction(kind, title, description, count, symbol, color, action) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `mt-sm-action mt-sm-action-${kind}`;
    card.style.setProperty("--action-color", color);
    card.innerHTML = `<span class="mt-sm-action-icon" aria-hidden="true">${symbol}</span><span class="mt-sm-action-copy"><strong>${title}</strong><small>${description}</small><em>${count}</em></span><span class="mt-sm-chevron" aria-hidden="true">›</span>`;
    card.onclick = action;
    return card;
  }

  function renderPlayerRegister(container) {
    addSubHeader(container, "REGULAR SQUAD", "Regular Players", "Your registered team members", players.length, "players", () => { currentView = "dashboard"; render(container); });
    const add = document.createElement("button");
    add.type = "button"; add.className = "mt-sm-primary"; add.textContent = "+  Add Player";
    add.onclick = () => openPlayerForm(container, "regular");
    container.appendChild(add);
    const list = document.createElement("div"); list.className = "mt-sm-list";
    if (!players.length) list.appendChild(emptyState("No regular players yet", "Add your first player to start building your squad."));
    else players.slice().sort((a,b)=>{const aa=currentAbsence(a.id)?1:0,bb=currentAbsence(b.id)?1:0;return aa-bb||sortByNumber(a,b);}).forEach(player => list.appendChild(playerRow(player, "regular", container)));
    container.appendChild(list);
    addBackButton(container, "Back to Squad", () => { currentView = "dashboard"; render(container); });
  }

  function renderBorrowedRegister(container) {
    addSubHeader(container, "PLAYER REGISTER", "Borrowed Players", "Keep a list of players you can call on when needed", borrowedPlayers.length, "available", () => { currentView = "dashboard"; render(container); });
    const note = document.createElement("div"); note.className = "mt-sm-note";
    note.textContent = "Add each borrowed player once. Their usual shirt number is saved here; it can be changed for an individual match without changing this record.";
    container.appendChild(note);
    const add = document.createElement("button");
    add.type = "button"; add.className = "mt-sm-primary mt-sm-primary-borrowed"; add.textContent = "+  Add Borrowed Player";
    add.onclick = () => openPlayerForm(container, "borrowed");
    container.appendChild(add);
    const list = document.createElement("div"); list.className = "mt-sm-list";
    if (!borrowedPlayers.length) list.appendChild(emptyState("No borrowed players yet", "Add players here so they are ready to select when you need them for a match."));
    else borrowedPlayers.slice().sort((a,b)=>{const aa=currentAbsence(a.id)?1:0,bb=currentAbsence(b.id)?1:0;return aa-bb||sortByNumber(a,b);}).forEach(player => list.appendChild(playerRow(player, "borrowed", container)));
    container.appendChild(list);
    addBackButton(container, "Back to Squad", () => { currentView = "dashboard"; render(container); });
  }

  function addSubHeader(container, eyebrow, title, description, count, label, back) {
    const header = document.createElement("div"); header.className = "mt-sm-subheader";
    header.style.backgroundImage = "linear-gradient(115deg,rgba(30,58,95,.94),rgba(63,125,112,.82)),url(assets/squad-team.jpg)";
    header.style.backgroundSize = "cover"; header.style.backgroundPosition = "center"; header.style.color = "#FFFFFF";
    header.innerHTML = `<button type="button" class="mt-sm-backlink" aria-label="Back to Squad">‹ Squad</button><div class="mt-sm-eyebrow">${eyebrow}</div><div class="mt-sm-subtitle-row"><div><h1>${title}</h1><p>${description}</p></div><div class="mt-sm-count"><strong>${count}</strong><span>${label}</span></div></div>`;
    header.querySelector("button").onclick = back;
    container.appendChild(header);
  }

  function emptyState(title, description) {
    const empty = document.createElement("div"); empty.className = "mt-sm-empty";
    empty.innerHTML = `<span aria-hidden="true">＋</span><div><strong>${title}</strong><p>${description}</p></div>`;
    return empty;
  }

  function playerRow(player, type, container) {
    const row = document.createElement("div"); row.className = "mt-sm-player-row";
    const number = document.createElement("span"); number.className = "mt-sm-number"; number.textContent = player.number || "—";
    const info = document.createElement("div"); info.className = "mt-sm-player-info";
    const name = document.createElement("strong"); name.textContent = player.name || "Unnamed player";
    const record = currentAbsence(player.id);
    const sub = document.createElement("small");
    const reason = record ? String(record.reason || "unavailable").toLowerCase() : "available";
    const visual = reason === "injured" ? {icon:"♥",label:"INJURED",bg:"#FFF0DF",fg:"#A85A16",border:"#F1D1AE"} :
      reason === "suspended" ? {icon:"⚑",label:"SUSPENDED",bg:"#FCE6E6",fg:"#B52E35",border:"#EFC1C1"} :
      record ? {icon:"▣",label:absenceLabel(record),bg:"#E8EDF5",fg:"#405D83",border:"#CCD7E5"} :
      {icon:"✓",label:"AVAILABLE",bg:"#E5F2EB",fg:"#28734F",border:"#D0E6D9"};
    sub.textContent = `${type === "borrowed" ? "BORROWED PLAYER" : "SQUAD PLAYER"} · ${visual.icon} ${visual.label}`;
    sub.style.cssText = `display:inline-block;align-self:flex-start;margin-top:3px;padding:4px 7px;border-radius:7px;background:${visual.bg};color:${visual.fg};border:1px solid ${visual.border};font-size:10px;font-weight:900;letter-spacing:.4px`;
    if(record){row.style.background=visual.bg;row.style.borderColor=visual.border}
    info.append(name, sub);
    const actions = document.createElement("div"); actions.className = "mt-sm-player-actions";
    const status = document.createElement("button"); status.type = "button"; status.className = "mt-sm-edit mt-sm-availability-action"; status.textContent = "Change status";
    status.style.cssText = `background:#FFFFFF;border:1px solid ${visual.border};color:${visual.fg};`;
    status.setAttribute("aria-label", `Change availability for ${player.name || "player"}`);
    status.onclick = () => openAvailabilityForm(player, container, record);
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "mt-sm-edit mt-sm-details-action"; edit.textContent = "Player details";
    edit.setAttribute("aria-label", `Edit ${player.name || "player"}`);
    edit.onclick = () => openPlayerForm(container, type, player);
    actions.append(status, edit);
    row.append(number, info, actions); return row;
  }

  function todayLocal() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function allAbsences() { return window.MatchTrackerStorage.loadAvailability() || []; }
  function currentAbsence(playerId) {
    return allAbsences().find(r => String(r.playerId) === String(playerId) && r.status !== "cleared") || null;
  }
  function activeAbsenceCount() { return allAbsences().filter(r => r.status !== "cleared").length; }
  function absenceLabel(record) {
    const labels = { injured: "INJURED", suspended: "SUSPENDED", unavailable: "UNAVAILABLE", holiday: "HOLIDAY" };
    return labels[record.reason] || String(record.reason || "UNAVAILABLE").toUpperCase();
  }
  function formatDate(value) {
    if (!value) return "Not set";
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-AU", { day:"numeric", month:"short", year:"numeric" });
  }
  function addFieldLabel(text) {
    const label = document.createElement("label"); label.className = "mt-sm-field";
    const span = document.createElement("span"); span.textContent = text; label.appendChild(span); return label;
  }
  function makeSelect(options, value) {
    const select = document.createElement("select");
    select.style.cssText = "display:block;width:100%;min-height:48px;box-sizing:border-box;margin-top:7px;padding:10px 12px;border:1px solid #B8C2CC;border-radius:10px;background:#fff;color:#243447;font-size:16px";
    options.forEach(([v,t]) => { const o=document.createElement("option"); o.value=v; o.textContent=t; select.appendChild(o); });
    select.value=value || options[0][0]; return select;
  }
  function makeDateInput(value) {
    const input=document.createElement("input"); input.type="date"; input.value=value || ""; input.style.cssText="display:block;width:100%;max-width:100%;min-width:0;min-height:48px;box-sizing:border-box;margin-top:7px;padding:10px 12px;border:1px solid #B8C2CC;border-radius:10px;background:#fff;color:#243447;font-size:16px;appearance:none;-webkit-appearance:none"; return input;
  }
  function makeTextInput(value, placeholder) {
    const input=document.createElement("input"); input.type="text"; input.value=value || ""; input.placeholder=placeholder || "Optional"; input.maxLength=160; input.style.cssText="display:block;width:100%;min-height:48px;box-sizing:border-box;margin-top:7px;padding:10px 12px;border:1px solid #B8C2CC;border-radius:10px;background:#fff;color:#243447;font-size:16px"; return input;
  }
  function openAvailabilityForm(player, container, existing = null) {
    const overlay=document.createElement("div"); overlay.className="mt-sm-overlay";
    const card=document.createElement("div"); card.className="mt-sm-form-card";
    const title=document.createElement("h2"); title.textContent=`Change availability · ${player.name}`; card.appendChild(title);
    const statusField=addFieldLabel("Availability status");
    const status=makeSelect([["available","Available"],["injured","Injured"],["suspended","Suspended"],["unavailable","Unavailable"]], existing?.reason || "available"); statusField.appendChild(status); card.appendChild(statusField);
    const reasonField=addFieldLabel("Absence type");
    const absenceType=makeSelect([["holiday","Holiday"],["personal","Personal reasons"],["work","Work commitments"],["other","Other"],["training","Training / other commitment"]], existing?.absenceType || (existing?.reason === "holiday" ? "holiday" : "other"));
    reasonField.appendChild(absenceType);
    const dateField=addFieldLabel("Expected return date"); const returnDate=makeDateInput(existing?.returnDate || ""); dateField.appendChild(returnDate);
    const detailsField=addFieldLabel("Details (optional)"); const details=makeTextInput(existing?.note || "", "e.g. Hamstring injury"); detailsField.appendChild(details);
    function updateFields() {
      const value=status.value;
      reasonField.style.display=value === "unavailable" ? "block" : "none";
      dateField.style.display=value === "available" ? "none" : "block";
      detailsField.style.display=value === "available" ? "none" : "block";
      if(value === "injured") detailsField.querySelector("span").textContent="Injury details (optional)";
      else if(value === "suspended") detailsField.querySelector("span").textContent="Suspension details (optional)";
      else detailsField.querySelector("span").textContent="Details (optional)";
    }
    status.addEventListener("change",updateFields); updateFields();
    card.append(reasonField,dateField,detailsField);
    const actions=document.createElement("div"); actions.className="mt-sm-form-actions";
    const save=document.createElement("button"); save.type="button"; save.className="mt-sm-primary"; save.textContent="Save availability";
    const cancel=document.createElement("button"); cancel.type="button"; cancel.className="mt-sm-secondary"; cancel.textContent="Cancel";
    save.onclick=()=>{
      const records=allAbsences();
      if(status.value === "available") {
        records.forEach(r=>{if(String(r.playerId)===String(player.id)&&r.status!=="cleared"){r.status="cleared";r.clearedAt=new Date().toISOString();}});
      } else {
        if(returnDate.value && returnDate.value < todayLocal()) return alert("The expected return date cannot be in the past. To restore availability, select Available.");
        const updated=records.filter(r=>!(String(r.playerId)===String(player.id)&&r.status!=="cleared"));
        updated.push({id:existing?.id || `absence_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,playerId:player.id,playerName:player.name,reason:status.value,absenceType:status.value==="unavailable"?absenceType.value:"",status:"active",startDate:existing?.startDate || todayLocal(),returnDate:returnDate.value,note:details.value.trim(),updatedAt:new Date().toISOString()});
        window.MatchTrackerStorage.saveAvailability(updated);
        overlay.remove(); render(container); return;
      }
      window.MatchTrackerStorage.saveAvailability(records); overlay.remove(); render(container);
    };
    cancel.onclick=()=>overlay.remove(); actions.append(save,cancel); card.appendChild(actions);
    overlay.appendChild(card); overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove();}); container.appendChild(overlay);
  }
  function renderAvailability(container) {
    addSubHeader(container,"TEAM MANAGEMENT","Availability","View and manage injuries, suspensions and other absences",activeAbsenceCount(),"active",()=>{currentView="dashboard";render(container);});
    const records=allAbsences();
    const roster=players.concat(borrowedPlayers);
    const shirtOrder=r=>{const person=roster.find(p=>String(p.id)===String(r.playerId));return Number(person?.number||999)};
    const active=records.filter(r=>r.status!=="cleared").sort((a,b)=>shirtOrder(a)-shirtOrder(b)||String(a.playerName||"").localeCompare(String(b.playerName||"")));
    if(!active.length) container.appendChild(emptyState("No active absences","All registered players are currently available."));
    active.forEach(r=>{
      const card=document.createElement("section");
      card.style.cssText="display:flex;flex-direction:column;gap:10px;padding:14px;margin:0 0 10px;background:#FFFFFF;border:1px solid #DCE4E9;border-radius:14px;box-shadow:0 2px 7px rgba(30,58,95,.05);box-sizing:border-box;width:100%;";
      const info=document.createElement("div");info.style.cssText="display:flex;flex-direction:column;gap:5px;min-width:0";
      const name=document.createElement("strong");name.textContent=r.playerName||"Player";name.style.cssText="font-size:17px;line-height:1.25;color:#243447;font-weight:900;overflow-wrap:anywhere";
      const reason=String(r.reason||"unavailable").toLowerCase();
      const palette=reason==="injured"?{bg:"#FFF0DF",fg:"#A85A16",icon:"♥"}:reason==="suspended"?{bg:"#FCE6E6",fg:"#B52E35",icon:"⚑"}:{bg:"#E8EDF5",fg:"#405D83",icon:"▣"};
      const detail=document.createElement("span");detail.textContent=`${palette.icon} ${absenceLabel(r)}  ·  Return: ${formatDate(r.returnDate)}`;detail.style.cssText=`display:inline-flex;align-self:flex-start;max-width:100%;padding:5px 8px;border-radius:7px;background:${palette.bg};color:${palette.fg};font-size:12px;font-weight:850;line-height:1.3;overflow-wrap:anywhere`;
      info.append(name,detail);
      if(r.note){const note=document.createElement("small");note.textContent=r.note;note.style.cssText="font-size:12px;color:#657482;line-height:1.35;overflow-wrap:anywhere";info.appendChild(note);}
      if(r.returnDate && r.returnDate <= todayLocal()) {const due=document.createElement("small");due.textContent="RETURN DATE REACHED · CONFIRM AVAILABILITY";due.style.cssText="color:#B42318;font-size:11px;font-weight:900;letter-spacing:.2px";info.appendChild(due);}
      const person=players.concat(borrowedPlayers).find(x=>String(x.id)===String(r.playerId));
      const actions=document.createElement("div");actions.style.cssText="display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:8px;width:100%";
      const view=document.createElement("button");view.type="button";view.textContent="View details";view.style.cssText="min-height:40px;padding:8px 10px;border:1px solid #D5DEE5;border-radius:9px;background:#FFFFFF;color:#1E3A5F;font-size:13px;font-weight:800;white-space:nowrap";view.onclick=()=>showAbsenceView(r,container);
      const manage=document.createElement("button");manage.type="button";manage.textContent="Manage absence";manage.style.cssText="min-height:40px;padding:8px 10px;border:0;border-radius:9px;background:#1E3A5F;color:#FFFFFF;font-size:13px;font-weight:800;white-space:nowrap";manage.onclick=()=>{if(person)openAvailabilityForm(person,container,r);};
      actions.append(view,manage);card.append(info,actions);container.appendChild(card);
    });
    const add=document.createElement("button");add.type="button";add.className="mt-sm-primary";add.textContent="+ Add absence";add.onclick=()=>openAddAbsence(container);container.appendChild(add);
    const history=records.filter(r=>r.status==="cleared");
    if(history.length){const heading=document.createElement("h3");heading.textContent="Previous absences";heading.style.cssText="margin:22px 0 9px;color:#1E3A5F;font-size:16px";container.appendChild(heading);history.slice().reverse().forEach(r=>{const line=document.createElement("div");line.className="mt-sm-player-row";const info=document.createElement("div");info.className="mt-sm-player-info";const n=document.createElement("strong");n.textContent=r.playerName||"Player";const d=document.createElement("small");d.textContent=`${absenceLabel(r)} · Cleared ${formatDate((r.clearedAt||"").slice(0,10))}`;info.append(n,d);const view=document.createElement("button");view.className="mt-sm-edit";view.textContent="View";view.onclick=()=>showAbsenceView(r,container);line.append(info,view);container.appendChild(line);});}
    addBackButton(container,"Back to Squad",()=>{currentView="dashboard";render(container);});
  }
  function showAbsenceView(record,container){
    const overlay=document.createElement("div");overlay.className="mt-sm-overlay";const card=document.createElement("div");card.className="mt-sm-form-card";
    const title=document.createElement("h2");title.textContent="Absence details";card.appendChild(title);
    const lines=[["Player",record.playerName||"Player"],["Status",absenceLabel(record)],["From",formatDate(record.startDate)],["Expected return",formatDate(record.returnDate)],["Details",record.note||"No details recorded"],["Record status",record.status==="cleared"?"Cleared":"Active"]];
    lines.forEach(([label,value])=>{const p=document.createElement("p");p.style.cssText="margin:9px 0;color:#243447;font-size:14px";const b=document.createElement("strong");b.textContent=`${label}: `;p.append(b,document.createTextNode(value));card.appendChild(p);});
    const close=document.createElement("button");close.type="button";close.className="mt-sm-primary";close.textContent="Close";close.onclick=()=>overlay.remove();card.appendChild(close);overlay.appendChild(card);overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove();});container.appendChild(overlay);
  }
  function openAddAbsence(container){
    const overlay=document.createElement("div");overlay.className="mt-sm-overlay";const card=document.createElement("div");card.className="mt-sm-form-card";const title=document.createElement("h2");title.textContent="Add player absence";card.appendChild(title);
    const field=addFieldLabel("Select player");
    const activeIds=new Set(allAbsences().filter(r=>r.status!=="cleared").map(r=>String(r.playerId)));
    const people=players.concat(borrowedPlayers).filter(p=>!activeIds.has(String(p.id)));
    const select=makeSelect(people.map(p=>[String(p.id),p.name]),people[0]?String(people[0].id):"");
    if(people.length){field.appendChild(select);}else{const empty=document.createElement("p");empty.textContent="All registered players already have an active absence. Use Manage Absence to update an existing record.";empty.style.cssText="color:#657482;font-size:14px;line-height:1.4";field.appendChild(empty);}
    card.appendChild(field);
    const actions=document.createElement("div");actions.className="mt-sm-form-actions";const next=document.createElement("button");next.type="button";next.className="mt-sm-primary";next.textContent="Continue";next.disabled=!people.length;next.onclick=()=>{const person=people.find(p=>String(p.id)===select.value);overlay.remove();if(person)openAvailabilityForm(person,container,null);};const cancel=document.createElement("button");cancel.type="button";cancel.className="mt-sm-secondary";cancel.textContent="Cancel";cancel.onclick=()=>overlay.remove();actions.append(next,cancel);card.appendChild(actions);overlay.appendChild(card);container.appendChild(overlay);
  }

  function sortByNumber(a, b) { return Number(a.number || 999) - Number(b.number || 999) || String(a.name).localeCompare(String(b.name)); }

  function openPlayerForm(container, type, existing = null) {
    const isBorrowed = type === "borrowed";
    const overlay = document.createElement("div"); overlay.className = "mt-sm-overlay";
    const card = document.createElement("div"); card.className = "mt-sm-form-card";
    const title = document.createElement("h2"); title.textContent = `${existing ? "Edit" : "Add"} ${isBorrowed ? "Borrowed Player" : "Player"}`;
    card.appendChild(title);
    const nameField = makeField("Player Name", "text", existing ? existing.name : "", "Enter player name", "name");
    const numberField = makeField("Usual Shirt Number", "number", existing ? existing.number : "", "Enter shirt number", "numeric");
    card.append(nameField.wrapper, numberField.wrapper);
    const actions = document.createElement("div"); actions.className = "mt-sm-form-actions";
    const save = document.createElement("button"); save.type = "button"; save.className = "mt-sm-primary"; save.textContent = existing ? "Save Changes" : (isBorrowed ? "Add Borrowed Player" : "Add Player");
    const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "mt-sm-secondary"; cancel.textContent = "Cancel";
    save.onclick = () => {
      const playerName = nameField.input.value.trim(); const shirt = numberField.input.value.trim();
      if (!playerName) return alert("Enter the player name.");
      if (!shirt || Number(shirt) < 0 || Number(shirt) > 99) return alert("Enter a valid shirt number from 0 to 99.");
      const list = isBorrowed ? borrowedPlayers : players;
      if (!isBorrowed) {
        const duplicate = list.find(p => String(p.number) === shirt && (!existing || p.id !== existing.id));
        if (duplicate) return alert("That shirt number is already in the squad.");
      }
      if (existing) { existing.name = playerName; existing.number = shirt; }
      else list.push({ id: nextId(isBorrowed ? "borrowed" : "player"), name: playerName, number: shirt });
      if (isBorrowed) saveBorrowedPlayers(); else savePlayers();
      overlay.remove(); render(container);
    };
    cancel.onclick = () => overlay.remove();
    actions.append(save, cancel); card.appendChild(actions);
    if (existing) {
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "mt-sm-remove"; remove.textContent = isBorrowed ? "Remove Borrowed Player" : "Remove Player";
      remove.onclick = () => {
        if (!confirm(`Remove ${existing.name} from the ${isBorrowed ? "borrowed player register" : "squad"}?`)) return;
        if (isBorrowed) { borrowedPlayers = borrowedPlayers.filter(p => p.id !== existing.id); saveBorrowedPlayers(); }
        else { players = players.filter(p => p.id !== existing.id); savePlayers(); }
        overlay.remove(); render(container);
      };
      card.appendChild(remove);
    }
    overlay.appendChild(card); overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    // Keep the modal inside the Squad screen so its scoped styles apply.
    // Appending to document.body bypassed #matchtrackerSquad descendant CSS,
    // leaving the form without its overlay/card layout on mobile.
    container.appendChild(overlay);
    setTimeout(() => nameField.input.focus(), 80);
  }

  function makeField(labelText, type, value, placeholder, inputMode) {
    const wrapper = document.createElement("label"); wrapper.className = "mt-sm-field";
    const label = document.createElement("span"); label.textContent = labelText;
    const input = document.createElement("input"); input.type = type; input.value = value == null ? "" : value; input.placeholder = placeholder; input.autocomplete = "off";
    if (inputMode) input.inputMode = inputMode;
    if (type === "number") { input.min = "0"; input.max = "99"; input.step = "1"; }
    wrapper.append(label, input); return { wrapper, input };
  }

  function addBackButton(container, label, action) {
    const back = document.createElement("button"); back.type = "button"; back.className = "mt-sm-back"; back.innerHTML = `<span aria-hidden="true">←</span>${label}`; back.onclick = action; container.appendChild(back);
  }

  window.MatchTrackerSquad = { init, render };
})(window);
