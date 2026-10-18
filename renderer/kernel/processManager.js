// Gestor de Procesos y Planificador del Núcleo (Process Manager & Scheduler)
import { simEngine } from './simulationEngine.js';
import { notificationManager } from './notificationManager.js';

export const ProcessState = {
  NEW: 'NUEVO',
  READY: 'LISTO',
  RUNNING: 'EJECUTANDO',
  BLOCKED: 'BLOQUEADO',
  TERMINATED: 'TERMINADO'
};

export const SchedulerAlgorithm = {
  ROUND_ROBIN: 'ROUND_ROBIN',
  FCFS: 'FCFS',
  SJF: 'SJF',
  PRIORITY: 'PRIORIDAD'
};

const COLOR_PALETTE = [
  '#2b6cb0', '#2c7a7b', '#c05621', '#9b2c2c',
  '#6b46c1', '#2f855a', '#b7791f', '#4a5568'
];

export class ProcessManager {
  constructor() {
    this.processes = [];
    this.nextPid = 100;
    this.currentAlgorithm = SchedulerAlgorithm.ROUND_ROBIN;
    this.quantum = 3; // Quantum para Round Robin (ciclos)
    this.runningProcess = null;
    this.ganttHistory = []; // Registro de { tick, pid, name, color }
    this.maxGanttLength = 40;
    this.listeners = new Set();

    this.initDefaultProcesses();
    simEngine.subscribe((event, data) => {
      if (event === 'tick') {
        this.onSimulationTick(data.tick);
      } else if (event === 'reset') {
        this.reset();
      }
    });
  }

  initDefaultProcesses() {
    this.processes = [];
    this.ganttHistory = [];
    this.runningProcess = null;

    // Procesos esenciales del sistema operativo
    this.createProcess('system.exe', 999, 128, 'Tiempo Real', false, '#1a365d', true);
    this.createProcess('explorer.exe', 8, 256, 'Alta', false, '#2b6cb0');
    this.createProcess('calc.exe', 5, 64, 'Normal', false, '#2f855a');
    this.createProcess('notepad.exe', 6, 96, 'Normal', true, '#c05621');
    this.createProcess('antivirus.exe', 10, 180, 'Baja', true, '#6b46c1');
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, data) {
    this.listeners.forEach(cb => cb(event, data));
  }

  createProcess(name, burstTime = 6, memorySize = 128, priority = 'Normal', requiresIO = false, customColor = null, isSystem = false) {
    const pid = isSystem ? 4 : this.nextPid++;
    const color = customColor || COLOR_PALETTE[pid % COLOR_PALETTE.length];
    
    const pcb = {
      pid,
      name,
      state: ProcessState.NEW,
      priority, // 'Tiempo Real' (0), 'Alta' (1), 'Normal' (2), 'Baja' (3)
      priorityLevel: this.getPriorityScore(priority),
      burstTotal: burstTime,
      burstRemaining: burstTime,
      quantumLeft: this.quantum,
      memorySize, // en KB
      memoryAddress: null, // Asignado por MemoryManager
      resources: ['CPU', 'RAM'],
      cpuPercent: 0,
      color,
      requiresIO,
      waitingReason: null,
      cyclesInReady: 0,
      isSystem
    };

    if (requiresIO) {
      pcb.resources.push('E/S Disco');
    }

    this.processes.push(pcb);
    this.notify('processCreated', pcb);

    // Notificación de nuevo proceso
    notificationManager.info('Nuevo Proceso', `Proceso creado: ${pcb.name} (PID ${pcb.pid})`);

    // Transición de NEW a READY
    setTimeout(() => {
      if (pcb.state === ProcessState.NEW) {
        pcb.state = ProcessState.READY;
        this.notify('stateChange', { pcb, from: ProcessState.NEW, to: ProcessState.READY });
      }
    }, 100);

    return pcb;
  }

  getPriorityScore(p) {
    switch (p) {
      case 'Tiempo Real': return 0;
      case 'Alta': return 1;
      case 'Normal': return 2;
      case 'Baja': return 3;
      default: return 2;
    }
  }

  killProcess(pid) {
    const p = this.processes.find(proc => proc.pid === pid);
    if (!p) return false;

    if (this.runningProcess && this.runningProcess.pid === pid) {
      this.runningProcess = null;
    }

    const prev = p.state;
    p.state = ProcessState.TERMINATED;
    p.burstRemaining = 0;
    p.cpuPercent = 0;
    this.notify('stateChange', { pcb: p, from: prev, to: ProcessState.TERMINATED });
    this.notify('processTerminated', p);

    // Notificación de proceso terminado
    notificationManager.warning('Proceso Terminado', `Proceso ${p.name} (PID ${pid}) finalizado`);

    return true;
  }

  setPriority(pid, newPriority) {
    const p = this.processes.find(proc => proc.pid === pid);
    if (p) {
      p.priority = newPriority;
      p.priorityLevel = this.getPriorityScore(newPriority);
      this.notify('processUpdated', p);
    }
  }

  setAlgorithm(algo) {
    if (Object.values(SchedulerAlgorithm).includes(algo)) {
      this.currentAlgorithm = algo;
      this.notify('algorithmChanged', { algorithm: algo });
    }
  }

  setQuantum(val) {
    this.quantum = Math.max(1, Math.min(10, val));
    if (this.runningProcess) {
      this.runningProcess.quantumLeft = this.quantum;
    }
    this.notify('quantumChanged', { quantum: this.quantum });
  }

