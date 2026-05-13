const express = require('express');

module.exports = (db, genAI) => {
    const router = express.Router();

    const ARCANOS = [
        { id: 0, nombre: "El Loco", significado: "Un nuevo comienzo te llama. Es hora de saltar al vacío con fe, pero vigila dónde pones los pies.", imagen: "00-loco.jpg" },
        { id: 1, nombre: "El Mago", significado: "Tienes todas las herramientas necesarias para triunfar. Tu voluntad es la llave que abre cualquier puerta.", imagen: "01-mago.jpg" },
        { id: 2, nombre: "La Sacerdotisa", significado: "Confía en tu intuición. Los secretos se revelarán a quien sepa escuchar el silencio del búnker.", imagen: "02-sacerdotisa.jpg" },
        { id: 3, nombre: "La Emperatriz", significado: "Es momento de crear y nutrir. La abundancia fluye hacia ti si te conectas con tu lado más creativo.", imagen: "03-emperatriz.jpg" },
        { id: 4, nombre: "El Emperador", significado: "El orden y la estructura son tus aliados hoy. Toma el mando con firmeza pero con justicia.", imagen: "04-emperador.jpg" },
        { id: 5, nombre: "El Hierofante", significado: "Busca consejo en la sabiduría tradicional o en maestros del pasado. El conocimiento es poder.", imagen: "05-hierofante.jpg" },
        { id: 6, nombre: "Los Enamorados", significado: "Una elección importante se presenta. Elige con el corazón, pero no olvides tus valores.", imagen: "06-enamorados.jpg" },
        { id: 7, nombre: "El Carro", significado: "Victoria y avance. Mantén el control de tus emociones y llegarás a tu destino con éxito.", imagen: "07-carro.jpg" },
        { id: 8, nombre: "La Fuerza", significado: "Tu mayor poder no es físico, sino espiritual. Domina tus miedos con compasión y paciencia.", imagen: "08-fuerza.jpg" },
        { id: 9, nombre: "El Ermitaño", significado: "Busca la respuesta en tu interior. Un retiro temporal te dará la claridad que el ruido exterior te niega.", imagen: "09-ermitano.jpg" },
        { id: 10, nombre: "La Rueda de la Fortuna", significado: "Los ciclos cambian. Si estás arriba, sé humilde; si estás abajo, prepárate para subir.", imagen: "10-rueda.jpg" },
        { id: 11, nombre: "La Justicia", significado: "Cosecharás lo que has sembrado. El equilibrio se restablecerá si actúas con integridad.", imagen: "11-justicia.jpg" },
        { id: 12, nombre: "El Colgado", significado: "Mira las cosas desde otro ángulo. A veces, detenerse es la forma más rápida de avanzar.", imagen: "12-colgado.jpg" },
        { id: 13, nombre: "La Muerte", significado: "No temas al final, pues es el inicio de algo nuevo. Suelta lo viejo para dejar espacio a lo mejor.", imagen: "13-muerte.jpg" },
        { id: 14, nombre: "La Templanza", significado: "Mezcla tus opciones con cuidado. La moderación y el equilibrio te traerán la paz que buscas.", imagen: "14-templanza.jpg" },
        { id: 15, nombre: "El Diablo", significado: "Identifica tus ataduras. A veces nosotros mismos sostenemos las cadenas que nos aprisionan. Libérate.", imagen: "15-diablo.jpg" },
        { id: 16, nombre: "La Torre", significado: "Un cambio repentino sacude tus cimientos. No es un desastre, es una liberación de estructuras obsoletas.", imagen: "16-torre.jpg" },
        { id: 17, nombre: "La Estrella", significado: "Esperanza y renovación. Una luz brilla en la oscuridad del búnker guiándote hacia la sanación.", imagen: "17-estrella.jpg" },
        { id: 18, nombre: "La Luna", significado: "Cuidado con los espejismos. No todo es lo que parece bajo la luz de la noche. Confía en tu instinto.", imagen: "18-luna.jpg" },
        { id: 19, nombre: "El Sol", significado: "Éxito, alegría y vitalidad. La verdad sale a la luz y todo queda claro bajo el brillo solar.", imagen: "19-sol.jpg" },
        { id: 20, nombre: "El Juicio", significado: "Es momento de evaluar tu camino. Una llamada a la acción te invita a despertar a una nueva realidad.", imagen: "20-juicio.jpg" },
        { id: 21, nombre: "El Mundo", significado: "Ciclo completado. Éxito total y realización. Estás en armonía con el universo.", imagen: "21-mundo.jpg" }
    ];

    router.get('/baraja', (req, res) => {
        const baraja = ARCANOS.map(a => ({ id: a.id, nombre: "Arcano Oculto", imagen: "back.jpg" }));
        const barajada = baraja.sort(() => Math.random() - 0.5);
        res.json(barajada);
    });

    router.post('/tirada', async (req, res) => {
        const { seleccionados } = req.body;
        if (!seleccionados || seleccionados.length !== 5) {
            return res.status(400).json({ error: "Necesitas elegir 5 cartas para completar el ritual." });
        }

        const posiciones = ["Pasado", "Presente", "Desafío", "Consejo", "Destino"];
        const resultado = seleccionados.map((id, index) => {
            const arcano = ARCANOS.find(a => a.id === id) || ARCANOS[0];
            return {
                posicion: posiciones[index],
                nombre: arcano.nombre,
                significado: arcano.significado,
                imagen: arcano.imagen
            };
        });

        let resumenIA = "";
        try {
            console.log("✨ El Oráculo está consultando a la Inteligencia Superior...");
            const prompt = `Analiza esta tirada de Tarot de 5 cartas:
            - Pasado: ${resultado[0].nombre}
            - Presente: ${resultado[1].nombre}
            - Desafío: ${resultado[2].nombre}
            - Consejo: ${resultado[3].nombre}
            - Destino: ${resultado[4].nombre}
            
            Escribe un resumen místico, profundo y profesional en español. Máximo 100 palabras. Tono: Archivero de Expediente X.`;

            const modelosAProbar = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.0-pro"];
            for (const modName of modelosAProbar) {
                try {
                    const model = genAI.getGenerativeModel({ model: modName }, { apiVersion: 'v1' });
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    resumenIA = response.text();
                    if (resumenIA) break;
                } catch (e) { console.error(`❌ Fallo en canal ${modName}:`, e.message); }
            }
        } catch (err) {
            console.error("📡 Error en la conexión con el Oráculo IA:", err);
        }

        let resumenFinal = resumenIA;
        if (!resumenFinal) {
            const intros = [
                "Los hilos del destino se entrelazan en el búnker.",
                "Una frecuencia mística revela un patrón claro.",
                "El Oráculo ha procesado las señales de los arcanos.",
                "En la penumbra del archivo, la verdad se manifiesta.",
                "Las vibraciones de esta tirada indican un flujo potente."
            ];
            const conectores = [
                `La presencia de ${resultado[1].nombre} en tu presente sugiere que `,
                `Con ${resultado[2].nombre} como desafío, es evidente que `,
                `El consejo de ${resultado[3].nombre} nos advierte que `,
                `Mirando hacia el destino marcado por ${resultado[4].nombre}, `
            ];
            const conclusiones = [
                "el búnker te protegerá si mantienes la calma.",
                "un secreto del pasado por fin verá la luz.",
                "debes confiar en tu instinto por encima de todo.",
                "la transformación es inevitable y necesaria.",
                "nada es lo que parece en este flujo temporal."
            ];

            const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
            resumenFinal = `${random(intros)} ${random(conectores)}${random(conclusiones)} La verdad está ahí fuera, agente.`;
        }

        res.json({ tirada: resultado, resumen: resumenFinal });
    });

    return router;
};
