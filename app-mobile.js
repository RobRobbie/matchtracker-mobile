// Backup before cleanup

// ============================
// DATA
// ============================

let opponentTeams = [
  "Brandon Park","Chisholm United","Peninsula Strikers","Noble Park United",
  "North Caulfield","Mooroolbark","Dandenong South","Knox City",
  "Casey Comets","Waverley City","Gippsland United"
];

let berwickPlayers = [
  "1 - Pedro Formosa","2 - Aaron Hunter","3 - Ashley Slater","4 - Josh Scarlett","5 - Blake Pearson",
  "6 - Philip Hawkins","7 - Sila Onye","9 - Jalil Nabizadah",
  "11 - Jarod Blackbourn","12 - Simon Mur","13 - Christian Lettieri","14 - Noor Nawrozi",
  "15 - Fraidoon Mohammadi","16 - Tanner Kidwell","17 - Kyle Marambio","18 - Christian Cavallo",
  "21 - Nathan Credlin",
  "22 - Franco Federico","23 - Matthew Foschini","25 - Daniel Carnevale","31 - Harry Simmons"
];

// ============================
// BORROWED PLAYERS
// ============================

// Load saved borrowed players from this browser
let borrowedPlayers =
  JSON.parse(localStorage.getItem("borrowedPlayers")) || [];

// Save borrowed players
function saveBorrowedPlayers(){
  localStorage.setItem(
    "borrowedPlayers",
    JSON.stringify(borrowedPlayers)
  );
}

// ============================
// ADD BORROWED PLAYER
// ============================

function addBorrowedPlayer(){

  openPopup();

  mainBox.innerHTML = `
    <h3 style="
      text-align:center;
      margin-bottom:20px;
      font-size:28px;
    ">
      Add Borrowed Player
    </h3>

    <div style="margin-bottom:15px;">
      <label>
        <b>Player Name</b>
      </label>
      <input
        id="borrowedName"
        type="text"
        placeholder="Enter player name"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          font-size:20px;
          margin-top:6px;
        "
      >
    </div>

    <div style="margin-bottom:15px;">
      <label>
        <b>Shirt Number</b>
      </label>
      <input
        id="borrowedNumber"
        type="number"
        placeholder="Enter shirt number"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          font-size:20px;
          margin-top:6px;
        "
      >
    </div>

    <div style="margin-bottom:15px;">
      <label>
        <b>Normally Plays For</b>
      </label>
      <input
        id="borrowedTeam"
        type="text"
        placeholder="e.g. Reserve Team"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          font-size:20px;
          margin-top:6px;
        "
      >
    </div>
  `;

  let row = document.createElement("div");

  row.style.display = "flex";
  row.style.justifyContent = "center";
  row.style.gap = "10px";
  row.style.marginTop = "20px";

  // SAVE
  let saveBtn = document.createElement("button");

  saveBtn.innerText = "Save Borrowed Player";

  saveBtn.onclick = ()=>{

    let name =
      document.getElementById("borrowedName")
        .value.trim();

    let number =
      document.getElementById("borrowedNumber")
        .value.trim();

    let normalTeam =
      document.getElementById("borrowedTeam")
        .value.trim();

    if(name === ""){
      alert("Enter player name");
      return;
    }

    if(number === ""){
      alert("Enter shirt number");
      return;
    }

    if(normalTeam === ""){
      alert("Enter the player's normal team");
      return;
    }

    // Prevent duplicate player names
    let exists =
      borrowedPlayers.find(
        p => p.name.toLowerCase() === name.toLowerCase()
      );

    if(exists){
      alert("That borrowed player already exists");
      return;
    }

    // Create unique ID
    let id =
      "BP-" + Date.now();

    borrowedPlayers.push({
      id: id,
      name: name,
      number: number,
      normalTeam: normalTeam,
      borrowed: true
    });

    saveBorrowedPlayers();

    alert(
      name +
      " has been saved as a borrowed player."
    );

    closePopup();
    selectXI();
  };

  // CANCEL
  let cancelBtn = document.createElement("button");

  cancelBtn.innerText = "Cancel";

  cancelBtn.onclick = ()=>{
    closePopup();
  };

  row.appendChild(saveBtn);
  row.appendChild(cancelBtn);

  mainBox.appendChild(row);
}

const EVENTS = {
  GOAL: "Goal",
  SHOT_ON: "Shot On Target",
  SHOT_OFF: "Shot Off Target",
  YELLOW: "Yellow Card",
  RED: "Red Card",
  CORNER: "Corner",
  OFFSIDE: "Offside"
};

let formations = {
  "4-3-3": ["GK","RB","CB","CB","LB","CM","CM","CM","RW","ST","LW"],
  "4-1-2-3": ["GK","RB","CB","CB","LB","CDM","CM","CM","RW","ST","LW"],
  "4-4-2": ["GK","RB","CB","CB","LB","RM","CM","CM","LM","ST","ST"],
  "3-5-2": ["GK","CB","CB","CB","RM","CM","CM","CM","LM","ST","ST"]
};

let lineup = { starters: [], bench: [] };
let activePlayers = [];
let currentFormation = "";
let selectedOpponent = "";
let usedPlayers = [];
let matchSquad = [];
let opponentPlayers = [];
let opponentYellowCards = {};
let movingOpponentIndex = null;
let movingBerwickIndex = null;
let opponentBench = [];

// ============================
// POPUP
// ============================

let mainOverlay=null, mainBox=null;

function openPopup(){
  if(!mainOverlay){
    mainOverlay=document.createElement("div");
    mainOverlay.className="popup-overlay";
    document.body.appendChild(mainOverlay);
  }
  mainBox=document.createElement("div");
  mainBox.className="popup-box";
  mainBox.style.maxWidth = "700px";
  mainBox.style.maxHeight = "85vh";
  mainBox.style.padding = "20px";
  mainOverlay.innerHTML="";
  mainOverlay.appendChild(mainBox);
}

function closePopup(){
  if(mainOverlay){
    mainOverlay.remove();
    mainOverlay=null;
  }
}

function btn(text){
  let b = document.createElement("button");
  b.className = "popup-btn";
  b.innerText = text;
  return b;
}

function parse(p){
  let [id,name]=p.split(" - ");
  return {id,name};
}

// ============================
// REUSABLE NUMBER PAD
// ============================

function createNumberPad(options){

  let current = "";

  // DISPLAY
  let display = document.createElement("div");

  display.style.fontSize = "32px";
  display.style.fontWeight = "bold";
  display.style.textAlign = "center";
  display.style.margin = "15px";

  if(options.startValue){
    current = options.startValue.replace("#","");
    display.innerText = current;
    updateDisplay();
  }

  options.container.appendChild(display);

  // KEYPAD
  let keypad = document.createElement("div");

  keypad.style.display = "grid";
  keypad.style.gridTemplateColumns =
    "repeat(3, 70px)";
  keypad.style.justifyContent = "center";
  keypad.style.gap = "10px";
  keypad.style.margin = "20px 0";

  function updateDisplay(){
    display.innerText = current;
  }

  for(let n = 1; n <= 9; n++){

    let b = document.createElement("button");

    b.innerText = n;

    b.style.height = "60px";
    b.style.fontSize = "24px";

    b.onclick = ()=>{

  if(current.length >= 2){
    current = "";
  }

  current += n;

  updateDisplay();
};

    keypad.appendChild(b);
  }

  let zero = document.createElement("button");

  zero.innerText = "0";

  zero.style.height = "60px";
  zero.style.fontSize = "24px";

  zero.onclick = ()=>{

  if(current.length >= 2){
    current = "";
  }

  current += "0";

  updateDisplay();
};

  keypad.appendChild(document.createElement("div"));
  keypad.appendChild(zero);
  keypad.appendChild(document.createElement("div"));

  options.container.appendChild(keypad);

  // DELETE FUNCTION
  function deleteLast(){

    current = current.slice(0,-1);

    updateDisplay();
  }

  // RETURN API
  return {

    getValue: ()=> current,

    deleteLast,

    createDeleteButton: ()=>{

      let del = document.createElement("button");

      del.innerText = "⌫";

      del.onclick = ()=>{
        deleteLast();
      };

      return del;
    }
  };
}

// ============================
// MATCH FLOW
// ============================

function selectOpponent(){
  openPopup();
  mainBox.innerHTML="<h3>Select Opponent</h3>";

  opponentTeams.forEach(t=>{
    let d=btn(t);
    d.onclick=()=>{
      selectedOpponent=t;
      selectVenue();
    };
    mainBox.appendChild(d);
  });
}

function selectVenue(){
  openPopup();
  mainBox.innerHTML="<h3>Home or Away</h3>";

  ["Home","Away"].forEach(v=>{
    let d=btn(v);
    d.onclick=()=>{
      window.matchVenue = v;
      document.getElementById("matchTitle").innerText =
        v==="Home"
        ? `Berwick City vs ${selectedOpponent}`
        : `${selectedOpponent} vs Berwick City`;

      document.getElementById("venue").innerText="Venue: "+v;
      document.getElementById("oppTitle").innerText=selectedOpponent;
      let oppHeader = document.getElementById("oppHeader");
if(oppHeader){
  oppHeader.innerText = selectedOpponent;
}

      currentFormation = "4-3-3";
selectXI();
    };
    mainBox.appendChild(d);
  });
}

function selectFormation(){
  openPopup();
  mainBox.innerHTML="<h3>Select Formation</h3>";

  Object.keys(formations).forEach(f=>{
    let d=btn(f);
    d.onclick=()=>{
      currentFormation=f;
      selectXI();
    };
    mainBox.appendChild(d);
  });
}

// ============================
// STARTING XI
// ============================

function selectXI(){

  openPopup();

  let left=document.createElement("div");
  let right=document.createElement("div");

  left.style="width:50%";
  right.style="width:50%";

  let wrap=document.createElement("div");
  wrap.style="display:flex;gap:20px;";

  let title=document.createElement("h3");
  mainBox.appendChild(title);

  function render(){

    left.innerHTML="<b>Available Players</b>";
    right.innerHTML="<b>Starting XI</b>";

    let count = lineup.starters.length;
    title.innerText = count < 11
  ? `Select Player (${count+1}/11)`
  : "Starting XI Complete";

    berwickPlayers.forEach(p=>{
      let id=p.split(" - ")[0];
      if(lineup.starters.find(x=>x.id===id)) return;

      let d=btn(p);

      d.onclick=()=>{
        if(lineup.starters.length>=11) return;

        let pl=parse(p);
        pl.position = formations[currentFormation][lineup.starters.length];

        lineup.starters.push(pl);
        render();
      };

      left.appendChild(d);
    });

    // ============================
    // BORROWED PLAYERS
    // ============================

    borrowedPlayers.forEach(p=>{

      if(lineup.starters.find(x=>x.id===p.id)) return;

      let d = btn(
        `${p.number} - ${p.name} (BORROWED)`
      );

      d.style.background = "#e8f4ff";

      d.onclick = ()=>{

        if(lineup.starters.length >= 11) return;

        let pl = {
          id: p.id,
          name: p.name,
          number: p.number,
          normalTeam: p.normalTeam,
          borrowed: true,
          position:
            formations[currentFormation][
              lineup.starters.length
            ]
        };

        lineup.starters.push(pl);

        render();
      };

      left.appendChild(d);
    });

    lineup.starters.forEach(p=>{
      let d=btn(p.name);
      d.style.background="#90ee90";
      d.onclick=()=>{
        lineup.starters=lineup.starters.filter(x=>x.id!==p.id);
        render();
      };
      right.appendChild(d);
    });
  }

  render();

  // ============================
  // ADD BORROWED PLAYER
  // ============================

  let borrowedBtn = document.createElement("button");

  borrowedBtn.innerText = "＋ ADD BORROWED PLAYER";

  borrowedBtn.onclick = ()=>{
    addBorrowedPlayer();
  };

   
  let accept=document.createElement("button");
  accept.innerText="ACCEPT STARTING XI";

  accept.onclick=()=>{
    if(lineup.starters.length!==11){
      alert("Select 11 players");
      return;
    }
    activePlayers=[...lineup.starters];
    renderPitch();
    selectBench();
  };

  wrap.appendChild(left);
  wrap.appendChild(right);
  mainBox.appendChild(wrap);
  mainBox.appendChild(borrowedBtn); 
  mainBox.appendChild(accept);
}

// ============================
// BENCH
// ============================

function selectBench(){

  openPopup();

  let left=document.createElement("div");
  let right=document.createElement("div");

  left.style="width:50%";
  right.style="width:50%";

  let wrap=document.createElement("div");
  wrap.style="display:flex;gap:20px;";

  let title=document.createElement("h3");
  mainBox.appendChild(title);

  function render(){

    left.innerHTML="<b>Available Players</b>";
    right.innerHTML="<b>Substitutes</b>";

    title.innerText=`Select Substitutes (${lineup.bench.length}/6)`;

    berwickPlayers.forEach(p=>{
      let id=p.split(" - ")[0];

      // skip starters
      if(lineup.starters.find(x=>x.id===id)) return;

      // skip already selected
      if(lineup.bench.find(x=>x.id===id)) return;

      let d=btn(p);

      d.onclick=()=>{
        if(lineup.bench.length>=6) return;

        lineup.bench.push(parse(p));
        render();
      };

      left.appendChild(d);
    });

        // ============================
    // BORROWED PLAYERS
    // ============================

    borrowedPlayers.forEach(p=>{

      // Skip if already a starter
      if(lineup.starters.find(x=>x.id===p.id)) return;

      // Skip if already on bench
      if(lineup.bench.find(x=>x.id===p.id)) return;

      let d = btn(
        `${p.number} - ${p.name} (BORROWED)`
      );

      d.style.background = "#e8f4ff";

      d.onclick = ()=>{

        if(lineup.bench.length >= 6) return;

        lineup.bench.push({
          id: p.id,
          name: p.name,
          number: p.number,
          normalTeam: p.normalTeam,
          borrowed: true
        });

        render();
      };

      left.appendChild(d);
    });

    lineup.bench.forEach((p,i)=>{
      let d=btn(`SUB ${i+1}: ${p.name}`);
      d.style.background="#add8e6";

      d.onclick=()=>{
        lineup.bench=lineup.bench.filter(x=>x.id!==p.id);
        render();
      };

      right.appendChild(d);
    });
  }

  render();

let accept=document.createElement("button");
accept.innerText="ACCEPT BENCH";

accept.onclick=()=>{

  if(lineup.bench.length < 6){

    let confirmShort = confirm(
      `You selected only ${lineup.bench.length} subs. Continue?`
    );

    if(!confirmShort){
      return;
    }
  }

  // ✅ SAVE MATCH SQUAD HERE
matchSquad = [
  ...lineup.starters.map(p => p.name),
  ...lineup.bench.map(p => p.name)
];

renderPitch();

closePopup();
};

  wrap.appendChild(left);
  wrap.appendChild(right);
  mainBox.appendChild(wrap);
  mainBox.appendChild(accept);
}

// ============================
// MATCH EVENTS
// ============================

let matchDate = "";

let eventHistory = [];

