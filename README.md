# 🚀 ServiceHub AI

**AI-powered service booking platform for Pakistan** — built with Next.js 15, Firebase, Gemini AI, Tailwind CSS, and Framer Motion.

---

## 📁 Folder Structure

```
servicehub-ai/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/page.tsx               # Login / Register
│   ├── ai-chat/page.tsx            # AI Chat booking interface
│   ├── providers/page.tsx          # Provider results (real-time)
│   ├── booking/page.tsx            # Booking confirmation (real-time)
│   ├── success/page.tsx            # Booking success
│   ├── provider-dashboard/page.tsx # Provider accept/reject panel
│   ├── globals.css
│   └── layout.tsx
├── components/
│   └── booking/
│       └── ProviderBookings.tsx    # Real-time booking cards
├── lib/
│   ├── firebase.ts                 # Firebase Auth + Firestore CRUD
│   ├── gemini.ts                   # Gemini AI intent parsing
│   ├── antigravity.ts              # Zero-dep fallback parser
│   ├── matching.ts                 # Provider matching engine
│   ├── pricing.ts                  # Dynamic pricing engine
│   └── auth-context.tsx            # React auth context
├── types/
│   └── index.ts                    # All TypeScript types
├── .env.local.example
├── vercel.json
├── firestore.rules
└── firestore.indexes.json
```

---

## ⚡ Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone <your-repo>
cd servicehub-ai
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g. `servicehub-ai`)
3. Enable these services:
   - **Authentication** → Email/Password
   - **Firestore Database** → Start in test mode
   - **Storage** → Default bucket

4. Get your config: Project Settings → Your apps → Web app → SDK config

### 3. Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create API key (free tier is enough)

### 4. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...

NEXT_PUBLIC_GEMINI_API_KEY=AIza...
```

### 5. Firestore Security Rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

### 6. Firestore Indexes

In Firebase Console → Firestore → Indexes → Import `firestore.indexes.json`, or let them auto-create on first query.

### 7. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🌐 Deploy to Vercel (Free)

### Option A — Vercel CLI (fastest)

```bash
npm i -g vercel
vercel

# Follow prompts, then set env vars:
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ... (add all env vars from .env.local)

vercel --prod
```

### Option B — Vercel Dashboard

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add all environment variables from `.env.local`
4. Click **Deploy**

> ✅ `vercel.json` is already configured for optimal Next.js deployment.

---

## 🔥 Real-Time Flow

```
Customer Types Request
        ↓
Gemini AI parses intent
(English / Urdu / Roman Urdu)
        ↓
Antigravity fallback parser
(if Gemini unavailable)
        ↓
Firestore real-time query
(active providers by skill + city)
        ↓
Matching Engine scores providers
(skill, rating, availability, reliability)
        ↓
Dynamic Pricing calculated
(base + urgency + travel fees)
        ↓
Customer selects & books
        ↓
Booking saved to Firestore
        ↓
Provider gets real-time notification
        ↓
Provider ACCEPT → Booking confirmed
Provider REJECT → Auto-reassign next match
        ↓
Booking completed → Success page
```

---

## 🤖 AI Chat Examples

| Input | Parsed |
|-------|--------|
| `AC repair kal morning` | AC Repair · medium · Morning |
| `bijli ka masla abhi hai` | Electrical · emergency · Now |
| `plumber chahiye today afternoon` | Plumbing · high · Afternoon |
| `house cleaning this weekend` | Cleaning · low · Weekend |
| `generator repair urgent` | Generator Repair · emergency · ASAP |

---

## 🧪 Test Accounts

After running locally, register two test accounts:

**Customer:**
- Email: `customer@test.com` / Password: `test123`
- Role: Customer

**Provider:**
- Email: `provider@test.com` / Password: `test123`
- Role: Technician / Provider
- Skill: AC Repair · City: Karachi

Then log into **customer** account → chat → book → switch to **provider** account → accept/reject.

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Auth | Firebase Authentication |
| Database | Cloud Firestore (real-time) |
| Storage | Firebase Storage |
| AI | Google Gemini 1.5 Flash |
| Toasts | react-hot-toast |
| Icons | lucide-react |
| Deployment | Vercel |

---

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth` | Login & Register (Customer / Provider) |
| `/ai-chat` | AI Chat booking interface |
| `/providers` | Real-time provider results |
| `/booking?id=X` | Live booking status tracker |
| `/success` | Booking completion + rating |
| `/provider-dashboard` | Provider accept/reject panel |

---

## 🔒 Security

- Firestore rules enforce ownership: customers can only read/write their own bookings
- Providers can only update bookings assigned to them
- All Firebase keys are `NEXT_PUBLIC_` (safe for client-side, restricted by Firebase security rules)
- For production, restrict your Firebase API key to your domain in Google Cloud Console

---

## 💰 Pricing Engine (PKR)

| Service | Base Fee | Urgency Surcharge |
|---------|----------|-------------------|
| AC Repair | ₨1,500 | Emergency +80% |
| Plumbing | ₨800 | High +30% |
| Electrical | ₨1,000 | Medium ±0% |
| Cleaning | ₨600 | Low -10% |

---

Built with ❤️ for Pakistan · ServiceHub AI
