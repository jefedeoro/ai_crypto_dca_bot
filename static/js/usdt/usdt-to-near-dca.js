// usdt-to-near-dca.js - Handles USDT to NEAR DCA registration
import { checkUSDTStorage, registerUSDTStorage } from '../near-wallet.js';

const contractId = "test2.dca-near.testnet";
const USDT_CONTRACT = "usdt.fakes.testnet";

// Register USDT to NEAR DCA
export async function registerUsdtToNearDCA(usdtAmount, frequency) {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) {
            throw new Error("Wallet not connected");
        }

        const accounts = await wallet.getAccounts();
        if (!accounts.length) {
            throw new Error("No account selected");
        }

        // First check if user has USDT storage registered
        const hasStorage = await checkUSDTStorage(accounts[0].accountId);
        if (!hasStorage) {
            // Register storage first
            await registerUSDTStorage();
        }

        // Convert USDT amount to proper format (6 decimals)
        const [integerPart = "0", decimalPart = ""] = usdtAmount.toString().split(".");
        const paddedDecimal = (decimalPart + "0".repeat(6)).slice(0, 6);
        const usdtAmountFormatted = integerPart + paddedDecimal;

        // Send registration and USDT transfer in a single transaction
        await wallet.signAndSendTransactions({
            transactions: [
                {
                    receiverId: contractId,
                    actions: [
                        {
                            type: "FunctionCall",
                            params: {
                                methodName: "register_user",
                                args: {
                                    amount_per_swap: usdtAmountFormatted.toString(),
                                    swap_interval: parseInt(frequency),
                                    reverse: true
                                },
                                gas: "180000000000000",
                                deposit: "1000000000000000000000000" // 1 NEAR
                            }
                        }
                    ]
                },
                {
                    receiverId: USDT_CONTRACT,
                    actions: [
                        {
                            type: "FunctionCall",
                            params: {
                                methodName: "ft_transfer_call",
                                args: {
                                    receiver_id: contractId,
                                    amount: usdtAmountFormatted.toString(),
                                    msg: ""
                                },
                                gas: "100000000000000",
                                deposit: "1"  // 1 yoctoNEAR required for ft_transfer_call
                            }
                        }
                    ]
                }
            ]
        });

        // Refresh the dashboard after successful registration
        if (window.refreshUsdtDashboard) {
            window.refreshUsdtDashboard();
        }

        return true;
    } catch (error) {
        console.error("Error registering USDT to NEAR DCA:", error);
        throw error;
    }
}

// Export function to window for use in HTML
window.registerUsdtToNearDCA = registerUsdtToNearDCA;
