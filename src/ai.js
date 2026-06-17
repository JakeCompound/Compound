// ai.js — defines window.claude.complete, the single AI entry point the app's
// 5 call sites already use. It forwards to the /api/ai serverless proxy with the
// signed-in user's Supabase token; the Anthropic key stays server-side.
//
// Accepts either a string prompt or an array of content blocks
// ([{type:'text',text}, {type:'image',source:{type:'base64',media_type,data}}]).
// Returns the model's text; call sites regex JSON out of it as before.
import { supabase, supabaseConfigured } from './supabase.js';

async function complete(input) {
  const content = typeof input === 'string' ? [{ type: 'text', text: input }] : input;

  let token = null;
  if (supabaseConfigured) {
    try { const { data } = await supabase.auth.getSession(); token = data && data.session ? data.session.access_token : null; } catch (e) {}
  }

  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ content }),
  });
  if (!r.ok) {
    let msg = `AI request failed (${r.status})`;
    try { const j = await r.json(); if (j && j.error) msg = j.error; } catch (e) {}
    throw new Error(msg);
  }
  const { text } = await r.json();
  return text;
}

window.claude = { complete };

export { complete };
