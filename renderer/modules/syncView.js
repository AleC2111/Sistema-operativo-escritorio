// Vista: Laboratorio de Sincronización, Concurrencia y Detección de Deadlocks
import { syncLab } from '../kernel/syncLab.js';
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderSyncView(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%;">
      <!-- Pestañas de laboratorio -->
      <div class="aero-tabs">
        <div class="aero-tab active" data-tab="prod-cons">Productor - Consumidor</div>
        <div class="aero-tab" data-tab="philosophers">Filósofos Comensales</div>
        <div class="aero-tab" data-tab="deadlock">Detector de Deadlock (RAG)</div>
      </div>

      <!-- SECCIÓN 1: PRODUCTOR - CONSUMIDOR -->
      <div id="tab-prod-cons" class="sync-view-wrapper" style="flex: 1;">
        <div class="sim-toolbar" style="border-radius: 4px; justify-content: space-between;">
          <div style="display: flex; gap: 8px;">
            <button class="aero-btn primary" id="btn-produce">🏭 Producir (wait/signal)</button>
            <button class="aero-btn" id="btn-consume">🛒 Consumir (wait/signal)</button>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="check-race-condition" />
            <label for="check-race-condition" style="font-size: 11px; color: #b91c1c; font-weight: 700;">
              ⚠️ Desactivar Mutex (Simular Condición de Carrera)
            </label>
          </div>
        </div>

        <!-- Alerta de condición de carrera -->
        <div id="race-alert" style="display: none; background: #fee2e2; border: 1px solid #ef4444; color: #991b1b; padding: 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
          ¡ALERTA DE CONDICIÓN DE CARRERA! Acceso simultáneo no sincronizado detectado a la sección crítica.
        </div>

        <!-- Búfer Acotado -->
        <div class="aero-groupbox">
          <legend>Búfer Circular Acotado (Capacidad: 6 elementos)</legend>
          <div class="buffer-track-container">
            <div style="font-weight: 700; color: #1e3a5a; font-size: 11px;">Productor ➔</div>
            <div class="buffer-slots" id="buffer-slots-container"></div>
            <div style="font-weight: 700; color: #1e3a5a; font-size: 11px;">➔ Consumidor</div>
          </div>
        </div>

        <!-- Estado de Semáforos -->
        <div class="aero-groupbox">
          <legend>Variables de Sincronización y Semáforos</legend>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
            <div style="background: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
              <div style="font-size: 10px; color: #64748b;">Semáforo Mutex</div>
              <div style="font-size: 18px; font-weight: 700; color: #1e293b;" id="val-sem-mutex">1</div>
              <div style="font-size: 9px; color: #475569;">(1 = Libre, 0 = Ocupado)</div>
            </div>
            <div style="background: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
              <div style="font-size: 10px; color: #64748b;">Semáforo Vacio (Empty)</div>
              <div style="font-size: 18px; font-weight: 700; color: #2563eb;" id="val-sem-empty">6</div>
              <div style="font-size: 9px; color: #475569;">(Espacios disponibles)</div>
            </div>
            <div style="background: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
              <div style="font-size: 10px; color: #64748b;">Semáforo Lleno (Full)</div>
              <div style="font-size: 18px; font-weight: 700; color: #16a34a;" id="val-sem-full">0</div>
              <div style="font-size: 9px; color: #475569;">(Elementos listos)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 2: FILÓSOFOS COMENSALES -->
      <div id="tab-philosophers" class="sync-view-wrapper" style="flex: 1; display: none;">
        <div class="sim-toolbar" style="border-radius: 4px; justify-content: space-between;">
          <button class="aero-btn primary" id="btn-step-philo">🍴 Dar un paso de comida</button>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="check-philo-prevention" checked />
            <label for="check-philo-prevention" style="font-size: 11px; color: #1e3a5a; font-weight: 600;">
              Prevención de Deadlock (Tanenbaum/Dijkstra)
            </label>
          </div>
        </div>

        <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex: 1;">
          <!-- Mesa circular de filósofos -->
          <div class="philosophers-table-container" id="philo-table"></div>

          <!-- Leyenda de estados -->
          <div class="aero-groupbox" style="width: 200px;">
            <legend>Estados de los Filósofos</legend>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: #3182ce;"></span>
                <span>Pensando (Liberó recursos)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: #d69e2e;"></span>
                <span>Hambriento (Pide palillos)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: #38a169;"></span>
                <span>Comiendo (Sección crítica)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 3: DETECTOR DE DEADLOCK (RAG) -->
      <div id="tab-deadlock" class="sync-view-wrapper" style="flex: 1; display: none;">
        <div class="sim-toolbar" style="border-radius: 4px; justify-content: space-between;">
          <div style="display: flex; gap: 8px;">
            <button class="aero-btn primary" id="btn-check-deadlock">🔍 Detectar Ciclos de Deadlock</button>
            <button class="aero-btn" id="btn-resolve-deadlock">✂️ Romper Ciclo (Liberar Recurso)</button>
          </div>
          <div id="deadlock-status-badge"></div>
        </div>

        <div class="aero-groupbox" style="flex: 1;">
          <legend>Grafo de Asignación de Recursos (RAG - Resource Allocation Graph)</legend>
          <div style="display: flex; justify-content: space-around; align-items: center; height: 180px; position: relative;">
            <!-- Nodo P1 -->
            <div style="background: #2b6cb0; color: #fff; padding: 12px 18px; border-radius: 50%; font-weight: 700; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">P1</div>
            <!-- Nodo R2 -->
            <div style="background: #dd6b20; color: #fff; padding: 12px 16px; border-radius: 6px; font-weight: 700; font-size: 12px;">R2 (Impresora)</div>
            <!-- Nodo P2 -->
            <div style="background: #2b6cb0; color: #fff; padding: 12px 18px; border-radius: 50%; font-weight: 700; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">P2</div>
            <!-- Nodo R1 -->
            <div style="background: #dd6b20; color: #fff; padding: 12px 16px; border-radius: 6px; font-weight: 700; font-size: 12px;">R1 (Disco)</div>
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 8px; background: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1;" id="rag-desc-box">
            <b>Estado del grafo:</b> P1 posee R1 y solicita R2. P2 posee R2 y solicita R1. Esto conforma una condición de espera circular (Condición de Coffman) $\rightarrow$ <b>¡Deadlock inevitable!</b>
          </div>
        </div>
      </div>
    </div>
  `;

  // Tabs
  const tabs = container.querySelectorAll('.aero-tab');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('active'));
      t.classList.add('active');
      const tabName = t.getAttribute('data-tab');
      container.querySelector('#tab-prod-cons').style.display = tabName === 'prod-cons' ? 'flex' : 'none';
      container.querySelector('#tab-philosophers').style.display = tabName === 'philosophers' ? 'flex' : 'none';
      container.querySelector('#tab-deadlock').style.display = tabName === 'deadlock' ? 'flex' : 'none';
      sounds.playClick();
    });
  });

  // --- 1. PRODUCTOR - CONSUMIDOR ---
  const renderBuffer = () => {
    const slotsEl = container.querySelector('#buffer-slots-container');
    if (!slotsEl) return;
    slotsEl.innerHTML = '';

    for (let i = 0; i < syncLab.bufferCapacity; i++) {
      const item = syncLab.buffer[i];
      const slot = document.createElement('div');
      slot.className = 'buffer-slot' + (item ? ' occupied' : '');
      slot.textContent = item ? item.value.split('_')[1] : `[ ${i} ]`;
      slot.title = item ? `${item.value} (${item.time})` : `Espacio libre ${i}`;
      slotsEl.appendChild(slot);
    }

    container.querySelector('#val-sem-mutex').textContent = syncLab.mutexLocked ? '0' : '1';
    container.querySelector('#val-sem-empty').textContent = syncLab.semEmpty;
    container.querySelector('#val-sem-full').textContent = syncLab.semFull;

    const raceAlert = container.querySelector('#race-alert');
    raceAlert.style.display = syncLab.raceConditionDetected ? 'block' : 'none';
  };

  container.querySelector('#btn-produce').addEventListener('click', () => {
    syncLab.produceItem();
    sounds.playClick();
    renderBuffer();
  });

  container.querySelector('#btn-consume').addEventListener('click', () => {
    syncLab.consumeItem();
    sounds.playClick();
    renderBuffer();
  });

  container.querySelector('#check-race-condition').addEventListener('change', (e) => {
    syncLab.toggleRaceConditionMode();
    renderBuffer();
  });

  // --- 2. FILÓSOFOS COMENSALES ---
  const renderPhilosophers = () => {
    const tableEl = container.querySelector('#philo-table');
    if (!tableEl) return;
    tableEl.innerHTML = '';

    const radius = 100;
    const centerX = 140;
    const centerY = 140;

    syncLab.philosophers.forEach((p, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) - 23;
      const y = centerY + radius * Math.sin(angle) - 23;

      const pEl = document.createElement('div');
      pEl.className = `philosopher-seat ${p.state.toLowerCase()}`;
      pEl.style.left = `${x}px`;
      pEl.style.top = `${y}px`;
      pEl.innerHTML = `<span>${p.name[0]}</span><span style="font-size: 7px;">${p.state.slice(0, 4)}</span>`;
      pEl.title = `${p.name}\nEstado: ${p.state}\nPlatos comidos: ${p.mealsEaten}`;
      tableEl.appendChild(pEl);

      // Palillo
      const chopAngle = angle + (Math.PI / 5);
      const chopX = centerX + (radius * 0.6) * Math.cos(chopAngle) - 3;
      const chopY = centerY + (radius * 0.6) * Math.sin(chopAngle) - 13;
      const chopEl = document.createElement('div');
      chopEl.className = 'chopstick' + (syncLab.chopsticks[i] ? ' taken' : '');
      chopEl.style.left = `${chopX}px`;
      chopEl.style.top = `${chopY}px`;
      tableEl.appendChild(chopEl);
    });
  };

  container.querySelector('#btn-step-philo').addEventListener('click', () => {
    syncLab.stepPhilosophers();
    sounds.playClick();
    renderPhilosophers();
  });

  container.querySelector('#check-philo-prevention').addEventListener('change', () => {
    syncLab.togglePhilosopherDeadlockPrevention();
  });

  // --- 3. DETECTOR DE DEADLOCK ---
  const renderDeadlock = () => {
    const badge = container.querySelector('#deadlock-status-badge');
    const descBox = container.querySelector('#rag-desc-box');
    if (!badge) return;

    if (syncLab.hasDeadlock) {
      badge.innerHTML = `<span class="aero-badge badge-blocked" style="font-size: 11px; padding: 4px 8px;">⛔ DEADLOCK DETECTADO</span>`;
      descBox.innerHTML = `<b>Estado del grafo:</b> P1 posee R1 y solicita R2. P2 posee R2 y solicita R1. Esto conforma una condición de espera circular (Condición de Coffman) $\rightarrow$ <b>¡Deadlock inevitable!</b>`;
    } else {
      badge.innerHTML = `<span class="aero-badge badge-running" style="font-size: 11px; padding: 4px 8px;">✅ SISTEMA SEGURO (Sin Deadlock)</span>`;
      descBox.innerHTML = `<b>Estado del grafo:</b> Se ha roto el ciclo de espera circular. Los procesos pueden progresar secuencialmente sin bloqueo mutuo permanente.`;
    }
  };

  container.querySelector('#btn-check-deadlock').addEventListener('click', () => {
    syncLab.checkDeadlock();
    if (syncLab.hasDeadlock) sounds.playError();
    else sounds.playClick();
    renderDeadlock();
  });

  container.querySelector('#btn-resolve-deadlock').addEventListener('click', () => {
    syncLab.resolveDeadlock();
    sounds.playClick();
    renderDeadlock();
  });

  const unsubSync = syncLab.subscribe(() => {
    renderBuffer();
    renderPhilosophers();
    renderDeadlock();
  });

  renderBuffer();
  renderPhilosophers();
  renderDeadlock();

  return () => unsubSync();
}
