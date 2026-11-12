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
  const savedFontWeight = localStorage.getItem("sandbox_font_weight") || "400";
  const savedFontWeightLabel = localStorage.getItem("sandbox_font_weight_label") || "Normal (400)";
  const savedLineHeight = localStorage.getItem("sandbox_line_height") || "1.4";
  const savedWordWrap = localStorage.getItem("sandbox_word_wrap") !== null ? localStorage.getItem("sandbox_word_wrap") === "true" : true;
  const savedLineNums = localStorage.getItem("sandbox_line_nums") !== null ? localStorage.getItem("sandbox_line_nums") === "true" : true;
  const savedLigatures = localStorage.getItem("sandbox_ligatures") !== null ? localStorage.getItem("sandbox_ligatures") === "true" : true;
  const savedTheme = localStorage.getItem("sandbox_theme") || "dracula";
  const savedThemeLabel = localStorage.getItem("sandbox_theme_label") || "Toggle Themes";
  const savedFramework = localStorage.getItem("sandbox_framework") || "none";
  const savedFrameworkLabel = localStorage.getItem("sandbox_framework_label") || "None (Vanilla CSS)";

  // --- DEFAULT CUSTOM SNIPPETS (JSON format) ---
  const defaultSnippets = {
    "js": {
      "clg": "console.log($1);",
      "fnc": "function $1($2) {\n  $3\n}",
      "arr": "const $1 = ($2) => {\n  $3\n};",
      "foe": "$1.forEach(item => {\n  $2\n});"
    },
    "html": {
      "t": "<tag>$1</tag>",
      "ul": "<ul>\n  <li>$1</li>\n</ul>",
      "btn": "<button class=\"btn btn-$1\">$2</button>"
    },
    "css": {
      "flex": "display: flex;\nalign-items: center;\njustify-content: center;",
      "pos": "position: absolute;\ntop: 0;\nleft: 0;"
    }
  };

  // Load user snippets or fallback to default
  let customSnippets = defaultSnippets;
  try {
    const savedSnippets = localStorage.getItem("sandbox_custom_snippets");
    if (savedSnippets) {
      customSnippets = JSON.parse(savedSnippets);
    } else {
      localStorage.setItem("sandbox_custom_snippets", JSON.stringify(defaultSnippets, null, 2));
    }
  } catch (err) {
    console.error("Error loading custom snippets:", err);
  }

  // Sync UI controls with saved settings on startup
  const fontSizeRange = document.getElementById("fontSizeRange");
  const fontSizeBadge = document.getElementById("fontSizeBadge");
  if (fontSizeRange && fontSizeBadge) {
    fontSizeRange.value = savedFontSize;
    fontSizeBadge.textContent = savedFontSize + "px";
  }

  const lineHeightRange = document.getElementById("lineHeightRange");
  const lineHeightBadge = document.getElementById("lineHeightBadge");
  if (lineHeightRange && lineHeightBadge) {
    lineHeightRange.value = savedLineHeight;
    lineHeightBadge.textContent = savedLineHeight;
  }

  const currentFontLabel = document.getElementById("currentFontLabel");
  if (currentFontLabel) currentFontLabel.textContent = savedFontLabel;

  const currentFontWeightLabel = document.getElementById("currentFontWeightLabel");
  if (currentFontWeightLabel) currentFontWeightLabel.textContent = savedFontWeightLabel;

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

  document.querySelectorAll('.fontweight-option').forEach(item => {
    if (item.getAttribute('data-weight') === savedFontWeight) item.classList.add('active');
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

  // --- EMMET & CUSTOM SNIPPET INTEGRATED ENGINE (Fixed for $) ---
  function splitByOperator(str, op) {
    let result = [];
    let current = "";
    let depth = 0;
    let inAttr = false;
    let inContent = false;
    
    for (let i = 0; i < str.length; i++) {
      let char = str[i];
      if (char === '[') inAttr = true;
      if (char === ']') inAttr = false;
      if (char === '{') inContent = true;
      if (char === '}') inContent = false;
      
      if (!inAttr && !inContent) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (depth === 0 && char === op) {
          result.push(current);
          current = "";
          continue;
        }
      }
      current += char;
    }
    result.push(current);
    return result;
  }

  function parseSingleTagNode(seg, index = 0) {
    let tagName = "div";
    let id = "";
    let classes = [];
    let attrs = [];
    let textContent = "";

    let contentMatch = seg.match(/\{([^}]*)\}/);
    if (contentMatch) {
      let rawText = contentMatch[1];
      textContent = rawText.replace(/\$/g, index + 1);
      seg = seg.replace(contentMatch[0], '');
    }

    let tagMatch = seg.match(/^([a-zA-Z0-9\-]+)/);
    if (tagMatch && !seg.startsWith('.') && !seg.startsWith('#') && !seg.startsWith('[')) {
      tagName = tagMatch[1];
      seg = seg.substring(tagMatch[0].length);
    }

    let i = 0;
    while (i < seg.length) {
      let char = seg[i];
      if (char === '#') {
        i++;
        let start = i;
        while (i < seg.length && seg[i] !== '.' && seg[i] !== '#' && seg[i] !== '[') {
          i++;
        }
        id = seg.substring(start, i);
      } else if (char === '.') {
        i++;
        let start = i;
        while (i < seg.length && seg[i] !== '.' && seg[i] !== '#' && seg[i] !== '[') {
          i++;
        }
        classes.push(seg.substring(start, i));
      } else if (char === '[') {
        i++;
        let start = i;
        let bracketDepth = 1;
        let inQuote = false;
        let quoteChar = '';
        while (i < seg.length && bracketDepth > 0) {
          let c = seg[i];
          if ((c === '"' || c === "'") && (i === 0 || seg[i - 1] !== '\\')) {
            if (!inQuote) {
              inQuote = true;
              quoteChar = c;
            } else if (quoteChar === c) {
              inQuote = false;
            }
          }
          if (!inQuote) {
            if (c === '[') bracketDepth++;
            if (c === ']') bracketDepth--;
          }
          if (bracketDepth > 0) i++;
        }
        attrs.push(seg.substring(start, i));
        i++;
      } else {
        i++;
      }
    }

    const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
    let isSelf = selfClosing.includes(tagName.toLowerCase());

    return {
      tagName,
      id,
      classes,
      attrs,
      textContent,
      isSelfClosing: isSelf,
      children: []
    };
  }

  function parseEmmet(str) {
    str = str.trim();
    if (!str) return [];

    let siblings = splitByOperator(str, '+');
    if (siblings.length > 1) {
      let nodes = [];
      for (let i = 0; i < siblings.length; i++) {
        let parsed = parseEmmet(siblings[i]);
        nodes = nodes.concat(parsed);
      }
      return nodes;
    }

    let children = splitByOperator(str, '>');
    if (children.length > 1) {
      let parentNodes = parseEmmet(children[0]);
      let childNodes = parseEmmet(children.slice(1).join('>'));
      if (parentNodes.length > 0) {
        let root = parentNodes[0];
        let curr = root;
        while (curr.children && curr.children.length > 0) {
          curr = curr.children[curr.children.length - 1];
        }
        curr.children = childNodes;
        return parentNodes;
      }
    }

    let multMatch = str.match(/^(.+)\*(\d+)$/);
    if (multMatch) {
      let baseStr = multMatch[1];
      let count = parseInt(multMatch[2], 10);
      let nodes = [];
      for (let idx = 0; idx < count; idx++) {
        let singleNode = parseSingleTagNode(baseStr, idx);
        nodes.push(singleNode);
      }
      return nodes;
    }

    return [parseSingleTagNode(str, 0)];
  }

  function renderNodesToHTML(nodes, baseIndent = "", indentLevel = 0) {
    let html = "";
    let indent = baseIndent + "  ".repeat(indentLevel);
    const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];

    for (let node of nodes) {
      let attrStr = "";
      if (node.id) attrStr += ` id="${node.id}"`;
      if (node.classes.length > 0) attrStr += ` class="${node.classes.join(' ')}"`;
      for (let attr of node.attrs) {
        attrStr += ` ${attr}`;
      }

      if (selfClosing.includes(node.tagName.toLowerCase())) {
        html += `${indent}<${node.tagName}${attrStr}>\n`;
      } else if (node.children && node.children.length > 0) {
        html += `${indent}<${node.tagName}${attrStr}>\n`;
        html += renderNodesToHTML(node.children, baseIndent, indentLevel + 1);
        html += `${indent}</${node.tagName}>\n`;
      } else if (node.textContent !== "") {
        html += `${indent}<${node.tagName}${attrStr}>${node.textContent}</${node.tagName}>\n`;
      } else {
        html += `${indent}<${node.tagName}${attrStr}></${node.tagName}>\n`;
      }
    }
    return html;
  }

  function expandEmmet(abbr, baseIndent = "") {
    abbr = abbr.trim();
    if (!abbr) return "";
    let nodes = parseEmmet(abbr);
    return renderNodesToHTML(nodes, baseIndent, 0).trimEnd();
  }

  function setupSmartEditorFeatures(cm, mode) {
    cm.setOption("extraKeys", {
      "Tab": function(cm) {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const lineBefore = line.substring(0, cursor.ch);
        const words = lineBefore.trim().split(/\s+/);
        const lastWord = words[words.length - 1] || "";

        // 1. Check Custom Snippets first based on mode (js, html, css)
        let langKey = "html";
        if (mode === "javascript") langKey = "js";
        else if (mode === "css") langKey = "css";

        if (customSnippets[langKey] && customSnippets[langKey][lastWord]) {
          let snippetTpl = customSnippets[langKey][lastWord];
          const indentMatch = line.match(/^([ \t]*)/);
          let baseIndent = indentMatch ? indentMatch[1] : '';
          
          let formattedSnippet = snippetTpl.split('\n').map((l, idx) => idx === 0 ? l : baseIndent + l).join('\n');
          let startCh = cursor.ch - lastWord.length;

          cm.replaceRange(formattedSnippet, {line: cursor.line, ch: startCh}, cursor);
          return;
        }

        // 2. Fallback to Emmet expansion for HTML/XML
        if (mode === "htmlmixed" || mode === "html") {
          const match = lineBefore.match(/([a-zA-Z0-9\-\.\#\[\]\=\"\:\;\*\+\(\)\>\{\},\s\$]+)+$/);
          if (match) {
            let abbr = match[0].trim();
            let startCh = cursor.ch - abbr.length;
            const indentMatch = line.match(/^([ \t]*)/);
            let baseIndent = indentMatch ? indentMatch[1] : '';

            let expanded = expandEmmet(abbr, baseIndent);
            if (expanded) {
              cm.replaceRange(expanded, {line: cursor.line, ch: startCh}, cursor);
              return;
            }
          }
        }

        if (cm.somethingSelected()) {
          cm.indentSelection("add");
        } else {
          cm.replaceRange("  ", cm.getCursor(), null, "+input");
        }
      }
    });
  }

  setupSmartEditorFeatures(window.htmlEditor, "htmlmixed");
  setupSmartEditorFeatures(window.cssEditor, "css");
  setupSmartEditorFeatures(window.jsEditor, "javascript");

  // --- CUSTOM SNIPPETS DIRECT JS EDITOR INTEGRATION ---
  const editSnippetsBtn = document.getElementById("menu-snippets-edit-btn");
  const saveSnippetsBtn = document.getElementById("menu-snippets-save-btn");

  if (editSnippetsBtn) {
    editSnippetsBtn.addEventListener("click", () => {
      let currentJsonStr = JSON.stringify(customSnippets, null, 2);
      
      const jsTabBtn = document.getElementById("js-tab");
      if (jsTabBtn) {
        const bsTab = new bootstrap.Tab(jsTabBtn);
        bsTab.show();
      }

      if (window.jsEditor) {
        window.jsEditor.setValue(currentJsonStr);
        window.jsEditor.setOption("mode", "javascript");
        window.jsEditor.refresh();
      }

      alert("📝 Custom snippets JSON loaded into JavaScript Editor! Edit your snippets there and click 'Save Snippets'.");
    });
  }

  if (saveSnippetsBtn) {
    saveSnippetsBtn.addEventListener("click", () => {
      if (!window.jsEditor) return;
      let editorContent = window.jsEditor.getValue().trim();

      try {
        let parsed = JSON.parse(editorContent);
        customSnippets = parsed;
        localStorage.setItem("sandbox_custom_snippets", JSON.stringify(parsed, null, 2));
        alert("✅ Custom snippets saved successfully from JS Editor!");
      } catch (e) {
        alert("❌ Invalid JSON format in JS Editor! Please check your brackets/quotes.");
      }
    });
  }

  const uploadSnippetsBtn = document.getElementById("menu-snippets-import-btn");
  const snippetsFileInput = document.getElementById("snippetsFileInput");
  if (uploadSnippetsBtn && snippetsFileInput) {
    uploadSnippetsBtn.addEventListener("click", () => snippetsFileInput.click());
    snippetsFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          let parsed = JSON.parse(event.target.result);
          customSnippets = parsed;
          localStorage.setItem("sandbox_custom_snippets", JSON.stringify(parsed, null, 2));
          alert("📂 Custom snippets file uploaded and applied successfully!");
        } catch (err) {
          alert("❌ Invalid JSON snippet file!");
        }
      };
      reader.readAsText(file);
    });
  }

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
      el.style.setProperty('font-weight', savedFontWeight, 'important');
      el.style.setProperty('line-height', savedLineHeight, 'important');
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

  // 1.3 Clean Bracket Auto-Closing & Enter Formatter
  function enableAutoCloseBrackets(editor) {
    editor.setOption("autoCloseBrackets", false);
    
    editor.on("keydown", function(cm, event) {
      if (event.key === "Enter") {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const charBefore = line.charAt(cursor.ch - 1);
        const charAfter = line.charAt(cursor.ch);

        if (
          (charBefore === '{' && charAfter === '}') ||
          (charBefore === '(' && charAfter === ')') ||
          (charBefore === '[' && charAfter === ']')
        ) {
          event.preventDefault();
          const indentMatch = line.match(/^([ \t]*)/);
          const baseIndent = indentMatch ? indentMatch[1] : '';
          const innerIndent = baseIndent + "  ";

          const replacement = `\n${innerIndent}\n${baseIndent}`;
          cm.replaceRange(replacement, { line: cursor.line, ch: cursor.ch }, { line: cursor.line, ch: cursor.ch });
          cm.setCursor({ line: cursor.line + 1, ch: innerIndent.length });
          return;
        }

        const lineBefore = line.substring(0, cursor.ch);
        const lineAfter = line.substring(cursor.ch);
        const openTagMatch = lineBefore.match(/<([a-zA-Z0-9\-]+)(?:\s+[^>]*)?>$/);
        if (openTagMatch) {
          const tagName = openTagMatch[1].toLowerCase();
          const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
          if (!selfClosingTags.includes(tagName)) {
            const expectedClose = `</${tagName}>`;
            if (!lineAfter.trim() || lineAfter.trim() === expectedClose) {
              event.preventDefault();
              const indentMatch = line.match(/^([ \t]*)/);
              const baseIndent = indentMatch ? indentMatch[1] : '';
              const innerIndent = baseIndent + "  ";
              
              const replacement = `\n${innerIndent}\n${baseIndent}${expectedClose}`;
              cm.replaceRange(replacement, cursor, { line: cursor.line, ch: line.length });
              cm.setCursor({ line: cursor.line + 1, ch: innerIndent.length });
              return;
            }
          }
        }
      }
    });

    editor.on("beforeChange", function(cm, change) {
      if (change.origin === "+input" && change.text.length === 1 && change.text[0].length === 1) {
        const typedChar = change.text[0];
        const pairs = { '{': '}', '(': ')', '[': ']', '"': '"', "'": "'" };
        if (pairs[typedChar]) {
          change.update(change.from, change.to, [typedChar + pairs[typedChar]], change.from);
          setTimeout(() => {
            const cur = cm.getCursor();
            cm.setCursor({ line: cur.line, ch: cur.ch - 1 });
          }, 1);
        }
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
    
    const braceIdx = line.lastIndexOf('{', cursor.ch);
    const closeBraceIdx = line.indexOf('}', cursor.ch);
    if (braceIdx !== -1 && (closeBraceIdx === -1 || cursor.ch < closeBraceIdx)) {
      return; 
    }

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

  // --- PRECISE COLOR CONVERTER LOGIC (EXACT ROUND-TRIP PREVENTS DRIFT) ---
  function parseColorString(str) {
    str = str.trim().toLowerCase();
    if (str.startsWith('#')) {
      let hex = str.substring(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length >= 6) {
        const num = parseInt(hex.substring(0, 6), 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
      }
    }
    const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (rgbMatch) {
      return { r: parseFloat(rgbMatch[1]), g: parseFloat(rgbMatch[2]), b: parseFloat(rgbMatch[3]) };
    }
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
    return "#" + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('');
  }

  function rgbToHslObj(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
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
    h = (h % 360 + 360) % 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
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
      rgbObj = parseColorString(manualColorVal);
      if (!rgbObj) {
        alert("❌ Could not parse color from input: " + manualColorVal);
        return;
      }
      const cursor = editor.getCursor();
      lineNum = cursor.line;
      startCh = cursor.ch;
      endCh = cursor.ch;
    } else {
      const cursor = editor.getCursor();
      lineNum = cursor.line;
      const line = editor.getLine(lineNum);
      const ch = cursor.ch;

      const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b|#[0-9a-fA-F]{8}\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\)|hsla?\(\s*[\d.]+\s*,\s*[\d.]+(?:%|\s*),\s*[\d.]+(?:%|\s*)(?:,\s*[\d.]+\s*)?\)/g;
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

    const r = Math.round(rgbObj.r);
    const g = Math.round(rgbObj.g);
    const b = Math.round(rgbObj.b);

    let newColorStr = "";
    if (targetFormat === 'hex') {
      newColorStr = rgbToHexObj(r, g, b);
    } else if (targetFormat === 'rgb') {
      newColorStr = `rgb(${r}, ${g}, ${b})`;
    } else if (targetFormat === 'hsl') {
      const hsl = rgbToHslObj(r, g, b);
      // Retain float precisions formatted nicely to 1 decimal place if needed, or precise integer formatting
      const hStr = Math.round(hsl.h);
      const sStr = Number(hsl.s.toFixed(1));
      const lStr = Number(hsl.l.toFixed(1));
      newColorStr = `hsl(${hStr}, ${sStr}%, ${lStr}%)`;
    }

    if (newColorStr) {
      editor.replaceRange(newColorStr, { line: lineNum, ch: startCh }, { line: lineNum, ch: endCh });
      editor.setCursor({ line: lineNum, ch: startCh + newColorStr.length });
      if (colorInput) colorInput.value = "";
    }
  }

  const colorRgbBtn = document.getElementById("color-rgb-btn");
  const colorHexBtn = document.getElementById("color-hex-btn");
  const colorHslBtn = document.getElementById("color-hsl-btn");

  if (colorRgbBtn) colorRgbBtn.addEventListener("click", () => convertColorAtCursor('rgb'));
  if (colorHexBtn) colorHexBtn.addEventListener("click", () => convertColorAtCursor('hex'));
  if (colorHslBtn) colorHslBtn.addEventListener("click", () => convertColorAtCursor('hsl'));
  
    // --- DYNAMIC COLOR INPUT BACKGROUND, TEXT & BORDER READABILITY LOGIC ---
  const colorInput = document.getElementById("colorInsertInput");
  if (colorInput) {
    colorInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      const rgb = parseColorString(val);

      if (rgb) {
        // 1. Background set karo using '!important'
        colorInput.style.setProperty('background-color', val, 'important');

        // 2. YIQ formula se calculate karo ki color dark hai ya light
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

        // 3. Text, Border aur Placeholder color dynamically set karo
        if (brightness < 128) {
          // Dark Background -> Light text & Light translucent border
          colorInput.style.setProperty('color', '#ffffff', 'important');
          colorInput.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.5)', 'important');
          colorInput.style.setProperty('--bs-placeholder-color', 'rgba(255, 255, 255, 0.6)', 'important');
        } else {
          // Light Background -> Dark text & Dark translucent border
          colorInput.style.setProperty('color', '#000000', 'important');
          colorInput.style.setProperty('border', '1px solid rgba(0, 0, 0, 0.4)', 'important');
          colorInput.style.setProperty('--bs-placeholder-color', 'rgba(0, 0, 0, 0.6)', 'important');
        }
      } else {
        // Agar invalid color ho ya empty ho, toh default styling wapas laao
        colorInput.style.removeProperty('background-color');
        colorInput.style.removeProperty('color');
        colorInput.style.removeProperty('border');
        colorInput.style.removeProperty('--bs-placeholder-color');
      }
    });
  }

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

  if (lineHeightRange && lineHeightBadge) {
    lineHeightRange.addEventListener("input", (e) => {
      const val = e.target.value;
      lineHeightBadge.textContent = val;
      document.querySelectorAll('.CodeMirror').forEach(el => el.style.setProperty('line-height', val, 'important'));
      localStorage.setItem("sandbox_line_height", val);
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

  document.querySelectorAll('.fontweight-option').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.fontweight-option').forEach(opt => opt.classList.remove('active'));
      item.classList.add('active');

      const fontWeight = item.getAttribute('data-weight');
      const fontWeightLabel = item.getAttribute('data-label');
      if (currentFontWeightLabel) currentFontWeightLabel.textContent = fontWeightLabel;

      document.querySelectorAll('.CodeMirror').forEach(el => {
        el.style.setProperty('font-weight', fontWeight, 'important');
      });

      localStorage.setItem("sandbox_font_weight", fontWeight);
      localStorage.setItem("sandbox_font_weight_label", fontWeightLabel);
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
        version: "1.1.0",
        timestamp: new Date().toISOString(),
        html: window.htmlEditor.getValue(),
        css: window.cssEditor.getValue(),
        js: window.jsEditor.getValue(),
        settings: {
          fontSize: localStorage.getItem("sandbox_font_size"),
          fontWeight: localStorage.getItem("sandbox_font_weight"),
          lineHeight: localStorage.getItem("sandbox_line_height"),
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
            if (data.settings.fontWeight) localStorage.setItem("sandbox_font_weight", data.settings.fontWeight);
            if (data.settings.lineHeight) localStorage.setItem("sandbox_line_height", data.settings.lineHeight);
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

  // --- Console Loggers ---
  window.appendLog = function(type, message) {
    const consoleDiv = document.getElementById("js-console");
    if (!consoleDiv) return;
    const placeholder = consoleDiv.querySelector('.text-secondary');
    if (placeholder) placeholder.remove();

    const logItem = document.createElement("div");
    logItem.className = "console-log-item font-monospace border-bottom border-secondary border-opacity-25 pb-2";
    
    let badgeClass = "bg-secondary text-light";
    let prefix = "LOG";
    if (type === 'error') { badgeClass = "bg-danger text-white"; prefix = "ERROR"; }
    else if (type === 'warn') { badgeClass = "bg-warning text-dark"; prefix = "WARN"; }
    else if (type === 'info') { badgeClass = "bg-info text-dark"; prefix = "INFO"; }

    const now = new Date();
    const timeStr = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join(':');

    let targetLine = null;
    const lineMatch = message.match(/\(Line:\s*(\d+)\)/i);
    if (lineMatch) {
      targetLine = parseInt(lineMatch[1], 10) - 1;
    }

    logItem.innerHTML = `
      <div class="console-content-line">
        <span class="badge ${badgeClass} px-1 py-0 flex-shrink-0" style="font-size: 0.7rem; margin-top: 2px;">${prefix}</span>
        <span class="text-light flex-grow-1" style="white-space: pre-wrap; word-break: break-all; font-size: 0.8rem;">${escapeHtml(message)}</span>
        ${targetLine !== null ? '<span class="text-info flex-shrink-0 ms-1" style="font-size: 0.7rem;" title="Jump to Line">📍</span>' : ''}
      </div>
      <div class="console-timestamp">[${timeStr}]</div>
    `;

    if (targetLine !== null) {
      logItem.addEventListener("click", () => {
        const jsTabBtn = document.getElementById("js-tab");
        if (jsTabBtn) {
          const bsTab = new bootstrap.Tab(jsTabBtn);
          bsTab.show();
        }

        setTimeout(() => {
          if (window.jsEditor) {
            window.jsEditor.setCursor({ line: targetLine, ch: 0 });
            window.jsEditor.scrollIntoView({ line: targetLine, ch: 0 }, 100);
            window.jsEditor.focus();

            const lineHandle = window.jsEditor.addLineClass(targetLine, "background", "cm-error-line-highlight");
            setTimeout(() => {
              window.jsEditor.removeLineClass(lineHandle, "background", "cm-error-line-highlight");
            }, 2000);
          }
        }, 150);
      });
    }

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
            console.error(err.message + ' (Line: 1)');
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
