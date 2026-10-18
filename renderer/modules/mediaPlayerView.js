// Vista: Reproductor de Música (wmplayer.exe / Windows Media Player)
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderMediaPlayerView(container) {
  const playlist = [
    { id: 1, title: 'Aero Dreamscape', artist: 'Sistema Operativo', duration: '1:45', baseFreq: 261.63 },
    { id: 2, title: 'Kernel Pulse', artist: 'Sintetizador Ring 0', duration: '2:10', baseFreq: 329.63 },
    { id: 3, title: 'Silicon Horizon', artist: 'Bus Master', duration: '1:30', baseFreq: 392.00 }
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;
  let playTimer = null;
  let elapsedSeconds = 0;
  let audioOsc = null;
  let audioGain = null;
  let animFrameId = null;

  container.innerHTML = `
    <div style="background: #0f172a; height: 100%; display: flex; flex-direction: column; color: #ffffff; overflow: hidden;">
      <!-- Barra superior estilo WMP 12 -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: linear-gradient(to bottom, #1e293b, #0f172a); border-bottom: 1px solid #334155;">
        <span style="font-size: 11px; font-weight: 700; color: #38bdf8;">Windows Media Player</span>
        <span style="font-size: 10px; color: #94a3b8;">Reproducción en curso</span>
      </div>

      <!-- Área de Visualización Espectral (Canvas) -->
      <div style="flex: 1; position: relative; background: radial-gradient(circle at 50% 50%, #032035 0%, #020617 100%); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <canvas id="wmp-visualizer-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
        <div style="position: relative; z-index: 2; text-align: center; pointer-events: none;">
          <div id="wmp-track-title" style="font-size: 16px; font-weight: 700; color: #f8fafc; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">Aero Dreamscape</div>
          <div id="wmp-track-artist" style="font-size: 11px; color: #38bdf8; margin-top: 4px;">Sistema Operativo</div>
        </div>
      </div>

      <!-- Barra de Progreso y Tiempo -->
      <div style="padding: 4px 14px; background: #0f172a; display: flex; align-items: center; gap: 10px;">
        <span id="wmp-time-elapsed" style="font-size: 10px; color: #94a3b8; font-family: monospace;">0:00</span>
        <div style="flex: 1; height: 5px; background: #334155; border-radius: 3px; position: relative; cursor: pointer;" id="wmp-progress-bar">
          <div id="wmp-progress-fill" style="height: 100%; width: 0%; background: #38bdf8; border-radius: 3px;"></div>
        </div>
        <span id="wmp-time-total" style="font-size: 10px; color: #94a3b8; font-family: monospace;">1:45</span>
      </div>

      <!-- Barra de Controles Inferior -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: linear-gradient(to bottom, #1e293b, #090d16); border-top: 1px solid #334155;">
        <!-- Lista de pistas toggle -->
        <button class="aero-btn" id="wmp-btn-playlist" style="font-size: 10px;">📋 Lista</button>

        <!-- Controles Play/Pause/Prev/Next -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="aero-btn" id="wmp-btn-prev" style="width: 28px; height: 28px; border-radius: 50%;">⏮</button>
          <button class="aero-btn primary" id="wmp-btn-play" style="width: 36px; height: 36px; border-radius: 50%; font-size: 14px;">▶</button>
          <button class="aero-btn" id="wmp-btn-next" style="width: 28px; height: 28px; border-radius: 50%;">⏭</button>
        </div>

        <!-- Volumen -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 12px;">🔊</span>
          <input type="range" id="wmp-volume" min="0" max="100" value="70" style="width: 60px; height: 4px;" />
        </div>
      </div>

      <!-- Modal flotante de lista de reproducción -->
      <div id="wmp-playlist-modal" style="display: none; position: absolute; bottom: 55px; left: 10px; width: 220px; background: rgba(15, 23, 42, 0.95); border: 1px solid #334155; border-radius: 6px; padding: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.6); backdrop-filter: blur(8px);">
        <div style="font-size: 10px; font-weight: 700; color: #94a3b8; margin-bottom: 4px; padding: 0 4px;">Pistas disponibles:</div>
        <div id="wmp-playlist-items" style="display: flex; flex-direction: column; gap: 2px;"></div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#wmp-visualizer-canvas');
  const ctx = canvas.getContext('2d');
  const playBtn = container.querySelector('#wmp-btn-play');
  const prevBtn = container.querySelector('#wmp-btn-prev');
  const nextBtn = container.querySelector('#wmp-btn-next');
  const titleLabel = container.querySelector('#wmp-track-title');
  const artistLabel = container.querySelector('#wmp-track-artist');
  const elapsedLabel = container.querySelector('#wmp-time-elapsed');
  const totalLabel = container.querySelector('#wmp-time-total');
  const progressFill = container.querySelector('#wmp-progress-fill');
  const playlistModal = container.querySelector('#wmp-playlist-modal');

  // Inicializar Canvas
  const resizeCanvas = () => {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  };
  setTimeout(resizeCanvas, 50);

  // Sintetizador procedural para la melodía de música
  const startSynth = (freq) => {
    stopSynth();
    sounds.init();
    if (!sounds.ctx) return;

    try {
      audioOsc = sounds.ctx.createOscillator();
      audioGain = sounds.ctx.createGain();
      audioOsc.type = 'triangle';
      audioOsc.frequency.setValueAtTime(freq, sounds.ctx.currentTime);
      audioGain.gain.setValueAtTime(0.04, sounds.ctx.currentTime);

      audioOsc.connect(audioGain);
      audioGain.connect(sounds.ctx.destination);
      audioOsc.start();
    } catch (e) {
      console.warn('Audio synth error:', e);
    }
  };

  const stopSynth = () => {
    if (audioOsc) {
      try { audioOsc.stop(); audioOsc.disconnect(); } catch (e) {}
      audioOsc = null;
    }
  };

  const drawVisualizer = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bars = 28;
    const barWidth = canvas.width / bars - 2;

    for (let i = 0; i < bars; i++) {
      const height = isPlaying
        ? Math.sin(Date.now() * 0.005 + i * 0.4) * (canvas.height * 0.35) + (canvas.height * 0.4) + Math.random() * 10
        : 6;

      const x = i * (barWidth + 2);
      const y = canvas.height - height;

      const grad = ctx.createLinearGradient(0, canvas.height, 0, y);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.7, '#38bdf8');
      grad.addColorStop(1, '#bae6fd');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, height);
    }

    animFrameId = requestAnimationFrame(drawVisualizer);
  };
  drawVisualizer();

  const loadTrack = (idx) => {
    currentTrackIndex = idx;
    const t = playlist[idx];
    titleLabel.textContent = t.title;
    artistLabel.textContent = t.artist;
    totalLabel.textContent = t.duration;
    elapsedSeconds = 0;
    progressFill.style.width = '0%';
    elapsedLabel.textContent = '0:00';

    if (isPlaying) {
      startSynth(t.baseFreq);
    }
  };

  const togglePlay = () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸' : '▶';

    if (isPlaying) {
      startSynth(playlist[currentTrackIndex].baseFreq);
      playTimer = setInterval(() => {
        elapsedSeconds++;
        const mins = Math.floor(elapsedSeconds / 60);
        const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
        elapsedLabel.textContent = `${mins}:${secs}`;
        const pct = Math.min(100, (elapsedSeconds / 105) * 100);
        progressFill.style.width = `${pct}%`;
        if (elapsedSeconds >= 105) {
          nextTrack();
        }
      }, 1000);
    } else {
      stopSynth();
      if (playTimer) clearInterval(playTimer);
    }
  };

  const nextTrack = () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
  };

  const prevTrack = () => {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
  };

  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', nextTrack);
  prevBtn.addEventListener('click', prevTrack);

  container.querySelector('#wmp-btn-playlist').addEventListener('click', () => {
    playlistModal.style.display = playlistModal.style.display === 'none' ? 'block' : 'none';
  });

  const playlistItemsContainer = container.querySelector('#wmp-playlist-items');
  playlist.forEach((track, i) => {
    const itemEl = document.createElement('div');
    itemEl.style.padding = '3px 6px';
    itemEl.style.fontSize = '10px';
    itemEl.style.cursor = 'pointer';
    itemEl.style.borderRadius = '3px';
    itemEl.textContent = `${track.id}. ${track.title} (${track.duration})`;
    itemEl.addEventListener('click', () => {
      loadTrack(i);
      if (!isPlaying) togglePlay();
      playlistModal.style.display = 'none';
    });
    playlistItemsContainer.appendChild(itemEl);
  });

  loadTrack(0);

  return () => {
    stopSynth();
    if (playTimer) clearInterval(playTimer);
    if (animFrameId) cancelAnimationFrame(animFrameId);
  };
}
