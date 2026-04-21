'use client';
import { useState } from 'react';

type Jugador = Record<string, any>;
const PESTANAS = ['Resumen', 'Plan IA', 'Hidratación', 'Suplementación', 'Protocolos'] as const;
type Pestana = typeof PESTANAS[number];

function EditableSection({ title, defaultValue, onSave }: { title: string; defaultValue: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function handleSave() {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="card stack">
      <div className="between">
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span style={{ color: '#166534', fontSize: 13 }}>Guardado</span>}
          {!editing ? (
            <button className="button secondary" onClick={() => setEditing(true)} style={{ padding: '4px 12px', fontSize: 13 }}>Editar</button>
          ) : (
            <>
              <button className="button secondary" onClick={() => setEditing(false)} style={{ padding: '4px 12px', fontSize: 13 }}>Cancelar</button>
              <button className="button" onClick={handleSave} disabled={saving} style={{ padding: '4px 12px', fontSize: 13 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea value={value} onChange={e => setValue(e.target.value)}
          style={{ width: '100%', minHeight: 240, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 13, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }} />
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7 }}>
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
    { value: 'semana_normal', label: 'Semana normal' },
    { value: 'semana_partido', label: 'Semana de partido' },
    { value: 'dia_partido', label: 'Dia de partido' },
    { value: 'viaje', label: 'Viaje' },
    { value: 'lesion', label: 'Lesion' },
    { value: 'vacaciones', label: 'Vacaciones' },
    { value: 'pretemporada', label: 'Pretemporada' },
  ];
  async function generarPlan() {
    setLoadingPlan(true); setErrorPlan(''); setPlan('');
    try {
      const res = await fetch('/api/ai-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jugador, contexto }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setPlan(data.plan);
    } catch (e: any) { setErrorPlan(e.message); } finally { setLoadingPlan(false); }
  }
  async function saveField(field: string, value: string) {
    await fetch('/api/update-player', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: jugador.id, field, value }) });
  }
  const peso = Number(jugador.peso_kg || 0);
  const aguaBase = peso ? Math.round(peso * 40) : 0;
  const aguaEntreno = peso ? Math.round(peso * 6) : 0;
  const aguaPartido = peso ? Math.round(peso * 10) : 0;
  const cafMin = peso ? Math.round(peso*3) : 200;
  const cafMax = peso ? Math.round(peso*6) : 400;
  const hidDef = 'HIDRATACION - ' + jugador.nombre + ' ' + jugador.apellidos + '

Descanso: ' + aguaBase + ' ml
Entrenamiento: ' + (aguaBase+aguaEntreno) + ' ml
Partido: ' + (aguaBase+aguaPartido) + ' ml

TIMING:
- Al despertar: 500 ml
- Pre-entreno: 500 ml + electrolitos
- Durante entreno: 150-200 ml / 15 min
- Post-entreno: 150% perdida
- Con comidas: 300 ml

NOTAS:
';
  const supDef = 'SUPLEMENTACION - ' + jugador.nombre + ' ' + jugador.apellidos + '

EVIDENCIA A:
- Creatina: 3-5 g/dia post-entreno
- Cafeina: ' + cafMin + '-' + cafMax + ' mg · 60 min pre-partido
- Beta-alanina: 3.2-6.4 g/dia

MICRONUTRIENTES:
- Vitamina D3: 2000-4000 UI/dia
- Omega-3: 2-4 g EPA+DHA
- Magnesio: 300-400 mg noche

RECUPERACION:
- Proteina whey: 20-40 g post-entreno
- Cerezas Montmorency: 30 ml x2
- Zumo remolacha: 500 ml (2-3h pre-partido)

NOTAS ANALITICA:
';
  const protDef = 'PROTOCOLO PREPARTIDO - ' + jugador.nombre + ' ' + jugador.apellidos + '

-3/-4h | COMIDA PRINCIPAL:
- CHO: arroz/pasta/patata
- Proteina: pollo/pavo/pescado 100-150g
- Evitar: grasas, fibra alta

-90 min | SNACK:
- Platano o gel energetico

-60 min | CAFEINA:
- ' + cafMin + '-' + cafMax + ' mg si hay tolerancia

MEDIO TIEMPO:
- 300-500 ml isotonica

POST-PARTIDO +30min:
- Proteina 20-40g + CHO rapidos
- Rehidratacion completa

NOTAS:
';
  return (
    <div className="stack">
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        {PESTANAS.map(p => (
          <button key={p} onClick={() => setTab(p)}
            style={{ padding: '8px 18px', background: 'none', border: 'none', borderBottom: tab===p ? '2px solid var(--fg)' : '2px solid transparent', fontWeight: tab===p ? 600 : 400, cursor: 'pointer', color: tab===p ? 'var(--fg)' : 'var(--muted)', fontSize: 14 }}>
            {p}
          </button>
        ))}
      </div>
      {tab === 'Resumen' && (
        <div className="stack">
          <div className="grid grid-3">
            <div className="card"><span className="muted small">Kcal objetivo</span><strong style={{ display:'block', fontSize:22 }}>{jugador.kcal_objetivo ?? '-'}</strong></div>
            <div className="card"><span className="muted small">Proteina</span><strong style={{ display:'block', fontSize:22 }}>{jugador.proteina_objetivo_g ? jugador.proteina_objetivo_g+'g' : '-'}</strong></div>
            <div className="card"><span className="muted small">CHO</span><strong style={{ display:'block', fontSize:22 }}>{jugador.cho_objetivo_g ? jugador.cho_objetivo_g+'g' : '-'}</strong></div>
            <div className="card"><span className="muted small">Grasa</span><strong style={{ display:'block', fontSize:22 }}>{jugador.grasa_objetivo_g ? jugador.grasa_objetivo_g+'g' : '-'}</strong></div>
            <div className="card"><span className="muted small">Masa magra</span><strong style={{ display:'block', fontSize:22 }}>{jugador.masa_magra_kg ? jugador.masa_magra_kg+' kg' : '-'}</strong></div>
            <div className="card"><span className="muted small">% Grasa</span><strong style={{ display:'block', fontSize:22 }}>{jugador.porcentaje_grasa ? jugador.porcentaje_grasa+'%' : '-'}</strong></div>
          </div>
          {(jugador.endomorfia||jugador.mesomorfia||jugador.ectomorfia) && (
            <div className="card stack">
              <h3 style={{ margin:0 }}>Somatotipo</h3>
              <div className="grid grid-3">
                <div><span className="muted small">Endomorfia</span><strong style={{ display:'block' }}>{jugador.endomorfia}</strong></div>
                <div><span className="muted small">Mesomorfia</span><strong style={{ display:'block' }}>{jugador.mesomorfia}</strong></div>
                <div><span className="muted small">Ectomorfia</span><strong style={{ display:'block' }}>{jugador.ectomorfia}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'Plan IA' && (
        <div className="stack">
          <div className="card stack">
            <h3 style={{ margin:0 }}>Generar plan con IA</h3>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <select value={contexto} onChange={e => setContexto(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--fg)' }}>
                {CONTEXTOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button className="button" onClick={generarPlan} disabled={loadingPlan}>{loadingPlan ? 'Generando...' : 'Generar plan'}</button>
            </div>
          </div>
          {errorPlan && <div style={{ padding:12, background:'#fee2e2', borderRadius:8, color:'#991b1b', fontSize:13 }}>{errorPlan}</div>}
          {plan && <div className="card" style={{ whiteSpace:'pre-wrap', lineHeight:1.7, fontSize:14 }}>{plan}</div>}
        </div>
      )}
      {tab === 'Hidratación' && (
        <div className="stack">
          <div className="grid grid-3">
            <div className="card"><span className="muted small">Descanso</span><strong style={{ display:'block', fontSize:28, color:'#3b82f6' }}>{aguaBase ? aguaBase+' ml' : '-'}</strong></div>
            <div className="card"><span className="muted small">Entreno</span><strong style={{ display:'block', fontSize:28, color:'#f59e0b' }}>{(aguaBase+aguaEntreno) ? (aguaBase+aguaEntreno)+' ml' : '-'}</strong></div>
            <div className="card"><span className="muted small">Partido</span><strong style={{ display:'block', fontSize:28, color:'#ef4444' }}>{(aguaBase+aguaPartido) ? (aguaBase+aguaPartido)+' ml' : '-'}</strong></div>
          </div>
          <EditableSection title="Protocolo personalizado" defaultValue={jugador.notas_hidratacion || hidDef} onSave={v => saveField('notas_hidratacion', v)} />
        </div>
      )}
      {tab === 'Suplementación' && (
        <EditableSection title="Protocolo de suplementacion" defaultValue={jugador.notas_suplementacion || supDef} onSave={v => saveField('notas_suplementacion', v)} />
      )}
      {tab === 'Protocolos' && (
        <EditableSection title="Protocolo prepartido" defaultValue={jugador.notas_protocolos || protDef} onSave={v => saveField('notas_protocolos', v)} />
      )}
    </div>
  );
}
