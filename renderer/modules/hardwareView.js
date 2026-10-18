// Vista: Administrador de Dispositivos y Control de Hardware (Hardware Manager)
import { hardwareManager } from '../kernel/hardwareManager.js';
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderHardwareView(container) {
  container.innerHTML = `
    <div class="hardware-view-wrapper">
      <!-- Árbol de Dispositivos (Device Manager Tree) -->
      <div class="hardware-tree-pane">
        <div style="font-weight: 700; color: #1e3a5a; font-size: 11px; margin-bottom: 8px;">
          💻 Equipo (AERO7-PC)
        </div>
        <div class="hardware-tree-item selected" data-section="cpu">
          <span>⚙️</span> Procesadores (4 Núcleos)
        </div>
        <div class="hardware-tree-item" data-section="disk">
          <span>💽</span> Unidades de disco (HDD SATA)
        </div>
        <div class="hardware-tree-item" data-section="usb">
          <span>🔌</span> Controladoras de bus USB (PnP)
        </div>
        <div class="hardware-tree-item" data-section="irq">
          <span>⚡</span> Controlador PIC / IRQ
        </div>
        <div class="hardware-tree-item" data-section="peripherals">
          <span>⌨️</span> Teclado e Impresora
        </div>
      </div>

      <!-- Panel de Detalles del Hardware -->
      <div class="hardware-detail-pane">
        <!-- SECCIÓN 1: PROCESADORES (CPU) -->
        <div id="hw-sec-cpu" class="aero-groupbox" style="margin-top: 0;">
          <legend>CPU Multi-Core & Registros de Arquitectura</legend>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px;" id="core-card-0">
              <div style="font-size: 10px; font-weight: 700; color: #1e293b;">Núcleo 0</div>
              <div class="aero-progress" style="margin: 4px 0;"><div class="aero-progress-bar" id="core-bar-0" style="width: 30%;"></div></div>
              <div style="font-size: 9px; color: #64748b;" id="core-temp-0">42°C - 30%</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px;" id="core-card-1">
              <div style="font-size: 10px; font-weight: 700; color: #1e293b;">Núcleo 1</div>
              <div class="aero-progress" style="margin: 4px 0;"><div class="aero-progress-bar" id="core-bar-1" style="width: 20%;"></div></div>
              <div style="font-size: 9px; color: #64748b;" id="core-temp-1">39°C - 20%</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px;" id="core-card-2">
              <div style="font-size: 10px; font-weight: 700; color: #1e293b;">Núcleo 2</div>
              <div class="aero-progress" style="margin: 4px 0;"><div class="aero-progress-bar" id="core-bar-2" style="width: 15%;"></div></div>
              <div style="font-size: 9px; color: #64748b;" id="core-temp-2">38°C - 15%</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px;" id="core-card-3">
              <div style="font-size: 10px; font-weight: 700; color: #1e293b;">Núcleo 3</div>
              <div class="aero-progress" style="margin: 4px 0;"><div class="aero-progress-bar" id="core-bar-3" style="width: 5%;"></div></div>
              <div style="font-size: 9px; color: #64748b;" id="core-temp-3">36°C - 5%</div>
            </div>
          </div>

          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px;">
            <div style="font-size: 10px; font-weight: 700; color: #334e68; margin-bottom: 4px;">Banco de Registros Internos:</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-family: monospace; font-size: 11px;">
              <div>PC: <b id="reg-pc" style="color: #2b6cb0;">0x00401A20</b></div>
              <div>IR: <b id="reg-ir" style="color: #2b6cb0;">MOV [AX], BX</b></div>
              <div>AX: <b id="reg-ax" style="color: #2b6cb0;">0x0000004A</b></div>
              <div>BX: <b id="reg-bx" style="color: #2b6cb0;">0x00001000</b></div>
              <div>CX: <b id="reg-cx" style="color: #2b6cb0;">0x00000008</b></div>
              <div>DX: <b id="reg-dx" style="color: #2b6cb0;">0x00000000</b></div>
              <div>SP: <b id="reg-sp" style="color: #2b6cb0;">0x0012FF88</b></div>
              <div>FLAGS: <b id="reg-flags" style="color: #d69e2e;">ZF=0 SF=0</b></div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: DISCO DURO (HDD) -->
        <div id="hw-sec-disk" class="aero-groupbox">
          <legend>Simulador de Disco Rígido y Planificación de Cabezal</legend>
          <div class="disk-simulator-box">
            <div class="disk-platter-visual">
              <div style="width: 25px; height: 25px; border-radius: 50%; background: #94a3b8; border: 2px solid #475569;"></div>
              <div class="disk-arm-head" id="disk-arm"></div>
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; gap: 8px; align-items: center;">
                <label class="sim-toolbar-label">Algoritmo de Cabezal:</label>
                <select class="sim-select" id="disk-algo-select">
                  <option value="SSTF" selected>SSTF (Menor Tiempo Primero)</option>
                  <option value="FCFS">FCFS (Primero en Llegar)</option>
                  <option value="SCAN">SCAN (Algoritmo del Ascensor)</option>
                </select>
              </div>
              <div style="font-size: 11px;">
                Pista actual: <b id="disk-current-track-label" style="color: #2563eb;">50</b> / 199
              </div>
              <div style="font-size: 11px;">
                Cola de cilindros pendientes: <b id="disk-queue-label">[ 82, 170, 43, 140, 24 ]</b>
              </div>
              <div style="font-size: 11px;">
                Distancia total recorrida: <b id="disk-total-seek-label">0 cilindros</b>
              </div>
              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <input class="sim-input" id="disk-new-track" type="number" min="0" max="199" placeholder="Pista (0-199)" style="width: 90px;" />
                <button class="aero-btn" id="disk-add-track-btn">➕ Encolar Petición</button>
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 3: PUERTOS USB Y PLUG & PLAY -->
        <div id="hw-sec-usb" class="aero-groupbox">
          <legend>Controlador USB Host & Conexión Plug & Play</legend>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; font-size: 11px; color: #1e293b;">Puerto USB 1 (Frontal)</div>
                <div style="font-size: 10px; color: #64748b;" id="usb-status-1">Memoria USB Kingston 32GB (Conectado)</div>
              </div>
              <button class="aero-btn" id="usb-toggle-1">Expulsar Dispositivo</button>
            </div>
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; font-size: 11px; color: #1e293b;">Puerto USB 2 (Posterior)</div>
                <div style="font-size: 10px; color: #64748b;" id="usb-status-2">Ningún dispositivo conectado</div>
              </div>
              <button class="aero-btn primary" id="usb-toggle-2">Conectar Cámara Web</button>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 4: CONTROLADOR PIC / IRQ -->
        <div id="hw-sec-irq" class="aero-groupbox">
          <legend>Controlador Programable de Interrupciones (PIC 8259A / APIC)</legend>
          <div class="aero-table-container">
            <table class="aero-table">
              <thead>
                <tr>
                  <th style="width: 50px;">Línea</th>
                  <th>Dispositivo / Función</th>
                  <th style="width: 90px;">Disparos</th>
                  <th style="width: 80px;">Acción</th>
                </tr>
              </thead>
              <tbody id="irq-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // Cambio de pestaña en el árbol
  const treeItems = container.querySelectorAll('.hardware-tree-item');
  treeItems.forEach(item => {
    item.addEventListener('click', () => {
      treeItems.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      const sec = item.getAttribute('data-section');
      const targetEl = container.querySelector(`#hw-sec-${sec}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
      sounds.playClick();
    });
  });

  // USB Plug & Play
  const usbBtn1 = container.querySelector('#usb-toggle-1');
  const usbBtn2 = container.querySelector('#usb-toggle-2');

  usbBtn1.addEventListener('click', () => {
    hardwareManager.toggleUsbDevice(1);
    const p1 = hardwareManager.usbPorts.find(p => p.port === 1);
    container.querySelector('#usb-status-1').textContent = p1.connected ? `${p1.deviceName} (Conectado)` : 'Ningún dispositivo conectado';
    usbBtn1.textContent = p1.connected ? 'Expulsar Dispositivo' : 'Conectar Memoria USB';
    usbBtn1.className = p1.connected ? 'aero-btn' : 'aero-btn primary';
  });

  usbBtn2.addEventListener('click', () => {
    hardwareManager.toggleUsbDevice(2);
    const p2 = hardwareManager.usbPorts.find(p => p.port === 2);
    container.querySelector('#usb-status-2').textContent = p2.connected ? `${p2.deviceName} (Conectado)` : 'Ningún dispositivo conectado';
    usbBtn2.textContent = p2.connected ? 'Expulsar Dispositivo' : 'Conectar Cámara Web';
    usbBtn2.className = p2.connected ? 'aero-btn' : 'aero-btn primary';
  });

  // Disco
  container.querySelector('#disk-algo-select').addEventListener('change', (e) => {
    hardwareManager.setDiskAlgorithm(e.target.value);
  });

  container.querySelector('#disk-add-track-btn').addEventListener('click', () => {
    const input = container.querySelector('#disk-new-track');
    const val = parseInt(input.value, 10);
    if (!isNaN(val)) {
      hardwareManager.addDiskRequest(val);
      input.value = '';
      sounds.playClick();
    }
  });

  const updateHardwareUI = () => {
    // Cores
    hardwareManager.cores.forEach((c, idx) => {
      const bar = container.querySelector(`#core-bar-${idx}`);
      const tempLabel = container.querySelector(`#core-temp-${idx}`);
      if (bar) {
        bar.style.width = `${c.load}%`;
        bar.className = 'aero-progress-bar' + (c.load > 75 ? ' danger' : c.load > 50 ? ' warning' : '');
      }
      if (tempLabel) {
        tempLabel.textContent = `${c.temp}°C - ${c.load}%`;
      }
    });

    // Registros
    container.querySelector('#reg-pc').textContent = hardwareManager.registers.PC;
    container.querySelector('#reg-ax').textContent = hardwareManager.registers.AX;

    // Disco
    container.querySelector('#disk-current-track-label').textContent = hardwareManager.diskCurrentTrack;
    container.querySelector('#disk-queue-label').textContent = `[ ${hardwareManager.diskQueue.join(', ')} ]`;
    container.querySelector('#disk-total-seek-label').textContent = `${hardwareManager.totalSeekDistance} cilindros`;

    // Rotación del brazo de disco
    const armEl = container.querySelector('#disk-arm');
    if (armEl) {
      const angle = (hardwareManager.diskCurrentTrack / 199) * 45 - 20;
      armEl.style.transform = `rotate(${angle}deg)`;
    }

    // Tabla IRQs
    const irqTbody = container.querySelector('#irq-tbody');
    if (irqTbody) {
      irqTbody.innerHTML = '';
      hardwareManager.interrupts.forEach(i => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><b>IRQ ${i.irq}</b></td>
          <td>${i.name} ${i.active ? '<span class="aero-badge badge-running">ACTIVA</span>' : ''}</td>
          <td>${i.count}</td>
          <td><button class="aero-btn" style="padding: 1px 6px; font-size: 10px;" data-irq="${i.irq}">Simular</button></td>
        `;

        tr.querySelector('button').addEventListener('click', () => {
          hardwareManager.triggerInterrupt(i.irq);
        });

        irqTbody.appendChild(tr);
      });
    }
  };

  const unsubHw = hardwareManager.subscribe(() => {
    updateHardwareUI();
  });

  updateHardwareUI();

  return () => unsubHw();
}
