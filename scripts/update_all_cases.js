const db = require('../db');

// =========================================
// CASO 2: CORTIJO JURADO
// =========================================
const caso2_es = `
<h2>🏚️ Secretos de Terror Bajo el Suelo de Campanillas</h2>

<p>A las afueras de Málaga, en la barriada de Campanillas, se alza imponente y en ruinas el <strong>Cortijo Jurado</strong>, una mansión de estilo neogótico construida en el siglo XIX por la adinerada <strong>familia Heredia</strong>. Lo que comenzó como una finca de recreo agrícola se ha convertido, con el paso de las décadas, en el epicentro del misterio y la crónica negra del sur de España.</p>

<hr>

<h2>💀 Desapariciones y Rituales: La Leyenda Más Oscura de Andalucía</h2>

<p>La leyenda más oscura que pesa sobre sus muros habla de la <strong>desaparición de varias chicas jóvenes</strong> de la zona entre 1890 y 1920. Los rumores de la época apuntaban a que eran víctimas de macabros rituales llevados a cabo por la alta aristocracia, cuyos implicados se valían de una supuesta <strong>red de túneles secretos subterráneos</strong> para mover los cuerpos sin ser vistos.</p>

<blockquote>Los lugareños juran haber visto luces y escuchado lamentos entre las habitaciones vacías del cortijo durante décadas.</blockquote>

<hr>

<h2>🔍 La Investigación: Entre el Mito y la Realidad Policial</h2>

<p>A pesar de que el cortijo ha sido escenario de incontables investigaciones paranormales, la <strong>realidad judicial y policial</strong> sigue siendo un enigma:</p>

<ul>
<li><strong>Pasadizos Ocultos:</strong> Nunca se encontraron de forma oficial los túneles secretos que la leyenda describe bajo la finca.</li>
<li><strong>Restos Humanos:</strong> No se hallaron restos en el subsuelo que confirmaran las identidades de las jóvenes desaparecidas.</li>
<li><strong>Expedientes Difuminados:</strong> Los archivos de la época quedaron sepultados entre el mito popular y el secretismo de las familias influyentes del siglo pasado.</li>
</ul>

<hr>

<h2>🌍 Conexión Internacional: Mansiones Malditas con Secretos Reales</h2>

<p>El Cortijo Jurado no es un caso aislado en la historia criminal mundial. Pertenece a una inquietante lista de propiedades señoriales vinculadas a crímenes ocultos:</p>

<ul>
<li><strong>La Mansión LaLaurie (Nueva Orleans, 1834):</strong> La socialité Delphine LaLaurie escondía en su ático a esclavos torturados durante años. El horror solo se descubrió tras un incendio fortuito.</li>
<li><strong>El Castillo de Cachtice (Eslovaquia, 1610):</strong> La condesa Elizabeth Báthory, conocida como la "Condesa Sangrienta", fue acusada de asesinar a más de 600 jóvenes sirvientas en su fortaleza.</li>
<li><strong>El Cortijo Jurado (Málaga, 1890-1920):</strong> ¿Fue realmente el escenario de rituales criminales de la aristocracia andaluza? ¿O el nacimiento de la leyenda urbana más terrorífica de todo el sur de España?</li>
</ul>

<hr>

<h2>💬 Debate en el Búnker</h2>

<p>El Cortijo Jurado sigue en pie, devorado por el abandono, guardando bajo llave la verdad. <strong>¿Fue el escenario de crímenes atroces o el nacimiento de la leyenda urbana más terrorífica de Andalucía?</strong> Dos siglos después, los muros callan y el misterio permanece intacto.</p>

<div class="caso-footer-copyright">© ARCHIVO DE SUCESOS SIN RESOLVER - PROPIEDAD EXCLUSIVA DEL BÚNKER (EXPEDIENTEXGRANAINO)</div>
`;

