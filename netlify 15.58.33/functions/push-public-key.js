exports.handler = async () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  if (!publicKey) return { statusCode: 500, body: JSON.stringify({ error: 'Missing VAPID_PUBLIC_KEY' }) };
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicKey }) };
};
