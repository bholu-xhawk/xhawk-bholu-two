const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('./models/User');

const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'development-only-auth-token-secret';

function sign(value) {
  return crypto
    .createHmac('sha256', AUTH_TOKEN_SECRET)
    .update(value)
    .digest('base64url');
}

function createAuthToken(userId) {
  const payload = Buffer.from(JSON.stringify({ sub: userId.toString() })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function getUserIdFromToken(token) {
  if (!token || typeof token !== 'string') return null;

  const [payload, signature, ...rest] = token.split('.');
  if (!payload || !signature || rest.length > 0) return null;

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof data.sub === 'string' && mongoose.isValidObjectId(data.sub) ? data.sub : null;
  } catch (_err) {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'authentication required' });
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'invalid authentication token' });
  }

  try {
    const user = await User.exists({ _id: userId });
    if (!user) {
      return res.status(401).json({ error: 'invalid authentication token' });
    }

    req.user = { id: userId };
    return next();
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
}

module.exports = { createAuthToken, requireAuth };
