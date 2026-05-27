<?php
/**
 * ============================================================
 *  EXPEDIENTE X GRANAÍNO — EXTRACTOR DE CONTENIDO CORTO
 * ============================================================
 *  
 *  Este script analiza TODAS las tablas públicas de la web y
 *  extrae los registros cuyo texto tiene menos de 400 palabras.
 *  
 *  Genera un archivo JSON listo para pasárselo a tu IA y que
 *  redacte artículos largos con el contexto de cada registro.
 *  
 *  USO:
 *    php extraer_contenido_corto.php
 *  
 *  SALIDA:
 *    scripts/adsense/contenido_corto_para_ia.json
 * 
 * ============================================================
 */

require_once __DIR__ . '/config.php';

echo "\n";
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║   PROTOCOLO DE EXTRACCIÓN — CONTENIDO DE POCO VALOR        ║\n";
echo "║   Umbral: menos de $UMBRAL_PALABRAS palabras                              ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

// --- Definición de tablas a escanear ---
// Cada entrada: [tabla, columna_texto, columnas_contexto_extra]
$tablas = [
    [
        'tabla'            => 'expedientes',
        'columna_texto'    => 'contenido',
        'columnas_contexto'=> ['id', 'titulo', 'contenido', 'usuario_nombre', 'latitud', 'longitud', 'imagen_url', 'tipo', 'estado', 'fecha'],
        'filtro_estado'    => "(estado = 'aprobado' OR estado = 'publicado' OR estado = 'activo')",
    ],
    [
        'tabla'            => 'casos_abiertos',
        'columna_texto'    => 'contenido',
        'columnas_contexto'=> ['id', 'titulo', 'contenido', 'imagen_url', 'latitud', 'longitud', 'estado', 'fecha', 'titulo_en', 'contenido_en'],
        'filtro_estado'    => "(estado = 'aprobado' OR estado = 'publicado' OR estado = 'activo' OR estado = 'pendiente')",
    ],
    [
        'tabla'            => 'noticias',
        'columna_texto'    => 'cuerpo',
        'columnas_contexto'=> ['id', 'titulo', 'cuerpo', 'categoria', 'nivel_alerta', 'autor', 'imagen_url', 'ubicacion', 'estado', 'fecha', 'fuente_url'],
        'filtro_estado'    => "(estado = 'aprobado' OR estado = 'publicado' OR aprobado = 1)",
    ],
    [
        'tabla'            => 'lugares',
        'columna_texto'    => 'descripcion',
        'columnas_contexto'=> ['id', 'titulo', 'nombre', 'descripcion', 'latitud', 'longitud', 'imagen_url', 'ubicacion', 'estado', 'fecha'],
        'filtro_estado'    => "(estado = 'aprobado' OR estado IS NULL)",
    ],
    [
        'tabla'            => 'efemerides',
        'columna_texto'    => 'contenido',
        'columnas_contexto'=> ['id', 'titulo', 'contenido', 'anio_evento', 'ubicacion', 'categoria', 'fecha'],
        'filtro_estado'    => "1=1",  // Las efemérides no tienen filtro de estado
    ],
];

$resultadoGlobal = [];
$totalExtraidos = 0;
$totalAnalizados = 0;

