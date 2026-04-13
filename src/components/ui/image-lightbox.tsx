'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface Props {
  src: string
  alt: string
}

export function ImageLightbox({ src, alt }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative mb-4 w-full overflow-hidden rounded-lg bg-zinc-800 cursor-zoom-in"
        style={{ aspectRatio: '16/9' }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
