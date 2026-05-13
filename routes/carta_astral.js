const express = require('express');

module.exports = (db, genAI) => {
    const router = express.Router();

    // Mapeo de signos
    const SIGNOS = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
    const getSigno = (long) => SIGNOS[Math.floor(long / 30)];

    let swissephInstance = null;

    const getSwisseph = async () => {
        if (swissephInstance) return swissephInstance;
        console.log("🌌 Inicializando motor astronómico...");
        const { default: SwissEph } = await import('swisseph-wasm');
        swissephInstance = new SwissEph();
        await swissephInstance.initSwissEph();
        return swissephInstance;
    };

    // Función para calcular posiciones
    const calcularCarta = async (fecha, hora, lat, lon) => {
        const swe = await getSwisseph();
        const [year, month, day] = fecha.split('-').map(Number);
        const [h, m] = (hora || "12:00").split(':').map(Number);
        
        // Convertir a tiempo Juliano
        const ut = h + m / 60;
        const jd = swe.julday(year, month, day, ut);

        const planetas = [
            { id: swe.SE_SUN, nombre: "Sol" },
            { id: swe.SE_MOON, nombre: "Luna" },
            { id: swe.SE_MERCURY, nombre: "Mercurio" },
            { id: swe.SE_VENUS, nombre: "Venus" },
            { id: swe.SE_MARS, nombre: "Marte" },
            { id: swe.SE_JUPITER, nombre: "Júpiter" },
            { id: swe.SE_SATURN, nombre: "Saturno" }
        ];

        const resultados = planetas.map(p => {
            const res = swe.calc_ut(jd, p.id, swe.SEFLG_SPEED);
            const lonPlanet = res[0]; 
            return {
                nombre: p.nombre,
                longitud: lonPlanet,
                signo: getSigno(lonPlanet)
            };
        });

        // Calcular Ascendente y Casas (Placidus por defecto)
        const housesData = swe.houses(jd, lat, lon, 'P');
        const ascendant = housesData.ascmc[0];
        resultados.push({
            nombre: "Ascendente",
            longitud: ascendant,
            signo: getSigno(ascendant)
        });

        return resultados;
    };

    // Endpoint para guardar/actualizar datos y obtener la carta
    router.post('/mi-carta', async (req, res) => {
        const { email, fecha_nacimiento, hora_nacimiento, ciudad_nacimiento, lat_nacimiento, lon_nacimiento } = req.body;

        try {
            // 1. Actualizar datos del usuario si se proporcionan
            if (fecha_nacimiento) {
                await db.execute(
                    "UPDATE usuarios SET fecha_nacimiento = ?, hora_nacimiento = ?, ciudad_nacimiento = ?, lat_nacimiento = ?, lon_nacimiento = ? WHERE email = ?",
                    [fecha_nacimiento, hora_nacimiento, ciudad_nacimiento, lat_nacimiento, lon_nacimiento, email]
                );
            }

            // 2. Obtener datos completos del usuario
            const userResults = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
            if (userResults.length === 0) return res.status(404).json({ error: "Agente no encontrado." });
            
            const user = userResults[0];

            if (!user.fecha_nacimiento) {
                return res.status(400).json({ error: "Faltan datos de nacimiento." });
            }

            // 3. Calcular posiciones
            const posiciones = await calcularCarta(user.fecha_nacimiento, user.hora_nacimiento, user.lat_nacimiento, user.lon_nacimiento);
            
            // 4. Generar interpretación con IA (o Fallback Local si Frankfurt falla)
            const prompt = `Analiza estas posiciones astrológicas: ${posiciones.map(p => `${p.nombre} en ${p.signo}`).join(', ')}. Escribe una interpretación corta en español sobre la personalidad. El tono debe ser profesional, místico y un poco críptico, como un informe del Búnker de Expediente X. Máximo 150 palabras.`;

            let interpretacion = "";
            const modelos = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.0-pro"];

            for (const modName of modelos) {
                try {
                    console.log(`📡 Intentando sintonizar canal ${modName} (Oficial)...`);
                    const model = genAI.getGenerativeModel({ model: modName }, { apiVersion: 'v1' });
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    interpretacion = response.text();
                    if (interpretacion) break;
                } catch (errIA) {
                    console.error(`❌ Fallo en canal ${modName}:`, errIA.message);
                }
            }

            // --- GENERADOR MÍSTICO LOCAL PRO (SISTEMA DE VARIEDAD FRANKFURT) ---
            if (!interpretacion) {
                console.log("⚠️ ACTIVANDO PROTOCOLO DE EMERGENCIA: Generador Local con Variedad.");
                
                const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

                const DICCIONARIO = {
                    "Sol": {
                        "Aries": [
                            "Tu esencia arde con la fuerza de la primera chispa del cosmos. Eres un pionero en la oscuridad.",
                            "Irradias la energía de un guerrero solar. Tu voluntad es el motor que rompe cualquier inercia.",
                            "Eres pura acción iniciadora. Tu espíritu no conoce el miedo ante lo desconocido.",
                            "Tu firma energética es una llamarada de coraje. Lideras donde otros temen siquiera mirar."
                        ],
                        "Tauro": [
                            "Tu espíritu se arraiga en la tierra fértil de la constancia. Buscas la belleza en lo tangible.",
                            "Posees la fuerza de la montaña. Tu perseverancia es tu mayor tesoro en este búnker.",
                            "Eres el guardián de lo estable. Tu esencia vibra con la armonía de la naturaleza y el placer.",
                            "Tu alma es un santuario de paz y resistencia. Construyes para la eternidad."
                        ],
                        "Géminis": [
                            "Tu alma es un puente de palabras y viento. Tu dualidad es tu mayor herramienta de búsqueda.",
                            "Eres un mensajero cósmico. Tu mente vuela más rápido que la luz, conectando ideas imposibles.",
                            "Vives en la eterna curiosidad. Tu esencia es una red de información que nunca deja de crecer.",
                            "Tu espíritu es un caleidoscopio de ideas. Eres el nexo entre dimensiones a través del lenguaje."
                        ],
                        "Cáncer": [
                            "Reflejas la luz del pasado como un espejo de plata. Tu hogar es tu santuario sagrado.",
                            "Eres el guardián de la memoria. Tu esencia es un refugio protector para las almas sensibles.",
                            "Tu espíritu fluye con las mareas. Eres la conexión emocional que mantiene unido al búnker.",
                            "Tu alma es un océano de sentimientos profundos. Proteges lo sagrado con una fuerza invisible."
                        ],
                        "Leo": [
                            "Brillas con la intensidad de una estrella soberana. Tu presencia es un faro para los perdidos.",
                            "Tu corazón es un sol central. Irradias una calidez y una nobleza que inspiran a otros agentes.",
                            "Eres el fuego creativo del universo. Tu esencia necesita expresarse con fuerza y elegancia.",
                            "Tu espíritu es pura luz majestuosa. Llevas la chispa divina en cada acto de generosidad."
                        ],
                        "Virgo": [
                            "Buscas la perfección en el caos del universo. Tu mente es un bisturí que disecciona la realidad.",
                            "Eres el analista del cosmos. Tu espíritu encuentra el orden sagrado oculto en los detalles.",
                            "Tu esencia es el servicio y la pureza. Buscas mejorar el mundo a través del trabajo meticuloso.",
                            "Tu alma es un templo de eficiencia y discernimiento. El caos se rinde ante tu lógica sagrada."
                        ],
                        "Libra": [
                            "Eres el equilibrio en la balanza del destino. Buscas la armonía entre luces y sombras.",
                            "Tu espíritu es un artista de la diplomacia. Ves la belleza donde otros solo ven conflicto.",
                            "Buscas la justicia universal. Tu esencia necesita la compañía y la paz para florecer.",
                            "Tu alma es un reflejo de la belleza cósmica. Tejes redes de paz en un universo de discordia."
                        ],
                        "Escorpio": [
                            "Tu energía emana de las profundidades abisales. Conoces los secretos que otros temen susurrar.",
                            "Eres el fénix del búnker. Tu esencia es la transformación constante a través de la intensidad.",
                            "Tu espíritu es un imán de misterios. No temes mirar al abismo porque el abismo te reconoce.",
                            "Tu alma es pura potencia regeneradora. Posees la llave de los misterios más oscuros de la existencia."
                        ],
                        "Sagitario": [
                            "Tu flecha apunta a lo infinito. Eres un buscador de verdades ocultas tras el horizonte.",
                            "Tu espíritu es una hoguera de optimismo. Buscas el significado más profundo de la existencia.",
                            "Eres el explorador de planos superiores. Tu esencia no puede ser encadenada por la rutina.",
                            "Tu alma es un viaje sin fin hacia la sabiduría. Tu fe es una antorcha que nunca se apaga."
                        ],
                        "Capricornio": [
                            "Construyes tu destino sobre la roca del tiempo. Tu ambición es tan antigua como las montañas.",
                            "Eres el arquitecto de lo real. Tu espíritu conoce el valor del esfuerzo y la maestría.",
                            "Tu esencia es la cima de la montaña. Miras al mundo con la sabiduría de quien ha escalado solo.",
                            "Tu alma es un ejemplo de disciplina y poder sereno. El tiempo es tu mejor aliado, no tu enemigo."
                        ],
                        "Acuario": [
                            "Tu frecuencia vibra con el futuro. Eres el portador del agua que despierta a la humanidad.",
                            "Eres un rayo de originalidad en la tormenta. Tu espíritu rompe las cadenas de lo establecido.",
                            "Tu esencia es la mente colmena universal. Buscas el progreso de todos antes que el propio.",
                            "Tu alma es un destello de genialidad disruptiva. Vives hoy el mañana que otros ni siquiera imaginan."
                        ],
                        "Piscis": [
                            "Nadas en el océano de los sueños universales. Tu intuición no conoce fronteras físicas.",
                            "Eres el místico del zodiaco. Tu espíritu se disuelve en la compasión y el arte infinito.",
                            "Tu esencia es una canción olvidada. Conectas con lo invisible a través de la sensibilidad.",
                            "Tu alma es un portal a otras dimensiones de paz y amor universal. Tu sensibilidad es tu superpoder."
                        ]
                    },
                    "Luna": {
                        "Aries": ["Sientes con fuego. Reaccionas rápido.", "Emociones valientes y directas.", "Necesitas independencia emocional.", "Tu instinto es la acción inmediata."],
                        "Tauro": ["Necesitas seguridad física.", "Emociones estables y tranquilas.", "Tu paz es el confort.", "Buscas el refugio en los sentidos."],
                        "Géminis": ["Necesitas hablar de lo que sientes.", "Emociones inquietas.", "Tu refugio es la información.", "Racionalizas el sentimiento para entenderlo."],
                        "Cáncer": ["Eres una esponja emocional.", "Necesitas pertenecer y cuidar.", "Tu humor cambia con la luna.", "Tu hogar es tu piel emocional."],
                        "Leo": ["Necesitas ser adorado.", "Corazón generoso y dramático.", "Tus sentimientos son regios.", "Expresas tu dolor con nobleza."],
                        "Virgo": ["Analizas por qué sufres.", "Necesitas orden emocional.", "Eres servicial en el afecto.", "Cuidas a través del detalle práctico."],
                        "Libra": ["No soportas estar solo.", "Buscas la paz en el otro.", "Reflejas los sentimientos ajenos.", "Necesitas belleza para sentirte a salvo."],
                        "Escorpio": ["Sientes hasta la médula.", "Pasiones secretas y magnéticas.", "Necesitas control emocional.", "Tus emociones son tu motor de transformación."],
                        "Sagitario": ["Odias el drama emocional.", "Necesitas espacio para sentir.", "Tu fe te sostiene.", "Buscas la libertad a través del sentir."],
                        "Capricornio": ["Eres reservado con tus penas.", "Emociones maduras y serias.", "Necesitas respeto.", "Tus sentimientos son sólidos y duraderos."],
                        "Acuario": ["Sientes de forma desapegada.", "Necesitas amistad antes que amor.", "Eres impredecible.", "Tu independencia emocional es sagrada."],
                        "Piscis": ["Eres pura sensibilidad.", "Te pierdes en los sueños.", "Tu corazón es un océano.", "Tu empatía no tiene límites conocidos."]
                    },
                    "Ascendente": {
                        "Aries": ["Pareces alguien decidido y fuerte.", "Tu entrada es eléctrica.", "Eres puro impulso.", "Transmites una energía de líder nato."],
                        "Tauro": ["Transmites una calma imperturbable.", "Pareces alguien en quien confiar.", "Avanzas lento.", "Tu presencia es sólida como el granito."],
                        "Géminis": ["Tu mirada es curiosa e inquieta.", "Pareces más joven de lo que eres.", "Hablas con las manos.", "Transmites una viveza intelectual constante."],
                        "Cáncer": ["Pareces alguien tierno y protector.", "Transmites nostalgia.", "Tu cara es un libro abierto.", "Irradias una calidez acogedora."],
                        "Leo": ["Tu melena y porte llaman la atención.", "Transmites seguridad total.", "Pareces el jefe.", "Tu entrada ilumina cualquier búnker."],
                        "Virgo": ["Pareces alguien muy observador.", "Transmites limpieza y orden.", "Te fijas en todo.", "Tu presencia es discreta pero impecable."],
                        "Libra": ["Tu sonrisa es tu mejor arma.", "Pareces alguien muy sociable.", "Vistes con equilibrio.", "Irradias una elegancia natural."],
                        "Escorpio": ["Tu mirada es penetrante.", "Transmites un misterio magnético.", "Pareces peligroso.", "Tu presencia es un imán de verdades ocultas."],
                        "Sagitario": ["Tu risa se oye desde lejos.", "Pareces alguien viajero.", "Transmites aventura.", "Irradias un optimismo contagioso."],
                        "Capricornio": ["Pareces alguien importante.", "Transmites autoridad y seriedad.", "Vistes de forma clásica.", "Tu presencia impone respeto inmediato."],
                        "Acuario": ["Tu estilo es único y raro.", "Pareces alguien del futuro.", "Transmites rebeldía.", "Irradias una inteligencia desapegada."],
                        "Piscis": ["Pareces alguien que está en las nubes.", "Tu mirada es soñadora.", "Transmites paz.", "Tu presencia es etérea y mística."]
                    }
                };

                const sol = posiciones.find(p => p.nombre === "Sol");
                const luna = posiciones.find(p => p.nombre === "Luna");
                const asc = posiciones.find(p => p.nombre === "Ascendente");

                interpretacion = "";
                if (sol) interpretacion += `☀️ ESENCIA: ${random(DICCIONARIO.Sol[sol.signo]) || "La luz solar guía tus pasos."}\n\n`;
                if (luna) interpretacion += `🌙 EMOCIONES: ${random(DICCIONARIO.Luna[luna.signo]) || "Tus sentimientos fluyen en el búnker."}\n\n`;
                if (asc) interpretacion += `🎭 MÁSCARA: ${random(DICCIONARIO.Ascendente[asc.signo]) || "Tu presencia es notoria."}\n\n`;
                
                interpretacion += "\n📡 INFORME DEL ARCHIVERO: La conexión con Frankfurt es inestable, pero los datos astronómicos son precisos. Confía en tu instinto, agente.";
            }

            res.json({
                posiciones,
                interpretacion,
                datos_nacimiento: {
                    fecha: user.fecha_nacimiento,
                    hora_nacimiento: user.hora_nacimiento,
                    ciudad: user.ciudad_nacimiento
                }
            });

        } catch (err) {
            console.error("❌ Error en la Carta Astral:", err);
            res.status(500).json({ error: "Fallo en la sincronización astral." });
        }
    });

    return router;
};