const caso2_en = `
<h2>🏚️ Secrets of Terror Under the Soil of Campanillas</h2>

<p>On the outskirts of Malaga, in the Campanillas neighborhood, stands the imposing and ruined <strong>Cortijo Jurado</strong>, a neo-Gothic mansion built in the 19th century by the wealthy <strong>Heredia family</strong>. What started as an agricultural recreational estate has become, over the decades, the epicenter of mystery and dark chronicles in southern Spain.</p>

<hr>

<h2>💀 Disappearances and Rituals: Andalusia's Darkest Legend</h2>

<p>The darkest legend weighing on its walls speaks of the <strong>disappearance of several young girls</strong> from the area between 1890 and 1920. Rumors of the time suggested they were victims of macabre rituals carried out by the high aristocracy, whose participants used an alleged <strong>network of secret underground tunnels</strong> to move the bodies unseen.</p>

<blockquote>Locals swear they have seen lights and heard wails among the empty rooms of the estate for decades.</blockquote>

<hr>

<h2>🔍 The Investigation: Between Myth and Police Reality</h2>

<p>Despite the estate being the scene of countless paranormal investigations, the <strong>judicial and police reality</strong> remains an enigma:</p>

<ul>
<li><strong>Hidden Passages:</strong> The secret tunnels described by legend were never officially found beneath the estate.</li>
<li><strong>Human Remains:</strong> No remains were found in the subsoil to confirm the identities of the missing girls.</li>
<li><strong>Blurred Records:</strong> The files from that era were buried between popular myth and the secrecy of influential families of the past century.</li>
</ul>

<hr>

<h2>🌍 International Connection: Cursed Mansions with Real Secrets</h2>

<p>Cortijo Jurado is not an isolated case in world criminal history. It belongs to a disturbing list of stately properties linked to hidden crimes:</p>

<ul>
<li><strong>The LaLaurie Mansion (New Orleans, 1834):</strong> Socialite Delphine LaLaurie hid tortured slaves in her attic for years. The horror was only discovered after an accidental fire.</li>
<li><strong>Cachtice Castle (Slovakia, 1610):</strong> Countess Elizabeth Báthory, known as the "Blood Countess," was accused of murdering over 600 young servant girls in her fortress.</li>
<li><strong>Cortijo Jurado (Málaga, 1890-1920):</strong> Was it truly the scene of criminal rituals by the Andalusian aristocracy? Or the birthplace of the most terrifying urban legend in all of southern Spain?</li>
</ul>

<hr>

<h2>💬 Bunker Debate</h2>

<p>Cortijo Jurado still stands, devoured by abandonment, keeping the truth locked away. <strong>Was it the scene of atrocious crimes or the birthplace of Andalusia's most terrifying urban legend?</strong> Two centuries later, the walls remain silent and the mystery stays intact.</p>

<div class="caso-footer-copyright">© UNSOLVED CASES ARCHIVE - EXCLUSIVE PROPERTY OF THE BUNKER (EXPEDIENTEXGRANAINO)</div>
`;

