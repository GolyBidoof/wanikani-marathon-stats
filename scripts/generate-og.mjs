#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const ogDir = join(publicDir, 'og');
const userDir = join(publicDir, 'u');

const SITE_URL = 'https://golybidoof.github.io/wanikani-marathon-stats';

const allStats = JSON.parse(readFileSync(join(root, 'all_stats.json'), 'utf8'));
const allUsers = JSON.parse(readFileSync(join(root, 'users.json'), 'utf8'));

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getMarathonOrder(stats) {
  return Object.keys(stats).sort((a, b) => {
    const score = (name) => {
      const [season, year] = name.split(' ');
      const seasonScore = { Winter: 4, Fall: 3, Autumn: 3, Summer: 2, Spring: 1 }[season] || 0;
      return parseInt(year, 10) * 10 + seasonScore;
    };
    return score(a) - score(b);
  });
}

function parseTimeToHours(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length >= 2) {
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    return h + m / 60 + s / 3600;
  }
  return parseFloat(timeStr) || 0;
}

function computeUserTotals(stats, username) {
  let time = 0;
  let pages = 0;
  let chars = 0;
  let count = 0;

  for (const marathonName of getMarathonOrder(stats)) {
    const entry = (stats[marathonName] || []).find(
      (user) => user.user.toLowerCase() === username.toLowerCase(),
    );
    if (!entry) continue;
    count += 1;
    time += parseTimeToHours(entry.time);
    pages += parseInt(String(entry.pages), 10) || 0;
    chars += parseInt(String(entry.characters), 10) || 0;
  }

  return { time, pages, chars, count };
}

function formatHours(time) {
  const totalMinutes = Math.round(time * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function buildOgSvg({ title, lines, accent = '#ff00aa' }) {
  const lineMarkup = lines
    .map(
      (line, index) => `
    <text x="80" y="${340 + index * 56}" fill="#c8c8c8" font-family="Arial, sans-serif" font-size="34">${escapeXml(line)}</text>
  `,
    )
    .join('');

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#1a1a1a"/>
    <rect x="36" y="36" width="1128" height="558" rx="24" fill="#232323" stroke="${accent}" stroke-width="4"/>
    <text x="80" y="120" fill="${accent}" font-family="Arial, sans-serif" font-size="40" font-weight="700">WaniKani / 24-hour Readathon</text>
    <text x="80" y="230" fill="#f0f0f0" font-family="Arial, sans-serif" font-size="58" font-weight="700">${escapeXml(title)}</text>
    ${lineMarkup}
  </svg>`;
}

async function writePngFromSvg(svg, outputPath) {
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}

function buildUserHtml(username, title, description, imageFile) {
  const profileUrl = `${SITE_URL}/?user=${encodeURIComponent(username)}`;
  const imageUrl = `${SITE_URL}/og/${imageFile}`;
  const pageUrl = `${SITE_URL}/u/${encodeURIComponent(username)}/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(title)}</title>
  <meta name="description" content="${escapeXml(description)}">
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${escapeXml(title)}">
  <meta property="og:description" content="${escapeXml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeXml(title)}">
  <meta name="twitter:description" content="${escapeXml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta http-equiv="refresh" content="0; url=${profileUrl}">
  <link rel="canonical" href="${profileUrl}">
</head>
<body>
  <p><a href="${profileUrl}">View ${escapeXml(username)}&apos;s readathon stats</a></p>
</body>
</html>`;
}

mkdirSync(ogDir, { recursive: true });
mkdirSync(join(publicDir, 'vendor'), { recursive: true });

copyFileSync(
  join(root, 'node_modules/gifler/gifler.min.js'),
  join(publicDir, 'vendor/gifler.min.js'),
);

const marathonOrder = getMarathonOrder(allStats);
const latestMarathon = marathonOrder[marathonOrder.length - 1];
const latestEntries = allStats[latestMarathon] || [];
let latestTime = 0;
let latestPages = 0;
let latestChars = 0;

for (const entry of latestEntries) {
  latestTime += parseTimeToHours(entry.time);
  latestPages += parseInt(String(entry.pages), 10) || 0;
  latestChars += parseInt(String(entry.characters), 10) || 0;
}

const defaultSvg = buildOgSvg({
  title: 'Readathon Stats Explorer',
  lines: [
    latestMarathon ? `Latest: ${latestMarathon}` : 'Community readathon stats',
    `${latestEntries.length} readers · ${formatHours(latestTime)} read`,
    `${latestPages.toLocaleString()} pages · ${latestChars.toLocaleString()} chars`,
  ],
});

await writePngFromSvg(defaultSvg, join(ogDir, 'default.png'));

for (const username of allUsers) {
  const totals = computeUserTotals(allStats, username);
  if (totals.count === 0) continue;

  const safeFileName = `${encodeURIComponent(username)}.png`;
  const svg = buildOgSvg({
    title: username,
    lines: [
      `${totals.count} marathons completed`,
      `${formatHours(totals.time)} total reading time`,
      `${totals.pages.toLocaleString()} pages · ${totals.chars.toLocaleString()} chars`,
    ],
  });

  await writePngFromSvg(svg, join(ogDir, safeFileName));

  const userPageDir = join(userDir, encodeURIComponent(username));
  mkdirSync(userPageDir, { recursive: true });

  const title = `${username} · WaniKani Readathon Stats`;
  const description = `${username} completed ${totals.count} readathons with ${formatHours(totals.time)} of reading.`;
  writeFileSync(
    join(userPageDir, 'index.html'),
    buildUserHtml(username, title, description, safeFileName),
    'utf8',
  );
}

console.log(`Generated default OG image and ${allUsers.length} user preview pages.`);
