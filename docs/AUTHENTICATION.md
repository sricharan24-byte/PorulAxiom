# Authentication and authorization

Google OAuth supports account onboarding. A completed onboarding flow establishes application username/password credentials for normal sign-in. The detailed account-linking, recovery, and duplicate-account behavior must be approved before implementation.

## Credentials

- Passwords are never stored or logged as plaintext; store only a modern salted, non-reversible hash.
- Admin can set a replacement password or initiate a reset, but cannot retrieve or see a password.
- Password changes/resets require an auditable event that does not contain the secret.
- Sessions, OAuth secrets, and provider keys remain server-side or securely HTTP-only as appropriate and are never committed.

## Authorization

Every engine endpoint must authenticate the actor and enforce ownership and role boundaries. The sole `ADMIN` may read user trading/account information and manage access, but can never alter/cancel/delete/execute orders or trades. Database and application protections must prevent a second admin.
