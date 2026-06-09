/* ══════════════════════════════════════
       LOCATION
    ══════════════════════════════════════ */
function reqLoc() {
  document.getElementById('loc-overlay').classList.add('off');
  if (!navigator.geolocation) { showLocBar(false); return; }
  navigator.geolocation.getCurrentPosition(
    p => {
      userLat = p.coords.latitude; userLng = p.coords.longitude; showLocBar(true);
      document.getElementById('res-you').style.display = '';
      document.getElementById('res-you-lbl').style.display = '';
    },
    () => showLocBar(false), { enableHighAccuracy: true, timeout: 8000 }
  );
}
function denyLoc() { document.getElementById('loc-overlay').classList.add('off'); showLocBar(false); }
function showLocBar(ok) {
  const b = document.getElementById('loc-bar');
  b.style.display = 'flex';
  b.className = 'loc-bar ' + (ok ? 'ok' : 'no');
  b.innerHTML = ok ? '📍 Location enabled — showing real distances'
    : '⚠️ Location off — stall address is still shown. <u style="cursor:pointer;" onclick="reqLoc()">Tap to enable distance</u>';
}


/* ══════════════════════════════════════
       OWNER AUTH
    ══════════════════════════════════════ */
function handleOwner() {
  if (isAdmin) { goTo('screen-admin-dash'); renderAdminDashboard(); return; }
  if (isOwner) { goTo('screen-owner-dash'); return; }
  openRoleChoice();
}
function openRoleChoice() { document.getElementById('role-overlay').classList.remove('off'); }
function closeRoleChoice(e) {
  if (e && e.target !== document.getElementById('role-overlay')) return;
  document.getElementById('role-overlay').classList.add('off');
}
function chooseRole(role) {
  closeRoleChoice();
  if (role === 'owner') openAuth();
  if (role === 'admin') openAdminAuth();
}
function openAdminAuth() {
  ['ad-user','ad-pw'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('ad-err').classList.remove('on');
  document.getElementById('admin-auth-overlay').classList.remove('off');
}
function closeAdminAuth(e) {
  if (e && e.target !== document.getElementById('admin-auth-overlay')) return;
  document.getElementById('admin-auth-overlay').classList.add('off');
}
function doAdminLogin() {
  const u = document.getElementById('ad-user').value.trim();
  const p = document.getElementById('ad-pw').value;
  if (u !== 'admin' || p !== 'admin123') { document.getElementById('ad-err').classList.add('on'); return; }
  isAdmin = true;
  document.getElementById('admin-auth-overlay').classList.add('off');
  document.getElementById('owner-btn').className = 'owner-btn active';
  document.getElementById('owner-btn-txt').textContent = 'Admin';
  renderAdminDashboard();
  goTo('screen-admin-dash');
}
function doAdminLogout() {
  isAdmin = false;
  document.getElementById('owner-btn').className = 'owner-btn guest';
  document.getElementById('owner-btn-txt').textContent = 'Account';
  goTo('screen-owner-dash');
}
function daysBetween(dateText) {
  if (!dateText) return 0;
  const now = new Date();
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}
async function renderAdminDashboard() {
  try {
    const stalls = await apiGetStalls();

    const approvedAccounts = stalls.map(s => ({
      stallId: s.id,
      stallName: s.name,
      name: s.ownerName || s.name,
      phone: s.ownerPhone || '-',
      status: 'approved',
      lastActive: new Date().toISOString().slice(0, 10),
      emoji: s.ownerEmoji
    }));

    const total = document.getElementById('admin-total-stalls');
    const open = document.getElementById('admin-open-stalls');
    const pending = document.getElementById('admin-pending-count');
    const inactive = document.getElementById('admin-inactive-count');

    if (total) total.textContent = approvedAccounts.length;
    if (open) open.textContent = stalls.filter(s => s.status === 'open').length;
    const pendingData = await getJSON("get_pending_owners.php");
    if (pending) pending.textContent = pendingData.pending?.length || 0;
    if (inactive) inactive.textContent = 0;

    accounts = approvedAccounts;

    await renderRegistrationList();
    renderApprovedOwnerList();

  } catch (err) {
    console.error("Admin dashboard failed:", err);
  }
}

async function renderRegistrationList(pendingList = []) {
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

function renderApprovedOwnerList() {

  const list = document.getElementById('admin-stall-list');

  if (!list) return;

  if (!STALLS.length) {

    list.innerHTML = `
      <div class="empty-admin-card">
        No approved stall owners yet.
      </div>
    `;

    return;
  }

  list.innerHTML = STALLS.map((s, index) => {

    return `
      <div class="admin-stall-card">

        <div class="admin-stall-ico">
          ${s.coverImg
            ? `<img src="${s.coverImg}" alt=""/>`
            : (s.ownerEmoji || '🏪')}
        </div>

        <div class="admin-stall-info">
          <b>${esc(s.name || 'Unnamed Stall')}</b>

          <span>
            Owner: ${esc(s.ownerName || 'Stall Owner')}
          </span>

          <span>
            📞 +60 ${esc(s.ownerPhone || '-')}
          </span>

          <span>
            Status: ${esc(s.status || 'open')}
          </span>
        </div>

        <div class="admin-actions">

          <span class="admin-active-pill">
            Active
          </span>

          <button class="admin-delete">
            Delete
          </button>

        </div>

      </div>
    `;

  }).join('');

}
function approveOwner(phone) {
  const req = pendingOwners.find(r => r.phone === phone);
  if (!req) return;
  const newId = STALLS.length;
  const colors = ['linear-gradient(135deg,#a0b8c8,#507090)', 'linear-gradient(135deg,#b0c8a0,#508050)', 'linear-gradient(135deg,#c8b0a0,#806050)', 'linear-gradient(135deg,#b0a8c8,#605080)'];
  STALLS.push({
    id: newId,
    name: req.stallName,
    ownerEmoji: '🏪',
    coverImg: null,
    status: 'closed',
    hours: '—',
    address: '—',
    lat: 3.0512 + Math.random() * 0.004 - 0.002,
    lng: 101.7460 + Math.random() * 0.004 - 0.002,
    bg: colors[newId % colors.length],
    phone: req.phone,
    menu: []
  });
  accounts.push({
    phone: req.phone,
    password: req.password,
    name: req.name,
    stallName: req.stallName,
    stallId: newId,
    status: 'approved',
    registeredAt: req.registeredAt,
    lastActive: new Date().toISOString().slice(0, 10)
  });
  pendingOwners = pendingOwners.filter(r => r.phone !== phone);
  renderResults(STALLS);
  renderAdminDashboard();
}
function rejectOwner(phone) {
  pendingOwners = pendingOwners.filter(r => r.phone !== phone);
  renderAdminDashboard();
}
function deleteInactiveOwner(phone) {
  const acc = accounts.find(a => a.phone === phone);
  if (!acc) return;

  const inactiveDays = daysBetween(acc.lastActive);
  if (inactiveDays < 365) {
    alert('This account cannot be deleted yet. It has not been inactive for 1 year.');
    return;
  }

  if (!confirm('Delete this inactive stall owner account?')) return;

  accounts = accounts.filter(a => a.phone !== phone);

  const stall = STALLS[acc.stallId];
  if (stall) {
    stall.status = 'closed';
    stall.deletedByAdmin = true;
    stall.name = stall.name + ' (Removed)';
  }

  renderResults(STALLS.filter(s => !s.deletedByAdmin));
  renderAdminDashboard();
}
function openAuth() {
  clearAuthFields();
  switchAuth('login');
  document.getElementById('auth-overlay').classList.remove('off');
}
function closeAuth(e) {
  if (e && e.target !== document.getElementById('auth-overlay')) return;
  document.getElementById('auth-overlay').classList.add('off');
  goTo('screen-owner-dash');
  if (typeof renderOwnerDash === 'function') renderOwnerDash();
}
function clearAuthFields() {
  ['li-ph', 'li-pw', 're-name', 're-stall', 're-ph', 're-pw', 're-pw2'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('li-err').classList.remove('on');
  document.getElementById('re-err').classList.remove('on');
  document.getElementById('re-ok').classList.remove('on');
}
function switchAuth(tab) {
  document.getElementById('atab-login').classList.toggle('on', tab === 'login');
  document.getElementById('atab-reg').classList.toggle('on', tab === 'reg');
  document.getElementById('apanel-login').classList.toggle('on', tab === 'login');
  document.getElementById('apanel-reg').classList.toggle('on', tab === 'reg');
}
async function doLogin() {
  const ph = document.getElementById('li-ph').value.trim();
  const pw = document.getElementById('li-pw').value.trim();
  const err = document.getElementById('li-err');

  err.classList.remove('on');

  try {
    const res = await fetch("http://localhost/Food_Stall_Tracker/api/login.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: ph,
        password: pw
      })
    });

    const data = await res.json();

    if (!data.success) {
      err.textContent = data.message;
      err.classList.add('on');
      return;
    }

    loginSuccess({
      phone: data.user.phone,
      name: data.user.username,
      stallId: data.user.stallID,
      status: 'approved'
    });

  } catch (e) {
    console.error(e);
    err.textContent = "Login failed";
    err.classList.add('on');
  }
}
function doRegister() {
  const name = document.getElementById('re-name').value.trim();
  const stall = document.getElementById('re-stall').value.trim();
  const ph = document.getElementById('re-ph').value.trim();
  const pw = document.getElementById('re-pw').value;
  const pw2 = document.getElementById('re-pw2').value;
  const err = document.getElementById('re-err');
  err.classList.remove('on');
  document.getElementById('re-ok').classList.remove('on');
  if (!name || !stall || !ph || !pw) { err.textContent = 'Please fill in all fields.'; err.classList.add('on'); return; }
  if (ph.length < 9) { err.textContent = 'Enter a valid Malaysian phone number.'; err.classList.add('on'); return; }
  if (pw.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.classList.add('on'); return; }
  if (pw !== pw2) { err.textContent = 'Passwords do not match.'; err.classList.add('on'); return; }
  if (accounts.find(a => a.phone === ph) || pendingOwners.find(a => a.phone === ph)) {
    err.textContent = 'This phone number is already registered or waiting for approval.';
    err.classList.add('on');
    return;
  }
  pendingOwners.push({
    phone: ph,
    password: pw,
    name,
    stallName: stall,
    registeredAt: new Date().toISOString().slice(0, 10),
    status: 'pending'
  });
  document.getElementById('re-ok').textContent = 'Registration submitted! Please wait for admin approval.';
  document.getElementById('re-ok').classList.add('on');
  setTimeout(() => switchAuth('login'), 1500);
}
function loginSuccess(acc) {
  acc.lastActive = new Date().toISOString().slice(0, 10);
  isOwner = true;
  goTo('screen-owner-dash');
  if (typeof renderOwnerDash === 'function') renderOwnerDash(); ownerAcc = acc;
  document.getElementById('auth-overlay').classList.add('off');
  // Update owner button
  document.getElementById('owner-btn').className = 'owner-btn active';
  document.getElementById('owner-btn-txt').textContent = 'My Stall';
  // Sync status toggles
  const s = STALLS[acc.stallId];
  setStatus(s.status);
  // Populate dash
  refreshDash();
  // Populate edit form
  document.getElementById('ef-stall').value = s.name;
  document.getElementById('ef-owner').value = acc.name;
  document.getElementById('ef-address').value = s.address;
  document.getElementById('ef-phone').value = acc.phone;

  /* Manual location fields */
  const address2 = document.getElementById('ef-address2');
  const postcode = document.getElementById('ef-postcode');
  const state = document.getElementById('ef-state');
  const country = document.getElementById('ef-country');

  if (address2) address2.value = s.address || '';
  if (postcode) postcode.value = s.postcode || '';
  if (state) state.value = s.state || '';
  if (country) country.value = s.country || 'Malaysia';

  const locPreview = document.getElementById('loc-preview');
  if (locPreview) locPreview.textContent = s.address || 'No location set.';
  goTo('screen-owner-dash');
}
function refreshDash() {
  if (!ownerAcc) return;
  const s = STALLS[ownerAcc.stallId];
  document.getElementById('dash-stall-nm').textContent = s.name;
  document.getElementById('dash-meta').textContent = `${s.name} • +60 ${ownerAcc.phone}`;
  // cover image
  const dhImg = document.getElementById('dash-hero-img');
  const dhEmoji = document.getElementById('dash-hero-emoji');
  if (s.coverImg) {
    dhImg.style.backgroundImage = `url(${s.coverImg})`;
    dhImg.style.backgroundSize = 'cover';
    dhImg.style.backgroundPosition = 'center';
    dhEmoji.style.display = 'none';
  } else {
    dhImg.style.backgroundImage = '';
    dhImg.style.background = s.bg;
    dhEmoji.style.display = '';
    dhEmoji.textContent = s.ownerEmoji;
  }
}
function setStatus(s) {
  if (ownerAcc) STALLS[ownerAcc.stallId].status = s;
  ['open', 'busy', 'closed'].forEach(k => {
    document.getElementById('sg-' + k).className = 'stgl ' + k + ' ' + (k === s ? 'on' : 'off');
  });
  renderResults(STALLS);
}
function viewOwnerStall() {
  if (ownerAcc) openStall(ownerAcc.stallId, 'screen-owner-dash');
}

