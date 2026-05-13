const express = require('express');
const RSSParser = require('rss-parser');

module.exports = (db, genAI) => {
    const router = express.Router();
    const parser = new RSSParser({
        timeout: 10000,
        headers: {
            'User-Agent': 'ExpedienteXGranaino/1.0 (Bunker UFO Research Platform)',
            'Accept': 'application/rss+xml, application/xml, text/xml'
        }
    });

    // Fuentes RSS de interés ufológico/paranormal/misterio
    const FUENTES = [
        {
            nombre: "MUFON",
            url: "https://www.mufon.com/rss/blog.xml",
            categoria: "OVNI",
            icono: "🛸"
        },
        {
            nombre: "Unexplained Mysteries",
            url: "https://www.unexplained-mysteries.com/news/rss",
            categoria: "PARANORMAL",
            icono: "👻"
        },
        {
            nombre: "Open Minds UFO",
            url: "https://www.openminds.tv/feed",
            categoria: "OVNI",
            icono: "🛸"
        },
        {
            nombre: "Coast to Coast AM",
            url: "https://www.coasttocoastam.com/feed/",
            categoria: "MISTERIO",
            icono: "📻"
        },
        {
            nombre: "The Debrief",
            url: "https://thedebrief.org/feed/",
            categoria: "DESCLASIFICACIÓN",
            icono: "📂"
        },
        {
            nombre: "Science Alert",
            url: "https://www.sciencealert.com/feed",
            categoria: "CIENCIA",
            icono: "🔬"
        },
        {
            nombre: "Space.com",
            url: "https://www.space.com/feeds/all",
            categoria: "ESPACIO",
            icono: "🚀"
        }
    ];

    // GET /api/noticias-externas - Obtener noticias de fuentes externas
    router.get('/', async (req, res) => {
        try {
            const hoy = new Date().toISOString().split('T')[0];
            
            // 1. Comprobar caché en DB (renovar cada 6 horas)
            const cached = await db.query(
                "SELECT * FROM noticias_externas WHERE fecha_cache = ? ORDER BY fecha_publicacion DESC LIMIT 50",
                [hoy]
            );

            if (cached.length >= 5) {
                console.log(`📡 RADAR EXTERNO: ${cached.length} noticias recuperadas de caché.`);
                return res.json(cached);
            }

            // 2. Rastrear fuentes RSS
            console.log("📡 RADAR EXTERNO: Escaneando frecuencias internacionales...");
            const todasLasNoticias = [];

            for (const fuente of FUENTES) {
                try {
                    const feed = await parser.parseURL(fuente.url);
                    const items = (feed.items || []).slice(0, 5); // Max 5 por fuente

                    for (const item of items) {
                        // Limpiar HTML del contenido
                        let resumen = (item.contentSnippet || item.content || item.summary || '')
                            .replace(/<[^>]*>/g, '')
                            .substring(0, 300);
                            
                        let titulo = item.title || 'Sin título';

                        // Traducir si tenemos IA y el texto parece estar en inglés (las fuentes lo están)
                        if (genAI && (fuente.nombre !== 'MUFON España')) {
                            try {
                                const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
                                const prompt = `Traduce este título y resumen de una noticia ufológica del inglés al español neutro. Devuelve SOLO un JSON con {"titulo": "...", "resumen": "..."}.
                                Título original: ${titulo}
                                Resumen original: ${resumen}`;
                                
                                const result = await model.generateContent(prompt);
                                const texto = result.response.text();
                                const inicio = texto.indexOf('{');
                                const fin = texto.lastIndexOf('}') + 1;
                                if (inicio !== -1 && fin > inicio) {
                                    const jsonParsed = JSON.parse(texto.substring(inicio, fin));
                                    titulo = jsonParsed.titulo || titulo;
                                    resumen = jsonParsed.resumen || resumen;
                                }
                            } catch (err) {
                                console.log("⚠️ Fallo al traducir noticia:", err.message);
                            }
                        }

                        todasLasNoticias.push({
                            titulo: titulo,
                            resumen: resumen,
                            url: item.link || '',
                            fuente: fuente.nombre,
                            categoria: fuente.categoria,
                            icono: fuente.icono,
                            imagen: item.enclosure?.url || item['media:content']?.['$']?.url || null,
                            fecha_publicacion: item.pubDate ? new Date(item.pubDate).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ')
                        });
                    }
                    console.log(`  ✅ ${fuente.nombre}: ${items.length} señales captadas`);
                } catch (fuenteErr) {
                    console.log(`  ⚠️ ${fuente.nombre}: Frecuencia inaccesible (${fuenteErr.message})`);
                }
            }

            // 3. Ordenar por fecha (más recientes primero)
            todasLasNoticias.sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion));

            // 4. Guardar en caché (limpiar antiguas primero)
            try {
                await db.execute("DELETE FROM noticias_externas WHERE fecha_cache < ?", [hoy]);
                
                for (const noticia of todasLasNoticias.slice(0, 30)) {
                    await db.execute(
                        `INSERT INTO noticias_externas (titulo, resumen, url, fuente, categoria, icono, imagen_url, fecha_publicacion, fecha_cache) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            noticia.titulo,
                            noticia.resumen,
                            noticia.url,
                            noticia.fuente,
                            noticia.categoria,
                            noticia.icono,
                            noticia.imagen || null,
                            noticia.fecha_publicacion,
                            hoy
                        ]
                    );
                }
                console.log(`📡 RADAR EXTERNO: ${Math.min(todasLasNoticias.length, 30)} noticias archivadas en caché.`);
            } catch (cacheErr) {
                console.log("⚠️ Error al cachear noticias externas:", cacheErr.message);
            }

            res.json(todasLasNoticias.slice(0, 30));

        } catch (err) {
            console.error("❌ Fallo crítico en el radar de noticias externas:", err.message);
            
            // Intentar devolver caché viejo si existe
            try {
                const fallback = await db.query(
                    "SELECT * FROM noticias_externas ORDER BY fecha_publicacion DESC LIMIT 30"
                );
                if (fallback.length > 0) {
                    return res.json(fallback);
                }
            } catch (e) {}
            
            res.status(500).json({ error: "El radar de inteligencia externa está temporalmente fuera de servicio." });
        }
    });

    return router;
};
