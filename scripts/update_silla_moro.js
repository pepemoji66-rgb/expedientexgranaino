const db = require('../db');

const nuevoContenido = `
<h2>💀 Un Cadáver sin Nombre Frente a la Alhambra</h2>

<p>La Silla del Moro es uno de los miradores más emblemáticos de Granada, un lugar cargado de historia medieval que vigila el Generalife y el palacio de la Alhambra desde lo alto. Sin embargo, en septiembre de 2005, este paraje de postal se convirtió en el escenario de un auténtico rompecabezas para el <strong>Grupo de Homicidios de la Policía Nacional</strong>.</p>

<p>Unos excursionistas que caminaban por las inmediaciones del cerro descubrieron el cuerpo de un hombre semienterrado en una zona de tierra batida. Al desenterrarlo, la sorpresa de los investigadores fue mayúscula: el cadáver pertenecía a un hombre de mediana edad que vestía <strong>ropa de muy buena calidad y marcas caras</strong>, pero no llevaba encima ni una sola identificación, ni cartera, ni llaves, ni teléfono móvil. Lo habían <em>"limpiado" por completo</em> para borrar su rastro.</p>

<hr>

<h2>🔍 La Autopsia y el Vacío de la Interpol</h2>

<p>La <strong>autopsia forense</strong> confirmó rápidamente que se trataba de una muerte violenta y que el cuerpo llevaba muy poco tiempo en el lugar del enterramiento. Ante la falta de documentación, la policía volcó todos sus esfuerzos en la identificación antropológica y dactilar:</p>

<ul>
<li><strong>Cotejo de Huellas y ADN:</strong> Se cruzaron los datos biológicos con los archivos de personas desaparecidas de toda España. El resultado fue negativo.</li>
<li><strong>Alerta Internacional:</strong> Debido a la calidad de la ropa y las características del sujeto, se activó una notificación negra a través de la <strong>Interpol</strong> para buscar coincidencias en bases de datos europeas y mundiales.</li>
<li><strong>El Silencio:</strong> El resultado fue un vacío absoluto. Nadie denunció su desaparición en ningún rincón del mundo, nadie reclamó el cuerpo en el Instituto de Medicina Legal y ninguna pista consiguió desvelar quién era aquel hombre elegante enterrado a las puertas de la Alhambra.</li>
</ul>

<p>Dos décadas después, el caso permanece blindado en el <strong>archivo de sucesos sin resolver de Granada</strong>. Un auténtico misterio real que demuestra que, a veces, la realidad supera con creces a la ficción.</p>

<hr>

<h2>🌍 Conexión Internacional: Los Grandes Misterios de Identidades Borradas</h2>

<p>El misterio de la Silla del Moro no es un hecho aislado en la crónica negra internacional. Pertenece a una selecta y perturbadora lista de casos criminales donde los asesinos consiguieron borrar la identidad de sus víctimas de forma perfecta, desafiando a las mejores agencias de inteligencia del planeta:</p>

<ul>
<li><strong>El Hombre de Somerton (Australia, 1948):</strong> Un hombre hallado muerto en una playa, con ropa de excelente calidad a la que le habían arrancado todas las etiquetas, sin identificación y con un código secreto en el bolsillo. Un enigma que tardó más de setenta años en resolverse a medias.</li>
<li><strong>La Mujer de Isdal (Noruega, 1970):</strong> Encontrada en un valle remoto con las etiquetas de su ropa cortadas, múltiples pasaportes falsos y mensajes cifrados. Una trama que conectaba con el espionaje de la Guerra Fría.</li>
<li><strong>El Caso de la Silla del Moro (España, 2005):</strong> Un calco moderno de este <em>"modus operandi"</em>. Un hombre distinguido, ropa selecta, ejecución limpia y eliminación total de cualquier objeto personal. ¿Un ajuste de cuentas de la delincuencia internacional de guante blanco? ¿Un espía? ¿Un ciudadano extranjero borrado del mapa?</li>
</ul>

<hr>

<h2>💬 Debate en el Búnker: Ayúdanos a Investigar</h2>

<p>Los casos de identidades ocultas solo se resuelven cuando alguien, en algún lugar del mundo, reconoce una descripción o un detalle. Dos décadas después, las preguntas siguen en el aire: <strong>¿Cómo llegó un hombre adinerado a terminar sus días de forma violenta en un cerro solitario de Granada sin que nadie en el planeta lo echara de menos?</strong></p>

<div class="caso-footer-copyright">© ARCHIVO DE SUCESOS SIN RESOLVER - PROPIEDAD EXCLUSIVA DEL BÚNKER (EXPEDIENTEXGRANAINO)</div>
`;

