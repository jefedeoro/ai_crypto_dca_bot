// interval-options.js - Manages interval options for DCA forms

export const intervalOptions = [
    { value: "300000000000", label: "5 Minutes" },
    { value: "900000000000", label: "15 Minutes" },
    { value: "1800000000000", label: "30 Minutes" },
    { value: "3600000000000", label: "1 Hour" },
    { value: "7200000000000", label: "2 Hours" },
    { value: "14400000000000", label: "4 Hours" },
    { value: "21600000000000", label: "6 Hours" },
    { value: "43200000000000", label: "12 Hours" },
    { value: "86400000000000", label: "24 Hours" },
    { value: "604800000000000", label: "7 Days" },
    { value: "2592000000000000", label: "30 Days" },
    { value: "7776000000000000", label: "90 Days" },
    { value: "15552000000000000", label: "180 Days" },
    { value: "31536000000000000", label: "365 Days" }
];

export function populateIntervalSelect(selectElement) {
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select Interval";
    defaultOption.selected = true;
    defaultOption.disabled = true;
    selectElement.appendChild(defaultOption);

    // Add interval options
    intervalOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        selectElement.appendChild(optionElement);
    });
}

// Initialize all interval selects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get all interval select elements
    const intervalSelects = [
        document.getElementById('interval'),
        document.getElementById('new_interval'),
        document.getElementById('interval_usdt'),
        document.getElementById('new_interval_usdt')
    ];

    // Populate each select element
    intervalSelects.forEach(select => {
        if (select) {
            populateIntervalSelect(select);
        }
    });
});
