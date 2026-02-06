"""Adobe Spectrum report template for HTML generation."""

import re

REPORT_HEAD = '''<!DOCTYPE html>
<html lang="en" class="spectrum spectrum--medium spectrum--light" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>%%TITLE%%</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spectrum-css/tokens@16/dist/css/index.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spectrum-css/page@9/dist/index.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,500;8..60,600&display=swap" rel="stylesheet">
  <style>
    :root {
      --r-sans: "Source Sans 3", "Adobe Clean", ui-sans-serif, system-ui, sans-serif;
      --r-serif: "Source Serif 4", "Adobe Clean Serif", Georgia, serif;
      --r-bg: var(--spectrum-gray-50, #FAFAFA);
      --r-surface: #FFFFFF;
      --r-surface-dim: var(--spectrum-gray-75, #F5F5F5);
      --r-border: var(--spectrum-gray-200, #E1E1E1);
      --r-border-light: var(--spectrum-gray-100, #ECECEC);
      --r-text: var(--spectrum-gray-900, #1B1B1B);
      --r-text-2: var(--spectrum-gray-700, #464646);
      --r-text-3: var(--spectrum-gray-500, #747474);
      --r-accent: #0265DC;
      --c1: #0265DC; --c2: #D83B01; --c3: #D97B00; --c4: #107C10; --c5: #5C2D91;
      --c1-bg: #E8F0FE; --c2-bg: #FDECEF; --c3-bg: #FFF3E0; --c4-bg: #E6F4EE; --c5-bg: #F3E8FF;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--r-sans);
      background: var(--r-bg);
      color: var(--r-text);
      font-size: 15px;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { max-width: 880px; margin: 0 auto; padding: 0 clamp(1.25rem, 4vw, 2.5rem); }

    /* Hero */
    .hero { padding: clamp(3rem, 8vw, 7rem) 0 clamp(2.5rem, 5vw, 4rem); }
    .hero-eyebrow {
      font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--r-accent); margin-bottom: 1.25rem;
    }
    .hero h1 {
      font-family: var(--r-serif); font-size: clamp(2.2rem, 5vw, 3.4rem);
      font-weight: 400; line-height: 1.12; letter-spacing: -0.02em; margin-bottom: 1.25rem;
    }
    .hero-desc { font-size: 1.05rem; color: var(--r-text-2); max-width: 560px; line-height: 1.7; }
    .hero-rule { width: 48px; height: 2px; background: var(--r-text); border: none; margin-top: 2.5rem; }

    /* Stat row */
    .stats {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      border-top: 2px solid var(--r-text); border-bottom: 1px solid var(--r-border);
      margin-bottom: clamp(3rem, 6vw, 5rem);
    }
    .stat { padding: 1.75rem 1.25rem 1.75rem 0; position: relative; }
    .stat:not(:last-child)::after {
      content: ''; position: absolute; right: 0; top: 1.25rem; bottom: 1.25rem;
      width: 1px; background: var(--r-border);
    }
    .stat:not(:first-child) { padding-left: 1.25rem; }
    .stat-label {
      font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--r-text-3); margin-bottom: 0.5rem;
    }
    .stat-val { font-family: var(--r-serif); font-size: 1.5rem; line-height: 1.2; letter-spacing: -0.02em; }
    .stat-note { font-size: 0.78rem; color: var(--r-text-3); margin-top: 0.3rem; }

    /* Sections */
    .section { margin-bottom: clamp(3rem, 5vw, 4.5rem); }
    .section-num { font-family: var(--r-serif); font-size: 0.85rem; color: var(--r-text-3); margin-bottom: 0.35rem; }
    .section h2 {
      font-size: clamp(1.35rem, 2.5vw, 1.75rem); font-weight: 600;
      line-height: 1.25; margin-bottom: 0.3rem; letter-spacing: -0.01em;
    }
    .section-sub { color: var(--r-text-2); font-size: 0.92rem; margin-bottom: 2rem; max-width: 600px; }
    .section h3 { font-size: 0.95rem; font-weight: 600; margin: 2.25rem 0 0.75rem; }
    .section-div {
      width: 100%; height: 1px; background: var(--r-border); border: none;
      margin-bottom: clamp(3rem, 5vw, 4.5rem);
    }

    /* Brand label */
    .brand-label { display: inline-flex; align-items: center; gap: 0.5rem; }
    .brand-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.88rem; }
    thead th {
      text-align: left; padding: 0 0 0.5rem; font-weight: 600; font-size: 0.7rem;
      text-transform: uppercase; letter-spacing: 0.08em; color: var(--r-text-3);
      border-bottom: 2px solid var(--r-text);
    }
    thead th:not(:first-child) { text-align: right; }
    td { padding: 0.6rem 0; border-bottom: 1px solid var(--r-border-light); color: var(--r-text-2); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; color: var(--r-text); }
    tr:last-child td { border-bottom: none; }
    tr.total td {
      border-top: 2px solid var(--r-text); border-bottom: none;
      font-weight: 600; color: var(--r-text); padding-top: 0.7rem;
    }
    td code { font-family: var(--r-sans); font-weight: 500; color: var(--r-text); font-size: 0.86rem; }

    /* Bar chart */
    .bars { margin: 1.75rem 0; }
    .bar-row {
      display: grid; grid-template-columns: 80px 1fr 64px;
      align-items: center; gap: 0.75rem; margin-bottom: 0.6rem;
    }
    .bar-label { font-size: 0.82rem; font-weight: 500; text-align: right; color: var(--r-text-2); }
    .bar-track { height: 28px; background: var(--r-surface-dim); border-radius: 4px; overflow: hidden; }
    .bar-fill {
      height: 100%; border-radius: 4px; width: 0;
      transition: width 0.9s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .bar-val { font-family: var(--r-serif); font-size: 0.9rem; }

    /* Badges */
    .badge {
      display: inline-block; padding: 0.15rem 0.55rem; border-radius: 4px;
      font-size: 0.68rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    }
    .badge-positive { background: var(--c4-bg); color: var(--c4); }
    .badge-notice { background: var(--c3-bg); color: var(--c3); }
    .badge-negative { background: var(--c2-bg); color: var(--c2); }

    /* Callout */
    .callout {
      background: var(--r-surface-dim); padding: 1.15rem 1.35rem; border-radius: 6px;
      font-size: 0.88rem; color: var(--r-text-2); line-height: 1.7; margin: 1.5rem 0;
    }
    .callout strong { color: var(--r-text); font-weight: 600; }

    /* Domain grid */
    .domain-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 0.3rem 1.25rem; font-size: 0.85rem; color: var(--r-text-2); margin-bottom: 1.5rem;
    }
    .domain-grid div { padding: 0.25rem 0; border-bottom: 1px solid var(--r-border-light); }
    .domain-grid code { font-family: var(--r-sans); font-weight: 500; color: var(--r-text); font-size: 0.83rem; }

    /* Takeaways */
    .takeaways-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; }
    .tk-item { padding: 1.35rem; background: var(--r-surface); border: 1px solid var(--r-border); border-radius: 8px; }
    .tk-item:first-child { grid-column: 1 / -1; background: var(--r-text); border-color: var(--r-text); }
    .tk-item:first-child .tk-label { color: rgba(255,255,255,0.45); }
    .tk-item:first-child .tk-text { color: rgba(255,255,255,0.88); }
    .tk-item:first-child .tk-text strong { color: #fff; }
    .tk-label {
      font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--r-text-3); margin-bottom: 0.4rem;
    }
    .tk-text { font-size: 0.9rem; line-height: 1.6; color: var(--r-text-2); }
    .tk-text strong { color: var(--r-text); font-weight: 600; }

    /* Footer */
    footer {
      padding: 2.5rem 0; font-size: 0.78rem; color: var(--r-text-3);
      border-top: 1px solid var(--r-border); margin-top: 1rem;
    }

    /* Animations */
    .reveal {
      opacity: 0; transform: translateY(16px);
      transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reveal.visible { opacity: 1; transform: none; }
    .hero .reveal:nth-child(1) { transition-delay: 0s; }
    .hero .reveal:nth-child(2) { transition-delay: 0.07s; }
    .hero .reveal:nth-child(3) { transition-delay: 0.14s; }
    .hero .reveal:nth-child(4) { transition-delay: 0.21s; }
    .stat {
      opacity: 0; transform: translateY(12px);
      transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .stats.visible .stat:nth-child(1) { opacity:1; transform:none; transition-delay:0s; }
    .stats.visible .stat:nth-child(2) { opacity:1; transform:none; transition-delay:0.05s; }
    .stats.visible .stat:nth-child(3) { opacity:1; transform:none; transition-delay:0.1s; }
    .stats.visible .stat:nth-child(4) { opacity:1; transform:none; transition-delay:0.15s; }
    .stats.visible .stat:nth-child(5) { opacity:1; transform:none; transition-delay:0.2s; }
    .stats.visible .stat:nth-child(6) { opacity:1; transform:none; transition-delay:0.25s; }

    /* Responsive */
    @media (max-width: 720px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .stat:nth-child(odd):not(:last-child)::after { content: ''; }
      .stat:nth-child(even)::after { display: none; }
      .stat:last-child { grid-column: 1 / -1; }
      .bar-row { grid-template-columns: 64px 1fr 56px; }
      .takeaways-grid { grid-template-columns: 1fr; }
      table { font-size: 0.82rem; }
    }
    @media (max-width: 480px) {
      .stats { grid-template-columns: 1fr; }
      .stat::after { display: none !important; }
      .stat { padding: 1rem 0; border-bottom: 1px solid var(--r-border-light); }
      .stat:last-child { border-bottom: none; }
      .stat:not(:first-child) { padding-left: 0; }
      .bar-row { grid-template-columns: 1fr; gap: 0.2rem; margin-bottom: 1rem; }
      .bar-label { text-align: left; }
      .bar-val { display: none; }
      .domain-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="wrap">
'''

