# workflow

React + TypeScript dashboard for triggering Google Apps Script workflows from a single screen.

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment example and add your deployed Apps Script URL:

   ```bash
   cp .env.example .env
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

## Configure Google Script triggers

Set `VITE_GOOGLE_SCRIPT_BASE_URL` in `.env` to your deployed Google Apps Script web app URL.

Example:

```env
VITE_GOOGLE_SCRIPT_BASE_URL=https://script.google.com/macros/s/your-script-id/exec
```

The action buttons are defined in `src/App.tsx`. Each button can use:

- `payload` for a `POST` request body.
- `path` to append query params to the base URL.
- `url` if a button should call a completely different endpoint.

## Build

```bash
npm run build
```

## Notes

- Your Apps Script deployment must be accessible from the browser.
- If your script is called from a different origin, make sure the deployment behavior works for frontend requests.
