---
layout: page
permalink: /chess/
title: chess
description: my chess.com rapid rating since May 2025 (@deepcroaker)
nav: true
nav_order: 5
chart:
  chartjs: true
---

<div id="chess-summary" style="margin-bottom: 1.5rem;">
  <p>Loading rating history from <a href="https://www.chess.com/member/deepcroaker">chess.com/member/deepcroaker</a>...</p>
</div>

<div style="position: relative; height: 400px;">
  <canvas id="chess-rapid-chart"></canvas>
</div>

<script>
(async function () {
  const USERNAME = 'deepcroaker';
  const START_YEAR = 2025;
  const START_MONTH = 5;
  const summaryEl = document.getElementById('chess-summary');

  function monthsSince(y, m) {
    const out = [];
    const now = new Date();
    let year = y, month = m;
    while (year < now.getUTCFullYear() || (year === now.getUTCFullYear() && month <= now.getUTCMonth() + 1)) {
      out.push([year, month]);
      month++;
      if (month > 12) { month = 1; year++; }
    }
    return out;
  }

  async function fetchArchive(year, month) {
    const url = `https://api.chess.com/pub/player/${USERNAME}/games/${year}/${String(month).padStart(2, '0')}`;
    const res = await fetch(url);
    if (!res.ok) return { games: [] };
    return res.json();
  }

  try {
    const months = monthsSince(START_YEAR, START_MONTH);
    const archives = await Promise.all(months.map(([y, m]) => fetchArchive(y, m)));
    const points = [];
    for (const archive of archives) {
      for (const game of archive.games || []) {
        if (game.time_class !== 'rapid') continue;
        const me = game.white.username.toLowerCase() === USERNAME
          ? game.white
          : game.black.username.toLowerCase() === USERNAME
            ? game.black
            : null;
        if (!me || typeof me.rating !== 'number') continue;
        points.push({ x: game.end_time * 1000, y: me.rating });
      }
    }
    points.sort((a, b) => a.x - b.x);

    if (points.length === 0) {
      summaryEl.innerHTML = '<p>No rapid games found since May 2025.</p>';
      return;
    }

    const latest = points[points.length - 1].y;
    const peak = Math.max(...points.map(p => p.y));
    const low = Math.min(...points.map(p => p.y));
    summaryEl.innerHTML = `
      <p><strong>Current:</strong> ${latest} &nbsp;|&nbsp;
      <strong>Peak:</strong> ${peak} &nbsp;|&nbsp;
      <strong>Low:</strong> ${low} &nbsp;|&nbsp;
      <strong>Games:</strong> ${points.length}</p>
    `;

    const labels = points.map(p => new Date(p.x).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
    const ratings = points.map(p => p.y);

    const ctx = document.getElementById('chess-rapid-chart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Rapid rating',
          data: ratings,
          borderColor: '#b509ac',
          backgroundColor: 'rgba(181, 9, 172, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'date' },
            ticks: { maxTicksLimit: 8, autoSkip: true },
          },
          y: {
            title: { display: true, text: 'rating' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `Rating: ${item.parsed.y}`,
            },
          },
        },
      },
    });
  } catch (err) {
    summaryEl.innerHTML = `<p>Failed to load chess.com data: ${err.message}</p>`;
  }
})();
</script>
