import { db } from '../db';
import type { AiMessage, AiMode, HerdAnalysisSnapshot } from '../types/ai';
import { FinancialEngine } from './financialEngine';

export class AiAssistantService {
  // Aggregate live herd metrics into a snapshot for AI context
  public static async getHerdSnapshot(farmId: string = 'all'): Promise<HerdAnalysisSnapshot> {
    const [allAnimals, allReproEvents, allMilkings, allWeights, allHealth, allFinancials] = await Promise.all([
      db.animals.toArray(),
      db.reproductionEvents.toArray(),
      db.milkingRecords.toArray(),
      db.weightRecords.toArray(),
      db.healthRecords.toArray(),
      db.financialRecords.toArray()
    ]);

    // Filter by farm if not 'all'
    const animals = farmId === 'all' ? allAnimals : allAnimals.filter(a => a.farmId === farmId);
    const animalIdSet = new Set(animals.map(a => a.id));

    const reproEvents = farmId === 'all' ? allReproEvents : allReproEvents.filter(r => animalIdSet.has(r.animalId));
    const milkings = farmId === 'all' ? allMilkings : allMilkings.filter(m => animalIdSet.has(m.animalId));
    const weights = farmId === 'all' ? allWeights : allWeights.filter(w => animalIdSet.has(w.animalId));
    const health = farmId === 'all' ? allHealth : allHealth.filter(h => animalIdSet.has(h.animalId));
    const financials = farmId === 'all' ? allFinancials : allFinancials.filter(f => f.farmId === farmId);

    const activeAnimals = animals.filter(a => a.status === 'active');
    const femalesCount = activeAnimals.filter(a => a.gender === 'female').length;
    const malesCount = activeAnimals.filter(a => a.gender === 'male' || a.gender === 'castrated').length;
    const milkingCowsCount = activeAnimals.filter(a => a.purpose === 'milk' && a.currentStage === 'adult').length;

    // Reproduction indicators
    const pregnantCowsCount = reproEvents.filter(r => r.pregnancyResult === 'pregnant').length;
    const dryCowsCount = reproEvents.filter(r => r.eventType === 'dry_off').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
    const thirtyDaysAheadStr = thirtyDaysAhead.toISOString().split('T')[0];

    const upcomingCalvingsCount = reproEvents.filter(r => 
      r.projectedCalvingDate && r.projectedCalvingDate >= todayStr && r.projectedCalvingDate <= thirtyDaysAheadStr
    ).length;

    const pendingDryOffCount = reproEvents.filter(r =>
      r.mandatoryDryOffDate && r.mandatoryDryOffDate <= thirtyDaysAheadStr
    ).length;

    // Production indicators
    const recentMilkings = milkings.slice(-14);
    const totalMilk = recentMilkings.reduce((sum, m) => sum + m.liters, 0);
    const avgDailyMilkLiters = recentMilkings.length > 0 ? totalMilk / (recentMilkings.length / 2) : 0;

    const adgWeights = weights.filter(w => (w.averageDailyGainKg || 0) > 0);
    const avgAdgKg = adgWeights.length > 0 
      ? adgWeights.reduce((sum, w) => sum + (w.averageDailyGainKg || 0), 0) / adgWeights.length 
      : 0.95;

    // Health quarantines
    const activeQuarantinesCount = health.filter(h => 
      (h.safeMilkDate && h.safeMilkDate > todayStr) || (h.safeMeatDate && h.safeMeatDate > todayStr)
    ).length;

    // Financial
    const economics = FinancialEngine.calculateUnitEconomics(financials, milkings, weights);

    return {
      totalAnimals: activeAnimals.length,
      femalesCount,
      malesCount,
      milkingCowsCount,
      pregnantCowsCount,
      dryCowsCount,
      avgDailyMilkLiters: Number(avgDailyMilkLiters.toFixed(1)),
      avgAdgKg: Number(avgAdgKg.toFixed(2)),
      upcomingCalvingsCount,
      pendingDryOffCount,
      activeQuarantinesCount,
      monthlyNetProfit: economics.netProfit
    };
  }

