/**
 * UNFOLD'26 Production UPI Payment Configuration & Reusability Engine
 * 
 * Supports default payment parameters, predefined ticket tiers,
 * and dynamic URL Query Parameter overrides.
 */

// Predefined Ticket Tier Catalog
const TICKET_TIERS = {
    'solo': {
        name: 'Solo Pass',
        amount: '799',
        label: 'Solo Pass',
        note: 'UNFOLD 2026'
    },
    'duo': {
        name: 'Duo Pass',
        amount: '1398',
        label: 'Duo Pass',
        note: 'UNFOLD 2026'
    },
    'trio': {
        name: 'Trio Pass',
        amount: '2097',
        label: 'Trio Pass',
        note: 'UNFOLD 2026'
    },
    'team4': {
        name: 'Team of 4 Pass',
        amount: '2796',
        label: 'Team of 4 Pass',
        note: 'UNFOLD 2026'
    }
};

// Base Default Configuration
const BASE_CONFIG = {
    amount: "799",
    upiId: "8281651978@slc",
    payeeName: "KEVIN GEORGE (UNFOLD'26)",
    transactionNote: "UNFOLD 2026",
    ticketLabel: "Solo Pass",
    completionUrl: "#completionModal", // URL or trigger for completion step
    autoRedirectDelay: 500,  // ms before redirect on mobile
    fallbackDelay: 2000     // ms before revealing manual fallback
};

/**
 * Parses URL query parameters and builds active configuration.
 * Allows reusability via URLs like:
 *   - pay.html?ticket=solo
 *   - pay.html?ticket=duo
 *   - pay.html?amount=999&note=Special%20Workshop
 *   - pay.html?next=https://tally.so/r/your-form
 * 
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
        const tier = TICKET_TIERS[ticketParam.toLowerCase()];
        active.amount = tier.amount;
        active.ticketLabel = tier.label;
        active.transactionNote = tier.note;
    }

    // 2. Direct Query Parameter overrides (highest priority)
    if (urlParams.has('amount')) active.amount = urlParams.get('amount');
    if (urlParams.has('upiId')) active.upiId = urlParams.get('upiId');
    if (urlParams.has('payee')) active.payeeName = urlParams.get('payee');
    if (urlParams.has('note')) active.transactionNote = urlParams.get('note');
    if (urlParams.has('label')) active.ticketLabel = urlParams.get('label');
    if (urlParams.has('next')) active.completionUrl = urlParams.get('next');

    return active;
}

/**
 * Builds standard UPI Deep Link URL based on active configuration
 * Format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 * @param {Object} config Optional custom config, defaults to getActiveConfig()
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
