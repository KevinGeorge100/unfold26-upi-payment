/**
 * UNFOLD 2026 Production UPI Payment Handshake Script
 * High-Impact Handoff, Sticky Mobile Bar, QR Download & Pass Summary Engine
 */

// Global active configuration reference
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

    const tier = TICKET_TIERS[key];
    const newConfig = {
        ...currentConfig,
        amount: tier.amount,
        ticketLabel: tier.name || tier.label,
        ticketDescription: tier.description,
        transactionNote: tier.note || 'UNFOLD 2026',
        ticketKey: key
    };

    // Update URL query string without reloading page
    try {
        if (window.history && window.history.replaceState) {
            const newUrl = window.location.pathname + `?ticket=${key}`;
            window.history.replaceState(null, '', newUrl);
        }
    } catch (e) {
        // Fallback for strict sandbox iframe environments
    }

    renderPaymentDetails(newConfig);
};

/**
 * Render all payment details, deep links, QR code, and active tabs
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
    const qrContainer = document.getElementById('qrContainer');
    const ticketTabs = document.querySelectorAll('.ticket-tab');

    const appGPay = document.getElementById('appGPay');
    const appPhonePe = document.getElementById('appPhonePe');
    const appPaytm = document.getElementById('appPaytm');
    const appBhim = document.getElementById('appBhim');

    // Update Amount & Text
    const formattedAmount = isNaN(Number(cfg.amount)) ? cfg.amount : Number(cfg.amount).toLocaleString('en-IN');
    if (amountValEl) amountValEl.textContent = `₹${formattedAmount}`;
    if (stickyAmountValEl) stickyAmountValEl.textContent = `₹${formattedAmount}`;
    if (payeeValEl) payeeValEl.textContent = cfg.payeeName;
    if (upiIdValEl) upiIdValEl.textContent = cfg.upiId;
    if (ticketLabelEl) ticketLabelEl.textContent = cfg.ticketLabel || cfg.name || 'Solo Pass';
    if (ticketSummaryNoteEl) ticketSummaryNoteEl.textContent = cfg.ticketDescription || 'Includes registration & full bootcamp access';

    // Update Primary Handoff Buttons
    if (btnOpenUpi) {
        btnOpenUpi.href = appLinks.any;
        btnOpenUpi.onclick = function(e) {
            e.preventDefault();
            window.location.href = appLinks.any;
        };
    }

    if (btnStickyPay) {
        btnStickyPay.href = appLinks.any;
        btnStickyPay.onclick = function(e) {
            e.preventDefault();
            window.location.href = appLinks.any;
        };
    }

    // Update Specific App Handoff Buttons
    if (appGPay) {
        appGPay.href = appLinks.gpay;
        appGPay.onclick = function(e) { e.preventDefault(); tryLaunchApp(appLinks.gpay, appLinks.any); };
    }
    if (appPhonePe) {
        appPhonePe.href = appLinks.phonepe;
        appPhonePe.onclick = function(e) { e.preventDefault(); tryLaunchApp(appLinks.phonepe, appLinks.any); };
    }
    if (appPaytm) {
        appPaytm.href = appLinks.paytm;
        appPaytm.onclick = function(e) { e.preventDefault(); tryLaunchApp(appLinks.paytm, appLinks.any); };
    }
    if (appBhim) {
        appBhim.href = appLinks.bhim;
        appBhim.onclick = function(e) { e.preventDefault(); window.location.href = appLinks.bhim; };
    }

    // Update Document Title
    if (cfg.ticketLabel && cfg.ticketLabel !== 'Standard Registration') {
        document.title = `UNFOLD 2026 Payment - ${cfg.ticketLabel}`;
    }

    // Re-render QR Code Canvas
    if (qrContainer && typeof window.EasyQRCode === 'function') {
        window.EasyQRCode(qrContainer, upiDeepLink, 180);
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
 * Build app-specific UPI URIs for Razorpay-style direct app launch
 * @param {string} baseUri 
 * @returns {Object}
 */
function buildAppDeepLinks(baseUri) {
    const rawParams = baseUri.replace('upi://pay?', '');
    return {
        any: baseUri,
        gpay: `gpay://upi/pay?${rawParams}`,
        phonepe: `phonepe://pay?${rawParams}`,
        paytm: `paytmmp://pay?${rawParams}`,
        bhim: baseUri
    };
}

/**
 * Try launching custom scheme with fallback to standard upi://
 * @param {string} primaryScheme 
 * @param {string} fallbackScheme 
 */
function tryLaunchApp(primaryScheme, fallbackScheme) {
    let timer = setTimeout(() => {
        window.location.href = fallbackScheme;
    }, 800);

    window.location.href = primaryScheme;

    window.addEventListener('blur', () => {
        clearTimeout(timer);
    }, { once: true });
}

// Initial DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Resolve initial active config
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

    // Download QR Code Canvas Handler
    const btnDownloadQr = document.getElementById('btnDownloadQr');
    if (btnDownloadQr) {
        btnDownloadQr.addEventListener('click', () => {
            const qrCanvas = document.querySelector('#qrContainer canvas');
            if (qrCanvas) {
                const imageUri = qrCanvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `UNFOLD2026-Payment-QR-${currentConfig.ticketKey || 'pass'}.png`;
                link.href = imageUri;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('QR Code saved to downloads!');
            }
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
 * @returns {boolean}
 */
function checkIsMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent) || (window.innerWidth <= 768 && ('ontouchstart' in window));
}

/**
 * Copy to clipboard utility with button morphing
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
