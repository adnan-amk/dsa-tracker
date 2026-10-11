const $ = id => document.getElementById(id);
let cfg = { url: '', secret: '' };

// Strip query/hash and site-specific suffixes so the same problem always maps to one link
function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    let path = u.pathname;
    const lc = path.match(/^\/problems\/[^/]+/);          // leetcode.com/problems/slug/...
    if (u.hostname.includes('leetcode') && lc) path = lc[0] + '/';
    return u.origin + path;
  } catch { return raw; }
}

function cleanTitle(t) {
  return t.split(/\s[-|–—]\s/)[0].replace(/^\d+\.\s*/, '').trim();
}

// Best-effort difficulty detection, runs inside the page
function scrapeDifficulty() {
  const txt = document.body ? document.body.innerText.slice(0, 5000) : '';
  const el = document.querySelector('[class*="text-difficulty-"], [class*="difficulty"]');
  const hay = ((el && el.innerText) || '') + ' ' + txt;
  const m = hay.match(/\b(Easy|Medium|Hard|Basic|School)\b/i);
  if (!m) return null;
  const v = m[1].toLowerCase();
  return v === 'basic' || v === 'school' ? 'Easy' : v[0].toUpperCase() + v.slice(1);
}

function setStatus(msg, cls = '') { $('status').textContent = msg; $('status').className = cls; }

async function api(method, body) {
  if (!cfg.url) throw new Error('Set the Web App URL in ⚙ settings first.');
  if (method === 'GET') {
    const q = new URLSearchParams({ secret: cfg.secret, link: body.link });
    return (await fetch(`${cfg.url}?${q}`)).json();
  }
  // text/plain avoids a CORS preflight, which Apps Script can't answer
  return (await fetch(cfg.url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, secret: cfg.secret })
  })).json();
}

async function checkExisting() {
  try {
    const r = await api('GET', { link: $('link').value });
    if (r.ok && r.exists) {
      $('banner').textContent = `Already in sheet (revised ${r.count}×). Saving will count as a revision.`;
      $('banner').classList.remove('hidden');
      $('save').textContent = 'Mark as revised';
    }
  } catch { /* ignore */ }
}

async function init() {
  cfg = await chrome.storage.sync.get({ url: '', secret: '' });
  $('url').value = cfg.url; $('secret').value = cfg.secret;
  if (!cfg.url) $('settings').classList.remove('hidden');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $('question').value = cleanTitle(tab.title || '');
  $('link').value = normalizeUrl(tab.url || '');

  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scrapeDifficulty });
    if (res && res.result) $('difficulty').value = res.result;
  } catch { /* restricted page */ }

  const last = await chrome.storage.local.get({ lastType: '' });
  $('type').value = last.lastType;
  checkExisting();
}

$('gear').onclick = () => $('settings').classList.toggle('hidden');

$('saveSettings').onclick = async () => {
  cfg = { url: $('url').value.trim(), secret: $('secret').value.trim() };
  await chrome.storage.sync.set(cfg);
  $('settings').classList.add('hidden');
  checkExisting();
};

$('save').onclick = async () => {
  $('save').disabled = true; setStatus('Saving…');
  try {
    const r = await api('POST', {
      date: new Date().toISOString().slice(0, 10),
      question: $('question').value.trim(),
      link: $('link').value.trim(),
      type: $('type').value.trim(),
      difficulty: $('difficulty').value
    });
    if (!r.ok) throw new Error(r.error || 'Failed');
    chrome.storage.local.set({ lastType: $('type').value.trim() });
    setStatus(r.status === 'added' ? 'Added to sheet ✓' : `Revision count is now ${r.count} ✓`, 'ok');
  } catch (e) { setStatus(e.message, 'err'); }
  $('save').disabled = false;
};

init();
