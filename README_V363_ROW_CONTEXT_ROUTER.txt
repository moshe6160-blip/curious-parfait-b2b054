V363 Row Context Router
- Fixes row-open type memory bug: row type now wins over last top-button type.
- New top buttons still open their own type.
- DN detected from [[DN:...]] notes and shows DN No.
- Invoice with invoice_no wins over DN tags.
- Deposit detected from entry_type/status/description/DEP.
- Print button routes by current context: PO / Invoice / Delivery Note / Deposit.
- Login, saving and calculations were not touched.
