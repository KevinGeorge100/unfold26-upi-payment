/**
 * UNFOLD'26 Production UPI Payment Redirect Main Script
 * Handles dynamic content population, query params, desktop/mobile split flow,
 * QR code rendering, clipboard utilities, and completion handoff.
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
    const redirectLoadingBox = document.getElementById('redirectLoadingBox');
    const desktopNotice = document.getElementById('desktopNotice');
    const fallbackSection = document.getElementById('fallbackSection');
    const qrContainer = document.getElementById('qrContainer');
    const copyAmountBtn = document.getElementById('copyAmountBtn');
    const copyUpiBtn = document.getElementById('copyUpiBtn');
    const btnCompleted = document.getElementById('btnCompleted');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const ticketTabs = document.querySelectorAll('.ticket-tab');

    // Completion Modal Elements
    const completionModal = document.getElementById('completionModal');
    const btnCloseModal = document.getElementById('btnCloseModal');

    /**
     * Render UI components based on target configuration
     * @param {Object} cfg 
     */
    function renderPaymentDetails(cfg) {
        currentConfig = cfg;
        const upiDeepLink = getUpiDeepLink(cfg);

        const formattedAmount = isNaN(Number(cfg.amount)) ? cfg.amount : Number(cfg.amount).toLocaleString('en-IN');
        if (amountValEl) amountValEl.textContent = `₹${formattedAmount}`;
        if (payeeValEl) payeeValEl.textContent = cfg.payeeName;
        if (upiIdValEl) upiIdValEl.textContent = cfg.upiId;
        if (ticketLabelEl) ticketLabelEl.textContent = cfg.ticketLabel || cfg.name || 'Solo Pass';
        if (btnOpenUpi) btnOpenUpi.href = upiDeepLink;

        // Update Document Title
        if (cfg.ticketLabel && cfg.ticketLabel !== 'Standard Registration') {
            document.title = `UNFOLD'26 Payment - ${cfg.ticketLabel}`;
        }

        // Render QR Code
        if (qrContainer && typeof window.EasyQRCode === 'function') {
            window.EasyQRCode(qrContainer, upiDeepLink, 180);
        }

        // Highlight Active Ticket Tab
        if (ticketTabs) {
            ticketTabs.forEach(tab => {
                const isSelected = (tab.getAttribute('data-ticket') === cfg.ticketKey);
                tab.classList.toggle('active', isSelected);
                tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            });
        }
    }

    // Initial render
    renderPaymentDetails(currentConfig);

    // Bind Ticket Selection Tabs
    if (ticketTabs) {
        ticketTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const key = tab.getAttribute('data-ticket');
                if (TICKET_TIERS[key]) {
                    const newConfig = {
                        ...currentConfig,
                        amount: TICKET_TIERS[key].amount,
                        ticketLabel: TICKET_TIERS[key].name,
                        transactionNote: TICKET_TIERS[key].note,
                        ticketKey: key
                    };
                    
                    // Update URL query string without page reload
                    if (window.history && window.history.replaceState) {
                        const newUrl = window.location.pathname + `?ticket=${key}`;
                        window.history.replaceState(null, '', newUrl);
                    }

                    renderPaymentDetails(newConfig);
                }
            });
        });
    }

    // 5. Device Detection & Split Flow Execution
    const isMobile = checkIsMobile();

    if (isMobile) {
        // Mobile Mode: Show redirect loading spinner, hide desktop notice
        if (redirectLoadingBox) redirectLoadingBox.classList.remove('hidden');
        if (desktopNotice) desktopNotice.classList.add('hidden');
        if (fallbackSection) fallbackSection.classList.add('hidden');

        // Step 1: Attempt automatic UPI app launch after autoRedirectDelay (~500ms)
        setTimeout(() => {
            window.location.href = upiDeepLink;
        }, config.autoRedirectDelay || 500);

        // Step 2: Reveal fallback options after fallbackDelay (~2000ms) if user remains on page
        setTimeout(() => {
            if (redirectLoadingBox) redirectLoadingBox.classList.add('hidden');
            if (fallbackSection) fallbackSection.classList.remove('hidden');
        }, config.fallbackDelay || 2000);

    } else {
        // Desktop Mode: DO NOT attempt auto redirect. Hide spinner, show desktop notice & QR fallback immediately
        if (redirectLoadingBox) redirectLoadingBox.classList.add('hidden');
        if (desktopNotice) desktopNotice.classList.remove('hidden');
        if (fallbackSection) fallbackSection.classList.remove('hidden');
    }

    // 6. Copy to Clipboard Event Listeners
    if (copyAmountBtn) {
        copyAmountBtn.addEventListener('click', () => {
            copyToClipboard(config.amount, `Amount ₹${config.amount} copied!`);
        });
    }

    if (copyUpiBtn) {
        copyUpiBtn.addEventListener('click', () => {
            copyToClipboard(config.upiId, 'UPI ID copied to clipboard!');
        });
    }

    // 7. "I've Completed Payment" Action Listener
    if (btnCompleted) {
        btnCompleted.addEventListener('click', (e) => {
            if (config.completionUrl && config.completionUrl.startsWith('http')) {
                // If custom URL (e.g. Tally form return URL) specified in config or query param ?next=...
                window.location.href = config.completionUrl;
            } else {
                // Open default completion instruction modal
                e.preventDefault();
                if (completionModal) completionModal.classList.add('active');
            }
        });
    }

    if (btnCloseModal && completionModal) {
        btnCloseModal.addEventListener('click', () => {
            completionModal.classList.remove('active');
        });

        // Close on backdrop click
        completionModal.addEventListener('click', (e) => {
            if (e.target === completionModal) {
                completionModal.classList.remove('active');
            }
        });
    }

    /**
     * Mobile device detector
     * @returns {boolean} True if user is on mobile browser
     */
    function checkIsMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return mobileRegex.test(userAgent) || (window.innerWidth <= 768 && ('ontouchstart' in window));
    }

    /**
     * Copy text to clipboard with toast notification feedback
     * @param {string} text 
     * @param {string} successMsg 
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

    /**
     * Legacy copy fallback for non-HTTPS environments
     */
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

    /**
     * Display toast notification at screen bottom
     * @param {string} msg 
     */
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
