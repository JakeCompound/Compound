import React from 'react';
import { C, DateWheel, FieldLabel, SelectCard, Stepper, TextInput, TimeWheel, computeAge } from './compound-ui.jsx';
import { ScreenGratitudeBuilder } from './onboarding-screens.jsx';

// settings-screen.jsx — Full settings, accessible via Home cog
// Profile, goals, reminders, equipment, gratitude management, account, danger zone.

function SettingsScreen({ user, set, onClose, onReset, onRecalc }) {
  const [section, setSection] = React.useState(null); // null = main, else section id

  if (section === 'profile') {
    return <SettingsProfileEdit user={user} set={set} onBack={() => setSection(null)} />;
  }
  if (section === 'goals') {
    return <SettingsGoals user={user} set={set} onBack={() => setSection(null)} />;
  }
  if (section === 'reminders') {
    return <SettingsReminders user={user} set={set} onBack={() => setSection(null)} />;
  }
  if (section === 'equipment') {
    return <SettingsEquipment user={user} set={set} onBack={() => setSection(null)} />;
  }
  if (section === 'gratitude') {
    return <SettingsGratitude user={user} set={set} onBack={() => setSection(null)} />;
  }
  if (section === 'integrations') {
    return <SettingsIntegrations onBack={() => setSection(null)} />;
  }
  if (section === 'notifications') {
    return <SettingsNotifications onBack={() => setSection(null)} />;
  }
  if (section === 'about') {
    return <SettingsAbout onBack={() => setSection(null)} />;
  }

  if (section === 'niplimit') {
    return <SettingsNipLimit onBack={() => setSection(null)} />;
  }

  // ── Main settings page ─────────────────────────────────────────────────
  const age = computeAge(user.dob);
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="SETTINGS" onBack={onClose} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 22px 32px' }}>
        {/* Identity card */}
        <div
          style={{
            padding: '16px 16px',
            background: 'linear-gradient(160deg, #1A1612 0%, #100E0B 100%)',
            border: `1px solid ${C.line}`, borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 16, marginTop: 8,
          }}
        >
          <div
            style={{
              width: 54, height: 54, borderRadius: '50%',
              background: C.accent, color: '#0A0A0C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26,
              flexShrink: 0,
            }}
          >
            {(user.name || '?').slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: C.text, textTransform: 'uppercase', letterSpacing: 0.6, lineHeight: 1 }}>
              {user.name || 'Unnamed'}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textMid, letterSpacing: 1.5, marginTop: 6 }}>
              {age || '—'} YRS · {user.weight}KG → {user.weightGoal}KG · {(user.trainingDays || 0)}×/WK
            </div>
          </div>
        </div>

        {/* Sections */}
        <SettingsGroup label="YOU">
          <SettingsRow icon={<IconUser />} label="Profile" hint="Name, date of birth" onClick={() => setSection('profile')} />
          <SettingsRow icon={<IconTarget />} label="Goals" hint={`${user.weight}kg → ${user.weightGoal}kg · ${user.stepGoal} steps · ${user.sleepGoal}h`} onClick={() => setSection('goals')} />
          <SettingsRow icon={<IconBolt />} label="Equipment" hint={user.equipment === 'home' ? 'Home (bodyweight)' : 'Gym / garage'} onClick={() => setSection('equipment')} />
        </SettingsGroup>

        <SettingsGroup label="HABITS">
          <SettingsRow icon={<IconBell />} label="Reminder times" hint={`Check-in ${user.checkInTime} · Weigh-in ${user.weighInTime}`} onClick={() => setSection('reminders')} />
          <SettingsRow icon={<IconSpark />} label="Gratitude library" hint={`${(user.gratitude || []).length} items · 7 categories`} onClick={() => setSection('gratitude')} />
          <SettingsRow icon={<IconBellFilled />} label="Notification preferences" hint="What pings you, what doesn't" onClick={() => setSection('notifications')} />
        </SettingsGroup>

        <SettingsGroup label="NUTRITION">
          <SettingsRow
            icon={<IconTarget />}
            label="Calories & macros"
            hint={(window.loadTargets && window.loadTargets()) ? `${window.loadTargets().calories} kcal · ${window.loadTargets().protein}g protein` : 'Not set — run the calculator'}
            onClick={() => onRecalc && onRecalc()}
          />
          <SettingsRow
            icon={<IconBolt />}
            label="Food tracking"
            hint={user.dietTracking ? 'On · log meals from the + button' : 'Off'}
            value={user.dietTracking ? 'ON' : 'OFF'}
            onClick={() => set({ dietTracking: !user.dietTracking })}
          />
          <SettingsRow
            icon={<IconBell />}
            label="Weekly nip limit"
            hint="The cap the Weekly Nips ring tracks against"
            onClick={() => setSection('niplimit')}
          />
        </SettingsGroup>

        <SettingsGroup label="DATA">
          <SettingsRow
            icon={<IconLink />}
            label="Integrations"
            hint="Apple Health · Samsung Health · Garmin"
            onClick={() => setSection('integrations')}
            badge="NEW"
          />
          <SettingsRow icon={<IconExport />} label="Export data" hint="CSV · all your history" onClick={() => alert('CSV export queued — would email you in production.')} />
        </SettingsGroup>

        <SettingsGroup label="APP">
          <SettingsRow icon={<IconInfo />} label="About COMPOUND" hint="Version 1.0 · changelog" onClick={() => setSection('about')} />
          <SettingsRow icon={<IconStar />} label="Rate the app" onClick={() => alert("Thanks. Five stars only.")} />
        </SettingsGroup>

        {/* Danger zone */}
        <div style={{ marginTop: 22 }}>
          <SettingsGroup label="DANGER ZONE">
            <button
              onClick={() => {
                if (confirm('Restart onboarding? All progress kept.')) onReset();
              }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '14px 14px',
                background: 'transparent', border: `1px dashed rgba(229,86,75,.4)`,
                borderRadius: 12, cursor: 'pointer',
                color: C.danger,
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 600,
                letterSpacing: 1, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ color: C.danger }}>
                <path d="M8 1 V8 M8 11.5 V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
              Restart onboarding
            </button>
          </SettingsGroup>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 2 }}>
          ◆ COMPOUND · v 1.0
        </div>
      </div>
    </div>
  );
}

