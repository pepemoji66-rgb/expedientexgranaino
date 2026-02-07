import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './archivosusuarios.css';
import { useNavigate } from 'react-router-dom';

const ArchivosUsuarios = () => {
    const [hallazgos, setHallazgos] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarHallazgos = async () => {
            try {
                // Pedimos solo las imágenes que ya aprobaste en el panel
                const res = await axios.get('http://localhost:5000/imagenes-publicas');
                setHallazgos(res.data);
            } catch (err) {
                console.error("Error cargando archivos de usuarios", err);
            }
        };
        cargarHallazgos();
    }, []);

    const verEnMapa = (dato) => {
        const payload = {
            ...dato,
            tipo: 'usuario', // Para que el mapa sepa que es de un usuario
            nombre: dato.titulo,
            latitud: parseFloat(dato.latitud),
            longitud: parseFloat(dato.longitud)
        };
        localStorage.setItem('lugar_a_resaltar', JSON.stringify(payload));
        navigate('/lugares');
    };

    return (
        <div className="archivos-container">
            <h2 className="titulo-archivos">ARCHIVOS DE CAMPO</h2>
            <div className="archivos-grid">
                {hallazgos.map(item => (
                    <div key={item.id} className="archivo-card" onClick={() => verEnMapa(item)}>
                        <img src={`/imagenes/${item.url_imagen}`} alt={item.titulo} />
                        <div className="archivo-info">
                            <h3>{item.titulo}</h3>
                            <p>Agente: {item.agente}</p>
                            <button className="btn-radar">LOCALIZAR EN RADAR</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArchivosUsuarios;