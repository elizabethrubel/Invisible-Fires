#!/usr/bin/env node
/**
 * Invisible Fires — Scheduled Live Cloud Status Updater
 *
 * Fetches official public status feeds (Google Cloud, Cloudflare, GitHub,
 * AWS, Microsoft Azure), translates any active disruptions into calm,
 * jargon-free explanations, merges with curated verified recent outages,
 * and writes data/live-status.json.
 *
 * Zero external dependencies — runs on standard Node 22+.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CURATED_PATH = resolve(ROOT, 'data/curated-recent.json');
const OUTPUT_PATH = resolve(ROOT, 'data/live-status.json');

const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'user-agent': 'Invisible-Fires-Status-Updater/1.0 (+https://github.com/elizabethrubel/Invisible-Fires)',
        ...(options.headers || {})
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Translate raw incident text into a plain-English category, stage, and reassuring summary.
 */
function translateIncident(provider, rawTitle, rawBody = '', rawStatus = '') {
  const haystack = `${rawTitle} ${rawBody} ${rawStatus}`.toLowerCase();

  let layer = 'hub';
  let plainSummary = `${provider} is experiencing a service disruption affecting some apps and websites that run on its infrastructure.`;

  if (/\b(power|cooling|electrical|thermal|facility)\b/.test(haystack)) {
    layer = 'power';
    plainSummary = `A power or cooling issue hit one of ${provider}'s data-center buildings. Traffic is shifting to neighboring buildings while engineers restore power.`;
  } else if (/\b(dns|bgp|route|routing|domain|resolution)\b/.test(haystack)) {
    layer = 'directory';
    plainSummary = `An address-lookup or routing issue is making it harder for devices to find some ${provider}-hosted services—even though the underlying data is safe.`;
  } else if (/\b(config|configuration|deploy|deployment|rollout|update|policy|release)\b/.test(haystack)) {
    layer = 'rollout';
    plainSummary = `A recent software or settings update caused trouble on part of ${provider}'s network. Engineers are rolling back the change to restore normal service.`;
  } else if (/\b(edge|proxy|gateway|cdn|load balancer|network|connectivity|transit)\b/.test(haystack)) {
    layer = 'gateway';
    plainSummary = `A traffic gateway on ${provider}'s network is slowing down or dropping connections. Engineers are steering traffic around the bottleneck.`;
  }

  let stage = 1; // 0: Noticed, 1: Located, 2: Steering / Fixing, 3: All clear
  if (/\b(resolved|completed|all clear|recovered)\b/.test(haystack)) {
    stage = 3;
  } else if (/\b(mitigat|monitoring|fix|rerout|rolling back|remediat|identified)\b/.test(haystack)) {
    stage = 2;
  } else if (/\b(investigat|detect|elevated|degraded)\b/.test(haystack)) {
    stage = 1;
  }

  return {
    layer,
    stage,
    headline: `${provider} is working through a live disruption.`,
    plainSummary,
    officialTitle: rawTitle || `${provider} service disruption`
  };
}

/**
 * Simple XML/RSS tag extractor for AWS & Azure RSS status feeds.
 */
function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const getTag = (tag) => {
      const m = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i').exec(block);
      return m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    };
    items.push({
      title: getTag('title'),
      description: getTag('description'),
      link: getTag('link'),
      pubDate: getTag('pubDate')
    });
  }
  return items;
}

async function checkGoogleCloud() {
  const provider = {
    id: 'gcp',
    name: 'Google Cloud',
    status: 'operational',
    statusUrl: 'https://status.cloud.google.com/'
  };
  const activeIncidents = [];

  try {
    const res = await fetchWithTimeout('https://status.cloud.google.com/incidents.json');
    const incidents = await res.json();
    if (Array.isArray(incidents)) {
      const openMajor = incidents.filter(
        (inc) =>
          !inc.end &&
          (inc.severity === 'high' || inc.status_impact === 'SERVICE_OUTAGE' || inc.status_impact === 'SERVICE_DISRUPTION')
      );
      if (openMajor.length > 0) {
        provider.status = 'disrupted';
        const inc = openMajor[0];
        const latestUpdate = inc.most_recent_update?.text || '';
        const translated = translateIncident(provider.name, inc.external_desc || '', latestUpdate, inc.status_impact || '');
        activeIncidents.push({
          id: `gcp-${inc.id}`,
          provider: provider.name,
          startedAt: inc.begin,
          officialUrl: inc.uri ? `https://status.cloud.google.com/${inc.uri.replace(/^\//, '')}` : provider.statusUrl,
          ...translated
        });
      }
    }
  } catch (err) {
    console.warn(`[warn] Google Cloud check failed: ${err.message}`);
  }

  return { provider, activeIncidents };
}

