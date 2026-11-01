import { RocketComponent, CategoryInfo } from '../types/rocket';

export const CATEGORIES_INFO: CategoryInfo[] = [
  {
    id: 'Airframe, structures & flight controls',
    title: 'Airframe, Structures & Flight Controls',
    shortDescription: 'Primary fuselage shell, wing assemblies, control surfaces, and load-bearing structures.',
    description: 'Encompasses structural members designed to carry primary bending, torsion, shear, and pressure loads throughout the flight envelope. Integrates aerodynamics with structural integrity.',
    iconName: 'Box',
    accentColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    commonComponents: ['Fuselage Body Shell', 'Main Wing Box', 'Titanium Grid Fins', 'Control Surfaces', 'Bulkheads']
  },
  {
    id: 'Propulsion',
    title: 'Propulsion Systems',
    shortDescription: 'Engines, turbopumps, combustion chambers, and propellant feed lines.',
    description: 'The propulsion system generates thrust to overcome gravity and aerodynamic drag. It comprises high-pressure fluid machinery, regenerative cooling circuits, injector domes, and expansion nozzles operating under extreme pressures and temperatures.',
    iconName: 'Flame',
    accentColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    commonComponents: ['Liquid Rocket Engines', 'Turbopumps', 'Gas Generators', 'Gimbal Actuators', 'Propellant Injectors']
  },
  {
    id: 'Structures',
    title: 'Structural Systems',
    shortDescription: 'Primary airframe, propellant tanks, interstage adapters, and fairings.',
    description: 'Rocket structures must withstand extreme aerodynamic loads, acoustic vibrations, and internal tank pressures while remaining exceptionally lightweight. Advanced materials include orthogrid aluminum-lithium alloys and carbon fiber reinforced polymers.',
    iconName: 'Box',
    accentColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    commonComponents: ['Isogrid Propellant Tanks', 'Interstage Adapter', 'Payload Fairings', 'Thrust Structure', 'Skirt Sections']
  },
  {
    id: 'Avionics',
    title: 'Avionics & Computing',
    shortDescription: 'Flight control computers, data acquisition, telemetry, and power distribution.',
    description: 'Avionics serves as the central nervous system of the launch vehicle. It executes the guidance navigation and control (GNC) algorithms in real-time, monitors sensor telemetry, and issues commands to engine valves and steering actuators.',
    iconName: 'Cpu',
    accentColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    commonComponents: ['Flight Computers', 'Telemetry Transponders', 'Remote I/O Units', 'Power Distribution Units', 'Optical Data Bus']
  },
  {
    id: 'Guidance & Control',
    title: 'Guidance & Control',
    shortDescription: 'Inertial sensors, star trackers, grid fins, and reaction control thrusters.',
    description: 'Guidance determines the flight path required to reach the target orbital insertion. Navigation computes current state (position and velocity), and Control commands actuators (gimbal motors, thrusters, grid fins) to maintain vehicle stability.',
    iconName: 'Compass',
    accentColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    commonComponents: ['Inertial Measurement Units', 'Star Trackers', 'Grid Fins', 'Reaction Control Thrusters', 'Hydraulic Gimbal Actuators']
  },
  {
    id: 'Electrical Systems',
    title: 'Electrical Systems',
    shortDescription: 'Battery arrays, solar cells, power distribution, and pyrotechnic firing units.',
    description: 'Provides regulated, noise-isolated electrical power to flight computers, RF communication amplifiers, valving solenoids, and recovery actuators through specialized harness wiring designed to survive heavy vibration.',
    iconName: 'Zap',
    accentColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    commonComponents: ['Lithium-Ion Battery Banks', 'Bus Voltage Regulators', 'Pyrotechnic Initiators', 'Spacecraft Separation Harnesses']
  },
  {
    id: 'Thermal Protection',
    title: 'Thermal Protection',
    shortDescription: 'Ceramic tiles, ablative shields, aerogel blankets, and radiative coatings.',
    description: 'Protects the vehicle structure, payload, and sensitive avionics from extreme aerothermal heating during atmospheric ascent and hypersonic reentry (often exceeding 1,600°C), as well as cryogenic propellant boil-off.',
    iconName: 'Shield',
    accentColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    commonComponents: ['PICA-X Ablative Heat Shields', 'Ceramic Silica Tiles', 'Multi-Layer Insulation (MLI)', 'Ablative Cork Sheeting']
  },
  {
    id: 'Recovery Systems',
    title: 'Recovery Systems',
    shortDescription: 'Supersonic drogue chutes, landing legs, main parachutes, and flotation collars.',
    description: 'Systems dedicated to safely decelerating and stabilizing reusable booster stages or crew/cargo return capsules from hypersonic terminal velocity to a soft landing on land or ocean recovery platforms.',
    iconName: 'Anchor',
    accentColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    commonComponents: ['Pilot & Drogue Parachutes', 'Main Parachute Clusters', 'Carbon-Fiber Landing Legs', 'Deployable Flotation Devices']
  }
];

export const DEFAULT_FALLBACK_CATEGORIES: string[] = [
  'Airframe, structures & flight controls',
  'Propulsion',
  'Structures',
  'Avionics',
  'Guidance & Control',
  'Electrical Systems',
  'Thermal Protection',
  'Recovery Systems'
];

