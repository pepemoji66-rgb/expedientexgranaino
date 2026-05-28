require('dotenv').config();
const mysql = require('mysql2/promise');

// ==========================================================================
// 🛸 DICCIONARIO DE DESCRIPCIONES DEL BÚNKER
// ==========================================================================
// Pídele a tu hermano o colaborador que rellene este diccionario.
// Solo tiene que poner el ID del vídeo y el texto que quiera asignarle.
//
// Ejemplo:
// const DESCRIPCIONES = {
//     8: "Vídeo del avistamiento de un objeto cilíndrico en Granada capital en mayo de 2026...",
//     9: "Grabación realizada por un agente de campo de un destello misterioso sobre la Sierra..."
// };
// ==========================================================================

const DESCRIPCIONES = {
    // ⬇️ RELLENA AQUÍ LOS VÍDEOS (ID: "Tu texto de descripción entre comillas")
    1: "Vídeo original de la Fase 2 en Albolote. En este primer archivo se observa un objeto estacionario con destellos a baja altura.",
    2: "Grabación secundaria del avistamiento múltiple de Albolote en junio de 2022. Se utiliza el tejado de la vivienda como referencia física.",
    3: "Evidencia coordinada que muestra el desplazamiento angular rápido de dos esferas sobre la vertical del casco urbano de Albolote.",
    4: "Audio debate crítico sobre el terreno en Sierra Elvira mientras se observa la trayectoria impredecible de la luz en agosto del 2021.",
    
    5: "Análisis del Avistamiento Dual - Fase 2: El metraje captura un comportamiento de vuelo no convencional. La telemetría indica cambios de dirección sin pérdida de masa o momento, sugiriendo una propulsión basada en la manipulación del espacio-tiempo local. La ausencia de superficies de control aerodinámico confirma que no estamos ante tecnología aeronáutica de consumo.",
    6: "Avistamiento Dual - Fase 2 (Seguimiento): En esta secuencia extendida, observamos la capacidad de los objetos para mantener una coherencia de grupo. La respuesta a las señales de radar refleja una firma electrónica que intenta evadir el bloqueo, una característica común en los reportes de FANI de alta prioridad analizados en nuestro Búnker.",
    7: "Avistamiento Dual - Fase 2 (Detalle Térmico): El sensor infrarrojo revela una firma térmica que no se corresponde con motores de combustión conocidos. La distribución del calor parece emanar de todo el cuerpo del objeto, lo que refuerza la teoría de un sistema de propulsión de campo electromagnético avanzado.",
    8: "La Luz de Mafasca (Fuerteventura): Un clásico del folclore que, al analizarlo bajo la luz de los nuevos informes, revela similitudes con los 'orbes' registrados en bases militares. La naturaleza errática y la aparente inteligencia tras sus desplazamientos sugieren que estos fenómenos han estado presentes mucho antes de nuestra era técnica.",
    9: "Secretos y Misterios Alhambra: Análisis de las anomalías detectadas en las inmediaciones del complejo nazarí. Las lecturas magnéticas registradas en este archivo sugieren interferencias que coinciden con los protocolos de aproximación de objetos no identificados, vinculando la historia antigua con la fenomenología moderna.",
    10: "Alhambra, patrimonio de la Humanidad: El registro audiovisual muestra destellos inexplicables sobre la Alcazaba. El análisis espectrográfico descartó reflejos lumínicos convencionales, apuntando a una fuente de energía ionizante que altera la atmósfera visible del entorno histórico.",
    11: "LA MEDUSA desclasificado por el Pentágono: Este archivo es fundamental. El objeto apodado 'La Medusa' muestra una morfología compleja que parece cambiar de estado físico. Los informes técnicos sugieren una estructura que emplea tecnología de camuflaje activo para confundirse con el entorno de los sensores de vigilancia.",
    13: "EL UFO DE ORIENTE MEDIO: Este metraje desclasificado destaca por la velocidad de maniobra. El objeto realiza una transición de vuelo estacionario a alta velocidad sin efecto de inercia aparente, lo que desafía los modelos aerodinámicos actuales y confirma la presencia de capacidades de propulsión de origen no convencional en la región.",
    14: "eL ufo DE oriente medio (Análisis complementario): Continuación del incidente en Oriente Medio. Se observa cómo el objeto interactúa con el entorno atmosférico generando una firma espectral única. La persistencia de esta firma en múltiples sensores de la coalición descarta definitivamente cualquier fallo en el sistema de grabación.",
    15: "Una locura, el de los pilotos, desclasificado: Análisis de las comunicaciones de audio de cabina vinculadas a este avistamiento. La tensión y el tecnicismo de los pilotos confirman que el objeto no respondía a las señales IFF estándar. La maniobra registrada es un ejemplo crítico de evasión inteligente.",
    16: "Qué pasó en la luna: Revisión de archivos de misiones lunares históricas. Se analizan los destellos detectados en la superficie que, a diferencia de los impactos de meteoritos, presentan patrones de emisión de luz coherentes, sugiriendo actividad no natural en el satélite.",
    17: "Europa, 2022: Análisis de avistamiento sobre el espacio aéreo europeo. El metraje muestra un objeto que parece realizar un patrón de barrido de inteligencia, manteniendo una estabilidad geométrica perfecta frente a ráfagas de viento de alta altitud que habrían desestabilizado cualquier dron civil.",
    18: "Sin resolver, desclasificado ahora: Un caso que llegó a los archivos de inteligencia como 'inconcluso'. La falta de firma térmica convencional en las imágenes térmicas sugiere que el objeto opera bajo un principio de eficiencia energética inalcanzable por la tecnología humana actual.",
    20: "Objeto Puerto Rico, Desclasificado: Este avistamiento destaca por la capacidad del objeto para desplazarse sobre el medio acuático y aéreo con igual eficiencia. El análisis de la distorsión del agua al momento del despegue apunta a una interacción magnética de gran escala.",
    21: "UFO UCRANIA: Análisis de alta velocidad sobre zona de conflicto. El objeto se mueve a una tasa de fotogramas por segundo que sugiere una aceleración instantánea. Los datos de radar corroboran que el objeto no posee una trayectoria balística, lo que lo excluye de cualquier clasificación de proyectil conocido.",
    22: "Recopilación completa: Vídeos de OVNIs Pentágono: Este compendio reúne los casos más emblemáticos. El análisis técnico conjunto de todos los metrajes permite identificar una firma común: la capacidad de anulación de masa inercial, presente en todos los objetos detectados por los sistemas de defensa avanzados.",
    23: "Piloto colombiano graba el avistamiento más impresionante: El testimonio visual y las maniobras captadas ofrecen una visión clara de la interacción cercana. La estabilidad del objeto frente a las turbulencias de la cabina es una prueba irrefutable de un sistema de estabilización inercial de vanguardia.",
    24: "Las tres esferas de Rostelecom (Rusia): La formación triangular observada en este registro muestra una sincronía operativa perfecta. El análisis de emisión de luz indica que los objetos están sincronizados mediante un sistema de enlace de datos de altísima frecuencia, impenetrable para los equipos de escucha estándar.",
    25: "DESCLASIFICADO GOBIERNO EE.UU: Este informe es la piedra angular de la transparencia actual. El análisis detalla no solo el avistamiento, sino la reacción protocolaria de las unidades de interceptación, marcando un antes y un después en cómo el estamento militar clasifica estos encuentros.",
    26: "ovni desclasificado 2024: Análisis de este registro reciente que muestra una anomalía lumínica en condiciones de baja visibilidad. La firma espectral obtenida mediante cámaras de alta sensibilidad descarta fuentes de iluminación artificial, confirming una fuente de energía propia.",
    27: "01-01-2020 desde una plataforma militar en África: Un evento que subraya la naturaleza global del fenómeno. El registro muestra un objeto que opera con total impunidad sobre una instalación de alta seguridad, demostrando una superioridad tecnológica que ignora por completo cualquier medida de disuasión aérea.",
    28: "UAPS DESCLASIFICADO EMIRATOS ÁRABES: Tras el análisis técnico, determinamos que este objeto opera bajo principios de propulsión de campo local. La falta de estelas, sumada a la capacidad de aceleración súbita, lo sitúa en la categoría de vehículos trans-medio de alto rendimiento.",
};

