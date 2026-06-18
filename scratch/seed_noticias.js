const db = require('../db');

const noticiasSemilla = [
    {
        titulo: "AVISTAMIENTO MASIVO EN EL ALBAICÍN",
        cuerpo: "Varios vecinos informan de luces pulsantes sobre la Alhambra a las 03:00 AM. El Alto Mando investiga posibles interferencias electromagnéticas en la zona.",
        nivel_alerta: "Alto",
        ubicacion: "Albaicín, Granada",
        agente: "Comandante Pepe",
        imagen_url: "https://images.unsplash.com/photo-1541844053589-34625ae0b74d?auto=format&fit=crop&q=80&w=1000"
    },
    {
        titulo: "RUIDOS SUBTERRÁNEOS BAJO LA CATEDRAL",
        cuerpo: "Sismógrafos tácticos detectan patrones rítmicos no naturales bajo los cimientos de la Catedral. Se recomienda a los agentes no acercarse a las alcantarillas del sector centro.",
        nivel_alerta: "Medio",
        ubicacion: "Catedral de Granada",
        agente: "Agente X",
        imagen_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000"
    },
    {
        titulo: "DESAPARICIÓN DE FRECUENCIAS EN REALEJO",
        cuerpo: "Toda la banda de radioaficionados ha quedado en silencio en el sector Realejo. Se sospecha de un inhibidor de origen desconocido.",
        nivel_alerta: "Crítico",
        ubicacion: "Realejo, Granada",
        agente: "Operador 404",
        imagen_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000"
    }
];

async function seed() {
    console.log("🌱 Iniciando siembra de noticias...");
    for (const n of noticiasSemilla) {
        try {
            await db.execute(
                "INSERT INTO noticias (titulo, cuerpo, nivel_alerta, ubicacion, agente, imagen_url, estado) VALUES (?, ?, ?, ?, ?, ?, 'aprobado')",
                [n.titulo, n.cuerpo, n.nivel_alerta, n.ubicacion, n.agente, n.imagen_url]
            );
            console.log(`✅ Noticia sembrada: ${n.titulo}`);
        } catch (err) {
            console.error(`❌ Error sembrando ${n.titulo}:`, err.message);
        }
    }
    console.log("✨ Proceso completado.");
    process.exit(0);
}

seed();