/**
 * Builds rich metadata for any category (standard or user-created in the database).
 */
export function buildDynamicCategoryInfo(
  categoryName: string,
  componentsInCat: RocketComponent[] = []
): CategoryInfo {
  // Check if we have predefined rich info in CATEGORIES_INFO
  const existing = CATEGORIES_INFO.find(
    (c) => c.id.toLowerCase() === categoryName.toLowerCase() ||
           c.title.toLowerCase() === categoryName.toLowerCase()
  );
  if (existing) {
    return {
      ...existing,
      id: categoryName,
      commonComponents: existing.commonComponents.length > 0 
        ? existing.commonComponents 
        : componentsInCat.map(c => c.component_name || c.name).filter(Boolean).slice(0, 5)
    };
  }

  // Guess iconName based on name keywords
  const lower = categoryName.toLowerCase();
  let iconName = 'Box';
  if (lower.includes('propul') || lower.includes('engine') || lower.includes('thrust') || lower.includes('fuel')) {
    iconName = 'Flame';
  } else if (lower.includes('avion') || lower.includes('comput') || lower.includes('soft') || lower.includes('sensor')) {
    iconName = 'Cpu';
  } else if (lower.includes('guid') || lower.includes('nav') || lower.includes('control') || lower.includes('steer')) {
    iconName = 'Compass';
  } else if (lower.includes('elect') || lower.includes('power') || lower.includes('battery') || lower.includes('solar')) {
    iconName = 'Zap';
  } else if (lower.includes('therm') || lower.includes('shield') || lower.includes('heat') || lower.includes('protect')) {
    iconName = 'Shield';
  } else if (lower.includes('recov') || lower.includes('chute') || lower.includes('land') || lower.includes('drop')) {
    iconName = 'Anchor';
  } else if (lower.includes('struct') || lower.includes('frame') || lower.includes('fairing') || lower.includes('shell') || lower.includes('airframe')) {
    iconName = 'Box';
  } else {
    iconName = 'Layers';
  }

  const sampleItems = componentsInCat.map((c) => c.component_name || c.name).filter(Boolean).slice(0, 5);

  return {
    id: categoryName,
    title: categoryName,
    shortDescription: `Subsystem components and assemblies under ${categoryName}.`,
    description: `Specialized aerospace engineering domain covering flight hardware, integration interfaces, and technical criteria for ${categoryName}.`,
    iconName,
    accentColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    commonComponents: sampleItems.length > 0 ? sampleItems : ['Flight Hardware Component']
  };
}

/**
 * Returns dynamic CategoryInfo objects for all categories present in the database.
 */
export function getCategoriesWithDetails(
  categoryNames: string[],
  components: RocketComponent[]
): CategoryInfo[] {
  return categoryNames.map((catName) => {
    const items = components.filter((c) => c.category === catName);
    return buildDynamicCategoryInfo(catName, items);
  });
}

