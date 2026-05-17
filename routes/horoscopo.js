const express = require('express');

module.exports = (db, genAI) => {
    const router = express.Router();

    // ─── FUNCIÓN GENERADOR LOCAL DE EMERGENCIA (único por signo y día) ───────
    function generarHoroscopoLocal(lang = 'es') {
        const signos = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];

        const pools = {
            es: {
                salud: [
                    "Tu energía vital está en su punto más alto hoy.",
                    "Descansa un poco más de lo habitual para recuperar fuerzas.",
                    "El ejercicio moderado te traerá grandes beneficios esta jornada.",
                    "Cuida tu alimentación; el cuerpo te lo agradecerá esta semana.",
                    "Tu mente estará despejada, aprovéchala para tomar decisiones.",
                    "Un pequeño descanso a media jornada te recargará por completo.",
                    "Evita el estrés innecesario; la calma será tu mejor medicina hoy.",
                    "La vitalidad te acompañará desde primera hora de la mañana.",
                    "Presta atención a tu postura; tu espalda te lo agradecerá.",
                    "Una caminata al aire libre renovará tu energía por completo.",
                    "Tu sistema inmune estará reforzado; es buen momento para el deporte.",
                    "Descuida las pantallas un rato; tus ojos necesitan descanso hoy."
                ],
                dinero: [
                    "Una oportunidad económica inesperada llama a tu puerta hoy.",
                    "Sé prudente con los gastos; el ahorro será tu mejor inversión.",
                    "Una propuesta laboral podría cambiar tu situación financiera.",
                    "Evita decisiones de riesgo; conserva lo que ya has conseguido.",
                    "El esfuerzo de estos días empieza a dar sus primeros frutos.",
                    "Recibirás noticias positivas relacionadas con un pago pendiente.",
                    "Es un buen día para negociar; tu labia estará en su máximo.",
                    "Un gasto imprevisto te obligará a reorganizar tu presupuesto.",
                    "La constancia en el trabajo te reportará recompensas económicas.",
                    "Consulta con alguien de confianza antes de firmar cualquier documento.",
                    "Tu intuición financiera estará afilada; confía en ella hoy.",
                    "Un pequeño negocio o proyecto secundario podría despegar pronto."
                ],
                amor: [
                    "Una conversación pendiente despejará el ambiente en tu relación.",
                    "La pasión renacerá con fuerza si das el primer paso hoy.",
                    "Alguien especial captará tu atención de forma inesperada.",
                    "La complicidad con tu pareja estará en su mejor momento.",
                    "Si estás soltero/a, el universo te prepara un encuentro especial.",
                    "La ternura y el detalle serán las claves del día en el amor.",
                    "Deja que el corazón hable más que la cabeza esta jornada.",
                    "Un mensaje o llamada inesperada te arrancará una gran sonrisa.",
                    "La honestidad en pareja abrirá un ciclo nuevo lleno de confianza.",
                    "El amor propio es fundamental hoy; cuídate antes que a los demás.",
                    "Una persona del pasado podría aparecer con nuevas intenciones.",
                    "La estabilidad emocional será tu mayor fortaleza en el amor hoy."
                ],
                cierre: [
                    "Confía en el proceso; todo llega en el momento justo.",
                    "Eres el dueño de tu propio destino, aprovecha cada instante.",
                    "El universo conspira a tu favor; mantén una actitud positiva.",
                    "Los pequeños esfuerzos diarios construyen los grandes éxitos.",
                    "Disfruta de los detalles; la felicidad está en lo cotidiano.",
                    "Sé valiente y sigue a tu corazón en todo lo que emprendas.",
                    "Hoy es un gran día para ser tu mejor versión.",
                    "No dejes para mañana lo que te hará feliz hoy.",
                    "Mantén la calma; las respuestas llegarán cuando menos lo esperes.",
                    "Tu luz interior iluminará el camino de los que te rodean.",
                    "El éxito no se persigue, se construye día a día con disciplina.",
                    "Salud, amor y prosperidad: hoy el cosmos juega a tu favor."
                ]
            },
            en: {
                salud: [
                    "Your vital energy is at its peak today.",
                    "Rest a little more than usual to restore your strength.",
                    "Moderate exercise will bring great benefits to your day.",
                    "Watch your diet; your body will thank you for it this week.",
                    "Your mind will be clear — use it to make key decisions.",
                    "A short mid-day break will recharge you completely.",
                    "Avoid unnecessary stress; calm is your best medicine today.",
                    "Vitality will be with you from the very first hours of the morning.",
                    "Pay attention to your posture; your back will thank you.",
                    "A walk in the fresh air will renew your energy completely.",
                    "Your immune system is strong; now is a great time for sport.",
                    "Step away from screens for a while; your eyes need rest today."
                ],
                dinero: [
                    "An unexpected financial opportunity is knocking at your door today.",
                    "Be prudent with expenses; saving is your best investment right now.",
                    "A work proposal could change your financial situation for the better.",
                    "Avoid risky decisions; protect what you have already earned.",
                    "The effort of recent days is beginning to bear its first fruits.",
                    "You will receive positive news related to a pending payment.",
                    "It is a good day to negotiate; your persuasiveness is at its peak.",
                    "An unforeseen expense will force you to reorganise your budget.",
                    "Consistency at work will bring you economic rewards.",
                    "Consult someone you trust before signing any document today.",
                    "Your financial intuition is sharp today; trust it.",
                    "A small side project or business could be ready to take off soon."
                ],
                amor: [
                    "A pending conversation will clear the air in your relationship.",
                    "Passion will be rekindled if you make the first move today.",
                    "Someone special will catch your attention in an unexpected way.",
                    "The complicity with your partner will be at its very best.",
                    "If you are single, the universe is preparing a special encounter for you.",
                    "Tenderness and small gestures will be the keys to love today.",
                    "Let your heart speak more than your head in matters of love.",
                    "An unexpected message or call will bring a big smile to your face.",
                    "Honesty in your relationship will open a new cycle full of trust.",
                    "Self-love is fundamental today; take care of yourself first.",
                    "Someone from the past may reappear with new intentions.",
                    "Emotional stability will be your greatest strength in love today."
                ],
                cierre: [
                    "Trust the process; everything arrives at exactly the right moment.",
                    "You are the master of your own destiny — make the most of every moment.",
                    "The universe conspires in your favour; keep a positive attitude.",
                    "Small daily efforts build the great successes of tomorrow.",
                    "Enjoy the little things; happiness is found in the everyday.",
                    "Be brave and follow your heart in everything you undertake.",
                    "Today is a great day to be your best self.",
                    "Do not leave for tomorrow what will make you happy today.",
                    "Stay calm; answers will come when you least expect them.",
                    "Your inner light will illuminate the path of those around you.",
                    "Success is not chased, it is built day by day with discipline.",
                    "Health, love and prosperity: today the cosmos plays in your favour."
                ]
            }
        };

        const p = pools[lang] || pools.es;
        const dia = new Date().getDate();
        const mes = new Date().getMonth() + 1;
        const year = new Date().getFullYear();

        return signos.map((signo, i) => {
            // Hash único por signo + día + idioma → sin colisiones
            const str = `${signo}-${dia}-${mes}-${year}-${lang}-bunker`;
            let hash = 0;
            for (let j = 0; j < str.length; j++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(j);
                hash |= 0;
            }
            const seed = Math.abs(hash);

            const salud   = p.salud[seed % p.salud.length];
            const dinero  = p.dinero[(seed + i * 7 + 3) % p.dinero.length];
            const amor    = p.amor[(seed + i * 13 + 5) % p.amor.length];
            const cierre  = p.cierre[(seed + i * 11 + 9) % p.cierre.length];

            const prediccion = lang === 'en'
                ? `Health: ${salud} Money: ${dinero} Love: ${amor} ${cierre}`
                : `Salud: ${salud} Dinero: ${dinero} Amor: ${amor} ${cierre}`;

            return { signo, prediccion };
        });
    }

    router.get('/', async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const lang = req.query.lang === 'en' ? 'en' : 'es';
            const dbField = lang === 'en' ? 'prediccion_en' : 'prediccion';

            // 1. Intentar obtener de la DB (verificamos que hay 12 signos con contenido)
            const results = await db.query("SELECT * FROM horoscopos WHERE fecha = ?", [today]);

            if (results.length >= 12) {
                const todosValidos = results.every(r => {
                    const pred = (r[dbField] || r.prediccion || '');
                    return pred.length > 80;
                });

                if (todosValidos) {
                    console.log(`🔮 Horóscopo (${lang}) recuperado de la BD.`);
                    return res.json(results.map(r => ({
                        signo: r.signo,
                        prediccion: r[dbField] || r.prediccion
                    })));
                }
                // Datos incompletos → regenerar
                console.log("⚠️ Horóscopo incompleto en DB. Regenerando...");
                await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
            }

            // 2. Intentar con Gemini IA
            try {
                console.log(`✨ Intentando sintonizar IA (Gemini) para idioma: ${lang}...`);
                const modelosAProbar = ["gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.0-pro"];
                let text = "";

                const promptEs = `Actúa como un Astrólogo profesional experto, estilo horóscopo de diario nacional (tipo 20 Minutos).
Genera un horóscopo DIARIO para hoy (${today}) para los 12 signos del zodiaco.
REQUISITOS:
- Cada predicción DEBE cubrir tres aspectos: SALUD, DINERO y AMOR (en este orden, etiquetados).
- Estilo: lenguaje cercano, positivo, directo y útil.
- Un párrafo fluido por signo que cubra los tres aspectos.
- IMPORTANTE: Cada signo DEBE tener una predicción DIFERENTE y única. No repitas frases entre signos.
- ESTRUCTURA JSON: Array JSON [{"signo": "Aries", "prediccion": "Salud: ... Dinero: ... Amor: ..."}, ...].
- IDIOMA: Español de España.`;

                const promptEn = `Act as a professional expert Astrologer in the style of a national newspaper horoscope (like The Guardian or The Times).
Generate a DAILY horoscope for today (${today}) for all 12 zodiac signs.
REQUIREMENTS:
- Each prediction MUST cover three aspects: HEALTH, MONEY and LOVE (in this order, clearly labelled).
- Style: friendly, positive, direct and useful language.
- One flowing paragraph per sign covering all three aspects.
- IMPORTANT: Each sign MUST have a UNIQUE and DIFFERENT prediction. Do not repeat phrases across signs.
- JSON STRUCTURE: JSON array [{"signo": "Aries", "prediccion": "Health: ... Money: ... Love: ..."}, ...].
- LANGUAGE: British English.`;

                const prompt = lang === 'en' ? promptEn : promptEs;

                for (const modName of modelosAProbar) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modName });
                        const result = await model.generateContent(prompt);
                        const response = await result.response;
                        text = response.text();
                        if (text && text.includes('[')) break;
                    } catch (e) {
                        console.log(`Fallback para ${modName}: ${e.message}`);
                    }
                }

                if (text) {
                    const inicio = text.indexOf('[');
                    const fin = text.lastIndexOf(']') + 1;
                    if (inicio !== -1 && fin > inicio) {
                        const jsonPuro = text.substring(inicio, fin);
                        const horoscopos = JSON.parse(jsonPuro);

                        if (horoscopos.length >= 12) {
                            await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
                            for (const h of horoscopos) {
                                if (lang === 'en') {
                                    await db.execute(
                                        "INSERT INTO horoscopos (signo, prediccion, prediccion_en, fecha) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE prediccion_en = VALUES(prediccion_en)",
                                        [h.signo, h.prediccion, h.prediccion, today]
                                    );
                                } else {
                                    await db.execute(
                                        "INSERT INTO horoscopos (signo, prediccion, fecha) VALUES (?, ?, ?)",
                                        [h.signo, h.prediccion, today]
                                    );
                                }
                            }
                            console.log(`✅ Horóscopo IA (${lang}) guardado en BD.`);
                            return res.json(horoscopos);
                        }
                    }
                }
            } catch (err) {
                console.log("📡 IA no disponible. Activando generador local...");
            }

            // 3. Generador local de emergencia
            console.log(`🔧 Usando generador local para idioma: ${lang}`);
            const horoscopos = generarHoroscopoLocal(lang);

            await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
            for (const h of horoscopos) {
                await db.execute(
                    "INSERT INTO horoscopos (signo, prediccion, fecha) VALUES (?, ?, ?)",
                    [h.signo, h.prediccion, today]
                );
            }
            res.json(horoscopos);

        } catch (err) {
            console.error("❌ Fallo en la frecuencia astral:", err.message);
            res.status(500).json({ error: "Fallo crítico en el radar astral." });
        }
    });

    return router;
};
