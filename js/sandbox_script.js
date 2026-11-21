document.addEventListener("DOMContentLoaded", () => {
  if (typeof CodeMirror === "undefined") { alert("CodeMirror failed to load. Check the CodeMirror-5 files."); return; }

  // Share-link import runs AFTER the CodeMirror guard: if the editor library
  // failed to load, importing must not overwrite the user's saved code.
  try {
    if (window.location.hash && window.location.hash.startsWith("#code=")) {
      const hashVal = window.location.hash.substring(6);
      if (hashVal) {
        const b64 = hashVal.replace(/-/g, "+").replace(/_/g, "/");
        const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
        const sharedData = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
        if (sharedData && typeof sharedData.html === "string") localStorage.setItem("sandbox_html", sharedData.html);
        if (sharedData && typeof sharedData.css === "string") localStorage.setItem("sandbox_css", sharedData.css);
        if (sharedData && typeof sharedData.js === "string") localStorage.setItem("sandbox_js", sharedData.js);
        if (sharedData && typeof sharedData.framework === "string") localStorage.setItem("sandbox_framework", sharedData.framework);
        if (sharedData && typeof sharedData.frameworkLabel === "string") localStorage.setItem("sandbox_framework_label", sharedData.frameworkLabel);
        // Shared code is authoritative: drop any stale snippets-edit backup.
        try { localStorage.removeItem("sandbox_js_backup_before_snippets"); } catch (e) {}
        history.replaceState(null, null, window.location.pathname + window.location.search);
      }
    }
  } catch (e) {
    console.error("Error loading shared code from URL hash:", e);
  }

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
  const savedPreviewOnTop = localStorage.getItem("sandbox_preview_on_top") === "true";
  const savedEruda = localStorage.getItem("sandbox_eruda") === "true";

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
      "btn": "<button class=\"btn btn-$1\">$2</button>",
      "bt5": "<div class=\"container py-4\">\n  <div class=\"p-5 mb-4 bg-light rounded-3 " +
        "shadow-sm\">\n    <div class=\"container-fluid py-3\">\n      <h1 class=\"display-5 " +
        "fw-bold text-primary\">Bootstrap 5 Ready</h1>\n      <p class=\"col-md-8 " +
        "fs-4\">Start building your responsive UI instantly.</p>\n      <button " +
        "class=\"btn btn-dark btn-lg\" type=\"button\">Explore</button>\n    </div>\n " +
        " </div>\n</div>",
      "tw": "<div class=\"min-h-screen bg-gray-50 flex items-center justify-center " +
        "p-6\">\n  <div class=\"max-w-md w-full bg-white rounded-xl shadow-md p-8 " +
        "space-y-4\">\n    <h1 class=\"text-2xl font-bold text-indigo-600\">Tailwind " +
        "Ready</h1>\n    <p class=\"text-gray-600 text-sm\">Your utility-first " +
        "playground is set up and ready to go.</p>\n    <button class=\"w-full " +
        "py-2 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 " +
        "transition\">Get Started</button>\n  </div>\n</div>",
      "lorem": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Tempora, saepe " +
        "molestias! Fugiat fuga, fugit, distinctio culpa ad dignissimos commodi " +
        "molestiae cumque odio magni ipsum placeat dolorum, eius totam quae dolore!",
      "lorem10": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, illum.",
      "lorem20": "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ducimus fugiat " +
        "quam natus a vitae neque, corporis at qui illo quo?",
      "lorem30": "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dolore facilis, " +
        "perspiciatis corrupti repellat reprehenderit possimus delectus vero minus " +
        "quibusdam magnam! Ratione veritatis porro voluptates ducimus sequi eligendi " +
        "doloremque error dicta?",
      "lorem40": "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Dolore, optio " +
        "aliquid voluptates sit voluptas provident dolorem minus eveniet expedita " +
        "laborum repudiandae, ratione nisi reiciendis totam sequi nemo possimus, " +
        "maiores tempora quae illum saepe? Explicabo laudantium ullam quam nulla " +
        "quod iste?",
      "lorem50": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Dignissimos modi " +
        "nisi corrupti? Commodi ipsa accusamus reprehenderit fugiat voluptatibus, " +
        "non delectus sed blanditiis inventore rem. Quae maiores veniam quos repellat " +
        "voluptatibus, debitis quasi! Et facere pariatur eveniet adipisci dignissimos " +
        "exercitationem rem vitae praesentium tempora iste sequi sint, quas modi " +
        "consectetur delectus.",
      "lorem100": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae a porro " +
        "ducimus nihil illum quas facere maxime, corrupti quos quasi doloribus " +
        "molestias architecto nobis, inventore mollitia labore aliquam molestiae " +
        "commodi. Molestias nulla reprehenderit eius recusandae consectetur debitis " +
        "rerum possimus? Placeat dolorem tempore excepturi ipsum quisquam provident, " +
        "ea sint animi eum at? Alias fugit sunt, maxime, iusto possimus iste ratione " +
        "minus quasi nostrum accusamus officiis, est veritatis odit deserunt doloremque. " +
        "Cumque nobis, culpa ut illum deleniti molestias consectetur! Voluptatem " +
        "rem deleniti pariatur quae fugit adipisci voluptatibus nobis quos corporis " +
        "doloribus, accusamus dignissimos est rerum ullam harum dicta ea autem " +
        "sed laboriosam!"
    },
    "css": {
      "flex": "display: flex;\nalign-items: center;\njustify-content: center;",
      "pos": "position: absolute;\ntop: 0;\nleft: 0;",
      "!": "/* Minimal CSS Reset & Modern Base */\n*,\n*::before,\n*::after {\n  box-sizing: " +
        "border-box;\n}\n\n:root {\n  /* Comprehensive Modern Typography Stacks " +
        "*/\n  --font-sans-serif: system-ui, -apple-system, BlinkMacSystemFont, " +
        "'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Noto Sans', 'Helvetica " +
        "Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe " +
        "UI Symbol', 'Noto Color Emoji';\n  --font-mono: ui-monospace, SFMono-Regular, " +
        "Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace, " +
        "'Segoe UI Mono', 'Roboto Mono', 'Ubuntu Mono', 'Droid Sans Mono';\n  \n " +
        " /* Theme Base Variables */\n  --bg-surface: #fafbfc;\n  --text-primary: " +
        "#222222;\n}\n\nhtml {\n  font-smooth: always;\n  -webkit-font-smoothing: " +
        "antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-tap-highlight-color: " +
        "rgba(0, 0, 0, 0);\n  -webkit-text-size-adjust: 100%;\n}\n\nbody {\n  margin: " +
        "0;\n  font-family: var(--font-sans-serif);\n  background: var(--bg-surface);" +
        "\n  color: var(--text-primary);\n  min-height: 100vh;\n  min-height: 100dvh;" +
        "\n  font-size: 1rem;\n  font-weight: 400;\n  line-height: 1.5;\n  text-align: " +
        "start;\n}"
    }
  };

  // Snippet values must be strings: a number / object / null value from a
  // hand-edited snippets JSON used to crash snippet expansion
  // (snippetTpl.split is not a function).
  function normalizeSnippetValue(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") { try { return JSON.stringify(v, null, 2); } catch (e) { return String(v); } }
    return String(v);
  }

  function mergeSnippets(parsed) {
    const p = parsed && typeof parsed === "object" ? parsed : {};
    const norm = (obj) => {
      const out = {};
      for (const k of Object.keys(obj || {})) out[k] = normalizeSnippetValue(obj[k]);
      return out;
    };
    return { js: { ...defaultSnippets.js, ...norm(p.js) },
      html: { ...defaultSnippets.html, ...norm(p.html) },
      css: { ...defaultSnippets.css, ...norm(p.css) } };
  }

  let customSnippets = JSON.parse(JSON.stringify(defaultSnippets));
  try {
    const savedSnippets = localStorage.getItem("sandbox_custom_snippets");
    if (savedSnippets) {
      const parsed = JSON.parse(savedSnippets);
      customSnippets = mergeSnippets(parsed);
      localStorage.setItem("sandbox_custom_snippets", JSON.stringify(customSnippets, null, 2));
    } else {
      localStorage.setItem("sandbox_custom_snippets", JSON.stringify(defaultSnippets, null, 2));
    }
  } catch (err) {
    console.error("Error loading custom snippets:", err);
  }

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

  // Eruda toggle lives in HTML.
  const erudaToggle = document.getElementById("erudaToggle");
  if (erudaToggle) erudaToggle.checked = savedEruda;

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

  // Safe tab helper: falls back if Bootstrap CDN fails.
  function showEditorTab(tabId, paneId) {
    const btn = document.getElementById(tabId);
    if (!btn) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
      try { new bootstrap.Tab(btn).show(); return; } catch (e) { /* manual fallback below */ }
    }
    document.querySelectorAll('#sandboxTabs .nav-link').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#sandboxTabContent .tab-pane').forEach((p) => p.classList.remove('show', 'active'));
    const pane = document.getElementById(paneId);
    if (pane) pane.classList.add('show', 'active');
    // Bootstrap path refreshes via shown.bs.tab; fallback must refresh too (else hidden editor renders blank).
    try { refreshEditors(); } catch (e) {}
    setTimeout(() => { try { scheduleAllLint(); } catch (e) {} }, 0);
  }

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

  if (!document.getElementById("sandbox-breadcrumb-style")) {
    const st = document.createElement("style");
    st.id = "sandbox-breadcrumb-style";
    st.textContent = ".sandbox-breadcrumb{display:flex;align-items:center;gap:4px;padding:5px " +
      "10px;background:#1e1e2e;border-bottom:1px solid #333;overflow-x:auto;white-space:nowrap;" +
      "font-size:12px;font-family:ui-monospace,Menlo,Consolas,monospace;scrollbar-width:none}" +
      ".sandbox-breadcrumb::-webkit-scrollbar{display:none}.sandbox-crumb-file{color:#9ad1ff;" +
      "font-weight:700;flex-shrink:0}.sandbox-crumb{color:#d0d0d0;cursor:pointer;" +
      "padding:2px 5px;border-radius:4px;flex-shrink:0}.sandbox-crumb:hover{background:#33334a;" +
      "color:#fff}.sandbox-crumb.active{color:#ffd479;font-weight:600;background:#2a2a3a}" +
      ".sandbox-crumb-sep{color:#666;flex-shrink:0}.sandbox-crumb-empty{color:#888}" +
      ".sandbox-fold-widget{color:#9ad1ff;background:#2a2a3a;border:1px solid " +
      "#3a3a5a;border-radius:4px;padding:0 6px;margin:0 2px;font-size:11px;cursor:pointer}" +
      ".sandbox-fold-widget:hover{background:#3a3a5a}.sandbox-fold-marker{color:#888;" +
      "cursor:pointer;font-size:10px;line-height:1;display:inline-block;width:14px;" +
      "text-align:center}.sandbox-fold-marker:hover{color:#fff}.sandbox-fold-marker.folded{color:#ffd479}" +
      ".CodeMirror-gutter.sandbox-fold-gutter{width:16px}.sandbox-breadcrumb-toggle{margin-left:auto;" +
      "flex-shrink:0;background:transparent;border:1px solid #444;color:#aaa;" +
      "border-radius:4px;font-size:11px;padding:1px 6px;cursor:pointer}.sandbox-breadcrumb-toggle:hover{color:#fff;" +
      "border-color:#777}";
    document.head.appendChild(st);
  }
  let breadcrumbEl = null;
  function ensureBreadcrumbEl() {
    if (breadcrumbEl) return breadcrumbEl;
    const tabs = document.getElementById("sandboxTabs");
    const bar = document.createElement("div");
    bar.className = "sandbox-breadcrumb";
    bar.id = "sandbox-breadcrumb";
    bar.innerHTML = '<span class="sandbox-crumb-file">index.html</span><span class="sandbox-crumb-sep">›</span><span ' +
      'class="sandbox-crumb-empty">No selection</span>';
    if (tabs && tabs.parentNode) {
      tabs.parentNode.insertBefore(bar, tabs.nextSibling);
    } else {
      const es = document.getElementById("editor-section");
      if (es) es.insertBefore(bar, es.firstChild);
      else document.body.appendChild(bar);
    }
    breadcrumbEl = bar;
    return bar;
  }
  function getHtmlCrumbs(cm, cursorLine, cursorCh) {
    const voidTags = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
    const stack = [];
    for (let ln = 0; ln <= cursorLine; ln++) {
      let line = cm.getLine(ln) || "";
      if (ln === cursorLine) line = line.slice(0, cursorCh);
      line = line.replace(/<!--.*?-->/g, "");
      const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*?)?(\/?)>/g;
      let m;
      while ((m = tagRe.exec(line)) !== null) {
        const full = m[0];
        const tag = m[1].toLowerCase();
        const isClosing = full.startsWith("</");
        const isSelf = full.endsWith("/>") || voidTags.has(tag);
        if (isClosing) {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].tag === tag) { stack.length = i; break; }
          }
        } else if (!isSelf) {
          let label = tag;
          const attrs = m[2] || "";
          const idM = attrs.match(/\bid\s*=\s*["']([^"']+)["']/);
          const classM = attrs.match(/\bclass\s*=\s*["']([^"']+)["']/);
          if (idM) label += "#" + idM[1].split(/\s+/)[0];
          else if (classM) label += "." + classM[1].split(/\s+/)[0];
          stack.push({ tag, label, line: ln });
        }
      }
    }
    return stack;
  }
  function getCssCrumbs(cm, cursorLine, cursorCh) {
    const stack = [];
    let depth = 0;
    for (let ln = 0; ln <= cursorLine; ln++) {
      let raw = cm.getLine(ln) || "";
      let line = ln === cursorLine ? raw.slice(0, cursorCh) : raw;
      let stripped = line.replace(/\/\*.*?\*\//g, "");
      let open = (stripped.match(/\{/g) || []).length;
      let close = (stripped.match(/\}/g) || []).length;
      if (open > 0) {
        let before = line.split("{")[0];
        let sel = before.split("}").pop().trim();
        // A property line has ';', a selector does not.
        if (sel && !sel.includes(";")) {
          // Skip "color: red" style lines. Selectors may have ':' (a:hover), but never ';'.
          stack.push({ label: sel, line: ln, depth });
        }
      }
      depth += open - close;
      if (depth < 0) depth = 0;
      while (stack.length > 0 && depth <= stack[stack.length - 1].depth) stack.pop();
    }
    return stack;
  }
  function getJsCrumbs(cm, cursorLine, cursorCh) {
    const stack = [];
    let depth = 0;
    for (let ln = 0; ln <= cursorLine; ln++) {
      let raw = cm.getLine(ln) || "";
      let line = ln === cursorLine ? raw.slice(0, cursorCh) : raw;
      let label = null;
      let m;
      if ((m = line.match(/^\s*(?:export\s+)?(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/))) label = "class " + m[1];
      else if ((m = line.match(/^\s*(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/))) label = m[1] + "()";
      else if ((m = line.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\(.*?\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/))) label = m[1] + "()";
      else if ((m = line.match(/^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(.*?\)\s*=>\s*\{/))) label = m[1] + "()";
      else if ((m = line.match(/^\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/))) {
        const kw = m[1];
        if (!["if","for","while","switch","catch","else","return","forEach"].includes(kw)) label = kw + "()";
      }
      let stripped = line.replace(/\/\*.*?\*\//g, "").replace(/"([^"\\]|\\.)*"/g, '""').replace(/'([^'\\]|\\.)*'/g, "''").replace(/`([^`\\]|\\.)*`/g, "``").replace(/\/\/.*$/, "");
      let open = (stripped.match(/\{/g) || []).length;
      let close = (stripped.match(/\}/g) || []).length;
      if (label && open > 0) stack.push({ label, line: ln, depth });
      depth += open - close;
      if (depth < 0) depth = 0;
      while (stack.length > 0 && depth <= stack[stack.length - 1].depth) stack.pop();
    }
    return stack;
  }
  function updateBreadcrumb() {
    try {
      const bar = ensureBreadcrumbEl();
      const activeTab = document.querySelector('#sandboxTabs .nav-link.active');
      if (!activeTab) { bar.style.display = "none"; return; }
      // Hide breadcrumb on Log tab.
      const tabId = (activeTab.id || "").toLowerCase();
      const tabText = (activeTab.textContent || "").toLowerCase();
      const isEditorTab = tabId === "html-tab" || tabId === "css-tab" || tabId === "js-tab";
      const isLogTab = tabId.includes("log") || tabId.includes("console") || tabText.includes("log") || tabText.includes("console");
      if (!isEditorTab || isLogTab) { bar.style.display = "none"; return; }
      // Also hide it when a separate log pane is open.
      const logPane = document.querySelector('#log-pane.show.active, #console-pane.show.active, #logs-pane.show.active, ' +
        '#js-console-pane.show.active, #output-pane.show.active');
      if (logPane) { bar.style.display = "none"; return; }
      bar.style.display = "flex";
      let editor = null, mode = null, fileName = "index.html";
      if (activeTab.id === "html-tab") { editor = window.htmlEditor; mode = "htmlmixed"; fileName = "index.html"; }
      else if (activeTab.id === "css-tab") { editor = window.cssEditor; mode = "css"; fileName = "style.css"; }
      else if (activeTab.id === "js-tab") { editor = window.jsEditor; mode = "javascript"; fileName = "script.js"; }
      if (!editor) { bar.style.display = "none"; return; }
      const cur = editor.getCursor();
      let crumbs = [];
      if (mode === "htmlmixed") crumbs = getHtmlCrumbs(editor, cur.line, cur.ch);
      else if (mode === "css") crumbs = getCssCrumbs(editor, cur.line, cur.ch);
      else crumbs = getJsCrumbs(editor, cur.line, cur.ch);
      let html = '<span class="sandbox-crumb-file">' + fileName + '</span>';
      if (crumbs.length === 0) {
        html += '<span class="sandbox-crumb-sep">›</span><span class="sandbox-crumb-empty">Line ' + (cur.line + 1) + '</span>';
      } else {
        crumbs.forEach((c, idx) => {
          html += '<span class="sandbox-crumb-sep">›</span>';
          const isLast = idx === crumbs.length - 1;
          html += '<span class="sandbox-crumb' + (isLast ? ' active' : '') + '" data-line="' + c.line + '">' + c.label.replace(/</g, "&lt;") + '</span>';
        });
      }
      bar.innerHTML = html;
      bar.querySelectorAll(".sandbox-crumb[data-line]").forEach((el) => {
        el.addEventListener("click", () => {
          const ln = parseInt(el.getAttribute("data-line"), 10);
          if (!isNaN(ln)) {
            editor.setCursor({ line: ln, ch: 0 });
            editor.focus();
            editor.scrollIntoView({ line: ln, ch: 0 }, 100);
          }
        });
      });
    } catch (e) {}
  }
  function setupBreadcrumbForEditor(cm) {
    if (!cm) return;
    cm.on("cursorActivity", () => updateBreadcrumb());
    cm.on("change", () => updateBreadcrumb());
  }
  // Custom folding, no CodeMirror addon needed.
  const foldMarksByEditor = new WeakMap();
  function getFoldMarks(cm) {
    if (!foldMarksByEditor.has(cm)) foldMarksByEditor.set(cm, []);
    return foldMarksByEditor.get(cm);
  }
  function findBraceFoldRange(cm, line) {
    // Strip strings and comments from one line. Returns the
    // stripped text, a map from stripped index -> raw index, and
    // the block-comment state going out of this line.
    function stripLine(l, inBC) {
      let out = "";
      const map = [];
      let inS = false, inD = false, inT = false;
      for (let i = 0; i < l.length; i++) {
        const c = l[i], n = l[i + 1];
        if (inBC) {
          if (c === "*" && n === "/") { inBC = false; i++; }
          continue;
        }
        if (inS) { if (c === "\\") i++; else if (c === "'") inS = false; continue; }
        if (inD) { if (c === "\\") i++; else if (c === '"') inD = false; continue; }
        if (inT) { if (c === "\\") i++; else if (c === "`") inT = false; continue; }
        if (c === "/" && n === "/") break;
        if (c === "/" && n === "*") { inBC = true; i++; continue; }
        if (c === "'") { inS = true; continue; }
        if (c === '"') { inD = true; continue; }
        if (c === "`") { inT = true; continue; }
        out += c; map.push(i);
      }
      return { stripped: out, map, inBlockComment: inBC };
    }
    // K2: first "{" must be outside strings/comments. The old code
    // used text.indexOf("{") on the raw line, so "/* { */ function f() {"
    // folded from the comment's "{" instead of the function's "{".
    // Stripped index -> brace counting, mapped raw index -> fold "from".
    const first = stripLine(cm.getLine(line) || "", false);
    const sBrace = first.stripped.indexOf("{");
    if (sBrace === -1) return null;
    const braceIdx = first.map[sBrace];
    let depth = 0;
    let inBlockComment = first.inBlockComment;
    for (let i = sBrace; i < first.stripped.length; i++) {
      if (first.stripped[i] === "{") depth++;
      else if (first.stripped[i] === "}") {
        depth--;
        if (depth === 0) return null;
      }
    }
    for (let ln = line + 1; ln < cm.lineCount(); ln++) {
      const r = stripLine(cm.getLine(ln) || "", inBlockComment);
      inBlockComment = r.inBlockComment;
      for (let i = 0; i < r.stripped.length; i++) {
        if (r.stripped[i] === "{") depth++;
        else if (r.stripped[i] === "}") {
          depth--;
          if (depth === 0) {
            return { from: { line, ch: braceIdx + 1 },
              to: { line: ln, ch: r.map[i] },
              startLine: line,
              endLine: ln };
          }
        }
      }
    }
    return null;
  }
  function findHtmlFoldRange(cm, line) {
    const text = cm.getLine(line) || "";
    const m = text.match(/<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*?)?>/);
    if (!m) return null;
    const tag = m[1].toLowerCase();
    const voidTags = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
    if (voidTags.has(tag)) return null;
    if (m[0].endsWith("/>")) return null;
    let depth = 0;
    for (let ln = line; ln < cm.lineCount(); ln++) {
      let l = cm.getLine(ln) || "";
      l = l.replace(/<!--.*?-->/g, "");
      const re = new RegExp("</?" + tag + "(\\s[^>]*?)?>", "g");
      let mm;
      while ((mm = re.exec(l)) !== null) {
        if (ln === line && mm.index < m.index) continue;
        const isClosing = mm[0].startsWith("</");
        const isSelf = mm[0].endsWith("/>") || voidTags.has(tag);
        if (isSelf) continue;
        if (isClosing) {
          depth--;
          if (depth === 0) {
            if (ln === line) return null;
            return { from: { line, ch: m.index + m[0].length },
              to: { line: ln, ch: mm.index },
              startLine: line,
              endLine: ln };
          }
        } else {
          depth++;
        }
      }
    }
    return null;
  }
  function findCommentFoldRange(cm, line) {
    const text = cm.getLine(line) || "";
    let startIdx = text.indexOf("/*");
    let isHtmlComment = false;
    if (startIdx === -1 && text.includes("<!--")) { startIdx = text.indexOf("<!--"); isHtmlComment = true; }
    if (startIdx === -1) return null;
    if (!isHtmlComment && text.indexOf("*/", startIdx + 2) !== -1) return null;
    if (isHtmlComment && text.indexOf("-->", startIdx + 4) !== -1) return null;
    for (let ln = line + 1; ln < cm.lineCount(); ln++) {
      let l = cm.getLine(ln) || "";
      if (!isHtmlComment) {
        let endIdx = l.indexOf("*/");
        if (endIdx !== -1) return { from: { line, ch: startIdx + 2 },
          to: { line: ln, ch: endIdx },
          startLine: line,
          endLine: ln };
      } else {
        let endIdx = l.indexOf("-->");
        if (endIdx !== -1) return { from: { line, ch: startIdx + 4 },
          to: { line: ln, ch: endIdx },
          startLine: line,
          endLine: ln };
      }
    }
    return null;
  }
  function findFoldRange(cm, line, mode) {
    if (mode === "htmlmixed" || mode === "html") {
      const h = findHtmlFoldRange(cm, line);
      if (h) return h;
      const b = findBraceFoldRange(cm, line);
      if (b) return b;
      return findCommentFoldRange(cm, line);
    }
    const b2 = findBraceFoldRange(cm, line);
    if (b2) return b2;
    return findCommentFoldRange(cm, line);
  }
  function isFoldedAtLine(cm, line) {
    const marks = getFoldMarks(cm);
    return marks.some((mm) => mm._foldStartLine === line);
  }
  function foldLine(cm, line, mode) {
    if (isFoldedAtLine(cm, line)) return false;
    const range = findFoldRange(cm, line, mode);
    if (!range) return false;
    const widget = document.createElement("span");
    widget.className = "sandbox-fold-widget";
    const hidden = range.endLine - range.startLine;
    widget.textContent = "… " + hidden + " lines …";
    widget.title = "Click to unfold";
    widget.addEventListener("click", (e) => { e.stopPropagation(); unfoldLine(cm, line); refreshFoldGutter(cm, mode); });
    const mark = cm.markText(range.from,
      range.to,
      { collapsed: true,
        inclusiveLeft: false,
        inclusiveRight: false,
        replacedWith: widget,
        clearWhenEmpty: false });
    mark._foldStartLine = line;
    mark._foldRange = range;
    try {
      mark.on("clear", () => {
        const arr = getFoldMarks(cm);
        const i = arr.indexOf(mark);
        if (i !== -1) arr.splice(i, 1);
        setTimeout(() => refreshFoldGutter(cm, mode), 50);
      });
    } catch (e) {}
    getFoldMarks(cm).push(mark);
    return true;
  }
  function unfoldLine(cm, line) {
    const marks = getFoldMarks(cm);
    for (let i = marks.length - 1; i >= 0; i--) {
      if (marks[i]._foldStartLine === line) {
        try { marks[i].clear(); } catch (e) {}
        marks.splice(i, 1);
        return true;
      }
    }
    return false;
  }
  function toggleFoldAtLine(cm, line, mode) {
    if (isFoldedAtLine(cm, line)) unfoldLine(cm, line);
    else foldLine(cm, line, mode);
    refreshFoldGutter(cm, mode);
  }
  function refreshFoldGutter(cm, mode) {
    if (!cm || !cm.setGutterMarker) return;
    const total = cm.lineCount();
    for (let ln = 0; ln < total; ln++) {
      let marker = null;
      if (isFoldedAtLine(cm, ln)) {
        marker = document.createElement("span");
        marker.className = "sandbox-fold-marker folded";
        marker.textContent = "▶";
        marker.title = "Unfold";
      } else if (findFoldRange(cm, ln, mode)) {
        marker = document.createElement("span");
        marker.className = "sandbox-fold-marker";
        marker.textContent = "▼";
        marker.title = "Fold";
      }
      try { cm.setGutterMarker(ln, "sandbox-fold-gutter", marker); } catch (e) {}
    }
  }
  function foldAtCursor(cm, mode) {
    const cur = cm.getCursor();
    toggleFoldAtLine(cm, cur.line, mode);
  }
  function unfoldAtCursor(cm, mode) {
    const cur = cm.getCursor();
    if (isFoldedAtLine(cm, cur.line)) { unfoldLine(cm, cur.line); refreshFoldGutter(cm, mode); return; }
    const marks = [...getFoldMarks(cm)];
    for (const mm of marks) {
      const r = mm._foldRange;
      if (r && cur.line >= r.startLine && cur.line <= r.endLine) { try { mm.clear(); } catch (e) {} }
    }
    refreshFoldGutter(cm, mode);
  }
  function foldAll(cm, mode) {
    const total = cm.lineCount();
    const foldedRanges = [];
    for (let ln = 0; ln < total; ln++) {
      let inside = false;
      for (const r of foldedRanges) { if (ln > r.startLine && ln <= r.endLine) { inside = true; break; } }
      if (inside) continue;
      const range = findFoldRange(cm, ln, mode);
      if (range) { if (foldLine(cm, ln, mode)) foldedRanges.push(range); }
    }
    refreshFoldGutter(cm, mode);
  }
  function unfoldAll(cm, mode) {
    const marks = [...getFoldMarks(cm)];
    for (const mm of marks) { try { mm.clear(); } catch (e) {} }
    getFoldMarks(cm).length = 0;
    refreshFoldGutter(cm, mode);
  }
  function setupFoldingForEditor(cm, mode) {
    if (!cm) return;
    try {
      const cur = cm.getOption("gutters") || ["CodeMirror-linenumbers"];
      if (!cur.includes("sandbox-fold-gutter")) cm.setOption("gutters", [...cur, "sandbox-fold-gutter"]);
    } catch (e) {}
    cm.on("gutterClick", (cm2, line, gutter) => {
      if (gutter === "sandbox-fold-gutter") toggleFoldAtLine(cm2, line, mode);
    });
    const wrapper = cm.getWrapperElement && cm.getWrapperElement();
    if (wrapper) {
      wrapper.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "[") { e.preventDefault(); foldAtCursor(cm, mode); }
        else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "]") { e.preventDefault(); unfoldAtCursor(cm, mode); }
        else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "0") { e.preventDefault(); foldAll(cm, mode); }
        else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "9") { e.preventDefault(); unfoldAll(cm, mode); }
      }, true);
    }
    let t = null;
    cm.on("change", () => { clearTimeout(t); t = setTimeout(() => refreshFoldGutter(cm, mode), 300); });
    setTimeout(() => refreshFoldGutter(cm, mode), 250);
  }
  setupBreadcrumbForEditor(window.htmlEditor);
  setupBreadcrumbForEditor(window.cssEditor);
  setupBreadcrumbForEditor(window.jsEditor);
  setupFoldingForEditor(window.htmlEditor, "htmlmixed");
  setupFoldingForEditor(window.cssEditor, "css");
  setupFoldingForEditor(window.jsEditor, "javascript");
  document.querySelectorAll('.nav-link').forEach((tab) => {
    tab.addEventListener("click", () => setTimeout(() => updateBreadcrumb(), 50));
  });
  // Also listen to Bootstrap tab events so Log tab hides breadcrumb immediately.
  document.addEventListener("shown.bs.tab", () => setTimeout(() => updateBreadcrumb(), 30));
  document.addEventListener("click", (e) => {
    const t = e.target && e.target.closest ? e.target.closest('.nav-link') : null;
    if (t) setTimeout(() => updateBreadcrumb(), 60);
  });
  setTimeout(() => updateBreadcrumb(), 300);

  function toggleCustomComment() {
    const activeTab = document.querySelector('#sandboxTabs .nav-link.active');
    if (!activeTab) return;

    let editor = null;
    let mode = 'js';

    if (activeTab.id === 'html-tab') {
      editor = window.htmlEditor;
      mode = 'html';
    } else if (activeTab.id === 'css-tab') {
      editor = window.cssEditor;
      mode = 'css';
    } else if (activeTab.id === 'js-tab') {
      editor = window.jsEditor;
      mode = 'js';
    }

    if (!editor) return;

    const selection = editor.getSelection();

    if (selection) {
      // Trim for detection only: a selection ending with a trailing
      // newline used to miss the closing marker and get wrapped again
      // (nested comments).
      const trimmedSel = selection.trim();
      if (mode === 'js' || mode === 'css') {
        if (trimmedSel.startsWith('/*') && trimmedSel.endsWith('*/')) {
          const unwrapped = trimmedSel.slice(2, -2).trim();
          editor.replaceSelection(unwrapped);
        } else {
          editor.replaceSelection(`/* ${selection} */`);
        }
      } else if (mode === 'html') {
        if (trimmedSel.startsWith('<!--') && trimmedSel.endsWith('-->')) {
          const unwrapped = trimmedSel.slice(4, -3).trim();
          editor.replaceSelection(unwrapped);
        } else {
          editor.replaceSelection(`<!-- ${selection} -->`);
        }
      }
      return;
    }

    const cursor = editor.getCursor();
    const lineNum = cursor.line;
    const lineText = editor.getLine(lineNum);
    let newText = lineText;

    const indentMatch = lineText.match(/^([ \t]*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    const trimmed = lineText.trim();

    if (mode === 'js') {
      // A /* ... */ line must unwrap too (CSS already did this); without
      // it the line ping-ponged between `// /* ... */` and `/* ... */`.
      if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
        newText = lineText.replace(/^\s*\/\*\s?/, '').replace(/\s*\*\/$/, '');
      } else if (trimmed.startsWith('//')) {
        newText = lineText.replace(/(\s*)\/\/\s?/, '$1');
      } else {
        const content = lineText.substring(indent.length);
        newText = indent + '// ' + content;
      }
    } else if (mode === 'css') {
      if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
        newText = lineText.replace(/^\s*\/\*\s?/, '').replace(/\s*\*\/$/, '');
      } else {
        const content = lineText.substring(indent.length);
        newText = indent + '/* ' + content + ' */';
      }
    } else if (mode === 'html') {
      if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
        newText = lineText.replace(/^\s*<!--\s?/, '').replace(/\s*-->$/, '');
      } else {
        const content = lineText.substring(indent.length);
        newText = indent + '<!-- ' + content + ' -->';
      }
    }

    editor.replaceRange(newText, { line: lineNum, ch: 0 }, { line: lineNum, ch: lineText.length });
    editor.setCursor({ line: lineNum, ch: editor.getLine(lineNum).length });
  }

  // Emmet: parse to AST first (no numbering), then expand. Keeps nesting, ^ climb, groups and $ numbering correct.
  const EMMET_SELF_CLOSING = ['area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'source',
    'track',
    'wbr'];
  const EMMET_KNOWN_TAGS = new Set(['a','abbr','address','area','article','aside','audio','b','base','bdi','bdo','blockquote','body','br','button','canvas','caption','cite','code','col','colgroup','data','datalist','dd','del','details','dfn','dialog','div','dl','dt','em','embed','fieldset','figcaption','figure','footer','form','h1','h2','h3','h4','h5','h6','head','header','hgroup','hr','html','i','iframe','img','input','ins','kbd','label','legend','li','link','main','map','mark','menu','meta','meter','nav','noscript','object','ol','optgroup','option','output','p','picture','pre','progress','q','rp','rt','ruby','s','samp','script','search','section','select','small','source','span','strong','style','sub','summary','sup','table','tbody','td','template','textarea','tfoot','th','thead','time','title','tr','track','u','ul','var','video','wbr']);
  const EMMET_LOREM_WORDS = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod " +
    "tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam " +
    "quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat " +
    "duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla " +
    "pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui " +
    "officia deserunt mollit anim id est laborum perspiciatis unde omnis iste " +
    "natus error voluptatem accusantium doloremque laudantium totam rem aperiam " +
    "eaque ab illo inventore veritatis quasi architecto beatae vitae dicta " +
    "explicabo nemo enim ipsam voluptatem quia voluptas aspernatur odit aut " +
    "fugit consequuntur magni dolores eos ratione sequi nesciunt neque porro " +
    "quisquam numquam eius modi tempora incidunt magnam quaerat").split(" ");
  function emmetLoremText(n) {
    n = Math.max(1, n || 30);
    let out = [];
    for (let i = 0; i < n; i++) out.push(EMMET_LOREM_WORDS[i % EMMET_LOREM_WORDS.length]);
    let txt = out.join(" ");
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }
  function emmetSubstitute(template, index, total) {
    if (template == null) return template;
    return String(template).replace(/\$+(?:@(-)?(\d+)?)?(?!\d)/g, (match, minus, startNum) => {
      let value;
      const padMatch = match.match(/^\$+/);
      const pad = padMatch ? padMatch[0].length : 1;
      const hasAt = match.includes("@");
      if (hasAt) {
        if (minus) {
          if (startNum !== undefined && startNum !== "") value = parseInt(startNum, 10) - index;
          else value = total - index;
        } else if (startNum !== undefined && startNum !== "") {
          value = parseInt(startNum, 10) + index;
        } else {
          value = index + 1;
        }
      } else {
        value = index + 1;
      }
      let s = String(value);
      if (pad > 1) s = s.padStart(pad, "0");
      return s;
    });
  }
  function emmetCloneAST(node) {
    if (!node) return node;
    const copy = Object.assign({}, node);
    if (node.classes) copy.classes = node.classes.slice();
    if (node.attrs) copy.attrs = node.attrs.slice();
    if (node.children) copy.children = node.children.map(emmetCloneAST);
    return copy;
  }
  function emmetParseElementSegment(seg) {
    seg = String(seg).trim();
    if (!seg) return null;
    let multiplier = 1;
    const multMatch = seg.match(/\*(\d+)$/);
    if (multMatch) {
      { const _n = parseInt(multMatch[1], 10); multiplier = Number.isNaN(_n) ? 1 : _n; }
      seg = seg.slice(0, -multMatch[0].length);
    }
    let textTemplate = "";
    let attrs = [];
    let attrScan = seg;
    let outSeg = "";
    let i = 0;
    while (i < attrScan.length) {
      if (attrScan[i] === "[") {
        let depth = 1;
        let inS = false, inD = false;
        let j = i + 1;
        while (j < attrScan.length && depth > 0) {
          const c = attrScan[j];
          if (inS) { if (c === "'" && attrScan[j - 1] !== "\\") inS = false; }
          else if (inD) { if (c === '"' && attrScan[j - 1] !== "\\") inD = false; }
          else if (c === "'") inS = true;
          else if (c === '"') inD = true;
          else if (c === "[") depth++;
          else if (c === "]") depth--;
          j++;
        }
        const inner = attrScan.slice(i + 1, j - 1).trim();
        if (inner) {
          // Split [...] into individual attrs, quote-aware so
          // title="hello world" stays one attr. Each attr is stored as
          // name="value" so the default-attr check (_has) sees each one
          // (a combined "src=.. alt=.." string broke _has and duped alt).
          const _attrRe = /([A-Za-z0-9\-_:.]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g;
          let _am, _matched = false;
          while ((_am = _attrRe.exec(inner)) !== null) {
            _matched = true;
            const _v = _am[2] !== undefined ? _am[2] : _am[3] !== undefined ? _am[3] : _am[4];
            if (_v === undefined) attrs.push(_am[1]);
            else attrs.push(_am[1] + '="' + String(_v).replace(/"/g, "&quot;") + '"');
          }
          if (!_matched) attrs.push(inner);
        }
        i = j;
      } else if (attrScan[i] === "{") {
        const close = attrScan.indexOf("}", i + 1);
        if (close !== -1) {
          if (textTemplate === "") textTemplate = attrScan.slice(i + 1, close);
          i = close + 1;
        } else { outSeg += attrScan[i]; i++; }
      } else {
        outSeg += attrScan[i];
        i++;
      }
    }
    seg = outSeg;
    let tagName = "div";
    let idTemplate = "";
    let classesTemplate = [];
    let rest = seg.trim();
    if (rest && !rest.startsWith(".") && !rest.startsWith("#") && !rest.startsWith("[")) {
      const tagMatch = rest.match(/^([a-zA-Z][a-zA-Z0-9\-]*)/);
      if (tagMatch) {
        tagName = tagMatch[1];
        rest = rest.slice(tagMatch[0].length);
      }
    }
    // Short type forms: input:c -> checkbox, input:t -> text, input:p -> password.
    if (rest.startsWith(":")) {
      const typeMatch = rest.match(/^:([a-zA-Z0-9\-_]+)/);
      if (typeMatch) {
        const tRaw = typeMatch[1];
        const _inputTypeMap = { c: 'checkbox',
          ch: 'checkbox',
          t: 'text',
          p: 'password',
          h: 'hidden',
          s: 'submit',
          r: 'radio',
          f: 'file',
          i: 'image',
          e: 'email',
          u: 'url',
          n: 'number',
          d: 'date',
          m: 'month',
          w: 'week',
          ti: 'time',
          dt: 'datetime-local',
          se: 'search',
          tel: 'tel',
          col: 'color',
          ra: 'range',
          b: 'button',
          re: 'reset',
          su: 'submit' };
        const _btnTypeMap = { s: 'submit', r: 'reset', b: 'button' };
        let t = tRaw;
        const _low = tagName.toLowerCase();
        if (_low === 'input' && _inputTypeMap[tRaw]) t = _inputTypeMap[tRaw];
        else if (_low === 'button' && _btnTypeMap[tRaw]) t = _btnTypeMap[tRaw];
        else if (_low === 'form' && (tRaw === 'g' || tRaw === 'get')) t = 'get';
        else if (_low === 'form' && (tRaw === 'p' || tRaw === 'post')) t = 'post';
        if (_low === "input" || _low === "button") attrs.push('type="' + t + '"');
        else if (_low === "form") attrs.push('method="' + t + '"');
        else attrs.push('type="' + t + '"');
        rest = rest.slice(typeMatch[0].length);
      }
    }
    let k = 0;
    while (k < rest.length) {
      const ch = rest[k];
      if (ch === "#") {
        k++;
        const start = k;
        while (k < rest.length && rest[k] !== "." && rest[k] !== "#" && rest[k] !== "[") k++;
        idTemplate = rest.slice(start, k);
      } else if (ch === ".") {
        k++;
        const start = k;
        while (k < rest.length && rest[k] !== "." && rest[k] !== "#" && rest[k] !== "[") k++;
        const cls = rest.slice(start, k);
        if (cls) classesTemplate.push(cls);
      } else {
        k++;
      }
    }
    // Merge class/id from [...] with #id / .class shorthand: class values
    // concatenate (cls + box), explicit id= wins over #id. Without this,
    // div.cls[class=box] rendered duplicate class="cls" class="box".
    {
      const _kept = [];
      for (const _a of attrs) {
        const _cm = /^class="([^"]*)"$/.exec(_a);
        if (_cm) { if (_cm[1]) classesTemplate.push(_cm[1]); continue; }
        const _im = /^id="([^"]*)"$/.exec(_a);
        if (_im) { idTemplate = _im[1]; continue; }
        _kept.push(_a);
      }
      attrs = _kept;
    }
    // Common defaults: a -> href, img -> src/alt, input -> type=text. Do not duplicate existing attrs.
    {
      const _low2 = tagName.toLowerCase();
      const _has = (prefix) => attrs.some((a) => a.startsWith(prefix));
      if (_low2 === 'a' && !_has('href=')) attrs.push('href=""');
      if (_low2 === 'img') { if (!_has('src=')) attrs.push('src=""'); if (!_has('alt=')) attrs.push('alt=""'); }
      if (_low2 === 'input' && !_has('type=')) attrs.push('type="text"');
    }
    const lowTag = tagName.toLowerCase();
    if (lowTag === "lorem" || /^lorem\d+$/.test(lowTag)) {
      let n = 30;
      if (lowTag !== "lorem") n = parseInt(lowTag.slice(5), 10) || 30;
      return { type: "element",
        tagName: "__lorem__",
        isLorem: true,
        loremWords: n,
        idTemplate: "",
        classesTemplate: [],
        attrsTemplate: [],
        textTemplate: "",
        multiplier: multiplier,
        children: [] };
    }
    return { type: "element",
      tagName: tagName,
      idTemplate: idTemplate,
      classesTemplate: classesTemplate,
      attrsTemplate: attrs,
      textTemplate: textTemplate,
      multiplier: multiplier,
      children: [] };
  }
  function emmetMakeConcrete(astNode, index, total) {
    if (astNode.isLorem) {
      return { tagName: "__lorem__",
        isLorem: true,
        id: "",
        classes: [],
        attrs: [],
        textContent: emmetLoremText(astNode.loremWords || 30),
        isSelfClosing: false,
        children: [] };
    }
    return {
      tagName: astNode.tagName,
      id: emmetSubstitute(astNode.idTemplate || "", index, total),
      classes: (astNode.classesTemplate || []).map((c) => emmetSubstitute(c, index, total)),
      attrs: (astNode.attrsTemplate || []).map((a) => emmetSubstitute(a, index, total)),
      textContent: emmetSubstitute(astNode.textTemplate || "", index, total),
      isSelfClosing: EMMET_SELF_CLOSING.includes(String(astNode.tagName).toLowerCase()),
      children: []
    };
  }
  function emmetFlattenLoremChild(concrete) {
    if (concrete.children.length === 1 && concrete.children[0].isLorem) {
      const lt = concrete.children[0].textContent || "";
      concrete.textContent = concrete.textContent ? concrete.textContent + " " + lt : lt;
      concrete.children = [];
    }
  }
  function emmetExpandAST(astNodes, parentIndex, parentTotal) {
    const out = [];
    const pIdx = (parentIndex == null ? 0 : parentIndex);
    const pTotal = (parentTotal == null ? 1 : parentTotal);
    for (const node of astNodes) {
      if (node.multiplier === 0) continue;
      if (node.type === "group") {
        if (node.multiplier > 1) {
          for (let idx = 0; idx < node.multiplier; idx++) {
            const expanded = emmetExpandAST(node.children, idx, node.multiplier);
            for (const e of expanded) out.push(e);
          }
        } else {
          const expanded = emmetExpandAST(node.children, pIdx, pTotal);
          for (const e of expanded) out.push(e);
        }
      } else {
        if (node.multiplier > 1) {
          for (let idx = 0; idx < node.multiplier; idx++) {
            const concrete = emmetMakeConcrete(node, idx, node.multiplier);
            concrete.children = emmetExpandAST(node.children, idx, node.multiplier);
            emmetFlattenLoremChild(concrete);
            out.push(concrete);
          }
        } else {
          const concrete = emmetMakeConcrete(node, pIdx, pTotal);
          concrete.children = emmetExpandAST(node.children, pIdx, pTotal);
          emmetFlattenLoremChild(concrete);
          out.push(concrete);
        }
      }
    }
    return out;
  }
  function emmetCollectLeaves(node) {
    if (node.type === "group") {
      let out = [];
      for (const c of node.children) out.push(...emmetCollectLeaves(c));
      return out;
    }
    if (!node.children || node.children.length === 0) return [node];
    let out = [];
    for (const c of node.children) out.push(...emmetCollectLeaves(c));
    return out;
  }
  function emmetMaxDepth(node) {
    if (node.type === "group") {
      let m = 0;
      for (const c of node.children) m = Math.max(m, emmetMaxDepth(c));
      return m;
    }
    if (!node.children || node.children.length === 0) return 0;
    let m = 0;
    for (const c of node.children) m = Math.max(m, 1 + emmetMaxDepth(c));
    return m;
  }
  // Find the parent of a node inside a forest of cloned AST nodes
  // (used to climb out of a group after `^`).
  function emmetFindParentInForest(roots, target) {
    for (const node of roots || []) {
      const kids = node.children || [];
      for (const kid of kids) {
        if (kid === target) return node;
      }
      const found = emmetFindParentInForest(kids, target);
      if (found) return found;
    }
    return null;
  }

  function emmetParseToAST(input) {
    const s = String(input).trim();
    let pos = 0;
    const len = s.length;
    function skipSpaces() { while (pos < len && /\s/.test(s[pos])) pos++; }
    function parseSequence() {
      const root = [];
      let stack = [];
      let parents = [null];
      let lastAppended = [];
      let lastWasGroup = false;
      let lastGroupInfo = null;
      while (true) {
        skipSpaces();
        if (pos >= len) break;
        if (s[pos] === ")") break;
        let unitNodes;
        if (s[pos] === "(") {
          pos++;
          const inner = parseSequence();
          if (s[pos] === ")") pos++;
          skipSpaces();
          let mult = 1;
          if (s[pos] === "*" && pos + 1 < len && /\d/.test(s[pos + 1])) {
            pos++;
            let num = "";
            while (pos < len && /\d/.test(s[pos])) { num += s[pos]; pos++; }
            { const _n = parseInt(num, 10); mult = Number.isNaN(_n) ? 1 : _n; }
          }
          unitNodes = [{ type: "group", multiplier: mult, children: inner }];
        } else {
          const start = pos;
          let square = 0, brace = 0;
          let inSingle = false, inDouble = false;
          while (pos < len) {
            const ch = s[pos];
            if (inSingle) { if (ch === "'" && s[pos - 1] !== "\\") inSingle = false; pos++; continue; }
            if (inDouble) { if (ch === '"' && s[pos - 1] !== "\\") inDouble = false; pos++; continue; }
            if (ch === "'" && (square > 0 || brace > 0)) { inSingle = true; pos++; continue; }
            if (ch === '"' && (square > 0 || brace > 0)) { inDouble = true; pos++; continue; }
            if (ch === "[") { square++; pos++; continue; }
            if (ch === "]") { if (square > 0) square--; pos++; continue; }
            if (ch === "{") { brace++; pos++; continue; }
            if (ch === "}") { if (brace > 0) brace--; pos++; continue; }
            if (square === 0 && brace === 0) {
              if (ch === ">" || ch === "+" || ch === "^" || ch === ")" || ch === "(") break;
            }
            pos++;
          }
          const seg = s.slice(start, pos).trim();
          if (!seg) break;
          const el = emmetParseElementSegment(seg);
          if (!el) break;
          unitNodes = [el];
        }
        const appended = [];
        for (const parent of parents) {
          for (const u of unitNodes) {
            const clone = emmetCloneAST(u);
            if (parent === null) root.push(clone);
            else parent.children.push(clone);
            appended.push(clone);
          }
        }
        const _isGroupUnit = unitNodes.length === 1 && unitNodes[0].type === "group";
        let _leaves = [];
        for (const a of appended) {
          if (a.type === "group") _leaves.push(...emmetCollectLeaves(a));
          else _leaves.push(a);
        }
        lastAppended = _leaves;
        lastWasGroup = _isGroupUnit;
        // Remember the group's own clones + the parents it attached to, so
        // a following ^ can climb through the group's own ancestors first.
        lastGroupInfo = _isGroupUnit ? { roots: appended, attachParents: parents } : null;
        skipSpaces();
        if (pos >= len) break;
        if (s[pos] === ")") break;
        if (s[pos] === ">") { pos++; stack.push(parents); parents = lastAppended; continue; }
        if (s[pos] === "+") { pos++; continue; }
        if (s[pos] === "^") {
          let cnt = 0;
          while (pos < len && s[pos] === "^") { pos++; cnt++; }
          if (lastWasGroup && lastGroupInfo) {
            // Climb from the deepest leaf of the last group: first through
            // the group's own ancestors, then out to the group's attach
            // parents, then through the outer stack. The old
            // `cnt - groupDepth` shortcut made `(div>p)^span` land at the
            // root instead of inside <div>.
            let cur = lastAppended.length ? lastAppended[lastAppended.length - 1] : null;
            let exited = false;
            let caretsLeft = cnt;
            let climbGuard = 0;
            while (caretsLeft > 0 && climbGuard++ < 10000) {
              if (!exited && cur) {
                const parent = emmetFindParentInForest(lastGroupInfo.roots, cur);
                if (parent) {
                  if (parent.type === "group") {
                    // Group nodes are transparent: climbing through an
                    // inner group is free, reaching the outer group is
                    // the exit. Without this, the group node itself ate
                    // a caret, so `div>(span>a)^^^b` stopped inside div.
                    if (lastGroupInfo.roots.includes(parent)) {
                      exited = true;
                      parents = lastGroupInfo.attachParents;
                      caretsLeft--;
                    } else {
                      cur = parent;
                    }
                  } else {
                    cur = parent;
                    caretsLeft--;
                  }
                  continue;
                }
                exited = true;
                parents = lastGroupInfo.attachParents;
                caretsLeft--;
                continue;
              }
              if (stack.length > 0) parents = stack.pop();
              else parents = [null];
              caretsLeft--;
            }
            if (!exited && cur) parents = [cur];
          } else {
            for (let q = 0; q < cnt; q++) {
              if (stack.length > 0) parents = stack.pop();
              else parents = [null];
            }
          }
          lastWasGroup = false;
          lastGroupInfo = null;
          continue;
        }
        break;
      }
      return root;
    }
    return parseSequence();
  }
  function splitByOperator(str, op) {
    let result = [];
    let current = "";
    let square = 0, brace = 0, paren = 0;
    let inSingle = false, inDouble = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (inSingle) { current += char; if (char === "'" && str[i - 1] !== "\\") inSingle = false; continue; }
      if (inDouble) { current += char; if (char === '"' && str[i - 1] !== "\\") inDouble = false; continue; }
      if (char === "'" && (square > 0 || brace > 0)) { inSingle = true; current += char; continue; }
      if (char === '"' && (square > 0 || brace > 0)) { inDouble = true; current += char; continue; }
      if (char === "[") square++;
      else if (char === "]") square = Math.max(0, square - 1);
      else if (char === "{") brace++;
      else if (char === "}") brace = Math.max(0, brace - 1);
      else if (char === "(") paren++;
      else if (char === ")") paren = Math.max(0, paren - 1);
      if (square === 0 && brace === 0 && paren === 0 && char === op) { result.push(current); current = ""; continue; }
      current += char;
    }
    result.push(current);
    return result;
  }
  function parseSingleTagNode(seg, index = 0) {
    const ast = emmetParseElementSegment(seg);
    if (!ast) return { tagName: "div",
      id: "",
      classes: [],
      attrs: [],
      textContent: "",
      isSelfClosing: false,
      children: [] };
    const total = ast.multiplier > 1 ? ast.multiplier : 1;
    const concrete = emmetMakeConcrete(ast, index, total);
    return concrete;
  }
  function parseEmmet(str) {
    str = String(str).trim();
    if (!str) return [];
    const ast = emmetParseToAST(str);
    return emmetExpandAST(ast, 0, 1);
  }
  // Emmet {text} is literal text: <, > and & must be escaped, otherwise
  // `div{a < b}` produced broken markup.
  function emmetEscapeText(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderNodesToHTML(nodes, baseIndent = "", indentLevel = 0) {
    let html = "";
    let indent = baseIndent + "  ".repeat(indentLevel);
    for (let node of nodes) {
      if (node.isLorem) { html += `${indent}${emmetEscapeText(node.textContent)}\n`; continue; }
      // Attribute order: type/href, id, class, other attrs,
      // disabled, required. [...] attrs come in typed order
      // (input:text[required] stores required before type),
      // so they are re-sorted here.
      const _type = [], _href = [], _idA = [], _clsA = [], _dis = [], _req = [], _other = [];
      for (let attr of node.attrs) {
        const _nm = String(attr).split("=")[0].trim().toLowerCase();
        if (_nm === "type") _type.push(attr);
        else if (_nm === "href") _href.push(attr);
        else if (_nm === "id") _idA.push(attr);
        else if (_nm === "class") _clsA.push(attr);
        else if (_nm === "disabled") _dis.push(attr);
        else if (_nm === "required") _req.push(attr);
        else _other.push(attr);
      }
      const _parts = [];
      if (_type.length) _parts.push(_type.shift());
      if (_href.length) _parts.push(_href.shift());
      if (node.id) _parts.push(`id="${node.id}"`);
      else if (_idA.length) _parts.push(_idA.shift());
      if (node.classes.length > 0) _parts.push(`class="${node.classes.join(' ')}"`);
      else if (_clsA.length) _parts.push(_clsA.shift());
      _parts.push(..._type, ..._href, ..._idA, ..._clsA, ..._other);
      _parts.push(..._dis, ..._req);
      const attrStr = _parts.length ? " " + _parts.join(" ") : "";
      if (EMMET_SELF_CLOSING.includes(node.tagName.toLowerCase())) {
        html += `${indent}<${node.tagName}${attrStr} />\n`;
      } else if (node.children && node.children.length > 0) {
        html += `${indent}<${node.tagName}${attrStr}>\n`;
        if (node.textContent !== "") {
          html += `${indent}  ${emmetEscapeText(node.textContent)}\n`;
        }
        html += renderNodesToHTML(node.children, baseIndent, indentLevel + 1);
        html += `${indent}</${node.tagName}>\n`;
      } else if (node.textContent !== "") {
        html += `${indent}<${node.tagName}${attrStr}>${emmetEscapeText(node.textContent)}</${node.tagName}>\n`;
      } else {
        html += `${indent}<${node.tagName}${attrStr}></${node.tagName}>\n`;
      }
    }
    return html;
  }
  function expandEmmet(abbr, baseIndent = "") {
    abbr = String(abbr).trim();
    if (!abbr) return "";
    // G15: full-document abbreviations are removed. The document
    // (doctype/html/head/body/meta/title/base) is blocked, so "!"
    // must not load a full document anymore.
    if (abbr === "!" || abbr === "html:5" || abbr === "html:5!") return "";
    try {
      const ast = emmetParseToAST(abbr);
      if (!ast || ast.length === 0) return "";
      const nodes = emmetExpandAST(ast, 0, 1);
      return renderNodesToHTML(nodes, baseIndent, 0).trimEnd();
    } catch (e) { console.warn("Emmet expand failed:", e); return ""; }
  }

  const CSS_EMMET_FIXED = {
    'df':'display: flex;',
      'db':'display: block;',
      'dib':'display: inline-block;',
      'di':'display: inline;',
      'dn':'display: none;',
      'dg':'display: grid;',
      'dif':'display: inline-flex;',
    'posa':'position: absolute;',
      'posr':'position: relative;',
      'posf':'position: fixed;',
      'poss':'position: static;',
      'post':'position: sticky;',
    'jcc':'justify-content: center;',
      'jcsb':'justify-content: space-between;',
      'jcsa':'justify-content: space-around;',
      'jcse':'justify-content: space-evenly;',
      'jcfs':'justify-content: flex-start;',
      'jcfe':'justify-content: flex-end;',
    'aic':'align-items: center;',
      'aifs':'align-items: flex-start;',
      'aife':'align-items: flex-end;',
      'ais':'align-items: stretch;',
      'aib':'align-items: baseline;',
    'acc':'accent-color: ;', 'acs':'align-content: stretch;', // acc = VS Code accent-color (align-content: center via ac:c)
    'fdc':'flex-direction: column;',
      'fdr':'flex-direction: row;',
      'fdcr':'flex-direction: column-reverse;',
      'fdrr':'flex-direction: row-reverse;',
    'fww':'flex-wrap: wrap;', 'fwnw':'flex-wrap: nowrap;',
    'tac':'text-align: center;',
      'tal':'text-align: left;',
      'tar':'text-align: right;',
      'taj':'text-align: justify;',
    'tdn':'text-decoration: none;', 'tdu':'text-decoration: underline;',
    'ttu':'text-transform: uppercase;',
      'ttl':'text-transform: lowercase;',
      'ttc':'text-transform: capitalize;',
      'ttn':'text-transform: none;',
    'fwb':'font-weight: bold;', 'fwn':'font-weight: normal;',
    'fsi':'font-style: italic;', 'fsn':'font-style: normal;',
    'whsnw':'white-space: nowrap;', 'whsn':'white-space: normal;',
    'bszbb':'box-sizing: border-box;', 'bszcb':'box-sizing: content-box;',
    'ovh':'overflow: hidden;', 'ova':'overflow: auto;', 'ovs':'overflow: scroll;', 'ovv':'overflow: visible;',
    'ovxh':'overflow-x: hidden;',
      'ovxa':'overflow-x: auto;',
      'ovyh':'overflow-y: hidden;',
      'ovya':'overflow-y: auto;',
    'curp':'cursor: pointer;', 'curd':'cursor: default;',
    'vish':'visibility: hidden;', 'visv':'visibility: visible;',
    'usn':'user-select: none;', 'pen':'pointer-events: none;', 'pea':'pointer-events: auto;',
    'bshn':'box-shadow: none;', 'bgn':'background: none;', 'bdn':'border: none;',
    'fll':'float: left;', 'flr':'float: right;', 'fln':'float: none;',
    'clb':'clear: both;', 'cll':'clear: left;', 'clr':'clear: right;', 'cln':'clear: none;',
    'bgsc':'background-size: cover;', 'bgsct':'background-size: contain;',
    'bgrnr':'background-repeat: no-repeat;', 'bgrr':'background-repeat: repeat;',
    'bgpc':'background-position: center;',
    'w100p':'width: 100%;', 'h100p':'height: 100%;',
    // --- VS Code bare abbreviations (no value needed) ---
    'pos':'position: relative;', 'd':'display: block;', 'bxz':'box-sizing: border-box;',
    'w':'width: ;', 'h':'height: ;', 'c':'color: #000;', 'bg':'background: ;', 'bgc':'background-color: ;',
    'bdrs':'border-radius: ;', 'bdw':'border-width: ;', 'bds':'border-style: ;', 'br':'border-radius: ;',
    'fw':'font-weight: ;', 'fz':'font-size: ;', 'fs':'font-style: ;', 'fg':'flex-grow: ;',
    'ta':'text-align: ;', 'td':'text-decoration: ;', 'tt':'text-transform: ;',
    'lh':'line-height: ;', 'ls':'letter-spacing: ;', 'va':'vertical-align: ;',
    'ov':'overflow: ;', 'ovx':'overflow-x: ;', 'ovy':'overflow-y: ;',
    'cur':'cursor: ;', 'z':'z-index: ;', 'op':'opacity: ;',
    'trf':'transform: ;', 'trs':'transition: ;', 'anim':'animation: ;',
    'fl':'float: ;', 'cl':'clear: ;', 'vis':'visibility: ;',
    'whs':'white-space: ;', 'lis':'list-style: ;', 'tbl':'table-layout: ;', 'cp':'clip-path: ;',
    'rsz':'resize: ;', 'ap':'appearance: ;', 'us':'user-select: ;', 'pe':'pointer-events: ;',
    'wm':'writing-mode: ;', 'ord':'order: ;', 'fx':'flex: ;', 'fxd':'flex-direction: ;',
    'jc':'justify-content: ;', 'ai':'align-items: ;', 'ac':'align-content: ;', 'as':'align-self: ;',
    'g':'gap: ;',
      'gap':'gap: ;',
      'gg':'grid-gap: ;',
      'gtc':'grid-template-columns: ;',
      'gtr':'grid-template-rows: ;',
    'cnt':'content: ;', 'q':'quotes: ;',
    'miw':'min-width: ;', 'maw':'max-width: ;', 'mih':'min-height: ;', 'mah':'max-height: ;',
    't':'top: ;', 'r':'right: ;', 'b':'bottom: ;', 'l':'left: ;', 'in':'inset: ;',
    'bs':'box-shadow: ;', 'ts':'text-shadow: ;',
    'bgi':'background-image: ;', 'bgr':'background-repeat: ;',
    'ff':'font-family: ;', 'fst':'font-style: ;',
    'to':'text-overflow: ;', 'tw':'text-wrap: ;', 'dir':'direction: ;',
    'rg':'row-gap: ;', 'cg':'column-gap: ;', 'gc':'grid-column: ;', 'gr':'grid-row: ;', 'ga':'grid-area: ;',
    'orp':'orphans: ;', 'wid':'widows: ;', 'zoo':'zoom: ;',
    'mix':'mix-blend-mode: ;', 'objf':'object-fit: ;', 'will':'will-change: ;', 'ar':'aspect-ratio: ;',
    'mt':'margin-top: ;', 'mr':'margin-right: ;', 'mb':'margin-bottom: ;', 'ml':'margin-left: ;',
    'pt':'padding-top: ;', 'pr':'padding-right: ;', 'pb':'padding-bottom: ;', 'pl':'padding-left: ;',
    'bdt':'border-top: ;', 'bdb':'border-bottom: ;', 'bdl':'border-left: ;', 'bdr':'border-right: ;'
  };
  const CSS_EMMET_COLON = {
    'd': { prop:'display', map:{ 'f':'flex','b':'block','i':'inline','ib':'inline-block','n':'none','g':'grid','if':'inline-flex','t':'table' } },
    'pos': { prop:'position', map:{ 'a':'absolute','r':'relative','f':'fixed','s':'static','t':'sticky' } },
    'fl': { prop:'float', map:{ 'l':'left','r':'right','n':'none' } },
    'cl': { prop:'clear', map:{ 'b':'both','l':'left','r':'right','n':'none' } },
    'ta': { prop:'text-align', map:{ 'c':'center','l':'left','r':'right','j':'justify' } },
    'td': { prop:'text-decoration', map:{ 'n':'none','u':'underline' } },
    'tt': { prop:'text-transform', map:{ 'u':'uppercase','l':'lowercase','c':'capitalize','n':'none' } },
    'fw': { prop:'font-weight', map:{ 'b':'bold','n':'normal' } },
    'fs': { prop:'font-style', map:{ 'i':'italic','n':'normal' } },
    'ov': { prop:'overflow', map:{ 'h':'hidden','a':'auto','s':'scroll','v':'visible' } },
    'cur': { prop:'cursor', map:{ 'p':'pointer','d':'default','a':'auto' } },
    'vis': { prop:'visibility', map:{ 'h':'hidden','v':'visible' } },
    'bgs': { prop:'background-size', map:{ 'c':'cover','ct':'contain' } },
    'bgr': { prop:'background-repeat', map:{ 'nr':'no-repeat','r':'repeat','rx':'repeat-x','ry':'repeat-y' } },
    'whs': { prop:'white-space', map:{ 'nw':'nowrap','n':'normal','p':'pre' } },
    'jc': { prop:'justify-content', map:{ 'c':'center','sb':'space-between','sa':'space-around','se':'space-evenly','fs':'flex-start','fe':'flex-end' } },
    'ai': { prop:'align-items', map:{ 'c':'center','fs':'flex-start','fe':'flex-end','s':'stretch','b':'baseline' } },
    'fd': { prop:'flex-direction', map:{ 'c':'column','r':'row','cr':'column-reverse','rr':'row-reverse' } },
    'c': { prop:'color', map:{ 'r':'red' } },
    'bgc': { prop:'background-color', map:{} },
    'fz': { prop:'font-size', map:{} },
    'm': { prop:'margin', map:{} },
    'p': { prop:'padding', map:{} },
    // --- VS Code prop:value entries ---
    'bxz': { prop:'box-sizing', map:{ 'bb':'border-box','cb':'content-box' } },
    'ac': { prop:'align-content', map:{ 'c':'center','s':'stretch','fs':'flex-start','fe':'flex-end','sb':'space-between','sa':'space-around','se':'space-evenly' } },
    'as': { prop:'align-self', map:{ 'c':'center','s':'stretch','fs':'flex-start','fe':'flex-end','a':'auto','b':'baseline' } },
    't': { prop:'top', map:{ 'a':'auto' } },
    'r': { prop:'right', map:{ 'a':'auto' } },
    'b': { prop:'bottom', map:{ 'a':'auto' } },
    'l': { prop:'left', map:{ 'a':'auto' } },
    'in': { prop:'inset', map:{ 'a':'auto' } },
    'z': { prop:'z-index', map:{ 'a':'auto' } },
    'op': { prop:'opacity', map:{} },
    'trf': { prop:'transform', map:{} },
    'trs': { prop:'transition', map:{} },
    'anim': { prop:'animation', map:{} },
    'lis': { prop:'list-style', map:{ 'n':'none','d':'disc','c':'circle','s':'square' } },
    'tbl': { prop:'table-layout', map:{ 'a':'auto','f':'fixed' } },
    'cp': { prop:'clip-path', map:{} },
    'rsz': { prop:'resize', map:{ 'n':'none','b':'both','h':'horizontal','v':'vertical' } },
    'ap': { prop:'appearance', map:{ 'n':'none','a':'auto' } },
    'us': { prop:'user-select', map:{ 'n':'none','a':'auto','t':'text','al':'all' } },
    'pe': { prop:'pointer-events', map:{ 'n':'none','a':'auto' } },
    'wm': { prop:'writing-mode', map:{ 'h':'horizontal-tb','v':'vertical-rl','vr':'vertical-rl','vl':'vertical-lr' } },
    'ord': { prop:'order', map:{} },
    'fx': { prop:'flex', map:{} },
    'fxd': { prop:'flex-direction', map:{ 'c':'column','r':'row','cr':'column-reverse','rr':'row-reverse' } },
    'gtc': { prop:'grid-template-columns', map:{} },
    'gtr': { prop:'grid-template-rows', map:{} },
    'cnt': { prop:'content', map:{ 'n':'none' } },
    'q': { prop:'quotes', map:{} },
    'miw': { prop:'min-width', map:{ 'a':'auto' } },
    'maw': { prop:'max-width', map:{ 'n':'none' } },
    'mih': { prop:'min-height', map:{ 'a':'auto' } },
    'mah': { prop:'max-height', map:{ 'n':'none' } },
    'bs': { prop:'box-shadow', map:{ 'n':'none' } },
    'ts': { prop:'text-shadow', map:{} },
    'bgi': { prop:'background-image', map:{ 'n':'none' } },
    'ff': { prop:'font-family', map:{} },
    'fst': { prop:'font-style', map:{ 'i':'italic','n':'normal' } },
    'to': { prop:'text-overflow', map:{ 'c':'clip','e':'ellipsis' } },
    'tw': { prop:'text-wrap', map:{ 'w':'wrap','n':'nowrap','b':'balance','p':'pretty' } },
    'dir': { prop:'direction', map:{ 'l':'ltr','r':'rtl' } },
    'rg': { prop:'row-gap', map:{} },
    'cg': { prop:'column-gap', map:{} },
    'gc': { prop:'grid-column', map:{} },
    'gr': { prop:'grid-row', map:{} },
    'ga': { prop:'grid-area', map:{} },
    'orp': { prop:'orphans', map:{} },
    'wid': { prop:'widows', map:{} },
    'zoo': { prop:'zoom', map:{} },
    'mix': { prop:'mix-blend-mode', map:{} },
    'objf': { prop:'object-fit', map:{ 'c':'cover','ct':'contain','f':'fill','n':'none','sd':'scale-down' } },
    'will': { prop:'will-change', map:{ 'a':'auto' } },
    'ar': { prop:'aspect-ratio', map:{ 'a':'auto' } },
    'bdrs': { prop:'border-radius', map:{} },
    'bdw': { prop:'border-width', map:{} },
    'bds': { prop:'border-style', map:{ 'n':'none','s':'solid','d':'dashed','dt':'dotted','db':'double' } },
    'lh': { prop:'line-height', map:{ 'n':'normal' } },
    'ls': { prop:'letter-spacing', map:{} },
    'va': { prop:'vertical-align', map:{ 'm':'middle','t':'top','b':'bottom','bl':'baseline','sup':'super','sub':'sub' } },
    'ovx': { prop:'overflow-x', map:{ 'h':'hidden','a':'auto','s':'scroll','v':'visible' } },
    'ovy': { prop:'overflow-y', map:{ 'h':'hidden','a':'auto','s':'scroll','v':'visible' } },
    'acc': { prop:'accent-color', map:{} },
    'mt': { prop:'margin-top', map:{} },
    'mr': { prop:'margin-right', map:{} },
    'mb': { prop:'margin-bottom', map:{} },
    'ml': { prop:'margin-left', map:{} },
    'pt': { prop:'padding-top', map:{} },
    'pr': { prop:'padding-right', map:{} },
    'pb': { prop:'padding-bottom', map:{} },
    'pl': { prop:'padding-left', map:{} },
    'bdt': { prop:'border-top', map:{} },
    'bdb': { prop:'border-bottom', map:{} },
    'bdl': { prop:'border-left', map:{} },
    'bdr': { prop:'border-right', map:{} },
    'br': { prop:'border-radius', map:{} },
    'fg': { prop:'flex-grow', map:{} },
    'fs': { prop:'font-style', map:{ 'i':'italic','n':'normal' } }
  };
  const CSS_EMMET_PREFIX = [
    { pre:'maw', prop:'max-width', unit:'px', kind:'num' },
    { pre:'mah', prop:'max-height', unit:'px', kind:'num' },
    { pre:'miw', prop:'min-width', unit:'px', kind:'num' },
    { pre:'mih', prop:'min-height', unit:'px', kind:'num' },
    { pre:'bgc', prop:'background-color', unit:'', kind:'color' },
    { pre:'bgi', prop:'background-image', unit:'', kind:'raw' },
    { pre:'bgs',
      prop:'background-size',
      unit:'',
      kind:'keyword',
      allowed:['cover','contain','auto','c','ct'] },
    { pre:'bgp',
      prop:'background-position',
      unit:'',
      kind:'keyword',
      allowed:['center','left','right','top','bottom','c'] },
    { pre:'bgr',
      prop:'background-repeat',
      unit:'',
      kind:'keyword',
      allowed:['no-repeat','repeat','repeat-x','repeat-y','nr','r','rx','ry'] },
    { pre:'bdt', prop:'border-top', unit:'px', kind:'border' },
    { pre:'bdb', prop:'border-bottom', unit:'px', kind:'border' },
    { pre:'bdl', prop:'border-left', unit:'px', kind:'border' },
    { pre:'bdr', prop:'border-right', unit:'px', kind:'border' },
    { pre:'mx', prop:'__mx', unit:'px', kind:'num', dual:true },
    { pre:'my', prop:'__my', unit:'px', kind:'num', dual:true },
    { pre:'px', prop:'__px', unit:'px', kind:'num', dual:true },
    { pre:'py', prop:'__py', unit:'px', kind:'num', dual:true },
    { pre:'mt', prop:'margin-top', unit:'px', kind:'num' },
    { pre:'mr', prop:'margin-right', unit:'px', kind:'num' },
    { pre:'mb', prop:'margin-bottom', unit:'px', kind:'num' },
    { pre:'ml', prop:'margin-left', unit:'px', kind:'num' },
    { pre:'pt', prop:'padding-top', unit:'px', kind:'num' },
    { pre:'pr', prop:'padding-right', unit:'px', kind:'num' },
    { pre:'pb', prop:'padding-bottom', unit:'px', kind:'num' },
    { pre:'pl', prop:'padding-left', unit:'px', kind:'num' },
    { pre:'fz', prop:'font-size', unit:'px', kind:'num' },
    { pre:'fw', prop:'font-weight', unit:'', kind:'fw' },
    { pre:'ff', prop:'font-family', unit:'', kind:'raw' },
    { pre:'lh', prop:'line-height', unit:'', kind:'lh' },
    { pre:'ls', prop:'letter-spacing', unit:'px', kind:'num' },
    { pre:'gap', prop:'gap', unit:'px', kind:'num' },
    { pre:'g', prop:'gap', unit:'px', kind:'num' },
    { pre:'rg', prop:'row-gap', unit:'px', kind:'num' },
    { pre:'cg', prop:'column-gap', unit:'px', kind:'num' },
    { pre:'ord', prop:'order', unit:'', kind:'num' },
    { pre:'fx', prop:'flex', unit:'', kind:'num' },
    { pre:'fg', prop:'flex-grow', unit:'', kind:'num' },
    { pre:'fs', prop:'font-style', unit:'', kind:'keyword', allowed:['italic','normal','i','n'] },
    { pre:'trs', prop:'transition', unit:'', kind:'raw' },
    { pre:'trf', prop:'transform', unit:'', kind:'raw' },
    { pre:'anim', prop:'animation', unit:'', kind:'raw' },
    { pre:'cur', prop:'cursor', unit:'', kind:'keyword', allowed:['pointer','default','auto','p','d','a'] },
    { pre:'bs', prop:'box-shadow', unit:'', kind:'raw' },
    { pre:'br', prop:'border-radius', unit:'px', kind:'num' },
    { pre:'bd', prop:'border', unit:'px', kind:'border' },
    { pre:'bg', prop:'background', unit:'', kind:'raw' },
    { pre:'m', prop:'margin', unit:'px', kind:'num', multi:true },
    { pre:'p', prop:'padding', unit:'px', kind:'num', multi:true },
    { pre:'w', prop:'width', unit:'px', kind:'num' },
    { pre:'h', prop:'height', unit:'px', kind:'num' },
    { pre:'t', prop:'top', unit:'px', kind:'num' },
    { pre:'r', prop:'right', unit:'px', kind:'num' },
    { pre:'b', prop:'bottom', unit:'px', kind:'num' },
    { pre:'l', prop:'left', unit:'px', kind:'num' },
    { pre:'z', prop:'z-index', unit:'', kind:'num' },
    { pre:'op', prop:'opacity', unit:'', kind:'num' },
    { pre:'c', prop:'color', unit:'', kind:'color' }
  ];
  function cssEmmetNumericToken(tok, unit) {
    if (!tok) return null;
    if (tok === 'a' || tok === 'auto') return 'auto';
    if (tok === 'n' || tok === 'none') return 'none';
    if (tok === '0') return '0';
    if (/^-?\d*\.?\d+$/.test(tok)) {
      if (tok === '0') return '0';
      if (!unit) return tok;
      return tok + unit;
    }
    const m = tok.match(/^(-?\d*\.?\d+)(p|e|r|vh|vw|v|%|px|em|rem|deg|s|ms|x)$/);
    if (m) {
      const num = m[1], suf = m[2];
      if (suf === 'p') return num + '%';
      if (suf === 'e') return num + 'em';
      if (suf === 'r') return num + 'rem';
      if (suf === 'x') return num + 'ex';
      if (suf === 'v') return num + 'vw';
      return num + suf;
    }
    return null;
  }
  function cssEmmetParseValues(valuePart, unit, kind) {
    if (!valuePart) return null;
    if (valuePart[0] === '#') {
      if (!/^#[0-9a-fA-F]{3,8}$/.test(valuePart)) return null;
      return [valuePart];
    }
    if (valuePart.startsWith('-')) {
      const rest = valuePart.slice(1);
      if (!rest) return null;
      const parts = rest.split('-').filter(Boolean);
      if (parts.length === 0) return null;
      const first = cssEmmetNumericToken('-' + parts[0], unit);
      if (!first) return null;
      const out = [first];
      for (let i=1;i<parts.length;i++){ const v = cssEmmetNumericToken(parts[i], unit); if (!v) return null; out.push(v); }
      return out;
    }
    const parts = valuePart.split('-').filter(s=>s!=='');
    if (parts.length===0) return null;
    const out = [];
    for (const p of parts){ const v = cssEmmetNumericToken(p, unit); if (!v) return null; out.push(v); }
    return out;
  }
  function expandCssEmmet(rawAbbr) {
    let abbr = String(rawAbbr||'').trim();
    if (!abbr) return '';
    let important = false;
    if (abbr.endsWith('!')) { important = true; abbr = abbr.slice(0,-1); if (!abbr) return ''; }
    const imp = important ? ' !important' : '';
    if (CSS_EMMET_FIXED[abbr]) {
      const base = CSS_EMMET_FIXED[abbr];
      if (important) return base.replace(/;$/, '') + imp + ';';
      return base;
    }
    if (abbr.includes(':')) {
      const idx = abbr.indexOf(':');
      const pre = abbr.slice(0, idx);
      const val = abbr.slice(idx+1);
      if (!val) return '';
      if (CSS_EMMET_COLON[pre]) {
        const entry = CSS_EMMET_COLON[pre];
        if (entry.map && entry.map[val]) return entry.prop + ': ' + entry.map[val] + imp + ';';
        if (pre === 'c' || pre === 'bgc') {
          if (val[0] === '#') { if (!/^#[0-9a-fA-F]{3,8}$/.test(val)) return ''; return entry.prop + ': ' + val + imp + ';'; }
          if (/^[a-z]+$/.test(val)) return entry.prop + ': ' + val + imp + ';';
          return '';
        }
        if (pre === 'fz' || pre === 'm' || pre === 'p') {
          const v = cssEmmetNumericToken(val, 'px');
          if (!v) return '';
          return entry.prop + ': ' + v + imp + ';';
        }
        if (val) return entry.prop + ': ' + val + imp + ';';
      }
      return '';
    }
    for (const entry of CSS_EMMET_PREFIX) {
      if (abbr === entry.pre) {
        if (entry.pre === 'bd') return 'border: 1px solid #000' + imp + ';';
        if (entry.pre === 'm' || entry.pre === 'p') return entry.prop + ': 0' + imp + ';';
        // Bare 'bg' without value is invalid.
        return '';
      }
      if (abbr.startsWith(entry.pre)) {
        // Do not let 'bg' match bgc/bgi/bgs/bgp, or bgrn becomes 'background: rn;'. Do not guard 'bgr' - 'bgred' also starts with it.
        if (entry.pre === 'bg' && /^(bgc|bgi|bgs|bgp)/.test(abbr)) continue;
        // A real property name must not be eaten by a prefix: `animation`
        // (and `animation-*`) used to expand to `animation: ation;`.
        if (entry.pre === 'anim' && (abbr === 'animation' || abbr.startsWith('animation-'))) continue;
        const valuePart = abbr.slice(entry.pre.length);
        if (!valuePart) continue;
        if (!/^[0-9\-#a-zA-Z\.]/.test(valuePart)) continue;
        if (entry.dual) {
          const vals = cssEmmetParseValues(valuePart, entry.unit, entry.kind);
          if (!vals) continue;
          const v = vals.join(' ');
          if (entry.pre === 'mx') return 'margin-left: ' + v + imp + ';\nmargin-right: ' + v + imp + ';';
          if (entry.pre === 'my') return 'margin-top: ' + v + imp + ';\nmargin-bottom: ' + v + imp + ';';
          if (entry.pre === 'px') return 'padding-left: ' + v + imp + ';\npadding-right: ' + v + imp + ';';
          if (entry.pre === 'py') return 'padding-top: ' + v + imp + ';\npadding-bottom: ' + v + imp + ';';
        }
        if (entry.kind === 'border') {
          if (valuePart === '0') return entry.prop + ': 0' + imp + ';';
          const bm = valuePart.match(/^(\d+)(s|d|dot|db)?(#(?:[0-9a-fA-F]{3,8}))?$/);
          if (bm) {
            const num = bm[1];
            const style = bm[2] === 's' ? ' solid' : bm[2] === 'd' ? ' dashed' : bm[2] === 'dot' ? ' dotted' : bm[2] === 'db' ? ' double' : ' solid';
            const col = bm[3] ? ' ' + bm[3] : '';
            return entry.prop + ': ' + num + 'px' + style + col + imp + ';';
          }
          const vals = cssEmmetParseValues(valuePart, entry.unit, entry.kind);
          if (vals) return entry.prop + ': ' + vals.join(' ') + imp + ';';
          continue;
        }
        if (entry.kind === 'raw') {
          return entry.prop + ': ' + valuePart + imp + ';';
        }
        if (entry.kind === 'color') {
          if (valuePart[0] === '#') {
            if (!/^#[0-9a-fA-F]{3,8}$/.test(valuePart)) continue;
            return entry.prop + ': ' + valuePart + imp + ';';
          }
          const named = ['red',
            'blue',
            'green',
            'black',
            'white',
            'transparent',
            'yellow',
            'orange',
            'pink',
            'purple',
            'gray',
            'grey',
            'brown',
            'cyan',
            'magenta',
            'lime',
            'navy',
            'teal',
            'maroon',
            'olive',
            'aqua',
            'silver'];
          if (named.includes(valuePart.toLowerCase())) return entry.prop + ': ' + valuePart.toLowerCase() + imp + ';';
          continue;
        }
        if (entry.kind === 'keyword') {
          const mapShort = { 'c':'center',
            'ct':'contain',
            'nr':'no-repeat',
            'r':'repeat',
            'rx':'repeat-x',
            'ry':'repeat-y',
            'i':'italic',
            'n':'normal',
            'p':'pointer',
            'd':'default',
            'a':'auto' };
          if (entry.allowed && entry.allowed.includes(valuePart)) {
            const v = mapShort[valuePart] || valuePart;
            return entry.prop + ': ' + v + imp + ';';
          }
          continue;
        }
        if (entry.kind === 'fw') {
          if (valuePart === 'b' || valuePart === 'bold') return entry.prop + ': bold' + imp + ';';
          if (valuePart === 'n' || valuePart === 'normal') return entry.prop + ': normal' + imp + ';';
          if (/^\d+$/.test(valuePart)) return entry.prop + ': ' + valuePart + imp + ';';
          continue;
        }
        if (entry.kind === 'lh') {
          if (valuePart === 'n' || valuePart === 'normal') return entry.prop + ': normal' + imp + ';';
          if (/^-?\d*\.?\d+$/.test(valuePart)) return entry.prop + ': ' + valuePart + imp + ';';
          const v = cssEmmetNumericToken(valuePart, 'px');
          if (v) return entry.prop + ': ' + v + imp + ';';
          continue;
        }
        const vals = cssEmmetParseValues(valuePart, entry.unit, entry.kind);
        if (!vals) continue;
        return entry.prop + ': ' + vals.join(' ') + imp + ';';
      }
    }
    return '';
  }
  function extractCssEmmetAbbr(lineBefore) {
    if (!lineBefore) return '';
    // Strip trailing delimiters (space, ;, }, comma) so an abbreviation
    // followed by closing code still triggers. e.g. "p { c#343 }" -> "c#343".
    // Safe: real CSS words (flex, red, block...) are never Emmet abbreviations.
    const stripped = lineBefore.replace(/[\s;},]+$/, '');
    if (!stripped) return '';
    const m = stripped.match(/([A-Za-z][A-Za-z0-9\-:#.!]*)$/);
    if (!m) return '';
    let tok = m[1];
    tok = tok.replace(/\.+$/, '');
    return tok;
  }
  function extractCssEmmetAbbrEnd(lineBefore) {
    if (!lineBefore) return 0;
    return lineBefore.replace(/[\s;},]+$/, '').length;
  }
  function isValidCssEmmetAbbr(abbr) {
    if (!abbr) return false;
    if (abbr === '!') return false;
    return expandCssEmmet(abbr) !== '';
  }
  function triggerCssEmmetExpansion(cm) {
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const braceIdx = line.indexOf('{');
    if (braceIdx !== -1) {
      // Inside a block: expand EVERY valid abbreviation after "{", so
      // "p { df, c#343, jcc }" becomes all three declarations in one Tab.
      // Selector before "{" is never touched.
      const declStart = braceIdx + 1;
      const closeIdx = line.indexOf('}', declStart);
      const declEnd = closeIdx !== -1 ? closeIdx : line.length;
      const decl = line.substring(declStart, declEnd);
      let count = 0;
      const newDecl = decl.replace(/([A-Za-z][A-Za-z0-9\-:#.!]*)([;,]?)/g, (match, tok, sep) => {
        const clean = tok.replace(/\.+$/, '');
        if (!clean || !isValidCssEmmetAbbr(clean)) return match;
        const exp = expandCssEmmet(clean);
        if (!exp || exp === clean) return match;
        count++;
        // Expansion already ends with ";", so drop a trailing "," or ";" separator.
        if (exp.endsWith(';')) return exp;
        return exp + sep;
      });
      if (count === 0) return false;
      const newLine = line.substring(0, declStart) + newDecl + line.substring(declEnd);
      cm.replaceRange(newLine, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});
      try { cm.setCursor({line: cursor.line, ch: declStart + newDecl.length}); } catch (e) {}
      hideEmmetPreview();
      return true;
    }
    // No "{" on this line: single abbreviation before cursor (old behavior).
    const lineBefore = line.substring(0, cursor.ch);
    const abbr = extractCssEmmetAbbr(lineBefore);
    if (!abbr) return false;
    if (!isValidCssEmmetAbbr(abbr)) return false;
    const abbrEndCh = extractCssEmmetAbbrEnd(lineBefore);
    const beforeAbbr = line.substring(0, abbrEndCh - abbr.length);
    // Guard: bare "p"/"m" alone on a line at column 0 is a selector, not
    // padding/margin. Let Tab indent instead of expanding it.
    if ((abbr === 'p' || abbr === 'm') && beforeAbbr === '' && line.substring(abbrEndCh).trim() === '') return false;
    let startCh, baseIndent;
    if (beforeAbbr.trim() === '') { startCh = 0; baseIndent = beforeAbbr; } else { startCh = abbrEndCh - abbr.length; baseIndent = ''; }
    let expanded = expandCssEmmet(abbr);
    if (!expanded || expanded === abbr) return false;
    if (baseIndent && expanded.includes('\\n')) {
      expanded = expanded.split('\\n').map((l,idx)=> idx===0? l : baseIndent + l).join('\\n');
      expanded = baseIndent + expanded;
    } else if (baseIndent) {
      expanded = baseIndent + expanded;
    }
    // If a ";" follows the abbreviation and expansion already ends with ";", consume it to avoid ";;".
    let endCh = abbrEndCh;
    if (expanded.endsWith(';') && line[abbrEndCh] === ';') endCh = abbrEndCh + 1;
    cm.replaceRange(expanded, {line: cursor.line, ch: startCh}, {line: cursor.line, ch: endCh});
    hideEmmetPreview();
    return true;
  }

  function expandAllCssEmmet(cm) {
    if (!cm || !cm.getValue) return 0;
    const totalLines = cm.lineCount();
    let expandedCount = 0;
    // Go bottom-up so line numbers stay valid while replacing.
    for (let ln = totalLines - 1; ln >= 0; ln--) {
      const line = cm.getLine(ln) || "";
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Bare `p` / `m` on their own line is a selector, not padding/margin
      // (same guard as the single-Tab path).
      if (trimmed === 'p' || trimmed === 'm') continue;
      if (trimmed.includes("{") || trimmed.includes("}") || trimmed.endsWith(";")) continue;
      if (trimmed.startsWith("/*") || trimmed.startsWith("//")) continue;
      const indentMatch = line.match(/^([ \t]*)/);
      const indent = indentMatch ? indentMatch[1] : "";
      const parts = trimmed.split(/[;\s]+/).filter(Boolean);
      if (parts.length === 0) continue;
      let outLines = [];
      let ok = true;
      for (const part of parts) {
        if (!isValidCssEmmetAbbr(part)) { ok = false; break; }
        const exp = expandCssEmmet(part);
        if (!exp) { ok = false; break; }
        const sub = exp.split("\n");
        for (const s of sub) outLines.push(indent + s);
      }
      if (!ok || outLines.length === 0) continue;
      const from = { line: ln, ch: 0 };
      const to = { line: ln, ch: line.length };
      cm.replaceRange(outLines.join("\n"), from, to);
      expandedCount += outLines.length;
    }
    hideEmmetPreview();
    return expandedCount;
  }

  let emmetPreviewEl = null;
  let emmetPreviewInner = null;
  let emmetPreviewAbbrEl = null;
  let emmetPreviewArrowEl = null;
  let emmetPreviewBodyEl = null;
  let emmetPreviewHeadEl = null;
  let emmetPreviewTimer = null;
  // Set when the auto-close overtype moves the cursor (change.cancel +
  // setCursor): cursorActivity fires with no change event, so the preview
  // must still re-check. Tap/arrow moves must never show the preview.
  let emmetOvertypePending = false;
  function emmetEscapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function emmetHighlightPreview(text, mode) {
    const esc = emmetEscapeHtml(text);
    if (mode === "css") {
      // Single-pass replace: never re-scan inserted <span> tags.
      return esc.replace(/([a-zA-Z-]+)(\s*:)|(#[0-9a-fA-F]{3,8})|(\b\d*\.?\d+(?:px|%|em|rem|vh|vw|deg|s|ms)?\b)|(!important)/g, function(m, prop, colon, hex, num, imp) {
        if (prop) return '<span class="tok-prop">' + prop + '</span>' + colon;
        if (hex) return '<span class="tok-str">' + hex + '</span>';
        if (num) return '<span class="tok-num">' + num + '</span>';
        if (imp) return '<span class="tok-imp">' + imp + '</span>';
        return m;
      });
    }
    return esc.replace(/(&lt;!DOCTYPE[^&]*?&gt;)|(&lt;!--.*?--&gt;)|(&lt;\/?)([a-zA-Z][a-zA-Z0-9-]*)|([a-zA-Z-]+)(=)|("[^"]*")|(&gt;)|(&lt;)/g, function(m, doctype, comment, lt, tag, attr, eq, str, gt, lt2) {
      if (doctype) return '<span class="tok-gray">' + doctype + '</span>';
      if (comment) return '<span class="tok-gray">' + comment + '</span>';
      if (lt) return '<span class="tok-gray">' + lt + '</span><span class="tok-tag">' + tag + '</span>';
      if (attr) return '<span class="tok-attr">' + attr + '</span>' + eq;
      if (str) return '<span class="tok-str">' + str + '</span>';
      if (gt) return '<span class="tok-gray">' + gt + '</span>';
      if (lt2) return '<span class="tok-gray">' + lt2 + '</span>';
      return m;
    });
  }
  function ensureEmmetPreviewEl() {
    if (emmetPreviewEl) return emmetPreviewEl;
    if (!document.getElementById("emmet-preview-style")) {
      const st = document.createElement("style");
      st.id = "emmet-preview-style";
      st.textContent = ".emmet-live-preview{position:fixed;z-index:9999;background:rgba(42,42,58,0.98);" +
        "color:#e8e8e8;border:1px solid #4a4a63;border-radius:6px;box-shadow:0 " +
        "12px 28px rgba(0,0,0,.5);overflow:hidden;font-family:ui-monospace,Menlo,Consolas,monospace;" +
        "display:none;backdrop-filter:blur(2px)}.emmet-live-preview-head{display:flex;" +
        "align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;" +
        "background:#34344a;border-bottom:1px solid #4a4a63;border-radius:6px 6px " +
        "0 0}.emmet-live-preview-title{font-size:11px;letter-spacing:.06em;text-transform:uppercase;" +
        "color:#9ad1ff;font-weight:700;white-space:nowrap}.emmet-live-preview-abbr{font-size:12px;" +
        "color:#ffd479;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" +
        "max-width:180px}.emmet-live-preview-close{background:transparent;border:0;" +
        "color:#aaa;font-size:18px;line-height:1;cursor:pointer;padding:0 2px}.emmet-live-preview-close:hover{color:#fff}" +
        ".emmet-live-preview-body{padding:8px 10px;max-height:200px;overflow-y:auto;" +
        "overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;" +
        "overscroll-behavior:contain;pointer-events:auto;scrollbar-width:thin;scrollbar-color:#5a5a75 " +
        "transparent}.emmet-live-preview-body::-webkit-scrollbar{width:6px}.emmet-live-preview-body::-webkit-scrollbar-thumb{background:#5a5a75;" +
        "border-radius:3px}.emmet-live-preview-body::-webkit-scrollbar-track{background:transparent}" +
        ".emmet-live-preview-body pre{margin:0;white-space:pre-wrap;word-break:break-word;" +
        "font-size:12.5px;line-height:1.55;color:#e8e8e8}.emmet-live-preview-body " +
        "pre .tok-tag{color:#6fca8a}.emmet-live-preview-body pre .tok-attr{color:#ffffff}" +
        ".emmet-live-preview-body pre .tok-str{color:#e06c75}.emmet-live-preview-body " +
        "pre .tok-gray{color:#8a8a9a}.emmet-live-preview-body pre .tok-prop{color:#9ad1ff}" +
        ".emmet-live-preview-body pre .tok-num{color:#e5a55a}.emmet-live-preview-body " +
        "pre .tok-imp{color:#ff7edb}.emmet-live-preview-arrow{position:absolute;" +
        "width:10px;height:10px;background:#34344a;border-left:1px solid #4a4a63;" +
        "border-top:1px solid #4a4a63;transform:rotate(45deg);top:-6px;left:18px;" +
        "z-index:1}.emmet-live-preview.arrow-below .emmet-live-preview-arrow{top:auto;" +
        "bottom:-6px;transform:rotate(225deg);background:#2a2a3a;border-left:1px " +
        "solid #4a4a63;border-top:1px solid #4a4a63}";
      document.head.appendChild(st);
    }
    const wrap = document.createElement("div");
    wrap.className = "emmet-live-preview";
    wrap.innerHTML = '<div class="emmet-live-preview-arrow"></div><div class="emmet-live-preview-head"><span ' +
      'class="emmet-live-preview-title">Emmet Preview</span><span class="emmet-live-preview-abbr"></span><button ' +
      'class="emmet-live-preview-close" type="button" title="Close (Esc)">×</button></div><div ' +
      'class="emmet-live-preview-body"><pre></pre></div>';
    document.body.appendChild(wrap);
    emmetPreviewEl = wrap;
    emmetPreviewAbbrEl = wrap.querySelector(".emmet-live-preview-abbr");
    emmetPreviewInner = wrap.querySelector(".emmet-live-preview-body pre");
    emmetPreviewArrowEl = wrap.querySelector(".emmet-live-preview-arrow");
    emmetPreviewBodyEl = wrap.querySelector(".emmet-live-preview-body");
    emmetPreviewHeadEl = wrap.querySelector(".emmet-live-preview-head");
    const closeBtn = wrap.querySelector(".emmet-live-preview-close");
    if (closeBtn) closeBtn.addEventListener("click", (e) => { e.stopPropagation(); hideEmmetPreview(); });
    wrap.style.pointerEvents = "none";
    if (closeBtn) closeBtn.style.pointerEvents = "auto";
    const bodyEl = wrap.querySelector(".emmet-live-preview-body");
    if (bodyEl) {
      bodyEl.style.pointerEvents = "auto";
      // Block mousedown to keep editor focus, but allow touch scroll.
      bodyEl.addEventListener("mousedown", (e) => { e.preventDefault(); }, true);
      bodyEl.addEventListener("touchstart", (e) => { e.stopPropagation(); }, true);
    }
    return wrap;
  }
  function hideEmmetPreview() {
    if (emmetPreviewEl) emmetPreviewEl.style.display = "none";
    if (emmetPreviewTimer) { clearTimeout(emmetPreviewTimer); emmetPreviewTimer = null; }
  }
  function showEmmetPreview(cm, mode) {
    try {
      if (!cm || !cm.getCursor) return;
      // Never show the popup when the editor is not focused. A Settings
      // button (e.g. Color Converter) can insert text into the editor
      // while focus sits on the button - the popup must not appear then.
      if (cm.hasFocus && !cm.hasFocus()) { hideEmmetPreview(); return; }
      if (mode !== "htmlmixed" && mode !== "html" && mode !== "css") { hideEmmetPreview(); return; }
      const cursor = cm.getCursor();
      const line = cm.getLine(cursor.line) || "";
      const lineBefore = line.substring(0, cursor.ch);
      // Cursor inside a tag, quoted string, comment, or raw-text block
      // is not an Emmet position: a hex color in style="..." or inside a
      // <style> block must not preview as #id. Whole document up to the
      // cursor: a <style> block opened on an earlier line still counts.
      const textBefore = typeof cm.getRange === "function"
        ? cm.getRange({ line: 0, ch: 0 }, cursor)
        : lineBefore;
      if (!isEmmetPositionAllowed(textBefore)) { hideEmmetPreview(); return; }
      let abbr = "";
      let expanded = "";
      if (mode === "css") {
        abbr = extractCssEmmetAbbr(lineBefore);
        if (!abbr || !isValidCssEmmetAbbr(abbr)) { hideEmmetPreview(); return; }
        expanded = expandCssEmmet(abbr);
      } else {
        abbr = extractEmmetAbbr(lineBefore);
        if (!abbr || !isValidEmmetAbbr(abbr)) { hideEmmetPreview(); return; }
        expanded = expandEmmet(abbr, "");
      }
      if (!expanded || expanded === abbr) { hideEmmetPreview(); return; }
      const el = ensureEmmetPreviewEl();
      if (emmetPreviewAbbrEl) emmetPreviewAbbrEl.textContent = abbr;
      if (emmetPreviewInner) {
        let previewText = expanded;
        if (abbr === "!" || abbr === "html:5" || abbr === "html:5!") {
          const lines = expanded.split("\n");
          previewText = lines.slice(0, 10).join("\n") + "\n  ...\n</html>";
        }
        if (previewText.length > 1200) previewText = previewText.slice(0, 1200) + "\n...";
        emmetPreviewInner.innerHTML = emmetHighlightPreview(previewText, mode);
      }
      el.style.display = "block";
      let wrapperRect = null;
      try {
        const w = cm.getWrapperElement && cm.getWrapperElement();
        if (w) wrapperRect = w.getBoundingClientRect();
      } catch (e) {}
      let cursorPage = null;
      try { cursorPage = cm.cursorCoords(null, "page"); } catch (e) {}
      if (!cursorPage) { hideEmmetPreview(); return; }
      const gap = 4;
      let popupW = 380;
      let popupLeft = 20;
      if (wrapperRect) {
        popupW = Math.max(240, wrapperRect.width - 16);
        popupLeft = wrapperRect.left + 8;
        if (popupLeft + popupW > window.innerWidth - 8) {
          popupW = window.innerWidth - 16;
          popupLeft = 8;
        }
      } else {
        popupLeft = Math.max(8, cursorPage.left);
        if (popupLeft + popupW > window.innerWidth - 8) popupW = window.innerWidth - 16;
      }
      el.style.left = popupLeft + "px";
      el.style.width = popupW + "px";
      // Reset any previous caps so a later show with room is not stuck small.
      // The cap must live on the BODY, never on the wrapper: capping the
      // wrapper could not clip anything (it used overflow:visible), so the
      // background stopped at the cap while the content spilled past it.
      el.style.maxHeight = "";
      if (emmetPreviewBodyEl) emmetPreviewBodyEl.style.maxHeight = "";
      let popupH = el.offsetHeight || 220;
      let topBelow = cursorPage.bottom + gap;
      let topAbove = cursorPage.top - popupH - gap;
      let showBelow = true;
      // If no space below, show above without covering the active line.
      if (topBelow + popupH > window.innerHeight - 8) {
        if (topAbove >= 8) showBelow = false;
        else {
          // Neither side fits the full panel: shrink the BODY so the whole
          // panel fits on the roomier side, then re-measure.
          const headH = (emmetPreviewHeadEl && emmetPreviewHeadEl.offsetHeight) || 40;
          const availBelow = window.innerHeight - 8 - topBelow;
          const availAbove = cursorPage.top - gap - 8;
          if (availBelow >= availAbove) {
            if (emmetPreviewBodyEl) emmetPreviewBodyEl.style.maxHeight = Math.max(60, availBelow - headH - 4) + "px";
            popupH = el.offsetHeight || 220;
          } else {
            showBelow = false;
            if (emmetPreviewBodyEl) emmetPreviewBodyEl.style.maxHeight = Math.max(60, availAbove - headH - 4) + "px";
            popupH = el.offsetHeight || 220;
            topAbove = cursorPage.top - popupH - gap;
          }
        }
      }
      let top = showBelow ? topBelow : topAbove;
      if (top < 8) top = 8;
      el.style.top = top + "px";
      if (showBelow) el.classList.remove("arrow-below");
      else el.classList.add("arrow-below");
      if (emmetPreviewArrowEl) {
        let arrowLeft = cursorPage.left - popupLeft - 5;
        if (arrowLeft < 14) arrowLeft = 14;
        if (arrowLeft > popupW - 18) arrowLeft = popupW - 18;
        emmetPreviewArrowEl.style.left = arrowLeft + "px";
      }
    } catch (e) {}
  }
  function scheduleEmmetPreview(cm, mode) {
    if (emmetPreviewTimer) clearTimeout(emmetPreviewTimer);
    emmetPreviewTimer = setTimeout(() => showEmmetPreview(cm, mode), 140);
  }
  // Typing-like CodeMirror change origins. Programmatic replaceRange /
  // setValue calls (Color Converter, snippet insert, Format) carry origin
  // undefined or "setValue" and must not trigger the typing preview.
  function isUserTypingChangeOrigin(origin) {
    if (!origin) return false;
    if (origin.charAt(0) === "+") return true;
    return origin === "paste" || origin === "cut" || origin === "undo" ||
      origin === "redo" || origin === "complete";
  }

  // Emmet abbreviations only make sense where a new element can start:
  // in element content, not inside a tag, a quoted string, a comment,
  // a raw-text block (<style>, <script>, <textarea>, <title>), or a
  // sample-code block (<code>, <pre>, <samp>, <kbd>, <var>, <xmp>)
  // where code is shown as literal text.
  // A hex color like #212529 inside style="..." or inside a <style>
  // block must never preview or expand as an Emmet #id.
  // textBefore = whole document up to the cursor (multi-line): a <style>
  // block opened on an earlier line still counts.
  // HTML editor: which language is the cursor in? "css" inside <style>,
  // "js" inside <script>, else "html". Scans the text before the cursor
  // for the last unclosed raw block, skipping comments and quoted
  // strings, so <style> inside a comment or a JS string does not count.
  function getHtmlCursorLang(cm) {
    let textBefore = "";
    try { textBefore = cm.getRange({ line: 0, ch: 0 }, cm.getCursor()); } catch (e) { return "html"; }
    const lower = textBefore.toLowerCase();
    const len = textBefore.length;
    let i = 0, inComment = false, quote = null, rawTag = null;
    while (i < len) {
      if (inComment) {
        const end = textBefore.indexOf("-->", i);
        if (end === -1) break;
        i = end + 3; inComment = false; continue;
      }
      if (rawTag) {
        const closeIdx = lower.indexOf("</" + rawTag, i);
        if (closeIdx === -1) break;
        const gt = textBefore.indexOf(">", closeIdx + 2 + rawTag.length);
        if (gt === -1) break;
        i = gt + 1; rawTag = null; continue;
      }
      if (quote) {
        if (textBefore[i] === quote && textBefore[i - 1] !== "\\") quote = null;
        i++; continue;
      }
      const ch = textBefore[i];
      if (ch === "<") {
        if (textBefore.startsWith("<!--", i)) { inComment = true; i += 4; continue; }
        if (textBefore[i + 1] === "/") {
          const gt = textBefore.indexOf(">", i);
          if (gt === -1) break;
          i = gt + 1; continue;
        }
        const m = /^[a-z][a-z0-9-]*/.exec(lower.slice(i + 1, i + 31));
        const tagName = m ? m[0] : "";
        if (tagName === "style" || tagName === "script") {
          const gt = textBefore.indexOf(">", i);
          if (gt === -1) break;
          rawTag = tagName;
          i = gt + 1; continue;
        }
        i++; continue;
      }
      if (ch === '"' || ch === "'") {
        if (ch === "'" && /[A-Za-z]/.test(textBefore[i - 1] || "") && /[A-Za-z]/.test(textBefore[i + 1] || "")) { i++; continue; }
        quote = ch; i++; continue;
      }
      i++;
    }
    if (rawTag === "style") return "css";
    if (rawTag === "script") return "js";
    return "html";
  }

  function isEmmetPositionAllowed(textBefore) {
    const lower = textBefore.toLowerCase();
    const len = textBefore.length;
    let i = 0;
    let inTag = false;
    let quote = null;
    let inComment = false;
    let rawTag = null;
    while (i < len) {
      if (inComment) {
        const end = textBefore.indexOf("-->", i);
        if (end === -1) return false;
        i = end + 3;
        inComment = false;
        continue;
      }
      if (rawTag) {
        // Inside a raw block only its closing tag matters; everything
        // else (even "<div>" in a JS string) is skipped.
        const closeIdx = lower.indexOf("</" + rawTag, i);
        if (closeIdx === -1) return false;
        const gt = textBefore.indexOf(">", closeIdx + 2 + rawTag.length);
        if (gt === -1) return false;
        i = gt + 1;
        rawTag = null;
        continue;
      }
      if (quote) {
        if (textBefore[i] === quote && textBefore[i - 1] !== "\\") quote = null;
        i++;
        continue;
      }
      const ch = textBefore[i];
      if (ch === "<") {
        if (textBefore.startsWith("<!--", i)) { inComment = true; i += 4; continue; }
        if (textBefore[i + 1] === "/") {
          const gt = textBefore.indexOf(">", i);
          if (gt === -1) return false;
          i = gt + 1;
          continue;
        }
        const m = /^[a-z][a-z0-9-]*/.exec(lower.slice(i + 1, i + 31));
        const tagName = m ? m[0] : "";
        // Sample-code tags are raw text for Emmet: <code>, <pre>, <samp>,
        // <kbd>, <var>, <xmp> showcase code as literal text, never as
        // markup to expand. Same as <style>/<script>/<textarea>/<title>.
        if (tagName === "style" || tagName === "script" || tagName === "textarea" || tagName === "title" ||
          tagName === "code" || tagName === "pre" || tagName === "samp" || tagName === "kbd" ||
          tagName === "var" || tagName === "xmp") {
          const gt = textBefore.indexOf(">", i);
          if (gt === -1) return false;
          rawTag = tagName;
          i = gt + 1;
          continue;
        }
        inTag = true;
        i++;
        continue;
      }
      if (ch === ">") { inTag = false; i++; continue; }
      if (ch === '"' || ch === "'") {
        // Apostrophe inside a word (It's, don't) is not a quote delimiter.
        if (ch === "'" && /[A-Za-z]/.test(textBefore[i - 1] || "") && /[A-Za-z]/.test(textBefore[i + 1] || "")) { i++; continue; }
        quote = ch;
        i++;
        continue;
      }
      i++;
    }
    if (quote) return false;
    if (inTag) return false;
    if (inComment) return false;
    if (rawTag) return false;
    return true;
  }

  function setupEmmetLivePreview(cm, mode) {
    if (!cm || !cm.on) return;
    // Show preview on typing only, not on tap. On tap/arrow move, hide it.
    let _lastEmmetChange = 0;
    // Last change origin + time: a programmatic edit (Color Converter
    // replaceRange + setCursor) must not trigger the preview, even if
    // the editor happens to have focus.
    let _lastChangeOrigin = null;
    let _lastChangeTime = 0;
    cm.on("change", (cmArg, change) => {
      _lastEmmetChange = Date.now();
      // No change object (older build) -> treat as typing, do not break
      // the main preview. A present object with no origin -> programmatic.
      _lastChangeOrigin = change ? change.origin : "+input";
      _lastChangeTime = Date.now();
      if (!isUserTypingChangeOrigin(_lastChangeOrigin)) return;
      scheduleEmmetPreview(cm, mode);
    });
    cm.on("cursorActivity", () => {
      // If typing just happened, the change timer will show the preview.
      // If cursor moved without a change (tap, arrow, or overtype of a closing
      // bracket), re-check: show popup if cursor is at a valid abbreviation,
      // else hide it. This makes the popup appear inside a code block even
      // after typing " }" (overtype fires no change event).
      // Skip when the editor is not focused (e.g. a Settings button was
      // clicked) or when the cursor just moved as part of a programmatic
      // edit (Color Converter replaceRange + setCursor).
      if (cm.hasFocus && !cm.hasFocus()) return;
      if (!isUserTypingChangeOrigin(_lastChangeOrigin) && Date.now() - _lastChangeTime < 500) return;
      // Typing just happened: the change timer will show the preview.
      if (Date.now() - _lastEmmetChange <= 300) return;
      // Overtype (typing a closing bracket that was already there) fires
      // cursorActivity with no change event. Only then re-check.
      if (emmetOvertypePending) {
        emmetOvertypePending = false;
        scheduleEmmetPreview(cm, mode);
        return;
      }
      // Tap / arrow: cursor moved without typing. The preview is stale,
      // hide it. Never show a preview on a pure cursor move.
      hideEmmetPreview();
    });
    cm.on("blur", () => hideEmmetPreview());
    try {
      const wrapper = cm.getWrapperElement && cm.getWrapperElement();
      if (wrapper) {
        wrapper.addEventListener("keydown",
          (e) => { if (e.key === "Escape" || e.key === "Tab") hideEmmetPreview(); },
          true);
      }
    } catch (e) {}
  }

  function triggerSnippetExpansion(cm, mode) {
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const lineBefore = line.substring(0, cursor.ch);
    if (lineBefore.length > 0 && /\s/.test(lineBefore[lineBefore.length - 1])) return false;
    const words = lineBefore.trim().split(/\s+/);
    const lastWord = words[words.length - 1] || "";

    let langKey = "html";
    if (mode === "javascript") langKey = "js";
    else if (mode === "css") langKey = "css";
    else {
      // HTML editor: inside <style> use CSS snippets, inside <script>
      // use JS snippets (same lists as the CSS / JS tabs).
      const innerLang = getHtmlCursorLang(cm);
      if (innerLang === "css") langKey = "css";
      else if (innerLang === "js") langKey = "js";
    }

    if (customSnippets[langKey] && customSnippets[langKey][lastWord]) {
      // Values are normalized by mergeSnippets, but re-normalize here too:
      // an empty / non-string value must not delete the trigger word.
      let snippetTpl = normalizeSnippetValue(customSnippets[langKey][lastWord]);
      if (!snippetTpl) return false;
      const indentMatch = line.match(/^([ \t]*)/);
      let baseIndent = indentMatch ? indentMatch[1] : '';

      let formattedSnippet = snippetTpl.split('\n').map((l, idx) => idx === 0 ? l : baseIndent + l).join('\n');
      let startCh = cursor.ch - lastWord.length;

      cm.replaceRange(formattedSnippet, {line: cursor.line, ch: startCh}, cursor);
      return true;
    }
    return false;
  }

  // Is the ">" at gtPos closing a real tag (<div>, </div>, <a href="..">)?
  // Scan backwards for its "<". A ">" that closes a tag is not an Emmet
  // operator: <div>hi must extract "hi", not "div>hi".
  function isTagClosingBracket(line, gtPos) {
    let j = gtPos - 1;
    let q = null;
    while (j >= 0) {
      const c = line[j];
      if (q) {
        if (c === q && line[j - 1] !== "\\") q = null;
        j--;
        continue;
      }
      if (c === '"' || c === "'") { q = c; j--; continue; }
      if (c === "<") {
        const after = line[j + 1] || "";
        return /[A-Za-z\/!?]/.test(after);
      }
      if (c === ">" || c === "\n") return false;
      j--;
    }
    return false;
  }

  function extractEmmetAbbr(lineBefore) {
    if (!lineBefore) return "";
    let i = lineBefore.length - 1;
    let square = 0, brace = 0, paren = 0;
    let inSingle = false, inDouble = false;
    while (i >= 0) {
      const ch = lineBefore[i];
      const prev = i > 0 ? lineBefore[i - 1] : "";
      if (inSingle) { if (ch === "'" && prev !== "\\") inSingle = false; i--; continue; }
      if (inDouble) { if (ch === '"' && prev !== "\\") inDouble = false; i--; continue; }
      if (ch === "'") {
        if (square > 0 || brace > 0 || paren > 0) { inSingle = true; i--; continue; }
        break;
      }
      if (ch === '"') {
        if (square > 0 || brace > 0 || paren > 0) { inDouble = true; i--; continue; }
        break;
      }
      if (ch === "]") { square++; i--; continue; }
      if (ch === "[") { if (square > 0) square--; i--; continue; }
      if (ch === "}") { brace++; i--; continue; }
      if (ch === "{") { if (brace > 0) brace--; i--; continue; }
      if (ch === ")") { paren++; i--; continue; }
      if (ch === "(") { if (paren > 0) paren--; i--; continue; }
      if (square > 0 || brace > 0 || paren > 0) { i--; continue; }
      // A ">" that closes a real tag ends the abbreviation: the text
      // after it is content, not part of an abbreviation that starts
      // with the tag name. <div>hi -> "hi", not "div>hi".
      if (ch === ">" && isTagClosingBracket(lineBefore, i)) break;
      if (/[A-Za-z0-9\-_.\#\>\+\^\*\:\$\@\!]/.test(ch)) { i--; continue; }
      break;
    }
    return lineBefore.slice(i + 1);
  }
  function isValidEmmetAbbr(abbr) {
    if (!abbr) return false;
    // G15: full-document abbreviations are not Emmet abbreviations anymore.
    // Must come before the "!" operator check below, or "!" would pass.
    if (abbr === "!" || abbr === "html:5" || abbr === "html:5!") return false;
    // Incomplete operator at end (no right-hand side): do not expand.
    // e.g. "div>", "div+", "div^", "div*" then Tab must not duplicate a tag.
    if (/[>\+\^\*]$/.test(abbr)) return false;
    if (!/[A-Za-z.!#(\[]/.test(abbr)) return false;
    if (/[>\+\^\*\.\#\[\{\(\)!]/.test(abbr)) return true;
    const low = abbr.toLowerCase();
    if (EMMET_KNOWN_TAGS.has(low)) return true;
    // Type shorthand: input:checkbox, input:text, button:submit, form:post.
    // ":" is the only operator here, so the operator check above misses it.
    // Only accept when the part before ":" is a known tag, so normal
    // text like "note:hi" never triggers a preview.
    const colon = low.indexOf(":");
    if (colon > 0 && EMMET_KNOWN_TAGS.has(low.slice(0, colon)) && /^[a-z][a-z0-9\-_]*$/.test(low.slice(colon + 1))) return true;
    if (/^lorem\d*$/.test(low)) return true;
    if (/^[a-z][a-z0-9]*-[a-z0-9\-]+$/.test(low)) return true;
    return false;
  }
  function triggerEmmetExpansion(cm, mode) {
    if (mode === "css") return triggerCssEmmetExpansion(cm);
    if (mode !== "htmlmixed" && mode !== "html") return false;
    // Inside <style> in the HTML editor, use CSS Emmet (same as CSS tab).
    // Inside <script> there is no JS Emmet (same as JS tab), so Tab indents.
    const innerLang = getHtmlCursorLang(cm);
    if (innerLang === "css") return triggerCssEmmetExpansion(cm);
    if (innerLang === "js") return false;
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const lineBefore = line.substring(0, cursor.ch);
    // Same rule as the live preview: never expand inside a tag, quoted
    // string, comment, or raw-text block, or a hex color in style="..."
    // or inside a <style> block would be replaced by <div id="...">.
    const textBefore = typeof cm.getRange === "function"
      ? cm.getRange({ line: 0, ch: 0 }, cursor)
      : lineBefore;
    if (!isEmmetPositionAllowed(textBefore)) return false;
    const abbr = extractEmmetAbbr(lineBefore);
    if (!abbr) return false;
    if (!isValidEmmetAbbr(abbr)) return false;
    const beforeAbbr = line.substring(0, cursor.ch - abbr.length);
    let startCh, baseIndent;
    if (beforeAbbr.trim() === "") { startCh = 0; baseIndent = beforeAbbr; }
    else { startCh = cursor.ch - abbr.length; baseIndent = ""; }
    let expanded;
    if (abbr === "!" || abbr === "html:5" || abbr === "html:5!") expanded = expandEmmet(abbr, "");
    else expanded = expandEmmet(abbr, baseIndent);
    if (!expanded || expanded === abbr) return false;
    cm.replaceRange(expanded, {line: cursor.line, ch: startCh}, cursor);
    hideEmmetPreview();
    return true;
  }

  function setupSmartEditorFeatures(cm, mode) {
    // CSS: no live preview popup, only Emmet Tab expansion. HTML keeps preview.
    if (mode !== "css") setupEmmetLivePreview(cm, mode);
    const extraKeys = cm.getOption("extraKeys") || {};
    extraKeys["Ctrl-/"] = function(cm) { toggleCustomComment(); };
    extraKeys["Cmd-/"] = function(cm) { toggleCustomComment(); };

    // Alt+S = snippets, Tab = Emmet/indent. Keeps the two from conflicting.
    extraKeys["Alt-S"] = function(cm) { triggerSnippetExpansion(cm, mode); };
    extraKeys["Alt-s"] = function(cm) { triggerSnippetExpansion(cm, mode); };

    extraKeys["Tab"] = function(cm) {
      if (triggerEmmetExpansion(cm, mode)) {
        return;
      }

      if (cm.somethingSelected()) {
        cm.indentSelection("add");
      } else {
        cm.replaceRange("  ", cm.getCursor(), null, "+input");
      }
    };

    cm.setOption("extraKeys", extraKeys);
  }

  setupSmartEditorFeatures(window.htmlEditor, "htmlmixed");
  setupSmartEditorFeatures(window.cssEditor, "css");
  setupSmartEditorFeatures(window.jsEditor, "javascript");

  const editSnippetsBtn = document.getElementById("menu-snippets-edit-btn");
  const saveSnippetsBtn = document.getElementById("menu-snippets-save-btn");

  if (editSnippetsBtn) {
    editSnippetsBtn.addEventListener("click", () => {
      let currentJsonStr = JSON.stringify(customSnippets, null, 2);

      showEditorTab("js-tab", "js-pane");

      if (window.jsEditor) {
        // Backup JS first; skip if snippets JSON is already open.
        try {
          const _curJs = window.jsEditor.getValue();
          let _isSnippetsJson = false;
          try { const _p = JSON.parse(_curJs.trim()); if (_p && typeof _p === 'object' && ('js' in _p || 'html' in _p || 'css' in _p)) _isSnippetsJson = true; } catch (e) {}
          if (!_isSnippetsJson) {
            window._snippetsJsBackup = _curJs;
            try { localStorage.setItem("sandbox_js_backup_before_snippets", _curJs); } catch (e) {}
          }
        } catch (e) {}
        window.jsEditor.setValue(currentJsonStr);
        window.jsEditor.setOption("mode", "javascript");
        window.jsEditor.refresh();
      }

      alert("Snippets JSON loaded.\nSave to bring your JS back.");
    });
  }

  if (saveSnippetsBtn) {
    saveSnippetsBtn.addEventListener("click", () => {
      if (!window.jsEditor) return;
      let editorContent = window.jsEditor.getValue().trim();

      try {
        let parsed = JSON.parse(editorContent);
        customSnippets = mergeSnippets(parsed);
        localStorage.setItem("sandbox_custom_snippets", JSON.stringify(customSnippets, null, 2));
        // Restore backed-up JS.
        const _backup = window._snippetsJsBackup !== undefined ? window._snippetsJsBackup : localStorage.getItem("sandbox_js_backup_before_snippets");
        if (_backup !== null && _backup !== undefined) {
          window.jsEditor.setValue(_backup);
          window._snippetsJsBackup = undefined;
          try { localStorage.removeItem("sandbox_js_backup_before_snippets"); } catch (e) {}
          alert("Snippets saved.\nYour JS code is back.");
        } else {
          alert("Snippets saved.");
        }
      } catch (e) {
        alert("Invalid JSON.\nCheck brackets and quotes.");
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
      e.target.value = ""; // Allow re-importing the same file.
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          let parsed = JSON.parse(event.target.result);
          // Check first: must be a real snippets file (js/html/css
          // sections as objects). A backup file or random JSON is rejected.
          if (!isValidSnippetsFile(parsed)) {
            alert("Invalid snippets file.\nThis is not a snippets backup.\nCheck that the file has js / html / css sections.");
            return;
          }
          // Then format, then load.
          customSnippets = formatSnippetsForExport(mergeSnippets(parsed));
          localStorage.setItem("sandbox_custom_snippets", JSON.stringify(customSnippets, null, 2));
          alert("Snippets file imported.");
        } catch (err) {
          alert("Invalid JSON file.");
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
      // Programming ligatures are "calt", not "liga". font-variant-ligatures
      // alone does not turn calt off in Chrome, so set both.
      el.style.setProperty('font-feature-settings', finalLigToggleState ? '"liga" 1, "calt" 1' : '"liga" 0, "calt" 0', 'important');
    });
    if (window.htmlEditor) window.htmlEditor.refresh();
    if (window.cssEditor) window.cssEditor.refresh();
    if (window.jsEditor) window.jsEditor.refresh();
  }, 50);

  // Whitespace-only stored value = empty. (A textarea that once held
  // indentation used to seed editors with invisible spaces; ignore those.)
  const _savedHtml = localStorage.getItem("sandbox_html");
  if (_savedHtml && _savedHtml.trim()) window.htmlEditor.setValue(_savedHtml);
  const _savedCss = localStorage.getItem("sandbox_css");
  if (_savedCss && _savedCss.trim()) window.cssEditor.setValue(_savedCss);
  const _savedJs = localStorage.getItem("sandbox_js");
  if (_savedJs && _savedJs.trim()) window.jsEditor.setValue(_savedJs);

  // Recovery: if a previous session ended while the Snippets JSON was
  // open, sandbox_js may hold that JSON instead of real code. The backup
  // from Edit Snippets is authoritative - restore it once.
  try {
    const _bk = localStorage.getItem("sandbox_js_backup_before_snippets");
    if (_bk !== null && _bk !== undefined) {
      const _cur = window.jsEditor.getValue();
      let _isSnip = false;
      try { const _p = JSON.parse(_cur.trim()); if (_p && typeof _p === 'object' && ('js' in _p || 'html' in _p || 'css' in _p)) _isSnip = true; } catch (e) {}
      if (_isSnip) {
        window.jsEditor.setValue(_bk);
        window._snippetsJsBackup = _bk;
        try { localStorage.setItem("sandbox_js", _bk); } catch (e) {}
        try { localStorage.removeItem("sandbox_js_backup_before_snippets"); } catch (e) {}
      }
    }
  } catch (e) {}

  const splitter = document.getElementById("drag-splitter");
  const editorSection = document.getElementById("editor-section");
  const previewSection = document.getElementById("preview-section");
  const workspaceRow = document.getElementById("workspace-row");

  if (savedPreviewOnTop && workspaceRow) {
    workspaceRow.classList.add("preview-on-top");
  }

  // Splitter: guarded, handles swapped layout, releases on cancel.
  let isDragging = false;
  function stopDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    try { splitter.releasePointerCapture(e.pointerId); } catch (err) {}
    refreshEditors();
  }
  if (splitter && workspaceRow && editorSection && previewSection) {
    splitter.addEventListener("pointerdown", (e) => {
      isDragging = true;
      try { splitter.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    splitter.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const rect = workspaceRow.getBoundingClientRect();
      let percentage = ((e.clientY - rect.top) / rect.height) * 100;
      percentage = Math.max(15, Math.min(85, percentage));
      // Swapped layout: percentage measures the preview, not the editor.
      const onTop = workspaceRow.classList.contains("preview-on-top");
      editorSection.style.height = (onTop ? 100 - percentage : percentage) + "%";
      previewSection.style.height = (onTop ? percentage : 100 - percentage) + "%";
      if (window.htmlEditor) window.htmlEditor.refresh();
      if (window.cssEditor) window.cssEditor.refresh();
      if (window.jsEditor) window.jsEditor.refresh();
    });
    splitter.addEventListener("pointerup", stopDrag);
    splitter.addEventListener("pointercancel", stopDrag);
  }

  const hamburgerBtn = document.getElementById("hamburger-btn");
  if (hamburgerBtn && workspaceRow) {
    hamburgerBtn.addEventListener("click", () => {
      workspaceRow.classList.toggle("preview-on-top");
      const isPreviewOnTop = workspaceRow.classList.contains("preview-on-top");
      localStorage.setItem("sandbox_preview_on_top", isPreviewOnTop);

      setTimeout(() => {
        if (window.htmlEditor) window.htmlEditor.refresh();
        if (window.cssEditor) window.cssEditor.refresh();
        if (window.jsEditor) window.jsEditor.refresh();
      }, 50);
    });
    // Keyboard support: the hamburger is a div, not a <button>, so
    // Enter / Space must do the same as a click.
    hamburgerBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hamburgerBtn.click(); }
    });
  }

  // Enter inside "" must be a plain newline: CodeMirror's smart indent
  // aligns the new line to the attribute column, giving a huge indent.
  // Detect "inside quotes" by scanning from line start: track quote
  // state, skip comments, treat ' between letters as an apostrophe.
  function isCursorInsideQuote(cm, cursor) {
    const text = cm.getRange({ line: cursor.line, ch: 0 }, cursor);
    let quote = null;
    let inComment = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inComment) {
        if (text.startsWith("-->", i)) { inComment = false; i += 2; }
        continue;
      }
      if (quote) {
        if (ch === quote && text[i - 1] !== "\\") quote = null;
        continue;
      }
      if (text.startsWith("<!--", i)) { inComment = true; i += 3; continue; }
      if (ch === '"' || ch === "'") {
        // ' between two letters is an apostrophe (don't, it's), not a quote.
        if (ch === "'" && /[A-Za-z]/.test(text[i - 1] || "") && /[A-Za-z]/.test(text[i + 1] || "")) continue;
        quote = ch;
      }
    }
    return quote !== null;
  }

  function enableAutoCloseBrackets(editor) {
    editor.setOption("autoCloseBrackets", false);

    editor.on("keydown", function(cm, event) {
      if (event.key === "Enter") {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const charBefore = line.charAt(cursor.ch - 1);
        const charAfter = line.charAt(cursor.ch);

        // Enter inside "" -> plain newline + base indent only. No tag/bracket
        // logic: a > inside quotes must not be treated as a tag end.
        if (isCursorInsideQuote(cm, cursor)) {
          event.preventDefault();
          const _bi = (line.match(/^([ \t]*)/) || ["", ""])[1];
          cm.replaceRange("\n" + _bi, cursor);
          cm.setCursor({ line: cursor.line + 1, ch: _bi.length });
          return;
        }

        if (
          (charBefore === '{' && charAfter === '}') ||
          (charBefore === '(' && charAfter === ')') ||
          (charBefore === '[' && charAfter === ']') ||
          (charBefore === '`' && charAfter === '`')
        ) {
          event.preventDefault();
          const indentMatch = line.match(/^([ \t]*)/);
          const baseIndent = indentMatch ? indentMatch[1] : '';
          const innerIndent = baseIndent + "  ";

          const replacement = `\n${innerIndent}\n${baseIndent}`;
          cm.replaceRange(replacement,
            { line: cursor.line, ch: cursor.ch },
            { line: cursor.line, ch: cursor.ch });
          cm.setCursor({ line: cursor.line + 1, ch: innerIndent.length });
          return;
        }

        const lineBefore = line.substring(0, cursor.ch);
        const lineAfter = line.substring(cursor.ch);
        const openTagMatch = lineBefore.match(/<([a-zA-Z0-9\-]+)(?:\s+[^>]*)?>$/);
        if (openTagMatch) {
          const tagName = openTagMatch[1].toLowerCase();
          const selfClosingTags = ['area',
            'base',
            'br',
            'col',
            'embed',
            'hr',
            'img',
            'input',
            'link',
            'meta',
            'source',
            'track',
            'wbr'];
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
        const pairs = { '{': '}', '(': ')', '[': ']', '"': '"', "'": "'", '`': '`' };
        if (pairs[typedChar]) {
          const _lineText = cm.getLine(change.from.line) || "";
          const _nextCh = _lineText.charAt(change.from.ch);
          const _charBefore = _lineText.charAt(change.from.ch - 1);
          const _hasSel = change.from.line !== change.to.line || change.from.ch !== change.to.ch;
          // Overtype: if the same closing char is ahead, move over it instead of adding another one.
          if (!_hasSel && (typedChar === ')' || typedChar === ']' || typedChar === '}' || typedChar === '"' || typedChar === "'" || typedChar === '`') && _nextCh === typedChar) {
            change.cancel();
            emmetOvertypePending = true;
            setTimeout(() => { cm.setCursor({ line: change.from.line, ch: change.from.ch + 1 }); }, 1);
            return;
          }
          // Do not auto-close a quote in the middle of a word, like don't.
          if (!_hasSel && (typedChar === '"' || typedChar === "'") && /[A-Za-z0-9_$]/.test(_charBefore)) return;
          // Wrap selection instead of deleting it.
          if (_hasSel) {
            const _sel = cm.getSelection();
            change.update(change.from, change.to, [typedChar + _sel + pairs[typedChar]], change.from);
            setTimeout(() => { const cur = cm.getCursor(); cm.setCursor({ line: cur.line, ch: cur.ch - 1 }); }, 1);
            return;
          }
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

  let isAutoClosingTag = false;
  window.htmlEditor.on("change", function(cm, change) {
    if (isAutoClosingTag) return;
    if (change.origin !== "+input" && change.origin !== "paste") return;
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);

    const braceIdx = line.lastIndexOf('{', cursor.ch);
    if (braceIdx !== -1) {
      const nextClose = line.indexOf('}', braceIdx);
      if (nextClose === -1 || nextClose >= cursor.ch) return;
    }

    // Do not auto-close inside an HTML comment: `<!-- <div> -->` used to
    // gain a stray `</div>` inside the comment.
    const beforeCursor = line.substring(0, cursor.ch);
    if (beforeCursor.lastIndexOf("<!--") > beforeCursor.lastIndexOf("-->")) return;

    const textBeforeCursor = line.substring(0, cursor.ch);
    const match = textBeforeCursor.match(/<([a-zA-Z0-9\-]+)(?:\s+[^>]*)?>$/);
    if (match) {
      const tagName = match[1].toLowerCase();
      const selfClosingTags = ['area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'source',
        'track',
        'wbr'];
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

  function parseColorString(str) {
    str = str.trim().toLowerCase();
    if (str.startsWith('#')) {
      let hex = str.substring(1);
      if (hex.length === 3 || hex.length === 4) {
        hex = hex.substring(0, 3).split('').map(c => c + c).join('');
      } else if (hex.length === 8) {
        hex = hex.substring(0, 6);
      }
      if (hex.length >= 6 && /^[0-9a-f]{6}$/.test(hex.substring(0, 6))) {
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

  const colorInput = document.getElementById("colorInsertInput");
  const colorRgbBtn = document.getElementById("color-rgb-btn");
  const colorHexBtn = document.getElementById("color-hex-btn");
  const colorHslBtn = document.getElementById("color-hsl-btn");
  const colorClearBtn = document.getElementById("color-clear-btn");

  function convertColorAtCursor(targetFormat) {
    const activeTab = document.querySelector('#sandboxTabs .nav-link.active');
    if (!activeTab) return;
    let editor = null;
    if (activeTab.id === 'html-tab') editor = window.htmlEditor;
    else if (activeTab.id === 'css-tab') editor = window.cssEditor;
    else if (activeTab.id === 'js-tab') editor = window.jsEditor;
    if (!editor) return;

    const manualColorVal = colorInput ? colorInput.value.trim() : "";

    let rgbObj = null;
    let lineNum, startCh, endCh;
    const cursor = editor.getCursor();
    lineNum = cursor.line;
    const line = editor.getLine(lineNum);
    const ch = cursor.ch;

    const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b|#[0-9a-fA-F]{8}\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\)|hsla?\(\s*[\d.]+\s*,\s*[\d.]+(?:%|\s*),\s*[\d.]+(?:%|\s*)(?:,\s*[\d.]+\s*)?\)/g;
    let match;
    let targetMatch = null;

    if (manualColorVal) {
      rgbObj = parseColorString(manualColorVal);
    }

    if (!rgbObj) {
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
          if (dist < minDistance && dist <= 4) {
            minDistance = dist;
            targetMatch = { text: match[0], start, end };
          }
        }
      }

      if (targetMatch) {
        rgbObj = parseColorString(targetMatch.text);
        startCh = targetMatch.start;
        endCh = targetMatch.end;
      }
    } else {
      while ((match = colorRegex.exec(line)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (ch >= start && ch <= end) {
          targetMatch = { text: match[0], start, end };
          break;
        }
      }
      if (targetMatch) {
        startCh = targetMatch.start;
        endCh = targetMatch.end;
      } else {
        startCh = ch;
        endCh = ch;
      }
    }

    if (!rgbObj) {
      alert("Enter a valid color\nor place cursor on a color code.");
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
      const hStr = Number(hsl.h.toFixed(1));
      const sStr = Number(hsl.s.toFixed(2));
      const lStr = Number(hsl.l.toFixed(2));
      newColorStr = `hsl(${hStr}, ${sStr}%, ${lStr}%)`;
    }

    if (newColorStr) {
      editor.replaceRange(newColorStr, { line: lineNum, ch: startCh }, { line: lineNum, ch: endCh });
      editor.setCursor({ line: lineNum, ch: startCh + newColorStr.length });

      if (colorInput) {
        colorInput.value = newColorStr;
        colorInput.dispatchEvent(new Event('input'));
      }
    }
  }

  if (colorRgbBtn) colorRgbBtn.addEventListener("click", () => convertColorAtCursor('rgb'));
  if (colorHexBtn) colorHexBtn.addEventListener("click", () => convertColorAtCursor('hex'));
  if (colorHslBtn) colorHslBtn.addEventListener("click", () => convertColorAtCursor('hsl'));

  if (colorClearBtn && colorInput) {
    colorClearBtn.addEventListener("click", () => {
      colorInput.value = "";
      colorInput.dispatchEvent(new Event('input'));
      colorInput.focus();
    });
  }

  if (colorInput) {
    colorInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      const rgb = parseColorString(val);

      if (rgb) {
        colorInput.style.setProperty('background-color', val, 'important');
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

        if (brightness < 128) {
          colorInput.style.setProperty('color', '#ffffff', 'important');
          colorInput.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.5)', 'important');
          colorInput.style.setProperty('--bs-placeholder-color', 'rgba(255, 255, 255, 0.6)', 'important');
        } else {
          colorInput.style.setProperty('color', '#000000', 'important');
          colorInput.style.setProperty('border', '1px solid rgba(0, 0, 0, 0.4)', 'important');
          colorInput.style.setProperty('--bs-placeholder-color', 'rgba(0, 0, 0, 0.6)', 'important');
        }
      } else {
        colorInput.style.removeProperty('background-color');
        colorInput.style.removeProperty('color');
        colorInput.style.removeProperty('border');
        colorInput.style.removeProperty('--bs-placeholder-color');
      }
    });
  }

  // Format post-step: reset indentation inside multi-line quoted
  // attribute values. html_beautify leaves string content untouched, so
  // a spurious indent (e.g. from Enter inside "") survives Format.
  // Each continuation line inside a quoted attr value is re-indented to
  // the tag's base indent. Comments and script/style/textarea/title
  // content are left alone (their whitespace is meaningful).
  function normalizeMultilineAttrIndent(html) {
    const out = [];
    const n = html.length;
    let i = 0;
    while (i < n) {
      if (html.startsWith("<!--", i)) {
        const end = html.indexOf("-->", i + 4);
        const stop = end === -1 ? n : end + 3;
        out.push(html.slice(i, stop));
        i = stop;
        continue;
      }
      if (html[i] !== "<") {
        const nl = html.indexOf("<", i);
        if (nl === -1) { out.push(html.slice(i)); break; }
        out.push(html.slice(i, nl));
        i = nl;
        continue;
      }
      // Tag starts at i. Base indent = leading whitespace of this line.
      let ls = i;
      while (ls > 0 && html[ls - 1] !== "\n") ls--;
      let baseIndent = "";
      let k = ls;
      while (k < n && (html[k] === " " || html[k] === "\t")) { baseIndent += html[k]; k++; }
      // Raw-text tag? Normalize only its opening tag, copy content verbatim.
      const rm = /^<\s*(script|style|textarea|title)\b/i.exec(html.slice(i, i + 40));
      const rawTag = rm ? rm[1].toLowerCase() : null;
      // Scan the (opening) tag, resetting continuation lines inside quotes.
      let j = i;
      let q = null;
      out.push("<");
      j = i + 1;
      while (j < n) {
        const c = html[j];
        if (q) {
          if (c === q && html[j - 1] !== "\\") { q = null; out.push(c); j++; continue; }
          if (c === "\n") {
            out.push("\n");
            j++;
            while (j < n && (html[j] === " " || html[j] === "\t")) j++;
            out.push(baseIndent);
            continue;
          }
          out.push(c);
          j++;
          continue;
        }
        if (c === '"' || c === "'") { q = c; out.push(c); j++; continue; }
        if (c === ">") { out.push(c); j++; break; }
        out.push(c);
        j++;
      }
      i = j;
      if (rawTag) {
        const closeRe = new RegExp("</" + rawTag + "\\s*>", "i");
        const rest = html.slice(i);
        const cm = closeRe.exec(rest);
        if (cm) { out.push(rest.slice(0, cm.index + cm[0].length)); i += cm.index + cm[0].length; }
        else { out.push(rest); i = n; }
      }
    }
    return out.join("");
  }

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
      if (editorType === 'html') {
        if (typeof html_beautify === 'function') {
          formattedCode = html_beautify(rawCode, { indent_size: 2, wrap_line_length: 80 });
        }
        formattedCode = normalizeMultilineAttrIndent(formattedCode);
      } else if (editorType === 'css' && typeof css_beautify === 'function') {
        formattedCode = css_beautify(rawCode, { indent_size: 2 });
      } else if (editorType === 'js' && typeof js_beautify === 'function') {
        formattedCode = js_beautify(rawCode, { indent_size: 2, space_after_anon_function: true });
      }
      if (formattedCode !== rawCode) targetEditor.setValue(formattedCode);
    }
  }

  // Format a COPY for export/download/backup/restore. Never touches the
  // editor. Same formatter + same options as the Format button.
  // If formatting fails, the raw code is returned, so export never breaks.
  function formatCodeForExport(rawCode, editorType) {
    try {
      let out = rawCode || "";
      if (editorType === 'html') {
        if (typeof html_beautify === 'function') {
          out = html_beautify(out, { indent_size: 2, wrap_line_length: 80 });
        }
        out = normalizeMultilineAttrIndent(out);
      } else if (editorType === 'css' && typeof css_beautify === 'function') {
        out = css_beautify(out, { indent_size: 2 });
      } else if (editorType === 'js' && typeof js_beautify === 'function') {
        out = js_beautify(out, { indent_size: 2, space_after_anon_function: true });
      }
      return out;
    } catch (e) {
      return rawCode;
    }
  }

  // Format every snippet body by its section language. Returns a new
  // object. A body that fails to format keeps its original text.
  function formatSnippetsForExport(snippets) {
    try {
      if (!snippets || typeof snippets !== "object") return snippets;
      const out = {};
      for (const section of ["js", "html", "css"]) {
        const obj = snippets[section];
        if (!obj || typeof obj !== "object") { out[section] = {}; continue; }
        out[section] = {};
        for (const k of Object.keys(obj)) {
          out[section][k] = formatCodeForExport(normalizeSnippetValue(obj[k]), section);
        }
      }
      return out;
    } catch (e) {
      return snippets;
    }
  }

  // Snippets upload check: must be a real snippets file, not a backup
  // or random JSON. Sections must be objects, never code strings.
  function isValidSnippetsFile(parsed) {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    if (parsed.js === undefined && parsed.html === undefined && parsed.css === undefined) return false;
    for (const section of ["js", "html", "css"]) {
      const obj = parsed[section];
      if (obj === undefined) continue;
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    }
    return true;
  }

  // Format a complete HTML document (download / view source). Formatting
  // the fragments alone misaligns them against the shell, so the whole
  // assembled document is beautified once. Falls back to raw on failure.
  function formatFullDocument(doc) {
    try {
      if (typeof html_beautify === 'function') {
        return html_beautify(doc, { indent_size: 2, wrap_line_length: 80 });
      }
    } catch (e) {}
    return doc;
  }

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      formatCurrentEditor();
    }
  });

  const headerFormatBtn = document.getElementById("header-format-btn");
  if (headerFormatBtn) headerFormatBtn.addEventListener("click", formatCurrentEditor);

  // Real JS code: if the JS editor is showing snippets JSON (snippet-edit mode),
  // return the backed-up JS instead, so Download/Share never export snippets JSON.
  function getRealJsCode() {
    try {
      const cur = window.jsEditor ? window.jsEditor.getValue() : "";
      let isSnippetsJson = false;
      try { const p = JSON.parse(cur.trim()); if (p && typeof p === "object" && ("js" in p || "html" in p || "css" in p)) isSnippetsJson = true; } catch (e) {}
      if (isSnippetsJson) {
        if (typeof window._snippetsJsBackup === "string") return window._snippetsJsBackup;
        try { const b = localStorage.getItem("sandbox_js_backup_before_snippets"); if (typeof b === "string") return b; } catch (e) {}
        return "";
      }
      return cur;
    } catch (e) { return window.jsEditor ? window.jsEditor.getValue() : ""; }
  }

  const headerShareBtn = document.getElementById("header-share-btn");
  if (headerShareBtn) {
    headerShareBtn.addEventListener("click", () => {
      const payload = {
        html: window.htmlEditor.getValue(),
        css: window.cssEditor.getValue(),
        js: getRealJsCode(),
        framework: localStorage.getItem("sandbox_framework") || "none",
        frameworkLabel: localStorage.getItem("sandbox_framework_label") || "None (Vanilla CSS)"
      };
      try {
        const jsonStr = JSON.stringify(payload);
        const bytes = new TextEncoder().encode(jsonStr);
        let bin = "";
        bytes.forEach((b) => (bin += String.fromCharCode(b)));
        const base64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const shareUrl = window.location.origin + window.location.pathname + '#code=' + base64;
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert("Share link copied.");
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
      // Raw fragments: the WHOLE document is formatted once below, so
      // shell + style + body + script all align. Editor code stays untouched.
      const htmlCode = window.htmlEditor.getValue();
      const cssCode = window.cssEditor.getValue();
      const jsCode = getRealJsCode();
      const framework = localStorage.getItem("sandbox_framework") || "none";
      const frameworkCDNTag = getFrameworkCDN(framework);

      let fullDocument = `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(getProjectTitle())}</title>
      ${frameworkCDNTag}
      <style>${cssCode.replace(/<\/style>/gi, '<\\/style>')}</style>
      </head>
      <body>
      ${htmlCode}
      <script>${jsCode.replace(/<\/script>/gi, '<\\/script>')}</script>
      </body>
      </html>`;
      fullDocument = formatFullDocument(fullDocument);

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

  function getActiveEditorAndMode() {
    const activeTab = document.querySelector('#sandboxTabs .nav-link.active');
    if (!activeTab) return { editor: null, mode: null };
    if (activeTab.id === 'html-tab') return { editor: window.htmlEditor, mode: 'htmlmixed' };
    if (activeTab.id === 'css-tab') return { editor: window.cssEditor, mode: 'css' };
    if (activeTab.id === 'js-tab') return { editor: window.jsEditor, mode: 'javascript' };
    return { editor: null, mode: null };
  }

  const cmdModal = document.getElementById("commandPaletteModal");
  const cmdInput = document.getElementById("commandPaletteInput");
  const cmdList = document.getElementById("commandPaletteList");
  const cmdCloseBtn = document.getElementById("commandPaletteClose");
  const headerCmdBtn = document.getElementById("header-cmd-btn");

  let isEditorZen = false;
  let isPreviewZen = false;

  function toggleEditorZen() {
    // Exit the other zen first, so its saved heights are restored before
    // this zen saves them (zen -> zen used to corrupt both heights).
    if (isPreviewZen) togglePreviewZen();
    isEditorZen = !isEditorZen;
    isPreviewZen = false;
    if (editorSection && previewSection) {
      if (isEditorZen) {
        window._preZenEditorHeight = editorSection.style.height || "48%";
        window._preZenPreviewHeight = previewSection.style.height || "48%";
        editorSection.style.height = "100%";
        editorSection.style.display = "flex";
        previewSection.classList.add("d-none");
        if (splitter) splitter.style.display = "none";
      } else {
        editorSection.style.height = window._preZenEditorHeight || "48%";
        previewSection.style.height = window._preZenPreviewHeight || "48%";
        editorSection.style.display = "flex";
        previewSection.classList.remove("d-none");
        if (splitter) splitter.style.display = "";
      }
      refreshEditors();
    }
  }

  function togglePreviewZen() {
    if (isEditorZen) toggleEditorZen();
    isPreviewZen = !isPreviewZen;
    isEditorZen = false;
    if (editorSection && previewSection) {
      if (isPreviewZen) {
        window._preZenEditorHeight = editorSection.style.height || "48%";
        window._preZenPreviewHeight = previewSection.style.height || "48%";
        previewSection.style.height = "100%";
        previewSection.style.display = "flex";
        editorSection.classList.add("d-none");
        if (splitter) splitter.style.display = "none";
      } else {
        previewSection.style.height = window._preZenPreviewHeight || "48%";
        editorSection.style.height = window._preZenEditorHeight || "48%";
        editorSection.style.display = "flex";
        previewSection.style.display = "flex";
        editorSection.classList.remove("d-none");
        if (splitter) splitter.style.display = "";
      }
      refreshEditors();
    }
  }

  const commands = [
    {
      id: "expand-snippet",
      title: "Expand Snippet (At Cursor)",
      category: "Editor",
      shortcut: "Alt + S",
      action: () => {
        const { editor, mode } = getActiveEditorAndMode();
        if (editor) {
          editor.focus();
          triggerSnippetExpansion(editor, mode);
        }
      }
    },
    {
      id: "expand-emmet",
      title: "Expand Emmet Abbreviation (HTML)",
      category: "Editor",
      shortcut: "Tab",
      action: () => {
        const { editor } = getActiveEditorAndMode();
        if (editor) {
          editor.focus();
          triggerEmmetExpansion(editor, "htmlmixed");
        }
      }
    },
    {
      id: "expand-emmet-css",
      title: "Expand Emmet Abbreviation (CSS)",
      category: "Editor",
      shortcut: "Tab",
      action: () => {
        const { editor } = getActiveEditorAndMode();
        if (editor) {
          editor.focus();
          triggerCssEmmetExpansion(editor);
        }
      }
    },
    {
      id: "expand-all-css-emmet",
      title: "Expand All CSS Emmet in File",
      category: "Editor",
      shortcut: "Ctrl + Shift + E",
      action: () => {
        const { editor, mode } = getActiveEditorAndMode();
        if (editor) {
          editor.focus();
          if (mode === "css") expandAllCssEmmet(editor);
          else triggerCssEmmetExpansion(editor);
        }
      }
    },
    {
      id: "fold-at-cursor",
      title: "Fold Code at Cursor",
      category: "Editor",
      shortcut: "Ctrl + Shift + [",
      action: () => {
        const { editor, mode } = getActiveEditorAndMode();
        if (editor) { editor.focus(); foldAtCursor(editor, mode); }
      }
    },
    {
      id: "unfold-at-cursor",
      title: "Unfold Code at Cursor",
      category: "Editor",
      shortcut: "Ctrl + Shift + ]",
      action: () => {
        const { editor, mode } = getActiveEditorAndMode();
        if (editor) { editor.focus(); unfoldAtCursor(editor, mode); }
      }
    },
    {
      id: "fold-all",
      title: "Fold All Code",
      category: "Editor",
      shortcut: "Ctrl + Shift + 0",
      action: () => {
        const { editor, mode } = getActiveEditorAndMode();
        if (editor) { editor.focus(); foldAll(editor, mode); }
      }
    },
    {
      id: "unfold-all",
      title: "Unfold All Code",
      category: "Editor",
      shortcut: "Ctrl + Shift + 9",
      action: () => {
        const { editor, mode } = getActiveEditorAndMode();
        if (editor) { editor.focus(); unfoldAll(editor, mode); }
      }
    },
    {
      id: "toggle-eruda",
      title: "Toggle Eruda Inspector (Inspect iframe Elements)",
      category: "Debugging",
      shortcut: "",
      action: () => {
        const next = typeof window.toggleEruda === "function" ? window.toggleEruda() : false;
        alert(next ? "Eruda ON.\nTap gear icon in preview." : "Eruda OFF.\nPreview reloaded.");
      }
    },
    {
      id: "toggle-comment",
      title: "Toggle Comment (Active Line / Selection)",
      category: "Editor",
      shortcut: "Ctrl + /",
      action: () => toggleCustomComment()
    },
    {
      id: "format",
      title: "Format Current Code (Beautify)",
      category: "Editor",
      shortcut: "Alt + F",
      action: () => formatCurrentEditor()
    },
    {
      id: "layout-swap",
      title: "Toggle Preview Layout (Preview Top / Bottom)",
      category: "Layout",
      shortcut: "Toolbar Icon",
      action: () => {
        const workspaceRow = document.getElementById("workspace-row");
        if (workspaceRow) {
          workspaceRow.classList.toggle("preview-on-top");
          localStorage.setItem("sandbox_preview_on_top", workspaceRow.classList.contains("preview-on-top"));
          refreshEditors();
        }
      }
    },
    {
      id: "zen-editor",
      title: "Toggle Zen Mode: Editor Panel (Fullscreen)",
      category: "Layout",
      shortcut: "",
      action: () => toggleEditorZen()
    },
    {
      id: "zen-preview",
      title: "Toggle Zen Mode: Preview Panel (Fullscreen)",
      category: "Layout",
      shortcut: "",
      action: () => togglePreviewZen()
    },
    {
      id: "clear-html",
      title: "Clear HTML Editor Only",
      category: "Editor",
      shortcut: "",
      action: () => {
        if (window.htmlEditor) {
          window.htmlEditor.setValue("");
          alert("HTML editor cleared.");
        }
      }
    },
    {
      id: "clear-css",
      title: "Clear CSS Editor Only",
      category: "Editor",
      shortcut: "",
      action: () => {
        if (window.cssEditor) {
          window.cssEditor.setValue("");
          alert("CSS editor cleared.");
        }
      }
    },
    {
      id: "clear-js",
      title: "Clear JavaScript Editor Only",
      category: "Editor",
      shortcut: "",
      action: () => {
        if (window.jsEditor) {
          window.jsEditor.setValue("");
          alert("JavaScript editor cleared.");
        }
      }
    },
    {
      id: "clear-console",
      title: "Clear Console Logs",
      category: "Debugging",
      shortcut: "",
      action: () => typeof window.clearConsole === 'function' && window.clearConsole()
    },
    {
      id: "toggle-wordwrap",
      title: "Toggle Word Wrap",
      category: "Preferences",
      shortcut: "",
      action: () => {
        const toggle = document.getElementById("wordWrapToggle");
        if (toggle) {
          toggle.checked = !toggle.checked;
          toggle.dispatchEvent(new Event("change"));
        }
      }
    },
    {
      id: "toggle-linenums",
      title: "Toggle Line Numbers",
      category: "Preferences",
      shortcut: "",
      action: () => {
        const toggle = document.getElementById("lineNumToggle");
        if (toggle) {
          toggle.checked = !toggle.checked;
          toggle.dispatchEvent(new Event("change"));
        }
      }
    },
    {
      id: "toggle-ligatures",
      title: "Toggle Font Ligatures",
      category: "Preferences",
      shortcut: "",
      action: () => {
        const toggle = document.getElementById("ligaturesToggle");
        if (toggle && !toggle.disabled) {
          toggle.checked = !toggle.checked;
          toggle.dispatchEvent(new Event("change"));
        } else {
          alert("Font ligatures not supported\nby this font.");
        }
      }
    },
    {
      id: "fw-none",
      title: "CSS Framework: None (Vanilla CSS)",
      category: "Appearance",
      shortcut: "",
      action: () => {
        const el = document.querySelector('.framework-option[data-framework="none"]');
        if (el) el.click();
      }
    },
    {
      id: "fw-bootstrap",
      title: "CSS Framework: Bootstrap 5.3",
      category: "Appearance",
      shortcut: "",
      action: () => {
        const el = document.querySelector('.framework-option[data-framework="bootstrap"]');
        if (el) el.click();
      }
    },
    {
      id: "fw-tailwind",
      title: "CSS Framework: Tailwind CSS",
      category: "Appearance",
      shortcut: "",
      action: () => {
        const el = document.querySelector('.framework-option[data-framework="tailwind"]');
        if (el) el.click();
      }
    },
    {
      id: "theme-dracula",
      title: "Editor Theme: Dracula (Dark)",
      category: "Appearance",
      shortcut: "",
      action: () => {
        const el = document.querySelector('.theme-option[data-theme="dracula"]');
        if (el) el.click();
      }
    },
    {
      id: "theme-monokai",
      title: "Editor Theme: Monokai",
      category: "Appearance",
      shortcut: "",
      action: () => {
        const el = document.querySelector('.theme-option[data-theme="monokai"]');
        if (el) el.click();
      }
    },
    {
      id: "theme-default",
      title: "Editor Theme: Default (Light)",
      category: "Appearance",
      shortcut: "",
      action: () => {
        const el = document.querySelector('.theme-option[data-theme="default"]');
        if (el) el.click();
      }
    },
    {
      id: "font-size-inc",
      title: "Increase Font Size (+1px)",
      category: "Appearance",
      shortcut: "",
      action: () => {
        if (fontSizeRange) {
          let val = parseInt(fontSizeRange.value, 10) + 1;
          if (val > 24) val = 24;
          fontSizeRange.value = val;
          fontSizeRange.dispatchEvent(new Event("input"));
        }
      }
    },
    {
      id: "font-size-dec",
      title: "Decrease Font Size (-1px)",
      category: "Appearance",
      shortcut: "",
      action: () => {
        if (fontSizeRange) {
          let val = parseInt(fontSizeRange.value, 10) - 1;
          if (val < 10) val = 10;
          fontSizeRange.value = val;
          fontSizeRange.dispatchEvent(new Event("input"));
        }
      }
    },
    {
      id: "line-height-inc",
      title: "Increase Line Height (+0.1)",
      category: "Appearance",
      shortcut: "",
      action: () => {
        if (lineHeightRange) {
          let val = parseFloat(lineHeightRange.value) + 0.1;
          if (val > 2.0) val = 2.0;
          lineHeightRange.value = val.toFixed(1);
          lineHeightRange.dispatchEvent(new Event("input"));
        }
      }
    },
    {
      id: "line-height-dec",
      title: "Decrease Line Height (-0.1)",
      category: "Appearance",
      shortcut: "",
      action: () => {
        if (lineHeightRange) {
          let val = parseFloat(lineHeightRange.value) - 0.1;
          if (val < 1.0) val = 1.0;
          lineHeightRange.value = val.toFixed(1);
          lineHeightRange.dispatchEvent(new Event("input"));
        }
      }
    },
    {
      id: "save-as",
      title: "Save As (Download HTML)",
      category: "More Settings",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("menu-export-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "view-source",
      title: "View Source in New Tab",
      category: "More Settings",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("menu-view-source-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "menu-format",
      title: "Format Active Editor (Menu Action)",
      category: "More Settings",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("menu-format-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "menu-reset",
      title: "Reset All Editors",
      category: "More Settings",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("menu-reset-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "backup-json",
      title: "Backup Project as JSON",
      category: "More Settings",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("menu-json-export-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "restore-json",
      title: "Restore Project from JSON Backup",
      category: "More Settings",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("menu-json-import-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "edit-snippets",
      title: "Open Custom Snippets in JS Editor",
      category: "Snippets",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("menu-snippets-edit-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "save-snippets",
      title: "Save Custom Snippets from JS Editor",
      category: "Snippets",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("menu-snippets-save-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "upload-snippets",
      title: "Upload Custom Snippets JSON File",
      category: "Snippets",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("menu-snippets-import-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "share-link",
      title: "Copy Shareable URL Link",
      category: "Share",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("header-share-btn");
        if (btn) btn.click();
      }
    },
    {
      id: "reset-all-data",
      title: "Reset All Data & Clear Storage",
      category: "Danger Zone",
      shortcut: "",
      action: () => {
        const btn = document.getElementById("clear-storage-btn");
        if (btn) btn.click();
      }
    }
  ];

  let selectedCmdIndex = 0;

  function renderCommandList(filter = "") {
    cmdList.innerHTML = "";
    const filtered = commands.filter(cmd =>
      cmd.title.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.category.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
      cmdList.innerHTML = `<div class="text-secondary text-center py-3" style="font-size: 0.85rem;">No matching commands found.</div>`;
      return;
    }

    filtered.forEach((cmd, idx) => {
      const item = document.createElement("div");
      item.className = `cmd-item ${idx === selectedCmdIndex ? 'active' : ''}`;
      item.innerHTML = `
      <div>
      <span class="text-info fw-bold" style="font-size: 0.7rem; text-transform: uppercase; margin-right: 6px;">[${cmd.category}]</span>
      <span>${cmd.title}</span>
      </div>
      ${cmd.shortcut ? `<span class="cmd-shortcut">${cmd.shortcut}</span>` : ''}
      `;

      item.addEventListener("click", () => {
        closeCommandPalette();
        cmd.action();
      });

      cmdList.appendChild(item);
    });
  }

  function openCommandPalette() {
    if (!cmdModal) return;
    cmdModal.style.display = "flex";
    cmdInput.value = "";
    selectedCmdIndex = 0;
    renderCommandList();
    setTimeout(() => cmdInput.focus(), 50);
  }

  function closeCommandPalette() {
    if (!cmdModal) return;
    cmdModal.style.display = "none";
  }

  function refreshEditors() {
    setTimeout(() => {
      if (window.htmlEditor) window.htmlEditor.refresh();
      if (window.cssEditor) window.cssEditor.refresh();
      if (window.jsEditor) window.jsEditor.refresh();
    }, 50);
  }

  if (headerCmdBtn) headerCmdBtn.addEventListener("click", openCommandPalette);
  if (cmdCloseBtn) cmdCloseBtn.addEventListener("click", closeCommandPalette);

  if (cmdModal) {
    cmdModal.addEventListener("click", (e) => {
      if (e.target === cmdModal) closeCommandPalette();
    });
  }

  if (cmdInput) {
    cmdInput.addEventListener("input", (e) => {
      selectedCmdIndex = 0;
      renderCommandList(e.target.value);
    });

    cmdInput.addEventListener("keydown", (e) => {
      const activeItems = cmdList.querySelectorAll(".cmd-item");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (activeItems.length > 0) {
          selectedCmdIndex = (selectedCmdIndex + 1) % activeItems.length;
          updateActiveCmdItem(activeItems);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (activeItems.length > 0) {
          selectedCmdIndex = (selectedCmdIndex - 1 + activeItems.length) % activeItems.length;
          updateActiveCmdItem(activeItems);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        const activeItemsFiltered = commands.filter(cmd =>
          cmd.title.toLowerCase().includes(cmdInput.value.toLowerCase()) ||
          cmd.category.toLowerCase().includes(cmdInput.value.toLowerCase())
        );
        if (activeItemsFiltered[selectedCmdIndex]) {
          closeCommandPalette();
          activeItemsFiltered[selectedCmdIndex].action();
        }
      } else if (e.key === "Escape") {
        closeCommandPalette();
      }
    });
  }

  function updateActiveCmdItem(items) {
    items.forEach((item, idx) => {
      if (idx === selectedCmdIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') || (e.altKey && e.key.toLowerCase() === 'p')) {
      e.preventDefault();
      if (cmdModal && cmdModal.style.display === "flex") {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
    }
  });

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
        // Programming ligatures are "calt": font-variant-ligatures alone
        // does not turn calt off in Chrome, so set both.
        el.style.setProperty('font-feature-settings', ligVal === "normal" ? '"liga" 1, "calt" 1' : '"liga" 0, "calt" 0', 'important');
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

  // Reload preview when Eruda toggle changes.
  const erudaToggleEl = document.getElementById("erudaToggle");
  if (erudaToggleEl) {
    erudaToggleEl.addEventListener("change", (e) => {
      const on = e.target.checked;
      localStorage.setItem("sandbox_eruda", on);
      if (typeof updatePreview === "function") updatePreview();
    });
  }
  // Global helper so Command Palette can toggle it too.
  window.toggleEruda = function() {
    const cur = localStorage.getItem("sandbox_eruda") === "true";
    const next = !cur;
    localStorage.setItem("sandbox_eruda", next);
    const t = document.getElementById("erudaToggle");
    if (t) t.checked = next;
    if (typeof updatePreview === "function") updatePreview();
    return next;
  };

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
        // Programming ligatures are "calt": font-variant-ligatures alone
        // does not turn calt off in Chrome, so set both.
        el.style.setProperty('font-feature-settings', useLigatures ? '"liga" 1, "calt" 1' : '"liga" 0, "calt" 0', 'important');
      });
      localStorage.setItem("sandbox_ligatures", useLigatures);
      setTimeout(() => {
        if (window.htmlEditor) window.htmlEditor.refresh();
        if (window.cssEditor) window.cssEditor.refresh();
        if (window.jsEditor) window.jsEditor.refresh();
      }, 30);
    });
  }

  const currentVersion = "1.7.1";
  const menuJsonExportBtn = document.getElementById("menu-json-export-btn");
  if (menuJsonExportBtn) {
    menuJsonExportBtn.addEventListener("click", () => {
      const backupData = {
        version: currentVersion,
        timestamp: new Date().toISOString(),
        html: formatCodeForExport(window.htmlEditor.getValue(), 'html'),
        css: formatCodeForExport(window.cssEditor.getValue(), 'css'),
        js: formatCodeForExport(getRealJsCode(), 'js'),
        snippets: formatSnippetsForExport(customSnippets),
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
      a.download = `sandbox-backup-v${currentVersion}-${Date.now()}.json`;
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
      e.target.value = ""; // Allow re-importing the same file.
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          let importedAnything = false;
          // Save code to localStorage synchronously: reload would otherwise beat the 60ms debounced save.
          // Restore loads formatted code, so even old (raw) backups open clean.
          if (typeof data.html === "string") { const v = formatCodeForExport(data.html, 'html'); window.htmlEditor.setValue(v); try { localStorage.setItem("sandbox_html", v); } catch (e) {} importedAnything = true; }
          if (typeof data.css === "string") { const v = formatCodeForExport(data.css, 'css'); window.cssEditor.setValue(v); try { localStorage.setItem("sandbox_css", v); } catch (e) {} importedAnything = true; }
          if (typeof data.js === "string") { const v = formatCodeForExport(data.js, 'js'); window.jsEditor.setValue(v); try { localStorage.setItem("sandbox_js", v); } catch (e) {} importedAnything = true; }
          // Imported code is authoritative: drop any stale snippets-edit backup.
          try { localStorage.removeItem("sandbox_js_backup_before_snippets"); } catch (e) {}
          if (data.snippets !== undefined) {
            importedAnything = true;
            // Same normalization as every other snippets load (non-string
            // values must not reach snippet expansion).
            // Snippet bodies are formatted too, so restore is fully formatted.
            customSnippets = formatSnippetsForExport(mergeSnippets(data.snippets));
            localStorage.setItem("sandbox_custom_snippets", JSON.stringify(customSnippets, null, 2));
          }
          if (data.settings) {
            if (data.settings && typeof data.settings === "object" && Object.keys(data.settings).length) importedAnything = true;
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
          if (!importedAnything) { alert("Nothing to import in this file."); return; }
          alert("Project restored.");
          location.reload();
        } catch (err) {
          alert("Invalid backup file.");
          console.error(err);
        }
      };
      reader.readAsText(file);
    });
  }

  const menuViewSourceBtn = document.getElementById("menu-view-source-btn");
  if (menuViewSourceBtn) {
    menuViewSourceBtn.addEventListener("click", () => {
      // Raw fragments: the WHOLE document is formatted once below, so
      // shell + style + body + script all align. Editor code stays untouched.
      const htmlCode = window.htmlEditor.getValue();
      const cssCode = window.cssEditor.getValue();
      const jsCode = getRealJsCode();
      const framework = localStorage.getItem("sandbox_framework") || "none";
      const frameworkCDNTag = getFrameworkCDN(framework);
      let fullSourceDocument = `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(getProjectTitle())}</title>
      ${frameworkCDNTag}
      <style>${cssCode.replace(/<\/style>/gi, '<\\/style>')}</style>
      </head>
      <body>
      ${htmlCode}
      <script>${jsCode.replace(/<\/script>/gi, '<\\/script>')}</script>
      </body>
      </html>`;
      fullSourceDocument = formatFullDocument(fullSourceDocument);
      const blob = new Blob([fullSourceDocument], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  const menuExportBtn = document.getElementById("menu-export-btn");
  if (menuExportBtn) menuExportBtn.addEventListener("click", () => headerDownloadBtn?.click());

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
        // Block stale preview syncs from re-saving storage during clear.
        window.__sbClearingStorage = true;
        // Safety: if reload is blocked, allow storage syncs again.
        setTimeout(() => { window.__sbClearingStorage = false; }, 1000);
        // Tell the live preview to clear its local/session/cookie shim now.
        // The preview syncs the empty state, so cleared values do not come back.
        try {
          const previewFrame = document.getElementById("output");
          if (previewFrame && previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({ type: "SANDBOX_STORAGE_CLEAR" }, "*");
          }
        } catch (e) {}
        // Clear the parent's saved preview storage explicitly.
        try { localStorage.removeItem("sandbox_preview_localStorage"); } catch (e) {}
        try { localStorage.removeItem("sandbox_preview_cookies"); } catch (e) {}
        try { sessionStorage.removeItem("sandbox_preview_sessionStorage"); } catch (e) {}
        try { localStorage.clear(); } catch (e) {}
        try { sessionStorage.clear(); } catch (e) {} // Preview session data lives in sessionStorage.
        location.reload();
      }
    });
  }

  window.appendLog = function(type, message) {
    const consoleDiv = document.getElementById("js-console");
    if (!consoleDiv) return;
    const placeholder = consoleDiv.querySelector('.text-secondary');
    if (placeholder) placeholder.remove();

    const logItem = document.createElement("div");
    logItem.className = "console-log-item font-monospace border-bottom border-secondary border-opacity-25 " +
      "pb-2";

    let badgeClass = "bg-secondary text-light";
    let prefix = "LOG";
    if (type === 'error') { badgeClass = "bg-danger text-white"; prefix = "ERROR"; }
    else if (type === 'warn') { badgeClass = "bg-warning text-dark"; prefix = "WARN"; }
    else if (type === 'info') { badgeClass = "bg-info text-dark"; prefix = "INFO"; }

    // Log counters: blue = log + info, yellow = warn, red = error.
    try {
      var counterId = 'log-count-info';
      if (type === 'error') counterId = 'log-count-error';
      else if (type === 'warn') counterId = 'log-count-warn';
      var counterEl = document.getElementById(counterId);
      if (counterEl) counterEl.textContent = String((parseInt(counterEl.textContent, 10) || 0) + 1);
    } catch (e) {}

    const now = new Date();
    const timeStr = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join(':');

    let targetLine = null, targetSource = "js";
    const srcMatch = message.match(/\((HTML|JS) Line:\s*(\d+)\)/i);
    if (srcMatch) {
      targetSource = srcMatch[1].toLowerCase();
      targetLine = parseInt(srcMatch[2], 10) - 1;
    } else {
      const lineMatch = message.match(/\(Line:\s*(\d+)\)/i);
      if (lineMatch) {
        targetLine = parseInt(lineMatch[1], 10) - 1;
        targetSource = "js";
      }
    }

    logItem.innerHTML = `
    <div class="console-content-line">
    <span class="badge ${badgeClass} px-1 py-0 flex-shrink-0" style="font-size: 0.7rem; margin-top: 2px;">${prefix}</span>
    <span class="text-light flex-grow-1" style="white-space: pre-wrap; word-break: break-all; font-size: 0.8rem;">${escapeHtml(message)}</span>
    ${targetLine !== null ? '<span class="text-info flex-shrink-0 ms-1" style="font-size: 0.7rem;" ' +
      'title="Jump to Line">📍</span>' : ''}
    </div>
    <div class="console-timestamp">[${timeStr}]</div>
    `;

    if (targetLine !== null) {
      logItem.addEventListener("click", () => {
        const isHtml = targetSource === "html";
        showEditorTab(isHtml ? "html-tab" : "js-tab", isHtml ? "html-pane" : "js-pane");

        setTimeout(() => {
          const targetEditor = isHtml ? window.htmlEditor : window.jsEditor;
          if (targetEditor) {
            targetEditor.setCursor({ line: targetLine, ch: 0 });
            targetEditor.scrollIntoView({ line: targetLine, ch: 0 }, 100);
            targetEditor.focus();

            const lineHandle = targetEditor.addLineClass(targetLine,
              "background",
              "cm-error-line-highlight");
            setTimeout(() => {
              targetEditor.removeLineClass(lineHandle, "background", "cm-error-line-highlight");
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

  // Project title: raw name + /index.html. Shown in preview / export / view source.
  // Raw name: as typed, _ stays _, space stays space. No conversion in title.
  function getProjectTitle() {
    try {
      var t = localStorage.getItem("sandbox_project_title");
      if (t && t.trim()) return t.trim() + "/index.html";
    } catch (e) {}
    return "My Project/index.html";
  }

  // URL name: spaces become _. Used in fake URL bar only.
  function getProjectUrlName() {
    try {
      var t = localStorage.getItem("sandbox_project_title");
      if (t && t.trim()) return t.trim().replace(/\s+/g, "_");
    } catch (e) {}
    return "My_Project";
  }
  window.getProjectTitle = getProjectTitle;
  window.getProjectUrlName = getProjectUrlName;

  // Fake URL bar: tap to edit project name. No select-all on tap, only text cursor.
  // Enter / blur saves raw name, re-formats bar, rebuilds preview with new title.
  (function setupProjectUrlBar() {
    var bar = document.getElementById("project-url-bar");
    if (!bar) return;
    function showUrl() {
      bar.value = "http://" + getProjectUrlName() + "/index.html";
    }
    showUrl();
    function saveNameFromBar() {
      var raw = bar.value || "";
      raw = raw.replace(/^\s*https?:\/\//i, "");
      raw = raw.replace(/\/index\.html\s*$/i, "");
      raw = raw.replace(/^\/+|\/+$/g, "");
      raw = raw.trim();
      if (!raw) raw = "My Project";
      try { localStorage.setItem("sandbox_project_title", raw); } catch (e) {}
      showUrl();
      try { updatePreview(); } catch (e) {}
    }
    bar.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        saveNameFromBar();
        bar.blur();
      }
    });
    bar.addEventListener("blur", saveNameFromBar);
  })();

  // Logs-only clear, used by the preview rebuild on every keystroke.
  window.clearConsoleLogs = function() {
    const consoleDiv = document.getElementById("js-console");
    if (consoleDiv) consoleDiv.innerHTML = '<span class="text-secondary">// Console logs and errors will appear here...</span>';
    // Reset log counters (info / warn / error).
    try {
      ['log-count-info', 'log-count-warn', 'log-count-error'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = '0';
      });
    } catch (e) {}
  };
  window.clearConsole = function() {
    window.clearConsoleLogs();
    // Also clear Problems display + markers (lint re-runs on next edit, so they return).
    try {
      currentProblems = [];
      for (const key of Object.keys(lintMarksByEditor)) {
        lintMarksByEditor[key].forEach((mm) => { try { mm.clear(); } catch (e) {} });
        lintMarksByEditor[key] = [];
      }
      renderProblems();
    } catch (e) {}
  };

  const consoleClearBtn = document.getElementById("console-clear-btn");
  if (consoleClearBtn) consoleClearBtn.addEventListener("click", window.clearConsole);

  // Log tab: Logs / Problems sub-tabs (hamesha dikhenge, sirf count badlega)
  const problemsTabBtn = document.getElementById("problems-tab-btn");
  const logsTabBtn = document.getElementById("logs-tab-btn");
  const jsConsoleEl = document.getElementById("js-console");
  const problemsPanelEl = document.getElementById("problems-panel");
  const logPaneLabel = document.getElementById("log-pane-label");
  const problemsCountEl = document.getElementById("problems-count");

  function showLogsTab() {
    if (jsConsoleEl) jsConsoleEl.classList.remove("d-none");
    if (problemsPanelEl) problemsPanelEl.classList.add("d-none");
    if (logPaneLabel) logPaneLabel.textContent = "// Console Output";
    if (logsTabBtn) { logsTabBtn.classList.remove("btn-outline-secondary", "text-light"); logsTabBtn.classList.add("btn-light", "is-active"); }
    if (problemsTabBtn) { problemsTabBtn.classList.remove("btn-light", "is-active"); problemsTabBtn.classList.add("btn-outline-secondary", "text-light"); }
  }

  function showProblemsTab() {
    if (jsConsoleEl) jsConsoleEl.classList.add("d-none");
    if (problemsPanelEl) problemsPanelEl.classList.remove("d-none");
    if (logPaneLabel) logPaneLabel.textContent = "// Problems";
    if (problemsTabBtn) { problemsTabBtn.classList.remove("btn-outline-secondary", "text-light"); problemsTabBtn.classList.add("btn-light", "is-active"); }
    if (logsTabBtn) { logsTabBtn.classList.remove("btn-light", "is-active"); logsTabBtn.classList.add("btn-outline-secondary", "text-light"); }
  }

  function updateProblemsCount(n) {
    if (!problemsCountEl) return;
    problemsCountEl.textContent = String(n);
  }

  if (problemsTabBtn) problemsTabBtn.addEventListener("click", showProblemsTab);
  if (logsTabBtn) logsTabBtn.addEventListener("click", showLogsTab);

  // v1.7.0 linter inhe call karega
  window.showProblemsTab = showProblemsTab;
  window.showLogsTab = showLogsTab;
  window.updateProblemsCount = updateProblemsCount;

  // ===== v1.7.0 — Lint styles (JS injects them, so wavy/bg never depends on the CSS file) =====
  (function injectLintStyles() {
    if (document.getElementById("lint-mark-styles")) return;
    const st = document.createElement("style");
    st.id = "lint-mark-styles";
    st.textContent = ".lint-mark-error{background-color:rgba(255,59,48,.12);text-decoration:underline " +
      "wavy #ff3b30;text-decoration-thickness:1.5px;text-underline-offset:2px;" +
      "}" +
    ".lint-mark-warning{background-color:rgba(255,204,0,.14);text-decoration:underline " +
      "wavy #ffcc00;text-decoration-thickness:1.5px;text-underline-offset:2px;" +
      "}" +
    ".lint-mark-hint{background-color:rgba(0,122,255,.12);text-decoration:underline " +
      "wavy #0a7aff;text-decoration-thickness:1.5px;text-underline-offset:2px;" +
      "}" +
    ".problem-row{display:flex;gap:6px;align-items:flex-start;padding:4px 6px;" +
      "border-radius:4px;cursor:pointer;font-size:.8rem;}" +
    ".problem-row:hover{background:rgba(255,255,255,.08);}" +
    ".problem-row.active{background:rgba(255,255,255,.14);}" +
    ".log-tab-btn{display:inline-flex;align-items:center;gap:5px;font-size:.7rem;" +
      "font-weight:600;padding:4px 10px;border-radius:999px;white-space:nowrap;" +
      "flex-shrink:0;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);" +
      "color:#d7d7de;transition:background .2s,color .2s,border-color .2s,box-shadow " +
      ".2s,transform .1s;}" +
    ".log-tab-btn:hover{background:rgba(255,255,255,.12);color:#fff;}" +
    ".log-tab-btn:active{transform:scale(.97);}" +
    ".log-tab-btn.is-active{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.28);" +
      "color:#fff;}" +
    "#problems-tab-btn{background:#e0241a;border-color:#e0241a;color:#fff;}" +
    "#problems-tab-btn:hover{background:#c81e1e;color:#fff;}" +
    "#problems-tab-btn .problems-count-badge{min-width:16px;height:16px;display:inline-flex;" +
      "align-items:center;justify-content:center;padding:0 5px;border-radius:999px;" +
      "font-size:.6rem;font-weight:700;background:#fff;color:#e0241a;}" +
    "#problems-tab-btn.is-active{background:#c81e1e;box-shadow:0 0 0 2px rgba(255,59,48,.35);}";;
    document.head.appendChild(st);
  })();

  // ===== v1.7.0 — HTML linter =====
  const KNOWN_HTML_TAGS = new Set(("html head title base link meta style script noscript body section nav " +
    "article aside h1 h2 h3 h4 h5 h6 header footer address main p hr pre blockquote " +
    "ol ul li dl dt dd figure figcaption div a em strong small s cite q dfn " +
    "abbr ruby rt rp data time code var samp kbd sub sup i b u mark bdi bdo " +
    "span br wbr ins del picture source img iframe embed object param video " +
    "audio track map area table caption colgroup col tbody thead tfoot tr td " +
    "th form fieldset legend label input button select datalist optgroup option " +
    "textarea output progress meter details summary dialog menu template slot " +
    "canvas svg math hgroup search font center acronym big strike tt path circle " +
    "rect line polyline polygon ellipse g text defs use clippath lineargradient " +
    "radialgradient stop animate animatetransform animatemotion symbol mask " +
    "pattern image foreignobject switch marker desc mi mo mn ms mtext mrow " +
    "mfrac msqrt mroot mstyle msup msub msubsup munder mover munderover mmultiscripts " +
    "mtable mtr mtd malignmark mglyph mpadded mphantom merror semantics annotation " +
    "annotation-xml").split(" "));
  const VOID_HTML_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  // G15: document-structure guard. User code is inserted directly into the
  // HTML5 <body>, so these tags would double the document structure.
  // <link>, <script> and <style> stay allowed: they are legal in <body>.
  const BLOCKED_DOC_TAGS = new Set(["doctype", "html", "head", "body", "title", "meta", "base"]);

  function editDistance(a, b) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 1) return 2;
    let prev = [], cur = [];
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      const tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
  }

  // Adjacent transposition: "ture" -> "true", "bleu" -> "blue", "consloe" -> "console".
  // Safe: the swapped word must be exactly a known value.
  function transposeSuggest(lower, candidates) {
    for (let i = 0; i < lower.length - 1; i++) {
      const swapped = lower.slice(0, i) + lower[i + 1] + lower[i] + lower.slice(i + 2);
      for (const c of candidates) {
        if (c.toLowerCase() === swapped) return c;
      }
    }
    return null;
  }

  function closestHtmlTag(name) {
    for (const t of KNOWN_HTML_TAGS) {
      if (Math.abs(t.length - name.length) > 1) continue;
      if (editDistance(name, t) === 1) return t;
    }
    return transposeSuggest(name, Array.from(KNOWN_HTML_TAGS));
  }

  // ===== Strict HTML checks: enum attribute values + duplicates + unclosed quotes =====
  const HTML_ENUM_ATTRS = [
    { tags: ["input"],
      attr: "type",
      values: ["button",
        "checkbox",
        "color",
        "date",
        "datetime-local",
        "email",
        "file",
        "hidden",
        "image",
        "month",
        "number",
        "password",
        "radio",
        "range",
        "reset",
        "search",
        "submit",
        "tel",
        "text",
        "time",
        "url",
        "week"], strict: true },
    { tags: ["button"], attr: "type", values: ["submit", "reset", "button"], strict: true },
    { tags: ["form"], attr: "method", values: ["get", "post", "dialog"], strict: true },
    { tags: null, attr: "spellcheck", values: ["true", "false", "default"], strict: true },
    { tags: null, attr: "draggable", values: ["true", "false"], strict: true },
    { tags: null, attr: "contenteditable", values: ["true", "false", "plaintext-only"], strict: true },
    { tags: null, attr: "target", values: ["_blank", "_self", "_parent", "_top"] },
    { tags: ["input", "textarea", "select", "form"],
      attr: "autocomplete",
      values: ["on",
        "off",
        "name",
        "honorific-prefix",
        "given-name",
        "additional-name",
        "family-name",
        "honorific-suffix",
        "nickname",
        "email",
        "username",
        "new-password",
        "current-password",
        "one-time-code",
        "organization-title",
        "organization",
        "street-address",
        "address-line1",
        "address-line2",
        "address-line3",
        "address-level4",
        "address-level3",
        "address-level2",
        "address-level1",
        "country",
        "country-name",
        "postal-code",
        "cc-name",
        "cc-given-name",
        "cc-additional-name",
        "cc-family-name",
        "cc-number",
        "cc-exp",
        "cc-exp-month",
        "cc-exp-year",
        "cc-csc",
        "cc-type",
        "transaction-currency",
        "transaction-amount",
        "language",
        "bday",
        "bday-day",
        "bday-month",
        "bday-year",
        "sex",
        "tel",
        "tel-country-code",
        "tel-national",
        "tel-area-code",
        "tel-local",
        "tel-extension",
        "impp",
        "url",
        "photo", "shipping", "billing", "home", "work", "mobile", "fax", "pager", "webauthn"],
      multi: true, prefixes: ["section-"], strict: true },
    // Form: enctype + per-button form overrides.
    { tags: ["form"], attr: "enctype", values: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], strict: true },
    { tags: ["input", "button"], attr: "formmethod", values: ["get", "post", "dialog"], strict: true },
    { tags: ["input", "button"], attr: "formenctype", values: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], strict: true },
    { tags: ["input", "button"], attr: "formtarget", values: ["_blank", "_self", "_parent", "_top"] },
    // Text-entry helpers.
    { tags: null, attr: "autocapitalize", values: ["none", "off", "on", "sentences", "words", "characters"], strict: true },
    { tags: null, attr: "autocorrect", values: ["on", "off"], strict: true },
    { tags: ["input", "textarea"], attr: "inputmode", values: ["none", "text", "decimal", "numeric", "tel", "search", "email", "url"], strict: true },
    { tags: ["input", "textarea"], attr: "enterkeyhint", values: ["enter", "done", "go", "next", "previous", "search", "send"], strict: true },
    { tags: ["textarea"], attr: "wrap", values: ["hard", "soft"], strict: true },
    { tags: ["input"], attr: "capture", values: ["user", "environment"], strict: true },
    // Global boolean-ish enums used on inputs.
    { tags: null, attr: "translate", values: ["yes", "no"], strict: true },
    { tags: null, attr: "dir", values: ["ltr", "rtl", "auto"], strict: true },
    { tags: null, attr: "hidden", values: ["hidden", "until-found"], strict: true },
    // ARIA: enumerated states used on form controls.
    { tags: null, attr: "aria-hidden", values: ["true", "false"], strict: true },
    { tags: null, attr: "aria-expanded", values: ["true", "false", "undefined"], strict: true },
    { tags: null, attr: "aria-checked", values: ["true", "false", "mixed", "undefined"], strict: true },
    { tags: null, attr: "aria-selected", values: ["true", "false", "undefined"], strict: true },
    { tags: null, attr: "aria-disabled", values: ["true", "false"], strict: true },
    { tags: null, attr: "aria-readonly", values: ["true", "false"], strict: true },
    { tags: null, attr: "aria-required", values: ["true", "false"], strict: true },
    { tags: null, attr: "aria-invalid", values: ["true", "false", "grammar", "spelling"], strict: true },
    { tags: null, attr: "aria-pressed", values: ["true", "false", "mixed", "undefined"], strict: true },
    { tags: null, attr: "aria-modal", values: ["true", "false"], strict: true },
    { tags: null, attr: "aria-multiline", values: ["true", "false"], strict: true },
    { tags: null, attr: "aria-multiselectable", values: ["true", "false"], strict: true },
    { tags: null, attr: "aria-atomic", values: ["true", "false"], strict: true },
    { tags: null, attr: "aria-busy", values: ["true", "false"], strict: true },
    { tags: null, attr: "aria-grabbed", values: ["true", "false", "undefined"], strict: true },
    { tags: null, attr: "aria-live", values: ["off", "polite", "assertive"], strict: true },
    { tags: null, attr: "aria-orientation", values: ["horizontal", "vertical", "undefined"], strict: true },
    { tags: null, attr: "aria-sort", values: ["ascending", "descending", "none", "other"], strict: true },
    { tags: null, attr: "aria-haspopup", values: ["true", "false", "menu", "listbox", "tree", "grid", "dialog"], strict: true },
    { tags: null, attr: "aria-current", values: ["true", "false", "page", "step", "location", "date", "time"], strict: true },
    { tags: null, attr: "aria-autocomplete", values: ["none", "inline", "list", "both"], strict: true },
    { tags: null, attr: "aria-relevant", values: ["additions", "removals", "text", "all"], strict: true, multi: true },
    { tags: null, attr: "aria-dropeffect", values: ["none", "copy", "execute", "link", "move", "popup"], strict: true, multi: true },
    { tags: null, attr: "role", values: ["alert", "alertdialog", "application", "article", "banner", "button", "cell", "checkbox", "columnheader", "combobox", "complementary", "contentinfo", "definition", "dialog", "directory", "document", "feed", "figure", "form", "grid", "gridcell", "group", "heading", "img", "link", "list", "listbox", "listitem", "log", "main", "marquee", "math", "menu", "menubar", "menuitem", "menuitemcheckbox", "menuitemradio", "navigation", "none", "note", "option", "presentation", "progressbar", "radio", "radiogroup", "region", "row", "rowgroup", "rowheader", "search", "searchbox", "separator", "slider", "spinbutton", "status", "switch", "tab", "table", "tablist", "tabpanel", "term", "textbox", "timer", "toolbar", "tooltip", "tree", "treegrid", "treeitem", "generic", "paragraph", "comment", "suggestion", "insertion", "deletion", "mark"], strict: true }
];

  function parseTagAttrs(inner, base) {
    const attrs = [];
    let unclosedQuote = -1;
    let i = 0, n = inner.length;
    while (i < n) {
      while (i < n && /\s/.test(inner[i])) i++;
      if (i >= n) break;
      if (inner[i] === "/") { i++; continue; }
      const nameStart = i;
      while (i < n && !/[\s=/>]/.test(inner[i])) i++;
      const name = inner.slice(nameStart, i);
      if (!name) { i++; continue; }
      const nameEnd = i;
      let value = null, valueStart = -1, valueEnd = -1;
      let j = i;
      while (j < n && /\s/.test(inner[j])) j++;
      if (inner[j] === "=") {
        j++;
        while (j < n && /\s/.test(inner[j])) j++;
        if (inner[j] === '"' || inner[j] === "'") {
          const q = inner[j], qPos = j;
          j++;
          const valStart = j;
          while (j < n && inner[j] !== q) j++;
          if (j >= n) { unclosedQuote = base + qPos; value = inner.slice(valStart, j); valueStart = base + valStart; valueEnd = base + j; i = j; }
          else { value = inner.slice(valStart, j); valueStart = base + valStart; valueEnd = base + j; i = j + 1; }
        } else {
          const valStart = j;
          while (j < n && !/[\s>]/.test(inner[j])) j++;
          value = inner.slice(valStart, j); valueStart = base + valStart; valueEnd = base + j; i = j;
        }
      } else { i = j; }
      attrs.push({ name, nameStart: base + nameStart, nameEnd: base + nameEnd, value, valueStart, valueEnd });
    }
    return { attrs, unclosedQuote };
  }

  function scanHtmlTags(code) {
    const tags = [];
    const n = code.length;
    let i = 0;
    while (i < n) {
      if (code[i] !== "<") { i++; continue; }
      if (code.startsWith("<!--", i)) {
        const end = code.indexOf("-->", i + 4);
        i = end === -1 ? n : end + 3;
        continue;
      }
      if (code[i + 1] === "!") {
        // G15: doctype is a document-structure tag. Emit it so the linter
        // can warn, instead of silently skipping it like other <!...> marks.
        const dm = /^doctype(?=[\s>])/i.exec(code.slice(i + 2));
        if (dm) {
          const dEnd = code.indexOf(">", i + 2);
          const e2 = dEnd === -1 ? n : dEnd + 1;
          tags.push({ name: "doctype", closing: false, selfClose: true, start: i, end: e2, attrs: [], unclosedQuote: -1 });
          i = e2;
          continue;
        }
      }
      if (code[i + 1] === "!" || code[i + 1] === "?") {
        const end = code.indexOf(">", i + 2);
        i = end === -1 ? n : end + 1;
        continue;
      }
      let j = i + 1, closing = false;
      if (code[j] === "/") { closing = true; j++; }
      const nameStart = j;
      while (j < n && /[A-Za-z0-9:-]/.test(code[j])) j++;
      const name = code.slice(nameStart, j).toLowerCase();
      if (!name) { i++; continue; }
      let k = j, quote = null, quoteNewlines = 0;
      while (k < n) {
        const c = code[k];
        if (quote) {
          if (c === quote) { quote = null; quoteNewlines = 0; }
          else if (c === "\n") { quoteNewlines++; if (quoteNewlines > 5) break; }
        }
        else if (c === '"' || c === "'") { quote = c; quoteNewlines = 0; }
        else if (c === ">") break;
        k++;
      }
      let m = k - 1;
      while (m > j && /\s/.test(code[m])) m--;
      const selfClose = !closing && code[m] === "/";
      const end = k >= n ? n : k + 1;
      let attrs = [], unclosedQuote = -1;
      if (!closing) {
        const parsed = parseTagAttrs(code.slice(j, k), j);
        attrs = parsed.attrs;
        unclosedQuote = parsed.unclosedQuote;
      }
      tags.push({ name, closing, selfClose, start: i, end, attrs, unclosedQuote });
      i = end;
      if (!closing && !selfClose && (name === "script" || name === "style" || name === "textarea" || name === "title")) {
        const cm = new RegExp("</" + name + "\\s*>", "i").exec(code.slice(i));
        if (cm) {
          const cs = i + cm.index;
          tags.push({ name, closing: true, selfClose: false, start: cs, end: cs + cm[0].length, attrs: [], unclosedQuote: -1 });
          i = cs + cm[0].length;
        } else {
          i = n;
        }
      }
    }
    return tags;
  }

  // Common value mix-ups: on/off vs true/false vs yes/no.
// Returns the value the user likely meant, or null.
function confusionSuggest(tl, allowed) {
  const pairs = [
    ["off", "false"], ["on", "true"],
    ["false", "off"], ["true", "on"],
    ["yes", "true"], ["no", "false"],
    ["true", "yes"], ["false", "no"],
    ["on", "yes"], ["off", "no"],
    ["1", "true"], ["0", "false"],
    ["none", "off"], ["none", "false"],
    ["auto", "default"],
    ["number", "numeric"],
    ["datetime", "datetime-local"],
    ["enabled", "true"], ["disabled", "false"]
  ];
  for (const pair of pairs) {
    if (tl === pair[0] && allowed.indexOf(pair[1]) !== -1) return pair[1];
  }
  return null;
}

// Full Levenshtein distance, no length shortcut. Needed for the
// distance-2 suggestion pass: "reedd" -> "red" is 2 edits, but the
// fast editDistance() returns 2 for ANY length gap of 2, so it
// cannot tell a real 2-edit typo from garbage like "xyzab".
function editDistanceFull(a, b) {
  const m = a.length, n = b.length;
  let prev = [], cur = [];
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    const tmp = prev; prev = cur; cur = tmp;
  }
  return prev[n];
}

function validateHtml(code) {
    const problems = [];
    const stack = [];
    const tags = scanHtmlTags(code);
    for (const t of tags) {
      // G15: document-structure guard. User code goes straight into the
      // HTML5 <body>, so document tags are not allowed here. Skips all
      // other checks for the tag: no unclosed/unexpected cascade.
      if (BLOCKED_DOC_TAGS.has(t.name)) {
        problems.push({ severity: "warning", g15: true, message: "doctype, html, head, metas, titles & base tags not allowed! Write only the code that goes inside the body, because the editor is already writing your code in the body of a proper HTML5 document.", start: t.start, end: t.end });
        continue;
      }
      if (!t.closing) {
        if (t.unclosedQuote !== -1) {
          let qEnd = code.indexOf("\n", t.unclosedQuote);
          if (qEnd === -1 || qEnd > t.end) qEnd = t.end;
          problems.push({ severity: "error", message: "Unclosed attribute value", start: t.unclosedQuote, end: qEnd });
        }
        const seenAttrs = Object.create(null);
        for (const a of (t.attrs || [])) {
          const an = a.name.toLowerCase();
          if (seenAttrs[an]) {
            problems.push({ severity: "error", message: "Duplicate attribute '" + an + "'", start: a.nameStart, end: a.nameEnd });
          } else seenAttrs[an] = true;
          if (a.value === null) continue;
          for (const rule of HTML_ENUM_ATTRS) {
            if (rule.attr !== an) continue;
            if (rule.tags && rule.tags.indexOf(t.name) === -1) continue;
            const checkOne = (token, ts, te) => {
              const tl = token.toLowerCase();
              if (!tl) return;
              if (rule.values.indexOf(tl) !== -1) return;
              // Autocomplete: section-* tokens are valid (section-billing, ...).
              if (rule.prefixes) { for (const p of rule.prefixes) { if (tl.indexOf(p) === 0) return; } }
              let sug = null;
              for (const c of rule.values) {
                if (Math.abs(c.length - tl.length) > 1) continue;
                if (editDistance(tl, c) === 1) { sug = c; break; }
              }
              if (!sug) sug = transposeSuggest(tl, rule.values);
              // Double typo: "texxt" -> "text" is 2 edits. Without this
              // pass the strict branch reports with no suggestion.
              if (!sug) {
                for (const c of rule.values) {
                  if (Math.abs(c.length - tl.length) > 2) continue;
                  if (editDistanceFull(tl, c) === 2) { sug = c; break; }
                }
              }
              if (sug) problems.push({ severity: "warning", message: "Unknown value '" + token + "' for '" + an + "'. Did you mean '" + sug + "'?", start: ts, end: te });
              // Strict rule, no close match: still report. Without this,
              // far-off values like spellcheck="off" stay silent, since
              // no suggestion exists. Open rules (target, formtarget)
              // stay silent: named frames are valid. The fix hint maps
              // common mix-ups (on/off vs true/false vs yes/no) to the
              // value the user likely meant, so the mistake is fixable.
              else if (rule.strict) {
                const fix = confusionSuggest(tl, rule.values);
                if (fix) problems.push({ severity: "warning", message: "Invalid value '" + token + "' for '" + an + "'. Did you mean '" + fix + "'? Allowed: " + rule.values.join(", "), start: ts, end: te });
                else problems.push({ severity: "warning", message: "Invalid value '" + token + "' for '" + an + "'. Allowed: " + rule.values.join(", "), start: ts, end: te });
              }
            };
            if (rule.multi) {
              const tokRe = /\S+/g;
              let tm;
              while ((tm = tokRe.exec(a.value)) !== null) {
                checkOne(tm[0], a.valueStart + tm.index, a.valueStart + tm.index + tm[0].length);
              }
            } else {
              checkOne(a.value, a.valueStart, a.valueEnd);
            }
            break;
          }
        }
      }
      if (VOID_HTML_TAGS.has(t.name) || t.selfClose) continue;
      if (!t.closing) {
        if (!KNOWN_HTML_TAGS.has(t.name) && t.name.indexOf("-") === -1) {
          const sug = closestHtmlTag(t.name);
          if (sug) problems.push({ severity: "warning", message: "Unknown tag <" + t.name + ">. Did you mean <" + sug + ">?", start: t.start, end: t.end });
        }
        stack.push(t);
      } else {
        if (stack.length && stack[stack.length - 1].name === t.name) { stack.pop(); continue; }
        let idx = -1;
        for (let s = stack.length - 1; s >= 0; s--) { if (stack[s].name === t.name) { idx = s; break; } }
        if (idx !== -1) {
          for (let s = stack.length - 1; s > idx; s--) {
            problems.push({ severity: "error", message: "Unclosed tag <" + stack[s].name + ">", start: stack[s].start, end: stack[s].end });
          }
          stack.length = idx;
        } else {
          problems.push({ severity: "error", message: "Unexpected closing tag </" + t.name + ">", start: t.start, end: t.end });
        }
      }
    }
    for (let s = stack.length - 1; s >= 0; s--) {
      problems.push({ severity: "error", message: "Unclosed tag <" + stack[s].name + ">", start: stack[s].start, end: stack[s].end });
    }
    // Lint the CSS inside <style> and the JS inside <script> in the HTML
    // editor, with the same validators the CSS / JS tabs use. Positions
    // are offset into the HTML document so Problems jumps to the right line.
    for (let ti = 0; ti < tags.length; ti++) {
      const t = tags[ti];
      if (t.closing || t.selfClose) continue;
      if (t.name !== "style" && t.name !== "script") continue;
      let closeTag = null;
      for (let tj = ti + 1; tj < tags.length; tj++) {
        if (tags[tj].name === t.name) { if (tags[tj].closing) closeTag = tags[tj]; break; }
      }
      const contentStart = t.end;
      const contentEnd = closeTag ? closeTag.start : code.length;
      if (contentEnd <= contentStart) continue;
      const inner = code.slice(contentStart, contentEnd);
      let innerProblems = [];
      try {
        innerProblems = t.name === "style" ? (validateCss(inner) || []) : (validateJs(inner, code) || []);
      } catch (e) { innerProblems = []; }
      for (const p of innerProblems) {
        problems.push({ severity: p.severity, g15: !!p.g15, message: p.message, start: contentStart + p.start, end: contentStart + p.end });
      }
    }
    problems.sort((a, b) => a.start - b.start);
    return problems;
  }

  // ===== v1.7.0 — CSS linter =====
  const KNOWN_CSS_PROPS = new Set(("color background background-color background-image background-repeat background-position " +
    "background-size background-attachment background-clip background-origin " +
    "background-blend-mode border border-width border-style border-color border-top " +
    "border-right border-bottom border-left border-radius border-top-left-radius " +
    "border-top-right-radius border-bottom-left-radius border-bottom-right-radius " +
    "border-collapse border-spacing outline outline-width outline-style outline-color " +
    "outline-offset margin margin-top margin-right margin-bottom margin-left " +
    "padding padding-top padding-right padding-bottom padding-left width height " +
    "min-width min-height max-width max-height display position top right bottom " +
    "left float clear overflow overflow-x overflow-y overflow-wrap visibility " +
    "z-index flex flex-direction flex-wrap flex-flow flex-grow flex-shrink " +
    "flex-basis justify-content align-items align-self align-content order " +
    "gap row-gap column-gap grid grid-template-columns grid-template-rows grid-template-areas " +
    "grid-column grid-row grid-area grid-auto-flow grid-auto-columns grid-auto-rows " +
    "font font-family font-size font-weight font-style font-variant font-stretch " +
    "line-height letter-spacing word-spacing text-align text-decoration text-decoration-line " +
    "text-decoration-color text-decoration-style text-decoration-thickness " +
    "text-underline-offset text-transform text-indent text-shadow text-overflow " +
    "white-space word-break word-wrap vertical-align list-style list-style-type " +
    "list-style-position list-style-image cursor opacity transform transform-origin " +
    "transition transition-property transition-duration transition-timing-function " +
    "transition-delay animation animation-name animation-duration animation-timing-function " +
    "animation-delay animation-iteration-count animation-direction animation-fill-mode " +
    "animation-play-state box-shadow box-sizing object-fit object-position " +
    "clip-path filter backdrop-filter resize user-select pointer-events scroll-behavior " +
    "scroll-margin scroll-padding aspect-ratio columns column-count column-rule " +
    "column-span column-width break-after break-before break-inside caption-side " +
    "content quotes counter-reset counter-increment empty-cells table-layout " +
    "direction unicode-bidi writing-mode text-orientation hyphens tab-size " +
    "caret-color accent-color appearance will-change backface-visibility perspective " +
    "perspective-origin transform-style mask mask-image clip zoom all margin-inline " +
    "margin-block margin-inline-start margin-inline-end margin-block-start " +
    "margin-block-end padding-inline padding-block padding-inline-start padding-inline-end " +
    "padding-block-start padding-block-end inset inset-block inset-inline inset-block-start " +
    "inset-block-end inset-inline-start inset-inline-end border-inline border-block " +
    "border-inline-start border-inline-end border-block-start border-block-end " +
    "border-inline-width border-block-width border-inline-style border-block-style " +
    "border-inline-color border-block-color border-inline-start-width border-inline-end-width " +
    "border-block-start-width border-block-end-width border-inline-start-style " +
    "border-inline-end-style border-block-start-style border-block-end-style " +
    "border-inline-start-color border-inline-end-color border-block-start-color " +
    "border-block-end-color border-start-start-radius border-start-end-radius " +
    "border-end-start-radius border-end-end-radius block-size inline-size max-block-size " +
    "max-inline-size min-block-size min-inline-size scroll-margin-inline scroll-margin-block " +
    "scroll-margin-inline-start scroll-margin-inline-end scroll-margin-block-start " +
    "scroll-margin-block-end scroll-padding-inline scroll-padding-block scroll-padding-inline-start " +
    "scroll-padding-inline-end scroll-padding-block-start scroll-padding-block-end " +
    "overflow-block overflow-inline overscroll-behavior overscroll-behavior-x " +
    "overscroll-behavior-y overscroll-behavior-block overscroll-behavior-inline " +
    "container container-name container-type anchor-name anchor-scope position-anchor " +
    "position-area position-try position-try-order position-try-fallbacks position-visibility " +
    "inset-area view-transition-name animation-timeline animation-range animation-range-start " +
    "animation-range-end view-timeline view-timeline-name view-timeline-axis " +
    "view-timeline-inset scroll-timeline scroll-timeline-name scroll-timeline-axis " +
    "timeline-scope text-wrap text-wrap-mode text-wrap-style white-space-collapse " +
    "text-spacing-trim text-justify text-box text-box-trim text-box-edge text-group-align " +
    "text-rendering text-emphasis text-emphasis-style text-emphasis-color text-emphasis-position " +
    "text-underline-position text-decoration-skip-ink initial-letter initial-letter-align " +
    "ruby-position ruby-align ruby-merge line-break line-clamp font-kerning " +
    "font-optical-sizing font-feature-settings font-variation-settings font-display " +
    "font-palette font-synthesis font-synthesis-weight font-synthesis-style " +
    "font-synthesis-small-caps font-synthesis-position font-size-adjust font-language-override " +
    "font-named-instance font-variant-alternates font-variant-caps font-variant-east-asian " +
    "font-variant-emoji font-variant-ligatures font-variant-numeric font-variant-position " +
    "color-scheme forced-color-adjust print-color-adjust content-visibility " +
    "contain contain-intrinsic-size contain-intrinsic-width contain-intrinsic-height " +
    "contain-intrinsic-block-size contain-intrinsic-inline-size place-items " +
    "place-content place-self justify-items justify-self scroll-snap-type scroll-snap-align " +
    "scroll-snap-stop scroll-snap-margin scroll-snap-padding scrollbar-width " +
    "scrollbar-color scrollbar-gutter overflow-anchor overflow-clip-margin " +
    "scroll-marker-group touch-action interpolate-size transition-behavior " +
    "field-sizing mask-size mask-position mask-repeat mask-origin mask-clip " +
    "mask-composite mask-mode mask-border mask-type mask-border-source mask-border-slice " +
    "mask-border-width mask-border-outset mask-border-repeat mask-border-mode " +
    "shape-outside shape-margin shape-image-threshold offset offset-path offset-distance " +
    "offset-rotate offset-anchor offset-position mix-blend-mode isolation orphans " +
    "widows column-fill column-rule-width column-rule-style column-rule-color " +
    "border-image border-image-source border-image-slice border-image-width " +
    "border-image-outset border-image-repeat image-rendering image-orientation " +
    "object-view-box box-decoration-break margin-trim page-break-inside page-break-before " +
    "page-break-after fill stroke stroke-width stroke-dasharray stroke-dashoffset " +
    "stroke-linecap stroke-linejoin stroke-miterlimit fill-opacity stroke-opacity " +
    "fill-rule clip-rule color-interpolation color-interpolation-filters color-rendering " +
    "shape-rendering dominant-baseline alignment-baseline baseline-shift paint-order " +
    "vector-effect d cx cy r rx ry x y marker marker-start marker-mid marker-end " +
    "stop-color flood-color lighting-color syntax inherits initial-value src " +
    "unicode-range ascent-override descent-override line-gap-override size-adjust " +
    "system symbols additive-symbols negative prefix suffix range pad speak-as " +
    "fallback base-palette override-colors navigation source orientation scroll-offsets " +
    "time-range").split(" "));

  function maskCss(code) {
    let out = "";
    let i = 0, n = code.length;
    while (i < n) {
      if (code.startsWith("/*", i)) {
        const end = code.indexOf("*/", i + 2);
        const stop = end === -1 ? n : end + 2;
        out += " ".repeat(stop - i);
        i = stop;
      } else if (code[i] === '"' || code[i] === "'") {
        const q = code[i];
        let j = i + 1;
        while (j < n && code[j] !== q) { if (code[j] === "\\") j++; j++; }
        const stop = j < n ? j + 1 : n;
        out += " ".repeat(stop - i);
        i = stop;
      } else { out += code[i]; i++; }
    }
    return out;
  }

  // ===== Strict CSS checks: color names + enum values =====
  const KNOWN_COLORS = new Set(("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond " +
    "blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue " +
    "cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen " +
    "darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred " +
    "darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise " +
    "darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite " +
    "forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow " +
    "grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush " +
    "lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow " +
    "lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue " +
    "lightslategray lightslategrey lightsteelblue lightyellow lime limegreen " +
    "linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple " +
    "mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
    "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive " +
    "olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise " +
    "palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple " +
    "red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell " +
    "sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue " +
    "tan teal thistle tomato turquoise violet wheat white whitesmoke yellow " +
    "yellowgreen transparent currentcolor inherit initial unset revert revert-layer " +
    "canvas canvastext linktext visitedtext activetext buttonface buttontext " +
    "buttonborder field fieldtext highlight highlighttext selecteditem selecteditemtext " +
    "mark marktext graytext accentcolor accentcolortext infobackground infotext " +
    "menu menutext scrollbar window windowtext windowframe threeddarkshadow " +
    "threedshadow threedface threedhighlight threedlightshadow activeborder " +
    "activecaption appworkspace background captiontext inactiveborder inactivecaption " +
    "inactivecaptiontext").split(" "));
  const COLOR_PROPS = new Set(["color", "background-color", "border-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "outline-color", "text-decoration-color", "caret-color", "accent-color", "column-rule-color", "fill", "stroke", "stop-color", "flood-color", "lighting-color", "scrollbar-color", "text-emphasis-color", "border-block-color", "border-inline-color", "border-block-start-color", "border-block-end-color", "border-inline-start-color", "border-inline-end-color"]);
  const ENUM_PROPS = {
    "align-content": ["flex-start",
      "flex-end",
      "center",
      "baseline",
      "stretch",
      "start",
      "end",
      "normal",
      "space-between",
      "space-around",
      "anchor-center"],
    "align-items": ["flex-start",
      "flex-end",
      "center",
      "baseline",
      "stretch",
      "start",
      "end",
      "normal",
      "anchor-center"],
    "align-self": ["auto",
      "flex-start",
      "flex-end",
      "center",
      "baseline",
      "stretch",
      "start",
      "end",
      "normal",
      "anchor-center"],
    "anchor-scope": ["none", "all"],
    "animation-composition": ["replace", "add", "accumulate"],
    "animation-direction": ["normal", "reverse", "alternate", "alternate-reverse"],
    "animation-fill-mode": ["none", "forwards", "backwards", "both"],
    "animation-iteration-count": ["infinite"],
    "animation-play-state": ["running", "paused"],
    "animation-timeline": ["none", "auto"],
    "animation-timing-function": ["ease",
      "linear",
      "ease-in",
      "ease-out",
      "ease-in-out",
      "step-start",
      "step-end",
      "jump-start",
      "jump-end",
      "jump-none",
      "jump-both",
      "start",
      "end"],
    "appearance": ["auto", "none"],
    "backface-visibility": ["visible", "hidden"],
    "background-attachment": ["scroll", "fixed", "local"],
    "background-clip": ["border-box", "padding-box", "content-box", "text"],
    "background-origin": ["border-box", "padding-box", "content-box"],
    "background-repeat": ["repeat", "repeat-x", "repeat-y", "no-repeat", "space", "round"],
    "background-size": ["auto", "cover", "contain"],
    "border-collapse": ["collapse", "separate"],
    "border-image-repeat": ["stretch", "repeat", "round", "space"],
    "border-style": ["none",
      "hidden",
      "dotted",
      "dashed",
      "solid",
      "double",
      "groove",
      "ridge",
      "inset",
      "outset"],
    "box-decoration-break": ["slice", "clone"],
    "box-sizing": ["content-box", "border-box"],
    "break-after": ["auto",
      "avoid",
      "always",
      "page",
      "left",
      "right",
      "recto",
      "verso",
      "column",
      "avoid-page",
      "avoid-column",
      "avoid-region"],
    "break-before": ["auto",
      "avoid",
      "always",
      "page",
      "left",
      "right",
      "recto",
      "verso",
      "column",
      "avoid-page",
      "avoid-column",
      "avoid-region"],
    "break-inside": ["auto", "avoid", "avoid-page", "avoid-column", "avoid-region"],
    "caption-side": ["top", "bottom"],
    "clear": ["none", "left", "right", "both", "inline-start", "inline-end"],
    "clip-path": ["none"],
    "color-scheme": ["normal", "light", "dark"],
    "contain": ["none", "strict", "content", "size", "inline-size", "layout", "style", "paint"],
    "container-type": ["normal", "size", "inline-size"],
    "content-visibility": ["visible", "hidden", "auto"],
    "cursor": ["auto",
      "default",
      "none",
      "context-menu",
      "help",
      "pointer",
      "progress",
      "wait",
      "cell",
      "crosshair",
      "text",
      "vertical-text",
      "alias",
      "copy",
      "move",
      "no-drop",
      "not-allowed",
      "e-resize",
      "n-resize",
      "ne-resize",
      "nw-resize",
      "s-resize",
      "se-resize",
      "sw-resize",
      "w-resize",
      "ew-resize",
      "ns-resize",
      "nesw-resize",
      "nwse-resize",
      "col-resize",
      "row-resize",
      "all-scroll",
      "zoom-in",
      "zoom-out",
      "grab",
      "grabbing"],
    "direction": ["ltr", "rtl"],
    "display": ["block",
      "inline",
      "inline-block",
      "flex",
      "inline-flex",
      "grid",
      "inline-grid",
      "none",
      "contents",
      "table",
      "table-row",
      "table-cell",
      "table-column",
      "table-column-group",
      "table-header-group",
      "table-footer-group",
      "table-row-group",
      "table-caption",
      "list-item",
      "flow-root",
      "flow",
      "ruby",
      "ruby-base",
      "ruby-text",
      "ruby-base-container",
      "ruby-text-container",
      "run-in",
      "math"],
    "empty-cells": ["show", "hide"],
    "field-sizing": ["content", "fixed"],
    "filter": ["none"],
    "backdrop-filter": ["none"],
    "flex-direction": ["row", "row-reverse", "column", "column-reverse"],
    "float": ["left", "right", "none", "inline-start", "inline-end"],
    "font-display": ["auto", "block", "swap", "fallback", "optional"],
    "font-kerning": ["auto", "normal", "none"],
    "font-optical-sizing": ["auto", "none"],
    "font-palette": ["normal", "light", "dark"],
    "font-stretch": ["normal",
      "condensed",
      "expanded",
      "ultra-condensed",
      "extra-condensed",
      "semi-condensed",
      "semi-expanded",
      "extra-expanded",
      "ultra-expanded"],
    "font-style": ["normal", "italic", "oblique"],
    "font-synthesis-position": ["auto", "none"],
    "font-synthesis-small-caps": ["auto", "none"],
    "font-synthesis-style": ["auto", "none"],
    "font-synthesis-weight": ["auto", "none"],
    "font-variant": ["normal", "small-caps"],
    "font-weight": ["normal", "bold", "bolder", "lighter"],
    "forced-color-adjust": ["auto", "none"],
    "hyphens": ["none", "manual", "auto"],
    "image-rendering": ["auto", "crisp-edges", "pixelated", "smooth", "high-quality"],
    "initial-letter-align": ["auto", "alphabetic", "hanging", "ideographic"],
    "interpolate-size": ["numeric-only", "allow-keywords"],
    "isolation": ["auto", "isolate"],
    "justify-content": ["flex-start",
      "flex-end",
      "center",
      "space-between",
      "space-around",
      "space-evenly",
      "start",
      "end",
      "left",
      "right",
      "normal",
      "stretch",
      "anchor-center"],
    "line-break": ["auto", "loose", "normal", "strict", "anywhere"],
    "line-clamp": ["none"],
    "list-style-image": ["none"],
    "list-style-position": ["inside", "outside"],
    "list-style-type": ["disc",
      "circle",
      "square",
      "decimal",
      "decimal-leading-zero",
      "lower-roman",
      "upper-roman",
      "lower-alpha",
      "upper-alpha",
      "lower-greek",
      "lower-latin",
      "upper-latin",
      "armenian",
      "georgian",
      "none"],
    "margin-trim": ["none", "in-flow", "all"],
    "mask-clip": ["border-box",
      "padding-box",
      "content-box",
      "margin-box",
      "fill-box",
      "stroke-box",
      "view-box",
      "no-clip",
      "text"],
    "mask-composite": ["add", "subtract", "intersect", "exclude"],
    "mask-mode": ["match-source", "alpha", "luminance"],
    "mask-origin": ["border-box",
      "padding-box",
      "content-box",
      "margin-box",
      "fill-box",
      "stroke-box",
      "view-box"],
    "mask-repeat": ["repeat", "repeat-x", "repeat-y", "no-repeat", "space", "round"],
    "mask-type": ["luminance", "alpha"],
    "mask-border-mode": ["alpha", "luminance"],
    "mix-blend-mode": ["normal",
      "multiply",
      "screen",
      "overlay",
      "darken",
      "lighten",
      "color-dodge",
      "color-burn",
      "hard-light",
      "soft-light",
      "difference",
      "exclusion",
      "hue",
      "saturation",
      "color",
      "luminosity",
      "plus-lighter"],
    "object-fit": ["fill", "contain", "cover", "none", "scale-down"],
    "object-view-box": ["none"],
    "offset-position": ["auto"],
    "offset-rotate": ["auto", "reverse"],
    "outline-style": ["auto",
      "none",
      "dotted",
      "dashed",
      "solid",
      "double",
      "groove",
      "ridge",
      "inset",
      "outset"],
    "overflow": ["visible", "hidden", "scroll", "auto", "clip"],
    "overflow-anchor": ["auto", "none"],
    "overflow-wrap": ["normal", "break-word", "anywhere"],
    "overflow-x": ["visible", "hidden", "scroll", "auto", "clip"],
    "overflow-y": ["visible", "hidden", "scroll", "auto", "clip"],
    "overscroll-behavior": ["auto", "contain", "none"],
    "overscroll-behavior-block": ["auto", "contain", "none"],
    "overscroll-behavior-inline": ["auto", "contain", "none"],
    "overscroll-behavior-x": ["auto", "contain", "none"],
    "overscroll-behavior-y": ["auto", "contain", "none"],
    "pointer-events": ["auto",
      "none",
      "visiblepainted",
      "visiblefill",
      "visiblestroke",
      "visible",
      "painted",
      "fill",
      "stroke",
      "all"],
    "position": ["static", "relative", "absolute", "fixed", "sticky"],
    "position-try-order": ["normal", "most-height", "most-width", "most-block-size", "most-inline-size"],
    "position-visibility": ["always", "anchors-visible", "anchors-valid", "no-overflow"],
    "print-color-adjust": ["economy", "exact"],
    "quotes": ["none", "auto"],
    "resize": ["none", "both", "horizontal", "vertical", "block", "inline"],
    "ruby-align": ["start", "center", "space-between", "space-around"],
    "ruby-merge": ["separate", "collapse", "auto"],
    "ruby-position": ["over", "under", "inter-character"],
    "scrollbar-color": ["auto"],
    "scrollbar-gutter": ["auto", "stable"],
    "scrollbar-width": ["auto", "thin", "none"],
    "scroll-behavior": ["auto", "smooth", "instant"],
    "scroll-marker-group": ["none", "before", "after"],
    "scroll-snap-align": ["none", "start", "end", "center"],
    "scroll-snap-stop": ["normal", "always"],
    "scroll-snap-type": ["none", "x", "y", "block", "inline", "both", "mandatory", "proximity"],
    "scroll-timeline-axis": ["block", "inline", "x", "y"],
    "shape-outside": ["none", "margin-box", "border-box", "padding-box", "content-box"],
    "speak-as": ["normal",
      "spell-out",
      "digits",
      "literal-punctuation",
      "no-punctuation",
      "auto",
      "bullets",
      "numbers",
      "words"],
    "stroke-linecap": ["butt", "round", "square"],
    "stroke-linejoin": ["miter", "round", "bevel"],
    "fill-rule": ["nonzero", "evenodd"],
    "clip-rule": ["nonzero", "evenodd"],
    "paint-order": ["normal", "fill", "stroke", "markers"],
    "vector-effect": ["none", "non-scaling-stroke"],
    "color-interpolation": ["auto", "srgb", "linearrgb"],
    "color-interpolation-filters": ["auto", "srgb", "linearrgb"],
    "color-rendering": ["auto", "optimizeSpeed", "optimizeQuality"],
    "shape-rendering": ["auto", "optimizeSpeed", "crispEdges", "geometricPrecision"],
    "dominant-baseline": ["auto",
      "text-bottom",
      "alphabetic",
      "ideographic",
      "middle",
      "central",
      "mathematical",
      "hanging",
      "text-top"],
    "alignment-baseline": ["auto",
      "baseline",
      "before-edge",
      "text-before-edge",
      "middle",
      "central",
      "after-edge",
      "text-after-edge",
      "ideographic",
      "alphabetic",
      "hanging",
      "mathematical"],
    "baseline-shift": ["baseline", "sub", "super"],
    "table-layout": ["auto", "fixed"],
    "text-align": ["left", "right", "center", "justify", "start", "end", "match-parent", "justify-all"],
    "text-box-edge": ["auto", "text", "ideographic", "ideographic-ink", "cap", "ex", "alphabetic"],
    "text-box-trim": ["none", "trim-start", "trim-end", "trim-both"],
    "text-decoration-line": ["none", "underline", "overline", "line-through", "blink"],
    "text-decoration-skip-ink": ["auto", "all", "none"],
    "text-decoration-style": ["solid", "double", "dotted", "dashed", "wavy"],
    "text-emphasis-position": ["over", "under", "left", "right", "above", "below", "auto"],
    "text-emphasis-style": ["none", "filled", "open", "dot", "circle", "double-circle", "triangle", "sesame"],
    "text-group-align": ["none", "start", "end", "center"],
    "text-justify": ["auto", "inter-word", "inter-character", "none", "distribute"],
    "text-orientation": ["mixed", "upright", "sideways"],
    "text-overflow": ["clip", "ellipsis"],
    "text-rendering": ["auto", "optimizeSpeed", "optimizeLegibility", "geometricPrecision"],
    "text-spacing-trim": ["normal", "space-all", "space-first", "trim-start"],
    "text-transform": ["none", "uppercase", "lowercase", "capitalize", "full-width", "full-size-kana"],
    "text-underline-position": ["auto", "under", "left", "right", "above", "below"],
    "text-wrap": ["wrap", "nowrap", "balance", "pretty", "stable"],
    "text-wrap-mode": ["wrap", "nowrap"],
    "text-wrap-style": ["auto", "balance", "pretty", "stable"],
    "timeline-scope": ["none"],
    "touch-action": ["auto",
      "none",
      "pan-x",
      "pan-y",
      "pan-left",
      "pan-right",
      "pan-up",
      "pan-down",
      "pinch-zoom",
      "manipulation"],
    "transform-box": ["content-box", "border-box", "fill-box", "stroke-box", "view-box"],
    "transform-style": ["flat", "preserve-3d"],
    "transition-behavior": ["normal", "allow-discrete"],
    "transition-timing-function": ["ease",
      "linear",
      "ease-in",
      "ease-out",
      "ease-in-out",
      "step-start",
      "step-end",
      "jump-start",
      "jump-end",
      "jump-none",
      "jump-both",
      "start",
      "end"],
    "unicode-bidi": ["normal", "embed", "isolate", "bidi-override", "isolate-override", "plaintext"],
    "user-select": ["auto", "text", "none", "contain", "all"],
    "vertical-align": ["baseline", "sub", "super", "text-top", "text-bottom", "middle", "top", "bottom"],
    "view-timeline-axis": ["block", "inline", "x", "y"],
    "visibility": ["visible", "hidden", "collapse"],
    "white-space": ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"],
    "white-space-collapse": ["collapse", "preserve", "preserve-breaks", "preserve-spaces", "break-spaces"],
    "will-change": ["auto", "scroll-position", "contents", "transform", "opacity"],
    "word-break": ["normal", "break-all", "keep-all", "break-word"],
    "writing-mode": ["horizontal-tb", "vertical-rl", "vertical-lr", "sideways-rl", "sideways-lr"]
  };

  // ===== v1.7.1 - CSS color value checks (hex, rgb, hsl) =====
  function splitColorArgs(str) {
    const parts = [];
    let cur = "", curStart = -1;
    for (let i = 0; i <= str.length; i++) {
      const ch = str[i];
      if (ch === "," || ch === "/" || ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || i === str.length) {
        if (cur.length > 0) { parts.push({ text: cur, start: curStart, end: curStart + cur.length }); cur = ""; }
        if (ch === "/") parts.push({ text: "/", start: i, end: i + 1 });
      } else {
        if (cur.length === 0) curStart = i;
        cur += ch;
      }
    }
    return parts;
  }
  function checkRgbArgs(argsStr, argsStart, problems) {
    const parts = splitColorArgs(argsStr);
    const slash = parts.findIndex((pt) => pt.text === "/");
    let colorParts = parts, alphaParts = [];
    if (slash !== -1) { colorParts = parts.slice(0, slash); alphaParts = parts.slice(slash + 1); }
    else if (parts.length === 4) { colorParts = parts.slice(0, 3); alphaParts = parts.slice(3); }
    if (colorParts.length !== 3) {
      problems.push({ severity: "warning", message: "Invalid rgb() - expected 3 color values.", start: argsStart, end: argsStart + argsStr.length });
      return;
    }
    const labels = ["Red", "Green", "Blue"];
    for (let k = 0; k < 3; k++) {
      const comp = colorParts[k];
      if (comp.text.toLowerCase() === "none") continue;
      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)%?$/.test(comp.text)) {
        problems.push({ severity: "warning", message: "Invalid value '" + comp.text + "' in rgb().", start: argsStart + comp.start, end: argsStart + comp.end });
        continue;
      }
      if (comp.text.endsWith("%")) {
        const num = parseFloat(comp.text.slice(0, -1));
        if (num < 0 || num > 100) problems.push({ severity: "warning", message: labels[k] + " '" + comp.text + "' out of range (0%-100%).", start: argsStart + comp.start, end: argsStart + comp.end });
      } else {
        const num = parseFloat(comp.text);
        if (num < 0 || num > 255) problems.push({ severity: "warning", message: labels[k] + " '" + comp.text + "' out of range (0-255).", start: argsStart + comp.start, end: argsStart + comp.end });
      }
    }
    if (alphaParts.length > 0) {
      const a = alphaParts[0];
      if (a.text.toLowerCase() !== "none") {
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)%?$/.test(a.text)) {
          problems.push({ severity: "warning", message: "Invalid alpha '" + a.text + "' in rgb().", start: argsStart + a.start, end: argsStart + a.end });
        } else if (a.text.endsWith("%")) {
          const num = parseFloat(a.text.slice(0, -1));
          if (num < 0 || num > 100) problems.push({ severity: "warning", message: "Alpha '" + a.text + "' out of range (0%-100%).", start: argsStart + a.start, end: argsStart + a.end });
        } else {
          const num = parseFloat(a.text);
          if (num < 0 || num > 1) problems.push({ severity: "warning", message: "Alpha '" + a.text + "' out of range (0-1).", start: argsStart + a.start, end: argsStart + a.end });
        }
      }
    }
  }
  function checkHslArgs(argsStr, argsStart, problems) {
    const parts = splitColorArgs(argsStr);
    const slash = parts.findIndex((pt) => pt.text === "/");
    let colorParts = parts, alphaParts = [];
    if (slash !== -1) { colorParts = parts.slice(0, slash); alphaParts = parts.slice(slash + 1); }
    else if (parts.length === 4) { colorParts = parts.slice(0, 3); alphaParts = parts.slice(3); }
    if (colorParts.length !== 3) {
      problems.push({ severity: "warning", message: "Invalid hsl() - expected 3 color values.", start: argsStart, end: argsStart + argsStr.length });
      return;
    }
    const hue = colorParts[0];
    if (hue.text.toLowerCase() !== "none") {
      const unitMatch = /([a-z%]+)$/i.exec(hue.text);
      const unit = unitMatch ? unitMatch[1].toLowerCase() : "";
      // Hue wraps modulo-360 (CSS Color 4): any number is valid, e.g. hsl(400,...) = hsl(40,...).
      const num = parseFloat(hue.text);
      if (isNaN(num)) problems.push({ severity: "warning", message: "Hue '" + hue.text + "' is not a number.", start: argsStart + hue.start, end: argsStart + hue.end });
    }
    const labels = ["Saturation", "Lightness"];
    for (let k = 1; k < 3; k++) {
      const comp = colorParts[k];
      if (comp.text.toLowerCase() === "none") continue;
      if (!comp.text.endsWith("%")) {
        problems.push({ severity: "warning", message: labels[k - 1] + " '" + comp.text + "' should be a percentage.", start: argsStart + comp.start, end: argsStart + comp.end });
      } else {
        const num = parseFloat(comp.text.slice(0, -1));
        if (isNaN(num) || num < 0 || num > 100) problems.push({ severity: "warning", message: labels[k - 1] + " '" + comp.text + "' out of range (0%-100%).", start: argsStart + comp.start, end: argsStart + comp.end });
      }
    }
    if (alphaParts.length > 0) {
      const a = alphaParts[0];
      if (a.text.toLowerCase() !== "none") {
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)%?$/.test(a.text)) {
          problems.push({ severity: "warning", message: "Invalid alpha '" + a.text + "' in hsl().", start: argsStart + a.start, end: argsStart + a.end });
        } else if (a.text.endsWith("%")) {
          const num = parseFloat(a.text.slice(0, -1));
          if (num < 0 || num > 100) problems.push({ severity: "warning", message: "Alpha '" + a.text + "' out of range (0%-100%).", start: argsStart + a.start, end: argsStart + a.end });
        } else {
          const num = parseFloat(a.text);
          if (num < 0 || num > 1) problems.push({ severity: "warning", message: "Alpha '" + a.text + "' out of range (0-1).", start: argsStart + a.start, end: argsStart + a.end });
        }
      }
    }
  }
  function checkCssColorValue(value, valueStart, problems) {
    // Blank out url(), selector(), element() - these take IDs/fragments, not colors
    const skipFns = ["url(", "selector(", "element("];
    let v = "";
    let i = 0;
    while (i < value.length) {
      let matchedFn = null;
      for (const fn of skipFns) {
        if (value.slice(i, i + fn.length).toLowerCase() === fn) { matchedFn = fn; break; }
      }
      if (matchedFn) {
        let depth = 1, j = i + matchedFn.length;
        while (j < value.length && depth > 0) {
          if (value[j] === "(") depth++;
          else if (value[j] === ")") depth--;
          j++;
        }
        v += " ".repeat(j - i);
        i = j;
      } else { v += value[i]; i++; }
    }
    const hexRe = /#([A-Za-z0-9_-]+)/g;
    let m;
    while ((m = hexRe.exec(v)) !== null) {
      const token = m[1];
      if (!/^[0-9a-fA-F]{3}$/.test(token) && !/^[0-9a-fA-F]{4}$/.test(token) && !/^[0-9a-fA-F]{6}$/.test(token) && !/^[0-9a-fA-F]{8}$/.test(token)) {
        problems.push({ severity: "warning", message: "Invalid hex color '#" + token + "'. Use 3, 4, 6 or 8 hex digits.", start: valueStart + m.index, end: valueStart + m.index + m[0].length });
      }
    }
    const fnRe = /\b(rgba?|hsla?)\s*\(/gi;
    while ((m = fnRe.exec(v)) !== null) {
      const name = m[1].toLowerCase();
      const openIdx = m.index + m[0].length - 1;
      let depth = 1, j = openIdx + 1;
      while (j < v.length && depth > 0) {
        if (v[j] === "(") depth++;
        else if (v[j] === ")") depth--;
        j++;
      }
      if (depth !== 0) continue;
      const argsStr = v.slice(openIdx + 1, j - 1);
      if (/\b(var|calc|min|max|clamp|env|attr)\s*\(/i.test(argsStr)) { fnRe.lastIndex = j; continue; }
      if (name === "rgb" || name === "rgba") checkRgbArgs(argsStr, valueStart + openIdx + 1, problems);
      else checkHslArgs(argsStr, valueStart + openIdx + 1, problems);
      fnRe.lastIndex = j;
    }
  }
  // Valid CSS length / angle / time / frequency / resolution units.
  const CSS_UNITS = new Set(
    (
      "px % em rem ex ch vw vh vmin vmax svw svh svmin svmax lvw lvh lvmin lvmax " +
      "dvw dvh dvmin dvmax cqw cqh cqi cqb cqmin cqmax fr deg grad rad turn s ms hz khz dpi dpcm dppx x " +
      "cm mm in pt pc q cap ic lh rlh vb vi"
    ).split(" "),
  );
  function checkCssLengthUnits(value, valueStart, problems) {
    // Hex colors and url() contents are not lengths: blank them with
    // same-length spaces (so offsets stay exact) before scanning.
    const scanned = value
      .replace(/#[A-Za-z0-9_-]+/g, (s) => " ".repeat(s.length))
      .replace(/url\([^)]*\)/gi, (s) => " ".repeat(s.length));
    const numRe = /(-?\d*\.?\d+(?:[eE][+-]?\d+)?)([a-zA-Z%]+)/g;
    let m;
    while ((m = numRe.exec(scanned)) !== null) {
      const unit = m[2];
      if (CSS_UNITS.has(unit.toLowerCase())) continue;
      // A number glued to an identifier (font name, custom property, var())
      // is not a length: `x-2y`, `--gap-2x`. A minus sign after a space or
      // an operator is a real negative number: `-10pxx` still gets checked.
      const prev = m.index > 0 ? scanned[m.index - 1] : "";
      if (/[A-Za-z_$]/.test(prev)) continue;
      if (
        prev === "-" &&
        m.index > 1 &&
        /[A-Za-z_$-]/.test(scanned[m.index - 2])
      )
        continue;
      const uLower = unit.toLowerCase();
      let sug = null;
      for (const u of CSS_UNITS) {
        if (Math.abs(u.length - uLower.length) > 1) continue;
        if (editDistance(uLower, u) === 1) {
          sug = u;
          break;
        }
      }
      if (!sug) sug = transposeSuggest(uLower, CSS_UNITS);
      const uStart = valueStart + m.index + m[1].length;
      if (sug)
        problems.push({
          severity: "warning",
          message: "Unknown unit '" + unit + "'. Did you mean '" + sug + "'?",
          start: uStart,
          end: uStart + unit.length,
        });
      else
        problems.push({
          severity: "warning",
          message: "Unknown unit '" + unit + "'",
          start: uStart,
          end: uStart + unit.length,
        });
    }
  }
  function validateCss(code) {
    const problems = [];
    const masked = maskCss(code);
    const opens = [];
    for (let i = 0; i < masked.length; i++) {
      if (masked[i] === "{") opens.push(i);
      else if (masked[i] === "}") {
        if (opens.length) opens.pop();
        else problems.push({ severity: "error", message: "Unexpected }", start: i, end: i + 1 });
      }
    }
    for (const openIdx of opens) problems.push({ severity: "error", message: "Missing closing }", start: openIdx, end: openIdx + 1 });
    const propRe = /([A-Za-z][A-Za-z-]*)(\s*:\s*)([^;{}]*)/g;
    let m;
    while ((m = propRe.exec(masked)) !== null) {
      if (masked[m.index + m[0].length] === "{") continue;
      const prop = m[1].toLowerCase();
      const start = m.index, end = m.index + m[1].length;
      // Custom property (--name): regex strips the "--", so check raw text before the match.
      if (m.index >= 2 && masked[m.index - 2] === "-" && masked[m.index - 1] === "-") continue;
      if (prop.startsWith("--")) continue;
      const vm = /^-(webkit|moz|ms|o)-(.+)$/.exec(prop);
      if (vm) continue;
      if (!KNOWN_CSS_PROPS.has(prop)) {
        let sug = null;
        for (const p of KNOWN_CSS_PROPS) {
          if (Math.abs(p.length - prop.length) > 1) continue;
          if (editDistance(prop, p) === 1) { sug = p; break; }
        }
        if (sug) problems.push({ severity: "warning", message: "Unknown property '" + prop + "'. Did you mean '" + sug + "'?", start, end });
        continue;
      }
      const valStart = m.index + m[1].length + m[2].length;
      checkCssColorValue(m[3], valStart, problems);
      const cleaned = m[3].replace(/\s*!important\s*$/, "").trim();
      checkCssLengthUnits(cleaned, valStart, problems);
      if (!/^[A-Za-z][A-Za-z-]*$/.test(cleaned)) continue;
      const vLower = cleaned.toLowerCase();
      const vEnd = valStart + cleaned.length;
      if (COLOR_PROPS.has(prop)) {
        if (KNOWN_COLORS.has(vLower)) continue;
        let sug = null;
        for (const c of KNOWN_COLORS) {
          if (Math.abs(c.length - vLower.length) > 1) continue;
          if (editDistance(vLower, c) === 1) { sug = c; break; }
        }
        if (!sug) sug = transposeSuggest(vLower, KNOWN_COLORS);
        // Double typo: "reedd" -> "red" is 2 edits, so the passes above
        // miss it and the value stays silent. Full distance check here.
        if (!sug) {
          for (const c of KNOWN_COLORS) {
            if (Math.abs(c.length - vLower.length) > 2) continue;
            if (editDistanceFull(vLower, c) === 2) { sug = c; break; }
          }
        }
        if (sug) problems.push({ severity: "warning", message: "Unknown color '" + cleaned + "'. Did you mean '" + sug + "'?", start: valStart, end: vEnd });
      } else if (ENUM_PROPS[prop]) {
        if (vLower === "inherit" || vLower === "initial" || vLower === "unset" || vLower === "revert" || vLower === "revert-layer") continue;
        const allowed = ENUM_PROPS[prop];
        if (allowed.some((c) => c.toLowerCase() === vLower)) continue;
        let sug = null;
        for (const c of allowed) {
          if (Math.abs(c.length - vLower.length) > 1) continue;
          if (editDistance(vLower, c.toLowerCase()) === 1) { sug = c; break; }
        }
        if (!sug) sug = transposeSuggest(vLower, allowed);
        // Double typo: same fix as colors ("blcok" -> "block" is 2 edits).
        if (!sug) {
          for (const c of allowed) {
            if (Math.abs(c.length - vLower.length) > 2) continue;
            if (editDistanceFull(vLower, c.toLowerCase()) === 2) { sug = c; break; }
          }
        }
        if (sug) problems.push({ severity: "warning", message: "Unknown value '" + cleaned + "' for '" + prop + "'. Did you mean '" + sug + "'?", start: valStart, end: vEnd });
      }
    }
    // ===== v1.7.1 — Vendor prefix suggestions (2026) =====
    // Only these still need a prefix in 2026. Everything else
    // (transform, transition, animation, flexbox, border-radius,
    // box-shadow, gradients, clip-path, appearance, hyphens,
    // mask-image, line-clamp) works unprefixed in current
    // browsers, so suggesting a prefix for them would be noise.
    // Bar: the unprefixed form is not yet Baseline Widely
    // available, or a current browser still needs the prefix.
    // -moz-: only text-size-adjust still needs it (Firefox has no
    // unprefixed form). For the rest, Firefox already supports the
    // standard form, so -moz- would be dead code — do not add it.
    // -o-: never. Opera is Chromium/Blink since Opera 15 (2013),
    // so the -webkit- line already covers Opera too.
    const PREFIX_REQUIRED = {
      "user-select": [{ prefix: "-webkit-", browsers: "Safari" }],
      "backdrop-filter": [{ prefix: "-webkit-", browsers: "Safari below 18" }],
      "box-decoration-break": [{ prefix: "-webkit-", browsers: "Safari" }],
      "print-color-adjust": [{ prefix: "-webkit-", browsers: "Chrome and Safari" }],
      "text-size-adjust": [
        { prefix: "-webkit-", browsers: "iOS Safari" },
        { prefix: "-moz-", browsers: "Firefox" }
      ]
    };
    // background-clip only needs the prefix for the "text" value.
    const PREFIX_VALUE_REQUIRED = {
      "background-clip": { value: "text", needs: [{ prefix: "-webkit-", browsers: "Safari" }] }
    };
    // The prop regex cannot match a leading "-", so a prefixed prop
    // like "-webkit-user-select" arrives as "webkit-user-select".
    // Rebuild the full name from the "-" before the match, so the
    // block set holds "-webkit-user-select" and the presence check
    // actually finds it. Custom props ("--x") keep their own skip.
    function fullPropName(pm) {
      const base = pm[1].toLowerCase();
      if (pm.index >= 1 && masked[pm.index - 1] === "-" && !(pm.index >= 2 && masked[pm.index - 2] === "-")) return "-" + base;
      return base;
    }
    // Group every declaration by its innermost rule block, so a
    // prefix written in a different rule does not count as present.
    const prefixMatches = [];
    {
      const pr = /([A-Za-z][A-Za-z-]*)(\s*:\s*)([^;{}]*)/g;
      let pm;
      while ((pm = pr.exec(masked)) !== null) prefixMatches.push(pm);
    }
    const matchBlock = new Map(); // match index -> Set of props in its block
    {
      const stack = []; // each: Set of prop names in that block
      let mi = 0;
      for (let si = 0; si < masked.length; si++) {
        while (mi < prefixMatches.length && prefixMatches[mi].index === si) {
          const pm = prefixMatches[mi];
          const followedByBrace = masked[pm.index + pm[0].length] === "{";
          const isCustom = (pm.index >= 2 && masked[pm.index - 2] === "-" && masked[pm.index - 1] === "-") || pm[1].startsWith("--");
          if (stack.length && !followedByBrace && !isCustom) {
            stack[stack.length - 1].add(fullPropName(pm));
            matchBlock.set(mi, stack[stack.length - 1]);
          }
          mi++;
        }
        if (masked[si] === "{") stack.push(new Set());
        else if (masked[si] === "}") { if (stack.length) stack.pop(); }
      }
    }
    for (let pj = 0; pj < prefixMatches.length; pj++) {
      const pm = prefixMatches[pj];
      if (masked[pm.index + pm[0].length] === "{") continue;
      if (pm.index >= 2 && masked[pm.index - 2] === "-" && masked[pm.index - 1] === "-") continue;
      const pProp = pm[1].toLowerCase();
      if (pProp.startsWith("--")) continue;
      if (/^-(webkit|moz|ms|o)-/.test(pProp)) continue;
      const inBlock = matchBlock.get(pj);
      if (!inBlock) continue;
      const rawVal = pm[3];
      const cleanVal = rawVal.replace(/\s*!important\s*$/, "").trim();
      const vLow = cleanVal.toLowerCase();
      if (vLow === "inherit" || vLow === "initial" || vLow === "unset" || vLow === "revert" || vLow === "revert-layer") continue;
      let need = PREFIX_REQUIRED[pProp] || null;
      if (!need && PREFIX_VALUE_REQUIRED[pProp] && vLow === PREFIX_VALUE_REQUIRED[pProp].value) need = PREFIX_VALUE_REQUIRED[pProp].needs;
      if (!need) continue;
      const missing = need.filter((e) => !inBlock.has(e.prefix + pProp));
      if (!missing.length) continue;
      const important = /\s*!important\s*$/.test(rawVal) ? " !important" : "";
      const adds = missing.map((e) => "'" + e.prefix + pProp + ": " + cleanVal + important + ";' for " + e.browsers).join(", ");
      const word = missing.length === 1 ? "prefix" : "prefixes";
      problems.push({ severity: "warning", message: "Missing " + word + " for '" + pProp + "'. Add " + adds + ".", start: pm.index, end: pm.index + pm[1].length });
    }
    problems.sort((a, b) => a.start - b.start);
    return problems;
  }

  // ===== v1.7.0 — JS linter (typos on known objects, globals, event names) =====
  const JS_METHODS = {
    document: ["addEventListener",
      "removeEventListener",
      "getElementById",
      "getElementsByClassName",
      "getElementsByTagName",
      "getElementsByName",
      "querySelector",
      "querySelectorAll",
      "createElement",
      "createTextNode",
      "createDocumentFragment",
      "write",
      "writeln",
      "title",
      "body",
      "head",
      "documentElement",
      "cookie",
      "location",
      "forms",
      "images",
      "links",
      "activeElement",
      "readyState",
      "hasFocus",
      "open",
      "close"],
    window: ["addEventListener",
      "removeEventListener",
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "alert",
      "confirm",
      "prompt",
      "fetch",
      "open",
      "close",
      "scrollTo",
      "scrollBy",
      "localStorage",
      "sessionStorage",
      "location",
      "document",
      "navigator",
      "history",
      "innerWidth",
      "innerHeight",
      "outerWidth",
      "outerHeight",
      "pageXOffset",
      "pageYOffset",
      "getComputedStyle",
      "matchMedia",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "btoa",
      "atob",
      "postMessage",
      "print",
      "stop",
      "focus",
      "blur"],
    console: ["log",
      "warn",
      "error",
      "info",
      "debug",
      "table",
      "clear",
      "count",
      "time",
      "timeEnd",
      "group",
      "groupEnd",
      "trace",
      "assert"],
    Math: ["floor",
      "ceil",
      "round",
      "random",
      "max",
      "min",
      "pow",
      "sqrt",
      "abs",
      "trunc",
      "sign",
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "atan2",
      "log",
      "log2",
      "log10",
      "exp",
      "PI",
      "E"],
    JSON: ["parse", "stringify"],
    Array: ["isArray", "from", "of"],
    Object: ["keys",
      "values",
      "entries",
      "assign",
      "freeze",
      "seal",
      "create",
      "defineProperty",
      "getPrototypeOf",
      "hasOwn",
      "is"],
    String: ["fromCharCode", "fromCodePoint", "raw"],
    Number: ["parseInt",
      "parseFloat",
      "isNaN",
      "isInteger",
      "isFinite",
      "MAX_SAFE_INTEGER",
      "MIN_SAFE_INTEGER",
      "NaN",
      "POSITIVE_INFINITY"],
    localStorage: ["getItem", "setItem", "removeItem", "clear", "key", "length"],
    sessionStorage: ["getItem", "setItem", "removeItem", "clear", "key", "length"],
    navigator: ["clipboard",
      "geolocation",
      "onLine",
      "language",
      "userAgent",
      "vibrate",
      "share",
      "mediaDevices"],
    location: ["href",
      "reload",
      "replace",
      "assign",
      "pathname",
      "search",
      "hash",
      "host",
      "hostname",
      "protocol",
      "origin",
      "port"],
    history: ["back", "forward", "go", "pushState", "replaceState", "length", "state"]
  };
  const JS_GLOBALS = ["console",
    "document",
    "window",
    "Math",
    "JSON",
    "Array",
    "Object",
    "String",
    "Number",
    "Boolean",
    "localStorage",
    "sessionStorage",
    "navigator",
    "location",
    "history",
    "alert",
    "confirm",
    "prompt",
    "fetch",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "parseInt",
    "parseFloat",
    "isNaN",
    "isFinite",
    "eval",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "getComputedStyle",
    "btoa",
    "atob",
    "structuredClone",
    "queueMicrotask",
    // Capitalized browser interfaces (valid globals, must not be flagged as typos).
    "Window",
    "Document",
    "History",
    "Navigator",
    "Location",
    "Element",
    "HTMLElement",
    "Node",
    "Event",
    "CustomEvent",
    "MouseEvent",
    "KeyboardEvent",
    "URL",
    "URLSearchParams",
    "FormData",
    "Blob",
    "File",
    "FileReader",
    "Image",
    "Audio",
    "XMLHttpRequest",
    "WebSocket",
    "Worker",
    "Promise",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "Symbol",
    "Proxy",
    "Reflect",
    "Date",
    "RegExp",
    "Error",
    "TypeError",
    "RangeError",
    "SyntaxError",
    "ArrayBuffer",
    "DataView",
    "Intl",
    "BigInt",
    // Core JS built-ins (valid globals, must not be flagged as undefined).
    "Function",
    "AggregateError",
    "EvalError",
    "URIError",
    "ReferenceError",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "unescape",
    "WeakRef",
    "FinalizationRegistry",
    "Atomics",
    "SharedArrayBuffer"];
  const JS_KEYWORDS = new Set(("break case catch class const continue debugger default delete do else " +
    "export extends false finally for function if import in instanceof new null " +
    "return super switch this throw true try typeof var void while with yield " +
    "let static await async of get set").split(" "));
  const KNOWN_EVENTS = ["click",
    "dblclick",
    "mousedown",
    "mouseup",
    "mousemove",
    "mouseover",
    "mouseout",
    "mouseenter",
    "mouseleave",
    "contextmenu",
    "wheel",
    "keydown",
    "keyup",
    "keypress",
    "focus",
    "blur",
    "focusin",
    "focusout",
    "submit",
    "change",
    "input",
    "reset",
    "select",
    "load",
    "DOMContentLoaded",
    "beforeunload",
    "unload",
    "resize",
    "scroll",
    "error",
    "abort",
    "timeout",
    "progress",
    "loadstart",
    "loadend",
    "pointerdown",
    "pointerup",
    "pointermove",
    "pointerover",
    "pointerout",
    "pointerenter",
    "pointerleave",
    "touchstart",
    "touchend",
    "touchmove",
    "touchcancel",
    "animationstart",
    "animationend",
    "animationiteration",
    "transitionstart",
    "transitionend",
    "transitionrun",
    "transitioncancel",
    "drag",
    "dragstart",
    "dragend",
    "dragover",
    "dragenter",
    "dragleave",
    "drop",
    "copy",
    "cut",
    "paste",
    "play",
    "pause",
    "ended",
    "volumechange",
    "timeupdate",
    "seeking",
    "seeked",
    "canplay",
    "canplaythrough",
    "waiting",
    "playing",
    "stalled",
    "suspend",
    "emptied",
    "loadedmetadata",
    "loadeddata",
    "online",
    "offline",
    "storage",
    "hashchange",
    "popstate",
    "pageshow",
    "pagehide",
    "message",
    "open",
    "close",
    "visibilitychange",
    "fullscreenchange",
    "pointerlockchange",
    "deviceorientation",
    "devicemotion"];

  function maskJs(code, keepStrings) {
    let out = "";
    let i = 0, n = code.length;
    while (i < n) {
      if (code.startsWith("//", i)) {
        let j = code.indexOf("\n", i);
        if (j === -1) j = n;
        out += " ".repeat(j - i);
        i = j;
      } else if (code.startsWith("/*", i)) {
        const end = code.indexOf("*/", i + 2);
        const stop = end === -1 ? n : end + 2;
        out += " ".repeat(stop - i);
        i = stop;
      } else if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
        const q = code[i];
        let j = i + 1;
        while (j < n && code[j] !== q) { if (code[j] === "\\") j++; j++; }
        const stop = j < n ? j + 1 : n;
        if (keepStrings) out += code.slice(i, stop);
        else out += " ".repeat(stop - i);
        i = stop;
      } else { out += code[i]; i++; }
    }
    return out;
  }

  function suggestName(name, candidates) {
    const lower = name.toLowerCase();
    for (const c of candidates) {
      if (c.toLowerCase() === lower) return c;
    }
    for (const c of candidates) {
      if (Math.abs(c.length - name.length) > 1) continue;
      if (editDistance(lower, c.toLowerCase()) === 1) return c;
    }
    return transposeSuggest(lower, candidates);
  }

  // ===== Strict JS checks: unterminated strings (template literals incl. ${} nesting) =====
  function skipJsTemplate(code, start) {
    let j = start + 1, n = code.length, depth = 0;
    while (j < n) {
      const c = code[j];
      if (c === "\\") { j += 2; continue; }
      if (depth === 0) {
        if (c === "`") return j + 1;
        if (c === "$" && code[j + 1] === "{") { depth++; j += 2; continue; }
        j++;
      } else {
        if (c === '"' || c === "'") {
          const q = c; j++;
          while (j < n && code[j] !== q && code[j] !== "\n") { if (code[j] === "\\") j++; j++; }
          if (j < n && code[j] === q) j++;
          continue;
        }
        if (c === "`") { const end = skipJsTemplate(code, j); if (end === -1) return -1; j = end; continue; }
        if (c === "{") depth++;
        else if (c === "}") depth--;
        j++;
      }
    }
    return -1;
  }

  function scanJsUnterminated(code) {
    const problems = [];
    let i = 0, n = code.length;
    while (i < n) {
      if (code.startsWith("//", i)) { let j = code.indexOf("\n", i); if (j === -1) j = n; i = j; }
      else if (code.startsWith("/*", i)) { const end = code.indexOf("*/", i + 2); i = end === -1 ? n : end + 2; }
      else if (code[i] === '"' || code[i] === "'") {
        // '/' before a quote: regex start OR division. If a value ends right before '/',
        // it is division (e.g. 10/"2"), so do NOT skip the quote.
        if (code[i - 1] === "/") {
          const beforeSlash = i >= 2 ? code[i - 2] : "";
          if (!/[A-Za-z0-9_$\)\]\}]/.test(beforeSlash)) { i++; continue; }
        }
        const q = code[i], start = i; let j = i + 1, closed = false;
        while (j < n) {
          if (code[j] === "\\") { j += 2; continue; }
          if (code[j] === q) { closed = true; break; }
          if (code[j] === "\n") break;
          j++;
        }
        if (!closed) {
          let end = code.indexOf("\n", start);
          if (end === -1) end = n;
          problems.push({ severity: "error", message: "Unterminated string", start, end });
          i = end;
        } else i = j + 1;
      }
      else if (code[i] === "`") {
        const end = skipJsTemplate(code, i);
        if (end === -1) {
          problems.push({ severity: "error", message: "Unterminated template literal", start: i, end: n });
          i = n;
        } else i = end;
      }
      else i++;
    }
    return problems;
  }


  // ===== Brace / paren / bracket balance check =====
  function scanJsBalance(code) {
    const problems = [];
    const stack = [];
    const pairs = { "}": "{", ")": "(", "]": "[" };
    const names = { "{": "}", "(": ")", "[": "]" };
    const regexKeywords = new Set(["return", "typeof", "case", "delete", "void", "in", "of", "new", "yield", "await", "instanceof", "throw", "else", "do"]);
    let i = 0, n = code.length;
    while (i < n) {
      if (code.startsWith("//", i)) { let j = code.indexOf("\n", i); if (j === -1) j = n; i = j; continue; }
      if (code.startsWith("/*", i)) { const end = code.indexOf("*/", i + 2); i = end === -1 ? n : end + 2; continue; }
      if (code[i] === '"' || code[i] === "'") {
        const q = code[i]; let j = i + 1;
        while (j < n) {
          if (code[j] === "\\") { j += 2; continue; }
          if (code[j] === q) break;
          if (code[j] === "\n") break;
          j++;
        }
        i = j + 1; continue;
      }
      // skipJsTemplate returns -1 for an unterminated literal: without the
      // guard, i wrapped to 0 and the linter looped forever (tab hang).
      // It already returns the index PAST the closing backtick: no +1.
      if (code[i] === "`") { const _tend = skipJsTemplate(code, i); i = _tend === -1 ? n : _tend; continue; }
      if (code[i] === "/") {
        let k = i - 1;
        while (k >= 0 && /\s/.test(code[k])) k--;
        let wordEnd = k, wordStart = k;
        while (wordStart >= 0 && /[A-Za-z0-9_$]/.test(code[wordStart])) wordStart--;
        const word = code.slice(wordStart + 1, wordEnd + 1);
        const prev = k >= 0 ? code[k] : "";
        const isRegex = regexKeywords.has(word) || !/[A-Za-z0-9_$\)\]\}]/.test(prev);
        if (isRegex && code[i + 1] !== "/" && code[i + 1] !== "*") {
          let j = i + 1, inClass = false;
          while (j < n) {
            if (code[j] === "\\") { j += 2; continue; }
            if (code[j] === "[") inClass = true;
            if (code[j] === "]") inClass = false;
            if (code[j] === "/" && !inClass) break;
            if (code[j] === "\n") break;
            j++;
          }
          while (j < n && /[a-z]/i.test(code[j])) j++;
          i = j; continue;
        }
        i++; continue;
      }
      const ch = code[i];
      if (ch === "{" || ch === "(" || ch === "[") stack.push({ ch, pos: i });
      else if (ch === "}" || ch === ")" || ch === "]") {
        const want = pairs[ch];
        if (!stack.length || stack[stack.length - 1].ch !== want) {
          problems.push({ severity: "error", message: "Unexpected '" + ch + "'", start: i, end: i + 1 });
        } else stack.pop();
      }
      i++;
    }
    for (const item of stack) problems.push({ severity: "error", message: "Missing closing '" + names[item.ch] + "'", start: item.pos, end: item.pos + 1 });
    return problems;
  }

  // ===== v1.7.1 — JS linter: reference / unused / logic checks =====
  const JS_NO_UNDEF_AMBIENT = new Set(("arguments undefined NaN Infinity globalThis self top parent frames " +
    "name status closed length event origin opener scrollX scrollY screenX screenY devicePixelRatio " +
    "innerWidth innerHeight outerWidth outerHeight pageXOffset pageYOffset screen isSecureContext " +
    "crossOriginIsolated define require module exports process Buffer __dirname __filename global").split(" "));
  const JS_LIB_GLOBALS = new Set(("$ jQuery _ axios moment gsap TweenMax TimelineMax Chart Vue React ReactDOM " +
    "angular Swal Sweetalert Toastify bootstrap Popper d3 THREE fabric L gapi firebase supabase Stripe paypal " +
    "hljs CodeMirror eruda anime lottie AOS Swiper Splide Glide Typed Confetti QRCode JsBarcode html2canvas " +
    "jspdf FileSaver saveAs Papa dayjs lodash Rx rxjs Vuex Pinia Backbone Ember Meteor io Pusher gtag fbq " +
    "dataLayer Intercom drift zE Tawk Crisp LiveChat hubspot markeTo salesforce zendesk").split(" "));
  // Blank regex literals in masked code (same heuristic as scanJsBalance).
  // Without this, /foo/ and /==/ inside a regex would be read as code.
  function blankJsRegex(code, masked) {
    const out = masked.split("");
    const regexKeywords = new Set(["return", "typeof", "case", "delete", "void", "in", "of", "new", "yield", "await", "instanceof", "throw", "else", "do"]);
    let i = 0, n = code.length;
    while (i < n) {
      if (code.startsWith("//", i)) { let j = code.indexOf("\n", i); if (j === -1) j = n; i = j; continue; }
      if (code.startsWith("/*", i)) { const end = code.indexOf("*/", i + 2); i = end === -1 ? n : end + 2; continue; }
      if (code[i] === '"' || code[i] === "'") {
        const q = code[i]; let j = i + 1;
        while (j < n) { if (code[j] === "\\") { j += 2; continue; } if (code[j] === q) break; if (code[j] === "\n") break; j++; }
        i = j + 1; continue;
      }
      if (code[i] === "`") { const t = skipJsTemplate(code, i); i = t === -1 ? n : t; continue; }
      if (code[i] === "/") {
        let k = i - 1; while (k >= 0 && /\s/.test(code[k])) k--;
        let wordEnd = k, wordStart = k;
        while (wordStart >= 0 && /[A-Za-z0-9_$]/.test(code[wordStart])) wordStart--;
        const word = code.slice(wordStart + 1, wordEnd + 1);
        const prev = k >= 0 ? code[k] : "";
        const isRegex = regexKeywords.has(word) || !/[A-Za-z0-9_$\)\]\}]/.test(prev);
        if (isRegex && code[i + 1] !== "/" && code[i + 1] !== "*") {
          let j = i + 1, inClass = false;
          while (j < n) {
            if (code[j] === "\\") { j += 2; continue; }
            if (code[j] === "[") inClass = true;
            if (code[j] === "]") inClass = false;
            if (code[j] === "/" && !inClass) break;
            if (code[j] === "\n") break;
            j++;
          }
          while (j < n && /[a-z]/i.test(code[j])) j++;
          for (let t = i; t < j; t++) out[t] = " ";
          i = j; continue;
        }
        i++; continue;
      }
      i++;
    }
    return out.join("");
  }
  function jsMatchBracket(masked, openIdx) {
    const pairs = { "(": ")", "[": "]", "{": "}" };
    const open = masked[openIdx], close = pairs[open];
    let depth = 0;
    for (let i = openIdx; i < masked.length; i++) {
      if (masked[i] === open) depth++;
      else if (masked[i] === close) { depth--; if (depth === 0) return i; }
    }
    return -1;
  }
  // Skip an initializer: stop at , ; ) at depth 0 (relative to start).
  function jsSkipInit(masked, i) {
    let depth = 0;
    while (i < masked.length) {
      const ch = masked[i];
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      else if (ch === ")" || ch === "]" || ch === "}") {
        if (depth === 0) return i;
        depth--;
      } else if (depth === 0 && (ch === "," || ch === ";" || ch === ")")) return i;
      i++;
    }
    return i;
  }
  // Collect names from a destructuring pattern. `base` = absolute index of pattern start.
  function jsCollectDestructured(text, base, kind, out, scopeStart) {
    if (scopeStart === undefined) scopeStart = base - 1;
    let i = 0, n = text.length;
    const pushName = (name, idx) => { if (name && !JS_KEYWORDS.has(name)) out.push({ name, kind, index: base + idx, depth: -1, scopeIndex: scopeStart }); };
    while (i < n) {
      while (i < n && /[\s,]/.test(text[i])) i++;
      if (i >= n) break;
      if (text.startsWith("...", i)) {
        i += 3;
        const m = /^[A-Za-z_$][\w$]*/.exec(text.slice(i));
        if (m) { pushName(m[0], i); i += m[0].length; }
        continue;
      }
      if (text[i] === "{" || text[i] === "[") {
        const close = jsMatchBracket(text, i);
        if (close === -1) break;
        jsCollectDestructured(text.slice(i + 1, close), base + i + 1, kind, out, scopeStart);
        i = close + 1;
        if (text[i] === "=") i = jsSkipInit(text, i + 1);
        continue;
      }
      const m = /^[A-Za-z_$][\w$]*/.exec(text.slice(i));
      if (!m) { i++; continue; }
      const name = m[0];
      let j = i + name.length;
      while (j < n && /\s/.test(text[j])) j++;
      if (text[j] === ":") {
        j++;
        while (j < n && /\s/.test(text[j])) j++;
        if (text[j] === "{" || text[j] === "[") {
          const close = jsMatchBracket(text, j);
          if (close !== -1) { jsCollectDestructured(text.slice(j + 1, close), base + j + 1, kind, out, scopeStart); i = close + 1; }
          else i = j + 1;
        } else {
          const vm = /^[A-Za-z_$][\w$]*/.exec(text.slice(j));
          if (vm) { pushName(vm[0], j); j += vm[0].length; }
          i = j;
        }
        if (text[i] === "=") i = jsSkipInit(text, i + 1);
        continue;
      }
      pushName(name, i);
      i = j;
      if (text[i] === "=") i = jsSkipInit(text, i + 1);
    }
  }
  // Full declaration collector: let/const/var (incl. multi-declarator + destructuring),
  // function/class names. Returns [{name, kind, index}] with absolute indices.
  function collectJsDeclarations(masked) {
    const out = [];
    const kwRe = /\b(let|const|var|function|class)\b/g;
    let m;
    while ((m = kwRe.exec(masked)) !== null) {
      const kind = m[1];
      let i = m.index + m[0].length;
      if (kind === "function") {
        while (i < masked.length && /\s/.test(masked[i])) i++;
        if (masked[i] === "*") { i++; while (i < masked.length && /\s/.test(masked[i])) i++; }
        const nm = /^[A-Za-z_$][\w$]*/.exec(masked.slice(i));
        if (nm) out.push({ name: nm[0], kind: "function", index: i });
        continue;
      }
      if (kind === "class") {
        while (i < masked.length && /\s/.test(masked[i])) i++;
        const nm = /^[A-Za-z_$][\w$]*/.exec(masked.slice(i));
        if (nm) out.push({ name: nm[0], kind: "class", index: i });
        continue;
      }
      // let / const / var: declarator list. After ONE declarator, only a comma
      // continues the list; anything else (e.g. `of` in for-of) ends it.
      while (i < masked.length) {
        while (i < masked.length && /\s/.test(masked[i])) i++;
        if (i >= masked.length) break;
        const ch = masked[i];
        if (ch === ";" || ch === ")" || ch === "}") break;
        if (ch === "{" || ch === "[") {
          const close = jsMatchBracket(masked, i);
          if (close === -1) break;
          jsCollectDestructured(masked.slice(i + 1, close), i + 1, kind, out);
          i = close + 1;
          while (i < masked.length && /\s/.test(masked[i])) i++;
          if (masked[i] === "=") i = jsSkipInit(masked, i + 1);
        } else {
          const nm = /^[A-Za-z_$][\w$]*/.exec(masked.slice(i));
          if (!nm) break;
          out.push({ name: nm[0], kind, index: i });
          i += nm[0].length;
          while (i < masked.length && /\s/.test(masked[i])) i++;
          if (masked[i] === "=") i = jsSkipInit(masked, i + 1);
        }
        while (i < masked.length && /\s/.test(masked[i])) i++;
        if (masked[i] === ",") { i++; continue; }
        break;
      }
    }
    return out;
  }
  // Is `name` at idx a method/getter definition (`{ foo() {} }`, `class A { foo() {} }`,
  // `get foo() {}`) rather than a call? A call like `if (foo()) {}` must NOT match:
  // the name there is preceded by `(`.
  function isJsMethodDefinition(masked, idx, name) {
    let j = idx + name.length;
    while (j < masked.length && /\s/.test(masked[j])) j++;
    if (masked[j] !== "(") return false;
    const close = jsMatchBracket(masked, j);
    if (close === -1) return false;
    let k = close + 1;
    while (k < masked.length && /\s/.test(masked[k])) k++;
    if (masked[k] !== "{") return false;
    let before = idx - 1;
    while (before >= 0 && /\s/.test(masked[before])) before--;
    if (before < 0) return false;
    const ch = masked[before];
    if (ch === "{" || ch === "," || ch === "*") return true;
    let wordEnd = before, wordStart = before;
    while (wordStart >= 0 && /[A-Za-z0-9_$]/.test(masked[wordStart])) wordStart--;
    const word = masked.slice(wordStart + 1, wordEnd + 1);
    return word === "get" || word === "set" || word === "async";
  }
  function validateJs(code, htmlCode) {
    const problems = [];
    const masked = blankJsRegex(code, maskJs(code, false));
    const strKept = maskJs(code, true);
    let m;
    // Brace depth at every index (for top-level-only checks).
    const braceDepth = new Array(masked.length + 1).fill(0);
    for (let i = 0; i < masked.length; i++) {
      braceDepth[i + 1] = braceDepth[i] + (masked[i] === "{" ? 1 : masked[i] === "}" ? -1 : 0);
    }
    const depthAt = (idx) => braceDepth[Math.max(0, Math.min(idx, masked.length))];
    const memberRe = /\b([A-Za-z_$][\w$]*)\s*\.\s*([A-Za-z_$][\w$]*)/g;
    while ((m = memberRe.exec(masked)) !== null) {
      const obj = m[1], member = m[2];
      const methods = JS_METHODS[obj];
      if (!methods || methods.indexOf(member) !== -1) continue;
      const sug = suggestName(member, methods);
      if (!sug) continue;
      const memberStart = m.index + m[0].indexOf(member, m[1].length);
      problems.push({ severity: "warning", message: "Unknown method '" + member + "'. Did you mean '" + sug + "'?", start: memberStart, end: memberStart + member.length });
    }
    const evRe = /\.addEventListener\s*\(\s*(["'])((?:\\.|(?!\1)[^\\])*)\1/gi;
    while ((m = evRe.exec(strKept)) !== null) {
      const ev = m[2];
      if (!ev || KNOWN_EVENTS.indexOf(ev) !== -1) continue;
      const sug = suggestName(ev, KNOWN_EVENTS);
      if (!sug) continue;
      const contentStart = m.index + m[0].indexOf(m[1]) + 1;
      problems.push({ severity: "warning", message: "Unknown event '" + ev + "'. Did you mean '" + sug + "'?", start: contentStart, end: contentStart + ev.length });
    }
    // ---- Declarations ----
    const decls = collectJsDeclarations(masked);
    const declIndexSet = new Set();
    const declByName = new Map();
    for (const d of decls) {
      d.depth = d.scopeIndex !== undefined ? depthAt(d.scopeIndex) : depthAt(d.index);
      declIndexSet.add(d.index);
      if (!declByName.has(d.name)) declByName.set(d.name, d);
    }
    // Params (incl. method params) are declared names too.
    const paramSpans = [];
    const paramDecls = [];
    const collectParams = (list, listStart) => {
      if (!list) return;
      // Mark default-value regions at every nesting level: after an "="
      // until the next "," or closing bracket at the same depth. Identifiers
      // inside those regions are default values, NOT parameter names.
      // (list comes from masked code, so strings are already blanked.)
      const n = list.length;
      const inDefault = new Array(n).fill(false);
      let depth = 0, i = 0;
      while (i < n) {
        const ch = list[i];
        if (ch === "(" || ch === "[" || ch === "{") { depth++; i++; }
        else if (ch === ")" || ch === "]" || ch === "}") { depth--; i++; }
        else if (ch === "=") {
          let d = depth, j = i + 1;
          while (j < n) {
            const c = list[j];
            if (c === "(" || c === "[" || c === "{") d++;
            else if (c === ")" || c === "]" || c === "}") {
              if (d === depth) break;
              d--;
            } else if (c === "," && d === depth) break;
            inDefault[j] = true;
            j++;
          }
          i = j;
        } else i++;
      }
      const ids = list.match(/[A-Za-z_$][\w$]*/g) || [];
      let searchFrom = 0;
      for (const id of ids) {
        if (JS_KEYWORDS.has(id)) continue;
        const off = list.indexOf(id, searchFrom);
        if (off === -1) continue;
        searchFrom = off + id.length;
        if (inDefault[off]) continue;
        const idx = listStart + off;
        if (!declByName.has(id)) declByName.set(id, { name: id, kind: "param", index: idx, depth: depthAt(idx) });
        paramDecls.push({ name: id, kind: "param", index: idx, depth: depthAt(listStart) });
        declIndexSet.add(idx);
      }
    };
    const paramRe = /\bfunction\s*(?:[A-Za-z_$][\w$]*)?\s*\(([^)]*)\)|\(([^)]*)\)\s*=>|\bcatch\s*\(\s*([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*)\s*=>/g;
    while ((m = paramRe.exec(masked)) !== null) {
      const list = m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
      const listStart = m.index + m[0].indexOf(list);
      paramSpans.push([m.index, m.index + m[0].length]);
      collectParams(list, listStart);
    }
    const methodRe = /\b(?!if|for|while|switch|catch|return|typeof|instanceof|in|of|new|delete|void|do|else|with|yield|await)([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g;
    while ((m = methodRe.exec(masked)) !== null) {
      const listStart = m.index + m[0].indexOf(m[2]);
      paramSpans.push([m.index, m.index + m[0].length]);
      collectParams(m[2], listStart);
    }
    // catch ({...}) / catch ([...]) destructuring params.
    const catchDestrRe = /\bcatch\s*\(\s*([\{\[])/g;
    while ((m = catchDestrRe.exec(masked)) !== null) {
      const open = m.index + m[0].length - 1;
      const close = jsMatchBracket(masked, open);
      if (close === -1) continue;
      const tmp = [];
      jsCollectDestructured(masked.slice(open + 1, close), open + 1, "param", tmp);
      for (const d of tmp) {
        d.depth = d.scopeIndex !== undefined ? depthAt(d.scopeIndex) : depthAt(d.index);
        if (!declByName.has(d.name)) declByName.set(d.name, d);
        paramDecls.push({ name: d.name, kind: "param", index: d.index, depth: d.depth });
        declIndexSet.add(d.index);
      }
    }
    // imports: default, named (a as b -> b), namespace (* as ns).
    const skipIdSpans = [];
    const importRe = /\bimport\s+(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\})?\s*(?:\*\s*as\s+([A-Za-z_$][\w$]*))?\s*from\b/g;
    while ((m = importRe.exec(masked)) !== null) {
      skipIdSpans.push([m.index, m.index + m[0].length]);
      const addImport = (nm) => {
        if (!nm) return;
        const idx = m.index + m[0].indexOf(nm);
        if (!declByName.has(nm)) declByName.set(nm, { name: nm, kind: "import", index: idx, depth: depthAt(idx) });
        declIndexSet.add(idx);
      };
      addImport(m[1]);
      if (m[2]) {
        for (const part of m[2].split(",")) {
          const bits = part.trim().split(/\s+as\s+/);
          addImport(bits[bits.length - 1].trim());
        }
      }
      addImport(m[3]);
    }
    // export ... from 'x': names belong to the other module, not local code.
    const exportFromRe = /\bexport\s+(?:\{[^}]*\}|\*(?:\s+as\s+[A-Za-z_$][\w$]*)?)\s*from\b/g;
    while ((m = exportFromRe.exec(masked)) !== null) skipIdSpans.push([m.index, m.index + m[0].length]);
    // HTML: element ids are auto-globals (declared), inline handlers mark names used.
    const htmlIds = new Set();
    const htmlUsed = new Set();
    if (htmlCode) {
      const idRe2 = /\bid\s*=\s*["']([^"']+)["']/gi;
      let hm;
      while ((hm = idRe2.exec(htmlCode)) !== null) htmlIds.add(hm[1]);
      const handlerRe = /\bon\w+\s*=\s*["']([^"']*)["']/gi;
      while ((hm = handlerRe.exec(htmlCode)) !== null) {
        const ids = hm[1].match(/[A-Za-z_$][\w$]*/g) || [];
        for (const id of ids) htmlUsed.add(id);
      }
    }
    const declared = new Set(declByName.keys());
    for (const id of htmlIds) declared.add(id);
    // ---- Identifiers: typo suggestion, else no-undef ----
    scanJsUnterminated(code).forEach((p) => problems.push(p));
    problems.push(...scanJsBalance(code));
    const bareEvRe = /\.addEventListener\s*\(\s*([A-Za-z_$][\w$]*)\s*[,)]/g;
    while ((m = bareEvRe.exec(masked)) !== null) {
      const name = m[1];
      if (declared.has(name)) continue;
      const sug = KNOWN_EVENTS.find((e) => e.toLowerCase() === name.toLowerCase());
      if (!sug) continue;
      const nameStart = m.index + m[0].indexOf(name);
      problems.push({ severity: "warning", message: "Event name must be a string. Did you mean '" + sug + "'?", start: nameStart, end: nameStart + name.length });
    }
    const idRe = /\b([A-Za-z_$][\w$]*)\b/g;
    const allUses = [];
    while ((m = idRe.exec(masked)) !== null) {
      const name = m[1];
      allUses.push({ name, index: m.index });
      if (JS_KEYWORDS.has(name)) continue;
      if (declared.has(name)) continue;
      if (JS_GLOBALS.indexOf(name) !== -1) continue;
      if (masked[m.index - 1] === "." && masked.slice(m.index - 3, m.index) !== "...") continue;
      if (skipIdSpans.some((sp) => m.index >= sp[0] && m.index < sp[1])) continue;
      if (isJsMethodDefinition(masked, m.index, name)) continue;
      let after = m.index + name.length;
      while (after < masked.length && /\s/.test(masked[after])) after++;
      if (masked[after] === ":") {
        let before = m.index - 1;
        while (before >= 0 && /\s/.test(masked[before])) before--;
        if (masked[before] === "?") { /* ternary branch: real identifier, do not skip */ }
        else continue;
      }
      let sug = suggestName(name, JS_GLOBALS);
      if (!sug) sug = suggestName(name, Array.from(declared));
      if (sug) {
        problems.push({ severity: "warning", message: "Unknown identifier '" + name + "'. Did you mean '" + sug + "'?", start: m.index, end: m.index + name.length });
        continue;
      }
      // v1.7.1 no-undef: only when no close match exists anywhere.
      if (JS_NO_UNDEF_AMBIENT.has(name)) continue;
      if (JS_LIB_GLOBALS.has(name)) continue;
      if (htmlIds.has(name)) continue;
      problems.push({ severity: "warning", message: "'" + name + "' is not defined", start: m.index, end: m.index + name.length });
    }
    // ---- v1.7.1 use-before-define (TDZ, top-level sequential code only) ----
    for (const u of allUses) {
      const d = declByName.get(u.name);
      if (!d) continue;
      if (d.kind !== "let" && d.kind !== "const" && d.kind !== "class") continue;
      if (u.index >= d.index) continue;
      if (depthAt(u.index) !== 0) continue;
      if (masked[u.index - 1] === ".") continue;
      let after = u.index + u.name.length;
      while (after < masked.length && /\s/.test(masked[after])) after++;
      if (masked[after] === ":") continue;
      problems.push({ severity: "error", message: "'" + u.name + "' used before declaration", start: u.index, end: u.index + u.name.length });
    }
    // ---- v1.7.1 redeclare (top level only) ----
    {
      const byName = new Map();
      for (const d of decls) {
        if (d.depth !== 0) continue;
        if (!byName.has(d.name)) byName.set(d.name, []);
        byName.get(d.name).push(d);
      }
      for (const [name, list] of byName) {
        list.sort((a, b) => a.index - b.index);
        for (let k = 1; k < list.length; k++) {
          const cur = list[k], prior = list.slice(0, k);
          const curIsLexical = cur.kind === "let" || cur.kind === "const" || cur.kind === "class";
          const priorIsLexical = prior.some((p) => p.kind === "let" || p.kind === "const" || p.kind === "class");
          if (curIsLexical || priorIsLexical) {
            problems.push({ severity: "error", message: "'" + name + "' is already declared", start: cur.index, end: cur.index + name.length });
          }
        }
      }
    }
    // ---- v1.7.1 const-assign ----
    {
      const constNames = new Set();
      // A declaration shadows an assignment only if its scope contains the
      // assignment: brace depth between declaration and assignment must never
      // drop below the declaration's depth (sibling functions do NOT shadow).
      const declVisibleAt = (d, aIdx) => {
        for (let i = d.index; i <= aIdx; i++) {
          if (braceDepth[i] < d.depth) return false;
        }
        return true;
      };
      const nearestDecl = (name, aIdx) => {
        const aDepth = depthAt(aIdx);
        let best = null;
        const consider = (d) => {
          if (!d || d.name !== name) return;
          if (d.index >= aIdx) return;
          if (d.depth > aDepth) return;
          if (!declVisibleAt(d, aIdx)) return;
          if (!best || d.depth > best.depth || (d.depth === best.depth && d.index > best.index)) best = d;
        };
        for (const d of decls) consider(d);
        for (const d of paramDecls) consider(d);
        return best;
      };
      for (const d of decls) if (d.kind === "const") constNames.add(d.name);
      const inParamSpan = (idx) => paramSpans.some((sp) => idx >= sp[0] && idx < sp[1]);
      const assignRe = /([A-Za-z_$][\w$]*)\s*(?:>>>|<<|>>|\*\*|&&|\|\||\?\?|[+\-*/%&|^])?=(?![=>])/g;
      while ((m = assignRe.exec(masked)) !== null) {
        const name = m[1];
        if (!constNames.has(name)) continue;
        const d = nearestDecl(name, m.index);
        if (!d || d.kind !== "const") continue;
        if (declIndexSet.has(m.index)) continue;
        if (inParamSpan(m.index)) continue;
        if (masked[m.index - 1] === ".") continue;
        problems.push({ severity: "error", message: "Assignment to constant variable '" + name + "'", start: m.index, end: m.index + name.length });
      }
      const postIncRe = /([A-Za-z_$][\w$]*)\s*(\+\+|--)/g;
      while ((m = postIncRe.exec(masked)) !== null) {
        const name = m[1];
        if (!constNames.has(name)) continue;
        const d = nearestDecl(name, m.index);
        if (!d || d.kind !== "const") continue;
        if (declIndexSet.has(m.index)) continue;
        if (inParamSpan(m.index)) continue;
        if (masked[m.index - 1] === ".") continue;
        problems.push({ severity: "error", message: "Assignment to constant variable '" + name + "'", start: m.index, end: m.index + name.length });
      }
      const preIncRe = /(\+\+|--)\s*([A-Za-z_$][\w$]*)/g;
      while ((m = preIncRe.exec(masked)) !== null) {
        const name = m[2];
        if (!constNames.has(name)) continue;
        const nameIdx = m.index + m[0].indexOf(name);
        const d = nearestDecl(name, nameIdx);
        if (!d || d.kind !== "const") continue;
        if (declIndexSet.has(nameIdx)) continue;
        if (inParamSpan(nameIdx)) continue;
        if (masked[nameIdx - 1] === ".") continue;
        problems.push({ severity: "error", message: "Assignment to constant variable '" + name + "'", start: nameIdx, end: nameIdx + name.length });
      }
    }
    // ---- v1.7.1 unused (let/const/var/import/destructured only) ----
    {
      const useCount = new Map();
      for (const u of allUses) {
        if (declIndexSet.has(u.index)) continue;
        if (masked[u.index - 1] === ".") continue;
        let after = u.index + u.name.length;
        while (after < masked.length && /\s/.test(masked[after])) after++;
        if (masked[after] === ":") {
          // Ternary consequent (`cond ? a : b`) IS a use; object key / label is not.
          let before = u.index - 1;
          while (before >= 0 && /\s/.test(masked[before])) before--;
          if (masked[before] !== "?") continue;
        }
        useCount.set(u.name, (useCount.get(u.name) || 0) + 1);
      }
      const seen = new Set();
      for (const d of decls) {
        if (d.kind !== "let" && d.kind !== "const" && d.kind !== "var" && d.kind !== "import") continue;
        if (seen.has(d.name + "@" + d.index)) continue;
        seen.add(d.name + "@" + d.index);
        if (d.name.startsWith("_")) continue;
        if (htmlUsed.has(d.name)) continue;
        if ((useCount.get(d.name) || 0) > 0) continue;
        problems.push({ severity: "warning", message: "'" + d.name + "' is declared but never used", start: d.index, end: d.index + d.name.length });
      }
    }
    // ---- v1.7.1 unreachable code ----
    {
      const termRe = /\b(return|throw|break|continue)\b/g;
      while ((m = termRe.exec(masked)) !== null) {
        let prev = m.index - 1;
        while (prev >= 0 && /\s/.test(masked[prev])) prev--;
        const prevCh = prev < 0 ? "" : masked[prev];
        if (!(prevCh === "" || prevCh === "{" || prevCh === ";" || prevCh === "}" || prevCh === ":")) continue;
        const blockDepth = depthAt(m.index);
        let end = m.index + m[0].length;
        while (end < masked.length && masked[end] !== ";" && masked[end] !== "\n" && masked[end] !== "}") end++;
        if (masked[end] === ";") end++;
        let s = end;
        while (s < masked.length) {
          while (s < masked.length && /[\s;]/.test(masked[s])) s++;
          if (s >= masked.length) break;
          if (masked[s] === "}") break;
          if (depthAt(s) < blockDepth) break;
          const rest = masked.slice(s);
          if (/^(case|default|else|catch|finally)\b/.test(rest)) break;
          let stmtEnd = s;
          let d = depthAt(s);
          while (stmtEnd < masked.length) {
            const ch = masked[stmtEnd];
            if (ch === "{" || ch === "(" || ch === "[") d++;
            else if (ch === "}" || ch === ")" || ch === "]") {
              if (d <= blockDepth) break;
              d--;
            } else if (ch === ";" && d <= blockDepth) { stmtEnd++; break; }
            else if (ch === "\n" && d <= blockDepth && stmtEnd > s) break;
            stmtEnd++;
          }
          if (stmtEnd <= s) break;
          problems.push({ severity: "warning", message: "Unreachable code", start: s, end: stmtEnd });
          s = stmtEnd;
        }
      }
    }
    // ---- v1.7.1 constant condition ----
    {
      const ccRe = /\b(?:if|for)\s*\(\s*(true|false)\s*\)/g;
      while ((m = ccRe.exec(masked)) !== null) {
        const lit = m[1];
        const litIdx = m.index + m[0].indexOf(lit);
        problems.push({ severity: "warning", message: "Condition is always '" + lit + "'", start: litIdx, end: litIdx + lit.length });
      }
      const whileFalseRe = /\bwhile\s*\(\s*(false)\s*\)/g;
      while ((m = whileFalseRe.exec(masked)) !== null) {
        const litIdx = m.index + m[0].indexOf(m[1]);
        problems.push({ severity: "warning", message: "Condition is always 'false'", start: litIdx, end: litIdx + 4 });
      }
      const ternRe = /\b(true|false)\s*\?(?![?.])/g;
      while ((m = ternRe.exec(masked)) !== null) {
        problems.push({ severity: "warning", message: "Condition is always '" + m[1] + "'", start: m.index, end: m.index + m[1].length });
      }
    }
    // ---- v1.7.1 self-assign ----
    {
      const selfRe = /\b([A-Za-z_$][\w$]*)\s*=(?![=>])\s*\1\b/g;
      while ((m = selfRe.exec(masked)) !== null) {
        if (masked[m.index - 1] === ".") continue;
        // Pure self-assign only: the second name must end the statement.
        let after2 = m.index + m[0].length;
        while (after2 < masked.length && /\s/.test(masked[after2])) after2++;
        if (!(after2 >= masked.length || ";,)}]".indexOf(masked[after2]) !== -1)) continue;
        problems.push({ severity: "warning", message: "Self-assignment: '" + m[1] + "' is assigned to itself", start: m.index, end: m.index + m[0].length });
      }
    }
    // ---- v1.7.1 eqeqeq (allow == null / == undefined) ----
    {
      const eqRe = /(?<![=!])==(?!=)/g;
      while ((m = eqRe.exec(masked)) !== null) {
        let after = m.index + 2;
        while (after < masked.length && /\s/.test(masked[after])) after++;
        const afterWord = /^(null|undefined)\b/.exec(masked.slice(after));
        if (afterWord) continue;
        let before = m.index - 1;
        while (before >= 0 && /\s/.test(masked[before])) before--;
        let wordEnd = before, wordStart = before;
        while (wordStart >= 0 && /[A-Za-z0-9_$]/.test(masked[wordStart])) wordStart--;
        const beforeWord = masked.slice(wordStart + 1, wordEnd + 1);
        if (beforeWord === "null" || beforeWord === "undefined") continue;
        problems.push({ severity: "warning", message: "Use '===' instead of '=='", start: m.index, end: m.index + 2 });
      }
      const neqRe = /(?<![=!])!=(?!=)/g;
      while ((m = neqRe.exec(masked)) !== null) {
        let after = m.index + 2;
        while (after < masked.length && /\s/.test(masked[after])) after++;
        const afterWord = /^(null|undefined)\b/.exec(masked.slice(after));
        if (afterWord) continue;
        let before = m.index - 1;
        while (before >= 0 && /\s/.test(masked[before])) before--;
        let wordEnd = before, wordStart = before;
        while (wordStart >= 0 && /[A-Za-z0-9_$]/.test(masked[wordStart])) wordStart--;
        const beforeWord = masked.slice(wordStart + 1, wordEnd + 1);
        if (beforeWord === "null" || beforeWord === "undefined") continue;
        problems.push({ severity: "warning", message: "Use '!==' instead of '!='", start: m.index, end: m.index + 2 });
      }
    }
    // ---- v1.7.2 infinite loop (static): while(true) / for(;;) / do..while(true) ----
    {
      const loopRe2 = /\b(while|for|do)\b/g;
      let lm;
      const handledWhile2 = new Set();
      const bodyHasExit = (body) => /\b(break|return|throw)\b/.test(body);
      const warnLoop = (idx, len, label) => {
        problems.push({ severity: "warning", message: "Possible infinite loop: '" + label + "' has no break / return / throw. Preview will stop it, but add an exit condition.", start: idx, end: idx + len });
      };
      while ((lm = loopRe2.exec(masked)) !== null) {
        const kw = lm[1];
        if (masked[lm.index - 1] === ".") continue;
        if (handledWhile2.has(lm.index)) continue;
        let afterKw = lm.index + kw.length;
        while (afterKw < masked.length && /\s/.test(masked[afterKw])) afterKw++;
        if (kw === "do") {
          let body = "", condText = "";
          if (masked[afterKw] === "{") {
            const cl = jsMatchBracket(masked, afterKw);
            if (cl === -1) continue;
            body = masked.slice(afterKw, cl);
            let w = cl + 1;
            while (w < masked.length && /\s/.test(masked[w])) w++;
            if (masked.slice(w, w + 5) !== "while") continue;
            handledWhile2.add(w);
            let pp = w + 5;
            while (pp < masked.length && /\s/.test(masked[pp])) pp++;
            if (masked[pp] !== "(") continue;
            const close = jsMatchBracket(masked, pp);
            if (close === -1) continue;
            condText = masked.slice(pp + 1, close);
          } else {
            const wRe = /\bwhile\b/g;
            wRe.lastIndex = afterKw;
            const wm = wRe.exec(masked);
            if (!wm) continue;
            handledWhile2.add(wm.index);
            body = masked.slice(afterKw, wm.index);
            let pp = wm.index + 5;
            while (pp < masked.length && /\s/.test(masked[pp])) pp++;
            if (masked[pp] !== "(") continue;
            const close = jsMatchBracket(masked, pp);
            if (close === -1) continue;
            condText = masked.slice(pp + 1, close);
          }
          if (/^\s*(true|1)\s*$/.test(condText) && !bodyHasExit(body)) warnLoop(lm.index, 2, "do...while (true)");
          continue;
        }
        if (masked[afterKw] !== "(") continue;
        const open = afterKw;
        const close = jsMatchBracket(masked, open);
        if (close === -1) continue;
        const header = masked.slice(open + 1, close);
        let condText = "", isInfinite = false;
        if (kw === "while") {
          let pb = lm.index - 1;
          while (pb >= 0 && /\s/.test(masked[pb])) pb--;
          if (masked[pb] === "}") {
            let depth = 0, q = pb;
            for (; q >= 0; q--) { if (masked[q] === "}") depth++; else if (masked[q] === "{") { depth--; if (depth === 0) break; } }
            if (q >= 0) {
              let pd = q - 1;
              while (pd >= 0 && /\s/.test(masked[pd])) pd--;
              let wEnd = pd, wStart = pd;
              while (wStart >= 0 && /[A-Za-z0-9_$]/.test(masked[wStart])) wStart--;
              if (masked.slice(wStart + 1, wEnd + 1) === "do") continue;
            }
          }
          condText = header;
          isInfinite = /^\s*(true|1)\s*$/.test(condText);
        } else {
          const parts = [];
          let depth2 = 0, cur = 0;
          for (let h = 0; h <= header.length; h++) {
            const ch = header[h];
            if (ch === "(" || ch === "[" || ch === "{") depth2++;
            else if (ch === ")" || ch === "]" || ch === "}") depth2--;
            if ((ch === ";" && depth2 === 0) || h === header.length) { parts.push(header.slice(cur, h)); cur = h + 1; }
          }
          if (parts.length < 3) continue;
          condText = parts[1];
          isInfinite = /^\s*$/.test(condText);
        }
        if (!isInfinite) continue;
        let b = close + 1;
        while (b < masked.length && /\s/.test(masked[b])) b++;
        let body = "";
        if (masked[b] === "{") {
          const cl = jsMatchBracket(masked, b);
          if (cl === -1) continue;
          body = masked.slice(b, cl);
        } else {
          const semi = masked.indexOf(";", b);
          if (semi === -1) continue;
          body = masked.slice(b, semi);
        }
        if (bodyHasExit(body)) continue;
        warnLoop(lm.index, kw.length, kw === "while" ? "while (true)" : "for (;;)");
      }
    }
    // ---- v1.7.3 string-code: eval / Function / setTimeout("...") ----
    {
      const evalRe = /\beval\s*\(/g;
      while ((m = evalRe.exec(masked)) !== null) {
        if (masked[m.index - 1] === ".") continue;
        problems.push({ severity: "warning", message: "eval() runs string code. It is guarded, but prefer a function.", start: m.index, end: m.index + 4 });
      }
      const fnRe = /\bnew\s+Function\s*\(/g;
      while ((m = fnRe.exec(masked)) !== null) {
        problems.push({ severity: "warning", message: "new Function() runs string code. It is guarded, but prefer a function.", start: m.index, end: m.index + m[0].length });
      }
      const fnCallRe = /(^|[^\w$.])Function\s*\(/g;
      while ((m = fnCallRe.exec(masked)) !== null) {
        const at = m.index + m[1].length;
        let bb = at - 1;
        while (bb >= 0 && /\s/.test(masked[bb])) bb--;
        let wEnd = bb, wStart = bb;
        while (wStart >= 0 && /[A-Za-z0-9_$]/.test(masked[wStart])) wStart--;
        if (masked.slice(wStart + 1, wEnd + 1) === "new") continue;
        problems.push({ severity: "warning", message: "Function() with string code is guarded. Prefer a function.", start: at, end: at + 8 });
      }
      const timerStrRe = /\b(setTimeout|setInterval)\s*\(/g;
      while ((m = timerStrRe.exec(masked)) !== null) {
        let tpp = m.index + m[0].length;
        while (tpp < code.length && /\s/.test(code[tpp])) tpp++;
        const tch = code[tpp];
        if (tch === '"' || tch === "'" || tch === "`") {
          problems.push({ severity: "warning", message: "Pass a function to " + m[1] + ", not a string. String code is guarded, but slower.", start: m.index, end: m.index + m[1].length });
        }
      }
    }
    problems.sort((a, b) => a.start - b.start);
    return problems;
  }

  // ===== v1.7.2 — Loop protection: instrument user JS so an infinite loop
  // can never freeze the tab. Every loop gets a __sbLoopGuard_9f3(id) call once
  // per iteration (block body: first statement; braceless while/for: comma
  // injected into the condition; do-while: its while condition). No newlines
  // are added, so preview error line numbers stay correct. On any failure,
  // returns the original code untouched.
  function instrumentJsLoops(code) {
    try {
      const masked = blankJsRegex(code, maskJs(code, false));
      const edits = [];
      let loopId = 0;
      const handledWhile = new Set();
      const skipWs = (pp) => { while (pp < masked.length && /\s/.test(masked[pp])) pp++; return pp; };
      const loopRe = /\b(while|for|do)\b/g;
      let m;
      while ((m = loopRe.exec(masked)) !== null) {
        const kw = m[1];
        if (masked[m.index - 1] === ".") continue;
        if (handledWhile.has(m.index)) continue;
        const afterKw0 = skipWs(m.index + kw.length);
        if (kw === "do") {
          const id = loopId++;
          if (masked[afterKw0] === "{") {
            edits.push({ pos: afterKw0 + 1, text: "__sbLoopGuard_9f3(" + id + ");" });
            const cl = jsMatchBracket(masked, afterKw0);
            if (cl !== -1) {
              const w = skipWs(cl + 1);
              if (masked.slice(w, w + 5) === "while") handledWhile.add(w);
            }
          } else {
            const wRe = /\bwhile\b/g;
            wRe.lastIndex = afterKw0;
            const wm = wRe.exec(masked);
            if (!wm) continue;
            handledWhile.add(wm.index);
            const pp = skipWs(wm.index + 5);
            if (masked[pp] !== "(") continue;
            const close = jsMatchBracket(masked, pp);
            if (close === -1) continue;
            const cStart = pp + 1, cEnd = close;
            const cond = code.slice(cStart, cEnd);
            if (/^\s*$/.test(cond)) edits.push({ start: cStart, end: cEnd, text: "__sbLoopGuard_9f3(" + id + ")" });
            else edits.push({ start: cStart, end: cEnd, text: "(__sbLoopGuard_9f3(" + id + ")," + cond + ")" });
          }
          continue;
        }
        let pp = afterKw0;
        if (kw === "for" && masked.slice(pp, pp + 5) === "await" && !/[A-Za-z0-9_$]/.test(masked[pp + 5] || "")) pp = skipWs(pp + 5);
        if (masked[pp] !== "(") continue;
        const open = pp;
        const close = jsMatchBracket(masked, open);
        if (close === -1) continue;
        const header = masked.slice(open + 1, close);
        const id = loopId++;
        if (kw === "while") {
          const bodyAt = skipWs(close + 1);
          if (masked[bodyAt] === "{") {
            edits.push({ pos: bodyAt + 1, text: "__sbLoopGuard_9f3(" + id + ");" });
          } else {
            const cStart = open + 1, cEnd = close;
            const cond = code.slice(cStart, cEnd);
            if (/^\s*$/.test(cond)) continue;
            edits.push({ start: cStart, end: cEnd, text: "(__sbLoopGuard_9f3(" + id + ")," + cond + ")" });
          }
          continue;
        }
        let depth = 0;
        const semis = [];
        for (let h = 0; h < header.length; h++) {
          const ch = header[h];
          if (ch === "(" || ch === "[" || ch === "{") depth++;
          else if (ch === ")" || ch === "]" || ch === "}") depth--;
          else if (ch === ";" && depth === 0) semis.push(h);
        }
        if (semis.length >= 2) {
          const cStart = open + 1 + semis[0] + 1, cEnd = open + 1 + semis[1];
          const cond = code.slice(cStart, cEnd);
          if (/^\s*$/.test(cond)) edits.push({ start: cStart, end: cEnd, text: "__sbLoopGuard_9f3(" + id + ")" });
          else edits.push({ start: cStart, end: cEnd, text: "(__sbLoopGuard_9f3(" + id + ")," + cond + ")" });
        } else {
          const bodyAt = skipWs(close + 1);
          if (masked[bodyAt] === "{") edits.push({ pos: bodyAt + 1, text: "__sbLoopGuard_9f3(" + id + ");" });
        }
      }
      if (!edits.length) return code;
      edits.sort((a, b) => (b.start !== undefined ? b.start : b.pos) - (a.start !== undefined ? a.start : a.pos));
      let out = code;
      for (const e of edits) {
        if (e.start !== undefined) out = out.slice(0, e.start) + e.text + out.slice(e.end);
        else out = out.slice(0, e.pos) + e.text + out.slice(e.pos);
      }
      return out;
    } catch (err) {
      return code;
    }
  }

  // HTML <script> blocks get the SAME loop guard as the JS tab.
  // Without this, while(true){} inside an HTML <script> runs unguarded
  // during parsing and freezes the whole editor (srcdoc iframe shares
  // the main thread). All other guards (eval, timers, DOM, microtasks,
  // popups, memory) already apply globally via the head shim; only the
  // loop rewrite is source-level, so only it needs applying here.
  // Skips: <script src> (browser ignores its inline content) and
  // non-JS types (json / template / importmap / babel are not run as JS).
  // Uses scanHtmlTags so <script> inside comments / attributes is not
  // treated as a script, same as the linter.
  function isJsScriptType(typeVal) {
    if (typeVal === null || typeVal === undefined) return true;
    const t = String(typeVal).trim().toLowerCase();
    if (!t) return true;
    if (t === "module") return true;
    return /(javascript|ecmascript|jscript)/.test(t);
  }

  function instrumentHtmlScripts(html) {
    try {
      if (!html || !/<script/i.test(html)) return html;
      const tags = scanHtmlTags(html);
      const edits = [];
      for (let ti = 0; ti < tags.length; ti++) {
        const t = tags[ti];
        if (t.name !== "script" || t.closing || t.selfClose) continue;
        // Matching close tag; an unclosed <script> runs to EOF.
        let closeTag = null;
        for (let tj = ti + 1; tj < tags.length; tj++) {
          if (tags[tj].name === "script") { if (tags[tj].closing) closeTag = tags[tj]; break; }
        }
        let hasSrc = false, typeVal = null;
        const attrs = t.attrs || [];
        for (const a of attrs) {
          const an = (a.name || "").toLowerCase();
          if (an === "src") hasSrc = true;
          if (an === "type") typeVal = a.value;
        }
        if (hasSrc) continue;
        if (!isJsScriptType(typeVal)) continue;
        const contentStart = t.end;
        const contentEnd = closeTag ? closeTag.start : html.length;
        if (contentEnd <= contentStart) continue;
        const content = html.slice(contentStart, contentEnd);
        let guarded = String(instrumentJsLoops(content)).replace(/<\/script>/gi, "<\\/script>");
        // Eruda init FIRST inside user script (same line, no newline).
        // HTML script runs during body parsing, before DOMContentLoaded.
        // Eruda inits on DOMContentLoaded, so it would miss this log.
        // Prepending init here makes Eruda hook console BEFORE user code runs.
        // Body stays clean: no separate editor script tag, only user script.
        // "use strict" stays first: init goes AFTER it, else strict mode breaks.
        const __erudaInit_9f3 = 'try{if(window.__initEruda&&!window.__erudaInited)window.__initEruda();}catch(e){};';
        const __strict_9f3 = guarded.match(/^(\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*\n?)*\s*)(["'])use strict\2\s*;?/);
        if (__strict_9f3) {
          const __pos_9f3 = __strict_9f3[0].length;
          guarded = guarded.slice(0, __pos_9f3) + __erudaInit_9f3 + guarded.slice(__pos_9f3);
        } else {
          guarded = __erudaInit_9f3 + guarded;
        }
        if (guarded !== content) edits.push({ start: contentStart, end: contentEnd, text: guarded });
      }
      if (!edits.length) return html;
      // Apply last-to-first so earlier positions stay valid.
      edits.sort((a, b) => b.start - a.start);
      let out = html;
      for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
      return out;
    } catch (e) {
      // Never break the preview.
      return html;
    }
  }

  // ===== v1.7.0 — Unified lint: HTML + CSS + JS =====
  let currentProblems = [];
  let lintMarksByEditor = { html: [], css: [], js: [] };
  let lintTimer = null;
  const EDITOR_META = {
    html: { tab: "html-tab", pane: "html-pane", get: () => window.htmlEditor, label: "HTML" },
    css: { tab: "css-tab", pane: "css-pane", get: () => window.cssEditor, label: "CSS" },
    js: { tab: "js-tab", pane: "js-pane", get: () => window.jsEditor, label: "JavaScript" }
  };

  function renderProblems() {
    const panel = document.getElementById("problems-panel");
    const empty = document.getElementById("problems-empty");
    if (!panel) return;
    panel.querySelectorAll(".problem-row").forEach((r) => r.remove());
    if (!currentProblems.length) {
      if (empty) empty.style.display = "";
    } else {
      if (empty) empty.style.display = "none";
      for (const p of currentProblems) {
        const row = document.createElement("div");
        row.className = "problem-row";
        row.dataset.problemId = p.id;
        // G15: red warning triangle with a white "!" (SVG, so the
        // colors stay exact). Replaces the severity dot here.
        const G15_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 L22.5 20.5 H1.5 Z" fill="#e53935"/><rect x="10.9" y="8" width="2.2" height="7" rx="1.1" fill="#fff"/><circle cx="12" cy="17.8" r="1.4" fill="#fff"/></svg>';
        const icon = p.g15 ? G15_ICON : (p.severity === "error" ? "🔴" : p.severity === "warning" ? "🟡" : "🔵");
        row.innerHTML = '<span class="flex-shrink-0">' + icon + '</span>' +
        '<span class="flex-grow-1">' + escapeHtml(p.message) + '</span>' +
        '<span class="text-secondary flex-shrink-0">' + p.file + " · Line " + (p.line + 1) + "</span>";
        row.addEventListener("click", () => jumpToProblem(p));
        panel.appendChild(row);
      }
    }
    updateProblemsCount(currentProblems.length);
  }

  function jumpToProblem(p) {
    const meta = EDITOR_META[p.editor];
    if (!meta) return;
    showEditorTab(meta.tab, meta.pane);
    setTimeout(() => {
      const ed = meta.get();
      if (!ed) return;
      ed.setCursor(p.from);
      ed.scrollIntoView(p.from, 100);
      ed.focus();
      const h = ed.addLineClass(p.from.line, "background", "cm-error-line-highlight");
      setTimeout(() => ed.removeLineClass(h, "background", "cm-error-line-highlight"), 2000);
    }, 150);
  }

  function openProblemsFor(problemId) {
    showEditorTab("console-tab", "console-pane");
    showProblemsTab();
    setTimeout(() => {
      document.querySelectorAll("#problems-panel .problem-row").forEach((r) => r.classList.remove("active"));
      const row = document.querySelector('#problems-panel .problem-row[data-problem-id="' + problemId + '"]');
      if (row) { row.classList.add("active"); row.scrollIntoView({ block: "nearest" }); }
    }, 150);
  }

  // G15: auto-delete guard. When a complete blocked tag appears in the
  // HTML editor (typed or pasted), it is removed at once and a "removed"
  // warning is kept in Problems until the next real edit. The Problems
  // tab opens so the user sees what was removed and why. Other tags are
  // untouched: only doctype/html/head/body/title/meta/base are stripped.
  let removedDocTagProblems = [];
  let removedDocTagSeq = 0;

  function stripBlockedDocTagsFromEditor(ed) {
    if (!ed) return [];
    let code;
    try { code = ed.getValue(); } catch (e) { return []; }
    let tags;
    try { tags = scanHtmlTags(code) || []; } catch (e) { return []; }
    const doomed = [];
    for (const t of tags) {
      // Only complete tags: the tag must end with ">". An incomplete tag
      // (user still typing) is left alone.
      if (!BLOCKED_DOC_TAGS.has(t.name)) continue;
      if (t.end <= 0 || code[t.end - 1] !== ">") continue;
      doomed.push(t);
    }
    if (!doomed.length) return [];
    try {
      ed.operation(() => {
        // Delete last-to-first so earlier offsets stay valid.
        for (let i = doomed.length - 1; i >= 0; i--) {
          const t = doomed[i];
          ed.replaceRange("", ed.posFromIndex(t.start), ed.posFromIndex(t.end), "g15-autodelete");
        }
      });
    } catch (e) { return []; }
    // Positions in the cleaned text: shift each tag start left by the
    // total length of the deleted ranges before it.
    const removed = [];
    let shift = 0;
    for (let i = 0; i < doomed.length; i++) {
      const t = doomed[i];
      const newStart = t.start - shift;
      shift += (t.end - t.start);
      let from;
      try { from = ed.posFromIndex(newStart); } catch (e) { from = { line: 0, ch: 0 }; }
      removed.push({
        id: "html-removed-" + (removedDocTagSeq++),
        file: "HTML", editor: "html", severity: "warning",
        g15: true,
        message: "doctype, html, head, metas, titles & base tags not allowed! Write only the code that goes inside the body, because the editor is already writing your code in the body of a proper HTML5 document.",
        from: from, to: from, line: from.line, ch: from.ch, removed: true
      });
    }
    return removed;
  }

  function runAllLint() {
    currentProblems = [];
    const jobs = [
      { key: "html", fn: validateHtml, label: "HTML" },
      { key: "css", fn: validateCss, label: "CSS" },
      { key: "js", fn: validateJs, label: "JavaScript" }
    ];
    for (const job of jobs) {
      const ed = EDITOR_META[job.key].get();
      if (!ed) continue;
      let raw = [];
      try { raw = job.fn(ed.getValue(), job.key === "js" ? ((EDITOR_META.html.get() && EDITOR_META.html.get().getValue()) || "") : undefined) || []; } catch (e) { raw = []; }
      raw.forEach((p, i) => {
        try {
          const from = ed.posFromIndex(p.start);
          const to = ed.posFromIndex(p.end);
          currentProblems.push({ id: job.key + "-" + i, file: job.label, editor: job.key, severity: p.severity, g15: !!p.g15, message: p.message, from, to, line: from.line, ch: from.ch });
        } catch (e) {}
      });
    }
    // G15: keep "removed" warnings in Problems until the next real edit.
    for (const rp of removedDocTagProblems) currentProblems.push(rp);
    const order = { html: 0, css: 1, js: 2 };
    currentProblems.sort((a, b) => (order[a.editor] - order[b.editor]) || (a.from.line - b.from.line) || (a.from.ch - b.from.ch));
    for (const key of Object.keys(lintMarksByEditor)) {
      lintMarksByEditor[key].forEach((mm) => { try { mm.clear(); } catch (e) {} });
      lintMarksByEditor[key] = [];
    }
    for (const p of currentProblems) {
      if (p.removed) continue; // tag is gone: nothing left to underline
      const ed = EDITOR_META[p.editor].get();
      if (!ed) continue;
      try {
        const mark = ed.markText(p.from, p.to, { className: "lint-mark-" + p.severity });
        mark.__problemId = p.id;
        lintMarksByEditor[p.editor].push(mark);
      } catch (e) {}
    }
    try { renderProblems(); } catch (e) {}
  }

  function scheduleAllLint() {
    clearTimeout(lintTimer);
    lintTimer = setTimeout(runAllLint, 150);
  }

  for (const key of Object.keys(EDITOR_META)) {
    const ed = EDITOR_META[key].get();
    if (!ed) continue;
    ed.on("change", scheduleAllLint);
    // G15: auto-delete guard for the HTML editor. A real user edit
    // clears old "removed" warnings; a change that adds ">" may
    // complete a blocked tag, which is stripped at once and the
    // Problems tab opens. Other editors are untouched.
    if (key === "html") {
      ed.on("change", (cm, change) => {
        try {
          if (!change) return;
          if (change.origin !== "g15-autodelete") removedDocTagProblems = [];
          const inserted = (change.text || []).join("\n");
          if (inserted.indexOf(">") === -1) return;
          setTimeout(() => {
            try {
              const removed = stripBlockedDocTagsFromEditor(cm);
              if (!removed.length) return;
              removedDocTagProblems = removedDocTagProblems.concat(removed);
              runAllLint();
              openProblemsFor(removed[0].id);
            } catch (e) {}
          }, 0);
        } catch (e) {}
      });
    }
    ed.on("focus", scheduleAllLint);
    ed.getWrapperElement().addEventListener("click", (e) => {
      if (ed.getSelection()) return;
      const pos = ed.coordsChar({ left: e.clientX, top: e.clientY }, "window");
      const marks = ed.findMarksAt(pos);
      const lintMark = marks.find((mm) => mm.__problemId !== undefined);
      if (lintMark) openProblemsFor(lintMark.__problemId);
    });
  }
  try { runAllLint(); } catch (e) {}
  setTimeout(runAllLint, 500);

  window.runAllLint = runAllLint;
  window.runHtmlLint = runAllLint;

  // Accept logs only from the preview iframe.
  window.addEventListener("message", (event) => {
    const iframe = document.getElementById("output");
    if (!iframe || event.source !== iframe.contentWindow) return;
    if (event.data && event.data.type === "CONSOLE_LOG") {
      window.appendLog(event.data.level, event.data.message);
    }
    // Preview storage sync: save in parent storage, persists across rebuilds.
    if (event.data && event.data.type === "SANDBOX_STORAGE_SYNC" && !window.__sbClearingStorage) {
      try {
        var key = "sandbox_preview_" + event.data.store + "Storage";
        var val = JSON.stringify(event.data.data || {});
        if (event.data.store === "local") localStorage.setItem(key, val);
        else sessionStorage.setItem(key, val);
      } catch (e) {}
    }
    // Preview cookie sync: save in parent storage, persists across rebuilds.
    // Debounced 300ms: typing "user=shayan" sends u, us, use, user=shayan.
    // Only the last one (after typing stops) is saved, so stale
    // "u", "us", "use" cookies do not pollute document.cookie.
    // Clearing the editor sends no sync, so saved cookies persist.
    if (event.data && event.data.type === "SANDBOX_COOKIE_SYNC" && !window.__sbClearingStorage) {
      try {
        window.__sbCookieSyncData = event.data.data || {};
        if (window.__sbCookieSyncTimer) clearTimeout(window.__sbCookieSyncTimer);
        window.__sbCookieSyncTimer = setTimeout(function(){
          try { localStorage.setItem("sandbox_preview_cookies", JSON.stringify(window.__sbCookieSyncData || {})); } catch (e) {}
        }, 300);
      } catch (e) {}
    }
  });

  let updateTimer = null;
  function updatePreview() {
    const htmlCode = window.htmlEditor.getValue();
    const cssCode = window.cssEditor.getValue();
    // Real JS, not the Snippets JSON, when the snippets editor is open.
    const jsCode = getRealJsCode();

    // Quota error must not kill the preview.
    try {
      localStorage.setItem("sandbox_html", htmlCode);
      localStorage.setItem("sandbox_css", cssCode);
      localStorage.setItem("sandbox_js", jsCode);
    } catch (e) {}

    const iframe = document.getElementById("output");
    if (!iframe) return;

    // Only clear console logs here: clearConsole() also wipes the Problems
    // panel and lint marks, which made Problems flicker to empty on every
    // keystroke until lint re-ran.
    window.clearConsoleLogs();
    const framework = localStorage.getItem("sandbox_framework") || "none";
    const frameworkCDNTag = getFrameworkCDN(framework);
    // Storage shim: sandboxed preview blocks localStorage, Eruda + user code need it.
    // Persist: preview syncs to parent storage, parent re-injects on rebuild.
    // In-memory fallback, only used when real storage throws. Runs first in HEAD.
    // Saved preview storage: persist across rebuilds (parent has real origin).
    const savedLocalData = (() => { try { return JSON.parse(localStorage.getItem("sandbox_preview_localStorage") || "{}") || {}; } catch (e) { return {}; } })();
    const savedSessionData = (() => { try { return JSON.parse(sessionStorage.getItem("sandbox_preview_sessionStorage") || "{}") || {}; } catch (e) { return {}; } })();
    const savedLocalJSON = JSON.stringify(savedLocalData).replace(/<\/script>/gi, "<\\/script>");
    const savedSessionJSON = JSON.stringify(savedSessionData).replace(/<\/script>/gi, "<\\/script>");
    // Saved preview cookies: drop expired ones, persist rest across rebuilds.
    // Cookie persistence: load saved cookies, so clearing the editor
    // (Ctrl+A + Backspace) does NOT delete the cookie. Only explicit
    // delete or Clear Storage removes it, like a real browser.
    const savedCookiesData = (() => { try { var raw = JSON.parse(localStorage.getItem("sandbox_preview_cookies") || "{}") || {}; var now = Date.now(); var out = {}; Object.keys(raw).forEach(function(k){ if(!raw[k]) return; var ex = raw[k].expires; if(ex !== null && ex !== undefined && ex <= now) return; out[k] = raw[k]; }); return out; } catch (e) { return {}; } })();
    const savedCookiesJSON = JSON.stringify(savedCookiesData).replace(/<\/script>/gi, "<\\/script>");
    const storageShimTag = '<script>(function(){function s(init,store){var d={};var o={};function sync(){try{window.parent.postMessage({type:\"SANDBOX_STORAGE_SYNC\",store:store,data:d},\"*\");}catch(e){}}function isMethod(k){return k===\"getItem\"||k===\"setItem\"||k===\"removeItem\"||k===\"clear\"||k===\"key\"||k===\"length\";}function setOwn(k,v){if(isMethod(k))return;try{Object.defineProperty(o,k,{value:v,configurable:true,enumerable:true,writable:true});}catch(e){}}function delOwn(k){if(isMethod(k))return;try{delete o[k];}catch(e){}}function get(k){try{k=String(k);return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null;}catch(e){return null;}}function set(k,v){try{k=String(k);v=String(v);d[k]=v;setOwn(k,v);sync();}catch(e){}}function rem(k){try{k=String(k);if(Object.prototype.hasOwnProperty.call(d,k)){delete d[k];delOwn(k);sync();}}catch(e){}}function clr(){try{var ks=Object.keys(d);for(var i=0;i<ks.length;i++){delete d[ks[i]];delOwn(ks[i]);}sync();}catch(e){}}function keyFn(i){try{return Object.keys(d)[i]||null;}catch(e){return null;}}Object.defineProperty(o,\"getItem\",{value:get,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"setItem\",{value:set,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"removeItem\",{value:rem,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"clear\",{value:clr,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"key\",{value:keyFn,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"length\",{get:function(){return Object.keys(d).length;},configurable:true,enumerable:false});try{var initObj=init||{};Object.keys(initObj).forEach(function(k){d[k]=String(initObj[k]);setOwn(k,d[k]);});}catch(e){}return o;}var __savedLocal=' + savedLocalJSON + ';var __savedSession=' + savedSessionJSON + ';function install(n,shim){try{Object.defineProperty(window,n,{value:shim,configurable:true,writable:true});return;}catch(e){}try{window[n]=shim;if(window[n]===shim)return;}catch(e){}try{Object.defineProperty(Window.prototype,n,{get:function(){return shim;},configurable:true});}catch(e){}}var __sbLS=s(__savedLocal,\"local\");var __sbSS=s(__savedSession,\"session\");install(\"localStorage\",__sbLS);install(\"sessionStorage\",__sbSS);try{window.addEventListener(\"message\",function(e){if(e&&e.data&&e.data.type===\"SANDBOX_STORAGE_CLEAR\"){try{__sbLS.clear();}catch(err){}try{__sbSS.clear();}catch(err){}}});}catch(err){}})();(function(){try{var d=Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype,\"cssRules\");if(d&&d.get){Object.defineProperty(CSSStyleSheet.prototype,\"cssRules\",{get:function(){try{return d.get.call(this);}catch(e){return [];}},configurable:true});}}catch(e){}try{var d2=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,\"contentDocument\");if(d2&&d2.get){Object.defineProperty(HTMLIFrameElement.prototype,\"contentDocument\",{get:function(){try{return d2.get.call(this);}catch(e){return null;}},configurable:true});}}catch(e){}})();(function(){var __savedCookies=' + savedCookiesJSON + ';var __store=__savedCookies||{};function isExp(c){return c&&c.expires!==null&&c.expires!==undefined&&Date.now()>c.expires;}function clean(){Object.keys(__store).forEach(function(k){if(isExp(__store[k]))delete __store[k];});}function sync(){try{window.parent.postMessage({type:\"SANDBOX_COOKIE_SYNC\",data:__store},\"*\");}catch(e){}}function getC(){clean();var p=[];Object.keys(__store).forEach(function(k){p.push(k+\"=\"+__store[k].value);});return p.join(\"; \");}function setC(str){try{str=String(str);var parts=str.split(\";\");var first=parts[0].split(\"=\");var name=(first[0]||\"\").trim();if(!name)return;var value=first.slice(1).join(\"=\").trim();var attrs={};for(var i=1;i<parts.length;i++){var pp=parts[i].split(\"=\");var ak=(pp[0]||\"\").trim().toLowerCase();var av=pp.slice(1).join(\"=\").trim();if(ak)attrs[ak]=av;}var expires=null;if(attrs[\"max-age\"]!==undefined){var ma=parseInt(attrs[\"max-age\"],10);if(!isNaN(ma)){if(ma<=0){delete __store[name];sync();return;}expires=Date.now()+ma*1000;}}if (expires===null&&attrs[\"expires\"]){var ed=Date.parse(attrs[\"expires\"]);if(!isNaN(ed))expires=ed;}if(expires!==null&&Date.now()>expires){delete __store[name];sync();return;}__store[name]={value:value,expires:expires};sync();}catch(e){}}function install(obj){try{Object.defineProperty(obj,\"cookie\",{get:getC,set:setC,configurable:true,enumerable:true});}catch(e){}}install(Document.prototype);install(document);try{window.addEventListener(\"message\",function(e){if(e&&e.data&&e.data.type===\"SANDBOX_STORAGE_CLEAR\"){try{Object.keys(__store).forEach(function(k){delete __store[k];});sync();}catch(err){}}});}catch(err){}})();<\/script>';
    // Eruda (local, offline): Eruda/eruda/eruda.js, no CDN.
    // No sources, no settings: Eruda adds settings itself; sources not needed.
    // Safe-access patch: cssRules / contentDocument must not throw, else Resources render stops.
    // Cookie: full store (sandboxed doc throws on real cookie). Persists via parent.
    // Local file = same-origin, real errors show without crossorigin.
    // Resources refresh: Eruda sometimes skips refresh, force it twice (logs real error).
    const erudaEnabled = localStorage.getItem("sandbox_eruda") === "true";
    const erudaScriptTag = erudaEnabled ? '<script src="Eruda/eruda/eruda.js"><\/script>' : "";
    const erudaInitTag = erudaEnabled ? '<script>function __initEruda(){var t=0;function tryInit(){if(window.eruda){try{if(!window.__erudaInited){window.__erudaInited=true;' +
      'eruda.init({tool:[\"console\",\"elements\",\"network\",\"resources\",\"info\"]}' +
      ');function __erudaResRefresh(){try{var r=eruda.get(\"resources\");if(r&&typeof ' +
      'r.refresh===\"function\"){r.refresh();}}catch(e){window.parent.postMessage({type:\"CONSOLE_LOG\",level:\"error\",message:\"Resources ' +
      'refresh failed: \"+(e&&e.message||e)},\"*\");}}setTimeout(__erudaResRefresh,1200);' +
      'setTimeout(__erudaResRefresh,3500);}}catch(e){window.parent.postMessage({type:"CONSOLE_LOG",level:"error",message:"Eruda ' +
      'init failed: "+(e&&e.message||e)},"*");}}else if(t++<50){setTimeout(tryInit,100);' +
      '}else{window.parent.postMessage({type:"CONSOLE_LOG",level:"error",message:"Eruda ' +
      'failed to load. Check network / ad-blocker."},"*");}}tryInit();}if(document.readyState==="loading"){window.addEventListener("DOMContentLoaded",__initEruda);' +
      '}else{__initEruda();}<\/script>' : "";

    // v1.7.2 loop protection, runs inside the preview iframe BEFORE user JS.
    // Loop guard: per-loop iteration + time budget. Counters reset when the
    // event loop yields, so separate loop runs don't add up.
    const loopGuardShim = `
    var __sbLoops_9f3 = {}, __sbLoopReset_9f3 = false;
    var __sbNow_9f3 = Date.now, __sbSetTimeout_9f3 = setTimeout;
    function __sbLoopGuard_9f3(id) {
    var s = __sbLoops_9f3[id];
    if (!s) { s = { c: 0, t: __sbNow_9f3() }; __sbLoops_9f3[id] = s; }
    s.c++;
    if (s.c > 5000000) throw new Error("Infinite loop protection: loop stopped after 5,000,000 iterations. Add a break or exit condition.");
    if ((s.c & 1023) === 0 && __sbNow_9f3() - s.t > 4000) throw new Error("Infinite loop protection: loop ran for over 4 seconds. Add a break or exit condition.");
    if (!__sbLoopReset_9f3) { __sbLoopReset_9f3 = true; __sbSetTimeout_9f3(function(){ __sbLoops_9f3 = {}; __sbLoopReset_9f3 = false; }, 0); }
    return true;
    }
    window.addEventListener("unhandledrejection", function(e){ try { var r = e && e.reason; console.error(r && r.message ? r.message : "Unhandled promise rejection"); } catch (err) {} });
    ` + [skipJsTemplate, maskJs, blankJsRegex, jsMatchBracket, instrumentJsLoops].map(function(f){ return f.toString(); }).join("\n") + `
    // ---- v1.7.3 full protection: string-code, microtasks, timers, DOM, popups ----
    var __sbEval_9f3 = eval, __sbFunction_9f3 = Function;
    window.eval = function(code){ return __sbEval_9f3(instrumentJsLoops(String(code))); };
    window.Function = function(){
    var args = Array.prototype.slice.call(arguments);
    var body = args.length ? args[args.length - 1] : "";
    var params = args.slice(0, -1);
    return __sbFunction_9f3.apply(null, params.concat([instrumentJsLoops(String(body))]));
    };
    var __sbTimerTotal_9f3 = 0, __sbTimerWin_9f3 = __sbNow_9f3();
    var __sbOrigSetTimeout_9f3 = setTimeout, __sbOrigSetInterval_9f3 = setInterval, __sbOrigClearInterval_9f3 = clearInterval;
    function __sbTimerOk_9f3(){
    var now = __sbNow_9f3();
    if (now - __sbTimerWin_9f3 > 1000) { __sbTimerWin_9f3 = now; __sbTimerTotal_9f3 = 0; }
    __sbTimerTotal_9f3++;
    if (__sbTimerTotal_9f3 > 1000) { try { console.error("Timer protection: too many timers created in 1 second. New timers blocked."); } catch (e) {} return false; }
    return true;
    }
    window.setTimeout = function(){
    var args = Array.prototype.slice.call(arguments);
    var fn = args[0];
    if (typeof fn === "string") { var code = fn; args[0] = function(){ __sbEval_9f3(instrumentJsLoops(code)); }; }
    if (!__sbTimerOk_9f3()) return 0;
    return __sbOrigSetTimeout_9f3.apply(window, args);
    };
    window.setInterval = function(){
    var args = Array.prototype.slice.call(arguments);
    var fn = args[0];
    if (typeof fn === "string") { var code = fn; args[0] = function(){ __sbEval_9f3(instrumentJsLoops(code)); }; }
    if (!__sbTimerOk_9f3()) return 0;
    var extra = args.slice(2), count = 0, id = 0;
    var wrapped = function(){
    count++;
    if (count > 10000) { __sbOrigClearInterval_9f3(id); try { console.error("Timer protection: interval stopped after 10,000 runs."); } catch (e) {} return; }
    if (typeof args[0] === "function") args[0].apply(null, extra);
    };
    id = __sbOrigSetInterval_9f3(wrapped, args[1]);
    return id;
    };
    var __sbMicroCount_9f3 = 0, __sbMicroReset_9f3 = false;
    function __sbMicroTick_9f3(){
    __sbMicroCount_9f3++;
    if (__sbMicroCount_9f3 > 100000) throw new Error("Microtask protection: too many promise / microtask callbacks without yielding. Add a setTimeout to break the chain.");
    if (!__sbMicroReset_9f3) { __sbMicroReset_9f3 = true; __sbSetTimeout_9f3(function(){ __sbMicroCount_9f3 = 0; __sbMicroReset_9f3 = false; }, 0); }
    }
    try {
    var __sbOrigThen_9f3 = Promise.prototype.then;
    Promise.prototype.then = function(onF, onR){
    function wrap(fn){ if (typeof fn !== "function") return fn; return function(v){ __sbMicroTick_9f3(); return fn(v); }; }
    return __sbOrigThen_9f3.call(this, wrap(onF), wrap(onR));
    };
    } catch (e) {}
    try {
    var __sbOrigQueueMicrotask_9f3 = queueMicrotask;
    window.queueMicrotask = function(fn){ return __sbOrigQueueMicrotask_9f3(function(){ __sbMicroTick_9f3(); fn(); }); };
    } catch (e) {}
    try {
    var __sbOrigMO_9f3 = MutationObserver;
    window.MutationObserver = function(cb){
    var wrapped = function(records, obs){ __sbMicroTick_9f3(); cb(records, obs); };
    return new __sbOrigMO_9f3(wrapped);
    };
    } catch (e) {}
    var __sbDomBlocked_9f3 = false, __sbAppendCount_9f3 = 0, __sbAppendWin_9f3 = __sbNow_9f3();
    function __sbAppendOk_9f3(){
    if (__sbDomBlocked_9f3) return false;
    var now = __sbNow_9f3();
    if (now - __sbAppendWin_9f3 > 1000) { __sbAppendWin_9f3 = now; __sbAppendCount_9f3 = 0; }
    __sbAppendCount_9f3++;
    if (__sbAppendCount_9f3 > 5000) { try { console.error("DOM protection: too many nodes added in 1 second. Appends blocked."); } catch (e) {} return false; }
    return true;
    }
    try {
    var __sbOrigAppendChild_9f3 = Node.prototype.appendChild;
    Node.prototype.appendChild = function(node){ if (!__sbAppendOk_9f3()) return node; return __sbOrigAppendChild_9f3.call(this, node); };
    } catch (e) {}
    try {
    var __sbOrigInsertBefore_9f3 = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function(node, ref){ if (!__sbAppendOk_9f3()) return node; return __sbOrigInsertBefore_9f3.call(this, node, ref); };
    } catch (e) {}
    try {
    if (typeof ParentNode !== "undefined") {
    var __sbOrigAppend_9f3 = ParentNode.prototype.append;
    ParentNode.prototype.append = function(){ if (!__sbAppendOk_9f3()) return; return __sbOrigAppend_9f3.apply(this, arguments); };
    var __sbOrigPrepend_9f3 = ParentNode.prototype.prepend;
    ParentNode.prototype.prepend = function(){ if (!__sbAppendOk_9f3()) return; return __sbOrigPrepend_9f3.apply(this, arguments); };
    var __sbOrigReplaceChildren_9f3 = ParentNode.prototype.replaceChildren;
    ParentNode.prototype.replaceChildren = function(){ if (!__sbAppendOk_9f3()) return; return __sbOrigReplaceChildren_9f3.apply(this, arguments); };
    }
    } catch (e) {}
    try {
    var __sbOrigInsertAdjacentHTML_9f3 = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function(pos, html){ if (!__sbAppendOk_9f3()) return; return __sbOrigInsertAdjacentHTML_9f3.call(this, pos, html); };
    var __sbOrigInsertAdjacentElement_9f3 = Element.prototype.insertAdjacentElement;
    Element.prototype.insertAdjacentElement = function(pos, el){ if (!__sbAppendOk_9f3()) return el; return __sbOrigInsertAdjacentElement_9f3.call(this, pos, el); };
    var __sbOrigInsertAdjacentText_9f3 = Element.prototype.insertAdjacentText;
    Element.prototype.insertAdjacentText = function(pos, text){ if (!__sbAppendOk_9f3()) return; return __sbOrigInsertAdjacentText_9f3.call(this, pos, text); };
    } catch (e) {}
    try {
    var __sbInnerHTMLDesc_9f3 = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    if (__sbInnerHTMLDesc_9f3 && __sbInnerHTMLDesc_9f3.set) {
    Object.defineProperty(Element.prototype, "innerHTML", { configurable: true, enumerable: __sbInnerHTMLDesc_9f3.enumerable, get: function(){ return __sbInnerHTMLDesc_9f3.get.call(this); }, set: function(v){ if (!__sbAppendOk_9f3()) return; __sbInnerHTMLDesc_9f3.set.call(this, v); } });
    }
    var __sbOuterHTMLDesc_9f3 = Object.getOwnPropertyDescriptor(Element.prototype, "outerHTML");
    if (__sbOuterHTMLDesc_9f3 && __sbOuterHTMLDesc_9f3.set) {
    Object.defineProperty(Element.prototype, "outerHTML", { configurable: true, enumerable: __sbOuterHTMLDesc_9f3.enumerable, get: function(){ return __sbOuterHTMLDesc_9f3.get.call(this); }, set: function(v){ if (!__sbAppendOk_9f3()) return; __sbOuterHTMLDesc_9f3.set.call(this, v); } });
    }
    } catch (e) {}
    try {
    var __sbOrigWrite_9f3 = document.write, __sbOrigWriteln_9f3 = document.writeln;
    document.write = function(){ if (document.readyState !== "loading") { try { console.error("document.write blocked: page already loaded. Use innerHTML / DOM methods instead."); } catch (e) {} return; } return __sbOrigWrite_9f3.apply(document, arguments); };
    document.writeln = function(){ if (document.readyState !== "loading") { try { console.error("document.write blocked: page already loaded. Use innerHTML / DOM methods instead."); } catch (e) {} return; } return __sbOrigWriteln_9f3.apply(document, arguments); };
    } catch (e) {}
    try {
    var __sbOpenCount_9f3 = 0, __sbOpenWin_9f3 = __sbNow_9f3();
    var __sbOrigOpen_9f3 = window.open;
    window.open = function(){ var now = __sbNow_9f3(); if (now - __sbOpenWin_9f3 > 2000) { __sbOpenWin_9f3 = now; __sbOpenCount_9f3 = 0; } __sbOpenCount_9f3++; if (__sbOpenCount_9f3 > 3) { try { console.error("Popup protection: too many window.open calls. Blocked."); } catch (e) {} return null; } return __sbOrigOpen_9f3.apply(window, arguments); };
    } catch (e) {}
    try {
    var __sbReloadCount_9f3 = 0, __sbReloadWin_9f3 = __sbNow_9f3();
    var __sbOrigReload_9f3 = location.reload;
    location.reload = function(){ var now = __sbNow_9f3(); if (now - __sbReloadWin_9f3 > 2000) { __sbReloadWin_9f3 = now; __sbReloadCount_9f3 = 0; } __sbReloadCount_9f3++; if (__sbReloadCount_9f3 > 3) { try { console.error("Reload protection: too many location.reload calls. Blocked."); } catch (e) {} return; } return __sbOrigReload_9f3.call(location); };
    } catch (e) {}
    try {
    var __sbWorkerCount_9f3 = 0;
    var __sbOrigWorker_9f3 = Worker;
    window.Worker = function(url, opts){ __sbWorkerCount_9f3++; if (__sbWorkerCount_9f3 > 4) throw new Error("Worker protection: too many workers (max 4)."); return new __sbOrigWorker_9f3(url, opts); };
    } catch (e) {}
    var __sbLogCount_9f3 = 0, __sbLogWin_9f3 = 0, __sbLogWarned_9f3 = false;
    function __sbLogOk_9f3(){
    var now = __sbNow_9f3();
    if (!__sbLogWin_9f3) __sbLogWin_9f3 = now;
    if (now - __sbLogWin_9f3 > 1000) { __sbLogWin_9f3 = now; __sbLogCount_9f3 = 0; __sbLogWarned_9f3 = false; }
    __sbLogCount_9f3++;
    if (__sbLogCount_9f3 > 100) {
    if (!__sbLogWarned_9f3) { __sbLogWarned_9f3 = true; try { window.parent.postMessage({ type: "CONSOLE_LOG", level: "warn", message: "Console output throttled: too many logs in 1 second." }, "*"); } catch (e) {} }
    return false;
    }
    return true;
    }
    try {
    var __sbOrigRepeat_9f3 = String.prototype.repeat;
    String.prototype.repeat = function(count){ if (count > 10000000) throw new Error("Memory protection: String.repeat count too large (max 10,000,000)."); return __sbOrigRepeat_9f3.call(this, count); };
    } catch (e) {}
    try {
    var __sbOrigFill_9f3 = Array.prototype.fill;
    Array.prototype.fill = function(value, start, end){ if (this != null && this.length > 50000000) throw new Error("Memory protection: Array.fill on an array over 50,000,000 long is blocked."); return __sbOrigFill_9f3.call(this, value, start, end); };
    } catch (e) {}
    __sbSetTimeout_9f3(function __sbWatchdog_9f3(){
    try {
    if (!__sbDomBlocked_9f3 && typeof document !== "undefined" && document.querySelectorAll) {
    var nodeCount = document.querySelectorAll("*").length;
    if (nodeCount > 20000) { __sbDomBlocked_9f3 = true; try { console.error("DOM protection: page has over 20,000 nodes. Appends blocked to stop the tab from freezing."); } catch (e) {} }
    }
    if (typeof performance !== "undefined" && performance.memory) {
    var mem = performance.memory;
    if (mem.jsHeapSizeLimit && mem.usedJSHeapSize > mem.jsHeapSizeLimit * 0.85) { try { console.error("Memory protection: JS heap is over 85% full. Stop adding data or the tab may crash."); } catch (e) {} }
    }
    } catch (e) {}
    __sbSetTimeout_9f3(__sbWatchdog_9f3, 1000);
    }, 1000);
    `;
    const safeJsCode = String(instrumentJsLoops(jsCode || "")).replace(/<\/script>/gi, "<\\/script>");
    const combinedContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(getProjectTitle())}</title>
    ${frameworkCDNTag}
    ${storageShimTag ? '<!-- Injected Code -->\n    ' + storageShimTag : ''}
    ${erudaScriptTag ? '<!-- Injected Code -->\n    ' + erudaScriptTag : ''}
    ${erudaInitTag ? '<!-- Injected Code -->\n    ' + erudaInitTag : ''}
    <style>${cssCode.replace(/<\/style>/gi, '<\\/style>')}</style>
    <!-- Injected Code -->
    <script>
    // Mark Eruda's own <style> blocks (Eruda injects them into <head> at init) with Injected Code comment.
    // User <style> is already parsed before this script runs, so observer never sees it.
    // Only styles with Eruda-specific content (.eruda- / eruda-icon) are marked.
    try {
      var __erudaStyleObs_9f3 = new MutationObserver(function(muts) {
        for (var mi = 0; mi < muts.length; mi++) {
          var added = muts[mi].addedNodes;
          for (var ai = 0; ai < added.length; ai++) {
            var node = added[ai];
            if (!node || node.nodeName !== 'STYLE') continue;
            var txt = node.textContent || '';
            if (!/\.eruda-|eruda-icon/.test(txt)) continue;
            var prev = node.previousSibling;
            if (prev && prev.nodeType === 8 && String(prev.nodeValue || '').indexOf('Injected Code') !== -1) continue;
            try { node.parentNode.insertBefore(document.createComment(' Injected Code '), node); } catch (e) {}
          }
        }
      });
      if (document.head) __erudaStyleObs_9f3.observe(document.head, { childList: true });
    } catch (e) {}
    function formatArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      // DOM node: show real tag, not {}. JSON.stringify(DOM) is always {}.
      if (typeof arg.nodeType === 'number' && typeof arg.nodeName === 'string') {
        try {
          if (arg.nodeType === 1) {
            var html = arg.outerHTML || ('<' + String(arg.tagName).toLowerCase() + '>');
            if (html.length > 500) html = html.slice(0, 500) + '...';
            return html;
          }
          if (arg.nodeType === 3) return arg.textContent;
          if (arg.nodeType === 9) return '#document';
          return String(arg);
        } catch (e) { return String(arg); }
      }
    try { return JSON.stringify(arg, null, 2); } catch (e) { return String(arg); }
    }
    return String(arg);
    }
    const origLog = console.log, origError = console.error, origWarn = console.warn, origInfo = console.info;
    function sendLog(level, args) {
    try {
    if (typeof __sbLogOk_9f3 === "function" && !__sbLogOk_9f3()) return;
    const formatted = Array.from(args).map(formatArg).join(' ');
    window.parent.postMessage({ type: 'CONSOLE_LOG', level: level, message: formatted }, '*');
    } catch (e) {}
    }
    console.log = function(...args) { origLog.apply(console, args); sendLog('log', args); };
    console.error = function(...args) { origError.apply(console, args); sendLog('error', args); };
    console.warn = function(...args) { origWarn.apply(console, args); sendLog('warn', args); };
    console.info = function(...args) { origInfo.apply(console, args); sendLog('info', args); };
    var __jsLineOffset = __SANDBOX_JS_LINE_OFFSET_9f3__;
    var __htmlLineOffset = __SANDBOX_HTML_LINE_OFFSET_9f3__;
    function __sbFindSiteLine_9f3(stack) {
      if (!stack) return 0;
      var re = /:[0-9]+:[0-9]+/g, m;
      while ((m = re.exec(stack)) !== null) {
        var parts = m[0].split(":");
        var ln = parseInt(parts[1], 10);
        if (ln > __jsLineOffset) return ln;
      }
      return 0;
    }
    window.onerror = function(msg, url, line, col, errObj) {
      var L = line || 1, src = "", editorLine = 0;
      if (L > __htmlLineOffset) { src = "HTML"; editorLine = L - __htmlLineOffset; }
      else if (L > __jsLineOffset) { src = "JS"; editorLine = L - __jsLineOffset; }
      else {
        var site = __sbFindSiteLine_9f3(errObj && errObj.stack);
        if (site > __htmlLineOffset) { src = "HTML"; editorLine = site - __htmlLineOffset; }
        else if (site > __jsLineOffset) { src = "JS"; editorLine = site - __jsLineOffset; }
      }
      var suffix = src ? " (" + src + " Line: " + Math.max(1, editorLine) + ")"
        : " (Line: " + Math.max(1, L - __jsLineOffset) + ")";
      sendLog('error', [msg + suffix]);
      return true;
    };
    // User JS runs after DOM is ready so getElementById works. Shim DOMContentLoaded for late listeners.
    (function(){
    var _origDocAdd = document.addEventListener.bind(document);
    document.addEventListener = function(type, listener, opts){
    if (type === 'DOMContentLoaded' && document.readyState !== 'loading') {
    setTimeout(function(){ try{ listener.call(document, new Event('DOMContentLoaded')); }catch(e){} }, 0);
    return;
    }
    return _origDocAdd(type, listener, opts);
    };
    })();
    ${loopGuardShim}
    </script>
    <script>
    window.addEventListener('DOMContentLoaded', function(){
    try {
    /*__SANDBOX_USER_JS_9f3__*/
    ${safeJsCode}
    } catch (err) {
    var __sbSite_9f3 = (typeof __sbFindSiteLine_9f3 === "function") ? __sbFindSiteLine_9f3(err && err.stack) : 0;
    var __sbSuffix_9f3 = "";
    if (__sbSite_9f3 > __htmlLineOffset) __sbSuffix_9f3 = " (HTML Line: " + Math.max(1, __sbSite_9f3 - __htmlLineOffset) + ")";
    else if (__sbSite_9f3 > __jsLineOffset) __sbSuffix_9f3 = " (JS Line: " + Math.max(1, __sbSite_9f3 - __jsLineOffset) + ")";
    console.error(err.message + __sbSuffix_9f3);
    }
    });
    </script>
    </head>
    <body>
    <!--__SANDBOX_USER_HTML_9f3__-->
    ${instrumentHtmlScripts(htmlCode)}
    </body>
    </html>
    `;
    // Map preview error lines back to user JS lines.
    // Marker is unique (never collides with short user JS like "a").
    // Placeholder is always replaced, even when JS is empty, else the head script throws.
    let fixedContent = combinedContent;
    const markerIdx = combinedContent.indexOf("/*__SANDBOX_USER_JS_9f3__*/");
    const jsLineOffset = markerIdx > 0 ? combinedContent.slice(0, markerIdx).split("\n").length : combinedContent.split("\n").length;
    fixedContent = combinedContent.replace("__SANDBOX_JS_LINE_OFFSET_9f3__", String(jsLineOffset));
    const htmlMarkerIdx = fixedContent.indexOf("<!--__SANDBOX_USER_HTML_9f3__-->");
    const htmlLineOffset = htmlMarkerIdx > 0 ? fixedContent.slice(0, htmlMarkerIdx).split("\n").length : fixedContent.split("\n").length;
    fixedContent = fixedContent.replace("__SANDBOX_HTML_LINE_OFFSET_9f3__", String(htmlLineOffset));
    iframe.srcdoc = fixedContent;
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
