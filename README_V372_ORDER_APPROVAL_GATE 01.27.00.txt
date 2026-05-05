V372 ORDER APPROVAL GATE

Added:
- New order approval flow.
- New orders default to Pending Approval.
- Approve Order button in the order modal.
- Approve Order button in the selected-row toolbar.
- Email / Send / Share is blocked until the order is Approved.
- Mobile + desktop popup appears when there are orders waiting for approval.
- Pending Approval / Approved badges styled clearly.

Notes:
- Uses the existing suppliers.status field, so no database schema change is required.
- For full automatic email sending, keep the SendGrid / Netlify environment variables from V371 when ready.
