# RPG-BC · Región de Planeación y Gestión del Bajo Cauca

App (PWA) de la RPG-BC: 6 municipios, 1 visión regional — Cáceres, Caucasia, El Bagre, Nechí, Tarazá y Zaragoza.
**"No llegamos al territorio… ¡Somos el Territorio!"**

## Qué trae
- Portada con fotos reales del territorio en carrusel y cifras animadas (6 municipios · 266 mil habitantes · 8.485 km²).
- Somos / Hacemos / Nos mueve.
- Recorrido interactivo por los ríos Cauca y Nechí con ficha de cada municipio.
- Agenda: Promover · Integrar · Ejecutar.
- Lo que nos diferencia y qué encuentras en la RPG-BC.
- **Banco de iniciativas**: la comunidad presenta su idea, se guarda en el celular y se envía por correo a director@rpgbajocauca-antioquia.gov.co en un toque. Datos de contacto enmascarados y aviso de Habeas Data (Ley 1581 de 2012). Respaldo .json.
- Galería con visor, contacto y redes @rpg_bajocauca.
- Español / Inglés, hora de Colombia en vivo, instalable (manifest + service worker) y vista previa al compartir (og.jpg 1200×630).

## Archivos
```
index.html  manifest.json  sw.js  og.jpg  icon-192.png  icon-512.png  README.md
img/  rio-canoa.jpg rio-isla.jpg atardecer.jpg siembra.jpg arbol.jpg equipo.jpg letras-caucasia.jpg templo.jpg monumento.jpg
img/  mapa-bajo-cauca.jpg mapa-colombia.jpg
video/ territorio.mp4  (video de portada hecho con las fotos reales)
```

## Publicar
1. Subir todo a un repo (sugerido: `haroldco45/rpg-bajocauca`).
2. Conectar el repo en Netlify con el nombre de sitio **rpg-bajocauca** → https://rpg-bajocauca.netlify.app
3. Si el sitio queda con otro nombre, cambiar la URL en las etiquetas `og:image`, `og:url` y `twitter:image` de `index.html`.

Desarrollada por **Vibras Positivas HM** — Derechos de Autor Reservados · vibraspositivashm.com

## Robot de redes (solo GitHub)
- `.github/workflows/robot-redes.yml` corre cada 30 minutos en GitHub Actions (y a mano con **Run workflow**).
- `scripts/robot.mjs` revisa **Instagram** y **YouTube** de @rpg_bajocauca y las **noticias** de Google Noticias que mencionan a la RPG-BC. Deja todo en `data/redes.json` y guarda las fotos de Instagram en `data/redes/` para que no se rompan.
- Facebook, TikTok y X no dejan leer sus publicaciones sin cuenta: las que quieras destacar se pegan en `data/manual.json`.
- La app lee `data/redes.json` directo desde GitHub. `netlify.toml` hace que Netlify **no** publique los commits del robot (`[robot]`), así no se gastan créditos.
- La app trae botón **Actualizar**, contador **Hoy** y la hora de la última revisión (hora Colombia).

## Flyer
`flyer.jpg` (1080×1350) con QR a https://rpg-bajocauca.netlify.app
