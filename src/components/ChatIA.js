import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './chatia.css';

const ChatIA = () => {
    const [mensajes, setMensajes] = useState([
        { 
            rol: 'ia', 
            texto: 'SISTEMA ONLINE. Soy el Archivero del Búnker. El radar externo está inestable, pero mis archivos locales están activos. ¿Qué quieres saber, hermano?',
            fecha: new Date().toLocaleTimeString() 
        }
    ]);
    const [entrada, setEntrada] = useState('');
    const [cargando, setCargando] = useState(false);
    const finMensajesRef = useRef(null);

    const scrollToBottom = () => {
        finMensajesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    const enviarPregunta = async (e) => {
        e.preventDefault();
        if (!entrada.trim()) return;

        const miPregunta = entrada;
        const horaActual = new Date().toLocaleTimeString();
        
        setEntrada('');
        setMensajes(prev => [...prev, { rol: 'usuario', texto: miPregunta, fecha: horaActual }]);
        setCargando(true);

        try {
            // Conectamos con el puerto 5000 del servidor
            const res = await axios.post('http://localhost:5000/chat-ia', {
                pregunta: miPregunta
            });

            // Si el servidor responde (sea la IA real o el modo local)
            setMensajes(prev => [...prev, { 
                rol: 'ia', 
                texto: res.data.respuesta, 
                fecha: new Date().toLocaleTimeString() 
            }]);
        } catch (err) {
            console.error("Error en la comunicación con el Búnker:", err);
            setMensajes(prev => [...prev, { 
                rol: 'ia', 
                texto: '❌ ERROR DE CONEXIÓN: El núcleo del servidor no responde. Revisa la terminal, hermano.',
                fecha: new Date().toLocaleTimeString() 
            }]);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="chat-container fade-in">
            <div className="chat-header">
                <div className={`status-dot ${cargando ? 'pulsing' : ''}`}></div>
                <h2>ARCHIVERO DEL BÚNKER (Protocolo de Emergencia)</h2>
            </div>
            <div className="chat-window">
                {mensajes.map((m, index) => (
                    <div key={index} className={`mensaje-wrapper ${m.rol}`}>
                        <div className="avatar">{m.rol === 'ia' ? '📜' : '👤'}</div>
                        <div className="mensaje-contenido">
                            <div className="mensaje-texto">{m.texto}</div>
                            <span className="mensaje-fecha">{m.fecha}</span>
                        </div>
                    </div>
                ))}
                {cargando && (
                    <div className="mensaje-wrapper ia">
                        <div className="avatar">⌛</div>
                        <div className="mensaje-contenido">
                            <div className="pensando">Consultando legajos antiguos...</div>
                        </div>
                    </div>
                )}
                <div ref={finMensajesRef} />
            </div>
            <form className="chat-input-area" onSubmit={enviarPregunta}>
                <input 
                    type="text" 
                    placeholder="Escribe tu duda, hermano..."
                    value={entrada} 
                    onChange={(e) => setEntrada(e.target.value)} 
                    disabled={cargando}
                />
                <button type="submit" disabled={cargando}>
                    {cargando ? '...' : 'ENVIAR'}
                </button>
            </form>
        </div>
    );
};

export default ChatIA;