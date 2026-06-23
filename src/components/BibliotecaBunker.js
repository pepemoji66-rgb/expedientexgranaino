import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Facebook, Twitter, Link as LinkIcon, MessageCircle } from 'lucide-react';
import API_BASE_URL from '../config';
import './biblioteca.css';

const BibliotecaBunker = () => {
    const [libros, setLibros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [paginaActual, setPaginaActual] = useState(1);
    const librosPorPagina = 10;

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

    // Lógica de Paginación
    const indiceUltimoLibro = paginaActual * librosPorPagina;
    const indicePrimerLibro = indiceUltimoLibro - librosPorPagina;
    const librosPaginados = libros.slice(indicePrimerLibro, indiceUltimoLibro);
    const totalPaginas = Math.ceil(libros.length / librosPorPagina);

    return (
        <div className="biblioteca-bunker-container fade-in">
            <div className="biblioteca-header">
                <h1>📚 BIBLIOTECA DEL BÚNKER</h1>
                <div className="biblioteca-intro-text">
                    <p>Bienvenido al archivo de lectura clasificada de Expediente X Granaíno. Aquí encontrarás nuestra selección de obras imprescindibles para investigar fenómenos anómalos, misterios históricos y crónicas ufológicas. Desde relatos de abducciones hasta investigaciones de campo sobre entidades desconocidas.</p>
                    <p className="amazon-disclaimer-text" style={{ fontSize: '0.85rem', color: '#888', marginTop: '15px', borderLeft: '2px solid var(--color-principal)', paddingLeft: '15px', textAlign: 'left' }}>
                        <strong>Aviso de transparencia:</strong> Los libros mostrados en esta sección son recomendaciones genuinas del Búnker. En calidad de Afiliados de Amazon, obtenemos ingresos por las compras adscritas que cumplen los requisitos aplicables. Esto <strong>NO supone ningún sobrecoste para ti</strong>. Al hacer clic en "Comprar en Amazon", serás redirigido a la plataforma oficial de forma 100% segura. <strong>OJO: No es obligatorio comprar el libro</strong>. Puedes aprovechar el enlace para acceder a Amazon y hacer tus compras habituales (electrónica, hogar, regalos...). Gracias a tu apoyo mediante estas compras, podemos mantener los servidores operativos y seguir desclasificando expedientes.
                    </p>
                </div>
            </div>

            {cargando ? (
                <div className="biblioteca-loading">
                    <div className="spinner-bunker"></div>
                    <p>Accediendo a los archivos de la biblioteca...</p>
                </div>
            ) : (
                <>
                    <div className="biblioteca-grid">
                        {librosPaginados.length > 0 ? (
                            librosPaginados.map((libro, index) => (
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
                    
                    {totalPaginas > 1 && (
                        <div className="biblioteca-paginacion" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '40px' }}>
                            <button 
                                onClick={() => {
                                    setPaginaActual(prev => Math.max(prev - 1, 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={paginaActual === 1}
                                style={{ padding: '8px 16px', background: paginaActual === 1 ? '#333' : '#ffb100', color: paginaActual === 1 ? '#888' : '#000', border: 'none', borderRadius: '4px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                            >
                                ANTERIOR
                            </button>
                            <span style={{ color: '#ffb100', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                Pág. {paginaActual} / {totalPaginas}
                            </span>
                            <button 
                                onClick={() => {
                                    setPaginaActual(prev => Math.min(prev + 1, totalPaginas));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={paginaActual === totalPaginas}
                                style={{ padding: '8px 16px', background: paginaActual === totalPaginas ? '#333' : '#ffb100', color: paginaActual === totalPaginas ? '#888' : '#000', border: 'none', borderRadius: '4px', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                            >
                                SIGUIENTE
                            </button>
                        </div>
                    )}
                </>
            )}
            
            {/* SECCIÓN DE COMPARTIR */}
            <div className="biblioteca-share-section" style={{ marginTop: '50px', padding: '20px', borderTop: '1px solid rgba(255, 177, 0, 0.2)', textAlign: 'center' }}>
                <h3 style={{ color: '#ffb100', marginBottom: '20px', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>DIFUNDE EL CONOCIMIENTO</h3>
                <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Comparte esta biblioteca en tus redes y ayúdanos a desclasificar la verdad.</p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#1877F2', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                        <Facebook size={20} /> Facebook
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Echa un vistazo a la Biblioteca del Búnker de Expediente X Granaíno 📚🛸")}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#000000', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', border: '1px solid #333' }}>
                        <Twitter size={20} /> X (Twitter)
                    </a>
                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Descubre la Biblioteca del Búnker de Expediente X Granaíno 📚🛸: " + window.location.href)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                        <MessageCircle size={20} /> WhatsApp
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("¡Enlace copiado al portapapeles! Listo para pegarlo en Instagram u otras redes."); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'transparent', color: '#ffb100', border: '1px solid #ffb100', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        <LinkIcon size={20} /> Copiar Enlace
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BibliotecaBunker;
