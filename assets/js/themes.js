(() => {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const dialog = document.getElementById("theme-dialog");
  const search = document.getElementById("theme-search");
  const results = document.getElementById("theme-results");
  const status = document.getElementById("theme-status");
  const themeName = document.getElementById("theme-name");
  const terminalTheme = document.getElementById("terminal-theme");
  const locale = root.lang;
  const labels = dialog.dataset;
  const storageKey = "secblog.theme";
  let activeId = "tokyo_night_night";
  let catalogRequest;

  const hexToRgb = (color) => color.slice(1).match(/../g).map((byte) => parseInt(byte, 16));
  const asCss = (rgb) => `rgb(${rgb.join(", ")})`;
  const mix = (color, target, amount) => color.map((value, index) =>
    Math.round(value + (target[index] - value) * amount)
  );

  function luminance(rgb) {
    const [red, green, blue] = rgb.map((value) => {
      const srgb = value / 255;
      return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  }

  function contrast(first, second) {
    const values = [luminance(first), luminance(second)];
    return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
  }

  function readable(color, ink, surfaces) {
    for (let step = 0; step <= 10; step++) {
      const candidate = mix(color, ink, step / 10);
      if (surfaces.every((surface) => contrast(candidate, surface) >= 4.5)) {
        return asCss(candidate);
      }
    }
    return asCss(ink);
  }

  function applyTheme(theme) {
    const background = hexToRgb(theme.background);
    const foreground = hexToRgb(theme.foreground);
    const ansi = theme.ansi.map(hexToRgb);
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    const dark = contrast(background, white) >= contrast(background, black);
    const ink = dark ? white : black;
    const canvas = mix(background, dark ? black : white, 0.22);
    const tint = mix(background, ink, 0.04);
    const raised = contrast(tint, ink) >= 4.5 ? tint : background;
    const surfaces = [background, canvas, raised];
    const accent = readable(ansi[5], ink, surfaces);
    const accentRgb = accent.match(/\d+/g).map(Number);
    const palette = {
      "--canvas": asCss(canvas),
      "--panel": theme.background,
      "--raised": asCss(raised),
      "--ink": asCss(ink),
      "--text": readable(foreground, ink, surfaces),
      "--muted": readable(mix(foreground, background, 0.2), ink, surfaces),
      "--accent": accent,
      "--on-accent": asCss(contrast(accentRgb, white) > contrast(accentRgb, black) ? white : black),
      "--green": readable(ansi[2], ink, surfaces),
      "--yellow": readable(ansi[3], ink, surfaces),
      "--blue": readable(ansi[4], ink, surfaces),
      "--pink": readable(ansi[1], ink, surfaces),
    };

    for (const [property, value] of Object.entries(palette)) {
      root.style.setProperty(property, value);
    }
    theme.ansi.forEach((value, index) => root.style.setProperty(`--ansi-${index}`, value));
    root.style.colorScheme = dark ? "dark" : "light";
    activeId = theme.id;
    themeName.textContent = theme.name;
    if (terminalTheme) terminalTheme.textContent = theme.name;
  }

  function loadCatalog() {
    catalogRequest ??= fetch(dialog.dataset.catalog)
      .then((response) => {
        if (!response.ok) throw new Error("Kitty theme catalog unavailable");
        return response.json();
      })
      .then(({ themes }) => themes.sort((first, second) => first.name.localeCompare(second.name, locale)))
      .catch((error) => {
        catalogRequest = undefined;
        throw error;
      });
    return catalogRequest;
  }

  function savedTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function selectTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(storageKey, theme.id);
    } catch {
      // The theme still applies for this page if storage is disabled.
    }
    dialog.close();
  }

  function renderThemes(themes) {
    const query = search.value.trim().toLocaleLowerCase(locale);
    const matching = themes.filter((theme) => theme.name.toLocaleLowerCase(locale).includes(query));
    const items = matching.map((theme) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-option";
      button.setAttribute("aria-pressed", String(activeId === theme.id));
      button.textContent = theme.name;
      button.addEventListener("click", () => selectTheme(theme));

      const swatches = document.createElement("span");
      swatches.className = "option-swatches";
      swatches.setAttribute("aria-hidden", "true");
      for (const color of [theme.background, theme.ansi[4], theme.ansi[5], theme.foreground]) {
        const swatch = document.createElement("i");
        swatch.style.background = color;
        swatches.append(swatch);
      }
      button.append(swatches);
      item.append(button);
      return item;
    });

    results.replaceChildren(...items);
    results.scrollTop = 0;
    status.textContent = matching.length === 0 ? labels.empty :
      `${matching.length} ${matching.length === 1 ? labels.single : labels.plural}`;
  }

  toggle.addEventListener("click", async () => {
    search.value = "";
    results.replaceChildren();
    status.textContent = labels.loading;
    dialog.showModal();
    try {
      renderThemes(await loadCatalog());
    } catch {
      status.textContent = labels.error;
    }
  });

  search.addEventListener("input", async () => {
    try {
      renderThemes(await loadCatalog());
    } catch {
      status.textContent = labels.error;
    }
  });

  dialog.addEventListener("close", () => toggle.focus());
  toggle.hidden = false;

  const storedId = savedTheme();
  if (storedId && storedId !== activeId) {
    loadCatalog().then((themes) => {
      const theme = themes.find(({ id }) => id === storedId);
      if (theme && activeId === "tokyo_night_night") applyTheme(theme);
    }).catch(() => {});
  }
})();
