// DOWNLOAD APP ON MOBILE
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service Worker enregistré"))
      .catch((err) => console.log("Erreur SW:", err));
  });
}

import { getCurrentDate } from "./utils/getCurrentDate.js";
import { getCurrentWeek } from "./utils/getCurrentWeek.js";

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

const setState = (newState) => {
  const updatedState = {
    ...state,
    ...newState,
  };

  state.days = updatedState.days;

  localStorage.setItem("days", JSON.stringify(state.days));

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
          start: now,
          end: "",
          amplitude: "",
          isFinished: false,
          type: "work",
          detail: "Prise de service",
        },
      ],
    },
  ];

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
            end: now,
            amplitude: toHHMM(calcAmp(data.start, now)),
            isFinished: true,
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
};

// LES FONCTIONS DE DATAS
const getTime = () => {
  const time = new Date();

  let hours = time.getHours();
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();

  // Ajoute 0 si les heures/minutes < 10
  hours = pad(hours);
  minutes = pad(minutes);
  seconds = pad(seconds);

  const startOfDay = `${hours}:${minutes}:${seconds}`;

  return startOfDay;
};
const calcAmp = (startData, endData) => {
  const start = toMinutes(startData.slice(0, 5));
  const end = toMinutes(endData.slice(0, 5));

  return end - start;
};
const getTotalsByType = (datas) => {
  const totals = {
    work: 0,
    waiting: 0,
    rest: 0,
  };

  datas.forEach((data) => {
    if (!data.isFinished) return;

    const minutes = toMinutes(data.amplitude);

    totals[data.type] += minutes;
  });

  // conversion finale en HH:MM
  Object.keys(totals).forEach((type) => {
    totals[type] = toHHMM(totals[type]);
  });

  return totals;
};

// LES FONCTIONS DE FORMATAGE DE DATAS
const pad = (num) => {
  return num.toString().padStart(2, "0");
};
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);

  return h * 60 + m;
};
const toHHMM = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return `${pad(h)}:${pad(m)}`;
};

// LE CHRONOMETRE
let chronoInterval = null;
const updateChrono = (array) => {
  // chronometre
  const arrayStart = array.split(":");
  const startHour = Number(arrayStart[0]);
  const startMinute = Number(arrayStart[1]);
  const startSecond = Number(arrayStart[2]);

  // config heure de départ
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

// LE RENDER
const render = () => {
  const today = new Date().toLocaleDateString("fr-FR");

  const currentDay = state.days.find((day) => day.date === today);
  // on cherche si il y a une journée en cours
  const activeDay = state.days.find((day) => !day.isFinished);

  // JOURNAL DE LA JOURNEE
  // si currentDay existe
  if (currentDay) {
    // les btn prennent le state correspondant (attribués lors des click)
    getStateBtns(currentDay.state);

    // on affiche l'heure de début de service (sans les secondes)
    startTime.textContent = currentDay.start.slice(0, 5).replace(":", "h");

    // Mécanique du chronometre
    if (!chronoInterval) {
      chronoInterval = setInterval(() => {
        updateChrono(currentDay.start);
      }, 1000);
    }
    updateChrono(currentDay.start);

    // affichage du journal de la journée
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
      if (data.end === "") {
        endSpan.textContent = "--:--";
      } else {
        endSpan.textContent = data.end.slice(0, 5).replace(":", "h");
      }

      li.appendChild(detailSpan);
      startAndEndSpan.appendChild(startSpan);
      startAndEndSpan.appendChild(endSpan);
      li.appendChild(startAndEndSpan);
      fragmentDetail.appendChild(li);
    });

    detailOfActivities.appendChild(fragmentDetail);
  }

  // RESUME DE LA JOURNEE
  // si il n'y a plus de journée en cours
  if (!activeDay) {
    if (currentDay) {
      msgEndOfDay.classList.add("showEndOfDay");
      hidden.classList.remove("hidden");
      startTime.textContent = "00:00";
      clearInterval(chronoInterval);
      chronoInterval = null;
      currentAmplitude.textContent = "00:00:00";

      // affichage du résumé de la journée
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
  }
};

// EVENTS LISTENER
startBtn.addEventListener("click", () => {
  getStateBtns("work");
  addDay();
});
workBtn.addEventListener("click", () => {
  getStateBtns("work");
  addData("work", "Reprise conduite/travail");
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

currentDate.textContent = getCurrentDate();
getStateBtns("start");
render();
