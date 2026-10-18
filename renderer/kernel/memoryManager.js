// Gestor de Memoria Principal (Memory Manager: Contiguo vs Paginación)
import { simEngine } from './simulationEngine.js';
import { processManager, ProcessState } from './processManager.js';
import { notificationManager } from './notificationManager.js';

export const MemoryMode = {
  CONTIGUOUS: 'CONTIGUO', // Demuestra Fragmentación Externa y Algoritmos Fit
  PAGING: 'PAGINACION'    // Demuestra Fragmentación Interna y Marcos de Página
};

export const FitAlgorithm = {
  FIRST_FIT: 'FIRST_FIT',
  BEST_FIT: 'BEST_FIT',
  WORST_FIT: 'WORST_FIT'
};

export class MemoryManager {
  constructor() {
    this.totalMemory = 1024; // 1024 KB de RAM total
    this.osReserved = 128;   // 128 KB reservados para el Kernel
    this.mode = MemoryMode.CONTIGUOUS;
    this.fitAlgorithm = FitAlgorithm.FIRST_FIT;
    
    // Parámetros de Paginación
    this.frameSize = 32; // Cada marco de página mide 32 KB
    this.totalFrames = this.totalMemory / this.frameSize; // 32 marcos
    this.frames = []; // Lista de marcos físicos
    
    // Bloques para particionamiento contiguo
    this.contiguousBlocks = [];
    
    this.listeners = new Set();

    this.initMemory();

    // Sincronizar con el ciclo de vida de los procesos
    processManager.subscribe((event, data) => {
      if (event === 'processCreated') {
        this.allocateProcess(data);
      } else if (event === 'processTerminated') {
        this.deallocateProcess(data.pid);
      }
    });

    simEngine.subscribe((event) => {
      if (event === 'reset') {
        this.initMemory();
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

  initMemory() {
    // 1. Inicializar bloques contiguos
    this.contiguousBlocks = [
      {
        id: 'kernel',
        pid: 0,
        name: 'Kernel SO (Reservado)',
        startAddr: 0,
        size: this.osReserved,
        isAllocated: true,
        color: '#1a365d'
      },
      {
        id: 'free_main',
        pid: null,
        name: 'Libre',
        startAddr: this.osReserved,
        size: this.totalMemory - this.osReserved,
        isAllocated: false,
        color: '#e2e8f0'
      }
    ];

    // 2. Inicializar marcos de paginación
    this.frames = [];
    for (let i = 0; i < this.totalFrames; i++) {
      const isKernel = i < (this.osReserved / this.frameSize);
      this.frames.push({
        frameNumber: i,
        startAddr: i * this.frameSize,
        size: this.frameSize,
        pid: isKernel ? 0 : null,
        processName: isKernel ? 'Kernel SO' : null,
        pageNumber: isKernel ? i : null,
        isAllocated: isKernel,
        usedBytes: isKernel ? this.frameSize : 0,
        internalFrag: 0,
        color: isKernel ? '#1a365d' : '#e2e8f0'
      });
    }

    // Asignar procesos existentes
    processManager.processes.forEach(p => {
      if (p.state !== ProcessState.TERMINATED && !p.isSystem) {
        this.allocateProcess(p);
      }
    });

    this.updateMetrics();
  }

  setMode(newMode) {
    this.mode = newMode;
    this.notify('modeChanged', { mode: this.mode });
    this.updateMetrics();
  }

  setFitAlgorithm(algo) {
    this.fitAlgorithm = algo;
    this.notify('algorithmChanged', { algorithm: algo });
  }

  allocateProcess(pcb) {
    if (this.mode === MemoryMode.CONTIGUOUS) {
      this.allocateContiguous(pcb);
    } else {
      this.allocatePaging(pcb);
    }
    this.updateMetrics();
  }

  allocateContiguous(pcb) {
    const requiredSize = pcb.memorySize;
    const freeHoles = this.contiguousBlocks.filter(b => !b.isAllocated && b.size >= requiredSize);

    if (freeHoles.length === 0) {
      // No cabe: posible fragmentación externa crítica
      simEngine.metrics.pageFaultsCount++;
      return false;
    }

    let selectedHole = null;

    if (this.fitAlgorithm === FitAlgorithm.FIRST_FIT) {
      selectedHole = freeHoles[0];
    } else if (this.fitAlgorithm === FitAlgorithm.BEST_FIT) {
      selectedHole = freeHoles.reduce((best, h) => h.size < best.size ? h : best, freeHoles[0]);
    } else if (this.fitAlgorithm === FitAlgorithm.WORST_FIT) {
      selectedHole = freeHoles.reduce((worst, h) => h.size > worst.size ? h : worst, freeHoles[0]);
    }

    const holeIndex = this.contiguousBlocks.indexOf(selectedHole);
    pcb.memoryAddress = selectedHole.startAddr;

    const allocatedBlock = {
      id: `proc_${pcb.pid}`,
      pid: pcb.pid,
      name: pcb.name,
      startAddr: selectedHole.startAddr,
      size: requiredSize,
      isAllocated: true,
      color: pcb.color
    };

    const remainingSize = selectedHole.size - requiredSize;

    if (remainingSize > 0) {
      const leftoverHole = {
        id: `free_${Date.now()}_${Math.random()}`,
        pid: null,
        name: 'Libre',
        startAddr: selectedHole.startAddr + requiredSize,
        size: remainingSize,
        isAllocated: false,
        color: '#e2e8f0'
      };
      this.contiguousBlocks.splice(holeIndex, 1, allocatedBlock, leftoverHole);
    } else {
      this.contiguousBlocks.splice(holeIndex, 1, allocatedBlock);
    }

    return true;
  }

  allocatePaging(pcb) {
    const requiredSize = pcb.memorySize;
    const pagesNeeded = Math.ceil(requiredSize / this.frameSize);
    const freeFrames = this.frames.filter(f => !f.isAllocated);

    if (freeFrames.length < pagesNeeded) {
      simEngine.metrics.pageFaultsCount++;
      return false;
    }

    let remainingBytes = requiredSize;

    for (let page = 0; page < pagesNeeded; page++) {
      const frame = freeFrames[page];
      const bytesInThisPage = Math.min(this.frameSize, remainingBytes);
      const internalFrag = this.frameSize - bytesInThisPage;

      frame.pid = pcb.pid;
      frame.processName = pcb.name;
      frame.pageNumber = page;
      frame.isAllocated = true;
      frame.usedBytes = bytesInThisPage;
      frame.internalFrag = internalFrag;
      frame.color = pcb.color;

      remainingBytes -= bytesInThisPage;
    }

    return true;
  }

  deallocateProcess(pid) {
    // 1. Liberar en particiones contiguas
    this.contiguousBlocks.forEach(b => {
      if (b.pid === pid) {
        b.isAllocated = false;
        b.pid = null;
        b.name = 'Libre';
        b.color = '#e2e8f0';
      }
    });

    // Fusionar huecos contiguos adyacentes
    this.mergeContiguousHoles();

    // 2. Liberar en marcos de paginación
    this.frames.forEach(f => {
      if (f.pid === pid) {
        f.isAllocated = false;
        f.pid = null;
        f.processName = null;
        f.pageNumber = null;
        f.usedBytes = 0;
        f.internalFrag = 0;
        f.color = '#e2e8f0';
      }
    });

    this.updateMetrics();
  }

  mergeContiguousHoles() {
    for (let i = 0; i < this.contiguousBlocks.length - 1; i++) {
      const current = this.contiguousBlocks[i];
      const next = this.contiguousBlocks[i + 1];

      if (!current.isAllocated && !next.isAllocated) {
        current.size += next.size;
        this.contiguousBlocks.splice(i + 1, 1);
        i--;
      }
    }
  }

  // Compactación de memoria: une todos los bloques asignados hacia el inicio y deja un único hueco libre
  compactMemory() {
    const allocated = this.contiguousBlocks.filter(b => b.isAllocated && b.id !== 'kernel');
    const kernel = this.contiguousBlocks.find(b => b.id === 'kernel');

    let currentAddr = kernel.size;
    const newBlocks = [kernel];

    allocated.forEach(b => {
      b.startAddr = currentAddr;
      currentAddr += b.size;
      newBlocks.push(b);
    });

    const freeSize = this.totalMemory - currentAddr;
    if (freeSize > 0) {
      newBlocks.push({
        id: 'free_compacted',
        pid: null,
        name: 'Libre (Compactado)',
        startAddr: currentAddr,
        size: freeSize,
        isAllocated: false,
        color: '#e2e8f0'
      });
    }

    this.contiguousBlocks = newBlocks;
    this.updateMetrics();
    this.notify('compacted', {});
    notificationManager.success('Memoria Compactada', 'Fragmentación externa eliminada exitosamente');
  }

  getMetrics() {
    // Cálculo cuantitativo de fragmentación externa
    let totalFreeMemory = 0;
    let maxFreeBlock = 0;
    const freeHoles = this.contiguousBlocks.filter(b => !b.isAllocated);

    freeHoles.forEach(h => {
      totalFreeMemory += h.size;
      if (h.size > maxFreeBlock) maxFreeBlock = h.size;
    });

    // Fragmentación externa: memoria libre que no puede ser usada de forma contigua
    const externalFragBytes = freeHoles.length > 1 ? (totalFreeMemory - maxFreeBlock) : 0;
    const externalFragPct = totalFreeMemory > 0 ? Math.round((externalFragBytes / totalFreeMemory) * 100) : 0;

    // Cálculo cuantitativo de fragmentación interna en paginación
    let totalInternalFrag = 0;
    let allocatedFramesCount = 0;

    this.frames.forEach(f => {
      if (f.isAllocated && f.pid !== 0) {
        allocatedFramesCount++;
        totalInternalFrag += f.internalFrag;
      }
    });

    const usedRam = this.mode === MemoryMode.CONTIGUOUS
      ? this.contiguousBlocks.filter(b => b.isAllocated).reduce((sum, b) => sum + b.size, 0)
      : this.frames.filter(f => f.isAllocated).reduce((sum, f) => sum + f.size, 0);

    const ramUsagePct = Math.round((usedRam / this.totalMemory) * 100);
    simEngine.metrics.ramUsagePct = ramUsagePct;

    return {
      totalMemory: this.totalMemory,
      usedRam,
      totalFreeMemory,
      externalFragBytes,
      externalFragPct,
      totalInternalFrag,
      allocatedFramesCount,
      freeHolesCount: freeHoles.length,
      mode: this.mode,
      fitAlgorithm: this.fitAlgorithm
    };
  }

  updateMetrics() {
    this.notify('memoryUpdated', {
      metrics: this.getMetrics(),
      contiguousBlocks: this.contiguousBlocks,
      frames: this.frames
    });
  }
}

export const memoryManager = new MemoryManager();
