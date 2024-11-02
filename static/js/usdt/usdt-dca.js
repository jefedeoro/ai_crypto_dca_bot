// usdt-dca.js - Handles USDT DCA contract interactions
const contractId = "test2.dca-near.testnet";
const USDT_CONTRACT = "usdt.fakes.testnet";

// Top up USDT
export async function topUpUsdt(amount) {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        // Convert to USDT amount (6 decimals)
        const [integerPart = "0", decimalPart = ""] = amount.toString().split(".");
        const paddedDecimal = (decimalPart + "0".repeat(6)).slice(0, 6);
        const depositAmountUSDT = integerPart + paddedDecimal;

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "topup",
                        args: {},
                        gas: "100000000000000",
                        deposit: depositAmountUSDT
                    }
                }
            ]
        });
        return true;
    } catch (error) {
        console.error("Error during USDT top-up:", error);
        throw error;
    }
}

// Withdraw NEAR
export async function withdrawUsdtNear(amount) {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        const withdrawAmountYocto = BigInt(Math.round(parseFloat(amount) * 1e24)).toString();

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw_near",
                        args: { 
                            amount: withdrawAmountYocto,
                            reverse: true
                        },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });
        return true;
    } catch (error) {
        console.error("Error during NEAR withdrawal:", error);
        throw error;
    }
}

// Withdraw USDT
export async function withdrawUsdtFT(amount) {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        // Convert to USDT amount (6 decimals)
        const [integerPart = "0", decimalPart = ""] = amount.toString().split(".");
        const paddedDecimal = (decimalPart + "0".repeat(6)).slice(0, 6);
        const withdrawAmountUSDT = integerPart + paddedDecimal;

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw_ft",
                        args: {
                            amount: withdrawAmountUSDT,
                            reverse: true
                        },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });
        return true;
    } catch (error) {
        console.error("Error during USDT withdrawal:", error);
        throw error;
    }
}

// Pause DCA
export async function pauseUsdtDCA() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "pause",
                        args: { reverse: true },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });
        return true;
    } catch (error) {
        console.error("Error pausing USDT DCA:", error);
        throw error;
    }
}

// Resume DCA
export async function resumeUsdtDCA() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "resume",
                        args: { reverse: true },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });
        return true;
    } catch (error) {
        console.error("Error resuming USDT DCA:", error);
        throw error;
    }
}

// Remove user
export async function removeUsdtUser() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "remove_user",
                        args: { reverse: true },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });
        return true;
    } catch (error) {
        console.error("Error removing USDT user:", error);
        throw error;
    }
}

// Change swap interval
export async function changeUsdtSwapInterval(newInterval) {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "change_swap_interval",
                        args: { 
                            swap_interval: newInterval,
                            reverse: true
                        },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });
        return true;
    } catch (error) {
        console.error("Error changing swap interval:", error);
        throw error;
    }
}
