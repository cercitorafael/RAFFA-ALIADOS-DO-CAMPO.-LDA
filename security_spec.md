# Firestore Security Rules Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Public Catalog Read / Admin-Only Write**: Public visitors can read `products`, `featured_info`, `brand_settings`, and `meta`, while only the verified administrator (`raffaaliadosdocampo@gmail.com` with `email_verified == true` or explicit entry in `/admins/{uid}`) can create, update, or delete items.
2. **PII Isolation (`quotes`, `contact_messages`)**: Unauthenticated or standard customers can create a quote or contact message only with `status == 'pending'`, valid string boundaries, and `createdAt == request.time`. Only verified administrators can read (`get` / `list`), update status (`status`, `updatedAt`), or delete quotes and contact messages.
3. **Strict Document Shape & Key Allowlists**: Every write rejects unknown ("shadow") fields via `hasAll` + `hasOnly` on create and `affectedKeys().hasOnly(...)` + full `isValid[Entity]` on update.
4. **Immutable Creation Timestamps & Path IDs**: `createdAt` cannot be modified after creation (`incoming().createdAt == existing().createdAt`), and `productId` / `infoId` must match `^[a-zA-Z0-9_-]+$` (`<= 128` chars) and equal `incoming().id`.
5. **Bounded Payloads**: Every string and array (`varieties <= 30`) has explicit upper bounds to prevent resource-exhaustion attacks.

## 2. The "Dirty Dozen" Attack Payloads
1. **Unauthenticated Product Creation**: Anonymous client attempts `create` on `/products/p1` -> `PERMISSION_DENIED`.
2. **Non-Admin Product Update**: Signed-in non-admin user attempts `update` on `/products/p1` -> `PERMISSION_DENIED`.
3. **Email Spoofing Attack**: Signed-in user with `email == 'raffaaliadosdocampo@gmail.com'` but `email_verified == false` attempts write -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Admin or visitor attempts `create` with `{ ..., isAdmin: true }` -> `PERMISSION_DENIED`.
5. **ID Poisoning**: Client attempts write to `/products/..%2Fadmin_hack` or 1.5KB ID string -> `PERMISSION_DENIED`.
6. **Client Timestamp Tampering**: Visitor submits `/quotes/q1` with backdated `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
7. **Status Shortcutting on Create**: Visitor submits `/quotes/q1` with `status: 'resolved'` -> `PERMISSION_DENIED`.
8. **PII Read Leak (Quote)**: Non-admin user attempts `get` or `list` on `/quotes` -> `PERMISSION_DENIED`.
9. **PII Read Leak (Contact Message)**: Non-admin user attempts `get` or `list` on `/contact_messages` -> `PERMISSION_DENIED`.
10. **Oversized Array Injection**: Admin attempts `create` on `/products/p1` with `varieties` containing 100 items -> `PERMISSION_DENIED`.
11. **Oversized String Injection**: Visitor submits `/contact_messages/m1` with `message` > 2500 characters -> `PERMISSION_DENIED`.
12. **Privilege Escalation**: Non-admin user attempts `create` on `/admins/{uid}` -> `PERMISSION_DENIED`.
