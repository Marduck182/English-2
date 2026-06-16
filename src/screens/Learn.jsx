import { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { vocab } from '../data/vocab';

const BATCH_SIZE   = 50;
const totalBatches = Math.ceil(vocab.length / BATCH_SIZE);

function speakText(text, speed) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = speed;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

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
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border2)', alignSelf: 'center', margin: '10px 0 18px' }}/>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Aprender</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>Elige una colección</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 99, border: 'none', background: 'var(--surface2)', color: 'var(--dim)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
        </div>

        {/* Info */}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 14 }}>
          {vocab.length} palabras · {totalBatches} colecciones de {BATCH_SIZE}
        </div>

        {/* Grid */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {Array.from({ length: totalBatches }, (_, i) => {
              const active = i === current;
              const start  = i * BATCH_SIZE + 1;
              const end    = Math.min((i + 1) * BATCH_SIZE, vocab.length);
              return (
                <button
                  key={i}
                  onClick={() => { onSelect(i); onClose(); }}
                  style={{
                    height: 72, borderRadius: 16, border: active ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                    background: active ? 'var(--accent-soft)' : 'var(--surface)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 3,
                    transition: 'all .15s',
                  }}
                >
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

function CardFrontA({ word, showPhonetic, onSpeak }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 30, position: 'relative' }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', color: 'var(--faint)', textTransform: 'uppercase' }}>Palabra</div>
      <div style={{ fontSize: 'calc(54px * var(--scale))', fontWeight: 900, color: 'var(--text)', lineHeight: 1, textAlign: 'center', letterSpacing: '-0.02em' }}>{word.palabra}</div>
      {showPhonetic && word.fonetica && (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'calc(19px * var(--scale))', fontWeight: 500, color: 'var(--teal)', background: 'var(--teal-soft)', padding: '7px 16px', borderRadius: 10 }}>{word.fonetica}</div>
      )}
      <button onPointerDown={e => e.stopPropagation()} onClick={onSpeak} style={{
        marginTop: 6, width: 62, height: 62, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .15s',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
          <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
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
        <button onPointerDown={e => e.stopPropagation()} onClick={onSpeak} style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '11px 18px', borderRadius: 99,
          border: 'none', cursor: 'pointer', background: 'var(--accent-soft)', color: 'var(--accent)',
          fontFamily: 'Nunito', fontWeight: 800, fontSize: 14,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
            <path d="M15.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
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
      <button onPointerDown={e => e.stopPropagation()} onClick={onSpeakExample} style={{
        marginTop: 'auto', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 9,
        padding: '11px 18px', borderRadius: 99, border: 'none', cursor: 'pointer',
        background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
          <path d="M15.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Escuchar frase
      </button>
    </div>
  );
}

export default function Learn() {
  const { showPhonetic, audioSpeed } = useApp();
  const [batchIndex, setBatchIndex]   = useState(0);
  const [cardIndex, setCardIndex]     = useState(0);
  const [flipped, setFlipped]         = useState(false);
  const [variant, setVariant]         = useState('A');
  const [dragX, setDragX]             = useState(0);
  const [dragY, setDragY]             = useState(0);
  const [dragging, setDragging]       = useState(false);
  const [showPicker, setShowPicker]   = useState(false);

  const sxRef    = useRef(0);
  const syRef    = useRef(0);
  const movedRef = useRef(0);

  const batchWords = vocab.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
  const total      = batchWords.length;
  const idx        = cardIndex % total;
  const word       = batchWords[idx];
  const cardNum    = idx + 1;
  const pct        = ((idx + 1) / total * 100).toFixed(1) + '%';

  function changeBatch(newBatch) {
    setBatchIndex(newBatch);
    setCardIndex(0);
    setFlipped(false);
    setDragX(0);
    setDragY(0);
  }

  function onPointerDown(e) {
    sxRef.current = e.clientX; syRef.current = e.clientY; movedRef.current = 0;
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch(_) {}
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - sxRef.current;
    const dy = e.clientY - syRef.current;
    movedRef.current = Math.max(movedRef.current, Math.hypot(dx, dy));
    setDragX(dx); setDragY(dy * 0.25);
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragX) > 105) {
      decide(dragX > 0 ? 1 : -1);
    } else if (movedRef.current < 9) {
      setFlipped(f => !f); setDragX(0); setDragY(0);
    } else {
      setDragX(0); setDragY(0);
    }
  }

  function decide(dir) {
    setDragX(dir * 650); setDragY(-40);
    setTimeout(() => {
      setDragX(0); setDragY(0); setFlipped(false);
      setCardIndex(i => i + 1);
    }, 260);
  }

  const rot               = dragX * 0.045;
  const cardWrapTransform = `translate(${dragX}px, ${dragY}px) rotate(${rot}deg)`;
  const cardTransition    = dragging ? 'none' : 'transform .35s cubic-bezier(.2,.8,.2,1)';
  const flipTransform     = `rotateY(${flipped ? 180 : 0}deg)`;
  const clamp01           = v => Math.max(0, Math.min(1, v));

  return (
    <div className="screen-in" style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', padding: '8px 22px 14px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Aprender</div>
          <button
            onClick={() => setShowPicker(true)}
            style={{
              marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, background: 'none',
              border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <div style={{ fontSize: 27, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
              Colección {batchIndex + 1}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--faint)', lineHeight: 1, marginTop: 2 }}>
              / {totalBatches}
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--accent)', marginTop: 2 }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <SegToggle
          options={[{key:'A',label:'A'},{key:'B',label:'B'}]}
          value={variant}
          onChange={setVariant}
        />
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 8, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'var(--accent)', transition: 'width .5s cubic-bezier(.2,.8,.2,1)', width: pct }}/>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dim)', whiteSpace: 'nowrap' }}>{cardNum} / {total}</div>
      </div>

      {/* Card stack */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1400 }}>
        <div style={{ position: 'absolute', width: '90%', height: '88%', borderRadius: 30, background: 'var(--surface)', opacity: 0.5, transform: 'translateY(14px) scale(0.94)', border: '1px solid var(--border)' }}/>

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ position: 'relative', width: '100%', height: '92%', touchAction: 'none', cursor: 'grab', transform: cardWrapTransform, transition: cardTransition }}
        >
          <div style={{ position: 'absolute', top: 24, left: 22, zIndex: 5, padding: '8px 16px', borderRadius: 99, border: '3px solid var(--accent)', color: 'var(--accent)', fontWeight: 900, fontSize: 16, transform: 'rotate(-12deg)', letterSpacing: '0.04em', opacity: clamp01(dragX / 100) }}>YA LA SÉ ✓</div>
          <div style={{ position: 'absolute', top: 24, right: 22, zIndex: 5, padding: '8px 16px', borderRadius: 99, border: '3px solid var(--amber)', color: 'var(--amber)', fontWeight: 900, fontSize: 16, transform: 'rotate(12deg)', letterSpacing: '0.04em', opacity: clamp01(-dragX / 100) }}>REPASAR ↻</div>

          <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform .55s cubic-bezier(.2,.8,.25,1.1)', transform: flipTransform }}>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 30, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 24px 50px -24px var(--shadow)', overflow: 'hidden' }}>
              {variant === 'A'
                ? <CardFrontA word={word} showPhonetic={showPhonetic} onSpeak={() => speakText(word.palabra, audioSpeed)}/>
                : <CardFrontB word={word} cardNum={cardNum} showPhonetic={showPhonetic} onSpeak={() => speakText(word.palabra, audioSpeed)}/>
              }
            </div>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 30, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 24px 50px -24px var(--shadow)', overflow: 'hidden' }}>
              <CardBack word={word} showPhonetic={showPhonetic} onSpeakExample={() => speakText(word.ejemplo_en, audioSpeed)}/>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button onClick={() => decide(-1)} style={{ flex: 1, height: 58, borderRadius: 18, border: '2px solid var(--amber)', background: 'transparent', color: 'var(--amber)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform .15s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 12a8 8 0 018-8 8 8 0 016 2.7L23 4M20 12a8 8 0 01-8 8 8 8 0 01-6-2.7L1 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 4v5h-5M1 20v-5h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Repasar
        </button>
        <button onClick={() => decide(1)} style={{ flex: 1, height: 58, borderRadius: 18, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Nunito', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform .15s', boxShadow: '0 10px 24px -8px var(--accent)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ya la sé
        </button>
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
