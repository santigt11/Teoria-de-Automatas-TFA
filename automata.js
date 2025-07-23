// Clase para el Autómata Finito Determinista de Palabras
class AutomataFinitoDeterminista {
    constructor(palabras) {
        this.palabras = palabras.map(p => p.toUpperCase());
        this.estados = new Map();
        this.estadoInicial = 0;
        this.estadosFinales = new Set();
        this.transiciones = new Map();
        this.construirAutomata();
    }

    construirAutomata() {
        // Crear estado inicial
        this.estados.set(0, { esFinal: false, palabra: "", tipo: "" });
        let contadorEstado = 1;

        // Construir trie para cada palabra
        for (const palabra of this.palabras) {
            let estadoActual = 0;

            for (let i = 0; i < palabra.length; i++) {
                const caracter = palabra[i];
                const clave = `${estadoActual}-${caracter}`;

                if (!this.transiciones.has(clave)) {
                    // Crear nuevo estado
                    const nuevoEstado = contadorEstado++;
                    const esFinal = (i === palabra.length - 1);
                    
                    this.estados.set(nuevoEstado, {
                        esFinal: esFinal,
                        palabra: esFinal ? palabra : "",
                        tipo: esFinal ? this.obtenerTipoPalabra(palabra) : ""
                    });

                    this.transiciones.set(clave, nuevoEstado);

                    if (esFinal) {
                        this.estadosFinales.add(nuevoEstado);
                    }
                } else {
                    // Usar estado existente
                    const estadoExistente = this.transiciones.get(clave);
                    
                    if (i === palabra.length - 1) {
                        this.estados.get(estadoExistente).esFinal = true;
                        this.estados.get(estadoExistente).palabra = palabra;
                        this.estados.get(estadoExistente).tipo = this.obtenerTipoPalabra(palabra);
                        this.estadosFinales.add(estadoExistente);
                    }
                }

                estadoActual = this.transiciones.get(clave);
            }
        }
    }

    obtenerTipoPalabra(palabra) {
        if (ARTICULOS.includes(palabra)) return 'articulo';
        if (SUSTANTIVOS.includes(palabra)) return 'sustantivo';
        if (VERBOS.includes(palabra)) return 'verbo';
        if (ADJETIVOS.includes(palabra)) return 'adjetivo';
        if (PREPOSICIONES.includes(palabra)) return 'preposicion';
        if (CONJUNCIONES.includes(palabra)) return 'conjuncion';
        return 'unknown';
    }

    procesarCadena(cadena) {
        cadena = cadena.toUpperCase().trim();
        let estadoActual = this.estadoInicial;
        const path = [estadoActual];

        for (const caracter of cadena) {
            const clave = `${estadoActual}-${caracter}`;
            if (this.transiciones.has(clave)) {
                estadoActual = this.transiciones.get(clave);
                path.push(estadoActual);
            } else {
                return { aceptada: false, palabra: null, tipo: null, path: path };
            }
        }

        const estado = this.estados.get(estadoActual);
        return {
            aceptada: estado.esFinal,
            palabra: estado.palabra || null,
            tipo: estado.tipo || null,
            path: path
        };
    }

    verificarPrefijo(prefijo) {
        prefijo = prefijo.toUpperCase().trim();
        let estadoActual = this.estadoInicial;
        const path = [estadoActual];

        for (const caracter of prefijo) {
            const clave = `${estadoActual}-${caracter}`;
            if (this.transiciones.has(clave)) {
                estadoActual = this.transiciones.get(clave);
                path.push(estadoActual);
            } else {
                return { valido: false, path: path, posiblesContinuaciones: [] };
            }
        }

        // Encontrar posibles continuaciones
        const posiblesContinuaciones = [];
        for (const [clave, destino] of this.transiciones) {
            const [origen, caracter] = clave.split('-');
            if (parseInt(origen) === estadoActual) {
                posiblesContinuaciones.push(caracter);
            }
        }

        return {
            valido: true,
            path: path,
            posiblesContinuaciones: posiblesContinuaciones,
            esPalabraCompleta: this.estados.get(estadoActual).esFinal
        };
    }

    obtenerEstadisticas() {
        return {
            totalEstados: this.estados.size,
            estadosFinales: this.estadosFinales.size,
            transiciones: this.transiciones.size,
            palabras: this.palabras.length
        };
    }
}

