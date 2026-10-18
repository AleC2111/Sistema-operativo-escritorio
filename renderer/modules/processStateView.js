// Vista: Máquina de Estados de Procesos y Diagrama de Gantt (Process State Machine)
import { processManager, ProcessState, SchedulerAlgorithm } from '../kernel/processManager.js';
import { simEngine } from '../kernel/simulationEngine.js';
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderProcessStateView(container) {
  container.innerHTML = `
    <div class="state-diagram-wrapper">
      <!-- Barra de herramientas del planificador -->
      <div class="sim-toolbar" style="border-radius: 4px;">
        <label class="sim-toolbar-label">Algoritmo:</label>
        <select class="sim-select" id="state-algo-select">
          <option value="${SchedulerAlgorithm.ROUND_ROBIN}">Round Robin (RR)</option>
          <option value="${SchedulerAlgorithm.FCFS}">First-Come, First-Served (FCFS)</option>
          <option value="${SchedulerAlgorithm.SJF}">Shortest Job First (SJF)</option>
          <option value="${SchedulerAlgorithm.PRIORITY}">Por Prioridades (con Aging)</option>
        </select>

        <div id="quantum-control-box" style="display: flex; align-items: center; gap: 6px;">
          <label class="sim-toolbar-label">Quantum:</label>
          <input class="sim-input" id="state-quantum-val" type="number" min="1" max="10" value="${processManager.quantum}" style="width: 45px;" />
          <span style="font-size: 10px; color: #64748b;">ciclos</span>
        </div>

        <button class="aero-btn primary" id="state-spawn-btn">➕ Generar Proceso</button>
        <button class="aero-btn" id="state-block-active-btn">⚡ Forzar E/S en CPU</button>
      </div>

      <!-- Diagrama de Estados (Nodos y Fichas) -->
      <div class="state-diagram-canvas-box">
        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#4a5568" />
            </marker>
          </defs>
          <!-- Flechas de transición -->
          <!-- Nuevo -> Listo -->
          <line x1="120" y1="50" x2="160" y2="50" stroke="#718096" stroke-width="2" marker-end="url(#arrow)" />
          <!-- Listo -> Ejecutando (Despacho) -->
          <line x1="270" y1="50" x2="330" y2="50" stroke="#3182ce" stroke-width="2.5" marker-end="url(#arrow)" />
          <!-- Ejecutando -> Listo (Fin Quantum) -->
          <path d="M 330 35 C 300 15, 290 15, 270 35" fill="none" stroke="#e53e3e" stroke-dasharray="4" stroke-width="2" marker-end="url(#arrow)" />
          <!-- Ejecutando -> Bloqueado (Espera E/S) -->
          <path d="M 380 80 L 380 130 L 270 150" fill="none" stroke="#d69e2e" stroke-width="2" marker-end="url(#arrow)" />
          <!-- Bloqueado -> Listo (Fin E/S) -->
          <line x1="215" y1="130" x2="215" y2="80" stroke="#38a169" stroke-width="2" marker-end="url(#arrow)" />
          <!-- Ejecutando -> Terminado (Exit) -->
          <line x1="440" y1="50" x2="490" y2="50" stroke="#718096" stroke-width="2" marker-end="url(#arrow)" />
        </svg>

        <div class="state-nodes-container" style="z-index: 2;">
          <!-- NODO NUEVO -->
          <div class="state-node-box" id="node-new" style="top: 20px; left: 15px;">
            <span class="state-node-title">NUEVO</span>
            <div class="process-chips-container" id="chips-new"></div>
          </div>

          <!-- NODO LISTO -->
          <div class="state-node-box" id="node-ready" style="top: 20px; left: 160px; width: 110px;">
            <span class="state-node-title" style="color: #2b6cb0;">LISTO (Ready)</span>
            <span class="state-node-count" id="count-ready">0 proc.</span>
            <div class="process-chips-container" id="chips-ready"></div>
          </div>

          <!-- NODO EJECUTANDO -->
          <div class="state-node-box" id="node-running" style="top: 20px; left: 330px; width: 110px; border-color: #38a169; background: linear-gradient(135deg, #f0fff4, #c6f6d5);">
            <span class="state-node-title" style="color: #22543d;">EJECUTANDO</span>
            <span class="state-node-count" id="count-running">CPU</span>
            <div class="process-chips-container" id="chips-running"></div>
          </div>

          <!-- NODO BLOQUEADO -->
          <div class="state-node-box" id="node-blocked" style="top: 130px; left: 160px; width: 110px; border-color: #dd6b20; background: linear-gradient(135deg, #fffaf0, #feebc8);">
            <span class="state-node-title" style="color: #7b341e;">BLOQUEADO</span>
            <span class="state-node-count" id="count-blocked">Espera E/S</span>
            <div class="process-chips-container" id="chips-blocked"></div>
          </div>

          <!-- NODO TERMINADO -->
          <div class="state-node-box" id="node-terminated" style="top: 20px; left: 490px;">
            <span class="state-node-title" style="color: #4a5568;">TERMINADO</span>
            <div class="process-chips-container" id="chips-terminated"></div>
          </div>
        </div>
      </div>

      <!-- Sección de Historial de Gantt -->
      <div class="gantt-section">
        <div class="gantt-title">
          <span>Cronograma de Ejecución (Diagrama de Gantt en Tiempo Real)</span>
          <span style="font-size: 10px; color: #718096;" id="gantt-tick-counter">Ciclo: 0</span>
        </div>
        <div class="gantt-chart-scroll">
          <div class="gantt-bar-track" id="gantt-track"></div>
        </div>
      </div>
    </div>
  `;

  const algoSelect = container.querySelector('#state-algo-select');
  const quantumInput = container.querySelector('#state-quantum-val');
  const quantumBox = container.querySelector('#quantum-control-box');

  algoSelect.value = processManager.currentAlgorithm;

  algoSelect.addEventListener('change', () => {
    processManager.setAlgorithm(algoSelect.value);
    quantumBox.style.display = algoSelect.value === SchedulerAlgorithm.ROUND_ROBIN ? 'flex' : 'none';
    sounds.playClick();
  });

  quantumInput.addEventListener('change', () => {
    processManager.setQuantum(parseInt(quantumInput.value, 10));
  });

  container.querySelector('#state-spawn-btn').addEventListener('click', () => {
    const names = ['worker.exe', 'render.exe', 'download.exe', 'compress.exe', 'sql_query.exe'];
    const n = names[Math.floor(Math.random() * names.length)];
    const burst = Math.floor(Math.random() * 8 + 3);
    const prios = ['Alta', 'Normal', 'Baja'];
    const prio = prios[Math.floor(Math.random() * prios.length)];
    processManager.createProcess(n, burst, 128, prio, Math.random() < 0.5);
    sounds.playClick();
  });

  container.querySelector('#state-block-active-btn').addEventListener('click', () => {
    if (processManager.runningProcess) {
      processManager.runningProcess.state = ProcessState.BLOCKED;
      processManager.runningProcess.waitingReason = 'Forzado por usuario';
      sounds.playInterrupt();
      processManager.runningProcess = null;
      processManager.dispatchNext();
    } else {
      sounds.playError();
    }
  });

  const renderChips = () => {
    const containers = {
      [ProcessState.NEW]: container.querySelector('#chips-new'),
      [ProcessState.READY]: container.querySelector('#chips-ready'),
      [ProcessState.RUNNING]: container.querySelector('#chips-running'),
      [ProcessState.BLOCKED]: container.querySelector('#chips-blocked'),
      [ProcessState.TERMINATED]: container.querySelector('#chips-terminated')
    };

    Object.values(containers).forEach(c => { if (c) c.innerHTML = ''; });

    let readyCount = 0;
    let blockedCount = 0;

    processManager.processes.forEach(p => {
      const target = containers[p.state];
      if (!target) return;

      if (p.state === ProcessState.READY) readyCount++;
      if (p.state === ProcessState.BLOCKED) blockedCount++;

      const chip = document.createElement('div');
      chip.className = 'process-chip';
      chip.style.backgroundColor = p.color;
      chip.textContent = `${p.pid}: ${p.name.split('.')[0]}`;
      chip.title = `PID: ${p.pid}\nNombre: ${p.name}\nRestante: ${p.burstRemaining} ciclos\nPrioridad: ${p.priority}`;
      target.appendChild(chip);
    });

    container.querySelector('#count-ready').textContent = `${readyCount} en cola`;
    container.querySelector('#count-blocked').textContent = `${blockedCount} en espera`;
  };

  const renderGantt = () => {
    const track = container.querySelector('#gantt-track');
    if (!track) return;
    track.innerHTML = '';

    container.querySelector('#gantt-tick-counter').textContent = `Ciclo: ${simEngine.tickCount}`;

    processManager.ganttHistory.forEach(slot => {
      const seg = document.createElement('div');
      seg.className = 'gantt-segment';
      seg.style.backgroundColor = slot.color;
      seg.innerHTML = `<span>${slot.pid || 'IDLE'}</span>`;
      seg.title = `Ciclo ${slot.tick} -> PID ${slot.pid} (${slot.name})`;
      track.appendChild(seg);
    });

    // Auto-scroll al final
    const scrollBox = container.querySelector('.gantt-chart-scroll');
    if (scrollBox) scrollBox.scrollLeft = scrollBox.scrollWidth;
  };

  const unsubProcess = processManager.subscribe(() => {
    renderChips();
    renderGantt();
  });

  renderChips();
  renderGantt();

  return () => unsubProcess();
}
