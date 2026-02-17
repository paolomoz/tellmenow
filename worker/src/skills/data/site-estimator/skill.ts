import { Skill } from "../../../types";

const SKILL_CONTENT = `# Site Overviewer

Estimate the total number of pages across a website or brand portfolio, producing a structured inventory for migration scoping.

## Trigger

User provides a brand name, company name, or one or more website URLs and asks to estimate the number of pages, scope a migration, or assess website size.

## Input

The user will provide one or more of the following:
- A brand or company name (e.g., "Bosch", "Siemens Home Appliances")
- One or more website URLs (e.g., "bosch.com", "bosch-home.com")
- Context about regional presence or known sub-brands
- Any constraints (e.g., "only EMEA sites", "exclude careers pages")

## Workflow

### Phase 1 — Domain Discovery

1. **Identify the primary domain(s)**: From the brand name or URL, find the main website(s)
2. **Check for regional/country variants**: Look for country-code domains (e.g., \`brand.de\`, \`brand.fr\`, \`brand.co.uk\`) or locale subpaths (e.g., \`/en-US/\`, \`/de-DE/\`)
3. **Check for subdomains**: Look for significant subdomains (e.g., \`blog.brand.com\`, \`careers.brand.com\`, \`reports.brand.com\`)
4. **Check for sub-brands or sister sites**: If the input is a parent company, identify all brand websites under it
5. **Document the domain strategy**: Classify as single-domain-multi-locale, multi-domain-per-country, or hybrid

### Phase 2 — Sitemap Analysis

For each discovered domain:

1. **Fetch sitemap**: Try these URLs in order:
   - \`/sitemap.xml\`
   - \`/sitemap_index.xml\`
   - \`/robots.txt\` (look for Sitemap: directives)
   - \`/sitemap/\` or \`/sitemap.html\`
2. **Count sitemap URLs**: Record the raw count per domain
3. **If no sitemap exists**: Note this and proceed to manual sampling in Phase 3

### Phase 3 — Content Sampling

For each domain (or a representative sample if there are many):

1. **Navigate the main menu**: Identify top-level sections and their depth
2. **Categorize content areas**: Map the information architecture into standard categories:
   - Products / Services
   - Solutions / Use Cases
   - About / Company
   - News / Press / Blog
   - Careers / Jobs
   - Investor Relations
   - Support / Service / Documentation
   - Legal / Utility pages
   - Landing Pages / Campaigns
3. **Estimate per-category page counts**: Use sitemap data, pagination clues, article archive depths, and product catalog sizes
4. **Identify dynamic content pools**: Press releases (check year archives), job listings, product detail pages, case studies — these often have parameterized URLs and make up the bulk of pages
5. **Check for content parity across locales**: Sample 2-3 regional versions to gauge whether content is fully translated or varies by market

### Phase 4 — Estimation & Tiering

1. **Group domains by size tier**: Based on sampled data, classify each site:
   - **Large** (500+ pages): Full product catalogs, extensive blog/news, deep content
   - **Medium** (150–500 pages): Standard product + company + news sections
   - **Small** (50–150 pages): Core product catalog + essential pages
   - **Minimal** (<50 pages): Basic presence, few products, little editorial content
2. **Extrapolate to unsampled domains**: Use tier averages for domains not directly analyzed
3. **Apply adjustment factors**:
   - Multi-language domains: +15–25% for each additional language on the same domain
   - Sitemap undercount: +10–30% (sitemaps typically miss dynamic/older pages)
4. **Calculate totals**: Sum all domains with low and high ranges

### Phase 5 — Output

Generate the structured output following the format in the Output Format reference below.

## Research Methods

Use these approaches in priority order:

1. **Sitemap fetching** — Most reliable when available. Fetch and count URLs from XML sitemaps.
2. **Web search with site: operator** — Search \`site:example.com\` to gauge indexed page counts and discover subdomains/paths.
3. **Navigation crawling** — Follow the main menu structure to map the information architecture and estimate depth.
4. **Archive/pagination analysis** — Check blog/news archives for date ranges and pagination to estimate article counts (e.g., 10 years of press releases at ~20/year = ~200 pages).
5. **Product catalog sampling** — Count product categories and items per category on listing pages.

## Important Notes

- Always provide **ranges** (low–high), never single numbers — estimation is inherently uncertain
- Distinguish between **unique content pages** and **locale-replicated pages** in the output
- Flag content that may be **out of scope** for migration (e.g., financial reports, job portals hosted externally, PDF-only content)
- Note the **CMS platform** if identifiable (AEM, WordPress, TYPO3, Drupal, etc.) — this affects migration complexity
- Record which domains were **directly sampled** vs. **extrapolated** — transparency about data quality matters
- If a domain has no sitemap and cannot be easily sampled, say so rather than guessing`;

