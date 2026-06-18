const mysql = require('mysql2/promise');

const config = {
    host: 'mysql-1cd66845-pepemoji66-a012.c.aivencloud.com',
    port: 11475,
    user: 'avnadmin',
    password: 'AVNS_f1PJAUD3s5YOIS98BUr',
    database: 'egipto_db',
    ssl: { rejectUnauthorized: false }
};

const DEFAULT_DOSSIERS = [
  {
    sigla: "EXP-001",
    titulo: "La Era de las Pirámides y el Imperio Antiguo",
    periodo: "c. 2686 – 2181 a.C.",
    imagen: "/imagenes/1.avif",
    resumen: "El surgimiento de la arquitectura monumental en piedra y la consolidación de la teocracia divina en torno a la figura del Faraón.",
    latitud: "29.9792",
    longitud: "31.1342", // Centrado en Keops
    detalles: [
      {
        subtitulo: "Imhotep y la Revolución de Saqqara",
        texto: "Antes de la Dinastía III, los faraones eran enterrados en mastabas de adobe. Todo cambió cuando el sabio Imhotep diseñó para el rey Djoser (Zoser) la Pirámide Escalonada en Saqqara. Concebida como una escalera monumental para que el alma del rey ascendiera a las estrellas del norte, este monumento representó la primera construcción a gran escala en piedra labrada de la humanidad, dando inicio a la obsesión arquitectónica egipcia."
      },
      {
        subtitulo: "La Evolución del Ángulo Perfecto",
        texto: "El faraón Seneferu (fundador de la Dinastía IV) experimentó incansablemente con la forma piramidal. Su primer intento en Meidum colapsó parcialmente. Luego, en Dahshur, construyó la Pirámide Acodada (cuyo ángulo cambia a mitad de camino debido a fallas estructurales) y, finalmente, la Pirámide Roja, la primera pirámide de caras lisas exitosa de la historia, sentando las bases para las colosales obras de Giza."
      },
      {
        subtitulo: "La Teocracia Solar y el Declive",
        texto: "Durante la Dinastía V, el culto a Ra, el dios Sol, cobró una relevancia sin precedentes. Los faraones pasaron de construir pirámides gigantescas a levantar templos solares. Sin embargo, el excesivo gasto en monumentos y el progresivo debilitamiento del poder central frente a los gobernadores locales (nomarcas) sumieron a Egipto en el Primer Período Intermedio, poniendo fin a la gloria del Imperio Antiguo."
      }
    ]
  },
  {
    sigla: "EXP-002",
    titulo: "El Cisma de Amarna y el Faraón Rebelde",
    periodo: "c. 1353 – 1336 a.C. (Dinastía XVIII)",
    imagen: "/imagenes/6.avif",
    resumen: "La abolición del panteón tradicional de Amón en favor del monoteísmo solar de Atón, liderada por Akenatón y Nefertiti.",
    latitud: "25.7188",
    longitud: "32.6573", // Centrado en Karnak/Luxor
    detalles: [
      {
        subtitulo: "El Alzamiento de Amenhotep IV",
        texto: "En el cenit del Imperio Nuevo, el clero de Amón en Tebas ostentaba una riqueza que rivalizaba con la del trono. En su quinto año de reinado, Amenhotep IV cambió su nombre a Akenatón ('Agradable a Atón') y declaró que Atón, el disco solar físico, era el único y verdadero dios. Cerró los templos tradicionales, confiscó sus riquezas y abolió el culto a Osiris y demás deidades del panteón tradicional."
      },
      {
        subtitulo: "Akhetatón: La Ciudad de la Arena",
        texto: "Para romper por completo con Tebas, el faraón ordenó edificar una nueva capital desde cero en el desierto: Akhetatón (actual Amarna). En pocos años, miles de obreros construyeron palacios, templos abiertos al sol y avenidas monumentales. El arte egipcio sufrió una metamorfosis radical, abandonando el idealismo rígido para mostrar figuras más fluidas, orgánicas, con cráneos alargados y escenas de afecto familiar íntimo."
      },
      {
        subtitulo: "El Colapso del Sueño Monoteísta",
        texto: "La revolución descuidó las fronteras del imperio, provocando tensiones diplomáticas y pérdidas territoriales. A la muerte de Akenatón, la ciudad fue abandonada a las arenas. Su sucesor, el joven Tutankamón, fue obligado por el clero restaurado a devolver la capital a Tebas. Los faraones posteriores borraron sistemáticamente los nombres de la dinastía de Amarna de las listas reales, considerándolos reyes heréticos."
      }
    ]
  },
  {
    sigla: "EXP-003",
    titulo: "El Valle de los Reyes y las Cámaras Ocultas",
    periodo: "c. 1550 – 1069 a.C. (Imperio Nuevo)",
    imagen: "/imagenes/7.avif",
    resumen: "El abandono de las pirámides en favor de hipogeos excavados directamente en las montañas de Tebas occidental para evitar saqueos.",
    latitud: "25.7402",
    longitud: "32.6014", // Centrado en el Valle de los Reyes
    detalles: [
      {
        subtitulo: "El Cambio de Estrategia Funeraria",
        texto: "Las pirámides, al ser visibles desde kilómetros de distancia, eran blancos fáciles para los saqueadores de tumbas. Al inicio del Imperio Nuevo, los faraones decidieron ocultar sus sepulturas. Escogieron un valle desértico rodeado por acantilados de piedra caliza, coronado naturalmente por la colina de Al-Qurn, cuya forma asemeja una pirámide natural. Allí tallaron profundos túneles subterráneos diseñados para simular el inframundo (Duat)."
      },
      {
        subtitulo: "Arquitectura y Libros del Inframundo",
        texto: "Cada tumba excavada en la roca (hipogeo) seguía un trazado de pozos de drenaje, corredores descendentes y antecámaras decoradas con bajorrelieves policromados. Los muros plasmaban los textos sagrados como el Libro de los Muertos, el Libro del Amduat y el Libro de las Puertas, que servían de mapa e instrucciones mágicas para que el faraón superase los peligros de la noche y renaciera junto al Sol."
      },
      {
        subtitulo: "El Gran Descubrimiento de la KV62",
        texto: "Aunque casi todas las tumbas fueron desvalijadas en la antigüedad, una pequeña sepultura sepultada accidentalmente bajo los escombros de las cabañas de los obreros sobrevivió intacta. En noviembre de 1922, Howard Carter descubrió la tumba KV62 de Tutankamón. El hallazgo de más de 5,000 artefactos de oro, plata, alabastro y piedras semipreciosas reveló al mundo moderno el asombroso lujo que acompañaba a los gobernantes de Egipto en su viaje al más allá."
      }
    ]
  }
];

