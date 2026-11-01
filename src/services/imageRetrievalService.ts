/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RocketCategory, RocketComponent } from '../types/rocket';

export interface RetrievedImageResult {
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  caption: string;
  source: string;
  sourceUrl: string;
  license: string;
  verificationStatus: 'Verified' | 'Pending Review';
  verifiedAt: string;
}

// In-memory cache for retrieved images to prevent redundant network calls during session
const imageSearchCache = new Map<string, RetrievedImageResult[]>();

export const ImageRetrievalService = {
  /**
   * Checks if a URL is an invalid webpage, search page, or non-image URL.
   * Specifically catches Wikimedia Commons search pages like:
   * - https://commons.wikimedia.org/w/index.php?search=...
   * - https://commons.wikimedia.org/wiki/Special:Search?search=...
   * - https://en.wikipedia.org/wiki/...
   * - HTML pages ending with .php, .html
   */
  isInvalidOrSearchUrl(url?: string | null): boolean {
    if (!url || typeof url !== 'string') return true;
    const trimmed = url.trim();
    if (!trimmed) return true;

    const lower = trimmed.toLowerCase();

    // Catch non-displayable document, video, or audio files (PDFs, WebMs, etc.)
    if (
      lower.includes('.pdf') ||
      lower.includes('.webm') ||
      lower.includes('.mp4') ||
      lower.includes('.ogg') ||
      lower.includes('.ogv') ||
      lower.includes('.djvu') ||
      lower.includes('.tif') ||
      lower.includes('.tiff')
    ) {
      return true;
    }

    // Catch search engine or wiki search result URLs
    if (
      lower.includes('commons.wikimedia.org/w/index.php') ||
      lower.includes('commons.wikimedia.org/wiki/special:search') ||
      lower.includes('wikipedia.org/w/index.php') ||
      lower.includes('wikipedia.org/wiki/special:search') ||
      lower.includes('google.com/search') ||
      lower.includes('bing.com/search') ||
      lower.includes('duckduckgo.com')
    ) {
      return true;
    }

    // Catch Wikipedia or Wikimedia article/description pages (e.g. /wiki/File:Foo.jpg without direct upload link)
    if (
      (lower.includes('wikipedia.org/wiki/') || lower.includes('commons.wikimedia.org/wiki/')) &&
      !lower.includes('upload.wikimedia.org')
    ) {
      return true;
    }

    // Catch HTML pages
    if (lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.php')) {
      return true;
    }

    // Must start with http://, https://, data:, or blob:
    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('data:') &&
      !trimmed.startsWith('blob:')
    ) {
      return true;
    }

    return false;
  },

  /**
   * Returns true if a URL is a direct, displayable image file.
   */
  isValidDirectImageUrl(url?: string | null): boolean {
    if (this.isInvalidOrSearchUrl(url)) return false;
    const trimmed = (url || '').trim();
    const lower = trimmed.toLowerCase();

    // Definitively reject non-image formats
    if (
      lower.includes('.pdf') ||
      lower.includes('.webm') ||
      lower.includes('.mp4') ||
      lower.includes('.djvu') ||
      lower.includes('.tif') ||
      lower.includes('.tiff')
    ) {
      return false;
    }

    // Known direct image extensions or image hosts
    if (
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.svg') ||
      lower.endsWith('.gif') ||
      lower.includes('.jpg?') ||
      lower.includes('.jpeg?') ||
      lower.includes('.png?') ||
      lower.includes('.webp?') ||
      lower.includes('.svg?')
    ) {
      return true;
    }

    // Trusted image CDNs that return raw images even with query params
    if (
      lower.includes('upload.wikimedia.org') ||
      lower.includes('images-assets.nasa.gov') ||
      lower.includes('images.unsplash.com') ||
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('blob:')
    ) {
      return true;
    }

    return false;
  },

  /**
   * Resolves a Wikipedia/Wikimedia File description page (e.g. /wiki/File:Apollo_11.jpg)
   * into the actual direct media file via Wikimedia API.
   */
  async resolveWikimediaFilePage(pageUrl: string): Promise<RetrievedImageResult | null> {
    try {
      const match = pageUrl.match(/File:([^#?]+)/i);
      if (!match) return null;
      const fileName = decodeURIComponent(match[1]);
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(
        fileName
      )}&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;

      const response = await fetch(apiUrl);
      if (!response.ok) return null;
      const data = await response.json();
      const pages = data.query?.pages || {};
      const page = Object.values(pages)[0] as any;
      if (!page || !page.imageinfo || !page.imageinfo[0]) return null;

      const info = page.imageinfo[0];
      const metadata = info.extmetadata || {};
      const directUrl = info.url || info.thumburl;
      if (!directUrl) return null;

      const title = (metadata.ObjectName?.value || page.title || fileName)
        .replace(/^File:/i, '')
        .replace(/\.[^/.]+$/, '')
        .replace(/_/g, ' ');

      const license = metadata.LicenseShortName?.value || 'Public Domain / Creative Commons';
      const artist = metadata.Artist?.value ? metadata.Artist.value.replace(/<[^>]*>?/gm, '').trim() : '';

      return {
        imageUrl: directUrl,
        thumbnailUrl: info.thumburl || directUrl,
        title,
        caption: (metadata.ImageDescription?.value || '').replace(/<[^>]*>?/gm, '').slice(0, 160),
        source: artist ? `Wikimedia Commons (${artist})` : 'Wikimedia Commons Archive',
        sourceUrl: info.descriptionurl || pageUrl,
        license,
        verificationStatus: 'Verified',
        verifiedAt: new Date().toISOString().slice(0, 10)
      };
    } catch {
      return null;
    }
  },

  /**
   * Search NASA Image and Video Library for public domain aerospace hardware imagery.
   * API: https://images-api.nasa.gov/search?q={query}&media_type=image
   */
  async searchNASAImageLibrary(query: string, limit: number = 4): Promise<RetrievedImageResult[]> {
    try {
      const cleanQuery = encodeURIComponent(query.trim());
      const url = `https://images-api.nasa.gov/search?q=${cleanQuery}&media_type=image`;
      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const items: any[] = data.collection?.items || [];
      const results: RetrievedImageResult[] = [];

      for (const item of items) {
        if (results.length >= limit) break;
        const itemData = item.data?.[0];
        const link = item.links?.[0];
        if (!itemData || !link || !link.href) continue;

        const imgHref = link.href.trim();
        if (!this.isValidDirectImageUrl(imgHref)) continue;

        const title = (itemData.title || query).trim();
        const description = (itemData.description || '').replace(/<[^>]*>?/gm, '').slice(0, 180);
        const center = itemData.center ? `NASA ${itemData.center}` : 'NASA Technical Archive';
        const nasaId = itemData.nasa_id || '';
        const sourceUrl = nasaId ? `https://images.nasa.gov/details-${nasaId}` : 'https://images.nasa.gov';

        results.push({
          imageUrl: imgHref,
          thumbnailUrl: imgHref,
          title,
          caption: description,
          source: center,
          sourceUrl,
          license: 'Public Domain (NASA)',
          verificationStatus: 'Verified',
          verifiedAt: new Date().toISOString().slice(0, 10)
        });
      }

      return results;
    } catch (err) {
      console.warn('NASA image retrieval encountered an issue:', err);
      return [];
    }
  },

  /**
   * Search Wikimedia Commons API for direct media files.
   * API: https://commons.wikimedia.org/w/api.php?action=query&generator=search...
   */
  async searchWikimediaCommons(query: string, limit: number = 4): Promise<RetrievedImageResult[]> {
    try {
      const cleanQuery = encodeURIComponent(query.trim());
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${cleanQuery}&gsrnamespace=6&gsrlimit=${limit * 3}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=800&format=json&origin=*`;
      const response = await fetch(url, {
        headers: {
          'Api-User-Agent': 'AerionApp/1.0 (aerion@internal; educational aerospace catalog)'
        }
      });
      if (!response.ok) return [];

      const data = await response.json();
      const pages = data.query?.pages || {};
      const results: RetrievedImageResult[] = [];

      for (const page of Object.values(pages) as any[]) {
        if (results.length >= limit) break;
        const info = page.imageinfo?.[0];
        if (!info || !info.url) continue;

        const directUrl = (info.thumburl || info.url).trim();
        const lowerUrl = directUrl.toLowerCase();
        // Strictly skip non-image formats
        if (
          lowerUrl.includes('.pdf') ||
          lowerUrl.includes('.webm') ||
          lowerUrl.includes('.mp4') ||
          lowerUrl.includes('.djvu') ||
          lowerUrl.includes('.tif') ||
          lowerUrl.includes('.tiff') ||
          lowerUrl.includes('.ogv')
        ) {
          continue;
        }

        const mime = info.mime || '';
        if (mime && !mime.startsWith('image/')) continue;
        if (!this.isValidDirectImageUrl(directUrl)) continue;

        const metadata = info.extmetadata || {};
        const title = (metadata.ObjectName?.value || page.title || query)
          .replace(/^File:/i, '')
          .replace(/\.[^/.]+$/, '')
          .replace(/_/g, ' ');

        const rawLicense = metadata.LicenseShortName?.value || 'Creative Commons / Public Domain';
        const artist = metadata.Artist?.value ? metadata.Artist.value.replace(/<[^>]*>?/gm, '').trim() : '';
        const sourceLabel = artist ? `Wikimedia Commons (${artist})` : 'Wikimedia Commons Technical Media';

        results.push({
          imageUrl: directUrl,
          thumbnailUrl: info.thumburl || directUrl,
          title,
          caption: (metadata.ImageDescription?.value || '').replace(/<[^>]*>?/gm, '').slice(0, 180),
          source: sourceLabel,
          sourceUrl: info.descriptionurl || 'https://commons.wikimedia.org',
          license: rawLicense,
          verificationStatus: 'Verified',
          verifiedAt: new Date().toISOString().slice(0, 10)
        });
      }

      return results;
    } catch (err) {
      console.warn('Wikimedia Commons retrieval encountered an issue:', err);
      return [];
    }
  },

  /**
   * Generates search queries optimized for aerospace component retrieval.
   */
  buildSearchQueries(component: Partial<RocketComponent>): string[] {
    const rawName = (component.component_name || component.name || '').trim();
    const category = (component.category || '').trim();
    const catalogId = (component.catalog_id || '').replace(/-/g, ' ').trim();

    const queries: string[] = [];

    if (rawName) {
      queries.push(rawName);

      // 1. If name contains slashes or dashes (e.g. "Aircraft towbar / towbarless tug interface")
      if (rawName.includes('/')) {
        const parts = rawName.split('/').map((p) => p.trim()).filter(Boolean);
        for (const p of parts) {
          queries.push(p);
          queries.push(`${p} aircraft`);
        }
      }

      // 2. Clean name without parentheses: e.g. "Additive manufacturing (metal 3D printing)" -> "Additive manufacturing metal 3D printing", "Additive manufacturing"
      const withoutParens = rawName.replace(/\([^)]*\)/g, '').trim();
      if (withoutParens && withoutParens !== rawName) {
        queries.push(withoutParens);
      }

      const insideParens = (rawName.match(/\(([^)]+)\)/)?.[1] || '').trim();
      if (insideParens) {
        queries.push(insideParens);
      }

      // 3. Simplified name (remove stopwords/generic engineering terms)
      const simplified = rawName
        .replace(/[^\w\s]/gi, ' ')
        .replace(/\b(assembly|system|unit|pod|module|hardware|pack|component|model|solver|equipment|interface)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (simplified && simplified !== rawName && simplified.length > 3) {
        queries.push(simplified);
        queries.push(`${simplified} aerospace`);
      }

      // 4. Sub-phrase decomposition for multi-word titles (e.g. "Satellite battery management system" -> "Satellite battery", "Fuel quantity sensor" -> "Fuel sensor")
      const words = (withoutParens || rawName)
        .replace(/[^\w\s]/gi, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !/^(the|and|for|with|system|unit|assembly|model|equipment|hardware|interface)$/i.test(w));
      
      if (words.length >= 3) {
        queries.push(`${words[0]} ${words[1]}`);
        queries.push(`${words[0]} ${words[words.length - 1]}`);
        queries.push(`${words[1]} ${words[words.length - 1]}`);
      } else if (words.length === 2) {
        queries.push(`${words[0]} ${words[1]}`);
      }

      // 5. Combined with category or rocket/spacecraft
      if (category) {
        const cleanCat = category.replace(/[^\w\s]/g, ' ').split(/\s+/)[0];
        queries.push(`${withoutParens || rawName} ${cleanCat}`);
      }

      // 6. Domain-specific hardware keyword expansions
      const lower = rawName.toLowerCase();
      if (lower.includes('adhesive') || lower.includes('bondline')) queries.push('aerospace adhesive', 'composite bonding');
      if (lower.includes('dynamics') || lower.includes('multibody')) queries.push('flight dynamics simulation', 'spacecraft dynamics');
      if (lower.includes('hydraulic')) queries.push('aircraft hydraulic', 'aerospace hydraulic reservoir');
      if (lower.includes('transceiver') || lower.includes('ads-b')) queries.push('avionics transceiver', 'aircraft transponder');
      if (lower.includes('air-start') || lower.includes('start unit')) queries.push('aircraft air start unit', 'ground support equipment');
      if (lower.includes('breaker')) queries.push('aircraft circuit breaker', 'spacecraft avionics');
      if (lower.includes('wire') || lower.includes('harness')) queries.push('aerospace wiring harness');
      if (lower.includes('fastener') || lower.includes('bolt')) queries.push('aerospace titanium fastener');
      if (lower.includes('sensor')) queries.push('aerospace sensor hardware');
    }

    if (catalogId && catalogId !== rawName.toLowerCase()) {
      queries.push(`${catalogId} aerospace`);
    }

    // Return unique cleaned queries
    return Array.from(new Set(queries.map((q) => q.trim()).filter((q) => q.length >= 3)));
  },

  /**
   * Retrieve multiple candidate images for a component across NASA and Wikimedia Commons.
   */
  async retrieveCandidateImages(
    component: Partial<RocketComponent>,
    maxCandidates: number = 6
  ): Promise<RetrievedImageResult[]> {
    const cacheKey = `${component.id || component.component_name || component.name}_candidates`;
    if (imageSearchCache.has(cacheKey)) {
      return imageSearchCache.get(cacheKey)!;
    }

    const queries = this.buildSearchQueries(component);
    const candidateMap = new Map<string, RetrievedImageResult>();

    // 1. First attempt: If current URL is a Wikimedia Commons /wiki/File: link, resolve it directly!
    const existingUrl = component.image_url || component.imageUrl;
    if (existingUrl && existingUrl.includes('File:')) {
      const resolved = await this.resolveWikimediaFilePage(existingUrl);
      if (resolved) {
        candidateMap.set(resolved.imageUrl, resolved);
      }
    }

    // 2. Query NASA and Wikimedia in parallel across query variations
    for (const query of queries.slice(0, 7)) {
      if (candidateMap.size >= maxCandidates) break;

      const [nasaResults, wikiResults] = await Promise.all([
        this.searchNASAImageLibrary(query, 3),
        this.searchWikimediaCommons(query, 3)
      ]);

      for (const item of [...nasaResults, ...wikiResults]) {
        if (!candidateMap.has(item.imageUrl)) {
          candidateMap.set(item.imageUrl, item);
        }
      }
    }

    const candidates = Array.from(candidateMap.values()).slice(0, maxCandidates);
    imageSearchCache.set(cacheKey, candidates);
    return candidates;
  },

  /**
   * Automatically retrieves the single best matching image for a component.
   */
  async retrieveBestImageForComponent(
    component: Partial<RocketComponent>
  ): Promise<RetrievedImageResult | null> {
    const candidates = await this.retrieveCandidateImages(component, 4);
    if (candidates.length > 0) {
      return candidates[0];
    }
    return null;
  },

  /**
   * Generates a high-quality SVG data URI placeholder for aerospace hardware
   * tailored to the component's category and name.
   */
  generateAerospacePlaceholderSvg(component: Partial<RocketComponent>): string {
    const name = (component.component_name || component.name || 'Aerospace Hardware').slice(0, 32);
    const category = (component.category || 'Flight Hardware Subsystem').slice(0, 40);
    const catalogId = (component.catalog_id || component.entry_number || 'AERION-000').toUpperCase();

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="50%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#090d16"/>
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <circle cx="0" cy="0" r="1.5" fill="rgba(255,255,255,0.12)"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <rect width="100%" height="100%" fill="url(#grid)"/>

        <!-- Blueprint Crosshairs & Engineering Guides -->
        <circle cx="400" cy="220" r="140" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="4,4"/>
        <circle cx="400" cy="220" r="90" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <line x1="200" y1="220" x2="600" y2="220" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
        <line x1="400" y1="60" x2="400" y2="380" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

        <!-- Stylized Rocket Emblem In Center -->
        <g transform="translate(400, 220) scale(1.6) translate(-24, -24)">
          <path d="M24 4 C24 4 15 14 15 26 C15 32 18 36 21 38 L21 42 L24 40 L27 42 L27 38 C30 36 33 32 33 26 C33 14 24 4 24 4 Z" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="24" cy="22" r="3.5" fill="#38bdf8"/>
          <path d="M15 26 L9 32 L15 34 Z" fill="rgba(255,255,255,0.3)"/>
          <path d="M33 26 L39 32 L33 34 Z" fill="rgba(255,255,255,0.3)"/>
        </g>

        <!-- Technical Corner Badges -->
        <text x="36" y="46" font-family="monospace" font-size="12" font-weight="bold" fill="#38bdf8" letter-spacing="2">AERION TECHNICAL ARCHIVE</text>
        <text x="36" y="66" font-family="monospace" font-size="10" fill="#94a3b8">HARDWARE SPECIFICATION</text>
        
        <text x="764" y="46" text-anchor="end" font-family="monospace" font-size="12" font-weight="bold" fill="#ffffff">${catalogId}</text>
        <text x="764" y="66" text-anchor="end" font-family="monospace" font-size="10" fill="#64748b">STAGE INTERFACE: QUALIFIED</text>

        <!-- Component Name & Category Label At Bottom -->
        <rect x="36" y="405" width="728" height="60" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.1)"/>
        <text x="56" y="432" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${name}</text>
        <text x="56" y="452" font-family="monospace" font-size="11" fill="#94a3b8">${category} &bull; REFERENCE VISUAL</text>
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
};
