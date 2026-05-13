const express = require('express');

module.exports = (db, genAI) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const dia = new Date().getDate();
            const mes = new Date().getMonth() + 1;

            // 1. Buscar en caché (DB) para hoy
            const cached = await db.query("SELECT * FROM efemerides WHERE fecha = ?", [today]);
            if (cached.length > 0 && cached[0].contenido && cached[0].contenido.length > 50) {
                console.log("📜 Efeméride del día recuperada del archivo.");
                return res.json(cached[0]);
            }

            // 2. Generar con IA (Gemini)
            try {
                console.log("📜 Generando efeméride paranormal para hoy...");
                const modelosAProbar = ["gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.0-pro"];
                let text = "";

                for (const modName of modelosAProbar) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modName });
                        const prompt = `Eres el Archivero Jefe del Búnker de Expediente X, un experto en fenómenos paranormales, ovnis, conspiraciones y misterios de la historia.

HOY ES ${dia} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][mes-1]}.

Tu misión: Genera UNA efeméride real o semi-real de algo misterioso/paranormal/ufológico que ocurrió un día como hoy en la historia. Puede ser:
- Un avistamiento OVNI documentado
- Un caso de contacto extraterrestre
- Un fenómeno paranormal registrado
- Una desclasificación de documentos secretos
- Un descubrimiento arqueológico misterioso
- Un incidente militar inexplicable
- Un caso de criptozoología
- Una conspiración revelada

REQUISITOS CRÍTICOS:
- Debe ser un hecho REAL o basado en hechos reales (puedes dramatizar ligeramente)
- Incluye el AÑO específico del evento
- Incluye la UBICACIÓN del evento
- Estilo narrativo inmersivo tipo documental de misterio
- EXTENSIÓN: Entre 150 y 250 palabras
- IDIOMA: Español de España
- NO uses markdown, solo texto plano
- NO empieces con "Hoy en la historia" ni fórmulas genéricas

FORMATO DE RESPUESTA (JSON estricto):
{"titulo": "TÍTULO IMPACTANTE EN MAYÚSCULAS", "año": 1947, "ubicacion": "Roswell, Nuevo México", "contenido": "El texto narrativo completo aquí...", "categoria": "OVNI|PARANORMAL|CONSPIRACIÓN|CRIPTOZOOLOGÍA|DESCLASIFICACIÓN|ARQUEOLOGÍA"}`;

                        const result = await model.generateContent(prompt);
                        const response = await result.response;
                        text = response.text();
                        if (text && text.includes('{')) break;
                    } catch (e) {
                        console.log(`⚠️ Efemérides: Fallo con modelo ${modName}: ${e.message}`);
                    }
                }

                if (text) {
                    // Limpiar y parsear JSON
                    const inicio = text.indexOf('{');
                    const fin = text.lastIndexOf('}') + 1;
                    if (inicio !== -1 && fin > inicio) {
                        const jsonPuro = text.substring(inicio, fin);
                        const efemeride = JSON.parse(jsonPuro);

                        // Guardar en caché
                        await db.execute("DELETE FROM efemerides WHERE fecha = ?", [today]);
                        await db.execute(
                            "INSERT INTO efemerides (titulo, contenido, anio_evento, ubicacion, categoria, fecha) VALUES (?, ?, ?, ?, ?, ?)",
                            [efemeride.titulo, efemeride.contenido, efemeride.año || 0, efemeride.ubicacion || 'Desconocido', efemeride.categoria || 'PARANORMAL', today]
                        );

                        const saved = await db.query("SELECT * FROM efemerides WHERE fecha = ?", [today]);
                        return res.json(saved[0] || efemeride);
                    }
                }
            } catch (iaErr) {
                console.log("📡 IA fuera de servicio para efemérides. Activando archivo de emergencia...", iaErr.message);
            }

            // 3. Generador de emergencia (offline) - Banco de efemérides históricas
            const bancoEmergencia = [
                {
                    titulo: "EL INCIDENTE ROSWELL: EL INICIO DE LA ERA OVNI",
                    contenido: "En julio de 1947, un objeto no identificado se estrelló en un rancho cerca de Roswell, Nuevo México. El ejército de los Estados Unidos emitió inicialmente un comunicado confirmando la recuperación de un 'disco volador', pero horas después rectificó diciendo que se trataba de un globo meteorológico. Testigos locales reportaron la presencia de cuerpos no humanos entre los restos. El caso fue clasificado como alto secreto y no fue hasta 1994 cuando el gobierno admitió que el objeto era parte del Proyecto Mogul, un programa de vigilancia de pruebas nucleares soviéticas. Sin embargo, los investigadores independientes mantienen que la explicación oficial es un encubrimiento. El incidente Roswell se convirtió en el caso más emblemático de la ufología mundial y sigue generando debate más de 75 años después.",
                    anio_evento: 1947,
                    ubicacion: "Roswell, Nuevo México, EE.UU.",
                    categoria: "OVNI",
                    fecha: today
                },
                {
                    titulo: "LAS LUCES DE PHOENIX: MILES DE TESTIGOS, CERO RESPUESTAS",
                    contenido: "El 13 de marzo de 1997, miles de ciudadanos del estado de Arizona fueron testigos de una formación de luces en V que atravesó el cielo nocturno en completo silencio. El objeto, de dimensiones estimadas en más de un kilómetro, fue avistado desde Henderson (Nevada) hasta Tucson, pasando por toda el área metropolitana de Phoenix. El gobernador Fife Symington convocó una rueda de prensa burlándose del incidente, pero años después confesó públicamente que él mismo fue testigo del fenómeno y que era 'algo de otro mundo'. La Fuerza Aérea atribuyó las luces a bengalas militares lanzadas desde la base de Luke, pero las grabaciones de vídeo y los testimonios de pilotos civiles contradicen esta versión. Hasta hoy, las Luces de Phoenix siguen sin explicación oficial satisfactoria.",
                    contenido_corto: "Miles de testigos en Arizona observaron una formación en V silenciosa de más de un kilómetro.",
                    anio_evento: 1997,
                    ubicacion: "Phoenix, Arizona, EE.UU.",
                    categoria: "OVNI",
                    fecha: today
                },
                {
                    titulo: "EL MANUSCRITO VOYNICH: EL LIBRO QUE NADIE PUEDE LEER",
                    contenido: "Descubierto en 1912 por el librero Wilfrid Voynich en una colección de manuscritos jesuitas en Italia, este libro del siglo XV contiene 240 páginas de texto escrito en un alfabeto completamente desconocido, acompañado de ilustraciones botánicas de plantas que no existen, diagramas astronómicos imposibles y figuras humanas en recipientes conectados por tubos. Los mejores criptógrafos del mundo, incluidos los descifradores de códigos de la Segunda Guerra Mundial, han fracasado en descodificar su contenido. Análisis de carbono-14 confirmaron que el pergamino data de entre 1404 y 1438. Algunas teorías sugieren que es un tratado médico herético, otras que es un manual alquímico, y las más audaces proponen que podría ser un texto de origen no humano. El manuscrito permanece en la Biblioteca Beinecke de la Universidad de Yale, desafiando toda explicación racional.",
                    anio_evento: 1912,
                    ubicacion: "Villa Mondragone, Frascati, Italia",
                    categoria: "ARQUEOLOGÍA",
                    fecha: today
                },
                {
                    titulo: "EXPEDIENTE UMMO: LA INFILTRACIÓN EXTRATERRESTRE EN ESPAÑA",
                    contenido: "A partir de 1966, varias personalidades del mundo científico y ufológico español comenzaron a recibir cartas mecanografiadas con un sello peculiar: el símbolo )+( que supuestamente identificaba al planeta UMMO, un mundo situado a 14,6 años luz de la Tierra, en la estrella Wolf 424. Las cartas contenían tratados de física, biología y filosofía de una sofisticación extraordinaria. El 1 de junio de 1967, múltiples testigos fotografiaron un objeto discoidal con el símbolo UMMO sobre San José de Valderas y Santa Mónica, en Madrid. Fernando Sesma, presidente de la Sociedad de Amigos de los Visitantes del Espacio, fue uno de los principales receptores. Décadas después, José Luis Jordán Peña confesó ser el autor de las cartas, pero muchos investigadores cuestionan que una sola persona pudiera generar tal volumen de conocimiento técnico avanzado.",
                    anio_evento: 1966,
                    ubicacion: "Madrid, España",
                    categoria: "OVNI",
                    fecha: today
                },
                {
                    titulo: "EL TRIÁNGULO DE LAS BERMUDAS: VUELO 19 DESAPARECE SIN RASTRO",
                    contenido: "El 5 de diciembre de 1945, cinco bombarderos TBM Avenger de la Marina de los Estados Unidos despegaron de Fort Lauderdale para una misión de entrenamiento rutinaria sobre el Atlántico. El líder de vuelo, el teniente Charles Taylor, reportó por radio que sus brújulas habían dejado de funcionar y que no reconocía el terreno bajo ellos. Las comunicaciones se volvieron erráticas y confusas. Los cinco aviones con sus 14 tripulantes desaparecieron sin dejar rastro. Un hidroavión Martin Mariner PBM enviado en su búsqueda también desapareció con sus 13 tripulantes. A pesar de la mayor operación de búsqueda marítima de la historia hasta entonces, nunca se encontraron restos, cuerpos ni manchas de combustible. El incidente catapultó la leyenda del Triángulo de las Bermudas y sigue siendo uno de los misterios de la aviación más perturbadores.",
                    anio_evento: 1945,
                    ubicacion: "Triángulo de las Bermudas, Atlántico Norte",
                    categoria: "PARANORMAL",
                    fecha: today
                }
            ];

            // Seleccionar una basada en el día para que no se repita
            const seed = (dia * 31 + mes * 7) % bancoEmergencia.length;
            const emergencia = bancoEmergencia[seed];

            // Guardar en caché
            await db.execute("DELETE FROM efemerides WHERE fecha = ?", [today]);
            await db.execute(
                "INSERT INTO efemerides (titulo, contenido, anio_evento, ubicacion, categoria, fecha) VALUES (?, ?, ?, ?, ?, ?)",
                [emergencia.titulo, emergencia.contenido, emergencia.anio_evento, emergencia.ubicacion, emergencia.categoria, today]
            );

            const resultado = await db.query("SELECT * FROM efemerides WHERE fecha = ?", [today]);
            res.json(resultado[0] || emergencia);

        } catch (err) {
            console.error("❌ Fallo crítico en el archivo de efemérides:", err.message);
            res.status(500).json({ error: "El archivo histórico está temporalmente inaccesible." });
        }
    });

    return router;
};