// =========================================
// CASO 3: LOS GALINDOS
// =========================================
const caso3_es = `
<h2>☀️ Cinco Muertes y un Misterio Enterrado Bajo el Sol de Sevilla</h2>

<p>El <strong>22 de julio de 1975</strong>, bajo un calor asfixiante de más de cuarenta grados, el cortijo sevillano de <strong>Los Galindos</strong> se convirtió en el escenario de una de las mayores carnicerías de la historia criminal de España. Cinco personas —el capataz, su esposa, dos tractoristas y un cosechador— fueron asesinadas de forma brutal en distintos puntos de la finca.</p>

<hr>

<h2>🔪 La Masacre: Reconstrucción de los Hechos</h2>

<ul>
<li><strong>Método:</strong> Unos fueron golpeados con una pieza de metal pesada, otros tiroteados con una escopeta de caza.</li>
<li><strong>Ocultación:</strong> A dos de ellos les prendieron fuego en un cobertizo de paja para intentar borrar las huellas.</li>
<li><strong>Conclusión inicial:</strong> Lo que la Guardia Civil pensó que era un brote de locura de un empleado, pronto se reveló como un <strong>plan perfectamente ejecutado</strong>.</li>
</ul>

<hr>

<h2>🔍 El Desastre de la Investigación Judicial</h2>

<p>La investigación judicial fue un auténtico desastre que comprometió para siempre la resolución del caso:</p>

<ul>
<li><strong>Escena contaminada:</strong> El escenario del crimen fue pisoteado por decenas de curiosos antes de ser acordonado.</li>
<li><strong>Pruebas destruidas:</strong> Se destruyeron evidencias cruciales en las primeras horas.</li>
<li><strong>Autopsias fallidas:</strong> Los informes forenses iniciales fallaron estrepitosamente.</li>
</ul>

<p>Cuando el sumario pasó a manos del famoso <strong>juez Heriberto Asensio</strong>, se descubrió que los hilos del crimen apuntaban mucho más alto, salpicando a un <strong>fraude financiero</strong> relacionado con el dinero de la venta de trigo negro que el capataz estaba a punto de denunciar.</p>

<hr>

<h2>🤫 El Pacto de Silencio: Sospechosos Intocables</h2>

<p>Hubo sospechosos, <strong>militares implicados y terratenientes bajo la lupa</strong>, pero el pacto de silencio fue más fuerte que la justicia. Nadie habló. Nadie confesó. Nadie pagó por las cinco vidas arrebatadas en aquel cortijo.</p>

<blockquote>El caso prescribió legalmente en 1995. Cincuenta años después, los muros de Los Galindos siguen guardando el secreto de quién mandó apretar el gatillo.</blockquote>

<hr>

<h2>🌍 Conexión Internacional: Masacres en Fincas Rurales</h2>

<p>El Crimen de Los Galindos comparte paralelismos escalofriantes con otros casos internacionales:</p>

<ul>
<li><strong>La Masacre de Hinterkaifeck (Alemania, 1922):</strong> Seis personas asesinadas a hachazos en una granja aislada de Baviera. El asesino convivió con los cadáveres durante días. Nunca se resolvió.</li>
<li><strong>Los Asesinatos de la Familia Lawson (EE.UU., 1929):</strong> Un granjero de Carolina del Norte mató a su mujer y seis hijos la víspera de Navidad por razones que siguen siendo debatidas.</li>
<li><strong>Los Galindos (España, 1975):</strong> Cinco muertos, un fraude millonario y un muro de silencio que la justicia española nunca logró derribar.</li>
</ul>

<div class="caso-footer-copyright">© ARCHIVO DE SUCESOS SIN RESOLVER - PROPIEDAD EXCLUSIVA DEL BÚNKER (EXPEDIENTEXGRANAINO)</div>
`;

const caso3_en = `
<h2>☀️ Five Deaths and a Mystery Buried Under the Seville Sun</h2>

<p>On <strong>July 22, 1975</strong>, under suffocating heat of over forty degrees, the Sevillian estate of <strong>Los Galindos</strong> became the scene of one of the greatest massacres in Spanish criminal history. Five people—the foreman, his wife, two tractor drivers, and a harvester—were brutally murdered in different parts of the property.</p>

<hr>

<h2>🔪 The Massacre: Reconstruction of Events</h2>

<ul>
<li><strong>Method:</strong> Some were bludgeoned with a heavy metal piece, others were shot with a hunting rifle.</li>
<li><strong>Cover-up:</strong> Two of them were set on fire in a straw shed to try to erase the tracks.</li>
<li><strong>Initial conclusion:</strong> What the Civil Guard initially thought was a bout of madness from one of the employees soon revealed itself as a <strong>perfectly executed plan</strong>.</li>
</ul>

<hr>

<h2>🔍 The Judicial Investigation Disaster</h2>

<p>The judicial investigation was an absolute disaster that forever compromised the resolution of the case:</p>

<ul>
<li><strong>Contaminated scene:</strong> The crime scene was trampled by dozens of onlookers before being cordoned off.</li>
<li><strong>Destroyed evidence:</strong> Crucial evidence was destroyed in the first hours.</li>
<li><strong>Failed autopsies:</strong> The initial forensic reports failed miserably.</li>
</ul>

<p>When the case passed into the hands of the famous <strong>Judge Heriberto Asensio</strong>, it was discovered that the threads of the crime pointed much higher, splashing onto a <strong>financial fraud</strong> related to black wheat money that the foreman was about to denounce.</p>

<hr>

<h2>🤫 The Pact of Silence: Untouchable Suspects</h2>

<p>There were suspects, <strong>military personnel involved and landowners under the microscope</strong>, but the pact of silence was stronger than justice. Nobody talked. Nobody confessed. Nobody paid for the five lives taken in that estate.</p>

<blockquote>The case legally prescribed in 1995. Fifty years later, the walls of Los Galindos still keep the secret of who ordered the trigger pulled.</blockquote>

<hr>

<h2>🌍 International Connection: Rural Estate Massacres</h2>

<p>The Los Galindos Crime shares chilling parallels with other international cases:</p>

<ul>
<li><strong>The Hinterkaifeck Massacre (Germany, 1922):</strong> Six people hacked to death on an isolated Bavarian farm. The killer lived with the corpses for days. Never solved.</li>
<li><strong>The Lawson Family Murders (USA, 1929):</strong> A North Carolina farmer killed his wife and six children on Christmas Eve for reasons still debated.</li>
<li><strong>Los Galindos (Spain, 1975):</strong> Five dead, a million-dollar fraud, and a wall of silence that Spanish justice never managed to break through.</li>
</ul>

<div class="caso-footer-copyright">© UNSOLVED CASES ARCHIVE - EXCLUSIVE PROPERTY OF THE BUNKER (EXPEDIENTEXGRANAINO)</div>
`;

