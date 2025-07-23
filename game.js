// Variables globales del juego
let canvas, ctx;
let game;

// Clases del juego
class Nave {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.ancho = 28; // Reducido de 35 a 28
        this.alto = 20;  // Reducido de 25 a 20
        this.velocidad = 8;
        this.disparos = [];
        this.moviendose = false;
        this.objetivoX = x;
        
        // Variables para animaciones fluidas
        this.animacionTime = 0;
        this.flotacionY = 0;
        this.brilloMotor = 0;
        this.particulasMotor = [];
        this.ultimoDisparo = 0;
    }

    dibujar() {
        // Actualizar animaciones
        this.animacionTime += 0.1;
        this.flotacionY = Math.sin(this.animacionTime) * 2;
        
        ctx.save();
        
        // Aplicar flotación sutil
        const yFinal = this.y + this.flotacionY;
        
        // Gradiente animado para la nave
        const gradient = ctx.createLinearGradient(this.x, yFinal, this.x, yFinal + this.alto);
        const intensidad = 0.8 + 0.2 * Math.sin(this.animacionTime * 2);
        gradient.addColorStop(0, `rgba(0, 255, 0, ${intensidad})`);
        gradient.addColorStop(0.5, '#00ff00');
        gradient.addColorStop(1, `rgba(0, 68, 0, ${intensidad})`);
        
        // Cuerpo principal con efecto de pulso
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x + this.ancho / 2, yFinal);
        ctx.lineTo(this.x, yFinal + this.alto);
        ctx.lineTo(this.x + this.ancho, yFinal + this.alto);
        ctx.closePath();
        ctx.fill();
        
        // Borde brillante animado
        const brilloBorde = 0.7 + 0.3 * Math.sin(this.animacionTime * 3);
        ctx.strokeStyle = `rgba(0, 255, 255, ${brilloBorde})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Base con pulso
        const brilloBase = 0.8 + 0.2 * Math.sin(this.animacionTime * 1.5);
        ctx.fillStyle = `rgba(0, 255, 0, ${brilloBase})`;
        ctx.fillRect(this.x + 10, yFinal + this.alto - 5, this.ancho - 20, 5);
        
        // Cañones laterales
        ctx.fillRect(this.x + 5, yFinal + this.alto - 15, 8, 10);
        ctx.fillRect(this.x + this.ancho - 13, yFinal + this.alto - 15, 8, 10);
        
        // Efecto de motor mejorado
        this.actualizarEfectoMotor(yFinal);
        
        // Efecto de escudo cuando se mueve
        if (this.moviendose) {
            this.dibujarEscudoMovimiento(yFinal);
        }
        
        // Efecto de disparo reciente
        if (Date.now() - this.ultimoDisparo < 200) {
            this.dibujarEfectoDisparoReciente(yFinal);
        }
        
        ctx.restore();
    }

    mover(direccion) {
        if (direccion === "izquierda" && this.x > 0) {
            this.x -= this.velocidad;
        } else if (direccion === "derecha" && this.x < canvas.width - this.ancho) {
            this.x += this.velocidad;
        }
    }

    moverAObjetivo(objetivoX) {
        const centroNave = this.x + this.ancho / 2;
        const diferencia = objetivoX - centroNave;
        
        // Aumentar tolerancia para evitar trabas
        this.moviendose = Math.abs(diferencia) > 8;
        
        if (this.moviendose) {
            if (diferencia > 0) {
                this.x = Math.min(this.x + this.velocidad, canvas.width - this.ancho);
            } else {
                this.x = Math.max(this.x - this.velocidad, 0);
            }
        }
        
        // Mayor tolerancia para considerar que llegó al objetivo
        return Math.abs(diferencia) <= 8;
    }

    disparar(palabra) {
        if (palabra && palabra.length > 0) {
            const nuevoDisparo = new Disparo(this.x + this.ancho / 2, this.y, palabra);
            this.disparos.push(nuevoDisparo);
            this.ultimoDisparo = Date.now();
            
            // Efecto visual de disparo
            this.crearEfectoDisparo();
        }
    }

    actualizarEfectoMotor(yFinal) {
        // Crear partículas del motor
        if (this.moviendose && Math.random() < 0.8) {
            this.particulasMotor.push({
                x: this.x + this.ancho / 2 + (Math.random() - 0.5) * 8,
                y: yFinal + this.alto,
                velY: Math.random() * 3 + 2,
                vida: 30,
                tamaño: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? '#ffff00' : '#ff8800'
            });
        }
        
        // Actualizar y dibujar partículas
        for (let i = this.particulasMotor.length - 1; i >= 0; i--) {
            const particula = this.particulasMotor[i];
            particula.y += particula.velY;
            particula.vida--;
            particula.tamaño *= 0.95;
            
            if (particula.vida <= 0) {
                this.particulasMotor.splice(i, 1);
                continue;
            }
            
            const alpha = particula.vida / 30;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particula.color;
            ctx.beginPath();
            ctx.arc(particula.x, particula.y, particula.tamaño, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    dibujarEscudoMovimiento(yFinal) {
        const alpha = 0.3 + 0.2 * Math.sin(this.animacionTime * 4);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x + this.ancho / 2, yFinal + this.alto / 2, this.ancho / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    dibujarEfectoDisparoReciente(yFinal) {
        const intensidad = (200 - (Date.now() - this.ultimoDisparo)) / 200;
        ctx.globalAlpha = intensidad * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + this.ancho / 2 - 2, yFinal - 5, 4, 8);
        ctx.globalAlpha = 1;
    }

    crearEfectoDisparo() {
        // Crear partículas del disparo
        for (let i = 0; i < 8; i++) {
            game.explosiones.push({
                x: this.x + this.ancho / 2 + (Math.random() - 0.5) * 20,
                y: this.y,
                velX: (Math.random() - 0.5) * 4,
                velY: -Math.random() * 3 - 2,
                vida: 20,
                color: Math.random() > 0.5 ? '#ffff00' : '#00ffff',
                tamaño: Math.random() * 3 + 1
            });
        }
    }

    actualizar() {
        // Actualizar disparos
        this.disparos = this.disparos.filter(disparo => disparo.activo);
        this.disparos.forEach(disparo => disparo.actualizar());
    }
}

class Disparo {
    constructor(x, y, palabra) {
        this.x = x;
        this.y = y;
        this.velocidad = 10;
        this.palabra = palabra.toUpperCase();
        this.activo = true;
        this.ancho = 4;  // Reducido de 6 a 4
        this.alto = 16;  // Reducido de 20 a 16
        this.brillo = 1;
        this.animacionTime = 0;
        this.trail = []; // Estela del disparo
    }

    dibujar() {
        if (!this.activo) return;

        this.animacionTime += 0.2;
        
        ctx.save();
        
        // Dibujar estela
        this.dibujarEstela();
        
        // Efecto de brillo pulsante mejorado
        this.brillo = 0.6 + 0.4 * Math.sin(this.animacionTime);
        
        // Rayo principal con gradiente animado
        const gradient = ctx.createLinearGradient(this.x - 3, this.y, this.x + 3, this.y + this.alto);
        gradient.addColorStop(0, `rgba(255, 255, 0, ${this.brillo})`);
        gradient.addColorStop(0.3, `rgba(255, 255, 255, ${this.brillo * 1.2})`);
        gradient.addColorStop(0.7, `rgba(0, 255, 255, ${this.brillo})`);
        gradient.addColorStop(1, `rgba(0, 150, 255, ${this.brillo * 0.8})`);
        
        // Efecto de resplandor
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - 3, this.y, this.ancho, this.alto);
        
        // Núcleo brillante animado
        const anchoNucleo = 2 + Math.sin(this.animacionTime) * 0.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brillo})`;
        ctx.fillRect(this.x - anchoNucleo/2, this.y, anchoNucleo, this.alto);
        
        ctx.shadowBlur = 0;
        
        // Partículas de energía
        this.dibujarParticulasEnergia();
        
        // Palabra encima del disparo con animación
        ctx.fillStyle = `rgba(0, 255, 255, ${0.8 + 0.2 * Math.sin(this.animacionTime * 1.5)})`;
        ctx.font = '12px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Efecto de sombra animada
        ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * this.brillo})`;
        ctx.fillText(this.palabra, this.x + 1, this.y - 9);
        
        // Texto principal con brillo
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 3;
        ctx.fillStyle = `rgba(0, 255, 255, ${this.brillo})`;
        ctx.fillText(this.palabra, this.x, this.y - 10);
        
        ctx.restore();
    }

    dibujarEstela() {
        // Añadir posición actual a la estela
        this.trail.unshift({x: this.x, y: this.y + this.alto});
        if (this.trail.length > 8) this.trail.pop();
        
        // Dibujar estela
        for (let i = 0; i < this.trail.length; i++) {
            const segmento = this.trail[i];
            const alpha = (this.trail.length - i) / this.trail.length * 0.5;
            const ancho = (this.trail.length - i) / this.trail.length * 3;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(segmento.x - ancho/2, segmento.y, ancho, 3);
        }
        ctx.globalAlpha = 1;
    }

    dibujarParticulasEnergia() {
        // Partículas aleatorias alrededor del disparo
        if (Math.random() < 0.3) {
            const numParticulas = 3;
            for (let i = 0; i < numParticulas; i++) {
                const offsetX = (Math.random() - 0.5) * 12;
                const offsetY = (Math.random() - 0.5) * 8;
                const tamaño = Math.random() * 2 + 0.5;
                
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = Math.random() > 0.5 ? '#ffff00' : '#00ffff';
                ctx.beginPath();
                ctx.arc(this.x + offsetX, this.y + this.alto/2 + offsetY, tamaño, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }

    actualizar() {
        this.y -= this.velocidad;
        if (this.y < -50) {
            this.activo = false;
        }
    }

    obtenerRect() {
        return {
            x: this.x - 3,
            y: this.y,
            width: this.ancho,
            height: this.alto
        };
    }
}

class PalabraCayendo {
    constructor(x, y, palabra, tipo, juego = null) {
        this.x = x;
        this.y = y;
        this.palabra = palabra.toUpperCase();
        this.tipo = tipo;
        this.juegoRef = juego; // Referencia al juego para acceder al multiplicador
        this.velocidadBase = Math.random() * 0.4 + 0.2; // Velocidad base
        this.velocidad = this.velocidadBase; // Velocidad actual
        this.activa = true;
        this.rotacion = Math.random() * 0.005 - 0.0025; // Rotación mucho más lenta
        this.escala = 1;
        this.brillo = 1;
        this.animacionTime = Math.random() * Math.PI * 2; // Offset aleatorio
        this.particulasAmbiente = [];
        this.pulso = 0;
        
        // Color según tipo
        this.color = this.obtenerColorPorTipo();
    }

    obtenerColorPorTipo() {
        switch (this.tipo) {
            case 'articulo': return '#ff6b6b';
            case 'sustantivo': return '#51cf66';
            case 'verbo': return '#74c0fc';
            default: return '#ffffff';
        }
    }

    dibujar() {
        if (!this.activa) return;

        this.animacionTime += 0.02; // Reducido de 0.05 a 0.02 para animación más lenta
        this.pulso = Math.sin(this.animacionTime * 1.5) * 0.05 + 1; // Pulso más sutil

        ctx.save();
        
        // Efecto de flotación más suave
        const flotacion = Math.sin(this.y * 0.005 + this.animacionTime * 0.8) * 1.5; // Reducido movimiento
        const oscilacionX = Math.cos(this.animacionTime * 0.4) * 0.5; // Oscilación más sutil
        
        ctx.translate(this.x + flotacion + oscilacionX, this.y);
        ctx.rotate(this.rotacion * (this.y * 0.002 + this.animacionTime * 0.05)); // Rotación más lenta
        ctx.scale(this.escala * this.pulso, this.escala * this.pulso);
        
        // Medir texto con fuente más pequeña
        ctx.font = '12px Orbitron, monospace';
        const medidas = ctx.measureText(this.palabra);
        const ancho = medidas.width + 14;
        const alto = 20;
        
        // Aura exterior
        this.dibujarAura(ancho, alto);
        
        // Fondo con gradiente animado más sutil
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, ancho/2);
        const intensidad = 0.8 + 0.2 * Math.sin(this.animacionTime * 0.8); // Animación más lenta
        gradient.addColorStop(0, `rgba(0, 0, 0, ${0.9 * intensidad})`);
        gradient.addColorStop(0.7, `rgba(50, 50, 50, ${0.8 * intensidad})`);
        gradient.addColorStop(1, `rgba(20, 20, 20, ${0.6 * intensidad})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-ancho/2, -alto/2, ancho, alto);
        
        // Borde brillante más suave
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2 + Math.sin(this.animacionTime * 1.5) * 0.3; // Variación más sutil
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6; // Reducido de 8
        ctx.strokeRect(-ancho/2, -alto/2, ancho, alto);
        
        // Efecto de resplandor interno más tenue
        ctx.shadowBlur = 10; // Reducido de 15
        ctx.strokeRect(-ancho/2, -alto/2, ancho, alto);
        ctx.shadowBlur = 0;
        
        // Texto con efectos
        this.dibujarTextoAnimado();
        
        // Partículas ambientales
        this.actualizarParticulasAmbiente(ancho, alto);
        
        ctx.restore();
    }

    dibujarAura(ancho, alto) {
        const auraSize = (ancho + alto) / 2 + 10;
        const auraIntensity = 0.2 + 0.1 * Math.sin(this.animacionTime * 2);
        
        for (let i = 0; i < 3; i++) {
            ctx.globalAlpha = auraIntensity / (i + 1);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3 - i;
            ctx.strokeRect(-ancho/2 - i*2, -alto/2 - i*2, ancho + i*4, alto + i*4);
        }
        ctx.globalAlpha = 1;
    }

    dibujarTextoAnimado() {
        const brilloTexto = 0.9 + 0.1 * Math.sin(this.animacionTime * 1.2); // Brillo más sutil
        
        // Sombra del texto con efecto
        ctx.globalAlpha = 0.4 * brilloTexto; // Sombra más tenue
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.palabra, 1.5, 1.5); // Sombra más sutil
        
        // Texto principal con brillo suave
        ctx.globalAlpha = brilloTexto;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 3; // Reducido de 5
        ctx.fillText(this.palabra, 0, 0);
        
        // Texto superpuesto más tenue
        ctx.globalAlpha = brilloTexto * 0.3; // Reducido de 0.6
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 1; // Reducido de 2
        ctx.fillText(this.palabra, 0, 0);
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    actualizarParticulasAmbiente(ancho, alto) {
        // Crear nuevas partículas con menos frecuencia
        if (Math.random() < 0.04) { // Reducido de 0.08 a 0.04
            this.particulasAmbiente.push({
                x: (Math.random() - 0.5) * ancho,
                y: (Math.random() - 0.5) * alto,
                velX: (Math.random() - 0.5) * 1, // Velocidad reducida
                velY: (Math.random() - 0.5) * 1, // Velocidad reducida
                vida: 60 + Math.random() * 30, // Vida más larga
                tamaño: Math.random() * 1.5 + 0.3, // Tamaño más pequeño
                color: this.color
            });
        }
        
        // Actualizar y dibujar partículas
        for (let i = this.particulasAmbiente.length - 1; i >= 0; i--) {
            const particula = this.particulasAmbiente[i];
            particula.x += particula.velX;
            particula.y += particula.velY;
            particula.vida--;
            particula.velX *= 0.99; // Fricción más suave
            particula.velY *= 0.99; // Fricción más suave
            
            if (particula.vida <= 0) {
                this.particulasAmbiente.splice(i, 1);
                continue;
            }
            
            const alpha = particula.vida / 90; // Desvanecimiento más gradual
            ctx.globalAlpha = alpha * 0.6; // Menos opacidad
            ctx.fillStyle = particula.color;
            ctx.beginPath();
            ctx.arc(particula.x, particula.y, particula.tamaño, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    actualizar() {
        // Aplicar multiplicador de velocidad si hay referencia al juego
        if (this.juegoRef) {
            this.velocidad = this.velocidadBase * this.juegoRef.multiplicadorVelocidad;
        }
        
        this.y += this.velocidad;
        this.rotacion += 0.0002; // Rotación mucho más suave (era 0.0005)
        this.animacionTime += 0.02; // Velocidad de animación más lenta
        
        // Variación muy sutil en la velocidad para movimiento más orgánico
        this.velocidad += Math.sin(this.animacionTime) * 0.005; // Reducido de 0.01
        
        if (this.y > canvas.height + 50) {
            this.activa = false;
        }
    }

    obtenerRect() {
        ctx.font = '12px Orbitron, monospace'; // Mantener consistencia
        const medidas = ctx.measureText(this.palabra);
        return {
            x: this.x - medidas.width / 2 - 6, // Ajustado para nueva dimensión
            y: this.y - 9, // Ajustado para nueva altura
            width: medidas.width + 12, // Igual que en dibujar()
            height: 18 // Igual que en dibujar()
        };
    }
}

// Clase principal del juego
class Juego {
    constructor() {
        // Verificar que canvas esté disponible
        if (!canvas) {
            console.error("❌ Canvas no disponible en constructor");
            return;
        }
        
        this.nave = new Nave(canvas.width / 2 - 30, canvas.height - 80);
        this.palabrasCayendo = [];
        this.explosiones = [];
        this.puntuacion = 0;
        this.vidas = 5;
        this.tiempoUltimaPalabra = Date.now();
        this.juegoTerminado = false;
        
        // Autómatas
        this.automataWords = new AutomataFinitoDeterminista(TODAS_LAS_PALABRAS);
        this.automataSentences = new AutomataOraciones();
        
        // Estado de movimiento de nave
        this.naveMoviendo = false;
        this.objetivoX = 0;
        this.palabraObjetivo = null;
        this.tiempoInicioMovimiento = 0;
        this.TIMEOUT_MOVIMIENTO = 3000; // 3 segundos timeout
        
        // Sistema de generación de palabras mejorado
        this.MAX_PALABRAS_PANTALLA = 4; // Máximo de palabras simultáneas al inicio
        this.tiempoBaseGeneracion = 2000; // 2 segundos base entre palabras
        this.multiplicadorVelocidad = 1.0; // Multiplicador de velocidad basado en puntuación
        this.nivelDificultad = 1; // Nivel actual de dificultad
        
        // Construcción de oración con orden estricto
        this.estadoOracion = 0; // 0=esperando artículo, 1=esperando sustantivo, 2=esperando verbo, 3=completa
        this.oracionActual = {
            articulo: null,
            sustantivo: null,
            verbo: null
        };
        this.oracionEnProgreso = false;
        this.generoOracion = null; // Para mantener concordancia
        
        // Estadísticas simplificadas
        this.oracionesCompletas = 0;
        this.bonusOracion = 0;
        
        // Input
        this.palabraActual = "";
        
        this.inicializar();
    }

    inicializar() {
        // Mostrar vocabulario
        mostrarVocabulario();
        
        // Configurar eventos
        this.configurarEventos();
        
        console.log("🎮 Juego inicializado");
    }

    configurarEventos() {
        const input = document.getElementById('wordInput');
        const fireButton = document.getElementById('fireButton');
        
        input.addEventListener('input', (e) => {
            this.palabraActual = e.target.value.toUpperCase();
            this.analizarTipeoEnTiempoReal();
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.procesarDisparo();
            }
        });
        
        fireButton.addEventListener('click', () => {
            this.procesarDisparo();
        });

        // Tecla de emergencia para limpiar movimiento de nave
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.limpiarMovimientoNave();
                console.log("🆘 Movimiento de nave forzadamente limpiado con Escape");
            }
        });
    }

    analizarTipeoEnTiempoReal() {
        const preview = document.getElementById('typing-preview');
        const status = document.getElementById('typing-status');
        
        if (this.palabraActual.length === 0) {
            preview.innerHTML = '';
            status.textContent = '';
            return;
        }
        
        // Verificar prefijo con el autómata
        const resultado = this.automataWords.verificarPrefijo(this.palabraActual);
        
        // Generar HTML con colores para cada letra
        let html = '';
        for (let i = 0; i < this.palabraActual.length; i++) {
            const letra = this.palabraActual[i];
            let clase = 'letter ';
            
            if (i < resultado.path.length - 1) {
                // Letra válida hasta ahora
                clase += 'valid';
            } else if (i === resultado.path.length - 1 && resultado.valido) {
                // Última letra válida
                clase += resultado.esPalabraCompleta ? 'valid' : 'partial';
            } else {
                // Letra inválida
                clase += 'invalid';
            }
            
            html += `<span class="${clase}">${letra}</span>`;
        }
        
        preview.innerHTML = html;
        
        // Actualizar estado
        if (resultado.valido) {
            if (resultado.esPalabraCompleta) {
                const palabraCompleta = this.automataWords.procesarCadena(this.palabraActual);
                status.textContent = `✅ Palabra completa: ${palabraCompleta.tipo}`;
                status.style.color = '#00ff00';
            } else {
                status.textContent = `⏳ Escribiendo... (${resultado.posiblesContinuaciones.length} continuaciones posibles)`;
                status.style.color = '#ffff00';
            }
        } else {
            status.textContent = '❌ Secuencia inválida';
            status.style.color = '#ff0000';
        }
    }

    procesarDisparo() {
        const input = document.getElementById('wordInput');
        const palabra = input.value.trim().toUpperCase();
        
        if (!palabra) return;
        
        // Limpiar input
        input.value = '';
        this.palabraActual = '';
        document.getElementById('typing-preview').innerHTML = '';
        document.getElementById('typing-status').textContent = '';
        
        // Verificar con autómata
        const resultado = this.automataWords.procesarCadena(palabra);
        
        if (resultado.aceptada) {
            console.log(`✅ Palabra validada: ${palabra} (${resultado.tipo})`);
            
            // Actualizar interfaz de análisis
            this.actualizarAnalisisPalabra(palabra, resultado.tipo);
            
            // Buscar palabra en pantalla
            const objetivo = this.buscarPalabraObjetivo(palabra);
            if (objetivo) {
                this.naveMoviendo = true;
                this.objetivoX = objetivo.x;
                this.palabraObjetivo = objetivo;
                this.tiempoInicioMovimiento = Date.now();
                console.log(`🎯 Objetivo encontrado: ${palabra} en posición ${objetivo.x}`);
            } else {
                this.vidas--;
                console.log(`❌ Palabra válida pero no en pantalla: ${palabra}`);
            }
        } else {
            this.vidas--;
            console.log(`❌ Palabra rechazada: ${palabra}`);
            this.actualizarAnalisisPalabra(palabra, null, "Palabra no válida");
        }
        
        this.actualizarUI();
    }

    actualizarAnalisisPalabra(palabra, tipo, error = null) {
        const currentWord = document.getElementById('current-word');
        const wordType = document.getElementById('word-type');
        const wordStatus = document.getElementById('word-status');
        
        currentWord.textContent = palabra;
        
        if (error) {
            wordType.textContent = error;
            wordType.className = 'word-type';
            wordStatus.textContent = '';
        } else {
            wordType.textContent = this.obtenerNombreTipo(tipo);
            wordType.className = `word-type ${tipo}`;
            wordStatus.textContent = `Válida - Tipo: ${tipo}`;
            
            // Destacar en vocabulario
            destacarPalabraEnVocabulario(palabra, tipo);
        }
    }

    obtenerNombreTipo(tipo) {
        switch (tipo) {
            case 'articulo': return '📄 ARTÍCULO';
            case 'sustantivo': return '🏠 SUSTANTIVO';
            case 'verbo': return '⚡ VERBO';
            default: return '❓ DESCONOCIDO';
        }
    }

    procesarPalabraParaOracion(palabra, tipo) {
        // Lógica de orden estricto: Artículo → Sustantivo → Verbo
        let exito = false;
        let esCompleta = false;
        let descripcion = "";
        
        switch (this.estadoOracion) {
            case 0: // Esperando artículo
                if (tipo === 'articulo') {
                    this.oracionActual.articulo = palabra;
                    this.generoOracion = obtenerGeneroArticulo(palabra);
                    this.estadoOracion = 1;
                    this.oracionEnProgreso = true;
                    exito = true;
                    descripcion = `Artículo agregado (${this.generoOracion}). Esperando sustantivo...`;
                    console.log(`📄 Artículo agregado: ${palabra} (${this.generoOracion})`);
                } else {
                    descripcion = "Se necesita un artículo primero";
                    console.log(`❌ Se esperaba artículo, recibido: ${tipo}`);
                }
                break;
                
            case 1: // Esperando sustantivo
                if (tipo === 'sustantivo') {
                    // Verificar concordancia gramatical
                    if (esConcordanciaValida(this.oracionActual.articulo, palabra)) {
                        this.oracionActual.sustantivo = palabra;
                        this.estadoOracion = 2;
                        exito = true;
                        descripcion = "Sustantivo agregado. Esperando verbo...";
                        console.log(`🏠 Sustantivo agregado: ${palabra} (concordancia correcta)`);
                    } else {
                        descripcion = `❌ Concordancia incorrecta: "${this.oracionActual.articulo}" no concuerda con "${palabra}"`;
                        console.log(`❌ Error de concordancia: ${this.oracionActual.articulo} + ${palabra}`);
                        // No reiniciar, mantener el artículo
                    }
                } else if (tipo === 'articulo') {
                    // Reiniciar con nuevo artículo
                    this.limpiarOracion();
                    this.oracionActual.articulo = palabra;
                    this.generoOracion = obtenerGeneroArticulo(palabra);
                    this.estadoOracion = 1;
                    this.oracionEnProgreso = true;
                    exito = true;
                    descripcion = `Nuevo artículo (${this.generoOracion}). Esperando sustantivo...`;
                    console.log(`🔄 Reiniciado con nuevo artículo: ${palabra} (${this.generoOracion})`);
                } else {
                    descripcion = "Se necesita un sustantivo o un nuevo artículo";
                    console.log(`❌ Se esperaba sustantivo, recibido: ${tipo}`);
                }
                break;
                
            case 2: // Esperando verbo
                if (tipo === 'verbo') {
                    this.oracionActual.verbo = palabra;
                    this.estadoOracion = 3;
                    exito = true;
                    esCompleta = true;
                    descripcion = "¡Oración completa!";
                    console.log(`⚡ Verbo agregado: ${palabra} - ¡ORACIÓN COMPLETA!`);
                } else if (tipo === 'articulo') {
                    // Reiniciar con nuevo artículo
                    this.limpiarOracion();
                    this.oracionActual.articulo = palabra;
                    this.generoOracion = obtenerGeneroArticulo(palabra);
                    this.estadoOracion = 1;
                    this.oracionEnProgreso = true;
                    exito = true;
                    descripcion = `Nuevo artículo (${this.generoOracion}). Esperando sustantivo...`;
                    console.log(`🔄 Reiniciado con nuevo artículo: ${palabra} (${this.generoOracion})`);
                } else {
                    descripcion = "Se necesita un verbo o un nuevo artículo";
                    console.log(`❌ Se esperaba verbo, recibido: ${tipo}`);
                }
                break;
        }
        
        // Si la oración está completa
        if (esCompleta) {
            this.oracionesCompletas++;
            this.bonusOracion += 500;
            this.puntuacion += 500;
            console.log(`🎉 ¡Oración completa! "${this.oracionActual.articulo} ${this.oracionActual.sustantivo} ${this.oracionActual.verbo}" +500 puntos`);
            
            // Efecto visual
            this.crearEfectoOracionCompleta();
            
            // Reiniciar después de un momento
            setTimeout(() => {
                this.limpiarOracion();
            }, 2000);
        }
        
        this.actualizarInterfazOracion(descripcion);
    }

    crearEfectoOracionCompleta() {
        // Crear explosión de celebración
        for (let i = 0; i < 50; i++) {
            this.explosiones.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: canvas.height / 2 + (Math.random() - 0.5) * 200,
                velX: (Math.random() - 0.5) * 10,
                velY: (Math.random() - 0.5) * 10,
                vida: 60,
                color: ['#ffff00', '#ff00ff', '#00ffff', '#00ff00'][Math.floor(Math.random() * 4)],
                tamaño: Math.random() * 5 + 2
            });
        }
    }

    actualizarInterfazOracion(descripcion = "") {
        // Actualizar partes de la oración
        const articulo = document.getElementById('articulo-value');
        const sustantivo = document.getElementById('sustantivo-value');
        const verbo = document.getElementById('verbo-value');
        
        articulo.textContent = this.oracionActual.articulo || '_';
        sustantivo.textContent = this.oracionActual.sustantivo || '_';
        verbo.textContent = this.oracionActual.verbo || '_';
        
        // Actualizar clases visuales de los contenedores de palabras
        const articuloContainer = articulo.parentElement;
        const sustantivoContainer = sustantivo.parentElement;
        const verboContainer = verbo.parentElement;
        
        // Resetear clases
        articuloContainer.classList.remove('filled');
        sustantivoContainer.classList.remove('filled');
        verboContainer.classList.remove('filled');
        
        // Aplicar clase 'filled' si tienen contenido
        if (this.oracionActual.articulo) {
            articuloContainer.classList.add('filled');
        }
        if (this.oracionActual.sustantivo) {
            sustantivoContainer.classList.add('filled');
        }
        if (this.oracionActual.verbo) {
            verboContainer.classList.add('filled');
        }
        
        // Actualizar indicadores de progreso (nueva estructura)
        const stepArticulo = document.getElementById('step-articulo');
        const stepSustantivo = document.getElementById('step-sustantivo');
        const stepVerbo = document.getElementById('step-verbo');
        
        // Verificar que existen los elementos antes de usarlos
        if (stepArticulo && stepSustantivo && stepVerbo) {
            // Limpiar clases
            stepArticulo.className = 'step';
            stepSustantivo.className = 'step';
            stepVerbo.className = 'step';
            
            // Aplicar estado según progreso
            if (this.oracionActual.articulo) {
                stepArticulo.classList.add('completed');
            }
            if (this.oracionActual.sustantivo) {
                stepSustantivo.classList.add('completed');
            }
            if (this.oracionActual.verbo) {
                stepVerbo.classList.add('completed');
            }
            
            // Resaltar el paso actual
            switch (this.estadoOracion) {
                case 0:
                    stepArticulo.classList.add('current');
                    break;
                case 1:
                    stepSustantivo.classList.add('current');
                    break;
                case 2:
                    stepVerbo.classList.add('current');
                    break;
            }
        }
        
        // Estado de la oración
        const sentenceStatus = document.getElementById('sentence-status');
        
        if (this.estadoOracion === 3) {
            sentenceStatus.textContent = '🎉 ¡ORACIÓN COMPLETA!';
            sentenceStatus.className = 'sentence-status complete';
        } else {
            sentenceStatus.textContent = descripcion || this.obtenerDescripcionEstado();
            sentenceStatus.className = 'sentence-status';
        }
    }

    obtenerDescripcionEstado() {
        switch (this.estadoOracion) {
            case 0: return '📄 Esperando artículo (EL, LA, UN, UNA...)';
            case 1: 
                if (this.oracionActual.articulo) {
                    const compatibles = obtenerSustantivosCompatibles(this.oracionActual.articulo);
                    const ejemplos = compatibles.slice(0, 3).join(', ');
                    return `🏠 Esperando sustantivo ${this.generoOracion} (${ejemplos}...)`;
                }
                return '🏠 Esperando sustantivo (GATO, CASA, PERRO...)';
            case 2: return '⚡ Esperando verbo (CORRE, COME, SALTA...)';
            default: return '';
        }
    }

    limpiarOracion() {
        this.estadoOracion = 0;
        this.oracionEnProgreso = false;
        this.generoOracion = null;
        this.oracionActual = {
            articulo: null,
            sustantivo: null,
            verbo: null
        };
        this.actualizarInterfazOracion();
        console.log("🗑️ Oración limpiada");
    }

    limpiarMovimientoNave() {
        this.naveMoviendo = false;
        this.palabraObjetivo = null;
        this.objetivoX = 0;
        this.tiempoInicioMovimiento = 0;
        console.log("🔄 Movimiento de nave reiniciado");
    }

    buscarPalabraObjetivo(palabra) {
        // Buscar la palabra más cercana a la nave
        let palabraObjetivo = null;
        let distanciaMinima = Infinity;
        
        for (const palabraCayendo of this.palabrasCayendo) {
            if (palabraCayendo.activa && palabraCayendo.palabra === palabra) {
                const distancia = Math.abs(palabraCayendo.x - this.nave.x);
                if (distancia < distanciaMinima) {
                    distanciaMinima = distancia;
                    palabraObjetivo = palabraCayendo;
                }
            }
        }
        return palabraObjetivo;
    }

    generarPalabra() {
        const tiempoActual = Date.now();
        
        // Contar palabras activas en pantalla
        const palabrasActivas = this.palabrasCayendo.filter(p => p.activa).length;
        
        // No generar si ya hay el máximo de palabras
        if (palabrasActivas >= this.MAX_PALABRAS_PANTALLA) {
            return;
        }
        
        // Calcular tiempo dinámico basado en dificultad
        const tiempoEspera = this.tiempoBaseGeneracion + Math.random() * 500; // Variación aleatoria
        
        if (tiempoActual - this.tiempoUltimaPalabra > tiempoEspera) {
            const x = Math.random() * (canvas.width - 120) + 60;
            
            // Sistema inteligente de generación basado en necesidades de oración
            let palabra, tipo;
            const tipoNecesario = this.obtenerTipoNecesarioParaOracion();
            
            // Mayor probabilidad de generar palabra necesaria en niveles altos
            const probabilidadNecesaria = Math.min(0.3 + (this.nivelDificultad - 1) * 0.1, 0.7);
            
            if (tipoNecesario && Math.random() < probabilidadNecesaria) {
                palabra = this.obtenerPalabraAleatoriaPorTipo(tipoNecesario);
                tipo = tipoNecesario;
            } else {
                // Generación normal con distribución equilibrada
                const tiposDisponibles = ['articulo', 'sustantivo', 'verbo'];
                const tipoAleatorio = tiposDisponibles[Math.floor(Math.random() * tiposDisponibles.length)];
                palabra = this.obtenerPalabraAleatoriaPorTipo(tipoAleatorio);
                tipo = tipoAleatorio;
            }
            
            // Verificar si ya existe esta palabra en pantalla
            this.verificarYEliminarDuplicados(palabra);
            
            const nuevaPalabra = new PalabraCayendo(x, -50, palabra, tipo, this);
            this.palabrasCayendo.push(nuevaPalabra);
            this.tiempoUltimaPalabra = tiempoActual;
            
            console.log(`📝 Nueva palabra: ${palabra} (${tipo}) - Activas: ${palabrasActivas + 1}/${this.MAX_PALABRAS_PANTALLA}`);
        }
    }

    verificarYEliminarDuplicados(nuevaPalabra) {
        // Buscar palabras con el mismo texto que ya estén cayendo
        const palabrasDuplicadas = this.palabrasCayendo.filter(p => 
            p.activa && p.palabra === nuevaPalabra
        );
        
        if (palabrasDuplicadas.length > 0) {
            // Encontrar la palabra más cercana a la línea de peligro (mayor Y)
            let palabraMasCercana = palabrasDuplicadas[0];
            for (const palabra of palabrasDuplicadas) {
                if (palabra.y > palabraMasCercana.y) {
                    palabraMasCercana = palabra;
                }
            }
            
            // Crear efecto de explosión en la palabra eliminada
            this.crearExplosion(palabraMasCercana.x, palabraMasCercana.y, palabraMasCercana.color);
            
            // Eliminar la palabra más cercana al peligro
            palabraMasCercana.activa = false;
            
            console.log(`🗑️ Palabra duplicada eliminada: ${nuevaPalabra} (más cercana al peligro)`);
        }
    }

    obtenerTipoNecesarioParaOracion() {
        // Determinar qué tipo de palabra falta para completar la oración en orden
        switch (this.estadoOracion) {
            case 0: return 'articulo';
            case 1: return 'sustantivo';
            case 2: return 'verbo';
            default: return null;
        }
    }

    obtenerPalabraAleatoriaPorTipo(tipo) {
        let listaPalabras;
        switch (tipo) {
            case 'articulo':
                listaPalabras = ARTICULOS;
                break;
            case 'sustantivo':
                listaPalabras = SUSTANTIVOS;
                break;
            case 'verbo':
                listaPalabras = VERBOS;
                break;
            default:
                listaPalabras = TODAS_LAS_PALABRAS;
        }
        return listaPalabras[Math.floor(Math.random() * listaPalabras.length)];
    }

    calcularDificultadProgresiva() {
        // Calcular nivel de dificultad basado en puntuación
        const nivelAnterior = this.nivelDificultad;
        this.nivelDificultad = Math.floor(this.puntuacion / 500) + 1; // Cada 500 puntos sube el nivel
        
        // Aumentar velocidad progresivamente (hasta un máximo de 3x)
        this.multiplicadorVelocidad = Math.min(1.0 + (this.nivelDificultad - 1) * 0.15, 3.0);
        
        // Aumentar límite de palabras gradualmente (máximo 8)
        this.MAX_PALABRAS_PANTALLA = Math.min(4 + Math.floor((this.nivelDificultad - 1) / 2), 8);
        
        // Reducir tiempo entre generaciones (mínimo 800ms)
        this.tiempoBaseGeneracion = Math.max(2000 - (this.nivelDificultad - 1) * 150, 800);
        
        // Notificar cambio de nivel
        if (this.nivelDificultad > nivelAnterior) {
            console.log(`🎯 ¡Nivel ${this.nivelDificultad}! Velocidad: ${this.multiplicadorVelocidad.toFixed(1)}x, Máx palabras: ${this.MAX_PALABRAS_PANTALLA}, Intervalo: ${this.tiempoBaseGeneracion}ms`);
        }
    }

    actualizarMovimientoNave() {
        if (this.naveMoviendo) {
            // Verificar timeout
            const tiempoTranscurrido = Date.now() - this.tiempoInicioMovimiento;
            if (tiempoTranscurrido > this.TIMEOUT_MOVIMIENTO) {
                console.log(`⏰ Timeout en movimiento de nave`);
                this.naveMoviendo = false;
                this.palabraObjetivo = null;
                return;
            }
            
            // Verificar si la palabra objetivo aún existe y está activa
            if (this.palabraObjetivo && !this.palabraObjetivo.activa) {
                console.log(`❌ Palabra objetivo eliminada durante movimiento`);
                this.naveMoviendo = false;
                this.palabraObjetivo = null;
                return;
            }
            
            // Intentar llegar al objetivo con mayor tolerancia
            if (this.nave.moverAObjetivo(this.objetivoX)) {
                // Disparar a la palabra objetivo específica
                if (this.palabraObjetivo && this.palabraObjetivo.activa) {
                    this.nave.disparar(this.palabraObjetivo.palabra);
                    console.log(`🚀 Disparo realizado a: ${this.palabraObjetivo.palabra}`);
                }
                this.naveMoviendo = false;
                this.palabraObjetivo = null;
            }
        }
    }

    obtenerPalabraEnPosicion(x) {
        for (const palabra of this.palabrasCayendo) {
            if (palabra.activa && Math.abs(palabra.x - x) < 50) {
                return palabra;
            }
        }
        return null;
    }

    verificarColisiones() {
        for (let i = this.nave.disparos.length - 1; i >= 0; i--) {
            const disparo = this.nave.disparos[i];
            if (!disparo.activo) continue;
            
            for (let j = this.palabrasCayendo.length - 1; j >= 0; j--) {
                const palabra = this.palabrasCayendo[j];
                if (!palabra.activa) continue;
                
                if (disparo.palabra === palabra.palabra && this.colisionan(disparo.obtenerRect(), palabra.obtenerRect())) {
                    // Crear explosión
                    this.crearExplosion(palabra.x, palabra.y, palabra.color);
                    
                    // Eliminar
                    disparo.activo = false;
                    palabra.activa = false;
                    
                    // Sistema de puntos mejorado basado en longitud
                    const longitudPalabra = palabra.palabra.length;
                    let puntos;
                    
                    if (longitudPalabra <= 3) {
                        puntos = longitudPalabra * 10; // Palabras cortas: 10-30 puntos
                    } else if (longitudPalabra <= 5) {
                        puntos = longitudPalabra * 15; // Palabras medianas: 60-75 puntos
                    } else if (longitudPalabra <= 7) {
                        puntos = longitudPalabra * 20; // Palabras largas: 120-140 puntos
                    } else {
                        puntos = longitudPalabra * 25; // Palabras muy largas: 200+ puntos
                    }
                    
                    // Bonus adicional por longitud excepcional
                    if (longitudPalabra >= 8) {
                        puntos += 50; // Bonus extra para palabras muy largas
                    }
                    
                    this.puntuacion += puntos;
                    
                    // NUEVO: Procesar palabra para construcción de oración por destrucción
                    this.procesarPalabraDestruida(palabra.palabra, palabra.tipo);
                    
                    console.log(`💥 Colisión: ${palabra.palabra} (${longitudPalabra} letras) +${puntos} puntos`);
                    break;
                }
            }
        }
    }

    procesarPalabraDestruida(palabra, tipo) {
        // Sistema de construcción de oración por destrucción consecutiva
        let exito = false;
        let esCompleta = false;
        let descripcion = "";
        
        switch (this.estadoOracion) {
            case 0: // Esperando artículo
                if (tipo === 'articulo') {
                    this.oracionActual.articulo = palabra;
                    this.generoOracion = obtenerGeneroArticulo(palabra);
                    this.estadoOracion = 1;
                    this.oracionEnProgreso = true;
                    exito = true;
                    descripcion = `Artículo destruido (${this.generoOracion}). Esperando sustantivo...`;
                    console.log(`📄 Artículo destruido: ${palabra} (${this.generoOracion})`);
                } else {
                    descripcion = "Necesitas destruir un artículo primero";
                    console.log(`❌ Se esperaba destruir artículo, destruido: ${tipo}`);
                }
                break;
                
            case 1: // Esperando sustantivo
                if (tipo === 'sustantivo') {
                    // Verificar concordancia gramatical
                    if (esConcordanciaValida(this.oracionActual.articulo, palabra)) {
                        this.oracionActual.sustantivo = palabra;
                        this.estadoOracion = 2;
                        exito = true;
                        descripcion = "Sustantivo destruido. Esperando verbo...";
                        console.log(`🏠 Sustantivo destruido: ${palabra} (concordancia correcta)`);
                    } else {
                        descripcion = `❌ Concordancia incorrecta: "${this.oracionActual.articulo}" no concuerda con "${palabra}"`;
                        console.log(`❌ Error de concordancia: ${this.oracionActual.articulo} + ${palabra}`);
                        // Reiniciar la secuencia
                        this.limpiarOracion();
                        descripcion += " - Secuencia reiniciada";
                    }
                } else if (tipo === 'articulo') {
                    // Reiniciar con nuevo artículo
                    this.limpiarOracion();
                    this.oracionActual.articulo = palabra;
                    this.generoOracion = obtenerGeneroArticulo(palabra);
                    this.estadoOracion = 1;
                    this.oracionEnProgreso = true;
                    exito = true;
                    descripcion = `Nueva secuencia: Artículo destruido (${this.generoOracion}). Esperando sustantivo...`;
                    console.log(`🔄 Nueva secuencia con artículo: ${palabra} (${this.generoOracion})`);
                } else {
                    descripcion = "Necesitas destruir un sustantivo o reiniciar con un artículo";
                    console.log(`❌ Se esperaba destruir sustantivo, destruido: ${tipo}`);
                    // Romper la secuencia
                    this.limpiarOracion();
                    descripcion += " - Secuencia rota";
                }
                break;
                
            case 2: // Esperando verbo
                if (tipo === 'verbo') {
                    this.oracionActual.verbo = palabra;
                    this.estadoOracion = 3;
                    exito = true;
                    esCompleta = true;
                    descripcion = "¡Oración completa por destrucción!";
                    console.log(`⚡ Verbo destruido: ${palabra} - ¡ORACIÓN COMPLETA POR DESTRUCCIÓN!`);
                } else if (tipo === 'articulo') {
                    // Reiniciar con nuevo artículo
                    this.limpiarOracion();
                    this.oracionActual.articulo = palabra;
                    this.generoOracion = obtenerGeneroArticulo(palabra);
                    this.estadoOracion = 1;
                    this.oracionEnProgreso = true;
                    exito = true;
                    descripcion = `Nueva secuencia: Artículo destruido (${this.generoOracion}). Esperando sustantivo...`;
                    console.log(`🔄 Nueva secuencia con artículo: ${palabra} (${this.generoOracion})`);
                } else {
                    descripcion = "Necesitas destruir un verbo o reiniciar con un artículo";
                    console.log(`❌ Se esperaba destruir verbo, destruido: ${tipo}`);
                    // Romper la secuencia
                    this.limpiarOracion();
                    descripcion += " - Secuencia rota";
                }
                break;
        }
        
        // Si la oración está completa por destrucción
        if (esCompleta) {
            this.oracionesCompletas++;
            const bonusDestruccion = 750; // Bonus extra por completar por destrucción
            this.bonusOracion += bonusDestruccion;
            this.puntuacion += bonusDestruccion;
            console.log(`🎉 ¡Oración completa por destrucción! "${this.oracionActual.articulo} ${this.oracionActual.sustantivo} ${this.oracionActual.verbo}" +${bonusDestruccion} puntos`);
            
            // Efecto visual más espectacular para destrucción
            this.crearEfectoOracionCompletaDestruccion();
            
            // Reiniciar después de un momento
            setTimeout(() => {
                this.limpiarOracion();
            }, 3000); // Más tiempo para apreciar el logro
        }
        
        this.actualizarInterfazOracion(descripcion);
    }

    crearEfectoOracionCompletaDestruccion() {
        // Efecto más espectacular para oraciones completadas por destrucción
        for (let i = 0; i < 80; i++) {
            this.explosiones.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 300,
                y: canvas.height / 2 + (Math.random() - 0.5) * 250,
                velX: (Math.random() - 0.5) * 15,
                velY: (Math.random() - 0.5) * 15,
                vida: 90,
                color: ['#ffff00', '#ff00ff', '#00ffff', '#00ff00', '#ff6b6b'][Math.floor(Math.random() * 5)],
                tamaño: Math.random() * 8 + 3
            });
        }
        
        // Ondas expansivas múltiples
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.explosiones.push({
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    velX: 0,
                    velY: 0,
                    vida: 60,
                    color: '#ffffff',
                    tamaño: 10,
                    tipo: 'onda'
                });
            }, i * 200);
        }
    }

    colisionan(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    crearExplosion(x, y, color) {
        // Explosión principal más espectacular
        for (let i = 0; i < 25; i++) {
            this.explosiones.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                velX: (Math.random() - 0.5) * 12,
                velY: (Math.random() - 0.5) * 12,
                vida: 60 + Math.random() * 30,
                color: color,
                tamaño: Math.random() * 6 + 2,
                tipo: 'normal'
            });
        }
        
        // Chispas adicionales
        for (let i = 0; i < 15; i++) {
            this.explosiones.push({
                x: x,
                y: y,
                velX: (Math.random() - 0.5) * 8,
                velY: (Math.random() - 0.5) * 8,
                vida: 40,
                color: '#ffffff',
                tamaño: Math.random() * 2 + 1,
                tipo: 'chispa'
            });
        }
        
        // Onda expansiva
        this.explosiones.push({
            x: x,
            y: y,
            velX: 0,
            velY: 0,
            vida: 30,
            color: color,
            tamaño: 5,
            tipo: 'onda'
        });
    }

    verificarPalabrasPerdidas() {
        for (let i = this.palabrasCayendo.length - 1; i >= 0; i--) {
            const palabra = this.palabrasCayendo[i];
            if (palabra.y > canvas.height - 100) {
                palabra.activa = false;
                this.vidas--;
                console.log(`💔 Palabra perdida: ${palabra.palabra} (Vidas: ${this.vidas})`);
            }
        }
    }

    actualizarExplosiones() {
        for (let i = this.explosiones.length - 1; i >= 0; i--) {
            const explosion = this.explosiones[i];
            
            if (explosion.tipo === 'onda') {
                // Onda expansiva
                explosion.tamaño += 2;
                explosion.vida--;
            } else {
                // Partículas normales y chispas
                explosion.x += explosion.velX;
                explosion.y += explosion.velY;
                explosion.vida--;
                explosion.velX *= 0.95;
                explosion.velY *= 0.95;
                
                if (explosion.tipo === 'chispa') {
                    explosion.velY += 0.2; // Gravedad en chispas
                }
            }
            
            if (explosion.vida <= 0) {
                this.explosiones.splice(i, 1);
            }
        }
    }

    actualizar() {
        // Generar nuevas palabras
        this.generarPalabra();
        
        // Actualizar nave y disparos
        this.actualizarMovimientoNave();
        this.nave.actualizar();
        
        // Actualizar palabras cayendo
        this.palabrasCayendo.forEach(palabra => palabra.actualizar());
        this.palabrasCayendo = this.palabrasCayendo.filter(palabra => palabra.activa);
        
        // Verificar colisiones
        this.verificarColisiones();
        this.verificarPalabrasPerdidas();
        this.actualizarExplosiones();
        
        // Actualizar dificultad progresiva
        this.calcularDificultadProgresiva();
        
        // Verificar fin del juego
        if (this.vidas <= 0) {
            this.finalizarJuego();
        }
        
        this.actualizarUI();
    }

    dibujar() {
        // Limpiar canvas
        ctx.fillStyle = 'rgba(0, 4, 40, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Fondo estrellado
        this.dibujarEstrellas();
        
        // Línea de peligro
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 100);
        ctx.lineTo(canvas.width, canvas.height - 100);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Dibujar objetos del juego
        this.nave.dibujar();
        
        this.nave.disparos.forEach(disparo => disparo.dibujar());
        this.palabrasCayendo.forEach(palabra => palabra.dibujar());
        
        // Dibujar explosiones
        this.explosiones.forEach(explosion => {
            ctx.fillStyle = explosion.color;
            ctx.globalAlpha = explosion.vida / 40;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.tamaño, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        
        // Texto de línea de peligro
        ctx.fillStyle = '#ff0000';
        ctx.font = '16px Orbitron, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('¡LÍNEA DE PELIGRO!', canvas.width - 20, canvas.height - 110);
    }

    dibujarEstrellas() {
        // Dibujar estrellas fijas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 47) % canvas.width;
            const y = (i * 31) % canvas.height;
            const brillo = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5;
            
            ctx.globalAlpha = brillo;
            ctx.fillRect(x, y, 1, 1);
        }
        ctx.globalAlpha = 1;
    }

    actualizarUI() {
        document.getElementById('score').textContent = this.puntuacion;
        
        // Actualizar vidas como corazones grandes
        const livesContainer = document.getElementById('lives-hearts');
        livesContainer.innerHTML = '';
        for (let i = 0; i < this.vidas; i++) {
            const heart = document.createElement('span');
            heart.className = 'life-heart-large';
            heart.textContent = '❤️';
            livesContainer.appendChild(heart);
        }
        
        // Actualizar bonus si existe
        const bonusElement = document.getElementById('sentence-bonus');
        if (bonusElement) {
            bonusElement.textContent = this.bonusOracion || 0;
        }
    }

    finalizarJuego() {
        // Prevenir múltiples ejecuciones
        if (this.juegoTerminado) return;
        this.juegoTerminado = true;
        
        console.log(`🎮 ¡Juego terminado!`);
        console.log(`📊 Puntuación final: ${this.puntuacion}`);
        console.log(`📊 Oraciones completas: ${this.oracionesCompletas}`);
        
        // Mostrar modal de fin de juego
        setTimeout(() => {
            alert(`¡Juego terminado!\n\nPuntuación: ${this.puntuacion}\nOraciones completas: ${this.oracionesCompletas}`);
            
            // Reiniciar después de un breve delay
            setTimeout(() => {
                location.reload();
            }, 100);
        }, 500);
    }
}

