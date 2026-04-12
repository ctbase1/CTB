// Shared input sanitization utilities used by all server actions.

// Unicode characters that can be used for spoofing or injection attacks
const CONTROL_CHARS_REGEX = /[\u0000\u200B-\u200D\uFEFF\u202A-\u202E]/g

/**
 * Trim, strip control/bidi characters, and enforce length bounds.
 * Throws a string error message if validation fails.
 */
export function sanitizeText(
  value: string,
  { min, max }: { min: number; max: number }
): string {
  const cleaned = value.trim().replace(CONTROL_CHARS_REGEX, '')
  if (cleaned.length < min) throw new Error(`Must be at least ${min} characters`)
  if (cleaned.length > max) throw new Error(`Must be under ${max} characters`)
  return cleaned
}

// Private/loopback IP ranges that should never be fetched
const PRIVATE_IP_REGEX =
  /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|::1$|\[::1\])/

/**
 * Validate a URL: must be http/https and must not target private/loopback IPs.
 * Throws a string error message if invalid.
 */
export function sanitizeUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error('Invalid URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('URL must use http or https')
  }
  if (PRIVATE_IP_REGEX.test(url.hostname)) {
    throw new Error('URL targets a private or reserved address')
  }
  return url.toString()
}
