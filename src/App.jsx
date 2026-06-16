import { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './AppContext';
import TabBar from './components/TabBar';
import Learn from './screens/Learn';
import Speak from './screens/Speak';
import Songs from './screens/Songs';
import Settings from './screens/Settings';

function Shell() {
  const { shellRef } = useApp();
  const [tab, setTab] = useState('learn');
  const tabRef = useRef(tab);

  useEffect(() => { tabRef.current = tab; }, [tab]);

  useEffect(() => {
    // Seed history so there's always a state to pop back to
    window.history.pushState({ tab: 'learn' }, '');

    const handlePop = () => {
      if (tabRef.current !== 'learn') {
        setTab('learn');
      }
      // Always push a new state so the next back press is also caught
      window.history.pushState({ tab: 'learn' }, '');
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(120% 120% at 50% 0%, #14161d 0%, #090a0e 70%)' }}>
      <div ref={shellRef} style={{
        position: 'relative',
        width: 'min(420px, 100vw)',
        height: 'min(880px, 100vh)',
        background: 'var(--bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'clamp(0px, calc((100vw - 420px) * 999), 38px)',
        boxShadow: '0 40px 90px -20px rgba(0,0,0,0.7), 0 0 0 1px var(--border)',
      }}>
        <div style={{ flex: '1 1 auto', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tab === 'learn'    && <Learn    key="learn"/>}
          {tab === 'speak'    && <Speak    key="speak"/>}
          {tab === 'songs'    && <Songs    key="songs"/>}
          {tab === 'settings' && <Settings key="settings"/>}
        </div>
        <TabBar tab={tab} setTab={setTab}/>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell/>
    </AppProvider>
  );
}
