document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

function checkAuthStatus() {
    fetch('/admin/get-podcasts')
        .then(response => {
            if (response.ok) {
                showAdminPanel();
                loadPodcasts();
            }
        })
        .catch(() => {
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
        });
}

function verifyPassword(event) {
    event.preventDefault();
    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput ? passwordInput.value : '';
    
    fetch('/admin/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAdminPanel();
            loadPodcasts();
            if (passwordInput) {
                passwordInput.value = '';
            }
        } else {
            alert('Invalid password');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while verifying the password');
    });
}

function showAdminPanel() {
    const loginPanel = document.getElementById('admin-login');
    const adminPanel = document.getElementById('admin-panel');
    if (loginPanel) loginPanel.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
}

function startMainApp() {
    const consoleOutput = document.getElementById('console-logs');
    if (!consoleOutput) return;
    
    consoleOutput.textContent = 'Starting main app...\n';
    
    fetch('/admin/start-main-app', {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                handleUnauthorized();
                throw new Error('Unauthorized');
            }
            throw new Error('Network response was not ok');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        function readStream() {
            reader.read().then(({done, value}) => {
                if (done) {
                    loadPodcasts();
                    return;
                }
                const text = decoder.decode(value);
                if (consoleOutput) {
                    consoleOutput.textContent += text;
                    consoleOutput.scrollTop = consoleOutput.scrollHeight;
                }
                readStream();
            });
        }
        
        readStream();
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.message !== 'Unauthorized' && consoleOutput) {
            consoleOutput.textContent = 'Error: ' + error.message + '\n';
        }
    });
}

function loadPodcasts() {
    fetch('/admin/get-podcasts')
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    handleUnauthorized();
                    throw new Error('Unauthorized');
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tbody = document.querySelector('#podcasts-list tbody');
            if (!tbody) return;
            
            tbody.textContent = '';
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            data.forEach(podcast => {
                const row = createPodcastRow(podcast);
                if (row) tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            if (error.message !== 'Unauthorized') {
                const tbody = document.querySelector('#podcasts-list tbody');
                if (tbody) {
                    const row = document.createElement('tr');
                    const cell = document.createElement('td');
                    cell.setAttribute('colspan', '4');
                    cell.textContent = 'Error loading podcasts: ' + error.message;
                    row.appendChild(cell);
                    tbody.appendChild(row);
                }
            }
        });
}

function getStatusClasses(status) {
    const baseClasses = ['status-indicator'];
    baseClasses.push('status-' + status.toLowerCase());
    return baseClasses.join(' ');
}

function createPodcastRow(podcast) {
    const row = document.createElement('tr');
    
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = podcast.date;
    row.appendChild(dateCell);
    
    // Title cell
    const titleCell = document.createElement('td');
    titleCell.textContent = podcast.title;
    row.appendChild(titleCell);
    
    // Status cell
    const statusCell = document.createElement('td');
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-cell';
    const statusIndicator = document.createElement('span');
    statusIndicator.className = getStatusClasses(podcast.status);
    statusDiv.appendChild(statusIndicator);
    statusDiv.appendChild(document.createTextNode(podcast.status));
    statusCell.appendChild(statusDiv);
    row.appendChild(statusCell);
    
    // Action cell
    const actionCell = document.createElement('td');
    const actionDiv = document.createElement('div');
    actionDiv.className = 'action-buttons';
    
    // Visibility toggle button
    const visibilityButton = document.createElement('button');
    visibilityButton.className = 'hide-btn' + (podcast.hidden ? ' hidden' : '');
    visibilityButton.textContent = podcast.hidden ? 'Unhide Entry' : 'Hide Entry';
    visibilityButton.addEventListener('click', function() {
        toggleVisibility(podcast.id, visibilityButton);
    });
    actionDiv.appendChild(visibilityButton);
    
    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', function() {
        deletePodcast(podcast.id);
    });
    actionDiv.appendChild(deleteButton);
    
    actionCell.appendChild(actionDiv);
    row.appendChild(actionCell);
    
    return row;
}

function deletePodcast(id) {
    if (!confirm('Are you sure you want to delete this podcast?')) {
        return;
    }

    fetch('/admin/delete-podcast', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                handleUnauthorized();
                throw new Error('Unauthorized');
            }
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            loadPodcasts();
        } else {
            alert('Failed to delete podcast: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.message !== 'Unauthorized') {
            alert('Error deleting podcast: ' + error.message);
        }
    });
}

function toggleVisibility(id, button) {
    fetch('/admin/toggle-visibility', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                handleUnauthorized();
                throw new Error('Unauthorized');
            }
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Toggle button class and text
            button.classList.toggle('hidden');
            button.textContent = button.classList.contains('hidden') ? 'Unhide' : 'Hide';
        } else {
            alert('Failed to toggle visibility: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.message !== 'Unauthorized') {
            alert('Error toggling visibility: ' + error.message);
        }
    });
}

function handleUnauthorized() {
    const loginPanel = document.getElementById('admin-login');
    const adminPanel = document.getElementById('admin-panel');
    if (loginPanel) loginPanel.style.display = 'block';
    if (adminPanel) adminPanel.style.display = 'none';
}

document.addEventListener('themeChanged', function(e) {
    const body = document.body;
    if (body && e.detail) {
        body.setAttribute('data-theme', e.detail.theme);
    }
});
