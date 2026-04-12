// recupere le nom du jour en lettre
import { getNameOfDayFromDate } from "./utils/getNameOfDayFromDate.js";
import { getCurrentWeek } from "./utils/getCurrentWeek.js";
import {
  convertStrToNum,
  toHHMM,
  calcAmp,
  getTotalsByType,
} from "./utils/datasFormating.js";
// LE STATE (côté serveur)
import { fetchDays, updateDays, deleteDay } from "../api/daysApi.js";

const daysContainer = document.querySelector(".daysContainer");
const currentDate = document.getElementById("currentDate");

// LE STATE (côté front)
const state = { days: [] };

const setState = (newState, updatedDays = []) => {
  const updatedState = {
    ...state,
    ...newState,
  };

  state.days = updatedState.days;

  // on update seulement ce qui est modifié
  updatedDays.forEach((day) => {
    updateDay(day);
  });

  render(Number(currentDate.value));
};

// SELECTION DE LA SEMAINE A AFFICHER
// on recupere le numero de la semaine en cours
const today = new Date();
const currentWeek = getCurrentWeek(today);

const getWeek = (st) => {
  const weeks = st.days.map((day) => day.week);

  // renvoie seulement les semaines uniques
  return [...new Set(weeks)];
};
const createListOfWeeks = (defaultWeek) => {
  currentDate.innerHTML = "";

  const listOfWeek = getWeek(state);

  if (!listOfWeek.includes(defaultWeek)) {
    listOfWeek.push(defaultWeek);
  }

  listOfWeek.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w;
    opt.textContent = w === currentWeek ? w + " (actuelle)" : w;

    if (w === defaultWeek) {
      opt.selected = true;
    }

    currentDate.appendChild(opt);
  });
};

// LA TIMELINE
// on crée une fonction qui transforme une durée d'activité en % pour créer une timeline sur 24h
const createSegment = (type, startTime, endTime) => {
  const width = endTime - startTime;

  const html = `
    <div class="segment ${type}" style="left: ${startTime}%; width: ${width}%;"></div>
  `;
  return html;
};
const generateHours = () => {
  const html = [];
  for (let h = 0; h <= 24; h += 2) {
    const percent = (h / 24) * 100;

    html.push(
      `<span style="left: ${Math.floor(percent)}%;">${h.toString().padStart(2, "0") + "h"}</span>`,
    );
  }
  return html.join("");
};

// LE RECALCUL DES TOTAUX APRES EDIT D'UNE OU PLUSIEURS DATAS
const editData = (dayId, dataId, dataStart, dataEnd) => {
  const newDays = state.days.map((day) => {
    if (day.id != dayId) return day;

    const updateDatas = day.datas.map((d) =>
      d.id === dataId
        ? {
            ...d,
            start: dataStart,
            end: dataEnd,
            amplitude: toHHMM(calcAmp(dataStart, dataEnd)),
            isEditing: false,
          }
        : d,
    );

    const totals = getTotalsByType(updateDatas);
    const amplitude = getDayAmplitude(updateDatas);

    return {
      ...day,
      datas: updateDatas,
      totals,
      amplitude,
    };
  });

  // on ne modifie que la partie du state qu'on veut changer
  const updatedDay = newDays.find((day) => day.id == dayId);

  if (updatedDay) {
    setState({ days: newDays }, [updatedDay]);
  }
};
const getDayAmplitude = (datas) => {
  if (datas.length === 0) return "00:00";

  const starts = datas.map((d) => d.start);
  const ends = datas.map((d) => d.end);

  const minStart = starts.sort()[0];
  const maxEnd = ends.sort().reverse()[0];

  return toHHMM(calcAmp(minStart, maxEnd));
};

