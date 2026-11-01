/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Search, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, 
  Sparkles, Image as ImageIcon, ShieldCheck, Link, Check, Compass 
} from 'lucide-react';
import { RocketComponent } from '../types/rocket';
import { ImageRetrievalService, RetrievedImageResult } from '../services/imageRetrievalService';
import { StorageService } from '../services/storageService';

interface ImageSelectorModalProps {
  isOpen: boolean;
  component: RocketComponent | null;
  onClose: () => void;
  onSaveImage: (id: string, updates: Partial<RocketComponent>) => void | Promise<void>;
}

export const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({
  isOpen,
  component,
  onClose,
  onSaveImage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<RetrievedImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'custom'>('search');
  const [saving, setSaving] = useState(false);

  // Custom manual URL state
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customSourceUrl, setCustomSourceUrl] = useState('');
  const [customLicense, setCustomLicense] = useState('Public Domain / Creative Commons');
  const [customUrlError, setCustomUrlError] = useState<string | null>(null);

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen && component) {
      const initialQuery = component.component_name || component.name || '';
      setSearchQuery(initialQuery);
      setCustomUrl(component.image_url || component.imageUrl || '');
      setCustomTitle(component.image_title || initialQuery);
      setCustomSource(component.image_source || 'NASA & Aerospace Technical Archive');
      setCustomSourceUrl(component.image_source_url || '');
      setCustomUrlError(null);
      fetchCandidates(component, initialQuery);
    } else {
      setCandidates([]);
      setLoading(false);
    }
  }, [isOpen, component]);

  const fetchCandidates = async (comp: RocketComponent, queryText?: string) => {
    setLoading(true);
    try {
      const searchTarget = queryText?.trim() 
        ? { ...comp, component_name: queryText.trim(), name: queryText.trim() } 
        : comp;
      const results = await ImageRetrievalService.retrieveCandidateImages(searchTarget, 8);
      setCandidates(results);
    } catch (err) {
      console.warn('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!component || !searchQuery.trim()) return;
    fetchCandidates(component, searchQuery.trim());
  };

  const handleSelectCandidate = async (candidate: RetrievedImageResult) => {
    if (!component) return;
    setSaving(true);
    try {
      const updates: Partial<RocketComponent> = {
        image_url: candidate.imageUrl,
        imageUrl: candidate.imageUrl,
        image_title: candidate.title,
        image_caption: candidate.caption,
        image_source: candidate.source,
        image_source_url: candidate.sourceUrl,
        image_verification_status: 'Verified',
        image_verified_at: new Date().toISOString().slice(0, 10),
        image_alt_text: `${component.component_name || component.name} technical hardware reference`,
        image_storage_path: null
      };
      await onSaveImage(component.id, updates);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleApproveCurrent = async () => {
    if (!component) return;
    setSaving(true);
    try {
      const updates: Partial<RocketComponent> = {
        image_verification_status: 'Verified',
        image_verified_at: new Date().toISOString().slice(0, 10)
      };
      await onSaveImage(component.id, updates);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!component) return;
    const trimmed = customUrl.trim();
    if (!trimmed) {
      setCustomUrlError('Please enter an image URL');
      return;
    }

    if (ImageRetrievalService.isInvalidOrSearchUrl(trimmed)) {
      setCustomUrlError(
        'Warning: This appears to be a search-result page or HTML website instead of a direct image file. Please provide a direct image link (e.g. ending in .jpg, .png, .webp).'
      );
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<RocketComponent> = {
        image_url: trimmed,
        imageUrl: trimmed,
        image_title: customTitle.trim() || component.component_name || component.name,
        image_source: customSource.trim() || 'Aerospace Technical Archive',
        image_source_url: customSourceUrl.trim() || '',
        image_verification_status: 'Verified',
        image_verified_at: new Date().toISOString().slice(0, 10),
        image_alt_text: `${component.component_name || component.name} hardware visual`,
        image_storage_path: null
      };
      await onSaveImage(component.id, updates);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !component) return null;

  const currentDisplayImg = StorageService.resolveComponentImageUrl(component);
  const isBrokenCurrent = !currentDisplayImg || ImageRetrievalService.isInvalidOrSearchUrl(component.image_url || component.imageUrl);
  const currentPlaceholder = StorageService.getComponentPlaceholder(component);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold">
                  Hardware Media Manager
                </span>
                <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[10px] font-bold">
                  {component.catalog_id || component.entry_number}
                </span>
              </div>
              <h2 className="text-lg font-bold text-black dark:text-white truncate max-w-md">
                {component.component_name || component.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Strip */}
        <div className="px-6 py-3 bg-zinc-100/70 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden bg-black shrink-0 relative">
              <img 
                src={currentDisplayImg || currentPlaceholder} 
                alt="Current thumbnail" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Current Status:</span>
                {isBrokenCurrent ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Search Page / Missing Image</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Direct Image Configured</span>
                  </span>
                )}
                {component.image_verification_status && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {component.image_verification_status}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-sm mt-0.5">
                {component.image_source || 'No source specified'} &bull; {component.image_title || 'No title'}
              </p>
            </div>
          </div>

          {!isBrokenCurrent && component.image_verification_status !== 'Verified' && (
            <button
              onClick={handleApproveCurrent}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approve as Verified</span>
            </button>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 pt-2 bg-white dark:bg-zinc-900">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-2.5 px-3 font-mono text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'search'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Auto-Search NASA & Wikimedia</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 font-mono text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'custom'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Custom Direct Image URL</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'search' ? (
            <div className="space-y-5">
              {/* Search Query Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search query in aerospace archives..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-semibold flex items-center space-x-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shrink-0"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search Repositories</span>
                </button>
              </form>

              {/* Status Notice */}
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span>
                  Querying: <strong className="text-black dark:text-white">NASA Image & Video Library</strong> + <strong className="text-black dark:text-white">Wikimedia Commons API</strong>
                </span>
                {candidates.length > 0 && (
                  <span>{candidates.length} candidates found</span>
                )}
              </div>

              {/* Candidates Grid */}
              {loading ? (
                <div className="py-16 text-center space-y-3 font-mono text-xs text-zinc-500">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-black dark:text-white" />
                  <p>Searching NASA and Wikimedia archives for direct aerospace imagery...</p>
                </div>
              ) : candidates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="group border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between hover:border-black dark:hover:border-zinc-600 transition-all shadow-xs"
                    >
                      <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                        <img
                          src={cand.thumbnailUrl || cand.imageUrl}
                          alt={cand.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white font-mono text-[9px] font-semibold border border-white/20">
                            {cand.license.slice(0, 20)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-black dark:text-white line-clamp-2 leading-snug">
                            {cand.title}
                          </h4>
                          <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 line-clamp-1">
                            {cand.source}
                          </p>
                          {cand.caption && (
                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                              {cand.caption}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 mt-2">
                          {cand.sourceUrl && (
                            <a
                              href={cand.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-zinc-500 hover:text-black dark:hover:text-white flex items-center space-x-1"
                            >
                              <span>Archive</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSelectCandidate(cand)}
                            disabled={saving}
                            className="px-2.5 py-1 rounded bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-mono text-[11px] font-semibold flex items-center space-x-1 shadow-2xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Select & Save</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl space-y-3 font-mono text-xs text-zinc-500">
                  <Compass className="w-8 h-8 mx-auto text-zinc-400" />
                  <p>No candidate images returned for &quot;{searchQuery}&quot;.</p>
                  <p className="text-[11px] text-zinc-400">
                    Try searching for a related rocket vehicle, mission (e.g. &quot;Apollo&quot;, &quot;Artemis&quot;, &quot;Falcon&quot;), or subsystem keyword.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveCustomUrl} className="space-y-4 max-w-xl mx-auto font-mono text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-black dark:text-white">
                  Direct Image URL (e.g. https://...image.jpg):
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setCustomUrlError(null);
                  }}
                  placeholder="https://example.com/hardware-photo.jpg"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                  required
                />
                {customUrlError && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center space-x-1 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{customUrlError}</span>
                  </p>
                )}
              </div>

              {/* Instant Preview */}
              {customUrl && !customUrlError && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-950 space-y-2">
                  <span className="text-[11px] text-zinc-500">Live Preview:</span>
                  <div className="aspect-video w-full max-h-48 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <img 
                      src={customUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      onError={() => setCustomUrlError('Image failed to load. Check that URL points directly to an image file.')}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-black dark:text-white">Image Title / Description:</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Flight Qualification Test Unit"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-black dark:text-white">Source Organization / Author:</label>
                  <input
                    type="text"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="e.g. NASA Marshall Space Flight Center"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-black dark:text-white">Source Archive URL:</label>
                  <input
                    type="url"
                    value={customSourceUrl}
                    onChange={(e) => setCustomSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-black dark:text-white">License:</label>
                  <input
                    type="text"
                    value={customLicense}
                    onChange={(e) => setCustomLicense(e.target.value)}
                    placeholder="e.g. Public Domain (NASA)"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold flex items-center justify-center space-x-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Save and Verify Image</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Saved images are permanently written to your existing database.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
