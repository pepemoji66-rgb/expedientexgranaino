import React from 'react';
import './Hero.css';

const Hero = () => {
    return (
        <div className="hero-container">
            <h2 className="hero-nombre">JOSE MORENO JIMÉNEZ</h2>
            <p className="hero-bio">
                Administrador principal y fundador de ExpedienteXGranaino.
                Dedicado a la búsqueda incansable de lo inexplicable en la milenaria ciudad de la Alhambra.
            </p>

            <div className="hero-poema">
                <h3>"Eco de Sombras en la Roja Piedra"</h3>
                <p>
                    En la noche que abraza al Darro, viejo cantor,<br />
                    la Alhambra suspira secretos, mudo temor.<br />
                    Murmullos de sultanes, ecos de amor y traición,<br />
                    pero un brillo furtivo, ¿es solo ilusión?
                </p>
            </div>
        </div>
    );
};

export default Hero;