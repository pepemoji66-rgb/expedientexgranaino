/**
 * ============================================================
 *  EXPEDIENTE X GRANAÍNO — EXTRACTOR DE CONTENIDO CORTO
 * ============================================================
 *
 *  Escanea TODAS las tablas públicas y extrae los registros
 *  cuyo texto tiene menos de 400 palabras.
 *
 *  Genera un JSON listo para pasárselo a tu IA.
 *
 *  USO:
 *    node scripts/adsense/extraer_contenido_corto.js
 *
 *  SALIDA:
 *    scripts/adsense/contenido_corto_para_ia.json
 *
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const db = require('../../db');

// --- Umbral: todo lo que tenga MENOS de esto se extrae ---
const UMBRAL_PALABRAS = 400;

/**
 * Cuenta las palabras de un texto, limpiando HTML
 */
function contarPalabras(texto) {
    if (!texto) return 0;
    // Quitar etiquetas HTML
    let limpio = texto.replace(/<[^>]*>/g, '');
    // Normalizar espacios
    limpio = limpio.replace(/\s+/g, ' ').trim();
    if (limpio.length === 0) return 0;
    return limpio.split(/\s+/).length;
}

// --- Definición de tablas a escanear ---
const TABLAS = [
    {
        tabla: 'expedientes',
        columnaTexto: 'contenido',
        columnasContexto: ['id', 'titulo', 'contenido', 'usuario_nombre', 'latitud', 'longitud', 'imagen_url', 'tipo', 'estado', 'fecha'],
        filtroEstado: "(estado = 'aprobado' OR estado = 'publicado' OR estado = 'activo')",
    },
    {
        tabla: 'casos_abiertos',
        columnaTexto: 'contenido',
        columnasContexto: ['id', 'titulo', 'contenido', 'imagen_url', 'latitud', 'longitud', 'estado', 'fecha', 'titulo_en', 'contenido_en'],
        filtroEstado: "(estado = 'aprobado' OR estado = 'publicado' OR estado = 'activo' OR estado = 'pendiente')",
    },
    {
        tabla: 'noticias',
        columnaTexto: 'cuerpo',
        columnasContexto: ['id', 'titulo', 'cuerpo', 'categoria', 'nivel_alerta', 'autor', 'imagen_url', 'ubicacion', 'estado', 'fecha', 'fuente_url'],
        filtroEstado: "(estado = 'aprobado' OR estado = 'publicado' OR aprobado = 1)",
    },
    {
        tabla: 'lugares',
        columnaTexto: 'descripcion',
        columnasContexto: ['id', 'titulo', 'nombre', 'descripcion', 'latitud', 'longitud', 'imagen_url', 'ubicacion', 'estado', 'fecha'],
        filtroEstado: "(estado = 'aprobado' OR estado IS NULL)",
    },
    {
        tabla: 'efemerides',
        columnaTexto: 'contenido',
        columnasContexto: ['id', 'titulo', 'contenido', 'anio_evento', 'ubicacion', 'categoria', 'fecha'],
        filtroEstado: "1=1",
    },
];

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   PROTOCOLO DE EXTRACCIÓN — CONTENIDO DE POCO VALOR        ║');
    console.log(`║   Umbral: menos de ${UMBRAL_PALABRAS} palabras                              ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    const resultadoGlobal = {};
    let totalExtraidos = 0;
    let totalAnalizados = 0;

    for (const config of TABLAS) {
        const { tabla, columnaTexto, columnasContexto, filtroEstado } = config;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📂 Escaneando tabla: ${tabla} (columna: ${columnaTexto})`);

        // Verificar que la tabla existe
        let registros;
        try {
            const columnasSql = columnasContexto.map(c => `\`${c}\``).join(', ');
            const sql = `SELECT ${columnasSql} FROM \`${tabla}\` WHERE ${filtroEstado} ORDER BY id ASC`;
            registros = await db.query(sql);
        } catch (e) {
            console.log(`   ⚠️  Tabla '${tabla}' no accesible: ${e.message}. Saltando...`);
            console.log('');
            continue;
        }

        const totalTabla = registros.length;
        let cortosTabla = 0;
        const registrosCortos = [];

        for (const row of registros) {
            totalAnalizados++;
            const texto = row[columnaTexto] || '';
            const numPalabras = contarPalabras(texto);

            if (numPalabras < UMBRAL_PALABRAS) {
                cortosTabla++;

                const registro = {};
                for (const col of columnasContexto) {
                    registro[col] = row[col] !== undefined ? row[col] : null;
                }
                registro._palabras_actuales = numPalabras;
                registro._columna_a_engordar = columnaTexto;

                registrosCortos.push(registro);
            }
        }

        totalExtraidos += cortosTabla;

        console.log(`   📊 Total en tabla: ${totalTabla}`);
        console.log(`   🔻 Con menos de ${UMBRAL_PALABRAS} palabras: ${cortosTabla}`);

        if (cortosTabla > 0) {
            const ejemplos = Math.min(3, cortosTabla);
            console.log('   📝 Ejemplos:');
            for (let i = 0; i < ejemplos; i++) {
                const r = registrosCortos[i];
                const tituloEjemplo = r.titulo || r.nombre || '(sin título)';
                console.log(`      - ID ${r.id}: "${tituloEjemplo}" (${r._palabras_actuales} palabras)`);
            }
        }

        console.log('');

        if (registrosCortos.length > 0) {
            resultadoGlobal[tabla] = {
                columna_texto: columnaTexto,
                total_en_tabla: totalTabla,
                total_extraidos: cortosTabla,
                registros: registrosCortos,
            };
        }
    }

    // --- Resumen ---
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 RESUMEN GLOBAL:');
    console.log(`   Registros analizados: ${totalAnalizados}`);
    console.log(`   Registros con contenido corto: ${totalExtraidos}`);
    console.log('');

    if (totalExtraidos === 0) {
        console.log(`✅ ¡Todo el contenido ya supera las ${UMBRAL_PALABRAS} palabras! No hay nada que engordar.`);
        process.exit(0);
    }

    // --- Exportar JSON ---
    const archivoSalida = path.join(__dirname, 'contenido_corto_para_ia.json');

    const exportar = {
        _meta: {
            fecha_extraccion: new Date().toISOString(),
            umbral_palabras: UMBRAL_PALABRAS,
            total_registros: totalExtraidos,
            instrucciones: `Pásale este JSON a tu IA. Para cada registro, debe generar un texto de al menos ${UMBRAL_PALABRAS} palabras usando el contexto disponible (título, ubicación, etc.). El texto generado debe ir en el campo que indica _columna_a_engordar. Devuelve un JSON con la misma estructura pero con los textos largos en la columna correspondiente.`,
        },
        tablas: resultadoGlobal,
    };

    const jsonOutput = JSON.stringify(exportar, null, 2);
    fs.writeFileSync(archivoSalida, jsonOutput, 'utf8');

    const tamano = (Buffer.byteLength(jsonOutput) / 1024).toFixed(1);

    console.log('✅ JSON exportado correctamente:');
    console.log(`   📁 ${archivoSalida}`);
    console.log(`   📏 Tamaño: ${tamano} KB`);
    console.log('');
    console.log('🚀 SIGUIENTE PASO:');
    console.log("   1. Abre el archivo 'contenido_corto_para_ia.json'");
    console.log('   2. Pásaselo a tu IA para que redacte los textos largos');
    console.log("   3. Guarda el resultado como 'contenido_largo_de_ia.json' en la misma carpeta");
    console.log('   4. Ejecuta: node scripts/adsense/importar_contenido_largo.js');
    console.log('');

    process.exit(0);
}

main().catch(err => {
    console.error('❌ ERROR CRÍTICO:', err.message);
    process.exit(1);
});
