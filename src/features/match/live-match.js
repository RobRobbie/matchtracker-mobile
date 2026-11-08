// MatchTracker — matchday bench and live match screen.
// Match state is persisted on every action; season totals are committed once at Full Time.
(function (window) {
  "use strict";
  const C = { navy: "#1E3A5F", green: "#3F7D70", bg: "#F1F4F6", ink: "#243447", muted: "#657482", white: "#fff", red: "#B42318" };
  let match = null, root = null, timer = null, elapsed = 0, halfElapsed = 0, period = "First Half", eventRows = [], playerStats = {}, teamStats = null;
  let playerEnteredAt = {}, playerSeconds = {}, starterNames = new Set(), appearedNames = new Set();
  let callbacks = { onBack: null, onCompleted: null };
  const store = () => window.MatchTrackerPreSeasonService;
  const formatTime = sec => `${String(Math.floor(sec / 60)).padStart(2,"0")}:${String(sec % 60).padStart(2,"0")}`;
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const maxPlayers = () => 11;
  function init(options = {}) {
    match = options.match || null; root = options.container || null;
    callbacks.onBack = typeof options.onBack === "function" ? options.onBack : null;
    callbacks.onCompleted = typeof options.onCompleted === "function" ? options.onCompleted : null;
    elapsed = Number(match?.elapsedSeconds || 0);
    halfElapsed = Number(match?.halfElapsedSeconds ?? (period === "Second Half" ? Math.max(0, elapsed - 2700) : elapsed));
    period = match?.period || "First Half";
    eventRows = Array.isArray(match?.events) ? match.events.slice() : [];
    teamStats = match?.statistics?.team || null;
    playerStats = match?.statistics?.players || {};
    playerEnteredAt = match?.playerEnteredAt || {};
    playerSeconds = match?.playerSeconds || {};
    starterNames = new Set((match?.startingXI || []).map(p => p.name));
    appearedNames = new Set(match?.appearedPlayerNames || Object.keys(playerEnteredAt));
    if (Array.isArray(match?.starterNames)) starterNames = new Set(match.starterNames);
  }
  function persist(changes = {}) { const updated = store().updateMatch(match.id, changes); if (updated) match = updated; return updated; }
  function render(container) {
    root = container || root; if (!root || !match) return;
    // Starting XI now opens directly into the Live Match screen. The coach starts
    // the clock from that screen; there is no separate Ready-to-Play screen.
    renderLive();
  }
  function shell(title, subtitle) {
    root.innerHTML = ""; root.style.cssText = `min-height:100vh;box-sizing:border-box;padding:12px;background:${C.bg};color:${C.ink};font-family:Arial,sans-serif;`;
    const header = document.createElement("header"); header.style.cssText = `background:linear-gradient(115deg,rgba(30,58,95,.95),rgba(49,93,120,.84)),url(assets/football-detail.jpg) center/cover;color:white;padding:17px;border-radius:16px;margin-bottom:12px;`;
    header.innerHTML = `<div style="font-size:11px;font-weight:800;letter-spacing:2px;opacity:.8">MATCHTRACKER · ${escapeHtml(period.toUpperCase())}</div><div style="font-size:23px;font-weight:900;margin-top:5px">${escapeHtml(title)}</div><div style="font-size:13px;opacity:.85;margin-top:4px">${escapeHtml(subtitle || "")}</div>`; root.appendChild(header);
    return header;
  }
  function btn(text, color, action, disabled=false) { const b=document.createElement("button"); b.type="button"; b.textContent=text; b.disabled=disabled; b.style.cssText=`min-height:44px;border:0;border-radius:11px;padding:10px 12px;background:${color||C.green};color:white;font-size:14px;font-weight:800;cursor:pointer;opacity:${disabled?.5:1};`; b.onclick=action; return b; }
  function card() { const d=document.createElement("section"); d.style.cssText=`background:white;border-radius:14px;padding:13px;margin-bottom:11px;box-shadow:0 2px 8px rgba(0,0,0,.05);`; root.appendChild(d); return d; }
  function renderBench() {
    clearInterval(timer);
    shell("Ready to Play", `vs ${match.opponent || "Opponent"} · 11-a-side`);
    const starters = Array.isArray(match.startingXI) ? match.startingXI.slice(0, 11) : [];
    const squad = Array.isArray(match.matchdaySquad) ? match.matchdaySquad.slice(0, 17) : starters.concat(match.substitutes || []).slice(0, 17);
    const substitutes = squad.filter(p => !starters.some(st => String(st.id) === String(p.id))).slice(0, 6);
    match.substitutes = substitutes;
    persist({startingXI: starters, matchdaySquad: squad, substitutes, status: "setup"});
    const intro = card();
    intro.innerHTML = `<div style="font-weight:900;font-size:18px">Review your team before kick-off</div><div style="font-size:13px;color:${C.muted};margin-top:5px">Tap a player to make a late change. The clock is stopped.</div><div style="font-size:12px;color:${C.muted};margin-top:5px">Match squad: ${squad.length}/17</div>`;
    const c = card(); c.innerHTML = `<div style="font-weight:900;font-size:18px">Starting XI · ${starters.length}/11</div>`;
    starters.forEach((p,i)=>{ const row=btn(`${p.number ? "#"+p.number+" · " : ""}${p.name} · CHANGE`, C.bg, ()=>changeStarter(i)); row.style.cssText += `;width:100%;margin-top:6px;color:${C.ink};text-align:left`; c.appendChild(row); });
    const b = card(); b.innerHTML = `<div style="font-weight:900;font-size:18px">Bench · ${substitutes.length}/6</div><div style="font-size:13px;color:${C.muted};margin:4px 0 8px">The remaining selected players are automatically assigned here.</div>`;
    substitutes.forEach((p,i)=>{ const row=btn(`${p.number ? "#"+p.number+" · " : ""}${p.name} · CHANGE`, C.bg, ()=>changeBench(i)); row.style.cssText += `;width:100%;margin-top:6px;color:${C.ink};text-align:left`; b.appendChild(row); });
    const actions=card(); actions.style.display="grid"; actions.style.gap="8px";
    actions.appendChild(btn("OPEN MATCH CENTRE →", C.green, renderPreKickoff, starters.length !== 11));
    actions.appendChild(btn("← Back to Team Selection", "#64748B", ()=>callbacks.onBack && callbacks.onBack(match)));
  }
  function masterPlayers() {
    return (window.MatchTrackerStorage?.loadPlayers?.() || []).filter(p => p && p.id !== undefined && p.name);
  }
  function changeStarter(index) {
    const starters=(match.startingXI||[]).slice(); const squad=(match.matchdaySquad||[]).slice();
    const options=squad.filter(p=>!starters.some((st,i)=>i!==index && String(st.id)===String(p.id))).concat(masterPlayers().filter(p=>!squad.some(q=>String(q.id)===String(p.id))));
    showPlayerObjects("Replace " + (starters[index]?.name || "player"), options, replacement=>{
      if(!replacement)return;
      const old=starters[index];
      if(!squad.some(p=>String(p.id)===String(replacement.id)) && squad.length>=17){alert("The matchday squad is limited to 17 players. Return a player to the squad before adding another.");return;}
      starters[index]=replacement;
      if(!squad.some(p=>String(p.id)===String(replacement.id))) squad.push(replacement);
      if(old && !squad.some(p=>String(p.id)===String(old.id))) squad.push(old);
      match.startingXI=starters; match.matchdaySquad=squad.slice(0,17); match.substitutes=match.matchdaySquad.filter(p=>!starters.some(st=>String(st.id)===String(p.id))).slice(0,6);
      persist({startingXI:match.startingXI,matchdaySquad:match.matchdaySquad,substitutes:match.substitutes,status:"setup"}); renderBench();
    });
  }
  function changeBench(index) {
    const starters=(match.startingXI||[]).slice(); const squad=(match.matchdaySquad||[]).slice();
    const bench=squad.filter(p=>!starters.some(st=>String(st.id)===String(p.id)));
    const current=bench[index];
    const options=starters.concat(masterPlayers().filter(p=>!squad.some(q=>String(q.id)===String(p.id))));
    showPlayerObjects("Change bench player",options,replacement=>{
      if(!replacement)return;
      if(starters.some(p=>String(p.id)===String(replacement.id))){
        const i=starters.findIndex(p=>String(p.id)===String(replacement.id)); starters[i]=current;
      } else {
        if(squad.length>=17){const pos=squad.findIndex(p=>String(p.id)===String(current.id)); if(pos>=0)squad.splice(pos,1);}
        if(!squad.some(p=>String(p.id)===String(replacement.id)))squad.push(replacement);
      }
      match.startingXI=starters; match.matchdaySquad=squad.slice(0,17); match.substitutes=match.matchdaySquad.filter(p=>!starters.some(st=>String(st.id)===String(p.id))).slice(0,6);
      persist({startingXI:match.startingXI,matchdaySquad:match.matchdaySquad,substitutes:match.substitutes,status:"setup"}); renderBench();
    });
  }
  function showPlayerObjects(title, players, onChoose) {
    const overlay=document.createElement("div"); overlay.style.cssText="position:fixed;inset:0;z-index:20000;background:rgba(15,23,42,.68);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box";
    const panel=document.createElement("div"); panel.style.cssText="width:100%;max-width:420px;max-height:85vh;overflow:auto;background:#fff;border-radius:16px;padding:16px;box-sizing:border-box";
    const heading=document.createElement("div"); heading.textContent=title; heading.style.cssText=`font-size:20px;font-weight:900;margin-bottom:12px;color:${C.navy}`; panel.appendChild(heading);
    const close=()=>overlay.remove();
    players.forEach(p=>{const b=btn(`${p.number ? "#"+p.number+" · " : ""}${p.name}`,C.bg,()=>{close();onChoose(p)});b.style.cssText+=`;width:100%;margin:4px 0;color:${C.ink};text-align:left`;panel.appendChild(b)});
    const cancel=btn("Cancel",C.navy,close);cancel.style.width="100%";cancel.style.marginTop="8px";panel.appendChild(cancel);overlay.appendChild(panel);overlay.addEventListener("click",e=>{if(e.target===overlay)close()});document.body.appendChild(overlay);
  }
  function renderPreKickoff() {
    clearInterval(timer);
    shell("Match Centre", `vs ${match.opponent || "Opponent"} · Ready for kick-off`);
    const starters=Array.isArray(match.startingXI)?match.startingXI:[];
    const substitutes=Array.isArray(match.substitutes)?match.substitutes.slice(0,6):[];
    const status=card(); status.innerHTML=`<div style="font-size:12px;font-weight:800;letter-spacing:1px;color:${C.muted}">MATCH STATUS</div><div style="font-size:26px;font-weight:900;margin:5px 0">NOT STARTED</div><div style="font-size:14px;color:${C.muted}">The clock is stopped. Match events will be available after kick-off.</div>`;
    const score=card(); score.style.textAlign="center"; score.innerHTML=`<div style="font-size:12px;color:${C.muted};font-weight:800">SCORE</div><div style="font-size:40px;font-weight:900;margin:4px 0">0 – 0</div><div style="font-size:28px;font-weight:900;color:${C.green}">00:00</div><div style="font-size:12px;color:${C.muted}">First Half · Not started</div>`;
    const events=card(); events.innerHTML='<div style="font-size:17px;font-weight:900;margin-bottom:8px">Match Events</div><div style="font-size:13px;color:'+C.muted+'">Goal · Substitution · Cards · Shots · Corners</div><div style="font-size:12px;color:'+C.muted+';margin-top:5px">Event recording unlocks when the match starts.</div>';
    const lineup=card(); lineup.innerHTML=`<div style="font-size:17px;font-weight:900;margin-bottom:8px">Starting XI · ${starters.length}/11</div>`; starters.forEach(p=>{const r=document.createElement("div");r.style.cssText="padding:5px 0;border-bottom:1px solid #edf0f2";r.textContent=p.name;lineup.appendChild(r)});
    const actions=card(); actions.style.display="grid"; actions.style.gap="8px";
    actions.appendChild(btn("START MATCH ▶",C.green,startActualMatch,starters.length!==11));
    actions.appendChild(btn("← Back to team review","#64748B",renderBench));
  }
  function startActualMatch() {
    const starters=Array.isArray(match.startingXI)?match.startingXI:[];
    const substitutes=Array.isArray(match.substitutes)?match.substitutes.slice(0,6):[];
    if(starters.length!==11){alert(`You need exactly 11 starting players before kick-off. Current selection: ${starters.length}/11.`);return;}
    clearInterval(timer); elapsed=0; halfElapsed=0; period="First Half"; eventRows=[];
    playerStats={}; teamStats={home:{goals:0,shotsOn:0,shotsOff:0,corners:0,freeKicks:0,offsides:0,yellow:0,red:0,penalties:0},away:{goals:0,shotsOn:0,shotsOff:0,corners:0,freeKicks:0,offsides:0,yellow:0,red:0,penalties:0}};
    starters.concat(substitutes).forEach(p=>playerStats[p.name]={goals:0,assists:0,shotsOn:0,shotsOff:0,yellow:0,red:0,minutes:0});
    playerEnteredAt={};playerSeconds={};starterNames=new Set(starters.map(p=>p.name));appearedNames=new Set(starters.map(p=>p.name));starters.forEach(p=>playerEnteredAt[p.name]=0);
    persist({substitutes,status:"live",startedAt:new Date().toISOString(),events:[],statistics:{team:teamStats,players:playerStats},score:{home:0,away:0},period,elapsedSeconds:0,halfElapsedSeconds:0,playerEnteredAt,playerSeconds,starterNames:Array.from(starterNames),appearedPlayerNames:Array.from(appearedNames)});
    renderLive();startTimer();
  }

  function showPicker(title, players, allowNone, onChoose) {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:20000;background:rgba(15,23,42,.68);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box";
    const panel = document.createElement("div");
    panel.style.cssText = "width:100%;max-width:420px;max-height:85vh;overflow:auto;background:#fff;border-radius:16px;padding:16px;box-sizing:border-box;box-shadow:0 12px 40px rgba(0,0,0,.25)";
    const heading = document.createElement("div"); heading.textContent = title; heading.style.cssText = "font-size:20px;font-weight:900;margin-bottom:12px;color:" + C.navy; panel.appendChild(heading);
    const close = () => overlay.remove();
    if (allowNone) { const none = btn("No player / None", "#64748B", () => { close(); onChoose(""); }); none.style.width = "100%"; none.style.marginBottom = "7px"; panel.appendChild(none); }
    if (!players.length) { const empty = document.createElement("div"); empty.textContent = "No eligible players available."; empty.style.cssText = "padding:12px 0;color:" + C.muted; panel.appendChild(empty); }
    players.forEach(player => { const b = btn(`${player.number ? "#" + player.number + " · " : ""}${player.name}`, C.bg, () => { close(); onChoose(player.name); }); b.style.cssText += `;width:100%;margin:4px 0;color:${C.ink};text-align:left`; panel.appendChild(b); });
    const cancel = btn("Cancel", C.navy, close); cancel.style.width = "100%"; cancel.style.marginTop = "8px"; panel.appendChild(cancel);
    overlay.appendChild(panel); overlay.addEventListener("click", e => { if (e.target === overlay) close(); }); document.body.appendChild(overlay);
  }
  function currentOnPitchPlayers() {
    const names = new Set(Object.keys(playerEnteredAt || {}));
    return (match.startingXI || []).concat(match.substitutes || []).filter(p => names.has(p.name));
  }
  function clockReadings(){
    const secondHalf = period === "Second Half";
    const threshold = secondHalf ? 5400 : 2700;
    const base = secondHalf ? 5400 : 2700;
    const extra = Math.max(0, elapsed - threshold);
    const main = extra > 0 ? `${secondHalf ? "90" : "45"}+${formatTime(extra)}` : formatTime(elapsed);
    const half = secondHalf
      ? (halfElapsed > 2700 ? `45+${formatTime(halfElapsed-2700)}` : formatTime(halfElapsed))
      : (elapsed > 2700 ? `45+${formatTime(elapsed-2700)}` : formatTime(elapsed));
    return {main, half, stoppage: extra > 0 || (!secondHalf && elapsed > 2700)};
  }
  function updateClockDisplay(){
    const t=clockReadings(), main=root?.querySelector("#mtLiveClock"), half=root?.querySelector("#mtHalfClock"), label=root?.querySelector("#mtClockStage");
    if(main){main.textContent=t.main;main.style.color=t.stoppage?"#FF7777":"#FFFFFF"}
    if(half){half.textContent=t.half;half.style.color=t.stoppage?"#FF7777":"#FFFFFF"}
    if(label)label.textContent=period==="Second Half"?"SECOND HALF CLOCK":"FIRST HALF CLOCK";
  }
  function startTimer(){ clearInterval(timer); timer=setInterval(()=>{ elapsed++; halfElapsed++; updateClockDisplay(); if(elapsed % 5 === 0 && match?.status === "live") persist({elapsedSeconds:elapsed,halfElapsedSeconds:halfElapsed,period,playerEnteredAt,playerSeconds,appearedPlayerNames:Array.from(appearedNames)}); },1000); }
  function renderLive(){
    clearInterval(timer); elapsed=Number(match.elapsedSeconds||elapsed||0); period=match.period||period||"First Half";
    const isPreStart = !["live", "half-time"].includes(String(match.status || "").toLowerCase());
    const liveHeader = shell("LIVE MATCH",`${match.opponent || "Opponent"} · ${match.venue || "Venue TBC"}`);
    const anim = document.createElement("style"); anim.textContent="@keyframes mtScorePulse{0%{transform:scale(1)}35%{transform:scale(1.06)}100%{transform:scale(1)}} #mtHomeScore,#mtAwayScore{display:inline-block;animation:mtScorePulse .35s ease-out}"; liveHeader.appendChild(anim);
    const score=card(); score.style.cssText += ";background:linear-gradient(135deg,#17375E,#244E78);color:#fff;padding:22px 14px;text-align:center;border-radius:20px;box-shadow:0 8px 24px rgba(30,58,95,.2)";
    score.innerHTML=`<div style="font-size:11px;color:#D6E4F0;font-weight:900;letter-spacing:2px">${isPreStart ? "MATCH STATUS · NOT STARTED" : escapeHtml(period.toUpperCase())}</div><div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;margin:15px 0"><div><div style="font-size:12px;color:#D6E4F0;font-weight:800">YOUR TEAM</div><div id="mtHomeScore" style="font-size:52px;font-weight:900;line-height:1.1">${Number(match.score?.home||0)}</div></div><div style="font-size:22px;color:#D6E4F0;font-weight:700">–</div><div><div style="font-size:12px;color:#D6E4F0;font-weight:800">${escapeHtml((match.opponent||"OPPONENT").toUpperCase())}</div><div id="mtAwayScore" style="font-size:52px;font-weight:900;line-height:1.1">${Number(match.score?.away||0)}</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><div style="background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:9px 5px"><div style="font-size:10px;font-weight:800;letter-spacing:1px;color:#D6E4F0">MAIN MATCH CLOCK</div><div id="mtLiveClock" style="font-variant-numeric:tabular-nums;font-size:29px;font-weight:900">${clockReadings().main}</div></div><div style="background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:9px 5px"><div id="mtClockStage" style="font-size:10px;font-weight:800;letter-spacing:1px;color:#D6E4F0">${period==="Second Half"?"SECOND HALF CLOCK":"FIRST HALF CLOCK"}</div><div id="mtHalfClock" style="font-variant-numeric:tabular-nums;font-size:29px;font-weight:900">${clockReadings().half}</div></div></div><div style="font-size:12px;color:#D6E4F0;margin-top:9px">${isPreStart ? "Clock stopped · Ready for kick-off" : "MATCH IN PROGRESS"}</div>`;
    if(isPreStart){const start=btn("▶  START MATCH",C.green,startActualMatch,(match.startingXI||[]).length!==11);start.style.cssText+=";width:100%;min-height:56px;font-size:17px;border-radius:14px;letter-spacing:.4px";score.appendChild(start);}
    const actions=card(); actions.style.cssText += ";padding:15px";
    actions.innerHTML='<div style="font-size:18px;font-weight:900;margin-bottom:4px">Quick Match Events</div><div style="font-size:12px;color:'+C.muted+';margin-bottom:12px">The four actions used most often are ready here. Other events are grouped below.</div>';
    const grid=document.createElement("div"); grid.style.cssText="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px";
    [["⚽","GOAL FOR",()=>record("Goal","home"),C.green],["⚽","GOAL AGAINST",()=>record("Goal","away"),C.red],["⇄","OUR SUB",()=>substitute(),C.navy],["⇄","OPPOSITION SUB",()=>opponentSubstitution(),C.navy]].forEach(([ico,label,fn,col])=>{const button=btn("",col,fn,isPreStart);button.innerHTML='<span style="font-size:24px;display:block;margin-bottom:5px">'+ico+'</span><span>'+label+'</span>';button.style.cssText+=";min-height:82px;font-size:13px;line-height:1.2;border-radius:14px;box-shadow:0 2px 5px rgba(0,0,0,.08);display:flex;flex-direction:column;align-items:center;justify-content:center";grid.appendChild(button)}); actions.appendChild(grid);
    const more=document.createElement("details");more.style.cssText="margin-top:12px;border:1px solid #E2E8F0;border-radius:12px;padding:0 11px;background:#F8FAFC";
    const summary=document.createElement("summary");summary.textContent="MORE EVENTS · Cards, shots & match stats";summary.style.cssText="padding:13px 2px;font-size:13px;font-weight:900;color:"+C.navy+";cursor:pointer;list-style-position:inside";more.appendChild(summary);
    const extra=document.createElement("div");extra.style.cssText="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 0 11px";
    [["SHOT ON TARGET",()=>record("Shot On Target","home"),C.navy],["SHOT OFF TARGET",()=>record("Shot Off Target","home"),C.navy],["OUR YELLOW CARD",()=>record("Yellow Card","home"),"#9A6700"],["OUR RED CARD",()=>record("Red Card","home"),C.red],["OPPOSITION YELLOW",()=>record("Yellow Card","away"),"#9A6700"],["OPPOSITION RED",()=>record("Red Card","away"),C.red],["CORNER",()=>record("Corner","home"),C.navy],["FREE KICK",()=>record("Free Kick","home"),C.navy],["OFFSIDE",()=>record("Offside","home"),C.navy],["PENALTY",()=>record("Penalty","home"),C.green]].forEach(([label,fn,col])=>{const button=btn(label,col,fn,isPreStart);button.style.cssText+=";min-height:48px;font-size:11px;line-height:1.2;border-radius:10px";extra.appendChild(button)});
    more.appendChild(extra);actions.appendChild(more);
    const state=card(); state.style.display="grid"; state.style.gridTemplateColumns="repeat(2,minmax(0,1fr))"; state.style.gap="8px";
    if(!isPreStart){
      state.appendChild(btn("HALF TIME","#B45309",()=>{clearInterval(timer);period="Half Time";persist({status:"half-time",period,elapsedSeconds:elapsed,halfElapsedSeconds:halfElapsed,events:eventRows,statistics:teamStats,score:match.score});renderLive();}));
      state.appendChild(btn("SECOND HALF",C.navy,()=>{period="Second Half";elapsed=2700;halfElapsed=0;persist({status:"live",period,elapsedSeconds:elapsed,halfElapsedSeconds:halfElapsed});renderLive();startTimer();}));
      state.appendChild(btn("FULL TIME · SAVE MATCH",C.red,finishMatch));
      state.appendChild(btn("Undo Last Event","#64748B",undoEvent));
    } else {
      const edit=btn("EDIT TEAM / BENCH",C.navy,()=>callbacks.onBack && callbacks.onBack(match));edit.style.gridColumn="1 / -1";state.appendChild(edit);
    }
    const startersNow=Array.isArray(match.startingXI)?match.startingXI:[];
    const benchNow=Array.isArray(match.substitutes)?match.substitutes:[];
    const teamCard=card();
    teamCard.innerHTML=`<div style="font-size:18px;font-weight:900;margin-bottom:10px">Team Line-up <span style="font-size:12px;color:${C.muted};font-weight:700">${startersNow.length}/11 · Bench ${benchNow.length}/6</span></div>`;
    const lineupGrid=document.createElement("div");lineupGrid.style.cssText="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px";
    [["STARTING XI",startersNow], ["BENCH",benchNow]].forEach(([heading,players])=>{const col=document.createElement("div");const h=document.createElement("div");h.textContent=heading;h.style.cssText="font-size:11px;font-weight:900;letter-spacing:1px;color:"+C.muted+";margin-bottom:6px";col.appendChild(h);players.forEach(p=>{const r=document.createElement("div");r.textContent=(p.number?"#"+p.number+" ":"")+p.name;r.style.cssText="font-size:12px;padding:5px 0;border-bottom:1px solid #edf0f2;overflow-wrap:anywhere";col.appendChild(r)});if(!players.length){const e=document.createElement("div");e.textContent="No players";e.style.cssText="font-size:12px;color:"+C.muted;col.appendChild(e)}lineupGrid.appendChild(col)});teamCard.appendChild(lineupGrid);
    const opposition=card();
    opposition.innerHTML='<div style="font-size:18px;font-weight:900">Opposition Players</div><div style="font-size:12px;color:'+C.muted+';margin:4px 0 10px">Add shirt numbers for cards and substitutions. Numbers are saved with this match.</div>';
    const oppList=Array.isArray(match.opponentPlayers)?match.opponentPlayers:[];
    const oppForm=document.createElement("form");oppForm.style.cssText="display:flex;gap:8px;align-items:center;margin-bottom:10px";
    const numberInput=document.createElement("input");numberInput.type="number";numberInput.min="1";numberInput.max="99";numberInput.placeholder="Jersey no.";numberInput.setAttribute("aria-label","Opposition jersey number");numberInput.style.cssText="width:110px;min-width:0;min-height:44px;padding:8px 10px;border:1px solid #CBD5E1;border-radius:10px;font-size:16px;box-sizing:border-box";
    const addOpp=btn("+ ADD PLAYER",C.green,()=>{});addOpp.type="submit";addOpp.style.cssText+=";flex:1";numberInput.disabled=oppList.length>=11;addOpp.disabled=oppList.length>=11; if(oppList.length>=11){numberInput.placeholder="11 players added";addOpp.textContent="SQUAD FULL";} oppForm.append(numberInput,addOpp);oppForm.onsubmit=e=>{e.preventDefault();const n=String(numberInput.value||"").trim();if(oppList.length>=11){alert("The opposition match squad is limited to 11 active players.");return;}if(!n||Number(n)<1||Number(n)>99){alert("Enter a jersey number from 1 to 99.");return;}if(oppList.some(p=>String(p.number)===n)){alert("That opposition jersey number is already in the list.");return;}oppList.push({id:"opp_"+n,number:n,name:"#"+n});match.opponentPlayers=oppList;persist({opponentPlayers:oppList});renderLive();};opposition.appendChild(oppForm);
    if(!oppList.length){const empty=document.createElement("div");empty.textContent="No opposition players added yet.";empty.style.cssText="font-size:13px;color:"+C.muted+";padding:8px 0";opposition.appendChild(empty);}else{const chips=document.createElement("div");chips.style.cssText="display:flex;flex-wrap:wrap;gap:7px";oppList.forEach((p,i)=>{const chip=btn("#"+p.number+"  ×",C.bg,()=>{if(!confirm("Remove opposition player #"+p.number+"?"))return;oppList.splice(i,1);match.opponentPlayers=oppList;persist({opponentPlayers:oppList});renderLive();});chip.style.cssText+=";color:"+C.ink+";border:1px solid #D8E0E8;min-width:64px";chips.appendChild(chip)});opposition.appendChild(chips);}
    const stats=card(); stats.innerHTML='<div style="font-size:18px;font-weight:900;margin-bottom:8px">Live Stats</div>';
    const ts=match.statistics?.team||teamStats; const home=ts.home||{}, away=ts.away||{};
    [["Shots on target",home.shotsOn,away.shotsOn],["Shots off target",home.shotsOff,away.shotsOff],["Corners",home.corners,away.corners],["Free kicks",home.freeKicks,away.freeKicks],["Offsides",home.offsides,away.offsides],["Yellow cards",home.yellow,away.yellow],["Penalties",home.penalties,away.penalties]].forEach(([label,a,b])=>{const r=document.createElement("div");r.style.cssText="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #edf0f2;font-size:14px";r.innerHTML=`<strong>${Number(a||0)}</strong><span>${label}</span><strong>${Number(b||0)}</strong>`;stats.appendChild(r);});
    const timeline=card(); timeline.innerHTML='<div style="font-size:17px;font-weight:900;margin-bottom:8px">Match Timeline</div>'; const events=Array.isArray(match.events)?match.events:[];
    if(!events.length) timeline.insertAdjacentHTML("beforeend",`<div style="color:${C.muted};font-size:13px">No events recorded yet.</div>`);
    events.slice().reverse().forEach(e=>{const r=document.createElement("div");r.style.cssText="padding:9px 0;border-bottom:1px solid #edf0f2;font-size:13px";r.textContent=`${formatTime(e.seconds||0)} · ${e.type} · ${e.team==='home'?'Your team':match.opponent}${e.player?' · '+e.player:''}`;timeline.appendChild(r);});
    if(match.status==="live") startTimer();
  }
  function opponentSubstitution() {
    const players=(Array.isArray(match.opponentPlayers)?match.opponentPlayers:[]).map(p=>({id:p.id,number:p.number,name:"#"+p.number}));
    if(!players.length){alert("Add the opposition's starting 11 before recording a substitution.");return;}
    showPicker("Select opposition player coming OFF",players,false,offName=>{
      const off=players.find(p=>p.name===offName);
      if(!off)return;
      const overlay=document.createElement("div");
      overlay.style.cssText="position:fixed;inset:0;z-index:20001;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box";
      const panel=document.createElement("div");panel.style.cssText="width:100%;max-width:390px;background:#fff;border-radius:17px;padding:20px;box-sizing:border-box";
      const heading=document.createElement("h2");heading.textContent="Opposition player coming ON";heading.style.cssText="margin:0 0 8px;color:"+C.navy+";font-size:21px";
      const help=document.createElement("p");help.textContent=`Player #${off.number} is coming off. Enter the shirt number of the replacement.`;help.style.cssText="font-size:14px;color:"+C.muted+";line-height:1.4";
      const input=document.createElement("input");input.type="number";input.min="1";input.max="99";input.inputMode="numeric";input.placeholder="New player's shirt number";input.style.cssText="width:100%;box-sizing:border-box;min-height:54px;padding:12px;border:1px solid #CBD5E1;border-radius:11px;font-size:18px;margin:8px 0 14px";
      const actions=document.createElement("div");actions.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:9px";
      const cancel=btn("Cancel",C.navy,()=>overlay.remove());
      const save=btn("Confirm Sub",C.green,()=>{const n=String(input.value||"").trim();if(!n||Number(n)<1||Number(n)>99){alert("Enter a shirt number from 1 to 99.");return;}if(players.some(p=>p.id!==off.id&&String(p.number)===n)){alert("That shirt number is already in the active opposition list.");return;}const list=(match.opponentPlayers||[]).slice();const index=list.findIndex(p=>String(p.id)===String(off.id));if(index<0){alert("The selected opposition player could not be found.");overlay.remove();return;}list.splice(index,1,{id:"opp_"+n+"_"+Date.now(),number:n,name:"#"+n});eventRows.push({id:`ev_${Date.now()}`,seconds:elapsed,period,type:"Substitution",team:"away",player:`#${off.number} OFF · #${n} ON`});match.opponentPlayers=list;persist({events:eventRows,elapsedSeconds:elapsed,period,opponentPlayers:list});overlay.remove();renderLive();});
      actions.append(cancel,save);panel.append(heading,help,input,actions);overlay.appendChild(panel);overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove()});document.body.appendChild(overlay);input.focus();
    });
  }
  function record(type, team) {
    const eligible = team === "away"
      ? (Array.isArray(match.opponentPlayers)?match.opponentPlayers:[]).map(p=>({id:p.id,number:p.number,name:"#"+p.number}))
      : currentOnPitchPlayers();
    const needsPlayer = ["Goal", "Yellow Card", "Red Card", "Shot On Target", "Shot Off Target"].includes(type);
    if (needsPlayer) {
      showPicker(type === "Goal" ? "Select goal scorer" : `Select player · ${type}`, eligible, true, player => {
        if (type === "Goal" && player && team === "home") {
          showPicker("Select assist (optional)", eligible.filter(p => p.name !== player), true, assist => applyEvent(type, team, player, assist));
        } else applyEvent(type, team, player, "");
      });
      return;
    }
    applyEvent(type, team, "", "");
  }
  function applyEvent(type, team, player, assist) {
    const s = match.statistics?.team || teamStats;
    if (!s.home) s.home = {goals:0,shotsOn:0,shotsOff:0,corners:0,freeKicks:0,offsides:0,yellow:0,red:0,penalties:0};
    if (!s.away) s.away = {goals:0,shotsOn:0,shotsOff:0,corners:0,freeKicks:0,offsides:0,yellow:0,red:0,penalties:0};
    const t = s[team];
    if (type === "Goal" || type === "Penalty") { if (type === "Penalty") t.penalties = (t.penalties || 0) + 1; if (team === "home") match.score.home++; else match.score.away++; t.goals++; }
    if (type === "Shot On Target") t.shotsOn++;
    if (type === "Shot Off Target") t.shotsOff++;
    if (type === "Corner") t.corners++;
    if (type === "Free Kick") t.freeKicks++;
    if (type === "Offside") t.offsides++;
    if (type === "Yellow Card") t.yellow++;
    if (type === "Red Card") t.red++;
    if (player) {
      if (!playerStats[player]) playerStats[player] = {goals:0,assists:0,shotsOn:0,shotsOff:0,yellow:0,red:0,minutes:0};
      if (type === "Goal") playerStats[player].goals++;
      if (type === "Shot On Target") playerStats[player].shotsOn++;
      if (type === "Shot Off Target") playerStats[player].shotsOff++;
      if (type === "Yellow Card") playerStats[player].yellow++;
      if (type === "Red Card") playerStats[player].red++;
    }
    if (type === "Goal" && assist) {
      if (!playerStats[assist]) playerStats[assist] = {goals:0,assists:0,shotsOn:0,shotsOff:0,yellow:0,red:0,minutes:0};
      playerStats[assist].assists++;
      eventRows.push({id:`ev_${Date.now()}_assist`,seconds:elapsed,period,type:"Assist",team,player:assist,forGoal:player});
    }
    eventRows.push({id:`ev_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,seconds:elapsed,period,type,team,player});
    persist({score:match.score,events:eventRows,statistics:{team:s,players:playerStats},elapsedSeconds:elapsed,period,playerEnteredAt,playerSeconds,starterNames:Array.from(starterNames),appearedPlayerNames:Array.from(appearedNames)});
    renderLive();
  }
  function undoEvent(){const last=eventRows.pop();if(!last)return;const s=teamStats||match.statistics?.team;const t=s?.[last.team];if(t){if(last.type==="Goal"||last.type==="Penalty"){if(last.team==="home")match.score.home=Math.max(0,match.score.home-1);else match.score.away=Math.max(0,match.score.away-1);t.goals=Math.max(0,(t.goals||0)-1);if(last.type==="Penalty")t.penalties=Math.max(0,(t.penalties||0)-1);}if(last.type==="Shot On Target")t.shotsOn=Math.max(0,t.shotsOn-1);if(last.type==="Shot Off Target")t.shotsOff=Math.max(0,t.shotsOff-1);if(last.type==="Corner")t.corners=Math.max(0,t.corners-1);if(last.type==="Free Kick")t.freeKicks=Math.max(0,t.freeKicks-1);if(last.type==="Offside")t.offsides=Math.max(0,t.offsides-1);if(last.type==="Yellow Card")t.yellow=Math.max(0,t.yellow-1);if(last.type==="Red Card")t.red=Math.max(0,t.red-1);}if(last.player&&playerStats[last.player]){if(last.type==="Goal")playerStats[last.player].goals=Math.max(0,playerStats[last.player].goals-1);if(last.type==="Assist")playerStats[last.player].assists=Math.max(0,playerStats[last.player].assists-1);if(last.type==="Shot On Target")playerStats[last.player].shotsOn=Math.max(0,playerStats[last.player].shotsOn-1);if(last.type==="Shot Off Target")playerStats[last.player].shotsOff=Math.max(0,playerStats[last.player].shotsOff-1);if(last.type==="Yellow Card")playerStats[last.player].yellow=Math.max(0,playerStats[last.player].yellow-1);if(last.type==="Red Card")playerStats[last.player].red=Math.max(0,playerStats[last.player].red-1);}persist({score:match.score,events:eventRows,statistics:{team:s,players:playerStats},elapsedSeconds:elapsed});renderLive();}
  function substitute() {
    const onPitch = currentOnPitchPlayers();
    const bench = (match.substitutes || []).filter(p => !Object.prototype.hasOwnProperty.call(playerEnteredAt, p.name));
    if (!onPitch.length || !bench.length) { alert("There must be a player on the pitch and an unused substitute available."); return; }
    showPicker("Select player coming OFF", onPitch, false, off => {
      showPicker("Select substitute coming ON", bench, false, on => {
        if (!off || !on) return;
        const overlay=document.createElement("div");
        overlay.style.cssText="position:fixed;inset:0;z-index:20002;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box";
        const panel=document.createElement("div");panel.style.cssText="width:100%;max-width:420px;max-height:90vh;overflow:auto;background:#fff;border-radius:18px;padding:20px;box-sizing:border-box;box-shadow:0 18px 50px rgba(0,0,0,.22)";
        const heading=document.createElement("h2");heading.textContent="Substitution details";heading.style.cssText="margin:0 0 8px;color:"+C.navy+";font-size:22px";
        const summary=document.createElement("p");summary.textContent=`${off} OFF  →  ${on} ON`;summary.style.cssText="margin:0 0 16px;color:"+C.muted+";font-size:15px;font-weight:800";
        const label=document.createElement("label");label.textContent="Substitution reason";label.style.cssText="display:block;margin:10px 0 6px;font-weight:800;color:"+C.ink;
        const reason=document.createElement("select");reason.style.cssText="width:100%;min-height:52px;box-sizing:border-box;padding:10px 12px;border:1px solid #CBD5E1;border-radius:11px;background:white;color:"+C.ink+";font-size:17px";
        [["normal","Normal"],["injury","Injury"],["player request","Player Request"],["other","Other"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;reason.appendChild(o)});
        const injuryWrap=document.createElement("div");injuryWrap.style.cssText="display:none;margin-top:12px";
        const injuryLabel=document.createElement("label");injuryLabel.textContent="Injury sustained";injuryLabel.style.cssText="display:block;margin-bottom:6px;font-weight:800;color:"+C.ink;
        const injury=document.createElement("input");injury.type="text";injury.placeholder="Describe the injury";injury.style.cssText="width:100%;min-height:50px;box-sizing:border-box;padding:10px 12px;border:1px solid #CBD5E1;border-radius:11px;font-size:16px";
        injuryWrap.append(injuryLabel,injury);
        reason.onchange=()=>{injuryWrap.style.display=reason.value==="injury"?"block":"none"};
        const actions=document.createElement("div");actions.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:18px";
        const cancel=btn("Cancel",C.navy,()=>overlay.remove());
        const save=btn("Confirm substitution",C.green,()=>{
          const reasonValue=reason.value;
          const injuryDetail=injury.value.trim();
          if(reasonValue==="injury"&&!injuryDetail){alert("Please enter the injury sustained.");injury.focus();return;}
          if(!playerStats[off])playerStats[off]={goals:0,assists:0,shotsOn:0,shotsOff:0,yellow:0,red:0,minutes:0};
          if(!playerStats[on])playerStats[on]={goals:0,assists:0,shotsOn:0,shotsOff:0,yellow:0,red:0,minutes:0};
          if(playerEnteredAt[off]!==undefined){playerSeconds[off]=(playerSeconds[off]||0)+Math.max(0,elapsed-Number(playerEnteredAt[off]));delete playerEnteredAt[off];}
          playerEnteredAt[on]=elapsed;appearedNames.add(on);
          eventRows.push({id:`ev_${Date.now()}`,seconds:elapsed,period,type:"Substitution",team:"home",player:`${off} OFF · ${on} ON`,reason:reasonValue,...(reasonValue==="injury"?{injury:injuryDetail}:{})});
          if(reasonValue==="injury"){
            const squadPlayer=(match.matchdaySquad||[]).find(p=>p.name===off);
            if(squadPlayer){
              const records=window.MatchTrackerStorage.loadAvailability()||[];
              const playerId=squadPlayer.sourceId||squadPlayer.id;
              const exists=records.some(r=>String(r.playerId)===String(playerId)&&r.status!=="cleared");
              if(!exists)records.push({id:`absence_${Date.now()}`,playerId,playerName:off,reason:"injured",status:"active",startDate:new Date().toISOString().slice(0,10),returnDate:"",note:injuryDetail,matchId:match.id});
              window.MatchTrackerStorage.saveAvailability(records);
            }
          }
          persist({events:eventRows,elapsedSeconds:elapsed,period,playerEnteredAt,playerSeconds,starterNames:Array.from(starterNames),appearedPlayerNames:Array.from(appearedNames),statistics:{team:teamStats||match.statistics?.team,players:playerStats}});
          overlay.remove();renderLive();
        });
        actions.append(cancel,save);label.appendChild(reason);panel.append(heading,summary,label,injuryWrap,actions);overlay.appendChild(panel);overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove()});document.body.appendChild(overlay);
      });
    });
  }
  function finishMatch(){clearInterval(timer);if(!confirm("Finish the match and save its statistics to the season?"))return;
    Object.entries(playerEnteredAt).forEach(([name,entered])=>{playerSeconds[name]=(playerSeconds[name]||0)+Math.max(0,elapsed-Number(entered));});
    Object.entries(playerStats).forEach(([name,st])=>{st.minutes=Math.floor((playerSeconds[name]||0)/60);});
    const finalRecord={...match,status:"completed",period:"Full Time",elapsedSeconds:elapsed,completedAt:new Date().toISOString(),score:match.score,events:eventRows,statistics:{team:teamStats||match.statistics?.team,players:playerStats},playerEnteredAt:{},playerSeconds,starterNames:Array.from(starterNames),appearedPlayerNames:Array.from(appearedNames),report:{generated:true,generatedAt:new Date().toISOString()}};
    // Idempotent season update: completed matches are only rolled into totals once.
    const totals=window.MatchTrackerStorage.loadSeasonStats()||{};
    if(!match.seasonProcessed){Object.entries(playerStats).forEach(([name,st])=>{if(!totals[name])totals[name]={goals:0,assists:0,shotsOn:0,shotsOff:0,yellow:0,red:0,minutes:0,games:0,starts:0,subApps:0,unusedSubs:0};["goals","assists","shotsOn","shotsOff","yellow","red","minutes"].forEach(k=>{totals[name][k]=(totals[name][k]||0)+(Number(st[k])||0);});if(appearedNames.has(name))totals[name].games+=1;if(starterNames.has(name))totals[name].starts+=1;else if(appearedNames.has(name))totals[name].subApps+=1;else totals[name].unusedSubs+=1;});finalRecord.seasonProcessed=true;window.MatchTrackerStorage.saveSeasonStats(totals);}
    store().updateMatch(match.id,finalRecord);match=finalRecord;
    const log=window.MatchTrackerStorage.loadMatchLog()||[];const idx=log.findIndex(r=>r.id===match.id);const historic={...finalRecord,id:match.id,date:match.date||new Date().toLocaleDateString('en-AU'),opponent:match.opponent,venue:match.venue,score:match.score,berwick:{goals:match.score.home,on:teamStats?.home?.shotsOn||0,off:teamStats?.home?.shotsOff||0,corners:teamStats?.home?.corners||0,yellow:teamStats?.home?.yellow||0,red:teamStats?.home?.red||0},opp:{goals:match.score.away,on:teamStats?.away?.shotsOn||0,off:teamStats?.away?.shotsOff||0,corners:teamStats?.away?.corners||0,yellow:teamStats?.away?.yellow||0,red:teamStats?.away?.red||0}};if(idx>=0)log[idx]=historic;else log.push(historic);window.MatchTrackerStorage.saveMatchLog(log);
    root.innerHTML="";shell("FULL TIME",`Final result · ${match.opponent}`);const result=card();result.style.textAlign="center";result.innerHTML=`<div style="font-size:36px;font-weight:900">${match.score.home} – ${match.score.away}</div><div style="font-size:14px;margin-top:8px">${escapeHtml(match.opponent)}</div><div style="color:${C.green};font-weight:800;margin-top:12px">Match saved · Season totals updated</div>`;const a=card();a.appendChild(btn("Back to Previous Matches",C.navy,()=>window.MatchTrackerScreenManager?.showPreSeason?.()));
  }
  window.MatchTrackerLiveMatch={init,render};
})(window);
