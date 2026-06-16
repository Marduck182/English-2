import { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { songs } from '../data/songs';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}

// ─── Song list ────────────────────────────────────────────────────────────────
function SongList({ onOpen }) {
  return (
    <div className="screen-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 22px 14px', overflowY: 'auto' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Canciones</div>
        <div style={{ fontSize: 27, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, marginTop: 2 }}>Aprende cantando</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {songs.map((s, i) => (
          <div key={s.id} onClick={() => onOpen(i)} style={{ cursor: 'pointer', borderRadius: 18, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', transition: 'transform .18s' }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', background: 'var(--surface2)' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(https://i.ytimg.com/vi/${s.youtubeId}/hqdefault.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,0.5))' }}/>
              <div style={{ position: 'absolute', bottom: 8, right: 8, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M6 4l14 8-14 8V4z"/></svg>
              </div>
              {s.imported && <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 9px', borderRadius: 99, background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 9, fontWeight: 900, letterSpacing: '0.08em' }}>IMPORTADA</div>}
            </div>
            <div style={{ padding: '11px 12px 13px' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dim)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.artist}</div>
              <div style={{ marginTop: 8 }}><span style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)' }}>{s.lyrics.length} líneas</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Karaoke Player ───────────────────────────────────────────────────────────
function Player({ songIndex, onBack }) {
  const { showPhonetic, audioSpeed } = useApp();
  const song = songs[songIndex];

  // Custom video IDs override — persisted per song in localStorage
  const storageKey = `yt-override-${song.id}`;
  const [ytId, setYtId] = useState(
    () => localStorage.getItem(storageKey) || song.youtubeId
  );
  const [showFix,   setShowFix]   = useState(false);
  const [urlInput,  setUrlInput]  = useState('');
  const [urlError,  setUrlError]  = useState('');

  const iframeId = `yt-${song.id}`;

  const embedSrc =
    `https://www.youtube.com/embed/${ytId}` +
    `?enablejsapi=1&controls=1&rel=0&modestbranding=1&playsinline=1` +
    `&origin=${encodeURIComponent(window.location.origin)}`;

  const { isReady, isPlaying, currentTime, duration, playerError, seekTo, togglePlay, setRate } =
    useYouTubePlayer(iframeId);

  const [lyricMode,   setLyricMode]   = useState('auto');
  const [markLine,    setMarkLine]    = useState(0);
  const [recordingTs, setRecordingTs] = useState(false);
  const activeRef = useRef(null);

  // Show fix modal when YouTube reports embedding not allowed (101 / 150)
  useEffect(() => {
    if (playerError === 101 || playerError === 150) setShowFix(true);
  }, [playerError]);

  function extractId(raw) {
    const s = raw.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    const m = s.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function applyNewUrl() {
    const id = extractId(urlInput);
    if (!id) { setUrlError('URL o ID no válido'); return; }
    localStorage.setItem(storageKey, id);
    setYtId(id);
    setShowFix(false);
    setUrlInput('');
    setUrlError('');
  }

  // Sync playback rate
  useEffect(() => { if (isReady) setRate(audioSpeed); }, [audioSpeed, isReady]);

  // Find active lyric from currentTime
  let autoIdx = 0;
  for (let i = song.lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= song.lyrics[i].start) { autoIdx = i; break; }
  }
  const act = (lyricMode === 'manual' || recordingTs) ? markLine : autoIdx;

  // Scroll active line into view
  useEffect(() => {
    const id = setTimeout(() => activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    return () => clearTimeout(id);
  }, [act]);

  function jumpLine(i) {
    if (lyricMode === 'manual') setMarkLine(i);
    else seekTo(song.lyrics[i].start + 0.05);
  }
  const prevLine = () => jumpLine(Math.max(0, act - 1));
  const nextLine = () => jumpLine(Math.min(song.lyrics.length - 1, act + 1));

  function onSeekBar(e) {
    if (!duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration);
  }

  function startRecordTs() {
    setRecordingTs(true); setMarkLine(0); setLyricMode('auto');
    seekTo(0);
    if (!isPlaying) togglePlay();
  }
  function markNextLine() {
    const n = song.lyrics.length, next = markLine + 1;
    if (next >= n) { setRecordingTs(false); setMarkLine(n - 1); }
    else setMarkLine(next);
  }

  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100).toFixed(2) + '%' : '0%';

  return (
    <div className="screen-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#08090c' }}>

      {/* ── Top bar ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 8px', background: 'rgba(8,9,12,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{song.artist}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.08)', padding: 3, borderRadius: 10 }}>
            {[['auto','Auto'],['manual','Manual']].map(([k,l]) => (
              <button key={k} onClick={() => setLyricMode(k)} style={{ border: 'none', padding: '6px 10px', borderRadius: 8, fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, cursor: 'pointer', color: lyricMode === k ? 'var(--accent-ink)' : 'rgba(255,255,255,0.6)', background: lyricMode === k ? 'var(--accent)' : 'transparent' }}>{l}</button>
            ))}
          </div>
          {/* Cambiar video button */}
          <button onClick={() => setShowFix(true)} title="Cambiar video de YouTube" style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>

      {/* ── YouTube iframe ── explicit height so Android doesn't collapse it ── */}
      <div style={{ flexShrink: 0, width: '100%', height: 210, background: '#000' }}>
        <iframe
          id={iframeId}
          src={embedSrc}
          width="100%"
          height="210"
          frameBorder="0"
          title="YouTube video player"
          style={{ display: 'block', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      {/* ── Mini transport bar ── */}
      <div style={{ flexShrink: 0, padding: '8px 16px 6px', background: 'rgba(8,9,12,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Seek bar */}
        <div onClick={onSeekBar} style={{ height: 18, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 99, position: 'relative' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'var(--teal)', width: pct, transition: 'width .15s linear' }}/>
            <div style={{ position: 'absolute', top: '50%', left: pct, transform: 'translate(-50%,-50%)', width: 11, height: 11, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.5)' }}/>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
          <span>{fmt(currentTime)}</span>
          <button onClick={togglePlay} style={{ border: 'none', background: 'none', color: isReady ? 'var(--teal)' : 'rgba(255,255,255,0.2)', cursor: isReady ? 'pointer' : 'default', padding: '0 8px', fontFamily: 'Nunito', fontWeight: 800, fontSize: 11 }}>
            {!isReady ? '...' : isPlaying ? '⏸ Pausa' : '▶ Play'}
          </button>
          <span>{fmt(duration)}</span>
        </div>

        {/* Recording banner */}
        {recordingTs && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,90,82,0.12)', border: '1px solid var(--red)', borderRadius: 10, padding: '7px 12px', marginTop: 6 }}>
            <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }}/>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Grabando · línea {markLine + 1}/{song.lyrics.length}</div>
          </div>
        )}
      </div>

      {/* ── Lyrics (scrollable) ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '6px 0 40px' }}>
          {song.lyrics.map((ln, i) => {
            const isActive = i === act;
            const isPast   = i < act;
            const isChorus = ln.chorus;
            return (
              <div
                key={i}
                ref={isActive ? activeRef : null}
                onClick={() => jumpLine(i)}
                style={{
                  padding: isActive && !isChorus ? '13px 22px 12px' : '5px 22px',
                  margin: '1px 0',
                  borderRadius: 14,
                  background: isActive ? 'var(--teal-soft)' : 'transparent',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'background .25s ease, padding .25s cubic-bezier(0.23,1,0.32,1)',
                }}
              >
                <div style={{
                  fontWeight: isActive && !isChorus ? 900 : 400,
                  lineHeight: 1.4,
                  fontSize: isChorus ? (isActive ? '0.85rem' : '0.74rem') : (isActive ? '1.2rem' : '0.9rem'),
                  fontStyle: isChorus ? 'italic' : 'normal',
                  color: isChorus
                    ? (isActive ? '#64748b' : '#1e2035')
                    : (isActive ? '#fff' : isPast ? '#2a2d4a' : '#1e2035'),
                  transition: 'color .25s ease, font-size .25s cubic-bezier(0.23,1,0.32,1)',
                }}>{ln.text}</div>
                {showPhonetic && ln.phonetic && !isChorus && (
                  <div style={{
                    marginTop: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: isActive ? '0.8rem' : '0.73rem',
                    fontStyle: 'italic',
                    color: isActive ? 'var(--teal)' : '#161826',
                    transition: 'color .25s ease',
                  }}>{ln.phonetic}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ flexShrink: 0, padding: '8px 16px 12px', background: 'rgba(8,9,12,0.9)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {recordingTs ? (
          <button onClick={markNextLine} style={{ width: '100%', height: 50, borderRadius: 15, border: 'none', background: 'var(--red)', color: '#fff', fontFamily: 'Nunito', fontWeight: 900, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg>
            Marcar siguiente línea
          </button>
        ) : lyricMode === 'manual' ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={prevLine} disabled={act === 0} style={{ flex: 1, height: 46, borderRadius: 13, border: `1px solid ${act === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)'}`, background: 'transparent', color: act === 0 ? '#1e2035' : 'rgba(255,255,255,0.7)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: act === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Anterior
            </button>
            <button onClick={nextLine} disabled={act === song.lyrics.length - 1} style={{ flex: 1, height: 46, borderRadius: 13, border: `1px solid ${act === song.lyrics.length - 1 ? 'rgba(255,255,255,0.05)' : 'var(--teal)'}`, background: act === song.lyrics.length - 1 ? 'transparent' : 'var(--teal-soft)', color: act === song.lyrics.length - 1 ? '#1e2035' : 'var(--teal)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: act === song.lyrics.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Siguiente
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        ) : (
          <button onClick={startRecordTs} style={{ width: '100%', height: 44, borderRadius: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }}/>
            Grabar tiempos de la letra
          </button>
        )}
      </div>

      {/* ── Cambiar video modal ── */}
      {showFix && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(7,8,14,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#0e0f1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '28px 22px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎬</div>
              <div style={{ color: '#f1f3ff', fontWeight: 800, fontSize: '1rem', marginBottom: 6 }}>Video no disponible</div>
              <div style={{ color: '#4b5563', fontSize: '0.82rem', lineHeight: 1.5 }}>
                Este video no permite reproducirse aquí.<br/>
                Busca otra versión en YouTube y pega la URL:
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
                onKeyDown={e => e.key === 'Enter' && applyNewUrl()}
                placeholder="https://youtube.com/watch?v=..."
                autoFocus
                style={{ background: '#13131f', border: `1px solid ${urlError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '11px 14px', color: '#f1f3ff', fontSize: '0.82rem', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'Nunito' }}
              />
              {urlError && <div style={{ color: '#f87171', fontSize: '0.75rem' }}>{urlError}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowFix(false); setUrlInput(''); setUrlError(''); }} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#4b5563', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 700 }}>
                Cancelar
              </button>
              <button onClick={applyNewUrl} style={{ flex: 2, padding: '11px', borderRadius: 12, background: 'var(--teal-soft)', border: '1px solid var(--teal)', color: 'var(--teal)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito' }}>
                Actualizar video
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Songs root ───────────────────────────────────────────────────────────────
export default function Songs() {
  const [view, setView]         = useState('list');
  const [songIndex, setSongIdx] = useState(0);

  if (view === 'player') {
    return <Player key={songIndex} songIndex={songIndex} onBack={() => setView('list')}/>;
  }
  return <SongList onOpen={i => { setSongIdx(i); setView('player'); }}/>;
}
