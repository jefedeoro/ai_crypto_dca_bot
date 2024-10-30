class PodcastControls {
    constructor() {
        this.currentlyPlayingFolder = null;
    }

    async playAudio(folder, card) {
        if (window.AudioPlayer) {
            // Override current audio if playing, with restoreState set to false for manual changes
            await window.AudioPlayer.updatePodcast(folder, false);
            this.currentlyPlayingFolder = folder;
            
            // Update selected states only if card is provided
            if (card) {
                document.querySelectorAll('.podcast-card').forEach(c => {
                    c.classList.remove('selected');
                });
                card.classList.add('selected');
            }
        }
    }

    createControls(folder, card) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'podcast-controls';

        // Play button
        const playBtn = document.createElement('button');
        playBtn.className = 'play-btn';
        playBtn.innerHTML = '▶️ Play Audio';
        playBtn.title = 'Play Audio';
        playBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.playAudio(folder, card);
        });

        // Summary link (changed from button to anchor)
        const summaryLink = document.createElement('a');
        summaryLink.className = 'summary-btn';
        summaryLink.innerHTML = '📖 Read Summary';
        summaryLink.title = 'Open Summary';
        summaryLink.href = `/podcasts?folder=${encodeURIComponent(folder)}`;
        summaryLink.onclick = (e) => e.stopPropagation();

        controlsDiv.appendChild(playBtn);
        controlsDiv.appendChild(summaryLink);
        return controlsDiv;
    }
}

// Initialize as global
window.PodcastControls = new PodcastControls();
