/**
 * ============================================================
 *  EXPEDIENTE X GRANAÍNO — RESTAURADOR DE BACKUP
 * ============================================================
 *
 *  Script de emergencia para revertir los cambios.
 *
 *  USO:
 *    node scripts/adsense/restaurar_backup.js
 *    node scripts/adsense/restaurar_backup.js backup_contenido_original_2026-05-27T19-30-00.json
 *
 *  Si no pasas argumento, busca el backup más reciente.
 *
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const db = require('../../db');

async function preguntar(texto) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(texto, respuesta => {
            rl.close();
            resolve(respuesta.trim());
        });
    });
}

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   🚨 PROTOCOLO DE RESTAURACIÓN DE EMERGENCIA               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    // --- Determinar qué backup usar ---
    let archivoBackup = null;

    if (process.argv[2]) {
        archivoBackup = process.argv[2];
        if (!fs.existsSync(archivoBackup)) {
            archivoBackup = path.join(__dirname, archivoBackup);
        }
    } else {
        // Buscar el backup más reciente
        const archivos = fs.readdirSync(__dirname)
            .filter(f => f.startsWith('backup_contenido_original_') && f.endsWith('.json'))
            .sort();

        if (archivos.length > 0) {
            archivoBackup = path.join(__dirname, archivos[archivos.length - 1]);
            console.log('📂 Backup más reciente encontrado automáticamente:');
            console.log(`   ${archivoBackup}`);
            console.log('');
        }
    }

    if (!archivoBackup || !fs.existsSync(archivoBackup)) {
        console.error('❌ ERROR: No se encuentra ningún archivo de backup.');
        console.error('');
        console.error('   USO: node scripts/adsense/restaurar_backup.js <nombre_del_backup.json>');
        console.error('');
        console.error('   Los backups se crean automáticamente al ejecutar importar_contenido_largo.js');
        process.exit(1);
    }

    // --- Leer el backup ---
    let datos;
    try {
        const jsonRaw = fs.readFileSync(archivoBackup, 'utf8');
        datos = JSON.parse(jsonRaw);
    } catch (e) {
        console.error('❌ ERROR: El archivo de backup no es un JSON válido:', e.message);
        process.exit(1);
    }

    if (!datos || Object.keys(datos).length === 0) {
        console.error('❌ ERROR: El archivo de backup está vacío.');
        process.exit(1);
    }

    // --- Confirmar ---
    let totalRegistros = 0;
    for (const tabla in datos) {
        totalRegistros += (datos[tabla].registros || []).length;
    }

    console.log(`⚠️  Se van a RESTAURAR ${totalRegistros} registros en ${Object.keys(datos).length} tabla(s).`);
    console.log('   Esto SOBREESCRIBIRÁ el contenido actual con el contenido original.');
    console.log('');

    const confirmacion = await preguntar("   ¿Continuar? Escribe 'SI' para confirmar: ");

    if (confirmacion.toUpperCase() !== 'SI') {
        console.log('');
        console.log('🛑 Restauración cancelada por el usuario.');
        process.exit(0);
    }

    console.log('');
    console.log('🔄 Restaurando contenido original...');
    console.log('');

    // --- Ejecutar la restauración ---
    let totalRestaurados = 0;
    let totalErrores = 0;

    for (const [tabla, info] of Object.entries(datos)) {
        const columnaTexto = info.columna_texto;
        const registros = info.registros || [];

        if (registros.length === 0) continue;

        console.log(`   📂 Restaurando tabla: ${tabla} (${registros.length} registros)`);

        for (const row of registros) {
            const id = parseInt(row.id);
            const textoOriginal = row[columnaTexto] || '';

            try {
                const sqlUpdate = `UPDATE \`${tabla}\` SET \`${columnaTexto}\` = ? WHERE \`id\` = ?`;
                await db.execute(sqlUpdate, [textoOriginal, id]);
                totalRestaurados++;
            } catch (e) {
                console.log(`      ❌ ID ${id}: ${e.message}`);
                totalErrores++;
            }
        }

        console.log('      ✅ Completado');
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 RESULTADO:');
    console.log(`   Registros restaurados: ${totalRestaurados}`);
    console.log(`   Errores: ${totalErrores}`);
    console.log('');

    if (totalErrores === 0) {
        console.log('✅ RESTAURACIÓN COMPLETADA. Todo vuelve a estar como antes.');
    } else {
        console.log(`⚠️  Restauración completada con ${totalErrores} errores.`);
    }

    console.log('');
    process.exit(0);
}

main().catch(err => {
    console.error('❌ ERROR CRÍTICO:', err.message);
    process.exit(1);
});
