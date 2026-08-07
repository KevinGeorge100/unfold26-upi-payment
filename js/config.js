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
    '1': {
        name: 'Solo Pass',
        amount: '799',
        label: 'Solo Pass',
        note: 'UNFOLD 2026',
        description: 'Includes 1 participant registration & full bootcamp access'
    },
    'team2': {
        name: 'Team of 2',
        amount: '1398',
        label: 'Team of 2',
        note: 'UNFOLD 2026',
        description: 'Includes 2 participants registration & full bootcamp access'
    },
    '2': {
        name: 'Team of 2',
        amount: '1398',
        label: 'Team of 2',
        note: 'UNFOLD 2026',
        description: 'Includes 2 participants registration & full bootcamp access'
    },
    'duo': {
        name: 'Team of 2',
        amount: '1398',
        label: 'Team of 2',
        note: 'UNFOLD 2026',
        description: 'Includes 2 participants registration & full bootcamp access'
    },
    'team3': {
        name: 'Team of 3',
        amount: '2097',
        label: 'Team of 3',
        note: 'UNFOLD 2026',
        description: 'Includes 3 participants registration & full bootcamp access'
    },
    '3': {
        name: 'Team of 3',
        amount: '2097',
        label: 'Team of 3',
        note: 'UNFOLD 2026',
        description: 'Includes 3 participants registration & full bootcamp access'
    },
    'trio': {
        name: 'Team of 3',
        amount: '2097',
        label: 'Team of 3',
        note: 'UNFOLD 2026',
        description: 'Includes 3 participants registration & full bootcamp access'
    },
    'team4': {
        name: 'Team of 4',
        amount: '2796',
        label: 'Team of 4',
        note: 'UNFOLD 2026',
        description: 'Includes 4 participants registration & full bootcamp access'
    },
    '4': {
        name: 'Team of 4',
        amount: '2796',
        label: 'Team of 4',
        note: 'UNFOLD 2026',
        description: 'Includes 4 participants registration & full bootcamp access'
    }
};

// Canonical mapping for primary ticket keys
const TICKET_KEY_MAP = {
    'solo': 'solo',
    '1': 'solo',
    'team2': 'duo',
    '2': 'duo',
    'duo': 'duo',
    'team3': 'trio',
    '3': 'trio',
    'trio': 'trio',
    'team4': 'team4',
    '4': 'team4'
};

// Base Default Configuration
const BASE_CONFIG = {
    amount: "799",
    upiId: "8281651978@slc",
    payeeName: "KEVIN GEORGE",
    transactionNote: "UNFOLD 2026",
    ticketLabel: "Solo Pass",
    ticketDescription: "Includes 1 participant registration & full bootcamp access",
    completionUrl: "#completionModal",
    autoRedirectDelay: 500,
    fallbackDelay: 2000
};

/**
 * Parses URL query parameters and builds active configuration.
 * Sanitizes input to prevent XSS or unauthorized parameter manipulation.
 * @returns {Object} Final merged active configuration
 */
function getActiveConfig() {
    const active = { ...BASE_CONFIG };

    if (typeof window === 'undefined' || !window.location) {
        return active;
    }

    const urlParams = new URLSearchParams(window.location.search);

    // 1. Check for ticket preset tier (?ticket=solo | team2 | team3 | team4 | 1 | 2 | 3 | 4)
    const rawTicket = urlParams.get('ticket');
    if (rawTicket && TICKET_TIERS[rawTicket.toLowerCase()]) {
        const key = rawTicket.toLowerCase();
        const tier = TICKET_TIERS[key];
        active.amount = tier.amount;
        active.ticketLabel = tier.name || tier.label;
        active.ticketDescription = tier.description;
        active.transactionNote = tier.note;
        active.ticketKey = TICKET_KEY_MAP[key] || 'solo';
        active.isLocked = true; // Auto-lock mode when loaded from Tally embed
    } else {
        active.ticketKey = 'solo';
        active.isLocked = false;
    }

    // Explicit lock override parameter (?lock=true)
    if (urlParams.has('lock')) {
        active.isLocked = urlParams.get('lock') !== 'false';
    }

    // 2. Strict Input Sanitization for direct overrides
    if (urlParams.has('amount')) {
        const rawAmt = urlParams.get('amount').replace(/[^0-9.]/g, '');
        if (rawAmt && !isNaN(Number(rawAmt))) active.amount = rawAmt;
    }
    if (urlParams.has('upiId')) {
        const rawUpi = urlParams.get('upiId').trim();
        if (/^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/.test(rawUpi)) active.upiId = rawUpi;
    }
    if (urlParams.has('payee')) {
        active.payeeName = escapeHtml(urlParams.get('payee'));
    }
    if (urlParams.has('note')) {
        active.transactionNote = escapeHtml(urlParams.get('note'));
    }

    return active;
}

/**
 * Simple HTML Escaper for XSS Prevention
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Builds standard UPI Deep Link URL
 * Format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 * @param {Object} config Optional custom config
 * @returns {string} Fully encoded UPI Deep Link
 */
function getUpiDeepLink(config) {
    const cfg = config || getActiveConfig();
    // Manually build UPI deep link to avoid URL-encoding the '@' in the UPI ID (pa).
    // URLSearchParams encodes '@' as '%40', which BHIM and some UPI apps display
    // literally instead of decoding it — resulting in "8281651978%40slc" on screen.
    // The UPI deep link spec allows '@' to remain unencoded in the pa field.
    const pa = cfg.upiId; // Keep '@' raw — do NOT use encodeURIComponent here
    const pn = encodeURIComponent(cfg.payeeName);
    const am = encodeURIComponent(cfg.amount);
    const cu = 'INR';
    const tn = encodeURIComponent(cfg.transactionNote);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;
}

// Export for module environments if present
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BASE_CONFIG, TICKET_TIERS, getActiveConfig, getUpiDeepLink };
}
