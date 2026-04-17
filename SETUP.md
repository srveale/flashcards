# Flashcard App — Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and give it a name (e.g. `flashcards`)
3. Note your **Project URL** and **anon public key** from **Settings → API**

## 2. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste the contents of `supabase-schema.sql` and click **Run**
4. This creates the `decks` and `cards` tables with Row Level Security

## 3. Enable Google Auth

1. In Supabase, go to **Authentication → Providers → Google**
2. Toggle it **on**
3. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new OAuth 2.0 Client ID (Web application)
   - Add `https://your-project-ref.supabase.co/auth/v1/callback` as an authorized redirect URI
   - Copy the **Client ID** and **Client Secret** into Supabase
4. Under **Authentication → URL Configuration**, add your site URL (e.g. `https://your-app.vercel.app`)

## 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 6. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy — Vercel auto-detects Next.js
5. After deployment, add your Vercel URL to:
   - Supabase → Authentication → URL Configuration → Site URL
   - Supabase → Authentication → URL Configuration → Redirect URLs (add `https://your-app.vercel.app/auth/callback`)
   - Google Cloud Console → OAuth Client → Authorized redirect URIs