function SettingsHeader({ title, onBack, right }) {
  return (
    <div style={{ padding: '14px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
      <button
        onClick={onBack}
        style={{ background: 'transparent', border: 0, color: C.textMid, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 2 L4 6 L8 10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2 }}>BACK</span>
      </button>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 2, color: C.text, textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ width: 50, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

function SettingsGroup({ label, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 2.4, marginBottom: 8, paddingLeft: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, hint, onClick, badge, value }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        padding: '12px 14px',
        background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: 8,
          background: C.surf2, color: C.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 500,
            color: C.text, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {label}
          {badge && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: C.accent, background: C.accentSoft, padding: '1px 5px', borderRadius: 3, letterSpacing: 1 }}>
              {badge}
            </span>
          )}
        </div>
        {hint && (
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, lineHeight: 1.4, marginTop: 3 }}>
            {hint}
          </div>
        )}
      </div>
      {value && (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.accent, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {value}
        </span>
      )}
      <svg width="10" height="10" viewBox="0 0 10 10" style={{ color: C.textLow, flexShrink: 0 }}>
        <path d="M3 2 L7 5 L3 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ── Sub-pages ───────────────────────────────────────────────────────────
// Sub-pages are read-only by default; tapping EDIT reveals the inputs, Done
// (the same button) returns to read-only. Values still persist via set(...).
function EditToggle({ editing, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{ background: 'transparent', border: 0, color: C.accent, cursor: 'pointer',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, padding: 4 }}
    >
      {editing ? 'DONE' : 'EDIT'}
    </button>
  );
}

