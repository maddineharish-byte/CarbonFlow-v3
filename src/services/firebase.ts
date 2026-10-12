import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  User,
  Organization,
  CarbonRecord,
  TravelActivityItem,
  EvidenceItem,
  AuditItem
} from '../types';

// Silence verbose internal Firestore logs (such as 10s backend connection timeouts in iframe/sandboxed environments)
try {
  setLogLevel('silent');
} catch {
  // Ignore if already configured
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the provisioned database ID with long-polling enabled
// Long-polling guarantees fast, reliable HTTP connections inside cloud sandboxes and iframes
function createFirestoreInstance() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

// Operation Types for error telemetry per Firebase Skill standards
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Startup connection verification per SKILL.md
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      // Handled silently: client seamlessly queues or retries
    }
  }
}
if (typeof window !== 'undefined') {
  testConnection().catch(() => {});
}

// Google Sign-In helper
export async function signInWithGoogle(): Promise<{
  firebaseUser: FirebaseUser;
  appUser: User;
  organization: Organization;
}> {
  try {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const fbUser = cred.user;

    const orgId = 'org-demo-001';
    const appUser: User = {
      id: fbUser.uid,
      email: fbUser.email || 'user@carbonflow.io',
      fullName: fbUser.displayName || 'Google User',
      title: 'Sustainability Officer',
      role: fbUser.email === 'maddineharish@gmail.com' ? 'COMPANY_ADMIN' : 'SUSTAINABILITY_MANAGER',
      status: 'ACTIVE',
      active: true,
      createdAt: new Date().toISOString()
    };

    const org: Organization = {
      id: orgId,
      name: 'CarbonFlow Technologies Inc.',
      industry: 'Technology & Enterprise Software',
      country: 'United States',
      location: 'San Francisco, CA & Global Operations',
      description: 'Enterprise sustainability and Net-Zero GHG management platform.',
      reportingPeriod: '2025'
    };

    // Persist or update user in Firestore
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      await setDoc(userRef, {
        id: fbUser.uid,
        email: appUser.email,
        fullName: appUser.fullName,
        role: appUser.role,
        organizationId: orgId,
        title: appUser.title,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Could not save user profile to Firestore (will continue with session):', err);
    }

    return { firebaseUser: fbUser, appUser, organization: org };
  } catch (err) {
    console.error('Google Sign-In failed', err);
    throw err;
  }
}

// Sign Out helper
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

// ==========================================
// FIRESTORE PERSISTENCE API METHODS
// ==========================================

// 1. Carbon Records
export async function fsSaveCarbonRecord(record: CarbonRecord): Promise<void> {
  const path = `carbonRecords/${record.id}`;
  try {
    await setDoc(doc(db, 'carbonRecords', record.id), record, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsGetCarbonRecords(orgId: string): Promise<CarbonRecord[]> {
  const path = 'carbonRecords';
  try {
    const q = query(collection(db, path), where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    const records: CarbonRecord[] = [];
    snap.forEach(d => records.push(d.data() as CarbonRecord));
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fsDeleteCarbonRecord(id: string): Promise<void> {
  const path = `carbonRecords/${id}`;
  try {
    await deleteDoc(doc(db, 'carbonRecords', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 2. Travel Activities
export async function fsSaveTravelActivity(activity: TravelActivityItem): Promise<void> {
  const path = `travelActivities/${activity.id}`;
  try {
    await setDoc(doc(db, 'travelActivities', activity.id), activity, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsGetTravelActivities(orgId: string): Promise<TravelActivityItem[]> {
  const path = 'travelActivities';
  try {
    const q = query(collection(db, path), where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    const activities: TravelActivityItem[] = [];
    snap.forEach(d => activities.push(d.data() as TravelActivityItem));
    return activities;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fsDeleteTravelActivity(id: string): Promise<void> {
  const path = `travelActivities/${id}`;
  try {
    await deleteDoc(doc(db, 'travelActivities', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 3. Evidence
export async function fsSaveEvidence(item: EvidenceItem): Promise<void> {
  const path = `evidence/${item.id}`;
  try {
    await setDoc(doc(db, 'evidence', item.id), item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsGetEvidence(orgId: string): Promise<EvidenceItem[]> {
  const path = 'evidence';
  try {
    const q = query(collection(db, path), where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    const list: EvidenceItem[] = [];
    snap.forEach(d => list.push(d.data() as EvidenceItem));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// 4. Audits
export async function fsSaveAudit(audit: AuditItem): Promise<void> {
  const path = `audits/${audit.id}`;
  try {
    await setDoc(doc(db, 'audits', audit.id), audit, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsGetAudits(orgId: string): Promise<AuditItem[]> {
  const path = 'audits';
  try {
    const q = query(collection(db, path), where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    const list: AuditItem[] = [];
    snap.forEach(d => list.push(d.data() as AuditItem));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
