/**
 * Authentication middleware for API and Dashboard.
 *
 * - API routes: Bearer token, query param ?key=, or Basic Auth
 * - Dashboard: HTTP Basic Auth
 * - Telegram webhook: exempted (has its own secret-token check)
 */

export function apiAuth(req, res, next) {
  // Telegram webhook has its own auth via X-Telegram-Bot-Api-Secret-Token
  // Note: when mounted via app.use('/api', apiAuth), req.path is relative (e.g. '/telegram/...')
  if (req.path.startsWith('/telegram/') || req.path.startsWith('/api/telegram/')) return next();

  const expectedKey = process.env.API_SECRET_KEY;
  // No key configured = no auth enforcement (dev mode)
  if (!expectedKey) return next();

  // Check Bearer token
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7);
    if (bearer === expectedKey) return next();
  }

  // Check query param
  if (req.query.key === expectedKey) return next();

  // Check Basic Auth (for dashboard-originated requests)
  if (authHeader.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
      const colonIdx = decoded.indexOf(':');
      if (colonIdx !== -1) {
        const pass = decoded.slice(colonIdx + 1);
        if (pass === expectedKey) return next();
      }
    } catch {
      // malformed basic auth — fall through to 401
    }
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

export function dashboardAuth(req, res, next) {
  const expectedPass = process.env.API_SECRET_KEY;
  // No key configured = no auth enforcement (dev mode)
  if (!expectedPass) return next();

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="News Digest Dashboard"');
    return res.status(401).send('Authentication required');
  }

  try {
    const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) {
      res.setHeader('WWW-Authenticate', 'Basic realm="News Digest Dashboard"');
      return res.status(401).send('Invalid credentials');
    }
    const user = decoded.slice(0, colonIdx);
    const pass = decoded.slice(colonIdx + 1);
    const expectedUser = process.env.DASHBOARD_USER || 'admin';

    if (user !== expectedUser || pass !== expectedPass) {
      res.setHeader('WWW-Authenticate', 'Basic realm="News Digest Dashboard"');
      return res.status(401).send('Invalid credentials');
    }
  } catch {
    res.setHeader('WWW-Authenticate', 'Basic realm="News Digest Dashboard"');
    return res.status(401).send('Invalid credentials');
  }

  next();
}
