const express = require('express');

module.exports = (db, genAI) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Intentar obtener de la DB
            const results = await db.query("SELECT * FROM horoscopos WHERE fecha = ?", [today]);
            
            // Si hay resultados, verificamos que sean de calidad (contengan Salud, Dinero y Amor)
            if (results.length > 0) {
                const pred = results[0].prediccion || '';
                // Verificación POSITIVA: el horóscopo debe mencionar los tres pilares
                const tieneCalidad = 
                    (pred.toLowerCase().includes('salud') || pred.toLowerCase().includes('health')) &&
                    (pred.toLowerCase().includes('dinero') || pred.toLowerCase().includes('econom') || pred.toLowerCase().includes('trabajo')) &&
                    (pred.toLowerCase().includes('amor') || pred.toLowerCase().includes('pareja') || pred.toLowerCase().includes('relaci'));

                if (tieneCalidad && pred.length > 150) {
                    console.log("🔮 Horóscopo de calidad recuperado de la base de datos.");
                    return res.json(results);
                }
                // Si no tiene calidad, borramos y regeneramos
                console.log("⚠️ Horóscopo sin Salud/Dinero/Amor en DB. Borrando y regenerando...");
                await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
            }

            // 2. Intentar primero con Gemini (Dual Logic)
            try {
                console.log("✨ Intentando sintonizar IA (Gemini)...");
                const modelosAProbar = ["gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.0-pro"];
                let text = "";

                for (const modName of modelosAProbar) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modName });
                        const prompt = `Actúa como un Astrólogo profesional experto, estilo horóscopo de diario nacional (tipo 20 Minutos). 
                        Genera un horóscopo DIARIO para hoy (${today}) para los 12 signos del zodiaco.
                        REQUISITOS:
                        - TEMÁTICA OBLIGATORIA: Cada predicción DEBE estar dividida en tres partes claras: SALUD, DINERO y AMOR.
                        - ESTILO: Lenguaje cercano, positivo, directo y útil. Evita jerga técnica o de ciencia ficción.
                        - FORMATO DE SALIDA: Un párrafo fluido por signo que cubra los tres aspectos.
                        - ESTRUCTURA JSON: Array JSON [{"signo": "Aries", "prediccion": "Salud: ... Dinero: ... Amor: ..."}, ...].
                        - IDIOMA: Español de España.`;
                        
                        const result = await model.generateContent(prompt);
                        const response = await result.response;
                        text = response.text();
                        if (text && text.includes('[')) break;
                    } catch (e) { console.log(`Fallback local activado para ${modName}: ${e.message}`); }
                }

                if (text) {
                    // Limpieza robusta: buscamos el primer '[' y el último ']'
                    const inicio = text.indexOf('[');
                    const fin = text.lastIndexOf(']') + 1;
                    if (inicio !== -1 && fin !== -1) {
                        const jsonPuro = text.substring(inicio, fin);
                        const horoscopos = JSON.parse(jsonPuro);
                        
                        await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
                        for (const h of horoscopos) {
                            await db.execute("INSERT INTO horoscopos (signo, prediccion, fecha) VALUES (?, ?, ?)", [h.signo, h.prediccion, today]);
                        }
                        return res.json(horoscopos);
                    }
                }
            } catch (err) {
                console.log("📡 IA fuera de servicio o error de formato. Activando generador de emergencia...");
            }

            // 3. Generador de Emergencia (Local) - Mejorado para evitar repeticiones
            const signos = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
            
            const frasesInicio = [
                "Hoy los astros te favorecen en lo personal:",
                "Se avecinan cambios importantes en tu entorno:",
                "Es un día ideal para reflexionar sobre tus metas:",
                "La energía de hoy es perfecta para nuevos comienzos:",
                "Sentirás una conexión especial con la gente que te rodea:",
                "Los planetas indican que recibirás una sorpresa positiva:",
                "Tu intuición estará más afilada que nunca durante la jornada:",
                "Es el momento de tomar esa decisión que venías posponiendo:",
                "La suerte está de tu lado en los pequeños detalles del día:",
                "Hoy brillarás con luz propia en cualquier situación social:"
            ];

            const frasesMedio = [
                "En la salud te sentirás con mucha energía, pero en el dinero conviene ser prudente con los gastos innecesarios, mientras que en el amor una conversación pendiente aclarará muchas dudas.",
                "La salud te pedirá un respiro y descanso, el dinero fluirá mejor si organizas tus cuentas hoy mismo, y en el amor alguien del pasado podría intentar contactar contigo.",
                "Hoy la salud está en un punto alto, aprovecha para hacer deporte. En el dinero llega una oportunidad inesperada de ingresos, y en el amor la pasión será la protagonista de la noche.",
                "Vigila tu alimentación para mejorar tu salud. En el dinero, evita inversiones arriesgadas. En el amor, la estabilidad con tu pareja será tu mayor refugio hoy.",
                "Tu salud mental necesita calma; medita. En el dinero, recibirás noticias de un pago atrasado. En el amor, es un buen momento para conocer a alguien nuevo o salir de la rutina.",
                "Un pequeño dolor de espalda te recordará que debes cuidarte más. En el dinero, la fortuna te sonríe en los juegos de azar. En el amor, la complicidad será total hoy.",
                "Sentirás una vitalidad envidiable. En el dinero, un gasto imprevisto te obligará a recalibrar tu presupuesto. En el amor, deja que el corazón hable más que la cabeza.",
                "La salud te acompaña para afrontar retos. En el dinero, una propuesta laboral podría cambiar tus planes. En el amor, alguien cercano te demostrará su cariño de forma especial.",
                "Descansa la vista de las pantallas por salud. En el dinero, la austeridad de hoy será el éxito de mañana. En el amor, se abre un ciclo de mucha ternura y confianza.",
                "Energía a tope para terminar proyectos. En el dinero, tu esfuerzo por fin será recompensado económicamente. En el amor, la soltería te sienta bien, pero alguien te observa."
            ];

            const frasesFin = [
                "Recuerda que tú eres el dueño de tu propio destino.",
                "Disfruta de cada momento, la felicidad está en los detalles.",
                "No dejes para mañana lo que te haga feliz hoy.",
                "Confía en el proceso, todo llega en el momento justo.",
                "Mantén una actitud positiva y atraerás cosas buenas.",
                "El éxito es la suma de pequeños esfuerzos diarios.",
                "Sé valiente y sigue a tu corazón en todo lo que hagas.",
                "Hoy es un gran día para ser tu mejor versión.",
                "El universo conspira a tu favor, ¡aprovéchalo!",
                "Salud, dinero y amor: hoy lo tienes todo al alcance de la mano."
            ];

            const horoscopos = signos.map((signo, i) => {
                const dia = new Date().getDate();
                const mes = new Date().getMonth() + 1;
                const year = new Date().getFullYear();
                
                // Función de hash para dispersión total (evita colisiones Aries/Acuario)
                const str = `${signo}-${dia}-${mes}-${year}-bunker`;
                let hash = 0;
                for (let j = 0; j < str.length; j++) {
                    hash = ((hash << 5) - hash) + str.charCodeAt(j);
                    hash |= 0;
                }
                const seed = Math.abs(hash);
                
                const f1 = frasesInicio[seed % frasesInicio.length];
                const f2 = frasesMedio[(seed + i * 7) % frasesMedio.length];
                const f3 = frasesFin[(seed + i * 13) % frasesFin.length];
                
                return { signo, prediccion: `${f1} ${f2} ${f3}` };
            });

            await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
            for (const h of horoscopos) {
                await db.execute("INSERT INTO horoscopos (signo, prediccion, fecha) VALUES (?, ?, ?)", [h.signo, h.prediccion, today]);
            }
            res.json(horoscopos);
        } catch (err) {
            console.error("❌ Fallo en la frecuencia astral:", err.message);
            res.status(500).json({ error: "Fallo crítico en el radar astral." });
        }
    });

    return router;
};