// Función de bucle principal
function gameLoop() {
    game.actualizar();
    game.dibujar();
    requestAnimationFrame(gameLoop);
}

// Función para redimensionar canvas
function resizeCanvas() {
    // Dimensiones responsivas basadas en el tamaño de pantalla
    let canvasWidth, canvasHeight;
    
    if (window.innerWidth <= 600) {
        canvasWidth = 400;
        canvasHeight = 300;
    } else if (window.innerWidth <= 900) {
        canvasWidth = 500;
        canvasHeight = 375;
    } else if (window.innerWidth <= 1200) {
        canvasWidth = 650;
        canvasHeight = 487;
    } else {
        canvasWidth = 800;
        canvasHeight = 600;
    }
    
    // Aplicar dimensiones
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    console.log(`📐 Canvas configurado: ${canvasWidth}x${canvasHeight} para pantalla ${window.innerWidth}px`);
}

// Inicialización
window.addEventListener('load', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Configurar canvas responsivo
    resizeCanvas();
    
    // Redimensionar en cambios de ventana
    window.addEventListener('resize', () => {
        resizeCanvas();
        // Reinicializar posiciones del juego si es necesario
        if (game && game.nave) {
            game.nave.x = canvas.width / 2 - game.nave.ancho / 2;
        }
    });
    
    // Crear juego
    game = new Juego();
    
    // Iniciar bucle
    gameLoop();
    
    console.log("🚀 Juego iniciado con canvas responsivo");
});

// Funciones para mostrar tabs del modal
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Exportar para uso global
window.showTab = showTab;
