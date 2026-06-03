const db = require('../db');

const relatoSoledad = {
    titulo: "SOLEDAD: LA ÚLTIMA DANZA EN LAREDO (1984)",
    contenido: `Laredo, agosto de 1984. El aire olía a salitre y a la laca de los peinados imposibles que dominaban la pista de baile. En la discoteca del paseo, las luces de neón parpadeaban al ritmo de "You're My Heart, You're My Soul" de Modern Talking. Fue allí donde Javier, un joven veraneante, la vio por primera vez.

Se llamaba Soledad. Llevaba un vestido blanco que parecía brillar con luz propia bajo los focos estroboscópicos. No hablaba mucho, pero su mirada tenía una profundidad que Javier no pudo olvidar. Bailaron durante horas, ignorando el sudor y el ruido del resto de la gente. Ella solo le pidió una cosa: "No dejes que la música pare".

Al llegar la madrugada, Soledad le pidió que la acompañara a la salida. Hacía frío. Javier le prestó su chaqueta de cuero. Ella le indicó una dirección cerca del acantilado y, antes de que él pudiera decir nada, se desvaneció entre la bruma marina.

Al día siguiente, Javier buscó la casa de Soledad para recuperar su chaqueta. Una mujer mayor le abrió la puerta con los ojos empañados en lágrimas. "Soledad era mi hija", le dijo. "Pero ella murió en un accidente hace exactamente diez años, regresando de esa misma discoteca".

Javier, pálido, caminó hacia el cementerio local. Allí, sobre una lápida de mármol blanco con el nombre de Soledad, encontró su chaqueta de cuero, perfectamente doblada, oliendo todavía al perfume de aquella noche de 1984.`,
    usuario_nombre: "Pepe Moreno",
    latitud: 43.4116,
    longitud: -3.4206, // Coordenadas de Laredo
    estado: "aprobado",
    tipo: "relato"
};

const noticiasPentagono = [
    {
        titulo: "EL PENTÁGONO DESCLASIFICA: 757 NUEVOS CASOS UAP",
        cuerpo: "La oficina AARO (All-domain Anomaly Resolution Office) ha confirmado que la recopilación de datos de sensores militares y civiles ha revelado 757 nuevos incidentes en el último ciclo. Aunque se han resuelto muchos casos como globos o drones, una fracción significativa sigue desafiando las leyes de la física convencional, manteniendo la alerta máxima en los servicios de inteligencia de EE.UU.",
        nivel_alerta: "Alto",
        ubicacion: "Washington, EE.UU.",
        agente: "Inteligencia Estratégica",
        imagen_url: "https://res.cloudinary.com/dx37worwx/image/upload/v1777311497/admin_uploads/1777311496660-pentagono.webp",
        fuente_url: "https://www.defense.gov/News/Releases/Release/Article/3966579/dod-releases-fiscal-year-2024-annual-report-on-unidentified-anomalous-phenomena/"
    }
];

async function restauracionFinal() {
    console.log("🛠️ INICIANDO RESTAURACIÓN FINAL DEL BÚNKER...");

    try {
        // 1. Insertar Relato de Soledad
        await db.execute(
            "INSERT INTO expedientes (titulo, contenido, usuario_nombre, latitud, longitud, estado, tipo, fecha) VALUES (?, ?, ?, ?, ?, ?, 'relato', NOW())",
            [relatoSoledad.titulo, relatoSoledad.contenido, relatoSoledad.usuario_nombre, relatoSoledad.latitud, relatoSoledad.longitud, relatoSoledad.estado]
        );
        console.log("✅ Relato de Soledad restaurado con éxito.");

        // 2. Insertar Noticias del Pentágono
        for (const n of noticiasPentagono) {
            await db.execute(
                "INSERT INTO noticias (titulo, cuerpo, nivel_alerta, ubicacion, agente, imagen_url, fuente_url, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, 'aprobado', NOW())",
                [n.titulo, n.cuerpo, n.nivel_alerta, n.ubicacion, n.agente, n.imagen_url, n.fuente_url]
            );
        }
        console.log("✅ Noticia del Pentágono inyectada.");

        console.log("\n🏁 BÚNKER RESTAURADO Y MEJORADO. ¡A POR EL SIGUIENTE NIVEL!");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR EN LA RESTAURACIÓN:", err.message);
        process.exit(1);
    }
}

restauracionFinal();
