'use client'

import { useState } from 'react'

export default function SetupPage() {
  const [copied, setCopied] = useState(false)

  const setupSQL = `-- 357NETWORK Database Setup
-- Run this in your Supabase SQL Editor to create required tables

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'employer', 'advertiser', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can insert profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(setupSQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>357NETWORK - Database Setup</h1>

      <div style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Quick Setup</h2>
        <ol>
          <li>Go to your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase project dashboard</a></li>
          <li>Click <strong>SQL Editor</strong> in the left sidebar</li>
          <li>Click <strong>New Query</strong></li>
          <li>Copy the SQL below into the editor</li>
          <li>Click <strong>Run</strong></li>
          <li>Return to this site and test registration</li>
        </ol>
      </div>

      <div style={{ backgroundColor: '#1a1a1a', color: '#0f0', padding: '20px', borderRadius: '8px', marginBottom: '20px', fontFamily: 'monospace', fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
        <pre>{setupSQL}</pre>
      </div>

      <button
        onClick={handleCopy}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#d4af37',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {copied ? '✓ Copied!' : 'Copy SQL to Clipboard'}
      </button>

      <div style={{ marginTop: '40px', backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
        <h3>After Setup</h3>
        <p>Once you've run the SQL above, you can:</p>
        <ul>
          <li><a href="/register">Register a new account</a></li>
          <li><a href="/signin">Sign in</a></li>
          <li>Access your dashboard</li>
        </ul>
      </div>
    </div>
  )
}
