/**
 * "Famous outages" view — five iconic high-visibility incidents, each with
 * left-hand plain-English storytelling + verified primary sources and
 * a bespoke interactive visual stage on the right.
 */

import { FAMOUS_OUTAGES } from '../data.js';

export function initFamousView(onSelectSlug) {
  const tabsEl = document.getElementById('famous-tabs');
  const leftEl = document.getElementById('famous-left');
  const stageEl = document.getElementById('famous-stage');

  let activeIdx = 0;
  const state = {
    crowdstrike: 'actual', // normal | actual | waves
    facebook: 'normal', // normal | erased
    gcp: 'normal', // normal | jammed | bypassed
    cloudflare: 55, // 40..115 (limit = 80)
    fastly: 0 // 0 normal | 1 triggered | 2 restored
  };

  function renderTabs() {
    if (!tabsEl) return;
    tabsEl.innerHTML = FAMOUS_OUTAGES.map(
      (item, idx) => `
      <button
        class="story-tab ${idx === activeIdx ? 'active' : ''}"
        role="tab"
        aria-selected="${idx === activeIdx}"
        data-famous-idx="${idx}"
      >
        ${item.tab}
      </button>
    `
    ).join('');
  }

  function renderLeft() {
    if (!leftEl) return;
    const item = FAMOUS_OUTAGES[activeIdx];
    leftEl.innerHTML = `
      <div>
        <div class="meta-label">${item.date} · ${item.impactLine}</div>
        <h1 class="display mt-3">${item.headline}</h1>

        <p class="lead mt-5">${item.story}</p>
        <p class="body-copy mt-4">
          <strong style="color: var(--ink); font-weight: 600;">What changed afterward:</strong>
          ${item.after}
        </p>

        <div class="mt-6">
          <div class="disclosure">
            <button class="disclosure-trigger" aria-expanded="false" data-disclosure>
              <span class="plus">+</span>
              <span>Explain it at the dinner table</span>
            </button>
            <div class="disclosure-body">${item.analogy}</div>
          </div>

          <div class="disclosure" style="margin-top: 8px;">
            <button class="disclosure-trigger" aria-expanded="false" data-disclosure>
              <span class="plus">+</span>
              <span>Under the hood (official engineering report)</span>
            </button>
            <div class="disclosure-body">${item.technical}</div>
          </div>
        </div>

        <div class="sources-block">
          <div class="meta-label">Verified primary sources</div>
          <div class="sources-list">
            ${item.sources
              .map(
                (s) =>
                  `<a href="${s.url}" target="_blank" rel="noopener noreferrer" class="footnote-link">${s.label} ↗</a>`
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderStage() {
    if (!stageEl) return;
    const item = FAMOUS_OUTAGES[activeIdx];

    // 1. CrowdStrike (2024)
    if (item.id === 'crowdstrike') {
      const mode = state.crowdstrike;
      let screens = '';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          const idx = r * 6 + c;
          const x = 92 + c * 64;
          const y = 26 + r * 46;
          const crashed = mode === 'actual' || (mode === 'waves' && idx === 0);
          const fill = crashed ? 'var(--blue-soft)' : 'var(--svg-fill)';
          const stroke = crashed ? 'var(--blue)' : 'var(--svg-stroke)';
          screens += `
            <rect x="${x}" y="${y}" width="50" height="34" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.3" style="transition: all 0.24s ease ${idx * 10}ms;"></rect>
            ${
              crashed
                ? `<text x="${x + 25}" y="${y + 21}" text-anchor="middle" fill="var(--blue)" font-size="11" font-weight="700">:(</text>`
                : `<circle cx="${x + 25}" cy="${y + 17}" r="2.5" fill="var(--calm)" opacity="0.8"></circle>`
            }
          `;
        }
      }
      const caption =
        mode === 'actual'
          ? 'What happened: Sent to 100% at once — every airport, hospital, and bank screen crashed together.'
          : mode === 'waves'
            ? 'With slow waves: Only the 1% test group caught the bug and halted rollout — 99% stayed online.'
            : 'Millions of Windows screens running smoothly before the update.';

      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">${item.stageTitle}</span>
          <span style="color: ${mode === 'actual' ? 'var(--blue)' : mode === 'waves' ? 'var(--calm)' : 'var(--ink-3)'};">
            ${mode === 'actual' ? '8.5M screens crashed' : mode === 'waves' ? 'Contained at 1%' : 'Normal'}
          </span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 220" class="stage-svg" role="img" aria-label="Grid of 24 Windows computers comparing global crash versus slow waves">${screens}</svg>
          <p class="stage-caption">${caption}</p>
        </div>
        <div class="stage-footer">
          <p class="stage-prompt"><strong>Try it:</strong> ${item.prompt}</p>
          <div class="stage-controls">
            <button class="pill-btn ${mode === 'actual' ? 'pill-btn-primary' : 'pill-btn-subtle'}" data-set="crowdstrike:actual">Push to 100% (actual)</button>
            <button class="pill-btn ${mode === 'waves' ? 'active' : 'pill-btn-subtle'}" data-set="crowdstrike:waves">Release in waves (fix)</button>
            <button class="pill-btn pill-btn-subtle" data-set="crowdstrike:normal">Reset</button>
          </div>
        </div>
      `;
      return;
    }

    // 2. Facebook / Meta (2021)
    if (item.id === 'facebook') {
      const erased = state.facebook === 'erased';
      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">${item.stageTitle}</span>
          <span style="color: ${erased ? 'var(--ember)' : 'var(--calm)'};">${erased ? 'Missing from internet map' : 'Reachable'}</span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 218" class="stage-svg" role="img" aria-label="Meta buildings remained powered on while the internet directory went blank">
            <line x1="126" y1="108" x2="224" y2="108" stroke="${erased ? 'var(--ember)' : 'var(--calm)'}" stroke-width="1.9" stroke-dasharray="${erased ? '3 6' : ''}" class="${erased ? '' : 'stream'}"></line>
            <line x1="336" y1="108" x2="434" y2="108" stroke="${erased ? 'var(--hairline)' : 'var(--calm)'}" stroke-width="1.9" opacity="${erased ? '0.22' : '1'}" class="${erased ? '' : 'stream'}"></line>

            <rect x="34" y="74" width="92" height="68" rx="14" fill="var(--svg-fill)" stroke="${erased ? 'var(--ember)' : 'var(--svg-stroke)'}" stroke-width="1.4"></rect>
            <text x="80" y="106" text-anchor="middle" fill="var(--ink)" font-size="12" font-weight="600">Your phone</text>
            <text x="80" y="124" text-anchor="middle" fill="${erased ? 'var(--ember)' : 'var(--ink-3)'}" font-size="10.5">${erased ? 'Can\'t find it' : 'Opens app'}</text>

            <rect x="224" y="70" width="112" height="76" rx="14" fill="${erased ? 'transparent' : 'var(--svg-fill)'}" stroke="${erased ? 'var(--ember)' : 'var(--svg-stroke)'}" stroke-width="1.6" stroke-dasharray="${erased ? '4 5' : ''}"></rect>
            <text x="280" y="105" text-anchor="middle" fill="${erased ? 'var(--ember)' : 'var(--ink)'}" font-size="12.5" font-weight="600">${erased ? 'Address gone' : 'Directory'}</text>
            <text x="280" y="124" text-anchor="middle" fill="var(--ink-3)" font-size="10.5">${erased ? 'Erased globally' : 'Points to Meta'}</text>

            <rect x="434" y="74" width="92" height="68" rx="14" fill="var(--svg-fill)" stroke="var(--calm)" stroke-width="1.6"></rect>
            <text x="480" y="106" text-anchor="middle" fill="var(--ink)" font-size="12" font-weight="600">Meta buildings</text>
            <text x="480" y="124" text-anchor="middle" fill="var(--calm)" font-size="10.5">Still powered on</text>
          </svg>
          <p class="stage-caption">
            ${erased ? 'The buildings never lost power—the internet simply lost every street sign pointing to them for 6 hours.' : '3.5 billion people connect smoothly through the internet\'s directory.'}
          </p>
        </div>
        <div class="stage-footer stage-footer-row">
          <p class="stage-prompt"><strong>Try it:</strong> ${item.prompt}</p>
          <button class="pill-btn ${erased ? '' : 'pill-btn-primary'}" data-set="facebook:${erased ? 'normal' : 'erased'}">
            ${erased ? 'Restore directory' : 'Erase directory'}
          </button>
        </div>
      `;
      return;
    }

    // 3. Google Cloud (June 2025)
    if (item.id === 'gcp') {
      const mode = state.gcp;
      const jammed = mode === 'jammed';
      const bypassed = mode === 'bypassed';
      const deskCol = jammed ? 'var(--ember)' : bypassed ? 'var(--amber)' : 'var(--calm)';
      const apps = ['Spotify', 'Fitbit', 'Discord', '50+ Apps'];

      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">${item.stageTitle}</span>
          <span style="color: ${deskCol};">${jammed ? 'Front desk jammed' : bypassed ? 'Emergency bypass active' : 'Flowing cleanly'}</span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 220" class="stage-svg" role="img" aria-label="One shared central check-in desk stalling 50+ dependent apps">
            ${apps
              .map((name, i) => {
                const x = 52 + i * 124;
                const flowCol = jammed ? 'var(--ember)' : 'var(--calm)';
                return `
                  <line x1="280" y1="84" x2="${x + 42}" y2="144" stroke="${flowCol}" stroke-width="1.6" stroke-dasharray="${jammed ? '3 6' : ''}" class="${jammed ? '' : 'stream'}"></line>
                  <rect x="${x}" y="144" width="84" height="46" rx="11" fill="var(--svg-fill)" stroke="${jammed ? 'var(--hairline-strong)' : 'var(--calm)'}" stroke-width="1.3"></rect>
                  <text x="${x + 42}" y="171" text-anchor="middle" fill="${jammed ? 'var(--ink-3)' : 'var(--ink)'}" font-size="11.5" font-weight="600">${name}</text>
                `;
              })
              .join('')}

            <rect x="176" y="24" width="208" height="60" rx="13" fill="var(--svg-fill)" stroke="${deskCol}" stroke-width="1.7"></rect>
            ${jammed ? `<circle cx="374" cy="34" r="9" fill="none" stroke="var(--ember)" stroke-width="1.3" class="ember-halo"></circle><circle cx="374" cy="34" r="3.8" fill="var(--ember)"></circle>` : ''}
            <text x="280" y="51" text-anchor="middle" fill="var(--ink)" font-size="12.5" font-weight="600">Shared Front Desk</text>
            <text x="280" y="70" text-anchor="middle" fill="${deskCol}" font-size="10.5">
              ${jammed ? 'Blank form → Crash loop' : bypassed ? 'Bypassed · Apps recovering' : 'Checking permissions'}
            </text>
          </svg>
          <p class="stage-caption">
            ${
              jammed
                ? 'Even though Spotify and Fitbit were healthy, every request had to pass through this jammed front desk.'
                : bypassed
                  ? 'Hitting the emergency bypass let traffic flow again while engineers fixed the blank-field check.'
                  : 'Dozens of apps quietly share one central check-in system.'
            }
          </p>
        </div>
        <div class="stage-footer">
          <p class="stage-prompt"><strong>Try it:</strong> ${item.prompt}</p>
          <div class="stage-controls">
            <button class="pill-btn ${jammed ? 'pill-btn-primary' : 'pill-btn-subtle'}" data-set="gcp:jammed">Send blank form</button>
            <button class="pill-btn ${bypassed ? 'active' : 'pill-btn-subtle'}" data-set="gcp:bypassed">Hit emergency bypass</button>
            <button class="pill-btn pill-btn-subtle" data-set="gcp:normal">Reset</button>
          </div>
        </div>
      `;
      return;
    }

    // 4. Cloudflare (Nov 2025)
    if (item.id === 'cloudflare') {
      const size = state.cloudflare;
      const limit = 80;
      const broken = size > limit;
      const barW = Math.round((size / 120) * 320);
      const limitX = 110 + Math.round((limit / 120) * 320);
      const col = broken ? 'var(--ember)' : 'var(--calm)';

      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">${item.stageTitle}</span>
          <span class="tabular" style="color: ${col};">${broken ? 'Limit exceeded · Gate crashed' : 'Fits safely inside limit'}</span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 202" class="stage-svg" role="img" aria-label="Automated bot-filter file growing past Cloudflare's built-in size limit">
            <line x1="${limitX}" y1="44" x2="${limitX}" y2="152" stroke="var(--ember)" stroke-width="1.3" stroke-dasharray="3 4"></line>
            <text x="${limitX}" y="34" text-anchor="middle" fill="var(--ink-3)" font-size="11">Built-in safety limit</text>

            <rect x="110" y="64" width="${limitX - 110}" height="68" rx="12" fill="var(--svg-fill)" stroke="${broken ? 'var(--ember)' : 'var(--svg-stroke)'}" stroke-width="1.5"></rect>

            <rect x="116" y="78" width="${barW}" height="40" rx="8" fill="${col}" fill-opacity="0.22" stroke="${col}" stroke-width="1.6" style="transition: width 0.2s ease;"></rect>
            <text x="130" y="103" fill="var(--ink)" font-size="12" font-weight="600">${broken ? 'Doubled guest list (overflows!)' : 'Bot-filter guest list'}</text>

            <text x="280" y="182" text-anchor="middle" fill="${broken ? 'var(--ember)' : 'var(--ink-2)'}" font-size="12">
              ${broken ? 'When the file doubled past the built-in limit, front gates crashed worldwide.' : 'At normal size, the list refreshes smoothly every 5 minutes.'}
            </text>
          </svg>
          <div class="slider-row">
            <span>Normal</span>
            <input type="range" min="40" max="115" value="${size}" data-cf-slider style="accent-color: ${col};" aria-label="Guest list file size" />
            <span>Doubled</span>
          </div>
        </div>
        <div class="stage-footer stage-footer-row">
          <p class="stage-prompt"><strong>Try it:</strong> ${item.prompt}</p>
          <button class="pill-btn ${broken ? '' : 'pill-btn-primary'}" data-set="cloudflare:${broken ? 55 : 110}">
            ${broken ? 'Restore normal size' : 'Double the list'}
          </button>
        </div>
      `;
      return;
    }

    // 5. Fastly (June 2021)
    const fStep = state.fastly;
    const fCol = fStep === 1 ? 'var(--ember)' : 'var(--calm)';
    const sites = [
      { name: 'News', x: 96, y: 84 },
      { name: 'Shopping', x: 218, y: 46 },
      { name: 'Social', x: 342, y: 46 },
      { name: 'Gov', x: 464, y: 84 }
    ];
    stageEl.innerHTML = `
      <div class="stage-top">
        <span style="color: var(--ink-2);">${item.stageTitle}</span>
        <span style="color: ${fCol};">${fStep === 0 ? 'Normal' : fStep === 1 ? '85% offline' : '95% back in 49 min'}</span>
      </div>
      <div class="stage-body">
        <svg viewBox="0 0 560 208" class="stage-svg" role="img" aria-label="Fastly edge network handling major news, retail, social, and government websites">
          ${sites
            .map(
              (s) => `
            <line x1="280" y1="146" x2="${s.x}" y2="${s.y + 18}" stroke="${fCol}" stroke-width="1.6" stroke-dasharray="${fStep === 1 ? '3 6' : ''}" class="${fStep === 1 ? '' : 'stream'}"></line>
            <rect x="${s.x - 40}" y="${s.y - 18}" width="80" height="36" rx="10" fill="var(--svg-fill)" stroke="${fStep === 1 ? 'var(--ember)' : 'var(--svg-stroke)'}" stroke-width="1.4"></rect>
            <text x="${s.x}" y="${s.y + 4}" text-anchor="middle" fill="${fStep === 1 ? 'var(--ink-2)' : 'var(--ink)'}" font-size="11.5" font-weight="600">${s.name}</text>
          `
            )
            .join('')}

          <circle cx="280" cy="146" r="18" fill="var(--svg-fill)" stroke="${fCol}" stroke-width="1.7"></circle>
          ${fStep === 1 ? `<circle cx="280" cy="146" r="24" fill="none" stroke="var(--ember)" stroke-width="1.3" class="ember-halo"></circle>` : ''}
          <circle cx="280" cy="146" r="5" fill="${fCol}"></circle>
          <text x="280" y="186" text-anchor="middle" fill="var(--ink-2)" font-size="11.5">
            ${
              fStep === 0
                ? 'Major news, retail, and government sites sharing one fast delivery network.'
                : fStep === 1
                  ? 'One ordinary customer setting flipped a dormant bug across 85% of the network.'
                  : 'Spotted in 1 minute, isolated, and 95% restored within 49 minutes.'
            }
          </text>
        </svg>
      </div>
      <div class="stage-footer">
        <p class="stage-prompt"><strong>Try it:</strong> ${item.prompt}</p>
        <div class="step-bar">
          <button class="step-btn ${fStep === 0 ? 'active' : ''}" data-set="fastly:0">1. Normal</button>
          <button class="step-btn ${fStep === 1 ? 'active' : ''}" data-set="fastly:1">2. Save setting</button>
          <button class="step-btn ${fStep === 2 ? 'active' : ''}" data-set="fastly:2">3. Restored (49m)</button>
        </div>
      </div>
    `;
  }

  function render() {
    renderTabs();
    renderLeft();
    renderStage();
  }

  function selectBySlug(slug) {
    const idx = FAMOUS_OUTAGES.findIndex((o) => o.id === slug);
    if (idx >= 0) {
      activeIdx = idx;
      render();
    }
  }

  if (tabsEl) {
    tabsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-famous-idx]');
      if (!btn) return;
      activeIdx = Number(btn.dataset.famousIdx);
      render();
      if (onSelectSlug) onSelectSlug(FAMOUS_OUTAGES[activeIdx].id);
    });
  }

  if (stageEl) {
    stageEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-set]');
      if (!btn) return;
      const [key, rawVal] = btn.dataset.set.split(':');
      state[key] = key === 'cloudflare' || key === 'fastly' ? Number(rawVal) : rawVal;
      renderStage();
    });

    stageEl.addEventListener('input', (e) => {
      const slider = e.target.closest('[data-cf-slider]');
      if (!slider) return;
      state.cloudflare = Number(slider.value);
      renderStage();
    });
  }

  render();

  return { render, selectBySlug };
}