let stats = {
  berwick:{goals:0,on:0,off:0,corners:0,freeKicks:{def:0,mid:0,att:0},offsides:0,yellow:0,red:0},
  opp:{goals:0,on:0,off:0,corners:0,freeKicks:{def:0,mid:0,att:0},offsides:0,yellow:0,red:0}
};

function addEvent(team,type){

  // =========================
  // EVENTS WITH NO INPUT (BOTH TEAMS)
  // =========================
  if(
  type === "Offside" ||
  type === "Corner"
){
  logEvent(team, type, "");
  return;
}

if(type.includes("Free Kick")){
  selectFreeKickZone(team);
  return;
}

  // =========================
  // OPPONENT EVENTS
  // =========================
  if(team === "opp"){

    // SHOTS → NO INPUT
    if(type === "Shot On Target" || type === "Shot Off Target"){
      logEvent("opp", type, "");
      return;
    }

    // GOAL → SIMPLE QUICK POPUP
    if(type === "Goal"){

      openPopup();

      mainBox.innerHTML = `
        <h3 style="
          text-align:center;
          margin-bottom:20px;
          font-size:28px;
        ">
          Opponent Goal
        </h3>
      `;

      // ⚽ CONFIRM GOAL
      let goalBtn = btn("⚽ Confirm Goal");

      goalBtn.style.background = "#dcfce7";
      goalBtn.style.fontWeight = "bold";

      goalBtn.onclick = ()=>{

        logEvent("opp", "Goal", "");

        closePopup();
      };

      // ⚠️ OWN GOAL
      let ownGoalBtn = btn("⚠️ Own Goal");

      ownGoalBtn.style.background = "#fee2e2";
      ownGoalBtn.style.fontWeight = "bold";

      ownGoalBtn.onclick = ()=>{

        logEvent("opp", "Own Goal", "");

        closePopup();
      };

      // ❌ CANCEL
      let cancelBtn = btn("Cancel");

      cancelBtn.onclick = ()=> closePopup();

      mainBox.appendChild(goalBtn);
      mainBox.appendChild(ownGoalBtn);
      mainBox.appendChild(cancelBtn);

      return;
    }

    // =========================
    // CARDS → NUMBER INPUT
    // =========================

    openPopup();

    mainBox.innerHTML = `<h3>${type} - Opponent</h3>`;

    let currentNumber = "";

    let numberDisplay = document.createElement("div");

    numberDisplay.style.fontSize = "32px";
    numberDisplay.style.fontWeight = "bold";
    numberDisplay.style.textAlign = "center";
    numberDisplay.style.margin = "15px";

    mainBox.appendChild(numberDisplay);

    let keypad = document.createElement("div");

    keypad.style.display = "grid";
    keypad.style.gridTemplateColumns = "repeat(3, 70px)";
    keypad.style.justifyContent = "center";
    keypad.style.gap = "10px";
    keypad.style.margin = "20px 0";

    for(let i = 1; i <= 9; i++){

      let b = document.createElement("button");

      b.innerText = i;

      b.style.height = "60px";
      b.style.fontSize = "24px";

      b.onclick = ()=>{

        if(currentNumber.length >= 2) return;

        currentNumber += i;

        numberDisplay.innerText = currentNumber;
      };

      keypad.appendChild(b);
    }

    let zero = document.createElement("button");

    zero.innerText = "0";

    zero.style.height = "60px";
    zero.style.fontSize = "24px";

    zero.onclick = ()=>{

      if(currentNumber.length >= 2) return;

      currentNumber += "0";

      numberDisplay.innerText = currentNumber;
    };

    keypad.appendChild(document.createElement("div"));
    keypad.appendChild(zero);
    keypad.appendChild(document.createElement("div"));

    mainBox.appendChild(keypad);

    // BUTTON ROW
let btnRow = document.createElement("div");

btnRow.style.display = "flex";
btnRow.style.justifyContent = "center";
btnRow.style.gap = "10px";
btnRow.style.marginTop = "20px";

// DELETE
let del = document.createElement("button");

del.innerText = "⌫";

del.onclick = ()=>{

  currentNumber =
    currentNumber.slice(0,-1);

  numberDisplay.innerText =
    currentNumber;
};

// CONFIRM
let confirm = document.createElement("button");

confirm.innerText = "Confirm";

confirm.onclick = ()=>{

  if(currentNumber === ""){
    alert("Select a number");
    return;
  }

  logEvent("opp", type, "#" + currentNumber);

  closePopup();
};

// CANCEL
let cancel = document.createElement("button");

cancel.innerText = "Cancel";

cancel.onclick = ()=> closePopup();

btnRow.appendChild(del);
btnRow.appendChild(confirm);
btnRow.appendChild(cancel);

mainBox.appendChild(btnRow);

    return;
  }

  // =========================
  // BERWICK (PLAYER SELECTION)
  // =========================
  openPopup();

  mainBox.innerHTML = `<h3>Select Player (${type})</h3>`;

  if(type === "Goal"){

  let og = btn("⚠️ Own Goal");

  og.style.background = "#fee2e2";
  og.style.fontWeight = "bold";

  og.onclick = () => {
    selectOwnGoalAssist(team);
  };

  mainBox.appendChild(og);
}

activePlayers.forEach(p=>{
  if(!p.id) return;
  let d = btn(p.name);

  d.onclick = () => {
    if(type === "Goal"){
      selectAssist(team, p);
    } else {
      logEvent(team, type, p.name);
      closePopup();
    }
  };

  mainBox.appendChild(d); // ✅ DIRECTLY ADD BUTTONS

});
let cancel = document.createElement("button");
cancel.innerText = "Cancel";
cancel.style.marginTop = "10px";

cancel.onclick = () => closePopup();

mainBox.appendChild(cancel);

}

function selectFreeKickZone(team){

  openPopup();
  mainBox.innerHTML = "<h3>Select Free Kick Area</h3>";

  ["Defensive Third","Middle Third","Attacking Third"].forEach(zone => {

    let d = btn(zone);

    d.onclick = () => {
      logEvent(team, "Free Kick (" + zone + ")", "");
      closePopup();
    };

    mainBox.appendChild(d);
  });

  let cancel = document.createElement("button");
cancel.innerText = "Cancel";

cancel.onclick = () => closePopup();

mainBox.appendChild(cancel);
}

function selectAssist(team, scorer){

  mainBox.innerHTML = `<h3>Select Assist (optional)</h3>`;

  let none = btn("No Assist");

none.onclick = () => {
  logEvent(team, "Goal", scorer.name, null);
  closePopup();
};
  mainBox.appendChild(none);

  activePlayers.forEach(p=>{

  if(!p.id || !p.name) return;

  // ⭐ GOAL SCORER (highlighted, not clickable)
  if(p.id === scorer.id){

    let d = btn("⚽ " + p.name + " (Scorer)");
    d.style.background = "#d1fae5";   // light green
    d.style.fontWeight = "bold";
    d.style.cursor = "default";
    d.style.opacity = "0.8";

    mainBox.appendChild(d);
    return;
  }

  // ✅ NORMAL PLAYERS (clickable)
  let d = btn(p.name);

  d.onclick = () => {
    logEvent(team, "Goal", scorer.name, p.name);
    closePopup();
  };

  mainBox.appendChild(d);
});
let back = btn("⬅ Back");
back.style.background = "#eee";
back.style.marginTop = "10px";

back.onclick = () => {
  addEvent(team, "Goal");
};

mainBox.appendChild(back);
}

function selectOwnGoalAssist(team){

  mainBox.innerHTML = `<h3>Own Goal - Assist (optional)</h3>`;

  let none = btn("No Assist");
  none.onclick = () => {
    logEvent(team, "Own Goal", "", null);
    closePopup();
  };
  mainBox.appendChild(none);

  activePlayers.forEach(p=>{
    let d = btn(p.name);

    d.onclick = () => {
      logEvent(team, "Own Goal", "", p.name);
      closePopup();
    };

    mainBox.appendChild(d);
  });

  let back = btn("⬅ Back");
  back.onclick = () => addEvent(team, "Goal");
  mainBox.appendChild(back);
}

function addPenalty(team){

  // =========================
  // OPPONENT PENALTY
  // =========================
  if(team === "opp"){

    openPopup();

    mainBox.innerHTML = `
      <h3>Opponent Penalty</h3>
    `;

    let scored = btn("⚽ Penalty Scored");

    scored.onclick = ()=>{

      logEvent("opp", "Penalty Scored", "");

      closePopup();
    };

    let missed = btn("❌ Penalty Missed");

    missed.onclick = ()=>{

      logEvent("opp", "Penalty Missed", "");

      closePopup();
    };

    let saved = btn("🧤 Penalty Saved");

    saved.onclick = ()=>{

      logEvent("opp", "Penalty Saved", "");

      closePopup();
    };

    mainBox.appendChild(scored);
    mainBox.appendChild(missed);
    mainBox.appendChild(saved);

    return;
  }

  // =========================
  // BERWICK PENALTY
  // =========================

  openPopup();

mainBox.innerHTML = `
  <h3>Who Won The Penalty?</h3>
`;

activePlayers.forEach(p=>{

  if(!p.id) return;

  let d = btn(p.name);

  d.onclick = ()=>{

    selectPenaltyTaker(team, p.name);
  };

  mainBox.appendChild(d);
});
let cancel = btn("Cancel");

cancel.onclick = ()=> closePopup();

mainBox.appendChild(cancel);
}

function selectPenaltyTaker(team, wonBy){

  openPopup();

  mainBox.innerHTML = `
    <h3>Select Penalty Taker</h3>

    <div style="
      text-align:center;
      margin-bottom:15px;
      font-size:14px;
      color:#666;
    ">
      Won By: ${wonBy}
    </div>
  `;

  activePlayers.forEach(p=>{

    if(!p.id) return;

    let d = btn(p.name);

    d.onclick = ()=>{

      selectPenaltyOutcome(
        team,
        p.name,
        wonBy
      );
    };

    mainBox.appendChild(d);
  });
  let back = btn("⬅ Back");

back.onclick = ()=>{
  addPenalty(team);
};

mainBox.appendChild(back);

let cancel = btn("Cancel");

cancel.onclick = ()=> closePopup();

mainBox.appendChild(cancel);
}

function selectPenaltyOutcome(team, taker, wonBy){

  openPopup();

  mainBox.innerHTML = `
    <h3>Penalty Result</h3>
    <div style="
      text-align:center;
      margin-bottom:15px;
      font-weight:bold;
    ">
      ${taker}
    </div>
  `;

  let scored = btn("⚽ Penalty Scored");

  scored.onclick = ()=>{

  logEvent(
  team,
  "Penalty Scored",
  taker,
  wonBy
);

  closePopup();
};

  let missed = btn("❌ Penalty Missed");

  missed.onclick = ()=>{

  logEvent(
    team,
    "Penalty Missed",
    taker,
    wonBy
  );

  closePopup();
};

  let saved = btn("🧤 Penalty Saved");

  saved.onclick = ()=>{

  // PENALTY SAVED
  logEvent(
    team,
    "Penalty Saved",
    taker,
    wonBy
  );

  closePopup();
};

  mainBox.appendChild(scored);
mainBox.appendChild(missed);
mainBox.appendChild(saved);

let back = btn("⬅ Back");

back.onclick = ()=>{
  selectPenaltyTaker(team, wonBy);
};

mainBox.appendChild(back);

let cancel = btn("Cancel");

cancel.onclick = ()=> closePopup();

mainBox.appendChild(cancel);
}


