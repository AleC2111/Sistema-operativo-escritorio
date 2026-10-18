// Vista: Gestor de Memoria Principal y Visualizador de Fragmentación Interna y Externa
import { memoryManager, MemoryMode, FitAlgorithm } from '../kernel/memoryManager.js';
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderMemoryView(container) {
  container.innerHTML = `
    <div class="memory-view-wrapper">
      <!-- Barra de herramientas de configuración de memoria -->
      <div class="sim-toolbar" style="border-radius: 4px; justify-content: space-between;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <label class="sim-toolbar-label">Esquema:</label>
          <select class="sim-select" id="mem-scheme-select">
            <option value="${MemoryMode.CONTIGUOUS}">Particiones Contiguas (Frag. Externa)</option>
            <option value="${MemoryMode.PAGING}">Paginación y Marcos (Frag. Interna)</option>
          </select>

          <div id="contiguous-options" style="display: flex; gap: 6px; align-items: center;">
            <label class="sim-toolbar-label">Ajuste:</label>
            <select class="sim-select" id="mem-fit-select">
              <option value="${FitAlgorithm.FIRST_FIT}">First-Fit (Primer Ajuste)</option>
              <option value="${FitAlgorithm.BEST_FIT}">Best-Fit (Mejor Ajuste)</option>
              <option value="${FitAlgorithm.WORST_FIT}">Worst-Fit (Peor Ajuste)</option>
            </select>
          </div>
        </div>

        <div style="display: flex; gap: 6px;">
          <button class="aero-btn primary" id="mem-compact-btn">📦 Compactar Memoria</button>
        </div>
      </div>

      <!-- Tarjetas de métricas y fragmentación -->
      <div class="memory-stats-grid">
        <div class="memory-stat-card">
          <span class="memory-stat-label">Memoria Total</span>
          <span class="memory-stat-value">1,024 KB</span>
        </div>
        <div class="memory-stat-card">
          <span class="memory-stat-label">Memoria Asignada</span>
          <span class="memory-stat-value" id="mem-used-val">0 KB</span>
        </div>
        <div class="memory-stat-card">
          <span class="memory-stat-label">Memoria Libre</span>
          <span class="memory-stat-value" id="mem-free-val">0 KB</span>
        </div>
        <div class="memory-stat-card" id="card-frag-external" style="border-left: 3px solid #e53e3e;">
          <span class="memory-stat-label" style="color: #c53030; font-weight: 700;">Frag. Externa</span>
          <span class="memory-stat-value" id="mem-frag-ext-val" style="color: #c53030;">0 KB (0%)</span>
        </div>
        <div class="memory-stat-card" id="card-frag-internal" style="display: none; border-left: 3px solid #d69e2e;">
          <span class="memory-stat-label" style="color: #b7791f; font-weight: 700;">Frag. Interna Total</span>
          <span class="memory-stat-value" id="mem-frag-int-val" style="color: #b7791f;">0 KB</span>
        </div>
      </div>

      <!-- SECCIÓN A: MAPA CONTIGUO -->
      <div id="section-contiguous" class="aero-groupbox" style="flex: 1; display: flex; flex-direction: column;">
        <legend>Mapa de Memoria Física Contigua (0x00000000 a 0x00100000)</legend>
        <p style="font-size: 11px; color: #475569; margin-bottom: 8px;">
          Demuestra cómo la entrada y salida de procesos genera huecos dispersos no contiguos (<b>Fragmentación Externa</b>).
        </p>
        <div class="memory-bar-visual" id="contiguous-bar-container"></div>
        <div id="contiguous-legend" style="margin-top: 8px; display: flex; gap: 12px; flex-wrap: wrap; font-size: 10px;"></div>
      </div>

      <!-- SECCIÓN B: CUADÍCULA DE PAGINACIÓN -->
      <div id="section-paging" class="aero-groupbox" style="flex: 1; display: none; flex-direction: column;">
        <legend>Marcos de Página Físicos (Frames de 32 KB)</legend>
        <p style="font-size: 11px; color: #475569; margin-bottom: 8px;">
          Demuestra la división en marcos fijos donde el desperdicio ocurre dentro de la última página (<b>Fragmentación Interna</b>, en rayado rojo).
        </p>
        <div class="paging-grid" id="paging-grid-container"></div>
      </div>
    </div>
  `;

  const schemeSelect = container.querySelector('#mem-scheme-select');
  const fitSelect = container.querySelector('#mem-fit-select');
  const contiguousOpt = container.querySelector('#contiguous-options');
  const sectionContiguous = container.querySelector('#section-contiguous');
  const sectionPaging = container.querySelector('#section-paging');
  const cardFragExt = container.querySelector('#card-frag-external');
  const cardFragInt = container.querySelector('#card-frag-internal');
  const compactBtn = container.querySelector('#mem-compact-btn');

  schemeSelect.value = memoryManager.mode;
  fitSelect.value = memoryManager.fitAlgorithm;

  schemeSelect.addEventListener('change', () => {
    memoryManager.setMode(schemeSelect.value);
    const isContiguous = schemeSelect.value === MemoryMode.CONTIGUOUS;
    contiguousOpt.style.display = isContiguous ? 'flex' : 'none';
    compactBtn.style.display = isContiguous ? 'inline-flex' : 'none';
    sectionContiguous.style.display = isContiguous ? 'flex' : 'none';
    sectionPaging.style.display = isContiguous ? 'none' : 'flex';
    cardFragExt.style.display = isContiguous ? 'flex' : 'none';
    cardFragInt.style.display = isContiguous ? 'none' : 'flex';
    sounds.playClick();
  });

  fitSelect.addEventListener('change', () => {
    memoryManager.setFitAlgorithm(fitSelect.value);
    sounds.playClick();
  });

  compactBtn.addEventListener('click', () => {
    memoryManager.compactMemory();
    sounds.playClick();
  });

  const renderMemoryUI = () => {
    const data = memoryManager.getMetrics();

    const ramUsagePct = Math.round((data.usedRam / data.totalMemory) * 100);
    container.querySelector('#mem-used-val').textContent = `${data.usedRam} KB (${ramUsagePct}%)`;
    container.querySelector('#mem-free-val').textContent = `${data.totalFreeMemory} KB`;
    container.querySelector('#mem-frag-ext-val').textContent = `${data.externalFragBytes} KB (${data.externalFragPct}%)`;
    container.querySelector('#mem-frag-int-val').textContent = `${data.totalInternalFrag} KB`;

    // Renderizar barra contigua
    const barContainer = container.querySelector('#contiguous-bar-container');
    const legendContainer = container.querySelector('#contiguous-legend');
    if (barContainer) {
      barContainer.innerHTML = '';
      legendContainer.innerHTML = '';

      memoryManager.contiguousBlocks.forEach(b => {
        const pct = (b.size / memoryManager.totalMemory) * 100;
        const blockEl = document.createElement('div');
        blockEl.className = 'memory-block' + (!b.isAllocated ? ' free' : '');
        blockEl.style.width = `${pct}%`;
        if (b.isAllocated) {
          blockEl.style.backgroundColor = b.color;
        }

        blockEl.innerHTML = `
          <span>${b.name.split(' ')[0]}</span>
          <span style="font-size: 8px; opacity: 0.85;">${b.size}KB</span>
        `;
        blockEl.title = `${b.name}\nDir: 0x${b.startAddr.toString(16).padStart(4, '0')} - Tamaño: ${b.size} KB`;
        barContainer.appendChild(blockEl);

        // Leyenda
        const itemLeg = document.createElement('div');
        itemLeg.style.display = 'flex';
        itemLeg.style.alignItems = 'center';
        itemLeg.style.gap = '4px';
        itemLeg.innerHTML = `
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${b.isAllocated ? b.color : '#e2e8f0'}; border: 1px solid #94a3b8;"></span>
          <span>${b.name} (${b.size} KB)</span>
        `;
        legendContainer.appendChild(itemLeg);
      });
    }

    // Renderizar marcos de paginación
    const gridContainer = container.querySelector('#paging-grid-container');
    if (gridContainer) {
      gridContainer.innerHTML = '';

      memoryManager.frames.forEach(f => {
        const frameEl = document.createElement('div');
        frameEl.className = 'paging-frame';
        if (f.isAllocated) {
          frameEl.style.borderColor = f.color;
        }

        frameEl.innerHTML = `
          <div class="frame-header">
            <span>Marco ${f.frameNumber}</span>
            <span>32KB</span>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 9px; font-weight: 700; color: ${f.isAllocated ? f.color : '#94a3b8'};">
            ${f.isAllocated ? `${f.processName.split('.')[0]} [P${f.pageNumber}]` : 'LIBRE'}
          </div>
          ${f.internalFrag > 0 ? `<div class="frame-internal-frag">Frag: ${f.internalFrag}KB</div>` : ''}
        `;
        frameEl.title = `Marco ${f.frameNumber}\nProceso: ${f.processName || 'Libre'}\nPágina: ${f.pageNumber !== null ? f.pageNumber : 'N/A'}\nFrag. Interna: ${f.internalFrag} KB`;

        gridContainer.appendChild(frameEl);
      });
    }
  };

  const unsubMem = memoryManager.subscribe(() => {
    renderMemoryUI();
  });

  renderMemoryUI();

  return () => unsubMem();
}
