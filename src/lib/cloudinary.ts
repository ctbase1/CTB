export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim()

  if (!cloudName || !uploadPreset) {
    throw new Error(`Cloudinary env vars not set (cloud="${cloudName}" preset="${uploadPreset}")`)
  }

  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  if (file.size > MAX_BYTES) throw new Error('File exceeds 5 MB limit')
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Unsupported file type')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    throw new Error(`${err?.error?.message ?? 'Upload failed'} (status=${res.status} cloud="${cloudName}" preset="${uploadPreset}" url=${url})`)
  }

  const data = await res.json()
  return data.secure_url as string
}