// =========================================
// CASO 4: LOS NOVIOS DE JAÉN
// =========================================
const caso4_es = `
<h2>💔 La Tragedia: Una Cita que Terminó en Pesadilla</h2>

<p><strong>Óscar Arroyo</strong> (21 años) y <strong>Ana María Torres</strong> (19 años) eran una pareja normal que planeaba casarse pronto. El <strong>7 de junio de 1992</strong>, una tarde lluviosa de domingo, decidieron salir. Lo que iba a ser una tarde de cine terminó en un descampado a las afueras de Jaén, en el paraje conocido como el <strong>Camino de las Cuevas</strong>.</p>

<hr>

<h2>🔍 La Escena del Crimen y la Cadena de Errores</h2>

<p>Al día siguiente, al ver que no regresaban, comenzó la búsqueda. Un pastor localizó el coche de la pareja y la escena fue dantesca:</p>

<ul>
<li><strong>Óscar</strong> fue hallado en el interior del vehículo. Estaba desnudo y presentaba <strong>dos disparos de escopeta a bocajarro</strong> (uno en el hombro y otro mortal en la cabeza).</li>
<li><strong>Ana María</strong> no aparecía. La policía detuvo la búsqueda esa tarde debido al cambio de turno y a la intensa lluvia. No la encontraron hasta casi dos días después, a unos 200 metros del coche. La habían violado y la <strong>asesinaron de un disparo por la espalda</strong> mientras estaba de rodillas.</li>
</ul>

<h3>El Desastre Forense</h3>

<ul>
<li><strong>La lluvia torrencial</strong> destrozó los indicios biológicos en el suelo.</li>
<li><strong>El carrete de fotos</strong> que la policía tomó de la escena del crimen se colocó mal en la cámara y nunca se pudo revelar.</li>
<li><strong>Las muestras biológicas</strong> de la agresión se enviaron a Sevilla sin los conservantes adecuados, por lo que llegaron completamente corrompidas.</li>
</ul>

<hr>

<h2>⚖️ Los Juicios y la Impunidad</h2>

<p>A pesar de las dificultades, en 1995 el caso pareció dar un vuelco gracias al testimonio de un mendigo que solía refugiarse en un cortijo abandonado de la zona (<strong>La Casimira</strong>). El hombre aseguró que la noche de los hechos vio a dos delincuentes habituales con un amplio historial delictivo llevar a la chica al cortijo y alardear del crimen.</p>

<p>Se llegó a celebrar un <strong>juicio contra los sospechosos</strong>, pero el testimonio del testigo clave fue considerado poco creíble por sus contradicciones y sus problemas con el alcohol. Los acusados terminaron absueltos por falta de pruebas.</p>

<p>Años más tarde, la policía logró grabar a los sospechosos en la cárcel hablando de <em>"ir a buscar las armas que tú sabes"</em>, lo que provocó un segundo juicio. Sin embargo, las grabaciones se escuchaban tan mal que el tribunal las desestimó. <strong>Volvieron a salir absueltos.</strong></p>

<hr>

<h2>⏳ El Final de la Historia: Prescripción e Impunidad</h2>

<p>En el año <strong>2012</strong>, al cumplirse exactamente 20 años de los asesinatos, el delito prescribió por completo.</p>

<blockquote>Hoy en día, aunque apareciera la escopeta con las huellas perfectas del asesino o alguien confesara el crimen detalladamente, la ley ya no permite juzgar a nadie. El crimen de los novios quedó impune para siempre.</blockquote>

<hr>

<h2>🌍 Conexión Internacional: Parejas Asesinadas en Crímenes Sin Resolver</h2>

<p>El caso de los Novios de Jaén forma parte de una lista escalofriante de parejas jóvenes asesinadas en crímenes que desafiaron a la justicia:</p>

<ul>
<li><strong>Los Asesinatos del Zodiac (EE.UU., 1968-1969):</strong> El asesino en serie del Zodiac atacó a varias parejas jóvenes en coches aparcados en zonas remotas de California. Nunca fue identificado.</li>
<li><strong>El Monstruo de Florencia (Italia, 1968-1985):</strong> Un asesino en serie que ejecutó a parejas de enamorados en parajes rurales de la Toscana durante casi dos décadas.</li>
<li><strong>Los Novios de Jaén (España, 1992):</strong> Una pareja asesinada en un descampado, una investigación plagada de errores irreparables y un crimen que prescribió dejando a las familias sin justicia.</li>
</ul>

<div class="caso-footer-copyright">© ARCHIVO DE SUCESOS SIN RESOLVER - PROPIEDAD EXCLUSIVA DEL BÚNKER (EXPEDIENTEXGRANAINO)</div>
`;

