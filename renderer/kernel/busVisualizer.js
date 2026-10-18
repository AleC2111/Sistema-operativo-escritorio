// Visualizador de Buses del Sistema y Flujo de Llamadas al Sistema (User Ring 3 -> Kernel Ring 0)
import { simEngine } from './simulationEngine.js';

export class BusVisualizer {
  constructor() {
    this.syslog = [];
    this.maxSyslog = 80;
    this.listeners = new Set();
    this.activePackets = []; // Paquetes en tránsito por los buses

    this.initDefaultLogs();

    simEngine.subscribe((event, data) => {
      if (event === 'tick') {
        this.onTick(data.tick);
      }
    });
  }

  initDefaultLogs() {
    this.log('INIT', 'Núcleo del Sistema Operativo AeroOS iniciado correctamente.', 'info');
    this.log('ACPI', 'Configuración de energía y APIC inicializados.', 'info');
    this.log('MMU', 'Paginación habilitada. Tabla de páginas base en 0x00100000.', 'info');
    this.log('SCHED', 'Planificador Round Robin cargado. Quantum = 3 ciclos.', 'dispatch');
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, data) {
    this.listeners.forEach(cb => cb(event, data));
  }

  log(tag, message, type = 'info') {
    const timestamp = new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100);
    const entry = {
      timestamp,
      tag,
      message,
      type
    };

    this.syslog.unshift(entry);
    if (this.syslog.length > this.maxSyslog) {
      this.syslog.pop();
    }

    this.notify('logAdded', entry);
  }

  triggerSyscall(syscallName, callingPid, args = '') {
    simEngine.metrics.systemCallsCount++;
    this.log('SYSCALL', `PID ${callingPid} ejecutó ${syscallName}(${args}) [Transición Ring 3 -> Ring 0]`, 'syscall');
    
    // Disparar animación de señal por el Bus de Control
    this.emitBusPacket('CONTROL', 'CPU -> Kernel', '#f6ad55');
    this.emitBusPacket('DATA', 'RAM <-> CPU', '#00f2fe');

    this.notify('syscallExecuted', { syscall: syscallName, pid: callingPid });
  }

  emitBusPacket(busType, route, color) {
    const packet = {
      id: Math.random(),
      busType,
      route,
      color,
      progress: 0
    };
    this.activePackets.push(packet);
    this.notify('busPacket', packet);
  }

  onTick(tick) {
    // Generar logs periódicos de actividades del núcleo
    if (tick % 4 === 0) {
      this.log('SCHED', `Cambio de contexto realizado en núcleo de CPU.`, 'dispatch');
    }
    if (tick % 7 === 0) {
      this.log('IRQ', `PIC IRQ 0 atendida por el despachador de interrupciones.`, 'irq');
    }
    if (tick % 10 === 0) {
      this.triggerSyscall('sys_clock_gettime', 4, 'CLOCK_REALTIME');
    }
  }
}

export const busVisualizer = new BusVisualizer();
