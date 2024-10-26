document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const podcastList = document.getElementById('podcast-list');
    const mainContainer = document.getElementById('main-container');

    // Toggle sidebar
    toggleSidebarBtn.addEventListener('click', () => {
        const currentLeft = sidebar.style.left;
        if (currentLeft === '0px') {
            sidebar.style.left = '-250px';
            toggleSidebarBtn.textContent = '➡️';
            mainContainer.classList.remove('sidebar-open');
        } else {
            sidebar.style.left = '0px';
            toggleSidebarBtn.textContent = '⬅️';
            mainContainer.classList.add('sidebar-open');
        }
    });

    // Show sidebar by default
    sidebar.style.left = '0px';
    toggleSidebarBtn.textContent = '⬅️';
    mainContainer.classList.add('sidebar-open');

    // Load podcasts
    function loadPodcasts() {
        fetch('/api/podcasts/past')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    podcastList.innerHTML = ''; // Clear existing podcasts
                    data.podcasts.forEach(podcast => {
                        // Create podcast card
                        const card = document.createElement('div');
                        card.className = 'podcast-card';

                        // Format the date
                        const date = new Date(podcast.date);
                        const formattedDate = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        // Get the first article's title and truncate if necessary
                        let title = podcast.articles[0]?.title || 'Untitled';
                        if (title.length > 100) {
                            title = title.substring(0, 97) + '...';
                        }

                        // Extract folder from audio_url
                        const folderPath = podcast.audio_url.split('/')[2];

                        // Create card content
                        card.innerHTML = `
                            <div class="podcast-date">${formattedDate}</div>
                            <div class="podcast-title">${title}</div>
                            <button class="open-btn" data-folder="${folderPath}">Open</button>
                        `;

                        // Add click handler for open button
                        const openBtn = card.querySelector('.open-btn');
                        openBtn.addEventListener('click', () => {
                            const folder = openBtn.dataset.folder;
                            // Load podcast data
                            fetch(`/api/podcasts/get?folder=${encodeURIComponent(folder)}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (data.status === 'success') {
                                        // Dispatch custom event with podcast data
                                        const event = new CustomEvent('podcastSelected', {
                                            detail: data.podcast
                                        });
                                        document.dispatchEvent(event);
                                    }
                                })
                                .catch(error => console.error('Error loading podcast:', error));
                        });

                        podcastList.appendChild(card);
                    });
                }
            })
            .catch(error => console.error('Error loading podcasts:', error));
    }

    // Initial load
    loadPodcasts();
});
