const sgMail = require('@sendgrid/mail');

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'info@vardophase.co.za';
    const fromName = process.env.FROM_NAME || 'Vardophase';

    if (!apiKey) return json(500, { error: 'Missing SENDGRID_API_KEY in Netlify Environment Variables' });
    sgMail.setApiKey(apiKey);

    const data = JSON.parse(event.body || '{}');
    const to = String(data.to || '').trim();
    const subject = String(data.subject || 'RFQ').trim();
    const text = String(data.text || 'Please see attached RFQ.');
    const html = String(data.html || '<p>Please see attached RFQ.</p>');
    const pdfBase64 = String(data.pdfBase64 || '').replace(/^data:application\/pdf;base64,/, '');
    const filename = String(data.filename || 'Vardophase_RFQ.pdf').replace(/[\\/]/g, '_');

    if (!to) return json(400, { error: 'Missing recipient email' });
    if (!pdfBase64) return json(400, { error: 'Missing PDF attachment' });

    await sgMail.send({
      to,
      from: { email: fromEmail, name: fromName },
      subject,
      text,
      html,
      attachments: [{
        content: pdfBase64,
        filename,
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    });

    return json(200, { success: true, to, subject, filename });
  } catch (err) {
    console.error('send-rfq error:', err && (err.response && err.response.body ? err.response.body : err.stack || err.message || err));
    const details = err && err.response && err.response.body ? err.response.body : undefined;
    return json(500, { error: err.message || 'SendGrid failed', details });
  }
};
