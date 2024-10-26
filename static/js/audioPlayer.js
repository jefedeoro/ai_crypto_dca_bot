// Audio Player Module
const AudioPlayer = {
    init() {
        this.audioElement = document.getElementById('podcast-audio');
        this.setupEventListeners();
        this.loadStoredPodcast();
    },

    setupEventListeners() {
        // Store audio state before page unload
        window.addEventListener('beforeunload', () => {
            if (!this.audioElement.paused) {
                localStorage.setItem('audioWasPlaying', 'true');
                localStorage.setItem('audioTime', this.audioElement.currentTime);
            }
        });

        // Handle audio errors
        this.audioElement.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
        });

        // When audio can play, restore state if needed
        this.audioElement.addEventListener('canplay', () => {
            const wasPlaying = localStorage.getItem('audioWasPlaying') === 'true';
            const storedTime = parseFloat(localStorage.getItem('audioTime'));
            
            if (!isNaN(storedTime)) {
                this.audioElement.currentTime = storedTime;
                localStorage.removeItem('audioTime');
                
                if (wasPlaying) {
                    this.audioElement.play()
                        .then(() => {
                            localStorage.removeItem('audioWasPlaying');
                        })
                        .catch(error => {
                            console.error('Error resuming playback:', error);
                        });
                }
            }
        });
    },

    loadStoredPodcast() {
        const storedPodcastUrl = localStorage.getItem('currentPodcastUrl');
        if (storedPodcastUrl) {
            this.audioElement.src = storedPodcastUrl;
            this.audioElement.load();
        }
    },
    
    async updatePodcast(folder = null) {
        try {
            const url = folder ? 
                `/api/podcasts/get?folder=${encodeURIComponent(folder)}` : 
                '/api/podcasts/get';
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'success' && data.podcast.audio_url) {
                const sanitizedUrl = this.sanitizeURL(data.podcast.audio_url);
                
                // Store current playback state
                const wasPlaying = !this.audioElement.paused;
                const currentTime = this.audioElement.currentTime;
                
                this.audioElement.src = sanitizedUrl;
                this.audioElement.load();
                localStorage.setItem('currentPodcastUrl', sanitizedUrl);
                
                // Restore playback state when audio is ready
                this.audioElement.addEventListener('canplay', () => {
                    this.audioElement.currentTime = currentTime;
                    if (wasPlaying) {
                        this.audioElement.play().catch(console.error);
                    }
                }, { once: true });
                
                return data;
            }
        } catch (error) {
            console.error('Error fetching podcast:', error);
            throw error;
        }
    },

    sanitizeURL(url) {
        const temp = document.createElement('a');
        temp.href = url;
        return temp.href;
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AudioPlayer.init();
});

// Export the module
window.AudioPlayer = AudioPlayer;