function ReadField({ label, value }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 500, color: C.text, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

function SettingsProfileEdit({ user, set, onBack }) {
  const [editing, setEditing] = React.useState(false);
  const age = window.computeAge ? window.computeAge(user.dob) : null;
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="PROFILE" onBack={onBack} right={<EditToggle editing={editing} onToggle={() => setEditing((e) => !e)} />} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        {editing ? (
          <>
            <FieldLabel>Name</FieldLabel>
            <TextInput value={user.name} onChange={(v) => set({ name: v })} placeholder="Your name" />
            <div style={{ marginTop: 24 }}>
              <FieldLabel>Date of birth</FieldLabel>
              <div style={{ marginTop: 12 }}>
                <DateWheel value={user.dob || '1992-04-15'} onChange={(v) => set({ dob: v })} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <ReadField label="Name" value={user.name || '—'} />
            <ReadField label="Date of birth" value={user.dob ? `${user.dob}${age ? ` · ${age} yrs` : ''}` : '—'} />
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsGoals({ user, set, onBack }) {
  const [editing, setEditing] = React.useState(false);
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="GOALS" onBack={onBack} right={<EditToggle editing={editing} onToggle={() => setEditing((e) => !e)} />} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {editing ? (
            <>
              <div>
                <FieldLabel>Current weight</FieldLabel>
                <Stepper value={user.weight} onChange={(v) => set({ weight: v })} min={30} max={250} step={0.5} unit="kg" />
              </div>
              <div>
                <FieldLabel>Goal weight</FieldLabel>
                <Stepper value={user.weightGoal} onChange={(v) => set({ weightGoal: v })} min={30} max={250} step={0.5} unit="kg" />
              </div>
              <div>
                <FieldLabel>Training days / week</FieldLabel>
                <Stepper value={user.trainingDays} onChange={(v) => set({ trainingDays: v })} min={1} max={7} unit="days" />
              </div>
              <div>
                <FieldLabel>Step goal</FieldLabel>
                <Stepper value={user.stepGoal} onChange={(v) => set({ stepGoal: v })} min={1000} max={30000} step={500} unit="steps" />
              </div>
              <div>
                <FieldLabel>Sleep goal</FieldLabel>
                <Stepper value={user.sleepGoal} onChange={(v) => set({ sleepGoal: v })} min={4} max={12} step={0.5} unit="hours" />
              </div>
            </>
          ) : (
            <>
              <ReadField label="Current weight" value={`${user.weight} kg`} />
              <ReadField label="Goal weight" value={`${user.weightGoal} kg`} />
              <ReadField label="Training days / week" value={`${user.trainingDays || 3} days`} />
              <ReadField label="Step goal" value={`${user.stepGoal} steps`} />
              <ReadField label="Sleep goal" value={`${user.sleepGoal} hours`} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsReminders({ user, set, onBack }) {
  const [editing, setEditing] = React.useState(false);
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="REMINDERS" onBack={onBack} right={<EditToggle editing={editing} onToggle={() => setEditing((e) => !e)} />} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        {editing ? (
          <>
            <FieldLabel>Nightly check-in</FieldLabel>
            <div style={{ marginTop: 12 }}>
              <TimeWheel value={user.checkInTime} onChange={(v) => set({ checkInTime: v })} />
            </div>
            <div style={{ marginTop: 24 }}>
              <FieldLabel>Friday weigh-in window</FieldLabel>
              <div style={{ marginTop: 12 }}>
                <TimeWheel value={user.weighInTime} onChange={(v) => set({ weighInTime: v })} hourMin={5} hourMax={7} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <ReadField label="Nightly check-in" value={user.checkInTime || '—'} />
            <ReadField label="Friday weigh-in window" value={user.weighInTime || '—'} />
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsEquipment({ user, set, onBack }) {
  const [editing, setEditing] = React.useState(false);
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="EQUIPMENT" onBack={onBack} right={<EditToggle editing={editing} onToggle={() => setEditing((e) => !e)} />} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.textMid, margin: '0 0 18px', lineHeight: 1.5 }}>
          Where you train determines what exercises the AI programs.
        </p>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SelectCard active={user.equipment === 'home'} onClick={() => set({ equipment: 'home' })} title="AT HOME" subtitle="Bodyweight only" meta="BW" />
            <SelectCard active={user.equipment === 'gym'} onClick={() => set({ equipment: 'gym' })} title="GYM / GARAGE" subtitle="Reeplex PRO90 + dumbbells ≤ 35kg" meta="FULL" />
          </div>
        ) : (
          <ReadField label="Training location" value={user.equipment === 'home' ? 'At home · bodyweight only' : 'Gym / garage · Reeplex PRO90 + dumbbells ≤ 35kg'} />
        )}
      </div>
    </div>
  );
}

function SettingsGratitude({ user, set, onBack }) {
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="GRATITUDE LIBRARY" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ScreenGratitudeBuilder
          data={user}
          set={set}
          ctx={{ step: 0, total: 0, onSave: null }}
          onNext={onBack}
          onBack={onBack}
        />
      </div>
    </div>
  );
}

function SettingsNotifications({ onBack }) {
  const [prefs, setPrefs] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('compound:notifs') || '{}'); } catch { return {}; }
  });
  const defs = {
    nightly:    { label: 'Nightly check-in',       hint: 'Your set time, every night' },
    weighin:    { label: 'Friday weigh-in',        hint: 'Friday morning, your set window' },
    urgency:    { label: 'Workout urgency',        hint: "When days left = workouts left" },
    sunday:     { label: 'Sunday warning',         hint: "If you're short on workouts" },
    streaks:    { label: 'Streak milestones',      hint: 'Every interval reached' },
    pbs:        { label: 'Personal records',       hint: 'When you hit an estimated PR' },
    comeback:   { label: 'Comeback nudge',         hint: 'After 3+ missed days' },
    report:     { label: 'Monthly report ready',   hint: 'First of every month' },
    deload:     { label: 'Deload recommendation',  hint: 'Every 4 weeks' },
  };
  const set = (k, v) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    localStorage.setItem('compound:notifs', JSON.stringify(next));
  };
  const isOn = (k) => prefs[k] !== false; // default ON
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="NOTIFICATIONS" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.textMid, margin: '0 0 18px', lineHeight: 1.5 }}>
          We send the minimum. Each one earns its place.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(defs).map(([k, d]) => (
            <NotifRow key={k} label={d.label} hint={d.hint} on={isOn(k)} onChange={(v) => set(k, v)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotifRow({ label, hint, on, onChange }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.text }}>{label}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: C.textLow, letterSpacing: 1, marginTop: 2 }}>
          {hint}
        </div>
      </div>
      <button
        onClick={() => onChange(!on)}
        style={{
          width: 42, height: 24, borderRadius: 12,
          background: on ? C.accent : C.surf3,
          border: 0, cursor: 'pointer', position: 'relative',
          transition: 'background .15s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute', top: 3, left: on ? 22 : 3,
            width: 18, height: 18, borderRadius: 9,
            background: '#0A0A0C', transition: 'left .15s',
          }}
        />
      </button>
    </div>
  );
}