async function checkStatuspage(id, name, baseUrl) {
  const provider = {
    id,
    name,
    status: 'operational',
    statusUrl: baseUrl
  };
  const activeIncidents = [];

  try {
    const res = await fetchWithTimeout(`${baseUrl.replace(/\/$/, '')}/api/v2/summary.json`);
    const data = await res.json();
    const indicator = data?.status?.indicator || 'none';
    const incidents = Array.isArray(data?.incidents) ? data.incidents : [];

    // Only surface meaningful user-facing disruptions (major/critical or non-minor open incidents)
    const significant = incidents.filter(
      (inc) => inc.status !== 'resolved' && inc.status !== 'postmortem' && ['major', 'critical'].includes(inc.impact)
    );

    if (significant.length > 0 || ['major', 'critical'].includes(indicator)) {
      provider.status = 'disrupted';
      const inc = significant[0];
      const latestBody = inc?.incident_updates?.[0]?.body || '';
      const translated = translateIncident(name, inc?.name || data?.status?.description || '', latestBody, inc?.status || '');
      activeIncidents.push({
        id: `${id}-${inc?.id || 'active'}`,
        provider: name,
        startedAt: inc?.created_at || new Date().toISOString(),
        officialUrl: inc?.shortlink || baseUrl,
        ...translated
      });
    }
  } catch (err) {
    console.warn(`[warn] ${name} check failed: ${err.message}`);
  }

  return { provider, activeIncidents };
}

async function checkRssProvider(id, name, feedUrl, statusUrl) {
  const provider = {
    id,
    name,
    status: 'operational',
    statusUrl
  };
  const activeIncidents = [];

  try {
    const res = await fetchWithTimeout(feedUrl);
    const xml = await res.text();
    const items = parseRssItems(xml);
    const cutoff = Date.now() - 12 * 60 * 60 * 1000; // Last 12 hours

    const freshActive = items.filter((item) => {
      const ts = Date.parse(item.pubDate);
      if (Number.isNaN(ts) || ts < cutoff) return false;
      const text = `${item.title} ${item.description}`.toLowerCase();
      const resolved = /\b(resolved|operating normally|mitigated and resolved|service is operating normally)\b/.test(text);
      const severe = /\b(outage|disruption|degraded|elevated error|connectivity|unavailable|service issue)\b/.test(text);
      return severe && !resolved;
    });

    if (freshActive.length > 0) {
      provider.status = 'disrupted';
      const inc = freshActive[0];
      const translated = translateIncident(name, inc.title, inc.description);
      activeIncidents.push({
        id: `${id}-${Date.parse(inc.pubDate) || 'active'}`,
        provider: name,
        startedAt: new Date(Date.parse(inc.pubDate) || Date.now()).toISOString(),
        officialUrl: inc.link || statusUrl,
        ...translated
      });
    }
  } catch (err) {
    console.warn(`[warn] ${name} check failed: ${err.message}`);
  }

  return { provider, activeIncidents };
}

async function main() {
  const curatedRaw = await readFile(CURATED_PATH, 'utf8');
  const curatedRecent = JSON.parse(curatedRaw);

  const results = await Promise.all([
    checkGoogleCloud(),
    checkRssProvider('aws', 'Amazon AWS', 'https://status.aws.amazon.com/rss/all.rss', 'https://health.aws.amazon.com/'),
    checkRssProvider('azure', 'Microsoft Azure', 'https://azure.status.microsoft/en-us/status/feed/', 'https://azure.status.microsoft/'),
    checkStatuspage('cloudflare', 'Cloudflare', 'https://www.cloudflarestatus.com/'),
    checkStatuspage('github', 'GitHub', 'https://www.githubstatus.com/')
  ]);

  const providers = results.map((r) => r.provider);
  const activeIncidents = results.flatMap((r) => r.activeIncidents);

  const payload = {
    updatedAt: new Date().toISOString(),
    overall: activeIncidents.length > 0 ? 'disrupted' : 'quiet',
    providers,
    activeIncidents,
    recentIncidents: curatedRecent
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Updated ${OUTPUT_PATH} — overall: ${payload.overall}, active: ${activeIncidents.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
