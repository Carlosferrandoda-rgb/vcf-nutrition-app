'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Evolucion = { id: number; fecha: string; peso_kg: number; porcentaje_grasa: number; masa_magra_kg: number; suma_6_pliegues: number; notas: string };

export default function EvolucionTab({ jugadorId, evolucionesIniciales }: { jugadorId: number; evolucionesIniciales: Evolucion[] }) {
  const [evoluciones, setEvoluciones] = useState<Evolucion[]>(evolucionesIniciales);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [metrica, setMetrica] = useState<'peso_kg' | 'porcentaje_grasa' | 'masa_magra_kg' | 'suma_6_pliegues'>('peso_kg');
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    peso_kg: '', porcentaje_grasa: '', masa_magra_kg: '', suma_6_pliegues: '', notas: '',
  });

  const METRICAS = [
    { key: 'peso_kg', label: 'Peso (kg)', color: '#3b82f6' },
    { key: 'porcentaje_grasa', label: '% Grasa', color: '#ef4444' },
    { key: 'masa_magra_kg', label: 'Masa magra (kg)', color: '#22c55e' },
    { key: 'suma_6_pliegues', label: 'Suma 6 pliegues (mm)', color: '#f59e0b' },
  ] as const;

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/evoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador_id: jugadorId, ...form,
          peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
          porcentaje_grasa: form.porcentaje_grasa ? Number(form.porcentaje_grasa) : null,
          masa_magra_kg: form.masa_magra_kg ? Number(form.masa_magra_kg) : null,
          suma_6_pliegues: form.suma_6_pliegues ? Number(form.suma_6_pliegues) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvoluciones(prev => {
        const filtered = prev.filter(e => e.fecha !== data.evolucion.fecha);
        return [...filtered, data.evolucion].sort((a,b) => a.fecha.localeCompare(b.fecha));
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch(e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  const metricaActual = METRICAS.find(m => m.key === metrica)!;
  const ultimasMediciones = evoluciones.slice(-5).reverse();
  const primera = evoluciones[0];
  const ultima = evoluciones[evoluciones.length - 1];
  const diff = (key: keyof Evolucion) => {
    if (!primera || !ultima || primera === ultima) return null;
    const d = Number(ultima[key]) - Number(primera[key]);
    return d > 0 ? '+' + d.toFixed(1) : d.toFixed(1);
  };

  return (
    <div className='stack'>
      <div className='card stack'>
        <h3 style={{ margin: 0 }}>Registrar medición</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {[
            { key: 'fecha', label: 'Fecha', type: 'date' },
            { key: 'peso_kg', label: 'Peso (kg)', type: 'number' },
            { key: 'porcentaje_grasa', label: '% Grasa', type: 'number' },
            { key: 'masa_magra_kg', label: 'Masa magra (kg)', type: 'number' },
            { key: 'suma_6_pliegues', label: 'Suma 6 pliegues (mm)', type: 'number' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 3 }}>{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 3 }}>Notas</label>
            <input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className='button' onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar medición'}</button>
          {saved && <span style={{ color: '#166534', fontSize: 13 }}>✓ Guardado</span>}
          {error && <span style={{ color: '#991b1b', fontSize: 13 }}>{error}</span>}
        </div>
      </div>

      {evoluciones.length === 0 ? (
        <div className='card'><p className='muted'>Sin mediciones registradas. Añade la primera arriba.</p></div>
      ) : (
        <>
          <div className='grid grid-3'>
            <div className='card'><span className='muted small'>Peso actual</span><strong style={{ display:'block', fontSize:22 }}>{ultima?.peso_kg ?? '-'} kg</strong><span style={{ fontSize:12, color: diff('peso_kg')?.startsWith('+') ? '#ef4444' : '#22c55e' }}>{diff('peso_kg') ? diff('peso_kg') + ' kg vs inicio' : ''}</span></div>
            <div className='card'><span className='muted small'>% Grasa actual</span><strong style={{ display:'block', fontSize:22 }}>{ultima?.porcentaje_grasa ?? '-'}%</strong><span style={{ fontSize:12, color: diff('porcentaje_grasa')?.startsWith('+') ? '#ef4444' : '#22c55e' }}>{diff('porcentaje_grasa') ? diff('porcentaje_grasa') + '% vs inicio' : ''}</span></div>
            <div className='card'><span className='muted small'>Masa magra actual</span><strong style={{ display:'block', fontSize:22 }}>{ultima?.masa_magra_kg ?? '-'} kg</strong><span style={{ fontSize:12, color: diff('masa_magra_kg')?.startsWith('-') ? '#ef4444' : '#22c55e' }}>{diff('masa_magra_kg') ? diff('masa_magra_kg') + ' kg vs inicio' : ''}</span></div>
          </div>

          <div className='card stack'>
            <div className='between'>
              <h3 style={{ margin: 0 }}>Evolución</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {METRICAS.map(m => (
                  <button key={m.key} onClick={() => setMetrica(m.key)}
                    style={{ padding: '4px 10px', borderRadius: 99, border: '1px solid ' + (metrica===m.key ? m.color : 'var(--border)'), background: metrica===m.key ? m.color+'20' : 'transparent', color: metrica===m.key ? m.color : 'var(--muted)', fontSize: 12, cursor: 'pointer', fontWeight: metrica===m.key ? 600 : 400 }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width='100%' height={280}>
              <LineChart data={evoluciones} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
                <XAxis dataKey='fecha' tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip labelFormatter={v => 'Fecha: ' + v} formatter={(v: any) => [v, metricaActual.label]} />
                <Line type='monotone' dataKey={metrica} stroke={metricaActual.color} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className='card stack'>
            <h3 style={{ margin: 0 }}>Últimas mediciones</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Fecha','Peso','% Grasa','Masa magra','Σ6 pliegues','Notas'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ultimasMediciones.map(e => (
                    <tr key={e.id}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{e.fecha}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{e.peso_kg ?? '-'} kg</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{e.porcentaje_grasa ?? '-'}%</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{e.masa_magra_kg ?? '-'} kg</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{e.suma_6_pliegues ?? '-'} mm</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>{e.notas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}