'use client';
import PlanIATab from './PlanIATab';

import { useState } from 'react';

type Jugador = Record<string, any>;
const PESTANAS = ['Resumen', 'Plan IA', 'Hidratación', 'Suplementación', 'Protocolos'] as const;
type Pestana = typeof PESTANAS[number];

function CampoEditable({ label, campo, valor, jugadorId, tipo = 'textarea', opciones }: {
  label: string; campo: string; valor: string; jugadorId: number;
  tipo?: 'textarea' | 'select' | 'text'; opciones?: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(valor || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch('/api/update-player', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: jugadorId, field: campo, value: val }) });
    setSaving(false); setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className='card stack'>
      <div className='between'>
        <span className='muted small'>{label}</span>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {saved && <span style={{ color:'#166534', fontSize:12 }}>✓</span>}
          {!editing ? (
            <button className='button secondary' onClick={() => setEditing(true)} style={{ padding:'2px 10px', fontSize:12 }}>Editar</button>
          ) : (
            <>
              <button className='button secondary' onClick={() => setEditing(false)} style={{ padding:'2px 10px', fontSize:12 }}>Cancelar</button>
              <button className='button' onClick={save} disabled={saving} style={{ padding:'2px 10px', fontSize:12 }}>{saving ? '...' : 'Guardar'}</button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        tipo === 'select' ? (
          <select value={val} onChange={e => setVal(e.target.value)}
            style={{ padding:'6px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--fg)', fontSize:13 }}>
            {opciones?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : tipo === 'text' ? (
          <input value={val} onChange={e => setVal(e.target.value)}
            style={{ padding:'6px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--fg)', fontSize:13, width:'100%', boxSizing:'border-box' }} />
        ) : (
          <textarea value={val} onChange={e => setVal(e.target.value)} rows={3}
            style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--fg)', fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
        )
      ) : (
        <p style={{ margin:0, fontSize:13, color: val ? 'var(--fg)' : 'var(--muted)' }}>{val || 'Sin especificar'}</p>
      )}
    </div>
  );
}

