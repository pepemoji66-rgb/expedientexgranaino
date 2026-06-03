const fs = require('fs');
const axios = require('axios');

const token = '8637045537:AAHf8VTr4CCgyqqXTf3V9oR0v64otAmG2SA';
const chatId = '5638288859';

async function finalizeSetup() {
    try {
        // Actualizar .env
        let env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
        
        if (!env.includes('TELEGRAM_TOKEN')) {
            env += `\nTELEGRAM_TOKEN=${token}`;
        } else {
            env = env.replace(/TELEGRAM_TOKEN=.*/, `TELEGRAM_TOKEN=${token}`);
        }
        
        if (!env.includes('TELEGRAM_CHAT_ID')) {
            env += `\nTELEGRAM_CHAT_ID=${chatId}`;
        } else {
            env = env.replace(/TELEGRAM_CHAT_ID=.*/, `TELEGRAM_CHAT_ID=${chatId}`);
        }
        
        fs.writeFileSync('.env', env);
        console.log('✅ Archivo .env actualizado con éxito.');

        // Enviar mensaje de prueba
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: '🛰️ BÚNKER ALERTA: Conexión táctica establecida, Agente Pepe. El sistema le avisará de cualquier actividad en el sector. ¡El Búnker está en su bolsillo! 🛡️🛸'
        });
        console.log('✅ Mensaje de prueba enviado a Telegram.');
        
    } catch (err) {
        console.error('❌ Error finalizando el setup:', err.message);
    }
}

finalizeSetup();
