import React from 'react';
import './Footer.css'; 

const Footer = () => {
    const añoActual = new Date().getFullYear(); 

    return (
        <footer className="footer-container">
            <p>
                &copy; {añoActual} ExpedienteXGranaino. Autor: José Moreno Jiménez. 
                <span className="footer-extra"> Prohibida la reproducción no autorizada.</span>
            </p>
        </footer>
    );
};

export default Footer;