// Clase para Gramática Libre de Contexto (GLC)
class GramaticaLibreContexto {
    constructor() {
        this.reglas = new Map();
        this.simboloInicial = 'S';
        this.terminales = new Set();
        this.noTerminales = new Set();
        this.construirGramatica();
    }

    construirGramatica() {
        // Definir no terminales
        this.noTerminales = new Set(['S', 'SN', 'SV', 'ART', 'SUST', 'VERB', 'ADJ', 'PREP', 'CONJ']);
        
        // Definir terminales (tipos de palabras)
        this.terminales = new Set(['articulo', 'sustantivo', 'verbo', 'adjetivo', 'preposicion', 'conjuncion']);
        
        // Reglas de producción para oraciones más complejas
        this.reglas.set('S', [
            ['SN', 'SV'],                    // Oración simple: El gato come
            ['SN', 'SV', 'PREP', 'SN'],     // Con complemento: El gato come en casa
            ['SN', 'CONJ', 'SN', 'SV'],     // Con conjunción: El gato y el perro comen
            ['SN', 'SV', 'ADJ']             // Con adjetivo: El gato come rápido
        ]);
        
        this.reglas.set('SN', [
            ['ART', 'SUST'],                // Sintagma nominal simple
            ['ART', 'SUST', 'ADJ'],         // Con adjetivo: El gato negro
            ['ART', 'ADJ', 'SUST']          // Adjetivo antepuesto: El pequeño gato
        ]);
        
        this.reglas.set('SV', [
            ['VERB'],                       // Verbo simple
            ['VERB', 'SN'],                 // Verbo transitivo: come pescado
            ['VERB', 'ADJ']                 // Verbo copulativo: está feliz
        ]);
        
        this.reglas.set('ART', [['articulo']]);
        this.reglas.set('SUST', [['sustantivo']]);
        this.reglas.set('VERB', [['verbo']]);
        this.reglas.set('ADJ', [['adjetivo']]);
        this.reglas.set('PREP', [['preposicion']]);
        this.reglas.set('CONJ', [['conjuncion']]);
    }

    // Analizador sintáctico descendente recursivo
    analizarOracion(palabras) {
        this.posicion = 0;
        this.palabras = palabras.map(p => ({ palabra: p.palabra, tipo: p.tipo }));
        this.errores = [];
        
        try {
            const resultado = this.analizarS();
            if (this.posicion === this.palabras.length) {
                return {
                    valida: true,
                    estructura: resultado,
                    errores: [],
                    arbolSintactico: this.construirArbol(resultado)
                };
            } else {
                return {
                    valida: false,
                    estructura: null,
                    errores: [`Tokens no procesados: ${this.palabras.slice(this.posicion).map(p => p.palabra).join(' ')}`],
                    arbolSintactico: null
                };
            }
        } catch (error) {
            return {
                valida: false,
                estructura: null,
                errores: [error.message],
                arbolSintactico: null
            };
        }
    }

    analizarS() {
        // S -> SN SV | SN SV PREP SN | SN CONJ SN SV | SN SV ADJ
        const nodo = { tipo: 'S', hijos: [] };
        
        // Intentar todas las producciones de S
        const checkpoint = this.posicion;
        
        // Intentar S -> SN SV
        try {
            this.posicion = checkpoint;
            const sn1 = this.analizarSN();
            const sv = this.analizarSV();
            
            // Verificar si hay más tokens para otras producciones
            if (this.posicion < this.palabras.length) {
                const siguienteToken = this.palabras[this.posicion];
                
                // S -> SN SV PREP SN
                if (siguienteToken.tipo === 'preposicion') {
                    const prep = this.consumir('preposicion');
                    const sn2 = this.analizarSN();
                    nodo.hijos = [sn1, sv, { tipo: 'PREP', valor: prep }, sn2];
                    return nodo;
                }
                // S -> SN SV ADJ
                else if (siguienteToken.tipo === 'adjetivo') {
                    const adj = this.consumir('adjetivo');
                    nodo.hijos = [sn1, sv, { tipo: 'ADJ', valor: adj }];
                    return nodo;
                }
            }
            
            // S -> SN SV simple
            nodo.hijos = [sn1, sv];
            return nodo;
        } catch (e) {
            // Intentar S -> SN CONJ SN SV
            this.posicion = checkpoint;
            try {
                const sn1 = this.analizarSN();
                const conj = this.consumir('conjuncion');
                const sn2 = this.analizarSN();
                const sv = this.analizarSV();
                nodo.hijos = [sn1, { tipo: 'CONJ', valor: conj }, sn2, sv];
                return nodo;
            } catch (e2) {
                throw new Error(`No se pudo analizar la oración. Errores: ${e.message}, ${e2.message}`);
            }
        }
    }