/* ══════════════════════════════════════
   EDIT TABS
══════════════════════════════════════ */
function switchEditTab(tab) {
  ['info', 'menu', 'hours'].forEach(t => {
    const et = document.getElementById('et-' + t);
    const ep = document.getElementById('ep-' + t);
    if (et) et.classList.toggle('on', t === tab);
    if (ep) ep.classList.toggle('on', t === tab);
  });
  if (tab === 'menu') renderMenuEditor();
  if (tab === 'hours') renderHoursEditor();
}

/* ══════════════════════════════════════
   SAVE STALL INFO
══════════════════════════════════════ */
function saveInfo() {
  if (!ownerAcc) return;
  const s = STALLS[ownerAcc.stallId];
  s.name = document.getElementById('ef-stall').value.trim() || s.name;
  s.address = document.getElementById('ef-address').value.trim() || s.address;
  ownerAcc.name = document.getElementById('ef-owner').value.trim() || ownerAcc.name;
  refreshDash(); renderResults(STALLS);
  toast('Stall info saved ✓');
}
function saveHours() {
  if (!ownerAcc) return;
  const s = STALLS[ownerAcc.stallId];
  const days = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6'];
  const vals = days.map(id => document.getElementById(id).value).filter(v => v && v.toLowerCase() !== 'closed');
  s.hours = vals.length ? vals[0] : document.getElementById('d0').value;
  renderResults(STALLS);
  toast('Hours saved ✓');
}

