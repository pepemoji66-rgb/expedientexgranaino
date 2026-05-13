const db = require('../db');

async function updateVideoTitles() {
  try {
    await db.query("UPDATE videos SET titulo = 'Incidente Atarfe - Registro Audio' WHERE url = '1.mp4'");
    await db.query("UPDATE videos SET titulo = 'Avistamiento Dual - Fase 2' WHERE url IN ('2.mp4', '3.mp4', '4.mp4')");
    console.log('✅ Títulos de vídeos actualizados.');
  } catch (err) {
    console.error('❌ Error al actualizar títulos:', err);
  }
  process.exit();
}

updateVideoTitles();