    analizarSN() {
        // SN -> ART SUST | ART SUST ADJ | ART ADJ SUST
        const nodo = { tipo: 'SN', hijos: [] };
        const checkpoint = this.posicion;
        
        try {
            const art = this.consumir('articulo');
            
            // Verificar si sigue adjetivo o sustantivo
            if (this.posicion < this.palabras.length && this.palabras[this.posicion].tipo === 'adjetivo') {
                // ART ADJ SUST
                const adj = this.consumir('adjetivo');
                const sust = this.consumir('sustantivo');
                nodo.hijos = [{ tipo: 'ART', valor: art }, { tipo: 'ADJ', valor: adj }, { tipo: 'SUST', valor: sust }];
            } else {
                // ART SUST [ADJ]
                const sust = this.consumir('sustantivo');
                nodo.hijos = [{ tipo: 'ART', valor: art }, { tipo: 'SUST', valor: sust }];
                
                // Verificar si hay adjetivo después
                if (this.posicion < this.palabras.length && this.palabras[this.posicion].tipo === 'adjetivo') {
                    const adj = this.consumir('adjetivo');
                    nodo.hijos.push({ tipo: 'ADJ', valor: adj });
                }
            }
            
            return nodo;
        } catch (e) {
            this.posicion = checkpoint;
            throw new Error(`Error analizando SN: ${e.message}`);
        }
    }

    analizarSV() {
        // SV -> VERB | VERB SN | VERB ADJ
        const nodo = { tipo: 'SV', hijos: [] };
        
        const verb = this.consumir('verbo');
        nodo.hijos = [{ tipo: 'VERB', valor: verb }];
        
        // Verificar si hay complemento
        if (this.posicion < this.palabras.length) {
            const siguienteToken = this.palabras[this.posicion];
            
            if (siguienteToken.tipo === 'articulo') {
                // VERB SN
                const sn = this.analizarSN();
                nodo.hijos.push(sn);
            } else if (siguienteToken.tipo === 'adjetivo') {
                // VERB ADJ
                const adj = this.consumir('adjetivo');
                nodo.hijos.push({ tipo: 'ADJ', valor: adj });
            }
        }
        
        return nodo;
    }

    consumir(tipoEsperado) {
        if (this.posicion >= this.palabras.length) {
            throw new Error(`Se esperaba ${tipoEsperado} pero se alcanzó el final de la oración`);
        }
        
        const token = this.palabras[this.posicion];
        if (token.tipo !== tipoEsperado) {
            throw new Error(`Se esperaba ${tipoEsperado} pero se encontró ${token.tipo} (${token.palabra})`);
        }
        
        this.posicion++;
        return token.palabra;
    }

    construirArbol(nodo, nivel = 0) {
        let resultado = '  '.repeat(nivel) + nodo.tipo;
        if (nodo.valor) {
            resultado += ` -> "${nodo.valor}"`;
        }
        resultado += '\n';
        
        if (nodo.hijos) {
            for (const hijo of nodo.hijos) {
                resultado += this.construirArbol(hijo, nivel + 1);
            }
        }
        
        return resultado;
    }

    obtenerEstadisticas() {
        return {
            reglas: this.reglas.size,
            terminales: this.terminales.size,
            noTerminales: this.noTerminales.size,
            simboloInicial: this.simboloInicial
        };
    }
}

// Clase para el Autómata de Oraciones (mantener para compatibilidad)
class AutomataOraciones {
    constructor() {
        this.estados = new Map();
        this.estadoInicial = 0;
        this.estadoFinal = 3;
        this.transiciones = new Map();
        this.construirAutomata();
    }

