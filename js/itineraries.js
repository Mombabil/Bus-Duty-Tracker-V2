// =========================================================
// 🚌 BUS APP - VERSION AVEC ICÔNES PRO
// =========================================================

// -----------------------------
// 📍 DÉPÔT
// -----------------------------
const DEPOT = {
  name: "Dépôt Montbrison",
  coords: [45.6073, 4.0627],
};

// -----------------------------
// 🎨 ICÔNES LEAFLET
// -----------------------------
const depotIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/484/484167.png",
  iconSize: [32, 32],
});

const stopIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61168.png",
  iconSize: [30, 30],
});

const waypointIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/565/565547.png",
  iconSize: [26, 26],
});

const busIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61168.png",
  iconSize: [36, 36],
});

// -----------------------------
// 🌍 CARTE
// -----------------------------
const map = L.map("map", {
  center: DEPOT.coords,
  zoom: 14,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// 📍 marker dépôt
L.marker(DEPOT.coords, { icon: depotIcon })
  .addTo(map)
  .bindPopup("🏠 Dépôt Montbrison");

// -----------------------------
// 🧭 ROUTING
// -----------------------------
const control = L.Routing.control({
  waypoints: [],
  routeWhileDragging: true,
  draggableWaypoints: true,
  addWaypoints: true,
  show: false,
  fitSelectedRoutes: false,
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
// 📍 AJOUT POINT (STOP / WAYPOINT)
// =========================================================
map.on("click", (e) => {
  if (!currentRouteData) {
    currentRouteData = { points: [] };
  }

  const type = prompt("Type : stop / waypoint");
  if (type !== "stop" && type !== "waypoint") return;

  let name = null;

  if (type === "stop") {
    name = prompt("Nom de l'arrêt ?");
    if (!name) return;
  }

  const point = {
    id: crypto.randomUUID(),
    type,
    name,
    lat: e.latlng.lat,
    lng: e.latlng.lng,
  };

  currentRouteData.points.push(point);

  const waypoints = control
    .getWaypoints()
    .filter((wp) => wp.latLng)
    .map((wp) => wp.latLng);

  waypoints.push(e.latlng);
  control.setWaypoints(waypoints);

  renderPoint(point, e.latlng);
});

// =========================================================
// 🎨 AFFICHAGE POINTS
// =========================================================
function renderPoint(point, latlng) {
  let icon;

  if (point.type === "stop") {
    icon = stopIcon;
  } else {
    icon = waypointIcon;
  }

  L.marker(latlng, { icon }).addTo(map).bindPopup(`
      <strong>${point.type.toUpperCase()}</strong><br>
      ${point.name || "Passage"}<br>
      ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}
    `);
}

// =========================================================
// 📊 ROUTE CALCUL
// =========================================================
control.on("routesfound", (e) => {
  const route = e.routes[0];

  const distance = route.summary.totalDistance / 1000;
  const duration = route.summary.totalTime / 60;

  currentRouteData.distance = distance.toFixed(1);
  currentRouteData.duration = Math.round(duration);

  infoDiv.style.display = "block";
  infoDiv.innerHTML = `
    🚌 ${distance.toFixed(1)} km • ⏱️ ${Math.round(duration)} min
  `;
});

// =========================================================
// 💾 SAUVEGARDE
// =========================================================
document.getElementById("save-route").addEventListener("click", () => {
  const name = document.getElementById("route-name").value.trim();

  if (!name || !currentRouteData?.points?.length) {
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
// 🌍 GOOGLE MAPS
// =========================================================
const GOOGLE_MAX = 10;

function splitPoints(points) {
  const chunks = [];
  for (let i = 0; i < points.length; i += GOOGLE_MAX - 1) {
    chunks.push(points.slice(i, i + GOOGLE_MAX));
  }
  return chunks;
}

function buildGoogleLink(points) {
  const origin = `${points[0].lat},${points[0].lng}`;
  const destination = `${points.at(-1).lat},${points.at(-1).lng}`;

  const waypoints = points
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
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
// 📜 LISTE ITINÉRAIRES
// =========================================================
function loadRoutes() {
  const container = document.getElementById("routes-list");
  const routes = JSON.parse(localStorage.getItem("routes")) || [];

  container.innerHTML = "";

  routes.forEach((route) => {
    const div = document.createElement("div");
    div.className = "route-item";

    const points = route.points || [];

    const stops = points.filter((p) => p.type === "stop");
    const chunks = splitPoints(points);

    div.innerHTML = `
      <h3>${route.name}</h3>
      <p>🚌 ${route.distance} km • ⏱️ ${route.duration} min</p>
      <p class="route-item-stops">🟢 ${stops.length} arrêts / ⚫ ${points.length - stops.length} passages <button id="showDetail">Détail</button></p>
      <ul id="routeItemDetail">${
        stops
          .map(
            (s) =>
              `
            <li>
            🛑 ${s.name}
            </li>
            `,
          )
          .join("") || "Aucun"
      }</ul>
    `;
    // -----------------------------
    // 🌍 GOOGLE MAPS BUTTONS
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
    // 🗺 CHARGER ITINÉRAIRE
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

  showDetail.addEventListener("click", () => {
    routeItemDetail.classList.toggle("show-route-item-detail");
  });
}

// =========================================================
// 🧭 CHARGER ITINÉRAIRE
// =========================================================
function loadRoute(route) {
  const points = route.points || [];

  const waypoints = points.map((p) => L.latLng(p.lat, p.lng));

  control.setWaypoints(waypoints);

  currentRouteData = {
    ...route,
    points,
  };

  if (points.length > 0) {
    map.setView([points[0].lat, points[0].lng], 15);
  }
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
