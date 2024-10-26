// static/index.js

// News functionality temporarily disabled
/*
document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const refreshBtn = document.getElementById('refresh-btn');
    const fetchNewStoriesBtn = document.getElementById('fetch-new-stories-btn');
    const audioStatus = document.getElementById('audio-status');
    const updateTime = document.getElementById('update-time');

    const fetchNews = async () => {
        showLoadingSpinner(true);
        try {
            const response = await fetch('/api/news');
            const data = await response.json();
            if (data.status === 'success') {
                const script = data.script;
                newsContainer.innerHTML = `
                    <h2>${sanitizeHTML(script.title)}</h2>
                    <p>${sanitizeHTML(script.content)}</p>
                `;
                audioStatus.textContent = data.audio_available ? 'Audio available.' : 'Audio not available.';
                updateTime.textContent = `Last update: ${new Date().toLocaleString()}`;
            } else {
                newsContainer.innerHTML = `<p>${sanitizeHTML(data.message)}</p>`;
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            newsContainer.innerHTML = `<p>Error fetching news.</p>`;
        } finally {
            showLoadingSpinner(false);
        }
    };

    const fetchNewStories = async () => {
        showLoadingSpinner(true);
        try {
            const response = await fetch('/api/fetch-new-stories', {
                method: 'POST'
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert(data.message);
                audioStatus.textContent = data.audio_available ? 'Audio available.' : 'Audio not available.';
                updateTime.textContent = `Last update: ${new Date().toLocaleString()}`;
                fetchNews();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error fetching new stories:', error);
            alert('Error fetching new stories.');
        } finally {
            showLoadingSpinner(false);
        }
    };

    const showLoadingSpinner = (show) => {
        loadingSpinner.classList.toggle('hidden', !show);
    };

    const sanitizeHTML = (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };

    refreshBtn.addEventListener('click', fetchNews);
    fetchNewStoriesBtn.addEventListener('click', fetchNewStories);

    fetchNews();
});
*/

// Initialize any current index page functionality here if needed
document.addEventListener('DOMContentLoaded', () => {
    // Add any new index page JavaScript here
});
