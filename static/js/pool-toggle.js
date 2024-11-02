// pool-toggle.js - Handles pool selection toggle functionality

// Constants for pool types
export const POOL_TYPE = {
    NEAR_TO_USDT: 'near-to-usdt',
    USDT_TO_NEAR: 'usdt-to-near'
};

// Get selected pool from localStorage or default to NEAR_TO_USDT
export function getSelectedPool() {
    return localStorage.getItem('selectedPool') || POOL_TYPE.NEAR_TO_USDT;
}

// Update UI based on selected pool
export function updatePoolVisibility(poolType = getSelectedPool()) {
    console.log(`Updating pool visibility for: ${poolType}`); // Debugging output
    const nearToUsdtElements = [
        document.querySelector('.investment-dashboard:not(:last-child)'),
        document.getElementById('near-to-usdt-card')
    ];

    const usdtToNearElements = [
        document.querySelector('.investment-dashboard:last-child'),
        document.getElementById('usdt-to-near-card')
    ];

    // Update toggle state
    const toggle = document.getElementById('poolToggle');
    if (toggle) {
        toggle.checked = poolType === POOL_TYPE.USDT_TO_NEAR;
    }

    // Update toggle text active states
    const leftText = document.querySelector('.pool-toggle-text-left');
    const rightText = document.querySelector('.pool-toggle-text-right');
    if (leftText) leftText.classList.toggle('active', poolType === POOL_TYPE.NEAR_TO_USDT);
    if (rightText) rightText.classList.toggle('active', poolType === POOL_TYPE.USDT_TO_NEAR);

    // Update visibility
    nearToUsdtElements.forEach(el => {
        if (el) {
            el.style.display = poolType === POOL_TYPE.NEAR_TO_USDT ? 'block' : 'none';
            console.log(`NEAR to USDT element visibility: ${el.style.display}`); // Debugging output
        }
    });

    usdtToNearElements.forEach(el => {
        if (el) {
            el.style.display = poolType === POOL_TYPE.USDT_TO_NEAR ? 'block' : 'none';
            console.log(`USDT to NEAR element visibility: ${el.style.display}`); // Debugging output
        }
    });

    // Trigger dashboard refreshes
    if (window.refreshDashboard) {
        window.refreshDashboard();
    }
    if (window.refreshUsdtDashboard) {
        window.refreshUsdtDashboard();
    }
}

// Initialize toggle functionality
export function initializePoolToggle() {
    const toggle = document.getElementById('poolToggle');
    if (!toggle) return;

    // Set initial state
    const currentPool = getSelectedPool();
    toggle.checked = currentPool === POOL_TYPE.USDT_TO_NEAR;
    updatePoolVisibility(currentPool);

    // Handle toggle changes
    toggle.addEventListener('change', (e) => {
        const newPool = e.target.checked ? POOL_TYPE.USDT_TO_NEAR : POOL_TYPE.NEAR_TO_USDT;
        localStorage.setItem('selectedPool', newPool);
        updatePoolVisibility(newPool);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePoolToggle);
