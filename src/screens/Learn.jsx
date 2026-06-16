import { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { vocab } from '../data/vocab';
import { useLearnStore } from '../store/learnStore';

const BATCH_SIZE   = 50;
const totalBatches = Math.ceil(vocab.length / BATCH_SIZE);

function speakText(text, speed) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = speed;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(s) {
  const m = Math.floor(s / 60), ss = s % 60;
  return `${m}:${ss < 10 ? '0' : ''}${ss}`;
}

// ─── Seg toggle ────────────────────────────────────────────────────────────
function SegToggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', padding: 4, borderRadius: 11 }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          border: 'none', padding: '7px 12px', borderRadius: 8,
          fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'all .2s',
          color: value === o.key ? 'var(--accent-ink)' : 'var(--dim)',
          background: value === o.key ? 'var(--accent)' : 'transparent',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ─── Batch picker ──────────────────────────────────────────────────────────
function BatchPickerModal({ current, onSelect, onClose }) {
  const [step, setStep]               = useState('grid');
  const [pendingBatch, setPendingBatch] = useState(null);
  const batchLearnedCount = useLearnStore(s => s.batchLearnedCount);
  const totalLearned      = useLearnStore(s => s.totalLearned);

  const handle = (bg, fg) => (
    <>
      <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border2)', alignSelf: 'center', margin: '10px 0 18px' }}/>
    </>
  );

  if (step === 'filter') {
    const start        = pendingBatch * BATCH_SIZE + 1;
    const end          = Math.min((pendingBatch + 1) * BATCH_SIZE, vocab.length);
    const batchSize    = end - start + 1;
    const learnedCount = batchLearnedCount(pendingBatch);
    const unlearned    = batchSize - learnedCount;

    return (
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: '26px 26px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '6px 20px 32px' }}>
          {handle()}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <button onClick={() => setStep('grid')} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid var(--border2)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Colección {pendingBatch + 1}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>¿Cómo estudiar?</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Todas */}
            <button onClick={() => { onSelect(pendingBatch, 'all'); onClose(); }} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 20,
              border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📚</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text)' }}>Todas las palabras</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dim)', marginTop: 2 }}>{batchSize} palabras · {learnedCount} aprendidas</div>
              </div>
            </button>

            {/* No aprendidas */}
            <button
              onClick={() => unlearned > 0 && (onSelect(pendingBatch, 'unlearned'), onClose())}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 20,
                border: `1.5px solid ${unlearned > 0 ? 'var(--teal)' : 'var(--border)'}`,
                background: unlearned > 0 ? 'var(--teal-soft)' : 'var(--surface)',
                cursor: unlearned > 0 ? 'pointer' : 'default', textAlign: 'left',
                opacity: unlearned > 0 ? 1 : 0.5,
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: unlearned > 0 ? 'rgba(91,211,189,0.2)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎯</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: unlearned > 0 ? 'var(--teal)' : 'var(--dim)' }}>
                  {unlearned > 0 ? 'Solo no aprendidas' : '¡Todo aprendido!'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dim)', marginTop: 2 }}>
                  {unlearned > 0 ? `${unlearned} palabras pendientes` : 'Todas marcadas como aprendidas'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'grid'
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: '26px 26px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '6px 20px 28px', maxHeight: '72%', display: 'flex', flexDirection: 'column' }}>
        {handle()}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Aprender</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>Elige una colección</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 99, border: 'none', background: 'var(--surface2)', color: 'var(--dim)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'var(--accent)', width: `${(totalLearned() / vocab.length * 100).toFixed(1)}%` }}/>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', whiteSpace: 'nowrap' }}>{totalLearned()} / {vocab.length}</div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {Array.from({ length: totalBatches }, (_, i) => {
              const active    = i === current;
              const start     = i * BATCH_SIZE + 1;
              const end       = Math.min((i + 1) * BATCH_SIZE, vocab.length);
              const batchSize = end - start + 1;
              const done      = batchLearnedCount(i);
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

// ─── Session stats ──────────────────────────────────────────────────────────
function StatsModal({ learned, review, elapsed, total, filterMode, onRepeat, onNext }) {
  const pct = total > 0 ? Math.round(learned / total * 100) : 0;
  const circumf = 2 * Math.PI * 44;
  const dashArr = `${Math.round(pct / 100 * circumf)} ${circumf}`;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 28px' }}>
      <div className="pop-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{pct === 100 ? '🏆' : pct >= 70 ? '⭐' : '💪'}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>
          {pct === 100 ? '¡Colección completada!' : '¡Sesión terminada!'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dim)', marginBottom: 28 }}>
          {filterMode === 'unlearned' ? 'Solo no aprendidas' : 'Todas las palabras'} · {fmt(elapsed)}
        </div>

        {/* Score circle */}
        <div style={{ position: 'relative', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="55" cy="55" r="44" fill="none" stroke="var(--surface2)" strokeWidth="10"/>
            <circle cx="55" cy="55" r="44" fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeDasharray={dashArr}/>
          </svg>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--dim)' }}>aprendidas</div>
          </div>
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 12, width: '100%', marginBottom: 32 }}>
          <div style={{ flex: 1, background: 'var(--accent-soft)', borderRadius: 18, padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{learned}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>Ya las sé</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,200,61,0.14)', borderRadius: 18, padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--amber)', lineHeight: 1 }}>{review}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--amber)', marginTop: 4 }}>A repasar</div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{fmt(elapsed)}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', marginTop: 4 }}>Tiempo</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button onClick={onRepeat} style={{ flex: 1, height: 56, borderRadius: 18, border: '2px solid var(--border2)', background: 'transparent', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Repetir lote</button>
          <button onClick={onNext} style={{ flex: 1, height: 56, borderRadius: 18, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Nunito', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 10px 24px -8px var(--accent)' }}>Siguiente →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Card faces ─────────────────────────────────────────────────────────────
function CardFrontA({ word, showPhonetic, onSpeak }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 30, position: 'relative' }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', color: 'var(--faint)', textTransform: 'uppercase' }}>Palabra</div>
      <div style={{ fontSize: 'calc(54px * var(--scale))', fontWeight: 900, color: 'var(--text)', lineHeight: 1, textAlign: 'center', letterSpacing: '-0.02em' }}>{word.palabra}</div>
      {showPhonetic && word.fonetica && (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'calc(19px * var(--scale))', fontWeight: 500, color: 'var(--teal)', background: 'var(--teal-soft)', padding: '7px 16px', borderRadius: 10 }}>{word.fonetica}</div>
      )}
      <button onPointerDown={e => e.stopPropagation()} onClick={onSpeak} style={{ marginTop: 6, width: 62, height: 62, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      <div style={{ position: 'absolute', bottom: 22, fontSize: 13, fontWeight: 700, color: 'var(--faint)' }}>toca para voltear · desliza →</div>
    </div>
  );
}

