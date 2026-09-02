// Genera los PNG de iconos de la PWA a partir de un SVG.
// Uso: npm run gen-icons
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/icons')
await mkdir(outDir, { recursive: true })

const BG = '#0f172a'
const FG = '#38bdf8'
const INK = '#0f172a'

// Icono "normal": logo centrado con margen.
const logo = (scale) => `
  <g transform="translate(${256 - 150 * scale} ${256 - 180 * scale}) scale(${scale})">
    <path d="M70 0C30 0 0 30 0 70v220c0 40 30 70 70 70h90V0z" fill="#1e293b"/>
    <rect x="90" y="0" width="220" height="360" rx="60" fill="${FG}"/>
    <rect x="140" y="80" width="120" height="30" rx="15" fill="${INK}"/>
    <rect x="140" y="160" width="120" height="30" rx="15" fill="${INK}"/>
    <rect x="140" y="240" width="80" height="30" rx="15" fill="${INK}"/>
    <circle cx="45" cy="100" r="22" fill="${FG}"/>
    <circle cx="45" cy="180" r="22" fill="${FG}"/>
    <circle cx="45" cy="260" r="22" fill="${FG}"/>
  </g>`

const svgNormal = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${BG}"/>${logo(0.78)}</svg>`

// Icono "maskable": fondo a sangre completa + logo dentro de la zona segura (~80%).
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>${logo(0.62)}</svg>`

async function png(svg, size, name) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
  await writeFile(resolve(outDir, name), buf)
  console.log('  ✓', name)
}

console.log('Generando iconos en public/icons/ …')
await png(svgNormal, 192, 'icon-192.png')
await png(svgNormal, 512, 'icon-512.png')
await png(svgNormal, 180, 'apple-touch-icon.png')
await png(svgMaskable, 192, 'icon-maskable-192.png')
await png(svgMaskable, 512, 'icon-maskable-512.png')
console.log('Hecho.')
