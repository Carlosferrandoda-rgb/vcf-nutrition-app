'use client';
import { useState } from 'react';

type Jugador = Record<string, any>;

const PESTANAS = ['Resumen', 'Plan IA', 'Hidratación', 'Suplementación', 'Protocolos'] as const;
type Pestana = typeof PESTANAS[number];

export default function PlayerTabs({ jugador }: { jugador: Jugador }) {
  const [tab, setTab] = useState<Pestana>('Resumen');
  const [contexto, setContexto] = useState('semana_normal');
  const [plan, setPlan] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [errorPlan, setErrorPlan] = useState('');

  const CONTEXTOS = [
    { value: 'semana_normal', label: 'Semana normal' },
    { value: 'semana_partido', label: 'Semana de partido' },
    { value: 'dia_partido', label: 'Día de partido' },
    { value: 'viaje', label: 'Viaje / desplazamiento' },
    { value: 'lesion', label: 'Lesión / inactividad' },
    { value: 'vacaciones', label: 'Vacaciones' },
    { value: 'pretemporada', label: 'Pretemporada' },
  ];

  async function generarPlan() {
    setLoadingPlan(true);
    setErrorPlan('');
    setPlan('');
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador, contexto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando plan');
      setPlan(data.plan);
    } catch (e: any) {
      setErrorPlan(e.message);
    } finally {
      setLoadingPlan(false);
    }
  }

  // Cálculo hidratación
  const peso = Number(jugador.peso_kg || 0);
  const aguaBase = peso ? Math.round(peso * 40) : 0;
  const aguaEntrenamiento = peso ? Math.round(peso * 6) : 0;
  const aguaPartido = peso ? Math.round(peso * 10) : 0;

  return (
    <div className="stack">
      {/* Tabs nav */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        {PESTANAS.map(p => (
          <button key={p} onClick={() => setTab(p)}
            style={{ padding: '8px 18px', background: 'none', border: 'none', borderBottom: tab === p ? '2px solid var(--fg)' : '2px solid transparent',
              fontWeight: tab === p ? 600 : 400, cursor: 'pointer', color: tab === p ? 'var(--fg)' : 'var(--muted)', fontSize: 14 }}>
            {p}
          </button>
        ))}
      </div>

      {/* RESUMEN */}
      {tab === 'Resumen' && (
        <div className="stack">
          <div className="grid grid-3">
            <div className="card"><span className="muted small">Kcal objetivo</span><strong style={{ display: 'block', fontSize: 22 }}>{jugador.kcal_objetivo ?? '—'}</strong></div>
            <div className="card"><span className="muted small">Proteína</span><strong style={{ display: 'block', fontSize: 22 }}>{jugador.proteina_objetivo_g ? jugador.proteina_objetivo_g + ' g' : '—'}</strong></div>
            <div className="card"><span className="muted small">CHO</span><strong style={{ display: 'block', fontSize: 22 }}>{jugador.cho_objetivo_g ? jugador.cho_objetivo_g + ' g' : '—'}</strong></div>
            <div className="card"><span className="muted small">Grasa</span><strong style={{ display: 'block', fontSize: 22 }}>{jugador.grasa_objetivo_g ? jugador.grasa_objetivo_g + ' g' : '—'}</strong></div>
            <div className="card"><span className="muted small">Masa magra</span><strong style={{ display: 'block', fontSize: 22 }}>{jugador.masa_magra_kg ? jugador.masa_magra_kg + ' kg' : '—'}</strong></div>
            <div className="card"><span className="muted small">% Grasa</span><strong style={{ display: 'block', fontSize: 22 }}>{jugador.porcentaje_grasa ? jugador.porcentaje_grasa + '%' : '—'}</strong></div>
          </div>
          {(jugador.endomorfia || jugador.mesomorfia || jugador.ectomorfia) && (
            <div className="card stack">
              <h3 style={{ margin: 0 }}>Somatotipo</h3>
              <div className="grid grid-3">
                <div><span className="muted small">Endomorfia</span><strong style={{ display: 'block' }}>{jugador.endomorfia}</strong></div>
                <div><span className="muted small">Mesomorfia</span><strong style={{ display: 'block' }}>{jugador.mesomorfia}</strong></div>
                <div><span className="muted small">Ectomorfia</span><strong style={{ display: 'block' }}>{jugador.ectomorfia}</strong></div>
              </div>
            </div>
          )}
          {jugador.gustos_preferencias && (
            <div className="card"><span className="muted small">Gustos / preferencias</span><p style={{ margin: '4px 0 0' }}>{jugador.gustos_preferencias}</p></div>
          )}
          {jugador.contexto_clinico && (
            <div className="card"><span className="muted small">Contexto clínico</span><p style={{ margin: '4px 0 0' }}>{jugador.contexto_clinico}</p></div>
          )}
        </div>
      )}

      {/* PLAN IA */}
      {tab === 'Plan IA' && (
        <div className="stack">
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Generar plan nutricional con IA</h3>
            <p className="muted small">La IA utilizará los datos del jugador, sus objetivos y el contexto seleccionado.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label className="muted small">Contexto:</label>
              <select value={contexto} onChange={e => setContexto(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)' }}>
                {CONTEXTOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button className="button" onClick={generarPlan} disabled={loadingPlan}>
                {loadingPlan ? 'Generando...' : '✨ Generar plan'}
              </button>
            </div>
          </div>
          {errorPlan && <div style={{ padding: 12, background: '#fee2e2', borderRadius: 8, color: '#991b1b' }}>{errorPlan}</div>}
          {plan && (
            <div className="card" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>
              {plan}
            </div>
          )}
        </div>
      )}

      {/* HIDRATACIÓN */}
      {tab === 'Hidratación' && (
        <div className="stack">
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Calculadora de hidratación</h3>
            <p className="muted small">Basada en 40 ml/kg peso corporal (base) + compensación por sudoración estimada.</p>
          </div>
          <div className="grid grid-3">
            <div className="card"><span className="muted small">Día de descanso</span><strong style={{ display: 'block', fontSize: 28, color: '#3b82f6' }}>{aguaBase ? aguaBase + ' ml' : '—'}</strong><p className="muted small">40 ml/kg</p></div>
            <div className="card"><span className="muted small">Día de entrenamiento</span><strong style={{ display: 'block', fontSize: 28, color: '#f59e0b' }}>{aguaEntrenamiento ? aguaBase + aguaEntrenamiento + ' ml' : '—'}</strong><p className="muted small">+ 6 ml/kg por sesión</p></div>
            <div className="card"><span className="muted small">Día de partido</span><strong style={{ display: 'block', fontSize: 28, color: '#ef4444' }}>{aguaPartido ? aguaBase + aguaPartido + ' ml' : '—'}</strong><p className="muted small">+ 10 ml/kg por partido</p></div>
          </div>
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Protocolo de hidratación</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                ['Mañana (al despertar)', '500 ml agua'],
                ['Pre-entrenamiento (-2h)', '500 ml agua + electrolitos si hace calor'],
                ['Durante entrenamiento', '150-200 ml cada 15-20 min'],
                ['Post-entrenamiento (1h)', '150% de la pérdida por sudor estimada'],
                ['Con comidas', '250-300 ml por comida'],
                ['Antes de dormir', '200-300 ml'],
              ].map(([momento, cantidad]) => (
                <div key={momento} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="muted small">{momento}</span>
                  <strong style={{ fontSize: 13 }}>{cantidad}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUPLEMENTACIÓN */}
      {tab === 'Suplementación' && (
        <div className="stack">
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Protocolo de suplementación</h3>
            <p className="muted small">Basado en evidencia científica para fútbol profesional · Adaptar según analítica del jugador.</p>
          </div>
          {[
            { categoria: 'Evidencia A (alto rendimiento)', color: '#166534', bg: '#dcfce7', suplementos: [
              { nombre: 'Creatina monohidrato', dosis: '3-5 g/día', momento: 'Post-entrenamiento', nota: 'Carga: 20g/día x 5 días (opcional)' },
              { nombre: 'Cafeína', dosis: '3-6 mg/kg', momento: '60 min pre-partido/entreno', nota: 'Solo si hay tolerancia. No en tarde-noche.' },
              { nombre: 'Beta-alanina', dosis: '3.2-6.4 g/día', momento: 'Con comidas', nota: 'Puede causar parestesia. Dividir dosis.' },
              { nombre: 'Sodio bicarbonato', dosis: '0.3 g/kg', momento: '60-90 min pre-esfuerzo', nota: 'Para esfuerzos de alta intensidad >60s' },
            ]},
            { categoria: 'Micronutrientes prioritarios', color: '#1e40af', bg: '#dbeafe', suplementos: [
              { nombre: 'Vitamina D3', dosis: '2000-4000 UI/día', momento: 'Con comida grasa', nota: 'Ajustar según analítica (objetivo >40 ng/ml)' },
              { nombre: 'Omega-3', dosis: '2-4 g EPA+DHA/día', momento: 'Con comidas', nota: 'Anti-inflamatorio, recuperación muscular' },
              { nombre: 'Magnesio bisglicinato', dosis: '300-400 mg/día', momento: 'Noche', nota: 'Descanso, recuperación, función muscular' },
              { nombre: 'Hierro', dosis: 'Según analítica', momento: 'En ayunas o con vitamina C', nota: 'Solo si ferritina <30 ng/ml' },
            ]},
            { categoria: 'Recuperación y rendimiento', color: '#7c3aed', bg: '#ede9fe', suplementos: [
              { nombre: 'Proteína de suero (whey)', dosis: '20-40 g', momento: 'Post-entrenamiento (<30 min)', nota: 'Si no se alcanza el objetivo proteico con dieta' },
              { nombre: 'Cerezas ácidas (Montmorency)', dosis: '30 ml concentrado x2', momento: 'Mañana y noche', nota: 'Reduce DOMS y inflamación post-partido' },
              { nombre: 'Zumo de remolacha', dosis: '500 ml o 70 ml concentrado', momento: '2-3h pre-partido', nota: 'Mejora VO2max y eficiencia muscular' },
            ]},
          ].map(({ categoria, color, bg, suplementos }) => (
            <div key={categoria} className="card stack">
              <h4 style={{ margin: 0, color, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>{categoria}</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                {suplementos.map(s => (
                  <div key={s.nombre} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: 10, background: bg, borderRadius: 8 }}>
                    <div><span className="muted small" style={{ display: 'block' }}>Suplemento</span><strong style={{ fontSize: 13 }}>{s.nombre}</strong></div>
                    <div><span className="muted small" style={{ display: 'block' }}>Dosis</span><span style={{ fontSize: 13 }}>{s.dosis}</span></div>
                    <div><span className="muted small" style={{ display: 'block' }}>Momento</span><span style={{ fontSize: 13 }}>{s.momento}</span></div>
                    {s.nota && <div style={{ gridColumn: '1/-1' }}><span className="muted small">⚠ {s.nota}</span></div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PROTOCOLOS PREPARTIDO */}
      {tab === 'Protocolos' && (
        <div className="stack">
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Protocolo prepartido</h3>
            <p className="muted small">Timing nutricional optimizado para rendimiento máximo en competición.</p>
          </div>
          {[
            { tiempo: '-3 a -4 horas', titulo: 'Comida principal prepartido', contenido: [
              'Base de carbohidratos de digestión media: arroz, pasta, patata, pan',
              'Proteína magra: pollo, pavo, pescado blanco (100-150g)',
              'Verduras cocidas en poca cantidad',
              'Evitar: grasas en exceso, fibra alta, alimentos nuevos',
              jugador.kcal_objetivo ? 'CHO objetivo: ' + Math.round((jugador.cho_objetivo_g || 300) * 0.4) + 'g aprox en esta comida' : '',
            ].filter(Boolean), color: '#166534', bg: '#dcfce7' },
            { tiempo: '-90 min', titulo: 'Snack pre-partido opcional', contenido: [
              'Plátano maduro (CHO rápidos + potasio)',
              'Arroz con leche pequeño o gel energético',
              'Zumo de naranja natural (150 ml)',
              'NO sólidos si hay nerviosismo o malestar digestivo',
            ], color: '#1e40af', bg: '#dbeafe' },
            { tiempo: '-60 min', titulo: 'Cafeína (si procede)', contenido: [
              jugador.peso_kg ? 'Dosis: ' + Math.round(Number(jugador.peso_kg) * 3) + '-' + Math.round(Number(jugador.peso_kg) * 6) + ' mg (3-6 mg/kg)' : 'Dosis: 200-400 mg',
              'Formatos: café, cápsulas, gel con cafeína',
              'Solo si el jugador tiene tolerancia contrastada',
              'Evitar si partido nocturno (>19h) y el jugador tiene insomnio',
            ], color: '#92400e', bg: '#fef9c3' },
            { tiempo: 'Calentamiento', titulo: 'Durante calentamiento', contenido: [
              '200-300 ml agua o bebida isotónica',
              'Gel energético si >75 min desde última ingesta',
            ], color: '#7c3aed', bg: '#ede9fe' },
            { tiempo: 'Descanso', titulo: 'Medio tiempo', contenido: [
              '300-500 ml bebida isotónica (sodio + CHO)',
              'Gel energético o plátano si intensidad alta',
              'Evitar alimentos sólidos complejos',
            ], color: '#0e7490', bg: '#cffafe' },
            { tiempo: '+30 min post', titulo: 'Ventana de recuperación (prioritaria)', contenido: [
              'Proteína: 20-40g (batido, leche con cacao, pollo)',
              'CHO rápidos: arroz blanco, pan, fruta',
              jugador.peso_kg ? 'Agua: ' + Math.round(Number(jugador.peso_kg) * 1.5) + ' ml mínimo en 2h post-partido' : 'Rehidratación: 150% pérdida estimada',
              'Sodio: fundamental para retención hídrica (sal, bebida isotónica)',
            ], color: '#991b1b', bg: '#fee2e2' },
          ].map(({ tiempo, titulo, contenido, color, bg }) => (
            <div key={tiempo} className="card stack" style={{ borderLeft: '3px solid ' + color }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ padding: '3px 10px', borderRadius: 99, background: bg, color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{tiempo}</span>
                <h4 style={{ margin: 0, fontSize: 15 }}>{titulo}</h4>
              </div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, display: 'grid', gap: 4 }}>
                {contenido.map((c, i) => <li key={i} style={{ fontSize: 13, color: 'var(--fg)' }}>{c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}