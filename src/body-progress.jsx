import React from 'react';
import { C } from './compound-ui.jsx';
import { SectionLabel } from './home-components.jsx';

// body-progress.jsx — Body measurements & progress photos for Reports tab

const BODY_METRICS = [
  { key: 'chest',  label: 'CHEST',  unit: 'cm' },
  { key: 'waist',  label: 'WAIST',  unit: 'cm' },
  { key: 'arm',    label: 'ARM',    unit: 'cm' },
  { key: 'thigh',  label: 'THIGH',  unit: 'cm' },
  { key: 'bf',     label: 'BODY FAT', unit: '%' },
];

const MEASUREMENTS_KEY = 'compound:measurements';
function loadMeasurements() {
  try { return JSON.parse(localStorage.getItem(MEASUREMENTS_KEY) || '[]'); } catch (e) { return []; }
}
function saveMeasurements(list) {
  try { localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(list)); } catch (e) {}
}
// Derive {current, history, delta} for a metric from real logged entries.
function deriveMetric(entries, key) {
  const vals = entries.map((e) => e.values[key]).filter((v) => typeof v === 'number');
  if (!vals.length) return null;
  return { current: vals[vals.length - 1], history: vals, delta: +(vals[vals.length - 1] - vals[0]).toFixed(1) };
}

function BodyMeasurementsCard() {
  const [open, setOpen] = React.useState(false);
  const [entries, setEntries] = React.useState(() => loadMeasurements());
  const hasData = entries.length > 0;
  return (
    <div>
      <SectionLabel meta={hasData ? `${entries.length} LOGGED` : 'NOT STARTED'}>BODY MEASUREMENTS</SectionLabel>
      <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
        {hasData ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {BODY_METRICS.map((m) => {
              const d = deriveMetric(entries, m.key);
              return d ? <MeasurementMini key={m.key} metric={m} data={d} /> : null;
            })}
          </div>
        ) : (
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: '2px 0 12px', textAlign: 'center' }}>
            No measurements yet. Log your first set to start tracking chest, waist, arm, thigh and body fat over time.
          </p>
        )}
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '100%', padding: '10px 0',
            background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 10,
            color: C.accent, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
            letterSpacing: 1.5, cursor: 'pointer', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 2 V10 M2 6 H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          {hasData ? "LOG TODAY'S MEASUREMENTS" : 'LOG FIRST MEASUREMENTS'}
        </button>
      </div>
      {open && (
        <LogMeasurementsModal
          entries={entries}
          onClose={() => setOpen(false)}
          onSave={(vals) => {
            const next = [...entries, { date: (window.isoDate ? window.isoDate(new Date()) : new Date().toISOString().slice(0,10)), values: vals }];
            saveMeasurements(next);
            setEntries(next);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MeasurementMini({ metric, data }) {
  const positive = (metric.key === 'waist' || metric.key === 'bf') ? data.delta < 0 : data.delta > 0;
  const deltaColor = data.delta === 0 ? C.textMid : positive ? C.success : C.danger;
  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'rgba(0,0,0,.22)',
        border: `1px solid ${C.line}`,
        borderRadius: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.textLow, letterSpacing: 1.5 }}>
          {metric.label}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: deltaColor, letterSpacing: 1 }}>
          {data.delta > 0 ? '+' : ''}{data.delta}{metric.unit}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums' }}>
          {data.current}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textMid }}>
          {metric.unit}
        </span>
      </div>
      <MiniSpark history={data.history} positive={positive} />
    </div>
  );
}

function MiniSpark({ history, positive }) {
  const w = 100, h = 16;
  if (!history || history.length < 2) {
    return <div style={{ height: 16, marginTop: 4 }} />;
  }
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = Math.max(0.1, max - min);
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 16, marginTop: 4 }}>
      <path d={path} fill="none" stroke={positive ? C.accent : C.textLow} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LogMeasurementsModal({ onClose, onSave, entries }) {
  const last = entries && entries.length ? entries[entries.length - 1].values : {};
  const [values, setValues] = React.useState(() => {
    const out = {};
    BODY_METRICS.forEach((m) => { out[m.key] = last[m.key] != null ? last[m.key] : ''; });
    return out;
  });
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));
  const commit = () => {
    const vals = {};
    BODY_METRICS.forEach((m) => { if (values[m.key] !== '' && values[m.key] != null) vals[m.key] = Number(values[m.key]); });
    onSave(vals);
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 220,
        background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', background: C.bg,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '20px 22px 22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} />
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 8 }}>
          NEW MEASUREMENT
        </div>
        <h3
          style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26,
            lineHeight: 1, letterSpacing: 0.5, color: C.text, margin: 0, textTransform: 'uppercase',
          }}
        >
          MORNING<br /><span style={{ color: C.accent }}>MEASUREMENTS.</span>
        </h3>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: '10px 0 14px' }}>
          Take these under consistent conditions — same time, same state, same tape position.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {BODY_METRICS.map((m) => (
            <div
              key={m.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 10,
              }}
            >
              <span style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 15, color: C.text, letterSpacing: 1, textTransform: 'uppercase' }}>
                {m.label}
              </span>
              <input
                type="number"
                value={values[m.key]}
                onChange={(e) => set(m.key, Number(e.target.value))}
                style={{
                  width: 70,
                  background: C.surf2, border: `1px solid ${C.line}`,
                  borderRadius: 6, padding: '6px 10px',
                  color: C.accent, fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600,
                  outline: 0, textAlign: 'right',
                }}
              />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textMid, letterSpacing: 1, width: 20 }}>
                {m.unit}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 48,
              background: C.surf2, border: `1px solid ${C.line}`, borderRadius: 12,
              color: C.text, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 600,
              letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={commit}
            style={{
              flex: 2, height: 48,
              background: C.accent, border: 0, borderRadius: 12, color: '#0A0A0C',
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700,
              letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Progress photos ─────────────────────────────────────────────────────
// Stored locally as downscaled JPEG data URLs (keeps localStorage small). Not
// cloud-synced yet — that waits for Storage upload in a later pass.
const PHOTOS_KEY = 'compound:photos'; // { [label]: dataURL }
function loadPhotos() { try { return JSON.parse(localStorage.getItem(PHOTOS_KEY) || '{}'); } catch (e) { return {}; } }
function savePhoto(label, dataURL) { const all = loadPhotos(); all[label] = dataURL; try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(all)); } catch (e) {} }
function removePhoto(label) { const all = loadPhotos(); delete all[label]; try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(all)); } catch (e) {} }

