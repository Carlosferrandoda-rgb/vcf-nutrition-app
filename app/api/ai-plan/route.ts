import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const CONTEXTOS: Record<string, string> = {
  semana_normal: 'semana normal de entrenamiento (3-4 sesiones)',
  semana_partido: 'semana con partido oficial (microciclo competitivo)',
  dia_partido: 'día de partido (ajuste máximo de timing nutricional)',
  viaje: 'viaje o desplazamiento para jugar fuera',
  lesion: 'período de lesión o inactividad reducida',
  vacaciones: 'período vacacional fuera de temporada',
  pretemporada: 'pretemporada (alta carga de trabajo)',
};

export async function POST(req: NextRequest) {
  try {
    const { jugador, contexto } = await req.json();

    const kcal = jugador.kcal_objetivo || Math.round(500 + 22 * (jugador.masa_magra_kg || 70));
    const proteina = jugador.proteina_objetivo_g || Math.round((jugador.masa_magra_kg || 70) * 1.8);
    const cho = jugador.cho_objetivo_g || Math.round((jugador.peso_kg || 80) * 5);
    const grasa = jugador.grasa_objetivo_g || Math.round((kcal - proteina * 4 - cho * 4) / 9);

    const prompt = `Eres Carlos Ferrando, nutricionista deportivo del Valencia CF con 20 años de experiencia. Genera un plan nutricional detallado y práctico para este jugador.

DATOS DEL JUGADOR:
- Nombre: ${jugador.nombre} ${jugador.apellidos}
- Posición: ${jugador.posicion || 'No especificada'}
- Peso: ${jugador.peso_kg || '?'} kg | Altura: ${jugador.altura_cm || '?'} cm
- Masa magra: ${jugador.masa_magra_kg || '?'} kg | % Grasa: ${jugador.porcentaje_grasa || '?'}%
- Somatotipo: ${jugador.endomorfia || '?'}-${jugador.mesomorfia || '?'}-${jugador.ectomorfia || '?'}

OBJETIVOS NUTRICIONALES (Cunningham):
- Kcal: ${kcal} kcal/día
- Proteína: ${proteina} g/día (${((jugador.masa_magra_kg || 70) > 0 ? (proteina / (jugador.masa_magra_kg || 70)).toFixed(1) : '1.8')} g/kg masa magra)
- CHO: ${cho} g/día
- Grasa: ${grasa} g/día
- Agua: ${jugador.agua_objetivo_ml || Math.round((jugador.peso_kg || 80) * 40)} ml/día

CONTEXTO: ${CONTEXTOS[contexto] || contexto}

GUSTOS/PREFERENCIAS: ${jugador.gustos_preferencias || 'No especificados'}
CONTEXTO CLÍNICO: ${jugador.contexto_clinico || 'Sin particularidades'}

GENERA:
1. Plan de 5 días con desayuno, media mañana, comida, merienda y cena
2. Timing específico según el contexto (horarios, pre/post entreno)
3. Cantidades en gramos de los alimentos principales
4. 2-3 recomendaciones específicas para el contexto dado
5. Alimentos a priorizar y a evitar en este contexto

Sé concreto, práctico y adaptado al fútbol profesional español. Usa alimentos mediterráneos accesibles.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const plan = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}