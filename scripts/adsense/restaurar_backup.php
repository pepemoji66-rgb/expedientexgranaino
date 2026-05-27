<?php
/**
 * ============================================================
 *  EXPEDIENTE X GRANAÍNO — RESTAURADOR DE BACKUP
 * ============================================================
 *  
 *  Script de emergencia para revertir los cambios si algo
 *  sale mal con la importación de contenido enriquecido.
 *  
 *  USO:
 *    php restaurar_backup.php backup_contenido_original_2026-05-27_193000.json
 *  
 *  Si no pasas argumento, busca el backup más reciente.
 * 
 * ============================================================
 */

require_once __DIR__ . '/config.php';

echo "\n";
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║   🚨 PROTOCOLO DE RESTAURACIÓN DE EMERGENCIA               ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

// --- Determinar qué backup usar ---
$archivoBackup = null;

if (isset($argv[1]) && !empty($argv[1])) {
    // Argumento pasado por línea de comandos
    $archivoBackup = $argv[1];
    // Si es un nombre relativo, buscarlo en el directorio actual
    if (!file_exists($archivoBackup)) {
        $archivoBackup = __DIR__ . '/' . $archivoBackup;
    }
} else {
    // Buscar el backup más reciente automáticamente
    $patron = __DIR__ . '/backup_contenido_original_*.json';
    $archivos = glob($patron);
    if (!empty($archivos)) {
        sort($archivos);
        $archivoBackup = end($archivos); // El más reciente por nombre (fecha en formato ordenable)
        echo "📂 Backup más reciente encontrado automáticamente:\n";
        echo "   $archivoBackup\n\n";
    }
}

if (!$archivoBackup || !file_exists($archivoBackup)) {
    die("❌ ERROR: No se encuentra ningún archivo de backup.\n\n" .
        "   USO: php restaurar_backup.php <nombre_del_backup.json>\n\n" .
        "   Los backups se crean automáticamente al ejecutar importar_contenido_largo.php\n\n");
}

// --- Leer el backup ---
$jsonRaw = file_get_contents($archivoBackup);
$datos = json_decode($jsonRaw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    die("❌ ERROR: El archivo de backup no es un JSON válido: " . json_last_error_msg() . "\n");
}

if (empty($datos)) {
    die("❌ ERROR: El archivo de backup está vacío.\n");
}

// --- Confirmar la restauración ---
$totalRegistros = 0;
foreach ($datos as $tabla => $info) {
    $totalRegistros += count($info['registros'] ?? []);
}

echo "⚠️  Se van a RESTAURAR $totalRegistros registros en " . count($datos) . " tabla(s).\n";
echo "   Esto SOBREESCRIBIRÁ el contenido actual con el contenido original.\n\n";
echo "   ¿Continuar? Escribe 'SI' para confirmar: ";

$confirmacion = trim(fgets(STDIN));

if (strtoupper($confirmacion) !== 'SI') {
    die("\n🛑 Restauración cancelada por el usuario.\n\n");
}

echo "\n🔄 Restaurando contenido original...\n\n";

// --- Ejecutar la restauración ---
$totalRestaurados = 0;
$totalErrores = 0;

foreach ($datos as $tabla => $info) {
    $columnaTexto = $info['columna_texto'];
    $registros = $info['registros'] ?? [];

    if (empty($registros)) continue;

    echo "   📂 Restaurando tabla: $tabla (" . count($registros) . " registros)\n";

    $sqlUpdate = "UPDATE `$tabla` SET `$columnaTexto` = ? WHERE `id` = ?";
    $stmtUpdate = $pdo->prepare($sqlUpdate);

    foreach ($registros as $row) {
        $id = (int)$row['id'];
        $textoOriginal = $row[$columnaTexto] ?? '';

        try {
            $stmtUpdate->execute([$textoOriginal, $id]);
            $totalRestaurados++;
        } catch (PDOException $e) {
            echo "      ❌ ID $id: " . $e->getMessage() . "\n";
            $totalErrores++;
        }
    }

    echo "      ✅ Completado\n";
}

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "\n📊 RESULTADO:\n";
echo "   Registros restaurados: $totalRestaurados\n";
echo "   Errores: $totalErrores\n\n";

if ($totalErrores === 0) {
    echo "✅ RESTAURACIÓN COMPLETADA. Todo vuelve a estar como antes.\n";
} else {
    echo "⚠️  Restauración completada con $totalErrores errores.\n";
}

echo "\n";
