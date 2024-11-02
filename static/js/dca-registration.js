class DCARegistration {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'dca-registration-card';
        this.render(); // Render informational content on initialization
    }

    render() {
        // Update the HTML content with step explanations and Telegram section
        this.container.innerHTML = `
            <div class="registration-content">
                <h2>Getting Started with NEAR Dollar Cost Averaging (DCA)</h2>
                <p>Our DCA service helps automate your investment strategy on NEAR Protocol. Here’s a quick guide to setting up:</p>

                <h3>Steps to Set Up DCA Investment</h3>
                <ol class="dca-steps">
                    <li>
                        <strong>Connect Your Wallet:</strong> Begin by connecting your NEAR wallet. This connection allows you to interact with the smart contract and manage your investments securely.
                    </li>
                    <li>
                        <strong>Configure Your Investment:</strong> Specify details such as the cryptocurrency you want to invest in, the amount for each interval, and how frequently you'd like the investments to occur (e.g., every hour, daily, etc.). 
                    </li>
                    <li>
                        <strong>Start Your Investment Cycle:</strong> Once configured, the DCA service will automatically execute investments at your chosen intervals, helping to average your entry price over time.
                    </li>
                    <li>
                        <strong>Review and Manage:</strong> You can monitor your active investments in the dashboard, pause or resume the cycle as needed, and make adjustments if your goals change.
                    </li>
                </ol>

                <h3>Stay Informed with Real-Time Notifications</h3>
                <p>Receive real-time updates for each investment by joining our Telegram bot. This service provides you with timely information on executed trades and helps you stay on top of your investments.</p>

                <div class="telegram-section">
                    <div class="telegram-info">
                        <div class="telegram-qr">
                            <img src="/static/images/telegram_t_me_neardcabot-qr.png" alt="Telegram Bot QR Code">
                        </div>
                        <div class="telegram-link">
                            <button onclick="window.open('https://t.me/neardcabot', '_blank')" class="dca-btn dca-btn-primary">
                                <i class="fab fa-telegram"></i> Join our Telegram Bot
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }
}

// Initialize the component
document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('register-usdt-btn');
    if (!registerBtn) return;

    // Hide button by default
    registerBtn.classList.add('d-none');

    // Show button only when needed
    window.addEventListener('walletConnected', () => {
        const isRegistered = document.body.getAttribute('data-register') === 'true';
        if (!isRegistered) {
            registerBtn.classList.remove('d-none');
        }
    });

    // Watch for registration state changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-register') {
                const isRegistered = document.body.getAttribute('data-register') === 'true';
                if (isRegistered) {
                    registerBtn.classList.add('d-none');
                } else {
                    registerBtn.classList.remove('d-none');
                }
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-register']
    });
});

// Export registration check function
export async function checkRegistration() {
    const registerBtn = document.getElementById('register-usdt-btn');
    if (!registerBtn) return;

    const isRegistered = document.body.getAttribute('data-register') === 'true';
    if (isRegistered) {
        registerBtn.classList.add('d-none');
    } else {
        registerBtn.classList.remove('d-none');
    }
}
