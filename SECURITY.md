# Security Policy

Never commit credentials, API keys, or secrets to this repository. Use environment
variables or a managed secrets store (AWS Secrets Manager, Vercel/Netlify
Secrets, etc.).

If a credential is accidentally committed, rotate it immediately and purge the
secret from version history.