// Read a picked/taken image and downscale it so four photos don't blow the
// localStorage quota.
function fileToResizedDataURL(file, maxDim = 1000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL('image/jpeg', 0.82)); } catch (e) { resolve(reader.result); }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PHOTO_LABELS = ['START', '+4 WK', '+8 WK', '+12 WK'];

function ProgressPhotosCard() {
  const [photos, setPhotos] = React.useState(loadPhotos);
  const refresh = () => setPhotos(loadPhotos());
  const count = PHOTO_LABELS.filter((l) => photos[l]).length;
  return (
    <div>
      <SectionLabel meta={count ? `${count} / 4` : 'NOT STARTED'}>PROGRESS PHOTOS</SectionLabel>
      <div style={{ background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {PHOTO_LABELS.map((label) => (
            <PhotoSlot
              key={label}
              label={label}
              url={photos[label] || null}
              onSet={(dataURL) => { savePhoto(label, dataURL); refresh(); }}
              onRemove={() => { removePhoto(label); refresh(); }}
            />
          ))}
        </div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, color: C.textMid, lineHeight: 1.5, margin: '12px 0 0' }}>
          Add your first photo, then one a month — same light, same pose, same time of day. The most honest data your phone can collect.
        </p>
      </div>
    </div>
  );
}

function PhotoSlot({ label, url, onSet, onRemove }) {
  const [sheet, setSheet] = React.useState(false);
  const camRef = React.useRef(null);
  const libRef = React.useRef(null);
  const handleFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = ''; // let the same file be re-picked later
    if (!f) return;
    try { const dataURL = await fileToResizedDataURL(f); onSet(dataURL); } catch (err) {}
    setSheet(false);
  };
  return (
    <>
      <button
        onClick={() => setSheet(true)}
        style={{
          aspectRatio: '3 / 4', position: 'relative', overflow: 'hidden',
          background: url ? `center/cover no-repeat url(${url})` : C.surf2,
          border: `1px ${url ? 'solid' : 'dashed'} ${url ? C.accentDim : C.lineStrong}`, borderRadius: 8,
          cursor: 'pointer', color: C.accent,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 4,
        }}
      >
        {!url && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2.5" y="5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth="1.4" />
            <rect x="7" y="3" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        )}
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: 1, textAlign: 'center', lineHeight: 1.2,
            color: url ? '#fff' : C.accent,
            ...(url ? { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 0', background: 'rgba(0,0,0,.55)' } : {}),
          }}
        >
          {label}
        </span>
      </button>
      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      <input ref={libRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {sheet && (
        <PhotoChooser
          label={label}
          hasPhoto={!!url}
          onCamera={() => camRef.current && camRef.current.click()}
          onLibrary={() => libRef.current && libRef.current.click()}
          onRemove={() => { onRemove(); setSheet(false); }}
          onClose={() => setSheet(false)}
        />
      )}
    </>
  );
}

// Action sheet: take a photo (native camera) vs choose from library.
function PhotoChooser({ label, hasPhoto, onCamera, onLibrary, onRemove, onClose }) {
  const row = (text, onClick, danger) => (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
        background: C.surf1, border: `1px solid ${C.line}`, borderRadius: 12,
        color: danger ? C.danger : C.text, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
        fontSize: 16, letterSpacing: 0.6, textTransform: 'uppercase',
      }}
    >
      {text}
    </button>
  );
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} /></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.accent, letterSpacing: 2.4, marginBottom: 12 }}>PROGRESS PHOTO · {label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {row('📸  Take a photo', onCamera)}
          {row('🖼️  Choose from library', onLibrary)}
          {hasPhoto && row('Remove photo', onRemove, true)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  BodyMeasurementsCard, ProgressPhotosCard, BODY_METRICS,
  loadMeasurements, saveMeasurements, deriveMetric,
});

export { BODY_METRICS, BodyMeasurementsCard, LogMeasurementsModal, MEASUREMENTS_KEY, MeasurementMini, MiniSpark, PhotoSlot, ProgressPhotosCard, deriveMetric, loadMeasurements, saveMeasurements };
