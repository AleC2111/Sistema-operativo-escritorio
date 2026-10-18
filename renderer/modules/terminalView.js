// Vista: Símbolo del Sistema / CLI del Sistema Operativo (Terminal cmd.exe)
import { processManager, ProcessState, SchedulerAlgorithm } from '../kernel/processManager.js';
import { memoryManager } from '../kernel/memoryManager.js';
import { hardwareManager } from '../kernel/hardwareManager.js';
import { syncLab } from '../kernel/syncLab.js';
import { simEngine } from '../kernel/simulationEngine.js';
import { sounds } from '../../assets/audio/soundEffects.js';
import { userManager } from '../kernel/userManager.js';

export function renderTerminalView(container) {
  container.innerHTML = `
    <div style="background: #0c0c0c; color: #cccccc; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; height: 100%; display: flex; flex-direction: column; padding: 10px; overflow: hidden;">
      <div id="cmd-output" style="flex: 1; overflow-y: auto; line-height: 1.4; white-space: pre-wrap;">AeroOS Operating System Simulator [Versión 6.1.7601]
(c) 2026 Universidad - Sistemas Operativos (8vo Semestre). Todos los derechos reservados.

Escriba "help" o "ayuda" para ver la lista de comandos disponibles del SO.

</div>
      <div style="display: flex; align-items: center; border-top: 1px solid #222; padding-top: 6px;">
        <span id="cmd-prompt" style="color: #cccccc; margin-right: 6px;">C:\\Windows\\System32&gt;</span>
        <input id="cmd-input" type="text" style="flex: 1; background: transparent; border: none; outline: none; color: #ffffff; font-family: inherit; font-size: inherit;" autocomplete="off" spellcheck="false" />
      </div>
    </div>
  `;

  const outputEl = container.querySelector('#cmd-output');
  const inputEl = container.querySelector('#cmd-input');
  const promptEl = container.querySelector('#cmd-prompt');

  // Sistema de archivos simulado
  const fileSystem = {
    currentPath: 'C:\\Windows\\System32',
    drives: {
      'C:': {
        type: 'drive',
        children: {
          'Windows': {
            type: 'folder',
            children: {
              'System32': {
                type: 'folder',
                children: {
                  'cmd.exe': { type: 'file', size: '245 KB' },
                  'notepad.exe': { type: 'file', size: '180 KB' },
                  'calc.exe': { type: 'file', size: '120 KB' },
                  'drivers': { type: 'folder', children: {} }
                }
              },
              'Fonts': { type: 'folder', children: {} },
              'Temp': { type: 'folder', children: {} }
            }
          },
          'Users': {
            type: 'folder',
            children: {
              'Estudiante': {
                type: 'folder',
                children: {
                  'Documents': {
                    type: 'folder',
                    children: {
                      'Tarea_SO.pdf': { type: 'file', size: '2.5 MB' },
                      'Notas.txt': { type: 'file', size: '15 KB' }
                    }
                  },
                  'Desktop': { type: 'folder', children: {} }
                }
              },
              'Profesor': {
                type: 'folder',
                children: {
                  'Documents': {
                    type: 'folder',
                    children: {
                      'Syllabus.pdf': { type: 'file', size: '1.8 MB' },
                      'Calificaciones.xlsx': { type: 'file', size: '45 KB' }
                    }
                  }
                }
              }
            }
          },
          'Program Files': { type: 'folder', children: {} }
        }
      }
    }
  };

  // Historial de comandos
  const commandHistory = [];
  let historyIndex = -1;

  const print = (text, color = '#cccccc') => {
    const span = document.createElement('span');
    span.style.color = color;
    span.textContent = text + '\n';
    outputEl.appendChild(span);
    outputEl.scrollTop = outputEl.scrollHeight;
  };

  const updatePrompt = () => {
    promptEl.textContent = `${fileSystem.currentPath}>`;
  };

  const navigateToPath = (path) => {
    if (path === '..') {
      const parts = fileSystem.currentPath.split('\\');
      if (parts.length > 1) {
        parts.pop();
        fileSystem.currentPath = parts.join('\\');
      }
      updatePrompt();
      return true;
    }

    if (path === '\\' || path === '/') {
      fileSystem.currentPath = 'C:';
      updatePrompt();
      return true;
    }

    // Resolución de ruta relativa
    const newPath = path.startsWith('\\') ? path : `${fileSystem.currentPath}\\${path}`;
    const parts = newPath.split('\\').filter(p => p);

    let current = fileSystem.drives['C:'];
    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      } else {
        return false;
      }
    }

    if (current.type === 'folder') {
      fileSystem.currentPath = newPath;
      updatePrompt();
      return true;
    }
    return false;
  };

  const listDirectory = () => {
    const parts = fileSystem.currentPath.split('\\').filter(p => p);
    let current = fileSystem.drives['C:'];

    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      }
    }

    if (!current.children) {
      print('No hay contenido en este directorio.', '#f87171');
      return;
    }

    const entries = Object.entries(current.children);
    if (entries.length === 0) {
      print('Directorio vacío.', '#60a5fa');
      return;
    }

    print(`Directorio de ${fileSystem.currentPath}`, '#93c5fd');
    print(''.padEnd(60, '-'), '#64748b');

    entries.forEach(([name, item]) => {
      const date = new Date().toLocaleDateString('es-ES');
      if (item.type === 'folder') {
        print(`${date.padEnd(12)}  <DIR>          ${name}`, '#4ade80');
      } else {
        print(`${date.padEnd(12)}  ${item.size.padEnd(14)} ${name}`, '#cccccc');
      }
    });
  };

  const createDirectory = (name) => {
    const parts = fileSystem.currentPath.split('\\').filter(p => p);
    let current = fileSystem.drives['C:'];

    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      }
    }

    if (current.children) {
      current.children[name] = { type: 'folder', children: {} };
      print(`Directorio "${name}" creado exitosamente.`, '#4ade80');
    }
  };

  const showNetworkConnections = () => {
    print('Conexiones activas de red:', '#93c5fd');
    print(''.padEnd(80, '-'), '#64748b');
    print('  Proto  Dirección Local        Dirección Remota       Estado', '#60a5fa');
    print('  TCP    192.168.1.100:52341    142.250.80.46:443     ESTABLISHED', '#cccccc');
    print('  TCP    192.168.1.100:52342    142.250.80.46:443     ESTABLISHED', '#cccccc');
    print('  TCP    192.168.1.100:49152    172.217.22.6:80       TIME_WAIT', '#cccccc');
    print('  TCP    192.168.1.100:52343    157.240.24.20:443    ESTABLISHED', '#cccccc');
    print('  UDP    192.168.1.100:5353     *:*                    ', '#cccccc');
  };

  const showIPConfig = () => {
    print('Configuración de IP de Windows', '#93c5fd');
    print(''.padEnd(60, '-'), '#64748b');
    print('Adaptador Ethernet: Conexión de área local', '#60a5fa');
    print('');
    print('   Sufijo DNS específico para la conexión. :', '#cccccc');
    print('   Dirección IPv4. . . . . . . . . . . . : 192.168.1.100', '#cccccc');
    print('   Máscara de subred . . . . . . . . . . : 255.255.255.0', '#cccccc');
    print('   Puerta de enlace predeterminada . . . : 192.168.1.1', '#cccccc');
  };

  const showIfConfig = () => {
    print('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500', '#93c5fd');
    print('        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255', '#cccccc');
    print('        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>', '#cccccc');
    print('        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)', '#cccccc');
    print('        RX packets 12345  bytes 1234567 (1.2 MiB)', '#cccccc');
    print('        TX packets 6789  bytes 987654 (965.4 KiB)', '#cccccc');
  };

  const showPSAux = () => {
    print('USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND', '#93c5fd');
    print(''.padEnd(80, '-'), '#64748b');
    processManager.processes.forEach(p => {
      if (p.state !== ProcessState.TERMINATED) {
        const user = p.isSystem ? 'root' : 'estudiante';
        const stat = p.state === ProcessState.RUNNING ? 'R' : p.state === ProcessState.READY ? 'S' : 'D';
        const vsz = (p.memorySize * 8).toString().padStart(7);
        const rss = (p.memorySize * 4).toString().padStart(6);
        const time = `${Math.floor(Math.random() * 60)}:${(Math.random() * 60).toFixed(2).padStart(5, '0')}`;
        print(`${user.padEnd(10)} ${p.pid.toString().padStart(5)} ${Math.floor(Math.random() * 10).toString().padStart(4)} ${Math.floor(Math.random() * 5).toString().padStart(4)} ${vsz} ${rss} pts/0    ${stat.padStart(4)} 10:00   ${time} ${p.name}`, '#cccccc');
      }
    });
  };

  const autocomplete = (input) => {
    const parts = input.split(' ');
    const lastPart = parts[parts.length - 1];

    const currentPathParts = fileSystem.currentPath.split('\\').filter(p => p);
    let current = fileSystem.drives['C:'];
    for (const part of currentPathParts) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      }
    }

    if (current.children) {
      const matches = Object.keys(current.children).filter(name =>
        name.toLowerCase().startsWith(lastPart.toLowerCase())
      );

      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0];
        return parts.join(' ');
      } else if (matches.length > 1) {
        print(`Opciones de autocompletado: ${matches.join(', ')}`, '#facc15');
        return input;
      }
    }

    // Autocompletar comandos
    const commands = ['help', 'tasklist', 'ps', 'ps-aux', 'kill', 'spawn', 'sched', 'quantum', 'mem', 'free', 'compact', 'sync', 'irq', 'speed', 'pause', 'resume', 'step', 'cls', 'clear', 'ver', 'dir', 'cd', 'mkdir', 'netstat', 'ipconfig', 'ifconfig'];
    const cmdMatches = commands.filter(cmd => cmd.startsWith(lastPart.toLowerCase()));

    if (cmdMatches.length === 1) {
      parts[parts.length - 1] = cmdMatches[0];
      return parts.join(' ');
    } else if (cmdMatches.length > 1) {
      print(`Comandos que coinciden: ${cmdMatches.join(', ')}`, '#facc15');
    }

    return input;
  };

  const handleCommand = (rawCmd) => {
    const cmdStr = rawCmd.trim();
    if (!cmdStr) return;

    print(`C:\\Windows\\System32> ${cmdStr}`, '#ffffff');

    const parts = cmdStr.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
      case 'ayuda':
        print(`COMANDOS DISPONIBLES EN EL SIMULADOR:`, '#60a5fa');
        print(`  tasklist / ps            - Muestra la tabla de procesos y PCBs.`);
        print(`  ps -aux                  - Muestra procesos estilo Linux con detalles.`);
        print(`  kill <pid>               - Finaliza un proceso por su identificador PID.`);
        print(`  spawn <nombre> [r] [m]   - Crea un nuevo proceso (r=ráfaga, m=memoria KB).`);
        print(`  sched <rr|fcfs|sjf|prio> - Cambia el algoritmo de planificación.`);
        print(`  quantum <num>            - Configura el quantum de Round Robin en ciclos.`);
        print(`  mem / free               - Muestra el estado de la RAM y fragmentación.`);
        print(`  compact                  - Ejecuta compactación de memoria continua.`);
        print(`  sync                     - Muestra el estado de semáforos y sincronización.`);
        print(`  irq <0|1|6|12>           - Dispara una interrupción por línea IRQ.`);
        print(`  speed <0.2-5.0>          - Modifica la velocidad del reloj de simulación.`);
        print(`  pause / resume / step    - Controla el tiempo de la CPU.`);
        print(`  cls / clear              - Limpia la consola.`);
        print(`  ver                      - Información del sistema.`);
        print(`  dir                      - Lista archivos y directorios (estilo Windows).`);
        print(`  cd <ruta>                - Cambia directorio actual (.. para subir).`);
        print(`  mkdir <nombre>           - Crea un nuevo directorio.`);
        print(`  netstat                  - Muestra conexiones de red activas.`);
        print(`  ipconfig                 - Muestra configuración de red (Windows).`);
        print(`  ifconfig                 - Muestra configuración de red (Linux).`);
        print(`  TAB                      - Autocompletado de comandos y rutas.`);
        print(`  Flechas Arriba/Abajo     - Navegar historial de comandos.`);
        break;

      case 'tasklist':
      case 'ps':
        print(`PID   NOMBRE             ESTADO      PRIORIDAD   CPU %   MEM (KB)`, '#93c5fd');
        print(`-----------------------------------------------------------------`, '#64748b');
        processManager.processes.forEach(p => {
          if (p.state !== ProcessState.TERMINATED) {
            const pidStr = p.pid.toString().padEnd(5);
            const nameStr = p.name.padEnd(18);
            const stateStr = p.state.padEnd(11);
            const prioStr = p.priority.padEnd(11);
            const cpuStr = `${p.cpuPercent}%`.padEnd(7);
            const memStr = `${p.memorySize} KB`;
            print(`${pidStr} ${nameStr} ${stateStr} ${prioStr} ${cpuStr} ${memStr}`);
          }
        });
        break;

      case 'kill':
        if (!args[0]) {
          print(`Error de sintaxis: Debe especificar un PID. Ejemplo: kill 101`, '#f87171');
        } else {
          const pid = parseInt(args[0], 10);
          const ok = processManager.killProcess(pid);
          if (ok) {
            print(`Proceso con PID ${pid} terminado con éxito.`, '#4ade80');
            sounds.playClick();
          } else {
            print(`Error: No se encontró proceso con PID ${pid}.`, '#f87171');
            sounds.playError();
          }
        }
        break;

      case 'spawn':
        const name = args[0] || 'app.exe';
        const burst = parseInt(args[1], 10) || 6;
        const mem = parseInt(args[2], 10) || 128;
        const pcb = processManager.createProcess(name, burst, mem, 'Normal', false);
        print(`Proceso creado: PID ${pcb.pid} (${name}), Ráfaga: ${burst}, Memoria: ${mem} KB`, '#4ade80');
        sounds.playClick();
        break;

      case 'sched':
        const algoMap = {
          'rr': SchedulerAlgorithm.ROUND_ROBIN,
          'fcfs': SchedulerAlgorithm.FCFS,
          'sjf': SchedulerAlgorithm.SJF,
          'prio': SchedulerAlgorithm.PRIORITY
        };
        const targetAlgo = algoMap[args[0]?.toLowerCase()];
        if (targetAlgo) {
          processManager.setAlgorithm(targetAlgo);
          print(`Algoritmo cambiado a: ${targetAlgo}`, '#4ade80');
        } else {
          print(`Error: Algoritmo inválido. Opciones: rr, fcfs, sjf, prio`, '#f87171');
        }
        break;

      case 'quantum':
        const q = parseInt(args[0], 10);
        if (q >= 1 && q <= 10) {
          processManager.setQuantum(q);
          print(`Quantum establecido en ${q} ciclos de reloj.`, '#4ade80');
        } else {
          print(`Error: Especifique un quantum entre 1 y 10.`, '#f87171');
        }
        break;

      case 'mem':
      case 'free':
        const m = memoryManager.getMetrics();
        print(`ESTADO DE MEMORIA PRINCIPAL:`, '#93c5fd');
        print(`  Memoria Total:       ${m.totalMemory} KB`);
        print(`  Memoria Asignada:    ${m.usedRam} KB (${simEngine.metrics.ramUsagePct}%)`);
        print(`  Memoria Libre:       ${m.totalFreeMemory} KB`);
        print(`  Frag. Externa:       ${m.externalFragBytes} KB (${m.externalFragPct}%)`);
        print(`  Frag. Interna Total: ${m.totalInternalFrag} KB`);
        break;

      case 'compact':
        memoryManager.compactMemory();
        print(`Compactación de memoria completada. Fragmentación externa eliminada.`, '#4ade80');
        sounds.playClick();
        break;

      case 'sync':
        print(`ESTADO DEL LABORATORIO DE CONCURRENCIA:`, '#93c5fd');
        print(`  Semáforo Mutex: ${syncLab.mutexLocked ? '0 (Bloqueado)' : '1 (Libre)'}`);
        print(`  Semáforo Empty: ${syncLab.semEmpty}`);
        print(`  Semáforo Full:  ${syncLab.semFull}`);
        print(`  Elementos en buffer: ${syncLab.buffer.length} / ${syncLab.bufferCapacity}`);
        break;

      case 'irq':
        const irqNum = parseInt(args[0], 10);
        if (!isNaN(irqNum)) {
          hardwareManager.triggerInterrupt(irqNum);
          print(`Interrupción IRQ ${irqNum} generada hacia el controlador PIC.`, '#facc15');
        } else {
          print(`Error: Especifique una línea IRQ (ejemplo: irq 1)`, '#f87171');
        }
        break;

      case 'speed':
        const s = parseFloat(args[0]);
        if (s >= 0.2 && s <= 5.0) {
          simEngine.setSpeed(s);
          print(`Velocidad de simulación ajustada a ${s}x.`, '#4ade80');
        } else {
          print(`Error: Velocidad debe estar entre 0.2 y 5.0.`, '#f87171');
        }
        break;

      case 'pause':
        simEngine.pause();
        print(`Simulación del reloj del SO pausada.`, '#facc15');
        break;

      case 'resume':
        simEngine.play();
        print(`Simulación del reloj del SO reanudada.`, '#4ade80');
        break;

      case 'step':
        simEngine.pause();
        simEngine.step();
        print(`Paso de reloj ejecutado (Ciclo ${simEngine.tickCount}).`, '#93c5fd');
        break;

      case 'cls':
      case 'clear':
        outputEl.innerHTML = '';
        break;

      case 'ver':
        print(`AeroOS - Simulador de Sistemas Operativos`);
        print(`Universidad - 8vo Semestre. Desarrollado con Electron.`);
        break;

      case 'dir':
        listDirectory();
        break;

      case 'cd':
        if (!args[0]) {
          print(fileSystem.currentPath, '#4ade80');
        } else {
          const success = navigateToPath(args[0]);
          if (!success) {
            print(`El sistema no puede encontrar la ruta especificada: ${args[0]}`, '#f87171');
          }
        }
        break;

      case 'mkdir':
        if (!args[0]) {
          print(`Error: Debe especificar un nombre para el directorio.`, '#f87171');
        } else {
          createDirectory(args[0]);
        }
        break;

      case 'netstat':
        showNetworkConnections();
        break;

      case 'ipconfig':
        showIPConfig();
        break;

      case 'ifconfig':
        showIfConfig();
        break;

      case 'ps-aux':
      case 'ps-a':
        showPSAux();
        break;

      default:
        print(`"${command}" no se reconoce como un comando interno o externo del SO. Escriba "help" para ver la lista.`, '#f87171');
    }
  };

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = inputEl.value;
      if (val.trim()) {
        commandHistory.push(val);
        historyIndex = commandHistory.length;
      }
      inputEl.value = '';
      handleCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        inputEl.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        inputEl.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        inputEl.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const currentInput = inputEl.value;
      const completed = autocomplete(currentInput);
      inputEl.value = completed;
    }
  });

  setTimeout(() => inputEl.focus(), 100);
}
