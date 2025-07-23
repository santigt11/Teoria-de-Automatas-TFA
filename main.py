import pygame

import random

import sys



# Inicializar Pygame

pygame.init()



# Constantes

ANCHO_VENTANA = 800

ALTO_VENTANA = 600

FPS = 60



# Colores

NEGRO = (0, 0, 0)

BLANCO = (255, 255, 255)

VERDE = (0, 255, 0)

ROJO = (255, 0, 0)

AZUL = (0, 0, 255)

AMARILLO = (255, 255, 0)

CYAN = (0, 255, 255)



# Lista de palabras para que caigan

PALABRAS_JUEGO = [

    "PYTHON", "JUEGO", "CODIGO", "NAVE", "DISPARO", "PALABRA", "TEXTO", "LETRA",

    "PROGRAMA", "FUNCION", "CLASE", "OBJETO", "METODO", "VARIABLE", "BUCLE",

    "CONDICIONAL", "ARRAY", "LISTA", "DICCIONARIO", "CADENA", "NUMERO", "BOOLEAN"

]



class AutomataFinitoDeterminista:
    def __init__(self, palabras):
        """Inicializa el AFD con una lista de palabras válidas"""
        self.palabras = [palabra.upper() for palabra in palabras]
        self.estados = {}
        self.estado_inicial = 0
        self.estados_finales = set()
        self.transiciones = {}
        self.construir_automata()
    
    def construir_automata(self):
        """Construye el AFD usando un trie (árbol de prefijos)"""
        # Crear estado inicial
        self.estados[0] = {"es_final": False, "palabra": ""}
        contador_estado = 1
        
        for palabra in self.palabras:
            estado_actual = 0
            
            for i, caracter in enumerate(palabra):
                # Buscar si ya existe una transición desde el estado actual con este carácter
                if (estado_actual, caracter) not in self.transiciones:
                    # Crear nuevo estado
                    nuevo_estado = contador_estado
                    contador_estado += 1
                    
                    # Agregar el nuevo estado
                    es_final = (i == len(palabra) - 1)
                    self.estados[nuevo_estado] = {
                        "es_final": es_final,
                        "palabra": palabra if es_final else ""
                    }
                    
                    # Crear transición
                    self.transiciones[(estado_actual, caracter)] = nuevo_estado
                    
                    # Si es estado final, agregarlo al conjunto
                    if es_final:
                        self.estados_finales.add(nuevo_estado)
                else:
                    # Usar estado existente
                    nuevo_estado = self.transiciones[(estado_actual, caracter)]
                    
                    # Si llegamos al final de la palabra, marcar como final
                    if i == len(palabra) - 1:
                        self.estados[nuevo_estado]["es_final"] = True
                        self.estados[nuevo_estado]["palabra"] = palabra
                        self.estados_finales.add(nuevo_estado)
                
                estado_actual = nuevo_estado
    
    def procesar_cadena(self, cadena):
        """Procesa una cadena y retorna si es aceptada por el autómata"""
        cadena = cadena.upper().strip()
        estado_actual = self.estado_inicial
        
        for caracter in cadena:
            if (estado_actual, caracter) in self.transiciones:
                estado_actual = self.transiciones[(estado_actual, caracter)]
            else:
                return False, None  # Transición no válida
        
        # Verificar si el estado actual es final
        if estado_actual in self.estados_finales:
            return True, self.estados[estado_actual]["palabra"]
        else:
            return False, None
    
    def es_palabra_valida(self, palabra):
        """Verifica si una palabra es válida según el autómata"""
        aceptada, palabra_reconocida = self.procesar_cadena(palabra)
        return aceptada
    
    def obtener_palabra_reconocida(self, palabra):
        """Obtiene la palabra completa reconocida por el autómata"""
        aceptada, palabra_reconocida = self.procesar_cadena(palabra)
        return palabra_reconocida if aceptada else None
    
    def mostrar_automata(self):
        """Muestra la estructura del autómata (para depuración)"""
        print("=== AUTÓMATA FINITO DETERMINISTA ===")
        print(f"Estado inicial: {self.estado_inicial}")
        print(f"Estados finales: {self.estados_finales}")
        print("\nEstados:")
        for estado, info in self.estados.items():
            tipo = "FINAL" if info["es_final"] else "INTERMEDIO"
            palabra = f" (palabra: {info['palabra']})" if info["palabra"] else ""
            print(f"  Estado {estado}: {tipo}{palabra}")
        
        print("\nTransiciones:")
        for (origen, caracter), destino in self.transiciones.items():
            print(f"  δ({origen}, '{caracter}') = {destino}")
        print("=====================================\n")



