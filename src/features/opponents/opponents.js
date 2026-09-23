// ============================================================
// MATCHTRACKER — OPPONENTS FEATURE
// ============================================================
// Opponent records can be added at any time and reused later.
// ============================================================

(function (window) {
  "use strict";

  const COLORS = { navy:"#1E3A5F", blueGreen:"#3F7D70", lightGrey:"#F1F4F6", darkText:"#243447", white:"#FFFFFF", silver:"#B8C2CC", muted:"#5C6B78", danger:"#B42318" };
  let callbacks = { onBack:null };
  let opponents = [];

  function init(options={}) {
    callbacks.onBack = typeof options.onBack === "function" ? options.onBack : null;
    opponents = window.MatchTrackerStorage.loadOpponents();
    if (!Array.isArray(opponents)) opponents = [];
  }
  function save(){ window.MatchTrackerStorage.saveOpponents(opponents); }
  function nextId(){ return "opponent_" + Date.now() + "_" + Math.random().toString(36).slice(2,8); }

  function render(container){
    if(!container) return;
    container.innerHTML="";
    container.style.cssText=`background:${COLORS.lightGrey};color:${COLORS.darkText};min-height:100vh;box-sizing:border-box;padding:20px;`;
    const header=document.createElement("div");
    header.style.cssText=`background:${COLORS.navy};color:white;border-radius:18px;padding:22px 20px;margin-bottom:16px;`;
    header.innerHTML=`<div style="font-size:13px;font-weight:700;letter-spacing:2px;opacity:.75;margin-bottom:6px">OPPONENTS</div><div style="font-size:28px;font-weight:800">Opponent List</div><div style="font-size:14px;margin-top:8px;opacity:.85">Add opponents whenever you need them.</div>`;
    container.appendChild(header);
    const add=document.createElement("button");
    add.type="button"; add.innerText="＋  ADD OPPONENT";
    add.style.cssText=`width:100%;min-height:56px;border:none;border-radius:12px;background:${COLORS.blueGreen};color:white;font-size:17px;font-weight:800;cursor:pointer;margin-bottom:16px;`;
    add.onclick=()=>openForm(); container.appendChild(add);
    const list=document.createElement("div"); container.appendChild(list);
    if(!opponents.length){
      const empty=document.createElement("div"); empty.style.cssText=`background:white;border:1px dashed ${COLORS.silver};border-radius:14px;padding:28px 18px;text-align:center;color:${COLORS.muted};font-size:15px;`;
      empty.innerHTML=`<div style="font-size:18px;font-weight:800;color:${COLORS.darkText};margin-bottom:6px">No opponents added yet</div><div>Add an opponent before a match or directly from the match setup later.</div>`;
      list.appendChild(empty);
    } else opponents.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).forEach(o=>list.appendChild(row(o)));
    const back=document.createElement("button"); back.type="button"; back.innerText="←  Back to Home";
    back.style.cssText=`width:100%;min-height:52px;border:1px solid ${COLORS.silver};border-radius:12px;background:white;color:${COLORS.darkText};font-size:16px;font-weight:800;cursor:pointer;margin-top:18px;`;
    back.onclick=()=>callbacks.onBack&&callbacks.onBack(); container.appendChild(back);
  }
  function row(opponent){
    const row=document.createElement("div"); row.style.cssText="background:white;border-radius:14px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.05);";
    const icon=document.createElement("div"); icon.innerText="⚽"; icon.style.cssText=`width:46px;height:46px;border-radius:50%;background:${COLORS.lightGrey};display:flex;align-items:center;justify-content:center;font-size:21px;flex:none;`;
    const name=document.createElement("div"); name.innerText=opponent.name; name.style.cssText="flex:1;min-width:0;font-size:17px;font-weight:800;";
    const edit=document.createElement("button"); edit.type="button"; edit.innerText="Edit"; edit.style.cssText=`min-height:44px;padding:0 13px;border:1px solid ${COLORS.silver};border-radius:10px;background:white;color:${COLORS.navy};font-weight:800;cursor:pointer;`; edit.onclick=()=>openForm(opponent);
    row.append(icon,name,edit); return row;
  }
  function openForm(existing=null){
    const overlay=document.createElement("div"); overlay.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:20px;box-sizing:border-box;overflow:auto;";
    const card=document.createElement("div"); card.style.cssText="width:100%;max-width:480px;background:white;border-radius:18px;padding:20px;box-sizing:border-box;margin-top:30px;";
    card.innerHTML=`<div style="font-size:24px;font-weight:800;color:${COLORS.navy};margin-bottom:18px">${existing?"Edit Opponent":"Add Opponent"}</div>`;
    const label=document.createElement("label"); label.innerText="Opponent Name"; label.style.fontWeight="800";
    const input=document.createElement("input"); input.type="text"; input.value=existing?existing.name:""; input.placeholder="Enter opponent name"; input.style.cssText=`display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:13px;border:1px solid ${COLORS.silver};border-radius:10px;font-size:17px;`;
    label.appendChild(input); card.appendChild(label);
    const actions=document.createElement("div"); actions.style.cssText="display:flex;gap:10px;margin-top:18px;";
    const saveBtn=document.createElement("button"); saveBtn.type="button"; saveBtn.innerText=existing?"Save Changes":"Add Opponent"; saveBtn.style.cssText=`flex:1;min-height:50px;border:none;border-radius:12px;background:${COLORS.blueGreen};color:white;font-size:16px;font-weight:800;cursor:pointer;`;
    saveBtn.onclick=()=>{const name=input.value.trim(); if(!name)return alert("Enter the opponent name."); const dup=opponents.find(o=>o.name.toLowerCase()===name.toLowerCase()&&(!existing||o.id!==existing.id)); if(dup)return alert("That opponent already exists."); if(existing) existing.name=name; else opponents.push({id:nextId(),name}); save(); overlay.remove(); const c=document.getElementById("matchtrackerOpponents"); if(c)render(c);};
    const cancel=document.createElement("button"); cancel.type="button"; cancel.innerText="Cancel"; cancel.style.cssText=`min-height:50px;padding:0 18px;border:1px solid ${COLORS.silver};border-radius:12px;background:white;color:${COLORS.darkText};font-weight:800;cursor:pointer;`; cancel.onclick=()=>overlay.remove();
    actions.append(saveBtn,cancel); card.appendChild(actions);
    if(existing){const remove=document.createElement("button"); remove.type="button"; remove.innerText="Remove Opponent"; remove.style.cssText=`width:100%;min-height:48px;margin-top:10px;border:1px solid #E3B4B0;border-radius:12px;background:white;color:${COLORS.danger};font-weight:800;cursor:pointer;`; remove.onclick=()=>{if(!confirm(`Remove ${existing.name}?`))return; opponents=opponents.filter(o=>o.id!==existing.id); save(); overlay.remove(); const c=document.getElementById("matchtrackerOpponents"); if(c)render(c);}; card.appendChild(remove);}
    overlay.appendChild(card); document.body.appendChild(overlay); input.focus();
  }
  window.MatchTrackerOpponents={init,render};
})(window);
