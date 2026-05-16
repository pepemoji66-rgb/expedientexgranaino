import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import './chat.css';
import { API_BASE_URL, ADMIN_EMAIL } from '../config';

const Chat = ({ usuarioActivo }) => {
    const { t, language } = useLanguage();
    const [mensaje, setMensaje] = useState('');
    const [historial, setHistorial] = useState([]);
    const [conectado, setConectado] = useState(false);
    const socketRef = useRef();
    const scrollRef = useRef();

    const esAdmin = usuarioActivo?.email === ADMIN_EMAIL || usuarioActivo?.rol === 'admin';

    // Usamos useCallback para que la función sea estable
    const cargarHistorial = useCallback(() => {
        fetch(`${API_BASE_URL}/api/chat-historial`)
            .then(res => {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    return res.json();
                } else {
                    throw new TypeError("Oops, no hemos recibido JSON del búnker");
                }
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setHistorial(data);
                } else {
                    setHistorial([]);
                }
            })
            .catch(err => {
                console.error("❌ Error en la frecuencia del chat:", err);
                setHistorial([]);
            });
    }, []);

    useEffect(() => {
        // Inicializamos la conexión Socket.io usando la URL base centralizada
        socketRef.current = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            secure: true
        });

        // Eventos de conexión
        socketRef.current.on('connect', () => {
            console.log("📡 EN LÍNEA CON EL BÚNKER");
            setConectado(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log("⚠️ SEÑAL PERDIDA");
            setConectado(false);
        });

        cargarHistorial();

        // Escuchar nuevos mensajes
        socketRef.current.on('recibir_mensaje', (nuevoMsg) => {
            setHistorial((prev) => {
                const updated = [...prev, nuevoMsg];
                return updated.slice(-100); // Mantenemos solo los últimos 100 en la vista
            });
        });

        // Escuchar orden de limpieza
        socketRef.current.on('chat_limpiado', () => {
            setHistorial([]);
        });

        // Limpieza al salir
        return () => {
            if (socketRef.current) {
                socketRef.current.off('connect');
                socketRef.current.off('disconnect');
                socketRef.current.off('recibir_mensaje');
                socketRef.current.off('chat_limpiado');
                socketRef.current.disconnect();
            }
        };
    }, [API_BASE_URL, cargarHistorial]); // Dependencias estables

    useEffect(() => {
        // Auto-scroll táctico
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [historial]);

    const manejarEnvio = (e) => {
        e.preventDefault();
        if (!mensaje.trim()) return;

        const dataPayload = {
            nombre_usuario: esAdmin ? 'ADMINISTRADOR' : (usuarioActivo?.nombre || 'Invitado'),
            mensaje: mensaje,
            rol_usuario: esAdmin ? 'admin' : 'usuario',
            tipo: 'publico',
            destinatario: null,
            fecha: new Date()
        };

        // Emitir mensaje por la frecuencia
        socketRef.current.emit('enviar_mensaje', dataPayload);
        setMensaje('');
    };

    const limpiarChatTotal = () => {
        if (window.confirm("⚠️ ¿ORDENAR BORRADO TOTAL DE LA FRECUENCIA?")) {
            socketRef.current.emit('limpiar_chat_servidor');
        }
    };

    return (
        <div className="chat-container-root">
            <div className="chat-header-tactico">
                <div className="header-info">
                    <div className="dot-online" style={{ backgroundColor: conectado ? 'var(--color-principal)' : '#ff4444' }}></div>
                    <span>{t('chatFrequency')} {esAdmin ? 'COMANDANCIA' : 'USUARIOS'} {conectado ? t('chatOnline') : t('chatOffline')}</span>
                </div>

                {esAdmin && (
                    <button onClick={limpiarChatTotal} className="btn-reset-chat">
                        🗑️ {t('chatReset')}
                    </button>
                )}
            </div>

            <div className="chat-messages-area" ref={scrollRef}>
                {Array.isArray(historial) && historial.length > 0 ? (
                    historial.map((m, idx) => (
                        <div key={m.id || idx} className={`mensaje-wrapper ${m.nombre_usuario === usuarioActivo?.nombre ? 'propio' : 'ajeno'} ${m.rol_usuario === 'admin' ? 'es-admin' : ''}`}>
                            <div className="mensaje-burbuja">
                                <div className="mensaje-info">
                                    <span className="mensaje-autor">
                                        {m.rol_usuario === 'admin' ? '⭐ ' : ''}{m.nombre_usuario}
                                    </span>
                                    <span className="mensaje-hora">
                                        {m.fecha ? new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </span>
                                </div>
                                <p className="mensaje-texto">{m.mensaje}</p>
                                <button 
                                    className="btn-descifrar-chat" 
                                    onClick={async (e) => {
                                        const btn = e.currentTarget;
                                        const originalText = m.mensaje;
                                        btn.innerText = '⌛';

                                        const getLang = () => {
                                            return language; 
                                        };

                                        try {
                                            const res = await axios.post(`${API_BASE_URL}/api/traducir-tactico`, { 
                                                texto: originalText,
                                                idioma: getLang()
                                            });
                                            const burbuja = btn.closest('.mensaje-burbuja');
                                            let tradBox = burbuja.querySelector('.traduccion-chat');
                                            if (!tradBox) {
                                                tradBox = document.createElement('div');
                                                tradBox.className = 'traduccion-chat fade-in';
                                                burbuja.appendChild(tradBox);
                                            }
                                            tradBox.innerHTML = `🤖 [${getLang().toUpperCase()}]: ${res.data.respuesta}`;
                                            btn.style.display = 'none';
                                        } catch {
                                            btn.innerText = '❌';
                                        }

                                    }}
                                >
                                    🤖
                                </button>

                            </div>
                        </div>
                    ))
                ) : (
                    <div className="sin-mensajes">
                        <p>{t('chatSearching')}</p>
                    </div>
                )}
            </div>

            <form className="chat-input-form" onSubmit={manejarEnvio}>
                <input
                    type="text"
                    placeholder={esAdmin ? t('chatWriteOrder') : t('chatWriteMessage')}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                />
                <div className="grupo-botones-chat">
                    <button type="button" className="btn-refrescar-chat" onClick={cargarHistorial} title="Refrescar señal">
                        🔄
                    </button>
                    <button type="submit" className="btn-enviar-chat">
                        {esAdmin ? t('chatEmit') : t('chatTransmit')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
