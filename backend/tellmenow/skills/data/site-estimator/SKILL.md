---
name: site-estimator
description: Estimate total page counts for websites and brand portfolios to scope migration efforts. Analyzes sitemaps, crawls site structures, identifies regional/language variants, and produces structured page inventories with content breakdowns. Use when user asks to "estimate pages", "how big is this website", "scope a migration", "count pages", or needs to estimate credits for Experience Modernization Agent migrations.
---

# Site Estimator

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
2. **Check for regional/country variants**: Look for country-code domains (e.g., `brand.de`, `brand.fr`, `brand.co.uk`) or locale subpaths (e.g., `/en-US/`, `/de-DE/`)
3. **Check for subdomains**: Look for significant subdomains (e.g., `blog.brand.com`, `careers.brand.com`, `reports.brand.com`)
4. **Check for sub-brands or sister sites**: If the input is a parent company, identify all brand websites under it
5. **Document the domain strategy**: Classify as single-domain-multi-locale, multi-domain-per-country, or hybrid

### Phase 2 — Sitemap Analysis

For each discovered domain:

1. **Fetch sitemap**: Try these URLs in order:
   - `/sitemap.xml`
   - `/sitemap_index.xml`
   - `/robots.txt` (look for Sitemap: directives)
   - `/sitemap/` or `/sitemap.html`
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

Generate the structured output following the format in `references/output-format.md`.

## Research Methods

Use these approaches in priority order:

1. **Sitemap fetching** — Most reliable when available. Fetch and count URLs from XML sitemaps.
2. **Web search with site: operator** — Search `site:example.com` to gauge indexed page counts and discover subdomains/paths.
3. **Navigation crawling** — Follow the main menu structure to map the information architecture and estimate depth.
4. **Archive/pagination analysis** — Check blog/news archives for date ranges and pagination to estimate article counts (e.g., 10 years of press releases at ~20/year = ~200 pages).
5. **Product catalog sampling** — Count product categories and items per category on listing pages.

## Important Notes

- Always provide **ranges** (low–high), never single numbers — estimation is inherently uncertain
- Distinguish between **unique content pages** and **locale-replicated pages** in the output
- Flag content that may be **out of scope** for migration (e.g., financial reports, job portals hosted externally, PDF-only content)
- Note the **CMS platform** if identifiable (AEM, WordPress, TYPO3, Drupal, etc.) — this affects migration complexity
- Record which domains were **directly sampled** vs. **extrapolated** — transparency about data quality matters
- If a domain has no sitemap and cannot be easily sampled, say so rather than guessing