const caso4_en = `
<h2>💔 The Tragedy: A Date That Turned Into a Nightmare</h2>

<p><strong>Óscar Arroyo</strong> (21) and <strong>Ana María Torres</strong> (19) were a young, ordinary couple planning to get married soon. On <strong>Sunday, June 7, 1992</strong>, a terribly rainy afternoon, they decided to go out. What was supposed to be a movie date ended in a desolate wasteland on the outskirts of Jaén, in a place known as <strong>El Camino de las Cuevas</strong> (The Path of the Caves).</p>

<hr>

<h2>🔍 The Crime Scene and the Chain of Errors</h2>

<p>The following day, after an intense search by their families, a local shepherd spotted the couple's car. The scene was absolutely devastating:</p>

<ul>
<li><strong>Óscar</strong> was found dead inside the car. He was naked and had been shot <strong>twice at point-blank range with a shotgun</strong>—once in the shoulder and a second, fatal shot to the head.</li>
<li><strong>Ana María</strong> was nowhere to be found. Due to a shift change and torrential rain, police halted the search. Her body was discovered two days later, about 200 meters away. She had been brutally assaulted and <strong>executed with a shotgun blast to her back</strong> while kneeling.</li>
</ul>

<h3>The Forensic Disaster</h3>

<ul>
<li><strong>Torrential rain</strong> washed away crucial tire tracks and footprints.</li>
<li><strong>The film reel</strong> in the police camera was misaligned—every photograph of the original crime scene was lost.</li>
<li><strong>Biological samples</strong> were sent to a lab in Seville without proper preservation, arriving completely corrupted.</li>
</ul>

<hr>

<h2>⚖️ The Trials and Absolute Impunity</h2>

<p>In 1995, the case seemed to take a turn when a homeless man who sheltered in a nearby abandoned farmhouse (<strong>La Casimira</strong>) claimed he saw two well-known local criminals dragging the girl into the ruins and boasting about the murder.</p>

<p>A <strong>trial was held</strong>, but the witness's testimony was deemed unreliable due to contradictions and alcohol struggles. The suspects were acquitted.</p>

<p>Years later, police managed to wiretap the suspects in prison, recording them talking about <em>"retrieving the weapons you know about."</em> This triggered a second trial, but the audio quality was so poor that the judge dismissed it. <strong>Once again, they walked free.</strong></p>

<hr>

<h2>⏳ The End of the Road: Statute of Limitations</h2>

<p>In <strong>2012</strong>, exactly 20 years after the murders, the statute of limitations expired.</p>

<blockquote>Today, even if the murder weapon appeared covered in perfect fingerprints or someone walked into a police station and confessed, nobody can ever be prosecuted. The crime of the "Novios de Jaén" remains unpunished forever.</blockquote>

<hr>

<h2>🌍 International Connection: Couples Murdered in Unsolved Crimes</h2>

<p>The Novios de Jaén case is part of a chilling list of young couples murdered in crimes that defied justice:</p>

<ul>
<li><strong>The Zodiac Murders (USA, 1968-1969):</strong> The Zodiac serial killer attacked several young couples in parked cars in remote California areas. He was never identified.</li>
<li><strong>The Monster of Florence (Italy, 1968-1985):</strong> A serial killer who executed couples in rural Tuscan areas for nearly two decades.</li>
<li><strong>The Novios de Jaén (Spain, 1992):</strong> A couple murdered in a wasteland, an investigation riddled with irreparable errors, and a crime that expired leaving the families without justice.</li>
</ul>

<div class="caso-footer-copyright">© UNSOLVED CASES ARCHIVE - EXCLUSIVE PROPERTY OF THE BUNKER (EXPEDIENTEXGRANAINO)</div>
`;

