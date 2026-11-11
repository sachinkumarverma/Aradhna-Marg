process.env.NODE_ENV = 'test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAllowedPdfProxyHosts, isPdfResponse, isPrivateIpAddress, validatePdfProxyUrl } from '../utils/pdfProxy';

describe('PDF proxy security', () => {
  it('blocks private and loopback IP addresses', () => {
    assert.equal(isPrivateIpAddress('127.0.0.1'), true);
    assert.equal(isPrivateIpAddress('10.0.0.1'), true);
    assert.equal(isPrivateIpAddress('192.168.1.10'), true);
    assert.equal(isPrivateIpAddress('::1'), true);
    assert.equal(isPrivateIpAddress('8.8.8.8'), false);
  });

  it('rejects non-HTTPS and non-allowlisted PDF URLs before making a request', async () => {
    await assert.rejects(() => validatePdfProxyUrl('http://example.com/file.pdf'));
    await assert.rejects(() => validatePdfProxyUrl('https://example.com/file.pdf'));
    await assert.rejects(() => validatePdfProxyUrl('https://127.0.0.1/file.pdf'));
  });

  it('requires a PDF content type and PDF file signature', () => {
    assert.equal(isPdfResponse('text/html', Buffer.from('%PDF-1.7')), false);
    assert.equal(isPdfResponse('application/pdf', Buffer.from('<html>')), false);
    assert.equal(isPdfResponse('application/pdf; charset=binary', Buffer.from('%PDF-1.7')), true);
  });

  it('allows the configured Backblaze bucket virtual-host URL', () => {
    assert.equal(getAllowedPdfProxyHosts().has('aradhna-marg-storage.s3.us-east-005.backblazeb2.com'), true);
  });
});
