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
    const numComidas = jugador.num_comidas || 5;

    const restricciones = [
      jugador.alergias ? '⚠️ ALERGIAS (OBLIGATORIO EVITAR): ' + jugador.alergias : null,
      jugador.intolerancias ? '⚠️ INTOLERANCIAS (OBLIGATORIO EVITAR): ' + jugador.intolerancias : null,
      jugador.aversiones ? '❌ AVERSIONES (no incluir): ' + jugador.aversiones : null,
    ].filter(Boolean).join('\n');

    const prompt = `Eres Carlos Ferrando, nutricionista del Valencia CF. Genera un plan nutricional PERSONALIZADO y detallado.

DATOS DEL JUGADOR:
- Nombre: ${jugador.nombre} ${jugador.apellidos}
- Posición: ${jugador.posicion || 'No especificada'}
- Peso: ${jugador.peso_kg || '?'} kg | Masa magra: ${jugador.masa_magra_kg || '?'} kg | % Grasa: ${jugador.porcentaje_grasa || '?'}%
- Somatotipo: ${jugador.endomorfia || '?'}-${jugador.mesomorfia || '?'}-${jugador.ectomorfia || '?'}

OBJETIVOS NUTRICIONALES (Cunningham):
- Total: ${kcal} kcal/día
- Proteína: ${proteina} g/día | CHO: ${cho} g/día | Grasa: ${grasa} g/día
- Agua: ${jugador.agua_objetivo_ml || Math.round((jugador.peso_kg || 80) * 40)} ml/día
- Número de comidas: ${numComidas} comidas/día

PERFIL PERSONAL:
- Objetivo específico: ${jugador.objetivo || 'Rendimiento deportivo óptimo'}
- Gustos y preferencias: ${jugador.gustos_preferencias || 'No especificados'}
${restricciones ? restricciones + '\n' : ''}
- Contexto clínico: ${jugador.contexto_clinico || 'Sin particularidades'}

CONTEXTO ACTUAL: ${CONTEXTOS[contexto] || contexto}

GENERA UN PLAN PARA 5 DÍAS con exactamente ${numComidas} comidas por día.
Para cada día incluye:
1. Todas las comidas con horario sugerido
2. Alimentos con cantidades en gramos
3. Timing pre/post entreno según el contexto
4. Evita SIEMPRE los alimentos con alergia e intolerancia
5. Respeta las preferencias y aversiones

Al final añade 3-4 recomendaciones específicas para el contexto "${CONTEXTOS[contexto]}".
Usa alimentos mediterráneos y accesibles en España.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const plan = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}