document.addEventListener('DOMContentLoaded', () => {
    const recentPodcast = document.getElementById('recent-podcast');
    const articlesList = document.getElementById('articles-list');
    const loadingSpinner = document.getElementById('loading-spinner');

    /**
     * Show loading spinner and hide content
     */
    function showLoading() {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        if (recentPodcast) recentPodcast.classList.add('hidden');
    }

    /**
     * Hide loading spinner and show content
     */
    function hideLoading() {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
        if (recentPodcast) recentPodcast.classList.remove('hidden');
    }

    /**
     * Create play button HTML
     */
    function createPlayButtonHTML(folder) {
        return `
            <button id="play-podcast-btn" class="play-btn" onclick="window.PodcastControls.playAudio('${folder}', null)">
                ▶️ Play Audio
            </button>
        `;
    }

    /**
     * Create HTML for an article
     */
    function createArticleHTML(article) {
        return `
            <div class="article">
                <h3><strong>Title:</strong> ${sanitizeHTML(article.title)}</h3>
                <p><strong>Source:</strong> <a href="${sanitizeURL(article.link)}" target="_blank">View Original Article</a></p>
                <p><strong>Summary:</strong> ${sanitizeHTML(article.summary)}</p>
            </div>
            <hr>
        `;
    }

    /**
     * Fetch and display a podcast's articles from the backend API.
     * @param {string} folder - Optional folder name. If not provided, gets the most recent podcast.
     */
    const fetchPodcast = async (folder = null) => {
        showLoading();
        try {
            const url = folder ? 
                `/api/podcasts/get?folder=${encodeURIComponent(folder)}` : 
                '/api/podcasts/get';
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'success') {
                // Add play button at the top
                const playButton = createPlayButtonHTML(folder || data.podcast.folder);
                articlesList.innerHTML = playButton;

                // Display all articles
                articlesList.innerHTML += data.podcast.articles
                    .map(article => createArticleHTML(article))
                    .join('');
            } else {
                recentPodcast.innerHTML = `<p>${sanitizeHTML(data.message)}</p>`;
            }
        } catch (error) {
            console.error('Error fetching podcast:', error);
            recentPodcast.innerHTML = `<p>Error fetching podcast.</p>`;
        } finally {
            hideLoading();
        }
    };

    /**
     * Sanitize HTML to prevent XSS attacks.
     * @param {string} str - The string to sanitize.
     * @returns {string} - The sanitized string.
     */
    const sanitizeHTML = (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };

    /**
     * Sanitize URLs to prevent XSS attacks.
     * @param {string} url - The URL to sanitize.
     * @returns {string} - The sanitized URL.
     */
    const sanitizeURL = (url) => {
        const temp = document.createElement('a');
        temp.href = url;
        return temp.href;
    };

    // Check URL parameters for folder
    const urlParams = new URLSearchParams(window.location.search);
    const folder = urlParams.get('folder');

    // Initial fetch - either specific folder or most recent
    fetchPodcast(folder);

    // Export fetchPodcast function for external use
    window.fetchPodcast = fetchPodcast;
});
