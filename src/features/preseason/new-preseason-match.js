// ============================================================
// MATCHTRACKER — NEW PRE SEASON MATCH
// ============================================================
// Creates the setup screen for a new Pre Season match.
//
// This feature is responsible for the UI only.
// Match creation is handled by:
//   MatchTrackerPreSeasonService
//
// Match structure is handled by:
//   MatchTrackerMatchModel
// ============================================================

(function () {

  "use strict";


  const COLORS = {

    navy: "#1E3A5F",

    blueGreen: "#3F7D70",

    lightGrey: "#F1F4F6",

    darkText: "#243447",

    white: "#FFFFFF",

    silver: "#B8C2CC"

  };


  let callbacks = {

    onCreated: null,

    onCancel: null

  };


  // ----------------------------------------------------------
  // INITIALISE
  // ----------------------------------------------------------

  function init(options = {}) {

    callbacks.onCreated =
      typeof options.onCreated === "function"
        ? options.onCreated
        : null;


    callbacks.onCancel =
      typeof options.onCancel === "function"
        ? options.onCancel
        : null;

  }


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  function render(container) {

    if (!container) {

      console.error(
        "MatchTrackerNewPreSeasonMatch: container not found."
      );

      return;

    }


    container.innerHTML = "";


    container.style.background =
      COLORS.lightGrey;

    container.style.color =
      COLORS.darkText;

    container.style.minHeight =
      "100vh";

    container.style.boxSizing =
      "border-box";

    container.style.padding =
      "20px";

      container.style.display =
  "flex";

container.style.flexDirection =
  "column";

container.style.alignItems =
  "center";


    // --------------------------------------------------------
    // HEADER
    // --------------------------------------------------------

    const header =
      document.createElement("div");


    header.style.background =
      COLORS.navy;

    header.style.color =
      COLORS.white;

    header.style.borderRadius =
      "18px";

    header.style.padding =
      "22px 20px";

    header.style.marginBottom =
      "20px";

    header.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.08)";

      header.style.width =
  "100%";

header.style.maxWidth =
  "650px";

header.style.boxSizing =
  "border-box";


    header.innerHTML = `

      <div style="
        font-size:13px;
        font-weight:700;
        letter-spacing:2px;
        opacity:0.75;
        margin-bottom:6px;
      ">
        PRE SEASON
      </div>

      <div style="
        font-size:28px;
        font-weight:800;
        line-height:1.15;
      ">
        New Match
      </div>

      <div style="
        font-size:14px;
        margin-top:8px;
        opacity:0.85;
      ">
        Set up the match before selecting your squad.
      </div>

    `;


    container.appendChild(header);


    // --------------------------------------------------------
    // FORM CARD
    // --------------------------------------------------------

    const formCard =
      document.createElement("div");


    formCard.style.background =
      COLORS.white;

    formCard.style.borderRadius =
      "18px";

    formCard.style.padding =
      "20px";

    formCard.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.07)";

      formCard.style.width =
  "100%";

formCard.style.maxWidth =
  "650px";

formCard.style.boxSizing =
  "border-box";


    container.appendChild(formCard);


    // --------------------------------------------------------
    // OPPONENT
    // --------------------------------------------------------

    const opponentInput =
      createInputField({

        label: "Opponent",

        placeholder:
          "Enter opponent name",

        type:
          "text"

      });


    formCard.appendChild(
      opponentInput.wrapper
    );


    // --------------------------------------------------------
    // DATE
    // --------------------------------------------------------

    const dateInput =
      createInputField({

        label: "Match Date",

        placeholder:
          "",

        type:
          "date"

      });


    formCard.appendChild(
      dateInput.wrapper
    );

    // --------------------------------------------------------
// KICK OFF TIME
// --------------------------------------------------------
const kickOffInput =
  createTimeSelector({
    label:
      "Kick Off Time"
  });

formCard.appendChild(
  kickOffInput.wrapper
);


    // --------------------------------------------------------
    // VENUE
    // --------------------------------------------------------

    const venueInput =
      createInputField({

        label: "Venue",

        placeholder:
          "Enter venue",

        type:
          "text"

      });


    formCard.appendChild(
      venueInput.wrapper
    );


    // --------------------------------------------------------
    // MATCH FORMAT
    // --------------------------------------------------------

    const formatField =
      createSelectField({

        label:
          "Match Format",

        options: [

          {
            value: "7-a-side",
            label: "7-a-side"
          },

          {
            value: "9-a-side",
            label: "9-a-side"
          },

          {
            value: "11-a-side",
            label: "11-a-side"
          }

        ]

      });


    formCard.appendChild(
      formatField.wrapper
    );


    // --------------------------------------------------------
    // MATCH LENGTH
    // --------------------------------------------------------

    const lengthInput =
      createInputField({

        label:
          "Match Length (minutes)",

        placeholder:
          "e.g. 80",

        type:
          "number"

      });


    lengthInput.input.min =
      "1";

    lengthInput.input.inputMode =
      "numeric";


    formCard.appendChild(
      lengthInput.wrapper
    );


    // --------------------------------------------------------
    // BUTTON AREA
    // --------------------------------------------------------

    const buttonArea =
      document.createElement("div");


    buttonArea.style.marginTop =
      "24px";


    // --------------------------------------------------------
    // CREATE BUTTON
    // --------------------------------------------------------

    const createButton =
      document.createElement("button");


    createButton.type =
      "button";

    createButton.innerText =
      "Create Match";


    stylePrimaryButton(
      createButton
    );


    createButton.onclick =
      function () {

        const opponent =
          opponentInput.input.value.trim();


        const date =
          dateInput.input.value;

        const kickOff =
          kickOffInput.getValue();

        const venue =
          venueInput.input.value.trim();


        const matchFormat =
          formatField.input.value;


        const matchLength =
          lengthInput.input.value;


        if (!opponent) {

          alert(
            "Please enter the opponent."
          );

          opponentInput.input.focus();

          return;

        }


        if (!date) {

          alert(
            "Please select the match date."
          );

          dateInput.input.focus();

          return;

        }

                if (!kickOff) {

          alert(
            "Please enter the kick off time."
          );

          return;

        }

        if (!matchLength) {

          alert(
            "Please enter the match length."
          );

          lengthInput.input.focus();

          return;

        }


        if (
          !window.MatchTrackerPreSeasonService
        ) {

          alert(
            "Pre Season Match Service is not available."
          );

          console.error(
            "MatchTrackerNewPreSeasonMatch: " +
            "Pre Season Match Service not available."
          );

          return;

        }


        const match =
        window.MatchTrackerPreSeasonService.createMatch({

            opponent:
              opponent,

            date:
              date,

            kickOff:
              kickOff,

            venue:
              venue,

            matchFormat:
              matchFormat,

            matchLength:
              Number(matchLength)

          });


        if (!match) {

          alert(
            "The match could not be created."
          );

          return;

        }


        if (callbacks.onCreated) {

          callbacks.onCreated(
            match
          );

        }

      };


    buttonArea.appendChild(
      createButton
    );


    // --------------------------------------------------------
    // CANCEL BUTTON
    // --------------------------------------------------------

    const cancelButton =
      document.createElement("button");


    cancelButton.type =
      "button";

    cancelButton.innerText =
      "Cancel";


    styleSecondaryButton(
      cancelButton
    );


    cancelButton.onclick =
      function () {

        if (callbacks.onCancel) {

          callbacks.onCancel();

        }

      };


    buttonArea.appendChild(
      cancelButton
    );


    formCard.appendChild(
      buttonArea
    );

  }

