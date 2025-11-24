# Cross-Origin Configuration for Private Network

## What Was Changed

Updated `next.config.mjs` to allow development access from your private network range **10.10.10.0/19**.

## Configuration Added

```javascript
allowedDevOrigins: [
  'omr-frontend-dev.gt:3000',
  '*.gt:3000',
  // Allow any IP in the 10.10.10.0/19 range (10.10.0.0 - 10.10.31.255)
  /^http:\/\/10\.10\.(([0-9]|1[0-9]|2[0-9]|3[0-1]))\.\d{1,3}:3000$/,
],
```

## What This Allows

### Hostnames
- ✅ `http://omr-frontend-dev.gt:3000`
- ✅ Any `*.gt:3000` hostname (e.g., `http://other-service.gt:3000`)

### IP Range (10.10.10.0/19)
- ✅ `10.10.0.0` - `10.10.31.255` (all IPs in this range)
- ✅ Your current server: `10.10.24.193:3000`

## Why This Was Needed

Next.js detected cross-origin requests when accessing the dev server via `omr-frontend-dev.gt` instead of `localhost`. This configuration tells Next.js that these origins are trusted for development.

## Restart Required

After making this change, **restart your dev server**:

```bash
# Stop current server (Ctrl+C if running)
pnpm dev
```

## Verification

After restart, you should **no longer see** this warning:
```
⚠ Cross origin request detected from omr-frontend-dev.gt to /_next/* resource
```

## Production Note

This configuration only affects **development mode** (`pnpm dev`). It does not apply to production builds and has no security impact on production deployments.

---

**Updated:** 2025-11-24
