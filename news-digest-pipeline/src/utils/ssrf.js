import dns from 'dns/promises';

// Private / internal IP ranges — block all of them
const PRIVATE_RANGES = [
  /^localhost$/i,
  /\.localhost$/i,
  /^::1$/,
  /^\[::1\]$/,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,                              // link-local / AWS metadata
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // CGNAT
  /^metadata\.google\.internal$/i,
];

function isPrivateHost(hostname) {
  return PRIVATE_RANGES.some((re) => re.test(hostname));
}

/**
 * Synchronous hostname-only check (no DNS) for quick pre-filtering.
 */
export function isHostnameSafe(hostname) {
  return !isPrivateHost(hostname);
}

/**
 * Validate URL for SSRF safety.
 * Checks hostname regex AND resolves DNS to catch rebinding attacks.
 * Returns { ok: true } or { ok: false, reason: string }
 */
export async function validateUrlSafe(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'Invalid URL' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only HTTPS URLs are accepted' };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { ok: false, reason: 'Private/internal addresses are not allowed' };
  }

  // DNS pre-resolution to catch rebinding attacks
  try {
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    for (const { address } of addresses) {
      if (isPrivateHost(address)) {
        return { ok: false, reason: 'DNS resolved to private/internal address' };
      }
    }
  } catch {
    return { ok: false, reason: 'DNS resolution failed' };
  }

  return { ok: true };
}
