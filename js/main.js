/**
 * UNFOLD 2026 Production UPI Payment Handshake Script
 * Android Intent Package Launchers + Custom Schemes Engine
 */

let currentConfig = getActiveConfig();

/**
 * Global Ticket Switcher Function
 * @param {string} key Ticket key ('solo' | 'duo' | 'trio' | 'team4')
 */
window.switchTicket = function(key) {
    if (!key || typeof TICKET_TIERS === 'undefined' || !TICKET_TIERS[key]) {
        console.warn('Invalid ticket key:', key);
        return;
    }

    // Direct synchronous active tab toggle for 0ms visual shift
    const tabs = document.querySelectorAll('.ticket-tab');
    if (tabs) {
        tabs.forEach(tab => {
            const isMatch = (tab.getAttribute('data-ticket') === key);
            tab.classList.toggle('active', isMatch);
            tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });
    }

    const tier = TICKET_TIERS[key];
    const newConfig = {
        ...currentConfig,
        amount: tier.amount,
        ticketLabel: tier.name || tier.label,
        ticketDescription: tier.description,
        transactionNote: tier.note || 'UNFOLD 2026',
        ticketKey: key
    };

    try {
        if (window.history && window.history.replaceState) {
            const newUrl = window.location.pathname + `?ticket=${key}`;
            window.history.replaceState(null, '', newUrl);
        }
    } catch (e) {}

    renderPaymentDetails(newConfig);
};

/**
 * Render all payment details & bind deep links for current active pass
 * @param {Object} cfg 
 */
function renderPaymentDetails(cfg) {
    currentConfig = cfg;
    const upiDeepLink = getUpiDeepLink(cfg);
    const appLinks = buildAppDeepLinks(upiDeepLink);

    // Select DOM Elements
    const amountValEl = document.getElementById('amountVal');
    const stickyAmountValEl = document.getElementById('stickyAmountVal');
    const payeeValEl = document.getElementById('payeeVal');
    const upiIdValEl = document.getElementById('upiIdVal');
    const ticketLabelEl = document.getElementById('ticketLabel');
    const ticketSummaryNoteEl = document.getElementById('ticketSummaryNote');
    const btnOpenUpi = document.getElementById('btnOpenUpi');
    const btnStickyPay = document.getElementById('btnStickyPay');
    const ticketTabs = document.querySelectorAll('.ticket-tab');

    const appGPay = document.getElementById('appGPay');
    const appSuperMoney = document.getElementById('appSuperMoney');
    const appSlice = document.getElementById('appSlice');
    const appBhim = document.getElementById('appBhim');

    // Update Amount & Text Details
    const formattedAmount = isNaN(Number(cfg.amount)) ? cfg.amount : Number(cfg.amount).toLocaleString('en-IN');
    if (amountValEl) amountValEl.textContent = `₹${formattedAmount}`;
    if (stickyAmountValEl) stickyAmountValEl.textContent = `₹${formattedAmount}`;
    if (payeeValEl) payeeValEl.textContent = cfg.payeeName;
    if (upiIdValEl) upiIdValEl.textContent = cfg.upiId;
    if (ticketLabelEl) ticketLabelEl.textContent = cfg.ticketLabel || cfg.name || 'Solo Pass';
    if (ticketSummaryNoteEl) ticketSummaryNoteEl.textContent = cfg.ticketDescription || 'Includes registration & full bootcamp access';

    // 1. Primary Any UPI App Buttons
    if (btnOpenUpi) {
        btnOpenUpi.href = appLinks.any;
        btnOpenUpi.onclick = function(e) {
            e.preventDefault();
            launchUpiLink(appLinks.any);
        };
    }

    if (btnStickyPay) {
        btnStickyPay.href = appLinks.any;
        btnStickyPay.onclick = function(e) {
            e.preventDefault();
            launchUpiLink(appLinks.any);
        };
    }

    // 2. Specific Direct App Launchers (Google Pay, Super.money, Slice, BHIM)
    if (appGPay) {
        appGPay.href = appLinks.gpayIntent || appLinks.gpay;
        appGPay.onclick = function(e) {
            e.preventDefault();
            launchTargetApp(appLinks.gpayIntent, appLinks.gpay, appLinks.any);
        };
    }

    if (appSuperMoney) {
        appSuperMoney.href = appLinks.supermoneyIntent || appLinks.supermoney;
        appSuperMoney.onclick = function(e) {
            e.preventDefault();
            launchTargetApp(appLinks.supermoneyIntent, appLinks.supermoney, appLinks.any);
        };
    }

    if (appSlice) {
        appSlice.href = appLinks.sliceIntent || appLinks.slice;
        appSlice.onclick = function(e) {
            e.preventDefault();
            launchTargetApp(appLinks.sliceIntent, appLinks.slice, appLinks.any);
        };
    }

    if (appBhim) {
        appBhim.href = appLinks.bhimIntent || appLinks.bhim;
        appBhim.onclick = function(e) {
            e.preventDefault();
            launchTargetApp(appLinks.bhimIntent, appLinks.bhim, appLinks.any);
        };
    }

    // Update Document Title
    if (cfg.ticketLabel && cfg.ticketLabel !== 'Standard Registration') {
        document.title = `UNFOLD 2026 Payment - ${cfg.ticketLabel}`;
    }

    // Update Active Tab Highlight
    if (ticketTabs) {
        ticketTabs.forEach(tab => {
            const key = tab.getAttribute('data-ticket');
            const isSelected = (key === cfg.ticketKey);
            tab.classList.toggle('active', isSelected);
            tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
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

/**
 * Launches targeted app via Android Intent -> Custom Scheme -> Standard upi:// fallback
 * @param {string} intentUrl 
 * @param {string} customSchemeUrl 
 * @param {string} fallbackUrl 
 */
function launchTargetApp(intentUrl, customSchemeUrl, fallbackUrl) {
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid && intentUrl) {
        // Priority 1 on Android: Exact package Android Intent
        window.location.href = intentUrl;
    } else {
        // Priority 2 on iOS / other: Custom app scheme with upi:// fallback
        let timer = setTimeout(() => {
            window.location.href = fallbackUrl;
        }, 800);

        window.location.href = customSchemeUrl || fallbackUrl;

        window.addEventListener('blur', () => {
            clearTimeout(timer);
        }, { once: true });
    }
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

    const ticketTabs = document.querySelectorAll('.ticket-tab');
    if (ticketTabs) {
        ticketTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const key = tab.getAttribute('data-ticket');
                if (key) window.switchTicket(key);
            });
        });
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

    // Completion Modal Handlers
    const btnCompleted = document.getElementById('btnCompleted');
    const completionModal = document.getElementById('completionModal');
    const btnCloseModal = document.getElementById('btnCloseModal');

    if (btnCompleted) {
        btnCompleted.addEventListener('click', (e) => {
            if (currentConfig.completionUrl && currentConfig.completionUrl.startsWith('http')) {
                window.location.href = currentConfig.completionUrl;
            } else {
                e.preventDefault();
                if (completionModal) completionModal.classList.add('active');
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
