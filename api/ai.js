// api/ai.js — Vercel serverless proxy for Anthropic.
//
// The Anthropic key lives ONLY here (server-side env var); it never reaches the
// browser. Every request must carry a valid Supabase access token, so only the
// signed-in owner can spend the key. The browser calls this via
// window.claude.complete(...) (see src/ai.js); the 5 existing AI call sites are
// unchanged.
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
// Sonnet 4.6: vision-capable, good cost/quality (matches the RUNBOOK's Sonnet
// choice). Override with ANTHROPIC_MODEL if needed.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const MAX_TOKENS = 2048;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) Verify the Supabase JWT — reject anyone who isn't the signed-in owner.
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) return res.status(401).json({ error: 'Invalid session' });
  } catch (e) {
    return res.status(401).json({ error: 'Auth check failed' });
  }

  // 2) Validate the content payload (text + base64 image blocks).
  const content = req.body && req.body.content;
  if (!Array.isArray(content) || content.length === 0) {
    return res.status(400).json({ error: 'Missing content' });
  }
  // Lightweight spend guard: cap images and total payload size per request.
  const imageCount = content.filter((b) => b && b.type === 'image').length;
  if (imageCount > 2) return res.status(400).json({ error: 'Too many images' });
  if (JSON.stringify(content).length > 8_000_000) return res.status(413).json({ error: 'Payload too large' });

  // 3) Call Anthropic — content blocks are already in the messages format.
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'AI not configured' });
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'disabled' }, // fast, cheap — these are short structured tasks
      messages: [{ role: 'user', content }],
    });
    const text = (msg.content || []).map((c) => (c.type === 'text' ? c.text : '')).join('');
    return res.status(200).json({ text });
  } catch (e) {
    const status = e && e.status ? e.status : 502;
    return res.status(status).json({ error: e && e.message ? e.message : 'AI request failed' });
  }
}
