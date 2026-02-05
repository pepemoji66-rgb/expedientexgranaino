import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './chat.css';

const socket = io('http://localhost:5000');

const Chat = ({ usuarioActivo }) => {
    const [mensaje, setMensaje] = useState('');
    const [historial, setHistorial] = useState([]);
    const scrollRef = useRef();

    const esAdmin = usuarioActivo?.email === 'expedientexpepe@moreno.com' || usuarioActivo?.rol === 'admin';

    const cargarHistorial = () => {
        fetch('http://localhost:5000/chat-historial')
            .then(res => res.json())
            .then(data => setHistorial(data))
            .catch(err => console.error("Error cargando chat:", err));
    };

    useEffect(() => {
        cargarHistorial();

        socket.on('recibir_mensaje', (nuevoMsg) => {
            setHistorial((prev) => [...prev, nuevoMsg]);
        });

        socket.on('chat_limpiado', () => {
            setHistorial([]);
        });

        return () => {
            socket.off('recibir_mensaje');
            socket.off('chat_limpiado');
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [historial]);

    const manejarEnvio = (e) => {
        e.preventDefault();
        if (!mensaje.trim()) return;

        const dataPayload = {
            nombre_usuario: usuarioActivo?.nombre || 'Invitado',
            mensaje: mensaje,
            rol_usuario: esAdmin ? 'admin' : 'usuario',
            tipo: 'publico',
            fecha: new Date()
        };

        socket.emit('enviar_mensaje', dataPayload);
        setMensaje('');
    };

    const limpiarChatTotal = () => {
        if (window.confirm("¿BORRAR TODO EL HISTORIAL DE LA FRECUENCIA?")) {
            socket.emit('limpiar_chat_servidor');
        }
    };

    return (
        <div className="chat-container-root">
            <div className="chat-header-tactico">
                <div className="header-info">
                    <div className="dot-online"></div>
                    <span>FRECUENCIA: {esAdmin ? 'COMANDANCIA' : 'USUARIOS'}</span>
                </div>
                
                {esAdmin && (
                    <button onClick={limpiarChatTotal} className="btn-reset-chat">
                        🗑️ REINICIAR
                    </button>
                )}
            </div>

            <div className="chat-messages-area" ref={scrollRef}>
                {historial.map((m, idx) => (
                    <div key={idx} className={`mensaje-wrapper ${m.nombre_usuario === usuarioActivo?.nombre ? 'propio' : 'ajeno'} ${m.rol_usuario === 'admin' ? 'es-admin' : ''}`}>
                        <div className="mensaje-burbuja">
                            <div className="mensaje-info">
                                <span className="mensaje-autor">
                                    {m.rol_usuario === 'admin' ? '⭐ ' : ''}{m.nombre_usuario}
                                </span>
                                <span className="mensaje-hora">
                                    {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="mensaje-texto">{m.mensaje}</p>
                        </div>
                    </div>
                ))}
            </div>

            <form className="chat-input-form" onSubmit={manejarEnvio}>
                <input 
                    type="text" 
                    placeholder={esAdmin ? "Escribir orden..." : "Escribir mensaje..."}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                />
                <div className="grupo-botones-chat">
                    <button type="button" className="btn-refrescar-chat" onClick={cargarHistorial} title="Refrescar señal">
                        🔄
                    </button>
                    <button type="submit" className="btn-enviar-chat">
                        {esAdmin ? 'EMITIR' : 'TRANSMITIR'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;