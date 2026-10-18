// Vista: Personalización y Selector de Fondos de Pantalla de Escritorio
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderWallpaperView(container) {
  const wallpapers = [
    {
      id: 'wallpaper-aurora',
      name: 'Aero Azul Radiante',
      description: 'El diseño clásico en azul cobalto con resplandores celestes.',
      previewStyle: 'background: radial-gradient(circle, #38bdf8, #0d3868);'
    },
    {
      id: 'wallpaper-harmony',
      name: 'Harmony Pradera Viva',
      description: 'Cielo azul luminoso con praderas en verde esmeralda cálido.',
      previewStyle: 'background: linear-gradient(to bottom, #1377cc 45%, #68c740 75%);'
    },
    {
      id: 'wallpaper-deep-night',
      name: 'Nebulosa Violeta Cósmica',
      description: 'Púrpura galáctico, violeta oscuro y estrellas de fondo.',
      previewStyle: 'background: radial-gradient(circle, #7c3aed, #1e0538);'
    },
    {
      id: 'wallpaper-sunset',
      name: 'Atardecer Dorado y Carmesí',
      description: 'Cálido resplandor con matices de oro, naranja y magenta.',
      previewStyle: 'background: linear-gradient(135deg, #be185d, #f97316 70%, #facc15 100%);'
    },
    {
      id: 'wallpaper-cyber',
      name: 'Ciberespacio Matrix',
      description: 'Cuadrícula técnica con brillo turquesa y carbono puro.',
      previewStyle: 'background: #041f2a; border: 1px solid #06b6d4;'
    },
    {
      id: 'wallpaper-rose',
      name: 'Aero Rosa Cristalino',
      description: 'Elegante cristal fucsia y reflejos satinados modernos.',
      previewStyle: 'background: radial-gradient(circle, #f472b6, #701a75);'
    }
  ];

  const desktopEl = document.getElementById('desktop');
  let selectedTheme = 'wallpaper-aurora';
  let customImageUrl = null;

  // Detectar fondo actual
  wallpapers.forEach(w => {
    if (desktopEl && desktopEl.classList.contains(w.id)) {
      selectedTheme = w.id;
    }
  });

  container.innerHTML = `
    <div style="background: #f0f4f9; height: 100%; display: flex; flex-direction: column; padding: 12px; gap: 10px; overflow-y: auto;">
      <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
        <h2 style="font-size: 13px; color: #1e3a5a; margin: 0; font-weight: 700;">Personalización del Fondo de Escritorio</h2>
        <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Elija un tema de color vibrante o cargue su propia imagen de fondo.</p>
      </div>

      <!-- Galería de Fondos Predeterminados -->
      <div style="font-size: 11px; font-weight: 700; color: #1e3a5a;">Temas Predeterminados:</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;" id="wp-gallery"></div>

      <!-- Sección de Imagen Personalizada -->
      <div class="aero-groupbox" style="margin-top: 4px;">
        <legend>Cargar Imagen de Fondo Personalizada</legend>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="file" id="wp-file-input" accept="image/*" style="display: none;" />
            <button class="aero-btn primary" id="wp-browse-btn">📁 Seleccionar Imagen de mi Equipo...</button>
            <span id="wp-file-name" style="font-size: 11px; color: #64748b; font-style: italic;">Ningún archivo elegido</span>
          </div>

          <div style="display: flex; gap: 6px; align-items: center;">
            <span style="font-size: 11px; color: #475569;">O ingresar URL:</span>
            <input class="sim-input" type="text" id="wp-url-input" placeholder="https://ejemplo.com/fondo.jpg" style="flex: 1;" />
            <button class="aero-btn" id="wp-url-apply-btn">Usar URL</button>
          </div>

          <div id="wp-custom-preview-box" style="display: none; align-items: center; gap: 10px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px;">
            <div id="wp-custom-thumbnail" style="width: 80px; height: 50px; border-radius: 3px; background-size: cover; background-position: center; border: 1px solid #94a3b8;"></div>
            <div style="font-size: 11px; color: #1e293b; flex: 1;">
              <b>Imagen cargada correctamente</b>
              <div style="font-size: 10px; color: #64748b;">Haga clic en Aplicar para establecerla en el escritorio.</div>
            </div>
            <button class="aero-btn primary" id="wp-custom-apply-btn">Aplicar Esta Imagen</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const galleryEl = container.querySelector('#wp-gallery');
  const fileInput = container.querySelector('#wp-file-input');
  const browseBtn = container.querySelector('#wp-browse-btn');
  const fileNameLabel = container.querySelector('#wp-file-name');
  const urlInput = container.querySelector('#wp-url-input');
  const urlApplyBtn = container.querySelector('#wp-url-apply-btn');
  const previewBox = container.querySelector('#wp-custom-preview-box');
  const customThumb = container.querySelector('#wp-custom-thumbnail');
  const customApplyBtn = container.querySelector('#wp-custom-apply-btn');

  const applyPresetTheme = (themeId) => {
    selectedTheme = themeId;
    if (desktopEl) {
      desktopEl.style.backgroundImage = '';
      wallpapers.forEach(w => desktopEl.classList.remove(w.id));
      desktopEl.classList.remove('wallpaper-custom');
      desktopEl.classList.add(themeId);
      sounds.playClick();
    }
    renderCards();
  };

  const applyCustomImage = (imgUrl) => {
    if (!desktopEl || !imgUrl) return;
    wallpapers.forEach(w => desktopEl.classList.remove(w.id));
    desktopEl.classList.add('wallpaper-custom');
    desktopEl.style.backgroundImage = `url("${imgUrl}")`;
    sounds.playClick();
  };

  browseBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      fileNameLabel.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (event) => {
        customImageUrl = event.target.result;
        customThumb.style.backgroundImage = `url("${customImageUrl}")`;
        previewBox.style.display = 'flex';
        sounds.playClick();
      };
      reader.readAsDataURL(file);
    }
  });

  urlApplyBtn.addEventListener('click', () => {
    const val = urlInput.value.trim();
    if (val) {
      customImageUrl = val;
      customThumb.style.backgroundImage = `url("${customImageUrl}")`;
      previewBox.style.display = 'flex';
      sounds.playClick();
    }
  });

  customApplyBtn.addEventListener('click', () => {
    if (customImageUrl) {
      applyCustomImage(customImageUrl);
      alert('¡Fondo personalizado aplicado al escritorio!');
    }
  });

  const renderCards = () => {
    galleryEl.innerHTML = '';
    wallpapers.forEach(w => {
      const isSelected = w.id === selectedTheme && (!desktopEl.style.backgroundImage);
      const card = document.createElement('div');
      card.style.background = '#ffffff';
      card.style.border = isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1';
      card.style.borderRadius = '6px';
      card.style.padding = '6px';
      card.style.cursor = 'pointer';
      card.style.boxShadow = isSelected ? '0 0 8px rgba(2, 132, 199, 0.45)' : '0 1px 3px rgba(0,0,0,0.06)';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '4px';

      card.innerHTML = `
        <div style="height: 52px; border-radius: 4px; ${w.previewStyle}"></div>
        <div style="font-size: 10px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${w.name}</div>
      `;

      card.addEventListener('click', () => {
        applyPresetTheme(w.id);
      });

      galleryEl.appendChild(card);
    });
  };

  renderCards();
}
