import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, AlertCircle, Upload, Link as LinkIcon, Trash2, Eye, 
  RefreshCw, CheckCircle2, FileText, Image as ImageIcon, Sparkles, Layers, Globe
} from 'lucide-react';
import { RocketComponent, RocketCategory, VerificationStatus, EntryStatus } from '../types/rocket';
import { ComponentService } from '../services/componentService';
import { StorageService } from '../services/storageService';
import { ImageRetrievalService, RetrievedImageResult } from '../services/imageRetrievalService';
import { EncyclopediaLivePreview } from './EncyclopediaLivePreview';

interface EncyclopediaEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<RocketComponent>) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  initialData?: RocketComponent | null;
  availableCategories?: string[];
}

const DEFAULT_CATEGORIES: string[] = [
  'Airframe, structures & flight controls',
  'Propulsion',
  'Structures',
  'Avionics',
  'Guidance & Control',
  'Electrical Systems',
  'Thermal Protection',
  'Recovery Systems'
];

export const EncyclopediaEntryFormModal: React.FC<EncyclopediaEntryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  availableCategories
}) => {
  const isEditing = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute all available categories from database / parent
  const categoryOptions = React.useMemo(() => {
    const set = new Set<string>();
    if (availableCategories && availableCategories.length > 0) {
      availableCategories.forEach((c) => set.add(c));
    } else {
      DEFAULT_CATEGORIES.forEach((c) => set.add(c));
    }
    if (initialData?.category) {
      set.add(initialData.category);
    }
    return Array.from(set);
  }, [availableCategories, initialData?.category]);

  // Active view on mobile (Form vs Live Preview)
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Form State
  const [entryNumber, setEntryNumber] = useState('');
  const [componentName, setComponentName] = useState('');
  const [category, setCategory] = useState('Airframe, structures & flight controls');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [catalogId, setCatalogId] = useState('');
  const [catalogIdManualEdit, setCatalogIdManualEdit] = useState(false);

  // Content Sections
  const [definitionDescription, setDefinitionDescription] = useState('');
  const [purposeEngineeringValue, setPurposeEngineeringValue] = useState('');
  const [operatingPrinciple, setOperatingPrinciple] = useState('');
  const [locationInstallationContext, setLocationInstallationContext] = useState('');
  const [applicationsOperatingContext, setApplicationsOperatingContext] = useState('');
  const [interfacesSystemConnections, setInterfacesSystemConnections] = useState('');
  const [identificationVerificationGuidance, setIdentificationVerificationGuidance] = useState('');
  const [safetyLimitations, setSafetyLimitations] = useState('');
  const [technicalReferenceGuidance, setTechnicalReferenceGuidance] = useState('');

  // Image Source Mode & Data
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'url'>('url');
  const [uploadedImageData, setUploadedImageData] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [urlImageError, setUrlImageError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [candidateList, setCandidateList] = useState<RetrievedImageResult[]>([]);
  const [searchUrlWarning, setSearchUrlWarning] = useState<string | null>(null);

  // Image Metadata
  const [imageTitle, setImageTitle] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [imageSource, setImageSource] = useState('');
  const [imageSourceUrl, setImageSourceUrl] = useState('');
  const [imageVerificationStatus, setImageVerificationStatus] = useState<VerificationStatus>('Verified');
  const [imageVerifiedAt, setImageVerifiedAt] = useState('');

  // Administrative Lifecycle
  const [reviewDate, setReviewDate] = useState('');
  const [featured, setFeatured] = useState(false);

  // Validation & Dirtiness
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Populate or Reset Form
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setEntryNumber(initialData.entry_number || '001');
      setComponentName(initialData.component_name || initialData.name || '');
      
      const cat = initialData.category || 'Airframe, structures & flight controls';
      if (DEFAULT_CATEGORIES.includes(cat)) {
        setCategory(cat);
        setIsCustomCat(false);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setIsCustomCat(true);
        setCustomCategory(cat);
      }

      setCatalogId(initialData.catalog_id || '');
      setCatalogIdManualEdit(true);

      setDefinitionDescription(initialData.definition_description || initialData.overview || '');
      setPurposeEngineeringValue(initialData.purpose_engineering_value || initialData.purpose || '');
      setOperatingPrinciple(initialData.operating_principle || initialData.operatingPrinciples || '');
      setLocationInstallationContext(initialData.location_installation_context || initialData.stageLocation || '');
      setApplicationsOperatingContext(initialData.applications_operating_context || '');
      setInterfacesSystemConnections(initialData.interfaces_system_connections || '');
      setIdentificationVerificationGuidance(initialData.identification_verification_guidance || '');
      setSafetyLimitations(initialData.safety_limitations || '');
      setTechnicalReferenceGuidance(initialData.technical_reference_guidance || '');

      // Image selection
      if (initialData.image_storage_path || (initialData.image_url && !initialData.image_url.startsWith('http'))) {
        setImageSourceMode('upload');
        const resolved = StorageService.resolveComponentImageUrl(initialData);
        setUploadedImageData(resolved || initialData.image_storage_path || null);
        setImageUrl('');
      } else if (initialData.image_url || initialData.imageUrl) {
        setImageSourceMode('url');
        setImageUrl(initialData.image_url || initialData.imageUrl || '');
        setUploadedImageData(null);
      } else {
        setImageSourceMode('url');
        setImageUrl('');
        setUploadedImageData(null);
      }

      setImageTitle(initialData.image_title || '');
      setImageCaption(initialData.image_caption || '');
      setImageAltText(initialData.image_alt_text || '');
      const rawSource = (initialData.image_source || '').trim();
      setImageSource(rawSource);
      setImageSourceUrl(initialData.image_source_url || '');
      setImageVerificationStatus(initialData.image_verification_status || 'Verified');
      setImageVerifiedAt(initialData.image_verified_at || new Date().toISOString().slice(0, 10));

      setReviewDate(initialData.review_date || new Date().toISOString().slice(0, 10));
      setFeatured(initialData.featured ?? false);
      setIsDirty(false);
    } else {
      // New Entry Defaults
      const autoNum = ComponentService.getNextEntryNumber();
      setEntryNumber(autoNum);
      setComponentName('');
      setCategory('Airframe, structures & flight controls');
      setIsCustomCat(false);
      setCustomCategory('');
      setCatalogId('');
      setCatalogIdManualEdit(false);

      setDefinitionDescription('');
      setPurposeEngineeringValue('');
      setOperatingPrinciple('');
      setLocationInstallationContext('');
      setApplicationsOperatingContext('');
      setInterfacesSystemConnections('');
      setIdentificationVerificationGuidance('');
      setSafetyLimitations('');
      setTechnicalReferenceGuidance('');

      setImageSourceMode('url');
      setUploadedImageData(null);
      setImageUrl('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80');
      setImageTitle('');
      setImageCaption('');
      setImageAltText('');
      setImageSource('');
      setImageSourceUrl('');
      setImageVerificationStatus('Verified');
      setImageVerifiedAt(new Date().toISOString().slice(0, 10));

      setReviewDate(new Date().toISOString().slice(0, 10));
      setFeatured(false);
      setIsDirty(false);
    }
    setSelectedImageFile(null);
    setIsUploadingImage(false);
    setErrors({});
    setUrlImageError(false);
    setUploadError(null);
  }, [isOpen, initialData]);

  // Auto-generate suggested catalog ID if user hasn't manually overridden it
  const handleComponentNameChange = (val: string) => {
    setComponentName(val);
    setIsDirty(true);
    if (!catalogIdManualEdit) {
      const suggested = ComponentService.suggestCatalogId(val);
      setCatalogId(suggested);
    }
  };

  const handleCatalogIdChange = (val: string) => {
    setCatalogId(val.toLowerCase());
    setCatalogIdManualEdit(true);
    setIsDirty(true);
  };

  // File Upload Handler (Option A)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Accepted formats: JPG, JPEG, PNG, WebP.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    setSelectedImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImageData(reader.result);
        setImageSourceMode('upload');
        setIsDirty(true);
        if (!imageTitle) {
          setImageTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file from device.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveUploadedImage = () => {
    setUploadedImageData(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsDirty(true);
  };

  const handleAutoFindImage = async () => {
    const query = componentName.trim();
    if (!query) {
      alert('Please enter a component name in Section 01 before searching archives.');
      return;
    }
    setIsAutoSearching(true);
    try {
      const candidates = await ImageRetrievalService.retrieveCandidateImages(
        { component_name: query, category: isCustomCat ? customCategory : category },
        6
      );
      setCandidateList(candidates);
      if (candidates.length > 0) {
        const top = candidates[0];
        setImageUrl(top.imageUrl);
        setImageTitle(top.title);
        setImageCaption(top.caption);
        setImageSource(top.source);
        setImageSourceUrl(top.sourceUrl);
        setImageVerificationStatus('Verified');
        setImageVerifiedAt(top.verifiedAt);
        setUrlImageError(false);
        setSearchUrlWarning(null);
        setIsDirty(true);
      }
    } catch (err) {
      console.warn('Auto search failed:', err);
    } finally {
      setIsAutoSearching(false);
    }
  };

  // Determine active preview image based on active source mode
  const currentActiveImage = imageSourceMode === 'upload' ? uploadedImageData : imageUrl;

  // Real-time preview object representation
  const liveEntryData: Partial<RocketComponent> = {
    entry_number: entryNumber,
    component_name: componentName || 'Fuselage',
    category: isCustomCat ? customCategory || 'Custom Category' : category,
    catalog_id: catalogId || 'fuselage',
    definition_description: definitionDescription,
    purpose_engineering_value: purposeEngineeringValue,
    operating_principle: operatingPrinciple,
    location_installation_context: locationInstallationContext,
    applications_operating_context: applicationsOperatingContext,
    interfaces_system_connections: interfacesSystemConnections,
    identification_verification_guidance: identificationVerificationGuidance,
    safety_limitations: safetyLimitations,
    technical_reference_guidance: technicalReferenceGuidance,
    image_storage_path: imageSourceMode === 'upload' ? uploadedImageData : null,
    image_url: imageSourceMode === 'url' ? imageUrl : null,
    image_title: imageTitle,
    image_caption: imageCaption,
    image_alt_text: imageAltText,
    image_source: imageSource,
    image_source_url: imageSourceUrl,
    image_verification_status: imageVerificationStatus,
    image_verified_at: imageVerifiedAt,
    status: initialData?.status || 'draft',
    review_date: reviewDate,
    featured: featured
  };

  // Validation
  const validateForm = (targetStatus: EntryStatus): boolean => {
    const newErrors: Record<string, string> = {};

    if (!componentName.trim()) {
      newErrors.component_name = 'Component Name is required.';
    }

    if (!catalogId.trim()) {
      newErrors.catalog_id = 'Catalog ID is required.';
    } else {
      const isUnique = ComponentService.isCatalogIdUnique(catalogId.trim(), initialData?.id);
      if (!isUnique) {
        newErrors.catalog_id = `Catalog ID "${catalogId.trim()}" is already in use by another entry.`;
      }
    }

    const effectiveCategory = isCustomCat ? customCategory.trim() : category;
    if (!effectiveCategory) {
      newErrors.category = 'Category is required.';
    }

    // If publishing, ensure key core definitions are provided
    if (targetStatus === 'published') {
      if (!definitionDescription.trim()) {
        newErrors.definition_description = 'Definition and description is required before publishing.';
      }
      if (!purposeEngineeringValue.trim()) {
        newErrors.purpose_engineering_value = 'Purpose and engineering value is required before publishing.';
      }
      if (!operatingPrinciple.trim()) {
        newErrors.operating_principle = 'Operating principle is required before publishing.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save handler (Draft vs Published)
  const handleSave = async (targetStatus: EntryStatus) => {
    if (!validateForm(targetStatus)) {
      return;
    }

    let finalStoredPath = initialData?.image_storage_path || null;
    let finalImageUrl = imageSourceMode === 'url' ? imageUrl.trim() : (initialData?.image_url || null);

    if (imageSourceMode === 'upload') {
      if (selectedImageFile) {
        setIsUploadingImage(true);
        try {
          const uploadRes = await StorageService.uploadComponentImage(selectedImageFile, catalogId || entryNumber);
          if (uploadRes.success) {
            finalStoredPath = uploadRes.storagePath || null;
            finalImageUrl = uploadRes.publicUrl || uploadRes.signedUrl || uploadedImageData;
          } else {
            finalStoredPath = uploadedImageData;
            finalImageUrl = uploadedImageData;
          }
        } catch {
          finalStoredPath = uploadedImageData;
          finalImageUrl = uploadedImageData;
        } finally {
          setIsUploadingImage(false);
        }
      } else {
        // Keeping existing uploaded file without re-uploading
        finalStoredPath = initialData?.image_storage_path || null;
        finalImageUrl = StorageService.resolveImageUrl(initialData?.image_url || uploadedImageData, finalStoredPath);
      }
    }

    const effectiveCategory = isCustomCat ? customCategory.trim() : category;

    await onSave({
      entry_number: entryNumber.trim() || '001',
      component_name: componentName.trim(),
      category: effectiveCategory,
      catalog_id: catalogId.trim().toLowerCase(),
      definition_description: definitionDescription.trim(),
      purpose_engineering_value: purposeEngineeringValue.trim(),
      operating_principle: operatingPrinciple.trim(),
      location_installation_context: locationInstallationContext.trim(),
      applications_operating_context: applicationsOperatingContext.trim(),
      interfaces_system_connections: interfacesSystemConnections.trim(),
      identification_verification_guidance: identificationVerificationGuidance.trim(),
      safety_limitations: safetyLimitations.trim(),
      technical_reference_guidance: technicalReferenceGuidance.trim(),
      image_storage_path: finalStoredPath,
      image_url: finalImageUrl,
      image_title: imageTitle.trim() || undefined,
      image_caption: imageCaption.trim() || undefined,
      image_alt_text: imageAltText.trim() || undefined,
      image_source: imageSource.trim() || undefined,
      image_source_url: imageSourceUrl.trim() || undefined,
      image_verification_status: imageVerificationStatus,
      image_verified_at: imageVerifiedAt || undefined,
      status: targetStatus,
      review_date: reviewDate || undefined,
      featured: featured
    });

    setIsDirty(false);
    onClose();
  };

  // Safe Exit Handling
  const handleAttemptClose = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="w-full max-w-7xl my-4 sm:my-8 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white dark:text-black font-mono text-xs uppercase tracking-widest bg-black dark:bg-white px-2 py-0.5 rounded font-bold">
                {isEditing ? 'EDIT ENTRY' : 'NEW ENCYCLOPEDIA ENTRY'}
              </span>
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                Aerospace Science & Engineering Taxonomy
              </span>
            </div>
            <div className="flex items-center space-x-3 mt-1 flex-wrap gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                {isEditing ? `Edit: ${initialData?.component_name || initialData?.name}` : 'Add Encyclopedia Entry'}
              </h2>
              {/* Header Quick Toggle Badge */}
              <button
                type="button"
                onClick={() => {
                  setFeatured(!featured);
                  setIsDirty(true);
                }}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  featured
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
                }`}
                title="Toggle Featured on Homepage"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{featured ? '★ FEATURED ON HOME' : '☆ NOT FEATURED'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mobile View Toggle */}
            <div className="lg:hidden flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 font-semibold ${activeTab === 'form' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                Form
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 font-semibold ${activeTab === 'preview' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                Live Preview
              </button>
            </div>

            <button
              onClick={handleAttemptClose}
              className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Error Notice if any */}
        {Object.keys(errors).length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-zinc-100 dark:bg-zinc-950 border border-black dark:border-zinc-700 rounded-lg text-xs font-mono text-black dark:text-white flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>Please review highlighted fields before proceeding: {Object.values(errors)[0]}</span>
          </div>
        )}

        {/* Two-Column Body: Form on Left, Live Preview on Right */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
          {/* Left Column: Structured Form (7 Cols on wide screens) */}
          <div className={`lg:col-span-7 overflow-y-auto p-6 space-y-8 bg-white dark:bg-zinc-900 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            
            {/* TOP POSITION: Homepage Presentation Featured Highlights Toggle */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              featured 
                ? 'bg-zinc-950 dark:bg-black text-white border-black dark:border-zinc-600 shadow-md' 
                : 'bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
            }`}>
              <label htmlFor="top-featured-checkbox" className="flex items-center justify-between cursor-pointer gap-4">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    featured 
                      ? 'bg-white dark:bg-zinc-900 text-black dark:text-white border-white dark:border-zinc-700' 
                      : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className={`font-mono text-sm font-bold uppercase tracking-tight ${featured ? 'text-white' : 'text-black dark:text-white'}`}>
                        Feature on Homepage Highlights
                      </span>
                      {featured ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white dark:bg-zinc-800 text-black dark:text-white rounded border border-transparent dark:border-zinc-700">
                          ★ Featured Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-200/80 dark:bg-zinc-800 rounded border border-transparent dark:border-zinc-700">
                          Standard Catalog
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${featured ? 'text-zinc-300 dark:text-zinc-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      Showcase this flight hardware component in the curated highlights on the AERION homepage.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <input
                    type="checkbox"
                    id="top-featured-checkbox"
                    checked={featured}
                    onChange={(e) => {
                      setFeatured(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="h-5 w-5 rounded border-2 border-zinc-400 dark:border-zinc-600 text-black dark:text-white focus:ring-black dark:focus:ring-white accent-black dark:accent-white cursor-pointer"
                  />
                  <span className={`font-mono text-xs font-bold uppercase hidden sm:inline ${featured ? 'text-white' : 'text-black dark:text-white'}`}>
                    {featured ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </label>
            </div>

            {/* Section 1: Basic Information */}
            <section className="space-y-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-black dark:text-white" />
                  <span>01 / Basic Information & Catalog Identification</span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Universal taxonomic identifiers and sequential catalog registers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Entry Number */}
                <div className="space-y-1">
                  <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                    Entry Number <span className="text-zinc-400 dark:text-zinc-500 font-normal">(Auto-generated)</span>
                  </label>
                  <input
                    type="text"
                    value={entryNumber}
                    onChange={(e) => {
                      setEntryNumber(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="001"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-xs focus:outline-none focus:border-black dark:focus:border-white"
                  />
                </div>

                {/* Component Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                    Component Name <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={componentName}
                    onChange={(e) => handleComponentNameChange(e.target.value)}
                    placeholder="e.g. Fuselage or Wing"
                    className={`w-full px-3 py-2 bg-white dark:bg-zinc-950 border rounded-lg text-black dark:text-white text-xs font-medium focus:outline-none focus:border-black dark:focus:border-white ${
                      errors.component_name ? 'border-red-600 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  />
                  {errors.component_name && (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-mono block">{errors.component_name}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                    Category <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  {!isCustomCat ? (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === 'Other') {
                          setIsCustomCat(true);
                        } else {
                          setCategory(e.target.value);
                        }
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-xs focus:outline-none focus:border-black dark:focus:border-white"
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat} className="bg-white dark:bg-zinc-900 text-black dark:text-white">
                          {cat}
                        </option>
                      ))}
                      <option value="Other" className="bg-white dark:bg-zinc-900 text-black dark:text-white">+ Enter Custom Category...</option>
                    </select>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => {
                          setCustomCategory(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="e.g. Aerothermodynamics & Hypersonics"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-xs focus:outline-none focus:border-black dark:focus:border-white"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomCat(false)}
                        className="p-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                        title="Back to list"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                  {errors.category && (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-mono block">{errors.category}</span>
                  )}
                </div>

                {/* Catalog ID */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                      Catalog ID <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Unique lowercase ID</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={catalogId}
                    onChange={(e) => handleCatalogIdChange(e.target.value)}
                    placeholder="e.g. fuselage"
                    className={`w-full px-3 py-2 bg-white dark:bg-zinc-950 border rounded-lg text-black dark:text-white font-mono text-xs focus:outline-none focus:border-black dark:focus:border-white ${
                      errors.catalog_id ? 'border-red-600 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  />
                  {errors.catalog_id && (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-mono block">{errors.catalog_id}</span>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Technical Definitions & Engineering Principles */}
            <section className="space-y-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-black dark:text-white" />
                  <span>02 / Definition, Purpose & Operating Principles</span>
                </h3>
              </div>

              {/* Definition and description */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  Definition and description <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={definitionDescription}
                  onChange={(e) => {
                    setDefinitionDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Primary body shell that carries crew, passengers, payload, and systems..."
                  className={`w-full px-3 py-2 bg-white dark:bg-zinc-950 border rounded-lg text-black dark:text-white text-xs leading-relaxed focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500 ${
                    errors.definition_description ? 'border-red-600 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                  }`}
                />
              </div>

              {/* Purpose and engineering value */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  Purpose and engineering value <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={purposeEngineeringValue}
                  onChange={(e) => {
                    setPurposeEngineeringValue(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Provides the main load path and encloses equipment..."
                  className={`w-full px-3 py-2 bg-white dark:bg-zinc-950 border rounded-lg text-black dark:text-white text-xs leading-relaxed focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500 ${
                    errors.purpose_engineering_value ? 'border-red-600 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                  }`}
                />
              </div>

              {/* Operating principle — how it works */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  Operating principle — how it works <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={operatingPrinciple}
                  onChange={(e) => {
                    setOperatingPrinciple(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Skin, frames, stringers, and bulkheads share bending, shear, pressure, and torsion loads..."
                  className={`w-full px-3 py-2 bg-white dark:bg-zinc-950 border rounded-lg text-black dark:text-white text-xs leading-relaxed focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500 ${
                    errors.operating_principle ? 'border-red-600 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                  }`}
                />
              </div>
            </section>

            {/* Section 3: Context, Applications & Interfaces */}
            <section className="space-y-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-black dark:text-white" />
                  <span>03 / Location, Applications & System Interfaces</span>
                </h3>
              </div>

              {/* Location and installation context */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  Location and installation context
                </label>
                <textarea
                  rows={2}
                  value={locationInstallationContext}
                  onChange={(e) => {
                    setLocationInstallationContext(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Aircraft center body from nose to tail..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white text-xs leading-relaxed focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>

              {/* Applications and operating context */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  Applications and operating context
                </label>
                <textarea
                  rows={2}
                  value={applicationsOperatingContext}
                  onChange={(e) => {
                    setApplicationsOperatingContext(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Operational flight envelopes, vehicle classes, altitude regimes..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white text-xs leading-relaxed focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>

              {/* Interfaces and system connections */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  Interfaces and system connections
                </label>
                <textarea
                  rows={2}
                  value={interfacesSystemConnections}
                  onChange={(e) => {
                    setInterfacesSystemConnections(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Structural attachments, electrical harnesses, hydraulic feeds..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white text-xs leading-relaxed focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>
            </section>

            {/* Section 4: Verification, Safety & Standards */}
            <section className="space-y-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
                  <span>04 / Verification, Safety & Technical Reference</span>
                </h3>
              </div>

              {/* Identification and verification guidance */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  Identification and verification guidance
                </label>
                <textarea
                  rows={2}
                  value={identificationVerificationGuidance}
                  onChange={(e) => {
                    setIdentificationVerificationGuidance(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Part numbers, eddy current inspections, ultrasonic testing methods..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white text-xs leading-relaxed focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>

              {/* Safety and limitations */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  Safety and limitations
                </label>
                <textarea
                  rows={2}
                  value={safetyLimitations}
                  onChange={(e) => {
                    setSafetyLimitations(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Fatigue life limits, maximum differential cabin pressure, dynamic limits..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white text-xs leading-relaxed focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>

              {/* Technical reference guidance */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  Technical reference guidance
                </label>
                <textarea
                  rows={2}
                  value={technicalReferenceGuidance}
                  onChange={(e) => {
                    setTechnicalReferenceGuidance(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="FAA Handbooks, AIAA design manuals, NASA Technical Reports..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white text-xs leading-relaxed focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>
            </section>

            {/* Section 5: Image Upload and Image Link */}
            <section className="space-y-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-black dark:text-white" />
                    <span>05 / Visual Hardware Documentation</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Attach reference imagery via local device upload or external URL.
                  </p>
                </div>

                {/* Source Selection Toggle */}
                <div className="inline-flex rounded-lg border border-zinc-300 dark:border-zinc-700 p-0.5 bg-zinc-100 dark:bg-zinc-800 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setImageSourceMode('upload');
                      setIsDirty(true);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1 font-semibold ${
                      imageSourceMode === 'upload' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageSourceMode('url');
                      setIsDirty(true);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1 font-semibold ${
                      imageSourceMode === 'url' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Image URL</span>
                  </button>
                </div>
              </div>

              {/* Option A: Upload from Device */}
              {imageSourceMode === 'upload' && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-black dark:text-white uppercase">
                      Option A: Device Image Upload
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                      JPG, JPEG, PNG, WebP (max 10MB)
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {uploadedImageData ? (
                    <div className="space-y-3">
                      <div className="relative w-full h-44 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        <img
                          src={uploadedImageData}
                          alt="Uploaded hardware preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center space-x-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Image loaded into persistent storage</span>
                        </span>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white font-semibold"
                          >
                            Replace Image
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveUploadedImage}
                            className="px-2.5 py-1 text-xs font-mono bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-zinc-500 rounded-lg p-6 text-center cursor-pointer transition-colors bg-white dark:bg-zinc-900 space-y-2"
                    >
                      <Upload className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-500" />
                      <div className="text-xs font-bold text-black dark:text-white font-mono">
                        Click to select an image from your computer
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        Supports standard aerospace imagery in JPG, PNG, or WebP.
                      </p>
                    </div>
                  )}

                  {uploadError && (
                    <div className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900/50">
                      {uploadError}
                    </div>
                  )}
                </div>
              )}

              {/* Option B: Image URL */}
              {imageSourceMode === 'url' && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-black dark:text-white uppercase flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Option B: Direct Image URL or Auto-Retrieve</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoFindImage}
                      disabled={isAutoSearching}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-mono font-medium rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      <Sparkles className={`w-3 h-3 ${isAutoSearching ? 'animate-spin' : ''}`} />
                      <span>{isAutoSearching ? 'Searching Archives...' : 'Auto-Find (NASA/Wikimedia)'}</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setImageUrl(val);
                        setUrlImageError(false);
                        setIsDirty(true);
                        if (ImageRetrievalService.isInvalidOrSearchUrl(val)) {
                          setSearchUrlWarning(
                            'Warning: This appears to be a search result page, not a direct image file (.jpg, .png, etc.). Use direct image URLs or click Auto-Find.'
                          );
                        } else {
                          setSearchUrlWarning(null);
                        }
                      }}
                      placeholder="https://images.nasa.gov/... or https://upload.wikimedia.org/... (.jpg, .png)"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-xs focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>

                  {searchUrlWarning && (
                    <div className="text-xs font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-900/50 flex items-start space-x-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{searchUrlWarning}</span>
                    </div>
                  )}

                  {/* Auto-search Candidate Selection */}
                  {candidateList.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold uppercase text-zinc-600 dark:text-zinc-400">
                          Recommended Images ({candidateList.length})
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Click to select & populate
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {candidateList.map((cand, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setImageUrl(cand.imageUrl);
                              setImageSource(cand.source);
                              setImageSourceUrl(cand.sourceUrl);
                              setImageTitle(cand.title);
                              setImageCaption(cand.caption);
                              setImageAltText(cand.title);
                              setImageVerificationStatus(cand.verificationStatus);
                              setImageVerifiedAt(cand.verifiedAt);
                              setUrlImageError(false);
                              setSearchUrlWarning(null);
                              setIsDirty(true);
                            }}
                            className={`group relative cursor-pointer rounded-lg overflow-hidden border transition-all ${
                              imageUrl === cand.imageUrl
                                ? 'border-black dark:border-white ring-2 ring-black dark:ring-white'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                            }`}
                          >
                            <div className="h-24 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                              <img
                                src={cand.thumbnailUrl || cand.imageUrl}
                                alt={cand.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            </div>
                            <div className="p-1.5 bg-white/95 dark:bg-zinc-950/95 text-[10px] font-mono">
                              <div className="truncate font-semibold text-zinc-800 dark:text-zinc-200">
                                {cand.title}
                              </div>
                              <div className="flex items-center justify-between text-zinc-500 text-[9px] mt-0.5">
                                <span className="uppercase">{cand.source}</span>
                                <span className="truncate max-w-[70px]">{cand.license || 'Public Domain'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {imageUrl && (
                    <div className="space-y-2">
                      <div className="relative w-full h-44 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        <img
                          src={imageUrl}
                          alt="External URL preview"
                          className="w-full h-full object-cover"
                          onError={() => setUrlImageError(true)}
                          onLoad={() => setUrlImageError(false)}
                        />
                      </div>
                      {urlImageError ? (
                        <div className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900/50">
                          Error: The provided URL could not be loaded as an image. Please verify the link.
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center space-x-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Valid external image verified</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrl('');
                              setIsDirty(true);
                            }}
                            className="text-xs font-mono text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            Clear URL
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Optional Image Metadata */}
              <div className="pt-2 space-y-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                  Image Metadata & Attribution (Optional)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] text-zinc-600 dark:text-zinc-300">Image Title</label>
                    <input
                      type="text"
                      value={imageTitle}
                      onChange={(e) => {
                        setImageTitle(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. Semi-monocoque Airframe Section"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] text-zinc-600 dark:text-zinc-300">Alt Text (Accessibility)</label>
                    <input
                      type="text"
                      value={imageAltText}
                      onChange={(e) => {
                        setImageAltText(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. Aluminum-lithium aircraft fuselage barrel"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[10px] text-zinc-600 dark:text-zinc-300">Image Caption</label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => {
                      setImageCaption(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Ring frames and longitudinal stringers visible during fuselage assembly"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] text-zinc-600 dark:text-zinc-300">Source / Attribution</label>
                    <input
                      type="text"
                      value={imageSource}
                      onChange={(e) => {
                        setImageSource(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. NASA Langley Research Center"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] text-zinc-600 dark:text-zinc-300">Source Website / Reference URL</label>
                    <input
                      type="url"
                      value={imageSourceUrl}
                      onChange={(e) => {
                        setImageSourceUrl(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-black dark:text-white font-mono focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] text-zinc-600 dark:text-zinc-300">Verification Status</label>
                    <select
                      value={imageVerificationStatus}
                      onChange={(e) => {
                        setImageVerificationStatus(e.target.value as VerificationStatus);
                        setIsDirty(true);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-black dark:text-white font-mono focus:outline-none focus:border-black dark:focus:border-white"
                    >
                      <option value="Verified">Verified</option>
                      <option value="Unverified">Unverified</option>
                      <option value="Pending Review">Pending Review</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] text-zinc-600 dark:text-zinc-300">Date Verified</label>
                    <input
                      type="date"
                      value={imageVerifiedAt}
                      onChange={(e) => {
                        setImageVerifiedAt(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-black dark:text-white font-mono focus:outline-none focus:border-black dark:focus:border-white"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Administrative Review Date & Presentation Controls */}
            <section className="space-y-4 pt-2">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-black dark:text-white" />
                  <span>06 / Review & Publishing Controls</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-mono text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold">
                    Scheduled / Latest Review Date
                  </label>
                  <input
                    type="date"
                    value={reviewDate}
                    onChange={(e) => {
                      setReviewDate(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-xs focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold">
                    Homepage Presentation <span className="text-zinc-500 dark:text-zinc-400 font-normal">(Synced with top)</span>
                  </label>
                  <label className="flex items-center space-x-3 p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => {
                        setFeatured(e.target.checked);
                        setIsDirty(true);
                      }}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-black dark:text-white focus:ring-black dark:focus:ring-white accent-black dark:accent-white"
                    />
                    <div className="space-y-0.5">
                      <span className="block font-mono text-xs font-bold text-black dark:text-white flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
                        <span>Feature on Homepage Highlights</span>
                      </span>
                      <span className="block text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
                        {featured ? '★ Active on Homepage (Enabled)' : 'Standard catalog listing (Disabled)'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Real-Time Live Preview (5 Cols on wide screens) */}
          <div className={`lg:col-span-5 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950 space-y-4 ${activeTab === 'form' ? 'hidden lg:block' : 'block'}`}>
            <div className="sticky top-0 bg-zinc-50 dark:bg-zinc-950 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
              <span className="font-mono text-xs uppercase font-bold text-black dark:text-white flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Published Format Preview</span>
              </span>
              <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                Updates in real-time
              </span>
            </div>

            <EncyclopediaLivePreview 
              data={liveEntryData}
              activeImageSource={currentActiveImage}
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-black dark:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 transition-colors"
            >
              Cancel
            </button>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (initialData?.id) {
                    onDelete(initialData.id);
                  }
                }}
                className="px-3 py-2 rounded-lg text-xs font-mono font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/50 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entry</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={isUploadingImage}
              onClick={() => handleSave('draft')}
              className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={isUploadingImage}
              onClick={() => handleSave('published')}
              className="px-5 py-2 rounded-lg text-xs font-mono font-bold text-white dark:text-black bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              {isUploadingImage ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading & Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Save & Publish Updates' : 'Publish Entry'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Accidental Data Loss Prompt */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-5 max-w-sm w-full space-y-3 shadow-xl">
              <h3 className="font-bold text-black dark:text-white text-sm">Discard Unsaved Changes?</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                You have unsaved edits in this encyclopedia form. Closing now will discard your modifications.
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="px-3 py-1.5 text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-black dark:text-white rounded"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-semibold bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
