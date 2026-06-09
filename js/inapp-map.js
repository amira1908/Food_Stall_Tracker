/* ══════════════════════════════════════
   SOLID ROUTE LINE
   Current Location → Destination
   With Walking Instructions
   ══════════════════════════════════════ */

let osmMap = null;
let osmRouteLayer = null;
let osmUserMarker = null;
let osmStallMarker = null;

function ensureLeafletMap() {
  const mapEl = document.getElementById("google-dir-map");

  if (!mapEl) {
    console.error("Map container #google-dir-map not found");
    return false;
  }

  if (typeof L === "undefined") {
    console.error("Leaflet library not loaded");
    return false;
  }

  if (!osmMap) {
    osmMap = L.map(mapEl, {
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20
    }).addTo(osmMap);
  }

  setTimeout(() => {
    osmMap.invalidateSize();
  }, 100);

  return true;
}

function clearInAppMap() {
  if (osmRouteLayer) osmMap.removeLayer(osmRouteLayer);
  if (osmUserMarker) osmMap.removeLayer(osmUserMarker);
  if (osmStallMarker) osmMap.removeLayer(osmStallMarker);

  osmRouteLayer = null;
  osmUserMarker = null;
  osmStallMarker = null;
}

function setDirectionText(stall, distanceText, walkMinutes) {
  document.getElementById("dir-nav-title").textContent = "To " + stall.name;
  document.getElementById("dir-dest-nm").textContent = stall.name;
  document.getElementById("dir-dist").textContent = distanceText;
  document.getElementById("dir-time").textContent = walkMinutes + " min walk";
}

/* Draw solid Google Maps style line */
function drawSolidRoute(routeLatLng) {
  if (osmRouteLayer) {
    osmMap.removeLayer(osmRouteLayer);
  }

  osmRouteLayer = L.layerGroup().addTo(osmMap);

  // black / dark outline
  L.polyline(routeLatLng, {
    color: "#111111",
    weight: 14,
    opacity: 1,
    lineCap: "round",
    lineJoin: "round"
  }).addTo(osmRouteLayer);

  // purple solid line
  const mainLine = L.polyline(routeLatLng, {
    color: "#3b18ff",
    weight: 9,
    opacity: 1,
    lineCap: "round",
    lineJoin: "round"
  }).addTo(osmRouteLayer);

  return mainLine;
}

/* Straight fallback line from user to destination */
function createStraightLine(userPos, stallPos, steps = 80) {
  const points = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    const lat = userPos[0] + (stallPos[0] - userPos[0]) * t;
    const lng = userPos[1] + (stallPos[1] - userPos[1]) * t;

    points.push([lat, lng]);
  }

  return points;
}

function formatStepDistance(metres) {
  if (!metres && metres !== 0) return "";
  if (metres < 1000) return Math.round(metres) + " m";
  return (metres / 1000).toFixed(1) + " km";
}

function getDirectionIcon(modifier, type) {
  if (type === "arrive") return "📍";
  if (modifier === "left" || modifier === "slight left" || modifier === "sharp left") return "↰";
  if (modifier === "right" || modifier === "slight right" || modifier === "sharp right") return "↱";
  if (modifier === "straight") return "↑";
  return "🚶";
}

function getDirectionText(step) {
  const maneuver = step.maneuver || {};
  const type = maneuver.type || "";
  const modifier = maneuver.modifier || "";
  const roadName = step.name ? " on " + step.name : "";

  if (type === "depart") return "Start walking" + roadName;
  if (type === "arrive") return "Arrive at your destination";

  if (modifier === "left") return "Turn left" + roadName;
  if (modifier === "right") return "Turn right" + roadName;
  if (modifier === "slight left") return "Slight left" + roadName;
  if (modifier === "slight right") return "Slight right" + roadName;
  if (modifier === "sharp left") return "Sharp left" + roadName;
  if (modifier === "sharp right") return "Sharp right" + roadName;
  if (modifier === "straight") return "Walk straight" + roadName;

  return "Continue walking" + roadName;
}

function renderRealWalkingSteps(stall, routeSteps, distanceText, walkMinutes) {
  if (!routeSteps || routeSteps.length === 0) {
    renderFallbackSteps(stall, distanceText, walkMinutes);
    return;
  }

  let html = "";

  routeSteps.forEach((step, index) => {
    const maneuver = step.maneuver || {};
    const icon = getDirectionIcon(maneuver.modifier, maneuver.type);
    const text = getDirectionText(step);
    const distance = formatStepDistance(step.distance);

    html += `
      <div class="step-row">
        <div class="step-n">${icon}</div>
        <div>
          <div class="step-t">${index + 1}. ${text}</div>
          <div class="step-d">${distance}</div>
        </div>
      </div>`;
  });

  document.getElementById("dir-steps").innerHTML = html;
}

