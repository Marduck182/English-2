function TabBtn({ onClick, color, icon, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 5, color, transition: 'color .2s',
    }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'Nunito' }}>{label}</span>
    </button>
  );
}

export default function TabBar({ tab, setTab }) {
  const c = (k) => tab === k ? 'var(--accent)' : 'var(--dim)';
  return (
    <div style={{
      flex: '0 0 auto', height: 74, display: 'flex', alignItems: 'stretch',
      padding: '0 6px 6px', background: 'var(--bg2)', borderTop: '1px solid var(--border)',
    }}>
      <TabBtn onClick={() => setTab('learn')} color={c('learn')} label="Aprender" icon={
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="13" height="16" rx="2.5" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 3h10a2.5 2.5 0 012.5 2.5V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      }/>
      <TabBtn onClick={() => setTab('speak')} color={c('speak')} label="Hablar" icon={
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      }/>
      <TabBtn onClick={() => setTab('songs')} color={c('songs')} label="Canciones" icon={
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
          <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
          <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      }/>
      <TabBtn onClick={() => setTab('settings')} color={c('settings')} label="Ajustes" icon={
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 2v3m0 14v3M4.2 4.2l2.1 2.1m11.4 11.4l2.1 2.1M2 12h3m14 0h3M4.2 19.8l2.1-2.1m11.4-11.4l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      }/>
    </div>
  );
}
