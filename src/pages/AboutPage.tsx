import React from 'react';
import { Info, BookOpen, Compass, Terminal, ExternalLink } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const glossary = [
    {
      term: 'Isp (Specific Impulse)',
      definition: 'A fundamental measure of rocket engine propellant efficiency, measured in seconds. Represents total impulse delivered per unit mass of consumed propellant.'
    },
    {
      term: 'GNC (Guidance, Navigation & Control)',
      definition: 'Guidance calculates the desired flight path; Navigation measures current position and velocity; Control steers actuators (gimbals, fins, thrusters) to eliminate error.'
    },
    {
      term: 'TMR (Triple-Modular Redundancy)',
      definition: 'Fault-tolerant computer architecture executing calculations across three parallel channels with hardware voting to guard against cosmic radiation single-event upsets.'
    },
    {
      term: 'COPV (Composite Overwrapped Pressure Vessel)',
      definition: 'A lightweight thin metallic or polymer liner overwrapped with carbon fiber filaments, used to store helium or nitrogen at pressures exceeding 300 atmospheres.'
    },
    {
      term: 'Max-Q (Maximum Dynamic Pressure)',
      definition: 'The point during atmospheric ascent where aerodynamic mechanical stress on the rocket structure reaches its absolute peak due to velocity and atmospheric density.'
    },
    {
      term: 'PICA (Phenolic-Impregnated Carbon Ablator)',
      definition: 'A porous carbon matrix soaked in phenolic resin that absorbs extreme hypersonic reentry friction via chemical ablation and boundary-layer gas release.'
    },
    {
      term: 'RCS (Reaction Control System)',
      definition: 'Small cold-gas or hypergolic thrusters clustered in orthogonal vectors to provide pitch, roll, and yaw torque in space vacuum where aerodynamic rudders have no effect.'
    },
    {
      term: 'Regenerative Cooling',
      definition: 'Pumping cryogenic fuel (such as liquid hydrogen or methane) through micro-channels within the rocket nozzle wall to prevent structural melting before feeding into the chamber.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 bg-transparent transition-colors duration-200">
      {/* Page Header */}
      <div className="space-y-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-black border border-zinc-300 dark:border-zinc-800 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
            <img 
              src="/assets/aistudio/Gemini_Generated_Image_bjq68cbjq68cbjq6_1f096957.jfif" 
              alt="Aerion Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs uppercase tracking-widest font-semibold">
              <Info className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Educational Mission & Documentation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
              About Aerion
            </h1>
          </div>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl leading-relaxed">
          An open educational reference platform designed to help students, aerospace engineering clubs, and space enthusiasts study the inner anatomy of orbital launch vehicles.
        </p>
      </div>

      {/* Mission & Purpose Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 text-black dark:text-white font-mono text-xs uppercase tracking-wider font-bold">
            <BookOpen className="w-4 h-4" />
            <span>Educational Purpose & Statement</span>
          </div>
          <h2 className="text-xl font-bold text-black dark:text-white">
            Demystifying Aerospace Engineering Hardware
          </h2>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-3 leading-relaxed">
            <p>
              Rocket science is often perceived as an impenetrable black box. In reality, modern space launch vehicles are composed of distinct mechanical, electrical, thermal, and software sub-assemblies governed by classical thermodynamics, fluid mechanics, and orbital physics.
            </p>
            <p>
              The primary purpose of <strong className="text-black dark:text-white">Aerion</strong> is to provide clear, accurate, and accessible technical documentation for each hardware component. Students can study the real engineering compromises between weight, structural strength, chamber pressure, and thermal survivability.
            </p>
            <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono text-black dark:text-zinc-200">
              Disclaimer: All data presented is compiled strictly for learning, academic research, and aerospace STEM educational reference.
            </div>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 text-black dark:text-white font-mono text-xs uppercase tracking-wider font-bold">
            <Terminal className="w-4 h-4" />
            <span>Interactive Catalog Architecture</span>
          </div>
          <h2 className="text-xl font-bold text-black dark:text-white">
            Engineering Systems & Data Structure
          </h2>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-3 leading-relaxed">
            <p>
              Each hardware entry represents a physical aerospace assembly analyzed across its primary operating parameters, structural interfaces, thermal boundaries, and flight safety constraints.
            </p>
            <p>
              The catalog is organized around standard aerospace engineering subsystems, giving students and researchers immediate access to verified specifications, engineering schematics, and launch vehicle documentation.
            </p>
            <ul className="space-y-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-300 pt-1">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                <span>Multi-stage launch vehicle subsystem classification</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                <span>Operating principles and material specifications</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                <span>Direct links to verified aerospace research archives</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Aerospace Engineering Glossary */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-black dark:text-white font-mono text-xs uppercase tracking-wider font-bold">
            <Compass className="w-4 h-4" />
            <span>Reference Glossary</span>
          </div>
          <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
            Key Aerospace Terminology & Physics Acronyms
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Common acronyms and engineering concepts referenced across rocket component specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {glossary.map((item) => (
            <div
              key={item.term}
              className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 hover:border-black dark:hover:border-zinc-600 transition-colors"
            >
              <div className="font-mono text-xs font-bold text-black dark:text-white">
                {item.term}
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Reference Repositories */}
      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-black dark:text-white font-mono uppercase tracking-wider text-xs">
          Recommended Further Reading & STEM Resources
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <a
            href="https://ntrs.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-600 transition-colors space-y-1 group shadow-xs"
          >
            <div className="text-black dark:text-white group-hover:underline font-bold flex items-center justify-between">
              <span>NASA NTRS</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-sans text-xs">
              Hundreds of thousands of public-domain NASA technical reports and technical memoranda.
            </p>
          </a>

          <a
            href="https://www.aiaa.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-600 transition-colors space-y-1 group shadow-xs"
          >
            <div className="text-black dark:text-white group-hover:underline font-bold flex items-center justify-between">
              <span>AIAA Aerospace</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-sans text-xs">
              American Institute of Aeronautics and Astronautics peer-reviewed journals and standards.
            </p>
          </a>

          <a
            href="https://www.faa.gov/space"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-600 transition-colors space-y-1 group shadow-xs"
          >
            <div className="text-black dark:text-white group-hover:underline font-bold flex items-center justify-between">
              <span>FAA Commercial Space</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-sans text-xs">
              Launch safety regulations, flight license guidelines, and orbital debris mitigation standards.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};
