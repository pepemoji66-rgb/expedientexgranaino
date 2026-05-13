const { GoogleGenerativeAI } = require("@google/generative-ai");

// Prueba directa del núcleo del Archivero
async function probarIA() {
    const apiKey = "AIzaSyC6J1Spu8DVoIryGNKnRcUcsYK1vR1FND0";
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    console.log("📡 INICIANDO CONEXIÓN POR PUERTA DE ATRÁS (HTTP DIRECTO)...");
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hola" }] }]
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log("✅ ¡CONEXIÓN ESTABLECIDA!");
            console.log("🤖 RESPUESTA:", data.candidates[0].content.parts[0].text);
        } else {
            console.error("❌ ERROR DE GOOGLE:", data.error ? data.error.message : JSON.stringify(data));
        }
    } catch (err) {
        console.error("❌ ERROR DE RED:", err.message);
    }
}

probarIA();
