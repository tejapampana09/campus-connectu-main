# Campus Connectu

Campus Connectu — connect with your campus community.

## Quick start

Prerequisites:
- Node.js 18+ and npm

Install and run locally:

```bash
npm install
npm run dev
```

Open http://localhost:8080/

## Environment variables

Create a `.env` file in the project root (already added to `.gitignore`) with the following keys:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Replace values with your Firebase Web app config (Firebase Console → Project settings → General → Your apps).

## Firebase setup

1. Go to the Firebase Console and select your project (or create one).
2. In Project settings → General, register a new Web app if none exists.
3. Copy the config values and paste them into your local `.env` as shown above.
4. For deployments, configure environment variables in your hosting provider (Vercel, Netlify, Cloud Run, etc.), do NOT commit `.env`.

## Removing secrets from Git history (recommended)

If you accidentally committed `.env` with real keys, remove it from the repository history before pushing:

- Using `git-filter-repo` (recommended):

```bash
pip install git-filter-repo
# run from repo root
git filter-repo --invert-paths --path .env
```

- Or using BFG:

```bash
# download BFG, then:
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

After cleaning history, force-push to remote (`git push --force`) and rotate any exposed keys.

## Build

```bash
npm run build
npm run preview
```

## Notes

- `index.html` and `package.json` were updated to use the `Campus Connectu` name.
- Keep Firebase keys private; use provider secret stores for production.

If you want, I can add a custom Open Graph image, favicon, or CI deployment steps.