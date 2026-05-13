const db = require('../db');

async function seedAtarfe() {
  const images = [
    {
      titulo: 'Captura Ovni Atarfe 1',
      url_imagen: 'atarfe/atarfe_captura_1.jpg',
      agente: 'Archivo Central',
      descripcion: 'Evidencia visual de objeto luminoso en el sector Atarfe.',
      latitud: 37.2217,
      longitud: -3.6883,
      estado: 'validado'
    },
    {
      titulo: 'Captura Ovni Atarfe 2',
      url_imagen: 'atarfe/atarfe_captura_2.jpg',
      agente: 'Archivo Central',
      descripcion: 'Par de esferas anaranjadas captadas en movimiento.',
      latitud: 37.2217,
      longitud: -3.6883,
      estado: 'validado'
    },
    {
      titulo: 'Captura Ovni Atarfe 3',
      url_imagen: 'atarfe/atarfe_captura_3.jpg',
      agente: 'Archivo Central',
      descripcion: 'Esfera blanca con halo energético.',
      latitud: 37.2217,
      longitud: -3.6883,
      estado: 'validado'
    },
    {
      titulo: 'Captura Ovni Atarfe 4',
      url_imagen: 'atarfe/atarfe_captura_4.jpg',
      agente: 'Archivo Central',
      descripcion: 'Detalle de objeto discoidal luminoso.',
      latitud: 37.2217,
      longitud: -3.6883,
      estado: 'validado'
    },
    {
      titulo: 'Captura Ovni Atarfe 5',
      url_imagen: 'atarfe/atarfe_captura_5.jpg',
      agente: 'Archivo Central',
      descripcion: 'Registro de trayectoria errática sobre Atarfe.',
      latitud: 37.2217,
      longitud: -3.6883,
      estado: 'validado'
    }
  ];

  for (const img of images) {
    try {
      await db.query(
        'INSERT INTO imagenes (titulo, url_imagen, agente, descripcion, latitud, longitud, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [img.titulo, img.url_imagen, img.agente, img.descripcion, img.latitud, img.longitud, img.estado]
      );
      console.log(`✅ ${img.titulo} registrada.`);
    } catch (err) {
      console.error(`❌ Error al registrar ${img.titulo}:`, err);
    }
  }
  process.exit();
}

seedAtarfe();
