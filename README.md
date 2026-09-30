# Práctica 04 - Simulador de Crecimiento de Agave Azul

**Autor:** Chavarin & Godinez  
**Materia:** Bioinformática y Biología Computacional Avanzados

## Descripción del Proyecto
Este proyecto evoluciona la representación estática del *Agave tequilana Weber variedad azul* hacia un **simulador de crecimiento dinámico**. Utilizando el bucle de renderizado de Three.js, el usuario puede observar y controlar en tiempo real cómo la planta se desarrolla desde su etapa inicial (brote de la piña), seguido del crecimiento de su follaje (pencas), hasta la maduración final con el brote del tallo floral (quiote).

## Cumplimiento de Requisitos (Práctica 04)
* **Bucle de Animación:** Implementado mediante `requestAnimationFrame` y `THREE.Clock` para un crecimiento fluido basado en deltas de tiempo.
* **Simulación de Crecimiento (Escala):** Animación progresiva mediante interpolación matemática de las propiedades `.scale` en las jerarquías (Piña → Pencas → Quiote).
* **Físicas de Viento (Rotación):** Se aplicaron oscilaciones sinusoidales (`Math.sin`) sobre el eje Z de los pivotes individuales de las pencas para simular viento orgánico.
* **Interfaz HTML/CSS:** 
  * Sliders para controlar la velocidad de crecimiento y la intensidad del viento.
  * Botones de control para pausar/reanudar físicas, reiniciar la planta, simular sequía (cambio de material) y reiniciar cámara.
  * Botón interactivo para visualizar el cuestionario técnico de la práctica.
* **Raycasting Dinámico:** El panel de información ahora calcula y muestra el porcentaje de crecimiento (0% a 100%) en tiempo real del objeto seleccionado.

## Cómo Ejecutar
1. Clonar el repositorio.
2. Iniciar un servidor local (Ej. extensión Live Server en VS Code).
3. Abrir el archivo `index.html` en el navegador.