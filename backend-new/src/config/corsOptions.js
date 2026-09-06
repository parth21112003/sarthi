/**
 * ==============================================================================
 * CORS CONFIGURATION (src/config/corsOptions.js)
 * ==============================================================================
 * Dynamically validates origins to support:
 * 1. Configured CLIENT_URL(s) in env (handles trailing slashes & comma-separated values)
 * 2. Vercel deployments (*.vercel.app and preview domains)
 * 3. Render backend domains (*.onrender.com)
 * 4. Localhost / 127.0.0.1 development on any port
 * 5. Server-to-server / curl / Postman requests (where origin is undefined)
 * ==============================================================================
 */

export const isAllowedOrigin = (origin) => {
  // Allow requests without Origin header (mobile apps, server-to-server, curl, Postman, health check)
  if (!origin) return true;

  const normalized = origin.trim().replace(/\/$/, '');

  // Check against CLIENT_URL if provided
  if (process.env.CLIENT_URL && process.env.CLIENT_URL !== '*') {
    const allowedUrls = process.env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, ''));
    if (allowedUrls.includes(normalized)) {
      return true;
    }
  }

  // Allow production Vercel app and all preview branches
  if (normalized.endsWith('.vercel.app')) {
    return true;
  }

  // Allow Render domains
  if (normalized.endsWith('.onrender.com')) {
    return true;
  }

  // Allow localhost & 127.0.0.1 development on any port
  if (
    normalized.startsWith('http://localhost:') ||
    normalized.startsWith('https://localhost:') ||
    normalized.startsWith('http://127.0.0.1:') ||
    normalized.startsWith('https://127.0.0.1:')
  ) {
    return true;
  }

  return false;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      // Reflects the exact incoming origin to satisfy credentials: true requirements
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
};
