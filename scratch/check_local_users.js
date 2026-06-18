const { createClient } = require('@libsql/client');

async function checkUsers() {
    const client = createClient({ url: 'file:local.db' });
    try {
        const result = await client.execute("SELECT nombre, email, aprobado, rol FROM usuarios");
        console.table(result.rows);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkUsers();
