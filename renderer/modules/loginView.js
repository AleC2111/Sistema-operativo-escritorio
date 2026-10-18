// Vista: Pantalla de Login estilo Windows 7
import { userManager } from '../kernel/userManager.js';
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderLoginScreen(container) {
  console.log('renderLoginScreen llamado, container:', container);
  console.log('userManager disponible:', userManager);
  console.log('userManager.getAllUsers():', userManager.getAllUsers());

  // Obtener usuarios directamente
  const users = userManager.getAllUsers();
  console.log('Usuarios obtenidos:', users);

  // Generar HTML de usuarios directamente
  const usersHTML = users.map(user => `
    <div class="user-item" data-user-id="${user.id}" style="
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px 15px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #ffffff;
      margin-bottom: 8px;
    ">
      <div style="
        width: 45px;
        height: 45px;
        background: linear-gradient(135deg, #38bdf8, #0284c7);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
      ">${user.avatar}</div>
      <div style="flex: 1;">
        <div style="color: #1a365d; font-weight: 600; font-size: 14px;">${user.name}</div>
        <div style="color: #64748b; font-size: 11px;">${user.role}</div>
      </div>
      <div style="color: #94a3b8;">→</div>
    </div>
  `).join('');

  container.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;';
  container.innerHTML = `
    <div id="login-screen" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #2b6cb0 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    ">
      <!-- Logo y nombre del sistema -->
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #38bdf8, #0284c7);
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        ">
          <svg viewBox="0 0 28 28" width="48" height="48">
            <defs>
              <radialGradient id="orbGlowLogin" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="40%" stop-color="#38bdf8" />
                <stop offset="100%" stop-color="#0284c7" />
              </radialGradient>
            </defs>
            <circle cx="14" cy="14" r="8" fill="url(#orbGlowLogin)" />
          </svg>
        </div>
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 300; margin-bottom: 5px;">AeroOS</h1>
        <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">Sistema Operativo de Escritorio</p>
      </div>

      <!-- Tarjeta de selección de usuario -->
      <div id="user-selection-card" style="
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        padding: 30px 40px;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        min-width: 400px;
      ">
        <h2 style="color: #1a365d; font-size: 18px; margin-bottom: 20px; text-align: center;">Seleccione un usuario</h2>
        <div id="user-list" style="display: flex; flex-direction: column; gap: 12px;">
          ${usersHTML}
        </div>
      </div>

      <!-- Tarjeta de contraseña (oculta inicialmente) -->
      <div id="password-card" style="
        display: none;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        padding: 30px 40px;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        min-width: 400px;
      ">
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
          <div id="selected-user-avatar" style="
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #38bdf8, #0284c7);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 16px;
          "></div>
          <div>
            <h3 id="selected-user-name" style="color: #1a365d; font-size: 16px; margin: 0;"></h3>
            <p id="selected-user-role" style="color: #64748b; font-size: 12px; margin: 0;"></p>
          </div>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; color: #475569; font-size: 12px; margin-bottom: 6px;">Contraseña:</label>
          <input id="login-password" type="password" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            font-size: 14px;
            outline: none;
          " placeholder="Ingrese su contraseña" />
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="login-back-btn" class="aero-btn">Atrás</button>
          <button id="login-submit-btn" class="aero-btn primary">Iniciar Sesión</button>
        </div>
        <p id="login-error" style="color: #dc2626; font-size: 12px; margin-top: 10px; display: none;"></p>
      </div>

      <!-- Información del sistema -->
      <div style="position: absolute; bottom: 20px; right: 20px; color: rgba(255, 255, 255, 0.6); font-size: 11px;">
        AeroOS v1.0 | Sistemas Operativos 8vo Semestre
      </div>
    </div>
  `;

  const userSelectionCard = container.querySelector('#user-selection-card');
  const passwordCard = container.querySelector('#password-card');
  const userList = container.querySelector('#user-list');
  const passwordInput = container.querySelector('#login-password');
  const backBtn = container.querySelector('#login-back-btn');
  const submitBtn = container.querySelector('#login-submit-btn');
  const errorMsg = container.querySelector('#login-error');

  console.log('Elementos encontrados:', {
    userSelectionCard: !!userSelectionCard,
    passwordCard: !!passwordCard,
    userList: !!userList,
    passwordInput: !!passwordInput,
    backBtn: !!backBtn,
    submitBtn: !!submitBtn
  });

  let selectedUser = null;

  // Agregar event listeners a los usuarios ya renderizados
  const userItems = container.querySelectorAll('.user-item');
  console.log('User items encontrados:', userItems.length);

  userItems.forEach((item, index) => {
    const userId = item.getAttribute('data-user-id');
    const user = users.find(u => u.id === userId);
    console.log(`Configurando listener para usuario ${index}:`, user?.name);

    item.addEventListener('mouseenter', () => {
      item.style.background = '#f0f9ff';
      item.style.borderColor = '#38bdf8';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = '#ffffff';
      item.style.borderColor = '#e2e8f0';
    });
    item.addEventListener('click', () => {
      console.log('Usuario seleccionado:', user);
      selectedUser = user;
      showPasswordCard(user);
      sounds.playClick();
    });
  });

  const showPasswordCard = (user) => {
    userSelectionCard.style.display = 'none';
    passwordCard.style.display = 'block';
    container.querySelector('#selected-user-avatar').textContent = user.avatar;
    container.querySelector('#selected-user-name').textContent = user.name;
    container.querySelector('#selected-user-role').textContent = user.role;
    passwordInput.value = '';
    errorMsg.style.display = 'none';
    setTimeout(() => passwordInput.focus(), 100);
  };

  const showUserSelection = () => {
    passwordCard.style.display = 'none';
    userSelectionCard.style.display = 'block';
    selectedUser = null;
  };

  backBtn.addEventListener('click', () => {
    showUserSelection();
    sounds.playClick();
  });

  submitBtn.addEventListener('click', () => {
    console.log('Botón de submit clickeado');
    alert('Botón de login presionado. Revisa la consola para ver los logs.');
    attemptLogin();
  });
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      console.log('Enter presionado en password input');
      attemptLogin();
    }
  });

  const attemptLogin = () => {
    console.log('attemptLogin llamado');
    console.log('selectedUser:', selectedUser);
    console.log('password ingresado:', passwordInput.value);

    if (!selectedUser) {
      console.error('ERROR: No hay usuario seleccionado');
      return;
    }

    const password = passwordInput.value;
    console.log('Intentando login con:', selectedUser.id, password);

    const loginResult = userManager.login(selectedUser.id, password);
    console.log('Resultado del login:', loginResult);

    if (loginResult) {
      console.log('Login exitoso, ocultando pantalla de login');
      sounds.playStartup();
      container.querySelector('#login-screen').style.display = 'none';
    } else {
      console.log('Login fallido');
      errorMsg.textContent = 'Contraseña incorrecta. Intente nuevamente.';
      errorMsg.style.display = 'block';
      passwordInput.value = '';
      sounds.playError();
      setTimeout(() => passwordInput.focus(), 100);
    }
  };

  console.log('Login screen renderizado completamente');
}

