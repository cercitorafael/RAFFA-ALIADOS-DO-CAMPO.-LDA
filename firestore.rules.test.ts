/**
 * Security Rule Verification Specification Tests for Raffa Aliados do Campo
 * Verifies the "Dirty Dozen" adversarial payloads against Firestore rules invariants.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  payload?: Record<string, unknown>;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Product Create',
    collection: 'products',
    operation: 'create',
    auth: null,
    payload: { id: 'p1', name: 'Hack', category: 'milho' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Non-Admin Product Update',
    collection: 'products',
    operation: 'update',
    auth: { uid: 'user-1', email: 'attacker@example.com', email_verified: true },
    payload: { name: 'Hacked Name' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Admin Email Spoof',
    collection: 'products',
    operation: 'create',
    auth: { uid: 'spoof', email: 'raffaaliadosdocampo@gmail.com', email_verified: false },
    payload: { id: 'p2', name: 'Spoofed Seed' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Quote',
    collection: 'quotes',
    operation: 'create',
    auth: null,
    payload: {
      name: 'Client',
      phone: '840000000',
      location: 'Ribaue',
      selectedCategory: 'Sementes',
      selectedProduct: 'Milho',
      areaOrQuantity: '2 ha',
      status: 'pending',
      ghostAdminFlag: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Path Variable ID Poisoning',
    collection: 'products',
    operation: 'create',
    auth: { uid: 'admin', email: 'raffaaliadosdocampo@gmail.com', email_verified: true },
    payload: { id: 'bad.id/with$chars' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Backdated Client Timestamp on Quote',
    collection: 'quotes',
    operation: 'create',
    auth: null,
    payload: {
      name: 'Client',
      phone: '840000000',
      location: 'Ribaue',
      selectedCategory: 'Sementes',
      selectedProduct: 'Milho',
      areaOrQuantity: '2 ha',
      status: 'pending',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Quote Status Shortcutting to Resolved on Create',
    collection: 'quotes',
    operation: 'create',
    auth: null,
    payload: {
      name: 'Client',
      phone: '840000000',
      location: 'Ribaue',
      selectedCategory: 'Sementes',
      selectedProduct: 'Milho',
      areaOrQuantity: '2 ha',
      status: 'resolved',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'PII Leak Attempt on Quotes List',
    collection: 'quotes',
    operation: 'list',
    auth: { uid: 'user-2', email: 'visitor@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'PII Leak Attempt on Contact Messages Get',
    collection: 'contact_messages',
    operation: 'get',
    auth: { uid: 'user-2', email: 'visitor@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Oversized Varieties Array (> 30)',
    collection: 'products',
    operation: 'create',
    auth: { uid: 'admin', email: 'raffaaliadosdocampo@gmail.com', email_verified: true },
    payload: {
      id: 'p-big-list',
      varieties: Array.from({ length: 50 }, (_, i) => `Var ${i}`),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Oversized Contact Message (> 2500 chars)',
    collection: 'contact_messages',
    operation: 'create',
    auth: null,
    payload: {
      name: 'Spammer',
      message: 'x'.repeat(3000),
      status: 'pending',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Assigned Admin Escalation',
    collection: 'admins',
    operation: 'create',
    auth: { uid: 'attacker', email: 'attacker@example.com', email_verified: true },
    payload: { uid: 'attacker', email: 'attacker@example.com' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
