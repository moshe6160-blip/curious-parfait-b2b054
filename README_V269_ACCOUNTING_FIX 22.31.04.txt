V269 PRO ACCOUNTING FIX
- Credit Note is now saved as a separate table row (Option A)
- Credit Note row uses entry_type = credit_note and negative amount
- Original invoice is linked through notes and never creates negative Outstanding
- Reports/totals subtract Credit Note from invoice totals
- Login/auth code untouched