function toggleClosed(day){

  const btn = document.getElementById(`${day}-toggle`);

  const open = document.getElementById(`${day}-open`);
  const close = document.getElementById(`${day}-close`);

  btn.classList.toggle("active");

  const isClosed = btn.classList.contains("active");

  btn.textContent = isClosed ? "Closed" : "Open";

  open.disabled = isClosed;
  close.disabled = isClosed;

  if(isClosed){
    open.value = "";
    close.value = "";
  }
}

function saveLocation() {
  if (!ownerAcc) return;

  const address = document.getElementById('ef-address2').value.trim();
  const postcode = document.getElementById('ef-postcode').value.trim();
  const state = document.getElementById('ef-state').value.trim();
  const country = document.getElementById('ef-country').value.trim();

  if (!address || !postcode || !state) {
    toast('Enter address, postcode and state');
    return;
  }

  const fullAddress = `${address}, ${postcode}, ${state}, ${country}`;

  const s = STALLS[ownerAcc.stallId];
  s.address = fullAddress;
  s.postcode = postcode;
  s.state = state;
  s.country = country;

  document.getElementById('loc-preview').textContent = fullAddress;

  renderResults(STALLS);
  refreshDash();
  toast('Location saved ✓');
}

function captureGPS() {
  if (!navigator.geolocation) { toast('GPS not available'); return; }
  toast('Getting location…');
  navigator.geolocation.getCurrentPosition(p => {
    const lat = p.coords.latitude, lng = p.coords.longitude;
    document.getElementById('loc-preview').textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    if (ownerAcc) { STALLS[ownerAcc.stallId].lat = lat; STALLS[ownerAcc.stallId].lng = lng; }
    toast('Location captured ✓');
  }, () => toast('Could not get location'));
}

