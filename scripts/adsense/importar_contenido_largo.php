<?php
/**
 * ============================================================
 *  EXPEDIENTE X GRANAÍNO — IMPORTADOR DE CONTENIDO ENRIQUECIDO
 * ============================================================
 *  
 *  Este script lee el JSON con los textos largos generados por
 *  tu IA y hace UPDATE masivo en la base de datos.
 *  
 *  SEGURIDAD:
 *  - Hace backup automático del contenido original ANTES de tocar nada
 *  - Solo actualiza la columna de texto, no toca nada más
 *  - Valida que el texto nuevo tenga al menos 400 palabras
 *  - Si algo falla, el backup te permite restaurar
 *  
 *  USO:
 *    php importar_contenido_largo.php
 *  
 *  ENTRADA:
 *    scripts/adsense/contenido_largo_de_ia.json
 *  
 * ============================================================
 */

require_once __DIR__ . '/config.php';

echo "\n";
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║   PROTOCOLO DE IMPORTACIÓN — CONTENIDO ENRIQUECIDO         ║\n";
echo "║   Umbral mínimo: $UMBRAL_PALABRAS palabras por registro                  ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

// --- 1. Leer el JSON de entrada ---
$archivoEntrada = __DIR__ . '/contenido_largo_de_ia.json';

if (!file_exists($archivoEntrada)) {
    die("❌ ERROR: No se encuentra el archivo de entrada.\n" .
        "   Esperado en: $archivoEntrada\n\n" .
        "   INSTRUCCIONES:\n" .
        "   1. Ejecuta primero: php extraer_contenido_corto.php\n" .
        "   2. Pasa el JSON generado a tu IA\n" .
        "   3. Guarda el resultado como 'contenido_largo_de_ia.json'\n" .
        "   4. Vuelve a ejecutar este script\n\n");
}

$jsonRaw = file_get_contents($archivoEntrada);
$datos = json_decode($jsonRaw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    die("❌ ERROR: El archivo JSON no es válido: " . json_last_error_msg() . "\n");
}

if (!isset($datos['tablas']) || empty($datos['tablas'])) {
    die("❌ ERROR: El JSON no tiene la estructura esperada (falta la clave 'tablas').\n");
}

// --- 2. Crear backup del contenido original ANTES de tocar nada ---
echo "🛡️  FASE 1: Creando backup de seguridad del contenido original...\n\n";

$backupData = [];
$backupFile = __DIR__ . '/backup_contenido_original_' . date('Y-m-d_His') . '.json';

foreach ($datos['tablas'] as $tabla => $info) {
    $columnaTexto = $info['columna_texto'];
    $registros = $info['registros'] ?? [];

    if (empty($registros)) continue;

    $ids = array_map(function($r) { return (int)$r['id']; }, $registros);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    try {
        $sql = "SELECT `id`, `$columnaTexto` FROM `$tabla` WHERE `id` IN ($placeholders)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($ids);
        $originales = $stmt->fetchAll();

        $backupData[$tabla] = [
            'columna_texto' => $columnaTexto,
            'registros'     => $originales,
        ];

        echo "   ✅ Backup de '$tabla': " . count($originales) . " registros guardados\n";
    } catch (PDOException $e) {
        echo "   ⚠️  No se pudo hacer backup de '$tabla': " . $e->getMessage() . "\n";
    }
}

$jsonFlags = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
if (file_put_contents($backupFile, json_encode($backupData, $jsonFlags)) !== false) {
    $tamanoBackup = round(filesize($backupFile) / 1024, 1);
    echo "\n   🛡️  Backup guardado: $backupFile ($tamanoBackup KB)\n";
} else {
    die("\n❌ ERROR CRÍTICO: No se pudo crear el backup. Abortando por seguridad.\n");
}

// --- 3. Ejecutar los UPDATEs ---
echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "🔄 FASE 2: Inyectando contenido enriquecido en la base de datos...\n\n";

$totalActualizados = 0;
$totalRechazados = 0;
$totalErrores = 0;
$detalles = [];

