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
    fallbackDelay: 2000
};

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
    if (urlParams.has('amount')) active.amount = urlParams.get('amount');
    if (urlParams.has('upiId')) active.upiId = urlParams.get('upiId');
    if (urlParams.has('payee')) active.payeeName = urlParams.get('payee');
    if (urlParams.has('note')) active.transactionNote = urlParams.get('note');
    if (urlParams.has('label')) active.ticketLabel = urlParams.get('label');
    if (urlParams.has('desc')) active.ticketDescription = urlParams.get('desc');
    if (urlParams.has('next')) active.completionUrl = urlParams.get('next');

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
    module.exports = { BASE_CONFIG, TICKET_TIERS, getActiveConfig, getUpiDeepLink };
}
