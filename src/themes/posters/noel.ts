export const poster = `
  <div class="p-noel-stars"></div>
  <div class="p-noel-moon"></div>
  <div class="p-noel-hills"><i></i><i></i></div>
  <div class="p-noel-pines"><i></i><i></i><i></i><i></i></div>
  <div class="p-noel-cabin"><span class="w1"></span><span class="w2"></span></div>
  <div class="p-noel-title">Тихо<br><em>идёт снег</em></div>
  <div class="p-noel-snow">${Array.from({ length: 14 }, (_, i) => {
    const x = (i * 37) % 100, s = 1.2 + (i % 3) * 0.7, d = 5 + (i % 5), delay = -(i * 0.7);
    return `<i style="--x:${x}%;--s:${s}px;--d:${d}s;--delay:${delay}s"></i>`;
  }).join('')}</div>
  <div class="p-noel-foot">СОЧЕЛЬНИК · 02</div>`;
