const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

module.exports = (db, enviarAlertaTelegram) => {

    // =====================================================
    //  📡 MÓDULO DE PUBLICACIÓN EN REDES SOCIALES
    //  Expediente X Granaíno — Búnker Social v1.0
    // =====================================================
    //
    //  Soporta 3 métodos (en orden de prioridad):
    //  1. API Directa de Twitter/X (OAuth 1.0a)
    //  2. API Directa de Facebook (Graph API)
    //  3. Webhook genérico (Make/Zapier)
    //
    //  Si no hay claves configuradas, devuelve un mensaje
    //  indicando qué falta, sin reventar nada.
    // =====================================================

    // --- UTILIDADES OAUTH 1.0a PARA TWITTER ---
    // Twitter requiere firmas OAuth 1.0a para cada petición.
    // Implementamos la firma aquí para no depender de librerías externas.

    const generarNonce = () => {
        return crypto.randomBytes(16).toString('hex');
    };

    const generarTimestamp = () => {
        return Math.floor(Date.now() / 1000).toString();
    };

    const codificarRFC3986 = (str) => {
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/\*/g, '%2A')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29');
    };

    const firmarOAuth = (method, url, params, consumerSecret, tokenSecret) => {
        // Ordenar parámetros alfabéticamente
        const sortedKeys = Object.keys(params).sort();
        const paramString = sortedKeys.map(k => `${codificarRFC3986(k)}=${codificarRFC3986(params[k])}`).join('&');
        
        // Crear la base string
        const baseString = `${method.toUpperCase()}&${codificarRFC3986(url)}&${codificarRFC3986(paramString)}`;
        
        // Crear la signing key
        const signingKey = `${codificarRFC3986(consumerSecret)}&${codificarRFC3986(tokenSecret)}`;
        
        // HMAC-SHA1
        return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
    };

    const construirCabeceraOAuth = (url, method, bodyParams, apiKey, apiSecret, accessToken, accessSecret) => {
        const oauthParams = {
            oauth_consumer_key: apiKey,
            oauth_nonce: generarNonce(),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: generarTimestamp(),
            oauth_token: accessToken,
            oauth_version: '1.0'
        };

        // Combinar con los parámetros del body para la firma
        const allParams = { ...oauthParams, ...bodyParams };
        
        // Firmar
        const signature = firmarOAuth(method, url, allParams, apiSecret, accessSecret);
        oauthParams.oauth_signature = signature;

        // Construir la cabecera Authorization
        const headerParts = Object.keys(oauthParams)
            .sort()
            .map(k => `${codificarRFC3986(k)}="${codificarRFC3986(oauthParams[k])}"`)
            .join(', ');
        
        return `OAuth ${headerParts}`;
    };


    // --- FUNCIÓN: PUBLICAR EN TWITTER/X ---
    const publicarEnTwitter = async (texto) => {
        const apiKey = process.env.TWITTER_API_KEY;
        const apiSecret = process.env.TWITTER_API_SECRET;
        const accessToken = process.env.TWITTER_ACCESS_TOKEN;
        const accessSecret = process.env.TWITTER_ACCESS_SECRET;

        if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
            return { 
                plataforma: 'twitter', 
                exito: false, 
                error: 'CLAVES NO CONFIGURADAS. Añade TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN y TWITTER_ACCESS_SECRET en tu archivo .env' 
            };
        }

        try {
            // Twitter API v2 - Crear Tweet
            const url = 'https://api.twitter.com/2/tweets';
            const bodyParams = {};
            const authHeader = construirCabeceraOAuth(url, 'POST', bodyParams, apiKey, apiSecret, accessToken, accessSecret);

            const response = await axios.post(url, 
                { text: texto },
                {
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            console.log('🐦 TWITTER: Publicación exitosa ->', response.data);
            return { 
                plataforma: 'twitter', 
                exito: true, 
                id_publicacion: response.data?.data?.id,
                mensaje: 'Publicado en Twitter/X correctamente'
            };
        } catch (err) {
            console.error('❌ TWITTER ERROR:', err.response?.data || err.message);
            return { 
                plataforma: 'twitter', 
                exito: false, 
                error: err.response?.data?.detail || err.response?.data?.errors?.[0]?.message || err.message 
            };
        }
    };


    // --- FUNCIÓN: PUBLICAR EN FACEBOOK ---
    const publicarEnFacebook = async (texto, enlaceImagen) => {
        const pageId = process.env.FACEBOOK_PAGE_ID;
        const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

        if (!pageId || !accessToken) {
            return { 
                plataforma: 'facebook', 
                exito: false, 
                error: 'CLAVES NO CONFIGURADAS. Añade FACEBOOK_PAGE_ID y FACEBOOK_ACCESS_TOKEN en tu archivo .env' 
            };
        }

        try {
            // Facebook Graph API - Publicar en la página
            const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
            
            const postData = {
                message: texto,
                access_token: accessToken
            };

            // Si hay imagen, la adjuntamos como enlace
            if (enlaceImagen && enlaceImagen.startsWith('http')) {
                postData.link = enlaceImagen;
            }

            const response = await axios.post(url, postData, { timeout: 15000 });

            console.log('📘 FACEBOOK: Publicación exitosa ->', response.data);
            return { 
                plataforma: 'facebook', 
                exito: true, 
                id_publicacion: response.data?.id,
                mensaje: 'Publicado en Facebook correctamente'
            };
        } catch (err) {
            console.error('❌ FACEBOOK ERROR:', err.response?.data || err.message);
            return { 
                plataforma: 'facebook', 
                exito: false, 
                error: err.response?.data?.error?.message || err.message 
            };
        }
    };


    // --- FUNCIÓN: WEBHOOK GENÉRICO (MAKE / ZAPIER) ---
    const publicarViaWebhook = async (datos) => {
        const webhookUrl = process.env.SOCIAL_WEBHOOK_URL;

        if (!webhookUrl) {
            return { 
                plataforma: 'webhook', 
                exito: false, 
                error: 'WEBHOOK NO CONFIGURADO. Añade SOCIAL_WEBHOOK_URL en tu archivo .env (URL de Make.com o Zapier)' 
            };
        }

        try {
            const response = await axios.post(webhookUrl, {
                titulo: datos.titulo,
                contenido: datos.contenido,
                url: datos.url,
                imagen_url: datos.imagen_url,
                plataformas: datos.plataformas,
                fecha: new Date().toISOString(),
                origen: 'ExpedienteX Búnker'
            }, { timeout: 15000 });

            console.log('🔗 WEBHOOK: Datos enviados correctamente ->', response.status);
            return { 
                plataforma: 'webhook', 
                exito: true, 
                mensaje: 'Datos enviados al webhook (Make/Zapier) correctamente'
            };
        } catch (err) {
            console.error('❌ WEBHOOK ERROR:', err.message);
            return { 
                plataforma: 'webhook', 
                exito: false, 
                error: err.message 
            };
        }
    };


    // --- FUNCIÓN: CONSTRUIR TEXTO DE PUBLICACIÓN ---
    const construirTextoPublicacion = (titulo, contenido, url) => {
        // Recortamos el contenido para que quepa en Twitter (280 chars max)
        const tituloLimpio = (titulo || 'Nuevo Expediente').toUpperCase();
        const enlace = url || 'https://expedientexgranaino.com';
        
        // Hashtags fijos del búnker
        const hashtags = '#Granada #Misterio #ExpedienteX #OVNI #Paranormal';
        
        // Calculamos el espacio disponible para el contenido
        // Título + saltos + enlace + hashtags
        const partesFijas = `🛸 ${tituloLimpio}\n\n\n\n🔗 ${enlace}\n\n${hashtags}`;
        const espacioDisponible = 280 - partesFijas.length;
        
        let resumenContenido = '';
        if (contenido && espacioDisponible > 20) {
            resumenContenido = contenido.substring(0, espacioDisponible - 3) + '...';
        }
        
        // Texto para Twitter (máx 280)
        const textoTwitter = `🛸 ${tituloLimpio}\n\n${resumenContenido}\n\n🔗 ${enlace}\n\n${hashtags}`;
        
        // Texto para Facebook (sin límite real, más extenso)
        const textoFacebook = `🛸 ${tituloLimpio}\n\n${contenido || ''}\n\n🔗 Lee el expediente completo: ${enlace}\n\n${hashtags} #ExpedienteXGranaino`;
        
        return { textoTwitter, textoFacebook };
    };


    // =====================================================
    //  ENDPOINT PRINCIPAL: POST /api/social/publicar
    // =====================================================
    router.post('/publicar', async (req, res) => {
        const { titulo, contenido, url, imagen_url, plataformas, tipo } = req.body;

        if (!titulo) {
            return res.status(400).json({ 
                error: 'Falta el título del contenido a publicar.' 
            });
        }

        // Construir la URL pública del contenido
        const urlBase = process.env.SITE_URL || 'https://expedientexgranaino.com';
        const urlFinal = url || urlBase;

        // Construir los textos
        const { textoTwitter, textoFacebook } = construirTextoPublicacion(titulo, contenido, urlFinal);

        // Determinar qué plataformas publicar
        const plataformasActivas = plataformas || ['twitter', 'facebook'];
        const resultados = [];

        console.log(`📡 BÚNKER SOCIAL: Iniciando transmisión a ${plataformasActivas.join(', ')}...`);

        // Verificar si hay webhook configurado (prioridad si no hay APIs directas)
        const hayWebhook = !!process.env.SOCIAL_WEBHOOK_URL;
        const hayTwitterDirecto = !!(process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET && process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_SECRET);
        const hayFacebookDirecto = !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_ACCESS_TOKEN);

        // --- PUBLICAR EN TWITTER ---
        if (plataformasActivas.includes('twitter')) {
            if (hayTwitterDirecto) {
                const resultado = await publicarEnTwitter(textoTwitter);
                resultados.push(resultado);
            } else if (hayWebhook) {
                // Se publicará vía webhook (junto con Facebook si aplica)
                console.log('🐦 Twitter: Sin claves directas, se usará webhook.');
            } else {
                resultados.push({ 
                    plataforma: 'twitter', 
                    exito: false, 
                    error: 'Sin claves API de Twitter ni webhook configurado. Añade las variables en .env.' 
                });
            }
        }

        // --- PUBLICAR EN FACEBOOK ---
        if (plataformasActivas.includes('facebook')) {
            if (hayFacebookDirecto) {
                const resultado = await publicarEnFacebook(textoFacebook, imagen_url);
                resultados.push(resultado);
            } else if (hayWebhook) {
                console.log('📘 Facebook: Sin claves directas, se usará webhook.');
            } else {
                resultados.push({ 
                    plataforma: 'facebook', 
                    exito: false, 
                    error: 'Sin claves API de Facebook ni webhook configurado. Añade las variables en .env.' 
                });
            }
        }

        // --- WEBHOOK COMO FALLBACK (si hay plataformas sin API directa) ---
        if (hayWebhook) {
            const plataformasSinApi = [];
            if (plataformasActivas.includes('twitter') && !hayTwitterDirecto) plataformasSinApi.push('twitter');
            if (plataformasActivas.includes('facebook') && !hayFacebookDirecto) plataformasSinApi.push('facebook');

            if (plataformasSinApi.length > 0) {
                const resultado = await publicarViaWebhook({
                    titulo,
                    contenido: contenido || '',
                    url: urlFinal,
                    imagen_url: imagen_url || '',
                    plataformas: plataformasSinApi
                });
                resultados.push(resultado);
            }
        }

        // --- RESUMEN DE RESULTADOS ---
        const exitosas = resultados.filter(r => r.exito);
        const fallidas = resultados.filter(r => !r.exito);

        // Notificación Telegram con el resumen
        if (exitosas.length > 0) {
            const plataformasOk = exitosas.map(r => r.plataforma).join(', ');
            enviarAlertaTelegram(`📡 PUBLICACIÓN EN REDES:\n📄 "${titulo}"\n✅ Publicado en: ${plataformasOk}\n🔗 ${urlFinal}`);
        }

        if (fallidas.length > 0 && exitosas.length === 0) {
            enviarAlertaTelegram(`⚠️ FALLO EN REDES SOCIALES:\n📄 "${titulo}"\n❌ Ninguna plataforma pudo publicar.\nRevisa las claves en .env`);
        }

        // Log en consola
        console.log(`📡 RESULTADO SOCIAL: ${exitosas.length} éxitos, ${fallidas.length} fallos`);

        res.json({
            mensaje: exitosas.length > 0 
                ? `✅ Publicado en ${exitosas.length} plataforma(s)` 
                : '⚠️ No se pudo publicar en ninguna plataforma. Configura las claves en .env',
            resultados,
            exitosas: exitosas.length,
            fallidas: fallidas.length
        });
    });


    // =====================================================
    //  ENDPOINT: GET /api/social/estado
    //  Devuelve qué plataformas están configuradas
    // =====================================================
    router.get('/estado', (req, res) => {
        res.json({
            twitter: {
                configurado: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN),
                metodo: 'API Directa (OAuth 1.0a)'
            },
            facebook: {
                configurado: !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_ACCESS_TOKEN),
                metodo: 'API Directa (Graph API)'
            },
            webhook: {
                configurado: !!process.env.SOCIAL_WEBHOOK_URL,
                metodo: 'Webhook (Make/Zapier)'
            },
            alguno_activo: !!(
                process.env.TWITTER_API_KEY || 
                process.env.FACEBOOK_PAGE_ID || 
                process.env.SOCIAL_WEBHOOK_URL
            )
        });
    });


    return router;
};