    construirAutomata() {
        // Estado 0: Inicial (esperando artículo)
        this.estados.set(0, { 
            nombre: "INICIAL", 
            esperando: "articulo",
            descripcion: "Esperando artículo"
        });

        // Estado 1: Artículo recibido (esperando sustantivo)
        this.estados.set(1, { 
            nombre: "ARTICULO", 
            esperando: "sustantivo",
            descripcion: "Artículo recibido, esperando sustantivo"
        });

        // Estado 2: Sustantivo recibido (esperando verbo)
        this.estados.set(2, { 
            nombre: "SUSTANTIVO", 
            esperando: "verbo",
            descripcion: "Sustantivo recibido, esperando verbo"
        });

        // Estado 3: Final (oración completa)
        this.estados.set(3, { 
            nombre: "FINAL", 
            esperando: null,
            descripcion: "Oración completa"
        });

        // Transiciones
        this.transiciones.set("0-articulo", 1);
        this.transiciones.set("1-sustantivo", 2);
        this.transiciones.set("2-verbo", 3);
    }

    procesarPalabra(tipo, estadoActual = 0) {
        const clave = `${estadoActual}-${tipo}`;
        
        if (this.transiciones.has(clave)) {
            const nuevoEstado = this.transiciones.get(clave);
            return {
                exito: true,
                nuevoEstado: nuevoEstado,
                esCompleta: nuevoEstado === this.estadoFinal,
                descripcion: this.estados.get(nuevoEstado).descripcion
            };
        }

        return {
            exito: false,
            nuevoEstado: estadoActual,
            esCompleta: false,
            descripcion: `Error: Se esperaba ${this.estados.get(estadoActual).esperando}, pero se recibió ${tipo}`
        };
    }

    reiniciar() {
        return this.estadoInicial;
    }

    obtenerEstadoActual(estado) {
        return this.estados.get(estado);
    }

    obtenerEstadisticas() {
        return {
            totalEstados: this.estados.size,
            transiciones: this.transiciones.size
        };
    }
}

// Vocabulario organizado por categorías con concordancia gramatical
const ARTICULOS_MASCULINOS = ["EL", "LOS"];
const ARTICULOS_FEMENINOS = ["LA", "LAS"];
const ARTICULOS_NEUTROS = ["UN", "UNA", "UNOS", "UNAS"]; // Pueden ir con cualquier sustantivo

const SUSTANTIVOS_MASCULINOS = [
    "GATO", "PERRO", "COCHE", "LIBRO", "TELEFONO", "JARDIN", "HOSPITAL", "PARQUE",
    "PAIS", "MUNDO", "SOL", "FUEGO", "CHICO", "HOMBRE", "BEBE", "PAPA", 
    "HERMANO", "AMIGO", "PROFESOR"
];

const SUSTANTIVOS_FEMENINOS = [
    "CASA", "MESA", "SILLA", "COMPUTADORA", "VENTANA", "PUERTA", "ESCUELA",
    "CIUDAD", "LUNA", "ESTRELLA", "AGUA", "CHICA", "MUJER", "COMIDA", "MAMA",
    "HERMANA", "AMIGA", "ESTUDIANTE"
];

// Mantener listas originales para compatibilidad
const ARTICULOS = [...ARTICULOS_MASCULINOS, ...ARTICULOS_FEMENINOS, ...ARTICULOS_NEUTROS];
const SUSTANTIVOS = [...SUSTANTIVOS_MASCULINOS, ...SUSTANTIVOS_FEMENINOS];

const VERBOS = [
    "CORRE", "SALTA", "COME", "BEBE", "DUERME", "CAMINA", "VUELA", "NADA",
    "ESTUDIA", "TRABAJA", "JUEGA", "CANTA", "BAILA", "ESCRIBE", "LEE",
    "HABLA", "ESCUCHA", "MIRA", "PIENSA", "SUEÑA", "ANDA", "VIVE",
    "ESTA", "ES", "TIENE", "HACE", "VE", "OYE", "TOCA", "SIENTE",
    "LLEGA", "SALE", "ENTRA", "SUBE", "BAJA", "ABRE", "CIERRA", "BUSCA"
];

// Nuevas categorías para la GLC
const ADJETIVOS = [
    "GRANDE", "PEQUEÑO", "BONITO", "FEO", "RAPIDO", "LENTO", "ALTO", "BAJO",
    "NEGRO", "BLANCO", "ROJO", "AZUL", "VERDE", "AMARILLO", "FELIZ", "TRISTE",
    "NUEVO", "VIEJO", "JOVEN", "FUERTE", "DEBIL", "INTELIGENTE"
];

