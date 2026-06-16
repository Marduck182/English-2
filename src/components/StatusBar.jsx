export default function StatusBar() {
  return (
    <div style={{
      flex: '0 0 auto', height: 46,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 26px', color: 'var(--text)', fontWeight: 800, fontSize: 15, letterSpacing: '0.02em',
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
          <rect x="0" y="8" width="3" height="5" rx="1" fill="currentColor"/>
          <rect x="5" y="5" width="3" height="8" rx="1" fill="currentColor"/>
          <rect x="10" y="2" width="3" height="11" rx="1" fill="currentColor"/>
          <rect x="15" y="0" width="3" height="13" rx="1" fill="currentColor" opacity="0.4"/>
        </svg>
        <svg width="22" height="13" viewBox="0 0 22 13" fill="none">
          <rect x="0.5" y="0.5" width="18" height="12" rx="3.5" stroke="currentColor" opacity="0.5"/>
          <rect x="2" y="2" width="13" height="9" rx="2" fill="currentColor"/>
          <rect x="20" y="4" width="1.6" height="5" rx="0.8" fill="currentColor" opacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}