  // Answer query in dual mode: Farm Local vs External Global Consultant
  public static async queryAssistant(
    userPrompt: string,
    mode: AiMode = 'auto',
    farmId: string = 'all'
  ): Promise<AiMessage> {
    const promptLower = userPrompt.toLowerCase().trim();

    // Check if query is explicitly directed to external consultant or contains external keywords
    const isExternalQuery = 
      mode === 'external_consultant' ||
      (mode === 'auto' && (
        promptLower.includes('dosis') ||
        promptLower.includes('medicamento') ||
        promptLower.includes('antibiotico') ||
        promptLower.includes('ivermectina') ||
        promptLower.includes('oxitetraciclina') ||
        promptLower.includes('iatf') ||
        promptLower.includes('protocolo') ||
        promptLower.includes('pasto') ||
        promptLower.includes('sembrar') ||
        promptLower.includes('brachiaria') ||
        promptLower.includes('mombasa') ||
        promptLower.includes('silo') ||
        promptLower.includes('ensilaje') ||
        promptLower.includes('raza') ||
        promptLower.includes('cruce') ||
        promptLower.includes('girolando') ||
        promptLower.includes('precio') ||
        promptLower.includes('mercado') ||
        promptLower.includes('timpanismo') ||
        promptLower.includes('cojera') ||
        promptLower.includes('fiebre aftosa') ||
        promptLower.includes('brucelosis') ||
        promptLower.includes('calostro') ||
        promptLower.includes('aforo')
      ));

    if (isExternalQuery) {
      return this.handleExternalKnowledgeQuery(promptLower, userPrompt);
    }

    // Otherwise, handle Farm Local Database Query
    return this.handleFarmLocalQuery(promptLower, farmId);
  }

  // EXTERNAL KNOWLEDGE CONSULTANT ENGINE
  private static handleExternalKnowledgeQuery(promptLower: string, originalPrompt: string): AiMessage {
    // 1. IATF / Insemination Protocols
    if (promptLower.includes('iatf') || promptLower.includes('sincroniz') || promptLower.includes('protocolo reproductivo')) {
      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'external_consultant',
        text: `🔬 **Protocolo IATF Estándar (3 Manejos con Dispositivo de Progesterona):**\n\nEste es el protocolo más confiable y extendido en Latinoamérica para vacas de carne y leche con cría al pie:\n\n• **Día 0 (Hora 08:00):**\n  - Insertar Dispositivo Intravaginal con Progesterona (DIB o CIDR 0.5g - 1.0g).\n  - Inyectar **2.0 mg de Benzoato de Estradiol (BE)** intramuscular (IM) para reiniciar la onda folicular.\n\n• **Día 8 (Hora 08:00):**\n  - Retirar el dispositivo intravaginal.\n  - Inyectar **500 mcg de Cloprostenol / Prostaglandina F2α (PGF2α)** IM (luteólisis).\n  - Inyectar **1.0 mg de Cipionato de Estradiol (CE)** IM como inductor de la ovulación.\n  - Opcional en vacas con anestro o baja condición corporal: **300 UI a 400 UI de eCG (Novormon)** IM.\n\n• **Día 10 (Hora 14:00 a 16:00 - ~52 a 54 horas post-retiro):**\n  - **Inseminación Artificial a Tiempo Fijo (IATF):** Inseminar todas las hembras sin necesidad de detectar celo.\n\n⚠️ *Precauciones Clave:*\n- No usar pajillas descongeladas por más de 15 minutos.\n- Mantener temperatura de descongelación estricta a 36-37°C por 40 segundos.\n- Condición corporal mínima requerida: 2.75 a 3.0 (escala 1 a 5).`,
        dataCard: {
          type: 'external_reference',
          title: 'Ficha Técnica: Protocolo IATF Bovino',
          metrics: [
            { label: 'Duración Protocolo', value: '10 días' },
            { label: 'Momento IATF', value: '52-54 h post-retiro' },
            { label: 'Tasa Preñez Esperada', value: '48% - 58%' }
          ],
          actionLabel: 'Protocolo Zootécnico Validado'
        }
      };
    }

