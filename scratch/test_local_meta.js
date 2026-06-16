const axios = require('axios');

async function testLocal() {
    try {
        console.log("📡 SOLICITANDO METADATOS LOCALES...");
        const res = await axios.get("http://localhost:10000/misterios-historicos", {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1'
            }
        });
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

testLocal();
