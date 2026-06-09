/* Backend bridge for PHP API (XAMPP / localhost)
   Put this script LAST in index.html, after app/search/results/stall JS. */

const API_BASE = "http://localhost/FOOD_STALL_TRACKER/api"; // <-- change folder name if different

let profileImgData = null;

function phpUrl(file) {
  return `${API_BASE}/${file}`;
}

async function postJSON(file, data) {
  const res = await fetch(phpUrl(file), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

async function getJSON(file) {
  const res = await fetch(phpUrl(file));
  return await res.json();
}

function money(value) {
  if (value === null || value === undefined || value === "") return "RM0.00";
  const n = Number(value);
  return Number.isNaN(n) ? String(value) : `RM${n.toFixed(2)}`;
}

function mapStatus(status) {
  return String(status || "CLOSED").toLowerCase().replaceAll(" ", "-");
}

function formatSchedule(schedule) {
  if (!schedule || !schedule.length) return "Hours not available";

  const dayOrder = [
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
    "FRIDAY", "SATURDAY", "SUNDAY"
  ];

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();

  const todaySchedule =
    schedule.find(s => s.operatingDay === today) ||
    schedule.find(s => s.operatingDay === dayOrder[0]);

  if (!todaySchedule) return "Hours not available";

  if (Number(todaySchedule.isClosed) === 1) {
    return "Closed today";
  }

  const open = todaySchedule.openingTime
    ? todaySchedule.openingTime.slice(0, 5)
    : "—";

  const close = todaySchedule.closingTime
    ? todaySchedule.closingTime.slice(0, 5)
    : "—";

  return `${open} - ${close}`;
}

function mapBackendStall(stall) {
  console.log("SCHEDULE:", stall.schedule);
  return {
    id: stall.stallID,
    stallID: stall.stallID,
    name: stall.stallName || "Unnamed Stall",
    ownerEmoji: stall.stallEmoji || "🏪",
    coverImg: stall.stallPicture || null,
    status: mapStatus(stall.stallStatus),
    hours: formatSchedule(stall.schedule || []),
    address: stall.addressDescription || "Address not available",
    lat: stall.latitude ? Number(stall.latitude) : null,
    lng: stall.longitude ? Number(stall.longitude) : null,
    bg: "linear-gradient(135deg,#a0b8c8,#507090)",
    phone: stall.username || "",
    description: stall.stallDescription || "",
    menu: (stall.menu || [])
      .filter(item => item && item.foodID)
      .map(item => ({
        foodID: item.foodID,
        name: item.foodName || "Unnamed item",
        desc: item.foodCategory || "",
        price: money(item.foodPrice),
        rawPrice: item.foodPrice,
        img: item.foodPicture || null,
        status: item.foodStatus || "AVAILABLE"
      }))
  };
}

function getStallById(stallId) {
  return STALLS.find(s => String(s.id) === String(stallId));
}

window.triggerStallPhoto = function () {
  document.getElementById("stall-photo-file").click();
};

window.handleStallPhoto = function (input) {
  const file = input.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    profileImgData = e.target.result;

    document.getElementById("stall-photo-preview").innerHTML = `
      <img src="${profileImgData}" 
        style="width:100%;height:100%;object-fit:cover;border-radius:20px;">
      <div class="photo-preview-ov"><span>📷</span></div>
    `;
  };

  reader.readAsDataURL(file);
};

async function loadStallsFromBackend() {
  try {
    const data = await getJSON("get_stalls.php");
    if (!data.success) throw new Error(data.message || "Failed to load stalls");
    STALLS = (data.stalls || []).map(mapBackendStall);
    if (typeof renderSugs === "function") renderSugs(SUGS);
    if (typeof renderResults === "function") renderResults(STALLS);
  } catch (err) {
    console.error("Backend load failed:", err);
    if (typeof toast === "function") toast("Backend not connected. Using demo data.");
  }
}

async function reloadOwnerStall() {
  if (!ownerAcc) return null;

  const data = await getJSON(`get_stall_detail.php?stallID=${encodeURIComponent(ownerAcc.stallId)}`);

  if (!data.success) {
    throw new Error(data.message || "Failed to load stall detail");
  }

  const updated = mapBackendStall(data.stall);

  const stallEl = document.getElementById("ef-stall");
  if (stallEl) stallEl.value = updated.name || "";

  const ownerEl = document.getElementById("ef-owner");
  if (ownerEl) ownerEl.value = ownerAcc.name || "";

  const phoneEl = document.getElementById("ef-phone");
  if (phoneEl) phoneEl.value = ownerAcc.phone || "";

  const addressEl = document.getElementById("ef-address");
  if (addressEl) addressEl.value = updated.address || "";

  const descEl = document.getElementById("ef-desc");
  if (descEl) descEl.value = updated.description || "";

  const photoEl = document.getElementById("stall-photo-preview");
  if (photoEl) {
    if (updated.coverImg) {
      photoEl.innerHTML = `
        <img src="${updated.coverImg}" 
          style="width:100%;height:100%;object-fit:cover;border-radius:20px;">
        <div class="photo-preview-ov"><span>📷</span></div>
      `;
    } else {
      photoEl.innerHTML = `
        <span id="stall-photo-emoji">🏪</span>
        <div class="photo-preview-ov"><span>📷</span></div>
      `;
    }
  }

  const idx = STALLS.findIndex(s => String(s.id) === String(updated.id));

  if (idx >= 0) {
    STALLS[idx] = updated;
  } else {
    STALLS.push(updated);
  }

  return updated;
}

window.doRegister = async function doRegisterBackend() {
  const username = document.getElementById("re-name").value.trim();
  const stallName = document.getElementById("re-stall").value.trim();
  const phone = document.getElementById("re-ph").value.trim();
  const password = document.getElementById("re-pw").value;
  const pw2 = document.getElementById("re-pw2").value;
  const err = document.getElementById("re-err");
  const ok = document.getElementById("re-ok");

  err.classList.remove("on"); ok.classList.remove("on");
  if (!username || !stallName || !phone || !password || !pw2) { 
    err.textContent = "Please fill in all fields."; 
    err.classList.add("on"); return; 
  }

  if (phone.length < 9) {
    err.textContent = "Enter a valid phone number.";
    err.classList.add("on");
    return;
  }

  if (password.length < 6) {
    err.textContent = "Password must be at least 6 characters.";
    err.classList.add("on");
    return;
  }

  if (password !== pw2) { 
    err.textContent = "Passwords do not match."; 
    err.classList.add("on"); return; 
  }

  try {
    const data = await postJSON("register.php", {username, stallName, phone, password});
    if (!data.success) {
      err.textContent = data.message || "Registration failed.";
      err.classList.add("on");
      return;
    }
    ok.textContent = data.message || "Registration submitted. Please wait for admin approval.";
    ok.classList.add("on");
    await loadStallsFromBackend();
    setTimeout(() => switchAuth("login"), 1000);
  } catch (e) {
    err.textContent = "Cannot connect to backend.";
    err.classList.add("on");
    console.error(e);
  }
};

window.refreshDash = function refreshDashBackend() {
  if (!ownerAcc) return;
  const s = getStallById(ownerAcc.stallId);
  if (!s) return;
  document.getElementById("dash-stall-nm").textContent = s.name;
  document.getElementById("dash-meta").textContent = `${s.name} • ${ownerAcc.phone}`;
  const dhImg = document.getElementById("dash-hero-img");
  const dhEmoji = document.getElementById("dash-hero-emoji");
  if (s.coverImg) {
    dhImg.style.backgroundImage = `url(${s.coverImg})`;
    dhImg.style.backgroundSize = "cover";
    dhImg.style.backgroundPosition = "center";
    dhEmoji.style.display = "none";
  } else {
    dhImg.style.backgroundImage = "";
    dhImg.style.background = s.bg;
    dhEmoji.style.display = "";
    dhEmoji.textContent = s.ownerEmoji;
  }
};

window.setStatus = async function setStatusBackend(status) {
  if (!ownerAcc) return;
  const clean = String(status).replaceAll("-", " ").toUpperCase();
  const s = getStallById(ownerAcc.stallId);
  if (s) s.status = mapStatus(clean);
  ["open", "busy", "closed"].forEach(k => {
    const el = document.getElementById("sg-" + k);
    if (el) el.className = "stgl " + k + " " + (mapStatus(clean) === k ? "on" : "off");
  });
  renderResults(STALLS);
  try {
    await postJSON("update_status.php", { stallID: ownerAcc.stallId, stallStatus: clean });
  } catch (e) { console.error(e); }
};

window.saveInfo = async function saveInfoBackend() {
  if (!ownerAcc) return;
  const s = getStallById(ownerAcc.stallId);
  if (!s) return;
  const stallName = document.getElementById("ef-stall").value.trim() || s.name;
  const addressDescription = document.getElementById("ef-address").value.trim() || s.address;
  console.log("STALL IMAGE DATA:", profileImgData ? profileImgData.substring(0, 50) : "NO IMAGE");

  try {
    const data = await postJSON("update_profile.php", {
      stallID: ownerAcc.stallId,
      stallName,
      stallDescription: s.description || "",
      stallEmoji: s.ownerEmoji || "🏪",
      stallPicture: profileImgData || "",
      latitude: s.lat,
      longitude: s.lng,
      addressDescription
    });
    if (!data.success) throw new Error(data.message);
    s.name = stallName; s.address = addressDescription;
    refreshDash(); renderResults(STALLS); toast("Stall info saved ✓");
  } catch (e) { toast("Save failed"); console.error(e); }
};

window.renderMenuEditor = function renderMenuEditorBackend() {
  if (!ownerAcc) return;

  const s = getStallById(ownerAcc.stallId);
  const area = document.getElementById("menu-edit-area");

  if (!s || !area) return;

  const categories = [
    "Burger", "Rice", "Drinks", "Western", "Mamak",
    "Noodles", "Snacks", "Dessert", "Chicken"
  ];

  area.innerHTML = s.menu.map((m, i) => `
    <div class="mei-card" id="mei-${i}">
      <div class="mei-top">
        <div class="mei-photo" onclick="document.getElementById('mei-file-${i}').click()">

          ${m.img
            ? `<img src="${m.img}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`
            : `<span>🍽️</span>`
          }

          <input 
            type="file"
            id="mei-file-${i}"
            accept="image/*"
            style="display:none"
            onchange="handleMenuItemPhoto(this, ${i})"
          />

        </div>
        <div class="mei-fields">
          <div class="mei-row">
            <input class="mef" id="mn-${i}" type="text" value="${esc(m.name)}" placeholder="Item name"/>
            <input class="mef price" id="mp-${i}" type="text" value="${esc(m.price)}" placeholder="Price"/>
          </div>

          <select class="mef" id="md-${i}">
            ${categories.map(cat => `
              <option value="${cat}" ${String(m.desc || "").toLowerCase() === cat.toLowerCase() ? "selected" : ""}>
                ${cat}
              </option>
            `).join("")}
          </select>

          <select class="mef" id="ms-${i}">
            <option value="AVAILABLE"
              ${(m.status || '').toUpperCase() === 'AVAILABLE' ? 'selected' : ''}>
              Available
            </option>

            <option value="SOLD OUT"
              ${(m.status || '').toUpperCase() === 'SOLD OUT' ? 'selected' : ''}>
              Sold Out
            </option>

            <option value="UNAVAILABLE"
              ${(m.status || '').toUpperCase() === 'UNAVAILABLE' ? 'selected' : ''}>
              Unavailable
            </option>
          </select>
        </div>
      </div>

      <div class="mei-actions">
        <button class="mei-save" onclick="saveMenuItem(${i})">Save</button>
        <button class="mei-del" onclick="deleteMenuItem(${i})">Delete</button>
      </div>
    </div>
  `).join("");
};

window.saveMenuItem = async function saveMenuItemBackend(idx) {
  const s = getStallById(ownerAcc.stallId);
  const m = s.menu[idx];
  const foodName = document.getElementById(`mn-${idx}`).value.trim() || m.name;
  const priceText = document.getElementById(`mp-${idx}`).value.replace("RM", "").trim();
  const foodCategory = document.getElementById(`md-${idx}`).value.trim();
  const foodStatus = document.getElementById(`ms-${idx}`).value.trim();
  try {
    const data = await postJSON("update_menu.php", {
      foodID: m.foodID,
      foodName,
      foodPrice: priceText,
      foodCategory,
      foodPicture: m.img || "",
      foodStatus: foodStatus
    });
    if (!data.success) throw new Error(data.message);
    await reloadOwnerStall(); renderMenuEditor(); renderResults(STALLS); toast("Item saved ✓");
  } catch (e) { toast("Item save failed"); console.error(e); }
};

window.handleMenuItemPhoto = function(input, idx) {

  const file = input.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {

    const s = getStallById(ownerAcc.stallId);

    s.menu[idx].img = e.target.result;

    renderMenuEditor();

  };

  reader.readAsDataURL(file);

};

window.deleteMenuItem = async function deleteMenuItemBackend(idx) {
  if (!confirm("Delete this menu item?")) return;
  const s = getStallById(ownerAcc.stallId);
  const m = s.menu[idx];
  try {
    const data = await postJSON("delete_menu.php", { foodID: m.foodID });
    if (!data.success) throw new Error(data.message);
    await reloadOwnerStall(); renderMenuEditor(); renderResults(STALLS); toast("Item deleted");
  } catch (e) { toast("Delete failed"); console.error(e); }
};

window.addMenuItem = async function addMenuItemBackend() {
  if (!ownerAcc) {
    toast("Please login first");
    return;
  }

  const foodName = document.getElementById("new-item-name").value.trim();
  const foodCategory = document.getElementById("new-item-desc").value.trim();
  const foodStatus = document.getElementById("new-item-status").value.trim();
  const foodPrice = document.getElementById("new-item-price").value.replace("RM", "").trim();

  if (!foodName || !foodCategory || !foodPrice) {
    toast("Please fill in item name, category and price");
    return;
  }

  try {
    const data = await postJSON("add_menu.php", {
      stallID: ownerAcc.stallId,
      foodName: foodName,
      foodCategory: foodCategory,
      foodPrice: foodPrice,
      foodPicture: newItemImgData || "",
      foodStatus: foodStatus,
    });


    console.log("ADD MENU RESPONSE:", data);

    if (!data.success) {
      toast(data.message || "Add menu failed");
      console.error(data);
      return;
    }

    document.getElementById("new-item-name").value = "";
    document.getElementById("new-item-desc").value = "";
    document.getElementById("new-item-status").value = "AVAILABLE";
    document.getElementById("new-item-price").value = "";

    newItemImgData = null;
    document.getElementById("new-item-preview").innerHTML =
      '<span id="new-item-emoji-show">🍽️</span>';

    await reloadOwnerStall();
    renderMenuEditor();
    renderResults(STALLS);

    toast("Menu added successfully");

  } catch (e) {
    console.error("ADD MENU ERROR:", e);
    toast("Cannot connect to backend");
  }
};

window.viewOwnerStall = function viewOwnerStallBackend() {
  if (ownerAcc) openStall(ownerAcc.stallId, "screen-owner-dash");
};

window.addEventListener("DOMContentLoaded", loadStallsFromBackend);

async function apiGetStalls() {
  const res = await fetch(`${API_BASE}/get_stalls.php`);
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message || "Failed to load stalls");
  }

  return json.stalls || [];
}

window.apiGetStalls = apiGetStalls;

window.doLogin = async function () {
  const phone = document.getElementById("li-ph").value.trim();
  const password = document.getElementById("li-pw").value.trim();
  const err = document.getElementById("li-err");

  err.classList.remove("on");

  try {
    const data = await postJSON("login.php", {
      phone: phone,
      password: password
    });

    if (!data.success) {
      err.textContent = data.message || "Login failed";
      err.classList.add("on");
      return;
    }

    ownerAcc = {
      phone: data.user.phone,
      name: data.user.username,
      stallId: data.user.stallID,
      status: "approved"
    };

    isOwner = true;

    document.getElementById("auth-overlay").classList.add("off");
    document.getElementById("owner-btn").className = "owner-btn active";
    document.getElementById("owner-btn-txt").textContent = "My Stall";

    await reloadOwnerStall();

    if (typeof refreshDash === "function") refreshDash();
    if (typeof renderMenuEditor === "function") renderMenuEditor();

    goTo("screen-owner-dash");

  } catch (e) {
    console.error(e);
    err.textContent = "Cannot connect to backend.";
    err.classList.add("on");
  }
};

window.renderAdminDashboard = async function () {
  try {
    const approvedData = await getJSON("get_all_stalls_admin.php");
    const pendingData = await getJSON("get_pending_owners.php");

    STALLS = (approvedData.stalls || []).map(mapBackendStall);
    const pendingList = pendingData.pending || [];

    document.getElementById("admin-total-stalls").textContent =
      STALLS.filter(s => s.status !== "inactive").length;

    document.getElementById("admin-open-stalls").textContent =
      STALLS.filter(s => s.status === "open").length;

    document.getElementById("admin-pending-count").textContent =
      pendingList.length;

    document.getElementById("admin-inactive-count").textContent =
      STALLS.filter(s => s.status === "inactive").length;

    renderRegistrationList(pendingList);
    renderApprovedOwnerList();

  } catch (e) {
    console.error("Admin dashboard error:", e);
  }
};

window.renderApprovedOwnerList = function () {
  const list = document.getElementById("admin-stall-list");
  if (!list) return;

  if (!STALLS.length) {
    list.innerHTML = `<div class="empty-admin-card">No approved stall owners yet.</div>`;
    return;
  }

  list.innerHTML = STALLS.map(s => `
    <div class="admin-stall-card">
      <div class="admin-stall-ico">
        ${s.coverImg ? `<img src="${s.coverImg}" alt="">` : (s.ownerEmoji || "🏪")}
      </div>

      <div class="admin-stall-info">
        <b>${esc(s.name)}</b>
        <span>Stall ID: ${esc(s.id)}</span>
        <span>Location: ${esc(s.address || "-")}</span>
        <span>Status: ${esc(s.status)}</span>
      </div>

      <div class="admin-actions">
        ${s.status === "inactive"
          ? `<button class="admin-active-pill" onclick="adminSetStallStatus('${s.id}', 'OPEN')">Set Active</button>`
          : `<button class="admin-delete" onclick="adminSetStallStatus('${s.id}', 'INACTIVE')">Set Inactive</button>`
        }
      </div>
    </div>
  `).join("");
};

window.renderHoursEditor = async function () {
  const wrap = document.getElementById("hours-list");
  if (!wrap || !ownerAcc) return;

  const days = [
    ["MONDAY", "Monday", "mon"],
    ["TUESDAY", "Tuesday", "tue"],
    ["WEDNESDAY", "Wednesday", "wed"],
    ["THURSDAY", "Thursday", "thu"],
    ["FRIDAY", "Friday", "fri"],
    ["SATURDAY", "Saturday", "sat"],
    ["SUNDAY", "Sunday", "sun"]
  ];

  const data = await getJSON(`get_hours.php?stallID=${ownerAcc.stallId}`);
  const saved = data.success ? data.schedule : [];

  function findDay(day) {
    return saved.find(r => r.operatingDay === day);
  }

  wrap.innerHTML = days.map(([dbDay, label, key]) => {
    const row = findDay(dbDay);
    const closed = row ? Number(row.isClosed) === 1 : false;
    const open = row && row.openingTime ? row.openingTime.slice(0, 5) : "11:00";
    const close = row && row.closingTime ? row.closingTime.slice(0, 5) : "22:00";

    return `
      <div class="hours-card">
        <div class="hours-top">
          <b>${label}</b>

          <label class="hours-closed">
            <input type="checkbox" id="${key}-closed" ${closed ? "checked" : ""} onchange="toggleDayClosed('${key}')">
            Closed
          </label>
        </div>

        <div class="hours-times" id="${key}-times">
          <input class="hours-input" id="${key}-open" type="time" value="${open}">
          <span>to</span>
          <input class="hours-input" id="${key}-close" type="time" value="${close}">
        </div>
      </div>
    `;
  }).join("");

  days.forEach(([dbDay, label, key]) => {
    toggleDayClosed(key);
  });
};


window.toggleDayClosed = function (key) {
  const closed = document.getElementById(`${key}-closed`).checked;
  const times = document.getElementById(`${key}-times`);
  const open = document.getElementById(`${key}-open`);
  const close = document.getElementById(`${key}-close`);

  times.style.opacity = closed ? "0.35" : "1";
  open.disabled = closed;
  close.disabled = closed;
};

window.saveHours = async function () {
  if (!ownerAcc) {
    toast("Please login first");
    return;
  }

  const days = [
    ["MONDAY", "mon"],
    ["TUESDAY", "tue"],
    ["WEDNESDAY", "wed"],
    ["THURSDAY", "thu"],
    ["FRIDAY", "fri"],
    ["SATURDAY", "sat"],
    ["SUNDAY", "sun"]
  ];

  const schedule = days.map(([dayName, key]) => {
    const isClosed = document.getElementById(`${key}-closed`).checked;

    return {
      operatingDay: dayName,
      openingTime: document.getElementById(`${key}-open`).value,
      closingTime: document.getElementById(`${key}-close`).value,
      isClosed
    };
  });

  try {
    const data = await postJSON("update_hours.php", {
      stallID: ownerAcc.stallId,
      schedule
    });

    if (!data.success) {
      toast(data.message || "Failed to save hours");
      console.error(data);
      return;
    }

    toast("Operating hours saved ✓");

  } catch (e) {
    console.error(e);
    toast("Cannot save hours");
  }
};

window.adminSetStallStatus = async function (stallID, status) {
  try {
    const data = await postJSON("update_stall_status_admin.php", {
      stallID,
      status
    });

    if (!data.success) {
      toast(data.message || "Failed to update stall");
      console.error(data);
      return;
    }

    await loadStallsFromBackend();
    renderAdminDashboard();

    toast("Stall status updated ✓");

  } catch (e) {
    console.error(e);
    toast("Cannot update stall status");
  }
};


window.approveOwner = async function (userID) {
  const data = await postJSON("approve_owner.php", { userID });

  if (!data.success) {
    toast(data.message || "Approve failed");
    return;
  }

  toast("Owner approved ✓");
  await renderAdminDashboard();
};

window.rejectOwner = async function (userID) {
  if (!confirm("Reject this registration?")) return;

  const data = await postJSON("reject_owner.php", { userID });

  if (!data.success) {
    toast(data.message || "Reject failed");
    return;
  }

  toast("Registration rejected");
  await renderAdminDashboard();
};

window.calcDist = window.calcDist || function (lat, lng) {
  if (!window.userLat || !lat || !lng) return "—";

  const R = 6371000;
  const toRad = x => x * Math.PI / 180;

  const dLat = toRad(lat - window.userLat);
  const dLng = toRad(lng - window.userLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(window.userLat)) *
    Math.cos(toRad(lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const m = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return m >= 1000 ? (m / 1000).toFixed(1) + " km" : Math.round(m) + " m";
};

window.reqLoc = window.reqLoc || function () {
  const overlay = document.getElementById("loc-overlay");
  if (overlay) overlay.classList.add("off");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        window.userLat = pos.coords.latitude;
        window.userLng = pos.coords.longitude;
        if (typeof loadStallsFromBackend === "function") loadStallsFromBackend();
      },
      err => {
        console.warn(err);
        if (typeof toast === "function") toast("Location not enabled");
      }
    );
  }
};

window.cap = window.cap || function (s) {
  s = String(s || "");
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

window.origGoTo = window.origGoTo || function (id) {
  if (typeof goTo === "function") goTo(id);
};

window.calcDist = window.calcDist || function () {
  return "—";
};

function renderRegistrationList(pendingList = []) {
  const list = document.getElementById("admin-registration-list");
  if (!list) return;

  if (!pendingList.length) {
    list.innerHTML = `<div class="empty-admin-card">No pending registration requests.</div>`;
    return;
  }

  list.innerHTML = pendingList.map(req => `
    <div class="admin-stall-card pending-card">
      <div class="admin-stall-ico">📝</div>

      <div class="admin-stall-info">
        <b>${esc(req.stallName)}</b>
        <span>Owner: ${esc(req.username)}</span>
        <span>📞 +60 ${esc(req.phone || "-")}</span>
        <span>Stall ID: ${esc(req.stallID)}</span>
      </div>

      <div class="admin-actions">
        <button class="admin-approve" onclick="approveOwner('${req.userID}')">Approve</button>
        <button class="admin-reject" onclick="rejectOwner('${req.userID}')">Reject</button>
      </div>
    </div>
  `).join("");
}