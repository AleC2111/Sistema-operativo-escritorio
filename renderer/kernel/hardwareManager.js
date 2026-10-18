// Controlador de Hardware, Núcleos de CPU, Disco y Periféricos USB (Hardware Manager)
import { simEngine } from './simulationEngine.js';
import { sounds } from '../../assets/audio/soundEffects.js';

export class HardwareManager {
  constructor() {
    this.listeners = new Set();

    // 1. CPU Multi-Core y Registros
    this.cores = [
      { id: 0, load: 35, temp: 42, currentPid: 4 },
      { id: 1, load: 20, temp: 39, currentPid: 100 },
      { id: 2, load: 15, temp: 38, currentPid: null },
      { id: 3, load: 5,  temp: 36, currentPid: null }
    ];

    this.registers = {
      PC: '0x00401A20',
      IR: 'MOV [AX], BX',
      AX: '0x0000004A',
      BX: '0x00001000',
      CX: '0x00000008',
      DX: '0x00000000',
      SP: '0x0012FF88',
      FLAGS: 'ZF=0 SF=0 IF=1'
    };

    // 2. Disco Rígido y Planificador de Cabezal
    this.diskTracksCount = 200;
    this.diskCurrentTrack = 50;
    this.diskDirection = 1; // 1 = ascendente, -1 = descendente (para SCAN)
    this.diskQueue = [82, 170, 43, 140, 24, 16, 190];
    this.diskAlgorithm = 'SSTF'; // 'FCFS', 'SSTF', 'SCAN'
    this.totalSeekDistance = 0;
    this.isDiskSeeking = false;

    // 3. Tabla de Interrupciones (PIC/APIC)
    this.interrupts = [
      { irq: 0,  name: 'Timer del Sistema', count: 1240, active: true },
      { irq: 1,  name: 'Teclado (Keyboard)', count: 85,  active: false },
      { irq: 6,  name: 'Controlador de Disco', count: 210, active: false },
      { irq: 12, name: 'Ratón (Mouse)', count: 340, active: false },
      { irq: 14, name: 'Canal Primario IDE/SATA', count: 98, active: false }
    ];

    // 4. Periféricos y Plug & Play USB
    this.keyboardBuffer = [];
    this.printerSpooler = [
      { id: 1, docName: 'Reporte_SO_Sistemas.pdf', pages: 12, status: 'Imprimiendo' }
    ];

    this.usbPorts = [
      { port: 1, connected: true, deviceName: 'Memoria USB Kingston 32GB', vendorId: '0951', productId: '1666' },
      { port: 2, connected: false, deviceName: null, vendorId: null, productId: null }
    ];

    simEngine.subscribe((event) => {
      if (event === 'tick') {
        this.stepHardware();
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

  stepHardware() {
    // 1. Simular fluctuación de carga por núcleo
    this.cores.forEach((core, i) => {
      const base = i === 0 ? simEngine.metrics.cpuLoad : Math.floor(simEngine.metrics.cpuLoad / (i + 1));
      core.load = Math.max(5, Math.min(100, base + Math.floor(Math.random() * 12 - 6)));
      core.temp = 35 + Math.floor(core.load * 0.35);
    });

    // 2. Incrementar contador de IRQ 0 (Timer)
    this.interrupts[0].count += 10;

    // 3. Procesar cola de disco si hay peticiones
    if (this.diskQueue.length > 0 && Math.random() < 0.6) {
      this.stepDiskHead();
    }

    // 4. Actualizar registros simulados
    const randVal = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
    this.registers.AX = `0x0000${randVal}`;
    const pcNum = parseInt(this.registers.PC, 16) + 4;
    this.registers.PC = `0x${pcNum.toString(16).toUpperCase().padStart(8, '0')}`;

    this.notify('hardwareUpdated', {
      cores: this.cores,
      registers: this.registers,
      diskTrack: this.diskCurrentTrack,
      diskQueue: this.diskQueue,
      seekDistance: this.totalSeekDistance,
      interrupts: this.interrupts,
      usbPorts: this.usbPorts,
      printerSpooler: this.printerSpooler
    });
  }

  stepDiskHead() {
    if (this.diskQueue.length === 0) return;

    let targetTrack = null;
    let targetIndex = -1;

    if (this.diskAlgorithm === 'FCFS') {
      targetTrack = this.diskQueue[0];
      targetIndex = 0;
    } else if (this.diskAlgorithm === 'SSTF') {
      // Menor tiempo de búsqueda (menor diferencia de pista)
      let minDiff = Infinity;
      this.diskQueue.forEach((t, idx) => {
        const diff = Math.abs(t - this.diskCurrentTrack);
        if (diff < minDiff) {
          minDiff = diff;
          targetTrack = t;
          targetIndex = idx;
        }
      });
    } else if (this.diskAlgorithm === 'SCAN') {
      // Algoritmo del ascensor: busca pistas en la dirección actual
      const filtered = this.diskQueue.filter(t => this.diskDirection === 1 ? t >= this.diskCurrentTrack : t <= this.diskCurrentTrack);
      if (filtered.length > 0) {
        targetTrack = this.diskDirection === 1 ? Math.min(...filtered) : Math.max(...filtered);
        targetIndex = this.diskQueue.indexOf(targetTrack);
      } else {
        // Cambiar dirección
        this.diskDirection *= -1;
        this.stepDiskHead();
        return;
      }
    }

    if (targetTrack !== null && targetIndex !== -1) {
      const distance = Math.abs(targetTrack - this.diskCurrentTrack);
      this.totalSeekDistance += distance;
      this.diskCurrentTrack = targetTrack;
      this.diskQueue.splice(targetIndex, 1);
      this.interrupts[2].count++; // IRQ 6 Disk controller

      this.notify('diskSeek', {
        track: this.diskCurrentTrack,
        distance,
        totalDistance: this.totalSeekDistance
      });
    }
  }

  addDiskRequest(track) {
    const t = Math.max(0, Math.min(199, track));
    this.diskQueue.push(t);
    this.notify('diskQueueUpdated', { queue: this.diskQueue });
  }

  setDiskAlgorithm(algo) {
    this.diskAlgorithm = algo;
    this.notify('diskAlgorithmChanged', { algorithm: algo });
  }

  triggerInterrupt(irqNumber) {
    const irq = this.interrupts.find(i => i.irq === irqNumber);
    if (irq) {
      irq.count++;
      irq.active = true;
      sounds.playInterrupt();
      simEngine.metrics.interruptsCount++;
      this.notify('interruptTriggered', { irq });
      setTimeout(() => {
        irq.active = false;
        this.notify('interruptCleared', { irq });
      }, 500);
    }
  }

  // Plug & Play USB
  toggleUsbDevice(portNum) {
    const port = this.usbPorts.find(p => p.port === portNum);
    if (!port) return;

    if (port.connected) {
      // Desconectar
      port.connected = false;
      port.deviceName = null;
      port.vendorId = null;
      port.productId = null;
      sounds.playDeviceDisconnect();
      this.notify('usbDisconnected', { port: portNum });
    } else {
      // Conectar nuevo dispositivo
      port.connected = true;
      port.deviceName = portNum === 1 ? 'Memoria USB Sandisk 64GB' : 'Webcam Logitech HD Pro';
      port.vendorId = '0781';
      port.productId = '5583';
      sounds.playDeviceConnect();
      this.triggerInterrupt(1); // Simula interrupción de E/S
      this.notify('usbConnected', { port: portNum, device: port.deviceName });
    }
  }

  typeKey(char) {
    this.keyboardBuffer.push(char);
    this.triggerInterrupt(1); // IRQ 1 Teclado
    if (this.keyboardBuffer.length > 20) {
      this.keyboardBuffer.shift();
    }
    this.notify('keyPressed', { char, buffer: this.keyboardBuffer });
  }
}

export const hardwareManager = new HardwareManager();