/* ══════════════════════════════════════
   STALL PHOTO UPLOAD
══════════════════════════════════════ */
function triggerStallPhoto() { document.getElementById('stall-photo-file').click(); }
function handleStallPhoto(input) {
  const file = input.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    const data = e.target.result;
    if (!ownerAcc) return;
    STALLS[ownerAcc.stallId].coverImg = data;
    // Show preview
    const prev = document.getElementById('stall-photo-preview');
    if (!prev) return;
    document.getElementById('stall-photo-emoji').style.display = 'none';
    let img = prev.querySelector('img');
    if (!img) { img = document.createElement('img'); prev.appendChild(img); }
    img.src = data; img.style.display = '';
    refreshDash();
    renderResults(STALLS);
    toast('Photo uploaded ✓');
  };
  r.readAsDataURL(file);
}

/* ══════════════════════════════════════
   MENU EDITOR
══════════════════════════════════════ */
function renderMenuEditor() {
  if (!ownerAcc) return;
  const s = STALLS[ownerAcc.stallId];
  const area = document.getElementById('menu-edit-area');
  if (!area) return;
  area.innerHTML = s.menu.map((m, i) => `
    <div class="mei-card" id="mei-${i}">
      <div class="mei-top">
        <div class="mei-photo" onclick="triggerMenuItemPhoto(${i})" title="Upload photo">
          ${m.img ? `<img src="${m.img}" alt=""/>` : `<span>${m.emoji}</span>`}
          <div class="mei-photo-ov"><span>📷</span></div>
          <input type="file" class="mei-file" id="mei-file-${i}" accept="image/*" onchange="handleMenuItemPhoto(this,${i})"/>
        </div>
        <div class="mei-fields">
          <div class="mei-row">
            <input class="mef" id="mn-${i}" type="text" value="${esc(m.name)}" placeholder="Item name"/>
            <input class="mef price" id="mp-${i}" type="text" value="${esc(m.price)}" placeholder="Price"/>
          </div>
          <input class="mef" id="md-${i}" type="text" value="${esc(m.desc)}" placeholder="Description"/>
        </div>
      </div>
      <div class="mei-actions">
        <button class="mei-save" onclick="saveMenuItem(${i})">Save</button>
        <button class="mei-del"  onclick="deleteMenuItem(${i})">Delete</button>
      </div>
    </div>`).join('');
}
function triggerMenuItemPhoto(idx) {
  document.getElementById(`mei-file-${idx}`).click();
}
function handleMenuItemPhoto(input, idx) {
  const file = input.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    const data = e.target.result;
    STALLS[ownerAcc.stallId].menu[idx].img = data;
    renderMenuEditor();
    toast('Photo saved ✓');
  };
  r.readAsDataURL(file);
}
function saveMenuItem(idx) {
  if (!ownerAcc) return;
  const m = STALLS[ownerAcc.stallId].menu[idx];
  m.name = document.getElementById(`mn-${idx}`).value.trim() || m.name;
  m.price = document.getElementById(`mp-${idx}`).value.trim() || m.price;
  m.desc = document.getElementById(`md-${idx}`).value.trim();
  renderMenuEditor();
  toast('Item saved ✓');
}
function deleteMenuItem(idx) {
  if (!ownerAcc) return;
  if (!confirm('Delete this menu item?')) return;
  STALLS[ownerAcc.stallId].menu.splice(idx, 1);
  renderMenuEditor();
  toast('Item deleted');
}