// =========================================
// CASO 5: MARÍA TERESA FERNÁNDEZ (MOTRIL)
// =========================================
const caso5_es = `
<h2>🎙️ Introducción: La Noche en que se Detuvo el Tiempo</h2>

<p><strong>Clasificación:</strong> Desaparición de Alto Riesgo / Expediente Sin Resolver</p>
<p><strong>Fecha del suceso:</strong> 18 de Agosto de 2000</p>
<p><strong>Origen:</strong> Archivos Policiales y Crónica de Sucesos de Granada</p>

<p>El 18 de agosto del año 2000, la ciudad costera de <strong>Motril</strong> se vestía de gala para celebrar sus tradicionales fiestas patronales. Entre la multitud que abarrotaba las calles se encontraba <strong>María Teresa Fernández</strong>, una joven de 18 años con toda la vida por delante. Aquella tarde de verano, la luz de María Teresa se apagó en pleno centro urbano, dando comienzo a uno de los misterios más dolorosos, complejos y desgarradores de la <strong>crónica negra andaluza</strong>. Un cuarto de siglo después, el Búnker abre este expediente para que su nombre no quede sepultado por el silencio.</p>

<hr>

<h2>🛑 El Último Rastro en el Centro de Motril</h2>

<p>La reconstrucción de los hechos sitúa la última pista en torno a las ocho de la tarde. El padre de María Teresa la trasladó en coche desde el domicilio familiar hasta una céntrica parada de autobús en la <strong>avenida de Andalucía</strong>. La joven había quedado allí con su novio y su grupo de amigos para acudir juntos a un concierto en el recinto ferial. Sin embargo, María Teresa nunca llegó a subirse a ese autobús ni llegó a encontrarse con sus seres queridos.</p>

<blockquote>El último hito tecnológico de la noche quedó registrado a las 21:53 horas. Su novio recibió un mensaje de texto (SMS) desde el teléfono de la joven que decía literalmente: "Puede que tarde, pero voy. Espérame". Minutos después de enviar ese mensaje, el terminal se apagó para siempre.</blockquote>

<p>A partir de ese instante, la tierra pareció tragarse a la joven motrileña sin que nadie en una zona completamente concurrida viera o escuchara nada sospechoso.</p>

<hr>

<h2>🔍 Veinticinco Años de Búsqueda a Ciegas</h2>

<p>El despliegue policial y ciudadano en la <strong>Costa Tropical</strong> fue inmediato y masivo. Vecinos, voluntarios y fuerzas de seguridad peinaron campos, pozos, invernaderos y barrancos de la comarca sin obtener un solo resultado.</p>

<p>A lo largo de los años, los investigadores de la <strong>Policía Nacional</strong> han abierto múltiples líneas de trabajo que terminaron en callejones sin salida:</p>

<ul>
<li><strong>Falsos testimonios</strong> y llamadas de extorsión a la familia.</li>
<li><strong>Investigaciones minuciosas</strong> para intentar conectar el caso con peligrosos criminales itinerantes de la época.</li>
<li><strong>Ninguna teoría</strong> pudo sostenerse con pruebas biológicas o materiales.</li>
</ul>

<hr>

<h2>🌍 Conexión Internacional: Desapariciones en Plena Multitud</h2>

<p>El caso de María Teresa pertenece a la categoría más perturbadora de la criminología: personas que se evaporan en zonas públicas y concurridas sin dejar rastro:</p>

<ul>
<li><strong>Natalee Holloway (Aruba, 2005):</strong> Una estudiante estadounidense de 18 años que desapareció durante un viaje de fin de curso en una isla turística repleta de gente. El caso tardó casi dos décadas en resolverse.</li>
<li><strong>Madeleine McCann (Portugal, 2007):</strong> La niña británica de 3 años que desapareció de un resort vacacional del Algarve mientras sus padres cenaban a pocos metros. El caso sigue sin cerrarse.</li>
<li><strong>María Teresa Fernández (España, 2000):</strong> Desapareció en plenas fiestas patronales de Motril, rodeada de miles de personas, después de enviar un SMS que se convirtió en su último mensaje al mundo.</li>
</ul>

<hr>

<h2>⏳ La Esperanza Indestructible de una Familia</h2>

<p>Hoy en día, las dependencias policiales mantienen el expediente de María Teresa como una <strong>prioridad absoluta</strong> de la sección de desaparecidos, negándose a archivar el caso. Sus padres, <strong>Antonio y Teresa</strong>, se han convertido en un símbolo de lucha inquebrantable en toda España, acudiendo a los medios de comunicación año tras año para exigir que la investigación no muera y que los recursos no se detengan.</p>

<blockquote>Motril sigue albergando una herida abierta en sus calles, una pregunta congelada en el tiempo que espera, tarde o temprano, encontrar la verdad.</blockquote>

<div class="caso-footer-copyright">© ARCHIVO DE SUCESOS SIN RESOLVER - PROPIEDAD EXCLUSIVA DEL BÚNKER (EXPEDIENTEXGRANAINO)</div>
`;

