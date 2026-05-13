import React, { useState } from 'react';
import './cabala.css';

const Cabala = () => {
    const [input, setInput] = useState('');
    const [resultado, setResultado] = useState(null);
    const [animando, setAnimando] = useState(false);

    const calcularCabala = (e) => {
        e.preventDefault();
        if (!input) return;

        setAnimando(true);
        
        // Simular cálculo místico
        setTimeout(() => {
            const texto = input.toUpperCase().trim();
            let valor = 0;
            
            // Lógica de Gematría mejorada (Letras y Números)
            for (let i = 0; i < texto.length; i++) {
                const char = texto[i];
                const code = texto.charCodeAt(i);
                
                if (code >= 65 && code <= 90) { // A-Z
                    valor += (code - 64);
                } else if (code >= 48 && code <= 57) { // 0-9
                    valor += parseInt(char);
                }
            }

            if (valor === 0) {
                setResultado({
                    valor: 0,
                    maestro: 0,
                    mensaje: "FRECUENCIA NULA. El vacío absoluto no ofrece respuestas. Intente con una combinación de letras y números."
                });
                setAnimando(false);
                return;
            }

            // Reducción teosófica (sumar dígitos hasta que quede < 10, excepto números maestros 11, 22, 33)
            const reducir = (n) => {
                if (n === 11 || n === 22 || n === 33 || n < 10) return n;
                const sum = n.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
                return reducir(sum);
            };

            const numeroMaestro = reducir(valor);
            
            const interpretaciones = {
                1: "EL ORIGEN (EL MAGO). Representa el inicio de todo, la voluntad pura y el liderazgo en el búnker.",
                2: "LA DUALIDAD (LA SACERDOTISA). Sabiduría oculta, intuición y el equilibrio entre lo visible y lo invisible.",
                3: "LA TRINIDAD (LA EMPERATRIZ). Creatividad desbordante y la conexión de los tres planos: físico, mental y astral.",
                4: "LA ESTABILIDAD (EL EMPERADOR). Orden, estructura y la base sólida sobre la que se asienta nuestra realidad.",
                5: "EL CAMBIO (EL HIEROFANTE). Libertad, aventura y la búsqueda de conocimiento más allá de lo establecido.",
                6: "LA ARMONÍA (LOS ENAMORADOS). Responsabilidad, amor y el equilibrio necesario para la paz en el sector.",
                7: "EL MISTERIO (EL CARRO). El número sagrado del búnker. Victoria a través del conocimiento espiritual.",
                8: "EL PODER (LA JUSTICIA). Éxito material, autoridad y el flujo infinito de la energía cósmica (Karma).",
                9: "LA SABIDURÍA (EL ERMITAÑO). Humanitarismo, culminación y el cierre del círculo evolutivo.",
                11: "EL CANAL MAESTRO. Gran intuición y una conexión psíquica directa con las frecuencias del búnker.",
                22: "EL CONSTRUCTOR MAESTRO. El poder de manifestar grandes visiones y cambiar el destino del sector.",
                33: "EL MAESTRO GUÍA. La vibración más alta de servicio y protección a los investigadores del búnker."
            };

            setResultado({
                valor: valor,
                maestro: numeroMaestro,
                mensaje: interpretaciones[numeroMaestro] || "VIBRACIÓN ANÓMALA. Se ha detectado una frecuencia fuera de los registros conocidos."
            });
            setAnimando(false);
        }, 2000);
    };

    return (
        <div className="cabala-page">
            <header className="cabala-header">
                <h1 className="titulo-cabala">✡️ EL ORÁCULO DE LA CÁBALA</h1>
                <p className="subtitulo-cabala">Descifra la vibración numérica de los nombres y las palabras.</p>
                <div className="linea-decorativa"></div>
            </header>

            <div className="cabala-container">
                <div className="cabala-input-box">
                    <form onSubmit={calcularCabala}>
                        <label>INGRESE NOMBRE O PALABRA CLAVE:</label>
                        <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ej: GRANADA, DESTINO, PEPE..."
                            className="input-bunker"
                        />
                        <button type="submit" className="btn-descifrar" disabled={animando}>
                            {animando ? 'DESCIFRANDO...' : 'INICIAR CÁLCULO MÍSTICO'}
                        </button>
                    </form>
                </div>

                {animando && (
                    <div className="cabala-loading">
                        <div className="matrix-loader"></div>
                        <p>PROCESANDO MATRIZ NUMÉRICA...</p>
                    </div>
                )}

                {resultado && !animando && (
                    <div className="cabala-resultado fade-in">
                        <div className="resultado-circle">
                            <span className="valor-total">{resultado.valor}</span>
                            <span className="valor-maestro">{resultado.maestro}</span>
                        </div>
                        <div className="resultado-info">
                            <h3>VIBRACIÓN DETECTADA: NIVEL {resultado.maestro}</h3>
                            <p className="mensaje-cabala">{resultado.mensaje}</p>
                        </div>
                        <button className="btn-limpiar" onClick={() => { setResultado(null); setInput(''); }}>NUEVA CONSULTA</button>
                    </div>
                )}
            </div>

            <section className="cabala-info-secundaria">
                <h3>¿QUÉ ES LA CÁBALA DEL BÚNKER?</h3>
                <p>Basada en la Gematría antigua, nuestro sistema asigna una frecuencia vibratoria a cada letra. Al sumar y reducir estos valores, obtenemos la esencia energética de cualquier concepto dentro de nuestra realidad.</p>
            </section>
        </div>
    );
};

export default Cabala;