function logEvent(team,type,player,assist=null){

  let s = team==="berwick" ? stats.berwick : stats.opp;

// ===== UPDATE STATS =====
if(
  type === "Goal" ||
  type === "Penalty Scored"
){

  s.goals++;

  // ✅ counts as shot on target
  s.on++;
}

// 🚫 OWN GOALS DO NOT COUNT AS SHOT ON TARGET
if(type === "Own Goal"){

  if(team === "berwick"){
    stats.berwick.goals++;
  } else {
    stats.opp.goals++;
  }
}

  if(
  type === "Shot On Target" ||
  type === "Penalty Saved"
){
  s.on++;
}

if(
  type === "Shot Off Target" ||
  type === "Penalty Missed"
){
  s.off++;
}
  if(type==="Corner") s.corners++;
  if(type.includes("Free Kick")){
  if(type.includes("Defensive")) s.freeKicks.def++;
  else if(type.includes("Middle")) s.freeKicks.mid++;
  else if(type.includes("Attacking")) s.freeKicks.att++;
}
  if(type==="Offside") s.offsides++;
  if(type === "Yellow Card"){
    // ✅ FIX OPPONENT YELLOW
if(team === "opp"){
  stats.opp.yellow++;
}

if(player){
  opponentYellowCards[
    player.replace("#","")
  ] = true;
}

renderPitch();

  let foundPlayer = activePlayers.find(p => p.name === player);

  if(foundPlayer){

    // count yellows
    foundPlayer.yellowCount = (foundPlayer.yellowCount || 0) + 1;

    // 🟡 FIRST YELLOW → COUNT YELLOW
if(foundPlayer.yellowCount === 1){
  if(team === "berwick"){
    stats.berwick.yellow++;
  } else {
    stats.opp.yellow++;
  }
}

    // first yellow → show icon
    if(foundPlayer.yellowCount === 1){
      foundPlayer.yellow = true;
    }

    // second yellow → REMOVE PLAYER
    if(foundPlayer.yellowCount >= 2){
      // 🔴 SECOND YELLOW → COUNT RED ONLY
if(foundPlayer.yellowCount === 2){
  if(team === "berwick"){
    stats.berwick.red++;
  } else {
    stats.opp.red++;
  }
}

  // ✅ KEEP yellow AND add red
  foundPlayer.yellow = true;
  foundPlayer.red = true;
  foundPlayer.doubleYellow = true;

  // remove from pitch
 let index = activePlayers.findIndex(p => p.name === player);

if(index !== -1){
  activePlayers[index] = {
    id: "",
    name: "",
    position: foundPlayer.position
  };
}

  // 🔽 send to bench
  lineup.bench.push(foundPlayer);

  // 🚫 IMPORTANT: mark as used → THIS FIXES COLOUR
  usedPlayers.push(String(foundPlayer.id).trim());

}

    renderPitch();
  }

}
  if(type === "Red Card"){

  s.red++;

  let index = activePlayers.findIndex(p => p.name === player);

  if(index !== -1){

    let foundPlayer = activePlayers[index];

    // 🔴 mark red
    foundPlayer.red = true;
    foundPlayer.yellow = false;

    // 🔽 move to bench
    lineup.bench.push(foundPlayer);

    // 🚫 mark used
    usedPlayers.push(String(foundPlayer.id).trim());

    // ❗ KEEP FORMATION → replace with empty player
    activePlayers[index] = {
      id: "",
      name: "",
      position: foundPlayer.position
    };

    renderPitch();
  }
}

  // ===== TIME =====
  let time = document.getElementById("clock").innerText;
  // COMPACT STOPPAGE TIME FOR TIMELINE
if(time.includes("45:00 +")){

  time = time
    .replace("45:00 +", "45+");
}

if(time.includes("90:00 +")){

  time = time
    .replace("90:00 +", "90+");
}

  // ===== FORMAT TEXT =====

  let eventText = (type === "Sub" || type === "Own Goal") ? "" : "(" + type + ")";

// 🔥 FIX DOUBLE YELLOW TEXT (TIMELINE)
if(type === "Yellow Card"){

  let foundPlayer =
    activePlayers.find(p => p.name === player) ||
    lineup.bench.find(p => p.name === player);

  if(foundPlayer && foundPlayer.doubleYellow){
    eventText = "(2nd Yellow / Red Card)";
  }
}
  let nameText = player ? player : "";

const icons = {
  "Goal": "⚽",

  "Penalty Scored": "⚽",
  "Penalty Missed": "❌",
  "Penalty Saved": "🧤",

  "Shot On Target": "🎯",
  "Shot Off Target": "⭕",

  "Yellow Card": "🟨",
  "Red Card": "🟥",

  "Corner": "🚩",
  "Free Kick": "🦶",
  "Offside": "🚫",

  "Sub": "🔄",

  "Own Goal": `
    <span style="font-size:11px; vertical-align:middle;">⚽</span>
    <span style="vertical-align:middle;">⚠️</span>
  `,
};

let iconEmoji = icons[type] || (type.includes("Free Kick") ? "🦶" : "");

// 🔥 ADD THIS BLOCK RIGHT UNDER IT
if(type === "Yellow Card"){

  // find player (CHECK BOTH active + bench)
  let foundPlayer =
    activePlayers.find(p => p.name === player) ||
    lineup.bench.find(p => p.name === player);

  if(foundPlayer && foundPlayer.doubleYellow){
    iconEmoji = `
<span style="position:relative; display:inline-block; width:16px; height:14px;">

  <span style="
    position:absolute;
    top:-2px;
    left:6px;
    font-size:10px;
    z-index:2;
  ">🟥</span>

  <span style="
    position:absolute;
    top:2px;
    left:0px;
    font-size:10px;
    z-index:1;
  ">🟨</span>

</span>
`;
  }
}

// keep your existing layout + ADD emoji
// build name + assist
let namePart = player ? player : "";

// 🎯 PENALTY WON BY
if(
  (
    type === "Penalty Scored" ||
    type === "Penalty Missed" ||
    type === "Penalty Saved"
  )
  && assist
){
  namePart += `
    <span style="
      font-size:12px;
      color:#666;
    ">
      (Won by: ${assist})
    </span>
  `;
}


// ✅ NORMAL GOAL
if(type === "Goal" && assist){
  namePart += " (Assist: " + assist + ")";
}

// ✅ OWN GOAL (FIXED POSITION)
  if(type === "Own Goal"){
  if(assist){
    namePart = `Own Goal (Forced by ${assist})`;
  } else {
    namePart = "Own Goal";
  }
}

if(type === "Sub"){
  let parts = namePart.includes("⟶")
  ? namePart.split("⟶")
  : namePart.split("→");

  if(parts.length === 2){
    let off = parts[0]
      .replace("(OFF:", "")
      .replace(")", "")
      .trim();

    let on = parts[1]
      .replace("(ON:", "")
      .replace(")", "")
      .trim();

    namePart = `
      <span style="font-weight:bold;">(Sub)</span>
      <span style="color:#d9534f;">(OFF: ${off})</span>
      <span style="margin:0 6px;">→</span>
      <span style="color:#28a745; font-weight:bold;">(ON: ${on})</span>
    `;
  }
}

// LEFT (Berwick format)
let leftLine = namePart + "  " + eventText;

// RIGHT (Opponent format)
let rightLine = eventText + "  " + namePart;
let style = "";

if(type === "Goal"){
  style = "font-weight:bold; color:green;";
}

if(type === "Own Goal"){
  style = "font-weight:bold; color:red;";
}

// ===== PLAYER STATS TRACKING (MATCH ONLY) =====

if(player){
  if(!matchStats[player]){
  matchStats[player] = {
    goals: 0,
    assists: 0,
    shotsOn: 0,     // ✅ ADD
    shotsOff: 0,    // ✅ ADD
    yellow: 0,
    red: 0
  };
}

  if(type === "Goal"){
  matchStats[player].goals++;
  matchStats[player].shotsOn++;
}

if(type === "Penalty Scored"){
  matchStats[player].goals++;
  matchStats[player].shotsOn++;
}

  if(type === "Yellow Card"){

  let foundPlayer =
    activePlayers.find(p => p.name === player) ||
    lineup.bench.find(p => p.name === player);

  // 🟨 FIRST YELLOW
  if(!foundPlayer || !foundPlayer.doubleYellow){

    matchStats[player].yellow++;
  }

  // 🟥 SECOND YELLOW
  else{

    matchStats[player].red++;
  }
}

if(type === "Red Card"){
  matchStats[player].red++;
}

  if(type === "Shot On Target"){
  matchStats[player].shotsOn++;
}

if(type === "Shot Off Target"){
  matchStats[player].shotsOff++;
}
}

// assist tracking
if(type === "Goal" && assist){
  if(!matchStats[assist]){
    matchStats[assist] = {
      goals: 0,
      assists: 0,
      yellow: 0,
      red: 0
    };
  }

  matchStats[assist].assists++;
}

// ===== TIMELINE =====
let timeline = document.getElementById("timeline");
if(!timeline) return;

let div = document.createElement("div");

if(type === "Yellow Card"){

  let foundPlayer = activePlayers.find(p => p.name === player);

  if(foundPlayer){
    foundPlayer.yellow = true;
    renderPitch();
  }

}

div.className = "timeline-row";

// LEFT (Berwick)
if(team === "berwick"){
  div.style.justifyContent = "flex-start";

  div.innerHTML = `
  <div class="side left">
    <div class="event" style="${style}">
  ${namePart} ${eventText}
  <span class="icon">${iconEmoji}</span>
</div>
  </div>

  <div class="middle">
    <div class="time-pill">${time}</div>
  </div>

  <div class="side right"></div>
`;
}

// RIGHT (Opponent)
else{
  div.innerHTML = `
  <div class="side left"></div>

  <div class="middle">
    <div class="time-pill">${time}</div>
  </div>

  <div class="side right">
    <div class="event" style="${style}">
  <span class="icon">${iconEmoji}</span>
${eventText} ${namePart}
</div>
  </div>
`;
}

timeline.prepend(div);
div.onclick = () => {
  let index = eventHistory.findIndex(e => e.element === div);
  openEditMenu(index);
};
eventHistory.push({
  team,
  type,
  player,
  assist,
  time,
  element: div
});
updateDisplay();


if(type === "Goal" && team === "berwick"){
  setTimeout(() => {
    flashScore();
  }, 100);
}

highlightStat(team, type);
}

function addHalfTimeSeparator(){

  let timeline = document.getElementById("timeline");

  let div = document.createElement("div");

  div.style.display = "flex";
  div.style.justifyContent = "center";
  div.style.alignItems = "center";
  div.style.margin = "12px 0";
  div.style.fontWeight = "bold";
  div.style.color = "#666";

  div.innerHTML = `
  <div style="
    flex:1;
    height:0;
    background: repeating-linear-gradient(
      to right,
      #9ca3af 0px,
      #9ca3af 12px,
      transparent 12px,
      transparent 24px
    );
    background-size: 100% 1px;
    background-repeat: no-repeat;
    background-position: center;
  "></div>

  <div class="time-pill">HALF TIME</div>

  <div style="
    flex:1;
    height:0;
    background: repeating-linear-gradient(
      to right,
      #9ca3af 0px,
      #9ca3af 12px,
      transparent 12px,
      transparent 24px
    );
    background-size: 100% 1px;
    background-repeat: no-repeat;
    background-position: center;
  "></div>
`;

  timeline.prepend(div);
  div.onclick = () => {
  openEditMenu(div);
};

div.dataset.index = eventHistory.length;
}

function addFullTimeSeparator(){

  let timeline = document.getElementById("timeline");

  let div = document.createElement("div");

  div.style.display = "flex";
  div.style.justifyContent = "center";
  div.style.alignItems = "center";
  div.style.margin = "12px 0";
  div.style.fontWeight = "bold";
  div.style.color = "#333";

  div.innerHTML = `
  <div style="
    flex:1;
    height:0;
    background: repeating-linear-gradient(
      to right,
      #9ca3af 0px,
      #9ca3af 12px,
      transparent 12px,
      transparent 24px
    );
    background-size: 100% 1px;
    background-repeat: no-repeat;
    background-position: center;
  "></div>

  <div class="time-pill">FULL TIME</div>

  <div style="
    flex:1;
    height:0;
    background: repeating-linear-gradient(
      to right,
      #9ca3af 0px,
      #9ca3af 12px,
      transparent 12px,
      transparent 24px
    );
    background-size: 100% 1px;
    background-repeat: no-repeat;
    background-position: center;
  "></div>
`;

  timeline.prepend(div);
}

// ============================
// MATCH DISPLAY
// ============================

function updateDisplay(){

  let bStats = document.getElementById("b_stats");
  let oStats = document.getElementById("o_stats");
  let score = document.getElementById("scoreMain");

  // 🚨 prevents crash
  if(!bStats || !oStats || !score){
    console.warn("Display elements missing");
    return;
  }

  // ✅ BERWICK
  bStats.innerHTML = `
    <div class="stat-block" id="b_shots">
      <div class="stat-title">Shots</div>
      <div class="stat-row"><span>On Target</span><span>${stats.berwick.on}</span></div>
      <div class="stat-row"><span>Off Target</span><span>${stats.berwick.off}</span></div>
    </div>

    <div class="stat-block" id="b_corners">
      <div class="stat-title">Corners</div>
      <div class="stat-row"><span>Total</span><span>${stats.berwick.corners}</span></div>
    </div>

    <div class="stat-block" id="b_freekicks">
  <div class="stat-title">Free Kicks</div>

  <div class="stat-row">
    <span>Def</span>
    <span>${stats.berwick.freeKicks.def}</span>
  </div>

  <div class="stat-row">
    <span>Mid</span>
    <span>${stats.berwick.freeKicks.mid}</span>
  </div>

  <div class="stat-row">
    <span>Att</span>
    <span>${stats.berwick.freeKicks.att}</span>
  </div>
</div>

    <div class="stat-block" id="b_offsides">
      <div class="stat-title">Offsides</div>
      <div class="stat-row">
        <span>Total</span>
        <span>${stats.berwick.offsides}</span>
      </div>
    </div>

    <div class="stat-block" id="b_cards">
      <div class="stat-title">Cards</div> 
      <div class="stat-row"><span>Yellow</span><span>${stats.berwick.yellow}</span></div>
      <div class="stat-row"><span>Red</span><span>${stats.berwick.red}</span></div>
    </div>
  `;

  // ✅ OPPONENT
  oStats.innerHTML = `
    <div class="stat-block">
      <div class="stat-title">Shots</div>
      <div class="stat-row"><span>On Target</span><span>${stats.opp.on}</span></div>
      <div class="stat-row"><span>Off Target</span><span>${stats.opp.off}</span></div>
    </div>

    <div class="stat-block">
      <div class="stat-title">Corners</div>
      <div class="stat-row"><span>Total</span><span>${stats.opp.corners}</span></div>
    </div>

    <div class="stat-block">
  <div class="stat-title">Free Kicks</div>

  <div class="stat-row">
    <span>Def</span>
    <span>${stats.opp.freeKicks.def}</span>
  </div>

  <div class="stat-row">
    <span>Mid</span>
    <span>${stats.opp.freeKicks.mid}</span>
  </div>

  <div class="stat-row">
    <span>Att</span>
    <span>${stats.opp.freeKicks.att}</span>
  </div>
</div>

    <div class="stat-block">
      <div class="stat-title">Offsides</div>
      <div class="stat-row">
        <span>Total</span>
        <span>${stats.opp.offsides}</span>
      </div>
    </div>

    <div class="stat-block">
      <div class="stat-title">Cards</div>
      <div class="stat-row"><span>Yellow</span><span>${stats.opp.yellow}</span></div>
      <div class="stat-row"><span>Red</span><span>${stats.opp.red}</span></div>
    </div>
  `;

  // ✅ SCORE
  score.innerHTML =
  `<span id="b_score">${stats.berwick.goals}</span> - ${stats.opp.goals}`;
}

// ============================
// CLOCK
// ============================
let kickOffTime = "";
let interval = null;

let matchSeconds = 0;   // main clock
let halfSeconds = 0;    // second half clock
let currentHalf = 1;
let playerStats = {};
let playerMinutes = {};
let matchStats = {};
let seasonStats = {};
let matchLog = JSON.parse(localStorage.getItem("matchLog")) || [];

// ▶️ START MATCH
function startMatch(){
  clearInterval(interval);
  playerMinutes = {};
  matchStats = {};
  usedPlayers = [];

  kickOffTime = new Date().toLocaleTimeString();  // 👈 ADD THIS LINE

  let startTime = 0;

activePlayers.forEach(p=>{
  playerMinutes[p.name] = {
    start: startTime,
    total: 0
  };
});

  document.getElementById("kickOffDisplay").innerText = "Kick Off: " + kickOffTime;

  matchSeconds = 0;
  halfSeconds = 0;
  currentHalf = 1;

  interval = setInterval(updateClock, 1000);
  document.getElementById("clock").style.color = "#16a34a";
  document.getElementById("clock2").style.color = "black";
}

function refreshClockDisplay(){

  let m1 = Math.floor(matchSeconds / 60);
  let s1 = matchSeconds % 60;

  let m2 = Math.floor(halfSeconds / 60);
  let s2 = halfSeconds % 60;

  let clock1 = document.getElementById("clock");
  let clock2 = document.getElementById("clock2");

  if(clock1){

  // FIRST HALF STOPPAGE TIME
  if(currentHalf === 1 && matchSeconds >= 45 * 60){

    let injury =
      matchSeconds - (45 * 60);

    let im = Math.floor(injury / 60);
    let is = injury % 60;

    clock1.innerHTML =
  `45:00 <span style="color:red;">+ ${im}:${String(is).padStart(2,"0")}</span>`;
  }

  // SECOND HALF STOPPAGE TIME
  else if(currentHalf === 2 && matchSeconds >= 90 * 60){

    let injury =
      matchSeconds - (90 * 60);

    let im = Math.floor(injury / 60);
    let is = injury % 60;

    clock1.innerHTML =
  `90:00 <span style="color:red;">+ ${im}:${String(is).padStart(2,"0")}</span>`;
  }

  // NORMAL CLOCK
  else{

    clock1.innerText =
      `${String(m1).padStart(2,"0")}:${String(s1).padStart(2,"0")}`;
  }
}

  if(clock2){
    clock2.innerText =
      `${String(m2).padStart(2,"0")}:${String(s2).padStart(2,"0")}`;
  }
}

// ⏱ UPDATE CLOCK (THIS WAS BROKEN BEFORE)
function updateClock(){

  // main clock always runs
  matchSeconds++;

  // second clock only runs in 2nd half
  if(currentHalf === 2){
    halfSeconds++;
  }

  refreshClockDisplay();
}

// ⏸ END FIRST HALF
function endFirstHalf(){
  clearInterval(interval);
  addHalfTimeSeparator();   // 👈 THIS LINE
  showHalfTimeScreen();
}

