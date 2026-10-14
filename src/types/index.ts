export type UserRole = 'COMPANY_ADMIN' | 'SUSTAINABILITY_MANAGER' | 'ANALYST' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  title?: string;
  phone?: string;
  role: UserRole;
  status: string;
  active: boolean;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  country: string;
  location: string;
  description: string;
  reportingPeriod: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmissionFactor {
  id: string;
  organizationId?: string;
  category: string;
  activityType: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  unit: string;
  factorValue: number;
  factorUnit: string;
  sourceReference: string;
  factorYear: number;
}

export interface CarbonRecord {
  id: string;
  organizationId: string;
  reportingPeriod: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  category: string;
  activityType: string;
  activityAmount: number;
  unit: string;
  emissionFactor: number;
  calculatedEmissions: number; // in tCO2e
  source: string;
  dataOwner: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'VALIDATED' | 'FLAGGED';
  notes?: string;
  flagReason?: string;
  isOutlier?: boolean;
  outlierSeverity?: 'HIGH' | 'MEDIUM' | 'LOW';
  outlierScore?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvidenceItem {
  id: string;
  organizationId: string;
  evidenceName: string;
  evidenceType: 'ELECTRICITY_BILL' | 'FUEL_INVOICE' | 'UTILITY_STATEMENT' | 'TRANSPORT_RECORD' | 'SUPPLIER_DECLARATION' | 'RENEWABLE_CERTIFICATE' | 'SPREADSHEET' | 'PDF_REPORT';
  reportingPeriod: string;
  source: string;
  owner: string;
  uploadDate: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  description?: string;
  fileUrl?: string;
  fileSizeBytes: number;
  mimeType: string;
  linkedCarbonDataId?: string;
  linkedAuditId?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditCarbonLink {
  id: string;
  auditId: string;
  carbonDataId: string;
  scope: string;
  category: string;
  activityType: string;
  calculatedEmissions: number;
  status: 'PENDING' | 'VALIDATED' | 'NEEDS_REVIEW' | 'REJECTED';
  reviewerId?: string;
  reviewerComments?: string;
  reviewedAt?: string;
}

export interface AuditItem {
  id: string;
  organizationId: string;
  auditName: string;
  auditPeriod: string;
  auditType: 'INTERNAL_ANNUAL' | 'GHG_PROTOCOL_INVENTORY' | 'THIRD_PARTY_ASSURANCE' | 'SUPPLIER_SCOPE_3_VERIFICATION';
  scope: 'SCOPE_1_2' | 'SCOPE_1_2_3' | 'SCOPE_3_ONLY';
  leadAuditor: string;
  startDate: string;
  dueDate: string;
  status: 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED';
  description?: string;
  completionNotes?: string;
  closedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  linkedCarbonData?: AuditCarbonLink[];
}

export interface FindingItem {
  id: string;
  organizationId: string;
  auditId: string;
  auditName?: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  relatedCarbonDataId?: string;
  relatedEvidenceId?: string;
  ownerId: string;
  ownerName?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK' | 'CLOSED';
  dueDate: string;
  resolutionDate?: string;
  resolutionNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CorrectiveActionItem {
  id: string;
  organizationId: string;
  findingId: string;
  findingTitle?: string;
  findingSeverity?: string;
  actionTitle: string;
  description: string;
  ownerId: string;
  ownerName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'VERIFIED' | 'CLOSED';
  completionDate?: string;
  completionNotes?: string;
  completionEvidenceId?: string;
  isOverdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComplianceItem {
  id: string;
  organizationId: string;
  requirementCode: string;
  framework: 'GHG_PROTOCOL' | 'ISO_14064_1' | 'CSRD_ESRS_E1' | 'SEC_CLIMATE' | 'CALIFORNIA_SB_253';
  requirementName: string;
  description: string;
  applicability: 'MANDATORY' | 'VOLUNTARY' | 'UNDER_EVALUATION';
  ownerId: string;
  ownerName?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
  dueDate?: string;
  linkedEvidenceId?: string;
  linkedEvidenceName?: string;
  linkedAuditId?: string;
  linkedAuditName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  organizationId: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  referenceEntityType?: string;
  referenceEntityId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  organizationId: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalCarbonRecords: number;
  totalEmissions: number;
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions: number;
  totalEvidenceRecords: number;
  verifiedEvidenceRecords: number;
  pendingEvidenceRecords: number;
  activeAudits: number;
  openFindings: number;
  overdueFindings: number;
  totalCorrectiveActions: number;
  overdueCorrectiveActions: number;
  compliantRequirements: number;
  totalRequirements: number;
  emissionsByScope: Array<{
    scope: string;
    recordCount: number;
    emissionsTotal: number;
    percentage: number;
  }>;
  emissionsByPeriod: Array<{
    reporting_period?: string;
    reportingPeriod?: string;
    total_emissions?: number;
    totalEmissions?: number;
  }>;
  findingsBySeverity: Array<{
    severity: string;
    count: number;
  }>;
  correctiveActionsByStatus: Array<{
    status: string;
    count: number;
  }>;
  complianceByStatus: Array<{
    status: string;
    count: number;
  }>;
  emissionsByQuarter?: Array<{
    period: string;
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
  }>;
  complianceCompletionRate?: number;
  netZeroTargetProgress?: number;
  auditReadinessScore?: number;
}

export type TravelMode = 'DRIVE' | 'TRANSIT' | 'BICYCLE' | 'WALK';
export type TripType = 'ONE_WAY' | 'ROUND_TRIP';

export interface TravelActivityItem {
  id: string;
  organizationId: string;
  userId: string;
  userFullName?: string;
  title: string;
  travelDate: string;
  tripType: TripType;
  travelMode: TravelMode;
  vehicleType?: string;
  originAddress: string;
  destinationAddress: string;
  waypointsJson?: string;
  passengerCount: number;
  oneWayDistanceKm: number;
  totalDistanceKm: number;
  durationSeconds: number;
  routingProvider: string;
  routingService: string;
  routeCalculatedAt: string;
  routeSummary?: string;
  emissionFactorId?: string;
  emissionFactorValue?: number;
  calculatedEmissions?: number;
  carbonDataId?: string;
  status: 'DRAFT' | 'PENDING' | 'CALCULATED' | 'REJECTED' | 'CANCELLED';
  notes?: string;
  provenanceMetadata?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoutePreviewRequest {
  origin: string;
  destination: string;
  waypoints?: string[];
  travelMode: TravelMode;
  tripType: TripType;
}

export interface RoutePreviewResponse {
  origin: string;
  destination: string;
  travelMode: TravelMode;
  tripType: TripType;
  oneWayDistanceMeters: number;
  oneWayDistanceKm: number;
  totalDistanceKm: number;
  durationSeconds: number;
  formattedDuration: string;
  routeSummary: string;
  encodedPolyline?: string;
  coordinates?: [number, number][];
  routingProvider: string;
  routingService: string;
  calculatedAt: string;
}

export interface CreateTravelActivityRequest {
  title?: string;
  travelDate: string;
  tripType: TripType;
  travelMode: TravelMode;
  vehicleType?: string;
  originAddress: string;
  destinationAddress: string;
  waypoints?: string[];
  passengerCount: number;
  oneWayDistanceKm: number;
  totalDistanceKm: number;
  durationSeconds: number;
  routeSummary?: string;
  notes?: string;
  emissionFactorId?: string;
  autoCalculateCarbon: boolean;
}

export type GeminiModelType = 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-3.1-pro-preview';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: GeminiModelType | string;
}

export interface ChatRequest {
  model: GeminiModelType;
  messages: Array<{ role: 'user' | 'model'; text: string }>;
  systemInstruction?: string;
}

export interface ChatRolePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  instruction: string;
  suggestedPrompts: string[];
}

export interface GpsCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number; // horizontal accuracy in meters
  altitude?: number | null;
  speed?: number | null; // meters per second
  heading?: number | null; // degrees 0-360
  timestamp: number;
}

export interface LiveGpsTrackingSession {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  coordinates: GpsCoordinate[];
  currentLocation: GpsCoordinate | null;
  originLocation: GpsCoordinate | null;
  originAddress: string;
  currentAddress: string;
  totalDistanceMeters: number;
  totalDistanceKm: number;
  roadDistanceKm?: number;
  currentSpeedKmh: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  estimatedEmissions: number;
  travelMode: TravelMode;
  vehicleType: string;
  accuracyQuality: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
  accuracyMeters: number;
  fixCount: number;
}

export * from './thresholds';