const DEFAULT_MISTERIOS = [
  {
    titulo: "La Correlación de Orión y el Mapa Estelar",
    icono: "🌌",
    resumen: "La hipótesis de Robert Bauval sobre la correspondencia exacta entre las pirámides de Giza y las estrellas del cinturón de Orión.",
    textoCompleto: "Propuesta originalmente en 1989 por el ingeniero Robert Bauval, la teoría de la correlación de Orión sostiene que la posición de las tres pirámides de la meseta de Giza no es casual, sino un reflejo terrestre exacto del Cinturón de Orión: las estrellas Alnitak, Alnilam y Mintaka. La pirámide de Keops corresponde a Alnitak, Kefrén a Alnilam y Micerino a Mintaka. Lo más desconcertante es que Micerino está ligeramente desplazada del eje y es de menor tamaño, imitando con precisión la menor luminosidad y desviación de la estrella Mintaka. Según los cálculos astronómicos de precesión solar, la alineación perfecta en el horizonte con el Río Nilo representando la Vía Láctea ocurrió exactamente en el año 10,500 a.C.",
    imagen: "/imagenes/orion-giza.jpg",
    latitud: "29.9773",
    longitud: "31.1325" // Coordenadas del Cinturón en el mapa
  },
  {
    titulo: "La Gran Pirámide y la Velocidad de la Luz",
    icono: "📐",
    resumen: "La desconcertante coincidencia geográfica con la constante física y las proporciones matemáticas de Pi y Phi.",
    textoCompleto: "La Gran Pirámide de Keops guarda relaciones matemáticas asombrosas. Si se divide el perímetro de su base por el doble de su altura, se obtiene una aproximación casi exacta al número Pi (3.14159). Además, la relación entre la apotema y la mitad de la base describe con precisión la proporción áurea o Phi (1.618). Pero el dato más impactante pertenece a la física moderna: las coordenadas geográficas de la cúspide de la Gran Pirámide son exactamente 29.9792458° N de latitud, una cifra que coincide al milímetro con la velocidad de la luz en el vacío, medida en 299,792,458 metros por segundo. ¿Un guiño de una civilización avanzada o una coincidencia cósmica?",
    imagen: "/imagenes/1.avif",
    latitud: "29.9792458",
    longitud: "31.1342"
  },
  {
    titulo: "La Sala de los Registros Bajo la Esfinge",
    icono: "🦁",
    resumen: "Las lecturas de radar y sismógrafos que revelan grandes cavidades artificiales bajo las garras de la Gran Esfinge.",
    textoCompleto: "El místico Edgar Cayce profetizó que una cámara secreta, conocida como la 'Sala de los Registros', se encontraba oculta bajo la garra derecha de la Esfinge, albergando la sabiduría y archivos de una civilización perdida antediluviana. En la década de 1990, geofísicos como Thomas Dobecki y John Anthony West realizaron análisis sísmicos y radares de penetración terrestre (GPR). Los resultados confirmaron la presencia de una cavidad rectangular artificial de 12 por 9 metros, situada a unos 8 metros por debajo de las garras de la Esfinge. Hasta el día de hoy, el acceso y excavación de esta anomalía subterránea permanecen estrictamente restringidos por las autoridades de egiptología.",
    imagen: "/imagenes/esfinge.jpg",
    latitud: "29.9753",
    longitud: "31.1376"
  },
  {
    titulo: "Acústica y Resonancia a 432 Hz",
    icono: "🔊",
    resumen: "El comportamiento sónico del sarcófago de granito negro y los misterios de las ondas en la Cámara del Rey.",
    textoCompleto: "La Cámara del Rey, en el corazón de la Gran Pirámide, está construida enteramente con bloques macizos de granito rojo traídos desde Asuán. En su interior reposa el sarcófago, tallado en una sola pieza de granito negro. Diversos investigadores de la acústica han demostrado que la cámara y el sarcófago actúan como una caja de resonancia. Al emitir tonos sostenidos, el interior vibra y amplifica las frecuencias de 432 Hz y 110 Hz. Estas frecuencias específicas están vinculadas a estados de meditación profunda y estimulación de ondas cerebrales theta. Se cree que la pirámide no era una simple tumba, sino una máquina vibracional diseñada para rituales de iniciación y amplificación sónica.",
    imagen: "/imagenes/2.avif",
    latitud: "29.9792",
    longitud: "31.1342"
  }
];

