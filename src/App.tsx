/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ComponentDetailsPage } from './pages/ComponentDetailsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AdminPage } from './pages/AdminPage';
import { AboutPage } from './pages/AboutPage';
import { ComponentService } from './services/componentService';
import { RecentSearchService } from './services/recentSearchService';
import { RocketCategory, RocketComponent, EntryStatus } from './types/rocket';
import { FloatingRocketPartsBackground } from './components/FloatingRocketPartsBackground';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [components, setComponents] = useState<RocketComponent[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Classic Night Mode state with localStorage persistence
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aerion_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Keep <html> element class aligned with night mode state
  useEffect(() => {
    if (isNightMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aerion_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aerion_theme', 'light');
    }
  }, [isNightMode]);

  const toggleNightMode = () => {
    setIsNightMode((prev) => !prev);
  };

  const refreshData = async () => {
    try {
      const [compResult, catList] = await Promise.all([
        ComponentService.fetchComponents(),
        ComponentService.fetchCategories()
      ]);
      setComponents(compResult.components);
      setCategories(catList);
    } catch (err) {
      console.warn('Data sync exception:', err);
    }
  };

  // Load components and categories on mount with live database synchronization
  useEffect(() => {
    // 1. Instant load from local persistent cache for zero layout shift
    const initialList = ComponentService.getAllComponents();
    setComponents(initialList);
    const initialCats = ComponentService.getCachedCategories();
    setCategories(initialCats);

    // 2. Query live database asynchronously in background
    refreshData();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectComponent = (id: string) => {
    setSelectedComponentId(id);
    setActiveTab('details');
    scrollToTop();
  };

  const handleNavigate = (tab: string, catFilter?: string) => {
    if (catFilter) {
      setCategoryFilter(catFilter);
    }
    setActiveTab(tab);
    scrollToTop();
  };

  const handleSearch = (query: string) => {
    if (query && query.trim()) {
      RecentSearchService.addRecentSearch(query.trim());
    }
    setSearchFilter(query);
    setActiveTab('explore');
    scrollToTop();
  };

  const handleAddComponent = async (data: Partial<RocketComponent>) => {
    await ComponentService.createComponent(data);
    await refreshData();
  };

  const handleEditComponent = async (id: string, updates: Partial<RocketComponent>) => {
    await ComponentService.updateComponent(id, updates);
    await refreshData();
  };

  const handleBulkUpdateStatus = async (ids: string[], status: EntryStatus) => {
    await ComponentService.bulkUpdateStatus(ids, status);
    await refreshData();
  };

  const handleDeleteComponent = async (id: string) => {
    await ComponentService.deleteComponent(id);
    await refreshData();
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
      setActiveTab('explore');
    }
  };

  const handleResetDefaults = async () => {
    await ComponentService.resetToDefaults();
    await refreshData();
  };

  const handleToggleFeatured = async (id: string) => {
    await ComponentService.toggleFeatured(id);
    const res = await ComponentService.fetchComponents();
    setComponents(res.components);
  };

  const currentComponent = selectedComponentId
    ? components.find((c) => c.id === selectedComponentId)
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-950 dark:text-zinc-100 flex flex-col font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-200 relative">
      {/* Subtle Aerospace Floating Rocket Parts Background Pattern */}
      <FloatingRocketPartsBackground />

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab) => handleNavigate(tab)}
        onSearchSubmit={handleSearch}
        isNightMode={isNightMode}
        onToggleNightMode={toggleNightMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 bg-transparent relative z-10 transition-colors duration-200">
        {activeTab === 'home' && (
          <HomePage
            components={components}
            categories={categories}
            onSelectComponent={handleSelectComponent}
            onNavigate={(tab, cat) => handleNavigate(tab, cat)}
            onSearch={handleSearch}
          />
        )}

        {activeTab === 'explore' && (
          <ExplorePage
            components={components}
            categories={categories}
            initialCategory={categoryFilter}
            initialSearch={searchFilter}
            onSelectComponent={handleSelectComponent}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesPage
            components={components}
            categories={categories}
            onSelectCategory={(cat: RocketCategory) => {
              setCategoryFilter(cat);
              setActiveTab('explore');
              scrollToTop();
            }}
            onSelectComponent={handleSelectComponent}
          />
        )}

        {activeTab === 'details' && (
          currentComponent ? (
            <ComponentDetailsPage
              component={currentComponent}
              onBack={() => {
                setActiveTab('explore');
                scrollToTop();
              }}
              onSelectRelated={handleSelectComponent}
              allComponents={components}
            />
          ) : (
            <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
              <h2 className="text-xl font-bold text-black dark:text-white">Component Record Not Found</h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                The requested aerospace component was removed or does not exist in local records.
              </p>
              <button
                onClick={() => handleNavigate('explore')}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Return to Component Catalog
              </button>
            </div>
          )
        )}

        {activeTab === 'admin' && (
          <AdminPage
            components={components}
            categories={categories}
            onViewComponent={handleSelectComponent}
            onAddComponent={handleAddComponent}
            onEditComponent={handleEditComponent}
            onDeleteComponent={handleDeleteComponent}
            onResetDefaults={handleResetDefaults}
            onToggleFeatured={handleToggleFeatured}
            onBulkUpdateStatus={handleBulkUpdateStatus}
          />
        )}

        {activeTab === 'about' && <AboutPage />}
      </main>

      {/* Footer */}
      <Footer onNavigate={(tab) => handleNavigate(tab)} />
    </div>
  );
}