  onSimulationTick(tick) {
    // 1. Manejo de envejecimiento (Aging) para procesos en espera
    this.processes.forEach(p => {
      if (p.state === ProcessState.READY) {
        p.cyclesInReady++;
        // Prevenir inanición: subir prioridad tras 8 ciclos esperando
        if (p.cyclesInReady > 8 && p.priorityLevel > 1 && !p.isSystem) {
          p.priorityLevel--;
          p.cyclesInReady = 0;
        }
      }
      // Reanudar procesos bloqueados aleatoriamente (E/S resuelta)
      if (p.state === ProcessState.BLOCKED) {
        if (Math.random() < 0.4) {
          p.state = ProcessState.READY;
          p.waitingReason = null;
          p.cyclesInReady = 0;
          this.notify('stateChange', { pcb: p, from: ProcessState.BLOCKED, to: ProcessState.READY });
        }
      }
    });

    // 2. Si no hay proceso en ejecución, seleccionar siguiente según el planificador
    if (!this.runningProcess || this.runningProcess.state !== ProcessState.RUNNING) {
      this.dispatchNext();
    } else {
      // Proceso actual continúa
      this.executeCycle();
    }

    // 3. Registrar en historial de Gantt
    if (this.runningProcess) {
      this.ganttHistory.push({
        tick,
        pid: this.runningProcess.pid,
        name: this.runningProcess.name,
        color: this.runningProcess.color
      });
      this.runningProcess.cpuPercent = Math.min(95, Math.floor(Math.random() * 25) + 60);
    } else {
      this.ganttHistory.push({
        tick,
        pid: 0,
        name: 'CPU Inactivo (Idle)',
        color: '#a0aec0'
      });
    }

    if (this.ganttHistory.length > this.maxGanttLength) {
      this.ganttHistory.shift();
    }

    // Calcular % de CPU global
    const activeProcs = this.processes.filter(p => p.state === ProcessState.RUNNING || p.state === ProcessState.READY);
    const globalCpu = this.runningProcess ? Math.min(100, Math.max(15, activeProcs.length * 20 + Math.floor(Math.random() * 15))) : 5;
    simEngine.metrics.cpuLoad = globalCpu;

    this.notify('tick', {
      running: this.runningProcess,
      processes: this.processes,
      gantt: this.ganttHistory
    });
  }

  dispatchNext() {
    const readyQueue = this.processes.filter(p => p.state === ProcessState.READY);
    if (readyQueue.length === 0) {
      this.runningProcess = null;
      return;
    }

    let selected = null;

    switch (this.currentAlgorithm) {
      case SchedulerAlgorithm.ROUND_ROBIN:
      case SchedulerAlgorithm.FCFS:
        selected = readyQueue[0];
        break;

      case SchedulerAlgorithm.SJF:
        // Menor tiempo restante
        selected = readyQueue.reduce((min, p) => p.burstRemaining < min.burstRemaining ? p : min, readyQueue[0]);
        break;

      case SchedulerAlgorithm.PRIORIDAD:
        // Menor score de prioridad (0 = mayor prioridad)
        selected = readyQueue.reduce((best, p) => p.priorityLevel < best.priorityLevel ? p : best, readyQueue[0]);
        break;

      default:
        selected = readyQueue[0];
    }

    if (selected) {
      if (this.runningProcess && this.runningProcess.pid !== selected.pid) {
        simEngine.metrics.contextSwitches++;
      }

      this.runningProcess = selected;
      selected.state = ProcessState.RUNNING;
      selected.quantumLeft = this.quantum;
      selected.cyclesInReady = 0;
      this.notify('stateChange', { pcb: selected, from: ProcessState.READY, to: ProcessState.RUNNING });
    }
  }

  executeCycle() {
    const p = this.runningProcess;
    if (!p) return;

    if (!p.isSystem) {
      p.burstRemaining--;
    }
    p.quantumLeft--;

    // Simular petición de E/S periódica si el proceso lo requiere
    if (p.requiresIO && Math.random() < 0.25 && p.burstRemaining > 1 && !p.isSystem) {
      p.state = ProcessState.BLOCKED;
      p.waitingReason = 'Interrupción E/S (Disco/Teclado)';
      this.notify('stateChange', { pcb: p, from: ProcessState.RUNNING, to: ProcessState.BLOCKED });
      this.runningProcess = null;
      this.dispatchNext();
      return;
    }

    // Proceso terminado
    if (p.burstRemaining <= 0 && !p.isSystem) {
      p.state = ProcessState.TERMINATED;
      p.cpuPercent = 0;
      this.notify('stateChange', { pcb: p, from: ProcessState.RUNNING, to: ProcessState.TERMINATED });
      this.notify('processTerminated', p);
      this.runningProcess = null;
      this.dispatchNext();
      return;
    }

    // Fin de Quantum en Round Robin
    if (this.currentAlgorithm === SchedulerAlgorithm.ROUND_ROBIN && p.quantumLeft <= 0) {
      // Reencolar al final de la cola de listos
      p.state = ProcessState.READY;
      p.quantumLeft = this.quantum;
      this.notify('stateChange', { pcb: p, from: ProcessState.RUNNING, to: ProcessState.READY });
      
      // Mover al final de la cola
      const idx = this.processes.indexOf(p);
      if (idx !== -1) {
        this.processes.splice(idx, 1);
        this.processes.push(p);
      }
      
      this.runningProcess = null;
      this.dispatchNext();
    }
  }

  reset() {
    this.initDefaultProcesses();
  }
}

export const processManager = new ProcessManager();
