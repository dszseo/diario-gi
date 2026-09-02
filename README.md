# Diario GI

Diario gastrointestinal personal (PWA). Registra comidas, deposiciones, gases y
síntomas como acontecimientos **independientes** en una línea temporal, y expórtalos
en CSV/JSON para analizarlos fuera de la app.

- **Offline total**: tras la primera carga funciona sin conexión.
- **Privado**: todos los datos se guardan solo en el dispositivo (IndexedDB). No hay
  servidor ni cuentas.
- **Uso con una mano**: registro rápido, campos opcionales de verdad opcionales.

## Desarrollo

```bash
npm install
npm run gen-icons      # genera public/icons/*.png (solo hace falta una vez o al cambiar el logo)
npm run dev            # http://localhost:5173
npm test               # lógica de exportación y fechas
npm run typecheck
npm run build          # genera dist/ (app + service worker)
npm run preview        # sirve dist/ en http://localhost:4173
```

Stack: Preact + Vite + TypeScript · Dexie (IndexedDB) · date-fns · PapaParse ·
vite-plugin-pwa (Workbox).

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/db/` | Esquema Dexie, CRUD de eventos, alimentos, favoritas, síntomas |
| `src/export/` | Rangos de fechas, generación de CSV y de copia de seguridad JSON |
| `src/components/` | Timeline, selector de Bristol, escalas, chips de alimentos, etc. |
| `src/routes/` | Hoy, alta/edición, calendario, día, exportar, ajustes |
| `src/lib/` | Fechas, escalas en español, textos de Bristol, resúmenes |
| `scripts/gen-icons.mjs` | Generador de iconos PNG a partir de un SVG |

## Formato de exportación

### CSV (principal)

Una fila por acontecimiento. UTF-8 **con BOM** y saltos `\r\n` (Excel lo abre con
acentos correctos). Separador seleccionable: `,` (Python/IA) o `;` (Excel en español).

Columnas: `fecha, hora, tipo, contenido, cantidad, bristol, bristol_desc, urgencia,
esfuerzo, evacuacion_incompleta, dolor, gases_intensidad, hinchazon, eructos,
flatulencia, sintoma, intensidad, duracion_min, notas`.

Los campos que no aplican a un tipo van vacíos (una comida no tiene `bristol`, etc.).

### JSON

- **Exportar → JSON**: volcado del periodo elegido (para procesar con código).
- **Ajustes → Copia de seguridad**: volcado completo con `schemaVersion`, pensado para
  **restaurar** la app exactamente (Reemplazar todo o Fusionar por id).

## Publicar en el móvil (GitHub Pages)

1. Crea un repositorio en GitHub llamado **`diario-gi`** (privado va bien).
   Si usas otro nombre, cámbialo en `vite.config.ts` (`const REPO = ...`).
2. Sube el proyecto:
   ```bash
   git init
   git add .
   git commit -m "Diario GI inicial"
   git branch -M main
   git remote add origin https://github.com/<usuario>/diario-gi.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. El workflow `.github/workflows/deploy.yml` compila y publica en cada push a `main`.
   La URL será `https://<usuario>.github.io/diario-gi/`.
5. En el Xiaomi, abre esa URL en **Chrome** → menú **⋮ → Añadir a pantalla de inicio**
   (o "Instalar aplicación"). La primera vez, acepta el aviso de almacenamiento
   persistente en Ajustes de la app.

### Plan B: generar un APK (si MIUI no instala bien la PWA)

1. Con la app ya publicada en HTTPS, entra en <https://www.pwabuilder.com/>.
2. Pega la URL de GitHub Pages → **Package for stores → Android**.
3. Descarga el `.apk` (compilación en la nube, no necesitas Android SDK) e instálalo
   en el Xiaomi (activa "instalar apps desconocidas" para el navegador/archivos).

El `manifest.webmanifest` ya incluye nombre, iconos 192/512, uno *maskable* y
`display: standalone`, que es lo que PWABuilder necesita.

## Copias de seguridad

Haz **Ajustes → Descargar copia de seguridad** de vez en cuando y guarda el `.json`
donde quieras (Drive, PC…). La app avisa si hace más de 7 días de la última.
"Borrar todos los datos" descarga automáticamente una copia antes de borrar.
