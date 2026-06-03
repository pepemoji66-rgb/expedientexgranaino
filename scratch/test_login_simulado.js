const db = require('../db');
const bcrypt = require('bcryptjs');

async function testLogin(email, password) {
    console.log(`🔑 PROBANDO ACCESO PARA: ${email}`);
    try {
        const results = await db.query("SELECT * FROM usuarios WHERE email = ? OR nombre = ?", [email, email]);
        
        if (results.length > 0) {
            const user = results[0];
            console.log("✅ Usuario encontrado:", user.nombre);
            
            console.log("⏳ Comparando contraseñas...");
            // Aquí suele estar el fallo si la contraseña guardada no es un hash válido
            const match = await bcrypt.compare(password, user.password);
            console.log("❓ Resultado match:", match);
            
            if (match) {
                console.log("🔓 ACCESO CONCEDIDO");
            } else {
                console.log("❌ CONTRASEÑA INCORRECTA");
            }
        } else {
            console.log("❌ AGENTE NO ENCONTRADO");
        }
    } catch (err) {
        console.error("💥 FALLO CRÍTICO EN EL PROCESO:", err.stack);
    } finally {
        process.exit();
    }
}

// Vamos a probar con el último usuario registrado (el id 64)
// OJO: No sabemos su contraseña real, así que esto fallará el match,
// pero lo que nos importa es ver si el servidor EXPLOTA (Error 500) o simplemente dice "Incorrecto".
testLogin('moreno-56@hotmail.com', 'cualquier_cosa');
