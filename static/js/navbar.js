console.log('Loading navbar.js...');

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded in navbar.js');
    
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'light' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'light' ? '☀️' : '🌙';
    });

    // Add wallet button click handler with polling for modal
    const walletBtn = document.getElementById('wallet-btn');
    console.log('Wallet button element:', walletBtn);
    
    if (walletBtn) {
        console.log('Adding click listener to wallet button');
        walletBtn.onclick = async () => {
            console.log('Wallet button clicked');
            // Poll for modal availability
            for (let i = 0; i < 50; i++) {
                console.log('Checking for modal...', { modal: window.modal, selector: window.selector });
                if (window.modal) {
                    console.log('Modal found, showing...');
                    window.modal.show();
                    return;
                }
                console.log('Modal not available, waiting...');
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            console.error('Modal not available after waiting');
        };
    }
});

console.log('navbar.js loaded');
