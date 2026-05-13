const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyC6J1Spu8DVoIryGNKnRcUcsYK1vR1FND0");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
model.generateContent("Hola").then(res => console.log("IA RESPONDE:", res.response.text())).catch(err => console.error("FALLO IA:", err.message));
