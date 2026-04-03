if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service Worker enregistré"))
      .catch((err) => console.log("Erreur SW:", err));
  });
}

// recupere le nom du jour en lettre
import { getNameOfDayFromDate } from "./utils/getNameOfDayFromDate.js";
import { getCurrentWeek } from "./utils/getCurrentWeek.js";

const daysContainer = document.querySelector(".daysContainer");
const currentDate = document.getElementById("currentDate");

// LE STATE
const state = { days: [] };

const setState = (newState) => {
  const updatedState = {
    ...state,
    ...newState,
  };

  state.days = updatedState.days;

  localStorage.setItem("days", JSON.stringify(state.days));

  render();
};

// on recupere le numero de la semaine en cours
const today = new Date();
const currentWeek = getCurrentWeek(today);

// SELECTION DE LA SEMAINE A AFFICHER
const getWeek = (st) => {
  const weeks = st.days.map((day) => day.week);
  return [...new Set(weeks)]; // renvoie seulement les semaines uniques
};
const createListOfWeeks = (defaultWeek) => {
  currentDate.innerHTML = "";

  const listOfWeek = getWeek(state);

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
const timeToPercent = (hours, minutes) => {
  const totalMinutes = hours * 60 + minutes;

  return Math.floor((totalMinutes / (24 * 60)) * 100);
};
const convertStrToNum = (str) => {
  const result = str.slice(0, 5).split(":").map(Number);

  const hours = result[0];
  const minutes = result[1];

  return timeToPercent(hours, minutes);
};
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

  // ----- PARTIE CONCERNE PAR L'EDIT DE DATAS -----

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

    // const h3 = document.createElement("h3");
    // h3.textContent = data.type;

    detailTitle.appendChild(color);
    // detailTitle.appendChild(h3);

    type.appendChild(detailTitle);

    const detailDescr = document.createElement("p");
    detailDescr.textContent = data.detail;

    type.appendChild(detailDescr);

    const time = document.createElement("p");
    time.classList.add("time");
    time.dataset.id = data.id;
    time.innerHTML = `${data.start.slice(0, 5).replace(":", "h")} - ${data.end.slice(0, 5).replace(":", "h")}`;

    type.appendChild(time);

    detail.appendChild(type);
  });

  // on l'ajoute dans article a la suite de title
  article.appendChild(detail);

  // ----- FIN DE PARTIE CONCERNE PAR L'EDIT DE DATAS -----

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

// LE RENDER
const render = (week) => {
  // on recupere toutes les journées qui ont la même semaine que la semaine en cours
  const daysOfSelectedWeek = state.days.filter((day) => day.week === week);

  createListOfWeeks(currentWeek);

  daysContainer.innerHTML = "";

  const fragmentDay = document.createDocumentFragment();

  if (daysOfSelectedWeek.length === 0) return;

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
  render(selectedWeek);
});

// INITIALISATION
try {
  const savedDays = localStorage.getItem("days");

  // si le local storage n'est pas vide, on retransforme les données JSON en tableau pour gérer l'affichage
  if (savedDays) {
    state.days = JSON.parse(savedDays);
  }
} catch (error) {
  console.error("Erreur lors du chargement des tâches");
}

render(currentWeek);
