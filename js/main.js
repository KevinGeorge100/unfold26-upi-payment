/**
 * UNFOLD 2026 Production UPI Payment Handshake Script
 * Razorpay-Grade App Selector & Pass Switcher Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Resolve Active Configuration (from query params or presets)
    let currentConfig = getActiveConfig();

    // 2. Select DOM Elements
    const amountValEl = document.getElementById('amountVal');
    const payeeValEl = document.getElementById('payeeVal');
    const upiIdValEl = document.getElementById('upiIdVal');
    const ticketLabelEl = document.getElementById('ticketLabel');
    const btnOpenUpi = document.getElementById('btnOpenUpi');
    const desktopNotice = document.getElementById('desktopNotice');
    const qrContainer = document.getElementById('qrContainer');
    const copyAmountBtn = document.getElementById('copyAmountBtn');
    const copyUpiBtn = document.getElementById('copyUpiBtn');
    const btnCompleted = document.getElementById('btnCompleted');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const ticketTabs = document.querySelectorAll('.ticket-tab');

    // Individual App Chips
    const appGPay = document.getElementById('appGPay');
    const appPhonePe = document.getElementById('appPhonePe');
    const appPaytm = document.getElementById('appPaytm');
    const appBhim = document.getElementById('appBhim');

    // Completion Modal Elements
    const completionModal = document.getElementById('completionModal');
    const btnCloseModal = document.getElementById('btnCloseModal');

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
     * Render UI components based on target configuration
     * @param {Object} cfg 
     */
    function renderPaymentDetails(cfg) {
        currentConfig = cfg;
        const upiDeepLink = getUpiDeepLink(cfg);
        const appLinks = buildAppDeepLinks(upiDeepLink);

        // Update Amount & Text Details
        const formattedAmount = isNaN(Number(cfg.amount)) ? cfg.amount : Number(cfg.amount).toLocaleString('en-IN');
        if (amountValEl) amountValEl.textContent = `₹${formattedAmount}`;
        if (payeeValEl) payeeValEl.textContent = cfg.payeeName;
        if (upiIdValEl) upiIdValEl.textContent = cfg.upiId;
        if (ticketLabelEl) ticketLabelEl.textContent = cfg.ticketLabel || cfg.name || 'Solo Pass';

        // Update Main Primary Handoff Link
        if (btnOpenUpi) {
            btnOpenUpi.href = appLinks.any;
            btnOpenUpi.onclick = (e) => {
                e.preventDefault();
                window.location.href = appLinks.any;
            };
        }

        // Update Specific App Links
        if (appGPay) {
            appGPay.href = appLinks.gpay;
            appGPay.onclick = (e) => { e.preventDefault(); tryLaunchApp(appLinks.gpay, appLinks.any); };
        }
        if (appPhonePe) {
            appPhonePe.href = appLinks.phonepe;
            appPhonePe.onclick = (e) => { e.preventDefault(); tryLaunchApp(appLinks.phonepe, appLinks.any); };
        }
        if (appPaytm) {
            appPaytm.href = appLinks.paytm;
            appPaytm.onclick = (e) => { e.preventDefault(); tryLaunchApp(appLinks.paytm, appLinks.any); };
        }
        if (appBhim) {
            appBhim.href = appLinks.bhim;
            appBhim.onclick = (e) => { e.preventDefault(); window.location.href = appLinks.bhim; };
        }

        // Update Document Title
        if (cfg.ticketLabel && cfg.ticketLabel !== 'Standard Registration') {
            document.title = `UNFOLD 2026 Payment - ${cfg.ticketLabel}`;
        }

        // Render QR Code Canvas
        if (qrContainer && typeof window.EasyQRCode === 'function') {
            window.EasyQRCode(qrContainer, upiDeepLink, 180);
        }

        // Highlight Active Ticket Tab
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
     * Try launching specific custom app scheme with fallback to standard upi://
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

    // Initial render
    renderPaymentDetails(currentConfig);

    // Bind Ticket Selection Tabs (Click Handler)
    if (ticketTabs) {
        ticketTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetBtn = e.currentTarget;
                const key = targetBtn.getAttribute('data-ticket');
                if (key && TICKET_TIERS[key]) {
                    const newConfig = {
                        ...currentConfig,
                        amount: TICKET_TIERS[key].amount,
                        ticketLabel: TICKET_TIERS[key].name,
                        transactionNote: TICKET_TIERS[key].note,
                        ticketKey: key
                    };

                    // Update URL query parameter without page reload
                    if (window.history && window.history.replaceState) {
                        const newUrl = window.location.pathname + `?ticket=${key}`;
                        window.history.replaceState(null, '', newUrl);
                    }

                    renderPaymentDetails(newConfig);
                }
            });
        });
    }

    // Desktop Device Notice Logic
    const isMobile = checkIsMobile();
    if (!isMobile && desktopNotice) {
        desktopNotice.classList.remove('hidden');
    }

    // Copy to Clipboard Handlers
    if (copyAmountBtn) {
        copyAmountBtn.addEventListener('click', () => {
            const formatted = isNaN(Number(currentConfig.amount)) ? currentConfig.amount : Number(currentConfig.amount).toLocaleString('en-IN');
            copyToClipboard(currentConfig.amount, `Amount ₹${formatted} copied!`);
        });
    }

    if (copyUpiBtn) {
        copyUpiBtn.addEventListener('click', () => {
            copyToClipboard(currentConfig.upiId, 'UPI ID copied to clipboard!');
        });
    }

    // Completion Button Handler
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
     * Copy helper function
     */
    function copyToClipboard(text, successMsg) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(successMsg);
            }).catch(() => {
                fallbackCopy(text, successMsg);
            });
        } else {
            fallbackCopy(text, successMsg);
        }
    }

    function fallbackCopy(text, successMsg) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(successMsg);
        } catch (err) {
            showToast('Failed to copy text.');
        }
        document.body.removeChild(textArea);
    }

    let toastTimeout;
    function showToast(msg) {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = msg;
        toast.classList.add('show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
});