// --------------------------------------------------------
// TIME SELECTOR
// --------------------------------------------------------
function createTimeSelector(options = {}) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "mt-field";

  const label =
    document.createElement("label");

  label.textContent =
    options.label ||
    "Kick Off Time";

    label.style.display =
  "block";

label.style.fontSize =
  "14px";

label.style.fontWeight =
  "800";

label.style.marginBottom =
  "7px";

label.style.color =
  COLORS.darkText;

label.style.textAlign =
  "left";

  wrapper.appendChild(
    label
  );

  const row =
    document.createElement("div");

  row.style.display =
    "flex";

  row.style.gap =
    "8px";

  row.style.alignItems =
    "center";

  function makeSelect() {

    const select =
      document.createElement("select");

    select.style.flex =
      "1";

    select.style.height =
      "48px";

    select.style.borderRadius =
      "10px";

    select.style.border =
      "1px solid #D7DEE5";

    select.style.background =
      "#FFFFFF";

    select.style.padding =
      "0 12px";

    select.style.fontSize =
      "16px";

    select.style.color =
      "#243447";

    return select;
  }

  const hourSelect =
    makeSelect();

  for (
    let hour = 1;
    hour <= 12;
    hour++
  ) {

    const option =
      document.createElement("option");

    option.value =
      String(hour);

    option.textContent =
      String(hour);

    hourSelect.appendChild(
      option
    );
  }

  const minuteSelect =
    makeSelect();

  for (
    let minute = 0;
    minute < 60;
    minute++
  ) {

    const option =
      document.createElement("option");

    const value =
      String(minute)
        .padStart(2, "0");

    option.value =
      value;

    option.textContent =
      value;

    minuteSelect.appendChild(
      option
    );
  }

  const periodSelect =
    makeSelect();

  ["AM", "PM"].forEach(
    period => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        period;

      option.textContent =
        period;

      periodSelect.appendChild(
        option
      );
    }
  );

  row.appendChild(
    hourSelect
  );

  const colon =
    document.createElement("span");

  colon.textContent =
    ":";

  colon.style.fontSize =
    "20px";

  colon.style.fontWeight =
    "600";

  row.appendChild(
    colon
  );

  row.appendChild(
    minuteSelect
  );

  row.appendChild(
    periodSelect
  );

  wrapper.appendChild(
    row
  );

  return {
    wrapper,

    getValue() {

  const hour =
    hourSelect.value;

  const minute =
    minuteSelect.value;

  const period =
    periodSelect.value;

  return (
    hour +
    ":" +
    minute +
    " " +
    period
  );
}
  };
}


  // ----------------------------------------------------------
  // INPUT FIELD
  // ----------------------------------------------------------

  function createInputField(options) {

    const wrapper =
      document.createElement("div");


    wrapper.style.marginBottom =
      "18px";


    const label =
      document.createElement("label");


    label.innerText =
      options.label;


    label.style.display =
      "block";

    label.style.fontSize =
      "14px";

    label.style.fontWeight =
      "800";

    label.style.marginBottom =
      "7px";

    label.style.color =
      COLORS.darkText;


    const input =
      document.createElement("input");


    input.type =
      options.type ||
      "text";


    input.placeholder =
      options.placeholder ||
      "";


    input.style.width =
      "100%";

    input.style.minHeight =
      "50px";

    input.style.boxSizing =
      "border-box";

    input.style.padding =
      "12px 14px";

    input.style.border =
      "1px solid " +
      COLORS.silver;

    input.style.borderRadius =
      "12px";

    input.style.background =
      COLORS.white;

    input.style.color =
      COLORS.darkText;

    input.style.fontSize =
      "16px";


    wrapper.appendChild(
      label
    );

    wrapper.appendChild(
      input
    );


    return {

      wrapper:
        wrapper,

      input:
        input

    };

  }


  // ----------------------------------------------------------
  // SELECT FIELD
  // ----------------------------------------------------------

  function createSelectField(options) {

    const wrapper =
      document.createElement("div");


    wrapper.style.marginBottom =
      "18px";


    const label =
      document.createElement("label");


    label.innerText =
      options.label;


    label.style.display =
      "block";

    label.style.fontSize =
      "14px";

    label.style.fontWeight =
      "800";

    label.style.marginBottom =
      "7px";


    const input =
      document.createElement("select");


    input.style.width =
      "100%";

    input.style.minHeight =
      "50px";

    input.style.boxSizing =
      "border-box";

    input.style.padding =
      "12px 14px";

    input.style.border =
      "1px solid " +
      COLORS.silver;

    input.style.borderRadius =
      "12px";

    input.style.background =
      COLORS.white;

    input.style.color =
      COLORS.darkText;

    input.style.fontSize =
      "16px";


    (options.options || [])
      .forEach(function (option) {

        const optionElement =
          document.createElement("option");


        optionElement.value =
          option.value;

        optionElement.innerText =
          option.label;


        input.appendChild(
          optionElement
        );

      });


    wrapper.appendChild(
      label
    );

    wrapper.appendChild(
      input
    );


    return {

      wrapper:
        wrapper,

      input:
        input

    };

  }


  // ----------------------------------------------------------
  // PRIMARY BUTTON STYLE
  // ----------------------------------------------------------

  function stylePrimaryButton(button) {

    button.style.width =
      "100%";

    button.style.minHeight =
      "54px";

    button.style.border =
      "none";

    button.style.borderRadius =
      "12px";

    button.style.background =
      COLORS.blueGreen;

    button.style.color =
      COLORS.white;

    button.style.fontSize =
      "17px";

    button.style.fontWeight =
      "800";

    button.style.cursor =
      "pointer";

    button.style.marginBottom =
      "10px";

  }


  // ----------------------------------------------------------
  // SECONDARY BUTTON STYLE
  // ----------------------------------------------------------

  function styleSecondaryButton(button) {

    button.style.width =
      "100%";

    button.style.minHeight =
      "50px";

    button.style.border =
      "1px solid " +
      COLORS.silver;

    button.style.borderRadius =
      "12px";

    button.style.background =
      COLORS.white;

    button.style.color =
      COLORS.darkText;

    button.style.fontSize =
      "16px";

    button.style.fontWeight =
      "700";

    button.style.cursor =
      "pointer";

  }


  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  window.MatchTrackerNewPreSeasonMatch = {

    init:
      init,

    render:
      render

  };


})();