// ▶️ START SECOND HALF
function startSecondHalf(){
  clearInterval(interval);

  currentHalf = 2;

  matchSeconds = 45 * 60;
  halfSeconds = 0;        // reset second clock

  interval = setInterval(updateClock, 1000);
  document.getElementById("clock").style.color = "black";
  document.getElementById("clock2").style.color = "#16a34a";
}

// ⏹ END MATCH
function endMatch(){
  clearInterval(interval);
  addFullTimeSeparator();   // 👈 ADD THIS LINE
  // ✅ ADD FINAL MINUTES FOR PLAYERS STILL ON FIELD
activePlayers.forEach(p => {
  if(playerMinutes[p.name] && playerMinutes[p.name].start !== null){
    playerMinutes[p.name].total += matchSeconds - playerMinutes[p.name].start;

    // 🔒 prevent double counting
    playerMinutes[p.name].start = null;
  }
});
}

// ============================
// MATCH SUMMARY SCREENS
// ============================

function showHalfTimeScreen(){

  openPopup();

let poss = getPossession();
let insight = getMatchInsight();

  mainBox.innerHTML = `

    <!-- STANDARD HEADER -->

<div style="
  text-align:center;
  margin-bottom:25px;
">

  <div style="
    font-size:30px;
    font-weight:700;
    margin-bottom:18px;
    letter-spacing:1px;
  ">
    HALF TIME
  </div>

  <div style="
    font-size:24px;
    font-weight:600;
    margin-bottom:10px;
  ">
    Berwick vs ${selectedOpponent}
  </div>

  <div style="
    font-size:46px;
    font-weight:700;
    margin-bottom:14px;
  ">
    ${stats.berwick.goals} - ${stats.opp.goals}
  </div>

  <div style="
    font-size:15px;
    color:#666;
    line-height:1.5;
  ">
    <div>
      Venue - ${window.matchVenue || "Unknown"}
    </div>

    <div>
      Date - ${matchDate}
    </div>
  </div>

</div>

<!-- POSSESSION -->
<div style="margin:20px 0;">

  <div style="text-align:center; font-size:14px; margin-bottom:6px; font-weight:bold;">
    Possession
  </div>

  <div style="display:flex; height:16px; background:#eee; border-radius:6px; overflow:hidden;">
<div style="
  width:100%;
  height:100%;
  background:${
  poss.berwick >= poss.opp
    ? "linear-gradient(to right, #02087b, #efeff9)"   // Berwick bigger → dark on left
    : "linear-gradient(to right, #efeff9, #02087b)"   // Opp bigger → dark on right
};
"></div>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:center;">

  <!-- BERWICK -->
  <span style="
    font-size:${poss.berwick > poss.opp ? "18px" : "14px"};
    font-weight:bold;
  ">
    ${poss.berwick}%
  </span>

  <!-- OPPONENT -->
  <span style="
    font-size:${poss.opp > poss.berwick ? "18px" : "14px"};
    font-weight:bold;
  ">
    ${poss.opp}%
  </span>

</div>

</div>

<!-- STATS -->
<div>

      ${statBar("Shots On Target", stats.berwick.on, stats.opp.on)}
      ${statBar("Shots Off Target", stats.berwick.off, stats.opp.off)}
      ${statBar("Corners", stats.berwick.corners, stats.opp.corners)}
      ${statBar("Free Kicks (Def)", stats.berwick.freeKicks.def, stats.opp.freeKicks.def)}
      ${statBar("Free Kicks (Mid)", stats.berwick.freeKicks.mid, stats.opp.freeKicks.mid)}
      ${statBar("Free Kicks (Att)", stats.berwick.freeKicks.att, stats.opp.freeKicks.att)}
      ${statBar("Offsides", stats.berwick.offsides, stats.opp.offsides)}
<!-- CARDS -->
<div style="margin-top:10px;">

  <div style="text-align:center; font-size:13px; margin-bottom:6px;">
    Cards
  </div>

  <div style="
    display:flex;
    justify-content:space-between;
    align-items:center;
    font-size:14px;
  ">

    <!-- BERWICK -->
    <div style="display:flex; align-items:center; gap:6px;">
      <span style="font-weight:bold;">${stats.berwick.yellow}</span>
      <span>🟨</span>
      <span style="font-weight:bold;">${stats.berwick.red}</span>
      <span>🟥</span>
    </div>

    <!-- OPPONENT -->
    <div style="display:flex; align-items:center; gap:6px;">
      <span>🟨</span>
      <span style="font-weight:bold;">${stats.opp.yellow}</span>
      <span>🟥</span>
      <span style="font-weight:bold;">${stats.opp.red}</span>
    </div>

  </div>

</div>

</div>


  `;

  let btn = document.createElement("button");
  btn.innerText = "CLOSE";
  btn.style.marginTop = "15px";

  btn.onclick = ()=>{
    closePopup();
  };

  mainBox.appendChild(btn);
}

function standardReportHeader(title){

  let result = "DRAW";

  if(stats.berwick.goals > stats.opp.goals){
    result = "WIN";
  }

  if(stats.berwick.goals < stats.opp.goals){
    result = "LOSS";
  }

  return `

    <div style="
      text-align:center;
      margin-bottom:8px;
    ">

      <div style="
  font-size:18px;
  font-weight:700;
  margin-bottom:2px;
  letter-spacing:1px;
  text-decoration: underline;
">
  ${title}
</div>

      <div style="
  font-size:22px;
  font-weight:700;
  margin-bottom:1px;
">
  ${
    window.matchVenue === "Home"
      ? `Berwick City vs ${selectedOpponent}`
      : `${selectedOpponent} vs Berwick City`
  }
</div>

<div style="
  font-size:30px;
  font-weight:700;
  margin-bottom:4px;
">
  ${
    window.matchVenue === "Home"
      ? `${stats.berwick.goals} - ${stats.opp.goals}`
      : `${stats.opp.goals} - ${stats.berwick.goals}`
  }
</div>

      <div style="
        font-size:18px;
        font-weight:bold;
        margin-bottom:2.5px;
        color:
          ${result === "WIN"
            ? "#15803d"
            : result === "LOSS"
              ? "#b91c1c"
              : "#555"};
      ">
        ${result}
      </div>

      <div style="
        font-size:11px;
        color:#666;
        line-height:1.3;
      ">
        <div>
          ${document.getElementById("venue").innerText}
        </div>

        <div>
          ${document.getElementById("matchDate").innerText}
        </div>
      </div>

    </div>

  `;
}

function statBar(label, b, o){


  let total = b + o;

  let bPercent = total === 0 ? 0 : (b / total) * 100;
  let oPercent = total === 0 ? 0 : (o / total) * 100;

  return `
    <div style="margin-bottom:18px;">

      <!-- NUMBERS -->
      <div style="
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:4px;
">

  <!-- BERWICK -->
  <span style="
    font-weight:bold;
    font-size:${b > o ? "18px" : "13px"};
  ">
    ${b}
  </span>

  <!-- LABEL -->
  <span style="color:#555; font-size:13px;">
    ${label}
  </span>

  <!-- OPPONENT -->
  <span style="
    font-weight:bold;
    font-size:${o > b ? "18px" : "13px"};
  ">
    ${o}
  </span>

</div>

      <!-- BAR -->
      <div style="
        display:flex;
        height:12px;
        background:#eee;
        border-radius:6px;
        overflow:hidden;
      ">

        ${
  total === 0
? `<div style="width:100%; background:#eee;"></div>`

  : `
    <div style="
  width:100%;
  height:100%;
  background:${
  total === 0
    ? "#eee"
    : b === o
      ? "#fde047"
      : b > o
        ? "linear-gradient(to right, #7a0000, #f5f5f5)"   // Berwick bigger → dark left
        : "linear-gradient(to right, #f5f5f5, #7a0000)"   // Opp bigger → dark right
};
"></div>
  `
}

      </div>

    </div>
  `;
}

// ============================
// MATCH ANALYSIS
// ============================

function getPossession(){

  let bActions =
  stats.berwick.on +
  stats.berwick.off +
  stats.berwick.corners +
  stats.berwick.freeKicks.def +
  stats.berwick.freeKicks.mid +
  stats.berwick.freeKicks.att;

let oActions =
  stats.opp.on +
  stats.opp.off +
  stats.opp.corners +
  stats.opp.freeKicks.def +
  stats.opp.freeKicks.mid +
  stats.opp.freeKicks.att;

  let total = bActions + oActions;

  if(total === 0){
    return {berwick:50, opp:50};
  }

  return {
    berwick: Math.round((bActions / total) * 100),
    opp: Math.round((oActions / total) * 100)
  };
}


function getMatchInsight(){

  let bScore = 0;
  let oScore = 0;

  bScore += stats.berwick.on * 3;
  oScore += stats.opp.on * 3;

  bScore += stats.berwick.off * 1;
  oScore += stats.opp.off * 1;

  bScore += stats.berwick.corners * 2;
  oScore += stats.opp.corners * 2;

  bScore += (
  stats.berwick.freeKicks.def +
  stats.berwick.freeKicks.mid +
  stats.berwick.freeKicks.att
);

oScore += (
  stats.opp.freeKicks.def +
  stats.opp.freeKicks.mid +
  stats.opp.freeKicks.att
);

  if(bScore > oScore + 5) return "Berwick dominating";
  if(oScore > bScore + 5) return "Opponent dominating";

  if(stats.berwick.goals > stats.opp.goals)
    return "Berwick more clinical";

  if(stats.opp.goals > stats.berwick.goals)
    return "Opponent more clinical";

  return "Even contest";
}


function getTimelineSummary(){

let goals = stats.berwick.goals;

let cards =
  stats.berwick.yellow + stats.berwick.red;

let shots =
  stats.berwick.on + stats.berwick.off;

  return `
    <div style="margin-top:15px; font-size:13px; color:#555;">
      <div>⚽ Goals: ${goals}</div>
      <div>🎯 Total Shots: ${shots}</div>
      <div>🟨🟥 Cards: ${cards}</div>
    </div>
  `;
}

// ============================
// APP INITIALIZATION
// ============================


// ============================
// SUBSTITUTIONS
// ============================

function makeSub(team="berwick"){

  // =========================
  // OPPONENT SUB
  // =========================
  if(team === "opp"){

    openPopup();
    mainBox.innerHTML = "<h3>Opponent Substitution</h3>";


let offNum = "";
let onNum = "";

// DISPLAY


let offDisplay = document.createElement("div");

offDisplay.innerHTML = "OFF: None Selected";

offDisplay.style.color = "#b91c1c";

offDisplay.style.fontSize = "24px";
offDisplay.style.fontWeight = "bold";
offDisplay.style.textAlign = "center";
offDisplay.style.margin = "10px";

let onDisplay = document.createElement("div");

onDisplay.innerHTML = "ON: ";

onDisplay.style.color = "#15803d";

onDisplay.style.fontSize = "28px";
onDisplay.style.fontWeight = "bold";
onDisplay.style.textAlign = "center";
onDisplay.style.margin = "10px";

// PLAYER OFF SELECTION
let offGrid = document.createElement("div");

offGrid.style.display = "grid";
offGrid.style.gridTemplateColumns = "repeat(4, 70px)";
offGrid.style.justifyContent = "center";
offGrid.style.gap = "10px";
offGrid.style.marginBottom = "20px";

opponentPlayers.forEach(p => {

  let b = document.createElement("button");

  b.innerText = "#" + p.id;

  b.onclick = ()=>{

    offNum = p.id;

    offDisplay.innerHTML =
      "OFF: #" + offNum;
  };

  offGrid.appendChild(b);
});

mainBox.appendChild(offGrid);
mainBox.appendChild(offDisplay);
mainBox.appendChild(onDisplay);

// KEYPAD
let keypad = document.createElement("div");

keypad.style.display = "grid";
keypad.style.gridTemplateColumns = "repeat(3, 70px)";
keypad.style.justifyContent = "center";
keypad.style.gap = "10px";
keypad.style.margin = "20px 0";

function updateDisplays(){

  offDisplay.innerHTML = "OFF: " + offNum;
  onDisplay.innerHTML = "ON: " + onNum;
}

for(let i = 1; i <= 9; i++){

  let b = document.createElement("button");

  b.innerText = i;

  b.style.height = "60px";
  b.style.fontSize = "24px";

  b.onclick = ()=>{

    if(onNum.length >= 2) return;

onNum += i;

    updateDisplays();
  };

  keypad.appendChild(b);
}

let zero = document.createElement("button");

zero.innerText = "0";

zero.style.height = "60px";
zero.style.fontSize = "24px";

zero.onclick = ()=>{

  if(onNum.length >= 2) return;

onNum += "0";

  updateDisplays();
};

keypad.appendChild(document.createElement("div"));
keypad.appendChild(zero);
keypad.appendChild(document.createElement("div"));

mainBox.appendChild(keypad);

    let btnConfirm = document.createElement("button");
    btnConfirm.innerText = "Confirm";

    btnConfirm.onclick = ()=>{


  if(!offNum || !onNum){
    alert("Enter both numbers");
    return;
  }

  // 🚫 PREVENT DUPLICATE NUMBER
let alreadyExists = opponentPlayers.find(
  p => p.id === onNum
);

if(alreadyExists){
  alert("That number is already on the pitch");
  return;
}
  
  // 🔍 FIND PLAYER ON PITCH
  let index = opponentPlayers.findIndex(p => p.id === offNum);

  if(index === -1){
    alert("Player not found on pitch");
    return;
  }

  let offPlayer = opponentPlayers[index];

  // ❌ REMOVE FROM PITCH
  opponentPlayers.splice(index, 1);

  // ➕ ADD TO BENCH
  opponentBench.push(offPlayer);

  opponentPlayers.push({
  id: onNum,
  x: offPlayer.x,
  y: offPlayer.y,
  subOn: true
});

  // 🔄 UPDATE SCREEN
  renderPitch();
// renderOpponentBench();   ← disable for now

  // 📝 LOG EVENT
  logEvent("opp","Sub", `#${offNum} ⟶ #${onNum}`);

  closePopup();
};

// DELETE LAST DIGIT
let del = document.createElement("button");

del.innerText = "⌫";

del.onclick = ()=>{

  onNum = onNum.slice(0,-1);

  updateDisplays();
};

    mainBox.appendChild(del);
    mainBox.appendChild(btnConfirm);
    let cancel = document.createElement("button");

cancel.innerText = "Cancel";

cancel.onclick = ()=>{
  closePopup();
};

mainBox.appendChild(cancel);

    return;
  }

  // =========================
  // BERWICK SUB
  // =========================
  openPopup();
  mainBox.innerHTML = "<h3>Berwick Substitution</h3>";

  let offTitle = document.createElement("h4");
  offTitle.innerText = "Select Player OFF";
  mainBox.appendChild(offTitle);

  activePlayers.forEach(p=>{

  if(!p.id || p.red) return; // 🚫 ADD THIS LINE

  let d = btn(p.name);

    d.onclick = ()=>{

  let playerOff = p;

  mainBox.innerHTML =
    "<h3>Berwick Substitution</h3>";

  // OFF DISPLAY
  let offDisplay =
    document.createElement("div");

  offDisplay.innerHTML =
    "OFF: " + playerOff.name;

  offDisplay.style.fontSize = "24px";
  offDisplay.style.fontWeight = "bold";
  offDisplay.style.color = "#b91c1c";
  offDisplay.style.textAlign = "center";
  offDisplay.style.margin = "15px";

  mainBox.appendChild(offDisplay);

  // ON TITLE
  let onTitle =
    document.createElement("div");

  onTitle.innerHTML =
    "Select Player ON";

  onTitle.style.fontSize = "22px";
  onTitle.style.fontWeight = "bold";
  onTitle.style.textAlign = "center";
  onTitle.style.margin = "10px";

  mainBox.appendChild(onTitle);

  // BENCH GRID
  let grid =
    document.createElement("div");

  grid.style.display = "grid";
  grid.style.gridTemplateColumns =
    "repeat(2, 1fr)";
  grid.style.gap = "10px";
  grid.style.marginTop = "15px";

  let selectedOn = null;

  lineup.bench.forEach(sub=>{

    if(sub.red) return;

    let b = btn(sub.name);

    // USED PLAYER
    if(usedPlayers.includes(
      String(sub.id).trim()
    )){
      b.innerText += " (USED)";
      b.style.background = "#ddd";
      b.style.color = "#888";
      b.style.cursor = "not-allowed";

      grid.appendChild(b);
      return;
    }

    b.onclick = ()=>{

      selectedOn = sub;

      document.querySelectorAll(
        ".sub-select"
      ).forEach(x=>{
        x.style.background = "";
      });

      b.style.background = "#bbf7d0";
      b.classList.add("sub-select");
    };

    grid.appendChild(b);
  });

  mainBox.appendChild(grid);

  // BUTTON ROW
  let row =
    document.createElement("div");

  row.style.display = "flex";
  row.style.justifyContent = "center";
  row.style.gap = "10px";
  row.style.marginTop = "20px";

  // CONFIRM
  let confirm =
    document.createElement("button");

  confirm.innerText = "Confirm";

  confirm.onclick = ()=>{

    if(!selectedOn){
      alert("Select player ON");
      return;
    }

    // swap players
    let index = activePlayers.findIndex(
      x => x.id === playerOff.id
    );

    if(index !== -1){

  selectedOn.position =
    playerOff.position;

  activePlayers[index] = {
    ...selectedOn,
    subOn: true
  };
}

    // remove ON player from bench
    lineup.bench =
      lineup.bench.filter(
        x => x.id !== selectedOn.id
      );

    // add OFF player to bench
    lineup.bench.push(playerOff);

    // minutes OFF
    if(playerMinutes[playerOff.name]){
      playerMinutes[playerOff.name]
        .total +=
        matchSeconds -
        playerMinutes[playerOff.name].start;
    }

    // mark used
    usedPlayers.push(
      String(playerOff.id).trim()
    );

    // minutes ON
    playerMinutes[selectedOn.name] = {
      start: matchSeconds,
      total:
        playerMinutes[selectedOn.name]
          ?.total || 0
    };

    renderPitch();

    logEvent(
      "berwick",
      "Sub",
      `${playerOff.name} ⟶ ${selectedOn.name}`
    );

    closePopup();
  };

  // CANCEL
  let cancel =
    document.createElement("button");

  cancel.innerText = "Cancel";

  cancel.onclick = ()=>{
    closePopup();
  };

  row.appendChild(confirm);
  row.appendChild(cancel);

  mainBox.appendChild(row);
};

    mainBox.appendChild(d);
  });
}

