function openSearch() {
      origGoTo('screen-search');
      const inp = document.getElementById('sinput');
      inp.value = '';
      renderSugs(SUGS); // reset suggestions
      setTimeout(() => inp.focus(), 80);
    }
    function onSearchInput(val) {
      const q = val.trim().toLowerCase();
      if (!q) { renderSugs(SUGS); return; }
      // Show matching suggestions AND matching stalls inline
      const matchedSugs = SUGS.filter(s => s.n.toLowerCase().includes(q));
      const matchedStalls = STALLS.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.menu.some(m => m.name.toLowerCase().includes(q) || (m.desc || '').toLowerCase().includes(q))
      );
      // Render: suggestions on top, then matching stalls as quick results
      const sugHtml = matchedSugs.map(s => `
    <div class="sug-item" onclick="doSearch('${s.n}')">
      <div class="sug-l"><div class="sug-ico">${s.e}</div><span class="sug-nm">${s.n}</span></div>
      <span class="sug-arr">›</span>
    </div>`).join('');
      const stallHtml = sortByDist(matchedStalls).map(s => `
    <div class="sug-item" onclick="event.stopPropagation(); openStall('${s.id}','screen-search')">
      <div class="sug-l">
        <div class="sug-ico" style="${s.coverImg ? 'overflow:hidden;padding:0;' : ''}">${s.coverImg ? `<img src="${s.coverImg}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>` : `<span>${s.ownerEmoji}</span>`}</div>
        <div>
          <div class="sug-nm">${s.name}</div>
          <div style="font-size:11px;color:var(--sub);margin-top:1px;">${calcDist(s.lat, s.lng)} · <span class="spill ${s.status}" style="font-size:10px;padding:2px 7px;">${cap(s.status)}</span></div>
        </div>
      </div>
      <span class="sug-arr">›</span>
    </div>`).join('');
      document.getElementById('sug-list').innerHTML =
        (sugHtml ? `<div style="padding:8px 18px 4px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--hint);">Suggestions</div>` + sugHtml : '') +
        (stallHtml ? `<div style="padding:8px 18px 4px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--hint);">Stalls</div>` + stallHtml : '') +
        (!sugHtml && !stallHtml ? `<div style="padding:32px 18px;text-align:center;font-size:13px;color:var(--hint);">No results found.</div>` : '');
    }

    /* ══════════════════════════════════════
       SEARCH
    ══════════════════════════════════════ */
    function startSearch(term) {
      // Category tap: go directly to results filtered by that category
      const filtered = STALLS
      .filter(s => String(s.status|| '').trim().toLowerCase() !== 'INACTIVE')
      .filter(s =>
        s.menu.some(m =>
          m.name.toLowerCase().includes(term.toLowerCase()) ||
          (m.desc || '').toLowerCase().includes(term.toLowerCase())
        ) ||
        s.name.toLowerCase().includes(term.toLowerCase())
      );

      const sorted = sortByDist(filtered);
      document.getElementById('res-input').value = term;
      document.getElementById('res-lbl').textContent = `"${term}" stalls`;
      document.getElementById('res-cnt').textContent = `${sorted.length} stall${sorted.length !== 1 ? 's' : ''}`;
      renderResults(sorted);
      origGoTo('screen-results');
    }
    function filterSugs(val) {
      const q = val.trim().toLowerCase();
      renderSugs(q ? SUGS.filter(s => s.n.toLowerCase().includes(q)) : SUGS);
    }
    function renderSugs(list) {
      document.getElementById('sug-list').innerHTML = list.map(s => `
    <div class="sug-item" onclick="doSearch('${s.n}')">
      <div class="sug-l"><div class="sug-ico">${s.e}</div><span class="sug-nm">${s.n}</span></div>
      <span class="sug-arr">›</span>
    </div>`).join('');
    }
    function doSearch(q) {
      const trimmed = q.trim();
      if (!trimmed) return;
      // Filter stalls whose name or any menu item matches, then sort by distance
      const filtered = trimmed
        ? STALLS.filter(s =>
          s.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          s.address.toLowerCase().includes(trimmed.toLowerCase()) ||
          s.menu.some(m =>
            m.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            (m.desc || '').toLowerCase().includes(trimmed.toLowerCase())
          )
        )
        : STALLS;
      const sorted = sortByDist(filtered);
      document.getElementById('res-input').value = trimmed;
      document.getElementById('res-lbl').textContent = `Results for "${trimmed}"`;
      document.getElementById('res-cnt').textContent = `${sorted.length} stall${sorted.length !== 1 ? 's' : ''}`;
      renderResults(sorted);
      origGoTo('screen-results');
    }
