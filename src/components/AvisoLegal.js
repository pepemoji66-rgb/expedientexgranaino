import React from 'react';

const AvisoLegal = () => {
    return (
        <div className="legal-container fade-in" style={{
            padding: '120px 20px 60px',
            maxWidth: '900px',
            margin: '0 auto',
            color: '#ccc',
            fontFamily: 'monospace',
            lineHeight: '1.6'
        }}>
            <h1 className="titulo-neon" style={{ color: 'var(--color-principal)', textAlign: 'center', marginBottom: '40px' }}>
                ⚖️ AVISO LEGAL
            </h1>
            
            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>1. DATOS IDENTIFICATIVOS</h2>
                <p>En cumplimiento con el deber de información recogido en artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), el titular de la web es <strong>José Moreno Jiménez</strong>, con correo de contacto: <strong>archipegv2@gmail.com</strong>.</p>
            </section>

            <section style={{ marginBottom: '30px', border: '1px solid #333', padding: '20px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>2. USO DEL PORTAL</h2>
                <p>El acceso y/o uso de este portal de <strong>Expediente X Granaino</strong> atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas. El portal proporciona acceso a multitud de informaciones, servicios, programas o datos (en adelante, "los contenidos") en Internet pertenecientes a la administración o a sus licenciantes.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>3. PROPIEDAD INTELECTUAL E INDUSTRIAL</h2>
                <p>El titular por sí o como cesionario, es dueño de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo, imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, etc.).</p>
                <p>Todos los derechos reservados. En virtud de lo dispuesto en los artículos 8 y 32.1, párrafo segundo, de la Ley de Propiedad Intelectual, quedan expresamente prohibidas la reproducción, la distribución y la comunicación pública, incluida su modalidad de puesta a disposición, de la totalidad o parte de los contenidos de esta página web, con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización del titular.</p>
            </section>

            <section style={{ marginBottom: '30px', background: 'rgba(255, 68, 68, 0.05)', padding: '15px', border: '1px solid #ff4444' }}>
                <h2 style={{ color: '#ff4444', fontSize: '1.2rem' }}>4. EXCLUSIÓN DE GARANTÍAS Y RESPONSABILIDAD</h2>
                <p>El titular no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>5. MODIFICACIONES</h2>
                <p>El titular se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados en su portal.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>6. PROGRAMA DE AFILIADOS DE AMAZON</h2>
                <p>En calidad de Afiliado de Amazon, este sitio web obtiene ingresos por las compras adscritas que cumplen los requisitos aplicables de acuerdo con lo establecido en el Acuerdo Operativo del Programa de Afiliados de Amazon.</p>
            </section>

            <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '0.7rem', color: '#666' }}>
                [ REGISTRO DE SEGURIDAD LEGAL - MAYO 2026 ]
            </div>
        </div>
    );
};

export default AvisoLegal;

