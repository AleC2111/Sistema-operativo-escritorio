// Vista: Space Invaders - Clásico Arcade
import { sounds } from '../../assets/audio/soundEffects.js';
import { notificationManager } from '../kernel/notificationManager.js';

export function renderSpaceInvadersView(container) {
  container.innerHTML = `
    <div style="background:#0a0a0a; height:100%; display:flex; flex-direction:column; overflow:hidden;">
      <!-- Barra superior -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#1a1a2e; border-bottom:2px solid #4ecca3;">
        <span style="font-weight:700; color:#4ecca3; font-size:14px;">👾 SPACE INVADERS</span>
        <div style="display:flex; gap:20px; font-family:'Courier New',monospace; font-size:13px;">
          <span style="color:#fff;">PUNTOS: <span id="si-score" style="color:#ffd700;">0</span></span>
          <span style="color:#fff;">VIDAS: <span id="si-lives" style="color:#ff6b6b;">3</span></span>
          <span style="color:#fff;">NIVEL: <span id="si-level" style="color:#4ecca3;">1</span></span>
        </div>
      </div>

      <!-- Canvas del juego -->
      <div style="flex:1; display:flex; align-items:center; justify-content:center; background:#000;">
        <canvas id="si-canvas" width="520" height="480" style="border:2px solid #4ecca3; box-shadow:0 0 20px rgba(78,204,163,0.3);"></canvas>
      </div>

      <!-- Barra de controles -->
      <div style="background:#1a1a2e; border-top:2px solid #4ecca3; padding:10px; display:flex; justify-content:center; gap:15px; align-items:center;">
        <button class="aero-btn" id="si-btn-start" style="background:#4ecca3; color:#000; font-weight:700;">▶ INICIAR</button>
        <button class="aero-btn" id="si-btn-pause">⏸ PAUSAR</button>
        <button class="aero-btn" id="si-btn-reset">🔄 REINICIAR</button>
        <span style="color:#888; font-size:11px; margin-left:20px;">← → Mover | ESPACIO Disparar</span>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#si-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = container.querySelector('#si-score');
  const livesEl = container.querySelector('#si-lives');
  const levelEl = container.querySelector('#si-level');

  // Estado del juego
  let gameState = {
    running: false,
    paused: false,
    score: 0,
    lives: 3,
    level: 1,
    player: { x: 230, y: 440, width: 40, height: 30, speed: 5 },
    bullets: [],
    aliens: [],
    alienBullets: [],
    alienDirection: 1,
    alienSpeed: 1,
    alienDropAmount: 20,
    lastAlienShot: 0,
    alienShootInterval: 1500
  };

  // Crear oleada de aliens
  function createAliens() {
    gameState.aliens = [];
    const rows = 5;
    const cols = 11;
    const startX = 50;
    const startY = 50;
    const spacingX = 40;
    const spacingY = 35;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        gameState.aliens.push({
          x: startX + col * spacingX,
          y: startY + row * spacingY,
          width: 30,
          height: 24,
          type: row < 1 ? 2 : (row < 3 ? 1 : 0), // Diferentes tipos de aliens
          frame: 0
        });
      }
    }
  }

  // Dibujar jugador
  function drawPlayer() {
    ctx.fillStyle = '#4ecca3';
    // Cuerpo principal
    ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
    // Cañón
    ctx.fillRect(gameState.player.x + 15, gameState.player.y - 10, 10, 12);
    // Detalles
    ctx.fillStyle = '#2d9b7a';
    ctx.fillRect(gameState.player.x + 5, gameState.player.y + 5, 8, 15);
    ctx.fillRect(gameState.player.x + 27, gameState.player.y + 5, 8, 15);
  }

  // Dibujar aliens
  function drawAliens() {
    gameState.aliens.forEach(alien => {
      ctx.save();
      ctx.translate(alien.x + alien.width / 2, alien.y + alien.height / 2);

      if (alien.type === 0) {
        // Alien tipo 0 (pulpo)
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(-12, -8, 24, 16);
        ctx.fillStyle = '#ff8787';
        ctx.fillRect(-8, -6, 4, 4);
        ctx.fillRect(4, -6, 4, 4);
        // Tentáculos animados
        if (alien.frame === 0) {
          ctx.fillRect(-10, 8, 4, 6);
          ctx.fillRect(6, 8, 4, 6);
        } else {
          ctx.fillRect(-6, 8, 4, 6);
          ctx.fillRect(2, 8, 4, 6);
        }
      } else if (alien.type === 1) {
        // Alien tipo 1 (cangrejo)
        ctx.fillStyle = '#ffd93d';
        ctx.fillRect(-10, -6, 20, 12);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(-6, -4, 3, 3);
        ctx.fillRect(3, -4, 3, 3);
        // Pinzas
        if (alien.frame === 0) {
          ctx.fillRect(-14, -4, 4, 8);
          ctx.fillRect(10, -4, 4, 8);
        } else {
          ctx.fillRect(-12, -6, 4, 8);
          ctx.fillRect(8, -6, 4, 8);
        }
      } else {
        // Alien tipo 2 (calamar)
        ctx.fillStyle = '#6bcb77';
        ctx.fillRect(-8, -10, 16, 20);
        ctx.fillStyle = '#8ed99a';
        ctx.fillRect(-4, -8, 2, 2);
        ctx.fillRect(2, -8, 2, 2);
        // Brazos
        if (alien.frame === 0) {
          ctx.fillRect(-12, -2, 4, 6);
          ctx.fillRect(8, -2, 4, 6);
        } else {
          ctx.fillRect(-10, 0, 4, 6);
          ctx.fillRect(6, 0, 4, 6);
        }
      }

      ctx.restore();
    });
  }

  // Dibujar balas del jugador
  function drawBullets() {
    ctx.fillStyle = '#4ecca3';
    gameState.bullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, 4, 12);
    });

    ctx.fillStyle = '#ff6b6b';
    gameState.alienBullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, 4, 12);
    });
  }

  // Actualizar posición del jugador
  function updatePlayer(keys) {
    if (keys['ArrowLeft'] || keys['a']) {
      gameState.player.x = Math.max(0, gameState.player.x - gameState.player.speed);
    }
    if (keys['ArrowRight'] || keys['d']) {
      gameState.player.x = Math.min(canvas.width - gameState.player.width, gameState.player.x + gameState.player.speed);
    }
  }

  // Actualizar balas
  function updateBullets() {
    // Balas del jugador
    gameState.bullets = gameState.bullets.filter(bullet => {
      bullet.y -= 8;
      return bullet.y > -20;
    });

    // Balas de aliens
    gameState.alienBullets = gameState.alienBullets.filter(bullet => {
      bullet.y += 5;
      return bullet.y < canvas.height + 20;
    });
  }

  // Actualizar aliens
  function updateAliens() {
    let shouldDrop = false;
    let hitEdge = false;

    gameState.aliens.forEach(alien => {
      alien.x += gameState.alienSpeed * gameState.alienDirection;
      if (alien.x <= 10 || alien.x >= canvas.width - alien.width - 10) {
        hitEdge = true;
      }
    });

    if (hitEdge) {
      gameState.alienDirection *= -1;
      shouldDrop = true;
    }

    if (shouldDrop) {
      gameState.aliens.forEach(alien => {
        alien.y += gameState.alienDropAmount;
      });
    }

    // Animación de aliens
    if (Math.random() < 0.05) {
      gameState.aliens.forEach(alien => {
        alien.frame = alien.frame === 0 ? 1 : 0;
      });
    }

    // Aliens disparan
    const now = Date.now();
    if (now - gameState.lastAlienShot > gameState.alienShootInterval && gameState.aliens.length > 0) {
      const shooter = gameState.aliens[Math.floor(Math.random() * gameState.aliens.length)];
      gameState.alienBullets.push({
        x: shooter.x + shooter.width / 2 - 2,
        y: shooter.y + shooter.height
      });
      gameState.lastAlienShot = now;
    }
  }

  // Detectar colisiones
  function checkCollisions() {
    // Balas del jugador vs aliens
    gameState.bullets = gameState.bullets.filter(bullet => {
      for (let i = gameState.aliens.length - 1; i >= 0; i--) {
        const alien = gameState.aliens[i];
        if (bullet.x < alien.x + alien.width &&
            bullet.x + 4 > alien.x &&
            bullet.y < alien.y + alien.height &&
            bullet.y + 12 > alien.y) {
          gameState.aliens.splice(i, 1);
          gameState.score += (alien.type + 1) * 10;
          scoreEl.textContent = gameState.score;
          return false;
        }
      }
      return true;
    });

    // Balas de aliens vs jugador
    gameState.alienBullets = gameState.alienBullets.filter(bullet => {
      if (bullet.x < gameState.player.x + gameState.player.width &&
          bullet.x + 4 > gameState.player.x &&
          bullet.y < gameState.player.y + gameState.player.height &&
          bullet.y + 12 > gameState.player.y) {
        gameState.lives--;
        livesEl.textContent = gameState.lives;
        if (gameState.lives <= 0) {
          gameOver();
        }
        return false;
      }
      return true;
    });

    // Aliens tocan el fondo o al jugador
    gameState.aliens.forEach(alien => {
      if (alien.y + alien.height >= gameState.player.y) {
        gameOver();
      }
    });

    // Nivel completado
    if (gameState.aliens.length === 0) {
      nextLevel();
    }
  }

  // Siguiente nivel
  function nextLevel() {
    gameState.level++;
    levelEl.textContent = gameState.level;
    gameState.alienSpeed += 0.5;
    gameState.alienShootInterval = Math.max(500, gameState.alienShootInterval - 100);
    createAliens();
    sounds.playClick();
    notificationManager.success('¡Nivel Completado!', `Has alcanzado el nivel ${gameState.level} - ¡Excelente!`);
  }

  // Game over
  function gameOver() {
    gameState.running = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Courier New';
    ctx.fillText(`Puntuación final: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Presiona REINICIAR para jugar de nuevo', canvas.width / 2, canvas.height / 2 + 50);
  }

  // Loop principal
  const keys = {};
  let animationId = null;

  function gameLoop() {
    if (!gameState.running || gameState.paused) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar estrellas de fondo
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % canvas.width;
      const y = (i * 97) % canvas.height;
      ctx.fillRect(x, y, 1, 1);
    }

    updatePlayer(keys);
    updateBullets();
    updateAliens();
    checkCollisions();

    drawPlayer();
    drawAliens();
    drawBullets();

    animationId = requestAnimationFrame(gameLoop);
  }

  // Event listeners
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameState.running && !gameState.paused) {
      e.preventDefault();
      gameState.bullets.push({
        x: gameState.player.x + gameState.player.width / 2 - 2,
        y: gameState.player.y - 10
      });
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  container.querySelector('#si-btn-start').addEventListener('click', () => {
    if (!gameState.running) {
      gameState.running = true;
      gameState.paused = false;
      createAliens();
      gameLoop();
      sounds.playClick();
    }
  });

  container.querySelector('#si-btn-pause').addEventListener('click', () => {
    if (gameState.running) {
      gameState.paused = !gameState.paused;
      if (!gameState.paused) {
        gameLoop();
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4ecca3';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
      }
      sounds.playClick();
    }
  });

  container.querySelector('#si-btn-reset').addEventListener('click', () => {
    gameState = {
      running: false,
      paused: false,
      score: 0,
      lives: 3,
      level: 1,
      player: { x: 230, y: 440, width: 40, height: 30, speed: 5 },
      bullets: [],
      aliens: [],
      alienBullets: [],
      alienDirection: 1,
      alienSpeed: 1,
      alienDropAmount: 20,
      lastAlienShot: 0,
      alienShootInterval: 1500
    };
    scoreEl.textContent = '0';
    livesEl.textContent = '3';
    levelEl.textContent = '1';
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4ecca3';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE INVADERS', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Courier New';
    ctx.fillText('Presiona INICIAR para comenzar', canvas.width / 2, canvas.height / 2 + 10);
    sounds.playClick();
  });

  // Pantalla inicial
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#4ecca3';
  ctx.font = 'bold 24px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE INVADERS', canvas.width / 2, canvas.height / 2 - 30);
  ctx.fillStyle = '#fff';
  ctx.font = '14px Courier New';
  ctx.fillText('Presiona INICIAR para comenzar', canvas.width / 2, canvas.height / 2 + 10);

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}
