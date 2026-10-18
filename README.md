# AeroOS - Simulador de Sistema Operativo

> **Proyecto Universitario - Sistemas Operativos (8vo Semestre)**  
> Desarrollado en **Electron**, HTML5, CSS3 y JavaScript moderno con la estética y experiencia de usuario de **Windows 7 Aero Glass**.

---

## 🌟 Características Principales

Este proyecto es un simulador pedagógico e interactivo que permite visualizar y experimentar con todas las funciones internas de un Sistema Operativo moderno:

### 1. Interfaz Intuitiva (Estética Windows 7 Aero)
- **Escritorio Interactivo**: Fondo Aurora clásico, accesos directos con doble clic, selección y accesos rápidos.
- **Ventanas Aero Glass**: Desenfoque traslúcido (`backdrop-filter: blur`), reflejos de cristal, arrastre fluido con **Aero Snap** (maximizar al borde superior, división al 50% en bordes laterales), controles clásicos de minimizar, maximizar y cerrar con iluminación reactiva.
- **Barra de Tareas y Orbe de Inicio**: Orbe 3D animado con la bandera de 4 colores, agrupación de ventanas activas, botón de Aero Peek ("Mostrar escritorio") y reloj con fecha en tiempo real.
- **Menú Inicio de Dos Columnas**: Búsqueda en tiempo real de módulos del SO, accesos directos y botones de energía (Reiniciar y Apagar simulación).
- **Gadgets de Escritorio**: Medidores analógicos circulares de uso de CPU y memoria RAM con controles rápidos de pausa y avance paso a paso.
- **Audio Retro Sintetizado**: Sonidos de arranque, clics, alertas e inserción/expulsión de dispositivos mediante la Web Audio API (sin dependencias de archivos externos).

---

### 2. Flujo de Información y Funcionamiento Interno
- **Buses del Sistema**: Animación visual en tiempo real de la transmisión de paquetes por:
  - **Bus de Datos** (Data Bus): Transferencia de información entre CPU, RAM y E/S.
  - **Bus de Direcciones** (Address Bus): Direcciones enviadas a la MMU.
  - **Bus de Control** (Control Bus): Señales de control y lectura/escritura.
- **Transición de Modos de Privilegio**: Demostración del salto de **Modo Usuario (Ring 3)** a **Modo Núcleo (Ring 0)** al invocar Llamadas al Sistema (*System Calls* como `sys_read()`, `sys_write()`, `sys_fork()`, `sys_yield()`).
- **Registro del Núcleo (Syslog Journal)**: Consola en vivo que registra cambios de contexto, disparos de interrupción y llamadas al sistema con marcas de tiempo.

---

### 3. Sincronización de Procesos, Estados y Transiciones
- **Máquina de Estados de Procesos**:
  - Visualización gráfica de las 5 transiciones fundamentales:  
    `NUEVO` $\rightarrow$ `LISTO` $\rightarrow$ `EJECUTANDO` $\rightarrow$ `BLOQUEADO` $\rightarrow$ `TERMINADO`.
  - Fichas interactivas con identificador de proceso (PID) que viajan en tiempo real entre los estados según los eventos del planificador o peticiones de E/S.
- **Algoritmos de Planificación de CPU**:
  - **Round Robin (RR)** con Quantum configurable en ciclos de reloj.
  - **FCFS** (First-Come, First-Served).
  - **SJF** (Shortest Job First / Menor tiempo restante primero).
  - **Por Prioridades** con mecanismo de **Envejecimiento (*Aging*)** para evitar la inanición (*starvation*).
- **Diagrama de Gantt Dinámico**: Registro visual cronológico de la CPU por cada ciclo de reloj.
- **Laboratorio de Concurrencia**:
  - **Productor - Consumidor**: Búfer circular acotado de 6 posiciones, variables de sincronización `mutex`, `vacio` y `lleno`. Permite desactivar el mutex para evidenciar una **Condición de Carrera (*Race Condition*)**.
  - **La Cena de los Filósofos**: Mesa circular de 5 filósofos (`PENSANDO`, `HAMBRIENTO`, `COMIENDO`) y 5 palillos con modo de prevención de Deadlock (Tanenbaum/Dijkstra).
  - **Detector de Deadlocks (Grafo RAG)**: Detección de ciclos en tiempo real (condición de espera circular) y botón para romper el ciclo liberando recursos.

---

### 4. Información del Proceso (Administrador de Tareas)
- Réplica funcional del **Administrador de Tareas de Windows 7**:
  - **Pestaña Procesos**: Tabla interactiva con PID, Nombre de imagen, Estado, Prioridad (Tiempo Real, Alta, Normal, Baja), % de CPU dinámico, Memoria asignada (KB) y Recursos/Handles asignados.
  - Acciones: Finalizar Proceso, Cambiar Prioridad y Crear nuevo proceso configurable (tiempo de ráfaga, tamaño de memoria, operaciones de E/S periódicas).
  - **Pestaña Rendimiento**: Gráficos de osciloscopio verde fluorescente estilo monitor de rendimiento con historial en vivo de CPU y RAM, además de métricas de cambios de contexto e interrupciones.

---

