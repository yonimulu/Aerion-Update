-- ==============================================================================
-- AERION Aerospace Science & Engineering Encyclopedia - Supabase Schema
-- ==============================================================================
-- Complete database schema, indexes, Row Level Security (RLS) policies,
-- Supabase Storage configuration, and seed dataset.
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the primary encyclopedia_entries table
CREATE TABLE IF NOT EXISTS public.encyclopedia_entries (
  id TEXT PRIMARY KEY DEFAULT ('aerion-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  entry_number VARCHAR(16) NOT NULL UNIQUE,
  component_name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  catalog_id VARCHAR(128) NOT NULL UNIQUE,
  
  -- Structured encyclopedic knowledge sections
  definition_description TEXT DEFAULT '',
  purpose_engineering_value TEXT DEFAULT '',
  operating_principle TEXT DEFAULT '',
  location_installation_context TEXT DEFAULT '',
  applications_operating_context TEXT DEFAULT '',
  interfaces_system_connections TEXT DEFAULT '',
  identification_verification_guidance TEXT DEFAULT '',
  safety_limitations TEXT DEFAULT '',
  technical_reference_guidance TEXT DEFAULT '',

  -- Media & Visuals
  image_storage_path TEXT,
  image_url TEXT,
  image_title VARCHAR(255),
  image_caption TEXT,
  image_alt_text VARCHAR(255),
  image_source VARCHAR(255) DEFAULT 'Aerospace Technical Archive',
  image_source_url TEXT,
  image_verification_status VARCHAR(64) DEFAULT 'Verified',
  image_verified_at DATE,

  -- Administrative & Lifecycle
  status VARCHAR(32) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  review_date DATE,
  featured BOOLEAN NOT NULL DEFAULT false,
  
  -- Extended technical metadata (JSON-structured for flexibility)
  facts JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  reference_links JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  stage_location TEXT,
  typical_materials TEXT,

  -- Auditing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Indexes for fast catalog browsing, search, and admin filtering
CREATE INDEX IF NOT EXISTS idx_encyclopedia_catalog_id ON public.encyclopedia_entries(catalog_id);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_entry_number ON public.encyclopedia_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_category ON public.encyclopedia_entries(category);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_status ON public.encyclopedia_entries(status);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_featured ON public.encyclopedia_entries(featured);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_created_at ON public.encyclopedia_entries(created_at DESC);

-- 4. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_encyclopedia_entries_updated_at ON public.encyclopedia_entries;
CREATE TRIGGER set_encyclopedia_entries_updated_at
  BEFORE UPDATE ON public.encyclopedia_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.encyclopedia_entries ENABLE ROW LEVEL SECURITY;

-- 5a. Public read access: anyone can view published entries
DROP POLICY IF EXISTS "Public users can view published encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Public users can view published encyclopedia entries"
  ON public.encyclopedia_entries
  FOR SELECT
  USING (status = 'published');

-- 5b. Authenticated access: authenticated administrators can view all entries (including drafts)
DROP POLICY IF EXISTS "Authenticated users can read all encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Authenticated users can read all encyclopedia entries"
  ON public.encyclopedia_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- 5c. Authenticated access: authenticated administrators can insert new entries
DROP POLICY IF EXISTS "Authenticated users can insert encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Authenticated users can insert encyclopedia entries"
  ON public.encyclopedia_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5d. Authenticated access: authenticated administrators can update entries
DROP POLICY IF EXISTS "Authenticated users can update encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Authenticated users can update encyclopedia entries"
  ON public.encyclopedia_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5e. Authenticated access: authenticated administrators can delete entries
DROP POLICY IF EXISTS "Authenticated users can delete encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Authenticated users can delete encyclopedia entries"
  ON public.encyclopedia_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- 5f. Permissive fallback policy for unauthenticated environments / prototype testing
-- Note: If you require strict admin-only modification, comment out this policy.
DROP POLICY IF EXISTS "Allow anon operations if enabled" ON public.encyclopedia_entries;
CREATE POLICY "Allow anon operations if enabled"
  ON public.encyclopedia_entries
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 6. Supabase Storage Setup (aerospace-media bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aerospace-media',
  'aerospace-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 6a. Storage RLS policies
DROP POLICY IF EXISTS "Public Access to aerospace-media" ON storage.objects;
CREATE POLICY "Public Access to aerospace-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'aerospace-media');

DROP POLICY IF EXISTS "Allow uploads to aerospace-media" ON storage.objects;
CREATE POLICY "Allow uploads to aerospace-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'aerospace-media');

DROP POLICY IF EXISTS "Allow updates to aerospace-media" ON storage.objects;
CREATE POLICY "Allow updates to aerospace-media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'aerospace-media');

DROP POLICY IF EXISTS "Allow deletions in aerospace-media" ON storage.objects;
CREATE POLICY "Allow deletions in aerospace-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'aerospace-media');

-- 7. Initial Seed Dataset (8 Foundational Aerospace Components)
INSERT INTO public.encyclopedia_entries (
  id, entry_number, component_name, category, catalog_id,
  definition_description, purpose_engineering_value, operating_principle,
  location_installation_context, applications_operating_context,
  interfaces_system_connections, identification_verification_guidance,
  safety_limitations, technical_reference_guidance,
  image_url, image_title, image_caption, image_alt_text,
  image_source, image_verification_status, status, featured,
  typical_materials, stage_location, facts, specifications
) VALUES
(
  'aerion-001-fuselage', '001', 'Fuselage & Aerodynamic Fairing',
  'Airframe, structures & flight controls', 'fuselage',
  'Primary structural outer skin and payload aerodynamic enclosure engineered to protect delicate satellite payloads from dynamic pressure, sonic shear, and aerothermal heating during atmospheric ascent.',
  'Preserves payload structural integrity and maintains laminar aerodynamic boundary layer profiles during transonic acceleration, jettisoning cleanly once atmospheric density drops below critical threshold.',
  'Aerodynamic clamshell halves clamped via pneumatic or explosive collet latches, propelled outward at stage separation by cold gas thrusters or calibrated spring actuators.',
  'Forward-most apex of launch vehicle, mounted structurally atop the payload adapter fitting and upper stage forward dome.',
  'All orbital and suborbital commercial launch vehicle configurations during ascent through the Troposphere and Stratosphere.',
  'Payload attachment ring, vehicle telemetry umbilical, electrical ordnance bus, and thermal acoustic insulation blankets.',
  'Check serial stamp plate, verify torque stripes on separation bolts, inspect carbon-composite acoustic tiles for micro-fractures.',
  'Maximum dynamic pressure (Max-Q) limit of 48 kPa. Fairing acoustic vibration limit of 142 dB.',
  'AIAA S-110 standard for payload fairing design and NASA SP-8007.',
  'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80',
  'Payload Fairing Clamshell Assembly', 'Carbon composite aerodynamic fairing halves during vehicle integration.',
  'Carbon composite rocket fairing structure', 'AERION Hardware Archive', 'Verified',
  'published', true, 'Carbon-fiber reinforced polymer (CFRP) with aluminum honeycomb core',
  'Forward Section (Stage 2 Apex)',
  '["Acoustic blankets reduce launch acoustic levels by up to 15 dB.", "Fairing separation typically occurs around 100-120 km altitude in space vacuum."]'::jsonb,
  '{"Height": "13.1 meters", "Diameter": "5.2 meters", "Separation Mechanism": "Pneumatic pushers / Frangible joint", "Acoustic Attenuation": "-15 dB"}'::jsonb
),
(
  'aerion-002-engine', '002', 'Staged Combustion Rocket Engine',
  'Propulsion', 'liquid-rocket-engine',
  'High-pressure bipropellant liquid rocket propulsion unit utilizing liquid oxygen (LOX) and refined hydrocarbon (RP-1) or methane (LCH4) in a closed closed-loop preburner cycle.',
  'Delivers high specific impulse (Isp) and high thrust-to-weight ratio to accelerate the rocket stack from ground level through atmospheric ascent.',
  'Turbopumps deliver propellant into preburners to drive turbines, then inject high-temperature gas mixtures directly into the main combustion chamber for full combustion and expansion through a converging-diverging de Laval nozzle.',
  'Engine thrust structure / aft boattail at the bottom of Stage 1 and Stage 2.',
  'Orbital launch vehicle first-stage booster cluster and vacuum upper-stage propulsion.',
  'Gimbal bearing assembly, high-pressure fuel and oxidizer feedlines, hydraulic pitch and yaw actuators, pyro igniter bus.',
  'Verify thrust chamber serial tags, boroscope combustion chamber injector face, measure turbopump bearing runout tolerances.',
  'Max chamber pressure: 30 MPa. Max turbine gas temperature: 850°C. Must not operate under low cavitation margins.',
  'NASA SP-8107 Liquid Rocket Engine Turbopump Design and ASME Boiler & Pressure Vessel Code Section VIII.',
  'https://images.unsplash.com/photo-1517976487504-59a1a04d20dd?auto=format&fit=crop&w=1200&q=80',
  'High-Pressure Liquid Engine Injector and Bell', 'Closed-cycle staged combustion rocket engine during test stand hot-fire.',
  'Rocket engine combustion chamber and nozzle', 'NASA Technical Reports Server', 'Verified',
  'published', true, 'Inconel 718, Copper-alloy liner, Titanium gimbal',
  'Booster Aft Section (Stage 1)',
  '["Operates at combustion chamber pressures exceeding 300 atmospheres.", "Features regenerative cooling channels where cryogenic fuel cools nozzle walls prior to injection."]'::jsonb,
  '{"Sea Level Thrust": "2,200 kN", "Vacuum Specific Impulse": "348 s", "Chamber Pressure": "30 MPa", "Gimbal Range": "±8 degrees"}'::jsonb
),
(
  'aerion-003-avionics', '003', 'Avionics & Flight Computer',
  'Avionics', 'avionics-flight-computer',
  'Fault-tolerant triple-modular redundant computing suite running real-time operating software (RTOS) to manage vehicle navigation, telemetry broadcast, and actuator control.',
  'Provides real-time decision making, inertial navigation computation, staging event commanding, engine throttle adjustments, and range safety automated flight termination.',
  'Processes high-frequency accelerometer and ring-laser gyroscope measurements through Kalman filtering algorithms to calculate position, velocity, and attitude vectors, generating pulse-width commands to hydraulic gimbal actuators.',
  'Avionics equipment bay mounted within interstage or upper stage equipment ring.',
  'Primary control authority for all booster and orbital insertion operations.',
  'RS-422 and MIL-STD-1553 data buses, redundant lithium-ion battery bus, IMU sensor ring, pyro event controllers.',
  'Read electronic EEPROM hardware serial, execute bit-pattern self-test routine, verify optical bus transceivers.',
  'Operating thermal range: -40°C to +75°C. Radiation total ionizing dose (TID) limit: 50 krad.',
  'DO-178C Software Considerations in Airborne Systems and NASA-STD-8739.',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
  'Triple-Redundant Aerospace Flight Computing Core', 'Quad-core radiation hardened flight computer assembly.',
  'Spacecraft avionics circuit motherboard', 'ESA Science & Technology', 'Verified',
  'published', true, 'Radiation-hardened silicon, gold-plated beryllium chassis',
  'Stage 2 Forward Equipment Ring',
  '["Executes navigation loop updates at 500 Hz.", "Features voting logic where three isolated channels cross-verify guidance calculations before asserting valve actuation."]'::jsonb,
  '{"Processor Architecture": "Radiation-Hardened PowerPC / RISC-V", "Redundancy": "Triple-Modular Redundant (TMR)", "Bus Architecture": "MIL-STD-1553 / Ethernet", "Power Draw": "85 W"}'::jsonb
),
(
  'aerion-004-interstage', '004', 'Interstage & Separation System',
  'Structures', 'interstage-separation',
  'Cylindrical composite structural adapter connecting the booster first stage to the upper stage, housing pneumatic pushers and linear shaped-charge severance systems.',
  'Transfers aerodynamic and acceleration loads between vehicle stages while providing rapid, clean mechanical separation at staging altitude without debris generation.',
  'Pneumatic separation cylinders exert balanced axial repulsive force immediately after linear shape-charges cut the structural ring joints.',
  'Intermediate structural section situated between Stage 1 oxidizer tank forward dome and Stage 2 engine bell.',
  'Ascent flight staging phase, separating spent booster from orbital acceleration stage.',
  'Stage 1 forward skirt, Stage 2 aft thrust mount, optical separation sensor flags, electrical disconnect umbilicals.',
  'Inspect frangible joint alignment pins, verify separation pneumatic pressure reservoirs, test continuity of dual detonators.',
  'Maximum bending moment tolerance: 12 MN-m. Pyro firing window tolerance: ±2 milliseconds.',
  'NASA SP-8025 Solid Rocket Motor Staging and Range Commanders Council (RCC) 319.',
  'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=1200&q=80',
  'Composite Interstage Separation Ring', 'Interstage carbon-fiber structural cylinder undergoing modal load vibration testing.',
  'Cylindrical rocket interstage structure', 'Aerospace Engineering Archive', 'Verified',
  'published', true, 'High-modulus carbon fiber honeycomb laminate',
  'Between Stage 1 and Stage 2',
  '["Separation sequence takes less than 350 milliseconds from trigger to clearance.", "Vent holes allow upper stage vacuum engine start gases to exit without overpressuring stage gap."]'::jsonb,
  '{"Diameter": "3.7 meters", "Length": "4.2 meters", "Separation Velocity": "1.8 m/s delta-V", "Actuator Mechanism": "Dual pneumatic pushers"}'::jsonb
),
(
  'aerion-005-gridfins', '005', 'Hypersonic Grid Fins',
  'Airframe, structures & flight controls', 'grid-fins',
  'Lattice-style aerodynamic control surfaces mounted symmetrically on the booster forward skirt for atmospheric deceleration and precision descent steering.',
  'Provides high aerodynamic control torque with low hinge-moment demands across subsonic, transonic, and hypersonic Mach regimes during booster recovery descent.',
  'Rotating grid blades alter airflow redirection angle, imparting aerodynamic pitching and yawing moments to align booster trajectory toward the recovery landing pad.',
  'Four perimeter locations on the booster forward stage equipment section.',
  'Atmospheric re-entry and landing approach of reusable orbital launch vehicle boosters.',
  'High-torque electro-hydraulic actuators, titanium pivot shafts, closed-loop attitude guidance controllers.',
  'Inspect titanium lattice leading edges for ablative wear, ultrasonic examination of actuator spline teeth.',
  'Maximum surface temperature during re-entry: 1,100°C. Hydraulic operating pressure: 21 MPa.',
  'AIAA Journal of Spacecraft and Rockets: Aerodynamic Characteristics of Grid Fins.',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'Titanium Hypersonic Grid Fin Assembly', 'Folded grid fin aerodynamic control surface mounted to booster perimeter.',
  'Aerodynamic grid fin surface on rocket hull', 'Aerospace Flight Research', 'Verified',
  'published', false, 'Forged Titanium alloy (Ti-6Al-4V)',
  'Booster Forward Ring',
  '["Lattice geometry provides aerodynamic control authority up to Mach 5.", "Fold flat against the hull during launch ascent to minimize drag penalties."]'::jsonb,
  '{"Span": "1.4 meters", "Chord Depth": "0.35 meters", "Max Deflection Angle": "±25 degrees", "Thermal Resistance": "1,150°C"}'::jsonb
),
(
  'aerion-006-copv', '006', 'Carbon Overwrapped Pressure Vessel (COPV)',
  'Structures', 'copv-pressure-vessel',
  'High-pressure gas storage cylinder constructed of a thin metal liner overwrapped with continuous high-strength carbon fiber filaments encased in epoxy resin.',
  'Stores high-pressure helium or nitrogen gas at pressures up to 40 MPa to pressurize cryogenic propellant tanks and operate pneumatic actuation valves.',
  'Liquid propellant is pumped out of main fuel tanks; high-pressure helium stored inside COPVs is metered through regulator valves into the tanks to prevent collapse.',
  'Immersed directly inside the liquid oxygen (LOX) cryogenic propellant tanks or mounted to structural interstage trusses.',
  'Vehicle fuel ullage pressurization, pneumatic thruster supply, and valve purge sequences.',
  'Stainless steel high-pressure tubing, burst disk assembly, relief valves, immersion temperature sensors.',
  'Conduct acoustic emission hydro-testing, verify fiber wrap tension consistency, check liner helium leak rate.',
  'Maximum operating pressure: 45 MPa. Minimum burst factor: 1.5x. Avoid liquid oxygen entrapment under wrap.',
  'AIAA S-080 Space Systems - Metallic Pressure Vessels and COPVs.',
  'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&w=1200&q=80',
  'High Pressure Carbon Fiber Composite Tank', 'COPV filament winding process displaying automated carbon fiber tensioning.',
  'High-pressure composite tank cylinder', 'NASA Marshall Space Flight Center', 'Verified',
  'published', false, 'Aluminum / Titanium liner with Toray carbon fiber overwrap',
  'Internal to Propellant Tanks',
  '["Immersing COPVs inside cryogenic propellant saves vehicle volume and cools gas for increased density.", "Stores helium at over 400 times normal atmospheric pressure."]'::jsonb,
  '{"Capacity": "120 Liters", "Working Pressure": "41.3 MPa (6,000 PSI)", "Burst Factor": "1.5x MEOP", "Liner Material": "Inconel 718 / Aluminum 6061-T6"}'::jsonb
),
(
  'aerion-007-tps', '007', 'Thermal Protection System (TPS) Tiles',
  'Thermal Protection', 'tps-tiles',
  'Silica ceramic and carbon-matrix heat-shield tiles installed across vehicle windward surfaces to resist aerodynamic frictional heating.',
  'Prevents extreme aerodynamic frictional heat generated during hypersonic atmospheric re-entry from conducting into the aluminum or carbon structure of the spacecraft.',
  'Low-density porous silica fibers rapidly dissipate and re-radiate infrared thermal energy while maintaining near-zero thermal conductivity through the tile thickness.',
  'Windward surface of orbital spacecraft, reusable booster engine bases, and forward conical surfaces.',
  'Atmospheric re-entry from low Earth orbit, lunar return, or booster hypersonic entry burn.',
  'Room-temperature vulcanizing (RTV) silicone adhesive bonding pads, Nomex strain isolation pads (SIP).',
  'Perform step-and-gap laser profile scanning, inspect glass coating for micro-crazing or micrometeoroid impacts.',
  'Maximum operating temperature: 1,650°C (3,000°F). Vulnerable to high-velocity water droplet erosion.',
  'NASA SP-8014 Entry Thermal Protection and AIAA Thermophysics standards.',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
  'High-Temperature Ceramic Silica Heatshield Tiles', 'Array of black borosilicate-coated thermal protection tiles mounted to vehicle skin.',
  'Thermal protection tiles pattern', 'NASA Johnson Space Center', 'Verified',
  'published', false, 'Reaction-cured borosilicate glass over 99.8% pure amorphous silica fiber matrix',
  'Vehicle Base & Windward Aerodynamic Surface',
  '["Can be picked up by hand by the edges seconds after being removed from a 1,200°C furnace.", "Tiles are separated by gaps of only a few millimeters to permit thermal expansion without collision."]'::jsonb,
  '{"Density": "144 to 352 kg/m³", "Max Temperature Limit": "1,650°C", "Thermal Conductivity": "0.048 W/(m·K)", "Coating Type": "Reaction Cured Glass (RCG)"}'::jsonb
),
(
  'aerion-008-recovery', '008', 'Parachute Recovery System',
  'Recovery Systems', 'parachute-recovery-system',
  'Multi-stage deceleration assembly comprising mortar-deployed pilot chutes, supersonic drogue chutes, and clustered main ringsail canopies.',
  'Stabilizes and decelerates returning spacecraft capsules, booster modules, or payload fairing halves from supersonic re-entry speeds to gentle touchdown velocity.',
  'Pilot mortars deploy drogue parachutes to arrest tumbling and bleed off supersonic velocity; at lower altitudes, drogues pull out clustered main canopies that reef and inflate in stages to limit shock loads.',
  'Aft compartment / apex of crew capsules or fairing recovery pack compartments.',
  'Terminal descent phase of reusable launch hardware and crew exploration vehicles.',
  'Structural recovery bridle, pyrotechnic cable cutters, swivel risers, barometric deployment sensors.',
  'Measure parachute line suspension symmetry, verify pyrotechnic reefing line cutter expiry dates, inspect ripstop nylon.',
  'Maximum deployment dynamic pressure: 25 kPa. Canopy opening shock limit: 4.5 Gs.',
  'NASA SP-8066 Deployable Aerodynamic Decelerators and AIAA Parachute Systems Technology.',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'Ringsail Main Parachute Canopy Cluster', 'Triple clustered main parachutes fully inflated over oceanic recovery zone.',
  'Parachute recovery canopy descending over water', 'USAF Aerospace Test Wing', 'Verified',
  'published', false, 'Kevlar suspension lines, Dacron risers, Ripstop nylon canopy',
  'Capsule Forward Apex',
  '["Main canopies measure over 35 meters in diameter each when fully inflated.", "Reefing rings gradually un-cinch the skirt over 10 seconds to protect astronauts from extreme opening forces."]'::jsonb,
  '{"Canopy Type": "Triple Ringsail Cluster", "Touchdown Velocity": "< 7.5 m/s", "Deployment Sequence": "Pilot -> Drogue -> 3x Main", "Total Suspension Lines": "96 lines per canopy"}'::jsonb
)
ON CONFLICT (entry_number) DO UPDATE SET
  component_name = EXCLUDED.component_name,
  category = EXCLUDED.category,
  catalog_id = EXCLUDED.catalog_id,
  definition_description = EXCLUDED.definition_description,
  purpose_engineering_value = EXCLUDED.purpose_engineering_value,
  operating_principle = EXCLUDED.operating_principle,
  location_installation_context = EXCLUDED.location_installation_context,
  applications_operating_context = EXCLUDED.applications_operating_context,
  interfaces_system_connections = EXCLUDED.interfaces_system_connections,
  identification_verification_guidance = EXCLUDED.identification_verification_guidance,
  safety_limitations = EXCLUDED.safety_limitations,
  technical_reference_guidance = EXCLUDED.technical_reference_guidance,
  image_url = EXCLUDED.image_url,
  image_title = EXCLUDED.image_title,
  image_caption = EXCLUDED.image_caption,
  image_alt_text = EXCLUDED.image_alt_text,
  image_source = EXCLUDED.image_source,
  image_verification_status = EXCLUDED.image_verification_status,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  typical_materials = EXCLUDED.typical_materials,
  stage_location = EXCLUDED.stage_location,
  facts = EXCLUDED.facts,
  specifications = EXCLUDED.specifications,
  updated_at = now();

-- ==============================================================================
-- 7. Reviews, Ratings, Votes, and Reports
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT ('rev-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  item_id TEXT NOT NULL REFERENCES public.encyclopedia_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name VARCHAR(255) NOT NULL DEFAULT 'Aerospace Engineer',
  user_email VARCHAR(255),
  user_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_item_review UNIQUE (item_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.review_votes (
  id TEXT PRIMARY KEY DEFAULT ('vote-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  review_id TEXT NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  vote_type VARCHAR(16) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_review_vote UNIQUE (review_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.review_reports (
  id TEXT PRIMARY KEY DEFAULT ('rep-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  review_id TEXT NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL,
  reporter_email VARCHAR(255),
  reason VARCHAR(128) NOT NULL,
  details TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON public.reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON public.review_reports(review_id);

DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews;
CREATE POLICY "Public can view published reviews"
  ON public.reviews FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated users can read all reviews" ON public.reviews;
CREATE POLICY "Authenticated users can read all reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (rating >= 1 AND rating <= 5);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = 'binyamawiw@gmail.com')
  WITH CHECK (rating >= 1 AND rating <= 5);

DROP POLICY IF EXISTS "Users or admins can delete reviews" ON public.reviews;
CREATE POLICY "Users or admins can delete reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = 'binyamawiw@gmail.com');

DROP POLICY IF EXISTS "Anon can view published reviews" ON public.reviews;
CREATE POLICY "Anon can view published reviews"
  ON public.reviews FOR SELECT
  TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "Anon can insert reviews with valid rating" ON public.reviews;
CREATE POLICY "Anon can insert reviews with valid rating"
  ON public.reviews FOR INSERT
  TO anon
  WITH CHECK (rating >= 1 AND rating <= 5);

DROP POLICY IF EXISTS "Anon can update own reviews" ON public.reviews;
CREATE POLICY "Anon can update own reviews"
  ON public.reviews FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (rating >= 1 AND rating <= 5);

DROP POLICY IF EXISTS "Anon can delete reviews" ON public.reviews;
CREATE POLICY "Anon can delete reviews"
  ON public.reviews FOR DELETE
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow select on review_votes" ON public.review_votes;
CREATE POLICY "Allow select on review_votes" ON public.review_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on review_votes" ON public.review_votes;
CREATE POLICY "Allow insert on review_votes" ON public.review_votes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on review_votes" ON public.review_votes;
CREATE POLICY "Allow update on review_votes" ON public.review_votes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on review_votes" ON public.review_votes;
CREATE POLICY "Allow delete on review_votes" ON public.review_votes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select on review_reports" ON public.review_reports;
CREATE POLICY "Allow select on review_reports" ON public.review_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on review_reports" ON public.review_reports;
CREATE POLICY "Allow insert on review_reports" ON public.review_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on review_reports" ON public.review_reports;
CREATE POLICY "Allow update on review_reports" ON public.review_reports FOR UPDATE USING (true);

