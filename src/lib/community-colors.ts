// src/lib/community-colors.ts

export interface CommunityColor {
  accent: string
  bg: string
  border: string
  strip: string   // gradient for the 3px top strip
}

const PALETTE: CommunityColor[] = [
  { accent: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.22)',  strip: 'linear-gradient(90deg,#1d4ed8,#3b82f6)' },
  { accent: '#7c3aed', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.22)', strip: 'linear-gradient(90deg,#5b21b6,#7c3aed)' },
  { accent: '#0d9488', bg: 'rgba(13,148,136,0.10)', border: 'rgba(13,148,136,0.22)', strip: 'linear-gradient(90deg,#0f766e,#0d9488)' },
  { accent: '#059669', bg: 'rgba(5,150,105,0.10)',  border: 'rgba(5,150,105,0.22)',  strip: 'linear-gradient(90deg,#047857,#059669)' },
  { accent: '#ea580c', bg: 'rgba(234,88,12,0.10)',  border: 'rgba(234,88,12,0.22)',  strip: 'linear-gradient(90deg,#c2410c,#ea580c)' },
  { accent: '#e11d48', bg: 'rgba(225,29,72,0.10)',  border: 'rgba(225,29,72,0.22)',  strip: 'linear-gradient(90deg,#be123c,#e11d48)' },
  { accent: '#d97706', bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.22)',  strip: 'linear-gradient(90deg,#b45309,#d97706)' },
  { accent: '#4f46e5', bg: 'rgba(79,70,229,0.10)',  border: 'rgba(79,70,229,0.22)',  strip: 'linear-gradient(90deg,#4338ca,#4f46e5)' },
]

export function getCommunityColor(slug: string): CommunityColor {
  const hash = slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return PALETTE[hash % PALETTE.length]
}
