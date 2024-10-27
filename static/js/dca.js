// static/js/dca.js

document.addEventListener("DOMContentLoaded", function() {
    // Fetch token data from the mock JSON file and populate dropdowns
    fetch("mockData/mockTokens.json")
        .then(response => response.json())
        .then(data => {
            const tradingPairSelect = document.getElementById("trading-pair");
            const tokenSelect = document.getElementById("token_select");
            data.tokens.forEach(token => {
                const tradingOption = document.createElement("option");
                tradingOption.value = token.address;
                tradingOption.textContent = token.name;
                tradingPairSelect.appendChild(tradingOption);

                const cashoutOption = document.createElement("option");
                cashoutOption.value = token.address;
                cashoutOption.textContent = token.name;
                tokenSelect.appendChild(cashoutOption);
            });
        })
        .catch(error => console.error("Error loading tokens: ", error));

    const dcaForm = document.getElementById('dca-setup-form');
    const cashoutForm = document.getElementById('cashout-form');

    // Handle DCA Form Submission (register_user)
    dcaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const totalAmount = parseFloat(document.getElementById('total_amount').value) || 0;
        const intervalSeconds = parseInt(document.getElementById('interval').value);
        const intervalNanos = intervalSeconds * 1_000_000_000; // Convert to nanoseconds

        // Ensure interval is multiple of 5 minutes (300 seconds)
        if (intervalSeconds % 300 !== 0) {
            alert('Interval must be a multiple of 5 minutes');
            return;
        }

        try {
            // Call register_user function
            const response = await fetch('/api/dca/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount_per_swap: totalAmount.toString(),
                    swap_interval: intervalNanos.toString()
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert('DCA Investment successfully registered!');
                refreshDashboard();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during DCA registration:', error);
            alert('An error occurred while setting up DCA.');
        }
    });

    // Handle Cash Out Form Submission
    cashoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tokenType = document.getElementById('token_select').value;
        const amount = parseFloat(document.getElementById('cashout_amount').value) || 0;

        try {
            // Determine which withdrawal endpoint to use based on token type
            const endpoint = tokenType === 'NEAR' ? '/api/dca/withdraw-near' : '/api/dca/withdraw-ft';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount.toString()
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert('Withdrawal successful!');
                refreshDashboard();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during withdrawal:', error);
            alert('An error occurred while processing withdrawal.');
        }
    });

    // Add topup functionality
    async function topup() {
        try {
            const response = await fetch('/api/dca/topup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert('Topup successful!');
                refreshDashboard();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during topup:', error);
            alert('An error occurred while processing topup.');
        }
    }

    // Add pause functionality
    async function pauseDCA() {
        try {
            const response = await fetch('/api/dca/pause', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert('DCA paused successfully!');
                refreshDashboard();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during pause:', error);
            alert('An error occurred while pausing DCA.');
        }
    }

    // Add resume functionality
    async function resumeDCA() {
        try {
            const response = await fetch('/api/dca/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert('DCA resumed successfully!');
                refreshDashboard();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during resume:', error);
            alert('An error occurred while resuming DCA.');
        }
    }

    // Add remove user functionality
    async function removeUser() {
        if (!confirm('Are you sure you want to remove your DCA setup? This will withdraw all your tokens.')) {
            return;
        }

        try {
            const response = await fetch('/api/dca/remove-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert('User removed successfully and tokens withdrawn!');
                refreshDashboard();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during user removal:', error);
            alert('An error occurred while removing user.');
        }
    }

    // Add refresh dashboard functionality
    async function refreshDashboard() {
        try {
            const response = await fetch('/api/dca/status');
            const data = await response.json();
            
            const dashboardBody = document.querySelector('#investment-dashboard tbody');
            dashboardBody.innerHTML = ''; // Clear existing rows
            
            if (data.investments) {
                data.investments.forEach(investment => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${investment.id}</td>
                        <td>${investment.amount}</td>
                        <td>${formatInterval(investment.interval)}</td>
                        <td>${new Date(investment.nextSwap).toLocaleString()}</td>
                        <td>${investment.status}</td>
                        <td>
                            <button onclick="topup()" class="dca-btn dca-btn-success btn-sm">Topup</button>
                            ${investment.status === 'active' 
                                ? `<button onclick="pauseDCA()" class="dca-btn dca-btn-warning btn-sm">Pause</button>`
                                : `<button onclick="resumeDCA()" class="dca-btn dca-btn-info btn-sm">Resume</button>`
                            }
                            <button onclick="removeUser()" class="dca-btn dca-btn-danger btn-sm">Remove</button>
                        </td>
                    `;
                    dashboardBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        }
    }

    // Helper function to format interval
    function formatInterval(nanoseconds) {
        const seconds = nanoseconds / 1_000_000_000;
        if (seconds >= 86400) return `${seconds / 86400} days`;
        if (seconds >= 3600) return `${seconds / 3600} hours`;
        if (seconds >= 60) return `${seconds / 60} minutes`;
        return `${seconds} seconds`;
    }

    // Initial dashboard refresh
    refreshDashboard();

    // Setup refresh button
    document.getElementById('refresh-dashboard-btn').addEventListener('click', refreshDashboard);
});
