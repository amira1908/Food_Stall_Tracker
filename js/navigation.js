/* ══════════════════════════════════════
       NAVIGATION
    ══════════════════════════════════════ */
    function goTo(id) {
      const cur = document.querySelector('.screen.active');
      if (cur) stallFromScreen = cur.id;
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }
