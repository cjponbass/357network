# 357NETWORK

Building Careers. Strengthening Brotherhood.

A professional employment network for Freemasons, Masonic-friendly employers, and job seekers in the United States.

## Tech Stack

- **Frontend**: Next.js 14 with React
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Payments**: Stripe
- **Deployment**: Netlify
- **Languages**: English, Spanish

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Development

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
npm start
```

## Deployment

This project is configured for Netlify deployment. The `netlify.toml` file defines build and publish settings.

## Phase 1 Features

- Home page
- Job search (Find Jobs)
- Traveling Man jobs section
- Post a Job page
- Advertising page
- User registration and authentication
- Job Seeker dashboard
- Employer dashboard
- Admin approval workflow
- Stripe checkout for job listings and ads
- English/Spanish support

## Phase 2 (Locked)

Phase 2 features are documented but not implemented. Do not build Phase 2 features without explicit approval.

## Project Structure

```
357network/
├── app/               # Next.js app directory
├── docs/             # Project documentation
├── public/           # Static files
├── package.json      # Dependencies
├── netlify.toml      # Netlify configuration
└── next.config.js    # Next.js configuration
```

## License

357NETWORK — 2024
