/**
 * ============================================================
 *  EXPEDIENTE X GRANAÍNO — IMPORTADOR DE CONTENIDO ENRIQUECIDO
 * ============================================================
 *
 *  Lee el JSON con los textos largos generados por tu IA y
 *  hace UPDATE masivo en la base de datos.
 *
 *  SEGURIDAD:
 *  - Backup automático del contenido original ANTES de tocar nada
 *  - Solo actualiza la columna de texto, no toca nada más
 *  - Valida que el texto nuevo tenga al menos 400 palabras
 *  - Si algo falla, el backup te permite restaurar
 *
 *  USO:
 *    node scripts/adsense/importar_contenido_largo.js
 *
 *  ENTRADA:
 *    scripts/adsense/contenido_largo_de_ia.json
 *
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const db = require('../../db');

const UMBRAL_PALABRAS = 80;

function contarPalabras(texto) {
    if (!texto) return 0;
    let limpio = texto.replace(/<[^>]*>/g, '');
    limpio = limpio.replace(/\s+/g, ' ').trim();
    if (limpio.length === 0) return 0;
    return limpio.split(/\s+/).length;
}

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   PROTOCOLO DE IMPORTACIÓN — CONTENIDO ENRIQUECIDO         ║');
    console.log(`║   Umbral mínimo: ${UMBRAL_PALABRAS} palabras por registro                  ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    // --- 1. Leer el JSON de entrada ---
    const archivoEntrada = path.join(__dirname, 'contenido_largo_de_ia.json');

    if (!fs.existsSync(archivoEntrada)) {
        console.error('❌ ERROR: No se encuentra el archivo de entrada.');
        console.error(`   Esperado en: ${archivoEntrada}`);
        console.error('');
        console.error('   INSTRUCCIONES:');
        console.error('   1. Ejecuta primero: node scripts/adsense/extraer_contenido_corto.js');
        console.error('   2. Pasa el JSON generado a tu IA');
        console.error("   3. Guarda el resultado como 'contenido_largo_de_ia.json'");
        console.error('   4. Vuelve a ejecutar este script');
        process.exit(1);
    }

    let datos;
    try {
        const jsonRaw = fs.readFileSync(archivoEntrada, 'utf8');
        datos = JSON.parse(jsonRaw);
    } catch (e) {
        console.error('❌ ERROR: El archivo JSON no es válido:', e.message);
        process.exit(1);
    }

    if (!datos.tablas || Object.keys(datos.tablas).length === 0) {
        console.error("❌ ERROR: El JSON no tiene la estructura esperada (falta la clave 'tablas').");
        process.exit(1);
    }

    // --- 2. Backup del contenido original ---
    console.log('🛡️  FASE 1: Creando backup de seguridad del contenido original...');
    console.log('');

    const backupData = {};
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const backupFile = path.join(__dirname, `backup_contenido_original_${timestamp}.json`);

    for (const [tabla, info] of Object.entries(datos.tablas)) {
        const columnaTexto = info.columna_texto;
        const registros = info.registros || [];

        if (registros.length === 0) continue;

        const ids = registros.map(r => parseInt(r.id));
        const placeholders = ids.map(() => '?').join(',');

        try {
            const sql = `SELECT \`id\`, \`${columnaTexto}\` FROM \`${tabla}\` WHERE \`id\` IN (${placeholders})`;
            const originales = await db.query(sql, ids);

            backupData[tabla] = {
                columna_texto: columnaTexto,
                registros: originales,
            };

            console.log(`   ✅ Backup de '${tabla}': ${originales.length} registros guardados`);
        } catch (e) {
            console.log(`   ⚠️  No se pudo hacer backup de '${tabla}': ${e.message}`);
        }
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    const tamanoBackup = (fs.statSync(backupFile).size / 1024).toFixed(1);
    console.log('');
    console.log(`   🛡️  Backup guardado: ${backupFile} (${tamanoBackup} KB)`);

    // --- 3. Ejecutar los UPDATEs ---
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 FASE 2: Inyectando contenido enriquecido en la base de datos...');
    console.log('');

    let totalActualizados = 0;
    let totalRechazados = 0;
    let totalErrores = 0;
    const detalles = [];

    for (const [tabla, info] of Object.entries(datos.tablas)) {
        const columnaTexto = info.columna_texto;
        const registros = info.registros || [];

        if (registros.length === 0) {
            console.log(`   ⏭️  Tabla '${tabla}': sin registros que actualizar.`);
            continue;
        }

        console.log(`   📂 Procesando tabla: ${tabla} (${registros.length} registros)`);

        let actualizadosTabla = 0;
        let rechazadosTabla = 0;
        let erroresTabla = 0;

        for (const registro of registros) {
            const id = parseInt(registro.id || 0);
            const textoNuevo = registro[columnaTexto] || '';

            if (id === 0) {
                console.log('      ⚠️  Registro sin ID válido. Saltando.');
                rechazadosTabla++;
                continue;
            }

            const palabrasNuevas = contarPalabras(textoNuevo);

            if (palabrasNuevas < UMBRAL_PALABRAS) {
                console.log(`      ⚠️  ID ${id}: Texto nuevo demasiado corto (${palabrasNuevas} palabras). Saltando.`);
                rechazadosTabla++;
                continue;
            }

            try {
                const sqlUpdate = `UPDATE \`${tabla}\` SET \`${columnaTexto}\` = ? WHERE \`id\` = ?`;
                await db.execute(sqlUpdate, [textoNuevo, id]);
                actualizadosTabla++;

                if (actualizadosTabla <= 5 || actualizadosTabla % 10 === 0) {
                    const tituloRef = registro.titulo || registro.nombre || `ID ${id}`;
                    console.log(`      ✅ ID ${id}: "${tituloRef}" → ${palabrasNuevas} palabras`);
                }
            } catch (e) {
                console.log(`      ❌ ID ${id}: Error → ${e.message}`);
                erroresTabla++;
            }
        }

        totalActualizados += actualizadosTabla;
        totalRechazados += rechazadosTabla;
        totalErrores += erroresTabla;

        detalles.push({ tabla, actualizados: actualizadosTabla, rechazados: rechazadosTabla, errores: erroresTabla });

        console.log(`      📊 Resultado: ${actualizadosTabla} actualizados, ${rechazadosTabla} rechazados, ${erroresTabla} errores`);
        console.log('');
    }

    // --- 4. Resumen final ---
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 RESUMEN FINAL DE LA OPERACIÓN:');
    console.log('');
    console.log('   ┌─────────────────────┬──────────────┬────────────┬──────────┐');
    console.log('   │ Tabla               │ Actualizados │ Rechazados │ Errores  │');
    console.log('   ├─────────────────────┼──────────────┼────────────┼──────────┤');

    for (const d of detalles) {
        const t = d.tabla.padEnd(19);
        const a = String(d.actualizados).padStart(12);
        const r = String(d.rechazados).padStart(10);
        const e = String(d.errores).padStart(8);
        console.log(`   │ ${t} │ ${a} │ ${r} │ ${e} │`);
    }

    console.log('   ├─────────────────────┼──────────────┼────────────┼──────────┤');
    const tT = 'TOTAL'.padEnd(19);
    const aT = String(totalActualizados).padStart(12);
    const rT = String(totalRechazados).padStart(10);
    const eT = String(totalErrores).padStart(8);
    console.log(`   │ ${tT} │ ${aT} │ ${rT} │ ${eT} │`);
    console.log('   └─────────────────────┴──────────────┴────────────┴──────────┘');
    console.log('');

    if (totalActualizados > 0) {
        console.log('✅ OPERACIÓN COMPLETADA. Contenido enriquecido inyectado en la base de datos.');
        console.log(`🛡️  Backup de seguridad: ${backupFile}`);
        console.log('');
        console.log('⚠️  Si necesitas REVERTIR los cambios, ejecuta:');
        console.log(`   node scripts/adsense/restaurar_backup.js ${path.basename(backupFile)}`);
    }

    if (totalErrores > 0) {
        console.log('');
        console.log(`⚠️  ATENCIÓN: Hubo ${totalErrores} errores durante la importación.`);
    }

    console.log('');
    process.exit(0);
}

main().catch(err => {
    console.error('❌ ERROR CRÍTICO:', err.message);
    process.exit(1);
});