foreach ($tablas as $config) {
    $tabla            = $config['tabla'];
    $columnaTexto     = $config['columna_texto'];
    $columnasContexto = $config['columnas_contexto'];
    $filtroEstado     = $config['filtro_estado'];

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "📂 Escaneando tabla: $tabla (columna: $columnaTexto)\n";

    // Verificar que la tabla existe
    try {
        $checkStmt = $pdo->query("SELECT 1 FROM `$tabla` LIMIT 1");
    } catch (PDOException $e) {
        echo "   ⚠️  Tabla '$tabla' no existe o no es accesible. Saltando...\n\n";
        continue;
    }

    // Construir la consulta SELECT con las columnas de contexto
    $columnasSql = implode(', ', array_map(function($col) { return "`$col`"; }, $columnasContexto));
    $sql = "SELECT $columnasSql FROM `$tabla` WHERE $filtroEstado ORDER BY id ASC";

    try {
        $stmt = $pdo->query($sql);
        $registros = $stmt->fetchAll();
    } catch (PDOException $e) {
        echo "   ❌ Error al consultar '$tabla': " . $e->getMessage() . "\n\n";
        continue;
    }

    $totalTabla = count($registros);
    $cortosTabla = 0;
    $registrosCortos = [];

    foreach ($registros as $row) {
        $totalAnalizados++;
        $texto = $row[$columnaTexto] ?? '';
        $numPalabras = contarPalabras($texto);

        if ($numPalabras < $UMBRAL_PALABRAS) {
            $cortosTabla++;

            // Preparar el registro para exportar
            $registro = [];
            foreach ($columnasContexto as $col) {
                $registro[$col] = $row[$col] ?? null;
            }
            $registro['_palabras_actuales'] = $numPalabras;
            $registro['_columna_a_engordar'] = $columnaTexto;

            $registrosCortos[] = $registro;
        }
    }

    $totalExtraidos += $cortosTabla;

    echo "   📊 Total en tabla: $totalTabla\n";
    echo "   🔻 Con menos de $UMBRAL_PALABRAS palabras: $cortosTabla\n";

    if ($cortosTabla > 0) {
        // Mostrar algunos ejemplos
        $ejemplos = min(3, $cortosTabla);
        echo "   📝 Ejemplos:\n";
        for ($i = 0; $i < $ejemplos; $i++) {
            $r = $registrosCortos[$i];
            $tituloEjemplo = $r['titulo'] ?? $r['nombre'] ?? '(sin título)';
            echo "      - ID {$r['id']}: \"$tituloEjemplo\" ({$r['_palabras_actuales']} palabras)\n";
        }
    }

    echo "\n";

    if (!empty($registrosCortos)) {
        $resultadoGlobal[$tabla] = [
            'columna_texto'    => $columnaTexto,
            'total_en_tabla'   => $totalTabla,
            'total_extraidos'  => $cortosTabla,
            'registros'        => $registrosCortos,
        ];
    }
}

// --- Exportar JSON ---
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "\n📊 RESUMEN GLOBAL:\n";
echo "   Registros analizados: $totalAnalizados\n";
echo "   Registros con contenido corto: $totalExtraidos\n\n";

if ($totalExtraidos === 0) {
    echo "✅ ¡Todo el contenido ya supera las $UMBRAL_PALABRAS palabras! No hay nada que engordar.\n";
    exit(0);
}

$archivoSalida = __DIR__ . '/contenido_corto_para_ia.json';

$exportar = [
    '_meta' => [
        'fecha_extraccion'  => date('Y-m-d H:i:s'),
        'umbral_palabras'   => $UMBRAL_PALABRAS,
        'total_registros'   => $totalExtraidos,
        'instrucciones'     => 'Pásale este JSON a tu IA. Para cada registro, debe generar un texto de al menos ' . $UMBRAL_PALABRAS . ' palabras usando el contexto disponible (título, ubicación, etc.). El texto generado debe ir en el campo que indica _columna_a_engordar. Devuelve un JSON con la misma estructura pero con los textos largos en la columna correspondiente.',
    ],
    'tablas' => $resultadoGlobal,
];

$jsonFlags = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
$jsonOutput = json_encode($exportar, $jsonFlags);

if (file_put_contents($archivoSalida, $jsonOutput) !== false) {
    $tamano = round(filesize($archivoSalida) / 1024, 1);
    echo "✅ JSON exportado correctamente:\n";
    echo "   📁 $archivoSalida\n";
    echo "   📏 Tamaño: {$tamano} KB\n\n";
    echo "🚀 SIGUIENTE PASO:\n";
    echo "   1. Abre el archivo 'contenido_corto_para_ia.json'\n";
    echo "   2. Pásaselo a tu IA para que redacte los textos largos\n";
    echo "   3. Guarda el resultado como 'contenido_largo_de_ia.json'\n";
    echo "   4. Ejecuta: php importar_contenido_largo.php\n";
} else {
    echo "❌ ERROR: No se pudo escribir el archivo de salida.\n";
}

echo "\n";
