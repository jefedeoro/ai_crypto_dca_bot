console.log('Loading navbar.js...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded in navbar.js');
    
    // Theme toggle functionality
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

    // Mobile menu functionality
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.querySelector('.mobile-menu');
    let isMenuOpen = false;

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                mobileMenu.classList.add('show');
            } else {
                mobileMenu.classList.remove('show');
            }
            console.log('Menu clicked, isMenuOpen:', isMenuOpen);
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (isMenuOpen && !menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                isMenuOpen = false;
                mobileMenu.classList.remove('show');
                console.log('Menu closed by outside click');
            }
        });
    }

    // Wallet button functionality
    const walletBtn = document.getElementById('wallet-btn');
    if (walletBtn) {
        walletBtn.onclick = async () => {
            for (let i = 0; i < 50; i++) {
                if (window.modal) {
                    window.modal.show();
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            console.error('Modal not available after waiting');
        };
    }
});

console.log('navbar.js loaded');