function renderFallbackSteps(stall, distanceText, walkMinutes) {
  document.getElementById("dir-steps").innerHTML = `
    <div class="step-row">
      <div class="step-n">🚶</div>
      <div>
        <div class="step-t">1. Start from your current location</div>
        <div class="step-d">Follow the purple line on the map.</div>
      </div>
    </div>

    <div class="step-row">
      <div class="step-n">↑</div>
      <div>
        <div class="step-t">2. Walk straight towards ${esc(stall.name)}</div>
        <div class="step-d">Distance: ${distanceText}</div>
      </div>
    </div>

    <div class="step-row">
      <div class="step-n">📍</div>
      <div>
        <div class="step-t">3. Arrive at ${esc(stall.name)}</div>
        <div class="step-d">Estimated walking time: ${walkMinutes} minutes</div>
      </div>
    </div>`;
}

async function drawInAppRoute(stall) {
  if (!userLat || !userLng) {
    toast ? toast("Enable location first") : alert("Enable location first");
    return;
  }

  if (!stall || !stall.lat || !stall.lng) {
    toast ? toast("Stall location missing") : alert("Stall location missing");
    return;
  }

  const straightDistanceText = calcDist(stall.lat, stall.lng);
  const straightMetres = haversine(userLat, userLng, stall.lat, stall.lng) * 1000;
  const fallbackMinutes = Math.max(1, Math.round(straightMetres / 80));

  setDirectionText(stall, straightDistanceText, fallbackMinutes);

  origGoTo("screen-dir");

  setTimeout(async () => {
    if (!ensureLeafletMap()) {
      document.getElementById("dir-steps").innerHTML = `
        <div class="step-row">
          <div class="step-n">⚠️</div>
          <div>
            <div class="step-t">Map failed to load.</div>
            <div class="step-d">Check Leaflet and internet connection.</div>
          </div>
        </div>`;
      return;
    }

    const userPos = [parseFloat(userLat), parseFloat(userLng)];
    const stallPos = [parseFloat(stall.lat), parseFloat(stall.lng)];

    clearInAppMap();

    osmUserMarker = L.marker(userPos).addTo(osmMap).bindPopup("You");
    osmStallMarker = L.marker(stallPos).addTo(osmMap).bindPopup(stall.name);

    // Draw straight solid line immediately
    const straightLine = createStraightLine(userPos, stallPos, 80);
    const firstLine = drawSolidRoute(straightLine);

    osmMap.fitBounds(firstLine.getBounds(), {
      padding: [40, 40]
    });

    renderFallbackSteps(stall, straightDistanceText, fallbackMinutes);

    // Try to replace with real walking road route
    const routeUrl =
      `https://router.project-osrm.org/route/v1/foot/${userLng},${userLat};${stall.lng},${stall.lat}?overview=full&geometries=geojson&steps=true`;

    try {
      document.getElementById("dir-steps").innerHTML = `
        <div class="step-row">
          <div class="step-n">⏳</div>
          <div>
            <div class="step-t">Loading walking route...</div>
            <div class="step-d">Please wait.</div>
          </div>
        </div>`;

      const res = await fetch(routeUrl);
      if (!res.ok) throw new Error("Route API failed");

      const data = await res.json();
      const route = data.routes && data.routes[0];

      if (!route || !route.geometry || !route.geometry.coordinates) {
        throw new Error("No route found");
      }

      const routeLatLng = route.geometry.coordinates.map(c => [c[1], c[0]]);

      const distanceKm = route.distance / 1000;
      const routeDistanceText =
        distanceKm < 1
          ? Math.round(route.distance) + "m"
          : distanceKm.toFixed(1) + "km";

      const walkMinutes = Math.max(1, Math.round(route.duration / 60));

      setDirectionText(stall, routeDistanceText, walkMinutes);

      const roadLine = drawSolidRoute(routeLatLng);

      osmMap.fitBounds(roadLine.getBounds(), {
        padding: [40, 40]
      });

      const steps =
        route.legs && route.legs[0] && route.legs[0].steps
          ? route.legs[0].steps
          : [];

      renderRealWalkingSteps(stall, steps, routeDistanceText, walkMinutes);

    } catch (err) {
      console.warn("OSRM failed, keeping straight solid line:", err);
    }
  }, 250);
}

function openRealGoogleDirections(stall) {
  drawInAppRoute(stall);
}