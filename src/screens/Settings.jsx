import { useApp } from '../AppContext';

function Seg({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', padding: 4, borderRadius: 11 }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{ flex: 1, border: 'none', padding: '9px 0', borderRadius: 8, fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all .2s', color: value === o.key ? 'var(--accent-ink)' : 'var(--dim)', background: value === o.key ? 'var(--accent)' : 'transparent' }}>{o.label}</button>
      ))}
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width: 52, height: 30, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .25s', background: on ? 'var(--accent)' : 'var(--surface2)' }}>
      <span style={{ position: 'absolute', top: 3, left: 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'transform .25s cubic-bezier(.2,.8,.25,1.1)', transform: on ? 'translateX(22px)' : 'translateX(0)', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', display: 'block' }}/>
    </button>
  );
}

function Row({ label, sub, right, border = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: sub ? 'column' : 'row', alignItems: sub ? 'stretch' : 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: border ? '1px solid var(--border)' : 'none', gap: sub ? 8 : 0 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dim)' }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme, fontSize, setFontSize, showPhonetic, setPhonetic, audioSpeed, setSpeed, lang, setLang, groqApiKey, setGroqApiKey } = useApp();

  return (
    <div className="screen-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 22px 14px', overflowY: 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Ajustes</div>
        <div style={{ fontSize: 27, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, marginTop: 2 }}>Preferencias</div>
      </div>

      {/* Apariencia */}
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 10 }}>Apariencia</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '6px 16px', marginBottom: 22 }}>
        <Row label="Tema" sub=" " border right={
          <Seg
            options={[{key:'light',label:'Claro'},{key:'dark',label:'Oscuro'},{key:'auto',label:'Auto'}]}
            value={theme} onChange={setTheme}
          />
        }/>
        <Row label="Tamaño de fuente" sub=" " border={false} right={
          <Seg
            options={[{key:'S',label:'A−'},{key:'M',label:'A'},{key:'L',label:'A+'}]}
            value={fontSize} onChange={setFontSize}
          />
        }/>
      </div>

      {/* Aprendizaje */}
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 10 }}>Aprendizaje</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '6px 16px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Mostrar fonética</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dim)' }}>Guía de pronunciación bajo el texto</div>
          </div>
          <Toggle on={showPhonetic} onToggle={() => setPhonetic(p => !p)}/>
        </div>

        <Row label="Velocidad de audio" sub=" " border right={
          <Seg
            options={[{key:'0.75',label:'0.75×'},{key:'1',label:'1×'},{key:'1.25',label:'1.25×'}]}
            value={String(audioSpeed)} onChange={k => setSpeed(parseFloat(k))}
          />
        }/>
        <Row label="Idioma de interfaz" sub=" " border={false} right={
          <Seg
            options={[{key:'es',label:'Español'},{key:'en',label:'English'}]}
            value={lang} onChange={setLang}
          />
        }/>
      </div>

      {/* Integraciones */}
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 10 }}>Integraciones</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '6px 16px', marginBottom: 22 }}>
        <div style={{ padding: '14px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Groq API Key</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dim)', marginBottom: 10 }}>Necesario para el reconocimiento de voz en Pronunciación</div>
          <input
            type="password"
            value={groqApiKey}
            onChange={e => setGroqApiKey(e.target.value)}
            placeholder="gsk_..."
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border2)',
              background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Nunito',
              fontWeight: 700, fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {groqApiKey && (
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--teal)' }}>✓ API key guardada</div>
          )}
        </div>
      </div>

      {/* Datos */}
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 10 }}>Datos</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
        <button style={{ flex: 1, height: 50, borderRadius: 15, border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Importar datos</button>
        <button style={{ flex: 1, height: 50, borderRadius: 15, border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Exportar datos</button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', paddingBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
          {['#EF5350','#FFC83D','#66BB6A','#42A5F5','#AB47BC'].map(c => (
            <span key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }}/>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--faint)' }}>You Know · aprende inglés · v1.0</div>
      </div>
    </div>
  );
}
