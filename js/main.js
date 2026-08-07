/**
 * UNFOLD 2026 Production UPI Payment Handshake Script
 * Android Intent Package Launchers + Custom Schemes Engine
 */

let currentConfig = getActiveConfig();

/**
 * Global Ticket Switcher Function
 * @param {string} key Ticket key ('solo' | 'duo' | 'trio' | 'team4')
 * @param {boolean} forceLock Whether to lock the selection from Tally
 */
window.switchTicket = function(key, forceLock = false) {
    // Prevent manual switching if pass is locked via Tally selection
    if (currentConfig && currentConfig.isLocked && !forceLock) {
        showToast('Pass locked based on your Tally selection');
        return;
    }

    const canonicalKey = (typeof TICKET_KEY_MAP !== 'undefined' && TICKET_KEY_MAP[key]) ? TICKET_KEY_MAP[key] : key;
    if (!canonicalKey || typeof TICKET_TIERS === 'undefined' || !TICKET_TIERS[canonicalKey]) {
        console.warn('Invalid ticket key:', key);
        return;
    }

    const tier = TICKET_TIERS[canonicalKey];
    const newConfig = {
        ...currentConfig,
        amount: tier.amount,
        ticketLabel: tier.name || tier.label,
        ticketDescription: tier.description,
        transactionNote: tier.note || 'UNFOLD 2026',
        ticketKey: canonicalKey,
        isLocked: forceLock || currentConfig.isLocked
    };

    // Direct synchronous active tab toggle for 0ms visual shift
    const tabs = document.querySelectorAll('.ticket-tab');
    if (tabs) {
        tabs.forEach(tab => {
            const isMatch = (tab.getAttribute('data-ticket') === canonicalKey);
            tab.classList.toggle('active', isMatch);
            tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });
    }

    try {
        if (window.history && window.history.replaceState) {
            const newUrl = window.location.pathname + `?ticket=${canonicalKey}${newConfig.isLocked ? '&lock=true' : ''}`;
            window.history.replaceState(null, '', newUrl);
        }
    } catch (e) {}

    renderPaymentDetails(newConfig);
};

/**
 * Render all payment details for current active pass
 * @param {Object} cfg 
 */
function renderPaymentDetails(cfg) {
    currentConfig = cfg;
    const upiDeepLink = getUpiDeepLink(cfg);

    // Select DOM Elements
    const amountValEl = document.getElementById('amountVal');
    const payeeValEl = document.getElementById('payeeVal');
    const upiIdValEl = document.getElementById('upiIdVal');
    const ticketLabelEl = document.getElementById('ticketLabel');
    const ticketSummaryNoteEl = document.getElementById('ticketSummaryNote');
    const ticketTabs = document.querySelectorAll('.ticket-tab');
    const selectorLabelRow = document.querySelector('.selector-label-row');

    if (payeeValEl) payeeValEl.textContent = cfg.payeeName;
    if (upiIdValEl) upiIdValEl.textContent = cfg.upiId;

    // Handle Unselected Initial State
    if (!cfg.ticketKey) {
        if (amountValEl) amountValEl.textContent = 'Select Pass';
        if (ticketLabelEl) ticketLabelEl.textContent = 'Select Pass';
        if (ticketSummaryNoteEl) ticketSummaryNoteEl.textContent = 'Complete Step 1 (Registration Form) above or select your pass below';
        
        if (selectorLabelRow) {
            const badgeEl = selectorLabelRow.querySelector('.selected-badge-indicator');
            if (badgeEl) {
                badgeEl.innerHTML = `Select Registration Pass`;
                badgeEl.classList.remove('badge-locked');
            }
        }

        if (ticketTabs) {
            ticketTabs.forEach(tab => {
                tab.classList.remove('active', 'locked-inactive', 'locked-active');
                tab.setAttribute('aria-selected', 'false');
                tab.removeAttribute('disabled');
            });
        }
        return;
    }

    // Handle Locked / Selected Pass Tabs when linked or selected
    if (ticketTabs) {
        ticketTabs.forEach(tab => {
            const key = tab.getAttribute('data-ticket');
            const isSelected = (key === cfg.ticketKey);
            
            tab.classList.toggle('active', isSelected);
            tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');

            if (cfg.isLocked) {
                if (isSelected) {
                    tab.classList.remove('locked-inactive');
                    tab.classList.add('locked-active');
                    tab.removeAttribute('disabled');
                } else {
                    tab.classList.add('locked-inactive');
                    tab.classList.remove('locked-active');
                    tab.setAttribute('disabled', 'true');
                }
            } else {
                tab.classList.remove('locked-inactive', 'locked-active');
                tab.removeAttribute('disabled');
            }
        });
    }

    if (selectorLabelRow) {
        const badgeEl = selectorLabelRow.querySelector('.selected-badge-indicator');
        if (badgeEl) {
            if (cfg.isLocked) {
                badgeEl.innerHTML = `🔒 Locked from Tally Selection`;
                badgeEl.classList.add('badge-locked');
            } else {
                badgeEl.innerHTML = `✓ Selected`;
                badgeEl.classList.remove('badge-locked');
            }
        }
    }

    // Update Amount & Text Details
    const formattedAmount = isNaN(Number(cfg.amount)) ? cfg.amount : Number(cfg.amount).toLocaleString('en-IN');
    if (amountValEl) amountValEl.textContent = `₹${formattedAmount}`;
    if (ticketLabelEl) ticketLabelEl.textContent = cfg.ticketLabel || cfg.name || 'Solo Pass';
    if (ticketSummaryNoteEl) ticketSummaryNoteEl.textContent = cfg.ticketDescription || 'Includes registration & full bootcamp access';

    // Update Document Title
    if (cfg.ticketLabel && cfg.ticketLabel !== 'Standard Registration') {
        document.title = `UNFOLD 2026 Payment - ${cfg.ticketLabel}`;
    }
}

