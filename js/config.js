/**
 * UNFOLD 2026 Production UPI Payment Configuration Engine
 * Configurable ticket catalog, URL query parser, and ticket descriptions
 */

// Predefined Ticket Tier Catalog
const TICKET_TIERS = {
    'solo': {
        name: 'Solo Pass',
        amount: '799',
        label: 'Solo Pass',
        note: 'UNFOLD 2026',
        description: 'Includes 1 participant registration & full bootcamp access'
    },
    'duo': {
        name: 'Duo Pass',
        amount: '1398',
        label: 'Duo Pass',
        note: 'UNFOLD 2026',
        description: 'Includes 2 participants registration & full bootcamp access'
    },
    'trio': {
        name: 'Trio Pass',
        amount: '2097',
        label: 'Trio Pass',
        note: 'UNFOLD 2026',
        description: 'Includes 3 participants registration & full bootcamp access'
    },
    'team4': {
        name: 'Team of 4 Pass',
        amount: '2796',
        label: 'Team of 4 Pass',
        note: 'UNFOLD 2026',
        description: 'Includes 4 participants registration & full bootcamp access'
    }
};

// Base Default Configuration
const BASE_CONFIG = {
    amount: "799",
    upiId: "8281651978@slc",
    payeeName: "KEVIN GEORGE (UNFOLD'26)",
    transactionNote: "UNFOLD 2026",
    ticketLabel: "Solo Pass",
    ticketDescription: "Includes 1 participant registration & full bootcamp access",
    completionUrl: "#completionModal",
    autoRedirectDelay: 500,
    fallbackDelay: 2000,
    allowSensitiveQueryOverridesInDevOnly: true,
    allowedCompletionDomains: [
        'tally.so',
        'www.tally.so',
        'unfold26.in',
        'www.unfold26.in'
    ]
};

function isProductionEnvironment() {
    if (typeof window === 'undefined' || !window.location) return false;
    const host = (window.location.hostname || '').toLowerCase();
    return !(host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local'));
}

function sanitizeAmount(amountValue, fallbackValue) {
    const value = String(amountValue || '').trim();
    if (!/^\d+(\.\d{1,2})?$/.test(value)) return fallbackValue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallbackValue;
    return value;
}

function sanitizeUpiId(upiValue, fallbackValue) {
    const value = String(upiValue || '').trim();
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value)) return fallbackValue;
    return value;
}

function isAllowedHost(hostname, allowlist) {
    const host = String(hostname || '').toLowerCase();
    return (allowlist || []).some(domain => {
        const allowed = String(domain || '').toLowerCase();
        return host === allowed || host.endsWith(`.${allowed}`);
    });
}

function sanitizeCompletionUrl(nextUrl, fallbackUrl, allowlist) {
    const value = String(nextUrl || '').trim();
    if (!value) return fallbackUrl;
    if (value.startsWith('#')) return value;
    if (typeof window === 'undefined' || !window.location) return fallbackUrl;

    try {
        const parsed = new URL(value, window.location.origin);
        const isSameOrigin = parsed.origin === window.location.origin;
        const isHttps = parsed.protocol === 'https:';
        if (isSameOrigin) return parsed.href;
        if (isHttps && isAllowedHost(parsed.hostname, allowlist)) return parsed.href;
        return fallbackUrl;
    } catch (error) {
        return fallbackUrl;
    }
}

/**
 * Parses URL query parameters and builds active configuration.
 * @returns {Object} Final merged active configuration
 */
function getActiveConfig() {
    const active = { ...BASE_CONFIG };

    if (typeof window === 'undefined' || !window.location) {
        return active;
    }

    const urlParams = new URLSearchParams(window.location.search);

    // 1. Check for ticket preset tier (?ticket=solo | duo | trio | team4)
    const ticketParam = urlParams.get('ticket');
    if (ticketParam && TICKET_TIERS[ticketParam.toLowerCase()]) {
        const key = ticketParam.toLowerCase();
        const tier = TICKET_TIERS[key];
        active.amount = tier.amount;
        active.ticketLabel = tier.name || tier.label;
        active.ticketDescription = tier.description;
        active.transactionNote = tier.note;
        active.ticketKey = key;
    } else {
        active.ticketKey = 'solo';
    }

    // 2. Direct Query Parameter overrides
    const isProd = isProductionEnvironment();
    const allowSensitiveOverrides = !isProd || !active.allowSensitiveQueryOverridesInDevOnly;
    if (allowSensitiveOverrides && urlParams.has('amount')) {
        active.amount = sanitizeAmount(urlParams.get('amount'), active.amount);
    }
    if (allowSensitiveOverrides && urlParams.has('upiId')) {
        active.upiId = sanitizeUpiId(urlParams.get('upiId'), active.upiId);
    }
    if (urlParams.has('payee')) active.payeeName = urlParams.get('payee');
    if (urlParams.has('note')) active.transactionNote = urlParams.get('note');
    if (urlParams.has('label')) active.ticketLabel = urlParams.get('label');
    if (urlParams.has('desc')) active.ticketDescription = urlParams.get('desc');
    if (urlParams.has('next')) {
        active.completionUrl = sanitizeCompletionUrl(
            urlParams.get('next'),
            active.completionUrl,
            active.allowedCompletionDomains
        );
    }

    return active;
}

/**
 * Builds standard UPI Deep Link URL
 * Format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 * @param {Object} config Optional custom config
 * @returns {string} Fully encoded UPI Deep Link
 */
function getUpiDeepLink(config) {
    const cfg = config || getActiveConfig();
    const params = new URLSearchParams({
        pa: cfg.upiId,
        pn: cfg.payeeName,
        am: cfg.amount,
        cu: 'INR',
        tn: cfg.transactionNote
    });
    return `upi://pay?${params.toString()}`;
}

// Export for module environments if present
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BASE_CONFIG,
        TICKET_TIERS,
        getActiveConfig,
        getUpiDeepLink,
        sanitizeCompletionUrl,
        sanitizeAmount,
        sanitizeUpiId,
        isProductionEnvironment
    };
}