const PREPOSICIONES = [
    "EN", "DE", "CON", "SIN", "PARA", "POR", "SOBRE", "BAJO", "ENTRE", "DESDE"
];

const CONJUNCIONES = [
    "Y", "O", "PERO", "AUNQUE", "PORQUE", "CUANDO", "SI"
];

// Todas las palabras combinadas (incluyendo nuevas categorías)
const TODAS_LAS_PALABRAS = [
    ...ARTICULOS, 
    ...SUSTANTIVOS, 
    ...VERBOS, 
    ...ADJETIVOS, 
    ...PREPOSICIONES, 
    ...CONJUNCIONES
];

// Función para obtener el tipo de palabra (extendida)
function obtenerTipoPalabra(palabra) {
    palabra = palabra.toUpperCase();
    if (ARTICULOS.includes(palabra)) return 'articulo';
    if (SUSTANTIVOS.includes(palabra)) return 'sustantivo';
    if (VERBOS.includes(palabra)) return 'verbo';
    if (ADJETIVOS.includes(palabra)) return 'adjetivo';
    if (PREPOSICIONES.includes(palabra)) return 'preposicion';
    if (CONJUNCIONES.includes(palabra)) return 'conjuncion';
    return null;
}

// Función para mostrar el vocabulario en la interfaz (extendida)
function mostrarVocabulario() {
    const articulosList = document.getElementById('articulos-list');
    const sustantivosList = document.getElementById('sustantivos-list');
    const verbosList = document.getElementById('verbos-list');

    // Vocabulario básico (mostrar en la interfaz principal)
    articulosList.innerHTML = ARTICULOS.map(palabra => 
        `<span class="vocab-item articulo">${palabra}</span>`
    ).join('');

    sustantivosList.innerHTML = SUSTANTIVOS.slice(0, 15).map(palabra => 
        `<span class="vocab-item sustantivo">${palabra}</span>`
    ).join('') + `<span class="vocab-item sustantivo">+${SUSTANTIVOS.length - 15} más</span>`;

    verbosList.innerHTML = VERBOS.slice(0, 15).map(palabra => 
        `<span class="vocab-item verbo">${palabra}</span>`
    ).join('') + `<span class="vocab-item verbo">+${VERBOS.length - 15} más</span>`;
}

// Función para mostrar vocabulario completo (incluyendo GLC)
function mostrarVocabularioCompleto() {
    console.log("📚 VOCABULARIO COMPLETO PARA GLC:");
    console.log("🔹 Artículos:", ARTICULOS);
    console.log("🔹 Sustantivos:", SUSTANTIVOS);
    console.log("🔹 Verbos:", VERBOS);
    console.log("🔹 Adjetivos:", ADJETIVOS);
    console.log("🔹 Preposiciones:", PREPOSICIONES);
    console.log("🔹 Conjunciones:", CONJUNCIONES);
    console.log(`📊 Total: ${TODAS_LAS_PALABRAS.length} palabras`);
}

// Función para destacar palabra en vocabulario
function destacarPalabraEnVocabulario(palabra, tipo) {
    // Quitar destacado anterior
    document.querySelectorAll('.vocab-item.highlighted').forEach(item => {
        item.classList.remove('highlighted');
    });

    // Destacar palabra actual
    if (palabra && tipo) {
        const items = document.querySelectorAll(`.vocab-item.${tipo}`);
        items.forEach(item => {
            if (item.textContent === palabra) {
                item.classList.add('highlighted');
            }
        });
    }
}