function CardFrontB({ word, cardNum, showPhonetic, onSpeak }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '34px 30px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'linear-gradient(90deg, var(--accent), var(--teal))' }}/>
      <div style={{ position: 'absolute', top: 26, right: 26, fontSize: 90, fontWeight: 900, color: 'var(--text)', opacity: 0.05, lineHeight: 1 }}>{String(cardNum).padStart(2,'0')}</div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--faint)', textTransform: 'uppercase', marginTop: 6 }}>Vocabulario · {cardNum}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        <div style={{ fontSize: 'calc(48px * var(--scale))', fontWeight: 900, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>{word.palabra}</div>
        {showPhonetic && word.fonetica && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'calc(20px * var(--scale))', fontWeight: 500, color: 'var(--teal)', borderLeft: '3px solid var(--teal)', paddingLeft: 14 }}>{word.fonetica}</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onPointerDown={e => e.stopPropagation()} onClick={onSpeak} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Escuchar
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--faint)' }}>toca para voltear →</div>
      </div>
    </div>
  );
}

function CardBack({ word, showPhonetic, onSpeakExample }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, padding: '30px 28px', overflowY: 'auto' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--faint)', textTransform: 'uppercase' }}>{word.palabra}</div>
        <div style={{ fontSize: 'calc(28px * var(--scale))', fontWeight: 900, color: 'var(--text)', lineHeight: 1.15, marginTop: 4 }}>{word.traduccion}</div>
      </div>
      <div style={{ height: 1, background: 'var(--border)' }}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--accent)', textTransform: 'uppercase' }}>Ejemplo</div>
        <div style={{ fontSize: 'calc(19px * var(--scale))', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{word.ejemplo_en}</div>
        {showPhonetic && word.ejemplo_fonetica && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'calc(14px * var(--scale))', fontWeight: 400, color: 'var(--teal)', lineHeight: 1.5 }}>{word.ejemplo_fonetica}</div>
        )}
        {word.ejemplo_es && (
          <div style={{ fontSize: 'calc(16px * var(--scale))', fontWeight: 600, color: 'var(--dim)', fontStyle: 'italic', lineHeight: 1.4, marginTop: 2 }}>{word.ejemplo_es}</div>
        )}
      </div>
      <button onPointerDown={e => e.stopPropagation()} onClick={onSpeakExample} style={{ marginTop: 'auto', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 9, padding: '11px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        Escuchar frase
      </button>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function Learn() {
  const { showPhonetic, audioSpeed } = useApp();
  const markLearned   = useLearnStore(s => s.markLearned);
  const unmarkLearned = useLearnStore(s => s.unmarkLearned);
  const isLearned     = useLearnStore(s => s.isLearned);
  const learnedMap    = useLearnStore(s => s.learned);

  const [batchIndex, setBatchIndex]   = useState(0);
  const [filterMode, setFilterMode]   = useState('all');
  const [isShuffled, setIsShuffled]   = useState(false);
  const [activeWords, setActiveWords] = useState([]);
  const [cardIndex, setCardIndex]     = useState(0);
  const [flipped, setFlipped]         = useState(false);
  const [variant, setVariant]         = useState('A');
  const [dragX, setDragX]             = useState(0);
  const [dragY, setDragY]             = useState(0);
  const [dragging, setDragging]       = useState(false);
  const [showPicker, setShowPicker]   = useState(false);
  const [showStats, setShowStats]     = useState(false);
  const [sessionLearned, setSessionLearned] = useState(0);
  const [sessionReview, setSessionReview]   = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const sessionStartRef = useRef(Date.now());

  // Rebuild activeWords when batch/filter/shuffle changes
  useEffect(() => {
    let words = vocab.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
    if (filterMode === 'unlearned') words = words.filter(w => !learnedMap[w.id]);
    if (isShuffled) words = shuffle(words);
    setActiveWords(words);
    setCardIndex(0);
    setFlipped(false);
    setShowStats(false);
    setSessionLearned(0);
    setSessionReview(0);
    sessionStartRef.current = Date.now();
  }, [batchIndex, filterMode, isShuffled]);

  const total   = activeWords.length;
  const word    = activeWords[cardIndex] || null;
  const cardNum = cardIndex + 1;
  const pct     = total > 0 ? ((cardIndex + 1) / total * 100).toFixed(1) + '%' : '0%';

  const sxRef = useRef(0), syRef = useRef(0), movedRef = useRef(0);

  function onPointerDown(e) {
    sxRef.current = e.clientX; syRef.current = e.clientY; movedRef.current = 0;
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - sxRef.current, dy = e.clientY - syRef.current;
    movedRef.current = Math.max(movedRef.current, Math.hypot(dx, dy));
    setDragX(dx); setDragY(dy * 0.25);
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragX) > 105) decide(dragX > 0 ? 1 : -1);
    else if (movedRef.current < 9) { setFlipped(f => !f); setDragX(0); setDragY(0); }
    else { setDragX(0); setDragY(0); }
  }

  function decide(dir) {
    if (!word) return;
    if (dir > 0) { markLearned(word.id);   setSessionLearned(n => n + 1); }
    else         { unmarkLearned(word.id); setSessionReview(n => n + 1);  }

    const isLast = cardIndex >= total - 1;
    setDragX(dir * 650); setDragY(-40);
    setTimeout(() => {
      setDragX(0); setDragY(0); setFlipped(false);
      if (isLast) {
        setSessionElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000));
        setShowStats(true);
      } else {
        setCardIndex(i => i + 1);
      }
    }, 260);
  }

  function handleRepeat() {
    setCardIndex(0);
    setFlipped(false);
    setShowStats(false);
    setSessionLearned(0);
    setSessionReview(0);
    if (isShuffled) {
      setActiveWords(prev => shuffle([...prev]));
    }
    sessionStartRef.current = Date.now();
  }

  function handleNext() {
    const next = batchIndex < totalBatches - 1 ? batchIndex + 1 : 0;
    setShowPicker(false);
    setShowStats(false);
    setBatchIndex(next);
    setFilterMode('all');
  }

  const rot               = dragX * 0.045;
  const cardWrapTransform = `translate(${dragX}px, ${dragY}px) rotate(${rot}deg)`;
  const cardTransition    = dragging ? 'none' : 'transform .35s cubic-bezier(.2,.8,.2,1)';
  const flipTransform     = `rotateY(${flipped ? 180 : 0}deg)`;
  const clamp01           = v => Math.max(0, Math.min(1, v));

  // Empty state
  if (activeWords.length === 0 && filterMode === 'unlearned') {
    return (
      <div className="screen-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 28px', gap: 18 }}>
        <div style={{ fontSize: 52 }}>🏆</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', textAlign: 'center' }}>¡Todo aprendido!</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dim)', textAlign: 'center' }}>Ya aprendiste todas las palabras de esta colección.</div>
        <button onClick={() => setFilterMode('all')} style={{ marginTop: 8, padding: '14px 28px', borderRadius: 16, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Nunito', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>Ver todas de nuevo</button>
      </div>
    );
  }

  return (
    <div className="screen-in" style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', padding: '8px 22px 14px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Aprender</div>
          <button onClick={() => setShowPicker(true)} style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ fontSize: 27, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>Colección {batchIndex + 1}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--faint)', lineHeight: 1, marginTop: 2 }}>/ {totalBatches}</div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--accent)', marginTop: 2 }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Shuffle toggle */}
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
          <SegToggle options={[{key:'A',label:'A'},{key:'B',label:'B'}]} value={variant} onChange={setVariant}/>
        </div>
      </div>

      {/* Filter badge */}
      {filterMode === 'unlearned' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--teal)', background: 'var(--teal-soft)', padding: '4px 12px', borderRadius: 99 }}>🎯 Solo no aprendidas</div>
          <button onClick={() => setFilterMode('all')} style={{ fontSize: 12, fontWeight: 800, color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>× Ver todas</button>
        </div>
      )}

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 8, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'var(--accent)', transition: 'width .5s cubic-bezier(.2,.8,.2,1)', width: pct }}/>
        </div>
        {word && isLearned(word.id) && (
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal)', background: 'var(--teal-soft)', padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap' }}>✓</div>
        )}
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dim)', whiteSpace: 'nowrap' }}>{cardNum} / {total}</div>
      </div>

      {/* Card stack */}
      {word && (
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1400 }}>
          <div style={{ position: 'absolute', width: '90%', height: '88%', borderRadius: 30, background: 'var(--surface)', opacity: 0.5, transform: 'translateY(14px) scale(0.94)', border: '1px solid var(--border)' }}/>
          <div
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
            style={{ position: 'relative', width: '100%', height: '92%', touchAction: 'none', cursor: 'grab', transform: cardWrapTransform, transition: cardTransition }}
          >
            <div style={{ position: 'absolute', top: 24, left: 22, zIndex: 5, padding: '8px 16px', borderRadius: 99, border: '3px solid var(--accent)', color: 'var(--accent)', fontWeight: 900, fontSize: 16, transform: 'rotate(-12deg)', letterSpacing: '0.04em', opacity: clamp01(dragX / 100) }}>YA LA SÉ ✓</div>
            <div style={{ position: 'absolute', top: 24, right: 22, zIndex: 5, padding: '8px 16px', borderRadius: 99, border: '3px solid var(--amber)', color: 'var(--amber)', fontWeight: 900, fontSize: 16, transform: 'rotate(12deg)', letterSpacing: '0.04em', opacity: clamp01(-dragX / 100) }}>REPASAR ↻</div>
            <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform .55s cubic-bezier(.2,.8,.25,1.1)', transform: flipTransform }}>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 30, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 24px 50px -24px var(--shadow)', overflow: 'hidden' }}>
                {variant === 'A'
                  ? <CardFrontA word={word} showPhonetic={showPhonetic} onSpeak={() => speakText(word.palabra, audioSpeed)}/>
                  : <CardFrontB word={word} cardNum={cardNum} showPhonetic={showPhonetic} onSpeak={() => speakText(word.palabra, audioSpeed)}/>}
              </div>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 30, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 24px 50px -24px var(--shadow)', overflow: 'hidden' }}>
                <CardBack word={word} showPhonetic={showPhonetic} onSpeakExample={() => speakText(word.ejemplo_en, audioSpeed)}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button onClick={() => decide(-1)} style={{ flex: 1, height: 58, borderRadius: 18, border: '2px solid var(--amber)', background: 'transparent', color: 'var(--amber)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 018-8 8 8 0 016 2.7L23 4M20 12a8 8 0 01-8 8 8 8 0 01-6-2.7L1 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 4v5h-5M1 20v-5h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Repasar
        </button>
        <button onClick={() => decide(1)} style={{ flex: 1, height: 58, borderRadius: 18, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Nunito', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 10px 24px -8px var(--accent)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Ya la sé
        </button>
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
          learned={sessionLearned}
          review={sessionReview}
          elapsed={sessionElapsed}
          total={total}
          filterMode={filterMode}
          onRepeat={handleRepeat}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
