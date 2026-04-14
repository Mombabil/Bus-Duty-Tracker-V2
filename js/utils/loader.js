// LOADER
export function animateLoader() {
  const progress = document.querySelector(".progress");
  const text = document.getElementById("loader-text");

  const steps = [
    { percent: 20, text: "Connexion au serveur..." },
    { percent: 50, text: "Le moteur démarre..." },
    { percent: 80, text: "Préparation de la journée..." },
  ];

  steps.forEach((step, i) => {
    setTimeout(() => {
      progress.style.width = step.percent + "%";
      text.textContent = step.text;
    }, i * 1000);
  });

  // 🔥 gestion Render (cold start)
  setTimeout(() => {
    text.textContent = "Démarrage du serveur (quelques secondes)...";
  }, 3000);
}

export const finishLoader = () => {
  const progress = document.querySelector(".progress");
  const text = document.getElementById("loader-text");

  progress.style.width = "100%";
  text.textContent = "Prêt !";

  setTimeout(() => {
    document.getElementById("loader").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
  }, 500);
};

export const loaderError = () => {
  const text = document.getElementById("loader-text");
  text.textContent = "Erreur de connexion...";
};
