// DOWNLOAD APP ON MOBILE
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => console.log("Service Worker enregistré"))
      .catch((err) => console.log("Erreur SW:", err));
  });
}

import { getCurrentDate } from "./utils/getCurrentDate.js";
import { getCurrentWeek } from "./utils/getCurrentWeek.js";
import {
  pad,
  toHHMM,
  calcAmp,
  getTotalsByType,
} from "./utils/datasFormating.js";
import { fetchDays, saveDay, updateDay } from "../api/daysApi.js";

// SELECTION DES BALISES
const currentDate = document.querySelector(".currentDate");
const startBtn = document.querySelector(".startBtn");
const workBtn = document.querySelector(".workBtn");
const waitingBtn = document.querySelector(".waitingBtn");
const restBtn = document.querySelector(".restBtn");
const endBtn = document.querySelector(".endBtn");
const detailOfActivities = document.querySelector(".detailOfActivities");
const resumeOfActivities = document.querySelector(".resumeOfActivities");
const startTime = document.querySelector(".startTime");
const currentAmplitude = document.querySelector(".currentAmplitude");
const hidden = document.querySelector(".hidden");
const msgEndOfDay = document.querySelector(".endOfDay");

// LE STATE
const state = { days: [] };

// setState MODIFIÉ
const setState = (newState) => {
  const updatedState = {
    ...state,
    ...newState,
  };

  state.days = updatedState.days;

  render();
};

// LES FONCTIONS DE MANIPULATION DU STATE
const addDay = () => {
  const today = new Date();
  const now = getTime();

  const newDay = [
    ...state.days,
    {
      id: Date.now(),
      date: today.toLocaleDateString("fr-FR"),
      week: getCurrentWeek(today),
      start: now,
      end: "",
      amplitude: "",
      isFinished: false,
      state: "work",
      datas: [
        {
          id: Date.now(),
          start: now,
          end: "",
          amplitude: "",
          isFinished: false,
          type: "work",
          detail: "Prise de service",
          isEditing: false,
        },
      ],
    },
  ];

  // on envoie seulement le nouveau jour
  saveDay(newDay[newDay.length - 1]);
  setState({ days: newDay });

  console.log("Render exécuté");
};

const addData = (type, detail) => {
  const newDays = state.days.map((day) => {
    if (day.isFinished) return day;

    const currentData = day.datas.find((data) => !data.isFinished);

    const now = getTime();

    const updateDatas = day.datas.map((data) =>
      data === currentData
        ? {
            ...data,
            id: Date.now(),
            end: now,
            amplitude: toHHMM(calcAmp(data.start, now)),
            isFinished: true,
            isEditing: false,
          }
        : data,
    );

    return {
      ...day,
      state: type,
      datas: [
        ...updateDatas,
        {
          start: getTime(),
          end: "",
          amplitude: "",
          isFinished: false,
          type,
          detail,
        },
      ],
    };
  });

  setState({ days: newDays });

  // sauvegarde uniquement le jour modifié
  const updatedDay = newDays.find((day) => !day.isFinished);
  if (updatedDay) {
    updateDay(updatedDay);
  }
};

const endData = () => {
  const newDays = state.days.map((day) => {
    const currentData = day.datas.find((data) => !data.isFinished);

    const now = getTime();

    const updateDatas = day.datas.map((data) =>
      data === currentData
        ? {
            ...data,
            end: now,
            amplitude: toHHMM(calcAmp(data.start, now)),
            isFinished: true,
            id: Date.now(),
            isEditing: false,
          }
        : data,
    );

    const totals = getTotalsByType(updateDatas);

    return {
      ...day,
      end: now,
      amplitude: toHHMM(calcAmp(day.start, now)),
      datas: [...updateDatas],
      totals,
      isFinished: true,
      state: "end",
    };
  });

  setState({ days: newDays });

  console.log(newDays);

  updateDay(newDays);

  // sauvegarde le jour terminé
  // const finishedDay = newDays.find((day) => day.isFinished);
  // if (finishedDay) {
  //   updateDay(finishedDay);
  // }
};

// LES FONCTIONS DE DATAS
const getTime = () => {
  const time = new Date();

  let hours = time.getHours();
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();

  hours = pad(hours);
  minutes = pad(minutes);
  seconds = pad(seconds);

  const startOfDay = `${hours}:${minutes}:${seconds}`;

  return startOfDay;
};

