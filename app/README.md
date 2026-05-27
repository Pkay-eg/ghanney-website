# ghanney. — Personal Portal

Private finance + portfolio dashboard for `app.ghanney.com` (currently deployed at `ghanney.com/app/`).

Tracks income, investments, loans receivable, trading positions, projects, contracts, team access and net worth — all backed by Supabase.

---

## Tech stack

- **Frontend**: Static HTML + React 18 (Babel standalone, like `pkay30`)
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Auth**: Email + password (Supabase Auth, owner-only at first; invite team via the Team screen)
- **Hosting**: GitHub Pages → `ghanney.com/app/`

No build step. Edit a `.jsx` file → commit → push → live.

---

## First-time setup

### 1. Create a new Supabase project

1. Go to https://supabase.com → New project.
2. Give it a name (e.g. `ghanney-portal`), pick a strong DB password, choose the region closest to you.
3. Wait ~2 minutes for provisioning.

### 2. Run the schema

1. In the Supabase dashboard → **SQL Editor** → New query.
2. Paste the entire contents of `supabase-schema.sql` (in this folder).
3. Run it. You'll see "Success. No rows returned."
4. Tables created: `profiles`, `income_streams`, `income_records`, `investments`, `investment_payments`, `site_updates`, `loans`, `loan_payments`, `positions`, `trades`, `projects`, `contracts`, `net_worth_snapshots`, `activity_log`.

### 3. Create the Storage bucket

1. **Storage** → New bucket → name it `contracts` → **private** (uncheck "Public bucket").
2. Re-run the `storage` block at the bottom of `supabase-schema.sql` if the policies don't show up (Storage → Policies tab).

### 4. Get your project credentials

**Project Settings → API**:

- **Project URL**: copy the value next to "URL".
- **Project API keys → anon public**: copy the JWT (starts with `eyJ…`).

### 5. Paste them into `config.js`

```js
window.__SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
window.__SUPABASE_ANON_KEY = "eyJhbGciOi…";
```

### 6. Create your account

1. Open `https://ghanney.com/app/` in your browser.
2. Click **"Create one →"** at the bottom of the sign-in card.
3. Use any email + password. The first user automatically gets `role = 'Owner'`.
4. **Confirm your email** if Supabase sent a verification mail (you can disable email confirmation in Supabase → Authentication → Providers → Email → "Confirm email" toggle).
5. Sign in. Your portfolio is empty — start adding income, investments, loans, etc. via the `+ New` menu in the top-right.

### 7. Invite team

From the **Team** screen → **Invite member**. The portal stores them as `Pending` profiles. To let them actually sign in, you have two options:

- **Manual**: Create their auth user in **Supabase → Authentication → Users → Add user**, using the same email. Their profile will link up automatically.
- **Magic-link invite (manual for now)**: Send them their email + password, they sign in normally.

(A proper invitation email flow with role-based RLS can be added later.)

---

## Folder structure

```
app/
├── index.html              # entry (loads everything below)
├── config.js               # Supabase URL + anon key (you edit this)
├── db.js                   # Supabase data layer (don't edit unless adding fields)
├── supabase-schema.sql     # full Postgres schema + RLS policies
├── styles.css              # all CSS
├── components.jsx          # icons, charts, shared atoms
├── fx.jsx                  # currency conversion + formatting
├── tweaks-panel.jsx        # right-side variations panel
├── data.jsx                # seed data (fallback when Supabase not configured)
├── data-extras.jsx         # seed data for contracts, team, site updates
├── app.jsx                 # main App: auth, routing, hydration
└── screens/
    ├── login.jsx           # sign-in / sign-up / password reset
    ├── shell.jsx           # sidebar, top nav, command palette
    ├── dashboard.jsx       # 3 dashboard layouts (Executive / Operator / Calm)
    ├── investments.jsx     # cards / table / map views
    ├── loans.jsx           # loans receivable
    ├── trading.jsx         # positions, tickers, P&L
    ├── contracts.jsx       # document vault
    ├── team.jsx            # people + permissions
    ├── other.jsx           # Income, Projects, Net Worth screens
    ├── form-primitives.jsx # SidePanel, Field, Input, Select, etc.
    ├── forms-investment.jsx
    ├── forms-others.jsx    # loan / trade / project / income / payment forms
    └── forms-extras.jsx    # contract / site update / team invite forms
```

---

## How CRUD works

The prototype keeps state in `window.investments`, `window.loans`, etc. (so screens can re-render via `window.__bumpRev()`). The data layer (`db.js`) does two jobs:

1. **On sign-in** (`db.hydrate()`): loads everything from Supabase and mutates each window array in-place. Screens immediately render real data.
2. **On form submit**: each form calls `await window.db.<entity>.create(obj)`. The data layer inserts into Supabase, then pushes the saved row into the local window array.

Everything is shared by reference. The screens don't know whether they're showing seed data or live Supabase data — they just read from `window.X`.

---

## Migrating to `app.ghanney.com`

Currently this lives at `ghanney.com/app/`. To move it to a real subdomain:

1. **GitHub Pages**: keep this repo as-is. Add a `CNAME` file with `app.ghanney.com` inside an `app/` deployment, OR create a second repo `app.ghanney.com` and copy the `app/` contents there.
2. **Namecheap DNS** (Advanced DNS tab on `ghanney.com`):
   - Add a `CNAME` record: Host `app`, Value `<your-github-username>.github.io`, TTL Auto.
3. **GitHub Pages settings** on the repo: Custom domain → `app.ghanney.com`, enforce HTTPS.

Once DNS propagates (5–60 min), `https://app.ghanney.com` will serve the portal.

---

## Security notes

- All RLS policies currently allow any authenticated user full access. Tighten by role (Owner / PA / Lawyer / Accountant / Read-only) when you're ready — the `profiles.role` column is already in place.
- The anon key is **safe to expose in the browser** (it's not a secret). The service-role key is. Never paste the service-role key into `config.js`.
- Storage bucket `contracts` is private and only accessible to authenticated users via signed URLs.
- Sessions persist in `localStorage` under key `ghanney_portal_session` and auto-refresh.
