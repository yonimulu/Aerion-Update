import { getSupabase, getActiveSupabaseCredentials } from '../lib/supabase';
import { RocketComponent } from '../types/rocket';
import { ImageRetrievalService } from './imageRetrievalService';

export const STORAGE_BUCKET = 'aerospace-media';

export interface StorageUploadResult {
  success: boolean;
  publicUrl?: string;
  signedUrl?: string;
  storagePath?: string;
  error?: string;
}

export const StorageService = {
  /**
   * Resolves any image URL or storage relative path into a fully qualified, displayable browser URL.
   * Filters out search-result pages, Wikimedia Special:Search pages, and non-image HTML links.
   */
  resolveImageUrl(pathOrUrl?: string | null, storagePath?: string | null): string {
    // 1. If pathOrUrl is already an absolute HTTP(S), data:, or blob: URL, check that it is a valid direct image URL
    if (pathOrUrl) {
      const trimmed = pathOrUrl.trim();
      // Explicitly reject Wikimedia search pages and non-image search results
      if (ImageRetrievalService.isInvalidOrSearchUrl(trimmed)) {
        return '';
      }
      if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('blob:')
      ) {
        return trimmed;
      }
    }

    // 2. Check storagePath if it was stored as a full URL or data: URI
    if (storagePath) {
      const trimmedStorage = storagePath.trim();
      if (
        trimmedStorage.startsWith('http://') ||
        trimmedStorage.startsWith('https://') ||
        trimmedStorage.startsWith('data:') ||
        trimmedStorage.startsWith('blob:')
      ) {
        return trimmedStorage;
      }
    }

    // 3. Extract and sanitize relative path
    const rawTarget = (storagePath || pathOrUrl || '').trim();
    if (!rawTarget) return '';

    // Strip legacy and bucket prefixes
    let cleanPath = rawTarget
      .replace(/^fallback:\/\//, '')
      .replace(/^local:\/\/offline\//, '')
      .replace(/^\/+/, '');

    if (cleanPath.startsWith(`${STORAGE_BUCKET}/`)) {
      cleanPath = cleanPath.substring(STORAGE_BUCKET.length + 1);
    }

    if (!cleanPath) return '';

    // 4. Construct via active Supabase instance if available
    const supabase = getSupabase();
    if (supabase) {
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(cleanPath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }

    // 5. Fallback: construct public URL using active credentials
    const creds = getActiveSupabaseCredentials();
    if (creds.url && !creds.url.includes('your-project.supabase.co')) {
      const baseUrl = creds.url.replace(/\/+$/, '');
      return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
    }

    return rawTarget;
  },

  /**
   * Resolves the primary display image URL for any RocketComponent.
   * Rejects search-result pages, non-image Wikimedia links, and invalid URLs.
   */
  resolveComponentImageUrl(component?: Partial<RocketComponent> | null): string {
    if (!component) return '';

    // Check image_url first
    if (component.image_url) {
      const trimmed = component.image_url.trim();
      if (!ImageRetrievalService.isInvalidOrSearchUrl(trimmed)) {
        if (
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('data:') ||
          trimmed.startsWith('blob:')
        ) {
          return trimmed;
        }
      }
    }

    // Check imageUrl fallback
    if (component.imageUrl) {
      const trimmed = component.imageUrl.trim();
      if (!ImageRetrievalService.isInvalidOrSearchUrl(trimmed)) {
        if (
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('data:') ||
          trimmed.startsWith('blob:')
        ) {
          return trimmed;
        }
      }
    }

    // Resolve storage path or relative URL to Supabase public URL
    const resolved = this.resolveImageUrl(component.image_url || component.imageUrl, component.image_storage_path);
    if (resolved && !ImageRetrievalService.isInvalidOrSearchUrl(resolved)) {
      return resolved;
    }

    return '';
  },

  /**
   * Returns a high quality SVG blueprint schematic placeholder for this component.
   */
  getComponentPlaceholder(component: Partial<RocketComponent>): string {
    return ImageRetrievalService.generateAerospacePlaceholderSvg(component);
  },

  /**
   * Generates a signed URL if a Supabase Storage bucket is configured as private.
   */
  async getSignedUrl(storagePath: string, expiresInSeconds: number = 60 * 60 * 24 * 30): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase || !storagePath) return null;

    try {
      let cleanPath = storagePath
        .replace(/^fallback:\/\//, '')
        .replace(/^local:\/\/offline\//, '')
        .replace(/^\/+/, '');

      if (cleanPath.startsWith(`${STORAGE_BUCKET}/`)) {
        cleanPath = cleanPath.substring(STORAGE_BUCKET.length + 1);
      }

      if (!cleanPath || cleanPath.startsWith('http') || cleanPath.startsWith('data:')) {
        return null;
      }

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(cleanPath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        return null;
      }

      return data.signedUrl;
    } catch {
      return null;
    }
  },

  /**
   * Uploads an image file to the Supabase Storage 'aerospace-media' bucket.
   */
  async uploadComponentImage(
    file: File,
    catalogIdOrNumber: string = 'entry'
  ): Promise<StorageUploadResult> {
    const supabase = getSupabase();

    // If Supabase is not configured, fallback to data URL
    if (!supabase) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            success: true,
            publicUrl: reader.result as string,
            storagePath: `local://offline/${file.name}`,
            error: 'Uploaded locally (Supabase Storage not configured; image saved in local storage).'
          });
        };
        reader.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to read file on device.'
          });
        };
        reader.readAsDataURL(file);
      });
    }

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanPrefix = catalogIdOrNumber.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'entry';
      const fileName = `${cleanPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
      const filePath = `entries/${fileName}`;

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn('Supabase storage upload error:', error.message);
        // Fallback to data URL so user doesn't lose their image
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              success: true,
              publicUrl: reader.result as string,
              storagePath: `fallback://${filePath}`,
              error: `Storage upload note: ${error.message}. Saved inline fallback.`
            });
          };
          reader.readAsDataURL(file);
        });
      }

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // Also attempt to pre-generate a signed URL if the bucket is configured as private
      let signedUrl: string | undefined;
      try {
        const { data: signedData } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year
        if (signedData?.signedUrl) {
          signedUrl = signedData.signedUrl;
        }
      } catch {
        // Ignore if signed URL generation is not permitted
      }

      return {
        success: true,
        publicUrl: urlData.publicUrl,
        signedUrl,
        storagePath: filePath
      };
    } catch (err: any) {
      console.error('Storage service exception:', err);
      return {
        success: false,
        error: err?.message || 'Failed to complete storage upload.'
      };
    }
  },

  /**
   * Deletes an uploaded image from the Supabase Storage bucket.
   */
  async deleteImage(storagePath: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || !storagePath || storagePath.startsWith('local://') || storagePath.startsWith('data:')) {
      return true;
    }

    try {
      const cleanPath = storagePath
        .replace(/^fallback:\/\//, '')
        .replace(/^local:\/\/offline\//, '')
        .replace(/^aerospace-media\//, '')
        .replace(/^\/+/, '');

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([cleanPath]);

      if (error) {
        console.warn('Could not delete storage image:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Failed to delete storage file:', err);
      return false;
    }
  }
};
