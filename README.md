# UNFOLD'26 Production-Ready UPI Payment Redirect Page

A high-performance, mobile-first, production-ready payment redirect handoff page for **UNFOLD'26** (Powered by IEEE IA/IE/PELS Kerala).

---

## Key Refinement Features

- 📱 **Mobile & Desktop Split Logic**:
  - **Mobile**: Automatically triggers `upi://pay` app launch with spinner *"Opening your UPI app..."*. Reveals fallback after 2s if app doesn't open.
  - **Desktop**: Skips redirect attempt, hides spinner immediately, and displays friendly notice:
    > 📱 **UPI payments work best on a mobile device.** Scan the QR code below using any UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.) to complete your payment.
- 🎟️ **URL Parameter Reusability (Multi-Ticket Support)**:
  - Supports predefined presets via `?ticket=solo`, `?ticket=duo`, `?ticket=trio`, `?ticket=team4`.
  - Supports explicit overrides via `?amount=1200`, `?upiId=...`, `?payee=...`, `?note=...`, `?next=https://tally.so/r/your-form`.
- 💳 **High Visual Payment Hierarchy**:
  - Hero **PAY ₹799** badge with ticket pass pill (`SOLO PASS`, `DUO PASS`, etc.).
- 🏷️ **Subtle Event Branding**:
  - *"Powered by IEEE IA/IE/PELS Kerala"* header tag & *"Official Payment Portal for UNFOLD'26"* footer.
- ✅ **"✓ I've Completed Payment" Action**:
  - Prominent emerald button at the bottom linking directly to your registration form or confirmation modal.

---

## URL Parameter Reference & Examples

### 1. Predefined Ticket Presets & Links
- **Solo Pass** (`?ticket=solo`): ₹799
  `https://pay.unfold26.in/?ticket=solo`
- **Duo Pass** (`?ticket=duo`): ₹1,398
  `https://pay.unfold26.in/?ticket=duo`
- **Trio Pass** (`?ticket=trio`): ₹2,097
  `https://pay.unfold26.in/?ticket=trio`
- **Team of 4 Pass** (`?ticket=team4`): ₹2,796
  `https://pay.unfold26.in/?ticket=team4`

### 2. Custom Parameters & Redirect Return URL
```
index.html?amount=999&note=UNFOLD2026-Workshop&label=Workshop%20Pass&next=https://tally.so/r/my-completion-form
```

---

## File Structure

```
UNFOLD 2026/
├── index.html              # HTML5 structure & metadata
├── css/
│   └── style.css           # IEEE Blue styling, hero PAY badge, completion modal
├── js/
│   ├── config.js           # Ticket tiers catalog, URL param parser, UPI URI builder
│   ├── qrcode.min.js       # Client-side QR engine
│   └── main.js             # Mobile auto-redirect, desktop split logic & toast controller
├── assets/
│   └── favicon.svg         # IEEE Blue SVG Favicon
└── README.md
```

---

## Deployment (Zero Backend Required)

- **Vercel**: `npx vercel`
- **Netlify**: Drag and drop folder onto Netlify Drop
- **GitHub Pages**: Turn on GitHub Pages on `main` branch

---

## Security Hardening Status

Implemented in code/config:
- Strict security headers in `/vercel.json`:
  - `Content-Security-Policy`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Strict-Transport-Security`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`
  - Existing `X-Content-Type-Options` and `X-Frame-Options` retained
- Removed inline `onclick` handlers to support strict `script-src 'self'` CSP.
- Production guardrails in `/js/config.js`:
  - Blocks URL overrides of `amount` and `upiId` outside localhost/dev.
  - Validates `next` redirect URL against an allowlist (`tally.so`, `unfold26.in`) and allows same-origin redirects.

Required GitHub/Org settings (manual, outside codebase):
- Set repo visibility to **Private** and disable forking.
- Require MFA/2FA for all org members/collaborators.
- Enforce branch protection (PR reviews, required checks, no force-push, no delete).
- Enable Dependabot alerts + security updates.
- Enable secret scanning + push protection.
- Enable code scanning (CodeQL) and private vulnerability reporting.
- Restrict and rotate secrets/tokens; use protected production environments.
