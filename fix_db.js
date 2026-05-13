const db = require('./db');
const fs = require('fs');
const bcrypt = require('bcryptjs');

async function fix() {
    if (!fs.existsSync('backup_data.json')) {
        console.error("❌ No backup_data.json found.");
        return;
    }

    const backup = JSON.parse(fs.readFileSync('backup_data.json', 'utf8'));

    for (const table in backup) {
        try {
            const countRes = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
            const count = countRes[0].count;

            if (count === 0 && backup[table].length > 0) {
                console.log(`📦 Table ${table} is empty. Restoring ${backup[table].length} records...`);
                for (const row of backup[table]) {
                    // Normalize statuses
                    if (row.estado === 'validado' || row.estado === 'aprobado') {
                        if (table === 'imagenes') row.estado = 'publica'; // Galeria uses 'publica'
                        else row.estado = 'aprobado';
                    }

                    // Hash passwords if needed
                    if (table === 'usuarios' && row.password && row.password.length < 20) {
                        const salt = await bcrypt.genSalt(10);
                        row.password = await bcrypt.hash(row.password, salt);
                    }

                    const keys = Object.keys(row);
                    const values = Object.values(row);
                    const placeholders = keys.map(() => '?').join(', ');
                    const columns = keys.map(k => `"${k}"`).join(', ');

                    await db.execute(`INSERT INTO "${table}" (${columns}) VALUES (${placeholders})`, values);
                }
            } else {
                console.log(`✅ Table ${table} already has ${count} records. Normalizing statuses...`);
                if (table === 'imagenes') {
                    await db.execute("UPDATE imagenes SET estado = 'publica' WHERE estado = 'aprobado' OR estado = 'validado'");
                }
                if (table === 'noticias') {
                    await db.execute("UPDATE noticias SET estado = 'aprobado' WHERE estado = 'publica'");
                }
            }
        } catch (e) {
            console.error(`⚠️ Error in table ${table}:`, e.message);
        }
    }
    console.log("🚀 Repair protocol completed.");
}

fix().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
