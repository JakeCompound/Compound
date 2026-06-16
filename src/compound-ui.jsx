import React from 'react';

// compound-ui.jsx — Shared primitives for COMPOUND
// Buttons, inputs, headers, star ratings, segmented pills, steppers, chips,
// progress dots — all dark-premium, amber-accented.

const C = {
  bg: '#070709',
  surf1: '#0E0E11',
  surf2: '#14141A',
  surf3: '#1C1C22',
  line: 'rgba(255,255,255,.07)',
  lineStrong: 'rgba(255,255,255,.14)',
  text: '#F2F1EC',
  textMid: 'rgba(242,241,236,.62)',
  textLow: 'rgba(242,241,236,.38)',
  accent: '#F2A30F',
  accentDim: 'rgba(242,163,15,.16)',
  accentSoft: 'rgba(242,163,15,.08)',
  success: '#5AC57E',
  danger: '#E5564B',
};

// Grain texture overlay — subtle film noise on dark surfaces
function GrainOverlay({ opacity = 0.06 }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        mixBlendMode: 'overlay',
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        backgroundSize: '160px 160px',
        zIndex: 100,
      }}
    />
  );
}

// Coach-style 2-line headline with mono step + amber line
function ScreenHead({ step, total, title, accentLine, sub, onSkip, skipLabel = 'Skip' }) {
  return (
    <div style={{ padding: '8px 24px 4px' }}>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: 2,
          color: C.accent,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>
          STEP {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              background: 'transparent',
              border: 0,
              color: C.textLow,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: 2,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            {skipLabel.toUpperCase()} →
          </button>
        )}
      </div>
      <h1
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: 38,
          lineHeight: 0.98,
          letterSpacing: 0.5,
          color: C.text,
          margin: 0,
          textTransform: 'uppercase',
        }}
      >
        {title}
        {accentLine && (
          <>
            <br />
            <span style={{ color: C.accent }}>{accentLine}</span>
          </>
        )}
      </h1>
      {sub && (
        <p
          style={{
            fontFamily: 'Outfit, sans-serif',
            color: C.textMid,
            fontSize: 14,
            lineHeight: 1.45,
            margin: '14px 0 0',
            maxWidth: 320,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// Progress dots/segments at top
function StepBar({ current, total }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        padding: '12px 24px 0',
        height: 14,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 2,
            borderRadius: 1,
            background: i < current ? C.accent : 'rgba(255,255,255,.10)',
            transition: 'background .25s',
          }}
        />
      ))}
    </div>
  );
}

// Primary CTA — full width, amber, scale 0.97 on press
function PrimaryButton({ children, onClick, disabled, icon }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
      style={{
        width: '100%',
        height: 56,
        border: 0,
        borderRadius: 12,
        background: disabled ? 'rgba(242,163,15,.28)' : C.accent,
        color: disabled ? 'rgba(0,0,0,.45)' : '#0A0A0C',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: 2,
        textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform .08s ease, background .15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        boxShadow: disabled ? 'none' : '0 8px 24px rgba(242,163,15,.22), 0 1px 0 rgba(255,255,255,.15) inset',
      }}
    >
      <span>{children}</span>
      {icon !== false && (
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M1 6 L13 6 M9 1.5 L13.5 6 L9 10.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function GhostButton({ children, onClick }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        height: 48,
        padding: '0 18px',
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        background: 'transparent',
        color: C.text,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform .08s',
      }}
    >
      {children}
    </button>
  );
}

// Selection card — used for radio-style picks (equipment, fitness level)
function SelectCard({ active, onClick, title, subtitle, meta, glyph }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '18px 18px',
        border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
        background: active ? C.accentSoft : C.surf1,
        borderRadius: 14,
        cursor: 'pointer',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform .08s, background .15s, border-color .15s',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {glyph && (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: active ? C.accentDim : C.surf2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: active ? C.accent : C.text,
            flexShrink: 0,
          }}
        >
          {glyph}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: active ? C.accent : C.text,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 13,
              color: C.textMid,
              marginTop: 4,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {meta && (
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: active ? C.accent : C.textLow,
            letterSpacing: 1,
          }}
        >
          {meta}
        </div>
      )}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: active ? `2px solid ${C.accent}` : `1.5px solid ${C.lineStrong}`,
          background: active ? C.accent : 'transparent',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {active && (
          <svg viewBox="0 0 12 12" style={{ position: 'absolute', inset: 0 }}>
            <path d="M3 6.2 L5.2 8.4 L9 4" stroke="#0A0A0C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

// Multi-select chip (muscle groups, gratitude items)
function MultiChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px',
        borderRadius: 999,
        border: active ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
        background: active ? C.accentDim : C.surf1,
        color: active ? C.accent : C.text,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all .12s',
      }}
    >
      {children}
    </button>
  );
}

