document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const podcastList = document.getElementById('podcast-list');
    const mainContainer = document.getElementById('main-container');

    // Get current folder from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentFolder = urlParams.get('folder');

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

    // Initialize sidebar as closed
    sidebar.style.left = '-250px';
    toggleSidebarBtn.textContent = '➡️';

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

                        // Add selected class if this is the current folder
                        if (currentFolder && folderPath === currentFolder) {
                            card.classList.add('selected');
                        }

                        // Create card content
                        const contentDiv = document.createElement('div');
                        contentDiv.innerHTML = `
                            <div class="podcast-date">${formattedDate}</div>
                            <div class="podcast-title">${title}</div>
                        `;
                        card.appendChild(contentDiv);

                        // Make card clickable for summary
                        card.addEventListener('click', async () => {
                            if (window.PodcastControls) {
                                await window.PodcastControls.openSummary(folderPath);
                            }
                        });

                        // Add audio control
                        if (window.PodcastControls) {
                            const controls = window.PodcastControls.createControls(folderPath, card);
                            card.appendChild(controls);
                        }

                        podcastList.appendChild(card);
                    });
                }
            })
            .catch(error => console.error('Error loading podcasts:', error));
    }

    // Handle browser back/forward
    window.addEventListener('popstate', async (event) => {
        const newFolder = new URLSearchParams(window.location.search).get('folder');
        if (window.fetchPodcast && newFolder) {
            await window.fetchPodcast(newFolder);
        }
        loadPodcasts(); // Reload sidebar to update selected states
    });

    // Initial load
    loadPodcasts();
});
