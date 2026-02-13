// Configuración de Multer para las 4 secciones
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'public/uploads/';
    if (file.mimetype.includes('video')) folder += 'videos/';
    else if (file.mimetype.includes('audio')) folder += 'audios/';
    else if (file.mimetype.includes('image')) folder += 'imagenes/';
    else folder += 'documentos/';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Ruta para que el Admin suba cualquier cosa
app.post('/admin/upload', upload.single('archivo'), (req, res) => {
  const { tipo, titulo } = req.body;
  const ruta = req.file.filename;

  // Insertar en la tabla correspondiente según el "tipo"
  const sql = `INSERT INTO ${tipo} (titulo, ruta) VALUES (?, ?)`;
  db.query(sql, [titulo, ruta], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: '¡Archivo subido al búnker!', ruta });
  });
});