// Robot de redes de la RPG-BC — corre SOLO en GitHub Actions.
// Revisa las publicaciones de @rpg_bajocauca y las noticias que mencionan a la RPG-BC,
// y deja todo en data/redes.json para que la app lo lea directo desde GitHub.
import fs from 'node:fs/promises';
import path from 'node:path';

const USUARIO = 'rpg_bajocauca';
const SALIDA = 'data/redes.json';
const MANUAL = 'data/manual.json';
const CARPETA_FOTOS = 'data/redes';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const horaColombia = (d = new Date()) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' }).format(d);

async function traer(url, opciones = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-CO,es;q=0.9', ...(opciones.headers || {}) }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} en ${url}`);
  return opciones.binario ? Buffer.from(await r.arrayBuffer()) : r.text();
}
const limpiar = s => (s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
// Sin emojis ni íconos en los títulos
const sinEmojis = s => (s || '').replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu, '').replace(/\s{2,}/g, ' ').replace(/^[\s|·:-]+/, '').trim();
const etiqueta = (xml, t) => { const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? limpiar(m[1]) : ''; };

// ---------- YouTube (RSS oficial del canal) ----------
async function youtube() {
  const html = await traer(`https://www.youtube.com/@${USUARIO}`);
  const id = (html.match(/"channelId":"(UC[\w-]{22})"/) || html.match(/channel\/(UC[\w-]{22})/) || [])[1];
  if (!id) throw new Error('no se encontró el canal de YouTube');
  const xml = await traer(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  return xml.split('<entry>').slice(1, 9).map(e => {
    const vid = etiqueta(e, 'yt:videoId');
    return { red: 'YouTube', id: 'yt-' + vid, titulo: sinEmojis(etiqueta(e, 'title')), fecha: etiqueta(e, 'published'),
      enlace: `https://www.youtube.com/watch?v=${vid}`, imagen: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, video: vid };
  });
}

// ---------- Instagram (perfil público) ----------
async function instagram() {
  const cab = { headers: { 'x-ig-app-id': '936619743392459', 'Accept': 'application/json' } };
  let txt;
  try { txt = await traer(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${USUARIO}`, cab); }
  catch (e) { await new Promise(r => setTimeout(r, 8000)); txt = await traer(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${USUARIO}`, cab); }
  const user = JSON.parse(txt)?.data?.user;
  const edges = user?.edge_owner_to_timeline_media?.edges || [];
  const salida = [];
  await fs.mkdir(CARPETA_FOTOS, { recursive: true });
  for (const { node } of edges.slice(0, 8)) {
    const archivo = `${CARPETA_FOTOS}/ig-${node.shortcode}.jpg`;
    // Las fotos de Instagram vencen: se guardan en el repo para que nunca se rompan.
    try { await fs.access(archivo); } catch { try { await fs.writeFile(archivo, await traer(node.thumbnail_src || node.display_url, { binario: true })); } catch {} }
    salida.push({ red: 'Instagram', id: 'ig-' + node.shortcode,
      titulo: sinEmojis(node.edge_media_to_caption?.edges?.[0]?.node?.text || 'Publicación en Instagram').slice(0, 280),
      fecha: new Date(node.taken_at_timestamp * 1000).toISOString(),
      enlace: `https://www.instagram.com/p/${node.shortcode}/`, imagen: archivo, esVideo: !!node.is_video });
  }
  return salida;
}

// ---------- Noticias que mencionan a la RPG-BC (Google Noticias) ----------
async function noticias() {
  const busquedas = ['"Región de Planeación y Gestión del Bajo Cauca"', '"RPG Bajo Cauca"', '"RPG-BC" Bajo Cauca'];
  const todas = []; let fallas = 0;
  for (const q of busquedas) {
    try {
      const xml = await traer(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=es-419&gl=CO&ceid=CO:es-419`);
      for (const it of xml.split('<item>').slice(1, 15)) {
        const enlace = etiqueta(it, 'link');
        todas.push({ red: 'Noticia', id: 'n-' + Buffer.from(enlace).toString('base64url').slice(-24), titulo: sinEmojis(etiqueta(it, 'title')),
          fecha: new Date(etiqueta(it, 'pubDate')).toISOString(), enlace, fuente: etiqueta(it, 'source') });
      }
    } catch (e) { fallas++; console.log('Noticias:', e.message); }
  }
  if (fallas === busquedas.length) throw new Error('Google Noticias no respondió');
  const vistos = new Set();
  return todas.filter(n => !vistos.has(n.titulo) && vistos.add(n.titulo)).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 12);
}

async function leerJSON(f, def) { try { return JSON.parse(await fs.readFile(f, 'utf8')); } catch { return def; } }

const anterior = await leerJSON(SALIDA, {});
const manual = await leerJSON(MANUAL, []);
const fuentes = { youtube, instagram, noticias };
const resultado = { cuenta: '@' + USUARIO, revisado: horaColombia(), revisadoISO: new Date().toISOString(), estado: {} };

for (const [nombre, fn] of Object.entries(fuentes)) {
  try { resultado[nombre] = await fn(); resultado.estado[nombre] = 'ok'; console.log(nombre, resultado[nombre].length); }
  catch (e) { resultado[nombre] = anterior[nombre] || []; resultado.estado[nombre] = 'sin respuesta, se dejan las últimas guardadas'; console.log(nombre, 'falló:', e.message); }
}
resultado.manual = manual;

// Solo se guarda si cambió algo (así no hay commits de más)
const sinHora = o => JSON.stringify({ ...o, revisado: 0, revisadoISO: 0, estado: 0 });
if (sinHora(resultado) !== sinHora(anterior)) {
  await fs.mkdir(path.dirname(SALIDA), { recursive: true });
  await fs.writeFile(SALIDA, JSON.stringify(resultado, null, 2));
  console.log('Hay novedades, se guarda', SALIDA);
} else console.log('Sin novedades');
