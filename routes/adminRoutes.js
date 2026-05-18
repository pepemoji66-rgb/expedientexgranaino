const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

module.exports = (db) => {

  // --- CONFIGURACIÓN DE ALMACENAMIENTO HÍBRIDO ---
  const storageLocal = multer.diskStorage({
    destination: (req, file, cb) => {
      let folder = 'uploads/';
      if (file.mimetype.includes('video')) folder += 'videos/';
      else if (file.mimetype.includes('audio')) folder += 'audios/';
      else if (file.mimetype.includes('image')) folder += 'imagenes/';
      else folder += 'archivos/';
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });

  const storageCloud = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: 'admin_uploads',
        resource_type: file.mimetype.includes('audio') ? 'video' : 'auto',
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        format: file.mimetype.includes('audio') ? 'mp3' : undefined
    })
  });

  const upload = multer({ 
    storage: (process.env.CLOUDINARY_API_KEY) ? storageCloud : storageLocal,
    limits: { fileSize: 100 * 1024 * 1024 }
  });

  // --- RUTA DE CARGA PARA EL ADMIN ---
  router.post('/admin/upload', upload.single('archivo'), async (req, res) => {
    const { tipo, titulo, contenido, url_externa, latitud, longitud } = req.body;
    
    if (!req.file && tipo !== 'expedientes' && !url_externa) {
      return res.status(400).send({ message: '⚠️ No se ha recibido ningún archivo ni URL.' });
    }

    // Usamos path (URL completa de Cloudinary) o filename (nombre local) o url externa
    let nombreArchivo = req.file ? (req.file.path || req.file.filename) : (url_externa || null);

    // PARCHE CLOUDINARY: para audios, si la URL no tiene extensión, añadirla
    // Cloudinary devuelve URLs sin .mp3 para archivos de audio, el browser no puede reproducirlos
    if (req.file && nombreArchivo && nombreArchivo.includes('cloudinary.com') && tipo === 'audios') {
        const ext = path.extname(req.file.originalname).toLowerCase() || '.mp3';
        if (!nombreArchivo.includes('.mp3') && !nombreArchivo.includes('.wav') && !nombreArchivo.includes('.ogg')) {
            nombreArchivo = nombreArchivo + ext;
        }
    }

    // Mapeo inteligente de columnas según tu DB de Aiven
    let sql = "";
    let params = [];

    if (tipo === 'videos') {
      sql = "INSERT INTO videos (titulo, url, estado, fecha) VALUES (?, ?, 'aprobado', NOW())";
      params = [titulo, nombreArchivo];
    } else if (tipo === 'audios') {
      const { imagen_url } = req.body;
      sql = "INSERT INTO audios (titulo, ruta, aprobado, fecha_subida, imagen_url) VALUES (?, ?, 1, NOW(), ?)";
      params = [titulo, nombreArchivo, imagen_url || null];
    } else if (tipo === 'noticias') {
      const { fuente_url, contenido, latitud, longitud, ubicacion, nivel_alerta } = req.body;
      sql = "INSERT INTO noticias (titulo, cuerpo, imagen_url, estado, fecha, fuente_url, latitud, longitud, ubicacion, nivel_alerta) VALUES (?, ?, ?, 'aprobado', NOW(), ?, ?, ?, ?, ?)";
      params = [titulo, contenido || '', nombreArchivo, fuente_url || '', latitud || 0, longitud || 0, ubicacion || '', nivel_alerta || 'Bajo'];
    } else if (tipo === 'imagenes') {
      const es_atarfe = req.body.es_atarfe || 0;
      sql = "INSERT INTO imagenes (titulo, url_imagen, estado, es_atarfe, fecha) VALUES (?, ?, 'publica', ?, NOW())";
      params = [titulo, nombreArchivo, es_atarfe];
    } else if (tipo === 'lugares') {
      sql = "INSERT INTO lugares (nombre, descripcion, imagen_url, latitud, longitud, estado, fecha) VALUES (?, ?, ?, ?, ?, 'aprobado', NOW())";
      params = [titulo, 'Registro desde Panel de Mando', nombreArchivo, latitud || 0, longitud || 0];
    } else if (tipo === 'expedientes') {
      const tipo_relato = req.body.tipo_relato || 'jefe';
      sql = "INSERT INTO expedientes (titulo, contenido, usuario_nombre, estado, tipo, imagen_url, latitud, longitud, fecha) VALUES (?, ?, ?, 'aprobado', ?, ?, ?, ?, NOW())";
      params = [titulo, contenido, (tipo_relato === 'jefe' ? 'ADMINISTRADOR' : 'AGENTE'), tipo_relato, nombreArchivo, latitud || 0, longitud || 0];
    }

    if (!sql) {
      return res.status(400).send({ message: '❌ Sector del búnker no válido.' });
    }

    try {
      await db.execute(sql, params);
      res.send({
        message: '¡Archivo clasificado y guardado!',
        ruta: nombreArchivo
      });
    } catch (err) {
      console.error("❌ Error en DB al subir:", err);
      return res.status(500).send({ message: 'Error al registrar en el búnker.' });
    }
  });

  return router;
};