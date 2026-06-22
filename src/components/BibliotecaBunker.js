import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import './biblioteca.css';

const BibliotecaBunker = () => {
    const [libros, setLibros] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const fetchLibros = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/amazon/todos`);
                // response.data es un array de objetos con formato { banner: {}, bibliografia: [] }
                // Extraemos todos los libros de todas las bibliografías
                let todosLosLibros = [];
                if (response.data && Array.isArray(response.data)) {
                    response.data.forEach(item => {
                        if (item.bibliografia && Array.isArray(item.bibliografia)) {
                            todosLosLibros = [...todosLosLibros, ...item.bibliografia];
                        }
                    });
                }
                
                // Eliminamos posibles duplicados (por si un libro está en dos expedientes distintos)
                const librosUnicos = Array.from(new Set(todosLosLibros.map(a => a.link)))
                    .map(link => {
                        return todosLosLibros.find(a => a.link === link);
                    });

                setLibros(librosUnicos);
            } catch (error) {
                console.error("Error al cargar la biblioteca:", error);
            } finally {
                setCargando(false);
            }
        };

        fetchLibros();
    }, []);

    return (
        <div className="biblioteca-bunker-container fade-in">
            <div className="biblioteca-header">
                <h1>📚 BIBLIOTECA DEL BÚNKER</h1>
                <p>Nuestra selección de obras imprescindibles para investigar fenómenos anómalos, misterios históricos y crónicas ufológicas. Adquiriendo estos libros a través de nuestros enlaces ayudas a mantener activo el Búnker.</p>
            </div>

            {cargando ? (
                <div className="biblioteca-loading">
                    <div className="spinner-bunker"></div>
                    <p>Accediendo a los archivos de la biblioteca...</p>
                </div>
            ) : (
                <div className="biblioteca-grid">
                    {libros.length > 0 ? (
                        libros.map((libro, index) => (
                            <a key={index} href={libro.link} target="_blank" rel="noopener noreferrer" className="amazon-book-card biblioteca-card">
                                <div className="amazon-book-cover-container">
                                    <img src={libro.imagen_url} alt={libro.titulo} className="amazon-book-cover" />
                                </div>
                                <div className="amazon-book-info">
                                    <div>
                                        <h5 className="amazon-book-title">{libro.titulo}</h5>
                                        <p className="amazon-book-author">{libro.autor}</p>
                                    </div>
                                    <div className="amazon-book-btn">🛒 COMPRAR EN AMAZON</div>
                                </div>
                            </a>
                        ))
                    ) : (
                        <div className="biblioteca-vacia">
                            <p>Aún no hay libros clasificados en la biblioteca.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BibliotecaBunker;
