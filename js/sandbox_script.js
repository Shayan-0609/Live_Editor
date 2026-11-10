document.addEventListener("DOMContentLoaded", () => {
  // 0. Handle URL Hash Code Sharing
  try {
    if (window.location.hash && window.location.hash.startsWith("#code=")) {
      const hashVal = window.location.hash.substring(6);
      if (hashVal) {
        const jsonStr = decodeURIComponent(escape(atob(hashVal)));
        const sharedData = JSON.parse(jsonStr);
        if (sharedData.html !== undefined) localStorage.setItem("sandbox_html", sharedData.html);
        if (sharedData.css !== undefined) localStorage.setItem("sandbox_css", sharedData.css);
        if (sharedData.js !== undefined) localStorage.setItem("sandbox_js", sharedData.js);
        history.replaceState(null, null, window.location.pathname);
      }
    }
  } catch (e) {
    console.error("Error loading shared code from URL hash:", e);
  }

  // Load Saved Settings from LocalStorage
  const savedFontSize = localStorage.getItem("sandbox_font_size") || "14";
  const savedFontSetting = localStorage.getItem("sandbox_font_setting") || "monospace|normal";
  const savedFontLabel = localStorage.getItem("sandbox_font_label") || "Change Fonts";
  const savedWordWrap = localStorage.getItem("sandbox_word_wrap") !== null ? localStorage.getItem("sandbox_word_wrap") === "true" : true;
  const savedLineNums = localStorage.getItem("sandbox_line_nums") !== null ? localStorage.getItem("sandbox_line_nums") === "true" : true;
  const savedLigatures = localStorage.getItem("sandbox_ligatures") !== null ? localStorage.getItem("sandbox_ligatures") === "true" : true;
  const savedTheme = localStorage.getItem("sandbox_theme") || "dracula";
  const savedThemeLabel = localStorage.getItem("sandbox_theme_label") || "Toggle Themes";
  const savedFramework = localStorage.getItem("sandbox_framework") || "none";
  const savedFrameworkLabel = localStorage.getItem("sandbox_framework_label") || "None (Vanilla CSS)";

  // Sync UI controls with saved settings on startup
  const fontSizeRange = document.getElementById("fontSizeRange");
  const fontSizeBadge = document.getElementById("fontSizeBadge");
  if (fontSizeRange && fontSizeBadge) {
    fontSizeRange.value = savedFontSize;
    fontSizeBadge.textContent = savedFontSize + "px";
  }

  const currentFontLabel = document.getElementById("currentFontLabel");
  if (currentFontLabel) currentFontLabel.textContent = savedFontLabel;

  const currentThemeLabel = document.getElementById("currentThemeLabel");
  if (currentThemeLabel) currentThemeLabel.textContent = savedThemeLabel;

  const currentFrameworkLabel = document.getElementById("currentFrameworkLabel");
  if (currentFrameworkLabel) currentFrameworkLabel.textContent = savedFrameworkLabel;

  const wordWrapToggle = document.getElementById("wordWrapToggle");
  if (wordWrapToggle) wordWrapToggle.checked = savedWordWrap;

  const lineNumToggle = document.getElementById("lineNumToggle");
  if (lineNumToggle) lineNumToggle.checked = savedLineNums;

  const ligaturesToggle = document.getElementById("ligaturesToggle");

  function supportsLigatures(fontFamily) {
    return fontFamily.includes("Fira Code") || fontFamily.includes("JetBrains Mono");
  }

  document.querySelectorAll('.font-option').forEach(item => {
    const setting = `${item.getAttribute('data-font')}|${item.getAttribute('data-style')}`;
    if (setting === savedFontSetting) item.classList.add('active');
  });

  document.querySelectorAll('.theme-option').forEach(item => {
    if (item.getAttribute('data-theme') === savedTheme) item.classList.add('active');
  });

  document.querySelectorAll('.framework-option').forEach(item => {
    if (item.getAttribute('data-framework') === savedFramework) item.classList.add('active');
  });

  function getFrameworkCDN(fw) {
    if (fw === "bootstrap") {
      return `
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css">
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" defer></script>
      `;
    } else if (fw === "tailwind") {
      return `
        <script src="https://cdn.tailwindcss.com"></script>
      `;
    }
    return "";
  }

  // 1. Initialize CodeMirror Editors
  window.htmlEditor = CodeMirror.fromTextArea(document.getElementById("html-code"), {
    mode: "htmlmixed",
    theme: savedTheme,
    lineNumbers: savedLineNums,
    lineWrapping: savedWordWrap,
    matchBrackets: true,
    tabSize: 2
  });

  window.cssEditor = CodeMirror.fromTextArea(document.getElementById("css-code"), {
    mode: "css",
    theme: savedTheme,
    lineNumbers: savedLineNums,
    lineWrapping: savedWordWrap,
    matchBrackets: true,
    tabSize: 2
  });

  window.jsEditor = CodeMirror.fromTextArea(document.getElementById("js-code"), {
    mode: "javascript",
    theme: savedTheme,
    lineNumbers: savedLineNums,
    lineWrapping: savedWordWrap,
    matchBrackets: true,
    tabSize: 2
  });

  setTimeout(() => {
    const [fontFamily, fontStyle] = savedFontSetting.split('|');
    const isLigSupported = supportsLigatures(fontFamily);

    let finalLigToggleState = savedLigatures;
    if (!isLigSupported) {
      if (ligaturesToggle) {
        ligaturesToggle.checked = false;
        ligaturesToggle.disabled = true;
      }
      finalLigToggleState = false;
    } else {
      if (ligaturesToggle) {
        ligaturesToggle.disabled = false;
        ligaturesToggle.checked = savedLigatures;
      }
    }

    const ligaturesVal = finalLigToggleState ? "normal" : "none";
    document.querySelectorAll('.CodeMirror').forEach(el => {
      el.style.fontSize = savedFontSize + 'px';
      el.style.setProperty('font-family', fontFamily, 'important');
      el.style.setProperty('font-style', fontStyle, 'important');
      el.style.setProperty('font-variant-ligatures', ligaturesVal, 'important');
    });
    if (window.htmlEditor) window.htmlEditor.refresh();
    if (window.cssEditor) window.cssEditor.refresh();
    if (window.jsEditor) window.jsEditor.refresh();
  }, 50);

  if (localStorage.getItem("sandbox_html")) window.htmlEditor.setValue(localStorage.getItem("sandbox_html"));
  if (localStorage.getItem("sandbox_css")) window.cssEditor.setValue(localStorage.getItem("sandbox_css"));
  if (localStorage.getItem("sandbox_js")) window.jsEditor.setValue(localStorage.getItem("sandbox_js"));

  // 1.1 Drag-to-Resize Splitter
  const splitter = document.getElementById("drag-splitter");
  const editorSection = document.getElementById("editor-section");
  const previewSection = document.getElementById("preview-section");
  const workspaceRow = document.getElementById("workspace-row");

  let isDragging = false;
  splitter.addEventListener("pointerdown", (e) => {
    isDragging = true;
    splitter.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  splitter.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const rect = workspaceRow.getBoundingClientRect();
    const currentY = e.clientY - rect.top;
    let percentage = (currentY / rect.height) * 100;
    if (percentage < 15) percentage = 15;
    if (percentage > 85) percentage = 85;

    editorSection.style.height = percentage + "%";
    previewSection.style.height = (100 - percentage) + "%";

    if (window.htmlEditor) window.htmlEditor.refresh();
    if (window.cssEditor) window.cssEditor.refresh();
    if (window.jsEditor) window.jsEditor.refresh();
  });

  splitter.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    splitter.releasePointerCapture(e.pointerId);
    setTimeout(() => {
      if (window.htmlEditor) window.htmlEditor.refresh();
      if (window.cssEditor) window.cssEditor.refresh();
      if (window.jsEditor) window.jsEditor.refresh();
    }, 50);
  });

  // 1.2 Hamburger Layout Swap
  const hamburgerBtn = document.getElementById("hamburger-btn");
  hamburgerBtn.addEventListener("click", () => {
    workspaceRow.classList.toggle("preview-on-top");
    setTimeout(() => {
      if (window.htmlEditor) window.htmlEditor.refresh();
      if (window.cssEditor) window.cssEditor.refresh();
      if (window.jsEditor) window.jsEditor.refresh();
    }, 50);
  });

  // 1.3 Auto-close Brackets
  function enableAutoCloseBrackets(editor) {
    let isClosing = false;
    editor.on("change", function(cm, change) {
      if (isClosing) return;
      if (change.origin !== "+input" && change.origin !== "paste") return;
      const typedChar = change.text && change.text[0];
      const pairs = { '{': '}', '(': ')', '[': ']', '"': '"', "'": "'" };
      if (pairs[typedChar]) {
        const cursor = cm.getCursor();
        isClosing = true;
        setTimeout(() => {
          cm.replaceRange(pairs[typedChar], cursor);
          cm.setCursor(cursor);
          isClosing = false;
        }, 10);
      }
    });
  }

  enableAutoCloseBrackets(window.htmlEditor);
  enableAutoCloseBrackets(window.cssEditor);
  enableAutoCloseBrackets(window.jsEditor);

  // 1.4 HTML Tag Auto-Closer
  let isAutoClosingTag = false;
  window.htmlEditor.on("change", function(cm, change) {
    if (isAutoClosingTag) return;
    if (change.origin !== "+input" && change.origin !== "paste") return;
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const textBeforeCursor = line.substring(0, cursor.ch);
    const match = textBeforeCursor.match(/<([a-zA-Z0-9\-]+)(?:\s+[^>]*)?>$/);
    if (match) {
      const tagName = match[1].toLowerCase();
      const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
      if (!selfClosingTags.includes(tagName)) {
        const textAfterCursor = line.substring(cursor.ch);
        const expectedClose = `</${tagName}>`;
        if (!textAfterCursor.startsWith(expectedClose)) {
          isAutoClosingTag = true;
          setTimeout(() => {
            cm.replaceRange(expectedClose, cursor);
            cm.setCursor(cursor);
            isAutoClosingTag = false;
          }, 10);
        }
      }
    }
  });

  function enableAutoScroll(editor) {
    editor.on("cursorActivity", function(cm) {
      cm.scrollIntoView(null, 70);
    });
  }
  enableAutoScroll(window.htmlEditor);
  enableAutoScroll(window.cssEditor);
  enableAutoScroll(window.jsEditor);

  // --- PRECISE COLOR CONVERTER LOGIC (RGB, HEX, HSL) ---
  function parseColorString(str) {
    str = str.trim().toLowerCase();
    // 1. Hex
    if (str.startsWith('#')) {
      let hex = str.substring(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length >= 6) {
        const num = parseInt(hex.substring(0, 6), 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
      }
    }
    // 2. RGB / RGBA
    const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (rgbMatch) {
      return { r: parseFloat(rgbMatch[1]), g: parseFloat(rgbMatch[2]), b: parseFloat(rgbMatch[3]) };
    }
    // 3. HSL / HSLA
    const hslMatch = str.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/i);
    if (hslMatch) {
      let h = parseFloat(hslMatch[1]);
      let s = parseFloat(hslMatch[2]);
      let l = parseFloat(hslMatch[3]);
      return hslToRgbObj(h, s, l);
    }
    return null;
  }

  function rgbToHexObj(r, g, b) {
    return "#" + [Math.round(r), Math.round(g), Math.round(b)].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('');
  }

  function rgbToHslObj(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToRgbObj(h, s, l) {
    s /= 100; l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    return {
      r: (r + m) * 255,
      g: (g + m) * 255,
      b: (b + m) * 255
    };
  }

  function convertColorAtCursor(targetFormat) {
    const activeTab = document.querySelector('#sandboxTabs .nav-link.active');
    if (!activeTab) return;
    let editor = null;
    if (activeTab.id === 'html-tab') editor = window.htmlEditor;
    else if (activeTab.id === 'css-tab') editor = window.cssEditor;
    else if (activeTab.id === 'js-tab') editor = window.jsEditor;
    if (!editor) return;

    const colorInput = document.getElementById("colorInsertInput");
    const manualColorVal = colorInput ? colorInput.value.trim() : "";

    let rgbObj = null;
    let lineNum, startCh, endCh;

    if (manualColorVal) {
      // If user typed color in the settings input box
      rgbObj = parseColorString(manualColorVal);
      if (!rgbObj) {
        alert("❌ Could not parse color from input: " + manualColorVal);
        return;
      }
      const cursor = editor.getCursor();
      lineNum = cursor.line;
      const line = editor.getLine(lineNum);
      startCh = cursor.ch;
      endCh = cursor.ch;
    } else {
      // Fallback: Cursor-based color detection in active editor
      const cursor = editor.getCursor();
      lineNum = cursor.line;
      const line = editor.getLine(lineNum);
      const ch = cursor.ch;

      const colorRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g;
      let match;
      let targetMatch = null;

      while ((match = colorRegex.exec(line)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (ch >= start && ch <= end) {
          targetMatch = { text: match[0], start, end };
          break;
        }
      }

      if (!targetMatch) {
        let minDistance = Infinity;
        colorRegex.lastIndex = 0;
        while ((match = colorRegex.exec(line)) !== null) {
          const start = match.index;
          const end = start + match[0].length;
          let dist = (ch < start) ? start - ch : (ch > end) ? ch - end : 0;
          if (dist < minDistance && dist <= 3) {
            minDistance = dist;
            targetMatch = { text: match[0], start, end };
          }
        }
      }

      if (!targetMatch) {
        alert("⚠️ Please either type a color in the input field or place your cursor inside a color code in the editor!");
        return;
      }

      rgbObj = parseColorString(targetMatch.text);
      startCh = targetMatch.start;
      endCh = targetMatch.end;
    }

    if (!rgbObj) {
      alert("❌ Invalid color value!");
      return;
    }

    let newColorStr = "";
    if (targetFormat === 'hex') {
      newColorStr = rgbToHexObj(rgbObj.r, rgbObj.g, rgbObj.b);
    } else if (targetFormat === 'rgb') {
      newColorStr = `rgb(${Math.round(rgbObj.r)}, ${Math.round(rgbObj.g)}, ${Math.round(rgbObj.b)})`;
    } else if (targetFormat === 'hsl') {
      const hsl = rgbToHslObj(rgbObj.r, rgbObj.g, rgbObj.b);
      newColorStr = `hsl(${Math.round(hsl.h)}, ${Number(hsl.s.toFixed(1))}%, ${Number(hsl.l.toFixed(1))}%)`;
    }

    if (newColorStr) {
      editor.replaceRange(newColorStr, { line: lineNum, ch: startCh }, { line: lineNum, ch: endCh });
      editor.setCursor({ line: lineNum, ch: startCh + newColorStr.length });
      if (colorInput) colorInput.value = ""; // Clear input after successful insert/update
    }
  }

  // Bind color converter buttons
  const colorRgbBtn = document.getElementById("color-rgb-btn");
  const colorHexBtn = document.getElementById("color-hex-btn");
  const colorHslBtn = document.getElementById("color-hsl-btn");

  if (colorRgbBtn) colorRgbBtn.addEventListener("click", () => convertColorAtCursor('rgb'));
  if (colorHexBtn) colorHexBtn.addEventListener("click", () => convertColorAtCursor('hex'));
  if (colorHslBtn) colorHslBtn.addEventListener("click", () => convertColorAtCursor('hsl'));

  // --- Formatter & Share ---
  function formatCurrentEditor() {
    const activeTab = document.querySelector('#sandboxTabs .nav-link.active');
    if (!activeTab) return;
    let targetEditor = null;
    let editorType = '';
    if (activeTab.id === 'html-tab') { targetEditor = window.htmlEditor; editorType = 'html'; }
    else if (activeTab.id === 'css-tab') { targetEditor = window.cssEditor; editorType = 'css'; }
    else if (activeTab.id === 'js-tab') { targetEditor = window.jsEditor; editorType = 'js'; }

    if (targetEditor) {
      const rawCode = targetEditor.getValue();
      let formattedCode = rawCode;
      if (editorType === 'html' && typeof html_beautify === 'function') {
        formattedCode = html_beautify(rawCode, { indent_size: 2, wrap_line_length: 80 });
      } else if (editorType === 'css' && typeof css_beautify === 'function') {
        formattedCode = css_beautify(rawCode, { indent_size: 2 });
      } else if (editorType === 'js' && typeof js_beautify === 'function') {
        formattedCode = js_beautify(rawCode, { indent_size: 2, space_after_anon_function: true });
      }
      if (formattedCode !== rawCode) targetEditor.setValue(formattedCode);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      formatCurrentEditor();
    }
  });

  const headerFormatBtn = document.getElementById("header-format-btn");
  if (headerFormatBtn) headerFormatBtn.addEventListener("click", formatCurrentEditor);

  const headerShareBtn = document.getElementById("header-share-btn");
  if (headerShareBtn) {
    headerShareBtn.addEventListener("click", () => {
      const payload = {
        html: window.htmlEditor.getValue(),
        css: window.cssEditor.getValue(),
        js: window.jsEditor.getValue()
      };
      try {
        const jsonStr = JSON.stringify(payload);
        const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
        const shareUrl = window.location.origin + window.location.pathname + '#code=' + base64;
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert("🔗 Shareable link copied to clipboard!");
        }).catch(() => {
          prompt("Copy your share link:", shareUrl);
        });
      } catch (err) {
        alert("Failed to generate share link.");
        console.error(err);
      }
    });
  }

  const headerDownloadBtn = document.getElementById("header-download-btn");
  if (headerDownloadBtn) {
    headerDownloadBtn.addEventListener("click", () => {
      const htmlCode = window.htmlEditor.getValue();
      const cssCode = window.cssEditor.getValue();
      const jsCode = window.jsEditor.getValue();
      const framework = localStorage.getItem("sandbox_framework") || "none";
      const frameworkCDNTag = getFrameworkCDN(framework);

      const fullDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Sandbox Project</title>
  ${frameworkCDNTag}
  <style>${cssCode}</style>
</head>
<body>
  ${htmlCode}
  <script>${jsCode}</script>
</body>
</html>`;

      const blob = new Blob([fullDocument], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // --- Settings UI handlers ---
  if (fontSizeRange && fontSizeBadge) {
    fontSizeRange.addEventListener("input", (e) => {
      const val = e.target.value;
      fontSizeBadge.textContent = val + "px";
      document.querySelectorAll('.CodeMirror').forEach(el => el.style.fontSize = val + 'px');
      localStorage.setItem("sandbox_font_size", val);
      setTimeout(() => {
        if (window.htmlEditor) window.htmlEditor.refresh();
        if (window.cssEditor) window.cssEditor.refresh();
        if (window.jsEditor) window.jsEditor.refresh();
      }, 30);
    });
  }

  document.querySelectorAll('.font-option').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.font-option').forEach(opt => opt.classList.remove('active'));
      item.classList.add('active');

      const fontFamily = item.getAttribute('data-font');
      const fontStyle = item.getAttribute('data-style');
      const fontLabel = item.getAttribute('data-label');
      if (currentFontLabel) currentFontLabel.textContent = fontLabel;

      const isLigSupported = supportsLigatures(fontFamily);
      let ligVal = "none";
      if (ligaturesToggle) {
        if (!isLigSupported) {
          ligaturesToggle.checked = false;
          ligaturesToggle.disabled = true;
          ligVal = "none";
        } else {
          ligaturesToggle.disabled = false;
          const userPref = localStorage.getItem("sandbox_ligatures") !== "false";
          ligaturesToggle.checked = userPref;
          ligVal = userPref ? "normal" : "none";
        }
      }

      document.querySelectorAll('.CodeMirror').forEach(el => {
        el.style.setProperty('font-family', fontFamily, 'important');
        el.style.setProperty('font-style', fontStyle, 'important');
        el.style.setProperty('font-variant-ligatures', ligVal, 'important');
      });

      localStorage.setItem("sandbox_font_setting", `${fontFamily}|${fontStyle}`);
      localStorage.setItem("sandbox_font_label", fontLabel);
      setTimeout(() => {
        if (window.htmlEditor) window.htmlEditor.refresh();
        if (window.cssEditor) window.cssEditor.refresh();
        if (window.jsEditor) window.jsEditor.refresh();
      }, 30);
    });
  });

  document.querySelectorAll('.theme-option').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
      item.classList.add('active');

      const selectedTheme = item.getAttribute('data-theme');
      const themeLabel = item.textContent;
      if (currentThemeLabel) currentThemeLabel.textContent = themeLabel;

      if (window.htmlEditor) window.htmlEditor.setOption("theme", selectedTheme);
      if (window.cssEditor) window.cssEditor.setOption("theme", selectedTheme);
      if (window.jsEditor) window.jsEditor.setOption("theme", selectedTheme);
      
      localStorage.setItem("sandbox_theme", selectedTheme);
      localStorage.setItem("sandbox_theme_label", themeLabel);
    });
  });

  document.querySelectorAll('.framework-option').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.framework-option').forEach(opt => opt.classList.remove('active'));
      item.classList.add('active');

      const fwVal = item.getAttribute('data-framework');
      const fwLabel = item.getAttribute('data-label');
      if (currentFrameworkLabel) currentFrameworkLabel.textContent = fwLabel;

      localStorage.setItem("sandbox_framework", fwVal);
      localStorage.setItem("sandbox_framework_label", fwLabel);
      updatePreview();
    });
  });

  if (wordWrapToggle) {
    wordWrapToggle.addEventListener("change", (e) => {
      const wrap = e.target.checked;
      if (window.htmlEditor) window.htmlEditor.setOption("lineWrapping", wrap);
      if (window.cssEditor) window.cssEditor.setOption("lineWrapping", wrap);
      if (window.jsEditor) window.jsEditor.setOption("lineWrapping", wrap);
      localStorage.setItem("sandbox_word_wrap", wrap);
    });
  }

  if (lineNumToggle) {
    lineNumToggle.addEventListener("change", (e) => {
      const showNums = e.target.checked;
      if (window.htmlEditor) window.htmlEditor.setOption("lineNumbers", showNums);
      if (window.cssEditor) window.cssEditor.setOption("lineNumbers", showNums);
      if (window.jsEditor) window.jsEditor.setOption("lineNumbers", showNums);
      localStorage.setItem("sandbox_line_nums", showNums);
    });
  }

  if (ligaturesToggle) {
    ligaturesToggle.addEventListener("change", (e) => {
      const useLigatures = e.target.checked;
      const ligVal = useLigatures ? "normal" : "none";
      document.querySelectorAll('.CodeMirror').forEach(el => {
        el.style.setProperty('font-variant-ligatures', ligVal, 'important');
      });
      localStorage.setItem("sandbox_ligatures", useLigatures);
      setTimeout(() => {
        if (window.htmlEditor) window.htmlEditor.refresh();
        if (window.cssEditor) window.cssEditor.refresh();
        if (window.jsEditor) window.jsEditor.refresh();
      }, 30);
    });
  }

  // Backup & Restore
  const menuJsonExportBtn = document.getElementById("menu-json-export-btn");
  if (menuJsonExportBtn) {
    menuJsonExportBtn.addEventListener("click", () => {
      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        html: window.htmlEditor.getValue(),
        css: window.cssEditor.getValue(),
        js: window.jsEditor.getValue(),
        settings: {
          fontSize: localStorage.getItem("sandbox_font_size"),
          fontSetting: localStorage.getItem("sandbox_font_setting"),
          fontLabel: localStorage.getItem("sandbox_font_label"),
          wordWrap: localStorage.getItem("sandbox_word_wrap"),
          lineNums: localStorage.getItem("sandbox_line_nums"),
          ligatures: localStorage.getItem("sandbox_ligatures"),
          theme: localStorage.getItem("sandbox_theme"),
          themeLabel: localStorage.getItem("sandbox_theme_label"),
          framework: localStorage.getItem("sandbox_framework"),
          frameworkLabel: localStorage.getItem("sandbox_framework_label")
        }
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sandbox-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  const menuJsonImportBtn = document.getElementById("menu-json-import-btn");
  const jsonFileInput = document.getElementById("jsonFileInput");
  if (menuJsonImportBtn && jsonFileInput) {
    menuJsonImportBtn.addEventListener("click", () => jsonFileInput.click());
    jsonFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.html !== undefined) window.htmlEditor.setValue(data.html);
          if (data.css !== undefined) window.cssEditor.setValue(data.css);
          if (data.js !== undefined) window.jsEditor.setValue(data.js);
          if (data.settings) {
            if (data.settings.fontSize) localStorage.setItem("sandbox_font_size", data.settings.fontSize);
            if (data.settings.fontSetting) localStorage.setItem("sandbox_font_setting", data.settings.fontSetting);
            if (data.settings.fontLabel) localStorage.setItem("sandbox_font_label", data.settings.fontLabel);
            if (data.settings.wordWrap) localStorage.setItem("sandbox_word_wrap", data.settings.wordWrap);
            if (data.settings.lineNums) localStorage.setItem("sandbox_line_nums", data.settings.lineNums);
            if (data.settings.ligatures) localStorage.setItem("sandbox_ligatures", data.settings.ligatures);
            if (data.settings.theme) localStorage.setItem("sandbox_theme", data.settings.theme);
            if (data.settings.themeLabel) localStorage.setItem("sandbox_theme_label", data.settings.themeLabel);
            if (data.settings.framework) localStorage.setItem("sandbox_framework", data.settings.framework);
            if (data.settings.frameworkLabel) localStorage.setItem("sandbox_framework_label", data.settings.frameworkLabel);
          }
          alert("📂 Project restored successfully!");
          location.reload();
        } catch (err) {
          alert("❌ Invalid JSON backup file!");
          console.error(err);
        }
      };
      reader.readAsText(file);
    });
  }

  const menuViewSourceBtn = document.getElementById("menu-view-source-btn");
  if (menuViewSourceBtn) {
    menuViewSourceBtn.addEventListener("click", () => {
      const htmlCode = window.htmlEditor.getValue();
      const cssCode = window.cssEditor.getValue();
      const jsCode = window.jsEditor.getValue();
      const framework = localStorage.getItem("sandbox_framework") || "none";
      const frameworkCDNTag = getFrameworkCDN(framework);
      const fullSourceDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>View Source - Sandbox Project</title>
  ${frameworkCDNTag}
  <style>${cssCode}</style>
</head>
<body>
  ${htmlCode}
  <script>${jsCode}</script>
</body>
</html>`;
      const blob = new Blob([fullSourceDocument], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  const menuExportBtn = document.getElementById("menu-export-btn");
  if (menuExportBtn) menuExportBtn.addEventListener("click", () => headerDownloadBtn.click());

  const menuFormatBtn = document.getElementById("menu-format-btn");
  if (menuFormatBtn) menuFormatBtn.addEventListener("click", formatCurrentEditor);

  const menuResetBtn = document.getElementById("menu-reset-btn");
  if (menuResetBtn) {
    menuResetBtn.addEventListener("click", () => {
      if (confirm("Reset current editors?")) {
        window.htmlEditor.setValue("");
        window.cssEditor.setValue("");
        window.jsEditor.setValue("");
      }
    });
  }

  const clearStorageBtn = document.getElementById("clear-storage-btn");
  if (clearStorageBtn) {
    clearStorageBtn.addEventListener("click", () => {
      if (confirm("Are you sure? All saved code and settings will be wiped out.")) {
        localStorage.clear();
        location.reload();
      }
    });
  }

  // Console Loggers
  window.appendLog = function(type, message) {
    const consoleDiv = document.getElementById("js-console");
    if (!consoleDiv) return;
    const placeholder = consoleDiv.querySelector('.text-secondary');
    if (placeholder) placeholder.remove();

    const logItem = document.createElement("div");
    logItem.className = "mb-2 border-bottom border-secondary border-opacity-25 pb-1 font-monospace";
    let badgeClass = "bg-secondary text-light";
    let prefix = "LOG";
    if (type === 'error') { badgeClass = "bg-danger text-white"; prefix = "ERROR"; }
    else if (type === 'warn') { badgeClass = "bg-warning text-dark"; prefix = "WARN"; }
    else if (type === 'info') { badgeClass = "bg-info text-dark"; prefix = "INFO"; }

    logItem.innerHTML = `
      <span class="badge ${badgeClass} px-1 py-0" style="font-size: 0.7rem;">${prefix}</span>
      <span class="text-light ms-1" style="white-space: pre-wrap; word-break: break-all;">${escapeHtml(message)}</span>
    `;
    consoleDiv.appendChild(logItem);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
  };

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  window.clearConsole = function() {
    const consoleDiv = document.getElementById("js-console");
    if (consoleDiv) consoleDiv.innerHTML = '<span class="text-secondary">// Console logs and errors will appear here...</span>';
  };

  const consoleClearBtn = document.getElementById("console-clear-btn");
  if (consoleClearBtn) consoleClearBtn.addEventListener("click", window.clearConsole);

  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "CONSOLE_LOG") {
      window.appendLog(event.data.level, event.data.message);
    }
  });

  // Live Update Preview
  let updateTimer = null;
  function updatePreview() {
    const htmlCode = window.htmlEditor.getValue();
    const cssCode = window.cssEditor.getValue();
    const jsCode = window.jsEditor.getValue();
    
    localStorage.setItem("sandbox_html", htmlCode);
    localStorage.setItem("sandbox_css", cssCode);
    localStorage.setItem("sandbox_js", jsCode);

    const iframe = document.getElementById("output");
    if (!iframe) return;

    window.clearConsole();
    const framework = localStorage.getItem("sandbox_framework") || "none";
    const frameworkCDNTag = getFrameworkCDN(framework);

    const combinedContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${frameworkCDNTag}
        <style>${cssCode}</style>
      </head>
      <body>
        ${htmlCode}
        <script>
          function formatArg(arg) {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); } catch (e) { return String(arg); }
            }
            return String(arg);
          }
          const origLog = console.log, origError = console.error, origWarn = console.warn, origInfo = console.info;
          function sendLog(level, args) {
            try {
              const formatted = Array.from(args).map(formatArg).join(' ');
              window.parent.postMessage({ type: 'CONSOLE_LOG', level: level, message: formatted }, '*');
            } catch (e) {}
          }
          console.log = function(...args) { origLog.apply(console, args); sendLog('log', args); };
          console.error = function(...args) { origError.apply(console, args); sendLog('error', args); };
          console.warn = function(...args) { origWarn.apply(console, args); sendLog('warn', args); };
          console.info = function(...args) { origInfo.apply(console, args); sendLog('info', args); };
          window.onerror = function(msg, url, line) {
            sendLog('error', [msg + ' (Line: ' + (line || 1) + ')']);
            return true;
          };
          try {
            ${jsCode}
          } catch (err) {
            console.error(err.message);
          }
        </script>
      </body>
      </html>
    `;
    iframe.srcdoc = combinedContent;
  }

  function triggerDebouncedUpdate() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(updatePreview, 60);
  }

  window.htmlEditor.on("change", triggerDebouncedUpdate);
  window.cssEditor.on("change", triggerDebouncedUpdate);
  window.jsEditor.on("change", triggerDebouncedUpdate);

  updatePreview();

  const triggerTabList = document.querySelectorAll('#sandboxTabs button');
  triggerTabList.forEach(triggerEl => {
    triggerEl.addEventListener('shown.bs.tab', event => {
      setTimeout(() => {
        window.htmlEditor.refresh();
        window.cssEditor.refresh();
        window.jsEditor.refresh();
      }, 50);
    });
  });
});