### 5. Gestión de Memoria: Fragmentación Interna y Externa
- **Particionamiento Contiguo Dinámico**:
  - Algoritmos de asignación: **First-Fit**, **Best-Fit** y **Worst-Fit**.
  - Mapa continuo de 0 KB a 1024 KB que muestra visualmente los bloques asignados y los huecos libres.
  - Cálculo cuantitativo en tiempo real de la **Fragmentación Externa** (memoria total libre dispersa que no puede alojar un nuevo proceso).
  - Botón **Compactar Memoria**: Agrupa los procesos en direcciones bajas para eliminar la fragmentación externa.
- **Paginación y Memoria Virtual**:
  - División de la memoria física en 32 marcos fijos (*Frames*) de 32 KB cada uno.
  - Evidencia gráfica de la **Fragmentación Interna** en la última página de cada proceso (resaltada en patrón rayado rojo con el cálculo exacto de KB desperdiciados).

---

### 6. Control de Hardware y Periféricos
- **Administrador de Dispositivos**:
  - **CPU Multi-Core**: Monitoreo independiente de los 4 núcleos (Core 0 a Core 3) con temperatura y porcentaje de carga, y banco de registros de arquitectura (`PC`, `IR`, `AX`, `BX`, `CX`, `DX`, `SP`, `FLAGS`).
  - **Disco Rígido (HDD SATA)**: Brazo lector animado sobre el plato de disco giratorio con algoritmos de planificación de cabezal (**SSTF**, **FCFS**, **SCAN/Elevator**), cálculo de cilindros recorridos y cola de solicitudes.
  - **Plug & Play USB**: Puertos USB interactivos que permiten conectar y expulsar memorias USB y cámaras web, disparando interrupciones por hardware y reproduciendo el clásico sonido de inserción de Windows 7.
  - **Controlador PIC/APIC**: Tabla de líneas de interrupción (IRQ 0 Timer, IRQ 1 Teclado, IRQ 6 Disco, IRQ 12 Ratón) con posibilidad de disparar interrupciones de prueba.

---

### 7. Símbolo del Sistema (CLI cmd.exe)
Incluye una terminal interactiva para gestionar el simulador mediante comandos:
- `help` / `ayuda`: Lista de comandos disponibles.
- `ps` / `tasklist`: Listar procesos y PCBs.
- `kill <pid>`: Terminar un proceso.
- `spawn <nombre> [ráfaga] [memoria]`: Crear un proceso.
- `sched <rr|fcfs|sjf|prio>`: Cambiar algoritmo de planificación.
- `quantum <número>`: Modificar el quantum de Round Robin.
- `mem` / `free`: Ver estadísticas de RAM y fragmentación.
- `compact`: Ejecutar compactación de memoria contigua.
- `sync`: Inspeccionar semáforos y búfer acotado.
- `irq <línea>`: Disparar una interrupción por software.
- `speed <0.2 a 5.0>`: Ajustar velocidad del reloj del SO.
- `pause` / `resume` / `step`: Control de tiempo del procesador.
- `cls` / `clear`: Limpiar consola.

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js (v18 o superior)
- npm

### Pasos para Ejecutar
1. Instalar dependencias (si no se han instalado):
   ```bash
   npm install
   ```

2. Ejecutar pruebas de sintaxis:
   ```bash
   npm test
   ```

3. Iniciar el simulador de Sistema Operativo:
   ```bash
   npm start
   ```

---

## 📁 Estructura del Proyecto

```
Sistema-operativo-escritorio/
├── package.json
├── main.js                     # Proceso principal de Electron
├── preload.js                  # Puente seguro de contexto (ContextBridge)
├── README.md                   # Documentación técnica y académica
├── assets/
│   ├── css/
│   │   ├── aero-theme.css      # Sistema de diseño Windows 7 Aero Glass
│   │   ├── desktop.css         # Escritorio, barra de tareas, menú inicio y gadgets
│   │   ├── windows.css         # Ventanas flotantes, redimensión y Aero Snap
│   │   └── modules.css         # Estilos visuales de los módulos de simulación
│   └── audio/
│       └── soundEffects.js     # Sintetizador procedural Web Audio API estilo Win 7
└── renderer/
    ├── index.html              # Shell del escritorio
    ├── app.js                  # Inicializador y orquestador del entorno
    ├── desktop/
    │   ├── windowManager.js    # Gestor de ventanas (drag, resize, snap, capas)
    │   ├── taskbar.js          # Barra de tareas, reloj y área de notificación
    │   ├── startMenu.js        # Menú inicio con búsqueda y apagado/reinicio
    │   └── gadgets.js          # Medidores circulares de CPU y RAM
    ├── kernel/
    │   ├── simulationEngine.js # Reloj de simulación y despachador de eventos
    │   ├── processManager.js   # PCB, planificador (RR, FCFS, SJF, Prioridad) y Gantt
    │   ├── memoryManager.js    # Particionamiento, paginación y fragmentación
    │   ├── syncLab.js          # Productor-Consumidor, Filósofos y Deadlocks
    │   ├── hardwareManager.js  # CPU multinúcleo, disco HDD, USB PnP e IRQ
    │   └── busVisualizer.js    # Buses del sistema y llamadas al sistema (Ring 3 a Ring 0)
    └── modules/
        ├── taskManagerView.js  # Administrador de Tareas
        ├── processStateView.js # Máquina de estados y Gantt
        ├── memoryView.js       # Gestor de memoria y fragmentación
        ├── syncView.js         # Laboratorio de sincronización
        ├── hardwareView.js     # Administrador de dispositivos y hardware
        ├── kernelFlowView.js   # Flujo de buses y syslog del núcleo
        └── terminalView.js     # Consola de comandos (cmd.exe)
```
