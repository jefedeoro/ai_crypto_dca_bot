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

    // Handle DCA Form Submission
    dcaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather form data
        const totalAmount = parseFloat(document.getElementById('total_amount').value) || 0;
        const interval = document.getElementById('interval').value;
        const endDate = document.getElementById('end_date').value;
        const tradingPair = document.getElementById('trading-pair').value;

        // Prepare data payload
        const payload = {
            total_amount: totalAmount,
            interval: interval,
            end_date: endDate,
            trading_pair: tradingPair
        };

        try {
            // Send POST request to set up new DCA investment
            const response = await fetch('/api/dca/setup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'success') {
                alert('DCA Investment successfully set up!');
                // Optionally refresh the dashboard or clear the form
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during DCA setup:', error);
            alert('An error occurred while setting up DCA.');
        }
    });

    // Handle Cash Out Form Submission
    cashoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather form data
        const tokenSelect = document.getElementById('token_select').value;
        const cashoutAmount = parseFloat(document.getElementById('cashout_amount').value) || 0;

        // Prepare data payload
        const payload = {
            token: tokenSelect,
            amount: cashoutAmount
        };

        try {
            // Send POST request to cash out tokens
            const response = await fetch('/api/dca/cashout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'success') {
                alert('Tokens cashed out successfully!');
                // Optionally refresh the dashboard or clear the form
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during token cash out:', error);
            alert('An error occurred while cashing out tokens.');
        }
    });
});
