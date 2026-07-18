// Cloudflare Pages middleware: edge enforcement for authentication.
// Verifies the `expense_auth` cookie (an Auth0 RS256 JWT access token) before
// serving HTML navigations; anonymous visitors are redirected to /login.
// Static assets and the login/callback routes pass through — see
// auth-implementation-plan.md, Phase 5.
// Requires runtime env vars: AUTH0_DOMAIN, AUTH0_AUDIENCE.

import { createRemoteJWKSet, jwtVerify } from 'jose';

const COOKIE_NAME = 'expense_auth';
const PUBLIC_PATHS = new Set(['/login', '/callback']);

// Module-scoped so the fetched keys are reused across requests in the same isolate.
let jwks = null;

function getJwks(domain) {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));
  }
  return jwks;
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

function isHtmlNavigation(request, url) {
  if (request.method !== 'GET') return false;
  // Hashed bundles, images, etc. have a file extension in the last segment;
  // SPA routes (/, /docs, ...) do not.
  const lastSegment = url.pathname.split('/').pop();
  if (lastSegment && lastSegment.includes('.')) return false;
  return true;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (!isHtmlNavigation(request, url) || PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  // Fail open if the function isn't configured (e.g. preview without env vars):
  // the SPA route guard still applies, and a misconfiguration shouldn't brick the site.
  if (!env.AUTH0_DOMAIN || !env.AUTH0_AUDIENCE) {
    console.warn('_middleware: AUTH0_DOMAIN/AUTH0_AUDIENCE not set; skipping edge auth');
    return next();
  }

  const token = getCookie(request, COOKIE_NAME);
  if (token) {
    try {
      await jwtVerify(token, getJwks(env.AUTH0_DOMAIN), {
        issuer: `https://${env.AUTH0_DOMAIN}/`,
        audience: env.AUTH0_AUDIENCE,
      });
      return next();
    } catch {
      // Expired or tampered token — treat as anonymous.
    }
  }

  return Response.redirect(`${url.origin}/login`, 302);
}
