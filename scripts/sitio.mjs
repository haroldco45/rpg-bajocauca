// Descarga la página oficial de la RPG-BC (micolombiadigital) para sacar datos, noticias y fotos reales.
import fs from 'node:fs/promises';
const BASE = 'https://region-de-planeacion-y-gestion-del-bajo-cauca.micolombiadigital.gov.co';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MAX = Number(process.env.MAX_PAGINAS || 60);
await fs.mkdir('data/sitio/raw', { recursive: true });
await fs.mkdir('data/sitio/img', { recursive: true });
const cola = [BASE + '/'], vistos = new Set(), imagenes = new Map();
const nombre = u => (new URL(u).pathname.replace(/^\/|\/$/g, '').replace(/[^\w-]+/g, '_') || 'inicio').slice(0, 120);
while (cola.length && vistos.size < MAX) {
  const url = cola.shift(); if (vistos.has(url)) continue; vistos.add(url);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
    if (!r.ok) continue;
    const tipo = r.headers.get('content-type') || '';
    if (/javascript/.test(tipo) || url.endsWith('.js')) { await fs.writeFile(`data/sitio/raw/${nombre(url)}.js.txt`, await r.text()); continue; }
    if (!tipo.includes('html')) continue;
    const html = await r.text();
    await fs.writeFile(`data/sitio/raw/${nombre(url)}.html`, html);
    for (const m of html.matchAll(/src="([^"]+\.js)"/g)) { try { const u = new URL(m[1], url).href; if (!vistos.has(u)) cola.push(u); } catch {} }
    for (const m of html.matchAll(/href="([^"#]+)"/g)) {
      try { const u = new URL(m[1], url); u.search = ''; if (u.host === new URL(BASE).host && !/\.(css|ico|pdf|jpg|jpeg|png|webp|gif|zip|docx?|xlsx?)$/i.test(u.pathname) && !vistos.has(u.href)) cola.push(u.href); } catch {}
    }
    for (const m of html.matchAll(/(?:src|data-src|content)="([^"]+\.(?:jpe?g|png|webp)[^"]*)"/gi)) {
      try { const u = new URL(m[1], url).href; if (!imagenes.has(u)) imagenes.set(u, url); } catch {}
    }
    console.log('ok', url);
  } catch (e) { console.log('falló', url, e.message); }
}
let n = 0; const lista = [];
for (const [src, pagina] of imagenes) {
  if (n >= 80) break;
  try {
    const r = await fetch(src, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
    if (!r.ok) continue; const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 15000 || b.length > 3_000_000) continue;
    const ext = (src.match(/\.(jpe?g|png|webp)/i) || ['', 'jpg'])[1].toLowerCase();
    const f = `data/sitio/img/foto-${String(++n).padStart(2, '0')}.${ext}`; await fs.writeFile(f, b);
    lista.push({ archivo: f, src, pagina, bytes: b.length });
  } catch {}
}
await fs.writeFile('data/sitio/indice.json', JSON.stringify({ paginas: [...vistos], imagenes: lista }, null, 2));
console.log('paginas', vistos.size, 'imagenes', lista.length);

// --- Segunda pasada: chunks perezosos y API del sitio ---
const archivos = await fs.readdir('data/sitio/raw');
let todoJs = '';
for (const f of archivos) if (f.endsWith('.js.txt')) todoJs += await fs.readFile('data/sitio/raw/' + f, 'utf8');
const chunks = [...new Set([...todoJs.matchAll(/chunk-[A-Z0-9]{8}\.js/g)].map(m => m[0]))];
for (const c of chunks) {
  const f = `data/sitio/raw/${c.replace('.', '_')}.js.txt`;
  try { await fs.access(f); } catch { try { const r = await fetch(`${BASE}/${c}`, { headers: { 'User-Agent': UA } }); if (r.ok) await fs.writeFile(f, await r.text()); } catch {} }
}
await fs.mkdir('data/sitio/api', { recursive: true });
const candidatos = ['/api/v1/settings', '/api/v1/config', '/api/v1/tags', '/api/v1/instagram/', '/api/v1/settings/content/settingcontentglobal', '/api/v1/settings/moreviewed', '/api/v1/content/moreviewed', '/api/v1/globallogo'];
for (const p of candidatos) {
  try { const r = await fetch(BASE + p, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    await fs.writeFile(`data/sitio/api/${p.replace(/[^\w]+/g, '_')}.txt`, `HTTP ${r.status}\n` + (await r.text()).slice(0, 2_000_000)); } catch (e) { console.log('api', p, e.message); }
}
console.log('chunks', chunks.length);
