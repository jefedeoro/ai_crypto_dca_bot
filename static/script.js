document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const updateTimeElement = document.getElementById('update-time');
    const loadingSpinner = document.getElementById('loading-spinner');
    const audioStatus = document.getElementById('audio-status');
    const refreshBtn = document.getElementById('refresh-btn');
    const fetchNewStoriesBtn = document.getElementById('fetch-new-stories-btn');

    function showLoading() {
        loadingSpinner.classList.remove('hidden');
        newsContainer.classList.add('hidden');
    }

    function hideLoading() {
        loadingSpinner.classList.add('hidden');
        newsContainer.classList.remove('hidden');
    }

    function updateAudioStatus(isAvailable) {
        audioStatus.textContent = isAvailable ? 'Audio version is available.' : 'Audio version is not available.';
    }

    function renderNews(script) {
        let html = '';
        script.forEach(chapter => {
            html += `<h2>${chapter.title}</h2>`;
            chapter.content.forEach(item => {
                html += `<p><strong>${item.speaker}:</strong> ${item.text}</p>`;
            });
        });
        return html;
    }

    function fetchNews() {
        showLoading();
        fetch('/api/news')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    newsContainer.innerHTML = renderNews(data.script);
                    updateTimeElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
                    updateAudioStatus(data.audio_available);
                } else {
                    newsContainer.innerHTML = `<p>Error: ${data.message}</p>`;
                }
            })
            .catch(error => {
                newsContainer.innerHTML = `<p>Error fetching news: ${error.message}</p>`;
            })
            .finally(() => {
                hideLoading();
            });
    }

    function fetchNewStories() {
        showLoading();
        fetchNewStoriesBtn.disabled = true;
        fetch('/api/fetch-new-stories', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    newsContainer.innerHTML = `<p>${data.message}</p>`;
                    updateAudioStatus(data.audio_available);
                    fetchNews();
                } else {
                    newsContainer.innerHTML = `<p>Error: ${data.message}</p>`;
                }
            })
            .catch(error => {
                newsContainer.innerHTML = `<p>Error fetching new stories: ${error.message}</p>`;
            })
            .finally(() => {
                fetchNewStoriesBtn.disabled = false;
                hideLoading();
            });
    }

    refreshBtn.addEventListener('click', fetchNews);
    fetchNewStoriesBtn.addEventListener('click', fetchNewStories);

    // Fetch news on page load
    fetchNews();
});