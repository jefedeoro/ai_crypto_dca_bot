document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const updateTimeElement = document.getElementById('update-time');
    const loadingSpinner = document.getElementById('loading-spinner');
    const audioStatus = document.getElementById('audio-status');
    const refreshBtn = document.getElementById('refresh-btn');
    const fetchNewStoriesBtn = document.getElementById('fetch-new-stories-btn');
    const recordingsList = document.getElementById('recordings-list');
    const highlightedStory = document.getElementById('highlighted-story');
    const highlightedContent = document.getElementById('highlighted-content');
    const changeHighlightBtn = document.getElementById('change-highlight-btn');

    let currentHighlightIndex = 0;

    // Handle podcast selection
    document.addEventListener('podcastSelected', (event) => {
        const podcast = event.detail;
        if (newsContainer) {
            let html = `<div class="podcast-content">
                <div class="podcast-player">
                    <audio controls src="${podcast.audio_url}" style="width: 100%"></audio>
                </div>`;
            
            podcast.articles.forEach(article => {
                html += `
                    <div class="article">
                        <h3>${article.title}</h3>
                        <p>${article.summary}</p>
                        <a href="${article.link}" target="_blank">Read Original</a>
                    </div>
                `;
            });
            
            html += '</div>';
            newsContainer.innerHTML = html;
            updateAudioStatus(true);
            if (updateTimeElement) {
                updateTimeElement.textContent = `Selected podcast from: ${podcast.date}`;
            }
        }
    });

    function showLoading() {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        if (newsContainer) newsContainer.classList.add('hidden');
        if (recordingsList) recordingsList.classList.add('hidden');
    }

    function hideLoading() {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
        if (newsContainer) newsContainer.classList.remove('hidden');
        if (recordingsList) recordingsList.classList.remove('hidden');
    }

    function updateAudioStatus(isAvailable) {
        if (audioStatus) {
            audioStatus.textContent = isAvailable ? 'Audio version is available.' : 'Audio version is not available.';
        }
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
        // First get the latest podcast data
        fetch('/api/podcasts/get')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.podcast) {
                    let html = `<div class="podcast-content">
                        <div class="podcast-player">
                            <audio controls src="${data.podcast.audio_url}" style="width: 100%"></audio>
                        </div>`;
                    
                    // Then fetch and add the news content
                    return fetch('/api/news')
                        .then(response => response.json())
                        .then(newsData => {
                            if (newsData.status === 'success') {
                                html += renderNews(newsData.script);
                                if (newsContainer) newsContainer.innerHTML = html;
                                if (updateTimeElement) updateTimeElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
                                updateAudioStatus(true);
                            }
                        });
                }
            })
            .catch(error => {
                if (newsContainer) newsContainer.innerHTML = `<p>Error fetching news: ${error.message}</p>`;
            })
            .finally(() => {
                hideLoading();
            });
    }

    function fetchRecordings() {
        showLoading();
        fetch('/recordings')
            .then(response => response.json())
            .then(recordings => {
                if (recordingsList) {
                    recordingsList.innerHTML = '';
                    recordings.forEach((recording, index) => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('recording-row');

                        const audio = document.createElement('audio');
                        audio.controls = true;
                        audio.src = recording.url;

                        const title = document.createElement('h3');
                        title.textContent = recording.title;

                        const date = document.createElement('p');
                        date.textContent = `Date: ${recording.date}`;

                        const originalLink = document.createElement('a');
                        originalLink.href = recording.original_url;
                        originalLink.textContent = 'Original Story';
                        originalLink.target = '_blank';

                        const removeButton = document.createElement('button');
                        removeButton.textContent = 'Hide';
                        removeButton.addEventListener('click', () => {
                            listItem.remove();
                        });

                        const highlightButton = document.createElement('button');
                        highlightButton.textContent = 'Highlight';
                        highlightButton.addEventListener('click', () => {
                            currentHighlightIndex = index;
                            updateHighlightedStory(recording);
                        });

                        listItem.appendChild(title);
                        listItem.appendChild(date);
                        listItem.appendChild(originalLink);
                        listItem.appendChild(audio);
                        listItem.appendChild(removeButton);
                        listItem.appendChild(highlightButton);
                        recordingsList.appendChild(listItem);
                    });
                }
            })
            .catch(error => console.error('Error fetching recordings:', error))
            .finally(() => {
                hideLoading();
            });
    }

    function updateHighlightedStory(recording) {
        if (highlightedContent) {
            highlightedContent.innerHTML = `
                <audio controls src="${recording.url}"></audio>
                <h3>${recording.title}</h3>
                <p>Date: ${recording.date}</p>
                <a href="${recording.original_url}" target="_blank">Original Story</a>
            `;
        }
        if (highlightedStory) highlightedStory.classList.remove('hidden');
    }

    if (changeHighlightBtn) {
        changeHighlightBtn.addEventListener('click', () => {
            const recordings = Array.from(recordingsList.children);
            currentHighlightIndex = (currentHighlightIndex + 1) % recordings.length;
            const nextRecording = recordings[currentHighlightIndex].querySelector('h3').textContent;
            const nextRecordingData = recordings.find(item => item.querySelector('h3').textContent === nextRecording);
            updateHighlightedStory(nextRecordingData);
        });
    }

    function fetchNewStories() {
        showLoading();
        fetchNewStoriesBtn.disabled = true;
        fetch('/api/fetch-new-stories', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    if (newsContainer) newsContainer.innerHTML = `<p>${data.message}</p>`;
                    updateAudioStatus(data.audio_available);
                    fetchNews();
                } else {
                    if (newsContainer) newsContainer.innerHTML = `<p>Error: ${data.message}</p>`;
                }
            })
            .catch(error => {
                if (newsContainer) newsContainer.innerHTML = `<p>Error fetching new stories: ${error.message}</p>`;
            })
            .finally(() => {
                fetchNewStoriesBtn.disabled = false;
                hideLoading();
            });
    }

    if (refreshBtn) refreshBtn.addEventListener('click', fetchNews);
    if (fetchNewStoriesBtn) fetchNewStoriesBtn.addEventListener('click', fetchNewStories);

    // Initial load
    fetchNews();
    fetchRecordings();
});