class Nave:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.ancho = 60
        self.alto = 40
        self.velocidad = 12
        self.disparos = []



    def dibujar(self, pantalla):

        # Cuerpo principal de la nave

        pygame.draw.polygon(pantalla, VERDE, [

            (self.x, self.y + self.alto),

            (self.x + self.ancho // 2, self.y),

            (self.x + self.ancho, self.y + self.alto)

        ])



        # Base de la nave

        pygame.draw.rect(pantalla, VERDE,

                         (self.x + 10, self.y + self.alto - 5, self.ancho - 20, 5))



        # Cañones laterales

        pygame.draw.rect(pantalla, VERDE,

                         (self.x + 5, self.y + self.alto - 15, 8, 10))

        pygame.draw.rect(pantalla, VERDE,

                         (self.x + self.ancho - 13, self.y + self.alto - 15, 8, 10))



    def mover(self, direccion):

        if direccion == "izquierda" and self.x > 0:

            self.x -= self.velocidad

        elif direccion == "derecha" and self.x < ANCHO_VENTANA - self.ancho:

            self.x += self.velocidad



    def mover_a_objetivo(self, objetivo_x):

        """Mueve la nave hacia la posición x del objetivo"""

        centro_nave = self.x + self.ancho // 2

        diferencia = objetivo_x - centro_nave



        if abs(diferencia) > 3:  # Tolerancia reducida para movimiento más preciso

            if diferencia > 0:

                self.x = min(self.x + self.velocidad, ANCHO_VENTANA - self.ancho)

            else:

                self.x = max(self.x - self.velocidad, 0)

        return abs(diferencia) <= 3  # Retorna True si llegó al objetivo



    def disparar(self, palabra_objetivo):

        if palabra_objetivo and len(palabra_objetivo) > 0:

            nuevo_disparo = Disparo(self.x + self.ancho // 2, self.y, palabra_objetivo)

            self.disparos.append(nuevo_disparo)



    def actualizar_disparos(self):

        self.disparos = [disparo for disparo in self.disparos if disparo.activo]

        for disparo in self.disparos:

            disparo.mover()





class Disparo:
    def __init__(self, x, y, palabra):
        self.x = x
        self.y = y
        self.velocidad = 8
        self.palabra = palabra.upper()
        self.activo = True
        self.ancho = 4
        self.alto = 15



    def mover(self):

        self.y -= self.velocidad

        if self.y < 0:

            self.activo = False



    def dibujar(self, pantalla, fuente):

        if self.activo:

            # Dibujar el disparo como un rayo

            pygame.draw.rect(pantalla, AMARILLO, (self.x - 2, self.y, self.ancho, self.alto))

            pygame.draw.rect(pantalla, BLANCO, (self.x - 1, self.y, 2, self.alto))



            # Dibujar la palabra encima del disparo

            texto_superficie = fuente.render(self.palabra, True, CYAN)

            texto_rect = texto_superficie.get_rect(center=(self.x, self.y - 20))

            pantalla.blit(texto_superficie, texto_rect)



    def obtener_rect(self):

        return pygame.Rect(self.x - 2, self.y, self.ancho, self.alto)





class PalabraCayendo:
    def __init__(self, x, y, palabra):
        self.x = x
        self.y = y
        self.palabra = palabra.upper()
        self.velocidad = random.uniform(0.5, 1.5)
        self.activa = True
        self.color = BLANCO



    def mover(self):

        self.y += self.velocidad

        if self.y > ALTO_VENTANA:

            self.activa = False



    def dibujar(self, pantalla, fuente):

        if self.activa:

            # Fondo para la palabra

            texto_superficie = fuente.render(self.palabra, True, self.color)

            texto_rect = texto_superficie.get_rect(center=(self.x, self.y))



            # Dibujar fondo oscuro para mejor legibilidad

            pygame.draw.rect(pantalla, (50, 50, 50), texto_rect.inflate(10, 5))

            pygame.draw.rect(pantalla, NEGRO, texto_rect.inflate(10, 5), 2)



            pantalla.blit(texto_superficie, texto_rect)



    def obtener_rect(self):

        return pygame.Rect(self.x - 50, self.y - 15, 100, 30)





class CampoTexto:
    def __init__(self, x, y, ancho, alto):
        self.rect = pygame.Rect(x, y, ancho, alto)
        self.texto = ""
        self.activo = True
        self.color = BLANCO
        self.color_texto = NEGRO



    def manejar_evento(self, evento):

        if evento.type == pygame.KEYDOWN:

            if evento.key == pygame.K_RETURN:

                texto_actual = self.texto

                self.texto = ""

                return texto_actual

            elif evento.key == pygame.K_BACKSPACE:

                self.texto = self.texto[:-1]

            else:

                if len(self.texto) < 20:  # Limitar longitud

                    self.texto += evento.unicode.upper()

        return None



    def dibujar(self, pantalla, fuente):

        # Dibujar el campo de texto

        pygame.draw.rect(pantalla, self.color, self.rect)

        pygame.draw.rect(pantalla, NEGRO, self.rect, 2)



        # Dibujar el texto

        texto_superficie = fuente.render(self.texto, True, self.color_texto)

        pantalla.blit(texto_superficie, (self.rect.x + 5, self.rect.y + 5))



        # Dibujar cursor parpadeante

        if pygame.time.get_ticks() % 1000 < 500:

            cursor_x = self.rect.x + 5 + fuente.size(self.texto)[0]

            pygame.draw.line(pantalla, self.color_texto,

                             (cursor_x, self.rect.y + 5),

                             (cursor_x, self.rect.y + self.rect.height - 5), 2)





class Juego:
    def __init__(self):
        self.pantalla = pygame.display.set_mode((ANCHO_VENTANA, ALTO_VENTANA))
        pygame.display.set_caption("Space Invaders - Palabras con AFD")
        self.reloj = pygame.time.Clock()

        # Fuentes
        self.fuente_grande = pygame.font.Font(None, 36)
        self.fuente_mediana = pygame.font.Font(None, 24)
        self.fuente_pequeña = pygame.font.Font(None, 18)

        # Crear autómata finito determinista
        self.automata = AutomataFinitoDeterminista(PALABRAS_JUEGO)
        
        # Mostrar información del autómata al iniciar
        print("¡Autómata creado exitosamente!")
        print(f"Palabras válidas: {len(PALABRAS_JUEGO)}")
        print(f"Estados creados: {len(self.automata.estados)}")
        print(f"Transiciones: {len(self.automata.transiciones)}")
        print("=" * 50)

        # Objetos del juego
        self.nave = Nave(ANCHO_VENTANA // 2 - 30, ALTO_VENTANA - 80)
        self.campo_texto = CampoTexto(50, ALTO_VENTANA - 40, 300, 30)
        self.palabras_cayendo = []
        self.puntuacion = 0
        self.vidas = 3
        self.tiempo_ultima_palabra = pygame.time.get_ticks()

        # Control de movimiento automático
        self.nave_moviendo = False
        self.objetivo_x = 0

        # Efectos visuales
        self.explosiones = []
        
        # Estadísticas del autómata
        self.palabras_validadas_automata = 0
        self.palabras_rechazadas_automata = 0

        # Inicializar autómata finito determinista

        self.automata_afd = AutomataFinitoDeterminista(PALABRAS_JUEGO)



    def generar_palabra(self):

        tiempo_actual = pygame.time.get_ticks()

        if tiempo_actual - self.tiempo_ultima_palabra > random.randint(2000, 4000):

            x = random.randint(50, ANCHO_VENTANA - 50)

            palabra = random.choice(PALABRAS_JUEGO)

            nueva_palabra = PalabraCayendo(x, 0, palabra)

            self.palabras_cayendo.append(nueva_palabra)

            self.tiempo_ultima_palabra = tiempo_actual



    def buscar_palabra_objetivo(self, palabra):

        """Busca una palabra en las palabras cayendo y retorna su posición x"""

        for palabra_cayendo in self.palabras_cayendo:

            if palabra_cayendo.activa and palabra_cayendo.palabra == palabra.upper():

                return palabra_cayendo.x

        return None

    def procesar_disparo(self, palabra):
        """Procesa el disparo de una palabra usando el autómata"""
        if not palabra:
            return

        # Verificar la palabra con el autómata
        es_valida = self.automata.es_palabra_valida(palabra)
        palabra_reconocida = self.automata.obtener_palabra_reconocida(palabra)
        
        if es_valida and palabra_reconocida:
            self.palabras_validadas_automata += 1
            print(f"✓ Autómata validó: '{palabra}' -> '{palabra_reconocida}'")
            
            # Buscar la palabra en las palabras cayendo
            objetivo_x = self.buscar_palabra_objetivo(palabra_reconocida)
            
            if objetivo_x is not None:
                # Palabra encontrada, iniciar movimiento hacia ella
                self.objetivo_x = objetivo_x
                self.nave_moviendo = True
                print(f"🎯 Objetivo encontrado en pantalla: {palabra_reconocida}")
            else:
                # Palabra válida pero no está en pantalla
                self.vidas -= 1
                print(f"❌ Palabra válida '{palabra_reconocida}' no está en pantalla! Vidas: {self.vidas}")
        else:
            # Palabra no válida según el autómata
            self.palabras_rechazadas_automata += 1
            self.vidas -= 1
            print(f"❌ Autómata rechazó: '{palabra}' - No es una palabra válida! Vidas: {self.vidas}")



    def actualizar_movimiento_nave(self):

        """Actualiza el movimiento automático de la nave"""

        if self.nave_moviendo:

            if self.nave.mover_a_objetivo(self.objetivo_x):

                # La nave llegó al objetivo, disparar

                self.nave.disparar(self.obtener_palabra_en_posicion(self.objetivo_x))

                self.nave_moviendo = False



    def obtener_palabra_en_posicion(self, x):

        """Obtiene la palabra que está en la posición x especificada"""

        for palabra in self.palabras_cayendo:

            if palabra.activa and abs(palabra.x - x) < 50:

                return palabra.palabra

        return ""



    def verificar_colisiones(self):

        for disparo in self.nave.disparos[:]:

            for palabra in self.palabras_cayendo[:]:

                if (disparo.activo and palabra.activa and

                        disparo.palabra == palabra.palabra and

                        disparo.obtener_rect().colliderect(palabra.obtener_rect())):

                    # Crear explosión

                    self.crear_explosion(palabra.x, palabra.y)



                    # Eliminar disparo y palabra

                    disparo.activo = False

                    palabra.activa = False



                    # Sumar puntos

                    self.puntuacion += len(palabra.palabra) * 10



                    break



    def crear_explosion(self, x, y):

        for i in range(10):

            particula = {

                'x': x + random.randint(-20, 20),

                'y': y + random.randint(-20, 20),

                'vel_x': random.uniform(-3, 3),

                'vel_y': random.uniform(-3, 3),

                'vida': 30,

                'color': random.choice([AMARILLO, ROJO, BLANCO])

            }

            self.explosiones.append(particula)



    def actualizar_explosiones(self):

        for explosion in self.explosiones[:]:

            explosion['x'] += explosion['vel_x']

            explosion['y'] += explosion['vel_y']

            explosion['vida'] -= 1

            if explosion['vida'] <= 0:

                self.explosiones.remove(explosion)



    def verificar_palabras_perdidas(self):

        for palabra in self.palabras_cayendo[:]:

            if palabra.y > ALTO_VENTANA - 100:  # Línea de peligro

                palabra.activa = False

                self.vidas -= 1

    def dibujar_ui(self):
        # Puntuación
        texto_puntos = self.fuente_mediana.render(f"Puntos: {self.puntuacion}", True, BLANCO)
        self.pantalla.blit(texto_puntos, (10, 10))

        # Vidas
        texto_vidas = self.fuente_mediana.render(f"Vidas: {self.vidas}", True, BLANCO)
        self.pantalla.blit(texto_vidas, (10, 40))
        
        # Estadísticas del autómata
        texto_validadas = self.fuente_pequeña.render(f"AFD Validadas: {self.palabras_validadas_automata}", True, VERDE)
        self.pantalla.blit(texto_validadas, (10, 70))
        
        texto_rechazadas = self.fuente_pequeña.render(f"AFD Rechazadas: {self.palabras_rechazadas_automata}", True, ROJO)
        self.pantalla.blit(texto_rechazadas, (10, 90))

        # Instrucciones
        if self.nave_moviendo:
            texto_instruc = self.fuente_pequeña.render("Nave moviéndose hacia objetivo...", True, AMARILLO)
        else:
            texto_instruc = self.fuente_pequeña.render("Escribe una palabra válida y presiona ENTER", True, BLANCO)
        self.pantalla.blit(texto_instruc, (50, ALTO_VENTANA - 70))

        # Información del autómata
        texto_automata = self.fuente_pequeña.render(f"AFD: {len(self.automata.estados)} estados, {len(self.automata.transiciones)} transiciones", True, CYAN)
        self.pantalla.blit(texto_automata, (350, 10))

        # Línea de peligro
        pygame.draw.line(self.pantalla, ROJO, (0, ALTO_VENTANA - 100), (ANCHO_VENTANA, ALTO_VENTANA - 100), 2)

        # Texto de línea de peligro
        texto_peligro = self.fuente_pequeña.render("¡LÍNEA DE PELIGRO!", True, ROJO)
        self.pantalla.blit(texto_peligro, (ANCHO_VENTANA - 150, ALTO_VENTANA - 120))



    def ejecutar(self):

        ejecutando = True



        while ejecutando:

            for evento in pygame.event.get():

                if evento.type == pygame.QUIT:

                    ejecutando = False



                # Manejar entrada de texto

                palabra_disparada = self.campo_texto.manejar_evento(evento)

                if palabra_disparada:

                    self.procesar_disparo(palabra_disparada)



            # Actualizar juego

            self.generar_palabra()

            self.actualizar_movimiento_nave()

            self.nave.actualizar_disparos()



            # Mover palabras

            for palabra in self.palabras_cayendo:

                palabra.mover()



            # Limpiar palabras inactivas

            self.palabras_cayendo = [p for p in self.palabras_cayendo if p.activa]



            # Verificar colisiones

            self.verificar_colisiones()

            self.verificar_palabras_perdidas()

            self.actualizar_explosiones()            # Verificar fin del juego
            if self.vidas <= 0:
                print(f"\n🎮 ¡Juego terminado! Puntuación final: {self.puntuacion}")
                print(f"📊 Estadísticas del Autómata:")
                print(f"   - Palabras validadas: {self.palabras_validadas_automata}")
                print(f"   - Palabras rechazadas: {self.palabras_rechazadas_automata}")
                print(f"   - Estados del AFD: {len(self.automata.estados)}")
                print(f"   - Transiciones del AFD: {len(self.automata.transiciones)}")
                
                # Opción para mostrar el autómata completo
                respuesta = input("\n¿Deseas ver la estructura completa del autómata? (s/n): ")
                if respuesta.lower() == 's':
                    self.automata.mostrar_automata()
                
                ejecutando = False



            # Dibujar todo

            self.pantalla.fill(NEGRO)



            # Dibujar objetos del juego

            self.nave.dibujar(self.pantalla)



            for disparo in self.nave.disparos:

                disparo.dibujar(self.pantalla, self.fuente_pequeña)



            for palabra in self.palabras_cayendo:

                palabra.dibujar(self.pantalla, self.fuente_mediana)



            # Dibujar explosiones

            for explosion in self.explosiones:

                pygame.draw.circle(self.pantalla, explosion['color'],

                                   (int(explosion['x']), int(explosion['y'])), 3)



            # Dibujar UI

            self.campo_texto.dibujar(self.pantalla, self.fuente_mediana)

            self.dibujar_ui()



            pygame.display.flip()

            self.reloj.tick(FPS)



        pygame.quit()

        sys.exit()





# Ejecutar el juego

if __name__ == "__main__":
    juego = Juego()

    juego.ejecutar()