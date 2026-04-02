# Deploy Now (No Backend)

## 1) One-command release gate
```bash
npm run verify:release
```

This runs:
- `npm run typecheck -- --pretty false`
- `npm run test -- --run`
- `npm run build`

## 2) Deploy to Vercel
PowerShell:
```powershell
$env:VERCEL_TOKEN="your_vercel_token"
npm run deploy:vercel
```

If this is the first deploy for the project:
```powershell
npx vercel link
```

## 3) Deploy to Netlify
PowerShell:
```powershell
$env:NETLIFY_AUTH_TOKEN="your_netlify_token"
npm run deploy:netlify
```

## 3.1) Instant deploy (no account required)
```powershell
npm run deploy:now
```
Returns:
- temporary site URL
- access password
- claim command (to attach to your Netlify account later)

If you manage multiple sites, set site id:
```powershell
$env:NETLIFY_SITE_ID="your_site_id"
npx netlify link
```

## 4) Why these configs are required
The project uses browser features that require cross-origin isolation:
- `SharedArrayBuffer`
- high-performance worker + wasm pipelines

So production must return:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

Already configured in:
- `vercel.json`
- `netlify.toml`
- `public/_headers`
- `public/_redirects`

## 5) Local production preview
```bash
npm run build
npm run serve:dist
```
