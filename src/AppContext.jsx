import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AppContext = createContext(null);

const DARK = {
  '--bg':        '#0F1014',
  '--bg2':       '#15161D',
  '--surface':   '#1C1E27',
  '--surface2':  '#262A36',
  '--text':      '#F3F4F7',
  '--dim':       '#9298A6',
  '--faint':     '#5B6273',
  '--border':    'rgba(255,255,255,0.08)',
  '--border2':   'rgba(255,255,255,0.16)',
  '--teal':      '#5BD3BD',
  '--teal-soft': 'rgba(91,211,189,0.12)',
  '--amber':     '#FFC83D',
  '--red':       '#FF5A52',
  '--shadow':    'rgba(0,0,0,0.6)',
};

const LIGHT = {
  '--bg':        '#FBF7EC',
  '--bg2':       '#FFFFFF',
  '--surface':   '#FFFFFF',
  '--surface2':  '#F1EEE3',
  '--text':      '#1B1D24',
  '--dim':       '#6B7280',
  '--faint':     '#AAB0BE',
  '--border':    'rgba(0,0,0,0.07)',
  '--border2':   'rgba(0,0,0,0.14)',
  '--teal':      '#1F9E89',
  '--teal-soft': 'rgba(31,158,137,0.10)',
  '--amber':     '#D99412',
  '--red':       '#E5483F',
  '--shadow':    'rgba(60,50,20,0.18)',
};

const ACCENTS = {
  Verde:  ['#92D04F', '#10210A'],
  Teal:   ['#4FBFAC', '#08231E'],
  Azul:   ['#5BA0E5', '#06203A'],
  Morado: ['#AB47BC', '#1a0020'],
};

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function AppProvider({ children }) {
  const shellRef = useRef(null);
  const mq = useRef(null);

  const [theme, setTheme]           = useState('dark');
  const [accent, setAccent]         = useState('Verde');
  const [fontSize, setFontSize]     = useState('M');
  const [showPhonetic, setPhonetic] = useState(true);
  const [audioSpeed, setSpeed]      = useState(1);
  const [lang, setLang]             = useState('es');
  const [groqApiKey, setGroqApiKey] = useState(() => localStorage.getItem('groqApiKey') || '');

  function applyTokens() {
    const el = shellRef.current;
    if (!el) return;
    let t = theme;
    if (t === 'auto') t = mq.current?.matches ? 'dark' : 'light';
    const base = t === 'dark' ? { ...DARK } : { ...LIGHT };
    const [ac, ink] = ACCENTS[accent] || ACCENTS.Verde;
    base['--accent']      = ac;
    base['--accent-ink']  = ink;
    base['--accent-soft'] = hexA(ac, t === 'dark' ? 0.16 : 0.14);
    base['--scale']       = { S: '0.9', M: '1', L: '1.14' }[fontSize] || '1';
    Object.entries(base).forEach(([k, v]) => el.style.setProperty(k, v));
  }

  useEffect(() => {
    mq.current = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => { if (theme === 'auto') applyTokens(); };
    mq.current.addEventListener('change', listener);
    return () => mq.current.removeEventListener('change', listener);
  }, []);

  useEffect(() => { applyTokens(); }, [theme, accent, fontSize, shellRef.current]);

  useEffect(() => { localStorage.setItem('groqApiKey', groqApiKey); }, [groqApiKey]);

  const ctx = {
    shellRef, theme, setTheme, accent, setAccent,
    fontSize, setFontSize, showPhonetic, setPhonetic,
    audioSpeed, setSpeed, lang, setLang,
    groqApiKey, setGroqApiKey,
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
