// Vercel serverless function — signs an Apple MusicKit developer JWT
// Required env vars (set in Vercel dashboard):
//   APPLE_TEAM_ID     — 10-char Team ID from developer.apple.com
//   APPLE_KEY_ID      — Key ID from the MusicKit key you created
//   APPLE_PRIVATE_KEY — Full contents of the .p8 file (newlines as \n)
//
// Returns: { token: "<jwt>" }  cached for 1 hour

const crypto = require('crypto');

function base64url(input) {
  const buf = typeof input === 'string' ? Buffer.from(input) : Buffer.from(input);
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

module.exports = (req, res) => {
  const { APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY } = process.env;

  if (!APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) {
    return res.status(500).json({ error: 'Apple MusicKit credentials not configured' });
  }

  const now = Math.floor(Date.now() / 1000);

  const header  = base64url(JSON.stringify({ alg: 'ES256', kid: APPLE_KEY_ID }));
  const payload = base64url(JSON.stringify({ iss: APPLE_TEAM_ID, iat: now, exp: now + 15778800 }));
  const unsigned = `${header}.${payload}`;

  // .p8 files use PKCS#8 PEM — Node crypto handles this natively
  const privateKey = APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  try {
    const sign = crypto.createSign('SHA256');
    sign.update(unsigned);
    // ieee-p1363 produces raw r||s (64 bytes) — required by JWT ES256
    const sigBuf = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
    const token = `${unsigned}.${base64url(sigBuf)}`;

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ token });
  } catch (err) {
    console.error('Apple token signing failed:', err.message);
    return res.status(500).json({ error: 'Token signing failed' });
  }
};