/* New item photo */
function triggerNewItemPhoto() { document.getElementById('new-item-photo-file').click(); }
function handleNewItemPhoto(input) {
  const file = input.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    newItemImgData = e.target.result;
    const prev = document.getElementById('new-item-preview');
    document.getElementById('new-item-emoji-show').style.display = 'none';
    let img = prev.querySelector('img');
    if (!img) { img = document.createElement('img'); prev.appendChild(img); }
    img.src = newItemImgData; img.style.display = '';
  };
  r.readAsDataURL(file);
}
function addMenuItem() {
  if (!ownerAcc) return;
  const name = document.getElementById('new-item-name').value.trim();
  const price = document.getElementById('new-item-price').value.trim();
  const desc = document.getElementById('new-item-desc').value.trim();
  if (!name || !price) { toast('Please enter item name and price'); return; }
  STALLS[ownerAcc.stallId].menu.push({ name, price, desc, img: newItemImgData, emoji: '🍽️' });
  // Reset form
  document.getElementById('new-item-name').value = '';
  document.getElementById('new-item-price').value = '';
  document.getElementById('new-item-desc').value = '';
  document.getElementById('new-item-photo-file').value = '';
  newItemImgData = null;
  const prev = document.getElementById('new-item-preview');
  const img = prev.querySelector('img'); if (img) img.style.display = 'none';
  document.getElementById('new-item-emoji-show').style.display = '';
  renderMenuEditor();
  toast('Item added ✓');
}