export function showLockScreen(container) {
  const currentUser = userManager.getCurrentUser();
  if (!currentUser) return;

  container.innerHTML = `
    <div id="lock-screen" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #2b6cb0 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    ">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #38bdf8, #0284c7);
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          color: white;
          font-weight: 600;
          font-size: 24px;
        ">${currentUser.avatar}</div>
        <h2 style="color: #ffffff; font-size: 22px; font-weight: 300;">${currentUser.name}</h2>
        <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px;">Pantalla bloqueada</p>
      </div>

      <div style="
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        padding: 25px 35px;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        min-width: 350px;
      ">
        <div style="margin-bottom: 15px;">
          <label style="display: block; color: #475569; font-size: 12px; margin-bottom: 6px;">Contraseña:</label>
          <input id="unlock-password" type="password" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            font-size: 14px;
            outline: none;
          " placeholder="Ingrese su contraseña para desbloquear" />
        </div>
        <button id="unlock-btn" class="aero-btn primary" style="width: 100%;">Desbloquear</button>
        <p id="unlock-error" style="color: #dc2626; font-size: 12px; margin-top: 10px; display: none; text-align: center;"></p>
      </div>

      <div style="position: absolute; bottom: 20px; right: 20px; color: rgba(255, 255, 255, 0.6); font-size: 11px;">
        Presione Ctrl+Alt+Supr para opciones de seguridad
      </div>
    </div>
  `;

  const passwordInput = container.querySelector('#unlock-password');
  const unlockBtn = container.querySelector('#unlock-btn');
  const errorMsg = container.querySelector('#unlock-error');

  const attemptUnlock = () => {
    const password = passwordInput.value;
    if (userManager.unlock(currentUser.id, password)) {
      sounds.playClick();
      container.querySelector('#lock-screen').style.display = 'none';
    } else {
      errorMsg.textContent = 'Contraseña incorrecta.';
      errorMsg.style.display = 'block';
      passwordInput.value = '';
      sounds.playError();
      setTimeout(() => passwordInput.focus(), 100);
    }
  };

  unlockBtn.addEventListener('click', attemptUnlock);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptUnlock();
  });

  setTimeout(() => passwordInput.focus(), 100);
}
