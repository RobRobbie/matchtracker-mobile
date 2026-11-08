// ============================================================
// MATCHTRACKER 2027 — MATCHDAY TEAM SELECTION
// One continuous selection flow: Starting XI, then Bench.
// ============================================================
(function (window) {
  "use strict";
  const C = { navy:"#1E3A5F", green:"#3F7D70", bg:"#F1F4F6", ink:"#243447", white:"#FFFFFF", muted:"#5C6B78", line:"#D7DEE5", disabled:"#E5E9ED", danger:"#B42318" };
  let callbacks = {}, match = null, containerRef = null, players = [], starters = [], bench = [], phase = "starters", numberOverrides = new Map();
  function init(options={}) {
    callbacks = { onCancel:options.onCancel, onManageSquad:options.onManageSquad, onContinue:options.onContinue };
    match = options.match || null;
    const regular = window.MatchTrackerStorage?.loadPlayers?.() || [];
    const borrowed = (window.MatchTrackerStorage?.loadBorrowedPlayers?.() || []).map(p=>({...p,id:`borrowed:${p.id}`,sourceId:p.id,isBorrowed:true}));
    const all = regular.concat(borrowed);
    const existing = Array.isArray(match?.matchdaySquad) ? match.matchdaySquad : [];
    const savedXI = Array.isArray(match?.startingXI) ? match.startingXI : [];
    const savedBench = Array.isArray(match?.substitutes) ? match.substitutes : [];
    const eligible = all.filter(p=>!isUnavailable(p));
    players = eligible.map(p=>({...p, id:String(p.id), isBorrowed:!!p.isBorrowed})).sort((a,b)=>Number(a.number||999)-Number(b.number||999)||String(a.name||"").localeCompare(String(b.name||"")));
    starters = savedXI.map(s=>players.find(p=>String(p.id)===String(s.id))).filter(Boolean).slice(0,11);
    bench = savedBench.map(s=>players.find(p=>String(p.id)===String(s.id))).filter(Boolean).filter(p=>!starters.some(x=>x.id===p.id)).slice(0,6);
    // Preserve an existing match squad when it contains valid players but no saved bench yet.
    if (!savedXI.length && existing.length) starters = existing.slice(0,11).map(s=>players.find(p=>String(p.id)===String(s.id))).filter(Boolean);
    numberOverrides = new Map(existing.filter(p=>p.isBorrowed).map(p=>[String(p.id),String(p.number||"")]));
    phase = starters.length >= 11 ? "bench" : "starters";
  }
  function isUnavailable(p) {
    const records = window.MatchTrackerStorage?.loadAvailability?.() || [];
    const today = new Date().toISOString().slice(0,10);
    return records.some(r=>String(r.playerId)===String(p.sourceId||p.id) && r.status!=="cleared");
  }
  function render(container) {
    if(!container)return; containerRef=container; container.innerHTML="";
    container.style.cssText=`background:${C.bg};color:${C.ink};min-height:100vh;box-sizing:border-box;padding:16px;`;
    const header=document.createElement("section"); header.style.cssText=`background:linear-gradient(115deg,rgba(30,58,95,.94),rgba(49,93,120,.82)),url(assets/preseason-training.jpg) center/cover;color:white;border-radius:18px;padding:19px;margin-bottom:13px;`;
    header.innerHTML=`<div style="font-size:11px;font-weight:800;letter-spacing:2px;opacity:.8">PRE-SEASON · TEAM SELECTION</div><div style="font-size:25px;font-weight:900;margin-top:5px">Matchday Team</div><div style="font-size:13px;opacity:.9;margin-top:6px">vs ${esc(match?.opponent||"Opponent TBC")}</div>`; container.appendChild(header);
    const stage=document.createElement("section"); stage.id="mtSelectionStage";
    stage.style.cssText=`background:${phase==="bench"?"linear-gradient(135deg,#DCEFE7,#EAF5EF)":"linear-gradient(135deg,#1E3A5F,#315D78)"};color:${phase==="bench"?"#245B46":"white"};border:1px solid ${phase==="bench"?"#A8D6C4":"#1E3A5F"};border-radius:13px;padding:14px 15px;margin-bottom:10px;box-shadow:0 2px 8px #1e3a5f12`;
    stage.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong id="mtStageTitle" style="font-size:17px;letter-spacing:.2px">${phase==='starters'?'SELECT STARTING XI':'STARTING XI COMPLETE · SELECT YOUR BENCH'}</strong><strong id="mtStageCount" style="font-size:17px">${phase==='starters'?starters.length+'/11':bench.length+'/6'}</strong></div>`;
    container.appendChild(stage);
    const avail=document.createElement("section"); avail.style.cssText=`background:white;border-radius:15px;padding:14px;box-shadow:0 2px 8px #1e3a5f12`;
    avail.innerHTML=`<div style="font-size:15px;font-weight:900">${phase==='starters'?'AVAILABLE PLAYERS':'AVAILABLE BENCH PLAYERS'}</div>`;
    const list=document.createElement("div");list.id="mtAvailableList";list.style.cssText="display:grid;gap:7px;margin-top:11px";avail.appendChild(list);container.appendChild(avail);
    const actions=document.createElement("div");actions.style.cssText="display:grid;gap:9px;margin:14px auto 0;max-width:650px";
    const done=document.createElement("button");done.id="mtContinueTeam";done.type="button";done.textContent=phase==='starters'?'Select 11 starters to continue':`Continue to Match · ${starters.length+bench.length}/17`;done.style.cssText=`min-height:53px;border:0;border-radius:12px;background:${C.green};color:white;font-size:16px;font-weight:900`;
    done.disabled=starters.length!==11;done.style.opacity=done.disabled?".45":"1";done.onclick=saveTeam;actions.appendChild(done);
    if(phase==='bench'){const back=document.createElement("button");back.type="button";back.textContent="Edit Starting XI";back.style.cssText=`min-height:46px;border:1px solid ${C.line};border-radius:11px;background:white;color:${C.navy};font-weight:800`;back.onclick=()=>{phase="starters";render(containerRef)};actions.appendChild(back)}
    const cancel=document.createElement("button");cancel.type="button";cancel.textContent="← Back to Match Details";cancel.style.cssText=`min-height:46px;border:1px solid ${C.line};border-radius:11px;background:white;color:${C.ink};font-weight:800`;cancel.onclick=()=>callbacks.onCancel&&callbacks.onCancel();actions.appendChild(cancel);container.appendChild(actions);
    refresh();
  }
  function refresh(){
    if(!containerRef)return;
    const list=containerRef.querySelector('#mtAvailableList'); if(!list)return;
    list.innerHTML="";
    const stageTitle=containerRef.querySelector('#mtStageTitle');
    const stageCount=containerRef.querySelector('#mtStageCount');
    if(stageTitle)stageTitle.textContent=phase==='starters'?'SELECT STARTING XI':'SELECT BENCH';
    if(stageCount){stageCount.textContent=phase==='starters'?`${starters.length}/11`:`${bench.length}/6`;stageCount.style.color=phase==='starters'?C.navy:C.green}
    const stats=window.MatchTrackerStorage?.loadSeasonStats?.()||{};
    players.forEach(p=>{
      const id=String(p.id), xiIndex=starters.findIndex(x=>String(x.id)===id), benchIndex=bench.findIndex(x=>String(x.id)===id);
      const inXI=xiIndex>=0, inBench=benchIndex>=0, chosen=inXI||inBench;
      const row=document.createElement('button'); row.type='button';
      row.style.cssText=`display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:9px;width:100%;min-height:52px;padding:6px 9px;border:1px solid ${inXI?'#9BB7D0':inBench?'#A8D6C4':C.line};border-radius:11px;background:${inXI?'#E8EFF7':inBench?'#E5F3ED':C.white};color:${C.ink};text-align:left;cursor:${chosen?'default':'pointer'};`;
      const number=document.createElement('span');number.textContent=p.number||'—';number.style.cssText=`display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:${chosen?'#FFFFFF':'#EAF0F5'};color:${C.navy};font-size:16px;font-weight:900`;
      const copy=document.createElement('span');copy.style.cssText='display:block;min-width:0';
      const name=document.createElement('strong');name.textContent=p.name||'Unnamed player';name.style.cssText='display:block;font-size:14px;line-height:1.2;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      const meta=document.createElement('small');meta.textContent=`${p.isBorrowed?'BORROWED':'SQUAD'} · #${numberOverrides.get(p.id)||p.number||'—'}`;meta.style.cssText=`display:block;margin-top:3px;font-size:10px;letter-spacing:.45px;color:${C.muted};font-weight:750`;
      copy.append(name,meta);
      const tag=document.createElement('span');
      if(inXI){tag.textContent=`STARTER ${xiIndex+1} · REMOVE`;tag.style.cssText='background:#D3E1F0;color:#244B73'}
      else if(inBench){tag.textContent=`BENCH ${benchIndex+1} · REMOVE`;tag.style.cssText='background:#CDE8DA;color:#276B50'}
      else {tag.textContent=phase==='starters'?'SELECT XI':'SELECT BENCH';tag.style.cssText=`background:#E9EEF2;color:${C.muted}`}
      tag.style.cssText+=`;padding:6px 7px;border-radius:7px;font-size:9px;font-weight:900;white-space:nowrap`;
      row.append(number,copy,tag);
      const y=Number(stats[p.name]?.yellow||0);
      if(y){const caution=document.createElement('small');caution.textContent=`🟨 ${y}${y>=4?' · SUSPENSION WARNING':''}`;caution.style.cssText=`grid-column:2/4;color:${y>=4?'#B42318':'#946200'};font-size:10px;font-weight:850;margin-top:-5px`;row.appendChild(caution)}
      row.disabled=!chosen&&(phase==='starters'?starters.length>=11:bench.length>=6);
      row.style.opacity=chosen?'.96':'1';
      row.onclick=()=>{
        if(chosen){
          if(inXI){starters.splice(xiIndex,1);phase='starters';}
          else if(inBench){bench.splice(benchIndex,1);}
          render(containerRef);
          return;
        }
        if(phase==='starters'){
          if(starters.length>=11)return;
          starters.push(p);
          if(starters.length===11){
            phase='bench';render(containerRef);
            const stageEl=containerRef.querySelector('#mtSelectionStage');
            if(stageEl)stageEl.scrollIntoView({behavior:'smooth',block:'start'});
            return;
          }
        }else if(bench.length<6)bench.push(p);
        refresh();
      };
      list.appendChild(row);
    });
    const done=containerRef.querySelector('#mtContinueTeam');
    if(done){done.textContent=phase==='starters'?'Select 11 starters to continue':`Continue to Match · ${starters.length+bench.length}/17`;done.disabled=starters.length!==11;done.style.opacity=done.disabled?'.45':'1'}
  }
  function saveTeam(){if(starters.length!==11){alert('Please select exactly 11 starting players.');return}const squad=starters.concat(bench).map(p=>({...p,number:numberOverrides.get(p.id)||p.number||''}));const updated=window.MatchTrackerPreSeasonService?.updateMatch(match.id,{matchFormat:'11-a-side',matchdaySquad:squad,startingXI:starters.map((p,i)=>({...p,number:numberOverrides.get(p.id)||p.number||'',position:match?.startingXI?.[i]?.position||''})),substitutes:bench.map(p=>({...p,number:numberOverrides.get(p.id)||p.number||''})),status:'preparing'});if(!updated){alert('The match team could not be saved.');return}match=updated;if(callbacks.onContinue)callbacks.onContinue(updated)}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  window.MatchTrackerPreSeasonSquadSelection={init,render};
})(window);