export const INITIAL_COMPONENTS: RocketComponent[] = [
  {
    id: 'comp-fuselage',
    entry_number: '001',
    component_name: 'Fuselage',
    category: 'Airframe, structures & flight controls',
    catalog_id: 'fuselage',
    definition_description: 'Primary body shell that carries crew, passengers, payload, and integrated systems.',
    purpose_engineering_value: 'Provides the main load path and encloses flight equipment, passenger accommodations, and cargo bays while maintaining structural rigidity across extreme g-force envelopes.',
    operating_principle: 'Skin, frames, stringers, and bulkheads share bending, shear, pressure, and torsion loads through semi-monocoque construction.',
    location_installation_context: 'Aircraft and launch vehicle center body from nose cone to tail empennage / aft skirt.',
    applications_operating_context: 'Commercial airliners, space transportation systems, hypersonic testbeds, and orbital upper stages operating across subsonic to orbital flight envelopes.',
    interfaces_system_connections: 'Directly bolted and riveted to wing spar roots, empennage bulkheads, landing gear trunnions, and environmental control ducting.',
    identification_verification_guidance: 'Inspect station numbers (FS / Fuselage Stations), eddy current non-destructive evaluation (NDE) of frame-to-skin fasteners, and pressure boundary integrity sensors.',
    safety_limitations: 'Limited by maximum differential cabin/tank pressurization cycles, fatigue crack propagation limits, and acoustic buffeting thresholds during trans-sonic flight.',
    technical_reference_guidance: 'FAA Airframe & Powerplant Handbook (FAA-H-8083-31A) and AIAA Aerospace Structural Design Standards.',
    image_storage_path: null,
    image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    image_title: 'Semi-Monocoque Aerospace Fuselage Barrel Section',
    image_caption: 'Precision-machined aluminum-lithium fuselage section showing longitudinal stringers and circumferential ring frames.',
    image_alt_text: 'Aerospace fuselage barrel section under assembly in cleanroom facility',
    image_source: 'Aerospace Engineering Archive',
    image_source_url: 'https://images.unsplash.com',
    image_verification_status: 'Verified',
    image_verified_at: '2026-10-20',
    status: 'published',
    created_at: '2026-01-05T08:00:00Z',
    updated_at: '2026-02-01T12:00:00Z',
    review_date: '2026-10-25',
    featured: true,

    name: 'Fuselage',
    designation: 'AF-FUSE-01',
    shortDescription: 'Primary structural airframe shell carrying crew, payload, and critical vehicle subsystems.',
    overview: 'Primary body shell that carries crew, passengers, payload, and integrated systems.',
    purpose: 'Provides the main load path and encloses flight equipment, passenger accommodations, and cargo bays.',
    operatingPrinciples: 'Skin, frames, stringers, and bulkheads share bending, shear, pressure, and torsion loads through semi-monocoque construction.',
    facts: [
      'Semi-monocoque design distributes aerodynamic bending loads throughout the outer skin and stiffening stringers.',
      'Constructed with advanced Al-Li 2195 alloy and autoclave-cured carbon fiber composites.',
      'Must sustain cabin pressurization cycles of up to 12.0 psi without fatigue degradation.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    stageLocation: 'Aircraft & Launch Vehicle Center Body',
    typicalMaterials: 'Aluminum-Lithium 2195, Carbon Fiber Reinforced Polymer (CFRP), Titanium 6Al-4V',
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z'
  },
  {
    id: 'comp-rs25-engine',
    entry_number: '002',
    component_name: 'Staged Combustion Liquid Rocket Engine',
    category: 'Propulsion',
    catalog_id: 'rs25-engine',
    definition_description: 'High-efficiency liquid hydrogen and liquid oxygen staged-combustion engine producing over 2 meganewtons of vacuum thrust.',
    purpose_engineering_value: 'Provides primary vehicle acceleration from launch pad through orbital insertion or stage burnout by exhausting superheated gases through a de Laval convergent-divergent nozzle at velocities exceeding 4,400 meters per second.',
    operating_principle: 'Cryogenic liquid hydrogen (LH2) and liquid oxygen (LOX) are fed under high pressure. Liquid hydrogen first circulates through hundreds of tiny channels inside the nozzle jacket for regenerative cooling, preventing thermal failure of the bell nozzle. The warmed fuel then enters preburners where a fuel-rich mixture is ignited to power turbines. The entire exhaust is routed into the main chamber at ~200 atmospheres of pressure, ignited, and expanded.',
    location_installation_context: 'First Stage / Core Booster Aft Thrust Structure mounted onto dual-gimbal gimbal bearings.',
    applications_operating_context: 'Heavy-lift orbital launch systems operating from sea-level ambient atmospheric pressure up to vacuum space environments.',
    interfaces_system_connections: 'Cryogenic LOX/LH2 feed umbilicals, hydraulic gimbal servo actuators, helium purge lines, and engine controller data bus.',
    identification_verification_guidance: 'Inspect powerhead hot-gas manifold weldments, turbopump shaft bearings via ultrasonic testing, and regenerative cooling channel flush pressures.',
    safety_limitations: 'Combustion chamber wall temperature limits (< 900 K), turbine blade creep limits, and inlet pump net positive suction head (NPSH).',
    technical_reference_guidance: 'NASA SP-8107 Liquid Rocket Engine Turbopump Inducers & Staged Combustion System Guidelines.',
    image_storage_path: null,
    image_url: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80',
    image_title: 'RS-25 Staged Combustion Hot-Fire Test',
    image_caption: 'Staged combustion hydrolox rocket engine firing on the test stand showing characteristic Mach diamonds.',
    image_alt_text: 'Rocket engine test firing with intense blue exhaust plume',
    image_source: 'NASA Stennis Space Center Test Stand',
    image_source_url: 'https://ntrs.nasa.gov',
    image_verification_status: 'Verified',
    image_verified_at: '2026-10-15',
    status: 'published',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-02-15T14:30:00Z',
    review_date: '2026-10-20',
    featured: true,

    name: 'Staged Combustion Liquid Rocket Engine',
    designation: 'LRE-RS25 / Hydrolox Cycle',
    shortDescription: 'High-efficiency liquid hydrogen and liquid oxygen staged-combustion engine producing over 2 meganewtons of vacuum thrust.',
    overview: 'High-efficiency liquid hydrogen and liquid oxygen staged-combustion engine producing over 2 meganewtons of vacuum thrust.',
    purpose: 'Provides primary vehicle acceleration from launch pad through orbital insertion or stage burnout by exhausting superheated gases through a de Laval convergent-divergent nozzle at velocities exceeding 4,400 meters per second.',
    operatingPrinciples: 'Cryogenic liquid hydrogen (LH2) and liquid oxygen (LOX) are fed under high pressure. Liquid hydrogen first circulates through hundreds of tiny channels inside the nozzle jacket for regenerative cooling, preventing thermal failure of the bell nozzle.',
    facts: [
      'Specific Impulse (Isp) reaches ~452 seconds in vacuum, among the highest of any operational chemical rocket engine.',
      'Operates at combustion temperatures around 3,300°C (6,000°F), well above the melting point of steel.',
      'The nozzle regenerative cooling system prevents the walls from melting by routing -253°C liquid hydrogen through interior milling channels.',
      'Capable of throttling between 67% and 109% of rated power to maintain vehicle aerodynamic dynamic pressure (Max-Q) limits.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=1b-3i_k8ZfM',
    referenceLinks: [
      {
        title: 'NASA Technical Reports Server (NTRS) - Liquid Rocket Engine Basics',
        url: 'https://ntrs.nasa.gov/'
      },
      {
        title: 'NASA Space Launch System - RS-25 Engine Fact Sheet',
        url: 'https://www.nasa.gov/exploration/systems/sls/rs25.html'
      }
    ],
    specifications: {
      'Propellants': 'Liquid Oxygen (LOX) / Liquid Hydrogen (LH2)',
      'Sea-Level Thrust': '1,860 kN (418,000 lbf)',
      'Vacuum Thrust': '2,279 kN (512,000 lbf)',
      'Chamber Pressure': '20.6 MPa (2,990 psi)',
      'Expansion Ratio': '69:1',
      'Dry Mass': '3,527 kg (7,775 lb)',
      'Specific Impulse': '452 s (vacuum)'
    },
    stageLocation: 'First Stage / Core Booster Aft Thrust Structure',
    typicalMaterials: 'Inconel 718, Haynes 188, Titanium 6Al-4V, Narloy-Z copper alloy',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-02-15T14:30:00Z'
  },
  {
    id: 'comp-flight-computer',
    entry_number: '003',
    component_name: 'Triple-Modular Redundant Flight Computer',
    category: 'Avionics',
    catalog_id: 'flight-computer-tmr',
    definition_description: 'Fault-tolerant radiation-hardened computer executing autonomous guidance, navigation, and control algorithms at kilohertz frequencies.',
    purpose_engineering_value: 'Maintains autonomous flight trajectory, monitors safety limits, sequences stage separation events, and triggers the Autonomous Flight Safety System (AFSS) if critical trajectory deviation occurs.',
    operating_principle: 'Utilizes Triple-Modular Redundancy (TMR) architecture: three independent processing channels execute identical algorithms on synchronized clock cycles. An integrated hardware majority voter compares the outputs; if cosmic rays or single-event upsets (SEUs) corrupt one channel, the remaining two override it seamlessly without latency.',
    location_installation_context: 'Upper Stage Avionics Ring / Forward Interstage Equipment Bay.',
    applications_operating_context: 'Operates continuously during liftoff acoustics, stage separation pyrotechnic shock, and space radiation environments.',
    interfaces_system_connections: 'MIL-STD-1553B, SpaceWire, Ethernet switches, and redundant 28V DC isolated power buses.',
    identification_verification_guidance: 'Clock cycle synchronization telemetry, CRC memory check registers, and radiation watchdog counters.',
    safety_limitations: 'Restricted by total ionizing radiation dose (100 krad) and maximum junction operating temperature (+85°C).',
    technical_reference_guidance: 'NASA Reliability Engineering Guidelines for Avionics TMR Systems & IEEE Aerospace Standards.',
    image_storage_path: null,
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    image_title: 'TMR Fault-Tolerant Aerospace Processor Architecture',
    image_caption: 'Silicon-on-insulator flight computer board with radiation shielding and conformal coating.',
    image_alt_text: 'Aerospace microelectronic circuit board with gold plated components',
    image_source: 'Aerospace Avionics Lab',
    image_source_url: 'https://standards.nasa.gov',
    image_verification_status: 'Verified',
    image_verified_at: '2026-10-18',
    status: 'published',
    created_at: '2026-01-12T09:15:00Z',
    updated_at: '2026-03-01T11:20:00Z',
    review_date: '2026-10-24',
    featured: true,

    name: 'Triple-Modular Redundant Flight Computer',
    designation: 'FCC-TMR Gen-4',
    shortDescription: 'Fault-tolerant radiation-hardened computer executing autonomous guidance, navigation, and control algorithms at kilohertz frequencies.',
    overview: 'Fault-tolerant radiation-hardened computer executing autonomous guidance, navigation, and control algorithms at kilohertz frequencies.',
    purpose: 'Maintains autonomous flight trajectory, monitors safety limits, sequences stage separation events, and triggers the Autonomous Flight Safety System (AFSS) if critical trajectory deviation occurs.',
    operatingPrinciples: 'Utilizes Triple-Modular Redundancy (TMR) architecture: three independent processing channels execute identical algorithms on synchronized clock cycles.',
    facts: [
      'Components are shielded and constructed with radiation-hardened Silicon-on-Insulator (SOI) microelectronics.',
      'Processes guidance routines in deterministic real-time operating systems (RTOS) with zero garbage-collection delay.',
      'Communicates across dual-redundant MIL-STD-1553B or high-speed SpaceWire/Ethernet avionics buses.',
      'Must sustain vibrational acoustic energy exceeding 140 decibels during atmospheric liftoff.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=F_fS6jW7t2o',
    referenceLinks: [
      {
        title: 'NASA Reliability Engineering Guidelines for Avionics TMR',
        url: 'https://standards.nasa.gov/'
      },
      {
        title: 'IEEE Aerospace & Electronic Systems Society Overview',
        url: 'https://ieee-aess.org/'
      }
    ],
    specifications: {
      'Architecture': 'Triple Modular Redundancy (TMR) with hardware voting',
      'Radiation Tolerance': '100 krad (Si) Total Ionizing Dose (TID)',
      'Operating Frequency': 'Deterministic real-time loop @ 1,000 Hz',
      'Bus Interfaces': 'MIL-STD-1553B, CAN Bus, SpaceWire, RS-422',
      'Supply Voltage': '28V DC isolated aerospace bus',
      'Operating Temperature': '-40°C to +85°C'
    },
    stageLocation: 'Upper Stage Avionics Ring / Forward Interstage',
    typicalMaterials: 'Gold-plated aluminum enclosure, conformal coated polyimide PCBs',
    createdAt: '2026-01-12T09:15:00Z',
    updatedAt: '2026-03-01T11:20:00Z'
  },
  {
    id: 'comp-grid-fins',
    entry_number: '004',
    component_name: 'Titanium Aerodynamic Grid Fin Assembly',
    category: 'Airframe, structures & flight controls',
    catalog_id: 'grid-fins',
    definition_description: 'Lattice-structured control surfaces used for atmospheric steerage during high-Mach booster stage descent.',
    purpose_engineering_value: 'Controls roll, pitch, and yaw of reusable booster stages during reentry through the atmosphere, steering the rocket stage precisely toward a landing barge or launchpad catch tower.',
    operating_principle: 'Unlike planar aerodynamic wings, grid fins have an extremely short chord length. The cellular structure prevents flow separation at high angles of attack and keeps the center of pressure nearly constant across Mach 0.5 to Mach 4+. High-torque hydraulic or electromechanical actuators rotate each fin along its pivot shaft.',
    location_installation_context: 'Booster Stage Forward Interstage Ring, mounted in 4 quadrants.',
    applications_operating_context: 'Supersonic and hypersonic atmospheric reentry for booster stage recovery.',
    interfaces_system_connections: 'Structural pivot trunnion bearings, brushless DC high-torque drive gearboxes, and hydraulic pressure manifolds.',
    identification_verification_guidance: 'Inspect lattice welds, hinge pin clearance tolerances, and thermal ablation margins post-flight.',
    safety_limitations: 'Actuator peak torque saturation and maximum permissible thermal boundary layer heating (> 1,200°C).',
    technical_reference_guidance: 'AIAA Aerospace Research - Aerodynamic Characteristics of Grid Fins at Transonic Speeds.',
    image_storage_path: null,
    image_url: 'https://images-assets.nasa.gov/image/GRC-2010-C-02392/GRC-2010-C-02392~medium.jpg',
    image_title: 'Titanium Forged Grid Fin Lattice',
    image_caption: 'Solid forged titanium aerodynamic grid fin used for high-velocity atmospheric control.',
    image_alt_text: 'Grid fin aerodynamic control surface',
    image_source: 'Aerospace Flight Controls Laboratory',
    image_source_url: 'https://arc.aiaa.org',
    image_verification_status: 'Verified',
    image_verified_at: '2026-10-12',
    status: 'published',
    created_at: '2026-01-15T14:00:00Z',
    updated_at: '2026-02-28T16:00:00Z',
    review_date: '2026-10-22',
    featured: true,

    name: 'Titanium Aerodynamic Grid Fin Assembly',
    designation: 'AGF-Ti900 Hypersonic Grid Fin',
    shortDescription: 'Lattice-structured control surfaces used for atmospheric steerage during high-Mach booster stage descent.',
    overview: 'Lattice-structured control surfaces used for atmospheric steerage during high-Mach booster stage descent.',
    purpose: 'Controls roll, pitch, and yaw of reusable booster stages during reentry through the atmosphere, steering the rocket stage precisely toward a landing barge or launchpad catch tower.',
    operatingPrinciples: 'Unlike planar aerodynamic wings, grid fins have an extremely short chord length. The cellular structure prevents flow separation at high angles of attack and keeps the center of pressure nearly constant across Mach 0.5 to Mach 4+.',
    facts: [
      'Forged from single billets of solid titanium to withstand atmospheric friction temperatures over 1,000°C without melting.',
      'Fold flat against the interstage during ascent to minimize aerodynamic drag, then unfold after stage separation.',
      'The open lattice design drastically reduces the hinge moment, allowing smaller, lighter actuators to steer the booster.',
      'Operates from hypersonic speeds down to subsonic terminal landing velocity.'
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/GRC-2010-C-02392/GRC-2010-C-02392~medium.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=1_FX34c_Qo4',
    referenceLinks: [
      {
        title: 'AIAA Aerospace Research - Aerodynamic Characteristics of Grid Fins',
        url: 'https://arc.aiaa.org/'
      }
    ],
    specifications: {
      'Primary Material': 'Titanium Alloy (Ti-6Al-4V / Grade 5)',
      'Operational Speed': 'Mach 0.3 to Mach 4.5+',
      'Actuation Mechanism': 'High-pressure closed-loop hydraulic / brushless DC',
      'Mass per Fin': '~150 kg',
      'Hinge Moment': 'Reduced by ~70% compared to equivalent planar fin',
      'Thermal Limit': '> 1,100°C without ablative coating'
    },
    stageLocation: 'Booster Stage Forward Interstage Ring',
    typicalMaterials: 'Forged Titanium Ti-6Al-4V, Nickel-base superalloys',
    createdAt: '2026-01-15T14:00:00Z',
    updatedAt: '2026-02-28T16:00:00Z'
  },
  {
    id: 'comp-turbopump',
    entry_number: '005',
    component_name: 'Dual-Spool High Pressure Turbopump',
    category: 'Propulsion',
    catalog_id: 'turbopump-hp70',
    definition_description: 'Gas-turbine-driven centrifugal pump delivering cryogenic propellants into combustion chambers at tens of thousands of RPM.',
    purpose_engineering_value: 'Pumps thousands of liters of liquid oxygen and hydrocarbon or liquid hydrogen propellant per minute from low-pressure flight tanks into high-pressure injector manifolds.',
    operating_principle: 'A hot gas generator or preburner generates gas that impinges upon turbine blades, spinning the central drive shaft up to 30,000 RPM. On the pump end, centrifugal impellers accelerate cryogenic liquid and convert kinetic energy into extreme static head pressure via stationary diffusers.',
    location_installation_context: 'Engine Powerhead / Gimbal Platform above the main injector dome.',
    applications_operating_context: 'High-combustion-pressure orbital class liquid propulsion systems.',
    interfaces_system_connections: 'Low-pressure suction flex lines, high-pressure discharge manifolds, seal purges, and turbine drive gas conduits.',
    identification_verification_guidance: 'Dynamic seal leakage measurements, high-speed vibration accelerometer spectral analysis, and post-fire bearing borescope inspection.',
    safety_limitations: 'Inducer cavitation margins, turbine disk overspeed burst limits, and thermal stress cracking between hot gas and cryogenic circuits.',
    technical_reference_guidance: 'NASA SP-8107 Liquid Rocket Engine Turbopump Inducers & Rotor Dynamic Stability.',
    image_storage_path: null,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    image_title: 'High Pressure Centrifugal Turbopump Rotor Assembly',
    image_caption: 'Precision balanced nickel-base superalloy impeller and turbine assembly.',
    image_alt_text: 'Aerospace centrifugal turbopump hardware',
    image_source: 'Rocket Propulsion Mechanical Lab',
    image_source_url: 'https://ntrs.nasa.gov',
    image_verification_status: 'Verified',
    image_verified_at: '2026-10-14',
    status: 'published',
    created_at: '2026-01-20T12:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
    review_date: '2026-10-23',
    featured: false,

    name: 'Dual-Spool High Pressure Turbopump',
    designation: 'TP-HP70 Cryogenic Turbopump',
    shortDescription: 'Gas-turbine-driven centrifugal pump delivering cryogenic propellants into combustion chambers at tens of thousands of RPM.',
    overview: 'Turbopumps are the mechanical workhorses of liquid rocket engines. Because combustion chamber pressures often exceed 100 to 200 atmospheres, propellants cannot be gravity-fed; they must be forced in by high-speed rotating impellers generating thousands of shaft horsepower.',
    purpose: 'Pumps thousands of liters of liquid oxygen and hydrocarbon or liquid hydrogen propellant per minute from low-pressure flight tanks into high-pressure injector manifolds.',
    operatingPrinciples: 'A hot gas generator or preburner generates gas that impinges upon turbine blades, spinning the central drive shaft up to 30,000 RPM.',
    facts: [
      'Power density is staggering: a turbopump the size of a car engine can generate as much power as an entire naval destroyer (up to 70,000 hp).',
      'The temperature differential across the unit can exceed 900°C across just a few inches separating the hot turbine from cryogenic pump stages.',
      'Operates dynamic carbon and hydrostatic seals to prevent explosive contact between oxidizer and turbine driving gases.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    stageLocation: 'Engine Powerhead / Gimbal Platform',
    typicalMaterials: 'Nickel-Chromium Inconel 718, Monel, Silicon Nitride ceramics',
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z'
  },
  {
    id: 'comp-rcs-thrusters',
    entry_number: '006',
    component_name: 'Reaction Control System (RCS) Thruster Pod',
    category: 'Guidance & Control',
    catalog_id: 'rcs-thrusters-cg30',
    definition_description: 'Pulsed attitude thrusters providing three-axis orientation control in vacuum where aerodynamic surfaces are ineffective.',
    purpose_engineering_value: 'Maintains orbital vehicle orientation, points solar arrays at the Sun, slews payload sensors toward Earth, and executes precise proximity operations for docking with space stations.',
    operating_principle: 'High-pressure gaseous nitrogen (cold gas) or hypergolic monopropellant/bipropellant is stored in composite overwrapped pressure vessels (COPVs). Fast-response solenoid valves open for millisecond pulses, exhausting gas through small supersonic nozzles to produce reactionary torque following Newton’s Third Law.',
    location_installation_context: 'Upper Stage Interstage & Spacecraft Bus Perimeter in orthogonal clusters.',
    applications_operating_context: 'Vacuum orbital maneuvers, attitude stabilization, and rendezvous station keeping.',
    interfaces_system_connections: 'COPV manifold tubing, rapid pulse solenoid driver electronics, and telemetry pressure sensors.',
    identification_verification_guidance: 'Helium mass spectrometer leak checks, response pulse latency profiling, and valve seat seating tests.',
    safety_limitations: 'Propellant mass depletion limits, valve cycle fatigue limits (> 100,000 cycles), and freezing/boil-off considerations.',
    technical_reference_guidance: 'NASA Apollo Experience Report - Reaction Control System Engineering.',
    image_storage_path: null,
    image_url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
    image_title: 'Orthogonal Reaction Control System Quad Pod',
    image_caption: 'Attitude control cold gas thruster manifold engineered for sub-degree orbital pointing precision.',
    image_alt_text: 'Rocket reaction control system nozzles',
    image_source: 'Orbital Maneuvering Systems Laboratory',
    image_source_url: 'https://ntrs.nasa.gov',
    image_verification_status: 'Verified',
    image_verified_at: '2026-10-16',
    status: 'published',
    created_at: '2026-01-25T11:00:00Z',
    updated_at: '2026-03-02T15:00:00Z',
    review_date: '2026-10-23',
    featured: true,

    name: 'Reaction Control System (RCS) Thruster Pod',
    designation: 'RCS-CG30 Cold Gas / Hypergolic Pod',
    shortDescription: 'Pulsed attitude thrusters providing three-axis orientation control in vacuum where aerodynamic surfaces are ineffective.',
    overview: 'In outer space vacuum, aerodynamic fins and rudders cannot produce any steering force. The Reaction Control System (RCS) utilizes directional thrusters arranged in orthogonal clusters to exert roll, pitch, and yaw torques and translational maneuvers.',
    purpose: 'Maintains orbital vehicle orientation, points solar arrays at the Sun, slews payload sensors toward Earth, and executes precise proximity operations for docking with space stations.',
    operatingPrinciples: 'High-pressure gaseous nitrogen (cold gas) or hypergolic monopropellant/bipropellant is stored in composite overwrapped pressure vessels (COPVs). Fast-response solenoid valves open for millisecond pulses, exhausting gas through small supersonic nozzles.',
    facts: [
      'Valves can pulse in bursts as short as 10 milliseconds for microscopic orientation adjustments.',
      'Arranged in quad clusters (usually 4 pods around the vehicle circumference) to provide pure rotational torque without unwanted translational drift.',
      'Cold gas systems use inert nitrogen for maximum simplicity and zero contamination around sensitive optical cameras.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
    stageLocation: 'Upper Stage Interstage & Spacecraft Bus Perimeter',
    typicalMaterials: 'Titanium grade 5 manifold, Niobium alloy nozzle extensions',
    createdAt: '2026-01-25T11:00:00Z',
    updatedAt: '2026-03-02T15:00:00Z'
  },
  {
    id: 'comp-thermal-tiles',
    entry_number: '007',
    component_name: 'Phenolic-Impregnated Carbon Ablator (PICA-X) Tiles',
    category: 'Thermal Protection',
    catalog_id: 'thermal-tiles-pica',
    definition_description: 'Lightweight porous carbon fiber matrix bonded with phenolic resin, engineered for extreme atmospheric entry heat fluxes.',
    purpose_engineering_value: 'Prevents entry heat from penetrating into the spacecraft substructure and avionics, preserving vehicle structural integrity during orbital deceleration.',
    operating_principle: 'Functions via a sacrificial chemical mechanism called ablation: under high heat flux, the phenolic resin inside the porous carbon matrix endothermically pyrolyzes into gas. This outgassing blows the boundary plasma layer away from the wall while forming a protective insulating char layer.',
    location_installation_context: 'Spacecraft Base Heat Shield and Windward Aerodynamic Surfaces.',
    applications_operating_context: 'Orbital and interplanetary hypersonic reentry into planetary atmospheres.',
    interfaces_system_connections: 'RTV silicone flexible adhesive bondlines directly to titanium or carbon composite primary structure.',
    identification_verification_guidance: 'Optical laser surface scanning for char depth, acoustic bondline tap testing, and infrared thermography.',
    safety_limitations: 'Single-event maximum heat load saturation; sensitive to physical impact punctures and gap plasma flow leakage.',
    technical_reference_guidance: 'NASA Ames Research Center - PICA Thermal Protection Technology & Reentry Physics Handbooks.',
    image_storage_path: null,
    image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    image_title: 'Aerothermal Reentry Heat Shield Material',
    image_caption: 'High-temperature carbon matrix heat shield tile engineered for hypersonic plasma protection.',
    image_alt_text: 'Spacecraft thermal protection tile matrix',
    image_source: 'NASA Ames Research Center',
    image_source_url: 'https://www.nasa.gov/centers/ames',
    image_verification_status: 'Verified',
    image_verified_at: '2026-10-10',
    status: 'published',
    created_at: '2026-01-28T16:20:00Z',
    updated_at: '2026-02-25T09:40:00Z',
    review_date: '2026-10-21',
    featured: true,

    name: 'Phenolic-Impregnated Carbon Ablator (PICA-X) Tiles',
    designation: 'TPS-PICA9 Heat Shield System',
    shortDescription: 'Lightweight porous carbon fiber matrix bonded with phenolic resin, engineered for extreme atmospheric entry heat fluxes.',
    overview: 'Lightweight porous carbon fiber matrix bonded with phenolic resin, engineered for extreme atmospheric entry heat fluxes.',
    purpose: 'Prevents entry heat from penetrating into the spacecraft substructure and avionics, preserving vehicle structural integrity during orbital deceleration.',
    operatingPrinciples: 'Functions via a sacrificial chemical mechanism called ablation: under high heat flux, the phenolic resin inside the porous carbon matrix endothermically pyrolyzes into gas.',
    facts: [
      'Density is roughly 0.27 g/cm³, meaning it is so light it readily floats on water.',
      'Can survive entry heat fluxes exceeding 1,200 Watts per square centimeter.',
      'Unlike the brittle silica tiles used on early space shuttles, modern PICA-X can be fabricated in large contoured panels and withstand multiple reuse flights.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    stageLocation: 'Capsule Base Heat Shield & Booster Nose Cone',
    typicalMaterials: 'Carbon fiber matrix, Phenolic resin, RTV silicone adhesive bondline',
    createdAt: '2026-01-28T16:20:00Z',
    updatedAt: '2026-02-25T09:40:00Z'
  },
  {
    id: 'comp-parachute-recovery',
    entry_number: '008',
    component_name: 'Supersonic Ribbon Drogue & Main Parachute System',
    category: 'Recovery Systems',
    catalog_id: 'parachute-recovery-prs',
    definition_description: 'Staged decelerator system deploying mortar-fired supersonic drogue chutes followed by oversized tri-conical main canopies.',
    purpose_engineering_value: 'Decelerates descending flight hardware from Mach 1.5+ down to a survivable landing speed of under 7.5 meters per second.',
    operating_principle: 'At high altitude and high dynamic pressure, a pyrotechnic mortar ejects a pilot chute, which extracts conical ribbon drogue chutes. These slots allow supersonic air to pass through without tearing the fabric while stabilizing vehicle pitch. Once at subsonic velocity (~3 km altitude), the drogues are cut away to pull out three massive main ringsail parachutes with progressive reefing rings.',
    location_installation_context: 'Forward Capsule Bay / Booster Recovery Compartment.',
    applications_operating_context: 'Atmospheric return deceleration for reusable booster stages and crew capsules.',
    interfaces_system_connections: 'Pyrotechnic mortar canisters, electronic altimeter trigger lines, and structural load bridle risers.',
    identification_verification_guidance: 'Packing pressure certification, line tension continuity checks, and pyrotechnic cutter resistance tests.',
    safety_limitations: 'Maximum deployment dynamic pressure (q-limit) and canopy reefing sequence timing.',
    technical_reference_guidance: 'NASA Recovery Systems & Parachute Design Manual & AIAA Aerodynamic Decelerators.',
    image_storage_path: null,
    image_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
    image_title: 'Staged Deceleration Ringsail Parachute Canopy',
    image_caption: 'Deployed tri-canopy recovery cluster stabilizing spacecraft capsule before splashdown.',
    image_alt_text: 'Parachute recovery system deployment in atmosphere',
    image_source: 'Aerospace Recovery Dynamics Laboratory',
    image_source_url: 'https://ntrs.nasa.gov',
    image_verification_status: 'Verified',
    image_verified_at: '2026-10-18',
    status: 'published',
    created_at: '2026-02-05T13:40:00Z',
    updated_at: '2026-03-08T09:30:00Z',
    review_date: '2026-10-24',
    featured: false,

    name: 'Supersonic Ribbon Drogue & Main Parachute System',
    designation: 'PRS-D40 Dual-Stage Recovery System',
    shortDescription: 'Staged decelerator system deploying mortar-fired supersonic drogue chutes followed by oversized tri-conical main canopies.',
    overview: 'For capsules or reusable rocket boosters returning from space, parachutes provide aerodynamic drag to bleed off terminal kinetic energy before splashdown or dry touchdown. Because opening at supersonic speeds tears standard fabric, a sequence of specialized canopies is deployed.',
    purpose: 'Decelerates descending flight hardware from Mach 1.5+ down to a survivable landing speed of under 7.5 meters per second (17 mph).',
    operatingPrinciples: 'At high altitude and high dynamic pressure, a pyrotechnic mortar ejects a pilot chute, which extracts conical ribbon drogue chutes. These slots allow supersonic air to pass through without tearing the fabric while stabilizing vehicle pitch.',
    facts: [
      'Main parachutes use "reefing lines" that keep the canopies partially restricted for several seconds so deceleration forces do not snap suspension cords or injure crew.',
      'Suspension lines are fabricated from ultra-high-molecular-weight polyethylene (Dynema/Spectra) or Kevlar.',
      'The entire deployment sequence is triggered automatically by barometric altimeters and backed up by radar altimeters.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
    stageLocation: 'Forward Capsule Bay / Booster Recovery Compartment',
    typicalMaterials: 'Kevlar 29, Nylon 6.6 low-porosity weave, Vectran suspension lines',
    createdAt: '2026-02-05T13:40:00Z',
    updatedAt: '2026-03-08T09:30:00Z'
  }
];
