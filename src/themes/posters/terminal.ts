export const poster = `
  <div class="p-tm-head"><i></i><i></i><i></i><span>~/meridian — revenue</span></div>
  <div class="p-tm-body">
    <div class="p-tm-row"><b>42,1</b><span>МЛН ₽</span><em>▲ 2,0%</em></div>
    <div class="p-tm-candles">
      ${[42, 58, 51, 66, 61, 74, 68, 82, 76, 88, 79, 92].map((h, i) =>
        `<i style="--h:${h}%;--c:${i % 3 === 2 ? '#ff6b5e' : '#45e0c0'}"></i>`).join('')}
    </div>
    <div class="p-tm-log">&gt; scan --segment=all --window=30d<br>&gt; nrr 110.5% · churn 1.9% · ok<br>&gt; <span class="caret">█</span></div>
  </div>
  <div class="p-tm-foot"><span>TERMINAL</span><span>04</span></div>`;