// ============================
// OPPONENT MANAGEMENT
// ============================

function addOpponentPlayer(){

  openPopup();

  mainBox.innerHTML = `
    <h3 style="
      text-align:center;
      margin-bottom:20px;
      font-size:28px;
    ">
      Add Opponent Player
    </h3>
  `;

  let pad = createNumberPad({
  container: mainBox
});

  // BUTTON ROW
let btnRow = document.createElement("div");

btnRow.style.display = "flex";
btnRow.style.justifyContent = "center";
btnRow.style.gap = "10px";
btnRow.style.marginTop = "20px";


// CONFIRM
let confirm = document.createElement("button");

confirm.innerText = "Confirm";

confirm.onclick = ()=>{

  let number = pad.getValue();

  if(number === ""){
    alert("Select a number");
    return;
  }

  // prevent duplicate numbers
if(opponentPlayers.length >= 11){
  alert("Opponent Starting XI already entered");
  return;
}

  let exists = opponentPlayers.find(
  opp => opp.id === number
);

  if(exists){
    alert("That player already exists");
    return;
  }

  opponentPlayers.push({
  id: number,
  name: "#" + number
});

closePopup();
};

// CANCEL
let cancel = document.createElement("button");

cancel.innerText = "Cancel";

cancel.onclick = ()=> closePopup();

btnRow.appendChild(
  pad.createDeleteButton()
);

btnRow.appendChild(confirm);
btnRow.appendChild(cancel);

mainBox.appendChild(btnRow);
}

function placeOpponent(e){

  // 👉 GET CLICK POSITION FIRST (THIS WAS YOUR BUG)
  let pitch = document.getElementById("pitch");
  let rect = pitch.getBoundingClientRect();

  let x = ((e.clientX - rect.left) / rect.width) * 100;
  let y = ((e.clientY - rect.top) / rect.height) * 100;

  // 🔵 MOVE BERWICK PLAYER
  if(movingBerwickIndex !== null){

    activePlayers[movingBerwickIndex].x = x;
    activePlayers[movingBerwickIndex].y = y;

    movingBerwickIndex = null;
    renderPitch();
    return;
  }

  // 🔴 MOVE OPPONENT PLAYER
  if(movingOpponentIndex !== null){

    opponentPlayers[movingOpponentIndex].x = x;
    opponentPlayers[movingOpponentIndex].y = y;

    movingOpponentIndex = null;
    renderPitch();
    return;
  }

  // ➕ ADD NEW OPPONENT PLAYER
  if(window.pendingOpponent){
    if(opponentPlayers.length >= 11){
  alert("Opponent team already has 11 players");
  window.pendingOpponent = null;
  return;
}

    opponentPlayers.push({
      id: window.pendingOpponent.id,
      x: x,
      y: y
    });

    window.pendingOpponent = null;
    renderPitch();
  }
}


// 🔥 FORCE BUTTONS TO WORK
window.startMatch = startMatch;
window.endFirstHalf = endFirstHalf;
window.startSecondHalf = startSecondHalf;
window.endMatch = endMatch;

// ============================
// BUTTON CONNECTIONS
// ============================

window.onload = () => {

 let d = new Date();

matchDate = d.toLocaleDateString('en-AU');

document.getElementById("matchDate").innerText =
  "Date: " + matchDate;

  document.getElementById("reportsBtn").onclick =
  showReportsMenu;

function showReportsMenu(){

  openPopup();

  mainBox.innerHTML = `
    <h3>Reports</h3>
  `;

  // MATCH REPORT
  let matchBtn = btn("Match Report");

  matchBtn.onclick = ()=>{
    generateReport();
    closePopup();
  };

  mainBox.appendChild(matchBtn);

  // MATCH STAT SUMMARY
  let summaryBtn = btn("Match Stat Summary");

  summaryBtn.onclick = ()=>{
    showMatchSummary();
    closePopup();
  };

  mainBox.appendChild(summaryBtn);

  // MATCH PLAYER STATS
  let playerBtn = btn("Match Player Stats");

  playerBtn.onclick = ()=>{
    showMatchStatsPage();
    closePopup();
  };

  mainBox.appendChild(playerBtn);

  // ADD MATCH TO SEASON
  let addBtn = btn("Add Match To Season Stats");

  addBtn.onclick = ()=>{
    commitMatchToSeason();
    closePopup();
  };

  mainBox.appendChild(addBtn);

  // SEASON STATS
  let seasonBtn = btn("Season Stats");

  seasonBtn.onclick = ()=>{
    showSeasonStats();
    closePopup();
  };

  mainBox.appendChild(seasonBtn);

  // MATCH LOG
  let logBtn = btn("Season Match Log");

  logBtn.onclick = ()=>{
    showMatchLog();
    closePopup();
  };

  mainBox.appendChild(logBtn);

  // RESET SEASON
  let resetBtn = btn("Reset Season Stats");

  resetBtn.onclick = ()=>{
    resetSeasonStats();
    closePopup();
  };

  mainBox.appendChild(resetBtn);

  // CLOSE
  let closeBtn = btn("Close");

  closeBtn.onclick = ()=>{
    closePopup();
  };

  mainBox.appendChild(closeBtn);
}

  updateDisplay();


  let savedSeason = localStorage.getItem("seasonStats");

if(savedSeason){
  seasonStats = JSON.parse(savedSeason);
}

  // 🔥 NEVER BREAK TEAM SELECTION AGAIN
try {

  selectOpponent();

} catch(e){

  console.error("🔥 APP CRASHED:", e);

  document.body.innerHTML = `
    <div style="
      padding:40px;
      font-family:Arial;
      text-align:center;
    ">
      <h2 style="color:red;">App Error</h2>
      <p>Something broke during startup.</p>
      <p>Open console (F12) to see details.</p>
    </div>
  `;
}

  document.getElementById("startBtn").onclick = startMatch;
  document.getElementById("halfBtn").onclick = endFirstHalf;
  document.getElementById("secondBtn").onclick = startSecondHalf;
  document.getElementById("endBtn").onclick = endMatch;

  document.getElementById("berwickMobileBtn").onclick =
  showBerwickEvents;

document.getElementById("oppMobileBtn").onclick =
  showOppEvents;

  document.getElementById("timelineBtn").onclick =
  showTimeline;
};

function showBerwickEvents(){

  document.querySelector(".stats-panel").style.display = "none";

  document.getElementById("matchControls").style.display = "none";

  document.getElementById("berwickEvents").style.display = "block";
  document.getElementById("oppEvents").style.display = "none";
}

function showOppEvents(){

  document.querySelector(".stats-panel").style.display = "none";

  document.getElementById("matchControls").style.display = "none";

  document.getElementById("oppEvents").style.display = "block";
  document.getElementById("berwickEvents").style.display = "none";
}

function showHomeScreen(){

  document.querySelector(".stats-panel").style.display = "block";

  document.getElementById("matchControls").style.display = "grid";

  document.getElementById("berwickEvents").style.display = "none";
  document.getElementById("oppEvents").style.display = "none";

  document.querySelector(".events-log").style.display = "none";
}

function showTimeline(){

  document.querySelector(".stats-panel").style.display = "none";

  document.getElementById("matchControls").style.display = "none";

  document.getElementById("berwickEvents").style.display = "none";
  document.getElementById("oppEvents").style.display = "none";

  document.querySelector(".events-log").style.display = "block";
}

function loadMatch(){
  let data = JSON.parse(localStorage.getItem("lastMatch"));

  if(!data) return;

  document.getElementById("timeline").innerHTML = data.events;

  alert("Loaded last match");
}

function formatTimeline(){

  let raw = document.getElementById("timeline").innerHTML;

  let temp = document.createElement("div");
  temp.innerHTML = raw;

  let events = Array.from(temp.children);

  let html = "";

  events.forEach(e => {

    let text = e.querySelector(".event") 
  ? e.querySelector(".event").innerHTML 
  : e.innerHTML;


    // 🔥 FIX DOUBLE YELLOW ICON (DO IT HERE ONLY)
if(text.includes("(Yellow Card)")){

  let playerName = text.split("(")[0].trim();

  let foundPlayer =
    activePlayers.find(p => p.name === playerName) ||
    lineup.bench.find(p => p.name === playerName);

  if(foundPlayer && foundPlayer.doubleYellow){

    let doubleIcon = '<span style="position:relative;display:inline-block;width:14px;height:12px;vertical-align:middle;"><span style="position:absolute;top:-2px;left:6px;font-size:10px;z-index:2;">🟥</span><span style="position:absolute;top:2px;left:0;font-size:10px;z-index:1;">🟨</span></span>';

    // 🔁 replace the NORMAL yellow icon with overlap
    text = text.replace(/\(Yellow Card\).*?🟨/, `(Yellow Card) ${doubleIcon}`);
  }
}

    let time = e.querySelector(".time-pill")
  ? e.querySelector(".time-pill").innerText
  : "";

    let cleanText = text.replace(time, "").trim();
    // 🔥 FIX DOUBLE YELLOW TEXT
if(cleanText.includes("(Yellow Card)")){

  // find player name (first part of string)
  let playerName = cleanText.split("(")[0].trim();

  let foundPlayer =
    activePlayers.find(p => p.name === playerName) ||
    lineup.bench.find(p => p.name === playerName);

  if(foundPlayer && foundPlayer.doubleYellow){
    cleanText = cleanText.replace(
      "(Yellow Card)",
      "(2nd Yellow / Red Card)"
    );
  }
}
    let isMarker = cleanText.includes("HALF TIME") || cleanText.includes("FULL TIME");

// 🔥 IF THIS IS A SUBSTITUTION → FORMAT IT
if(cleanText.includes("→") && cleanText.split("→").length === 2){

  let parts = cleanText.split("→");

  let off = parts[0].replace("(OFF:", "").replace(")", "").trim();
  let on = parts[1].replace("(ON:", "").replace(")", "").trim();

  cleanText = `
  <div class="sub-block">

    <div class="sub-names">
      <div class="name on">🟢 ${on}</div>
      <div class="name off">🔴 ${off}</div>
    </div>

  </div>
`;
}

    let isBerwick = e.querySelector('.side.left .event') !== null;


    html += `
  <div class="timeline-row">

    <div class="side left">
      ${!isMarker && isBerwick ? `<div class="event">${cleanText}</div>` : ""}
    </div>

    <div class="middle">
      <div class="time-pill">
        ${isMarker ? cleanText : time}
      </div>
    </div>

    <div class="side right">
      ${!isMarker && !isBerwick ? `<div class="event">${cleanText}</div>` : ""}
    </div>

  </div>
`;
  });

  return html;
}

// ============================
// REPORTS
// ============================