/**
 * Builds app-specific Android Intent & Custom Scheme URIs
 * @param {string} baseUri 
 * @returns {Object} Deep link targets for each app
 */
function buildAppDeepLinks(baseUri) {
    const rawParams = baseUri.replace('upi://pay?', '');
    const encodedParams = rawParams;

    return {
        any: baseUri,
        // Google Pay
        gpay: `gpay://upi/pay?${rawParams}`,
        gpayIntent: `intent://pay?${encodedParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,

        // Super.money
        supermoney: `supermoney://pay?${rawParams}`,
        supermoneyIntent: `intent://pay?${encodedParams}#Intent;scheme=upi;package=com.supermoney.app;end`,

        // Slice
        slice: `slice://pay?${rawParams}`,
        sliceIntent: `intent://pay?${encodedParams}#Intent;scheme=upi;package=ind.pay.slice;end`,

        // BHIM
        bhim: `bhim://pay?${rawParams}`,
        bhimIntent: `intent://pay?${encodedParams}#Intent;scheme=upi;package=in.org.npci.upiapp;end`
    };
}

/**
 * Universal UPI Link Launcher
 * @param {string} url 
 */
function launchUpiLink(url) {
    window.location.href = url;
}

// Initial DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    currentConfig = getActiveConfig();
    renderPaymentDetails(currentConfig);

    // Desktop Device Notice Logic
    const desktopNotice = document.getElementById('desktopNotice');
    const isMobile = checkIsMobile();
    if (!isMobile && desktopNotice) {
        desktopNotice.classList.remove('hidden');
    }

    // Copy Handlers with Visual Button Morphing Feedback
    const copyAmountBtn = document.getElementById('copyAmountBtn');
    const copyUpiBtn = document.getElementById('copyUpiBtn');

    if (copyAmountBtn) {
        copyAmountBtn.addEventListener('click', () => {
            const formatted = isNaN(Number(currentConfig.amount)) ? currentConfig.amount : Number(currentConfig.amount).toLocaleString('en-IN');
            copyToClipboard(currentConfig.amount, `Amount ₹${formatted} copied!`, copyAmountBtn, 'Copy');
        });
    }

    if (copyUpiBtn) {
        copyUpiBtn.addEventListener('click', () => {
            copyToClipboard(currentConfig.upiId, 'UPI ID copied to clipboard!', copyUpiBtn, 'Copy UPI ID');
        });
    }

    // Completion Checkbox & Modal Handlers
    const chkCompleted = document.getElementById('chkCompleted');
    const completionModal = document.getElementById('completionModal');
    const btnCloseModal = document.getElementById('btnCloseModal');

    if (chkCompleted) {
        chkCompleted.addEventListener('change', () => {
            if (chkCompleted.checked) {
                if (currentConfig.completionUrl && currentConfig.completionUrl.startsWith('http')) {
                    window.location.href = currentConfig.completionUrl;
                } else {
                    if (completionModal) completionModal.classList.add('active');
                }
            }
        });
    }

    if (btnCloseModal && completionModal) {
        btnCloseModal.addEventListener('click', () => {
            completionModal.classList.remove('active');
        });

        completionModal.addEventListener('click', (e) => {
            if (e.target === completionModal) {
                completionModal.classList.remove('active');
            }
        });
    }
});