// Numeric stepper — value left, − +  right; supports unit suffix
function Stepper({ value, onChange, min = 0, max = 99, step = 1, unit, large = false }) {
  const fontSize = large ? 56 : 36;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: large ? '24px 22px' : '14px 18px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            fontSize,
            color: C.text,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              color: C.textMid,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {unit}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <StepperBtn onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min}>−</StepperBtn>
        <StepperBtn onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max}>+</StepperBtn>
      </div>
    </div>
  );
}

function StepperBtn({ children, onClick, disabled }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        border: `1px solid ${C.line}`,
        background: disabled ? C.surf2 : C.surf3,
        color: disabled ? C.textLow : C.text,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: 22,
        cursor: disabled ? 'default' : 'pointer',
        transform: pressed ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform .08s, background .12s',
      }}
    >
      {children}
    </button>
  );
}

// Text input — dark, focus underlines amber
function TextInput({ value, onChange, placeholder, type = 'text', autoFocus, suffix, maxLength, inputMode }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={{
        position: 'relative',
        borderBottom: `1.5px solid ${focused ? C.accent : C.lineStrong}`,
        display: 'flex',
        alignItems: 'baseline',
        transition: 'border-color .15s',
        padding: '14px 0',
      }}
    >
      <input
        autoFocus={autoFocus}
        type={type}
        inputMode={inputMode}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 0,
          outline: 0,
          color: C.text,
          fontFamily: type === 'number' ? 'JetBrains Mono, monospace' : 'Outfit, sans-serif',
          fontSize: 24,
          fontWeight: 500,
          padding: 0,
        }}
      />
      {suffix && (
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            color: C.textMid,
            fontSize: 13,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginLeft: 8,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

// Label above a field
function FieldLabel({ children, info }) {
  return (
    <div
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: 2.4,
        color: C.textLow,
        textTransform: 'uppercase',
        marginBottom: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span>{children}</span>
      {info && <InfoDot text={info} />}
    </div>
  );
}

function InfoDot({ text }) {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setShow((s) => !s)}
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: `1px solid ${C.textLow}`,
          background: 'transparent',
          color: C.textLow,
          fontSize: 9,
          fontFamily: 'JetBrains Mono, monospace',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        i
      </button>
      {show && (
        <div
          onClick={() => setShow(false)}
          style={{
            position: 'absolute',
            top: 22,
            left: -8,
            zIndex: 10,
            width: 240,
            padding: 12,
            background: C.surf3,
            border: `1px solid ${C.lineStrong}`,
            borderRadius: 10,
            color: C.textMid,
            fontFamily: 'Outfit, sans-serif',
            fontSize: 12,
            lineHeight: 1.45,
            textTransform: 'none',
            letterSpacing: 0,
            boxShadow: '0 10px 30px rgba(0,0,0,.6)',
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}

// Star rating row (1-5)
function StarRating({ value, onChange, size = 36 }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              flex: 1,
              height: size + 12,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" style={{ transition: 'transform .12s', transform: filled ? 'scale(1.08)' : 'scale(1)' }}>
              <path
                d="M12 2.5 L14.7 9.2 L21.8 9.8 L16.4 14.4 L18.1 21.3 L12 17.4 L5.9 21.3 L7.6 14.4 L2.2 9.8 L9.3 9.2 Z"
                fill={filled ? C.accent : 'transparent'}
                stroke={filled ? C.accent : C.lineStrong}
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

// Time picker — hour + minute scroll, am/pm
function TimeWheel({ value, onChange, hourMin = 0, hourMax = 23 }) {
  const [h, m] = value.split(':').map(Number);
  const set = (hh, mm) => onChange(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  const period = h >= 12 ? 'PM' : 'AM';
  const dispH = h % 12 || 12;
  const minutes = [0, 15, 30, 45];
  const togglePeriod = () => {
    if (hourMax < 12) return;
    set(h >= 12 ? h - 12 : h + 12, m);
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '22px 14px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
      }}
    >
      <Wheel
        value={dispH}
        items={Array.from({ length: hourMax - hourMin + 1 }, (_, i) => i + hourMin).map((x) => x % 12 || 12).filter((v, i, a) => a.indexOf(v) === i)}
        onChange={(newDisp) => {
          const next = period === 'PM' ? (newDisp === 12 ? 12 : newDisp + 12) : (newDisp === 12 ? 0 : newDisp);
          if (next >= hourMin && next <= hourMax) set(next, m);
        }}
      />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 44, color: C.textLow, fontWeight: 300 }}>:</span>
      <Wheel value={m} items={minutes} onChange={(newM) => set(h, newM)} pad />
      <button
        onClick={togglePeriod}
        disabled={hourMax < 12}
        style={{
          marginLeft: 10,
          padding: '10px 14px',
          border: `1px solid ${C.line}`,
          background: C.surf2,
          color: C.accent,
          borderRadius: 10,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 1.5,
          cursor: hourMax < 12 ? 'default' : 'pointer',
          opacity: hourMax < 12 ? 0.6 : 1,
        }}
      >
        {period}
      </button>
    </div>
  );
}

// ── Date wheel — DD / MMM / YYYY ──────────────────────────────────────────
const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function daysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

function computeAge(dobStr) {
  if (!dobStr) return null;
  const [y, m, d] = dobStr.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

function DateWheel({ value, onChange, minYear, maxYear }) {
  const [y, m, d] = value.split('-').map(Number);
  const set = (yy, mm, dd) => {
    const maxD = daysInMonth(yy, mm - 1);
    const clampedD = Math.min(dd, maxD);
    onChange(`${yy}-${String(mm).padStart(2,'0')}-${String(clampedD).padStart(2,'0')}`);
  };
  const thisYear = new Date().getFullYear();
  const yMin = minYear ?? thisYear - 99;
  const yMax = maxYear ?? thisYear - 13;
  const yearItems = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i);
  const monthItems = Array.from({ length: 12 }, (_, i) => i + 1);
  const dayItems = Array.from({ length: daysInMonth(y, m - 1) }, (_, i) => i + 1);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '22px 14px',
        background: C.surf1,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
      }}
    >
      <Wheel value={d} items={dayItems} onChange={(nd) => set(y, m, nd)} pad />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, color: C.textLow, fontWeight: 300, padding: '0 2px' }}>·</span>
      <Wheel value={m} items={monthItems} onChange={(nm) => set(y, nm, d)} display={(v) => MONTHS_SHORT[v - 1]} minWidth={88} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, color: C.textLow, fontWeight: 300, padding: '0 2px' }}>·</span>
      <Wheel value={y} items={yearItems} onChange={(ny) => set(ny, m, d)} minWidth={88} />
    </div>
  );
}

