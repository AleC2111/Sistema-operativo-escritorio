// Vista: Administrador de Tareas de Windows (Windows 7 Task Manager)
import { processManager, ProcessState } from '../kernel/processManager.js';
import { simEngine } from '../kernel/simulationEngine.js';
import { sounds } from '../../assets/audio/soundEffects.js';
import { notificationManager } from '../kernel/notificationManager.js';

export function renderTaskManagerView(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%;">
      <!-- Pestañas estilo Windows 7 -->
      <div class="aero-tabs">
        <div class="aero-tab active" data-tab="processes">Procesos</div>
        <div class="aero-tab" data-tab="performance">Rendimiento</div>
        <div class="aero-tab" data-tab="services">Servicios</div>
        <div class="aero-tab" data-tab="network">Red</div>
      </div>

      <!-- TAB 1: PROCESOS -->
      <div id="tab-content-processes" style="flex: 1; display: flex; flex-direction: column; padding: 8px; gap: 8px; overflow: hidden;">
        <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 6px;">
            <button class="aero-btn primary" id="tm-new-btn">➕ Nuevo Proceso...</button>
            <button class="aero-btn danger" id="tm-kill-btn">⛔ Finalizar Proceso</button>
            <button class="aero-btn danger" id="tm-kill-tree-btn">🌲 Finalizar Árbol</button>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <label class="sim-toolbar-label">Prioridad:</label>
            <select class="sim-select" id="tm-priority-select">
              <option value="Tiempo Real">Tiempo Real</option>
              <option value="Alta">Alta</option>
              <option value="Normal" selected>Normal</option>
              <option value="Baja">Baja</option>
            </select>
            <button class="aero-btn" id="tm-set-priority-btn">Aplicar</button>
          </div>
        </div>

        <div class="aero-table-container" style="flex: 1;">
          <table class="aero-table">
            <thead>
              <tr>
                <th style="width: 55px;">PID</th>
                <th>Nombre de imagen</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th style="width: 60px;">CPU %</th>
                <th style="width: 85px;">Memoria</th>
                <th>Recursos / Handles</th>
              </tr>
            </thead>
            <tbody id="tm-process-tbody"></tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #475569; padding: 2px 4px; border-top: 1px solid #cbd5e1;">
          <span>Procesos activos: <b id="tm-active-count">0</b></span>
          <span>Uso de CPU: <b id="tm-cpu-label">0%</b></span>
          <span>Memoria Física: <b id="tm-ram-label">0%</b></span>
        </div>
      </div>

      <!-- TAB 2: RENDIMIENTO -->
      <div id="tab-content-performance" style="flex: 1; display: none; flex-direction: column; padding: 10px; gap: 10px; overflow-y: auto;">
        <!-- Gráfico Osciloscopio CPU -->
        <div class="aero-groupbox">
          <legend>Historial de uso de CPU</legend>
          <div class="oscilloscope-container" style="height: 120px;">
            <div class="oscilloscope-grid"></div>
            <canvas id="tm-cpu-canvas" height="120"></canvas>
          </div>
        </div>

        <!-- Gráfico Osciloscopio Memoria -->
        <div class="aero-groupbox">
          <legend>Historial de uso de memoria física</legend>
          <div class="oscilloscope-container" style="height: 90px;">
            <div class="oscilloscope-grid"></div>
            <canvas id="tm-ram-canvas" height="90"></canvas>
          </div>
        </div>

        <!-- Estadísticas globales -->
        <div class="aero-groupbox">
          <legend>Totales del Sistema</legend>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 11px;">
            <div>Manijas (Handles): <b id="stat-handles">4,120</b></div>
            <div>Hilos de ejecución: <b id="stat-threads">38</b></div>
            <div>Cambios de contexto: <b id="stat-switches">0</b></div>
            <div>Llamadas al sistema: <b id="stat-syscalls">0</b></div>
            <div>Interrupciones: <b id="stat-irqs">0</b></div>
            <div>Fallos de página: <b id="stat-pagefaults">0</b></div>
          </div>
        </div>
      </div>

      <!-- TAB 3: SERVICIOS -->
      <div id="tab-content-services" style="flex: 1; display: none; flex-direction: column; padding: 8px; gap: 8px; overflow: hidden;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="aero-btn primary" id="tm-service-start-btn">▶ Iniciar</button>
          <button class="aero-btn danger" id="tm-service-stop-btn">⏹ Detener</button>
          <button class="aero-btn" id="tm-service-restart-btn">🔄 Reiniciar</button>
        </div>

        <div class="aero-table-container" style="flex: 1;">
          <table class="aero-table">
            <thead>
              <tr>
                <th>Nombre del servicio</th>
                <th style="width: 100px;">Estado</th>
                <th style="width: 100px;">Tipo de inicio</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody id="tm-services-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: RED -->
      <div id="tab-content-network" style="flex: 1; display: none; flex-direction: column; padding: 10px; gap: 10px; overflow-y: auto;">
        <div class="aero-groupbox">
          <legend>Actividad de Red</legend>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 11px;">
            <div>Recibido: <b id="net-received">2.45 GB</b></div>
            <div>Enviado: <b id="net-sent">1.23 GB</b></div>
            <div>Velocidad de recepción: <b id="net-rx-speed">2.4 MB/s</b></div>
            <div>Velocidad de envío: <b id="net-tx-speed">1.1 MB/s</b></div>
          </div>
        </div>

        <div class="aero-groupbox">
          <legend>Conexiones Activas</legend>
          <div class="aero-table-container" style="max-height: 200px;">
            <table class="aero-table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Dirección Local</th>
                  <th>Dirección Remota</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody id="tm-network-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- DIÁLOGO CREAR PROCESO -->
    <div id="new-process-dialog" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 99; align-items: center; justify-content: center;">
      <div class="aero-glass" style="width: 320px; background: #ffffff; border-radius: 6px; padding: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <h3 style="font-size: 13px; color: #1e3a5a; margin-bottom: 12px; font-weight: 700;">Crear Nuevo Proceso</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div>
            <label style="font-size: 11px; color: #334e68; display: block; margin-bottom: 2px;">Nombre del ejecutable:</label>
            <input class="sim-input" id="diag-proc-name" type="text" value="editor_texto.exe" style="width: 100%;" />
          </div>
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1;">
              <label style="font-size: 11px; color: #334e68; display: block; margin-bottom: 2px;">Ráfaga CPU:</label>
              <input class="sim-input" id="diag-proc-burst" type="number" value="7" min="1" max="50" style="width: 100%;" />
            </div>
            <div style="flex: 1;">
              <label style="font-size: 11px; color: #334e68; display: block; margin-bottom: 2px;">Memoria (KB):</label>
              <input class="sim-input" id="diag-proc-mem" type="number" value="128" min="16" max="512" style="width: 100%;" />
            </div>
          </div>
          <div>
            <label style="font-size: 11px; color: #334e68; display: block; margin-bottom: 2px;">Prioridad:</label>
            <select class="sim-select" id="diag-proc-priority" style="width: 100%;">
              <option value="Alta">Alta</option>
              <option value="Normal" selected>Normal</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
            <input type="checkbox" id="diag-proc-io" checked />
            <label for="diag-proc-io" style="font-size: 11px; color: #334e68;">Requiere E/S periódica (I/O Block)</label>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
            <button class="aero-btn" id="diag-cancel-btn">Cancelar</button>
            <button class="aero-btn primary" id="diag-create-btn">Crear Proceso</button>
          </div>
        </div>
      </div>
    </div>
  `;

  let selectedPid = null;
  const cpuHistory = new Array(50).fill(15);
  const ramHistory = new Array(50).fill(30);

  // Selector de tabs
  const tabs = container.querySelectorAll('.aero-tab');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('active'));
      t.classList.add('active');
      const tabName = t.getAttribute('data-tab');
      container.querySelector('#tab-content-processes').style.display = tabName === 'processes' ? 'flex' : 'none';
      container.querySelector('#tab-content-performance').style.display = tabName === 'performance' ? 'flex' : 'none';
      container.querySelector('#tab-content-services').style.display = tabName === 'services' ? 'flex' : 'none';
      container.querySelector('#tab-content-network').style.display = tabName === 'network' ? 'flex' : 'none';
      sounds.playClick();
    });
  });

  // Renderizar tabla de procesos
  const renderTable = () => {
    const tbody = container.querySelector('#tm-process-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const activeProcs = processManager.processes.filter(p => p.state !== ProcessState.TERMINATED);
    container.querySelector('#tm-active-count').textContent = activeProcs.length;
    container.querySelector('#tm-cpu-label').textContent = `${simEngine.metrics.cpuLoad}%`;
    container.querySelector('#tm-ram-label').textContent = `${simEngine.metrics.ramUsagePct}%`;

    processManager.processes.forEach(p => {
      if (p.state === ProcessState.TERMINATED) return;

      const tr = document.createElement('tr');
      if (p.pid === selectedPid) tr.classList.add('selected');

      let stateBadge = `<span class="aero-badge badge-ready">Listo</span>`;
      if (p.state === ProcessState.RUNNING) stateBadge = `<span class="aero-badge badge-running">Ejecutando</span>`;
      else if (p.state === ProcessState.BLOCKED) stateBadge = `<span class="aero-badge badge-blocked">Bloqueado</span>`;
      else if (p.state === ProcessState.NEW) stateBadge = `<span class="aero-badge badge-new">Nuevo</span>`;

      tr.innerHTML = `
        <td style="font-weight: 600;">${p.pid}</td>
        <td>
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${p.color}; margin-right: 6px;"></span>
          ${p.name}
        </td>
        <td>${stateBadge}</td>
        <td>${p.priority}</td>
        <td style="text-align: right;">${p.state === ProcessState.RUNNING ? p.cpuPercent : 0}%</td>
        <td style="text-align: right;">${p.memorySize} KB</td>
        <td>${p.resources.join(', ')}</td>
      `;

      tr.addEventListener('click', () => {
        selectedPid = p.pid;
        container.querySelectorAll('#tm-process-tbody tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        container.querySelector('#tm-priority-select').value = p.priority;
      });

      tbody.appendChild(tr);
    });
  };

  // Botón matar proceso
  container.querySelector('#tm-kill-btn').addEventListener('click', () => {
    if (selectedPid) {
      processManager.killProcess(selectedPid);
      notificationManager.warning('Proceso Terminado', `Proceso PID ${selectedPid} finalizado`);
      sounds.playClick();
      selectedPid = null;
      renderTable();
    } else {
      sounds.playError();
      alert('Seleccione un proceso de la tabla para finalizarlo.');
    }
  });

  // Botón matar árbol de procesos
  container.querySelector('#tm-kill-tree-btn').addEventListener('click', () => {
    if (selectedPid) {
      // En un sistema real, esto mataría el proceso y todos sus hijos
      // Aquí simulamos matando el proceso seleccionado y notificando
      const p = processManager.processes.find(proc => proc.pid === selectedPid);
      if (p) {
        processManager.killProcess(selectedPid);
        notificationManager.warning('Árbol de Procesos Terminado', `Proceso ${p.name} (PID ${selectedPid}) y sus procesos hijos finalizados`);
        sounds.playClick();
        selectedPid = null;
        renderTable();
      }
    } else {
      sounds.playError();
      alert('Seleccione un proceso de la tabla para finalizar su árbol.');
    }
  });

  // Botón aplicar prioridad
  container.querySelector('#tm-set-priority-btn').addEventListener('click', () => {
    if (selectedPid) {
      const newPrio = container.querySelector('#tm-priority-select').value;
      processManager.setPriority(selectedPid, newPrio);
      notificationManager.success('Prioridad Cambiada', `Proceso PID ${selectedPid} ahora tiene prioridad ${newPrio}`);
      sounds.playClick();
      renderTable();
    }
  });

  // Renderizar tabla de servicios
  const systemServices = [
    { name: 'AudioSrv', status: 'Running', startup: 'Automatic', description: 'Servicio de audio de Windows' },
    { name: 'Browser', status: 'Running', startup: 'Automatic', description: 'Servicio de navegación' },
    { name: 'DHCP Client', status: 'Running', startup: 'Automatic', description: 'Cliente DHCP' },
    { name: 'DNS Client', status: 'Running', startup: 'Automatic', description: 'Cliente DNS' },
    { name: 'Event Log', status: 'Running', startup: 'Automatic', description: 'Registro de eventos' },
    { name: 'Print Spooler', status: 'Stopped', startup: 'Manual', description: 'Cola de impresión' },
    { name: 'Remote Registry', status: 'Stopped', startup: 'Disabled', description: 'Registro remoto' },
    { name: 'Windows Update', status: 'Running', startup: 'Automatic', description: 'Actualizaciones de Windows' },
    { name: 'Windows Firewall', status: 'Running', startup: 'Automatic', description: 'Firewall de Windows' },
    { name: 'Windows Search', status: 'Running', startup: 'Automatic', description: 'Índice de búsqueda' }
  ];

  const renderServices = () => {
    const tbody = container.querySelector('#tm-services-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    systemServices.forEach(service => {
      const tr = document.createElement('tr');
      const statusBadge = service.status === 'Running'
        ? `<span class="aero-badge badge-running">Ejecutando</span>`
        : `<span class="aero-badge badge-terminated">Detenido</span>`;

      tr.innerHTML = `
        <td>${service.name}</td>
        <td>${statusBadge}</td>
        <td>${service.startup}</td>
        <td>${service.description}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  // Renderizar tabla de red
  const networkConnections = [
    { protocol: 'TCP', local: '192.168.1.100:52341', remote: '142.250.80.46:443', state: 'ESTABLISHED' },
    { protocol: 'TCP', local: '192.168.1.100:52342', remote: '142.250.80.46:443', state: 'ESTABLISHED' },
    { protocol: 'TCP', local: '192.168.1.100:49152', remote: '172.217.22.6:80', state: 'TIME_WAIT' },
    { protocol: 'TCP', local: '192.168.1.100:52343', remote: '157.240.24.20:443', state: 'ESTABLISHED' },
    { protocol: 'UDP', local: '192.168.1.100:5353', remote: '*:*', state: '' }
  ];

  const renderNetwork = () => {
    const tbody = container.querySelector('#tm-network-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    networkConnections.forEach(conn => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${conn.protocol}</td>
        <td>${conn.local}</td>
        <td>${conn.remote}</td>
        <td>${conn.state}</td>
      `;
      tbody.appendChild(tr);
    });

    // Actualizar estadísticas de red simuladas
    const rxSpeed = (Math.random() * 3 + 1).toFixed(1);
    const txSpeed = (Math.random() * 2 + 0.5).toFixed(1);
    container.querySelector('#net-rx-speed').textContent = `${rxSpeed} MB/s`;
    container.querySelector('#net-tx-speed').textContent = `${txSpeed} MB/s`;
  };

  // Botones de control de servicios
  container.querySelector('#tm-service-start-btn').addEventListener('click', () => {
    notificationManager.info('Servicio', 'Función de iniciar servicio (simulado)');
    sounds.playClick();
  });

  container.querySelector('#tm-service-stop-btn').addEventListener('click', () => {
    notificationManager.warning('Servicio', 'Función de detener servicio (simulado)');
    sounds.playClick();
  });

  container.querySelector('#tm-service-restart-btn').addEventListener('click', () => {
    notificationManager.info('Servicio', 'Función de reiniciar servicio (simulado)');
    sounds.playClick();
  });

  // Inicializar renderizado de servicios y red
  renderServices();
  renderNetwork();

  // Diálogo Nuevo Proceso
  const dialogEl = container.querySelector('#new-process-dialog');
  container.querySelector('#tm-new-btn').addEventListener('click', () => {
    dialogEl.style.display = 'flex';
  });
  container.querySelector('#diag-cancel-btn').addEventListener('click', () => {
    dialogEl.style.display = 'none';
  });
  container.querySelector('#diag-create-btn').addEventListener('click', () => {
    const name = container.querySelector('#diag-proc-name').value.trim() || 'proceso.exe';
    const burst = parseInt(container.querySelector('#diag-proc-burst').value, 10) || 6;
    const mem = parseInt(container.querySelector('#diag-proc-mem').value, 10) || 128;
    const priority = container.querySelector('#diag-proc-priority').value;
    const io = container.querySelector('#diag-proc-io').checked;

    processManager.createProcess(name, burst, mem, priority, io);
    dialogEl.style.display = 'none';
    sounds.playClick();
    renderTable();
  });

  // Dibujar osciloscopios de rendimiento
  const drawOscilloscope = (canvasId, dataHistory, strokeColor) => {
    const canvas = container.querySelector(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = canvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const step = width / (dataHistory.length - 1);
    dataHistory.forEach((val, i) => {
      const x = i * step;
      const y = height - (val / 100) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Relleno degradado sutil
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = strokeColor === '#00ff41' ? 'rgba(0, 255, 65, 0.12)' : 'rgba(0, 200, 255, 0.12)';
    ctx.fill();
  };

  // Suscripción a ticks de simulación
  const unsubProcess = processManager.subscribe(() => {
    renderTable();
  });

  const unsubSim = simEngine.subscribe((event) => {
    if (event === 'tick') {
      cpuHistory.push(simEngine.metrics.cpuLoad);
      if (cpuHistory.length > 50) cpuHistory.shift();

      ramHistory.push(simEngine.metrics.ramUsagePct);
      if (ramHistory.length > 50) ramHistory.shift();

      drawOscilloscope('#tm-cpu-canvas', cpuHistory, '#00ff41');
      drawOscilloscope('#tm-ram-canvas', ramHistory, '#00c8ff');

      // Actualizar contadores
      container.querySelector('#stat-switches').textContent = simEngine.metrics.contextSwitches;
      container.querySelector('#stat-syscalls').textContent = simEngine.metrics.systemCallsCount;
      container.querySelector('#stat-irqs').textContent = simEngine.metrics.interruptsCount;
      container.querySelector('#stat-pagefaults').textContent = simEngine.metrics.pageFaultsCount;

      // Actualizar estadísticas de red
      renderNetwork();
    }
  });

  renderTable();

  return () => {
    unsubProcess();
    unsubSim();
  };
}
