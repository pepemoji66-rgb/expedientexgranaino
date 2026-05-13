const fs = require('fs');
const { createClient } = require('@libsql/client');

async function updateBackup() {
    const client = createClient({ url: 'file:local.db' });
    try {
        // Obtener todos los usuarios actuales del local.db (que ya tiene los de Turso)
        const result = await client.execute("SELECT * FROM usuarios");
        const usuarios = result.rows;

        // Leer backup actual
        const backup = JSON.parse(fs.readFileSync('backup_data.json', 'utf8'));
        
        // Actualizar la sección de usuarios
        backup.usuarios = usuarios;

        // Guardar de nuevo
        fs.writeFileSync('backup_data.json', JSON.stringify(backup, null, 2));
        console.log(`✅ backup_data.json actualizado con ${usuarios.length} usuarios.`);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

updateBackup();
