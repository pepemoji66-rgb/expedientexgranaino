const axios = require('axios');

async function testMeta() {
    try {
        console.log("📡 SOLICITANDO METADATOS DE NOTICIAS...");
        const res = await axios.get("https://expedientexgranaino-1.onrender.com/noticias?v=1", {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1'
            }
        });
        console.log(`STATUS: ${res.status}`);
        const html = res.data;
        const metaRegex = /<meta[^>]+>/g;
        const titleRegex = /<title>[^<]+<\/title>/;
        
        const titleMatch = html.match(titleRegex);
        if (titleMatch) {
            console.log(`TITULO: ${titleMatch[0]}`);
        }
        
        console.log("\nTAGS DE META DETECTADAS:");
        let match;
        while ((match = metaRegex.exec(html)) !== null) {
            const content = match[0];
            if (content.includes('og:') || content.includes('twitter:') || content.includes('description')) {
                console.log(content);
            }
        }
    } catch (err) {
        console.error("❌ ERROR AL CONECTAR:", err.message);
    }
}

testMeta();
