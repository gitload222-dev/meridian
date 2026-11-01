export const poster = `
  <div class="p-hb-grain"></div>
  <svg class="p-hb-plant" viewBox="0 0 100 130">
    <path d="M50,124 C46,92 54,64 50,22" stroke="#3f5741" stroke-width="1.4" fill="none"/>
    ${[0,1,2,3,4,5].map(i => {
      const y = 30 + i * 15, side = i % 2 ? 1 : -1;
      return `<path d="M${50 + (i % 2 ? 2 : -2)},${y} Q${50 + side * 16},${y - 9} ${50 + side * 26},${y - 16} Q${50 + side * 12},${y - 4} ${50 + (i % 2 ? 2 : -2)},${y}" fill="#7d9270" fill-opacity=".55" stroke="#3f5741" stroke-width=".8"/>`;
    }).join('')}
    <circle cx="50" cy="20" r="3.4" fill="#c2674b" fill-opacity=".6"/>
  </svg>
  <div class="p-hb-type">Гер-<br>барий</div>
  <div class="p-hb-latin">REVENUE · SPECIMEN 06</div>
  <div class="p-hb-rule"></div>
  <div class="p-hb-num">42,1</div>
  <div class="p-hb-foot"><span>ПОЛЕВОЙ ЖУРНАЛ</span><span>06</span></div>`;
