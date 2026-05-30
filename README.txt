================================================================
  UmairDocs - Windows Setup (Just 2 Steps!)
================================================================

STEP 1: Run setup.bat
----------------------
  - Open this folder in VS Code
  - Press Ctrl + ` to open the terminal
  - Type: setup.bat
  - Wait 3-5 minutes for everything to install

  When it finishes, open .env file and replace:
    YOUR_RESEND_API_KEY_HERE
  with your real Resend API key.

STEP 2: Run run.bat
--------------------
  - Type: run.bat
  - Open your browser: http://localhost:3000

That's it!

================================================================
  Troubleshooting
================================================================

- "node is not recognized"
  -> Install Node.js from https://nodejs.org first

- Port 3000 in use
  -> Close other apps, or change port in package.json

- Database errors
  -> Delete db\custom.db and run: npx prisma db push

- Email not sending
  -> Check RESEND_API_KEY in .env is your real key

- White/blank page
  -> Press Ctrl+Shift+R to hard refresh
