// =========================================================
// 🗺️ BUS DUTY TRACKER - VERSION PROPRE SIMPLIFIÉE
// =========================================================

// -----------------------------
// 🌍 CARTE
// -----------------------------
const DEPOT = [45.59528, 4.0914];

const map = L.map("map", {
  center: DEPOT,
  zoom: 13,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

L.marker(DEPOT).addTo(map).bindPopup("📍 Dépôt Montbrison");

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// -----------------------------
// 🧭 ROUTING
// -----------------------------
const control = L.Routing.control({
  waypoints: [],
  routeWhileDragging: true,
  draggableWaypoints: true,
  addWaypoints: true,
  show: false,
  router: L.Routing.osrmv1({
    serviceUrl: "https://router.project-osrm.org/route/v1",
  }),
}).addTo(map);

// -----------------------------
// 📦 STATE GLOBAL
// -----------------------------
let currentRouteData = null;

const infoDiv = document.getElementById("route-info");

// =========================================================
// 📍 AJOUT ARRÊTS
// =========================================================
map.on("click", (e) => {
  if (!currentRouteData) {
    currentRouteData = { stops: [] };
  }

  const name = prompt("Nom de l'arrêt ?");
  if (!name) return;

  const stop = {
    id: crypto.randomUUID(),
    name,
    lat: e.latlng.lat,
    lng: e.latlng.lng,
  };

  currentRouteData.stops.push(stop);

  const waypoints = control
    .getWaypoints()
    .filter((wp) => wp.latLng)
    .map((wp) => wp.latLng);

  waypoints.push(e.latlng);
  control.setWaypoints(waypoints);
});

// =========================================================
// 📊 CALCUL ROUTE
// =========================================================
control.on("routesfound", (e) => {
  const route = e.routes[0];

  const distance = route.summary.totalDistance / 1000;
  const duration = route.summary.totalTime / 60;

  currentRouteData.distance = distance.toFixed(1);
  currentRouteData.duration = Math.round(duration);

  infoDiv.style.display = "block";
  infoDiv.innerHTML = `
    🚗 ${distance.toFixed(1)} km • ⏱️ ${Math.round(duration)} min
  `;
});

// =========================================================
// 💾 SAUVEGARDE
// =========================================================
document.getElementById("save-route").addEventListener("click", () => {
  const name = document.getElementById("route-name").value.trim();

  if (!name || !currentRouteData?.stops?.length) {
    alert("Nom ou itinéraire invalide");
    return;
  }

  const routes = JSON.parse(localStorage.getItem("routes")) || [];

  routes.push({
    id: Date.now(),
    name,
    ...currentRouteData,
  });

  localStorage.setItem("routes", JSON.stringify(routes));

  document.getElementById("route-name").value = "";
  loadRoutes();
});

// =========================================================
// 🧭 GOOGLE MAPS HELPERS
// =========================================================
const GOOGLE_MAX = 10;

function splitStops(stops) {
  const chunks = [];
  for (let i = 0; i < stops.length; i += GOOGLE_MAX - 1) {
    chunks.push(stops.slice(i, i + GOOGLE_MAX));
  }
  return chunks;
}

function buildGoogleLink(stops) {
  const origin = `${stops[0].lat},${stops[0].lng}`;
  const destination = `${stops.at(-1).lat},${stops.at(-1).lng}`;

  const waypoints = stops
    .slice(1, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join("|");

  let url = `https://www.google.com/maps/dir/?api=1`;
  url += `&origin=${origin}`;
  url += `&destination=${destination}`;
  url += `&travelmode=driving`;

  if (waypoints.length) {
    url += `&waypoints=${waypoints}`;
  }

  return url;
}

// =========================================================
// 📜 AFFICHAGE ITINÉRAIRES
// =========================================================
function loadRoutes() {
  const container = document.getElementById("routes-list");
  const routes = JSON.parse(localStorage.getItem("routes")) || [];

  container.innerHTML = "";

  routes.forEach((route) => {
    const div = document.createElement("div");
    div.className = "route-item";

    const stops = route.stops || [];
    const chunks = splitStops(stops);

    div.innerHTML = `
      <strong>${route.name}</strong><br>
      🚗 ${route.distance} km • ⏱️ ${route.duration} min<br>
      📍 ${stops.length} arrêts<br>
      🛑 ${stops.map((s) => s.name || "Sans nom").join(" → ")}
    `;

    // -----------------------------
    // 🧭 GOOGLE MAPS BUTTONS
    // -----------------------------
    chunks.forEach((chunk, i) => {
      const btn = document.createElement("button");
      btn.textContent = `📍 Trajet ${i + 1}`;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.open(buildGoogleLink(chunk), "_blank");
      });

      div.appendChild(btn);
    });

    // -----------------------------
    // 🧭 CHARGER SUR CARTE
    // -----------------------------
    div.addEventListener("click", () => loadRoute(route));

    // -----------------------------
    // 🗑 SUPPRESSION
    // -----------------------------
    const del = document.createElement("button");
    del.textContent = "🗑 Supprimer";

    del.addEventListener("click", (e) => {
      e.stopPropagation();

      const updated = routes.filter((r) => r.id !== route.id);
      localStorage.setItem("routes", JSON.stringify(updated));

      loadRoutes();
    });

    div.appendChild(del);

    container.appendChild(div);
  });
}

// =========================================================
// 📥 CHARGER ITINÉRAIRE SUR MAP
// =========================================================
function loadRoute(route) {
  const waypoints = (route.stops || []).map((s) => L.latLng(s.lat, s.lng));

  control.setWaypoints(waypoints);

  currentRouteData = {
    ...route,
    stops: route.stops || [],
  };
}

// =========================================================
// 🔄 RESET
// =========================================================
document.getElementById("reset-route").addEventListener("click", () => {
  control.setWaypoints([]);
  currentRouteData = null;

  infoDiv.innerHTML = "";
  infoDiv.style.display = "none";
});

// =========================================================
// 🚀 INIT
// =========================================================
infoDiv.style.display = "none";
loadRoutes();
