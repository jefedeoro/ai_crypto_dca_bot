// Initialize the wallet selector
async function initWalletSelector() {
    const { setupWalletSelector } = window["@near-wallet-selector/core"];
    const { setupModal } = window["@near-wallet-selector/modal-ui"];
    
    // Initialize wallet selector
    const selector = await setupWalletSelector({
        network: "testnet", // Change to "mainnet" for production
        modules: [
            // Add wallet modules here
        ],
    });

    // Initialize the modal UI
    const modal = setupModal(selector, {
        contractId: "your-contract.testnet",
    });

    return { selector, modal };
}

class WalletManager {
    constructor() {
        this.selector = null;
        this.modal = null;
        this.wallet = null;
        this.accountId = null;
    }

    async init() {
        const { selector, modal } = await initWalletSelector();
        this.selector = selector;
        this.modal = modal;

        // Check if already signed in
        const wallet = await this.selector.wallet();
        const accounts = await wallet.getAccounts();
        
        if (accounts.length > 0) {
            this.wallet = wallet;
            this.accountId = accounts[0].accountId;
            await this.signInBackend(this.accountId);
        }
        
        // Initialize UI after wallet check
        this.initUI();
    }

    async signIn() {
        const wallet = await this.selector.wallet();
        await wallet.signIn();
        
        const accounts = await wallet.getAccounts();
        if (accounts.length > 0) {
            this.wallet = wallet;
            this.accountId = accounts[0].accountId;
            await this.signInBackend(this.accountId);
            this.updateUI(true, this.accountId);
        }
    }

    async signOut() {
        if (this.wallet) {
            await this.wallet.signOut();
            this.wallet = null;
            this.accountId = null;
            
            // Sign out from backend
            await fetch('/near/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            this.updateUI(false);
        }
    }

    async signInBackend(accountId) {
        const response = await fetch('/near/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account_id: accountId,
            })
        });
        return response.json();
    }

    async checkWalletStatus() {
        try {
            const response = await fetch('/near/wallet_status');
            const data = await response.json();
            this.updateUI(data.is_connected, data.account_id);
        } catch (error) {
            console.error('Error checking wallet status:', error);
            this.updateUI(false);
        }
    }

    updateUI(isConnected, accountId = '') {
        const walletBtn = document.getElementById('wallet-btn');
        const walletInfo = document.getElementById('wallet-info');
        const accountIdSpan = document.getElementById('account-id');

        if (!walletBtn || !walletInfo || !accountIdSpan) return;

        if (isConnected) {
            walletBtn.style.display = 'none';
            walletInfo.style.display = 'flex';
            accountIdSpan.textContent = accountId;
            walletInfo.onclick = async () => {
                if (confirm('Do you want to disconnect your wallet?')) {
                    await this.signOut();
                }
            };
        } else {
            walletBtn.style.display = 'block';
            walletInfo.style.display = 'none';
            accountIdSpan.textContent = '';
            walletBtn.textContent = 'Connect Wallet';
        }
    }

    initUI() {
        const walletBtn = document.getElementById('wallet-btn');
        if (walletBtn) {
            walletBtn.addEventListener('click', async () => {
                try {
                    await this.signIn();
                } catch (error) {
                    console.error('Error connecting wallet:', error);
                    alert('Failed to connect wallet. Please try again.');
                }
            });
        }
        
        // Check initial wallet status
        this.checkWalletStatus();
    }

    isSignedIn() {
        return !!this.wallet && !!this.accountId;
    }

    getAccountId() {
        return this.accountId;
    }
}

// Create global wallet manager instance
window.walletManager = new WalletManager();

// Initialize wallet manager when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await window.walletManager.init();
});