foreach ($datos['tablas'] as $tabla => $info) {
    $columnaTexto = $info['columna_texto'];
    $registros = $info['registros'] ?? [];

    if (empty($registros)) {
        echo "   ⏭️  Tabla '$tabla': sin registros que actualizar.\n";
        continue;
    }

    echo "   📂 Procesando tabla: $tabla (" . count($registros) . " registros)\n";

    $actualizadosTabla = 0;
    $rechazadosTabla = 0;
    $erroresTabla = 0;

    // Preparar el UPDATE una sola vez por tabla
    $sqlUpdate = "UPDATE `$tabla` SET `$columnaTexto` = ? WHERE `id` = ?";
    $stmtUpdate = $pdo->prepare($sqlUpdate);

    foreach ($registros as $registro) {
        $id = (int)($registro['id'] ?? 0);
        $textoNuevo = $registro[$columnaTexto] ?? '';

        if ($id === 0) {
            echo "      ⚠️  Registro sin ID válido. Saltando.\n";
            $rechazadosTabla++;
            continue;
        }

        // Validar que el texto nuevo tiene sustancia
        $palabrasNuevas = contarPalabras($textoNuevo);

        if ($palabrasNuevas < $UMBRAL_PALABRAS) {
            echo "      ⚠️  ID $id: Texto nuevo demasiado corto ($palabrasNuevas palabras). Saltando.\n";
            $rechazadosTabla++;
            continue;
        }

        // Ejecutar el UPDATE
        try {
            $stmtUpdate->execute([$textoNuevo, $id]);
            $actualizadosTabla++;

            // Mostrar progreso cada 10 registros o para los primeros 5
            if ($actualizadosTabla <= 5 || $actualizadosTabla % 10 === 0) {
                $tituloRef = $registro['titulo'] ?? $registro['nombre'] ?? "ID $id";
                echo "      ✅ ID $id: \"$tituloRef\" → $palabrasNuevas palabras\n";
            }
        } catch (PDOException $e) {
            echo "      ❌ ID $id: Error → " . $e->getMessage() . "\n";
            $erroresTabla++;
        }
    }

    $totalActualizados += $actualizadosTabla;
    $totalRechazados += $rechazadosTabla;
    $totalErrores += $erroresTabla;

    $detalles[] = [
        'tabla'        => $tabla,
        'actualizados' => $actualizadosTabla,
        'rechazados'   => $rechazadosTabla,
        'errores'      => $erroresTabla,
    ];

    echo "      📊 Resultado: $actualizadosTabla actualizados, $rechazadosTabla rechazados, $erroresTabla errores\n\n";
}

// --- 4. Resumen final ---
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "\n📊 RESUMEN FINAL DE LA OPERACIÓN:\n\n";

echo "   ┌─────────────────────┬──────────────┬────────────┬──────────┐\n";
echo "   │ Tabla               │ Actualizados │ Rechazados │ Errores  │\n";
echo "   ├─────────────────────┼──────────────┼────────────┼──────────┤\n";

foreach ($detalles as $d) {
    $t = str_pad($d['tabla'], 19);
    $a = str_pad($d['actualizados'], 12, ' ', STR_PAD_LEFT);
    $r = str_pad($d['rechazados'], 10, ' ', STR_PAD_LEFT);
    $e = str_pad($d['errores'], 8, ' ', STR_PAD_LEFT);
    echo "   │ $t │ $a │ $r │ $e │\n";
}

echo "   ├─────────────────────┼──────────────┼────────────┼──────────┤\n";
$tTotal = str_pad('TOTAL', 19);
$aTotal = str_pad($totalActualizados, 12, ' ', STR_PAD_LEFT);
$rTotal = str_pad($totalRechazados, 10, ' ', STR_PAD_LEFT);
$eTotal = str_pad($totalErrores, 8, ' ', STR_PAD_LEFT);
echo "   │ $tTotal │ $aTotal │ $rTotal │ $eTotal │\n";
echo "   └─────────────────────┴──────────────┴────────────┴──────────┘\n\n";

if ($totalActualizados > 0) {
    echo "✅ OPERACIÓN COMPLETADA. Contenido enriquecido inyectado en la base de datos.\n";
    echo "🛡️  Backup de seguridad: $backupFile\n";
    echo "\n";
    echo "⚠️  IMPORTANTE: Si necesitas REVERTIR los cambios, ejecuta:\n";
    echo "   php restaurar_backup.php $backupFile\n";
}

if ($totalErrores > 0) {
    echo "\n⚠️  ATENCIÓN: Hubo $totalErrores errores durante la importación.\n";
    echo "   Revisa los mensajes de error arriba para más detalles.\n";
}

echo "\n";
