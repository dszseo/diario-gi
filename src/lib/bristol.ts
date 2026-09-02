export interface BristolInfo {
  type: number
  title: string
  description: string
}

// Textos exactos del enunciado.
export const BRISTOL: BristolInfo[] = [
  { type: 1, title: 'Bolitas duras', description: 'Pequeñas bolitas separadas y difíciles de expulsar.' },
  { type: 2, title: 'Alargada y grumosa', description: 'Forma alargada, pero con bultos.' },
  { type: 3, title: 'Alargada con grietas', description: 'Forma de salchicha con grietas en la superficie.' },
  { type: 4, title: 'Suave y lisa', description: 'Forma alargada, blanda y fácil de expulsar.' },
  { type: 5, title: 'Trozos blandos', description: 'Trozos blandos con bordes definidos.' },
  { type: 6, title: 'Blanda/pastosa', description: 'Trozos blandos, irregulares o pastosos.' },
  { type: 7, title: 'Líquida', description: 'Totalmente líquida, sin partes sólidas.' },
]

export const bristolInfo = (type: number | undefined): BristolInfo | undefined =>
  type ? BRISTOL.find((b) => b.type === type) : undefined
