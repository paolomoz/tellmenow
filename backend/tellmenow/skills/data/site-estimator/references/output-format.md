# Site Estimator — Output Format

The output is a structured report with the following sections. All sections are required unless marked optional.

## 1. Executive Summary

A brief overview at the top:

```
## Executive Summary

- **Brand / Company**: [Name]
- **Domains analyzed**: [count] directly sampled, [count] extrapolated
- **Total estimated pages**: [low] – [high]
- **Domain strategy**: [single-domain-multi-locale | multi-domain-per-country | hybrid]
- **CMS platform(s)**: [identified platforms or "Unknown"]
- **Date of analysis**: [YYYY-MM-DD]
```

## 2. Domain Inventory

A complete list of all identified domains/locales with their estimated sizes.

```
## Domain Inventory

| Domain | Country / Locale | Sampled? | Sitemap Pages | Estimated Total | Tier |
|--------|-----------------|----------|---------------|-----------------|------|
| brand.com/en/ | Global (English) | Yes | 342 | 400–500 | Large |
| brand.de | Germany | Yes | 1,082 | 1,100–1,300 | Large |
| brand.fr | France | No | N/A | 400–600 | Medium |
| ... | ... | ... | ... | ... | ... |
```

**Tier definitions:**
- **Large**: 500+ pages
- **Medium**: 150–500 pages
- **Small**: 50–150 pages
- **Minimal**: <50 pages

## 3. Content Breakdown

Per-domain (or per-representative-domain) breakdown of content by category. Use one table per sampled domain.

```
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
```

## 4. Estimation Summary

Aggregated totals by brand or domain group, with clear low/high ranges.

```
## Estimation Summary

| Group | # Sites | Avg Pages | Subtotal (Low–High) |
|-------|---------|-----------|---------------------|
| Flagship markets | 2 | ~1,050 | 2,000 – 2,200 |
| Major markets | 6 | ~550 | 3,000 – 3,600 |
| Medium markets | 14 | ~450 | 5,600 – 7,000 |
| Small markets | 18 | ~350 | 5,400 – 7,200 |
| Adjustments (multi-language, undercount) | — | — | +3,000 – 5,000 |
| **Total** | **40+** | — | **19,000 – 25,000** |
```

If multiple brands are involved, include a grand total table:

```
### Grand Total (All Brands)

| Brand | Low Estimate | High Estimate |
|-------|-------------|---------------|
| Brand A | 2,500 | 3,600 |
| Brand B | 30,000 | 38,000 |
| **Grand Total** | **32,500** | **41,600** |
```

## 5. Key Observations

Bullet list of findings relevant to migration planning:

```
## Key Observations

- [Observation about domain strategy and migration implications]
- [Observation about content distribution / what drives page volume]
- [Observation about CMS platform and migration complexity]
- [Observation about content parity across locales]
- [Observation about out-of-scope content (PDFs, external portals, etc.)]
- [Observation about dynamic content that may need special handling]
```

## 6. Migration Recommendations (Optional)

If the user is scoping a migration, include actionable recommendations:

```
## Migration Recommendations

- **Pilot candidate**: [smallest/simplest site to start with]
- **Phased approach**: [suggested order of migration by tier/brand]
- **Template reuse opportunity**: [which sites share the same IA/templates]
- **Out-of-scope candidates**: [content that should be excluded or handled separately]
- **Credit estimate**: [if a per-page credit formula is known, apply it]
```

## 7. Data Quality Notes

Always be transparent about the reliability of estimates:

```
## Data Quality Notes

- **Directly sampled**: [list of domains where sitemaps were fetched or pages were counted]
- **Extrapolated**: [list of domains where estimates are based on tier averages]
- **No sitemap available**: [list of domains with no XML sitemap]
- **Confidence level**: [High / Medium / Low] — based on data availability
```

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

```json
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
```
