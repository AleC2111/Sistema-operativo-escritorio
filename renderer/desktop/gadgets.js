// Gadgets de Escritorio Windows 7 (Medidores de CPU y RAM)
import { simEngine } from '../kernel/simulationEngine.js';

export class DesktopGadgets {
  constructor() {
    this.containerEl = null;
    this.cpuFillEl = null;
    this.cpuValEl = null;
    this.ramFillEl = null;
    this.ramValEl = null;
    this.maxOffset = 144.5;
  }

  init(containerElement) {
    this.containerEl = containerElement;
    if (!this.containerEl) return;

    this.containerEl.innerHTML = `
      <div class="gadget-card">
        <div class="gadget-title">Rendimiento SO</div>
        <div class="meter-gauge-container">
          <!-- CPU DIAL -->
          <div class="dial-meter">
            <svg viewBox="0 0 54 54" width="54" height="54">
              <circle class="dial-meter-bg" cx="27" cy="27" r="23" />
              <circle class="dial-meter-fill" id="gadget-cpu-fill" cx="27" cy="27" r="23" />
            </svg>
            <div class="dial-meter-label">
              <span id="gadget-cpu-val">0%</span>
              <span class="dial-meter-tag">CPU</span>
            </div>
          </div>

          <!-- RAM DIAL -->
          <div class="dial-meter">
            <svg viewBox="0 0 54 54" width="54" height="54">
              <circle class="dial-meter-bg" cx="27" cy="27" r="23" />
              <circle class="dial-meter-fill" id="gadget-ram-fill" cx="27" cy="27" r="23" />
            </svg>
            <div class="dial-meter-label">
              <span id="gadget-ram-val">0%</span>
              <span class="dial-meter-tag">RAM</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 10px; display: flex; gap: 4px; justify-content: center; width: 100%;">
          <button class="aero-btn" id="gadget-play-btn" style="padding: 2px 6px; font-size: 10px;">⏸ Pausa</button>
          <button class="aero-btn" id="gadget-step-btn" style="padding: 2px 6px; font-size: 10px;">⏭ Paso</button>
        </div>
      </div>
    `;

    this.cpuFillEl = this.containerEl.querySelector('#gadget-cpu-fill');
    this.cpuValEl = this.containerEl.querySelector('#gadget-cpu-val');
    this.ramFillEl = this.containerEl.querySelector('#gadget-ram-fill');
    this.ramValEl = this.containerEl.querySelector('#gadget-ram-val');

    const playBtn = this.containerEl.querySelector('#gadget-play-btn');
    const stepBtn = this.containerEl.querySelector('#gadget-step-btn');

    playBtn.addEventListener('click', () => {
      simEngine.togglePlay();
      playBtn.textContent = simEngine.isRunning ? '⏸ Pausa' : '▶ Reanudar';
    });

    stepBtn.addEventListener('click', () => {
      simEngine.pause();
      simEngine.step();
      playBtn.textContent = '▶ Reanudar';
    });

    simEngine.subscribe((event, data) => {
      if (event === 'tick') {
        this.updateGauges(data.metrics.cpuLoad, data.metrics.ramUsagePct);
      }
    });
  }

  updateGauges(cpuPct, ramPct) {
    if (this.cpuValEl) this.cpuValEl.textContent = `${cpuPct}%`;
    if (this.ramValEl) this.ramValEl.textContent = `${ramPct}%`;

    if (this.cpuFillEl) {
      const cpuOffset = this.maxOffset - (this.maxOffset * (cpuPct / 100));
      this.cpuFillEl.style.strokeDashoffset = cpuOffset;
      this.cpuFillEl.style.stroke = cpuPct > 80 ? '#e53e3e' : cpuPct > 50 ? '#dd6b20' : '#48bb78';
    }

    if (this.ramFillEl) {
      const ramOffset = this.maxOffset - (this.maxOffset * (ramPct / 100));
      this.ramFillEl.style.strokeDashoffset = ramOffset;
      this.ramFillEl.style.stroke = ramPct > 85 ? '#e53e3e' : ramPct > 65 ? '#dd6b20' : '#3182ce';
    }
  }
}

export const gadgets = new DesktopGadgets();