const caso5_en = `
<h2>🎙️ Introduction: The Night Time Stood Still</h2>

<p><strong>Classification:</strong> High-Risk Disappearance / Unsolved Case</p>
<p><strong>Date of the Event:</strong> August 18, 2000</p>
<p><strong>Source:</strong> Police Records and Granada Crime Archives</p>

<p>On August 18, 2000, the coastal city of <strong>Motril</strong> was dressed in style to celebrate its traditional patron saint festivities. Among the crowds packing the streets was <strong>María Teresa Fernández</strong>, an 18-year-old girl with her whole life ahead of her. On that summer evening, María Teresa's light was extinguished in the heart of the urban center, marking the beginning of one of the most painful, complex, and heartbreaking mysteries in <strong>Andalusian crime history</strong>. A quarter of a century later, the Bunker opens this case file so that her name is never buried by silence.</p>

<hr>

<h2>🛑 The Last Trace in Downtown Motril</h2>

<p>The reconstruction of events places the last clue around eight o'clock in the evening. María Teresa's father drove her from the family home to a central bus stop on <strong>Andalucía Avenue</strong>. The young woman had arranged to meet her boyfriend and friends there to attend a concert at the fairgrounds. However, María Teresa never boarded that bus, nor did she ever meet her loved ones.</p>

<blockquote>The last technological milestone of the night was recorded at 9:53 p.m. Her boyfriend received a text message (SMS) from her phone that literally read: "I might be late, but I'm coming. Wait for me." Minutes after sending that message, the phone was turned off forever.</blockquote>

<p>From that exact moment, the earth seemed to swallow the young woman from Motril, without anyone in a completely crowded area seeing or hearing anything suspicious.</p>

<hr>

<h2>🔍 Twenty-Five Years of Searching in the Dark</h2>

<p>The police and citizen deployment in the <strong>Costa Tropical</strong> region was immediate and massive. Neighbors, volunteers, and security forces combed fields, wells, greenhouses, and ravines across the county without a single result.</p>

<p>Over the years, <strong>National Police</strong> investigators have pursued multiple lines of work that ended in dead ends:</p>

<ul>
<li><strong>False testimonies</strong> and extortion calls to the family.</li>
<li><strong>Meticulous investigations</strong> attempting to connect the case with dangerous traveling criminals of the era.</li>
<li><strong>No theory</strong> could ever be backed by biological or material evidence.</li>
</ul>

<hr>

<h2>🌍 International Connection: Disappearances in Plain Sight</h2>

<p>María Teresa's case belongs to the most disturbing category in criminology: people who vanish in public, crowded areas without leaving a trace:</p>

<ul>
<li><strong>Natalee Holloway (Aruba, 2005):</strong> An 18-year-old American student who disappeared during a graduation trip on a tourist island packed with people. The case took nearly two decades to resolve.</li>
<li><strong>Madeleine McCann (Portugal, 2007):</strong> The 3-year-old British girl who disappeared from an Algarve holiday resort while her parents dined meters away. The case remains open.</li>
<li><strong>María Teresa Fernández (Spain, 2000):</strong> Disappeared during Motril's patron saint festivities, surrounded by thousands, after sending an SMS that became her last message to the world.</li>
</ul>

<hr>

<h2>⏳ The Unbreakable Hope of a Family</h2>

<p>Today, police departments maintain María Teresa's file as an <strong>absolute priority</strong> for the missing persons unit, refusing to close the case. Her parents, <strong>Antonio and Teresa</strong>, have become a symbol of unyielding struggle throughout Spain, appearing in the media year after year to demand that the investigation does not die.</p>

<blockquote>Motril still harbors an open wound in its streets, a question frozen in time that hopes, sooner or later, to find the truth.</blockquote>

<div class="caso-footer-copyright">© UNSOLVED CASES ARCHIVE - EXCLUSIVE PROPERTY OF THE BUNKER (EXPEDIENTEXGRANAINO)</div>
`;

