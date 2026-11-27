/**
 * Returns true only when an error represents a confirmed HTTP 404 Not Found response.
 * Transient network errors, timeouts, and 5xx server errors return false so pages
 * do not mistakenly emit <meta name="robots" content="noindex"> during temporary outages.
 */
export function isNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { response?: { status?: number }; status?: number };
  const status = anyErr.response?.status ?? anyErr.status;
  return status === 404;
}
