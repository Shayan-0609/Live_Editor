document.addEventListener("DOMContentLoaded", () => {
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
        history.replaceState(null, null, window.location.pathname + window.location.search);
      }
    }
  } catch (e) {
    console.error("Error loading shared code from URL hash:", e);
  }

  if (typeof CodeMirror === "undefined") { alert("CodeMirror failed to load. Check the CodeMirror-5 files."); return; }

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
      "bt5": "<div class=\"container py-4\">\n  <div class=\"p-5 mb-4 bg-light rounded-3 shadow-sm\">\n    <div class=\"container-fluid py-3\">\n      <h1 class=\"display-5 fw-bold text-primary\">Bootstrap 5 Ready</h1>\n      <p class=\"col-md-8 fs-4\">Start building your responsive UI instantly.</p>\n      <button class=\"btn btn-dark btn-lg\" type=\"button\">Explore</button>\n    </div>\n  </div>\n</div>",
      "tw": "<div class=\"min-h-screen bg-gray-50 flex items-center justify-center p-6\">\n  <div class=\"max-w-md w-full bg-white rounded-xl shadow-md p-8 space-y-4\">\n    <h1 class=\"text-2xl font-bold text-indigo-600\">Tailwind Ready</h1>\n    <p class=\"text-gray-600 text-sm\">Your utility-first playground is set up and ready to go.</p>\n    <button class=\"w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition\">Get Started</button>\n  </div>\n</div>",
      "lorem": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Tempora, saepe molestias! Fugiat fuga, fugit, distinctio culpa ad dignissimos commodi molestiae cumque odio magni ipsum placeat dolorum, eius totam quae dolore!",
      "lorem10": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, illum.",
      "lorem20": "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ducimus fugiat quam natus a vitae neque, corporis at qui illo quo?",
      "lorem30": "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dolore facilis, perspiciatis corrupti repellat reprehenderit possimus delectus vero minus quibusdam magnam! Ratione veritatis porro voluptates ducimus sequi eligendi doloremque error dicta?",
      "lorem40": "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Dolore, optio aliquid voluptates sit voluptas provident dolorem minus eveniet expedita laborum repudiandae, ratione nisi reiciendis totam sequi nemo possimus, maiores tempora quae illum saepe? Explicabo laudantium ullam quam nulla quod iste?",
      "lorem50": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Dignissimos modi nisi corrupti? Commodi ipsa accusamus reprehenderit fugiat voluptatibus, non delectus sed blanditiis inventore rem. Quae maiores veniam quos repellat voluptatibus, debitis quasi! Et facere pariatur eveniet adipisci dignissimos exercitationem rem vitae praesentium tempora iste sequi sint, quas modi consectetur delectus.",
      "lorem100": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae a porro ducimus nihil illum quas facere maxime, corrupti quos quasi doloribus molestias architecto nobis, inventore mollitia labore aliquam molestiae commodi. Molestias nulla reprehenderit eius recusandae consectetur debitis rerum possimus? Placeat dolorem tempore excepturi ipsum quisquam provident, ea sint animi eum at? Alias fugit sunt, maxime, iusto possimus iste ratione minus quasi nostrum accusamus officiis, est veritatis odit deserunt doloremque. Cumque nobis, culpa ut illum deleniti molestias consectetur! Voluptatem rem deleniti pariatur quae fugit adipisci voluptatibus nobis quos corporis doloribus, accusamus dignissimos est rerum ullam harum dicta ea autem sed laboriosam!"
    },
    "css": {
      "flex": "display: flex;\nalign-items: center;\njustify-content: center;",
      "pos": "position: absolute;\ntop: 0;\nleft: 0;",
      "!": "/* Minimal CSS Reset & Modern Base */\n*,\n*::before,\n*::after {\n  box-sizing: border-box;\n}\n\n:root {\n  /* Comprehensive Modern Typography Stacks */\n  --font-sans-serif: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Noto Sans', 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';\n  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace, 'Segoe UI Mono', 'Roboto Mono', 'Ubuntu Mono', 'Droid Sans Mono';\n  \n  /* Theme Base Variables */\n  --bg-surface: #fafbfc;\n  --text-primary: #222222;\n}\n\nhtml {\n  font-smooth: always;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\n  -webkit-text-size-adjust: 100%;\n}\n\nbody {\n  margin: 0;\n  font-family: var(--font-sans-serif);\n  background: var(--bg-surface);\n  color: var(--text-primary);\n  min-height: 100vh;\n  min-height: 100dvh;\n  font-size: 1rem;\n  font-weight: 400;\n  line-height: 1.5;\n  text-align: start;\n}"
    }
  };

  function mergeSnippets(parsed) {
    const p = parsed && typeof parsed === "object" ? parsed : {};
    return { js: { ...defaultSnippets.js, ...(p.js || {}) }, html: { ...defaultSnippets.html, ...(p.html || {}) }, css: { ...defaultSnippets.css, ...(p.css || {}) } };
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
    st.textContent = ".sandbox-breadcrumb{display:flex;align-items:center;gap:4px;padding:5px 10px;background:#1e1e2e;border-bottom:1px solid #333;overflow-x:auto;white-space:nowrap;font-size:12px;font-family:ui-monospace,Menlo,Consolas,monospace;scrollbar-width:none}.sandbox-breadcrumb::-webkit-scrollbar{display:none}.sandbox-crumb-file{color:#9ad1ff;font-weight:700;flex-shrink:0}.sandbox-crumb{color:#d0d0d0;cursor:pointer;padding:2px 5px;border-radius:4px;flex-shrink:0}.sandbox-crumb:hover{background:#33334a;color:#fff}.sandbox-crumb.active{color:#ffd479;font-weight:600;background:#2a2a3a}.sandbox-crumb-sep{color:#666;flex-shrink:0}.sandbox-crumb-empty{color:#888}.sandbox-fold-widget{color:#9ad1ff;background:#2a2a3a;border:1px solid #3a3a5a;border-radius:4px;padding:0 6px;margin:0 2px;font-size:11px;cursor:pointer}.sandbox-fold-widget:hover{background:#3a3a5a}.sandbox-fold-marker{color:#888;cursor:pointer;font-size:10px;line-height:1;display:inline-block;width:14px;text-align:center}.sandbox-fold-marker:hover{color:#fff}.sandbox-fold-marker.folded{color:#ffd479}.CodeMirror-gutter.sandbox-fold-gutter{width:16px}.sandbox-breadcrumb-toggle{margin-left:auto;flex-shrink:0;background:transparent;border:1px solid #444;color:#aaa;border-radius:4px;font-size:11px;padding:1px 6px;cursor:pointer}.sandbox-breadcrumb-toggle:hover{color:#fff;border-color:#777}";
    document.head.appendChild(st);
  }
  let breadcrumbEl = null;
  function ensureBreadcrumbEl() {
    if (breadcrumbEl) return breadcrumbEl;
    const tabs = document.getElementById("sandboxTabs");
    const bar = document.createElement("div");
    bar.className = "sandbox-breadcrumb";
    bar.id = "sandbox-breadcrumb";
    bar.innerHTML = '<span class="sandbox-crumb-file">index.html</span><span class="sandbox-crumb-sep">›</span><span class="sandbox-crumb-empty">No selection</span>';
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
      const logPane = document.querySelector('#log-pane.show.active, #console-pane.show.active, #logs-pane.show.active, #js-console-pane.show.active, #output-pane.show.active');
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
    const text = cm.getLine(line) || "";
    const braceIdx = text.indexOf("{");
    if (braceIdx === -1) return null;
    let depth = 0;
    for (let ln = line; ln < cm.lineCount(); ln++) {
      let l = cm.getLine(ln) || "";
      let stripped = l.replace(/"([^"\\]|\\.)*"/g, '""').replace(/'([^'\\]|\\.)*'/g, "''").replace(/`([^`\\]|\\.)*`/g, "``").replace(/\/\/.*$/, "");
      let startIdx = (ln === line) ? braceIdx : 0;
      for (let i = startIdx; i < stripped.length; i++) {
        if (stripped[i] === "{") depth++;
        else if (stripped[i] === "}") {
          depth--;
          if (depth === 0) {
            if (ln === line) return null;
            return { from: { line, ch: braceIdx + 1 }, to: { line: ln, ch: i }, startLine: line, endLine: ln };
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
            return { from: { line, ch: m.index + m[0].length }, to: { line: ln, ch: mm.index }, startLine: line, endLine: ln };
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
        if (endIdx !== -1) return { from: { line, ch: startIdx + 2 }, to: { line: ln, ch: endIdx }, startLine: line, endLine: ln };
      } else {
        let endIdx = l.indexOf("-->");
        if (endIdx !== -1) return { from: { line, ch: startIdx + 4 }, to: { line: ln, ch: endIdx }, startLine: line, endLine: ln };
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
    const mark = cm.markText(range.from, range.to, { collapsed: true, inclusiveLeft: false, inclusiveRight: false, replacedWith: widget, clearWhenEmpty: false });
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
      if (mode === 'js' || mode === 'css') {
        if (selection.startsWith('/*') && selection.endsWith('*/')) {
          const unwrapped = selection.slice(2, -2).trim();
          editor.replaceSelection(unwrapped);
        } else {
          editor.replaceSelection(`/* ${selection} */`);
        }
      } else if (mode === 'html') {
        if (selection.startsWith('<!--') && selection.endsWith('-->')) {
          const unwrapped = selection.slice(4, -3).trim();
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
      if (trimmed.startsWith('//')) {
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
  const EMMET_SELF_CLOSING = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
  const EMMET_KNOWN_TAGS = new Set(['a','abbr','address','area','article','aside','audio','b','base','bdi','bdo','blockquote','body','br','button','canvas','caption','cite','code','col','colgroup','data','datalist','dd','del','details','dfn','dialog','div','dl','dt','em','embed','fieldset','figcaption','figure','footer','form','h1','h2','h3','h4','h5','h6','head','header','hgroup','hr','html','i','iframe','img','input','ins','kbd','label','legend','li','link','main','map','mark','menu','meta','meter','nav','noscript','object','ol','optgroup','option','output','p','picture','pre','progress','q','rp','rt','ruby','s','samp','script','search','section','select','small','source','span','strong','style','sub','summary','sup','table','tbody','td','template','textarea','tfoot','th','thead','time','title','tr','track','u','ul','var','video','wbr']);
  const EMMET_LOREM_WORDS = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum perspiciatis unde omnis iste natus error voluptatem accusantium doloremque laudantium totam rem aperiam eaque ab illo inventore veritatis quasi architecto beatae vitae dicta explicabo nemo enim ipsam voluptatem quia voluptas aspernatur odit aut fugit consequuntur magni dolores eos ratione sequi nesciunt neque porro quisquam numquam eius modi tempora incidunt magnam quaerat").split(" ");
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
      multiplier = parseInt(multMatch[1], 10) || 1;
      seg = seg.slice(0, -multMatch[0].length);
    }
    let textTemplate = "";
    const contentMatch = seg.match(/\{([^\}]*)\}/);
    if (contentMatch) {
      textTemplate = contentMatch[1];
      seg = seg.replace(contentMatch[0], "");
    }
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
          // Quote unquoted attr value in single-attr case only, so multi-attr stays intact.
          const _singleAttr = inner.match(/^([A-Za-z0-9\-_:.]+)=([^\s]+)$/);
          if (_singleAttr && !_singleAttr[2].startsWith('"') && !_singleAttr[2].startsWith("'")) {
            attrs.push(_singleAttr[1] + '="' + _singleAttr[2] + '"');
          } else {
            attrs.push(inner);
          }
        }
        i = j;
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
        const _inputTypeMap = { c: 'checkbox', ch: 'checkbox', t: 'text', p: 'password', h: 'hidden', s: 'submit', r: 'radio', f: 'file', i: 'image', e: 'email', u: 'url', n: 'number', d: 'date', m: 'month', w: 'week', ti: 'time', dt: 'datetime-local', se: 'search', tel: 'tel', col: 'color', ra: 'range', b: 'button', re: 'reset', su: 'submit' };
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
      return { type: "element", tagName: "__lorem__", isLorem: true, loremWords: n, idTemplate: "", classesTemplate: [], attrsTemplate: [], textTemplate: "", multiplier: multiplier, children: [] };
    }
    return { type: "element", tagName: tagName, idTemplate: idTemplate, classesTemplate: classesTemplate, attrsTemplate: attrs, textTemplate: textTemplate, multiplier: multiplier, children: [] };
  }
  function emmetMakeConcrete(astNode, index, total) {
    if (astNode.isLorem) {
      return { tagName: "__lorem__", isLorem: true, id: "", classes: [], attrs: [], textContent: emmetLoremText(astNode.loremWords || 30), isSelfClosing: false, children: [] };
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
      let lastGroupDepth = 0;
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
            mult = parseInt(num, 10) || 1;
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
        const _groupDepth = _isGroupUnit ? emmetMaxDepth(unitNodes[0]) : 0;
        let _leaves = [];
        for (const a of appended) {
          if (a.type === "group") _leaves.push(...emmetCollectLeaves(a));
          else _leaves.push(a);
        }
        lastAppended = _leaves;
        lastWasGroup = _isGroupUnit;
        lastGroupDepth = _groupDepth;
        skipSpaces();
        if (pos >= len) break;
        if (s[pos] === ")") break;
        if (s[pos] === ">") { pos++; stack.push(parents); parents = lastAppended; continue; }
        if (s[pos] === "+") { pos++; continue; }
        if (s[pos] === "^") {
          let cnt = 0;
          while (pos < len && s[pos] === "^") { pos++; cnt++; }
          let effective = cnt;
          if (lastWasGroup) effective = Math.max(0, cnt - lastGroupDepth);
          for (let q = 0; q < effective; q++) {
            if (stack.length > 0) parents = stack.pop();
            else parents = [null];
          }
          lastWasGroup = false;
          lastGroupDepth = 0;
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
    if (!ast) return { tagName: "div", id: "", classes: [], attrs: [], textContent: "", isSelfClosing: false, children: [] };
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
  function renderNodesToHTML(nodes, baseIndent = "", indentLevel = 0) {
    let html = "";
    let indent = baseIndent + "  ".repeat(indentLevel);
    for (let node of nodes) {
      if (node.isLorem) { html += `${indent}${node.textContent}\n`; continue; }
      let attrStr = "";
      if (node.id) attrStr += ` id="${node.id}"`;
      if (node.classes.length > 0) attrStr += ` class="${node.classes.join(' ')}"`;
      for (let attr of node.attrs) { attrStr += ` ${attr}`; }
      if (EMMET_SELF_CLOSING.includes(node.tagName.toLowerCase())) {
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
    abbr = String(abbr).trim();
    if (!abbr) return "";
    if (abbr === "!" || abbr === "html:5" || abbr === "html:5!") {
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>`;
    }
    try {
      const ast = emmetParseToAST(abbr);
      if (!ast || ast.length === 0) return "";
      const nodes = emmetExpandAST(ast, 0, 1);
      return renderNodesToHTML(nodes, baseIndent, 0).trimEnd();
    } catch (e) { console.warn("Emmet expand failed:", e); return ""; }
  }


  const CSS_EMMET_FIXED = {
    'df':'display: flex;', 'db':'display: block;', 'dib':'display: inline-block;', 'di':'display: inline;', 'dn':'display: none;', 'dg':'display: grid;', 'dif':'display: inline-flex;',
    'posa':'position: absolute;', 'posr':'position: relative;', 'posf':'position: fixed;', 'poss':'position: static;', 'post':'position: sticky;',
    'jcc':'justify-content: center;', 'jcsb':'justify-content: space-between;', 'jcsa':'justify-content: space-around;', 'jcse':'justify-content: space-evenly;', 'jcfs':'justify-content: flex-start;', 'jcfe':'justify-content: flex-end;',
    'aic':'align-items: center;', 'aifs':'align-items: flex-start;', 'aife':'align-items: flex-end;', 'ais':'align-items: stretch;', 'aib':'align-items: baseline;',
    'acc':'align-content: center;', 'acs':'align-content: stretch;',
    'fdc':'flex-direction: column;', 'fdr':'flex-direction: row;', 'fdcr':'flex-direction: column-reverse;', 'fdrr':'flex-direction: row-reverse;',
    'fww':'flex-wrap: wrap;', 'fwnw':'flex-wrap: nowrap;',
    'tac':'text-align: center;', 'tal':'text-align: left;', 'tar':'text-align: right;', 'taj':'text-align: justify;',
    'tdn':'text-decoration: none;', 'tdu':'text-decoration: underline;',
    'ttu':'text-transform: uppercase;', 'ttl':'text-transform: lowercase;', 'ttc':'text-transform: capitalize;', 'ttn':'text-transform: none;',
    'fwb':'font-weight: bold;', 'fwn':'font-weight: normal;',
    'fsi':'font-style: italic;', 'fsn':'font-style: normal;',
    'whsnw':'white-space: nowrap;', 'whsn':'white-space: normal;',
    'bszbb':'box-sizing: border-box;', 'bszcb':'box-sizing: content-box;',
    'ovh':'overflow: hidden;', 'ova':'overflow: auto;', 'ovs':'overflow: scroll;', 'ovv':'overflow: visible;',
    'ovxh':'overflow-x: hidden;', 'ovxa':'overflow-x: auto;', 'ovyh':'overflow-y: hidden;', 'ovya':'overflow-y: auto;',
    'curp':'cursor: pointer;', 'curd':'cursor: default;',
    'vish':'visibility: hidden;', 'visv':'visibility: visible;',
    'usn':'user-select: none;', 'pen':'pointer-events: none;', 'pea':'pointer-events: auto;',
    'bshn':'box-shadow: none;', 'bgn':'background: none;', 'bdn':'border: none;',
    'fll':'float: left;', 'flr':'float: right;', 'fln':'float: none;',
    'clb':'clear: both;', 'cll':'clear: left;', 'clr':'clear: right;', 'cln':'clear: none;',
    'bgsc':'background-size: cover;', 'bgsct':'background-size: contain;',
    'bgrnr':'background-repeat: no-repeat;', 'bgrr':'background-repeat: repeat;',
    'bgpc':'background-position: center;',
    'w100p':'width: 100%;', 'h100p':'height: 100%;'
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
    'p': { prop:'padding', map:{} }
  };
  const CSS_EMMET_PREFIX = [
    { pre:'maw', prop:'max-width', unit:'px', kind:'num' },
    { pre:'mah', prop:'max-height', unit:'px', kind:'num' },
    { pre:'miw', prop:'min-width', unit:'px', kind:'num' },
    { pre:'mih', prop:'min-height', unit:'px', kind:'num' },
    { pre:'bgc', prop:'background-color', unit:'', kind:'color' },
    { pre:'bgi', prop:'background-image', unit:'', kind:'raw' },
    { pre:'bgs', prop:'background-size', unit:'', kind:'keyword', allowed:['cover','contain','auto','c','ct'] },
    { pre:'bgp', prop:'background-position', unit:'', kind:'keyword', allowed:['center','left','right','top','bottom','c'] },
    { pre:'bgr', prop:'background-repeat', unit:'', kind:'keyword', allowed:['no-repeat','repeat','repeat-x','repeat-y','nr','r','rx','ry'] },
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
          const named = ['red','blue','green','black','white','transparent','yellow','orange','pink','purple','gray','grey','brown','cyan','magenta','lime','navy','teal','maroon','olive','aqua','silver'];
          if (named.includes(valuePart.toLowerCase())) return entry.prop + ': ' + valuePart.toLowerCase() + imp + ';';
          continue;
        }
        if (entry.kind === 'keyword') {
          const mapShort = { 'c':'center','ct':'contain','nr':'no-repeat','r':'repeat','rx':'repeat-x','ry':'repeat-y','i':'italic','n':'normal','p':'pointer','d':'default','a':'auto' };
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
    const m = lineBefore.match(/([A-Za-z][A-Za-z0-9\-:#.!]*)$/);
    if (!m) return '';
    let tok = m[1];
    tok = tok.replace(/\.+$/, '');
    return tok;
  }
  function isValidCssEmmetAbbr(abbr) {
    if (!abbr) return false;
    if (abbr === '!') return false;
    return expandCssEmmet(abbr) !== '';
  }
  function triggerCssEmmetExpansion(cm) {
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const lineBefore = line.substring(0, cursor.ch);
    const abbr = extractCssEmmetAbbr(lineBefore);
    if (!abbr) return false;
    if (!isValidCssEmmetAbbr(abbr)) return false;
    const beforeAbbr = line.substring(0, cursor.ch - abbr.length);
    let startCh, baseIndent;
    if (beforeAbbr.trim() === '') { startCh = 0; baseIndent = beforeAbbr; } else { startCh = cursor.ch - abbr.length; baseIndent = ''; }
    let expanded = expandCssEmmet(abbr);
    if (!expanded || expanded === abbr) return false;
    if (baseIndent && expanded.includes('\\n')) {
      expanded = expanded.split('\\n').map((l,idx)=> idx===0? l : baseIndent + l).join('\\n');
      expanded = baseIndent + expanded;
    } else if (baseIndent) {
      expanded = baseIndent + expanded;
    }
    cm.replaceRange(expanded, {line: cursor.line, ch: startCh}, cursor);
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
  let emmetPreviewTimer = null;
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
      st.textContent = ".emmet-live-preview{position:fixed;z-index:9999;background:rgba(42,42,58,0.98);color:#e8e8e8;border:1px solid #4a4a63;border-radius:6px;box-shadow:0 12px 28px rgba(0,0,0,.5);overflow:visible;font-family:ui-monospace,Menlo,Consolas,monospace;display:none;backdrop-filter:blur(2px)}.emmet-live-preview-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;background:#34344a;border-bottom:1px solid #4a4a63;border-radius:6px 6px 0 0}.emmet-live-preview-title{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9ad1ff;font-weight:700;white-space:nowrap}.emmet-live-preview-abbr{font-size:12px;color:#ffd479;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}.emmet-live-preview-close{background:transparent;border:0;color:#aaa;font-size:18px;line-height:1;cursor:pointer;padding:0 2px}.emmet-live-preview-close:hover{color:#fff}.emmet-live-preview-body{padding:8px 10px;max-height:200px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;pointer-events:auto;scrollbar-width:thin;scrollbar-color:#5a5a75 transparent}.emmet-live-preview-body::-webkit-scrollbar{width:6px}.emmet-live-preview-body::-webkit-scrollbar-thumb{background:#5a5a75;border-radius:3px}.emmet-live-preview-body::-webkit-scrollbar-track{background:transparent}.emmet-live-preview-body pre{margin:0;white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.55;color:#e8e8e8}.emmet-live-preview-body pre .tok-tag{color:#6fca8a}.emmet-live-preview-body pre .tok-attr{color:#ffffff}.emmet-live-preview-body pre .tok-str{color:#e06c75}.emmet-live-preview-body pre .tok-gray{color:#8a8a9a}.emmet-live-preview-body pre .tok-prop{color:#9ad1ff}.emmet-live-preview-body pre .tok-num{color:#e5a55a}.emmet-live-preview-body pre .tok-imp{color:#ff7edb}.emmet-live-preview-arrow{position:absolute;width:10px;height:10px;background:#34344a;border-left:1px solid #4a4a63;border-top:1px solid #4a4a63;transform:rotate(45deg);top:-6px;left:18px;z-index:1}.emmet-live-preview.arrow-below .emmet-live-preview-arrow{top:auto;bottom:-6px;transform:rotate(225deg);background:#2a2a3a;border-left:1px solid #4a4a63;border-top:1px solid #4a4a63}";
      document.head.appendChild(st);
    }
    const wrap = document.createElement("div");
    wrap.className = "emmet-live-preview";
    wrap.innerHTML = '<div class="emmet-live-preview-arrow"></div><div class="emmet-live-preview-head"><span class="emmet-live-preview-title">Emmet Preview</span><span class="emmet-live-preview-abbr"></span><button class="emmet-live-preview-close" type="button" title="Close (Esc)">×</button></div><div class="emmet-live-preview-body"><pre></pre></div>';
    document.body.appendChild(wrap);
    emmetPreviewEl = wrap;
    emmetPreviewAbbrEl = wrap.querySelector(".emmet-live-preview-abbr");
    emmetPreviewInner = wrap.querySelector(".emmet-live-preview-body pre");
    emmetPreviewArrowEl = wrap.querySelector(".emmet-live-preview-arrow");
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
      if (mode !== "htmlmixed" && mode !== "html" && mode !== "css") { hideEmmetPreview(); return; }
      const cursor = cm.getCursor();
      const line = cm.getLine(cursor.line) || "";
      const lineBefore = line.substring(0, cursor.ch);
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
      const popupH = el.offsetHeight || 220;
      let topBelow = cursorPage.bottom + gap;
      let topAbove = cursorPage.top - popupH - gap;
      let showBelow = true;
      // If no space below, show above without covering the active line.
      if (topBelow + popupH > window.innerHeight - 8) {
        if (topAbove >= 8) showBelow = false;
        else {
          el.style.maxHeight = "180px";
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
  function setupEmmetLivePreview(cm, mode) {
    if (!cm || !cm.on) return;
    // Show preview on typing only, not on tap. On tap/arrow move, hide it.
    let _lastEmmetChange = 0;
    cm.on("change", () => { _lastEmmetChange = Date.now(); scheduleEmmetPreview(cm, mode); });
    cm.on("cursorActivity", () => {
      // If typing just happened, the change timer will show the preview.
      if (Date.now() - _lastEmmetChange > 300) hideEmmetPreview();
    });
    cm.on("blur", () => hideEmmetPreview());
    try {
      const wrapper = cm.getWrapperElement && cm.getWrapperElement();
      if (wrapper) {
        wrapper.addEventListener("keydown", (e) => { if (e.key === "Escape" || e.key === "Tab") hideEmmetPreview(); }, true);
      }
    } catch (e) {}
  }


  function triggerSnippetExpansion(cm, mode) {
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const lineBefore = line.substring(0, cursor.ch);
    const words = lineBefore.trim().split(/\s+/);
    const lastWord = words[words.length - 1] || "";

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
      return true;
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
      if (/[A-Za-z0-9\-_.\#\>\+\^\*\:\$\@\!]/.test(ch)) { i--; continue; }
      break;
    }
    return lineBefore.slice(i + 1);
  }
  function isValidEmmetAbbr(abbr) {
    if (!abbr) return false;
    if (abbr === "!" || abbr === "html:5" || abbr === "html:5!") return true;
    if (!/[A-Za-z.!#(\[]/.test(abbr)) return false;
    if (/[>\+\^\*\.\#\[\{\(\)!]/.test(abbr)) return true;
    const low = abbr.toLowerCase();
    if (EMMET_KNOWN_TAGS.has(low)) return true;
    if (/^lorem\d*$/.test(low)) return true;
    if (/^[a-z][a-z0-9]*-[a-z0-9\-]+$/.test(low)) return true;
    return false;
  }
  function triggerEmmetExpansion(cm, mode) {
    if (mode === "css") return triggerCssEmmetExpansion(cm);
    if (mode !== "htmlmixed" && mode !== "html") return false;
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const lineBefore = line.substring(0, cursor.ch);
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
    setupEmmetLivePreview(cm, mode);
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
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          let parsed = JSON.parse(event.target.result);
          customSnippets = mergeSnippets(parsed);
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
    });
    if (window.htmlEditor) window.htmlEditor.refresh();
    if (window.cssEditor) window.cssEditor.refresh();
    if (window.jsEditor) window.jsEditor.refresh();
  }, 50);

  if (localStorage.getItem("sandbox_html")) window.htmlEditor.setValue(localStorage.getItem("sandbox_html"));
  if (localStorage.getItem("sandbox_css")) window.cssEditor.setValue(localStorage.getItem("sandbox_css"));
  if (localStorage.getItem("sandbox_js")) window.jsEditor.setValue(localStorage.getItem("sandbox_js"));

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
  }

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
          (charBefore === '[' && charAfter === ']') ||
          (charBefore === '`' && charAfter === '`')
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
        const pairs = { '{': '}', '(': ')', '[': ']', '"': '"', "'": "'", '`': '`' };
        if (pairs[typedChar]) {
          const _lineText = cm.getLine(change.from.line) || "";
          const _nextCh = _lineText.charAt(change.from.ch);
          const _charBefore = _lineText.charAt(change.from.ch - 1);
          const _hasSel = change.from.line !== change.to.line || change.from.ch !== change.to.ch;
          // Overtype: if the same closing char is ahead, move over it instead of adding another one.
          if (!_hasSel && (typedChar === ')' || typedChar === ']' || typedChar === '}' || typedChar === '"' || typedChar === "'" || typedChar === '`') && _nextCh === typedChar) {
            change.cancel();
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

  function parseColorString(str) {
    str = str.trim().toLowerCase();
    if (str.startsWith('#')) {
      let hex = str.substring(1);
      if (hex.length === 3 || hex.length === 4) {
        hex = hex.substring(0, 3).split('').map(c => c + c).join('');
      } else if (hex.length === 8) {
        hex = hex.substring(0, 6);
      }
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
  <style>${cssCode.replace(/<\/style>/gi, '<\\/style>')}</style>
</head>
<body>
  ${htmlCode}
  <script>${jsCode.replace(/<\/script>/gi, '<\\/script>')}</script>
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
    isEditorZen = !isEditorZen;
    isPreviewZen = false;
    if (editorSection && previewSection) {
      if (isEditorZen) {
        editorSection.style.height = "100%";
        editorSection.style.display = "flex";
        previewSection.classList.add("d-none");
        if (splitter) splitter.style.display = "none";
      } else {
        editorSection.style.height = "48%";
        previewSection.style.height = "48%";
        editorSection.style.display = "flex";
        previewSection.classList.remove("d-none");
        if (splitter) splitter.style.display = "";
      }
      refreshEditors();
    }
  }

  function togglePreviewZen() {
    isPreviewZen = !isPreviewZen;
    isEditorZen = false;
    if (editorSection && previewSection) {
      if (isPreviewZen) {
        previewSection.style.height = "100%";
        previewSection.style.display = "flex";
        editorSection.classList.add("d-none");
        if (splitter) splitter.style.display = "none";
      } else {
        previewSection.style.height = "48%";
        editorSection.style.height = "48%";
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
      });
      localStorage.setItem("sandbox_ligatures", useLigatures);
      setTimeout(() => {
        if (window.htmlEditor) window.htmlEditor.refresh();
        if (window.cssEditor) window.cssEditor.refresh();
        if (window.jsEditor) window.jsEditor.refresh();
      }, 30);
    });
  }

  const currentVersion = "1.6.1";
  const menuJsonExportBtn = document.getElementById("menu-json-export-btn");
  if (menuJsonExportBtn) {
    menuJsonExportBtn.addEventListener("click", () => {
      const backupData = {
        version: currentVersion,
        timestamp: new Date().toISOString(),
        html: window.htmlEditor.getValue(),
        css: window.cssEditor.getValue(),
        js: window.jsEditor.getValue(),
        snippets: customSnippets,
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
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (typeof data.html === "string") window.htmlEditor.setValue(data.html);
          if (typeof data.css === "string") window.cssEditor.setValue(data.css);
          if (typeof data.js === "string") window.jsEditor.setValue(data.js);
          if (data.snippets !== undefined) {
            customSnippets = {
              js: { ...defaultSnippets.js, ...(data.snippets.js || {}) },
              html: { ...defaultSnippets.html, ...(data.snippets.html || {}) },
              css: { ...defaultSnippets.css, ...(data.snippets.css || {}) }
            };
            localStorage.setItem("sandbox_custom_snippets", JSON.stringify(customSnippets, null, 2));
          }
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
  <style>${cssCode.replace(/<\/style>/gi, '<\\/style>')}</style>
</head>
<body>
  ${htmlCode}
  <script>${jsCode.replace(/<\/script>/gi, '<\\/script>')}</script>
</body>
</html>`;
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
        localStorage.clear();
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
        showEditorTab("js-tab", "js-pane");

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

  // Accept logs only from the preview iframe.
  window.addEventListener("message", (event) => {
    const iframe = document.getElementById("output");
    if (!iframe || event.source !== iframe.contentWindow) return;
    if (event.data && event.data.type === "CONSOLE_LOG") {
      window.appendLog(event.data.level, event.data.message);
    }
    // Preview storage sync: save in parent storage, persists across rebuilds.
    if (event.data && event.data.type === "SANDBOX_STORAGE_SYNC") {
      try {
        var key = "sandbox_preview_" + event.data.store + "Storage";
        var val = JSON.stringify(event.data.data || {});
        if (event.data.store === "local") localStorage.setItem(key, val);
        else sessionStorage.setItem(key, val);
      } catch (e) {}
    }
    // Preview cookie sync: save in parent storage, persists across rebuilds.
    if (event.data && event.data.type === "SANDBOX_COOKIE_SYNC") {
      try {
        localStorage.setItem("sandbox_preview_cookies", JSON.stringify(event.data.data || {}));
      } catch (e) {}
    }
  });

  let updateTimer = null;
  function updatePreview() {
    const htmlCode = window.htmlEditor.getValue();
    const cssCode = window.cssEditor.getValue();
    const jsCode = window.jsEditor.getValue();
    
    // Quota error must not kill the preview.
    try {
      localStorage.setItem("sandbox_html", htmlCode);
      localStorage.setItem("sandbox_css", cssCode);
      localStorage.setItem("sandbox_js", jsCode);
    } catch (e) {}

    const iframe = document.getElementById("output");
    if (!iframe) return;

    window.clearConsole();
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
    const savedCookiesData = (() => { try { var raw = JSON.parse(localStorage.getItem("sandbox_preview_cookies") || "{}") || {}; var now = Date.now(); var out = {}; Object.keys(raw).forEach(function(k){ if(!raw[k] || !raw[k].expires || raw[k].expires > now) out[k] = raw[k]; }); return out; } catch (e) { return {}; } })();
    const savedCookiesJSON = JSON.stringify(savedCookiesData).replace(/<\/script>/gi, "<\\/script>");
    const storageShimTag = '<script>(function(){function s(init,store){var d={};var o={};function sync(){try{window.parent.postMessage({type:\"SANDBOX_STORAGE_SYNC\",store:store,data:d},\"*\");}catch(e){}}function isMethod(k){return k===\"getItem\"||k===\"setItem\"||k===\"removeItem\"||k===\"clear\"||k===\"key\"||k===\"length\";}function setOwn(k,v){if(isMethod(k))return;try{Object.defineProperty(o,k,{value:v,configurable:true,enumerable:true,writable:true});}catch(e){}}function delOwn(k){if(isMethod(k))return;try{delete o[k];}catch(e){}}function get(k){try{k=String(k);return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null;}catch(e){return null;}}function set(k,v){try{k=String(k);v=String(v);d[k]=v;setOwn(k,v);sync();}catch(e){}}function rem(k){try{k=String(k);if(Object.prototype.hasOwnProperty.call(d,k)){delete d[k];delOwn(k);sync();}}catch(e){}}function clr(){try{var ks=Object.keys(d);for(var i=0;i<ks.length;i++){delete d[ks[i]];delOwn(ks[i]);}sync();}catch(e){}}function keyFn(i){try{return Object.keys(d)[i]||null;}catch(e){return null;}}Object.defineProperty(o,\"getItem\",{value:get,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"setItem\",{value:set,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"removeItem\",{value:rem,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"clear\",{value:clr,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"key\",{value:keyFn,configurable:true,enumerable:false,writable:true});Object.defineProperty(o,\"length\",{get:function(){return Object.keys(d).length;},configurable:true,enumerable:false});try{var initObj=init||{};Object.keys(initObj).forEach(function(k){d[k]=String(initObj[k]);setOwn(k,d[k]);});}catch(e){}return o;}var __savedLocal=' + savedLocalJSON + ';var __savedSession=' + savedSessionJSON + ';function install(n,shim){try{Object.defineProperty(window,n,{value:shim,configurable:true,writable:true});return;}catch(e){}try{window[n]=shim;if(window[n]===shim)return;}catch(e){}try{Object.defineProperty(Window.prototype,n,{get:function(){return shim;},configurable:true});}catch(e){}}install(\"localStorage\",s(__savedLocal,\"local\"));install(\"sessionStorage\",s(__savedSession,\"session\"));})();(function(){try{var d=Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype,\"cssRules\");if(d&&d.get){Object.defineProperty(CSSStyleSheet.prototype,\"cssRules\",{get:function(){try{return d.get.call(this);}catch(e){return [];}},configurable:true});}}catch(e){}try{var d2=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,\"contentDocument\");if(d2&&d2.get){Object.defineProperty(HTMLIFrameElement.prototype,\"contentDocument\",{get:function(){try{return d2.get.call(this);}catch(e){return null;}},configurable:true});}}catch(e){}})();(function(){var __savedCookies=' + savedCookiesJSON + ';var __store=__savedCookies||{};function isExp(c){return c&&c.expires&&Date.now()>c.expires;}function clean(){Object.keys(__store).forEach(function(k){if(isExp(__store[k]))delete __store[k];});}function sync(){try{window.parent.postMessage({type:\"SANDBOX_COOKIE_SYNC\",data:__store},\"*\");}catch(e){}}function getC(){clean();var p=[];Object.keys(__store).forEach(function(k){p.push(k+\"=\"+__store[k].value);});return p.join(\"; \");}function setC(str){try{str=String(str);var parts=str.split(\";\");var first=parts[0].split(\"=\");var name=(first[0]||\"\").trim();if(!name)return;var value=first.slice(1).join(\"=\").trim();var attrs={};for(var i=1;i<parts.length;i++){var pp=parts[i].split(\"=\");var ak=(pp[0]||\"\").trim().toLowerCase();var av=pp.slice(1).join(\"=\").trim();if(ak)attrs[ak]=av;}var expires=null;if(attrs[\"max-age\"]!==undefined){var ma=parseInt(attrs[\"max-age\"],10);if(!isNaN(ma)){if(ma<=0){delete __store[name];sync();return;}expires=Date.now()+ma*1000;}}else if(attrs[\"expires\"]){var ed=Date.parse(attrs[\"expires\"]);if(!isNaN(ed))expires=ed;}if(expires&&Date.now()>expires){delete __store[name];sync();return;}__store[name]={value:value,expires:expires};sync();}catch(e){}}function install(obj){try{Object.defineProperty(obj,\"cookie\",{get:getC,set:setC,configurable:true,enumerable:true});}catch(e){}}install(Document.prototype);install(document);})();<\/script>';
    // Eruda (local, offline): Eruda/eruda/eruda.js, no CDN.
    // No sources, no settings: Eruda adds settings itself; sources not needed.
    // Safe-access patch: cssRules / contentDocument must not throw, else Resources render stops.
    // Cookie: full store (sandboxed doc throws on real cookie). Persists via parent.
    // Local file = same-origin, real errors show without crossorigin.
    // Resources refresh: Eruda sometimes skips refresh, force it twice (logs real error).
    const erudaEnabled = localStorage.getItem("sandbox_eruda") === "true";
    const erudaScriptTag = erudaEnabled ? '<script src="Eruda/eruda/eruda.js"><\/script>' : "";
    const erudaInitTag = erudaEnabled ? '<script>function __initEruda(){var t=0;function tryInit(){if(window.eruda){try{if(!window.__erudaInited){window.__erudaInited=true;eruda.init({tool:[\"console\",\"elements\",\"network\",\"resources\",\"info\"]});function __erudaResRefresh(){try{var r=eruda.get(\"resources\");if(r&&typeof r.refresh===\"function\"){r.refresh();}}catch(e){window.parent.postMessage({type:\"CONSOLE_LOG\",level:\"error\",message:\"Resources refresh failed: \"+(e&&e.message||e)},\"*\");}}setTimeout(__erudaResRefresh,1200);setTimeout(__erudaResRefresh,3500);}}catch(e){window.parent.postMessage({type:"CONSOLE_LOG",level:"error",message:"Eruda init failed: "+(e&&e.message||e)},"*");}}else if(t++<50){setTimeout(tryInit,100);}else{window.parent.postMessage({type:"CONSOLE_LOG",level:"error",message:"Eruda failed to load. Check network / ad-blocker."},"*");}}tryInit();}if(document.readyState==="loading"){window.addEventListener("DOMContentLoaded",__initEruda);}else{__initEruda();}<\/script>' : "";

    const safeJsCode = String(jsCode || "").replace(/<\/script>/gi, "<\\/script>");
    const combinedContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${frameworkCDNTag}
        ${storageShimTag}
        ${erudaScriptTag}
        ${erudaInitTag}
        <style>${cssCode.replace(/<\/style>/gi, '<\\/style>')}</style>
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
          var __jsLineOffset = __SANDBOX_JS_LINE_OFFSET_9f3__;
          window.onerror = function(msg, url, line) {
            sendLog('error', [msg + ' (Line: ' + Math.max(1, (line || 1) - __jsLineOffset + 1) + ')']);
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
          window.addEventListener('DOMContentLoaded', function(){
            try {
              ${safeJsCode}
            } catch (err) {
              console.error(err.message);
            }
          });
        </script>
      </head>
      <body>
        ${htmlCode}
      </body>
      </html>
    `;
    // Map preview error lines back to user JS lines.
    let fixedContent = combinedContent;
    if (jsCode) {
      const idx = combinedContent.indexOf(safeJsCode);
      if (idx > 0) fixedContent = combinedContent.replace("__SANDBOX_JS_LINE_OFFSET_9f3__", String(combinedContent.slice(0, idx).split("\n").length));
    }
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
