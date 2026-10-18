// Vista: Visualización Gráfica del Flujo de Información y Registro del Núcleo (Kernel Flow & Buses)
import { busVisualizer } from '../kernel/busVisualizer.js';
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderKernelFlowView(container) {
  container.innerHTML = `
    <div class="kernel-flow-wrapper">
      <!-- Barra de pruebas de llamadas al sistema -->
      <div style="display: flex; gap: 8px; align-items: center; background: #1b263b; padding: 6px 10px; border-radius: 4px; border: 1px solid #415a77;">
        <span style="font-size: 11px; font-weight: 700; color: #f6ad55;">Inyectar Syscall (Ring 3 ➔ Ring 0):</span>
        <button class="aero-btn" id="btn-sc-read" style="background: #2b4566; color: #fff; border-color: #4a719c;">sys_read()</button>
        <button class="aero-btn" id="btn-sc-write" style="background: #2b4566; color: #fff; border-color: #4a719c;">sys_write()</button>
        <button class="aero-btn" id="btn-sc-fork" style="background: #2b4566; color: #fff; border-color: #4a719c;">sys_fork()</button>
        <button class="aero-btn" id="btn-sc-yield" style="background: #2b4566; color: #fff; border-color: #4a719c;">sys_yield()</button>
      </div>

      <!-- Diagrama animado de arquitectura de buses -->
      <div class="bus-architecture-diagram" id="bus-diagram-container">
        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          <!-- Definición de buses -->
          <!-- Bus de Direcciones (Address Bus) -->
          <line x1="50" y1="110" x2="550" y2="110" stroke="#ecc94b" stroke-width="4" stroke-dasharray="6" />
          <text x="560" y="114" fill="#ecc94b" font-size="10" font-weight="700">Bus de Direcciones (Address)</text>

          <!-- Bus de Datos (Data Bus) -->
          <line x1="50" y1="130" x2="550" y2="130" stroke="#00f2fe" stroke-width="5" />
          <text x="560" y="134" fill="#00f2fe" font-size="10" font-weight="700">Bus de Datos (Data)</text>

          <!-- Bus de Control (Control Bus) -->
          <line x1="50" y1="150" x2="550" y2="150" stroke="#ed8936" stroke-width="4" stroke-dasharray="3" />
          <text x="560" y="154" fill="#ed8936" font-size="10" font-weight="700">Bus de Control (Signals)</text>

          <!-- Conexiones verticales -->
          <!-- CPU -->
          <line x1="120" y1="65" x2="120" y2="150" stroke="#a0aec0" stroke-width="2" />
          <!-- MMU / RAM -->
          <line x1="280" y1="65" x2="280" y2="150" stroke="#a0aec0" stroke-width="2" />
          <!-- E/S Dispositivos -->
          <line x1="440" y1="65" x2="440" y2="150" stroke="#a0aec0" stroke-width="2" />
        </svg>

        <!-- Bloques físicos conectados al bus -->
        <!-- CPU / REGISTROS -->
        <div style="position: absolute; top: 15px; left: 70px; width: 105px; height: 50px; background: linear-gradient(135deg, #1f4068, #162447); border: 2px solid #00f2fe; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0, 242, 254, 0.4);">
          <span style="font-size: 11px; font-weight: 700; color: #fff;">CPU / ALU</span>
          <span style="font-size: 8px; color: #90cdf4;">Ring 0 / Ring 3</span>
        </div>

        <!-- MMU / RAM -->
        <div style="position: absolute; top: 15px; left: 230px; width: 105px; height: 50px; background: linear-gradient(135deg, #1f4068, #162447); border: 2px solid #ecc94b; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(236, 201, 75, 0.4);">
          <span style="font-size: 11px; font-weight: 700; color: #fff;">MMU & RAM</span>
          <span style="font-size: 8px; color: #fefcbf;">1024 KB Físicos</span>
        </div>

        <!-- CONTROLADORA E/S -->
        <div style="position: absolute; top: 15px; left: 390px; width: 105px; height: 50px; background: linear-gradient(135deg, #1f4068, #162447); border: 2px solid #ed8936; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(237, 137, 54, 0.4);">
          <span style="font-size: 11px; font-weight: 700; color: #fff;">Controlador E/S</span>
          <span style="font-size: 8px; color: #feebc8;">Disco & Periféricos</span>
        </div>

        <!-- Partículas de datos animadas -->
        <div id="bus-packets-container"></div>
      </div>

      <!-- Consola Syslog del Kernel -->
      <div style="display: flex; flex-direction: column; flex: 1;">
        <div style="font-size: 11px; font-weight: 700; color: #a0aec0; margin-bottom: 4px; display: flex; justify-content: space-between;">
          <span>Registro del Núcleo (Kernel Syslog - Ring 0 Journal)</span>
          <span style="font-size: 10px; color: #64748b;">Nivel: VERBOSE</span>
        </div>
        <div class="syslog-terminal" id="syslog-container"></div>
      </div>
    </div>
  `;

  const syslogEl = container.querySelector('#syslog-container');
  const packetsEl = container.querySelector('#bus-packets-container');

  // Botones de llamada al sistema
  const trigger = (name, args) => {
    busVisualizer.triggerSyscall(name, 102, args);
    sounds.playInterrupt();
  };

  container.querySelector('#btn-sc-read').addEventListener('click', () => trigger('sys_read', 'fd=0, buf=0x100, count=64'));
  container.querySelector('#btn-sc-write').addEventListener('click', () => trigger('sys_write', 'fd=1, buf="OK", count=2'));
  container.querySelector('#btn-sc-fork').addEventListener('click', () => trigger('sys_fork', ''));
  container.querySelector('#btn-sc-yield').addEventListener('click', () => trigger('sys_yield', ''));

  // Renderizar syslog
  const renderSyslog = () => {
    if (!syslogEl) return;
    syslogEl.innerHTML = '';

    busVisualizer.syslog.forEach(item => {
      const line = document.createElement('div');
      line.className = 'syslog-line';

      let tagClass = 'syslog-event';
      if (item.tag === 'SYSCALL') tagClass = 'syslog-tag-syscall';
      else if (item.tag === 'IRQ') tagClass = 'syslog-tag-irq';
      else if (item.tag === 'SCHED') tagClass = 'syslog-tag-dispatch';

      line.innerHTML = `
        <span class="syslog-time">[${item.timestamp}]</span>
        <span class="${tagClass}">[${item.tag}]</span>
        <span class="syslog-event">${item.message}</span>
      `;
      syslogEl.appendChild(line);
    });
  };

  // Animación de paquetes por el bus
  const animPacket = (packet) => {
    if (!packetsEl) return;
    const dot = document.createElement('div');
    dot.className = 'bus-packet';
    dot.style.backgroundColor = packet.color;
    dot.style.top = '126px';
    dot.style.left = '80px';
    packetsEl.appendChild(dot);

    let pos = 80;
    const interval = setInterval(() => {
      pos += 15;
      dot.style.left = `${pos}px`;
      if (pos > 480) {
        clearInterval(interval);
        dot.remove();
      }
    }, 30);
  };

  const unsubBus = busVisualizer.subscribe((event, data) => {
    if (event === 'logAdded') {
      renderSyslog();
    } else if (event === 'busPacket') {
      animPacket(data);
    }
  });

  renderSyslog();

  return () => unsubBus();
}
