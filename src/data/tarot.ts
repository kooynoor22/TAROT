import { cloudinaryFiles } from './filenames';

export interface TarotCard {
  id: string;
  index: number;
  name: string;
  type: 'major' | 'minor' | 'lenormand';
  suit?: 'bastos' | 'copas' | 'espadas' | 'oros';
  value?: string;
  number?: number; // For Lenormand (1-36)
  iconName?: string; // For Lenormand icons
  playingCard?: string; // For Lenormand inserts
}

export const TRADITIONS = [
  { 
    id: 'rws', 
    name: 'Rider-Waite-Smith', 
    desc: 'Simbología mística de 1910 con ricas escenas ilustradas, ideal para auto-descubrimiento y lecturas intuitivas.' 
  },
  { 
    id: 'marsella', 
    name: 'Tarot de Marsella', 
    desc: 'La tradición renacentista de Europa medieval. Estilo xilográfico, colores primarios puros y arquetipos directos.' 
  },
  { 
    id: 'egipcio', 
    name: 'Tarot Egipcio', 
    desc: 'La corriente hermética más antigua. Integra correspondencias astrológicas, cábala y jeroglíficos en tres planos.' 
  },
  { 
    id: 'lenormand', 
    name: 'Oráculo Lenormand', 
    desc: 'Mazo francés de 36 cartas con símbolos cotidianos y concretos para predicciones claras y prácticas del día a día.' 
  }
];

export const DECKS = [
  { id: '1909-pam-a', name: '1909PamA' },
  { id: '1910-pam-a', name: '1910PamA' },
  { id: '1920s-pam-b', name: '1920sPamB' },
  { id: '1920s-1930s-pam-c', name: '1920s1930sPamC' }
];

export function getCloudinaryUrl(cardIndex: number, deckId: string) {
  const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'dd4knv7yn';
  const fileName = cloudinaryFiles[cardIndex];
  if (!fileName) return '';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${encodeURIComponent(fileName)}`;
}

export function getCloudinaryBackUrl(deckId: string) {
  const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'dd4knv7yn';
    
  return `https://res.cloudinary.com/${cloudName}/image/upload/back.jpg`;
}

const majorArcanaNames = [
  "El Loco", "El Mago", "La Suma Sacerdotisa", "La Emperatriz", "El Emperador",
  "El Hierofante", "Los Enamorados", "El Carro", "La Fuerza", "El Ermitaño",
  "La Rueda de la Fortuna", "La Justicia", "El Colgado", "La Muerte",
  "La Templanza", "El Diablo", "La Torre", "La Estrella", "La Luna",
  "El Sol", "El Juicio", "El Mundo"
];