async function main() {
    console.log("📡 CONECTANDO CON EL BÚNKER DE DATOS (MYSQL AIVEN)...");

    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : { rejectUnauthorized: false }
    };

    let connection;

    try {
        connection = await mysql.createConnection(config);
        console.log("🔗 CONEXIÓN ESTABLECIDA CON ÉXITO.");
        console.log("--------------------------------------------------");

        // 1. Mostrar los vídeos actuales para referencia
        const [rows] = await connection.execute("SELECT id, titulo, descripcion FROM videos ORDER BY id DESC");
        console.log("\n📼 LISTA DE VÍDEOS ACTUALES EN EL RADAR:");
        rows.forEach(v => {
            const descCorta = v.descripcion 
                ? (v.descripcion.substring(0, 50) + "...") 
                : "[SIN DESCRIPCIÓN ⚠️]";
            console.log(`  • ID #${v.id} | Título: "${v.titulo}"`);
            console.log(`    Texto actual: ${descCorta}\n`);
        });
        console.log("--------------------------------------------------");

        // 2. Procesar el diccionario de actualizaciones
        const idsAActualizar = Object.keys(DESCRIPCIONES);

        if (idsAActualizar.length === 0) {
            console.log("\nℹ️ El diccionario DESCRIPCIONES está vacío. Rellénalo en el script para aplicar cambios.");
            await connection.end();
            return;
        }

        console.log(`\n⚙️ INICIANDO PROTOCOLO DE ACTUALIZACIÓN (${idsAActualizar.length} registros)...`);
        
        let actualizados = 0;
        for (const idStr of idsAActualizar) {
            const id = parseInt(idStr);
            const texto = DESCRIPCIONES[idStr];
            
            // Verificar si el vídeo existe
            const [videoExiste] = await connection.execute("SELECT id FROM videos WHERE id = ?", [id]);
            if (videoExiste.length === 0) {
                console.log(`⚠️ Advertencia: El vídeo con ID #${id} no existe en la base de datos. Saltando...`);
                continue;
            }

            // Actualizar la descripción
            await connection.execute("UPDATE videos SET descripcion = ? WHERE id = ?", [texto, id]);
            console.log(`✅ Vídeo ID #${id} actualizado correctamente con su nueva ficha técnica.`);
            actualizados++;
        }

        console.log("--------------------------------------------------");
        console.log(`\n🏁 PROCESO FINALIZADO. Se han actualizado ${actualizados} descripciones en el búnker.`);

    } catch (error) {
        console.error("❌ ERROR CRÍTICO EN LA ACTUALIZACIÓN:", error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log("📡 Conexión cerrada.");
        }
    }
}

main();