function SettingsIntegrations({ onBack }) {
  const integrations = [
    { id: 'apple', name: 'Apple Health', desc: 'Steps, sleep, heart rate, workouts', status: 'soon', glyph: '' },
    { id: 'samsung', name: 'Samsung Health', desc: 'Steps, sleep, heart rate', status: 'soon', glyph: '' },
    { id: 'garmin', name: 'Garmin Connect', desc: 'Workouts, HRV, recovery', status: 'soon', glyph: '' },
    { id: 'whoop', name: 'WHOOP', desc: 'Recovery, strain, sleep stages', status: 'soon', glyph: '' },
    { id: 'oura', name: 'Oura Ring', desc: 'Sleep, readiness, HRV', status: 'soon', glyph: '' },
  ];
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="INTEGRATIONS" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.textMid, margin: '0 0 18px', lineHeight: 1.5 }}>
          Wearable sync arrives with the native app — it’ll pull steps, sleep & recovery so check-ins take 30 seconds. For now these are entered in your nightly check-in.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {integrations.map((i) => <IntegrationRow key={i.id} integration={i} />)}
        </div>
      </div>
    </div>
  );
}

function IntegrationRow({ integration }) {
  const tone = integration.status === 'connected' ? { bg: C.accentSoft, border: C.accentDim, color: C.accent, label: 'CONNECTED' }
             : integration.status === 'available' ? { bg: C.surf2, border: C.line, color: C.text, label: 'CONNECT' }
             :                                       { bg: C.surf1, border: C.line, color: C.textLow, label: 'COMING SOON' };
  return (
    <div
      style={{
        padding: '14px 14px',
        background: integration.status === 'connected' ? tone.bg : C.surf1,
        border: `1px solid ${tone.border}`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div
        style={{
          width: 38, height: 38, borderRadius: 10,
          background: C.surf2, color: C.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 3 L13 8 L18 9 L14 13 L15 18 L10 15 L5 18 L6 13 L2 9 L7 8 Z" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {integration.name}
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: C.textMid, marginTop: 2 }}>
          {integration.desc}
        </div>
      </div>
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1.4,
          color: tone.color, padding: '4px 8px', borderRadius: 4,
          background: integration.status === 'connected' ? 'transparent' : C.surf2,
          flexShrink: 0,
        }}
      >
        {tone.label}
      </span>
    </div>
  );
}

