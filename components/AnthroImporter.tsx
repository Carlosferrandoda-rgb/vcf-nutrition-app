'use client';

import { useRef, useState } from 'react';

type JugadorPreview = {
  _nombre_completo: string;
  nombre: string;
  apellidos: string;
  fecha_ultima_medicion: string | null;
  fecha_nacimiento: string | null;
  altura_cm: number | null;
  peso_kg: number | null;
  porcentaje_grasa_faulkner: number | null;
  porcentaje_grasa_yuhasz: number | null;
  masa_magra_kg: number | null;
  peso_muscular: number | null;
  peso_magro: number | null;
  peso_oseo: number | null;
  peso_residual: number | null;
  suma_6_pliegues: number | null;
  suma_8_pliegues: number | null;
  endomorfia: number | null;
  mesomorfia: number | null;
  ectomorfia: number | null;
};

type Estado = 'idle' | 'cargando' | 'preview' | 'importando' | 'done' | 'error';

export default function AnthroImporter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>('idle');
  const [jugadores, setJugadores] = useState<JugadorPreview[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [resultados, setResultados] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo(file);
    setEstado('cargando');
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('modo', 'preview');
    try {
      const res = await fetch('/api/import-anthro', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el archivo');
      setJugadores(data.jugadores);
      setSeleccionados(new Set(data.jugadores.map((j: JugadorPreview) => j._nombre_completo)));
      setEstado('preview');
    } catch (err: any) {
      setError(err.message);
      setEstado('error');
    }
  }

  function toggleSeleccion(nombre: string) {
    setSeleccionados(prev => { const next = new Set(prev); next.has(nombre) ? next.delete(nombre) : next.add(nombre); return next; });
  }

  function toggleTodos() {
    if (seleccionados.size === jugadores.length) setSeleccionados(new Set());
    else setSeleccionados(new Set(jugadores.map(j => j._nombre_completo)));
  }

  async function handleImportar() {
    if (!archivo || seleccionados.size === 0) return;
    setEstado('importando');
    const fd = new FormData();
    fd.append('file', archivo);
    fd.append('modo', 'importar');
    fd.append('seleccionados', JSON.stringify(Array.from(seleccionados)));
    try {
      const res = await fetch('/api/import-anthro', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultados(data.resultados);
      setEstado('done');
    } catch (err: any) { setError(err.message); setEstado('error'); }
  }

  function resetear() {
    setEstado('idle'); setJugadores([]); setSeleccionados(new Set()); setResultados([]); setError(''); setArchivo(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const fmt = (v: number | null, dec = 1) => v != null ? v.toFixed(dec) : '—';

  return (
    <div className="card stack">
      <div className="between">
        <div>
          <h3 style={{ margin: 0 }}>Importar antropometrias</h3>
          <p className="muted small">Excel del club - Ultima medicion por jugador</p>
        </div>
        {estado !== 'idle' && <button className="button secondary" onClick={resetear}>Nuevo archivo</button>}
      </div>
      {estado === 'idle' && (
        <label style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'32px 16px',border:'2px dashed var(--border)',borderRadius:8,cursor:'pointer' }}>
          <span style={{ fontSize:32 }}>📊</span>
          <span className="muted small">Arrastra tu Excel de antropometrias o haz clic</span>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={handleFile} />
        </label>
      )}
      {estado === 'cargando' && <div style={{ textAlign:'center',padding:'32px 0' }}><p className="muted">Procesando Excel...</p></div>}
      {estado === 'error' && <div style={{ padding:12,background:'#fee2e2',borderRadius:8,color:'#991b1b' }}>{error}</div>}
      {estado === 'preview' && jugadores.length > 0 && (
        <>
          <div className="between">
            <p className="muted small">{jugadores.length} jugadores detectados - {seleccionados.size} seleccionados</p>
            <button className="button secondary" onClick={toggleTodos} style={{ padding:'4px 12px',fontSize:13 }}>
              {seleccionados.size === jugadores.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead><tr style={{ borderBottom:'1px solid var(--border)' }}>
                <th style={{ padding:'8px 6px',width:32 }}></th>
                <th style={{ padding:'8px 6px',textAlign:'left' }}>Jugador</th>
                <th style={{ padding:'8px 6px',textAlign:'center' }}>Fecha</th>
                <th style={{ padding:'8px 6px',textAlign:'center' }}>Altura</th>
                <th style={{ padding:'8px 6px',textAlign:'center' }}>Peso</th>
                <th style={{ padding:'8px 6px',textAlign:'center' }}>% Grasa</th>
                <th style={{ padding:'8px 6px',textAlign:'center' }}>Masa magra</th>
                <th style={{ padding:'8px 6px',textAlign:'center' }}>S6 pliegues</th>
                <th style={{ padding:'8px 6px',textAlign:'center' }}>Somatotipo</th>
              </tr></thead>
              <tbody>{jugadores.map(j => {
                const sel = seleccionados.has(j._nombre_completo);
                return (
                  <tr key={j._nombre_completo} onClick={() => toggleSeleccion(j._nombre_completo)}
                    style={{ borderBottom:'1px solid var(--border)',background:sel?'var(--bg2)':'transparent',cursor:'pointer',opacity:sel?1:0.45 }}>
                    <td style={{ padding:'8px 6px',textAlign:'center' }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleSeleccion(j._nombre_completo)} onClick={e=>e.stopPropagation()} />
                    </td>
                    <td style={{ padding:'8px 6px',fontWeight:500 }}>{j._nombre_completo}</td>
                    <td style={{ padding:'8px 6px',textAlign:'center',color:'var(--muted)' }}>{j.fecha_ultima_medicion ?? '-'}</td>
                    <td style={{ padding:'8px 6px',textAlign:'center' }}>{j.altura_cm ? j.altura_cm+' cm' : '-'}</td>
                    <td style={{ padding:'8px 6px',textAlign:'center' }}>{j.peso_kg ? fmt(j.peso_kg)+' kg' : '-'}</td>
                    <td style={{ padding:'8px 6px',textAlign:'center' }}>
                      <span style={{ padding:'2px 8px',borderRadius:99,fontSize:12,
                        background:(j.porcentaje_grasa_faulkner??0)>14?'#fee2e2':(j.porcentaje_grasa_faulkner??0)>11?'#fef9c3':'#dcfce7',
                        color:(j.porcentaje_grasa_faulkner??0)>14?'#991b1b':(j.porcentaje_grasa_faulkner??0)>11?'#854d0e':'#166534' }}>
                        {fmt(j.porcentaje_grasa_faulkner)}%
                      </span>
                    </td>
                    <td style={{ padding:'8px 6px',textAlign:'center' }}>{j.masa_magra_kg ? fmt(j.masa_magra_kg)+' kg' : '-'}</td>
                    <td style={{ padding:'8px 6px',textAlign:'center' }}>{fmt(j.suma_6_pliegues)} mm</td>
                    <td style={{ padding:'8px 6px',textAlign:'center',color:'var(--muted)',fontSize:12 }}>
                      {j.endomorfia!=null?fmt(j.endomorfia)+'-'+fmt(j.mesomorfia)+'-'+fmt(j.ectomorfia):'-'}
                    </td>
                  </tr>);
              })}</tbody>
            </table>
          </div>
          <div className="flex" style={{ justifyContent:'flex-end',gap:8,paddingTop:8 }}>
            <button className="button" onClick={handleImportar} disabled={seleccionados.size===0}>
              Importar {seleccionados.size} jugador{seleccionados.size!==1?'es':''}
            </button>
          </div>
        </>
      )}
      {estado === 'importando' && <div style={{ textAlign:'center',padding:'32px 0' }}><p className="muted">Actualizando en Supabase...</p></div>}
      {estado === 'done' && (
        <div className="stack" style={{ gap:8 }}>
          <p style={{ fontWeight:500,color:'#166534' }}>Importacion completada - {resultados.filter(r=>!r.error).length} jugadores actualizados</p>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead><tr style={{ borderBottom:'1px solid var(--border)' }}>
              <th style={{ padding:'6px 8px',textAlign:'left' }}>Jugador</th>
              <th style={{ padding:'6px 8px',textAlign:'center' }}>Accion</th>
              <th style={{ padding:'6px 8px',textAlign:'left' }}>Estado</th>
            </tr></thead>
            <tbody>{resultados.map((r,i) => (
              <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                <td style={{ padding:'6px 8px' }}>{r.nombre}</td>
                <td style={{ padding:'6px 8px',textAlign:'center' }}>
                  <span style={{ padding:'2px 8px',borderRadius:99,fontSize:12,background:r.accion==='creado'?'#dbeafe':'#dcfce7',color:r.accion==='creado'?'#1e40af':'#166534' }}>{r.accion}</span>
                </td>
                <td style={{ padding:'6px 8px',color:r.error?'#991b1b':'#166534',fontSize:12 }}>{r.error??'OK'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