function generateReport(){

  let reportWindow = window.open("", "_blank");
  let insight = getMatchInsight();

  let timelineHTML = "";

let icons = {
  "Goal": "⚽",
  "Penalty Scored": "⚽",
  "Penalty Missed": "❌",
  "Penalty Saved": "🧤",
  "Shot On Target": "🎯",
  "Shot Off Target": "⭕",
  "Yellow Card": "🟨",
  "Red Card": "🟥",
  "Corner": "🚩",
  "Free Kick": "🦶",
  "Offside": "🚫",
  "Sub": "🔁",
  "Own Goal": "⚠️"
};

eventHistory.forEach(e => {

  let name = "";
  let eventText = "";

  // ===== EVENT TEXT =====
eventText =
  (e.type === "Sub" || e.type === "Own Goal")
    ? ""
    : "(" + e.type + ")";

// ===== NAME =====
name =
  e.player ? e.player : "";

// 🎯 PENALTY WON BY
if(
  (
    e.type === "Penalty Scored" ||
    e.type === "Penalty Missed" ||
    e.type === "Penalty Saved"
  )
  && e.assist
){
  name += `
    <span style="
      font-size:11px;
      color:#666;
    ">
      (Won by: ${e.assist})
    </span>
  `;
}

// ✅ NORMAL GOAL ASSIST
if(e.type === "Goal" && e.assist){
  name += ` (Assist: ${e.assist})`;
}

  // ✅ ADD THIS LINE RIGHT HERE
  let icon = icons[e.type] || (e.type.includes("Free Kick") ? "🦶" : "");

  // 🔥 DOUBLE YELLOW / RED ICON FOR REPORT
if(e.type === "Yellow Card"){

  let yellowIndex =
    eventHistory
      .filter(ev =>
        ev.type === "Yellow Card" &&
        ev.player === e.player
      )
      .indexOf(e);

  // ONLY SECOND YELLOW GETS STACKED ICON
  if(yellowIndex > 0){

    icon = `
<span style="
  position:relative;
  display:inline-block;
  width:18px;
  height:16px;
  vertical-align:middle;
">

  <span style="
    position:absolute;
    top:4px;
    left:2px;
    font-size:10px;
    z-index:1;
  ">🟨</span>

  <span style="
    position:absolute;
    top:-2px;
    left:8px;
    font-size:10px;
    z-index:2;
  ">🟥</span>

</span>
`;
  }
}

  // ===== TYPE HANDLING =====
  if(e.type === "Sub"){
    name = e.player;
    eventText = "(Sub)";
  }

  else if(e.type === "Own Goal"){
    name = e.assist 
      ? `Own Goal (Forced by ${e.assist})`
      : "Own Goal";
    eventText = "";
  }

  else {

  name = e.player ? e.player : "";

  // 🔥 FIX SECOND YELLOW TEXT
  if(e.type === "Yellow Card"){

  // count previous yellow cards
  let yellowCount =
    eventHistory.filter(ev =>
      ev.type === "Yellow Card" &&
      ev.player === e.player
    ).indexOf(e);

  // FIRST YELLOW
  if(yellowCount === 0){

    eventText = "(Yellow Card)";

  }

  // SECOND YELLOW
  else{

    eventText = "(2nd Yellow / Red Card)";
  }

} else {

  eventText = `(${e.type})`;
}

  if(e.type === "Goal" && e.assist){
    name += ` (Assist: ${e.assist})`;
  }
  // 🎯 PENALTIES
if(
  (
    e.type === "Penalty Scored" ||
    e.type === "Penalty Missed" ||
    e.type === "Penalty Saved"
  )
  && e.assist
){
  name += `
    <span style="
      font-size:11px;
      color:#666;
    ">
      (Won by: ${e.assist})
    </span>
  `;
}
}

  // ===== LEFT / RIGHT =====
  let left = "";
let right = "";

if(e.team === "berwick"){
  left = `${name} ${eventText} ${icon}`.trim();   // ✅ ICON MOVED TO END
} else {
  right = `${icon} ${eventText} ${name}`.trim();
}

  // ===== BUILD HTML =====
  timelineHTML += `
    <div class="timeline-row">
      <div class="side left">${left}</div>

      <div class="middle">
        <div class="time-pill">${e.time}</div>
      </div>

      <div class="side right">${right}</div>
    </div>
  `;
});

  let reportHTML = `
  <html>
  <head>
    <title>Match Report</title>

    <style>
      body {
        font-family: Arial;
        padding: 30px;
        background: #fff;
      }

      /* STANDARD REPORT HEADER */

.report-header{
  text-align:center;
  margin-bottom:4px;
  line-height:0.95;
}

.report-title{
  font-size:15px;
  font-weight:700;
  margin-bottom:1px;
  letter-spacing:0;
}

.report-fixture{
  font-size:13px;
  font-weight:600;
  margin-bottom:0;
}

.report-score{
  font-size:20px;
  font-weight:700;
  margin-bottom:0;
  line-height:0.9;
}

.report-meta{
  font-size:10px;
  color:#666;
  line-height:1;
}

      .timeline-row {
  display: grid;
  grid-template-columns: 1fr 70px 1fr;
  align-items: center;
  margin: 2px 0;
  min-height: 20px;
  font-size: 11px;
}

      .side {
        display: flex;
        align-items: center;
      }

      .side.left {
  justify-content: flex-end;
  padding-right: 8px;
  text-align: right;
  line-height: 1.1;
}

.side.right {
  justify-content: flex-start;
  padding-left: 8px;
  text-align: left;
  line-height: 1.1;
}

      .middle {
        text-align: center;
        position: relative;
      }

      .middle::before,
.middle::after {
  content: "";
  position: absolute;
  left: 50%;
  width: 2px;
  background: #ccc;
  transform: translateX(-50%);
}

.middle::before {
  top: -10px;
  height: 14px;
}

.middle::after {
  bottom: -10px;
  height: 14px;
}

      .time-pill{
  display:inline-block;
  min-width:52px;
  padding:2px 6px;
  border-radius:10px;
  background:#f3f4f6;
  font-size:10px;
  font-weight:bold;
}

      .event {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      /* LEFT SIDE CONNECTOR */
.side.left::after {
  content: "";
  display: inline-block;
  width: 10px;
  height: 2px;
  background: #ccc;
  margin-left: 8px;
}

/* RIGHT SIDE CONNECTOR */
.side.right::before {
  content: "";
  display: inline-block;
  width: 10px;
  height: 2px;
  background: #ccc;
  margin-right: 8px;
}
    </style>
  </head>

 <body>

<button onclick="window.close()" style="
  position:absolute;
  top:20px;
  left:20px;
  padding:8px 12px;
  font-size:12px;
  cursor:pointer;
">
  ⬅ BACK
</button>

<button onclick="window.print()" style="
  position:absolute;
  top:20px;
  right:20px;
  padding:8px 12px;
  font-size:12px;
  cursor:pointer;
">
  Print PDF
</button>

   ${standardReportHeader("MATCH REPORT")}

    <div style="width:90%; margin:20px auto;">
      <div style="margin-top:20px;">


  <div style="
    background:#fafafa;
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:18px;
  ">

    ${timelineHTML}

  </div>

</div>
    </div>

  </body>
  </html>
  `;

  reportWindow.document.write(reportHTML);
  reportWindow.document.close();
}

function showPlayerStats(){

  if(Object.keys(seasonStats).length === 0){
    alert("No season data yet");
    return;
  }

  let statsWindow = window.open("", "_blank");

  let sortedPlayers = Object.keys(seasonStats).sort((a,b)=>{
    if(seasonStats[b].goals !== seasonStats[a].goals){
      return seasonStats[b].goals - seasonStats[a].goals;
    }

    let minA = seasonStats[a].minutes || 0;
    let minB = seasonStats[b].minutes || 0;

    return minB - minA;
  });

  let rows = "";

  sortedPlayers.forEach(player=>{
  let p = seasonStats[player];

  let mins = Math.floor((playerMinutes[player]?.total || 0) / 60);
  let style = mins === 0 ? "color:#999;" : "";

  rows += `
    <tr style="${style}">
      <td>${player}</td>
      <td>${p.goals}</td>
      <td>${p.assists}</td>
      <td>${p.yellow}</td>
      <td>${p.red}</td>
      <td>${p.minutes}</td>
    </tr>
  `;
});

  let html = `
    <html>
    <head>
      <title>Player Stats</title>
      <style>
        body { font-family: Arial; padding:20px; }
        h1 {
  text-align:center;
  margin: 5px 0 10px 0;
}
        table {
          width:100%;
          table td:first-child,
table th:first-child {
  width: 160px;
  text-align: left;
}
          border-collapse: collapse;
          margin-top:20px;
        }
        th, td {
          border:1px solid #ccc;
          padding:8px;
          text-align:center;
        }
        thead th {
  background:#d9d9d9;
  font-weight:bold;
  font-size:11px;
}
tr:nth-child(even) {
  background: #fafafa;
}

      </style>
    </head>
    <body>

      <h1>Season Player Stats</h1>

      <table>
        <tr>
          <th>Player</th>
          <th>Goals</th>
          <th>Assists</th>
          <th>Yellow</th>
          <th>Red</th>
          <th>Minutes</th>
        </tr>

        ${rows}

      </table>

    </body>
    </html>
  `;

  statsWindow.document.write(html);
  statsWindow.document.close();
  statsWindow.focus();
}

// ============================
// SEASON STATS
// ============================

function updateSeasonStats(){

  for(let player in matchStats){

    if(!seasonStats[player]){
      seasonStats[player] = {
  goals: 0,
  assists: 0,
  yellow: 0,
  red: 0,
  minutes: 0,
  games: 0,
  starts: 0,
  subApps: 0,
  unusedSubs: 0
};
    }

    seasonStats[player].goals += matchStats[player].goals;
    seasonStats[player].assists += matchStats[player].assists;
    seasonStats[player].yellow += matchStats[player].yellow;
    seasonStats[player].red += matchStats[player].red;

    // minutes
    let mins = Math.floor((playerMinutes[player]?.total || 0)/60);
    seasonStats[player].minutes += mins;

  }

lineup.starters.forEach(p => {

  let cleanName = p.name;

  if(cleanName.includes(" - ")){
    cleanName = cleanName.split(" - ")[1];
  }

  if(!seasonStats[cleanName]){
    return;
  }

  seasonStats[cleanName].starts++;
  seasonStats[cleanName].games++;
});

activePlayers.forEach(p => {

  if(!p.subOn) return;

  let cleanName = p.name;

  if(cleanName.includes(" - ")){
    cleanName = cleanName.split(" - ")[1];
  }

  if(!seasonStats[cleanName]){
    seasonStats[cleanName] = {
      goals: 0,
      assists: 0,
      yellow: 0,
      red: 0,
      minutes: 0,
      games: 0,
      starts: 0,
      subApps: 0,
      unusedSubs: 0
    };
  }

  seasonStats[cleanName].subApps++;
  seasonStats[cleanName].games++;
});

lineup.bench.forEach(p => {

  let cleanName = p.name;

  if(cleanName.includes(" - ")){
    cleanName = cleanName.split(" - ")[1];
  }

  let mins = Math.floor((playerMinutes[cleanName]?.total || 0) / 60);

  let started = lineup.starters.some(s => {

  let starterName = s.name;

  if(starterName.includes(" - ")){
    starterName = starterName.split(" - ")[1];
  }

  return starterName === cleanName;
});

let isStarter = lineup.starters.some(s => {

  let starterName = s.name;

  if(starterName.includes(" - ")){
    starterName = starterName.split(" - ")[1];
  }

  return starterName === cleanName;
});

if(seasonStats[cleanName] && isStarter === false){

  // unused substitute
}

});

  localStorage.setItem("seasonStats", JSON.stringify(seasonStats));
}

function highlightStat(team, type){

  if(team !== "berwick") return; // 👈 ignore opponent

  let id = "";

  if(type === "Goal" || type.includes("Shot")) id = "b_shots";
  if(type === "Corner") id = "b_corners";
  if(type.includes("Free Kick")) id = "b_freekicks";
  if(type === "Offside") id = "b_offsides";
  if(type.includes("Card")) id = "b_cards";

  let el = document.getElementById(id);

  if(el){
    el.classList.add("stat-flash");

    setTimeout(()=>{
      el.classList.remove("stat-flash");
    }, 1000);
  }
}

function flashScore(){

  let el = document.getElementById("b_score");

  if(!el) return;

  el.classList.add("score-flash");

  setTimeout(()=>{
    el.classList.remove("score-flash");
  }, 1000);
}

function showMatchStatsPage(){

  if(Object.keys(matchStats).length === 0){
    alert("No match stats yet");
    return;
  }

  let statsWindow = window.open("", "_blank");

  // ✅ BUILD FULL BERWICK PLAYER LIST

  let allPlayers = [
  ...matchSquad,
  ...Object.keys(playerMinutes)
];

// ✅ remove duplicates
allPlayers = [...new Set(allPlayers)];

// OPTIONAL: sort by minutes
allPlayers.sort((a, b) => {
  let minA = playerMinutes[a]?.total || 0;
  let minB = playerMinutes[b]?.total || 0;
  return minB - minA;
});

let starters = lineup.starters.map(p => p.name);

let startersRows = "";
let subsUsedRows = "";
let unusedRows = "";

allPlayers.forEach(player => {

  let p = matchStats[player] || {
    goals: 0,
    assists: 0,
    yellow: 0,
    red: 0
  };

  let mins = Math.floor((playerMinutes[player]?.total || 0) / 60);

  let style = mins === 0 ? "color:#999;" : "";

let row = `
  <tr style="${style}">
    <td>${player}</td>
    <td>${p.goals || 0}</td>
    <td>${p.assists || 0}</td>
    <td>${p.shotsOn || 0}</td>   <!-- ✅ ADD -->
    <td>${p.shotsOff || 0}</td>  <!-- ✅ ADD -->
    <td>${p.yellow || 0}</td>
    <td>${p.red || 0}</td>
    <td>${mins}</td>
  </tr>
`;

  // 🔵 STARTERS
  if(starters.includes(player)){
    startersRows += row;
  }

  // 🟢 SUB USED (played but not starter)
  else if(mins > 0){
    subsUsedRows += row;
  }

  // ⚪ UNUSED
  else{
    unusedRows += row;
  }
});

  let html = `
    <html>
    <head>
      <title>Match Player Stats</title>
      <style>
        body { font-family: Arial; padding:20px; }
        h1 { text-align:center; }
        table {
          width:100%;
          border-collapse: collapse;
          margin-top:20px;
        }
        th, td {
          border:1px solid #ccc;
          padding:8px;
          text-align:center;
        }
        th {
  background:#c4c4c4 !important;
  font-weight:bold;
  font-size:11px;
  padding:8px 6px;
}
      </style>
    </head>
    <body>

<button onclick="window.close()" style="
  position:absolute;
  top:20px;
  left:20px;
  padding:8px 12px;
  font-size:12px;
  cursor:pointer;
">
  ⬅ BACK
</button>

<button onclick="printReport()" style="
  position:absolute;
  top:20px;
  right:20px;
  padding:8px 12px;
  font-size:12px;
  cursor:pointer;
">
  Print PDF
</button>

${standardReportHeader("MATCH PLAYER STATS")}

      <table>
        <tr>
        <th style="width:22%;">Player</th>
        <th style="width:10%;">Goals</th>
        <th style="width:10%;">Assists</th>
        <th style="width:12%;">Shots On Target</th>
        <th style="width:12%;">Shots Off Target</th>
        <th style="width:10%;">Yellow</th>
        <th style="width:10%;">Red</th>
        <th style="width:10%;">Minutes</th>
</tr>

        <tr>
  <th colspan="8" style="text-align:center; background:#f3f4f6; padding:8px;">
    Starting XI
  </th>
</tr>
${startersRows}

<tr>
  <th colspan="8" style="text-align:center; background:#f3f4f6; padding:8px;">
    Substitutes Used
  </th>
</tr>
${subsUsedRows}

<tr>
  <th colspan="8" style="text-align:center; background:#f3f4f6; padding:8px;">
    Unused Substitutes
  </th>
</tr>
${unusedRows}

</table>

</body>
</html>
`;

statsWindow.printReport = function(){
  statsWindow.focus();
  statsWindow.print();
};

  statsWindow.document.write(html);
  statsWindow.document.close();
}


