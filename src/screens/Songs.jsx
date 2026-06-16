import { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { songs } from '../data/songs';

function fmt(s) {
  s = Math.max(0, Math.floor(s));
  const m  = Math.floor(s / 60);
  const ss = s % 60;
  return m + ':' + (ss < 10 ? '0' : '') + ss;
}

// ─── Song list ────────────────────────────────────────────────────────────────
function SongList({ onOpen }) {
  return (
    <div className="screen-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 22px 14px', overflowY: 'auto' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Canciones</div>
        <div style={{ fontSize: 27, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, marginTop: 2 }}>Aprende cantando</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button style={{ flex: 1, height: 46, borderRadius: 14, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Importar
        </button>
        <button style={{ flex: 1, height: 46, borderRadius: 14, border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Exportar todo
        </button>
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
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5))' }}/>
              <div style={{ position: 'absolute', bottom: 8, right: 8, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M6 4l14 8-14 8V4z"/></svg>
              </div>
              {s.imported && (
                <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 9px', borderRadius: 99, background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 9, fontWeight: 900, letterSpacing: '0.08em' }}>IMPORTADA</div>
              )}
            </div>
            <div style={{ padding: '11px 12px 13px' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dim)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.artist}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)' }}>{s.lyrics.length} líneas</span>
                <div style={{ display: 'flex', gap: 12, color: 'var(--faint)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
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
  const song     = songs[songIndex];
  const duration = song.lyrics[song.lyrics.length - 1].end + 3;

  const [playing,     setPlaying]     = useState(false);
  const [songTime,    setSongTime]    = useState(0);
  const [lyricMode,   setLyricMode]   = useState('auto');
  const [recordingTs, setRecordingTs] = useState(false);
  const [markLine,    setMarkLine]    = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (playing && lyricMode === 'auto') {
      timerRef.current = setInterval(() => {
        setSongTime(t => {
          const next = t + 0.1 * audioSpeed;
          if (next >= duration) { setPlaying(false); return duration; }
          return next;
        });
      }, 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, lyricMode, audioSpeed]);

  function activeIndex() {
    if (recordingTs || lyricMode === 'manual') return markLine;
    let idx = 0;
    for (let i = 0; i < song.lyrics.length; i++) {
      if (song.lyrics[i].start <= songTime) idx = i;
    }
    return idx;
  }

  function jumpLine(i) {
    if (lyricMode === 'manual') setMarkLine(i);
    else setSongTime(song.lyrics[i].start + 0.05);
  }

  function prevLine() { jumpLine(Math.max(0, activeIndex() - 1)); }
  function nextLine() { jumpLine(Math.min(song.lyrics.length - 1, activeIndex() + 1)); }

  function onSeek(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - r.left) / r.width;
    setSongTime(Math.max(0, Math.min(1, ratio)) * duration);
  }

  function startRecordTs() {
    setRecordingTs(true); setSongTime(0); setPlaying(true); setMarkLine(0); setLyricMode('auto');
  }

  function markNextLine() {
    const n    = song.lyrics.length;
    const next = markLine + 1;
    if (next >= n) { setRecordingTs(false); setPlaying(false); setMarkLine(n - 1); }
    else setMarkLine(next);
  }

  const act      = activeIndex();
  const songPct  = (songTime / duration * 100).toFixed(2) + '%';
  const LINE_H   = 78;

  return (
    <div className="screen-in" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Blurred bg */}
      <div style={{ position: 'absolute', inset: -40, backgroundImage: `url(https://i.ytimg.com/vi/${song.youtubeId}/hqdefault.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(34px) saturate(1.3)', transform: 'scale(1.2)', opacity: 0.55 }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,9,12,0.55) 0%, rgba(8,9,12,0.82) 55%, var(--bg) 100%)' }}/>

      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 22px 14px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{song.artist}</div>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.12)', padding: 4, borderRadius: 11 }}>
            {[['manual','Manual'],['auto','Auto']].map(([k,l]) => (
              <button key={k} onClick={() => { setLyricMode(k); if (k === 'manual') setPlaying(false); }} style={{ border: 'none', padding: '7px 11px', borderRadius: 8, fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, cursor: 'pointer', color: lyricMode === k ? 'var(--accent-ink)' : '#fff', background: lyricMode === k ? 'var(--accent)' : 'transparent' }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Recording banner */}
        {recordingTs && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,90,82,0.16)', border: '1px solid var(--red)', borderRadius: 14, padding: '11px 14px', marginBottom: 12 }}>
            <div className="pulse-dot" style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--red)' }}/>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: '#fff' }}>Grabando tiempos · línea {markLine + 1}</div>
          </div>
        )}

        {/* Lyrics */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', maskImage: 'linear-gradient(180deg, transparent, #000 18%, #000 78%, transparent)' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', display: 'flex', flexDirection: 'column', gap: 18, transform: `translateY(${-act * LINE_H - 30}px)`, transition: 'transform .5s cubic-bezier(.2,.8,.2,1)' }}>
            {song.lyrics.map((ln, i) => {
              const isActive  = i === act;
              const marking   = recordingTs && i === markLine;
              const isPast    = i < act;
              return (
                <div key={i} onClick={() => jumpLine(i)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontWeight: 900, lineHeight: 1.2, transition: 'all .4s', fontSize: isActive ? 27 : 19, color: marking ? 'var(--red)' : isActive ? (ln.chorus ? 'var(--teal)' : '#fff') : ln.chorus ? 'rgba(91,211,189,0.55)' : 'rgba(255,255,255,0.4)', opacity: isActive ? 1 : isPast ? 0.4 : 0.55, fontStyle: ln.chorus ? 'italic' : 'normal' }}>{ln.text}</div>
                  {showPhonetic && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 400, color: 'var(--teal)', marginTop: 4, transition: 'opacity .4s', opacity: isActive ? 0.9 : 0.4 }}>{ln.phonetic}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div style={{ flex: '0 0 auto' }}>
          {/* Seek */}
          <div onClick={onSeek} style={{ height: 22, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.18)', borderRadius: 99, position: 'relative' }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'var(--accent)', width: songPct, transition: 'width .12s linear' }}/>
              <div style={{ position: 'absolute', top: '50%', left: songPct, transform: 'translate(-50%,-50%)', width: 15, height: 15, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}/>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0 14px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
            <span>{fmt(songTime)}</span><span>{fmt(duration)}</span>
          </div>

          {/* Transport */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginBottom: 14 }}>
            <button onClick={prevLine} style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5v14l-9-7 9-7zM7 5v14H4V5h3z"/></svg>
            </button>
            <button onClick={() => setPlaying(p => !p)} style={{ width: 72, height: 72, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px -8px var(--accent)' }}>
              {playing
                ? <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>
                : <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l14 8-14 8V4z"/></svg>
              }
            </button>
            <button onClick={nextLine} style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v14l9-7-9-7zm12 0v14h3V5h-3z"/></svg>
            </button>
          </div>

          {/* Manual nav */}
          {lyricMode === 'manual' && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button onClick={prevLine} style={{ flex: 1, height: 50, borderRadius: 15, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>← Anterior</button>
              <button onClick={nextLine} style={{ flex: 1, height: 50, borderRadius: 15, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Siguiente →</button>
            </div>
          )}

          {/* Record timestamps */}
          {recordingTs
            ? <button onClick={markNextLine} style={{ width: '100%', height: 58, borderRadius: 17, border: 'none', background: 'var(--red)', color: '#fff', fontFamily: 'Nunito', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2.2"/><circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2.2"/></svg>
                Marcar siguiente línea
              </button>
            : <button onClick={startRecordTs} style={{ width: '100%', height: 48, borderRadius: 15, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }}/>
                Grabar tiempos de la letra
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Songs root ───────────────────────────────────────────────────────────────
export default function Songs() {
  const [view, setView]       = useState('list');
  const [songIndex, setSongIdx] = useState(0);

  if (view === 'player') {
    return <Player songIndex={songIndex} onBack={() => setView('list')}/>;
  }
  return <SongList onOpen={i => { setSongIdx(i); setView('player'); }}/>;
}