/**
 * Mobile device check
 */
function checkIsMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent) || (window.innerWidth <= 768 && ('ontouchstart' in window));
}

/**
 * Copy to clipboard helper with button morphing
 */
function copyToClipboard(text, successMsg, buttonEl, defaultLabel) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            triggerCopySuccess(successMsg, buttonEl, defaultLabel);
        }).catch(() => {
            fallbackCopy(text, successMsg, buttonEl, defaultLabel);
        });
    } else {
        fallbackCopy(text, successMsg, buttonEl, defaultLabel);
    }
}

function triggerCopySuccess(successMsg, buttonEl, defaultLabel) {
    showToast(successMsg);
    if (buttonEl) {
        const textSpan = buttonEl.querySelector('span') || buttonEl;
        textSpan.textContent = '✓ Copied!';
        buttonEl.classList.add('copied');

        setTimeout(() => {
            textSpan.textContent = defaultLabel;
            buttonEl.classList.remove('copied');
        }, 2000);
    }
}

function fallbackCopy(text, successMsg, buttonEl, defaultLabel) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        triggerCopySuccess(successMsg, buttonEl, defaultLabel);
    } catch (err) {
        showToast('Failed to copy text.');
    }
    document.body.removeChild(textArea);
}

let toastTimeout;
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;
    toastMessage.textContent = msg;
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

/**
 * Tally Form PostMessage Listener for Auto-Locking Step 2 Pass
 * Automatically detects the Registration Category (team count) chosen in the embedded Tally form.
 */
window.addEventListener('message', (event) => {
    if (!event || !event.data) return;

    let payloadStr = '';
    if (typeof event.data === 'string') {
        payloadStr = event.data;
    } else if (typeof event.data === 'object') {
        try {
            payloadStr = JSON.stringify(event.data);
        } catch (e) {
            payloadStr = '';
        }
    }

    if (!payloadStr) return;

    // Detect pass key from Tally message payload
    const detectedKey = detectPassFromPayload(payloadStr);
    if (detectedKey) {
        window.switchTicket(detectedKey, true);
    }
});

/**
 * Parses Tally payload strings or objects to extract Registration Category
 * @param {string} str Raw payload JSON or string
 * @returns {string|null} Canonical ticket key ('solo'|'duo'|'trio'|'team4')
 */
function detectPassFromPayload(str) {
    if (!str || typeof str !== 'string') return null;
    const lower = str.toLowerCase();

    // 1. Check Team of 4 / Quad / 4
    if (
        lower.includes('team of 4') || lower.includes('team of four') || 
        lower.includes('4 members') || lower.includes('4 member') || 
        lower.includes('4 participants') || lower.includes('4 participant') || 
        lower.includes('team4') || lower.includes('quad')
    ) {
        return 'team4';
    }

    // 2. Check Team of 3 / Trio / 3
    if (
        lower.includes('team of 3') || lower.includes('team of three') || 
        lower.includes('3 members') || lower.includes('3 member') || 
        lower.includes('3 participants') || lower.includes('3 participant') || 
        lower.includes('team3') || lower.includes('trio')
    ) {
        return 'trio';
    }

    // 3. Check Team of 2 / Duo / 2
    if (
        lower.includes('team of 2') || lower.includes('team of two') || 
        lower.includes('2 members') || lower.includes('2 member') || 
        lower.includes('2 participants') || lower.includes('2 participant') || 
        lower.includes('team2') || lower.includes('duo')
    ) {
        return 'duo';
    }

    // 4. Check Solo / 1
    if (
        lower.includes('solo') || lower.includes('individual') || 
        lower.includes('1 member') || lower.includes('1 participant') || 
        lower.includes('solo pass') || lower.includes('single')
    ) {
        return 'solo';
    }

    return null;
}