function undoLastEvent(team){

  if(eventHistory.length === 0){
    alert("No events to undo");
    return;
  }

  // 🔍 find last event for this team
  let index = [...eventHistory].reverse().findIndex(e => e.team === team);

  if(index === -1){
    alert("No events for this team");
    return;
  }

  // get correct index
  index = eventHistory.length - 1 - index;

  let last = eventHistory.splice(index, 1)[0];

  // remove from UI
  if(last.element && last.element.parentNode){
    last.element.remove();
  }

  reverseStats(last);
}

function editLastEvent(team){

  if(eventHistory.length === 0){
    alert("No events to edit");
    return;
  }

  let index = [...eventHistory].reverse().findIndex(e => e.team === team);

  if(index === -1){
    alert("No events for this team");
    return;
  }

  index = eventHistory.length - 1 - index;

  let last = eventHistory.splice(index, 1)[0];

  if(last.element && last.element.parentNode){
    last.element.remove();
  }

  reverseStats(last);

  reopenEvent(last);
}

function openEditMenu(index){

  if(index === -1){
    console.warn("Event not found");
    return;
  }

  openPopup();

  mainBox.innerHTML = "<h3>Edit Event</h3>";

  let edit = btn("Edit");
  let del = btn("Delete");
  let cancel = btn("Cancel");

  edit.onclick = () => editEvent(index);
  del.onclick = () => deleteEvent(index);
  cancel.onclick = () => closePopup();

  mainBox.appendChild(edit);
  mainBox.appendChild(del);
  mainBox.appendChild(cancel);
}


function deleteEvent(index){

  let event = eventHistory[index];
  if(!event) return;

  reverseStats(event);
  event.element.remove();
  eventHistory.splice(index, 1);

  closePopup();
}

function rebuildPlayerCards(playerName){

  let yellows = 0;
  let reds = 0;

  eventHistory.forEach(e => {
    if(e.player === playerName){

      if(e.type === "Yellow Card"){
        yellows++;
      }

      if(e.type === "Red Card"){
        reds++;
      }
    }
  });

  let player =
    activePlayers.find(p => p.name === playerName) ||
    lineup.bench.find(p => p.name === playerName);

  if(!player) return;

  // reset everything
  player.yellow = false;
  player.red = false;
  player.doubleYellow = false;
  player.yellowCount = yellows;

  // apply correct state
  if(yellows === 1){
    player.yellow = true;
  }

  if(yellows >= 2){
    player.yellow = true;
    player.red = true;
    player.doubleYellow = true;
  }

  if(reds > 0){
    player.red = true;
  }
}

function reverseStats(event){

  let s = event.team === "berwick" ? stats.berwick : stats.opp;

  // ===== TEAM STATS =====
  if(event.type === "Goal"){
    s.goals--;
    s.on--;
  }

  if(event.type === "Own Goal"){
    if(event.team === "berwick"){
      stats.berwick.goals--;
    } else {
      stats.opp.goals--;
    }
  }

  if(event.type === "Shot On Target") s.on--;
  if(event.type === "Shot Off Target") s.off--;
  if(event.type === "Corner") s.corners--;

  if(event.type.includes("Free Kick")){
    if(event.type.includes("Defensive")) s.freeKicks.def--;
    else if(event.type.includes("Middle")) s.freeKicks.mid--;
    else if(event.type.includes("Attacking")) s.freeKicks.att--;
  }

  if(event.type === "Offside") s.offsides--;
  if(event.type === "Yellow Card") s.yellow--;
  if(event.type === "Red Card") s.red--;

  // ===== PLAYER STATS (THIS IS THE FIX) =====
  if(event.player){
    if(matchStats[event.player]){
      if(event.type === "Goal") matchStats[event.player].goals--;
      if(event.type === "Yellow Card") matchStats[event.player].yellow--;
      if(event.type === "Red Card") matchStats[event.player].red--;
    }
  }

  // assist
  if(event.type === "Goal" && event.assist){
    if(matchStats[event.assist]){
      matchStats[event.assist].assists--;
    }
  }
// ===== FIX PLAYER STATE ON PITCH =====
if(event.player){

  // try find player in bench (was removed)
  let benchIndex = lineup.bench.findIndex(p => p.name === event.player);

  if(benchIndex !== -1){

    let playerObj = lineup.bench[benchIndex];

    if(event.type === "Red Card" || event.type === "Yellow Card"){

      let emptyIndex = activePlayers.findIndex(p => !p.name);

      if(emptyIndex !== -1){
        activePlayers[emptyIndex] = playerObj;
        lineup.bench.splice(benchIndex, 1);
      }
    }
  }
}

// ✅ MOVE THESE OUTSIDE
if(event.player){
  rebuildPlayerCards(event.player);
}

if(event.assist){
  rebuildPlayerCards(event.assist);
}

// 🔄 re-render pitch
renderPitch();
  updateDisplay();
}

function editEvent(index){

  let event = eventHistory[index];
  if(!event) return;

  // remove old
  reverseStats(event);
  event.element.remove();
  eventHistory.splice(index, 1);

  closePopup();

  // reopen event flow
  reopenEvent(event);
}

function reopenEvent(event){

  // reopen correct flow
  if(event.type === "Goal"){
    addEvent(event.team, "Goal");
    return;
  }

  if(event.type === "Own Goal"){
    addEvent(event.team, "Goal");
    return;
  }

  if(event.type.includes("Free Kick")){
    addEvent(event.team, "Free Kick");
    return;
  }

  addEvent(event.team, event.type);
}

function renderPitch(){

  let bench = document.getElementById("benchArea");
if (bench) bench.innerHTML = "";

  let pitch = document.getElementById("pitch");
  if(!pitch) return;

  // remove old players
  document.querySelectorAll(".player").forEach(p => p.remove());

  // ONLY USE FIRST 11 PLAYERS
  let players = activePlayers;

  // ✅ ALL IN ONE HALF (bottom half)
  let formationLayouts = {

  "4-3-3": [
    {top:"8%", left:"50%"},

    {top:"21%", left:"20%"},
    {top:"21%", left:"40%"},
    {top:"21%", left:"60%"},
    {top:"21%", left:"80%"},

    {top:"33%", left:"30%"},
    {top:"33%", left:"50%"},
    {top:"33%", left:"70%"},

    {top:"45%", left:"30%"},
    {top:"45%", left:"50%"},
    {top:"45%", left:"70%"}
  ],

  "4-4-2": [
    {top:"8%", left:"50%"},

    {top:"21%", left:"20%"},
    {top:"21%", left:"40%"},
    {top:"21%", left:"60%"},
    {top:"21%", left:"80%"},

    {top:"33%", left:"20%"},
    {top:"33%", left:"40%"},
    {top:"33%", left:"60%"},
    {top:"33%", left:"80%"},

    {top:"45%", left:"35%"},
    {top:"45%", left:"65%"}
  ],

  "3-5-2": [
    {top:"8%", left:"50%"},

    {top:"21%", left:"27%"},
    {top:"21%", left:"50%"},
    {top:"21%", left:"73%"},

    {top:"38%", left:"12%"},
    {top:"30%", left:"35%"},
    {top:"38%", left:"50%"},
    {top:"30%", left:"65%"},
    {top:"38%", left:"88%"},

    {top:"46%", left:"32%"},
    {top:"46%", left:"68%"}
  ],

  "4-1-2-3": [
    {top:"8%", left:"50%"},

    {top:"21%", left:"20%"},
    {top:"21%", left:"40%"},
    {top:"21%", left:"60%"},
    {top:"21%", left:"80%"},

    {top:"30%", left:"50%"}, // CDM

    {top:"38%", left:"35%"},
    {top:"38%", left:"65%"},

    {top:"46%", left:"20%"},
    {top:"46%", left:"50%"},
    {top:"46%", left:"80%"}
  ]

};

let formation = formationLayouts[currentFormation];

  players.forEach((p, i) => {
    if(!p.id) return;

    let player = document.createElement("div");
    player.onclick = (e) => {
  e.stopPropagation();
  movingBerwickIndex = i;
};
    player.className = "player";
  

    player.style.position = "absolute";
    player.style.transform = "translate(-50%, -50%)";
    player.style.top = p.y ? p.y + "%" : formation[i].top;
    player.style.left = p.x ? p.x + "%" : formation[i].left;

    // WHITE CIRCLE STYLE (same as before)
    player.style.background =
  p.subOn ? "#e4fc13" : "white";
    player.style.borderRadius = "50%";
    player.style.width = "54px";
    player.style.height = "50px";
    player.style.display = "flex";
    player.style.alignItems = "center";
    player.style.justifyContent = "center";
    player.style.fontSize = "12px";
    player.style.fontWeight = "bold";

    player.innerHTML = `
  <div style="
    line-height:1;
    text-align:center;
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    justify-content:center;
    position:relative;
  ">

    <div style="font-size:14px; font-weight:bold;">${p.id}</div>
    <div style="font-size:11px;">${p.name.split(" ")[0]}</div>

  </div>
`;

if(p.yellow){

  let yc = document.createElement("div");

  yc.style.position = "absolute";
  yc.style.width = "12px";
  yc.style.height = "12px";
  yc.style.background = "yellow";
  yc.style.border = "1.5px solid black";

  yc.style.top = "2px";
  yc.style.right = "2px";

  player.appendChild(yc);
}

    pitch.appendChild(player);
  });

  // =====================
// OPPONENT PLAYERS (BOTTOM HALF)
// =====================

if(typeof opponentPlayers !== "undefined"){

  let formation = formationLayouts[currentFormation];

  opponentPlayers.forEach((p, i) => {

    let player = document.createElement("div");
    player.onclick = (e) => {

  e.stopPropagation();

  openPopup();

  mainBox.innerHTML =
    "<h3>Edit Opponent Player</h3>";

 let pad = createNumberPad({
  container: mainBox,
  startValue: p.id
});

  // BUTTON ROW
  let row =
    document.createElement("div");

  row.style.display = "flex";
  row.style.justifyContent =
    "center";
  row.style.gap = "10px";
  row.style.marginTop = "20px";

  // DELETE
  let del =
    document.createElement("button");

  del.innerText = "⌫";
  del.onclick = ()=>{

  pad.deleteLast();
};

  // CONFIRM
  let confirm =
    document.createElement("button");

  confirm.innerText = "Confirm";

  confirm.onclick = ()=>{

    if(pad.getValue() !== ""){
  p.id = pad.getValue();
}

    renderPitch();

    closePopup();
  };

  // MOVE PLAYER
  let move =
    document.createElement("button");

  move.innerText = "Move";

  move.onclick = ()=>{

    movingOpponentIndex = i;

    closePopup();
  };

  // CANCEL
  let cancel =
    document.createElement("button");

  cancel.innerText = "Cancel";

  cancel.onclick = ()=>{
    closePopup();
  };

  row.appendChild(del);
  row.appendChild(confirm);
  row.appendChild(move);
  row.appendChild(cancel);

  mainBox.appendChild(row);
};
    player.className = "player";
  

    player.style.position = "absolute";
    player.style.transform = "translate(-50%, -50%)";

    // 🔴 FORCE TOP HALF
    player.style.top = p.y + "%";
    player.style.left = p.x + "%";

    // STYLE (different to Berwick)
    player.style.background =
  p.subOn ? "#7e22ce" : "#1976d2";
    player.style.color = "white";
    player.style.width = "40px";
    player.style.height = "40px";
    player.style.borderRadius = "50%";
    player.style.display = "flex";
    player.style.alignItems = "center";
    player.style.justifyContent = "center";
    player.style.fontWeight = "bold";

    // NUMBER ONLY
    player.innerText = p.id;
    if(opponentYellowCards[p.id]){

  let yc =
    document.createElement("div");

  yc.style.position = "absolute";
  yc.style.width = "12px";
  yc.style.height = "12px";
  yc.style.background = "yellow";
  yc.style.border =
    "1.5px solid black";

  yc.style.top = "-1px";
  yc.style.right = "-1px";

  player.appendChild(yc);
}

    let bench = document.getElementById("benchArea");
    pitch.appendChild(player);
  });

}

// =====================
// SUBSTITUTES (RIGHT SIDE)
// =====================

if(lineup.bench && lineup.bench.length > 0){

  lineup.bench.forEach((p, i) => {

    let sub = document.createElement("div");

    // 🎯 SET COLOUR (ONLY ONE WILL APPLY)
    if (usedPlayers.includes(String(p.id).trim())) {

      // ⚪ USED → GREY
      sub.style.backgroundColor = "#cdcccc";
      sub.style.color = "#666";
      sub.style.opacity = "0.6";

    } else {

      // 🟡 AVAILABLE → YELLOW
      sub.style.backgroundColor = "#fcf65e";

    }
sub.style.border = "1px solid #333";

sub.style.borderRadius = "50%";
sub.style.width = "38px";
sub.style.height = "38px";

sub.style.display = "flex";
sub.style.alignItems = "center";
sub.style.justifyContent = "center";
sub.style.fontSize = "13px";

sub.innerHTML = `
  <div style="
    position:relative;
    width:100%;
    height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
  ">

    <span>${p.id}</span>

    ${p.yellow ? `
      <span style="
        position:absolute;
        top:-2px;
        right:-2px;
        font-size:12px;
      ">🟨</span>
    ` : ""}

    ${p.red ? `
      <span style="
        position:absolute;
        top:-7px;
        right:-7px;
        font-size:12px;
      ">🟥</span>
    ` : ""}

  </div>
`;
    bench.appendChild(sub);

  });

}

}

function showMatchSummary(){

  let w = window.open("", "_blank");

let insight = getMatchInsight();
  let date = new Date().toLocaleDateString('en-AU');

  let html = `
  <html>
  <head>
    <title>Match Stat Summary</title>

    <style>
      body{
        font-family: Arial;
        padding: 30px;
        background: #fff;
      }

      h1{
        text-align:center;
        margin-bottom:10px;
      }

      .score{
        text-align:center;
        font-size:36px;
        font-weight:bold;
        margin-bottom:10px;
      }

      .meta{
        text-align:center;
        color:#555;
        margin-bottom:30px;
      }

      .grid{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap:20px;
      }

      .team{
        text-align:center;
        font-weight:bold;
        margin-bottom:10px;
      }

      .card{
        border:1px solid #ccc;
        border-radius:10px;
        padding:12px;
        margin-bottom:10px;
      }

      .title{
        font-weight:bold;
        margin-bottom:6px;
      }

      .row{
        display:flex;
        justify-content:space-between;
        margin:2px 0;
      }

      .print-btn{
        position:fixed;
        top:10px;
        right:10px;
      }

      @media print {
        .print-btn{
          display:none;
        }
      }
    </style>
  </head>

<body>

<button onclick="window.close()" style="
  position:fixed;
  top:10px;
  left:10px;
  z-index:9999;
">
  ⬅ BACK
</button>

<button class="print-btn" onclick="window.print()">
  Print PDF
</button>

  <div style="
  text-align:center;
  margin-bottom:30px;
">

  <div style="
    font-size:34px;
    font-weight:700;
    margin-bottom:18px;
    letter-spacing:1px;
  ">

  </div>

  ${standardReportHeader("MATCH STAT SUMMARY")}

<!-- QUICK MATCH STRIP -->

<div style="
  display:flex;
  justify-content:space-around;
  margin:18px 0;
  font-weight:bold;
  font-size:14px;
">

  <span>⚽ ${stats.berwick.goals}-${stats.opp.goals}</span>

  <span>
    🎯
    ${(stats.berwick.on + stats.berwick.off)}
    -
    ${(stats.opp.on + stats.opp.off)}
  </span>

  <span>
    🚩
    ${stats.berwick.corners}-${stats.opp.corners}
  </span>

  <span>
    🟨
    ${stats.berwick.yellow}-${stats.opp.yellow}
  </span>

</div>

<!-- SHOT ACCURACY -->

<div style="
  text-align:center;
  margin:14px 0 30px 0;
  font-size:14px;
  font-weight:bold;
">

  Shot Accuracy:
  ${Math.round((stats.berwick.on / ((stats.berwick.on + stats.berwick.off) || 1)) * 100)}%
  -
  ${Math.round((stats.opp.on / ((stats.opp.on + stats.opp.off) || 1)) * 100)}%

</div>

  <div class="grid">

    <!-- BERWICK -->
    <div>
      <div class="team">Berwick</div>

      ${statBlock("Shots", stats.berwick.on, stats.berwick.off)}
      ${statSingle("Corners", stats.berwick.corners)}
      ${statFree(stats.berwick.freeKicks)}
      ${statSingle("Offsides", stats.berwick.offsides)}
      ${statCards(stats.berwick)}

    </div>

    <!-- OPPONENT -->
    <div>
      <div class="team">${selectedOpponent}</div>

      ${statBlock("Shots", stats.opp.on, stats.opp.off)}
      ${statSingle("Corners", stats.opp.corners)}
      ${statFree(stats.opp.freeKicks)}
      ${statSingle("Offsides", stats.opp.offsides)}
      ${statCards(stats.opp)}

    </div>

  </div>

  </body>
  </html>
  `;

  w.document.write(html);
  w.document.close();
}