function Wheel({ value, items, onChange, pad, display, minWidth = 60 }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <button
        onClick={() => {
          const i = items.indexOf(value);
          if (i > 0) onChange(items[i - 1]);
        }}
        style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', padding: 4 }}
      >
        <svg width="20" height="10" viewBox="0 0 20 10"><path d="M3 7 L10 2 L17 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
      </button>
      <div style={{ fontSize: 38, fontWeight: 600, color: C.accent, lineHeight: 1.1, minWidth, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
        {display ? display(value) : (pad ? String(value).padStart(2, '0') : value)}
      </div>
      <button
        onClick={() => {
          const i = items.indexOf(value);
          if (i < items.length - 1) onChange(items[i + 1]);
        }}
        style={{ background: 'transparent', border: 0, color: C.textLow, cursor: 'pointer', padding: 4 }}
      >
        <svg width="20" height="10" viewBox="0 0 20 10"><path d="M3 3 L10 8 L17 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

// Save & exit affordance — top-right pill
function SaveExitButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 0,
        color: C.textLow,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
        cursor: 'pointer',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 11 11">
        <path d="M2 2 L9 9 M9 2 L2 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      Save & Exit
    </button>
  );
}

Object.assign(window, {
  C,
  GrainOverlay,
  ScreenHead,
  StepBar,
  PrimaryButton,
  GhostButton,
  SelectCard,
  MultiChip,
  Stepper,
  StepperBtn,
  TextInput,
  FieldLabel,
  InfoDot,
  StarRating,
  TimeWheel,
  DateWheel,
  computeAge,
  Wheel,
  SaveExitButton,
});

export { C, DateWheel, FieldLabel, GhostButton, GrainOverlay, InfoDot, MONTHS_SHORT, MultiChip, PrimaryButton, SaveExitButton, ScreenHead, SelectCard, StarRating, StepBar, Stepper, StepperBtn, TextInput, TimeWheel, Wheel, computeAge, daysInMonth };