// Función para probar la GLC con ejemplos
function probarGLC() {
    const glc = new GramaticaLibreContexto();
    
    const ejemplos = [
        // Oraciones simples
        [{ palabra: "EL", tipo: "articulo" }, { palabra: "GATO", tipo: "sustantivo" }, { palabra: "COME", tipo: "verbo" }],
        
        // Con adjetivo
        [{ palabra: "EL", tipo: "articulo" }, { palabra: "GATO", tipo: "sustantivo" }, { palabra: "NEGRO", tipo: "adjetivo" }, { palabra: "COME", tipo: "verbo" }],
        
        // Con complemento
        [{ palabra: "EL", tipo: "articulo" }, { palabra: "GATO", tipo: "sustantivo" }, { palabra: "COME", tipo: "verbo" }, { palabra: "EN", tipo: "preposicion" }, { palabra: "LA", tipo: "articulo" }, { palabra: "CASA", tipo: "sustantivo" }],
        
        // Con conjunción
        [{ palabra: "EL", tipo: "articulo" }, { palabra: "GATO", tipo: "sustantivo" }, { palabra: "Y", tipo: "conjuncion" }, { palabra: "EL", tipo: "articulo" }, { palabra: "PERRO", tipo: "sustantivo" }, { palabra: "COMEN", tipo: "verbo" }]
    ];
    
    console.log("🧪 PROBANDO GRAMÁTICA LIBRE DE CONTEXTO:");
    ejemplos.forEach((ejemplo, i) => {
        const resultado = glc.analizarOracion(ejemplo);
        console.log(`\n📝 Ejemplo ${i + 1}: ${ejemplo.map(p => p.palabra).join(' ')}`);
        console.log(`✅ Válida: ${resultado.valida}`);
        if (resultado.arbolSintactico) {
            console.log("🌳 Árbol sintáctico:");
            console.log(resultado.arbolSintactico);
        }
        if (resultado.errores.length > 0) {
            console.log("❌ Errores:", resultado.errores);
        }
    });
}

// Funciones auxiliares para concordancia gramatical
function obtenerGeneroArticulo(articulo) {
    if (ARTICULOS_MASCULINOS.includes(articulo)) return 'masculino';
    if (ARTICULOS_FEMENINOS.includes(articulo)) return 'femenino';
    return 'neutro'; // UN, UNA, etc.
}

function obtenerGeneroSustantivo(sustantivo) {
    if (SUSTANTIVOS_MASCULINOS.includes(sustantivo)) return 'masculino';
    if (SUSTANTIVOS_FEMENINOS.includes(sustantivo)) return 'femenino';
    return 'neutro';
}

function esConcordanciaValida(articulo, sustantivo) {
    const generoArticulo = obtenerGeneroArticulo(articulo);
    const generoSustantivo = obtenerGeneroSustantivo(sustantivo);
    
    // Los artículos neutros (UN, UNA, UNOS, UNAS) pueden ir con cualquier sustantivo
    if (generoArticulo === 'neutro') return true;
    
    // Para artículos específicos, debe coincidir el género
    return generoArticulo === generoSustantivo;
}

function obtenerSustantivosCompatibles(articulo) {
    const generoArticulo = obtenerGeneroArticulo(articulo);
    
    if (generoArticulo === 'neutro') {
        return SUSTANTIVOS; // Todos los sustantivos
    } else if (generoArticulo === 'masculino') {
        return SUSTANTIVOS_MASCULINOS;
    } else {
        return SUSTANTIVOS_FEMENINOS;
    }
}

// Exportar para uso en game.js (incluyendo GLC y concordancia)
window.AutomataFinitoDeterminista = AutomataFinitoDeterminista;
window.GramaticaLibreContexto = GramaticaLibreContexto;
window.AutomataOraciones = AutomataOraciones;
window.TODAS_LAS_PALABRAS = TODAS_LAS_PALABRAS;
window.ARTICULOS = ARTICULOS;
window.SUSTANTIVOS = SUSTANTIVOS;
window.VERBOS = VERBOS;
window.ADJETIVOS = ADJETIVOS;
window.ARTICULOS_MASCULINOS = ARTICULOS_MASCULINOS;
window.ARTICULOS_FEMENINOS = ARTICULOS_FEMENINOS;
window.ARTICULOS_NEUTROS = ARTICULOS_NEUTROS;
window.SUSTANTIVOS_MASCULINOS = SUSTANTIVOS_MASCULINOS;
window.SUSTANTIVOS_FEMENINOS = SUSTANTIVOS_FEMENINOS;
window.obtenerGeneroArticulo = obtenerGeneroArticulo;
window.obtenerGeneroSustantivo = obtenerGeneroSustantivo;
window.esConcordanciaValida = esConcordanciaValida;
window.obtenerSustantivosCompatibles = obtenerSustantivosCompatibles;
window.PREPOSICIONES = PREPOSICIONES;
window.CONJUNCIONES = CONJUNCIONES;
window.obtenerTipoPalabra = obtenerTipoPalabra;
window.mostrarVocabulario = mostrarVocabulario;
window.mostrarVocabularioCompleto = mostrarVocabularioCompleto;
window.destacarPalabraEnVocabulario = destacarPalabraEnVocabulario;
window.probarGLC = probarGLC;