function statBlock(title, on, off){
  return `
    <div class="card">
      <div class="title">${title}</div>
      <div class="row"><span>On</span><span>${on}</span></div>
      <div class="row"><span>Off</span><span>${off}</span></div>
    </div>
  `;
}

function statSingle(title, value){
  return `
    <div class="card">
      <div class="title">${title}</div>
      <div class="row"><span>Total</span><span>${value}</span></div>
    </div>
  `;
}

function statFree(fk){
  return `
    <div class="card">
      <div class="title">Free Kicks</div>
      <div class="row"><span>Def</span><span>${fk.def}</span></div>
      <div class="row"><span>Mid</span><span>${fk.mid}</span></div>
      <div class="row"><span>Att</span><span>${fk.att}</span></div>
    </div>
  `;
}

function statCards(s){
  return `
    <div class="card">
      <div class="title">Cards</div>
      <div class="row"><span>Yellow</span><span>${s.yellow}</span></div>
      <div class="row"><span>Red</span><span>${s.red}</span></div>
    </div>
  `;
}

function commitMatchToSeason(){

  if(matchSquad.length === 0){
    alert("No match squad");
    return;
  }

  matchSquad.forEach(player => {

    // clean name (removes numbers like "7 - ")
    let cleanName = player;

    if(player.includes(" - ")){
      cleanName = player.split(" - ")[1];
    }

    if(!seasonStats[cleanName]){
      seasonStats[cleanName] = {
  goals: 0,
  assists: 0,
  shotsOn: 0,
  shotsOff: 0,
  yellow: 0,
  red: 0,
  minutes: 0,
  games: 0,
  starts: 0,
  subApps: 0,
  unusedSubs: 0
};
    }

    let match = matchStats[cleanName] || {};

    seasonStats[cleanName].goals += match.goals || 0;
    seasonStats[cleanName].assists += match.assists || 0;
    seasonStats[cleanName].shotsOn += match.shotsOn || 0;
    seasonStats[cleanName].shotsOff += match.shotsOff || 0;
    seasonStats[cleanName].yellow += match.yellow || 0;
    seasonStats[cleanName].red += match.red || 0;

    let mins = Math.floor((playerMinutes[cleanName]?.total || 0) / 60);
    seasonStats[cleanName].minutes += mins;

  });

  lineup.starters.forEach(p => {

  let cleanName = p.name;

  if(cleanName.includes(" - ")){
    cleanName = cleanName.split(" - ")[1];
  }

  if(seasonStats[cleanName]){
    seasonStats[cleanName].starts++;
    seasonStats[cleanName].games++;
  }

});

activePlayers.forEach(p => {

  if(!p.subOn) return;

  let cleanName = p.name;

  if(cleanName.includes(" - ")){
    cleanName = cleanName.split(" - ")[1];
  }

  if(seasonStats[cleanName]){
    seasonStats[cleanName].subApps++;
  }

});

lineup.bench.forEach(p => {

  let cleanName = p.name;

  if(cleanName.includes(" - ")){
    cleanName = cleanName.split(" - ")[1];
  }

  // Ignore players who started the match
  let wasStarter = lineup.starters.some(s => {

    let starterName = s.name;

    if(starterName.includes(" - ")){
      starterName = starterName.split(" - ")[1];
    }

    return starterName === cleanName;
  });

  if(seasonStats[cleanName] && !wasStarter){
    seasonStats[cleanName].unusedSubs++;
  }

});

  localStorage.setItem("seasonStats", JSON.stringify(seasonStats));

  alert("Season stats updated ✅");
  matchLog.push({
  date: new Date().toLocaleDateString('en-AU'),
  opponent: selectedOpponent,
  venue: window.matchVenue || "",

  berwick: {
    goals: stats.berwick.goals,
    on: stats.berwick.on,
    off: stats.berwick.off,
    corners: stats.berwick.corners,
    yellow: stats.berwick.yellow,
    red: stats.berwick.red
  },

  opp: {
    goals: stats.opp.goals,
    on: stats.opp.on,
    off: stats.opp.off,
    corners: stats.opp.corners,
    yellow: stats.opp.yellow,
    red: stats.opp.red
  }
});

localStorage.setItem("matchLog", JSON.stringify(matchLog));
}

function resetSeasonStats(){
  localStorage.removeItem("seasonStats");
  seasonStats = {};
  alert("Season stats cleared");
}

function showSeasonStats(){

  if(Object.keys(seasonStats).length === 0){
    alert("No season stats yet");
    return;
  }

  let w = window.open("", "_blank");

  let players = Object.keys(seasonStats).sort((a,b)=>{

  let appsA =
    (seasonStats[a].starts || 0) +
    (seasonStats[a].subApps || 0);

  let appsB =
    (seasonStats[b].starts || 0) +
    (seasonStats[b].subApps || 0);

  // Total Appearances
  if(appsB !== appsA){
    return appsB - appsA;
  }

  // Minutes
  if((seasonStats[b].minutes || 0) !== (seasonStats[a].minutes || 0)){
    return (seasonStats[b].minutes || 0) - (seasonStats[a].minutes || 0);
  }

  // Starts
  if((seasonStats[b].starts || 0) !== (seasonStats[a].starts || 0)){
    return (seasonStats[b].starts || 0) - (seasonStats[a].starts || 0);
  }

  // Subs
  if((seasonStats[b].subApps || 0) !== (seasonStats[a].subApps || 0)){
    return (seasonStats[b].subApps || 0) - (seasonStats[a].subApps || 0);
  }

  // Unused Subs (lower is better)
  if((seasonStats[a].unusedSubs || 0) !== (seasonStats[b].unusedSubs || 0)){
    return (seasonStats[a].unusedSubs || 0) - (seasonStats[b].unusedSubs || 0);
  }

  return a.localeCompare(b);

});

  let rows = "";
  let totals = {
  goals: 0,
  assists: 0,
  shotsOn: 0,
  shotsOff: 0,
  yellow: 0,
  red: 0,
  minutes: 0,
  games: 0
};

  players.forEach(player => {

    let p = seasonStats[player];
    totals.goals += p.goals;
totals.assists += p.assists;
totals.shotsOn += p.shotsOn || 0;
totals.shotsOff += p.shotsOff || 0;
totals.yellow += p.yellow;
totals.red += p.red;
totals.minutes += p.minutes;
totals.games += p.games;

    rows += `
      <tr>
        <td style="text-align:left; font-weight:bold;">${player}</td>
        <td>${p.goals}</td>
        <td>${p.assists}</td>
        <td>${p.shotsOn || 0}</td>
        <td>${p.shotsOff || 0}</td>
        <td>${p.yellow}</td>
        <td>${p.red}</td>
        <td>${p.minutes}</td>
<td>${p.starts || 0}</td>
<td>${p.subApps || 0}</td>
<td>${p.unusedSubs || 0}</td>
<td>${(p.starts || 0) + (p.subApps || 0)}</td>
      </tr>
    `;
  });

  let html = `
  <html>
  <head>
    <title>Season Stats</title>
    <style>
      body { font-family: Arial; padding:20px; }
      h1 { text-align:center; }
      table {
        width:100%;
        border-collapse: collapse;
        margin-top:20px;
      }
      th, td {
  border:1px solid #ccc;
  padding:6px;
  text-align:center;
  line-height: 1.8;
}
      th {
        background:#f4f4f4;
      }
@media print {

  @page {
    size: A4 landscape;
    margin: 8mm;
  }

  body {
    padding: 0;
    font-size: 10px;
  }

  h1 {
    font-size: 14px;
    margin: 4px 0;
  }

  table {
    width: 100%;
    font-size: 9px;
    border-collapse: collapse;
  }

  th, td {
    padding: 3px;
  }

  button {
    display: none;
  }

}

    </style>
  </head>
  <body>
  <div style="text-align:center; margin-bottom:15px;">
  <button onclick="window.print()" style="
    padding:10px 20px;
    font-size:14px;
    font-weight:bold;
    cursor:pointer;
  ">
    Print / Save PDF
  </button>
</div>

    <h1>Season Player Stats</h1>

    <table>
      <thead>
<tr>
  <th style="width:18%;">Player</th>
  <th style="width:7%;">Goals</th>
  <th style="width:7%;">Assists</th>
  <th style="width:7%;">Shots On</th>
  <th style="width:7%;">Shots Off</th>
  <th style="width:7%;">Yellow</th>
  <th style="width:7%;">Red</th>
  <th style="width:7%;">Minutes</th>
  <th style="width:7%;">Starts</th>
  <th style="width:7%;">Sub</th>
  <th style="width:7%;">Unused Sub</th>
  <th style="width:12%;">Total Appearances</th>
</tr>
</thead>

      ${rows}

  <tr style="font-weight:900; background:#bfbfbf; font-size:12px;">
  <td style="padding:10px 6px;">TOTAL</td>
  <td style="padding:10px 6px;">${totals.goals}</td>
  <td style="padding:10px 6px;">${totals.assists}</td>
  <td style="padding:10px 6px;">${totals.shotsOn}</td>
  <td style="padding:10px 6px;">${totals.shotsOff}</td>
  <td style="padding:10px 6px;">${totals.yellow}</td>
  <td style="padding:10px 6px;">${totals.red}</td>
  <td style="padding:10px 6px;">${totals.minutes}</td>
  <td style="padding:10px 6px;">
  ${players.reduce((sum, player) =>
    sum + (seasonStats[player].starts || 0), 0)}
</td>

<td style="padding:10px 6px;">
  ${players.reduce((sum, player) =>
    sum + (seasonStats[player].subApps || 0), 0)}
</td>

<td style="padding:10px 6px;">
  ${players.reduce((sum, player) =>
    sum + (seasonStats[player].unusedSubs || 0), 0)}
</td>

<td style="padding:10px 6px;">
  ${players.reduce((sum, player) =>
    sum +
    ((seasonStats[player].starts || 0) +
     (seasonStats[player].subApps || 0)), 0)}
</td>
</tr>

    </table>

  </body>
  </html>
  `;

  w.document.write(html);
  w.document.close();
}
function showMatchLog(){

  if(matchLog.length === 0){
    alert("No matches recorded yet");
    return;
  }

  let w = window.open("", "_blank");

  let rows = "";

  let wins = 0;
let draws = 0;
let losses = 0;

let gf = 0;
let ga = 0;

matchLog.forEach(m => {

  // RESULT
  if(m.berwick.goals > m.opp.goals) wins++;
  else if(m.berwick.goals < m.opp.goals) losses++;
  else draws++;

  // GOALS
  gf += m.berwick.goals;
  ga += m.opp.goals;

});

  matchLog.forEach(m => {

    // RESULT
    let result = "";
    if(m.berwick.goals > m.opp.goals) result = "✅ W";
    else if(m.berwick.goals < m.opp.goals) result = "❌ L";
    else result = "🤝 D";

    // TOTAL SHOTS
    let shotsB = (m.berwick.on || 0) + (m.berwick.off || 0);
    let shotsO = (m.opp.on || 0) + (m.opp.off || 0);

    // INSIGHT
    let insight = "Even game";
    if(shotsB > shotsO + 5) insight = "Dominant";
    else if(shotsO > shotsB + 5) insight = "Outplayed";

    rows += `
      <tr>
        <td>${m.date}</td>
        <td>${m.opponent}</td>
        <td>${m.venue || ""}</td>
        <td>${result} ${m.berwick.goals}-${m.opp.goals}</td>
        <td>${shotsB}-${shotsO}</td>
        <td>${m.berwick.on || 0}-${m.opp.on || 0}</td>
        <td>${m.berwick.corners || 0}-${m.opp.corners || 0}</td>
        <td>${m.berwick.yellow || 0}-${m.opp.yellow || 0}</td>
        <td>${insight}</td>
      </tr>
    `;
  });

  let html = `
  <html>
  <head>
    <title>Season Match Log</title>
    <style>
      body { font-family: Arial; padding:20px; }

      h1 { text-align:center; }

      table {
        width:100%;
        border-collapse: collapse;
        margin-top:15px;
        font-size:12px;
      }

      th {
        background:#c4c4c4;
        padding:8px;
      }

      td {
        border:1px solid #ccc;
        padding:6px;
        text-align:center;
      }

      tr:nth-child(even){
        background:#f9f9f9;
      }

      @media print {
        button { display:none; }
      }
    </style>
  </head>

  <body>

  <div style="text-align:center;">
    <button onclick="window.print()">Print</button>
  </div>

  <h1>Season Match Log</h1>

  <div style="
  text-align:center;
  font-weight:bold;
  margin-bottom:12px;
  font-size:18px;
">

  <span style="margin:0 12px; color:#16a34a;">
    Wins: ${wins}
  </span>

  <span style="margin:0 12px; color:#f59e0b;">
    Draws: ${draws}
  </span>

  <span style="margin:0 12px; color:#dc2626;">
    Losses: ${losses}
  </span>

  <br>

  <span style="font-size:16px; color:#333;">
    Goals: ${gf} – ${ga}
  </span>

</div>

  <table>
    <tr>
      <th>Date</th>
      <th>Opponent</th>
      <th>Venue</th>
      <th>Result</th>
      <th>Shots (B-O)</th>
      <th>On Target (B-O)</th>
      <th>Corners</th>
      <th>Cards</th>
      <th>Insight</th>
    </tr>

    ${rows}

  </table>

  </body>
  </html>
  `;

  w.document.write(html);
  w.document.close();
}

