V414 CODE STRUCTURE CLEAN FROM V401

Base:
- V401 stable dock version.

What was cleaned:
- Removed old README_Vxxx files.
- Removed backup/temp files such as index.bak, index.tmp, index.orig.
- Removed .DS_Store files.
- Kept only the files referenced by index.html plus safe required system files.
- Kept assets/ and netlify/functions/ folders.

What was NOT changed:
- Login logic.
- Supabase logic.
- Push / Realtime functions.
- V401 dock behavior.

Upload rule:
- Upload the CONTENTS of this ZIP to the GitHub repository root.
- Do not upload the ZIP itself.
- GitHub root should contain index.html directly.
