<?php
/**
 * ============================================================
 *  EXPEDIENTE X GRANAÍNO — Configuración de Base de Datos
 *  Lee automáticamente las credenciales del .env del proyecto
 * ============================================================
 */

// --- Cargar el .env del proyecto (dos niveles arriba: scripts/adsense/ -> raíz) ---
$envPath = __DIR__ . '/../../.env';

if (!file_exists($envPath)) {
    die("❌ ERROR CRÍTICO: No se encuentra el archivo .env en: $envPath\n");
}

$envLines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($envLines as $line) {
    $line = trim($line);
    // Ignorar comentarios
    if (strpos($line, '#') === 0) continue;
    // Parsear KEY=VALUE
    if (strpos($line, '=') !== false) {
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        // Solo setear si no existe ya (no sobreescribir variables de entorno del sistema)
        if (!getenv($key)) {
            putenv("$key=$value");
        }
    }
}

// --- Conexión PDO con SSL para Aiven ---
$dbHost     = getenv('DB_HOST');
$dbPort     = getenv('DB_PORT');
$dbUser     = getenv('DB_USER');
$dbPassword = getenv('DB_PASSWORD');
$dbName     = getenv('DB_NAME');
$dbSSL      = getenv('DB_SSL') === 'true';

if (!$dbHost || !$dbUser || !$dbPassword || !$dbName) {
    die("❌ ERROR: Faltan credenciales de base de datos en el .env\n");
}

try {
    $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    // Aiven requiere SSL
    if ($dbSSL) {
        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        $options[PDO::MYSQL_ATTR_SSL_CA] = '';
    }

    $pdo = new PDO($dsn, $dbUser, $dbPassword, $options);

    echo "📡 CONEXIÓN CON EL BÚNKER (Aiven MySQL) ESTABLECIDA.\n";

} catch (PDOException $e) {
    die("❌ ERROR DE CONEXIÓN: " . $e->getMessage() . "\n");
}

// --- Umbral de palabras: todo lo que tenga MENOS de esto se extrae ---
$UMBRAL_PALABRAS = 400;

/**
 * Cuenta las palabras de un texto, limpiando HTML
 */
function contarPalabras($texto) {
    if (empty($texto)) return 0;
    $limpio = strip_tags($texto);
    $limpio = trim(preg_replace('/\s+/', ' ', $limpio));
    return str_word_count($limpio, 0, 'áéíóúñÁÉÍÓÚÑüÜ');
}