async function updateDB() {
    let connection;
    try {
        console.log("📡 Conectando a Aiven MySQL...");
        connection = await mysql.createConnection(config);
        console.log("✅ Conexión establecida.");

        // 1. Crear tabla expedientes
        console.log("🔨 Creando tabla 'expedientes'...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`expedientes\` (
              \`id\` INT AUTO_INCREMENT PRIMARY KEY,
              \`sigla\` VARCHAR(50) NOT NULL,
              \`titulo\` VARCHAR(255) NOT NULL,
              \`periodo\` VARCHAR(100) NOT NULL,
              \`imagen\` VARCHAR(500),
              \`resumen\` TEXT NOT NULL,
              \`detalles\` LONGTEXT NOT NULL,
              \`latitud\` VARCHAR(50),
              \`longitud\` VARCHAR(50)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Crear tabla misterios
        console.log("🔨 Creando tabla 'misterios'...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`misterios\` (
              \`id\` INT AUTO_INCREMENT PRIMARY KEY,
              \`titulo\` VARCHAR(255) NOT NULL,
              \`icono\` VARCHAR(50) NOT NULL,
              \`resumen\` TEXT NOT NULL,
              \`textoCompleto\` TEXT NOT NULL,
              \`imagen\` VARCHAR(500),
              \`latitud\` VARCHAR(50),
              \`longitud\` VARCHAR(50)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3. Sembrar expedientes por defecto si la tabla está vacía
        const [rowsExp] = await connection.query("SELECT COUNT(*) as count FROM \`expedientes\`");
        if (rowsExp[0].count === 0) {
            console.log("🌱 Sembrando expedientes...");
            for (const d of DEFAULT_DOSSIERS) {
                await connection.query(
                    "INSERT INTO \`expedientes\` (sigla, titulo, periodo, imagen, resumen, detalles, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [d.sigla, d.titulo, d.periodo, d.imagen, d.resumen, JSON.stringify(d.detalles), d.latitud, d.longitud]
                );
            }
        } else {
            console.log("⚠️ La tabla 'expedientes' ya tiene datos, saltando siembra.");
        }

        // 4. Sembrar misterios por defecto si la tabla está vacía
        const [rowsMis] = await connection.query("SELECT COUNT(*) as count FROM \`misterios\`");
        if (rowsMis[0].count === 0) {
            console.log("🌱 Sembrando misterios...");
            for (const m of DEFAULT_MISTERIOS) {
                await connection.query(
                    "INSERT INTO \`misterios\` (titulo, icono, resumen, textoCompleto, imagen, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [m.titulo, m.icono, m.resumen, m.textoCompleto, m.imagen, m.latitud, m.longitud]
                );
            }
        } else {
            console.log("⚠️ La tabla 'misterios' ya tiene datos, saltando siembra.");
        }

        console.log("🎉 Tablas creadas y sembradas con éxito en Aiven!");
    } catch (e) {
        console.error("❌ Error actualizando la base de datos:", e);
    } finally {
        if (connection) {
            await connection.end();
            console.log("🔌 Conexión cerrada.");
        }
    }
}

updateDB();
