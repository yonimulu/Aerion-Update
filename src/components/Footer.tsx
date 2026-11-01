import { ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black text-zinc-600 dark:text-zinc-400 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Branding & Philosophy */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-black border border-zinc-300 dark:border-zinc-800 overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                <img 
                  src="/assets/aistudio/Gemini_Generated_Image_bjq68cbjq68cbjq6_1f096957.jfif" 
                  alt="Aerion Aerospace Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-zinc-950 dark:text-white text-sm tracking-widest font-mono">
                AERION
              </span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed max-w-md">
              An open educational aerospace engineering repository designed for STEM students, rocketry competition teams, and space technology enthusiasts to explore multi-stage launch vehicle subsystems, operating physics, and flight hardware specs.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-zinc-950 dark:text-white font-mono text-xs uppercase tracking-wider font-bold">
              Catalog Navigation
            </h4>
            <ul className="space-y-1.5 font-mono text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  Overview & Index
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore')}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  All Components Catalog
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  Subsystem Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  Hardware Management (Admin)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  About the Project
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Technical References */}
          <div className="space-y-2">
            <h4 className="text-zinc-950 dark:text-white font-mono text-xs uppercase tracking-wider font-bold">
              Aerospace Repositories
            </h4>
            <ul className="space-y-1.5 font-mono text-xs">
              <li>
                <a
                  href="https://ntrs.nasa.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black dark:hover:text-white transition-colors inline-flex items-center space-x-1"
                >
                  <span>NASA Technical Reports (NTRS)</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.aiaa.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black dark:hover:text-white transition-colors inline-flex items-center space-x-1"
                >
                  <span>AIAA Aerospace Papers</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.faa.gov/space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black dark:hover:text-white transition-colors inline-flex items-center space-x-1"
                >
                  <span>FAA Commercial Space</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 font-mono">
          <p>© {new Date().getFullYear()} Aerion. Educational reference only.</p>
          <p className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-black dark:bg-white"></span>
            <span>Educational Reference Catalog</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
