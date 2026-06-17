import React from 'react';
import { C } from './compound-ui.jsx';
import { supabase, supabaseConfigured } from './supabase.js';

// auth-gate.jsx — gates the app behind Supabase email/password auth.
// When Supabase isn't configured (no env keys) it's a no-op pass-through so the
// app still runs in local-only mode. The session is persisted by supabase-js,
// so the user logs in once per device.

function AuthGate({ children }) {
  const [ready, setReady] = React.useState(!supabaseConfigured);
  const [session, setSession] = React.useState(null);

  React.useEffect(() => {
    if (!supabaseConfigured) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!supabaseConfigured) return children;   // local-only mode
  if (!ready) return <Splash />;
  if (!session) return <AuthScreen />;
  return children;
}

function Splash() {
  return (
    <div style={{ minHeight: '100vh', background: '#050507', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 3, color: C.accent }}>◆ COMPOUND</div>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = React.useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [info, setInfo] = React.useState(null);

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const submit = async () => {
    if (!valid || pending) return;
    setPending(true); setError(null); setInfo(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation is on → no session yet.
          setInfo('Account created. Check your email to confirm, then sign in.');
          setMode('signin');
        }
        // else onAuthStateChange swaps to the app automatically.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 0%, #1a1410 0%, #0a0a0c 55%, #050507 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 3, color: C.accent, marginBottom: 18 }}>◆ COMPOUND</div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 40, lineHeight: 0.95, letterSpacing: 0.5, color: C.text, margin: 0, textTransform: 'uppercase' }}>
          {mode === 'signin' ? <>WELCOME<br /><span style={{ color: C.accent }}>BACK.</span></> : <>CREATE YOUR<br /><span style={{ color: C.accent }}>ACCOUNT.</span></>}
        </h1>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.textMid, lineHeight: 1.5, margin: '12px 0 28px' }}>
          {mode === 'signin' ? 'Sign in to sync your training, nutrition and check-ins across devices.' : 'One account keeps everything backed up and synced. Consistency over perfection.'}
        </p>

        <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" autoFocus />
        <div style={{ height: 16 }} />
        <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="At least 6 characters" onEnter={submit} />

        {error && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.danger, marginTop: 14, lineHeight: 1.4 }}>{error}</div>}
        {info && <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.accent, marginTop: 14, lineHeight: 1.4 }}>{info}</div>}

        <button
          onClick={submit}
          disabled={!valid || pending}
          style={{
            width: '100%', height: 54, marginTop: 24,
            background: (!valid || pending) ? 'rgba(242,163,15,.28)' : C.accent,
            color: (!valid || pending) ? 'rgba(0,0,0,.45)' : '#0A0A0C',
            border: 0, borderRadius: 12,
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 2, textTransform: 'uppercase',
            cursor: (!valid || pending) ? 'default' : 'pointer',
          }}
        >
          {pending ? 'One sec…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
          style={{ width: '100%', marginTop: 16, background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid }}
        >
          {mode === 'signin'
            ? <>New here? <span style={{ color: C.accent }}>Create an account</span></>
            : <>Already have an account? <span style={{ color: C.accent }}>Sign in</span></>}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder, autoFocus, onEnter }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: C.textLow, marginBottom: 8 }}>{label.toUpperCase()}</div>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        style={{
          width: '100%', boxSizing: 'border-box', height: 50,
          background: C.surf1, border: `1.5px solid ${focused ? C.accent : C.line}`,
          borderRadius: 12, color: C.text, fontFamily: 'Outfit, sans-serif', fontSize: 16,
          padding: '0 14px', outline: 'none', transition: 'border-color .15s',
        }}
      />
    </div>
  );
}

export { AuthGate, AuthScreen };
