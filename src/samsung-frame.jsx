// samsung-frame.jsx — Custom Samsung Galaxy S24 Ultra dark frame
// Premium boxy bezels, center punch-hole camera, gesture nav.

function SamsungFrame({ children, width = 412, height = 920 }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 44,
        padding: 5,
        background: 'linear-gradient(150deg,#2a2a2e 0%,#0c0c0e 38%,#1a1a1d 70%,#080809 100%)',
        boxShadow:
          '0 40px 120px rgba(0,0,0,.55), 0 0 0 .5px rgba(255,255,255,.06) inset, 0 1px 0 rgba(255,255,255,.08) inset',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Side button cues */}
      <div style={{ position: 'absolute', left: -2, top: 168, width: 3, height: 36, background: '#1a1a1d', borderRadius: 2 }} />
      <div style={{ position: 'absolute', right: -2, top: 150, width: 3, height: 60, background: '#1a1a1d', borderRadius: 2 }} />
      <div style={{ position: 'absolute', right: -2, top: 222, width: 3, height: 96, background: '#1a1a1d', borderRadius: 2 }} />

      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 39,
          overflow: 'hidden',
          background: '#070709',
          position: 'relative',
          boxShadow: '0 0 0 1px rgba(0,0,0,.6) inset',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Status bar */}
        <SamsungStatusBar />
        {/* Screen content */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {children}
        </div>
        {/* Gesture pill */}
        <SamsungGesturePill />
        {/* Camera punch-hole on top */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 12,
            transform: 'translateX(-50%)',
            width: 11,
            height: 11,
            borderRadius: '50%',
            background: '#000',
            boxShadow: '0 0 0 1.5px #0a0a0c, 0 0 6px rgba(0,0,0,.8) inset',
            zIndex: 50,
          }}
        />
      </div>
    </div>
  );
}

function SamsungStatusBar() {
  return (
    <div
      style={{
        height: 38,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px 0 26px',
        color: '#F2F1EC',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 0.2,
        position: 'relative',
        zIndex: 5,
      }}
    >
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* signal */}
        <svg width="15" height="11" viewBox="0 0 15 11">
          <rect x="0" y="8" width="2" height="3" rx=".4" fill="#F2F1EC" />
          <rect x="3.5" y="6" width="2" height="5" rx=".4" fill="#F2F1EC" />
          <rect x="7" y="3" width="2" height="8" rx=".4" fill="#F2F1EC" />
          <rect x="10.5" y="0" width="2" height="11" rx=".4" fill="#F2F1EC" />
        </svg>
        {/* wifi */}
        <svg width="14" height="11" viewBox="0 0 14 11" style={{ marginLeft: 2 }}>
          <path d="M7 11 L9.6 8.2 A3.8 3.8 0 0 0 4.4 8.2 Z" fill="#F2F1EC" />
          <path
            d="M1.2 4.6 A8 8 0 0 1 12.8 4.6"
            stroke="#F2F1EC"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M3.5 7 A5 5 0 0 1 10.5 7"
            stroke="#F2F1EC"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        {/* battery */}
        <div
          style={{
            marginLeft: 3,
            width: 24,
            height: 12,
            border: '1.2px solid #F2F1EC',
            borderRadius: 3,
            position: 'relative',
            padding: 1.4,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ width: '78%', height: '100%', background: '#F2F1EC', borderRadius: 1 }} />
          <div
            style={{
              position: 'absolute',
              right: -3,
              top: 3,
              width: 2,
              height: 4,
              background: '#F2F1EC',
              borderRadius: '0 1px 1px 0',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SamsungGesturePill() {
  return (
    <div
      style={{
        height: 22,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div
        style={{
          width: 120,
          height: 4,
          borderRadius: 2,
          background: 'rgba(242,241,236,.55)',
        }}
      />
    </div>
  );
}

Object.assign(window, { SamsungFrame });

export { SamsungFrame, SamsungGesturePill, SamsungStatusBar };
