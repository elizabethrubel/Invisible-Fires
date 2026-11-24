/**
 * "Right now" view — consumes data/live-status.json (updated every 30 min by GitHub Actions)
 * and renders calm plain-English status, active outage explanation (real or previewed),
 * and recent verified major outages with an interactive right-hand stage.
 */

import { FALLBACK_LIVE_STATUS } from '../data.js';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatUpdatedTime(iso) {
  if (!iso) return 'Recently checked';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Recently checked';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function initNowView() {
  let statusData = FALLBACK_LIVE_STATUS;
  let previewActiveOutage = false;
  let selectedRecentId = null;
  let rerouteStep = 2;

  const leftHeroEl = document.getElementById('now-left-hero');
  const previewBtn = document.getElementById('now-preview-toggle');
  const recentListEl = document.getElementById('recent-list');
  const stageEl = document.getElementById('now-stage');
  const homeDot = document.getElementById('home-status-dot');
  const homeText = document.getElementById('home-status-text');

  async function loadLiveStatus() {
    try {
      const res = await fetch('./data/live-status.json', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.providers)) {
          statusData = json;
        }
      }
    } catch {
      // Fallback already populated
    }
    syncHomePulse();
    render();
  }

  function hasRealActive() {
    return Array.isArray(statusData.activeIncidents) && statusData.activeIncidents.length > 0;
  }

  function isShowingActive() {
    return hasRealActive() || previewActiveOutage;
  }

  function syncHomePulse() {
    if (!homeDot || !homeText) return;
    if (hasRealActive()) {
      const first = statusData.activeIncidents[0];
      homeDot.style.background = 'var(--ember)';
      homeText.textContent = `Right now: ${first.provider} is working through an active disruption.`;
    } else if (previewActiveOutage) {
      homeDot.style.background = 'var(--ember)';
      homeText.textContent = 'Preview active: A major hub is rerouting traffic right now.';
    } else {
      homeDot.style.background = 'var(--calm)';
      homeText.textContent = 'Right now, the major clouds are quiet.';
    }
  }

  function renderLeftHero() {
    if (!leftHeroEl) return;
    const updatedLabel = formatUpdatedTime(statusData.updatedAt);

    if (hasRealActive()) {
      const inc = statusData.activeIncidents[0];
      if (previewBtn) previewBtn.classList.add('hidden');
      leftHeroEl.innerHTML = `
        <div class="meta-label" style="color: var(--ember); display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
          <span class="status-dot" style="background: var(--ember);"></span>
          <span>Live disruption · ${escapeHtml(inc.provider)} · Checked ${escapeHtml(updatedLabel)}</span>
        </div>
        <h1 class="display">${escapeHtml(inc.headline)}</h1>
        <p class="lead mt-4">${escapeHtml(inc.plainSummary)}</p>
        <p class="body-copy mt-4">
          <strong style="color: var(--ink); font-weight: 600;">Your accounts and data are safe.</strong>
          Engineers are working to steer traffic around the problem and restore normal service.
        </p>
        ${
          inc.officialTitle
            ? `
          <div class="disclosure">
            <button class="disclosure-trigger" aria-expanded="false" data-disclosure>
              <span class="plus">+</span>
              <span>What is the official status notice?</span>
            </button>
            <div class="disclosure-body">${escapeHtml(inc.officialTitle)}</div>
          </div>
        `
            : ''
        }
        ${inc.officialUrl ? `<div class="mt-4"><a class="footnote-link" href="${escapeHtml(inc.officialUrl)}" target="_blank" rel="noopener noreferrer">Official ${escapeHtml(inc.provider)} status report ↗</a></div>` : ''}
      `;
      return;
    }

    if (previewBtn) {
      previewBtn.classList.remove('hidden');
      previewBtn.textContent = previewActiveOutage
        ? 'Return to actual live status (quiet)'
        : 'Preview how this page looks during an active outage';
    }

    if (!previewActiveOutage) {
      leftHeroEl.innerHTML = `
        <div class="meta-label" style="color: var(--calm); display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
          <span class="status-dot" style="background: var(--calm);"></span>
          <span>All major networks normal · Checked ${escapeHtml(updatedLabel)}</span>
        </div>
        <h1 class="display">Everything major is quiet right now.</h1>
        <p class="lead mt-4">
          Google Cloud, Amazon, Microsoft, Cloudflare, and GitHub are all running normally. If one app isn't loading for you, it's likely your Wi-Fi or a small issue inside that single app.
        </p>
      `;
    } else {
      leftHeroEl.innerHTML = `
        <div class="meta-label" style="color: var(--ember); display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
          <span class="status-dot" style="background: var(--ember);"></span>
          <span>Simulated Active Outage Preview · Started 18 minutes ago</span>
        </div>
        <h1 class="display">Yes—several apps are having trouble right now.</h1>
        <p class="lead mt-4">
          An East Coast traffic hub is struggling to pass requests through.
          <strong style="color: var(--ink); font-weight: 600;">Your accounts and data are safe</strong>—engineers are steering traffic around it now.
        </p>
        <div class="disclosure">
          <button class="disclosure-trigger" aria-expanded="false" data-disclosure>
            <span class="plus">+</span>
            <span>Why isn't the exact cause announced yet?</span>
          </button>
          <div class="disclosure-body">
            Just like firefighters put out a fire before inspecting the wiring, on-call engineers focus 100% on restoring service first. A verified explanation is published afterward once everything is calm.
          </div>
        </div>
      `;
    }
  }

  function renderRecentList() {
    if (!recentListEl) return;
    const recent = statusData.recentIncidents || [];
    recentListEl.innerHTML = recent
      .map((item) => {
        const open = selectedRecentId === item.id;
        return `
          <div class="incident-row">
            <button class="incident-toggle" data-recent-id="${escapeHtml(item.id)}" aria-expanded="${open}">
              <div>
                <div class="meta-label">
                  <strong style="color: var(--ink-2);">${escapeHtml(item.who)}</strong> · ${escapeHtml(item.date)}
                </div>
                <div style="font-size: 15.5px; font-weight: 500; margin-top: 4px; color: var(--ink);">
                  ${escapeHtml(item.oneLiner)}
                </div>
              </div>
              <span style="font-size: 18px; flex-shrink: 0; color: ${open ? 'var(--ember)' : 'var(--ink-3)'};">${open ? '−' : '+'}</span>
            </button>
            ${
              open
                ? `
              <div class="incident-detail">
                <p class="body-copy"><strong style="color: var(--ink); font-weight: 600;">What people noticed:</strong> ${escapeHtml(item.whatYouSaw)}</p>
                <p class="body-copy"><strong style="color: var(--ink); font-weight: 600;">Why it happened:</strong> ${escapeHtml(item.why)}</p>
                <p class="analogy-quote">${escapeHtml(item.analogy)}</p>
                <div>
                  <button class="disclosure-trigger" aria-expanded="false" data-disclosure>
                    <span class="plus">+</span>
                    <span>Under the hood (official report)</span>
                  </button>
                  <div class="disclosure-body">${escapeHtml(item.technical)}</div>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 14px; padding-top: 4px;">
                  ${(item.sources || [])
                    .map(
                      (s) =>
                        `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="footnote-link">${escapeHtml(s.label)} ↗</a>`
                    )
                    .join('')}
                </div>
              </div>
            `
                : ''
            }
          </div>
        `;
      })
      .join('');
  }

  function renderStage() {
    if (!stageEl) return;
    const recent = statusData.recentIncidents || [];
    const selected = recent.find((r) => r.id === selectedRecentId);

    if (selected) {
      const layerMap = {
        gateway: { title: 'Network Gateways', note: 'Heavy traffic woke a dormant software bug at the entrance.' },
        power: { title: 'London Building Power', note: 'External power loss shifted traffic to nearby London buildings.' },
        gate: { title: 'Front-Gate Filter', note: 'An oversized security list exceeded a built-in safety limit.' },
        hub: { title: 'Virginia Cloud Hub', note: 'A health-check glitch rippled across dependent apps.' },
        directory: { title: 'Internet Directory', note: 'Devices temporarily couldn\'t look up the building\'s address.' },
        rollout: { title: 'Software Rollout', note: 'A faulty change reached live servers before being rolled back.' }
      };
      const layer = layerMap[selected.layer] || layerMap.hub;

      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">${escapeHtml(selected.who)} · ${escapeHtml(selected.date)}</span>
          <span style="color: var(--calm);">Resolved</span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 226" class="stage-svg" role="img" aria-label="Diagram showing where the ${escapeHtml(selected.who)} incident stalled">
            <line x1="126" y1="112" x2="220" y2="112" stroke="var(--ember)" stroke-width="1.8" stroke-dasharray="4 6"></line>
            <line x1="340" y1="112" x2="434" y2="112" stroke="var(--calm)" stroke-width="1.7" class="stream"></line>

            <rect x="34" y="78" width="92" height="68" rx="14" fill="var(--svg-fill)" stroke="var(--svg-stroke)" stroke-width="1.3"></rect>
            <text x="80" y="116" text-anchor="middle" fill="var(--ink)" font-size="12.5" font-weight="600">Your phone</text>

            <rect x="220" y="70" width="120" height="84" rx="14" fill="var(--svg-fill)" stroke="var(--ember)" stroke-width="1.7"></rect>
            <circle cx="330" cy="80" r="9" fill="none" stroke="var(--ember)" stroke-width="1.3" class="ember-halo"></circle>
            <circle cx="330" cy="80" r="3.8" fill="var(--ember)"></circle>
            <text x="280" y="109" text-anchor="middle" fill="var(--ink)" font-size="11.5" font-weight="700">${escapeHtml(layer.title)}</text>
            <text x="280" y="128" text-anchor="middle" fill="var(--ember)" font-size="10.5">Where it stalled</text>

            <rect x="434" y="78" width="92" height="68" rx="14" fill="var(--svg-fill)" stroke="var(--calm)" stroke-width="1.3"></rect>
            <text x="480" y="110" text-anchor="middle" fill="var(--ink)" font-size="12" font-weight="600">Your data</text>
            <text x="480" y="127" text-anchor="middle" fill="var(--calm)" font-size="10.5">Remained safe</text>

            <text x="280" y="202" text-anchor="middle" fill="var(--ink-2)" font-size="12">${escapeHtml(layer.note)}</text>
          </svg>
        </div>
        <div class="stage-footer stage-footer-row">
          <p class="stage-prompt">Viewing <strong>${escapeHtml(selected.who)}</strong>. Pick another event on the left to compare.</p>
          <button class="pill-btn pill-btn-subtle pill-btn-sm" data-clear-recent>Back to live view</button>
        </div>
      `;
      return;
    }

    if (!isShowingActive()) {
      const providers = statusData.providers || [];
      const count = providers.length || 5;
      const startX = 72;
      const stepX = count > 1 ? (488 - startX) / (count - 1) : 0;

      stageEl.innerHTML = `
        <div class="stage-top">
          <span style="color: var(--ink-2);">Live Cloud Network Pulse</span>
          <span style="color: var(--calm);">All clear</span>
        </div>
        <div class="stage-body">
          <svg viewBox="0 0 560 226" class="stage-svg" role="img" aria-label="Major cloud providers operating normally">
            <line x1="48" y1="98" x2="512" y2="98" stroke="var(--calm)" stroke-width="1.6" class="stream"></line>
            ${providers
              .map((p, i) => {
                const cx = Math.round(startX + i * stepX);
                const shortName = p.name.replace('Microsoft ', '').replace('Amazon ', '');
                const ok = p.status === 'operational';
                const col = ok ? 'var(--calm)' : 'var(--ember)';
                return `
                  <a href="${escapeHtml(p.statusUrl)}" target="_blank" rel="noopener noreferrer">
                    <rect x="${cx - 44}" y="66" width="88" height="64" rx="13" fill="var(--svg-fill)" stroke="var(--svg-stroke)" stroke-width="1.25"></rect>
                    <circle cx="${cx}" cy="87" r="3.8" fill="${col}"></circle>
                    <text x="${cx}" y="112" text-anchor="middle" fill="var(--ink)" font-size="11" font-weight="600">${escapeHtml(shortName)}</text>
                  </a>
                `;
              })
              .join('')}
            <text x="280" y="178" text-anchor="middle" fill="var(--ink-2)" font-size="12.5">Traffic is flowing cleanly across all major cloud networks.</text>
            <text x="280" y="199" text-anchor="middle" fill="var(--ink-3)" font-size="11">Tap any provider box to open its official live status page.</text>
          </svg>
        </div>
        <div class="stage-footer stage-footer-row">
          <p class="stage-prompt"><strong>Try it:</strong> Select any recent outage on the left—or preview an active disruption.</p>
          <button class="pill-btn pill-btn-subtle pill-btn-sm" data-toggle-preview>Preview active outage</button>
        </div>
      `;
      return;
    }

    // Active disruption (real or previewed)
    const active = hasRealActive() ? statusData.activeIncidents[0] : null;
    const stepIdx = active ? active.stage ?? 2 : rerouteStep;
    const steps = ['1. Noticed', '2. Located', '3. Steering', '4. All clear'];
    const descriptions = [
      'Automated alarms spotted rising errors within seconds and paged the on-call engineer.',
      'Engineers traced the slowdown to the affected hub—your accounts and data weren\'t touched.',
      'Traffic is actively steering over to backup cities so apps begin loading normally again.',
      'Service is restored. Next, engineers publish a clear, blameless report explaining what happened.'
    ];
    const fixed = stepIdx === 3;
    const steering = stepIdx >= 2;

    stageEl.innerHTML = `
      <div class="stage-top">
        <span style="color: var(--ink-2);">${active ? `${escapeHtml(active.provider)} · Live Response` : 'How engineers respond in real time'}</span>
        <span style="color: ${fixed ? 'var(--calm)' : 'var(--ember)'};">${steps[stepIdx]}</span>
      </div>
      <div class="stage-body">
        <svg viewBox="0 0 560 220" class="stage-svg" role="img" aria-label="Engineers steering traffic around an overloaded hub to a backup hub">
          <path d="M 126 110 C 185 110, 195 68, 260 68" fill="none" stroke="${fixed ? 'var(--calm)' : 'var(--ember)'}" stroke-width="1.8" class="${fixed ? 'stream' : ''}" stroke-dasharray="${fixed ? '' : '3 6'}"></path>
          <path d="M 126 110 C 185 110, 195 152, 260 152" fill="none" stroke="${steering ? 'var(--calm)' : 'var(--hairline-strong)'}" stroke-width="${steering ? '2.1' : '1.2'}" class="${steering ? 'stream' : ''}"></path>
          <path d="M 366 68 C 400 68, 405 110, 434 110" fill="none" stroke="${fixed ? 'var(--calm)' : 'var(--hairline)'}" stroke-width="1.5"></path>
          <path d="M 366 152 C 400 152, 405 110, 434 110" fill="none" stroke="${steering ? 'var(--calm)' : 'var(--hairline)'}" stroke-width="${steering ? '2' : '1.2'}" class="${steering ? 'stream' : ''}"></path>

          <rect x="34" y="80" width="92" height="60" rx="13" fill="var(--svg-fill)" stroke="var(--svg-stroke)" stroke-width="1.3"></rect>
          <text x="80" y="114" text-anchor="middle" fill="var(--ink)" font-size="12" font-weight="600">Your phone</text>

          <rect x="260" y="40" width="106" height="56" rx="12" fill="var(--svg-fill)" stroke="${fixed ? 'var(--calm)' : 'var(--ember)'}" stroke-width="1.6"></rect>
          <text x="313" y="65" text-anchor="middle" fill="var(--ink)" font-size="11.5" font-weight="600">Affected Hub</text>
          <text x="313" y="82" text-anchor="middle" fill="${fixed ? 'var(--calm)' : 'var(--ember)'}" font-size="10.5">${fixed ? 'Healthy again' : 'Overloaded'}</text>

          <rect x="260" y="124" width="106" height="56" rx="12" fill="var(--svg-fill)" stroke="${steering ? 'var(--calm)' : 'var(--svg-stroke)'}" stroke-width="1.5"></rect>
          <text x="313" y="149" text-anchor="middle" fill="var(--ink)" font-size="11.5" font-weight="600">Backup Hub</text>
          <text x="313" y="166" text-anchor="middle" fill="${steering ? 'var(--calm)' : 'var(--ink-3)'}" font-size="10.5">${steering ? 'Taking traffic' : 'Standing by'}</text>

          <rect x="434" y="80" width="92" height="60" rx="13" fill="var(--svg-fill)" stroke="var(--calm)" stroke-width="1.3"></rect>
          <text x="480" y="114" text-anchor="middle" fill="var(--ink)" font-size="12" font-weight="600">Apps</text>
        </svg>
        <p class="stage-caption">${descriptions[stepIdx]}</p>
      </div>
      <div class="stage-footer">
        <p class="stage-prompt"><strong>Try it:</strong> Click each stage to follow how on-call engineers respond.</p>
        <div class="step-bar">
          ${steps
            .map(
              (s, i) =>
                `<button class="step-btn ${i === stepIdx ? 'active' : i < stepIdx ? 'done' : ''}" data-reroute-step="${i}">${s}</button>`
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function render() {
    renderLeftHero();
    renderRecentList();
    renderStage();
  }

  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      previewActiveOutage = !previewActiveOutage;
      selectedRecentId = null;
      syncHomePulse();
      render();
    });
  }

  if (recentListEl) {
    recentListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-recent-id]');
      if (!btn) return;
      const id = btn.dataset.recentId;
      selectedRecentId = selectedRecentId === id ? null : id;
      render();
    });
  }

  if (stageEl) {
    stageEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-clear-recent]')) {
        selectedRecentId = null;
        render();
        return;
      }
      if (e.target.closest('[data-toggle-preview]')) {
        previewActiveOutage = !previewActiveOutage;
        selectedRecentId = null;
        syncHomePulse();
        render();
        return;
      }
      const stepBtn = e.target.closest('[data-reroute-step]');
      if (stepBtn) {
        rerouteStep = Number(stepBtn.dataset.rerouteStep);
        renderStage();
      }
    });
  }

  loadLiveStatus();

  return { render };
}
