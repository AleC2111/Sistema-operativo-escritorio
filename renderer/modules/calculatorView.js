// Vista: Calculadora Estándar de Windows 7 (calc.exe)
import { processManager } from '../kernel/processManager.js';
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderCalculatorView(container) {
  container.innerHTML = `
    <div style="background: #eef3f8; height: 100%; display: flex; flex-direction: column; padding: 10px; gap: 8px; user-select: none;">
      <!-- Menú superior de la calculadora -->
      <div style="display: flex; gap: 12px; font-size: 11px; color: #1e3a5a; border-bottom: 1px solid #d0dee8; padding-bottom: 4px;">
        <span style="cursor: pointer;">Ver</span>
        <span style="cursor: pointer;">Edición</span>
        <span style="cursor: pointer;">Ayuda</span>
      </div>

      <!-- Pantalla digital LCD -->
      <div style="background: linear-gradient(to bottom, #ffffff, #f2f7fc); border: 1px solid #7c9bb8; border-radius: 4px; padding: 6px 10px; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; box-shadow: inset 0 1px 3px rgba(0,0,0,0.15); min-height: 54px;">
        <div id="calc-history" style="font-size: 10px; color: #64748b; height: 14px;"></div>
        <div id="calc-display" style="font-size: 22px; font-weight: 700; color: #0f172a; font-family: 'Consolas', monospace; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">0</div>
      </div>

      <!-- Teclado de funciones y dígitos -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; flex: 1;">
        <!-- Fila de memoria -->
        <button class="aero-btn calc-btn" data-action="mc">MC</button>
        <button class="aero-btn calc-btn" data-action="mr">MR</button>
        <button class="aero-btn calc-btn" data-action="ms">MS</button>
        <button class="aero-btn calc-btn" data-action="mplus">M+</button>
        <button class="aero-btn calc-btn" data-action="mminus">M-</button>

        <!-- Fila de edición -->
        <button class="aero-btn calc-btn" data-action="back">←</button>
        <button class="aero-btn calc-btn" data-action="ce">CE</button>
        <button class="aero-btn calc-btn" data-action="c">C</button>
        <button class="aero-btn calc-btn" data-action="pm">±</button>
        <button class="aero-btn calc-btn" data-action="sqrt">√</button>

        <!-- Fila 7-9 -->
        <button class="aero-btn calc-btn" data-num="7" style="font-weight: 700; font-size: 13px;">7</button>
        <button class="aero-btn calc-btn" data-num="8" style="font-weight: 700; font-size: 13px;">8</button>
        <button class="aero-btn calc-btn" data-num="9" style="font-weight: 700; font-size: 13px;">9</button>
        <button class="aero-btn calc-btn" data-op="/">/</button>
        <button class="aero-btn calc-btn" data-action="pct">%</button>

        <!-- Fila 4-6 -->
        <button class="aero-btn calc-btn" data-num="4" style="font-weight: 700; font-size: 13px;">4</button>
        <button class="aero-btn calc-btn" data-num="5" style="font-weight: 700; font-size: 13px;">5</button>
        <button class="aero-btn calc-btn" data-num="6" style="font-weight: 700; font-size: 13px;">6</button>
        <button class="aero-btn calc-btn" data-op="*">*</button>
        <button class="aero-btn calc-btn" data-action="inv">1/x</button>

        <!-- Fila 1-3 -->
        <button class="aero-btn calc-btn" data-num="1" style="font-weight: 700; font-size: 13px;">1</button>
        <button class="aero-btn calc-btn" data-num="2" style="font-weight: 700; font-size: 13px;">2</button>
        <button class="aero-btn calc-btn" data-num="3" style="font-weight: 700; font-size: 13px;">3</button>
        <button class="aero-btn calc-btn" data-op="-">-</button>
        <button class="aero-btn calc-btn primary" data-action="eq" style="grid-row: span 2; font-size: 16px;">=</button>

        <!-- Fila 0, . -->
        <button class="aero-btn calc-btn" data-num="0" style="grid-column: span 2; font-weight: 700; font-size: 13px;">0</button>
        <button class="aero-btn calc-btn" data-num=".">.</button>
        <button class="aero-btn calc-btn" data-op="+">+</button>
      </div>
    </div>
  `;

  let currentVal = '0';
  let prevVal = null;
  let currentOp = null;
  let resetOnNext = false;
  let memoryVal = 0;

  const displayEl = container.querySelector('#calc-display');
  const historyEl = container.querySelector('#calc-history');

  const updateDisplay = () => {
    displayEl.textContent = currentVal;
  };

  const handleNum = (digit) => {
    sounds.playClick();
    if (resetOnNext) {
      currentVal = digit === '.' ? '0.' : digit;
      resetOnNext = false;
    } else {
      if (digit === '.' && currentVal.includes('.')) return;
      currentVal = currentVal === '0' && digit !== '.' ? digit : currentVal + digit;
    }
    updateDisplay();
  };

  const handleOp = (op) => {
    sounds.playClick();
    if (currentOp && !resetOnNext) {
      calculate();
    }
    prevVal = parseFloat(currentVal);
    currentOp = op;
    resetOnNext = true;
    historyEl.textContent = `${prevVal} ${op}`;
  };

  const calculate = () => {
    if (prevVal === null || currentOp === null) return;
    const cur = parseFloat(currentVal);
    let result = 0;

    switch (currentOp) {
      case '+': result = prevVal + cur; break;
      case '-': result = prevVal - cur; break;
      case '*': result = prevVal * cur; break;
      case '/': result = cur === 0 ? 'Error: Div 0' : prevVal / cur; break;
    }

    historyEl.textContent = `${prevVal} ${currentOp} ${cur} =`;
    currentVal = typeof result === 'number' ? parseFloat(result.toFixed(8)).toString() : result;
    prevVal = null;
    currentOp = null;
    resetOnNext = true;
    updateDisplay();
  };

  container.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = btn.getAttribute('data-num');
      const op = btn.getAttribute('data-op');
      const act = btn.getAttribute('data-action');

      if (num !== null) handleNum(num);
      else if (op !== null) handleOp(op);
      else if (act === 'eq') { sounds.playClick(); calculate(); }
      else if (act === 'c') {
        currentVal = '0';
        prevVal = null;
        currentOp = null;
        historyEl.textContent = '';
        updateDisplay();
        sounds.playClick();
      } else if (act === 'ce') {
        currentVal = '0';
        updateDisplay();
        sounds.playClick();
      } else if (act === 'back') {
        currentVal = currentVal.length > 1 ? currentVal.slice(0, -1) : '0';
        updateDisplay();
        sounds.playClick();
      } else if (act === 'pm') {
        currentVal = (parseFloat(currentVal) * -1).toString();
        updateDisplay();
        sounds.playClick();
      } else if (act === 'sqrt') {
        const v = parseFloat(currentVal);
        currentVal = v < 0 ? 'Error' : Math.sqrt(v).toFixed(6).toString();
        resetOnNext = true;
        updateDisplay();
        sounds.playClick();
      }
    });
  });
}