/* Open menu editor screen — always refresh */
const origGoTo = goTo;
window.goTo = function (id) {
  origGoTo(id);
  if (id === 'screen-owner-menu' || id === 'screen-owner-edit') {
    if (id === 'screen-owner-edit') switchEditTab('info');
    renderMenuEditor();
  }
  if (id === 'screen-admin-dash') renderAdminDashboard();
};


/* ══════════════════════════════════════
       UTILS
    ══════════════════════════════════════ */
function haversine(a, b, c, d) {
  const R = 6371000, p1 = a * Math.PI / 180, p2 = c * Math.PI / 180;
  const dp = (c - a) * Math.PI / 180, dl = (d - b) * Math.PI / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function calcDist(lat, lng) {
  if (!userLat || !lat || !lng) return '—';
  const m = haversine(userLat, userLng, lat, lng);
  return m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m';
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

/* Toast notification */
function toast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div'); t.id = '_toast';
    Object.assign(t.style, {
      position: 'absolute', bottom: '90px', left: '50%',
      transform: 'translateX(-50%)', background: 'rgba(26,21,16,.88)', color: '#fff',
      padding: '9px 18px', borderRadius: '50px', fontSize: '13px', fontWeight: '600',
      zIndex: '1000', transition: 'opacity .3s', whiteSpace: 'nowrap',
      boxShadow: '0 4px 18px rgba(0,0,0,.22)'
    });
    document.querySelector('.phone').appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.style.opacity = '0', 2000);
}

// Click outside auth sheet to close
document.getElementById('auth-overlay').addEventListener('click', function (e) {
  if (e.target === this) document.getElementById('auth-overlay').classList.add('off');
});


/* ══════════════════════════════════════
   EXACT STALL LOCATION PICKER
   Stall owner taps map to save exact coordinates
   ══════════════════════════════════════ */

let stallPickerMap = null;
let stallPickerMarker = null;

function getOwnerStall() {
  if (!ownerAcc) return null;
  return STALLS.find(s => s.id == ownerAcc.stallId) || STALLS[ownerAcc.stallId] || null;
}

