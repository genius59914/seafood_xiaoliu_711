# Security Specification: Shipping Helper (Family App)

## 1. Data Invariants
- A `store` must have a valid `ownerId` that matches the creator's UID.
- A `store` must include the owner's email in `allowedEmails`.
- Only a user with `ownerId` or whose verified email is inside `allowedEmails` can read/write access `orders` inside that `store`.
- An `order` must contain exact keys, strictly validated types, and strict server timestamps for `createdAt` and `updatedAt`.
- The `trackingNumber` field must not exceed a reasonable length to prevent "Denial of Wallet".
- Updating an order must only target specific keys via MapDiff (`affectedKeys().hasOnly(...)`).

## 2. The "Dirty Dozen" Payloads
1. **Ghost Field Injection**: Adding `isVerified: true` to a `store` creation payload.
2. **Identity Spoofing**: Creating a `store` with `ownerId` set to another user's UID.
3. **Array Poisoning**: Injecting 10,000 items into `allowedEmails`.
4. **List Type Breaking**: Setting `allowedEmails` to `[1, 2, 3]` instead of strings.
5. **Missing Required Fields**: Creating an `order` missing `trackingNumber`.
6. **Denial of Wallet String**: Sending an `order` with a 2MB `trackingNumber`.
7. **Time Traveling**: Sending a past timestamp in `createdAt`.
8. **Owner Lockout**: Updating `ownerId` in `store` to hijack the store.
9. **Blanket Read Request**: Client attempting to query `stores` without enforcing owner/email conditions.
10. **State Corruption**: Updating `status` of an `order` to an invalid enum string (e.g. `delivered`).
11. **Relational Disconnect**: Creating an `order` in a `storeId` that doesn't exist.
12. **Unauthorized Access**: Reading an `order` from a `storeId` where the user's email is not in `allowedEmails`.

## 3. Test Runner Definition
(In production environments, a full suite utilizing `@firebase/rules-unit-testing` would systematically test the exact 'allow/deny' behavior mapped to these 12 scenarios.)
