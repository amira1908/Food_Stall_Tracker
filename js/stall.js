/* ══════════════════════════════════════
       STALL DETAIL
    ══════════════════════════════════════ */
    async function openStall(idx, from) {
      activeIdx = idx;
      stallFromScreen = from || 'screen-results';
      const s = STALLS.find(stall => stall.id == idx) || STALLS[idx];

      // Hero
      const heroEl = document.getElementById('detail-hero');
      const heroImg = document.getElementById('detail-hero-img');
      const heroEmoji = document.getElementById('detail-hero-emoji');
      if (s.coverImg) {
        heroImg.src = s.coverImg; heroImg.style.display = '';
        heroEmoji.style.display = 'none';
        heroEl.style.background = '#000';
      } else {
        heroImg.style.display = 'none';
        heroEmoji.style.display = ''; heroEmoji.textContent = s.ownerEmoji;
        heroEl.style.background = s.bg;
      }

      // Back button points to source
      document.getElementById('hero-back-btn').setAttribute('onclick', `goTo('${stallFromScreen}')`);

      document.getElementById('detail-name').textContent = s.name;
      const sp = document.getElementById('detail-status-pill');
      sp.textContent = cap(s.status); sp.className = 'spill ' + s.status;
      document.getElementById('detail-dist').textContent = '📍 ' + calcDist(s.lat, s.lng);
      document.getElementById('detail-hours').textContent = '⏰ ' + s.hours;
      document.getElementById('detail-address').textContent = '🏪 Address: ' + (s.address || 'Address not available');

      // Direction btn
      const db = document.getElementById('dir-btn');
      db.className = 'dir-btn' + (userLat ? '' : ' dim');
      db.title = userLat ? '' : 'Enable location for directions';

      // Owner vs user
      const isMyStall = isOwner && ownerAcc && ownerAcc.stallId === idx;
      document.getElementById('owner-bar').className = 'owner-bar' + (isMyStall ? ' on' : '');
      document.getElementById('readonly-bar').className = 'readonly-bar' + (!isOwner ? ' on' : '');

      // Menu — customer sees only image/emoji + name + price
      document.getElementById('detail-menu').innerHTML = s.menu.length
        ? s.menu.map(m => `
      <div class="menu-row" style="display:flex;justify-content:space-between;align-items:center;">
        <div class="menu-pic" style="${m.img ? '' : 'background:#f0ece4'}">
          ${m.img ? `<img src="${m.img}" alt=""/>` : `<span>🍽️</span>`}
        </div>
        <div class="menu-item-info">
          <div class="menu-item-name">${esc(m.name)}</div>
          <div class="menu-item-price">${esc(m.price)}</div>
        </div>

          ${(() => {
            const st = String(m.status || 'AVAILABLE').toUpperCase();

            const bg =
              st === 'SOLD OUT'
                ? '#fff3cd'
                : st === 'UNAVAILABLE'
                ? '#ffe1e1'
                : '#e8f7ec';

            const color =
              st === 'SOLD OUT'
                ? '#a36b00'
                : st === 'UNAVAILABLE'
                ? '#c0392b'
                : '#16834a';

            return `
              <div style="
                margin-left:10px;
                padding:4px 10px;
                border-radius:999px;
                font-size:11px;
                font-weight:700;
                background:${bg};
                color:${color};
                white-space:nowrap;
              ">
                ${st}
              </div>
            `;
          })()}
        </div>
      </div>`).join('')
        : '<div style="padding:24px 18px;font-size:13px;color:var(--hint);">No menu items yet.</div>';

      origGoTo('screen-stall');
    }

    /* ══════════════════════════════════════
       DIRECTIONS
    ══════════════════════════════════════ */
    // Each stall has a unique short walk time (all within campus = within 5 mins)
    const STALL_WALK = [
      { mins: 3, dist: '240m' },  // Abang Gpuk
      { mins: 4, dist: '320m' },  // Pool Cafe
      { mins: 2, dist: '160m' },  // Kedai Pak Mat
      { mins: 5, dist: '390m' },  // Warung Mak Siti
      { mins: 4, dist: '310m' },  // Restoran Al-Baik
    ];
    function openDir() {
      if (!userLat || !userLng) {
        toast('Enable location first');
        return;
      }

      const s = STALLS.find(stall => stall.id == activeIdx) || STALLS[activeIdx];

      if (typeof openRealGoogleDirections === 'function') {
        openRealGoogleDirections(s);
        return;
      }

      document.getElementById('dir-nav-title').textContent = 'To ' + s.name;
      document.getElementById('dir-dist').textContent = calcDist(s.lat, s.lng);
      document.getElementById('dir-time').textContent = 'Google Map not loaded';
      document.getElementById('dir-dest-nm').textContent = s.name;
      document.getElementById('dir-steps').innerHTML = `
        <div class="step-row">
          <div class="step-n">1</div>
          <div>
            <div class="step-t">Add google-map.js and your Google Maps API key.</div>
            <div class="step-d">Fallback distance only</div>
          </div>
        </div>`;
      origGoTo('screen-dir');
    }
