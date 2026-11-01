export type RocketCategory =
  | 'Airframe, structures & flight controls'
  | 'Structures'
  | 'Propulsion'
  | 'Avionics'
  | 'Guidance & Control'
  | 'Electrical Systems'
  | 'Thermal Protection'
  | 'Recovery Systems'
  | string;

export interface ReferenceLink {
  title: string;
  url: string;
}

export type EntryStatus = 'draft' | 'published';
export type VerificationStatus = 'Verified' | 'Unverified' | 'Pending Review';

export interface RocketComponent {
  // Core persistent database identifiers
  id: string;
  entry_number: string; // e.g. "001", "002"
  component_name: string;
  category: RocketCategory;
  catalog_id: string; // unique identifier, e.g. "fuselage", "wing"
  
  // Structured encyclopedic knowledge sections
  definition_description: string;
  purpose_engineering_value: string;
  operating_principle: string;
  location_installation_context: string;
  applications_operating_context: string;
  interfaces_system_connections: string;
  identification_verification_guidance: string;
  safety_limitations: string;
  technical_reference_guidance: string;

  // Media & Visuals
  image_storage_path?: string | null;
  image_url?: string | null;
  image_title?: string | null;
  image_caption?: string | null;
  image_alt_text?: string | null;
  image_source?: string | null;
  image_source_url?: string | null;
  image_verification_status?: VerificationStatus;
  image_verified_at?: string | null;

  // Administrative Lifecycle
  status: EntryStatus;
  created_at: string;
  updated_at: string;
  review_date?: string | null;

  // Backward compatibility convenience aliases for existing UI views
  name: string;
  designation?: string;
  shortDescription: string;
  overview: string;
  purpose: string;
  operatingPrinciples: string;
  facts: string[];
  imageUrl: string;
  videoUrl?: string;
  referenceLinks?: ReferenceLink[];
  specifications?: Record<string, string>;
  stageLocation?: string;
  typicalMaterials?: string;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}

export interface CategoryInfo {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  iconName: string;
  accentColor: string;
  commonComponents: string[];
}
