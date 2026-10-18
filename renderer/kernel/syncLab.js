// Laboratorio de Sincronización, Concurrencia y Detección de Deadlocks
import { simEngine } from './simulationEngine.js';

export class SyncLab {
  constructor() {
    this.listeners = new Set();

    // ==========================================
    // 1. PRODUCTOR - CONSUMIDOR (BOUNDED BUFFER)
    // ==========================================
    this.bufferCapacity = 6;
    this.buffer = []; // Elementos en el buffer: { id, value, timestamp }
    this.mutexLocked = false;
    this.raceConditionMode = false; // Si true, ignora mutex para demostrar condición de carrera
    this.raceConditionDetected = false;
    this.producerActive = false;
    this.consumerActive = false;
    this.nextItemId = 1;

    // Semáforos clásicos de Dijkstra
    this.semMutex = 1;
    this.semEmpty = this.bufferCapacity;
    this.semFull = 0;

    // ==========================================
    // 2. CENA DE LOS FILÓSOFOS
    // ==========================================
    this.philosophers = [
      { id: 0, name: 'Platón', state: 'PENSANDO', mealsEaten: 0, leftChopstick: 0, rightChopstick: 1 },
      { id: 1, name: 'Aristóteles', state: 'PENSANDO', mealsEaten: 0, leftChopstick: 1, rightChopstick: 2 },
      { id: 2, name: 'Sócrates', state: 'PENSANDO', mealsEaten: 0, leftChopstick: 2, rightChopstick: 3 },
      { id: 3, name: 'Descartes', state: 'PENSANDO', mealsEaten: 0, leftChopstick: 3, rightChopstick: 4 },
      { id: 4, name: 'Kant', state: 'PENSANDO', mealsEaten: 0, leftChopstick: 4, rightChopstick: 0 }
    ];
    this.chopsticks = [false, false, false, false, false]; // true = tomado por alguien
    this.philosopherDeadlockPrevention = true; // Si es falso, puede ocurrir deadlock circular

    // ==========================================
    // 3. GRAFO DE ASIGNACIÓN DE RECURSOS (RAG)
    // ==========================================
    this.ragProcesses = ['P1', 'P2', 'P3'];
    this.ragResources = ['R1 (Disco)', 'R2 (Impresora)', 'R3 (Memoria)'];
    this.ragAllocations = [ // R -> P
      { from: 'R1 (Disco)', to: 'P1' },
      { from: 'R2 (Impresora)', to: 'P2' }
    ];
    this.ragRequests = [ // P -> R
      { from: 'P1', to: 'R2 (Impresora)' },
      { from: 'P2', to: 'R1 (Disco)' } // Genera ciclo de interbloqueo inicial P1 -> R2 -> P2 -> R1 -> P1
    ];
    this.hasDeadlock = true;

    simEngine.subscribe((event) => {
      if (event === 'tick') {
        this.stepSimulation();
      }
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, data) {
    this.listeners.forEach(cb => cb(event, data));
  }

  // --- MÉTODOS DE PRODUCTOR-CONSUMIDOR ---
  produceItem() {
    if (this.semEmpty <= 0 && !this.raceConditionMode) {
      this.notify('producerBlocked', { reason: 'Buffer lleno (semEmpty = 0)' });
      return false;
    }

    if (this.mutexLocked && !this.raceConditionMode) {
      this.notify('producerBlocked', { reason: 'Mutex ocupado por consumidor' });
      return false;
    }

    if (this.raceConditionMode && this.consumerActive) {
      // Conflicto de condición de carrera!
      this.raceConditionDetected = true;
      this.notify('raceCondition', { msg: '¡Condición de Carrera! Productor y Consumidor escribieron simultáneamente.' });
    }

    this.mutexLocked = true;
    this.producerActive = true;

    const item = {
      id: this.nextItemId++,
      value: `Dato_${Math.floor(Math.random() * 900 + 100)}`,
      time: new Date().toLocaleTimeString()
    };

    this.buffer.push(item);
    this.semEmpty = Math.max(0, this.bufferCapacity - this.buffer.length);
    this.semFull = this.buffer.length;

    setTimeout(() => {
      this.mutexLocked = false;
      this.producerActive = false;
      this.notify('itemProduced', { item, buffer: this.buffer });
    }, 150);

    return true;
  }

  consumeItem() {
    if (this.semFull <= 0 && !this.raceConditionMode) {
      this.notify('consumerBlocked', { reason: 'Buffer vacío (semFull = 0)' });
      return false;
    }

    if (this.mutexLocked && !this.raceConditionMode) {
      this.notify('consumerBlocked', { reason: 'Mutex ocupado por productor' });
      return false;
    }

    if (this.raceConditionMode && this.producerActive) {
      this.raceConditionDetected = true;
      this.notify('raceCondition', { msg: '¡Condición de Carrera! Consumidor leyó mientras el productor modificaba el puntero.' });
    }

    this.mutexLocked = true;
    this.consumerActive = true;

    const item = this.buffer.shift();
    this.semEmpty = Math.max(0, this.bufferCapacity - this.buffer.length);
    this.semFull = this.buffer.length;

    setTimeout(() => {
      this.mutexLocked = false;
      this.consumerActive = false;
      this.notify('itemConsumed', { item, buffer: this.buffer });
    }, 150);

    return true;
  }

  toggleRaceConditionMode() {
    this.raceConditionMode = !this.raceConditionMode;
    this.raceConditionDetected = false;
    this.notify('raceModeChanged', { raceMode: this.raceConditionMode });
  }

  // --- MÉTODOS DE FILÓSOFOS ---
  stepPhilosophers() {
    const p = this.philosophers[Math.floor(Math.random() * this.philosophers.length)];

    if (p.state === 'PENSANDO') {
      p.state = 'HAMBRIENTO';
    } else if (p.state === 'HAMBRIENTO') {
      if (this.philosopherDeadlockPrevention) {
        // Solución simétrica protegida: solo come si ambos palillos están libres
        if (!this.chopsticks[p.leftChopstick] && !this.chopsticks[p.rightChopstick]) {
          this.chopsticks[p.leftChopstick] = true;
          this.chopsticks[p.rightChopstick] = true;
          p.state = 'COMIENDO';
          p.mealsEaten++;
        }
      } else {
        // Modo ingenuo: toma el izquierdo primero
        if (!this.chopsticks[p.leftChopstick]) {
          this.chopsticks[p.leftChopstick] = true;
          if (!this.chopsticks[p.rightChopstick]) {
            this.chopsticks[p.rightChopstick] = true;
            p.state = 'COMIENDO';
            p.mealsEaten++;
          }
        }
      }
    } else if (p.state === 'COMIENDO') {
      // Termina de comer y libera ambos palillos
      this.chopsticks[p.leftChopstick] = false;
      this.chopsticks[p.rightChopstick] = false;
      p.state = 'PENSANDO';
    }

    this.notify('philosophersUpdated', {
      philosophers: this.philosophers,
      chopsticks: this.chopsticks,
      prevention: this.philosopherDeadlockPrevention
    });
  }

  togglePhilosopherDeadlockPrevention() {
    this.philosopherDeadlockPrevention = !this.philosopherDeadlockPrevention;
    this.notify('philosopherModeChanged', { prevention: this.philosopherDeadlockPrevention });
  }

  // --- MÉTODOS DE DETECCIÓN DE DEADLOCK (RAG) ---
  checkDeadlock() {
    // Algoritmo de detección de ciclos en grafo dirigido
    const adj = new Map();
    [...this.ragProcesses, ...this.ragResources].forEach(node => adj.set(node, []));

    this.ragAllocations.forEach(edge => {
      adj.get(edge.from)?.push(edge.to);
    });
    this.ragRequests.forEach(edge => {
      adj.get(edge.from)?.push(edge.to);
    });

    const visited = new Set();
    const recStack = new Set();
    let cycleFound = false;

    const isCyclicUtil = (curr) => {
      visited.add(curr);
      recStack.add(curr);

      const neighbors = adj.get(curr) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (isCyclicUtil(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(curr);
      return false;
    };

    for (const node of adj.keys()) {
      if (!visited.has(node)) {
        if (isCyclicUtil(node)) {
          cycleFound = true;
          break;
        }
      }
    }

    this.hasDeadlock = cycleFound;
    this.notify('deadlockChecked', { hasDeadlock: this.hasDeadlock });
    return this.hasDeadlock;
  }

  resolveDeadlock() {
    // Romper ciclo liberando la petición P2 -> R1
    this.ragRequests = this.ragRequests.filter(req => !(req.from === 'P2' && req.to === 'R1 (Disco)'));
    this.checkDeadlock();
  }

  stepSimulation() {
    // Realizar pasos automáticos si se desea
    if (Math.random() < 0.6) {
      this.stepPhilosophers();
    }
  }
}

export const syncLab = new SyncLab();
