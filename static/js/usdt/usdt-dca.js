// usdt-dca.js - Handles USDT DCA contract interactions
const contractId = "test2.dca-near.testnet";
const USDT_CONTRACT = "usdt.fakes.testnet";

// Top up USDT
export async function topUpUsdt() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        // get amount from usdt_amount_topup
        const amount = document.getElementById("usdt_amount_topup").value;

        // Convert to USDT amount (multiply by 10 power 6)
        const [integerPart = "0", decimalPart = ""] = amount.toString().split(".");
        const paddedDecimal = (decimalPart + "0".repeat(6)).slice(0, 6);
        const depositAmountUSDT = integerPart + paddedDecimal;

        await wallet.signAndSendTransaction({
            receiverId: USDT_CONTRACT,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "ft_transfer_call",
                        args: {
                            receiver_id: contractId,
                            amount: depositAmountUSDT.toString(),
                            msg: ""
                        },
                        gas: "100000000000000",
                        deposit: "1"  // 1 yoctoNEAR required for ft_transfer_call
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
export async function withdrawUsdtNear() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");
        
        const withdrawAmount = document.getElementById('near_amount_withdraw').value;

        if (!withdrawAmount) {
            alert("Please enter an amount to withdraw.");
            return;
        }

        // Convert withdrawAmount to yoctoNEAR using BigInt
        const withdrawAmountYocto = BigInt(Math.round(parseFloat(withdrawAmount) * 1e24));

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw_near",
                        args: { 
                            amount: withdrawAmountYocto.toString(),
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
export async function withdrawUsdtFT() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        const withdrawAmount = document.getElementById('usdt_amount_withdraw').value;
    
        if (!withdrawAmount) {
            alert("Please enter an amount to withdraw.");
            return;
        }

        // Convert withdrawAmount to USDT decimal format (6 decimals)
        const withdrawAmountUSDT = BigInt(Math.round(parseFloat(withdrawAmount) * 1e6));
        
        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw_ft",
                        args: {
                            amount: withdrawAmountUSDT.toString(),
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
