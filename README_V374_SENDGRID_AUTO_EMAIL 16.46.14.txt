V374 SENDGRID AUTO EMAIL FULL

Included:
- Full previous V372 system files
- Netlify Function: netlify/functions/send-rfq.js
- package.json with @sendgrid/mail
- V374 Smart Email button sends RFQ with generated PDF attachment

Required Netlify Environment Variables:
SENDGRID_API_KEY=your_new_sendgrid_key
FROM_EMAIL=info@vardophase.co.za
FROM_NAME=Vardophase

Important:
- The sender email info@vardophase.co.za must be verified in SendGrid.
- If an order is Pending Approval, Send is locked by V372 approval gate.
- Approve the order first, then Send RFQ.