const nuevoContenidoEn = `
<h2>💀 A Nameless Corpse in Front of the Alhambra</h2>

<p>La Silla del Moro is one of Granada's most emblematic viewpoints, a place steeped in medieval history that watches over the Generalife and the Alhambra Palace from above. However, in September 2005, this postcard-perfect location became the scene of a genuine puzzle for the <strong>National Police Homicide Unit</strong>.</p>

<p>Hikers walking near the hill discovered the body of a man half-buried in a patch of beaten earth. When they unearthed it, investigators were stunned: the corpse belonged to a middle-aged man wearing <strong>very high-quality, expensive-brand clothing</strong>, but he carried no identification whatsoever—no wallet, no keys, no mobile phone. He had been <em>"cleaned" completely</em> to erase his trail.</p>

<hr>

<h2>🔍 The Autopsy and Interpol's Void</h2>

<p>The <strong>forensic autopsy</strong> quickly confirmed it was a violent death and the body had been at the burial site for a very short time. With no documentation, police poured all their resources into anthropological and fingerprint identification:</p>

<ul>
<li><strong>Fingerprint and DNA Matching:</strong> Biological data was cross-referenced with missing persons databases across all of Spain. The result was negative.</li>
<li><strong>International Alert:</strong> Due to the clothing quality and the subject's characteristics, a black notice was issued through <strong>Interpol</strong> to search for matches in European and worldwide databases.</li>
<li><strong>The Silence:</strong> The result was an absolute void. No one reported him missing anywhere in the world, no one claimed the body at the Institute of Legal Medicine, and no lead managed to reveal who that elegantly dressed man buried at the gates of the Alhambra was.</li>
</ul>

<p>Two decades later, the case remains locked in <strong>Granada's unsolved cases archive</strong>. A true real-life mystery that proves that sometimes reality far surpasses fiction.</p>

<hr>

<h2>🌍 International Connection: The Great Mysteries of Erased Identities</h2>

<p>The Silla del Moro mystery is not an isolated event in international crime chronicles. It belongs to a select and disturbing list of criminal cases where the killers managed to perfectly erase their victims' identities, defying the world's best intelligence agencies:</p>

<ul>
<li><strong>The Somerton Man (Australia, 1948):</strong> A man found dead on a beach, wearing excellent quality clothing with all labels ripped out, no identification, and a secret code in his pocket. An enigma that took over seventy years to be partially solved.</li>
<li><strong>The Isdal Woman (Norway, 1970):</strong> Found in a remote valley with her clothing labels cut off, multiple fake passports, and encrypted messages. A plot connected to Cold War espionage.</li>
<li><strong>The Silla del Moro Case (Spain, 2005):</strong> A modern copy of this <em>"modus operandi"</em>. A distinguished man, selective clothing, clean execution, and total elimination of any personal object. A settling of scores by white-collar international crime? A spy? A foreign citizen erased from the map?</li>
</ul>

<hr>

<h2>💬 Bunker Debate: Help Us Investigate</h2>

<p>Hidden identity cases are only solved when someone, somewhere in the world, recognizes a description or a detail. Two decades later, the questions remain: <strong>How did a wealthy man end up dying violently on a lonely hill in Granada without anyone on the planet missing him?</strong></p>

<div class="caso-footer-copyright">© UNSOLVED CASES ARCHIVE - EXCLUSIVE PROPERTY OF THE BUNKER (EXPEDIENTEXGRANAINO)</div>
`;

async function actualizar() {
    try {
        // Buscar el caso de la Silla del Moro
        const casos = await db.query("SELECT id, titulo FROM casos_abiertos WHERE titulo LIKE '%moro%'");
        if (casos.length === 0) {
            console.log("❌ No se encontró el caso de la Silla del Moro");
            process.exit(1);
        }
        
        const caso = casos[0];
        console.log(`📋 Encontrado: ID ${caso.id} - "${caso.titulo}"`);
        
        // Actualizar con el título SEO nuevo también
        const nuevoTitulo = "Crónica Negra: El Enigma de la Silla del Moro (Granada)";
        const nuevoTituloEn = "True Crime: The Enigma of La Silla del Moro (Granada)";
        
        await db.execute(
            "UPDATE casos_abiertos SET titulo = ?, contenido = ?, titulo_en = ?, contenido_en = ? WHERE id = ?",
            [nuevoTitulo, nuevoContenido.trim(), nuevoTituloEn, nuevoContenidoEn.trim(), caso.id]
        );
        
        console.log(`✅ Caso actualizado con éxito (ID: ${caso.id})`);
        console.log("   - Título ES:", nuevoTitulo);
        console.log("   - Título EN:", nuevoTituloEn);
        console.log("   - Contenido ES: HTML enriquecido con secciones SEO");
        console.log("   - Contenido EN: HTML enriquecido con secciones SEO");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

actualizar();