// LE RENDER
// .dayRecap dans une fonction pour alléger le render()
const createDayArticle = (day) => {
  // on crée une balise article pour chaque journée
  const article = document.createElement("article");
  article.classList.add("day");

  // .dayTitle
  // on crée les balises du titre
  const title = document.createElement("section");
  title.classList.add("dayTitle");

  // on crée les 2 titres
  const h2 = document.createElement("h2");
  const h3 = document.createElement("h3");

  h2.textContent = `${getNameOfDayFromDate(day.date)} ${day.date.slice(0, 5)}`;
  h3.textContent = `${day.start} - ${day.end}`;

  title.appendChild(h2);
  title.appendChild(h3);

  // on crée la timelineWrapper
  const timelineWrapper = document.createElement("section");
  timelineWrapper.classList.add("timeline-wrapper");
  const timeline = document.createElement("div");
  timeline.classList.add("timeline");

  timeline.innerHTML = `
        ${day.datas
          .map(
            (data) =>
              `
                  ${createSegment(data.type, convertStrToNum(data.start), convertStrToNum(data.end))}
                `,
          )
          .join("")}
        `;

  timelineWrapper.appendChild(timeline);
  title.appendChild(timelineWrapper);

  // on ajoute a la timeline la partie timeline-hours
  const timelineHours = document.createElement("div");
  timelineHours.classList.add("timeline-hours");
  timelineHours.innerHTML = `${generateHours()}`;

  timelineWrapper.appendChild(timelineHours);

  // on ajoute le tout dans article
  article.appendChild(title);

  // .dayDetail
  // on crée les details de la journée
  const detail = document.createElement("section");
  detail.classList.add("dayDetail");

  // on crée chaque detail de la journée
  day.datas.forEach((data) => {
    const type = document.createElement("div");
    type.classList.add("type", `${data.type}`);

    const detailTitle = document.createElement("div");
    detailTitle.classList.add("title");

    const color = document.createElement("div");
    color.classList.add("color", `${data.type}`);

    detailTitle.appendChild(color);

    type.appendChild(detailTitle);

    const detailDescr = document.createElement("p");

    // ----- PARTIE CONCERNE PAR L'EDIT DE DATAS -----
    detailDescr.textContent = data.detail;

    type.appendChild(detailDescr);

    const time = document.createElement("p");
    time.classList.add("time");

    let startTime;
    let endTime;

    if (data.isEditing) {
      startTime = document.createElement("input");
      startTime.type = "time";
      startTime.value = data.start.slice(0, 5);
      startTime.classList.add("editable-start");

      endTime = document.createElement("input");
      endTime.type = "time";
      endTime.value = data.end.slice(0, 5);
      endTime.min = data.start.slice(0, 5);
      endTime.classList.add("editable-end");

      // ajout du bouton de validation
      const submitBtn = document.createElement("button");
      submitBtn.classList.add("editBtn");
      submitBtn.dataset.dayId = day.id;
      submitBtn.dataset.dataId = data.id;
      submitBtn.innerHTML = `
      <<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>`;

      time.appendChild(startTime);
      time.appendChild(endTime);
      time.appendChild(submitBtn);
    } else {
      startTime = document.createElement("span");
      startTime.textContent = data.start.slice(0, 5).replace(":", "h");

      endTime = document.createElement("span");
      endTime.textContent = data.end.slice(0, 5).replace(":", "h");

      // ajout du bouton d'edition
      const editBtn = document.createElement("button");
      editBtn.classList.add("editBtn");
      editBtn.dataset.dayId = day.id;
      editBtn.dataset.dataId = data.id;
      editBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M505 122.9L517.1 135C526.5 144.4 526.5 159.6 517.1 168.9L488 198.1L441.9 152L471 122.9C480.4 113.5 495.6 113.5 504.9 122.9zM273.8 320.2L408 185.9L454.1 232L319.8 366.2C316.9 369.1 313.3 371.2 309.4 372.3L250.9 389L267.6 330.5C268.7 326.6 270.8 323 273.7 320.1zM437.1 89L239.8 286.2C231.1 294.9 224.8 305.6 221.5 317.3L192.9 417.3C190.5 425.7 192.8 434.7 199 440.9C205.2 447.1 214.2 449.4 222.6 447L322.6 418.4C334.4 415 345.1 408.7 353.7 400.1L551 202.9C579.1 174.8 579.1 129.2 551 101.1L538.9 89C510.8 60.9 465.2 60.9 437.1 89zM152 128C103.4 128 64 167.4 64 216L64 488C64 536.6 103.4 576 152 576L424 576C472.6 576 512 536.6 512 488L512 376C512 362.7 501.3 352 488 352C474.7 352 464 362.7 464 376L464 488C464 510.1 446.1 528 424 528L152 528C129.9 528 112 510.1 112 488L112 216C112 193.9 129.9 176 152 176L264 176C277.3 176 288 165.3 288 152C288 138.7 277.3 128 264 128L152 128z"/></svg>`;

      time.appendChild(startTime);
      time.appendChild(endTime);
      time.appendChild(editBtn);
    }

    // dataset (important)
    startTime.dataset.dayId = day.id;
    startTime.dataset.dataId = data.id;
    endTime.dataset.dayId = day.id;
    endTime.dataset.dataId = data.id;

    // ----- FIN DE PARTIE CONCERNE PAR L'EDIT DE DATAS -----

    type.appendChild(time);

    detail.appendChild(type);
  });

  // on l'ajoute dans article a la suite de title
  article.appendChild(detail);

  // .dayRecap
  const recap = document.createElement("section");
  recap.classList.add("dayRecap");

  const ul = document.createElement("ul");

  // config des éléments (🔥 clé de l'amélioration)
  const recapConfig = [
    { label: "Travail", value: day.totals.work, className: "work" },
    { label: "Attente", value: day.totals.waiting, className: "waiting" },
    { label: "Repos", value: day.totals.rest, className: "rest" },
    { label: "Amplitude", value: day.amplitude, className: "amp" },
  ];

  // génération dynamique
  recapConfig.forEach((item) => {
    ul.appendChild(createRecapItem(item.label, item.value, item.className));
  });

  recap.appendChild(ul);
  article.appendChild(recap);

  return article;
};
const createRecapItem = (label, value, className) => {
  const li = document.createElement("li");

  const h3 = document.createElement("h3");
  h3.innerHTML = `<span>${label} : </span>${value.replace(":", "h")}`;

  const timeline = document.createElement("div");
  timeline.classList.add("timeline");

  const bar = document.createElement("div");
  bar.classList.add(className);
  bar.style.width = `${convertStrToNum(value)}%`;

  timeline.appendChild(bar);
  li.appendChild(h3);
  li.appendChild(timeline);

  return li;
};
const render = (week) => {
  // on recupere toutes les journées qui ont la même semaine que la semaine en cours
  const daysOfSelectedWeek = state.days.filter((day) => day.week === week);

  daysContainer.innerHTML = "";

  const fragmentDay = document.createDocumentFragment();

  if (daysOfSelectedWeek.length === 0) {
    const noDaysInSelectedWeek = document.createElement("p");
    noDaysInSelectedWeek.classList.add("noDays");
    noDaysInSelectedWeek.textContent =
      "Vous n'avez pas encore créé de journées dans la semaine " + week;

    fragmentDay.appendChild(noDaysInSelectedWeek);
  }

  daysOfSelectedWeek.forEach((day) => {
    // la journée en cours n'apparait que lorsqu'elle est terminée
    if (day.isFinished) {
      // on ajoute la totalité dans fragmentDay
      fragmentDay.appendChild(createDayArticle(day));
    }
  });

  daysContainer.appendChild(fragmentDay);
};

