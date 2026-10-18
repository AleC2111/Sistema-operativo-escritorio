// Motor central de simulación por ciclos de reloj para el SO
export class SimulationEngine {
  constructor() {
    this.tickCount = 0;
    this.isRunning = true;
    this.speed = 1.0; // Multiplicador de velocidad (0.2x a 5.0x)
    this.baseIntervalMs = 800; // 800ms por ciclo de reloj base
    this.timerId = null;
    this.subscribers = new Set();
    this.metrics = {
      cpuLoad: 24,
      ramUsagePct: 38,
      contextSwitches: 0,
      systemCallsCount: 0,
      interruptsCount: 0,
      pageFaultsCount: 0
    };
  }

  init() {
    this.startLoop();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(event, data) {
    this.subscribers.forEach(cb => {
      try {
        cb(event, data);
      } catch (err) {
        console.error('Error in simulation subscriber:', err);
      }
    });
  }

  startLoop() {
    if (this.timerId) clearInterval(this.timerId);
    if (!this.isRunning) return;

    const interval = Math.max(80, Math.round(this.baseIntervalMs / this.speed));
    this.timerId = setInterval(() => {
      this.step();
    }, interval);
  }

  step() {
    this.tickCount++;
    this.notify('tick', {
      tick: this.tickCount,
      metrics: this.metrics
    });
  }

  setSpeed(newSpeed) {
    this.speed = Math.max(0.2, Math.min(5.0, newSpeed));
    if (this.isRunning) {
      this.startLoop();
    }
    this.notify('speedChange', { speed: this.speed });
  }

  play() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.startLoop();
      this.notify('stateChange', { isRunning: true });
    }
  }

  pause() {
    if (this.isRunning) {
      this.isRunning = false;
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      this.notify('stateChange', { isRunning: false });
    }
  }

  togglePlay() {
    if (this.isRunning) this.pause();
    else this.play();
  }

  reset() {
    this.pause();
    this.tickCount = 0;
    this.metrics = {
      cpuLoad: 15,
      ramUsagePct: 20,
      contextSwitches: 0,
      systemCallsCount: 0,
      interruptsCount: 0,
      pageFaultsCount: 0
    };
    this.notify('reset', {});
    this.play();
  }
}

export const simEngine = new SimulationEngine();
