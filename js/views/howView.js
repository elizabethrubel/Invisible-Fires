/**
 * "How it works" view — six one-concept-at-a-time narrative chapters on the left,
 * paired with a sticky, fully interactive visual stage on the right.
 */

const WAVE_LEVELS = [0, 1, 5, 25, 50, 100];

export function initHowView(getCurrentView) {
  const stageEl = document.getElementById('how-stage');
  const dotsEl = document.getElementById('how-dots');
  const prevBtn = document.getElementById('how-prev-btn');
  const nextBtn = document.getElementById('how-next-btn');
  const chapterEls = Array.from(document.querySelectorAll('#view-how .chapter'));

  let activeChapter = 0;
  let scrollLock = false;
  let scrollTicking = false;

  // Interactive chapter states
  let ch1State = 'idle'; // idle | clean | typo
  let ch2WaveIdx = 1; // Starts at 1% wave
  let ch2BugCaught = false;
  let ch3Origin = 'ny'; // ny | chicago | london
  let ch4Phase = 0; // 0 idle | 1 directory | 2 building | 3 delivered
  let ch4Timer = null;
  const ch5Buildings = [
    { id: 0, name: 'Virginia', x: 86, broken: false },
    { id: 1, name: 'Iowa', x: 255, broken: false },
    { id: 2, name: 'London', x: 424, broken: false }
  ];
  let ch6Mode = 'all-at-once'; // all-at-once | lost-directory
  let ch6Triggered = false;

  function renderDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = chapterEls
      .map(
        (_, i) => `
      <button
        class="stage-dot"
        data-dot-idx="${i}"
        aria-label="Go to chapter ${i + 1}"
        style="width: ${i === activeChapter ? '24px' : '7px'}; background: ${i === activeChapter ? 'var(--ember)' : 'var(--hairline-strong)'};"
      ></button>
    `
      )
      .join('');
  }

  function renderStage() {
    if (!stageEl) return;

    // 01: WRITING CODE & PRE-FLIGHT CHECKLIST
    if (activeChapter === 0) {
      const clean = ch1State === 'clean';
      const typo = ch1State === 'typo';
      const checks = [
        { label: 'Button works on phones', ok: clean || typo },
        { label: 'Loads quickly', ok: clean || typo },
        { label: 'Didn\'t break older features', ok: clean, fail: typo }
      ];
      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">01 · Pre-flight Checklist</span>
          <span style="color: ${clean ? 'var(--calm)' : typo ? 'var(--ember)' : 'var(--ink-3)'};">
            ${clean ? 'Ready to ship' : typo ? 'Stopped before release' : 'Waiting to check'}
          </span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 228" class="stage-svg" role="img" aria-label="Automated pre-flight checks inspecting new code">
            <rect x="24" y="40" width="150" height="148" rx="14" fill="var(--svg-fill)" stroke="${typo ? 'var(--ember)' : 'var(--svg-stroke)'}" stroke-width="1.4"></rect>
            <text x="42" y="68" fill="var(--ink-3)" font-size="11" font-weight="600">NEW CODE</text>
            <line x1="42" y1="92" x2="132" y2="92" stroke="var(--ink-2)" stroke-width="2.5" stroke-linecap="round"></line>
            <line x1="42" y1="112" x2="152" y2="112" stroke="var(--ink-3)" stroke-width="2.5" stroke-linecap="round"></line>
            <line x1="42" y1="132" x2="118" y2="132" stroke="${typo ? 'var(--ember)' : 'var(--calm)'}" stroke-width="2.8" stroke-linecap="round"></line>
            <text x="42" y="164" fill="${typo ? 'var(--ember)' : 'var(--ink-3)'}" font-size="11">${typo ? 'Typo on line 3' : 'Send photo button'}</text>

            <line x1="174" y1="114" x2="212" y2="114" stroke="${ch1State === 'idle' ? 'var(--hairline-strong)' : typo ? 'var(--ember)' : 'var(--calm)'}" stroke-width="1.8" class="${ch1State !== 'idle' ? 'stream' : ''}"></line>

            <rect x="212" y="40" width="176" height="148" rx="14" fill="var(--svg-fill)" stroke="var(--svg-stroke)" stroke-width="1.3"></rect>
            <text x="228" y="66" fill="var(--ink-3)" font-size="10.5" font-weight="600">AUTOMATIC CHECKS</text>
            ${checks
              .map((c, i) => {
                const y = 94 + i * 32;
                const col = c.fail ? 'var(--ember)' : c.ok ? 'var(--calm)' : 'var(--ink-3)';
                const sym = c.fail ? '×' : c.ok ? '✓' : '·';
                return `
                  <circle cx="234" cy="${y - 4}" r="7" fill="none" stroke="${col}" stroke-width="1.3"></circle>
                  <text x="234" y="${y}" text-anchor="middle" fill="${col}" font-size="10.5" font-weight="700">${sym}</text>
                  <text x="249" y="${y}" fill="${c.fail ? 'var(--ember)' : c.ok ? 'var(--ink)' : 'var(--ink-3)'}" font-size="11">${c.label}</text>
                `;
              })
              .join('')}

            <line x1="388" y1="114" x2="424" y2="114" stroke="${clean ? 'var(--calm)' : 'var(--hairline)'}" stroke-width="1.8" class="${clean ? 'stream' : ''}"></line>

            <rect x="424" y="54" width="112" height="120" rx="16" fill="var(--svg-fill)" stroke="${clean ? 'var(--calm)' : 'var(--svg-stroke)'}" stroke-width="1.4" opacity="${typo ? '0.45' : '1'}"></rect>
            <rect x="440" y="96" width="80" height="32" rx="16" fill="${clean ? 'var(--ember)' : 'var(--surface)'}"></rect>
            <text x="480" y="116" text-anchor="middle" fill="${clean ? '#fff' : 'var(--ink-3)'}" font-size="11" font-weight="600">Send photo</text>
            <text x="480" y="154" text-anchor="middle" fill="${clean ? 'var(--calm)' : 'var(--ink-3)'}" font-size="10.5">${clean ? 'Approved' : typo ? 'Blocked safely' : 'Waiting'}</text>
          </svg>
        </div>
        <div class="stage-footer">
          <p class="stage-prompt"><strong>Try it:</strong> Run the checklist on clean code—or introduce a typo to watch the safety check block it.</p>
          <div class="stage-controls">
            <button class="pill-btn ${clean ? 'pill-btn-primary' : ''}" data-ch1="clean">Run checks (clean code)</button>
            <button class="pill-btn ${typo ? 'pill-btn-primary' : 'pill-btn-subtle'}" data-ch1="typo">Introduce a typo</button>
          </div>
        </div>
      `;
      return;
    }

    // 02: RELEASING IN PROGRESSIVE WAVES (0% -> 1% -> 5% -> 25% -> 50% -> 100%)
    if (activeChapter === 1) {
      const pct = WAVE_LEVELS[ch2WaveIdx];
      let dots = '';
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          const idx = r * 10 + c;
          const inWave = idx < pct;
          const x = 148 + c * 29.5;
          const y = 24 + r * 20;
          let fill = 'var(--dot-idle)';
          let rad = 4.6;
          let halo = '';
          if (inWave) {
            if (ch2BugCaught) {
              fill = 'var(--ember)';
              rad = 5.4;
              if (idx < 3) {
                halo = `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="var(--ember)" stroke-width="1.1" class="ember-halo"></circle>`;
              }
            } else {
              fill = pct === 100 ? 'var(--calm)' : 'var(--ember)';
              rad = 5.2;
            }
          }
          dots += `${halo}<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" style="transition: fill 0.25s ease ${(idx % 12) * 14}ms;"></circle>`;
        }
      }

      const waveNote = ch2BugCaught
        ? `Problem spotted in the ${pct}% wave! Engineers pause & roll back—the other ${100 - pct}% of people never noticed.`
        : pct === 0
          ? '0 of 100 people have the new button yet. Everyone is on yesterday\'s version.'
          : pct === 100
            ? 'All 100 people safely have the new button after passing every wave.'
            : `${pct} of 100 people are trying the new button while ${100 - pct} stay safely on the proven version.`;

      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">02 · Progressive Wave Rollout</span>
          <span class="tabular" style="color: ${ch2BugCaught ? 'var(--ember)' : pct === 100 ? 'var(--calm)' : 'var(--ink)'};">
            ${ch2BugCaught ? `Paused at ${pct}% · Rolled back` : `${pct}% of people`}
          </span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 224" class="stage-svg" role="img" aria-label="100 people receiving a new update in progressive waves">
            ${dots}
          </svg>
          <p class="stage-caption" style="color: ${ch2BugCaught ? 'var(--ember)' : 'var(--ink-2)'};">${waveNote}</p>
        </div>
        <div class="stage-footer">
          <p class="stage-prompt"><strong>Try it:</strong> Step through each wave from 1% to 100%—or trigger a hidden bug early to see how waves contain it.</p>
          <div class="step-bar">
            ${WAVE_LEVELS.map(
              (w, i) => `
              <button class="step-btn ${i === ch2WaveIdx ? 'active' : i < ch2WaveIdx && !ch2BugCaught ? 'done' : ''}" data-wave-idx="${i}">${w}%</button>
            `
            ).join('')}
          </div>
          <div class="stage-footer-row mt-3">
            <button class="pill-btn pill-btn-primary pill-btn-sm" data-wave-next>
              ${ch2WaveIdx < WAVE_LEVELS.length - 1 ? `Expand to ${WAVE_LEVELS[ch2WaveIdx + 1]}% →` : 'Start waves over'}
            </button>
            <button class="pill-btn pill-btn-subtle pill-btn-sm" data-wave-bug>What if a bug sneaks in at 5%?</button>
          </div>
        </div>
      `;
      return;
    }

    // 03: REAL BUILDINGS AROUND THE WORLD
    if (activeChapter === 2) {
      const origins = {
        ny: { label: 'New York', x: 96, y: 158, target: 'Virginia', tx: 140, ty: 78, speed: 'Answered from Virginia · ~12 milliseconds' },
        chicago: { label: 'Chicago', x: 256, y: 162, target: 'Iowa', tx: 280, ty: 78, speed: 'Answered from Iowa · ~9 milliseconds' },
        london: { label: 'London', x: 454, y: 156, target: 'London', tx: 420, ty: 78, speed: 'Answered from London · ~6 milliseconds' }
      };
      const cur = origins[ch3Origin];
      const cities = [
        { name: 'Virginia', x: 140 },
        { name: 'Iowa', x: 280 },
        { name: 'London', x: 420 }
      ];
      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">03 · Buildings Around the World</span>
          <span style="color: var(--calm);">${cur.target} is closest</span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 226" class="stage-svg" role="img" aria-label="Cloud buildings in Virginia, Iowa, and London answering requests from the closest city">
            <line x1="184" y1="78" x2="236" y2="78" stroke="var(--hairline)" stroke-width="1.2" stroke-dasharray="3 5"></line>
            <line x1="324" y1="78" x2="376" y2="78" stroke="var(--hairline)" stroke-width="1.2" stroke-dasharray="3 5"></line>

            <path d="M ${cur.x} ${cur.y - 10} Q ${(cur.x + cur.tx) / 2} 122 ${cur.tx} ${cur.ty + 30}" fill="none" stroke="var(--calm)" stroke-width="2.2" class="stream"></path>

            ${cities
              .map((c) => {
                const active = c.name === cur.target;
                return `
                  <rect x="${c.x - 44}" y="48" width="88" height="60" rx="12" fill="var(--svg-fill)" stroke="${active ? 'var(--calm)' : 'var(--svg-stroke)'}" stroke-width="${active ? '1.7' : '1.25'}"></rect>
                  <line x1="${c.x - 24}" y1="68" x2="${c.x + 24}" y2="68" stroke="${active ? 'var(--calm)' : 'var(--ink-3)'}" stroke-width="2" stroke-linecap="round"></line>
                  <line x1="${c.x - 24}" y1="81" x2="${c.x + 14}" y2="81" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" opacity="0.6"></line>
                  <text x="${c.x}" y="128" text-anchor="middle" fill="${active ? 'var(--ink)' : 'var(--ink-3)'}" font-size="11.5" font-weight="600">${c.name}</text>
                `;
              })
              .join('')}

            ${Object.entries(origins)
              .map(([key, o]) => {
                const sel = key === ch3Origin;
                return `
                  <g class="clickable-node" data-origin="${key}">
                    ${sel ? `<circle cx="${o.x}" cy="${o.y}" r="14" fill="none" stroke="var(--calm)" stroke-width="1.2" class="ember-halo"></circle>` : ''}
                    <circle cx="${o.x}" cy="${o.y}" r="7" fill="${sel ? 'var(--calm)' : 'var(--surface)'}" stroke="${sel ? 'var(--calm)' : 'var(--ink-3)'}" stroke-width="1.4" class="hit-ring"></circle>
                    <text x="${o.x}" y="${o.y + 24}" text-anchor="middle" fill="${sel ? 'var(--ink)' : 'var(--ink-3)'}" font-size="11.5" font-weight="${sel ? '700' : '500'}">You in ${o.label}</text>
                  </g>
                `;
              })
              .join('')}
          </svg>
          <p class="stage-caption">${cur.speed} — faster than a blink.</p>
        </div>
        <div class="stage-footer">
          <p class="stage-prompt"><strong>Try it:</strong> Pick where you're opening your phone to see which building answers fastest.</p>
          <div class="stage-controls">
            <button class="pill-btn ${ch3Origin === 'ny' ? 'active' : 'pill-btn-subtle'}" data-origin="ny">New York</button>
            <button class="pill-btn ${ch3Origin === 'chicago' ? 'active' : 'pill-btn-subtle'}" data-origin="chicago">Chicago</button>
            <button class="pill-btn ${ch3Origin === 'london' ? 'active' : 'pill-btn-subtle'}" data-origin="london">London</button>
          </div>
        </div>
      `;
      return;
    }

    // 04: ONE TAP ON YOUR PHONE
    if (activeChapter === 3) {
      const p = ch4Phase;
      const msg = [
        'Ready. Tap "Send photo" below to follow your request.',
        '1. Asking the directory where the app lives…',
        '2. Connecting to the nearest healthy building…',
        '3. Delivered back to your phone in under 0.1 seconds ✓'
      ][p];

      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">04 · One Round-Trip Tap</span>
          <span class="tabular" style="color: ${p === 3 ? 'var(--calm)' : 'var(--ink-3)'};">${p === 3 ? '92 ms · Delivered' : p > 0 ? 'In flight…' : 'Idle'}</span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 218" class="stage-svg" role="img" aria-label="A single tap traveling from your phone to the directory to the closest building and back">
            <line x1="126" y1="96" x2="226" y2="96" stroke="${p >= 1 ? 'var(--calm)' : 'var(--hairline-strong)'}" stroke-width="${p >= 1 ? '2.2' : '1.4'}" class="${p >= 1 ? 'stream' : ''}"></line>
            <line x1="334" y1="96" x2="434" y2="96" stroke="${p >= 2 ? 'var(--calm)' : 'var(--hairline-strong)'}" stroke-width="${p >= 2 ? '2.2' : '1.4'}" class="${p >= 2 ? 'stream' : ''}"></line>

            <path d="M 480 140 Q 280 198 80 140" fill="none" stroke="${p === 3 ? 'var(--calm)' : 'var(--hairline)'}" stroke-width="${p === 3 ? '2' : '1'}" stroke-dasharray="${p === 3 ? '5 7' : '2 6'}" class="${p === 3 ? 'stream' : ''}"></path>

            <rect x="34" y="64" width="92" height="68" rx="14" fill="var(--svg-fill)" stroke="${p === 3 ? 'var(--calm)' : 'var(--svg-stroke)'}" stroke-width="1.5"></rect>
            <text x="80" y="96" text-anchor="middle" fill="var(--ink)" font-size="12.5" font-weight="600">Your phone</text>
            <text x="80" y="114" text-anchor="middle" fill="${p === 3 ? 'var(--calm)' : 'var(--ink-3)'}" font-size="10.5">${p === 3 ? 'Photo sent ✓' : 'Tap "Send"'}</text>

            <rect x="226" y="64" width="108" height="68" rx="14" fill="var(--svg-fill)" stroke="${p >= 1 ? 'var(--calm)' : 'var(--svg-stroke)'}" stroke-width="1.5"></rect>
            <text x="280" y="96" text-anchor="middle" fill="var(--ink)" font-size="12.5" font-weight="600">Directory</text>
            <text x="280" y="114" text-anchor="middle" fill="${p >= 1 ? 'var(--calm)' : 'var(--ink-3)'}" font-size="10.5">${p >= 1 ? 'Address found' : 'Finds address'}</text>

            <rect x="434" y="64" width="92" height="68" rx="14" fill="var(--svg-fill)" stroke="${p >= 2 ? 'var(--calm)' : 'var(--svg-stroke)'}" stroke-width="1.5"></rect>
            <text x="480" y="96" text-anchor="middle" fill="var(--ink)" font-size="12.5" font-weight="600">Building</text>
            <text x="480" y="114" text-anchor="middle" fill="${p >= 2 ? 'var(--calm)' : 'var(--ink-3)'}" font-size="10.5">${p >= 2 ? 'Saved!' : 'Closest copy'}</text>
          </svg>
          <p class="stage-caption" style="color: ${p === 3 ? 'var(--calm)' : 'var(--ink-2)'};">${msg}</p>
        </div>
        <div class="stage-footer stage-footer-row">
          <p class="stage-prompt"><strong>Try it:</strong> Send a photo and watch every stop light up in sequence.</p>
          <button class="pill-btn pill-btn-primary" data-ch4-tap>Tap "Send photo"</button>
        </div>
      `;
      return;
    }

    // 05: INVISIBLE FIRES (INTERACTIVE BREAK-A-BUILDING)
    if (activeChapter === 4) {
      const healthy = ch5Buildings.filter((b) => !b.broken);
      const brokenCount = ch5Buildings.length - healthy.length;
      const allDown = healthy.length === 0;
      const target = healthy[0];
      const phoneCol = allDown ? 'var(--ember)' : 'var(--calm)';
      const statusMsg =
        brokenCount === 0
          ? 'All 3 buildings are healthy. Tap any building above to spark a fire.'
          : brokenCount < 3
            ? `Invisible fire! Traffic automatically shifted to ${target.name}—your phone stayed 100% online.`
            : 'All 3 buildings are down—only now does your phone see an outage.';

      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">05 · Interactive Fire Test</span>
          <span style="color: ${phoneCol};">${allDown ? 'Outage reached phone' : brokenCount > 0 ? 'Invisible fire contained' : 'All healthy'}</span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 232" class="stage-svg" role="img" aria-label="Interactive test: tap Virginia, Iowa, or London to break a building and watch traffic reroute">
            <rect x="165" y="12" width="230" height="48" rx="24" fill="var(--svg-fill)" stroke="${phoneCol}" stroke-width="1.5"></rect>
            <circle cx="190" cy="36" r="4" fill="${phoneCol}"></circle>
            <text x="203" y="40" fill="var(--ink)" font-size="12.5" font-weight="600">${allDown ? 'Your phone · Cannot connect' : 'Your phone · Working smoothly'}</text>

            ${ch5Buildings
              .map((b) => {
                const bx = b.x + 25;
                if (!b.broken && target && b.id === target.id) {
                  return `<path d="M 280 60 C 280 100, ${bx} 90, ${bx} 134" fill="none" stroke="var(--calm)" stroke-width="2.2" class="stream"></path>`;
                }
                if (b.broken) {
                  return `<path d="M 280 60 C 280 100, ${bx} 90, ${bx} 134" fill="none" stroke="var(--ember)" stroke-width="1.3" stroke-dasharray="2 7" opacity="0.45"></path>`;
                }
                return `<path d="M 280 60 C 280 100, ${bx} 90, ${bx} 134" fill="none" stroke="var(--hairline)" stroke-width="1.1"></path>`;
              })
              .join('')}

            ${ch5Buildings
              .map((b) => {
                const isTarget = !b.broken && target && b.id === target.id;
                const stroke = b.broken ? 'var(--ember)' : isTarget ? 'var(--calm)' : 'var(--svg-stroke)';
                return `
                  <g class="clickable-node" data-building-id="${b.id}">
                    <rect x="${b.x - 24}" y="134" width="98" height="72" rx="13" fill="var(--svg-fill)" stroke="${stroke}" stroke-width="1.6"></rect>
                    <text x="${b.x + 25}" y="166" text-anchor="middle" fill="var(--ink)" font-size="13" font-weight="600">${b.name}</text>
                    <text x="${b.x + 25}" y="187" text-anchor="middle" fill="${b.broken ? 'var(--ember)' : isTarget ? 'var(--calm)' : 'var(--ink-3)'}" font-size="10.5" font-weight="500">
                      ${b.broken ? 'Fire · Offline' : isTarget ? 'Serving you' : 'Standing by'}
                    </text>
                    ${b.broken ? `<circle cx="${b.x + 68}" cy="142" r="9" fill="none" stroke="var(--ember)" stroke-width="1.3" class="ember-halo"></circle><circle cx="${b.x + 68}" cy="142" r="3.8" fill="var(--ember)"></circle>` : ''}
                  </g>
                `;
              })
              .join('')}
          </svg>
          <p class="stage-caption" style="color: ${allDown ? 'var(--ember)' : brokenCount > 0 ? 'var(--calm)' : 'var(--ink-2)'};">${statusMsg}</p>
        </div>
        <div class="stage-footer stage-footer-row">
          <p class="stage-prompt"><strong>Try it:</strong> Tap 1, 2, or all 3 buildings directly on the diagram above.</p>
          <button class="pill-btn pill-btn-subtle pill-btn-sm" data-ch5-reset>Restore all</button>
        </div>
      `;
      return;
    }

    // 06: TWO WAYS BIG OUTAGES HAPPEN
    const isGlobal = ch6Mode === 'all-at-once';
    stageEl.innerHTML = `
      <div class="stage-top">
        <span style="color: var(--ink-2);">06 · How a Fire Reaches You</span>
        <span style="color: ${ch6Triggered ? 'var(--ember)' : 'var(--calm)'};">
          ${ch6Triggered ? 'Visible outage' : 'Normal operation'}
        </span>
      </div>
      <div class="stage-body">
        ${
          isGlobal
            ? `
          <svg viewBox="0 0 560 218" class="stage-svg" role="img" aria-label="One bad update hitting all three buildings simultaneously">
            <circle cx="280" cy="34" r="14" fill="none" stroke="${ch6Triggered ? 'var(--ember)' : 'var(--calm)'}" stroke-width="1.4" class="${ch6Triggered ? 'ember-halo' : ''}"></circle>
            <circle cx="280" cy="34" r="5" fill="${ch6Triggered ? 'var(--ember)' : 'var(--calm)'}"></circle>
            <text x="280" y="14" text-anchor="middle" fill="var(--ink-3)" font-size="10.5">${ch6Triggered ? 'Bad update pushed everywhere at once' : 'Global update'}</text>

            <path d="M 280 42 C 235 76, 155 76, 110 112" fill="none" stroke="${ch6Triggered ? 'var(--ember)' : 'var(--calm)'}" stroke-width="1.8" class="stream"></path>
            <line x1="280" y1="42" x2="280" y2="112" stroke="${ch6Triggered ? 'var(--ember)' : 'var(--calm)'}" stroke-width="1.8" class="stream"></line>
            <path d="M 280 42 C 325 76, 405 76, 450 112" fill="none" stroke="${ch6Triggered ? 'var(--ember)' : 'var(--calm)'}" stroke-width="1.8" class="stream"></path>

            ${[
              { n: 'Virginia', x: 110 },
              { n: 'Iowa', x: 280 },
              { n: 'London', x: 450 }
            ]
              .map(
                (c) => `
              <rect x="${c.x - 48}" y="112" width="96" height="62" rx="12" fill="var(--svg-fill)" stroke="${ch6Triggered ? 'var(--ember)' : 'var(--svg-stroke)'}" stroke-width="1.6"></rect>
              <text x="${c.x}" y="142" text-anchor="middle" fill="var(--ink)" font-size="12.5" font-weight="600">${c.n}</text>
              <text x="${c.x}" y="160" text-anchor="middle" fill="${ch6Triggered ? 'var(--ember)' : 'var(--calm)'}" font-size="10.5">${ch6Triggered ? 'Hit simultaneously' : 'Healthy'}</text>
            `
              )
              .join('')}
          </svg>
        `
            : `
          <svg viewBox="0 0 560 218" class="stage-svg" role="img" aria-label="Healthy buildings unreachable when the internet directory disappears">
            <line x1="126" y1="112" x2="226" y2="112" stroke="${ch6Triggered ? 'var(--ember)' : 'var(--calm)'}" stroke-width="1.8" stroke-dasharray="${ch6Triggered ? '3 6' : ''}" class="${ch6Triggered ? '' : 'stream'}"></line>
            <line x1="334" y1="112" x2="434" y2="112" stroke="${ch6Triggered ? 'var(--hairline)' : 'var(--calm)'}" stroke-width="1.8" opacity="${ch6Triggered ? '0.25' : '1'}" class="${ch6Triggered ? '' : 'stream'}"></line>

            <rect x="34" y="78" width="92" height="68" rx="14" fill="var(--svg-fill)" stroke="${ch6Triggered ? 'var(--ember)' : 'var(--svg-stroke)'}" stroke-width="1.4"></rect>
            <text x="80" y="116" text-anchor="middle" fill="var(--ink)" font-size="12" font-weight="600">Your phone</text>

            <rect x="226" y="74" width="108" height="76" rx="14" fill="${ch6Triggered ? 'transparent' : 'var(--svg-fill)'}" stroke="${ch6Triggered ? 'var(--ember)' : 'var(--svg-stroke)'}" stroke-width="1.6" stroke-dasharray="${ch6Triggered ? '4 5' : ''}"></rect>
            <text x="280" y="109" text-anchor="middle" fill="${ch6Triggered ? 'var(--ember)' : 'var(--ink)'}" font-size="12.5" font-weight="600">${ch6Triggered ? 'Missing!' : 'Directory'}</text>
            <text x="280" y="128" text-anchor="middle" fill="var(--ink-3)" font-size="10.5">${ch6Triggered ? 'No address found' : 'Finds buildings'}</text>

            <rect x="434" y="78" width="92" height="68" rx="14" fill="var(--svg-fill)" stroke="var(--calm)" stroke-width="1.5"></rect>
            <text x="480" y="110" text-anchor="middle" fill="var(--ink)" font-size="12" font-weight="600">Buildings</text>
            <text x="480" y="128" text-anchor="middle" fill="var(--calm)" font-size="10.5">Still healthy!</text>
          </svg>
        `
        }
        <p class="stage-caption">
          ${
            isGlobal
              ? ch6Triggered
                ? 'Backup buildings can\'t help if the exact same mistake reaches all of them at once.'
                : 'Choose a scenario below to see why redundancy wasn\'t enough.'
              : ch6Triggered
                ? 'Even healthy buildings go unreachable when the internet\'s directory goes blank.'
                : 'All buildings are healthy and easy to find.'
          }
        </p>
      </div>
      <div class="stage-footer">
        <p class="stage-prompt"><strong>Try it:</strong> Switch between the two main ways big outages happen.</p>
        <div class="stage-controls">
          <button class="pill-btn ${isGlobal && ch6Triggered ? 'pill-btn-primary' : 'pill-btn-subtle'}" data-ch6="all-at-once">1. Bad update everywhere</button>
          <button class="pill-btn ${!isGlobal && ch6Triggered ? 'pill-btn-primary' : 'pill-btn-subtle'}" data-ch6="lost-directory">2. Lost directory</button>
        </div>
      </div>
    `;
  }

  function activateChapter(idx, shouldScroll = false) {
    activeChapter = Math.max(0, Math.min(chapterEls.length - 1, idx));
    chapterEls.forEach((el, i) => el.classList.toggle('active', i === activeChapter));
    renderStage();
    renderDots();

    if (shouldScroll) {
      const target = chapterEls[activeChapter];
      if (target) {
        scrollLock = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          scrollLock = false;
        }, 520);
      }
    }
  }

  // Event delegation on stage
  if (stageEl) {
    stageEl.addEventListener('click', (e) => {
      const ch1Btn = e.target.closest('[data-ch1]');
      if (ch1Btn) {
        ch1State = ch1Btn.dataset.ch1;
        renderStage();
        return;
      }

      const waveBtn = e.target.closest('[data-wave-idx]');
      if (waveBtn) {
        ch2BugCaught = false;
        ch2WaveIdx = Number(waveBtn.dataset.waveIdx);
        renderStage();
        return;
      }

      if (e.target.closest('[data-wave-next]')) {
        ch2BugCaught = false;
        ch2WaveIdx = (ch2WaveIdx + 1) % WAVE_LEVELS.length;
        renderStage();
        return;
      }

      if (e.target.closest('[data-wave-bug]')) {
        if (ch2WaveIdx === 0 || ch2WaveIdx > 2) ch2WaveIdx = 2;
        ch2BugCaught = true;
        renderStage();
        return;
      }

      const originEl = e.target.closest('[data-origin]');
      if (originEl) {
        ch3Origin = originEl.dataset.origin;
        renderStage();
        return;
      }

      if (e.target.closest('[data-ch4-tap]')) {
        if (ch4Timer) clearTimeout(ch4Timer);
        ch4Phase = 1;
        renderStage();
        ch4Timer = setTimeout(() => {
          ch4Phase = 2;
          renderStage();
          ch4Timer = setTimeout(() => {
            ch4Phase = 3;
            renderStage();
          }, 520);
        }, 520);
        return;
      }

      const bld = e.target.closest('[data-building-id]');
      if (bld) {
        const id = Number(bld.dataset.buildingId);
        ch5Buildings[id].broken = !ch5Buildings[id].broken;
        renderStage();
        return;
      }

      if (e.target.closest('[data-ch5-reset]')) {
        ch5Buildings.forEach((b) => {
          b.broken = false;
        });
        renderStage();
        return;
      }

      const ch6Btn = e.target.closest('[data-ch6]');
      if (ch6Btn) {
        ch6Mode = ch6Btn.dataset.ch6;
        ch6Triggered = true;
        renderStage();
      }
    });
  }

  // Click chapter on left to focus it
  chapterEls.forEach((el, i) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      activateChapter(i, false);
    });
  });

  if (dotsEl) {
    dotsEl.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-dot-idx]');
      if (dot) activateChapter(Number(dot.dataset.dotIdx), true);
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => activateChapter(activeChapter - 1, true));
  if (nextBtn) nextBtn.addEventListener('click', () => activateChapter(activeChapter + 1, true));

  // Smooth viewport-midpoint scroll tracker (works cleanly in full browsers with position: sticky)
  function syncOnScroll() {
    scrollTicking = false;
    if (getCurrentView() !== 'how' || scrollLock) return;
    const targetY = window.innerHeight * 0.44;
    let bestIdx = activeChapter;
    let bestDist = Infinity;
    chapterEls.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height * 0.5;
      const dist = Math.abs(mid - targetY);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });
    if (bestIdx !== activeChapter) {
      activateChapter(bestIdx, false);
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      if (getCurrentView() !== 'how' || scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(syncOnScroll);
    },
    { passive: true }
  );

  // Keyboard arrow stepping
  window.addEventListener('keydown', (e) => {
    if (getCurrentView() !== 'how') return;
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      activateChapter(activeChapter + 1, true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      activateChapter(activeChapter - 1, true);
    }
  });

  renderStage();
  renderDots();

  return { renderStage, renderDots, activateChapter };
}