function SettingsAbout({ onBack }) {
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="ABOUT" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 22px 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.accent, letterSpacing: 3, marginBottom: 8 }}>
          ◆ COMPOUND
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textLow, letterSpacing: 2, marginBottom: 24 }}>
          v 1.0 · MAY 2026
        </div>
        <h2
          style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 30,
            letterSpacing: 0.5, color: C.text, margin: '0 0 14px', textTransform: 'uppercase', lineHeight: 1,
          }}
        >
          CONSISTENCY<br /><span style={{ color: C.accent }}>OVER PERFECTION.</span>
        </h2>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: C.textMid, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
          A life-tracking app for people who want quiet, daily wins across health, mind, relationships, and spirit. Built to be used for years, not weeks.
        </p>
      </div>
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────
function IconUser() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" /><path d="M2.5 14 C2.5 11 5 9 8 9 C11 9 13.5 11 13.5 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
function IconTarget() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>;
}
function IconBolt() {
  return <svg width="16" height="16" viewBox="0 0 16 16"><path d="M9 1 L3 9 L7 9 L6 15 L13 7 L9 7 Z" fill="currentColor" /></svg>;
}
function IconBell() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2 C6 2 4.5 3.5 4.5 5.5 V8 L3 10 H13 L11.5 8 V5.5 C11.5 3.5 10 2 8 2 Z M6.5 11 C6.5 12 7.2 13 8 13 C8.8 13 9.5 12 9.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
}
function IconBellFilled() {
  return <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 2 C6 2 4.5 3.5 4.5 5.5 V8 L3 10 H13 L11.5 8 V5.5 C11.5 3.5 10 2 8 2 Z" fill="currentColor" /><path d="M6.5 11 C6.5 12 7.2 13 8 13 C8.8 13 9.5 12 9.5 11" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>;
}
function IconSpark() {
  return <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 1 L9.5 6 L14.5 7.5 L9.5 9 L8 14 L6.5 9 L1.5 7.5 L6.5 6 Z" fill="currentColor" /></svg>;
}
function IconLink() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 10 L10 6 M5 11 C3.5 11 2.5 10 2.5 8.5 C2.5 7 4 5.5 5.5 5.5 H7 M11 5.5 H8.5 C7 5.5 6 7 6 8 C6 8.5 6 9.5 7 10.5 M10 12 C11.5 12 12.5 11 12.5 9.5 C12.5 8 11 6.5 9.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
function IconExport() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 11 V1 M5 4 L8 1 L11 4 M2 11 V13 C2 14 2.5 14.5 3.5 14.5 H12.5 C13.5 14.5 14 14 14 13 V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function IconInfo() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" /><line x1="8" y1="7" x2="8" y2="11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="8" cy="5" r="0.8" fill="currentColor" /></svg>;
}
function IconStar() {
  return <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 1.5 L9.8 5.7 L14.3 6 L10.9 9 L11.9 13.4 L8 11 L4.1 13.4 L5.1 9 L1.7 6 L6.2 5.7 Z" fill="currentColor" /></svg>;
}

function SettingsNipLimit({ onBack }) {
  const [v, setV] = React.useState(() => { try { return parseInt(localStorage.getItem('compound:nipLimit'), 10) || 55; } catch (e) { return 55; } });
  const [editing, setEditing] = React.useState(false);
  const save = (n) => { setV(n); try { localStorage.setItem('compound:nipLimit', String(n)); } catch (e) {} };
  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <SettingsHeader title="WEEKLY NIP LIMIT" onBack={onBack} right={<EditToggle editing={editing} onToggle={() => setEditing((e) => !e)} />} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 32px' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13.5, color: C.textMid, margin: '0 0 18px', lineHeight: 1.5 }}>
          The cap the Weekly Nips ring tracks against. Set it here only — taper 5–10 at a time, no hero cuts. The ring goes red once you pass it.
        </p>
        {editing ? (
          <>
            <FieldLabel>Nips per week</FieldLabel>
            <div style={{ marginTop: 12 }}>
              <Stepper value={v} onChange={save} min={0} max={150} step={1} unit="nips / week" large />
            </div>
          </>
        ) : (
          <ReadField label="Nips per week" value={`${v} nips / week`} />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SettingsScreen });

export { IconBell, IconBellFilled, IconBolt, IconExport, IconInfo, IconLink, IconSpark, IconStar, IconTarget, IconUser, IntegrationRow, NotifRow, SettingsAbout, SettingsEquipment, SettingsGoals, SettingsGratitude, SettingsGroup, SettingsHeader, SettingsIntegrations, SettingsNipLimit, SettingsNotifications, SettingsProfileEdit, SettingsReminders, SettingsRow, SettingsScreen };