REPORT_TAIL = '''
</div>
<script>
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .stats').forEach(el => io.observe(el));
  requestAnimationFrame(() => { document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('visible')); });
  const barObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.bar-fill').forEach((b, i) => {
          setTimeout(() => { b.style.width = b.dataset.width; }, i * 100);
        });
        barObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.bars').forEach(el => barObs.observe(el));
</script>
</body>
</html>
'''

HTML_SYSTEM_PROMPT = """You generate body content for a professional HTML report using the Adobe Spectrum design system.

RULES:
- Output ONLY the body content — no <!DOCTYPE>, <html>, <head>, <body>, or <script> tags
- You MAY start with a <style> block to override data color variables (--c1 through --c5 and --c1-bg through --c5-bg)
- Use the CSS classes documented below EXACTLY as shown
- Add class="reveal" to sections for entrance animations
- Use numbered sections (01, 02, 03...) for logical flow
- Include 3-6 key metrics in the stat row
- End with a takeaways section and a <footer>

AVAILABLE CSS CLASSES:

Hero:
  <div class="hero">
    <div class="reveal"><div class="hero-eyebrow">CATEGORY LABEL</div></div>
    <div class="reveal"><h1>Report Title</h1></div>
    <div class="reveal"><p class="hero-desc">Brief description of the report.</p></div>
    <div class="reveal"><hr class="hero-rule"></div>
  </div>

Stat Row (3-6 items):
  <div class="stats">
    <div class="stat">
      <div class="stat-label">LABEL</div>
      <div class="stat-val" style="color:var(--c1)">Value</div>
      <div class="stat-note">Supporting detail</div>
    </div>
  </div>

Numbered Section:
  <div class="section reveal">
    <div class="section-num">01</div>
    <h2>Section Title</h2>
    <p class="section-sub">Subtitle or context.</p>
    <!-- content: tables, bar charts, callouts -->
  </div>
  <hr class="section-div">

Section with brand dot:
  <div class="section reveal">
    <div class="section-num">03</div>
    <div class="brand-label">
      <div class="brand-dot" style="background:var(--c1)"></div>
      <h2>Brand Name</h2>
    </div>
    <p class="section-sub">Description</p>
  </div>

Table:
  <table>
    <thead><tr><th>Label Col</th><th>Numeric Col</th></tr></thead>
    <tbody>
      <tr><td>Row label</td><td class="num">1,234</td></tr>
      <tr class="total"><td><strong>Total</strong></td><td class="num">5,678</td></tr>
    </tbody>
  </table>

Bar Chart:
  <div class="bars">
    <div class="bar-row">
      <div class="bar-label">Label</div>
      <div class="bar-track"><div class="bar-fill" style="background:var(--c1)" data-width="75%"></div></div>
      <div class="bar-val">~34,000</div>
    </div>
  </div>

Badges (inside table cells):
  <span class="badge badge-positive">Low</span>
  <span class="badge badge-notice">Medium</span>
  <span class="badge badge-negative">High</span>

Callout:
  <div class="callout">Important note with <strong>emphasis</strong>.</div>

Domain/Item Grid:
  <div class="domain-grid">
    <div><code>item.com</code> Description</div>
  </div>

Takeaways (last section):
  <div class="section reveal">
    <div class="section-num">07</div>
    <h2>Key Takeaways</h2>
    <p class="section-sub">Strategic observations</p>
    <div class="takeaways-grid">
      <div class="tk-item">
        <div class="tk-label">PRIMARY INSIGHT</div>
        <div class="tk-text"><strong>Key point</strong> with supporting details.</div>
      </div>
      <!-- first tk-item gets dark background automatically; add 3-5 more -->
    </div>
  </div>

Footer:
  <footer>Generated Month Year — Methodology note.</footer>

IMPORTANT: Use <h3> for sub-headings within sections. Use class="num" on <td> for right-aligned numeric data. Use data-width="XX%" on .bar-fill (width is animated by JS). Output clean, semantic HTML."""


def build_report(content: str, title: str) -> str:
    """Wrap LLM-generated body content in the Spectrum report template."""
    head = REPORT_HEAD.replace('%%TITLE%%', _escape(title))
    return head + content + REPORT_TAIL


def extract_title(content: str, fallback: str) -> str:
    """Extract title from the h1 tag in the LLM content."""
    m = re.search(r'<h1>(.*?)</h1>', content, re.DOTALL)
    if m:
        return re.sub(r'<[^>]+>', ' ', m.group(1)).strip()
    return fallback[:80]


def clean_llm_content(raw: str) -> str:
    """Strip any accidental full-page HTML wrapping from LLM output."""
    text = raw.strip()
    # Remove markdown fences
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    # Remove full-page tags the LLM shouldn't have generated
    text = re.sub(r'<!DOCTYPE[^>]*>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'</?html[^>]*>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<head>.*?</head>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'</?body[^>]*>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<script>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    return text.strip()


def _escape(s: str) -> str:
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
