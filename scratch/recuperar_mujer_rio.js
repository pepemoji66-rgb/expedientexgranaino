const db = require('../db');

const titulo = 'LA MUJER DEL RIO';
const contenido = `Esta es una historia que me contó alguien muy cercano y de total confianza. Recalco esto para asegurar que estos relatos que intento dar a conocer son reales o, al menos, las personas que los cuentan los dan por ciertos. Pueden tener explicación o no, pero ellos afirman que pasó de verdad y no hay por qué dudar. Me gustaría que esta sección fuera creciendo con historias de personas cercanas, sin descartar que se puedan escribir relatos de ficción, siempre que se haga saber.

Eran sobre las doce de la mañana cuando una mujer se dirigía al río a llevarle el almuerzo a su padre. El hombre estaba sembrando patatas y ella le llevaba, como se decía en el argot de entonces, «la merienda».

Bajaba por una cuesta pronunciada que iba hacia el río cuando, desde lo alto, pudo distinguir a su padre trabajando duramente, agachado. Al mismo tiempo, observó a una anciana que estaba a su lado, observándole con detenimiento. Como estaba lejos, no podía distinguir quién era con total claridad, aunque la figura le resultaba muy familiar. Parecía su abuela, la madre de su padre, pero aquello era totalmente imposible: la mujer había fallecido al menos un año antes.

Cuando llegó abajo, al lado de su padre, le entregó la merienda y le preguntó:

—Padre, ¿quién era la mujer que estaba aquí hace un rato contigo, mirando cómo trabajabas?

El padre la miró extrañado y le dijo que allí no había habido nadie; le preguntó si le pasaba algo o si estaba bromeando.

—No, no bromeo —respondió ella con firmeza—. Estoy segura de que la abuela estaba aquí contigo hace diez minutos. La he visto y sé que era ella.

FIN`;

const sql = 'INSERT INTO expedientes (titulo, contenido, usuario_nombre, latitud, longitud, estado, tipo, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

db.query(sql, [titulo, contenido, 'Pepe', 0, 0, 'aprobado', 'jefe', new Date().toISOString().slice(0, 19).replace('T', ' ')])
    .then(() => {
        console.log('✅ EXPEDIENTE ARCHIVADO: LA MUJER DEL RIO');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ ERROR AL ARCHIVAR:', err);
        process.exit(1);
    });
