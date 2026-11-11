import dns from 'node:dns/promises';
import net from 'node:net';
import { config } from '@/config';

export const MAX_PDF_PROXY_BYTES = 25 * 1024 * 1024;

const PDF_MAGIC = Buffer.from('%PDF-');

export class PdfProxyInputError extends Error {}

const getConfiguredHost = (value?: string): string | undefined => {
  if (!value) return undefined;

  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return undefined;
  }
};

export const getAllowedPdfProxyHosts = (): Set<string> => {
  const configuredHosts = (config.PDF_PROXY_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  const b2EndpointHost = getConfiguredHost(config.B2_ENDPOINT);
  const b2BucketHost =
    b2EndpointHost && config.B2_BUCKET_NAME ? `${config.B2_BUCKET_NAME.toLowerCase()}.${b2EndpointHost}` : undefined;

  return new Set(
    [getConfiguredHost(config.SUPABASE_URL), b2EndpointHost, b2BucketHost, ...configuredHosts].filter(
      (host): host is string => Boolean(host)
    )
  );
};

const isPrivateIpv4 = (address: string): boolean => {
  const octets = address.split('.').map(Number);
  const [first, second] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168)) ||
    (first === 198 && second >= 18 && second <= 19) ||
    first >= 224
  );
};

const isPrivateIpv6 = (address: string): boolean => {
  const normalized = address.toLowerCase();

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('ff') ||
    normalized.startsWith('::ffff:')
  );
};

export const isPrivateIpAddress = (address: string): boolean => {
  if (net.isIPv4(address)) return isPrivateIpv4(address);
  if (net.isIPv6(address)) return isPrivateIpv6(address);
  return false;
};

const isPrivateHostname = (hostname: string): boolean => {
  return hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local');
};

const isAllowedStoragePath = (hostname: string, pathname: string): boolean => {
  const supabaseHost = getConfiguredHost(config.SUPABASE_URL);
  if (hostname === supabaseHost) return pathname.startsWith('/storage/v1/object/');

  const b2EndpointHost = getConfiguredHost(config.B2_ENDPOINT);
  const b2BucketName = config.B2_BUCKET_NAME?.toLowerCase();
  const b2BucketHost = b2EndpointHost && b2BucketName ? `${b2BucketName}.${b2EndpointHost}` : undefined;

  if (hostname === b2BucketHost) return pathname.startsWith('/');
  if (hostname === b2EndpointHost && b2BucketName) return pathname.startsWith(`/${b2BucketName}/`);

  return false;
};

export const validatePdfProxyUrl = async (rawUrl: unknown): Promise<URL> => {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0 || rawUrl.length > 2048) {
    throw new PdfProxyInputError('A valid PDF URL is required');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new PdfProxyInputError('A valid PDF URL is required');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (
    parsedUrl.protocol !== 'https:' ||
    Boolean(parsedUrl.username || parsedUrl.password) ||
    (parsedUrl.port !== '' && parsedUrl.port !== '443') ||
    isPrivateHostname(hostname) ||
    net.isIP(hostname) !== 0 ||
    !getAllowedPdfProxyHosts().has(hostname) ||
    !isAllowedStoragePath(hostname, parsedUrl.pathname)
  ) {
    throw new PdfProxyInputError('PDF URL is not an allowed storage URL');
  }

  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIpAddress(address))) {
    throw new PdfProxyInputError('PDF URL resolves to a private network address');
  }

  return parsedUrl;
};

export const isPdfResponse = (contentType: unknown, body: Buffer): boolean => {
  const normalizedContentType =
    typeof contentType === 'string' ? contentType.split(';', 1)[0].trim().toLowerCase() : '';
  const hasPdfContentType =
    normalizedContentType === 'application/pdf' || normalizedContentType === 'application/octet-stream';
  const signatureOffset = body.indexOf(PDF_MAGIC, 0);

  return hasPdfContentType && signatureOffset >= 0 && signatureOffset <= 1024;
};
