const db = require('../db');

const horoscoposReales = [
  {
    "signo": "Aries",
    "prediccion": "Nivel de alerta roja en tu sector laboral. La influencia de Marte está provocando picos de tensión electromagnética con tus superiores. Si no mantienes la prudencia y el silencio táctico, podrías enfrentarte a un conflicto directo que comprometa tu posición en el búnker. Evita los desencuentros en la vida íntima; las sombras están escuchando."
  },
  {
    "signo": "Tauro",
    "prediccion": "Frecuencia de éxito detectada. Hoy tu voluntad e inteligencia son tus mejores herramientas de defensa. No esperes a que la suerte llegue por azar; tu actividad constante ha desbloqueado una fase fecunda. Las comunicaciones externas te traerán información valiosa sobre alianzas estratégicas. Aprovecha esta ventana de oportunidad energética."
  },
  {
    "signo": "Géminis",
    "prediccion": "Tus sueños e ilusiones están emitiendo en una banda de alta fidelidad. Durante la primera mitad del día, tus iniciativas laborales estarán alineadas con los archivos del destino. Es un momento favorable para los asuntos materiales, pero mantén un ojo en lo emocional; tu firma biológica está más sensible de lo normal a las interferencias externas."
  },
  {
    "signo": "Cáncer",
    "prediccion": "Momento crítico para la toma de decisiones. El búnker detecta una bifurcación en tu destino laboral. Debes elegir entre varias alternativas de seguridad. Esta elección marcará el inicio de un cambio profundo, tanto material como espiritual. Un ciclo antiguo se cierra definitivamente, pero el nuevo horizonte es esperanzador si actúas con firmeza."
  },
  {
    "signo": "Leo",
    "prediccion": "La racha de éxitos continúa, pero no bajes la guardia. Tu destino se ha adentrado en un cuadrante más armonioso y cómodo, consolidando las perspectivas positivas de los últimos días. Es el momento excelente para tomar la iniciativa en proyectos de investigación o misiones de campo. La frecuencia es estable; procede con confianza total."
  },
  {
    "signo": "Virgo",
    "prediccion": "Recibirás noticias clasificadas que llevas tiempo esperando. Tu estado emocional está registrando una recuperación notable, sintonizando con una frecuencia de esperanza real. Los viajes de ocio o misiones de exploración fuera del búnker serán especialmente exitosos hoy. Disfruta de esta tregua en las tormentas astrales."
  },
  {
    "signo": "Libra",
    "prediccion": "Interferencias graves detectadas. Hoy el ambiente estará crispado y tenso, especialmente en el área de operaciones laborales. Te conviene 'ponerte de perfil' y dejar que otros tomen el mando momentáneamente. No es el día para ser el centro de atención. Es solo una tormenta pasajera de radiación astral; en unos días el radar se despejará."
  },
  {
    "signo": "Escorpio",
    "prediccion": "ALERTA DE INFILTRADO. Ten los ojos bien abiertos: no todas las palmadas en la espalda vienen de amigos leales. El destino va a desenmascarar hoy a alguien en quien confiabas plenamente. Una decepción dolorosa pero necesaria para limpiar tu círculo de seguridad. Quédate solo con los agentes incondicionales; la verdad duele pero libera."
  },
  {
    "signo": "Sagitario",
    "prediccion": "Operación de balance complejo. El destino te dará una ventaja táctica pero te exigirá un precio elevado a cambio. Verás éxitos claros, pero el camino estará lleno de complicaciones técnicas y momentos de alta tensión. Al final del día, el balance será positivo, pero prepárate para una jornada de desgaste energético considerable."
  },
  {
    "signo": "Capricornio",
    "prediccion": "Fallo en las previsiones administrativas. Asuntos que creías bajo control podrían darte una sorpresa desagradable hoy. No es el momento de arriesgar tus finanzas ni de iniciar maniobras tácticas de alto riesgo en el trabajo. Mantén un perfil bajo y revisa tus archivos dos veces antes de firmar cualquier protocolo de seguridad."
  },
  {
    "signo": "Acuario",
    "prediccion": "Día de dos fases. La mañana comenzará con interferencias y conflictos en tu red social y laboral. Sin embargo, según avance el sol, la frecuencia se irá modulando hacia una armonía inesperada. Los viajes o desplazamientos serán afortunados a pesar de un inicio problemático. El radar terminará en verde al final del turno."
  },
  {
    "signo": "Piscis",
    "prediccion": "Fase de mutación positiva. Te encuentras en un momento de cambios profundos que llegan por rutas no convencionales. La iniciativa propia será tu mayor activo hoy. Es un día excelente para los negocios, las finanzas y las misiones de campo. Un éxito inesperado aparecerá en tu radar cuando menos lo busques. Procede con audacia."
  }
];

async function updateHoroscopo() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`📡 ACTUALIZANDO HORÓSCOPO REAL DEL BÚNKER (${today})...`);
        
        await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
        
        for (const h of horoscoposReales) {
            await db.execute("INSERT INTO horoscopos (signo, prediccion, fecha) VALUES (?, ?, ?)", [h.signo, h.prediccion, today]);
        }
        
        console.log("✅ SISTEMA ACTUALIZADO: Las predicciones reales han sido interceptadas y bunkerizadas.");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN LA ACTUALIZACIÓN:", err);
        process.exit(1);
    }
}

updateHoroscopo();
