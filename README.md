# Library Fees – free student and fee tracker (PWA)

React + Vite + Tailwind, Firebase (Firestore database + login), GitHub Actions (daily 9 AM alert), CallMeBot (free WhatsApp), Netlify (hosting). Everything is free and needs no credit card.

## Pages
Login · Home (dashboard) · Students (add / edit / delete / search) · Seats · Due list · Settings

## Setup, step by step

### 1. Put the code on GitHub
1. Create a free account at github.com and a new repository (for example `library-fees`).
2. Upload this whole folder, including the hidden `.github` folder. Do not upload `node_modules` or `.env` files.

### 2. Create the Firebase project (stay on the free Spark plan)
1. Go to console.firebase.google.com, sign in with a Google account, click **Create a project**. Turn Google Analytics off. Do NOT upgrade to Blaze (that is the plan that asks for a card).
2. **Build → Authentication → Get started → Email/Password → Enable → Save.**
3. **Authentication → Users → Add user.** Enter the owner's email and password. After it is created, **copy the User UID** shown in the list.
4. **Build → Firestore Database → Create database.** Choose a location (Mumbai `asia-south1` if shown, it cannot be changed later) and **Production mode**.
5. Open the **Rules** tab, paste everything from `firestore.rules`, replace `PASTE_OWNER_UID_HERE` with the UID from step 3, and click **Publish**. This makes the data readable and writable only by the owner, even if a stranger signs up through the API.
6. **Project settings (gear icon) → General → Your apps → Web icon (</>)**. Register an app (any name, no hosting). Copy `apiKey`, `authDomain`, `projectId`, `appId`. These are safe to put in the website.
7. **Project settings → Service accounts → Generate new private key.** A `.json` file downloads. This is SECRET: it goes only into GitHub secrets. Never upload it to the repository.

### 3. Activate CallMeBot (free WhatsApp alerts to the owner)
1. Save the CallMeBot number in the owner's phone contacts. Check the current number at **callmebot.com/blog/free-api-whatsapp-messages/**.
2. From the owner's WhatsApp, send that contact: `I allow callmebot to send me messages`
3. CallMeBot replies with your **API key**. Keep it. The phone value is the owner's number with country code, like `+919876543210`.

### 4. Deploy on Netlify (recommended)
1. Sign up at netlify.com with GitHub. **Add new site → Import an existing project**, pick the repository.
2. Build command `npm run build`, publish directory `dist`.
3. Add these environment variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` (values from step 2.6). Deploy.
4. Copy your site link. In Firebase: **Authentication → Settings → Authorized domains → Add domain**, and add the Netlify domain (for example `your-site.netlify.app`).
5. Vercel also works with the same settings, but its free Hobby plan is non-commercial only, so Netlify is safer for a business.

### 5. Add the GitHub secrets
Repository **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Open the downloaded `.json` file in a text editor and paste the ENTIRE contents |
| `CALLMEBOT_API_KEY` | key from step 3 |
| `CALLMEBOT_PHONE` | owner number, e.g. `+919876543210` |
| `SITE_URL` | your Netlify link |

Test: **Actions → Daily fee reminder → Run workflow**. If someone is due you get a WhatsApp message; if nobody is due, nothing is sent (the log says so). The job runs daily at 9:00 AM India time (03:30 UTC); GitHub can start it a few minutes late.

### 6. Install on the phone
Chrome (Android): menu → **Add to Home screen / Install app**. iPhone: Safari → Share → **Add to Home Screen**.

### 7. First use
Sign in → **Settings**: set your name, WhatsApp number, the number of seats in each library, the monthly price for each option (Normal, Normal + locker, Premium, Premium + locker), the reminder messages → **Students → Add student**.

## Sign in and password reset
- Sign in with the owner's email, or with the WhatsApp number saved in Settings (save Settings once after signing in).
- **Forgot password?** sends a reset link to the owner's email. A text-message code is not possible on the free plan.
- After updating, paste `firestore.rules` again in Firebase (with the owner UID) and Publish. It adds the phone sign-in lookup.

## How it works
- One library with a number of seats you can change in Settings (Active students each need a different seat). The default monthly fee in Settings fills in for new students, and you can still change it for one student.
- New student: next due date = joining date + 1 month. **Mark as paid** saves a payment (date + amount) and moves the due date forward 1 month. A student 3 months behind needs 3 payments recorded, one per month.
- **Advance reminder:** students whose fee falls due in the next 2 days appear on the Due list page under "Coming up". Tap **Send advance reminder** to open WhatsApp with a ready message (name, amount, due date, seat). The text is editable in Settings. The 9 AM alert to the owner also lists everyone whose fee is due in exactly 2 days, so the owner knows when to send them.
- **Send WhatsApp** opens `wa.me` with the message filled in, then records "Reminder sent on <date>". The owner still has to press Send in WhatsApp.
- **Fallback:** the Home page always lists everyone due or overdue, so nothing is missed if CallMeBot fails. A failed alert also shows as a red failed run in GitHub, and GitHub emails you.
- Students marked **Left** are skipped in alerts and due lists, and their seat becomes free.
- "One Active student per seat" is checked inside the app. Firestore has no unique rule, which is fine with a single owner on one phone, but avoid adding students from two devices at the same moment.
- Firebase does not pause inactive projects, so no keep-alive is needed.

## Run locally (optional)
```
npm install
cp .env.example .env.local   # fill in the four values
npm run dev
```

## Free-tier limits to know (Firebase Spark plan)
- **Firestore:** 1 GiB stored, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day. Each page load reads every student once, so even 300 students use only a small part of this. If you ever pass a limit, the app stops working until the next day (it never charges, because Spark has no card).
- **Authentication:** email/password login is free at this size.
- **No automatic backups** on the free plan. Firestore exports need the paid plan, so every month or so open the Students page and keep a screenshot or copy of the list somewhere safe.
- **GitHub Actions:** unlimited minutes on public repos, 2,000 min/month on private; this job uses about 1 minute a day. In a public repo, scheduled jobs are switched off after 60 days with no commits: make a small commit or re-enable it.
- **CallMeBot:** free but unofficial and rate-limited. Fine for 1 message a day, no uptime guarantee, which is why the dashboard fallback exists.
- **Netlify free:** 100 GB bandwidth and 300 build minutes per month. **Vercel Hobby:** non-commercial use only.
- **wa.me reminders** come from the owner's own WhatsApp, one tap each. There is no bulk sending.
- Limits change over time. Check each provider's pricing page.

## Security notes
The Firebase web config is public by design. Access is protected by the Firestore rules (owner UID only). Never put the service account `.json` in the website or the repository.