    // 2. Pharmacology: Oxytetracycline / Antibiotics
    if (promptLower.includes('oxitetraciclina') || promptLower.includes('antibiotico') || promptLower.includes('dosis')) {
      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'external_consultant',
        text: `💊 **Posología y Farmacología: Oxitetraciclina Larga Acción (L.A. 200 mg/mL):**\n\n• **Indicaciones:** Tratamiento de neumonías, anaplasmosis, pododermatitis (gabarro/cojeras), metritis, queratoconjuntivitis y heridas infectadas.\n\n• **Dosis Terapéutica:**\n  - **20 mg/kg de peso vivo** en dosis única (equivalente a **1 mL por cada 10 kg de peso vivo**).\n  - *Ejemplo práctico:* Novillo de 400 kg requiere **40 mL** (dividir en 2 puntos de aplicación si supera 20 mL por sitio).\n\n• **Vía de Administración:** Intramuscular profunda (IM) o subcutánea (SC) en la tabla del cuello.\n\n• **Tiempos de Retiro Obligatorios:**\n  - **Carne para consumo:** **28 días** posteriores a la última aplicación.\n  - **Leche para consumo:** **7 días (14 ordeños)**. No se recomienda usar en vacas lecheras en plena lactancia comercial.\n\n⛔ *Contraindicaciones:* No asociar concomitantemente con penicilinas ni administrar por vía intravenosa rápida.`,
        dataCard: {
          type: 'external_reference',
          title: 'Guía Farmacológica: Oxitetraciclina L.A.',
          metrics: [
            { label: 'Dosis Base', value: '1 mL / 10 kg' },
            { label: 'Retiro en Carne', value: '28 días' },
            { label: 'Retiro en Leche', value: '7 días' }
          ]
        }
      };
    }

    // 3. Ivermectin / Parasites
    if (promptLower.includes('ivermectina') || promptLower.includes('desparasit') || promptLower.includes('garrapata') || promptLower.includes('parasito')) {
      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'external_consultant',
        text: `🪱 **Manejo de Endectocidas: Ivermectina al 1% y 3.15% (Larga Acción):**\n\n• **Ivermectina 1%:**\n  - **Dosis:** 200 mcg/kg (equivalente a **1 mL por cada 50 kg de peso vivo**).\n  - **Vía:** Exclusivamente Subcutánea (SC) por delante de la paleta.\n  - **Retiro:** 28 a 35 días en carne. **Prohibido en vacas cuya leche se destine al consumo humano**.\n\n• **Ivermectina 3.15% L.A.:**\n  - **Dosis:** 630 mcg/kg (equivalente a **1 mL por cada 50 kg de peso vivo**).\n  - **Retiro:** **122 días en carne**. Totalmente prohibido en hembras de ordeño.\n\n💡 *Estrategia Anti-Resistencia:* Alterna grupos químicos cada 6 meses (Lactonas macrocíclicas -> Benzimidazoles como Albendazol/Fenbendazol -> Levamisol) para evitar poblaciones de parásitos y garrapatas resistentes (*Rhipicephalus microplus*).`,
        dataCard: {
          type: 'external_reference',
          title: 'Control Parasitario Bovino',
          metrics: [
            { label: 'Dosis 1%', value: '1 mL / 50 kg' },
            { label: 'Vía', value: 'Subcutánea (SC)' },
            { label: 'Retiro 3.15%', value: '122 días carne' }
          ]
        }
      };
    }

    // 4. Pastures & Agronomy
    if (promptLower.includes('pasto') || promptLower.includes('sembrar') || promptLower.includes('brachiaria') || promptLower.includes('mombasa') || promptLower.includes('aforo') || promptLower.includes('potrero')) {
      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'external_consultant',
        text: `🌱 **Guía Agronómica de Pasturas Tropicales:**\n\n1. **Brachiaria brizantha (cv. Marandú / Toledo):**\n   - **Adaptación:** Suelos bien drenados de fertilidad media, altitud 0 - 1,800 msnm.\n   - **Densidad de siembra:** 6 a 8 kg/ha de semilla incrustada.\n   - **Descanso:** 28 a 35 días. Proteína cruda promedio: 9% a 13%.\n\n2. **Panicum maximum (cv. Mombasa / Tanzania):**\n   - **Adaptación:** Suelos de alta fertilidad, no tolera encharcamientos prolongados.\n   - **Rendimiento:** Hasta 30 toneladas de Materia Seca/Ha/año con fertilización nitrogenada.\n   - **Manejo:** Entrada al potrero con 80-90 cm de altura; salida a 30 cm de remanente.\n\n3. **Cálculo de Aforo Rápido (Marco de 1m x 1m):**\n   - Cortar y pesar el forraje en 5 puntos representativos del potrero.\n   - Si el promedio es de 2.5 kg forraje verde/m² (25,000 kg/ha) con 20% de Materia Seca = 5,000 kg MS/ha.\n   - Descontando 30% de pérdidas por pisoteo y bosteje = 3,500 kg MS aprovechable por hectárea.`,
        dataCard: {
          type: 'external_reference',
          title: 'Parámetros de Forrajes y Pastoreo',
          metrics: [
            { label: 'Brachiaria Toledo', value: '28-32 días descanso' },
            { label: 'Mombasa', value: '80cm entrada / 30cm salida' },
            { label: 'Consumo Bovino', value: '10-12% peso vivo en verde' }
          ]
        }
      };
    }

    // 5. Breeds & Genetics
    if (promptLower.includes('raza') || promptLower.includes('cruce') || promptLower.includes('girolando') || promptLower.includes('brahman') || promptLower.includes('angus') || promptLower.includes('gyr')) {
      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'external_consultant',
        text: `🧬 **Guía de Selección Genética y Cruzamientos Estratégicos:**\n\n• **Girolando (5/8 Holstein + 3/8 Gyr Lechero):**\n  - Es la raza lechera tropical por excelencia. Aporta la capacidad volumétrica del Holstein con la termotolerancia, resistencia a hemoparásitos y longevidad del cebú Gyr.\n  - Producciones promedio: 18 a 28 Litros/día en trópico bajo y medio.\n\n• **F1 Cárnico (Black Angus × Brahman):**\n  - Máximo vigor híbrido (heterosis): ganancias diarias de peso superiores a 1.25 kg/día en pastoreo.\n  - Excelente calidad de canal cárnica con grasa blanca y marmoleo moderado.\n\n• **Doble Propósito (Guzolando / Simmbrah):**\n  - Ideal para productores que comercializan terneros pesados al destete y ordeñan con ternero al pie para sostener el flujo de caja diario.`,
        dataCard: {
          type: 'external_reference',
          title: 'Eficiencia Genética Bovina',
          metrics: [
            { label: 'Girolando 5/8', value: 'Leche en Trópico' },
            { label: 'Angus x Brahman', value: 'Heterosis de Ceba' },
            { label: 'Vigor Híbrido', value: '+15-20% Ganancia' }
          ]
        }
      };
    }

    // 6. Calves & Neonatal Care
    if (promptLower.includes('ternero') || promptLower.includes('calostro') || promptLower.includes('diarrea') || promptLower.includes('ombligo')) {
      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'external_consultant',
        text: `🍼 **Protocolo Neonatal del Ternero (Primeras 24 Horas):**\n\n1. **Calostrado Inmediato (Regla de Oro):**\n   - Suministrar el 10% del peso vivo en calostro de alta calidad dentro de las **primeras 2 a 4 horas de vida** (aprox. 3.5 a 4 Litros para un ternero de 38 kg).\n   - La pared intestinal se cierra a la absorción de inmunoglobulinas IgG después de las 12 a 24 horas.\n\n2. **Curación de Ombligo:**\n   - Desinfección por inmersión total en Tintura de Yodo al 7% o clorhexidina al 2% inmediatamente al nacer y repetir a las 12 horas.\n\n3. **Tratamiento de Diarreas Neonatales:**\n   - La prioridad número 1 es la **terapia de rehidratación con electrolitos orales** (glucosa, sodio, potasio, bicarbonato) entre tomas de leche.\n   - No suspender la leche por más de 1 toma (la leche nutre al ternero; los electrolitos corrigen la deshidratación y acidosis).`,
        dataCard: {
          type: 'external_reference',
          title: 'Cuidado Crítico del Neonato',
          metrics: [
            { label: 'Calostro en 4h', value: '10% del peso vivo' },
            { label: 'Yodo Ombligo', value: '7% por inmersión' },
            { label: 'Terapia Diarrea', value: 'Electrolitos Orales' }
          ]
        }
      };
    }

    // 7. General Open Agricultural Advice
    return {
      id: 'msg_' + Date.now(),
      sender: 'assistant',
      timestamp: Date.now(),
      mode: 'external_consultant',
      text: `🌍 **Consultor Zootécnico y Veterinario Global:**\n\nHe analizado tu consulta externa sobre: *"${originalPrompt}"*\n\n📋 **Recomendaciones Técnicas Zootécnicas:**\n1. **Base Fisiológica y Sanitaria:** En producción ganadera moderna, cualquier intervención debe preservar el bienestar animal, la inocuidad de alimentos y el equilibrio ruminal.\n2. **Manejo Preventivo:** El 80% de los problemas clínicos de hatos derivan de deficiencias nutricionales (falta de proteína sobrepasante o sales minerales) o mala bioseguridad en potreros.\n3. **Registro y Trazabilidad:** Registra siempre cualquier fármaco, lote de vacuna o pesaje en el sistema para garantizar la inocuidad de carne y leche.\n\n*Puedes consultarme en detalle sobre dosis farmacológicas, protocolos IATF, aforos de pasturas, razas o nutrición de precisión.*`,
      dataCard: {
        type: 'external_reference',
        title: 'Asesoría Zootécnica General',
        metrics: [
          { label: 'Enfoque', value: 'Zootecnia y Veterinaria' },
          { label: 'Especialidad', value: 'Bovinos Carne y Leche' },
          { label: 'Base de Conocimiento', value: 'Global Externa' }
        ]
      }
    };
  }

  // FARM LOCAL DATABASE ENGINE
  private static async handleFarmLocalQuery(promptLower: string, farmId: string): Promise<AiMessage> {
    const snapshot = await this.getHerdSnapshot(farmId);

    // 1. Inquiries about Calving / Partos
    if (promptLower.includes('parto') || promptLower.includes('calving') || promptLower.includes('nacer') || promptLower.includes('preñad')) {
      const reproEvents = await db.reproductionEvents.where('pregnancyResult').equals('pregnant').toArray();
      const animals = await db.animals.toArray();
      const animalMap = new Map(animals.map(a => [a.id, a]));

      const upcoming = reproEvents
        .filter(r => r.projectedCalvingDate)
        .sort((a, b) => (a.projectedCalvingDate || '').localeCompare(b.projectedCalvingDate || ''));

      let listText = '';
      if (upcoming.length > 0) {
        listText = upcoming.map(r => {
          const a = animalMap.get(r.animalId);
          return `• **${a?.name || a?.earTagCode || 'Vaca'}** (Arete: ${a?.earTagCode}): Parto proyectado para el **${r.projectedCalvingDate}** (Secado: ${r.mandatoryDryOffDate || 'N/A'})`;
        }).join('\n');
      }

      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'farm_local',
        text: `Tienes un total de **${snapshot.pregnantCowsCount} hembras preñadas** confirmadas en el hato. En los próximos 30 días se esperan **${snapshot.upcomingCalvingsCount} partos**.\n\n${listText || 'No hay partos inmediatos en las próximas dos semanas.'}\n\n💡 *Recomendación:* Traslada a las hembras al potrero de maternidad 15 días antes de la fecha estimada, garantizando agua fresca y sales minerales preparto sin exceso de calcio.`,
        dataCard: {
          type: 'reproduction_alert',
          title: 'Resumen Reproductivo de Gestación',
          metrics: [
            { label: 'Hembras Preñadas', value: snapshot.pregnantCowsCount },
            { label: 'Partos en 30 días', value: snapshot.upcomingCalvingsCount },
            { label: 'Vacas en Secado', value: snapshot.dryCowsCount }
          ],
          actionLabel: 'Ver Calendario Reproductivo'
        }
      };
    }

    // 2. Inquiries about Dry-Off / Secado
    if (promptLower.includes('secado') || promptLower.includes('secar') || promptLower.includes('dry')) {
      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'farm_local',
        text: `El secado obligatorio debe realizarse estrictamente **60 días antes del parto** para permitir la regeneración del epitelio mamario y maximizar la producción de calostro de calidad.\n\nActualmente tienes **${snapshot.pendingDryOffCount} vacas** en ventana o próximas a secado.\n\n📋 *Protocolo recomendado para el secado:*\n1. Suspender el ordeño vespertino 3 días antes.\n2. Disminuir el alimento concentrado alto en proteína.\n3. En el último ordeño, vaciar la ubre a fondo y aplicar un pomo antibiótico intramamario de larga acción más sellador interno en los 4 pezones.\n4. Trasladar al lote de vacas secas en potrero de descanso.`,
        dataCard: {
          type: 'reproduction_alert',
          title: 'Monitoreo de Período de Secado',
          metrics: [
            { label: 'Próximas a Secar', value: snapshot.pendingDryOffCount },
            { label: 'Vacas Actualmente Secas', value: snapshot.dryCowsCount },
            { label: 'Período Recomendado', value: '60 días' }
          ]
        }
      };
    }

    // 3. Inquiries about Milk Production / Leche
    if (promptLower.includes('leche') || promptLower.includes('ordeño') || promptLower.includes('produccion') || promptLower.includes('litros')) {
      const milkings = await db.milkingRecords.toArray();
      const financials = await db.financialRecords.toArray();
      const weights = await db.weightRecords.toArray();
      const economics = FinancialEngine.calculateUnitEconomics(financials, milkings, weights);

      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'farm_local',
        text: `Tu hato cuenta con **${snapshot.milkingCowsCount} vacas en ordeño activo**, con una producción promedio de **${snapshot.avgDailyMilkLiters} L/día** en los registros recientes.\n\n💰 *Análisis de Rentabilidad Lechera:*\n• **Costo real por litro:** **$${economics.costPerLiterMilk} USD/L**\n• **Precio de venta promedio:** **$0.58 USD/L**\n• **Margen bruto por litro:** **$${economics.grossMarginPerLiterMilk} USD/L**\n• **Punto de equilibrio mensual:** **${economics.breakEvenMilkLitersMonthly.toLocaleString()} Litros** para cubrir costos fijos.\n\n💡 *Sugerencia:* Para optimizar el margen, suministra concentrado preferencial a las vacas de primer tercio de lactancia que superen los 16 L/día.`,
        dataCard: {
          type: 'financial_summary',
          title: 'Eficiencia y Costo del Litro de Leche',
          metrics: [
            { label: 'Costo por Litro', value: `$${economics.costPerLiterMilk}` },
            { label: 'Margen por Litro', value: `$${economics.grossMarginPerLiterMilk}` },
            { label: 'Vacas en Ordeño', value: snapshot.milkingCowsCount }
          ],
          actionLabel: 'Ver Panel Financiero'
        }
      };
    }

    // 4. Inquiries about Weight Gain / Ceba / Carne
    if (promptLower.includes('peso') || promptLower.includes('carne') || promptLower.includes('ceba') || promptLower.includes('ganancia') || promptLower.includes('adg') || promptLower.includes('gdp')) {
      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'farm_local',
        text: `La ganancia diaria de peso (GDP / ADG) promedio en tus lotes es de **${snapshot.avgAdgKg} kg/animal/día**.\n\n📊 *Evaluación técnica de crecimiento:*\n• Los novillos cruzados de ceba están mostrando excelente conversión alimenticia.\n• Se recomienda rotar lotes cada 4 a 6 días para aprovechar la hoja tierna antes de que se lignifique el pasto.\n• Mantén suplementación mineral con fósforo mínimo al 8% en esta etapa de desarrollo óseo.`,
        dataCard: {
          type: 'weight_gain_analysis',
          title: 'Ganancia Diaria de Peso (ADG)',
          metrics: [
            { label: 'GDP Promedio', value: `${snapshot.avgAdgKg} kg/día` },
            { label: 'Lote Principal', value: 'Ceba Intensiva' },
            { label: 'Rotación Sugerida', value: '4-5 días' }
          ]
        }
      };
    }

    // 5. Inquiries about Financials / Rentabilidad / Ganancias
    if (promptLower.includes('dinero') || promptLower.includes('finanza') || promptLower.includes('rentabilidad') || promptLower.includes('ganancia') || promptLower.includes('gasto') || promptLower.includes('utilidad')) {
      const milkings = await db.milkingRecords.toArray();
      const financials = await db.financialRecords.toArray();
      const weights = await db.weightRecords.toArray();
      const economics = FinancialEngine.calculateUnitEconomics(financials, milkings, weights);

      return {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'farm_local',
        text: `📈 *Estado Financiero y Rentabilidad Real:*\n\n• **Ingresos Totales:** **$${economics.totalIncome.toLocaleString()} USD**\n• **Egresos Operativos:** **$${economics.totalExpense.toLocaleString()} USD**\n• **Utilidad Neta:** **$${economics.netProfit.toLocaleString()} USD**\n• **Margen Operativo:** **${economics.profitMarginPercent}%**\n\nMantener el costo por litro bajo control y optimizar la rotación de praderas maximiza la rentabilidad neta por hectárea.`,
        dataCard: {
          type: 'financial_summary',
          title: 'Rentabilidad Operativa Neta',
          metrics: [
            { label: 'Ingresos', value: `$${economics.totalIncome.toLocaleString()}` },
            { label: 'Egresos', value: `$${economics.totalExpense.toLocaleString()}` },
            { label: 'Utilidad Neta', value: `$${economics.netProfit.toLocaleString()}` }
          ],
          actionLabel: 'Ver Detalle Financiero'
        }
      };
    }

    // Default Overview
    return {
      id: 'msg_' + Date.now(),
      sender: 'assistant',
      timestamp: Date.now(),
      mode: 'farm_local',
      text: `Hola, soy tu **Asistente Inteligente de APP GANADERA**.\n\n📌 *Estado actual del hato:*\n• **${snapshot.totalAnimals} animales activos** (${snapshot.femalesCount} hembras, ${snapshot.malesCount} machos).\n• **${snapshot.pregnantCowsCount} vacas preñadas** con **${snapshot.upcomingCalvingsCount} partos próximos**.\n• **${snapshot.pendingDryOffCount} vacas en fecha de secado obligatorio**.\n• **${snapshot.avgDailyMilkLiters} L/día** de producción lechera promedio.\n• **Utilidad neta registrada:** **$${snapshot.monthlyNetProfit.toLocaleString()} USD**.\n\nPuedes hacerme preguntas sobre **tu hato** o activar el **Consultor Global** para preguntas zootécnicas externas (fármacos, IATF, pasturas, formulación de dietas).`,
      dataCard: {
        type: 'reproduction_alert',
        title: 'Ficha Resumen del Hato',
        metrics: [
          { label: 'Total Animales', value: snapshot.totalAnimals },
          { label: 'Preñadas', value: snapshot.pregnantCowsCount },
          { label: 'Utilidad Neta', value: `$${snapshot.monthlyNetProfit}` }
        ]
      }
    };
  }
}