// LE CHRONOMETRE
let chronoInterval = null;
const updateChrono = (array) => {
  const arrayStart = array.split(":");
  const startHour = Number(arrayStart[0]);
  const startMinute = Number(arrayStart[1]);
  const startSecond = Number(arrayStart[2]);

  let startDateTime = new Date();
  startDateTime.setHours(startHour, startMinute, startSecond, 0);
  const now = new Date();

  let diffMs = now - startDateTime;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  currentAmplitude.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// LES BOUTONS
const getStateBtns = (stateBtns) => {
  let disabledBtns = [];
  let abledBtns = [];

  switch (stateBtns) {
    case "start":
      disabledBtns = [workBtn, waitingBtn, restBtn, endBtn];
      abledBtns = [startBtn];
      break;
    case "work":
      disabledBtns = [startBtn, workBtn];
      abledBtns = [waitingBtn, restBtn, endBtn];
      break;
    case "waiting":
      disabledBtns = [startBtn, waitingBtn, restBtn];
      abledBtns = [workBtn, endBtn];
      break;
    case "rest":
      disabledBtns = [startBtn, waitingBtn, restBtn];
      abledBtns = [workBtn, endBtn];
      break;
    case "end":
      disabledBtns = [startBtn, workBtn, waitingBtn, restBtn, endBtn];
      abledBtns = [];
      break;
    default:
      break;
  }

  disabledBtns.forEach((btn) => {
    btn.disabled = true;
    btn.classList.add("disabled");
  });
  abledBtns.forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("disabled");
  });
};

// LE RENDER (inchangé)
const render = () => {
  const today = new Date().toLocaleDateString("fr-FR");

  const currentDay = state.days.find((day) => day.date === today);
  const activeDay = state.days.find((day) => !day.isFinished);

  if (currentDay) {
    getStateBtns(currentDay.state);
    startTime.textContent = currentDay.start.slice(0, 5).replace(":", "h");

    if (!chronoInterval) {
      chronoInterval = setInterval(() => {
        updateChrono(currentDay.start);
      }, 1000);
    }
    updateChrono(currentDay.start);

    detailOfActivities.innerHTML = "";
    const fragmentDetail = document.createDocumentFragment();

    currentDay.datas.forEach((data) => {
      const li = document.createElement("li");
      const detailSpan = document.createElement("span");
      const startAndEndSpan = document.createElement("div");
      const startSpan = document.createElement("span");
      const endSpan = document.createElement("span");

      detailSpan.textContent = data.detail;
      startSpan.textContent = data.start.slice(0, 5).replace(":", "h");
      endSpan.textContent =
        data.end === "" ? "--:--" : data.end.slice(0, 5).replace(":", "h");

      li.appendChild(detailSpan);
      startAndEndSpan.appendChild(startSpan);
      startAndEndSpan.appendChild(endSpan);
      li.appendChild(startAndEndSpan);
      fragmentDetail.appendChild(li);
    });

    detailOfActivities.appendChild(fragmentDetail);
  }

  if (!activeDay && currentDay) {
    msgEndOfDay.classList.add("showEndOfDay");
    hidden.classList.remove("hidden");
    startTime.textContent = "00:00";
    clearInterval(chronoInterval);
    chronoInterval = null;
    currentAmplitude.textContent = "00:00:00";

    resumeOfActivities.innerHTML = "";
    const fragmentResume = document.createDocumentFragment();

    const summaryConfig = [
      { key: "work", label: "Travail/Conduite" },
      { key: "waiting", label: "Attente sur place" },
      { key: "rest", label: "Repos interservices" },
    ];

    summaryConfig.forEach(({ key, label }) => {
      const li = document.createElement("li");
      const labelSpan = document.createElement("span");
      const valueSpan = document.createElement("span");

      labelSpan.textContent = label;
      const value = currentDay.totals[key] || "00:00";
      valueSpan.textContent = value.replace(":", "h");

      li.appendChild(labelSpan);
      li.appendChild(valueSpan);
      fragmentResume.appendChild(li);
    });

    const amplitudeLi = document.createElement("li");
    const ampLabel = document.createElement("span");
    const ampValue = document.createElement("span");

    ampLabel.textContent = "Amplitude";
    ampValue.textContent = currentDay.amplitude.replace(":", "h");

    amplitudeLi.appendChild(ampLabel);
    amplitudeLi.appendChild(ampValue);
    fragmentResume.appendChild(amplitudeLi);

    resumeOfActivities.appendChild(fragmentResume);
  }
};

// EVENTS LISTENER
startBtn.addEventListener("click", () => {
  getStateBtns("work");
  addDay();
});
workBtn.addEventListener("click", () => {
  getStateBtns("work");
  addData("work", "Conduite/travail");
});
waitingBtn.addEventListener("click", () => {
  getStateBtns("waiting");
  addData("waiting", "Attente sur place");
});
restBtn.addEventListener("click", () => {
  getStateBtns("rest");
  addData("rest", "Repos interservices");
});
endBtn.addEventListener("click", () => {
  getStateBtns("end");
  endData();
});

// INITIALISATION MODIFIÉE
async function init() {
  try {
    const days = await fetchDays();
    state.days = days;
  } catch (error) {
    console.error("Erreur lors du chargement des données");
  }

  currentDate.textContent = getCurrentDate();
  getStateBtns("start");
  render();
}

init();