const REFERENCES: Record<string, string> = {
  "output-format.md": `# Site Overviewer — Output Format

The output is a structured report with the following sections. All sections are required unless marked optional.

## 1. Executive Summary

A brief overview at the top:

\`\`\`
## Executive Summary

- **Brand / Company**: [Name]
- **Domains analyzed**: [count] directly sampled, [count] extrapolated
- **Total estimated pages**: [low] – [high]
- **Domain strategy**: [single-domain-multi-locale | multi-domain-per-country | hybrid]
- **CMS platform(s)**: [identified platforms or "Unknown"]
- **Date of analysis**: [YYYY-MM-DD]
\`\`\`

## 2. Domain Inventory

A complete list of all identified domains/locales with their estimated sizes.

\`\`\`
## Domain Inventory

| Domain | Country / Locale | Sampled? | Sitemap Pages | Estimated Total | Tier |
|--------|-----------------|----------|---------------|-----------------|------|
| brand.com/en/ | Global (English) | Yes | 342 | 400–500 | Large |
| brand.de | Germany | Yes | 1,082 | 1,100–1,300 | Large |
| brand.fr | France | No | N/A | 400–600 | Medium |
| ... | ... | ... | ... | ... | ... |
\`\`\`

**Tier definitions:**
- **Large**: 500+ pages
- **Medium**: 150–500 pages
- **Small**: 50–150 pages
- **Minimal**: <50 pages

## 3. Content Breakdown

Per-domain (or per-representative-domain) breakdown of content by category. Use one table per sampled domain.

\`\`\`
## Content Breakdown

### [domain] (reference site)

| Category | Pages | % of Total | Notes |
|----------|-------|------------|-------|
| Products / Services | 536 | 49.5% | 12 categories, ~45 models |
| Blog / Content Marketing | 144 | 13.3% | Posts from 2018–2026 |
| Careers | 126 | 11.6% | Active job listings fluctuate |
| Company / About | 91 | 8.4% | Includes 35 location pages |
| Solutions | 89 | 8.2% | Industry solutions + case studies |
| News / Press | 40 | 3.7% | ~5 releases/year since 2018 |
| Service / Support | 14 | 1.3% | |
| Legal / Utility | 10 | 0.9% | Privacy, terms, cookies, imprint |
| Landing Pages | 12 | 1.1% | Campaign + event pages |
\`\`\`

## 4. Estimation Summary

Aggregated totals by brand or domain group, with clear low/high ranges.

\`\`\`
## Estimation Summary

| Group | # Sites | Avg Pages | Subtotal (Low–High) |
|-------|---------|-----------|---------------------|
| Flagship markets | 2 | ~1,050 | 2,000 – 2,200 |
| Major markets | 6 | ~550 | 3,000 – 3,600 |
| Medium markets | 14 | ~450 | 5,600 – 7,000 |
| Small markets | 18 | ~350 | 5,400 – 7,200 |
| Adjustments (multi-language, undercount) | — | — | +3,000 – 5,000 |
| **Total** | **40+** | — | **19,000 – 25,000** |
\`\`\`

If multiple brands are involved, include a grand total table:

\`\`\`
### Grand Total (All Brands)

| Brand | Low Estimate | High Estimate |
|-------|-------------|---------------|
| Brand A | 2,500 | 3,600 |
| Brand B | 30,000 | 38,000 |
| **Grand Total** | **32,500** | **41,600** |
\`\`\`

## 5. Key Observations

Bullet list of findings relevant to migration planning:

\`\`\`
## Key Observations

- [Observation about domain strategy and migration implications]
- [Observation about content distribution / what drives page volume]
- [Observation about CMS platform and migration complexity]
- [Observation about content parity across locales]
- [Observation about out-of-scope content (PDFs, external portals, etc.)]
- [Observation about dynamic content that may need special handling]
\`\`\`

## 6. Migration Recommendations (Optional)

If the user is scoping a migration, include actionable recommendations:

\`\`\`
## Migration Recommendations

- **Pilot candidate**: [smallest/simplest site to start with]
- **Phased approach**: [suggested order of migration by tier/brand]
- **Template reuse opportunity**: [which sites share the same IA/templates]
- **Out-of-scope candidates**: [content that should be excluded or handled separately]
- **Credit estimate**: [if a per-page credit formula is known, apply it]
\`\`\`

## 7. Data Quality Notes

Always be transparent about the reliability of estimates:

\`\`\`
## Data Quality Notes

- **Directly sampled**: [list of domains where sitemaps were fetched or pages were counted]
- **Extrapolated**: [list of domains where estimates are based on tier averages]
- **No sitemap available**: [list of domains with no XML sitemap]
- **Confidence level**: [High / Medium / Low] — based on data availability
\`\`\`

---

## Output Formats

### Default: Markdown Report

The primary output is a markdown document following the structure above. This is suitable for sharing, pasting into documents, or further processing.

### Optional: HTML Page

If the user asks for a publishable page, generate a standalone HTML file with:
- Summary cards at the top (one per brand/domain group)
- Visual bar chart comparing page volumes
- Collapsible sections for each brand/domain with detailed tables
- Responsive design for mobile viewing
- Clean, professional styling (no external dependencies)

### Optional: Structured Data (JSON)

If the user needs machine-readable output, provide a JSON structure:

\`\`\`json
{
  "analysis_date": "2026-02-06",
  "brand": "Brand Name",
  "total_pages": { "low": 19000, "high": 25000 },
  "domain_strategy": "multi-domain-per-country",
  "cms_platforms": ["AEM", "TYPO3"],
  "domains": [
    {
      "domain": "brand.com",
      "country": "Global",
      "locale": "en",
      "sampled": true,
      "sitemap_pages": 342,
      "estimated_pages": { "low": 400, "high": 500 },
      "tier": "large",
      "content_breakdown": {
        "products": 200,
        "blog": 80,
        "news": 40,
        "company": 30,
        "careers": 25,
        "legal": 8,
        "other": 17
      }
    }
  ],
  "observations": [
    "Observation 1",
    "Observation 2"
  ]
}
\`\`\``,

  "example-kion-group.md": `# Example Output — KION Group

This is a real example produced for the KION Group (4 brands: KION, STILL, Baoli, Linde MH).

## Executive Summary

- **Brand / Company**: KION Group (4 brands)
- **Domains analyzed**: 13 directly sampled (STILL), 4 sampled (KION, Baoli, Linde MH), ~80+ extrapolated
- **Total estimated pages**: 37,600 – 48,000
- **Domain strategy**: Hybrid — corporate site is single-domain, Baoli is single-domain-multi-locale, STILL and Linde MH are multi-domain-per-country
- **CMS platform(s)**: AEM (KION Group), TYPO3 (Baoli), Unknown/likely AEM (STILL, Linde MH)
- **Date of analysis**: 2026-02-06

## Domain Inventory

### KION Group (kiongroup.com)

| Domain | Locale | Sampled? | Sitemap Pages | Estimated Total | Tier |
|--------|--------|----------|---------------|-----------------|------|
| kiongroup.com/en/ | English | Yes | 101 (incomplete) | 630–900 | Large |
| kiongroup.com/de/ | German | Yes | — | 500–750 | Large |
| kiongroup.com (CN) | Chinese | Yes | — | 1 | Minimal |
| reports.kiongroup.com | EN/DE | Yes | — | 1,350–1,950 | Large |

### STILL (60+ country domains)

| Domain | Country | Sampled? | Sitemap Pages | Estimated Total | Tier |
|--------|---------|----------|---------------|-----------------|------|
| still.de | Germany | Yes | 1,082 | 1,100–1,300 | Large |
| still.es | Spain | Yes | 1,089 | 1,100–1,300 | Large |
| still.co.uk | UK | Yes | ~650 | 650–800 | Large |
| still.pl | Poland | Yes | 568 | 570–700 | Large |
| still.it | Italy | Yes | 558 | 560–700 | Large |
| still.nl | Netherlands | Yes | 548 | 550–680 | Large |
| still.at | Austria | Yes | 524 | 530–650 | Large |
| still.se | Sweden | Yes | 452 | 460–560 | Medium |
| still.sa | Saudi Arabia | Yes | 447 | 450–550 | Medium |
| still.fr | France | Yes | 436 | 440–550 | Medium |
| still.com.br | Brazil | Yes | 393 | 400–500 | Medium |
| still.bg | Bulgaria | Yes | 373 | 380–470 | Medium |
| still.co.za | South Africa | Yes | 304 | 310–400 | Medium |
| still.cz, still.dk, still.no, ... | 14 medium markets | No | — | ~450 avg | Medium |
| still.hr, still.rs, still.sk, ... | 18 smaller markets | No | — | ~350 avg | Small |
| still.is, still.mu, etc. | 22 minimal markets | No | — | ~225 avg | Small/Minimal |

### Baoli (baoli-emea.com)

| Domain | Locale | Sampled? | Sitemap Pages | Estimated Total | Tier |
|--------|--------|----------|---------------|-----------------|------|
| baoli-emea.com/en-EMEA/ | English (Global) | Yes | N/A (no sitemap) | ~88 | Small |
| baoli-emea.com/it-IT/ | Italy | Yes | N/A | ~60 | Small |
| baoli-emea.com/de-DE/ | Germany | Yes | N/A | ~57 | Small |
| baoli-emea.com/en-GB/ | UK | Yes | N/A | ~43 | Minimal |
| (19 other locales) | Various | Partially | N/A | ~45–50 avg | Minimal |

### Linde Material Handling (linde-mh.* domains)

| Domain | Country | Sampled? | Sitemap Pages | Estimated Total | Tier |
|--------|---------|----------|---------------|-----------------|------|
| linde-mh.com/en/ | Global | Yes | N/A (no sitemap) | 350–450 | Medium |
| linde-mh.de | Germany | Partially | N/A | 200–300 | Medium |
| linde-mh.co.uk | UK | Partially | N/A | 150–250 | Medium |
| linde-mh.it | Italy | No | N/A | 150–250 | Medium |
| linde-mh.es | Spain | No | N/A | 150–250 | Medium |
| fenwick-linde.fr | France | No | N/A | 150–250 | Medium |
| (12+ other domains) | Various | No | N/A | 80–200 avg | Small |

## Content Breakdown

### still.de (reference site for STILL)

| Category | Pages | % of Total | Notes |
|----------|-------|------------|-------|
| Vehicles / Products | 536 | 49.5% | Forklifts, stackers, pallet trucks, AGVs |
| Blog / Content Marketing | 144 | 13.3% | Thought leadership articles |
| Careers | 126 | 11.6% | Job listings, apprenticeships |
| Company | 91 | 8.4% | Locations, history, sustainability |
| Solution Competence | 89 | 8.2% | Fleet management, energy, digitalization |
| Intralogistics Systems | 38 | 3.5% | Automation, racking, AGVs |
| Service | 14 | 1.3% | Maintenance, training, parts |
| News / Press | 4 | 0.4% | Press releases |
| Misc / Landing Pages | 39 | 3.6% | Campaigns, events, legal |

### kiongroup.com/en/ (reference site for KION)

| Category | Pages | % of Total | Notes |
|----------|-------|------------|-------|
| News & Stories | 300–370 | ~45% | Press releases + stories across 18 years |
| Investor Relations | 210–310 | ~33% | Financial news 2013–2025 |
| Careers | 60–160 | ~14% | Dynamic job listings via parameterized URLs |
| Corporate / About Us | ~43 | ~6% | Includes 35 location detail pages |
| Landing Pages | ~10 | ~1% | Regional microsites |
| Utility | ~6 | ~1% | |

## Estimation Summary

| Brand | # Sites | Avg Pages | Subtotal (Low–High) |
|-------|---------|-----------|---------------------|
| KION Group | 1 domain + reports | — | 2,500 – 3,600 |
| STILL | 60+ domains | ~450 | 30,000 – 38,000 |
| Baoli | 1 domain, 23 locales | ~52 | 1,100 – 1,400 |
| Linde MH | 20–28 domains | ~200 | 4,000 – 5,000 |
| **Grand Total** | **~110+ sites** | — | **37,600 – 48,000** |

## Key Observations

- STILL dominates at ~80% of total volume due to 60+ separate country domains
- Localization is the primary multiplier — core unique content per brand is modest
- Product pages account for ~50% of every STILL site, reflecting the extensive equipment catalog
- The KION reports subdomain (1,350–1,950 pages) may or may not be in migration scope
- Baoli is the simplest migration candidate — single domain, compact catalog, TYPO3 CMS
- Each country domain for STILL and Linde MH is essentially a standalone project
- No public sitemaps found for Baoli or Linde MH domains — estimates based on manual sampling
- France operates Linde MH under a separate brand (Fenwick-Linde)
- Career/job pages are often powered by external portals (KION uses Workday) — may be excluded from migration

## Migration Recommendations

- **Pilot candidate**: Baoli (baoli-emea.com) — single domain, ~1,200 pages, compact product catalog
- **Phased approach**: Baoli first, then KION corporate, then 1 flagship STILL market (e.g., still.de), then 1 Linde MH market, then replicate templates across remaining locales
- **Template reuse opportunity**: All STILL sites share the same IA; all Linde MH sites share the same IA — build once, replicate many times
- **Out-of-scope candidates**: reports.kiongroup.com (financial reports), external job portals, PDF-only content

## Data Quality Notes

- **Directly sampled (sitemap data)**: 13 STILL domains, kiongroup.com
- **Directly sampled (manual crawl)**: baoli-emea.com (4 locales), linde-mh.com + 3 country sites
- **Extrapolated**: ~47 STILL domains, ~15 Linde MH domains
- **No sitemap available**: All Baoli and Linde MH domains
- **Confidence level**: Medium — good data for STILL and KION, moderate for Baoli and Linde MH`,
};

export const siteEstimatorSkill: Skill = {
  id: "site-estimator",
  name: "Site Overviewer",
  description:
    'Estimate total page counts for websites and brand portfolios to scope migration efforts. Analyzes sitemaps, crawls site structures, identifies regional/language variants, and produces structured page inventories with content breakdowns. Use when user asks to "estimate pages", "how big is this website", "scope a migration", "count pages", or needs to estimate credits for Experience Modernization Agent migrations.',
  content: SKILL_CONTENT,
  references: REFERENCES,
};