// =========================================
// TÍTULOS SEO NUEVOS
// =========================================
const titulos = {
    2: { es: "Crónica Negra: La Leyenda del Cortijo Jurado (Málaga)", en: "True Crime: The Legend of Cortijo Jurado (Málaga)" },
    3: { es: "Crónica Negra: El Crimen de Los Galindos (Sevilla, 1975)", en: "True Crime: The Los Galindos Massacre (Seville, 1975)" },
    4: { es: "Crónica Negra: El Crimen de los Novios de Jaén (1992)", en: "True Crime: The Murder of the Jaén Sweethearts (1992)" },
    5: { es: "Expediente: El Enigma de María Teresa Fernández (Motril, 2000)", en: "Case File: The Enigma of María Teresa Fernández (Motril, 2000)" }
};

const contenidos = {
    2: { es: caso2_es, en: caso2_en },
    3: { es: caso3_es, en: caso3_en },
    4: { es: caso4_es, en: caso4_en },
    5: { es: caso5_es, en: caso5_en }
};

async function actualizarTodos() {
    try {
        for (const id of [2, 3, 4, 5]) {
            await db.execute(
                "UPDATE casos_abiertos SET titulo = ?, contenido = ?, titulo_en = ?, contenido_en = ? WHERE id = ?",
                [titulos[id].es, contenidos[id].es.trim(), titulos[id].en, contenidos[id].en.trim(), id]
            );
            console.log(`✅ Caso ${id} actualizado: "${titulos[id].es}"`);
        }
        console.log("\n🎉 ¡TODOS LOS CASOS ACTUALIZADOS CON ÉXITO!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

actualizarTodos();
