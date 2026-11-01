import React, { useState } from 'react';
import { 
  Settings, Plus, Pencil, Trash2, Eye, Search, CheckCircle, 
  Filter, FileText, CheckCircle2, Clock, Star, Image as ImageIcon,
  AlertTriangle, ShieldCheck, Check, MessageSquare, Layers,
  CheckSquare, Square, X, EyeOff
} from 'lucide-react';
import { RocketComponent, EntryStatus } from '../types/rocket';
import { getCategoryBadgeStyle } from '../components/ComponentCard';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { EncyclopediaEntryFormModal } from '../components/EncyclopediaEntryFormModal';
import { ImageSelectorModal } from '../components/ImageSelectorModal';
import { AdminReviewsDashboard } from '../components/admin/AdminReviewsDashboard';
import { StorageService } from '../services/storageService';
import { ComponentService } from '../services/componentService';

interface AdminPageProps {
  components: RocketComponent[];
  categories?: string[];
  onViewComponent: (id: string) => void;
  onAddComponent: (item: Partial<RocketComponent>) => void | Promise<void>;
  onEditComponent: (id: string, updates: Partial<RocketComponent>) => void | Promise<void>;
  onDeleteComponent: (id: string) => void | Promise<void>;
  onResetDefaults?: () => void | Promise<void>;
  onToggleFeatured?: (id: string) => void | Promise<boolean | void>;
  onBulkUpdateStatus?: (ids: string[], status: EntryStatus) => Promise<void>;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  components,
  categories: categoriesProp,
  onViewComponent,
  onAddComponent,
  onEditComponent,
  onDeleteComponent,
  onToggleFeatured,
  onBulkUpdateStatus
}) => {
  const [adminSection, setAdminSection] = useState<'components' | 'reviews'>('components');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [imageFilter, setImageFilter] = useState<'all' | 'verified' | 'pending'>('all');

  // Multi-item selection for batch status marking
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RocketComponent | null>(null);

  // Image manager modal state
  const [managingImageItem, setManagingImageItem] = useState<RocketComponent | null>(null);

  // Delete modal state
  const [deletingItem, setDeletingItem] = useState<RocketComponent | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: RocketComponent) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleSaveForm = (data: Partial<RocketComponent>) => {
    if (editingItem) {
      onEditComponent(editingItem.id, data);
      showNotification(`Updated entry "${data.component_name || data.name}"`);
    } else {
      onAddComponent(data);
      showNotification(`Created entry "${data.component_name || data.name}"`);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      onDeleteComponent(deletingItem.id);
      showNotification(`Deleted entry "${deletingItem.component_name || deletingItem.name}"`);
      // Also remove from selection if selected
      if (selectedIds.has(deletingItem.id)) {
        const next = new Set(selectedIds);
        next.delete(deletingItem.id);
        setSelectedIds(next);
      }
      setDeletingItem(null);
    }
  };

  // 1-Click single component status toggle
  const handleToggleSingleStatus = async (item: RocketComponent) => {
    const current = (item.status || 'published') as EntryStatus;
    const nextStatus: EntryStatus = current === 'published' ? 'draft' : 'published';

    await onEditComponent(item.id, { status: nextStatus });
    showNotification(
      `Marked "${item.component_name || item.name}" as ${nextStatus === 'published' ? 'Published' : 'Draft'}`
    );
  };

  // Filter components by search, category, status, and image health
  const filteredComponents = components.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'All'
        ? true
        : selectedStatus === 'featured'
        ? Boolean(item.featured)
        : (item.status || 'published') === selectedStatus;
    
    // Image health filtering
    const isBrokenOrSearch = ComponentService.hasBrokenOrMissingImage(item);
    let matchesImage = true;
    if (imageFilter === 'verified') {
      matchesImage = !isBrokenOrSearch && item.image_verification_status === 'Verified';
    } else if (imageFilter === 'pending') {
      matchesImage = item.image_verification_status === 'Pending Review' || isBrokenOrSearch;
    }

    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.component_name?.toLowerCase().includes(q) ||
      item.name?.toLowerCase().includes(q) ||
      item.catalog_id?.toLowerCase().includes(q) ||
      item.designation?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.entry_number?.toLowerCase().includes(q);

    return matchesCategory && matchesStatus && matchesImage && matchesSearch;
  });

  // Selection handlers
  const areAllFilteredSelected = filteredComponents.length > 0 && 
    filteredComponents.every((c) => selectedIds.has(c.id));

  const handleSelectAllFiltered = () => {
    if (areAllFilteredSelected) {
      // Deselect all filtered items
      const next = new Set(selectedIds);
      filteredComponents.forEach((c) => next.delete(c.id));
      setSelectedIds(next);
    } else {
      // Select all filtered items
      const next = new Set(selectedIds);
      filteredComponents.forEach((c) => next.add(c.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Bulk mark status handler (Published or Draft)
  const handleBulkMarkStatus = async (status: EntryStatus) => {
    if (selectedIds.size === 0 || isBulkProcessing) return;
    setIsBulkProcessing(true);

    const targetIds = Array.from(selectedIds);
    const count = targetIds.length;

    try {
      if (onBulkUpdateStatus) {
        await onBulkUpdateStatus(targetIds, status);
      } else {
        await ComponentService.bulkUpdateStatus(targetIds, status);
        // Fallback update in case prop not available
        for (const id of targetIds) {
          await onEditComponent(id, { status });
        }
      }

      setSelectedIds(new Set());
      showNotification(
        `Successfully marked ${count} component${count === 1 ? '' : 's'} as ${status === 'published' ? 'Published' : 'Draft'}`
      );
    } catch (err: any) {
      showNotification(`Failed to bulk update status: ${err?.message || 'Error'}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const categories = React.useMemo(() => {
    const catSet = new Set<string>();
    catSet.add('All');

    if (categoriesProp && categoriesProp.length > 0) {
      categoriesProp.forEach((c) => catSet.add(c));
    }

    components.forEach((c) => {
      if (c.category) catSet.add(c.category);
    });

    return Array.from(catSet);
  }, [categoriesProp, components]);

  const publishedCount = components.filter((c) => (c.status || 'published') === 'published').length;
  const draftCount = components.filter((c) => c.status === 'draft').length;
  const featuredCount = components.filter((c) => c.featured).length;
  const verifiedImageCount = components.filter(
    (c) => !ComponentService.hasBrokenOrMissingImage(c) && c.image_verification_status === 'Verified'
  ).length;
  const activeSubsystemsCount = categories.filter((c) => c !== 'All').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-transparent min-h-[85vh] transition-colors duration-200 relative pb-24">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-xl shadow-xl font-mono text-xs animate-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs uppercase tracking-widest font-semibold">
            <Settings className="w-4 h-4 text-black dark:text-white" />
            <span>Administration Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight">
            {adminSection === 'components' ? 'Hardware Components & Media' : 'Community Reviews & Ratings Moderation'}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
            {adminSection === 'components'
              ? 'Maintain flight hardware records, inspect specifications, and manage publication or draft status.'
              : 'Audit user evaluations, inspect reported comments, and manage public ratings.'}
          </p>
        </div>

        {adminSection === 'components' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Top Action buttons when components are selected */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg">
                <span className="font-mono text-xs px-2 text-zinc-800 dark:text-zinc-200 font-bold">
                  {selectedIds.size} Selected
                </span>
                <button
                  type="button"
                  onClick={() => handleBulkMarkStatus('published')}
                  disabled={isBulkProcessing}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="Mark selected components as Published"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Published</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkMarkStatus('draft')}
                  disabled={isBulkProcessing}
                  className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="Mark selected components as Draft"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mark Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={isBulkProcessing}
                  className="px-2 py-1.5 rounded-md text-zinc-500 hover:text-black dark:hover:text-white font-mono text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-lg bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Component</span>
            </button>
          </div>
        )}
      </div>

      {/* Admin Module Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setAdminSection('components')}
          className={`flex items-center space-x-2 px-4 py-2.5 font-mono text-xs font-bold border-b-2 transition-all cursor-pointer ${
            adminSection === 'components'
              ? 'border-black dark:border-white text-black dark:text-white bg-zinc-50 dark:bg-zinc-900/60 rounded-t-lg'
              : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Hardware Catalog</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            {components.length}
          </span>
        </button>

        <button
          onClick={() => setAdminSection('reviews')}
          className={`flex items-center space-x-2 px-4 py-2.5 font-mono text-xs font-bold border-b-2 transition-all cursor-pointer ${
            adminSection === 'reviews'
              ? 'border-black dark:border-white text-black dark:text-white bg-zinc-50 dark:bg-zinc-900/60 rounded-t-lg'
              : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <span>Reviews & Ratings Moderation</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
            Active
          </span>
        </button>
      </div>

      {adminSection === 'reviews' ? (
        <AdminReviewsDashboard
          components={components}
          onViewComponent={onViewComponent}
          showNotification={showNotification}
        />
      ) : (
        <>
        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase font-semibold">Total Records</div>
            <div className="text-2xl font-bold text-black dark:text-white font-mono">{components.length}</div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase font-semibold">Published</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{publishedCount}</span>
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase font-semibold">Drafts</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono flex items-center space-x-1.5">
              <Clock className="w-4 h-4" />
              <span>{draftCount}</span>
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase font-semibold">Subsystems</div>
            <div className="text-2xl font-bold text-black dark:text-white font-mono flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>{activeSubsystemsCount}</span>
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 col-span-2 sm:col-span-1">
            <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase font-semibold">Featured</div>
            <div className="text-2xl font-bold text-black dark:text-white font-mono flex items-center space-x-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{featuredCount}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by component name, catalog ID, or category..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Category Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white text-xs font-mono focus:outline-none focus:border-black dark:focus:border-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white text-xs font-mono focus:outline-none focus:border-black dark:focus:border-white"
              >
                <option value="All">All Statuses ({components.length})</option>
                <option value="published">Published ({publishedCount})</option>
                <option value="draft">Drafts Only ({draftCount})</option>
                <option value="featured">Featured Only ({featuredCount})</option>
              </select>
            </div>

            {/* Media Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Media:</span>
              <select
                value={imageFilter}
                onChange={(e) => setImageFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white text-xs font-mono focus:outline-none focus:border-black dark:focus:border-white"
              >
                <option value="all">All Media</option>
                <option value="verified">Verified Photography ({verifiedImageCount})</option>
                <option value="pending">Pending Verification</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Action Bar on Top (Webapp Native Toolbar) */}
        <div className={`p-3 rounded-xl border transition-all ${
          selectedIds.size > 0 
            ? 'bg-zinc-100 dark:bg-zinc-800/90 border-zinc-300 dark:border-zinc-700' 
            : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Left side: selection status and select/deselect buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white font-mono text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
                title={areAllFilteredSelected ? 'Deselect all filtered' : 'Select all filtered components'}
              >
                {areAllFilteredSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-black dark:text-white" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{areAllFilteredSelected ? 'Deselect All' : 'Select All Filtered'}</span>
              </button>

              <span className="text-zinc-600 dark:text-zinc-400">
                {selectedIds.size > 0 ? (
                  <span className="font-bold text-black dark:text-white">
                    {selectedIds.size} of {filteredComponents.length} selected
                  </span>
                ) : (
                  <span>Showing {filteredComponents.length} of {components.length} components</span>
                )}
              </span>
            </div>

            {/* Right side: Action Buttons on Top */}
            <div className="flex items-center space-x-2">
              <span className="text-zinc-500 text-[11px] uppercase font-bold tracking-wider hidden sm:inline">
                Actions:
              </span>

              <button
                type="button"
                onClick={() => handleBulkMarkStatus('published')}
                disabled={selectedIds.size === 0 || isBulkProcessing}
                className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white"
                title={selectedIds.size === 0 ? 'Check one or more components to mark as published' : 'Publish selected components'}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Published</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkMarkStatus('draft')}
                disabled={selectedIds.size === 0 || isBulkProcessing}
                className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-500 text-white"
                title={selectedIds.size === 0 ? 'Check one or more components to mark as draft' : 'Set selected components to draft'}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mark as Draft</span>
              </button>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={isBulkProcessing}
                  className="px-2.5 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-mono text-xs border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Components Table */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="px-4 py-3 w-10">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="p-1 rounded text-zinc-400 hover:text-black dark:hover:text-white focus:outline-none cursor-pointer"
                      title={areAllFilteredSelected ? 'Deselect all filtered' : 'Select all filtered components'}
                    >
                      {areAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-black dark:text-white" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-3">Entry</th>
                  <th className="px-4 py-3">Component / Hardware</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Catalog ID</th>
                  <th className="px-4 py-3">Media Status</th>
                  <th className="px-4 py-3">Publication Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
                {filteredComponents.length > 0 ? (
                  filteredComponents.map((item) => {
                    const badge = getCategoryBadgeStyle(item.category);
                    const isBroken = ComponentService.hasBrokenOrMissingImage(item);
                    const isVerified = !isBroken && item.image_verification_status === 'Verified';
                    const isSelected = selectedIds.has(item.id);
                    const isPublished = (item.status || 'published') === 'published';

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-zinc-100/70 dark:bg-zinc-800/60' 
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        {/* Row Selection Checkbox */}
                        <td className="px-4 py-3.5 w-10">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectItem(item.id)}
                            className="p-1 rounded text-zinc-400 hover:text-black dark:hover:text-white focus:outline-none cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-black dark:text-white" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-300 dark:text-zinc-700" />
                            )}
                          </button>
                        </td>

                        {/* Entry Number */}
                        <td className="px-3 py-3.5 font-mono text-zinc-500 dark:text-zinc-400 font-bold">
                          {item.entry_number || 'AER-00'}
                        </td>

                        {/* Component Name & Designation */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-black dark:text-white flex items-center space-x-2">
                            <span>{item.component_name || item.name}</span>
                            {item.featured && (
                              <span title="Featured Record">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                            {item.designation || item.stageLocation || 'Aerospace Specification'}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${badge.bg}`}>
                            {item.category}
                          </span>
                        </td>

                        {/* Catalog ID */}
                        <td className="px-4 py-3.5 font-mono text-zinc-500 dark:text-zinc-400">
                          {item.catalog_id || item.id}
                        </td>

                        {/* Media Status & Thumbnail */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.component_name || item.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-zinc-400" />
                              )}
                            </div>
                            <div>
                              <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                isVerified
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                              }`}>
                                {isVerified ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                <span>{isVerified ? 'Verified' : 'Standard'}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Interactive Publication Marking Switch / Badge */}
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSingleStatus(item)}
                            className={`group inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-all cursor-pointer shadow-2xs ${
                              isPublished
                                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            }`}
                            title={`Click to mark as ${isPublished ? 'Draft' : 'Published'}`}
                          >
                            <span 
                              className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            />
                            <span>{isPublished ? 'Published' : 'Draft'}</span>
                            <span className="text-[9px] opacity-40 group-hover:opacity-100 transition-opacity">
                              ⇄ {isPublished ? 'Draft' : 'Publish'}
                            </span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => onViewComponent(item.id)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="View Component Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setManagingImageItem(item)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                              title="Change / Select Photography"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 font-mono">
                      No encyclopedia entries match the current filter or search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}


      {/* Add / Edit Encyclopedia Entry Modal */}
      <EncyclopediaEntryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveForm}
        onDelete={(id) => {
          setIsFormOpen(false);
          const target = components.find((c) => c.id === id);
          if (target) setDeletingItem(target);
        }}
        initialData={editingItem}
        availableCategories={categories.filter((c) => c !== 'All')}
      />

      {/* Manual Image Review & Replacement Modal */}
      <ImageSelectorModal
        isOpen={!!managingImageItem}
        component={managingImageItem}
        onClose={() => setManagingImageItem(null)}
        onSaveImage={async (id, updates) => {
          await onEditComponent(id, updates);
          showNotification('Component media updated successfully');
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        component={deletingItem}
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
