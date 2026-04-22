'use client';
import { useState, useRef } from 'react';

type Parametro = { nombre: string; valor: number; unidad: string; rango_min: number; rango_max: number; fuera_rango: boolean };
type Analitica = { id: number; fecha_extraccion: string; fecha_subida: string; pdf_nombre: string; parametros: Parametro[] };

function Semaforo({ p }: { p: Parametro }) {
  const pct = p.rango_max > p.rango_min ? (p.valor - p.rango_min) / (p.rango_max - p.rango_min) * 100 : 50;
  const color = p.fuera_rango ? (p.valor > p.rango_max ? '#ef4444' : '#f59e0b') : '#22c55e';
  const label = p.fuera_rango ? (p.valor > p.rango_max ? 'Alto' : 'Bajo') : 'Normal';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.nombre}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Rango: {p.rango_min} - {p.rango_max} {p.unidad}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ fontSize: 15, color }}>{p.valor}</strong>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.unidad}</span>
        <span style={{ padding: '2px 8px', borderRadius: 99, background: color + '20', color, fontSize: 11, fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  );
}

export default function AnaliticasTab({ jugadorId, analiticasIniciales }: { jugadorId: number; analiticasIniciales: Analitica[] }) {
  const [analiticas, setAnaliticas] = useState<Analitica[]>(analiticasIniciales);
  const [selected, setSelected] = useState<Analitica | null>(analiticasIniciales[0] || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fecha, setFecha] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const GRUPOS: Record<string, string[]> = {
    'Hemograma': ['San-Leucocitos','San-Hematies','San-Hemoglobina','San-Hematocrito','San-Volumen Corp','San-Hb. Corpuscular','San-Plaquetas','San-Volumen plaquetar'],
    'Formula Leucocitaria': ['Lks-Segmentados','Lks-Basofilos','Lks-Eosinofilos','Lks-Linfocitos','Lks-Monocitos'],
    'Bioquimica': ['Glu','Cre','Uri','Col','Tri','HDL','LDL','Got','Gpt','Ggt','Fer','Iron','Transf','Vit'],
    'Otros': [],
  };

  function agrupar(params: Parametro[]) {
    const grupos: Record<string, Parametro[]> = { 'Hemograma': [], 'Formula Leucocitaria': [], 'Bioquimica': [], 'Otros': [] };
    params.forEach(p => {
      let asignado = false;
      for (const [grupo, prefijos] of Object.entries(GRUPOS)) {
        if (prefijos.some(pre => p.nombre.includes(pre))) { grupos[grupo].push(p); asignado = true; break; }
      }
      if (!asignado) grupos['Otros'].push(p);
    });
    return grupos;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('jugador_id', String(jugadorId));
      fd.append('fecha_extraccion', fecha);
      const res = await fetch('/api/upload-analitica', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnaliticas(prev => [data.analitica, ...prev]);
      setSelected(data.analitica);
    } catch(e: any) { setError(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  const grupos = selected ? agrupar(selected.parametros) : {};
  const totalFuera = selected ? selected.parametros.filter(p => p.fuera_rango).length : 0;

  return (
    <div className='stack'>
      <div className='card stack'>
        <div className='between'>
          <h3 style={{ margin: 0 }}>Analíticas de sangre</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type='date' value={fecha} onChange={e => setFecha(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 13 }} />
            <label style={{ padding: '6px 14px', borderRadius: 6, background: uploading ? 'var(--border)' : 'var(--fg)', color: uploading ? 'var(--muted)' : 'var(--bg)', fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer' }}>
              {uploading ? 'Procesando PDF...' : 'Subir PDF'}
              <input ref={fileRef} type='file' accept='.pdf' onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>
        {error && <div style={{ padding: 10, background: '#fee2e2', borderRadius: 6, color: '#991b1b', fontSize: 13 }}>{error}</div>}
        {uploading && <div style={{ padding: 10, background: '#dbeafe', borderRadius: 6, color: '#1e40af', fontSize: 13 }}>Extrayendo parámetros con IA... puede tardar unos segundos.</div>}
      </div>

      {analiticas.length === 0 ? (
        <div className='card'><p className='muted'>No hay analíticas. Sube el PDF del laboratorio.</p></div>
      ) : (
        <div className='grid grid-2'>
          <div className='card stack'>
            <h4 style={{ margin: 0 }}>Analíticas disponibles</h4>
            {analiticas.map(a => (
              <button key={a.id} onClick={() => setSelected(a)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid ' + (selected?.id === a.id ? 'var(--fg)' : 'var(--border)'), background: selected?.id === a.id ? 'var(--fg)' : 'transparent', color: selected?.id === a.id ? 'var(--bg)' : 'var(--fg)', textAlign: 'left', cursor: 'pointer', fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{a.fecha_extraccion || 'Sin fecha'}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{a.pdf_nombre} · {a.parametros?.length || 0} parámetros</div>
              </button>
            ))}
          </div>

          {selected && (
            <div className='stack'>
              <div className='grid grid-3'>
                <div className='card'><span className='muted small'>Total parámetros</span><strong style={{ display:'block', fontSize:22 }}>{selected.parametros.length}</strong></div>
                <div className='card'><span className='muted small'>Fuera de rango</span><strong style={{ display:'block', fontSize:22, color: totalFuera > 0 ? '#ef4444' : '#22c55e' }}>{totalFuera}</strong></div>
                <div className='card'><span className='muted small'>Fecha extracción</span><strong style={{ display:'block', fontSize:16 }}>{selected.fecha_extraccion || '-'}</strong></div>
              </div>
              {Object.entries(grupos).map(([grupo, params]) => params.length > 0 && (
                <div key={grupo} className='card stack'>
                  <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)' }}>{grupo}</h4>
                  {params.map(p => <Semaforo key={p.nombre} p={p} />)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}