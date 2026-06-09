/* ══════════════════════════════════════
       RESULTS
    ══════════════════════════════════════ */
    function sortByDist(list) {
      if (!userLat) return list; // no location — keep original order
      return [...list].sort((a, b) => {
        const da = (a.lat && a.lng) ? haversine(userLat, userLng, a.lat, a.lng) : Infinity;
        const db2 = (b.lat && b.lng) ? haversine(userLat, userLng, b.lat, b.lng) : Infinity;
        return da - db2;
      });
    }
    function renderResults(list) {
      list = list.filter(s => String(s.status || '').trim().toUpperCase() !== 'INACTIVE');
      console.log(list);

      document.getElementById('res-cnt').textContent = `${list.length} stall${list.length !== 1 ? 's' : ''}`;
      // Map pins
      const pinPositions = [
        { l: '13%', t: '38%' }, { l: '55%', t: '52%' }, { l: '80%', t: '26%' }, { l: '35%', t: '70%' }, { l: '68%', t: '68%' },
        { l: '20%', t: '60%' }, { l: '45%', t: '30%' }, { l: '75%', t: '50%' }, { l: '25%', t: '20%' }, { l: '60%', t: '80%' },
      ];
      document.getElementById('map-pins').innerHTML = list.slice(0, 10).map((s, i) => `
    <div class="r-pin" style="left:${pinPositions[i % pinPositions.length].l};top:${pinPositions[i % pinPositions.length].t};"
      onclick="openStall('${s.id}','screen-results')">${i + 1}</div>`).join('');

      document.getElementById('res-list').innerHTML = list.length ? list.map((s, i) => `
    <div class="res-card" onclick="openStall('${s.id}','screen-results')">
      <div class="res-thumb" style="${s.coverImg ? '' : 'background:' + s.bg}">
        ${s.coverImg ? `<img src="${s.coverImg}" alt=""/>` : `<span>${s.ownerEmoji}</span>`}
      </div>
      <div class="res-info">
        <div class="res-name">${s.name}</div>
        <div class="res-dist">📍 ${calcDist(s.lat, s.lng)}</div>
        <div class="res-from">${s.menu.length ? 'from ' + s.menu[0].price : 'No menu yet'}</div>
      </div>
      <div class="res-right">
        <span class="spill ${s.status}">${cap(s.status)}</span>
        <button class="view-btn" onclick="event.stopPropagation();openStall('${s.id}','screen-results')">View</button>
      </div>
    </div>`).join('')
        : '<div style="padding:32px 18px;text-align:center;font-size:14px;color:var(--hint);">No stalls found for this category.</div>';
    }

    