function EditableSection({ title, defaultValue, onSave }: { title: string; defaultValue: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function handleSave() {
    setSaving(true); await onSave(value); setSaving(false);
    setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className='card stack'>
      <div className='between'>
        <h3 style={{ margin:0 }}>{title}</h3>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {saved && <span style={{ color:'#166534', fontSize:13 }}>✓ Guardado</span>}
          {!editing ? (
            <button className='button secondary' onClick={() => setEditing(true)} style={{ padding:'4px 12px', fontSize:13 }}>Editar</button>
          ) : (
            <>
              <button className='button secondary' onClick={() => setEditing(false)} style={{ padding:'4px 12px', fontSize:13 }}>Cancelar</button>
              <button className='button' onClick={handleSave} disabled={saving} style={{ padding:'4px 12px', fontSize:13 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea value={value} onChange={e => setValue(e.target.value)}
          style={{ width:'100%', minHeight:240, padding:12, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--fg)', fontSize:13, lineHeight:1.6, resize:'vertical', boxSizing:'border-box' }} />
      ) : (
        <div style={{ whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.7 }}>
          {value || 'Sin notas. Haz clic en Editar para personalizar.'}
        </div>
      )}
    </div>
  );
}

export default function PlayerTabs({ jugador }: { jugador: Jugador }) {
  const [tab, setTab] = useState<Pestana>('Resumen');
  const [contexto, setContexto] = useState('semana_normal');
  const [plan, setPlan] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [errorPlan, setErrorPlan] = useState('');

  const CONTEXTOS = [
    { value: 'semana_normal', label: 'Semana normal de entrenamiento' },
    { value: 'semana_partido', label: 'Semana con partido oficial' },
    { value: 'dia_partido', label: 'Día de partido' },
    { value: 'viaje', label: 'Viaje / desplazamiento' },
    { value: 'lesion', label: 'Lesión / inactividad' },
    { value: 'vacaciones', label: 'Vacaciones / fuera de temporada' },
    { value: 'pretemporada', label: 'Pretemporada (alta carga)' },
  ];

  async function generarPlan() {
    setLoadingPlan(true); setErrorPlan(''); setPlan('');
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador, contexto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setPlan(data.plan);
    } catch (e: any) { setErrorPlan(e.message); }
    finally { setLoadingPlan(false); }
  }

  async function saveField(field: string, value: string) {
    await fetch('/api/update-player', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: jugador.id, field, value }) });
  }

  const peso = Number(jugador.peso_kg || 0);
  const aguaBase = peso ? Math.round(peso * 40) : 0;
  const aguaEntreno = peso ? Math.round(peso * 6) : 0;
  const aguaPartido = peso ? Math.round(peso * 10) : 0;
  const cafMin = peso ? Math.round(peso * 3) : 200;
  const cafMax = peso ? Math.round(peso * 6) : 400;

  const hidDef = ['HIDRATACION - '+jugador.nombre+' '+jugador.apellidos,'','Descanso: '+aguaBase+' ml | Entreno: '+(aguaBase+aguaEntreno)+' ml | Partido: '+(aguaBase+aguaPartido)+' ml','','TIMING:','- Al despertar: 500 ml','- Pre-entreno: 500 ml + electrolitos','- Durante entreno: 150-200 ml / 15 min','- Post-entreno: 150% perdida','- Con comidas: 300 ml','','NOTAS:',''].join('\n');
  const supDef = ['SUPLEMENTACION - '+jugador.nombre+' '+jugador.apellidos,'','EVIDENCIA A:','- Creatina: 3-5 g/dia post-entreno','- Cafeina: '+cafMin+'-'+cafMax+' mg x 60 min pre-partido','- Beta-alanina: 3.2-6.4 g/dia','','MICRONUTRIENTES:','- Vitamina D3: 2000-4000 UI/dia','- Omega-3: 2-4 g EPA+DHA','- Magnesio: 300-400 mg noche','','NOTAS ANALITICA:',''].join('\n');
  const protDef = ['PROTOCOLO PREPARTIDO - '+jugador.nombre+' '+jugador.apellidos,'','-3/-4h | COMIDA PRINCIPAL:','- CHO: arroz/pasta/patata','- Proteina: 100-150g','','-90 min | SNACK: platano o gel','','-60 min | CAFEINA: '+cafMin+'-'+cafMax+' mg','','MEDIO TIEMPO: 300-500 ml isotonica','','POST +30min: proteina + CHO rapidos','','NOTAS:',''].join('\n');

  const NUM_COMIDAS = ['3','4','5','6'].map(n => ({ value: n, label: n + ' comidas' }));

  return (
    <div className='stack'>
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--border)', marginBottom:8 }}>
        {PESTANAS.map(p => (
          <button key={p} onClick={() => setTab(p)}
            style={{ padding:'8px 18px', background:'none', border:'none', borderBottom:tab===p?'2px solid var(--fg)':'2px solid transparent', fontWeight:tab===p?600:400, cursor:'pointer', color:tab===p?'var(--fg)':'var(--muted)', fontSize:14 }}>
            {p}
          </button>
        ))}
      </div>

      {tab === 'Resumen' && (
        <div className='stack'>
          <div className='grid grid-3'>
            <div className='card'><span className='muted small'>Kcal objetivo</span><strong style={{ display:'block', fontSize:22 }}>{jugador.kcal_objetivo ?? '-'}</strong></div>
            <div className='card'><span className='muted small'>Proteína</span><strong style={{ display:'block', fontSize:22 }}>{jugador.proteina_objetivo_g ? jugador.proteina_objetivo_g+'g' : '-'}</strong></div>
            <div className='card'><span className='muted small'>CHO</span><strong style={{ display:'block', fontSize:22 }}>{jugador.cho_objetivo_g ? jugador.cho_objetivo_g+'g' : '-'}</strong></div>
            <div className='card'><span className='muted small'>Grasa</span><strong style={{ display:'block', fontSize:22 }}>{jugador.grasa_objetivo_g ? jugador.grasa_objetivo_g+'g' : '-'}</strong></div>
            <div className='card'><span className='muted small'>Masa magra</span><strong style={{ display:'block', fontSize:22 }}>{jugador.masa_magra_kg ? jugador.masa_magra_kg+' kg' : '-'}</strong></div>
            <div className='card'><span className='muted small'>% Grasa</span><strong style={{ display:'block', fontSize:22 }}>{jugador.porcentaje_grasa ? jugador.porcentaje_grasa+'%' : '-'}</strong></div>
          </div>
          {(jugador.endomorfia||jugador.mesomorfia||jugador.ectomorfia) && (
            <div className='card stack'>
              <h3 style={{ margin:0 }}>Somatotipo</h3>
              <div className='grid grid-3'>
                <div><span className='muted small'>Endomorfia</span><strong style={{ display:'block' }}>{jugador.endomorfia}</strong></div>
                <div><span className='muted small'>Mesomorfia</span><strong style={{ display:'block' }}>{jugador.mesomorfia}</strong></div>
                <div><span className='muted small'>Ectomorfia</span><strong style={{ display:'block' }}>{jugador.ectomorfia}</strong></div>
              </div>
            </div>
          )}
          <h3 style={{ margin:'8px 0 0' }}>Perfil nutricional personalizado</h3>
          <CampoEditable label='Número de comidas diarias' campo='num_comidas' valor={String(jugador.num_comidas||'5')} jugadorId={jugador.id} tipo='select' opciones={NUM_COMIDAS} />
          <CampoEditable label='Objetivo nutricional' campo='objetivo' valor={jugador.objetivo||''} jugadorId={jugador.id} tipo='text' />
          <CampoEditable label='Gustos y preferencias alimentarias' campo='gustos_preferencias' valor={jugador.gustos_preferencias||''} jugadorId={jugador.id} />
          <CampoEditable label='Aversiones (alimentos que no le gustan)' campo='aversiones' valor={jugador.aversiones||''} jugadorId={jugador.id} />
          <CampoEditable label='Intolerancias alimentarias' campo='intolerancias' valor={jugador.intolerancias||''} jugadorId={jugador.id} />
          <CampoEditable label='Alergias alimentarias' campo='alergias' valor={jugador.alergias||''} jugadorId={jugador.id} />
          <CampoEditable label='Contexto clínico / lesiones / historial' campo='contexto_clinico' valor={jugador.contexto_clinico||''} jugadorId={jugador.id} />
        </div>
      )}

      {tab === 'Plan IA' && (
        <PlanIATab jugador={jugador} />
      )}

      {tab === 'Hidratación' && (
        <div className='stack'>
          <div className='grid grid-3'>
            <div className='card'><span className='muted small'>Descanso</span><strong style={{ display:'block', fontSize:28, color:'#3b82f6' }}>{aguaBase ? aguaBase+' ml' : '-'}</strong></div>
            <div className='card'><span className='muted small'>Entreno</span><strong style={{ display:'block', fontSize:28, color:'#f59e0b' }}>{(aguaBase+aguaEntreno) ? (aguaBase+aguaEntreno)+' ml' : '-'}</strong></div>
            <div className='card'><span className='muted small'>Partido</span><strong style={{ display:'block', fontSize:28, color:'#ef4444' }}>{(aguaBase+aguaPartido) ? (aguaBase+aguaPartido)+' ml' : '-'}</strong></div>
          </div>
          <EditableSection title='Protocolo personalizado' defaultValue={jugador.notas_hidratacion || hidDef} onSave={v => saveField('notas_hidratacion', v)} />
        </div>
      )}

      {tab === 'Suplementación' && (
        <EditableSection title='Protocolo de suplementación' defaultValue={jugador.notas_suplementacion || supDef} onSave={v => saveField('notas_suplementacion', v)} />
      )}

      {tab === 'Protocolos' && (
        <EditableSection title='Protocolo prepartido' defaultValue={jugador.notas_protocolos || protDef} onSave={v => saveField('notas_protocolos', v)} />
      )}
    </div>
  );
}