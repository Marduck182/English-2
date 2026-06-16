import { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { vocab } from '../data/vocab';

const BATCH_SIZE   = 25;
const totalBatches = Math.ceil(vocab.length / BATCH_SIZE);

const WAVE_BARS = Array.from({ length: 19 }, (_, i) => ({
  delay: (-(Math.abs(9 - i)) * 0.07 - 0.05).toFixed(2) + 's',
}));

function fmt(s) {
  s = Math.max(0, Math.floor(s));
  const m  = Math.floor(s / 60);
  const ss = s % 60;
  return m + ':' + (ss < 10 ? '0' : '') + ss;
}

function normalizeWord(w) {
  return w.toLowerCase().replace(/[,.!?;:'"()\-]/g, '').trim();
}

// LCS-based word alignment: returns [{word, correct}] for each expected word
function alignWords(expected, transcribed) {
  const exp = expected.split(/\s+/).map(normalizeWord).filter(Boolean);
  const got = transcribed.split(/\s+/).map(normalizeWord).filter(Boolean);
  if (!exp.length) return [];

  const n = exp.length, m = got.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = exp[i-1] === got[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);

  const result = [];
  let i = n, j = m;
  while (i > 0) {
    if (j > 0 && exp[i-1] === got[j-1]) {
      result.unshift({ word: exp[i-1], correct: true });
      i--; j--;
    } else if (j > 0 && dp[i][j-1] >= dp[i-1][j]) {
      j--;
    } else {
      result.unshift({ word: exp[i-1], correct: false });
      i--;
    }
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
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error ${res.status}`);
  }
  const data = await res.json();
  return data.text || '';
}

function BatchPickerModal({ current, onSelect, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)', borderRadius: '26px 26px 0 0',
          border: '1px solid var(--border)', borderBottom: 'none',
          padding: '6px 20px 28px', maxHeight: '72%', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border2)', alignSelf: 'center', margin: '10px 0 18px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Pronunciación</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>Elige una colección</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 99, border: 'none', background: 'var(--surface2)', color: 'var(--dim)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 14 }}>
          {vocab.length} palabras · {totalBatches} colecciones de {BATCH_SIZE}
        </div>
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {Array.from({ length: totalBatches }, (_, i) => {
              const active = i === current;
              const start  = i * BATCH_SIZE + 1;
              const end    = Math.min((i + 1) * BATCH_SIZE, vocab.length);
              return (
                <button key={i} onClick={() => { onSelect(i); onClose(); }} style={{
                  height: 72, borderRadius: 16, border: active ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                  background: active ? 'var(--accent-soft)' : 'var(--surface)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all .15s',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: active ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>{i + 1}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--faint)', letterSpacing: '0.02em' }}>{start}–{end}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Speak() {
  const { showPhonetic, groqApiKey } = useApp();
  const [batchIndex, setBatchIndex]   = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [micState, setMicState]       = useState('idle'); // idle | recording | processing | result | error
  const [recTime, setRecTime]         = useState(0);
  const [showPicker, setShowPicker]   = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [wordResults, setWordResults] = useState([]);
  const [errorMsg, setErrorMsg]       = useState('');

  const timerRef   = useRef(null);
  const mediaRef   = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef  = useRef([]);

  const batchWords = vocab.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
  const total      = batchWords.length;
  const phrase     = batchWords[phraseIndex % total];

  function changeBatch(newBatch) {
    setBatchIndex(newBatch);
    setPhraseIndex(0);
    resetState();
  }

  function resetState() {
    setMicState('idle');
    setRecTime(0);
    setTranscript('');
    setWordResults([]);
    setErrorMsg('');
    stopTracks();
  }

  function stopTracks() {
    mediaRef.current?.getTracks().forEach(t => t.stop());
    mediaRef.current = null;
  }

  useEffect(() => {
    if (micState === 'recording') {
      timerRef.current = setInterval(() => setRecTime(t => t + 0.1), 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [micState]);

  // cleanup on unmount
  useEffect(() => () => { stopTracks(); clearInterval(timerRef.current); }, []);

  async function startRecording() {
    if (!groqApiKey) {
      setErrorMsg('Configura tu Groq API Key en Ajustes primero.');
      setMicState('error');
      return;
    }
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current   = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      setMicState('recording');
      setRecTime(0);
    } catch (err) {
      setErrorMsg('No se pudo acceder al micrófono.');
      setMicState('error');
    }
  }

  async function stopAndTranscribe() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setMicState('processing');

    await new Promise(resolve => {
      recorder.onstop = resolve;
      recorder.stop();
    });
    stopTracks();

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
    try {
      const text    = await transcribeAudio(blob, groqApiKey);
      const results = alignWords(phrase.ejemplo_en || '', text);
      setTranscript(text);
      setWordResults(results);
      setMicState('result');
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el audio.');
      setMicState('error');
    }
  }

  function micTap() {
    if (micState === 'idle')      startRecording();
    else if (micState === 'recording') stopAndTranscribe();
  }

  const correctCount = wordResults.filter(w => w.correct).length;
  const pct          = wordResults.length > 0 ? Math.round(correctCount / wordResults.length * 100) : 0;
  const circumf      = 2 * Math.PI * 58;
  const dashArr      = `${Math.round(pct / 100 * circumf)} ${circumf}`;

  const micBg   = micState === 'recording' ? 'var(--red)' : micState === 'processing' ? 'var(--surface2)' : 'var(--accent)';
  const micFg   = micState === 'processing' ? 'var(--dim)' : '#fff';
  const micGlow = micState === 'recording' ? 'rgba(255,90,82,0.5)' : micState === 'processing' ? 'transparent' : 'var(--accent)';

  return (
    <div className="screen-in" style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', padding: '8px 22px 14px' }}>

      {/* Header */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
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
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dim)' }}>{(phraseIndex % total) + 1} / {total}</div>
      </div>

      {/* Phrase card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: '26px 24px', boxShadow: '0 18px 40px -22px var(--shadow)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 14 }}>Di esto en voz alta</div>
        <div style={{ fontSize: 'calc(27px * var(--scale))', fontWeight: 900, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.01em' }}>{phrase.ejemplo_en || phrase.palabra}</div>
        {showPhonetic && phrase.ejemplo_fonetica && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'calc(15px * var(--scale))', fontWeight: 400, color: 'var(--teal)', lineHeight: 1.5, marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>{phrase.ejemplo_fonetica}</div>
        )}
      </div>

      {/* Mic zone */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

        {/* Result */}
        {micState === 'result' && (
          <div className="pop-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Score circle */}
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

            {/* Transcription */}
            {transcript && (
              <div style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 6 }}>Escuché</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dim)', lineHeight: 1.4, fontStyle: 'italic' }}>{transcript}</div>
              </div>
            )}

            {/* Word comparison */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 8px', justifyContent: 'center', marginBottom: 20, width: '100%' }}>
              {wordResults.map((w, i) => (
                <span key={i} style={{
                  fontSize: 17, fontWeight: 800, padding: '4px 8px', borderRadius: 8,
                  color: w.correct ? 'var(--accent)' : 'var(--red)',
                  background: w.correct ? 'var(--accent-soft)' : 'rgba(255,90,82,0.14)',
                  textDecoration: w.correct ? 'none' : 'underline wavy',
                  textDecorationColor: 'var(--red)', textUnderlineOffset: 4,
                }}>{w.word}</span>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button onClick={resetState} style={{ flex: 1, height: 56, borderRadius: 18, border: '2px solid var(--border2)', background: 'transparent', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>Reintentar</button>
              <button onClick={() => { resetState(); setPhraseIndex(i => i + 1); }} style={{ flex: 1, height: 56, borderRadius: 18, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Nunito', fontWeight: 900, fontSize: 16, cursor: 'pointer', boxShadow: '0 10px 24px -8px var(--accent)' }}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* Error */}
        {micState === 'error' && (
          <div className="pop-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--red)', textAlign: 'center' }}>{errorMsg}</div>
            <button onClick={resetState} style={{ height: 52, padding: '0 28px', borderRadius: 16, border: '2px solid var(--border2)', background: 'transparent', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Reintentar</button>
          </div>
        )}

        {/* Mic zone (idle / recording / processing) */}
        {micState !== 'result' && micState !== 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            {micState === 'recording' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 64 }}>
                {WAVE_BARS.map((bar, i) => (
                  <div key={i} className="wave-bar" style={{ width: 5, height: '100%', borderRadius: 5, background: 'var(--accent)', animationDelay: bar.delay }}/>
                ))}
              </div>
            )}
            {micState === 'processing' && (
              <div className="spin-anim" style={{ width: 64, height: 64, borderRadius: '50%', border: '5px solid var(--surface2)', borderTopColor: 'var(--accent)' }}/>
            )}
            {micState === 'idle' && (
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--faint)', height: 64, display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                {groqApiKey ? 'Toca el micrófono para grabar' : 'Configura el Groq API Key en Ajustes'}
              </div>
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {micState === 'recording' && (
                <>
                  <div className="ring-anim" style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: 'var(--red)' }}/>
                  <div className="ring-anim" style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: 'var(--red)', animationDelay: '0.8s' }}/>
                </>
              )}
              <button onClick={micTap} disabled={micState === 'processing'} style={{
                position: 'relative', width: 96, height: 96, borderRadius: '50%', border: 'none', cursor: micState === 'processing' ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .25s',
                background: micBg, color: micFg, boxShadow: `0 14px 34px -10px ${micGlow}`,
              }}>
                {micState === 'recording'
                  ? <div style={{ width: 30, height: 30, borderRadius: 8, background: 'currentColor' }}/>
                  : micState === 'processing'
                  ? null
                  : (
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/>
                      <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  )
                }
              </button>
            </div>

            <div style={{ fontSize: 15, fontWeight: 800, color: micState === 'recording' ? 'var(--red)' : 'var(--dim)', height: 22, textAlign: 'center' }}>
              {micState === 'idle'       && ''}
              {micState === 'recording'  && `${fmt(recTime)}  ·  toca para parar`}
              {micState === 'processing' && 'Analizando tu pronunciación…'}
            </div>
          </div>
        )}
      </div>

      {/* Batch picker modal */}
      {showPicker && (
        <BatchPickerModal
          current={batchIndex}
          onSelect={changeBatch}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