const suits: ('bastos' | 'copas' | 'espadas' | 'oros')[] = ['bastos', 'copas', 'espadas', 'oros'];
const minorValues = ['As', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Sota', 'Caballero', 'Reina', 'Rey'];

// Generate default 78-card Tarot Deck
export const tarotDeck: TarotCard[] = [];

// Populate Major Arcana (0-21)
majorArcanaNames.forEach((name, index) => {
  tarotDeck.push({
    id: `major-${index}`,
    index,
    name,
    type: 'major'
  });
});

// Populate Minor Arcana
let globalIndex = 22;
suits.forEach(suit => {
  minorValues.forEach(value => {
    tarotDeck.push({
      id: `minor-${suit}-${value}`,
      index: globalIndex++,
      name: `${value} de ${suit.charAt(0).toUpperCase() + suit.slice(1)}`,
      type: 'minor',
      suit,
      value
    });
  });
});

// Lenormand Deck definition (36 cards)
export const lenormandDeck: TarotCard[] = [
  { id: 'len-1', index: 0, name: 'El Jinete', type: 'lenormand', number: 1, iconName: 'Compass', playingCard: '9 ♥' },
  { id: 'len-2', index: 1, name: 'El Trébol', type: 'lenormand', number: 2, iconName: 'Sparkles', playingCard: '6 ♦' },
  { id: 'len-3', index: 2, name: 'El Barco', type: 'lenormand', number: 3, iconName: 'Ship', playingCard: '10 ♠' },
  { id: 'len-4', index: 3, name: 'La Casa', type: 'lenormand', number: 4, iconName: 'Home', playingCard: 'K ♥' },
  { id: 'len-5', index: 4, name: 'El Árbol', type: 'lenormand', number: 5, iconName: 'Trees', playingCard: '7 ♥' },
  { id: 'len-6', index: 5, name: 'Las Nubes', type: 'lenormand', number: 6, iconName: 'Cloud', playingCard: 'K ♣' },
  { id: 'len-7', index: 6, name: 'La Serpiente', type: 'lenormand', number: 7, iconName: 'Worm', playingCard: 'Q ♣' },
  { id: 'len-8', index: 7, name: 'El Ataúd', type: 'lenormand', number: 8, iconName: 'Skull', playingCard: '9 ♦' },
  { id: 'len-9', index: 8, name: 'El Ramo de Flores', type: 'lenormand', number: 9, iconName: 'Flower', playingCard: 'Q ♠' },
  { id: 'len-10', index: 9, name: 'La Guadaña', type: 'lenormand', number: 10, iconName: 'Scissors', playingCard: 'J ♦' },
  { id: 'len-11', index: 10, name: 'La Vara / El Látigo', type: 'lenormand', number: 11, iconName: 'Flame', playingCard: 'J ♣' },
  { id: 'len-12', index: 11, name: 'Los Pájaros', type: 'lenormand', number: 12, iconName: 'Twitter', playingCard: '7 ♦' },
  { id: 'len-13', index: 12, name: 'La Niña', type: 'lenormand', number: 13, iconName: 'Smile', playingCard: 'J ♠' },
  { id: 'len-14', index: 13, name: 'El Zorro', type: 'lenormand', number: 14, iconName: 'Eye', playingCard: '9 ♣' },
  { id: 'len-15', index: 14, name: 'El Oso', type: 'lenormand', number: 15, iconName: 'Shield', playingCard: '10 ♣' },
  { id: 'len-16', index: 15, name: 'Las Estrellas', type: 'lenormand', number: 16, iconName: 'Stars', playingCard: '6 ♥' },
  { id: 'len-17', index: 16, name: 'La Cigüeña', type: 'lenormand', number: 17, iconName: 'Send', playingCard: 'Q ♥' },
  { id: 'len-18', index: 17, name: 'El Perro', type: 'lenormand', number: 18, iconName: 'Heart', playingCard: '10 ♥' },
  { id: 'len-19', index: 18, name: 'La Torre', type: 'lenormand', number: 19, iconName: 'Hotel', playingCard: '6 ♠' },
  { id: 'len-20', index: 19, name: 'El Jardín', type: 'lenormand', number: 20, iconName: 'Palmtree', playingCard: '8 ♠' },
  { id: 'len-21', index: 20, name: 'La Montaña', type: 'lenormand', number: 21, iconName: 'Mountain', playingCard: '8 ♣' },
  { id: 'len-22', index: 21, name: 'El Camino', type: 'lenormand', number: 22, iconName: 'GitFork', playingCard: 'Q ♦' },
  { id: 'len-23', index: 22, name: 'Los Ratones', type: 'lenormand', number: 23, iconName: 'Bug', playingCard: '7 ♣' },
  { id: 'len-24', index: 23, name: 'El Corazón', type: 'lenormand', number: 24, iconName: 'HeartHandshake', playingCard: 'J ♥' },
  { id: 'len-25', index: 24, name: 'El Anillo', type: 'lenormand', number: 25, iconName: 'Award', playingCard: 'A ♣' },
  { id: 'len-26', index: 25, name: 'El Libro', type: 'lenormand', number: 26, iconName: 'BookOpen', playingCard: '10 ♦' },
  { id: 'len-27', index: 26, name: 'La Carta', type: 'lenormand', number: 27, iconName: 'Mail', playingCard: '7 ♠' },
  { id: 'len-28', index: 27, name: 'El Caballero', type: 'lenormand', number: 28, iconName: 'User', playingCard: 'A ♥' },
  { id: 'len-29', index: 28, name: 'La Dama', type: 'lenormand', number: 29, iconName: 'UserCheck', playingCard: 'A ♠' },
  { id: 'len-30', index: 29, name: 'Los Lirios', type: 'lenormand', number: 30, iconName: 'SunDim', playingCard: 'K ♠' },
  { id: 'len-31', index: 30, name: 'El Sol', type: 'lenormand', number: 31, iconName: 'Sun', playingCard: 'A ♦' },
  { id: 'len-32', index: 31, name: 'La Luna', type: 'lenormand', number: 32, iconName: 'Moon', playingCard: '8 ♥' },
  { id: 'len-33', index: 32, name: 'La Llave', type: 'lenormand', number: 33, iconName: 'Key', playingCard: '8 ♦' },
  { id: 'len-34', index: 33, name: 'Los Peces', type: 'lenormand', number: 34, iconName: 'Coins', playingCard: 'K ♦' },
  { id: 'len-35', index: 34, name: 'El Ancla', type: 'lenormand', number: 35, iconName: 'Anchor', playingCard: '9 ♠' },
  { id: 'len-36', index: 35, name: 'La Cruz', type: 'lenormand', number: 36, iconName: 'Activity', playingCard: '6 ♣' }
];

export function getDeckForTradition(traditionId: string): TarotCard[] {
  if (traditionId === 'lenormand') {
    return lenormandDeck;
  }
  return tarotDeck;
}

// Dynamically generate high quality readings based on tradition & card
export interface Interpretation {
  title: string;
  traditionName: string;
  meaning: string;
  obstacle: string;
  advice: string;
  aspect: string;
}

export function getInterpretation(card: TarotCard, traditionId: string): Interpretation {
  const isLenormand = card.type === 'lenormand';
  const tradition = TRADITIONS.find(t => t.id === traditionId) || TRADITIONS[0];
  
  if (isLenormand) {
    const lenMeanings: Record<number, { meaning: string; obstacle: string; advice: string; aspect: string }> = {
      1: { meaning: 'Llegada de noticias, visitas inesperadas, dinamismo y rapidez en los asuntos pendientes.', obstacle: 'Falta de dirección, prisas imprudentes, noticias perturbadoras.', advice: 'Actúa con prontitud y mantente abierto a la comunicación exterior.', aspect: 'Movimiento / Comunicación' },
      2: { meaning: 'Suerte efímera, felicidad momentánea, pequeñas alegrías y sorpresas agradables.', obstacle: 'Optimismo ciego, confiarse en exceso, desaprovechar la oportunidad.', advice: 'Disfruta el momento y aprovecha la brisa de buena suerte hoy mismo.', aspect: 'Suerte / Fortuna' },
      3: { meaning: 'Viaje físico o metafórico, anhelo, ansia de libertad, expansión comercial o personal.', obstacle: 'Inquietud constante, huida de los problemas, nostalgia paralizante.', advice: 'Emprende el viaje con valentía; el cambio de horizonte te renovará.', aspect: 'Viajes / Distancia' },
      4: { meaning: 'El hogar, la familia nuclear, privacidad, estabilidad, seguridad emocional y física.', obstacle: 'Aislamiento doméstico, rigidez familiar, dependencia del pasado.', advice: 'Refúgiate en tus raíces y fortalece los lazos de confianza en tu núcleo.', aspect: 'Hogar / Estabilidad' },
      5: { meaning: 'Salud, energía vital, paciencia, crecimiento espiritual, estabilidad a largo plazo.', obstacle: 'Cansancio físico, estancamiento, problemas de salud no atendidos.', advice: 'Tómate las cosas con calma y permite que tus proyectos echen raíces profundas.', aspect: 'Salud / Crecimiento' },
      6: { meaning: 'Incertidumbre, confusión, malentendidos temporales, falta de claridad.', obstacle: 'Angustia mental, pánico, incapacidad de tomar decisiones lógicas.', advice: 'Espera a que pase la tormenta; el viento pronto dispersará las nubes.', aspect: 'Incertidumbre / Dudas' },
      7: { meaning: 'Desafíos, astucia, inteligencia analítica, persona rival o situación sinuosa.', obstacle: 'Traición, hipocresía, mentiras destructivas a tu alrededor.', advice: 'Sé prudente, observa con atención las intenciones ajenas y actúa con astucia.', aspect: 'Prudencia / Inteligencia' },
      8: { meaning: 'Transformación profunda, finales necesarios, duelo, renovación radical o fin de un ciclo.', obstacle: 'Resistencia dolorosa al cambio, depresión, pérdidas estancadas.', advice: 'Acepta el final de esta etapa para que lo nuevo pueda nacer en su lugar.', aspect: 'Transformación / Fin' },
      9: { meaning: 'Felicidad plena, regalos inesperados, reconocimiento social, armonía y aprecio.', obstacle: 'Superficialidad, vanidad, compromisos sociales vacíos.', advice: 'Acepta los regalos de la vida con gratitud y comparte tu alegría con los demás.', aspect: 'Felicidad / Regalos' },
      10: { meaning: 'Decisiones repentinas, cortes tajantes, rupturas necesarias, peligro evitado por acción rápida.', obstacle: 'Accidentes, agresividad verbal, pérdida repentina y dolorosa.', advice: 'Corta de raíz lo que te daña; la firmeza y la rapidez son tus aliadas hoy.', aspect: 'Cortes / Decisiones' },
      11: { meaning: 'Discusión acalorada, debates intelectuales, conflicto físico o verbal, estrés repetitivo.', obstacle: 'Auto-castigo, relaciones tóxicas obsesivas, violencia o ira desmedida.', advice: 'Canaliza la tensión mediante ejercicio físico y evita debates infructuosos.', aspect: 'Tensión / Conflicto' },
      12: { meaning: 'Conversaciones animadas, llamadas telefónicas, nerviosismo excitante, vida social activa.', obstacle: 'Chismes destructivos, cotilleo sin fundamento, ansiedad social.', advice: 'Comunícate de forma constructiva y no prestes atención a los rumores pasajeros.', aspect: 'Vida Social / Nervios' },
      13: { meaning: 'Nuevos comienzos puros, inocencia, espontaneidad, frescura, infancia o un hijo.', obstacle: 'Ingenuidad excesiva, inmadurez para afrontar responsabilidades.', advice: 'Aborda la situación con ojos nuevos y curiosidad infantil libre de prejuicios.', aspect: 'Inocencia / Inicios' },
      14: { meaning: 'Trabajo inteligente, astucia estratégica, adaptabilidad, instinto de supervivencia.', obstacle: 'Engaño laboral, manipulación sutil, agendas ocultas de terceros.', advice: 'Mantente alerta y protege tus intereses usando tu intelecto y discreción.', aspect: 'Estrategia / Trabajo' },
      15: { meaning: 'Poder, autoridad protectora, liderazgo, finanzas estables, fuerza de voluntad.', obstacle: 'Abuso de poder, celos territoriales, autoritarismo opresor.', advice: 'Asume tu propio poder y defiende tus límites con firmeza y soberanía.', aspect: 'Fuerza / Finanzas' },
      16: { meaning: 'Claridad mental, guía cósmica, esperanzas realizadas, inspiración y buena estrella.', obstacle: 'Falta de dirección, ilusiones irreales, perder el norte en la oscuridad.', advice: 'Sigue tu brújula interior; el universo te está guiando hacia tu propósito divino.', aspect: 'Esperanza / Guía' },
      17: { meaning: 'Cambios positivos, mudanzas, evolución favorable, renovación del entorno.', obstacle: 'Inestabilidad geográfica, resistencia a los cambios naturales de la vida.', advice: 'Acepta la transición con flexibilidad; el cambio te traerá mejoras reales.', aspect: 'Evolución / Cambio' },
      18: { meaning: 'Fidelidad, amistad incondicional, apoyo mutuo, lealtad y confianza absoluta.', obstacle: 'Lealtad ciega a personas equivocadas, codependencia emocional.', advice: 'Apóyate en tus verdaderos amigos y sé fiel a tus propios principios morales.', aspect: 'Amistad / Lealtad' },
      19: { meaning: 'Perspectiva elevada, instituciones formales, autoridad, soledad constructiva, ambición.', obstacle: 'Aislamiento defensivo, burocracia opresora, frialdad emocional.', advice: 'Observa la situación desde arriba y mantén tu integridad frente a las normas.', aspect: 'Perspectiva / Leyes' },
      20: { meaning: 'Encuentros sociales, eventos públicos, redes de apoyo, comunidad y esparcimiento.', obstacle: 'Presión social, falsas apariencias en público, dispersión energética.', advice: 'Sal al mundo, comparte con tu comunidad y enriquece tus relaciones sociales.', aspect: 'Comunidad / Público' },
      21: { meaning: 'Gran desafío, bloqueo temporal, retraso que exige esfuerzo, resistencia física.', obstacle: 'Obstáculo insalvable si te empeñas en chocar de frente, testarudez.', advice: 'Rodéate del problema o asciende con paciencia; la montaña requiere paso firme.', aspect: 'Obstáculos / Bloqueo' },
      22: { meaning: 'Opciones de vida, bifurcación en el camino, toma de decisiones cruciales.', obstacle: 'Indecisión paralizante, tomar el camino fácil pero perjudicial, extravío.', advice: 'Evalúa tus opciones con calma y asume la responsabilidad de tu elección.', aspect: 'Elección / Caminos' },
      23: { meaning: 'Desgaste sutil, estrés cotidiano, pequeñas pérdidas financieras o de energía.', obstacle: 'Robos significativos, preocupación destructiva, autosabotaje por ansiedad.', advice: 'Identifica qué está consumiendo tus recursos y pon límites de inmediato.', aspect: 'Desgaste / Estrés' },
      24: { meaning: 'Amor romántico, pasión sincera, afecto mutuo, reconciliación y generosidad.', obstacle: 'Celos posesivos, amor no correspondido, desborde dramático emocional.', advice: 'Sigue los dictados de tu corazón y actúa con amor incondicional hacia ti y otros.', aspect: 'Amor / Afecto' },
      25: { meaning: 'Compromiso formal, pactos, contratos comerciales, matrimonio o unión sólida.', obstacle: 'Relación o acuerdo restrictivo, dar vueltas en círculos sin avanzar.', advice: 'Cumple tu palabra y busca acuerdos donde todas las partes salgan ganando.', aspect: 'Unión / Compromiso' },
      26: { meaning: 'Secretos resguardados, estudios, conocimiento técnico, misterios por revelar.', obstacle: 'Ocultamiento de información vital, ignorancia voluntaria de la realidad.', advice: 'Investiga a fondo y mantén tus planes en privado hasta que estén listos.', aspect: 'Secretos / Saber' },
      27: { meaning: 'Documentos formales, noticias escritas, correos electrónicos, comunicación oficial.', obstacle: 'Retraso de noticias, papelería confusa, malentendidos por escrito.', advice: 'Escribe tus pensamientos claramente y lee la letra pequeña de cada papel.', aspect: 'Documentos / Mensaje' },
      28: { meaning: 'Acción masculina, racionalidad, el propio consultante (si es hombre) o una figura paterna/pareja.', obstacle: 'Rigidez machista, agresividad reprimida, desconexión de los sentimientos.', advice: 'Utiliza la lógica, la estructura y toma la iniciativa de forma caballerosa.', aspect: 'Energía Masculina' },
      29: { meaning: 'Intuición receptiva, sensibilidad, la propia consultante (si es mujer) o una figura materna/pareja.', obstacle: 'Hipersensibilidad paralizante, pasividad extrema, sumisión.', advice: 'Escucha tu sabiduría interior y adopta un papel receptivo y contenedor.', aspect: 'Energía Femenina' },
      30: { meaning: 'Paz, armonía familiar, madurez serena, pureza de intenciones, virtud.', obstacle: 'Frialdad en el hogar, hipocresía puritana, retraso por exceso de calma.', advice: 'Actúa con honestidad y permite que la serenidad del tiempo ordene todo.', aspect: 'Paz / Madurez' },
      31: { meaning: 'Éxito rotundo, energía vital radiante, optimismo, fuerza creativa y calor.', obstacle: 'Egocentrismo desmedido, quemar puentes, insolación o agotamiento.', advice: 'Brilla con luz propia, comparte tu energía y mantén viva tu pasión creadora.', aspect: 'Éxito / Vitalidad' },
      32: { meaning: 'Fama, reconocimiento público, intuición profunda, emociones nocturnas y sueños.', obstacle: 'Fantasías irreales, miedo al fracaso público, inestabilidad emocional.', advice: 'Confía en tus pálpitos y permite que tu trabajo sea valorado públicamente.', aspect: 'Intuición / Reconocimiento' },
      33: { meaning: 'La llave del éxito, soluciones definitivas, revelaciones, libre albedrío absoluto.', obstacle: 'Cierre de puertas, oportunidades perdidas por miedo a cruzar el umbral.', advice: 'Tienes el poder en tus manos; abre la puerta sin dudar, la respuesta es Sí.', aspect: 'Solución / Apertura' },
      34: { meaning: 'Abundancia material, flujos de dinero, transacciones comerciales exitosas, libertad financiera.', obstacle: 'Avaricia obsesiva, gastos descontrolados, aguas financieras turbulentas.', advice: 'Confía en el flujo de la abundancia y realiza tus negocios con generosidad.', aspect: 'Dinero / Fluidez' },
      35: { meaning: 'Estabilidad a largo plazo, seguridad laboral, constancia, puerto seguro emocional.', obstacle: 'Inflexibilidad extrema, atarse a situaciones nocivas por miedo al cambio.', advice: 'Mantente firme en tus propósitos y echa el ancla en tierra firme y segura.', aspect: 'Seguridad / Arraigo' },
      36: { meaning: 'Lección de vida, destino kármico, sacrificios necesarios, pruebas del espíritu.', obstacle: 'Cargas insoportables, victimismo paralizante, dolor innecesario.', advice: 'Lleva tu cruz con dignidad, sabiendo que este desafío espiritual te fortalecerá.', aspect: 'Destino / Carga' }
    };
    
    const item = lenMeanings[card.number || 1] || lenMeanings[1];
    return {
      title: card.name,
      traditionName: tradition.name,
      meaning: item.meaning,
      obstacle: item.obstacle,
      advice: item.advice,
      aspect: item.aspect
    };
  }

  // Standard Tarot (RWS, Marsella, Egipcio)
  const isMajor = card.type === 'major';
  
  let title = card.name;
  let meaning = '';
  let obstacle = '';
  let advice = '';
  let aspect = '';

  if (isMajor) {
    const majorInterpretations: Record<number, { rws: string; mars: string; egip: string; aspect: string }> = {
      0: {
        rws: 'Nuevos comienzos, saltos de fe, libertad absoluta y espontaneidad sin límites.',
        mars: 'Locura sagrada, desapego de las normas sociales, el caminante sin rumbo fijo.',
        egip: 'Transmutación de la materia. Energía cósmica pura antes de tomar forma material.',
        aspect: 'Espiritualidad / Inicios'
      },
      1: {
        rws: 'Poder de manifestación, destreza mental, iniciativa y dominio de los cuatro elementos.',
        mars: 'Astucia, el comerciante que juega con sus herramientas de forma lúdica y brillante.',
        egip: 'La Unidad Creadora. Dominio de las fuerzas de la mente para moldear la materia.',
        aspect: 'Voluntad / Creación'
      },
      2: {
        rws: 'Intuición profunda, misterios divinos, subconsciente y pasividad sagrada.',
        mars: 'La guardiana de los textos sagrados. Sabiduría silenciosa, paciencia y gestación.',
        egip: 'La Sabiduría Oculta. Acceso a los registros de la naturaleza y del alma universal.',
        aspect: 'Intuición / Sabiduría'
      },
      3: {
        rws: 'Abundancia de la naturaleza, fertilidad, creatividad desbordante y amor materno.',
        mars: 'Poder político e intelectual femenino. Fuerza de expansión y creación tangible.',
        egip: 'La Madre Divina. Multiplicación de la vida, prosperidad material y afectiva.',
        aspect: 'Abundancia / Acción'
      },
      4: {
        rws: 'Estructura social, estabilidad, autoridad racional, protección y control firme.',
        mars: 'El poder terrenal absoluto. Orden, leyes estrictas, seguridad y cimientos fuertes.',
        egip: 'El Trono de la Fuerza. Estructura mental que consolida las metas deseadas.',
        aspect: 'Autoridad / Orden'
      },
      5: {
        rws: 'Guía espiritual, educación formal, tradiciones morales e iniciación esotérica.',
        mars: 'El puente entre lo divino y lo humano. El maestro que enseña el camino interior.',
        egip: 'La Ley de la Armonía. Consejos sabios, rectitud moral y sintonía cósmica.',
        aspect: 'Sabiduría / Guía'
      },
      6: {
        rws: 'Amor correspondido, alineación de valores, decisiones dictadas por el corazón.',
        mars: 'La elección de caminos amorosos o vitales. La belleza de la encrucijada humana.',
        egip: 'La Encrucijada de la Virtud. Pruebas que exigen discernimiento entre deseos y deberes.',
        aspect: 'Elección / Unión'
      },
      7: {
        rws: 'Éxito mediante la voluntad, enfoque dinámico, superación de obstáculos con ímpetu.',
        mars: 'Triunfo mundano legítimo. Control mental sobre los instintos básicos opuestos.',
        egip: 'El Carro de Osiris. El espíritu gobernando el cuerpo físico en su viaje temporal.',
        aspect: 'Voluntad / Triunfo'
      },
      8: {
        rws: 'Fuerza interior, compasión, control suave sobre los deseos salvajes, valentía.',
        mars: 'El control absoluto del instinto mediante la inteligencia y la energía espiritual.',
        egip: 'La Fuerza de la Fe. Conquista de los miedos irracionales y la bestia interna.',
        aspect: 'Fuerza / Autocontrol'
      },
      9: {
        rws: 'Introspección voluntaria, búsqueda de la verdad, soledad sagrada iluminadora.',
        mars: 'La prudencia que alumbra sus propios pasos en la penumbra del autoconocimiento.',
        egip: 'La Iniciación de la Luz. El sabio que camina despacio buscando las leyes divinas.',
        aspect: 'Búsqueda Interior'
      },
      10: {
        rws: 'Cambio de destino inevitable, ciclos que se cierran, karma positivo en movimiento.',
        mars: 'El constante flujo de las fuerzas del universo. Nada es permanente en la tierra.',
        egip: 'La Esfinge Cósmica. Retribución del karma y alternancia de ciclos de riqueza y aprendizaje.',
        aspect: 'Cambio / Destino'
      },
      11: {
        rws: 'Equilibrio ético, verdad objetiva, karma inmediato, honestidad radical.',
        mars: 'La balanza y la espada aplicadas sin favoritismos. Consecuencias lógicas de los actos.',
        egip: 'La Justicia de Maat. Rectitud de pensamiento, palabra y obra bajo la ley universal.',
        aspect: 'Justicia / Verdad'
      },
      12: {
        rws: 'Nueva perspectiva, sacrificio voluntario, soltar el control para recibir sabiduría.',
        mars: 'Detención de las fuerzas físicas. Meditación, replanteo de valores y gestación interna.',
        egip: 'El Sacrificio Sagrado. Altruismo, superación del egoísmo y entrega por el bien común.',
        aspect: 'Perspectiva / Espera'
      },
      13: {
        rws: 'Fin de una etapa importante, transformación regeneradora, limpieza profunda.',
        mars: 'La gran segadora que limpia el terreno para permitir nuevas e inimaginables siembras.',
        egip: 'La Inmortalidad. Renovación existencial, renacimiento tras la disolución de la forma.',
        aspect: 'Muerte / Renacimiento'
      },
      14: {
        rws: 'Moderación, sanación, alquimia personal, flujo pacífico de energías.',
        mars: 'La mezcla armoniosa de líquidos celestes. Sanación corporal, psíquica y paciencia.',
        egip: 'La Alquimia del Alma. Transmutación de las emociones densas en paz divina.',
        aspect: 'Sanación / Alquimia'
      },
      15: {
        rws: 'Apegos materiales, miedos subconscientes, pasión sexual desenfrenada, magnetismo.',
        mars: 'La fuerza de los instintos creativos primarios. El fuego sagrado y las tentaciones físicas.',
        egip: 'La Sombra de Tifón. Fuerzas del subconsciente, ambiciones mundanas y pasiones ciegas.',
        aspect: 'Sombra / Instintos'
      },
      16: {
        rws: 'Caída de falsas estructuras, iluminación repentina, liberación dolorosa de ilusiones.',
        mars: 'La destrucción del templo del orgullo humano. Liberación cósmica liberada por el rayo.',
        egip: 'El Rayo de la Verdad. Desmoronamiento de lo falso para dar paso a lo divino y eterno.',
        aspect: 'Liberación / Caída'
      },
      17: {
        rws: 'Inspiración divina, optimismo renovado, paz, fe en el futuro cósmico.',
        mars: 'La conexión con las fuentes naturales de la vida. Belleza, pureza y generosidad.',
        egip: 'La Estrella de la Esperanza. Vertido de aguas divinas que nutren la inteligencia humana.',
        aspect: 'Inspiración / Fe'
      },
      18: {
        rws: 'Ilusión, temores ocultos, intuición psíquica, deambular por el laberinto mental.',
        mars: 'El misterio de la noche. Reflexión de la luz solar, instintos básicos en la sombra.',
        egip: 'El Abismo del Misterio. El viaje por el inframundo del alma, superando las ilusiones.',
        aspect: 'Intuición / Temores'
      },
      19: {
        rws: 'Claridad mental, éxito desbordante, vitalidad física, alegría compartida.',
        mars: 'Amor fraterno incondicional bajo la luz protectora del sol divino. Éxito absoluto.',
        egip: 'El Sol de la Verdad. Plenitud espiritual, autorrealización y armonía cósmica.',
        aspect: 'Éxito / Claridad'
      },
      20: {
        rws: 'Llamado interior del alma, perdón, resurrección de proyectos antiguos.',
        mars: 'El despertar a una nueva conciencia espiritual. El llamado a la iluminación colectiva.',
        egip: 'La Resurrección. Despertar de la conciencia durmiente hacia realidades superiores.',
        aspect: 'Conciencia / Llamado'
      },
      21: {
        rws: 'Realización de todas las metas, integración cósmica, viaje exitoso completado.',
        mars: 'La corona de la creación. Danza triunfal en armonía con las fuerzas del macrocosmos.',
        egip: 'La Corona del Éxito. Realización total de la gran obra vital y trascendencia divina.',
        aspect: 'Plenitud / Éxito'
      }
    };
    
    const item = majorInterpretations[card.index] || majorInterpretations[0];
    if (traditionId === 'rws') {
      meaning = item.rws;
      obstacle = 'Miedo a avanzar, indecisión o desborde del arquetipo.';
      advice = 'Confía en tu intuición y camina con paso firme hacia adelante.';
    } else if (traditionId === 'marsella') {
      meaning = item.mars;
      obstacle = 'Fijación en los esquemas rígidos del ego o bloqueo arquetípico.';
      advice = 'Busca la expresión más natural y pura de tu energía instintiva.';
    } else {
      meaning = item.egip;
      obstacle = 'Desconexión de las correspondencias universales o ceguera espiritual.';
      advice = 'Busca armonizar los tres planos: espiritual, mental y físico en tu vida.';
    }
    aspect = item.aspect;
  } else {
    // Minor Arcana interpretations based on Suits and values
    const suitNames = {
      bastos: 'Energía creadora, acción, pasión, profesión y proyectos de expansión activa.',
      copas: 'Emociones, amor, relaciones afectivas, sanación de vínculos e intuición profunda.',
      espadas: 'Mente, pensamiento analítico, comunicación, desafíos lógicos o batallas intelectuales.',
      oros: 'Materialidad, finanzas personales, bienestar físico, seguridad corporal y abundancia tangible.'
    };
    
    const valueMeanings: Record<string, string> = {
      As: 'El inicio absoluto de la fuerza del elemento. Semilla con enorme potencial de manifestación.',
      '2': 'Búsqueda de equilibrio o toma de decisión inicial entre dos opciones opuestas.',
      '3': 'Expansión inicial, primeros frutos visibles de tu esfuerzo concentrado.',
      '4': 'Consolidación, estabilidad, cimientos sólidos o descanso regenerador.',
      '5': 'Desafío mental, conflicto de intereses, pérdida temporal o ajuste energético.',
      '6': 'Avances positivos, reconciliación con el pasado, victoria compartida o generosidad.',
      '7': 'Defensa de tus ideales, perseverancia frente al reto, paciencia reflexiva.',
      '8': 'Velocidad en las comunicaciones, maestría técnica, perfeccionamiento o movimiento ágil.',
      '9': 'Fuerza de resistencia, cercanía del éxito, satisfacción personal o resiliencia íntima.',
      '10': 'Culminación absoluta de la energía del elemento, desborde de frutos o exceso de cargas.',
      Sota: 'Juventud, curiosidad innata, mensajes del elemento y ganas de aprender.',
      Caballero: 'Acción focalizada, viaje o defensa activa de los ideales del palo.',
      Reina: 'Madurez interna, intuición, dominio emocional y sabiduría pasiva del elemento.',
      Rey: 'Autoridad formal, liderazgo estratégico, ordenación de recursos y maestría externa.'
    };

    const s = card.suit || 'copas';
    const val = card.value || 'As';
    aspect = s.charAt(0).toUpperCase() + s.slice(1);
    
    if (traditionId === 'rws') {
      meaning = `${valueMeanings[val]} En el plano de las ${s}, esto se traduce en: ${suitNames[s]}`;
      obstacle = 'Exceso o falta de control sobre la energía del elemento correspondiente.';
      advice = 'Alinea tus intenciones activamente y canaliza tu energía de forma constructiva.';
    } else if (traditionId === 'marsella') {
      meaning = `Representación geométrica pura del ${val} de ${s}. Símbolo del orden cósmico expresado en la materia.`;
      obstacle = 'Apego excesivo a la estructura fría del número o desorganización total.';
      advice = 'Contempla la geometría del palo para equilibrar tus hábitos cotidianos.';
    } else {
      meaning = `El sendero del ${val} de ${s} en el hermetismo egipcio, integrando las fuerzas terrenales con la voluntad del espíritu.`;
      obstacle = 'Ignorar los mensajes celestes de tu correspondencia planetaria.';
      advice = 'Consagra tus actividades físicas diarias al crecimiento de tu templo interior.';
    }
  }

  return {
    title,
    traditionName: tradition.name,
    meaning,
    obstacle,
    advice,
    aspect
  };
}
