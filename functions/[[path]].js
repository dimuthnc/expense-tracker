// Cloudflare Pages Function: set canonical Link header dynamically per request
// This avoids hard-coding a domain in the HTML, which is better for forks/OSS.
// Docs: https://developers.cloudflare.com/pages/functions/

export async function onRequest(context) {
  // Let Pages/Assets handle the request first
  const response = await context.next();

  // Only add canonical for HTML documents
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  const url = new URL(context.request.url);

  // Clean up common tracking params so canonical stays stable
  const params = url.searchParams;
  const drop = new Set(['gclid', 'fbclid']);
  for (const key of [...params.keys()]) {
    if (key.startsWith('utm_') || drop.has(key)) {
      params.delete(key);
    }
  }
  const search = params.toString();
  const canonical = `${url.origin}${url.pathname}${search ? `?${search}` : ''}`;

  // Merge with any existing Link headers
  const headers = new Headers(response.headers);
  const existingLink = headers.get('Link');
  const canonicalEntry = `<${canonical}>; rel="canonical"`;
  headers.set('Link', existingLink ? `${existingLink}, ${canonicalEntry}` : canonicalEntry);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