function initStallLocationPicker() {
  const mapEl = document.getElementById('stall-picker-map');
  if (!mapEl || typeof L === 'undefined') return;

  const stall = getOwnerStall();
  const startLat = stall && stall.lat ? stall.lat : (userLat || 3.0510);
  const startLng = stall && stall.lng ? stall.lng : (userLng || 101.7455);

  if (!stallPickerMap) {
    stallPickerMap = L.map('stall-picker-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([startLat, startLng], 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20
    }).addTo(stallPickerMap);

    stallPickerMap.on('click', function (e) {
      setPickedStallLocation(e.latlng.lat, e.latlng.lng, true);
    });
  }

  setTimeout(() => {
    stallPickerMap.invalidateSize();
    stallPickerMap.setView([startLat, startLng], 18);

    if (stall && stall.lat && stall.lng) {
      setPickedStallLocation(stall.lat, stall.lng, false);
    }
  }, 120);
}

function setPickedStallLocation(lat, lng, saveNow) {
  lat = Number(lat);
  lng = Number(lng);

  if (!stallPickerMap) return;

  if (stallPickerMarker) {
    stallPickerMarker.setLatLng([lat, lng]);
  } else {
    stallPickerMarker = L.marker([lat, lng], { draggable: true }).addTo(stallPickerMap);

    stallPickerMarker.on('dragend', function () {
      const pos = stallPickerMarker.getLatLng();
      setPickedStallLocation(pos.lat, pos.lng, true);
    });
  }

  stallPickerMap.setView([lat, lng], Math.max(stallPickerMap.getZoom(), 18));

  const latInput = document.getElementById('edit-lat');
  const lngInput = document.getElementById('edit-lng');

  if (latInput) latInput.value = lat.toFixed(6);
  if (lngInput) lngInput.value = lng.toFixed(6);

  if (saveNow) {
    const stall = getOwnerStall();
    if (stall) {
      stall.lat = lat;
      stall.lng = lng;
      toast('Exact stall location saved');
    }
  }
}

function centerPickerOnMe() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      setPickedStallLocation(userLat, userLng, true);
    },
    function () {
      alert('Cannot get your current location.');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}


/* Auto-open exact location picker when Info tab is selected */
const _oldSwitchEditTab = typeof switchEditTab === 'function' ? switchEditTab : null;
if (_oldSwitchEditTab) {
  switchEditTab = function(tab) {
    _oldSwitchEditTab(tab);
    if (tab === 'info') {
      setTimeout(initStallLocationPicker, 150);
    }
  };
}


/* Auto-init location picker when owner edit screen opens */
const _oldGoToForPicker = typeof goTo === 'function' ? goTo : null;
if (_oldGoToForPicker) {
  goTo = function(id) {
    _oldGoToForPicker(id);
    if (id === 'screen-owner-edit') {
      setTimeout(initStallLocationPicker, 180);
      const stall = getOwnerStall();
      if (stall) {
        const latInput = document.getElementById('edit-lat');
        const lngInput = document.getElementById('edit-lng');
        if (latInput && stall.lat) latInput.value = Number(stall.lat).toFixed(6);
        if (lngInput && stall.lng) lngInput.value = Number(stall.lng).toFixed(6);
      }
    }
  };
}


/* Save picked lat/lng together with stall info */
const _oldSaveStallInfo = typeof saveStallInfo === 'function' ? saveStallInfo : null;
if (_oldSaveStallInfo) {
  saveStallInfo = function() {
    const stall = getOwnerStall();
    const latInput = document.getElementById('edit-lat');
    const lngInput = document.getElementById('edit-lng');

    if (stall && latInput && lngInput && latInput.value && lngInput.value) {
      stall.lat = Number(latInput.value);
      stall.lng = Number(lngInput.value);
    }

    _oldSaveStallInfo();
  };
}


function doLogout() {
  // Clear owner/admin login state
  isOwner = false;
  isAdmin = false;
  ownerAcc = null;
  activeIdx = null;

  // Close any open sheets/overlays
  const overlays = ['auth-overlay', 'role-overlay', 'admin-auth-overlay'];
  overlays.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('off');
  });

  // Go back to home screen
  if (typeof goTo === 'function') {
    goTo('screen-home');
  } else {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const home = document.getElementById('screen-home');
    if (home) home.classList.add('active');
  }
}