// LES EVENTS LISTENER
currentDate.addEventListener("change", (e) => {
  const selectedWeek = e.target.value;
  console.log("Nouvelle semaine sélectionnée :", selectedWeek);

  // mettre à jour l'affichage selon la semaine choisie
  render(Number(selectedWeek));
});

// passage du mode lecture au mode edit des datas
daysContainer.addEventListener("click", (e) => {
  const btnEdit = e.target.closest(".editBtn");
  if (!btnEdit) return;

  const day = state.days.find((d) => d.id == btnEdit.dataset.dayId);
  if (!day) return;
  const data = day.datas.find((d) => d.id == btnEdit.dataset.dataId);
  if (!data) return;

  // si on est en train de valider (passage de input -> span)
  if (data.isEditing) {
    const startInput = btnEdit.parentElement.querySelector(
      "input.editable-start",
    );
    const endInput = btnEdit.parentElement.querySelector("input.editable-end");

    if (startInput && endInput) {
      if (endInput.value < startInput.value) {
        // endInput.classList.add("error");
        endInput.setCustomValidity("h début <  h fin");
        endInput.reportValidity();

        return;
      }
      // on met à jour le state avec les nouvelles valeurs
      editData(day.id, data.id, startInput.value, endInput.value);
    }
  }

  data.isEditing = !data.isEditing;

  render(Number(currentDate.value));
});

// INITIALISATION
async function init() {
  try {
    const days = await fetchDays();
    state.days = days;
  } catch (error) {
    console.error("Erreur lors du chargement des données");
  }

  createListOfWeeks(currentWeek);
  render(currentWeek);
}

init();
