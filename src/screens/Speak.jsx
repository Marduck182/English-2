import { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { vocab } from '../data/vocab';
import { useLearnStore } from '../store/learnStore';

const BATCH_SIZE   = 25;
const totalBatches = Math.ceil(vocab.length / BATCH_SIZE);

const WAVE_BARS = Array.from({ length: 19 }, (_, i) => ({
  delay: (-(Math.abs(9 - i)) * 0.07 - 0.05).toFixed(2) + 's',
}));

function fmtTime(s) {
  const m = Math.floor(s / 60), ss = s % 60;
  return `${m}:${ss < 10 ? '0' : ''}${ss}`;
}

function fmtRec(s) {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60), ss = s % 60;
  return `${m}:${ss < 10 ? '0' : ''}${ss}`;
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeWord(w) {
  return w.toLowerCase().replace(/[,.!?;:'"()\-]/g, '').trim();
}

function alignWords(expected, transcribed) {
  const exp = expected.split(/\s+/).map(normalizeWord).filter(Boolean);
  const got = transcribed.split(/\s+/).map(normalizeWord).filter(Boolean);
  if (!exp.length) return [];
  const n = exp.length, m = got.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = exp[i-1] === got[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const result = [];
  let i = n, j = m;
  while (i > 0) {
    if (j > 0 && exp[i-1] === got[j-1]) { result.unshift({ word: exp[i-1], correct: true }); i--; j--; }
    else if (j > 0 && dp[i][j-1] >= dp[i-1][j]) j--;
    else { result.unshift({ word: exp[i-1], correct: false }); i--; }
  }
  return result;
}

async function transcribeAudio(blob, apiKey) {
  const ext = blob.type.includes('ogg') ? 'ogg' : 'webm';
  const fd  = new FormData();
  fd.append('file', blob, `recording.${ext}`);
  fd.append('model', 'whisper-large-v3-turbo');
  fd.append('language', 'en');
  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: fd,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Error ${res.status}`); }
  return (await res.json()).text || '';
}

// ─── Batch picker ───────────────────────────────────────────────────────────
function BatchPickerModal({ current, onSelect, onClose }) {
  const [step, setStep]                 = useState('grid');
  const [pendingBatch, setPendingBatch] = useState(null);
  const batchPracticedCount = useLearnStore(s => s.batchPracticedCount);
  const totalPracticed      = useLearnStore(s => s.totalPracticed);

  if (step === 'filter') {
    const start         = pendingBatch * BATCH_SIZE + 1;
    const end           = Math.min((pendingBatch + 1) * BATCH_SIZE, vocab.length);
    const batchSize     = end - start + 1;
    const practicedCnt  = batchPracticedCount(pendingBatch);
    const unpracticed   = batchSize - practicedCnt;

    return (
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: '26px 26px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '6px 20px 32px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border2)', alignSelf: 'center', margin: '10px auto 18px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <button onClick={() => setStep('grid')} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid var(--border2)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Colección {pendingBatch + 1}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>¿Cómo practicar?</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => { onSelect(pendingBatch, 'all'); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 20, border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎤</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text)' }}>Todas las frases</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dim)', marginTop: 2 }}>{batchSize} frases · {practicedCnt} practicadas</div>
              </div>
            </button>
            <button onClick={() => unpracticed > 0 && (onSelect(pendingBatch, 'unpracticed'), onClose())} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 20, border: `1.5px solid ${unpracticed > 0 ? 'var(--teal)' : 'var(--border)'}`, background: unpracticed > 0 ? 'var(--teal-soft)' : 'var(--surface)', cursor: unpracticed > 0 ? 'pointer' : 'default', textAlign: 'left', opacity: unpracticed > 0 ? 1 : 0.5 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: unpracticed > 0 ? 'rgba(91,211,189,0.2)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎯</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: unpracticed > 0 ? 'var(--teal)' : 'var(--dim)' }}>
                  {unpracticed > 0 ? 'Solo no practicadas' : '¡Todo practicado!'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dim)', marginTop: 2 }}>
                  {unpracticed > 0 ? `${unpracticed} frases pendientes` : 'Todas las frases practicadas'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: '26px 26px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '6px 20px 28px', maxHeight: '72%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border2)', alignSelf: 'center', margin: '10px 0 18px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Pronunciación</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>Elige una colección</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 99, border: 'none', background: 'var(--surface2)', color: 'var(--dim)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'var(--accent)', width: `${(totalPracticed() / vocab.length * 100).toFixed(1)}%` }}/>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', whiteSpace: 'nowrap' }}>{totalPracticed()} / {vocab.length}</div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {Array.from({ length: totalBatches }, (_, i) => {
              const active    = i === current;
              const start     = i * BATCH_SIZE + 1;
              const end       = Math.min((i + 1) * BATCH_SIZE, vocab.length);
              const batchSize = end - start + 1;
              const done      = batchPracticedCount(i);
              const complete  = done === batchSize;
              return (
                <button key={i} onClick={() => { setPendingBatch(i); setStep('filter'); }} style={{
                  height: 76, borderRadius: 16, padding: '8px 6px',
                  border: active ? '2px solid var(--accent)' : complete ? '1.5px solid var(--teal)' : '1.5px solid var(--border)',
                  background: active ? 'var(--accent-soft)' : complete ? 'var(--teal-soft)' : 'var(--surface)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .15s',
                }}>
                  <div style={{ fontSize: 19, fontWeight: 900, color: active ? 'var(--accent)' : complete ? 'var(--teal)' : 'var(--text)', lineHeight: 1 }}>{complete ? '✓' : i + 1}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: active ? 'var(--accent)' : complete ? 'var(--teal)' : 'var(--faint)' }}>{done}/{batchSize}</div>
                  <div style={{ width: '80%', height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: active ? 'var(--accent)' : complete ? 'var(--teal)' : 'var(--dim)', width: `${done / batchSize * 100}%` }}/>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Session stats ───────────────────────────────────────────────────────────
function StatsModal({ scores, elapsed, filterMode, onRepeat, onNext }) {
  const avg     = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const best    = scores.length > 0 ? Math.max(...scores) : 0;
  const perfect = scores.filter(s => s === 100).length;
  const circumf = 2 * Math.PI * 44;
  const dashArr = `${Math.round(avg / 100 * circumf)} ${circumf}`;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 28px' }}>
      <div className="pop-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{avg >= 90 ? '🏆' : avg >= 70 ? '⭐' : '💪'}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>¡Sesión terminada!</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dim)', marginBottom: 28 }}>
          {filterMode === 'unpracticed' ? 'Solo no practicadas' : 'Todas las frases'} · {fmtTime(elapsed)}
        </div>

        <div style={{ position: 'relative', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="55" cy="55" r="44" fill="none" stroke="var(--surface2)" strokeWidth="10"/>
            <circle cx="55" cy="55" r="44" fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeDasharray={dashArr}/>
          </svg>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{avg}%</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--dim)' }}>promedio</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%', marginBottom: 32 }}>
          <div style={{ flex: 1, background: 'var(--accent-soft)', borderRadius: 18, padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{scores.length}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>Frases</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(91,211,189,0.14)', borderRadius: 18, padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>{best}%</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--teal)', marginTop: 4 }}>Mejor</div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{perfect}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', marginTop: 4 }}>Perfectas</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button onClick={onRepeat} style={{ flex: 1, height: 56, borderRadius: 18, border: '2px solid var(--border2)', background: 'transparent', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Repetir</button>
          <button onClick={onNext} style={{ flex: 1, height: 56, borderRadius: 18, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Nunito', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 10px 24px -8px var(--accent)' }}>Siguiente →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Speak() {
  const { showPhonetic, groqApiKey } = useApp();
  const markPracticed  = useLearnStore(s => s.markPracticed);
  const practicedMap   = useLearnStore(s => s.practiced);

  const [batchIndex, setBatchIndex]     = useState(0);
  const [filterMode, setFilterMode]     = useState('all');
  const [isShuffled, setIsShuffled]     = useState(false);
  const [activeWords, setActiveWords]   = useState([]);
  const [phraseIndex, setPhraseIndex]   = useState(0);
  const [micState, setMicState]         = useState('idle');
  const [recTime, setRecTime]           = useState(0);
  const [showPicker, setShowPicker]     = useState(false);
  const [showStats, setShowStats]       = useState(false);
  const [transcript, setTranscript]     = useState('');
  const [wordResults, setWordResults]   = useState([]);
  const [errorMsg, setErrorMsg]         = useState('');
  const [sessionScores, setSessionScores] = useState([]);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const sessionStartRef = useRef(Date.now());

  const timerRef    = useRef(null);
  const mediaRef    = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);

  useEffect(() => {
    let words = vocab.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
    if (filterMode === 'unpracticed') words = words.filter(w => !practicedMap[w.id]);
    if (isShuffled) words = shuffleArr(words);
    setActiveWords(words);
    setPhraseIndex(0);
    setMicState('idle');
    setTranscript('');
    setWordResults([]);
    setShowStats(false);
    setSessionScores([]);
    sessionStartRef.current = Date.now();
  }, [batchIndex, filterMode, isShuffled]);

  const total  = activeWords.length;
  const phrase = activeWords[phraseIndex] || null;

  useEffect(() => {
    if (micState === 'recording') {
      timerRef.current = setInterval(() => setRecTime(t => t + 0.1), 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [micState]);

  useEffect(() => () => { mediaRef.current?.getTracks().forEach(t => t.stop()); clearInterval(timerRef.current); }, []);

  function stopTracks() { mediaRef.current?.getTracks().forEach(t => t.stop()); mediaRef.current = null; }

  function resetMic() { setMicState('idle'); setRecTime(0); setTranscript(''); setWordResults(''); setErrorMsg(''); stopTracks(); }

  async function startRecording() {
    if (!groqApiKey) { setErrorMsg('Configura tu Groq API Key en Ajustes primero.'); setMicState('error'); return; }
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current   = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      setMicState('recording'); setRecTime(0);
    } catch { setErrorMsg('No se pudo acceder al micrófono.'); setMicState('error'); }
  }

  async function stopAndTranscribe() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setMicState('processing');
    await new Promise(resolve => { recorder.onstop = resolve; recorder.stop(); });
    stopTracks();
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
    try {
      const text    = await transcribeAudio(blob, groqApiKey);
      const results = alignWords(phrase.ejemplo_en || '', text);
      setTranscript(text);
      setWordResults(results);
      setMicState('result');
    } catch (err) { setErrorMsg(err.message || 'Error al procesar el audio.'); setMicState('error'); }
  }

  function micTap() {
    if (micState === 'idle')       startRecording();
    else if (micState === 'recording') stopAndTranscribe();
  }

  function handleNext() {
    const correctCount = wordResults.filter(w => w.correct).length;
    const pct          = wordResults.length > 0 ? Math.round(correctCount / wordResults.length * 100) : 0;
    markPracticed(phrase.id);
    const newScores = [...sessionScores, pct];
    const isLast    = phraseIndex >= total - 1;
    setSessionScores(newScores);
    resetMic();
    if (isLast) {
      setSessionElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      setShowStats(true);
    } else {
      setPhraseIndex(i => i + 1);
    }
  }

  function handleRepeat() {
    setPhraseIndex(0);
    setShowStats(false);
    setSessionScores([]);
    if (isShuffled) setActiveWords(prev => shuffleArr([...prev]));
    sessionStartRef.current = Date.now();
  }

  function handleNextBatch() {
    const next = batchIndex < totalBatches - 1 ? batchIndex + 1 : 0;
    setBatchIndex(next);
    setFilterMode('all');
    setShowStats(false);
  }

  const correctCount = wordResults.filter ? wordResults.filter(w => w.correct).length : 0;
  const pct          = wordResults.length > 0 ? Math.round(correctCount / wordResults.length * 100) : 0;
  const circumf      = 2 * Math.PI * 58;
  const dashArr      = `${Math.round(pct / 100 * circumf)} ${circumf}`;
  const micBg        = micState === 'recording' ? 'var(--red)' : micState === 'processing' ? 'var(--surface2)' : 'var(--accent)';
  const micFg        = micState === 'processing' ? 'var(--dim)' : '#fff';
  const micGlow      = micState === 'recording' ? 'rgba(255,90,82,0.5)' : micState === 'processing' ? 'transparent' : 'var(--accent)';

  if (activeWords.length === 0 && filterMode === 'unpracticed') {
    return (
      <div className="screen-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 28px', gap: 18 }}>
        <div style={{ fontSize: 52 }}>🎤</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', textAlign: 'center' }}>¡Todo practicado!</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dim)', textAlign: 'center' }}>Ya practicaste todas las frases de esta colección.</div>
        <button onClick={() => setFilterMode('all')} style={{ marginTop: 8, padding: '14px 28px', borderRadius: 16, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Nunito', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>Ver todas de nuevo</button>
      </div>
    );
  }

  return (
    <div className="screen-in" style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', padding: '8px 22px 14px' }}>

      {/* Header */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Pronunciación</div>
          <button onClick={() => setShowPicker(true)} style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ fontSize: 27, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>Colección {batchIndex + 1}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--faint)', lineHeight: 1, marginTop: 2 }}>/ {totalBatches}</div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--accent)', marginTop: 2 }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setIsShuffled(s => !s)} title="Orden aleatorio" style={{
            width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${isShuffled ? 'var(--accent)' : 'var(--border2)'}`,
            background: isShuffled ? 'var(--accent-soft)' : 'transparent',
            color: isShuffled ? 'var(--accent)' : 'var(--dim)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dim)' }}>{phraseIndex + 1} / {total}</div>
        </div>
      </div>

      {/* Filter badge */}
      {filterMode === 'unpracticed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--teal)', background: 'var(--teal-soft)', padding: '4px 12px', borderRadius: 99 }}>🎯 Solo no practicadas</div>
          <button onClick={() => setFilterMode('all')} style={{ fontSize: 12, fontWeight: 800, color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>× Ver todas</button>
        </div>
      )}

      {/* Phrase card */}
      {phrase && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: '26px 24px', boxShadow: '0 18px 40px -22px var(--shadow)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 14 }}>Di esto en voz alta</div>
          <div style={{ fontSize: 'calc(27px * var(--scale))', fontWeight: 900, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.01em' }}>{phrase.ejemplo_en || phrase.palabra}</div>
          {showPhonetic && phrase.ejemplo_fonetica && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'calc(15px * var(--scale))', fontWeight: 400, color: 'var(--teal)', lineHeight: 1.5, marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>{phrase.ejemplo_fonetica}</div>
          )}
        </div>
      )}

      {/* Mic zone */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

        {micState === 'result' && (
          <div className="pop-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="130" height="130" viewBox="0 0 130 130" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx="65" cy="65" r="58" fill="none" stroke="var(--surface2)" strokeWidth="11"/>
                <circle cx="65" cy="65" r="58" fill="none" stroke="var(--accent)" strokeWidth="11" strokeLinecap="round" strokeDasharray={dashArr}/>
              </svg>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dim)' }}>acierto</div>
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
              {pct === 100 ? '¡Perfecto!' : pct >= 75 ? '¡Muy bien!' : pct >= 50 ? 'Casi lo tienes' : 'Sigue practicando'}
            </div>
            {transcript && (
              <div style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 6 }}>Escuché</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dim)', lineHeight: 1.4, fontStyle: 'italic' }}>{transcript}</div>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 8px', justifyContent: 'center', marginBottom: 20, width: '100%' }}>
              {Array.isArray(wordResults) && wordResults.map((w, i) => (
                <span key={i} style={{ fontSize: 17, fontWeight: 800, padding: '4px 8px', borderRadius: 8, color: w.correct ? 'var(--accent)' : 'var(--red)', background: w.correct ? 'var(--accent-soft)' : 'rgba(255,90,82,0.14)', textDecoration: w.correct ? 'none' : 'underline wavy', textDecorationColor: 'var(--red)', textUnderlineOffset: 4 }}>{w.word}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button onClick={resetMic} style={{ flex: 1, height: 56, borderRadius: 18, border: '2px solid var(--border2)', background: 'transparent', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>Reintentar</button>
              <button onClick={handleNext} style={{ flex: 1, height: 56, borderRadius: 18, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Nunito', fontWeight: 900, fontSize: 16, cursor: 'pointer', boxShadow: '0 10px 24px -8px var(--accent)' }}>Siguiente →</button>
            </div>
          </div>
        )}

        {micState === 'error' && (
          <div className="pop-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--red)', textAlign: 'center' }}>{errorMsg}</div>
            <button onClick={resetMic} style={{ height: 52, padding: '0 28px', borderRadius: 16, border: '2px solid var(--border2)', background: 'transparent', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Reintentar</button>
          </div>
        )}

        {micState !== 'result' && micState !== 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            {micState === 'recording' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 64 }}>
                {WAVE_BARS.map((bar, i) => (
                  <div key={i} className="wave-bar" style={{ width: 5, height: '100%', borderRadius: 5, background: 'var(--accent)', animationDelay: bar.delay }}/>
                ))}
              </div>
            )}
            {micState === 'processing' && <div className="spin-anim" style={{ width: 64, height: 64, borderRadius: '50%', border: '5px solid var(--surface2)', borderTopColor: 'var(--accent)' }}/>}
            {micState === 'idle' && <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--faint)', height: 64, display: 'flex', alignItems: 'center', textAlign: 'center' }}>{groqApiKey ? 'Toca el micrófono para grabar' : 'Configura el Groq API Key en Ajustes'}</div>}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {micState === 'recording' && (
                <>
                  <div className="ring-anim" style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: 'var(--red)' }}/>
                  <div className="ring-anim" style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: 'var(--red)', animationDelay: '0.8s' }}/>
                </>
              )}
              <button onClick={micTap} disabled={micState === 'processing'} style={{ position: 'relative', width: 96, height: 96, borderRadius: '50%', border: 'none', cursor: micState === 'processing' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .25s', background: micBg, color: micFg, boxShadow: `0 14px 34px -10px ${micGlow}` }}>
                {micState === 'recording'
                  ? <div style={{ width: 30, height: 30, borderRadius: 8, background: 'currentColor' }}/>
                  : micState === 'processing' ? null
                  : <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>}
              </button>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: micState === 'recording' ? 'var(--red)' : 'var(--dim)', height: 22, textAlign: 'center' }}>
              {micState === 'idle' && ''}
              {micState === 'recording' && `${fmtRec(recTime)}  ·  toca para parar`}
              {micState === 'processing' && 'Analizando tu pronunciación…'}
            </div>
          </div>
        )}
      </div>

      {showPicker && (
        <BatchPickerModal
          current={batchIndex}
          onSelect={(newBatch, mode) => { setBatchIndex(newBatch); setFilterMode(mode); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showStats && (
        <StatsModal
          scores={sessionScores}
          elapsed={sessionElapsed}
          filterMode={filterMode}
          onRepeat={handleRepeat}
          onNext={handleNextBatch}
        />
      )}
    </div>
  );
}
