'use client';
import { useState, useEffect } from 'react';
import { marked } from 'marked';

type Jugador = Record<string, any>;

const CONTEXTOS = [
  { value: 'semana_normal', label: 'Semana normal de entrenamiento' },
  { value: 'semana_partido', label: 'Semana con partido oficial' },
  { value: 'dia_partido', label: 'Dia de partido' },
  { value: 'viaje', label: 'Viaje / desplazamiento' },
  { value: 'lesion', label: 'Lesion / inactividad' },
  { value: 'vacaciones', label: 'Vacaciones / fuera de temporada' },
  { value: 'pretemporada', label: 'Pretemporada (alta carga)' },
];

export default function PlanIATab({ jugador }: { jugador: Jugador }) {
  const [contexto, setContexto] = useState('semana_normal');
  const [plan, setPlan] = useState('');
  const [planHtml, setPlanHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (plan) {
      marked.setOptions({ breaks: true, gfm: true } as any);
      setPlanHtml(marked(plan) as string);
    }
  }, [plan]);

  async function generar() {
    setLoading(true); setError(''); setPlan(''); setPlanHtml('');
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador, contexto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setPlan(data.plan);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  const perfilResumen = [
    jugador.num_comidas ? jugador.num_comidas + ' comidas/dia' : null,
    jugador.objetivo || null,
    jugador.alergias ? 'Alergias: ' + jugador.alergias.slice(0,30) : null,
    jugador.intolerancias ? 'Intol: ' + jugador.intolerancias.slice(0,30) : null,
    jugador.gustos_preferencias ? 'Gustos: ' + jugador.gustos_preferencias.slice(0,30) : null,
  ].filter(Boolean);

  return (
    <div className='stack'>
      <div className='card stack'>
        <div className='between'>
          <div>
            <h3 style={{ margin: 0 }}>Plan nutricional personalizado</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>
              {jugador.kcal_objetivo} kcal · {jugador.proteina_objetivo_g}g P · {jugador.cho_objetivo_g}g CHO · {jugador.grasa_objetivo_g}g G
            </p>
          </div>
        </div>

        {perfilResumen.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {perfilResumen.map((item, i) => (
              <span key={i} style={{ padding: '3px 10px', borderRadius: 99, background: 'var(--bg3)', border: '1px solid var(--border2)', fontSize: 11, color: 'var(--fg2)' }}>
                {item}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={contexto} onChange={e => setContexto(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '9px 12px', borderRadius: 'var(--r)', border: '1px solid var(--border2)', background: 'var(--bg2)', color: 'var(--fg)', fontSize: 13 }}>
            {CONTEXTOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button className='button' onClick={generar} disabled={loading}
            style={{ minWidth: 160 }}>
            {loading ? (
              <><span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></span> Generando...</>
            ) : '✦ Generar plan'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--bad-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r)', color: 'var(--bad)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading && (
        <div className='card' style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Generando plan personalizado para {jugador.nombre}...</p>
        </div>
      )}

      {planHtml && !loading && (
        <div className='card' style={{ padding: '24px 28px' }}>
          <div className='plan-md' dangerouslySetInnerHTML={{ __html: planHtml }} />
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .plan-md h1 { font-size: 20px; font-weight: 800; color: var(--fg); margin: 0 0 4px; letter-spacing: -0.5px; }
        .plan-md h2 { font-size: 12px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 1px; margin: 22px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--accent-border); }
        .plan-md h3 { font-size: 14px; font-weight: 600; color: var(--fg); margin: 14px 0 6px; }
        .plan-md p { margin: 6px 0; color: var(--fg2); font-size: 13px; line-height: 1.7; }
        .plan-md strong { color: var(--fg); font-weight: 600; }
        .plan-md hr { border: none; border-top: 1px solid var(--border); margin: 18px 0; }
        .plan-md ul, .plan-md ol { padding-left: 20px; margin: 6px 0; }
        .plan-md li { margin: 5px 0; color: var(--fg2); font-size: 13px; line-height: 1.6; }
        .plan-md li::marker { color: var(--accent); }
        .plan-md table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
        .plan-md th { background: var(--bg3); color: var(--accent); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 8px 12px; border: 1px solid var(--border2); text-align: left; }
        .plan-md td { padding: 8px 12px; border: 1px solid var(--border); color: var(--fg2); }
        .plan-md tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
        .plan-md blockquote { border-left: 3px solid var(--accent); padding: 8px 14px; margin: 10px 0; background: var(--accent-bg); border-radius: 0 8px 8px 0; }
      `}</style>
    </div>
  );
}