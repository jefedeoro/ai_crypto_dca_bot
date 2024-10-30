// Audio Player Module
const AudioPlayer = {
    init() {
        this.audioElement = document.getElementById('podcast-audio');
        this.isLocked = false;
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

        // When audio starts playing, lock it
        this.audioElement.addEventListener('play', () => {
            this.isLocked = true;
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
    
    async updatePodcast(folder = null, restoreState = false) {
        // Only allow updates if not locked or if it's a manual play request
        if (!this.isLocked || restoreState === false) {
            try {
                const url = folder ? 
                    `/api/podcasts/get?folder=${encodeURIComponent(folder)}` : 
                    '/api/podcasts/get';
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.status === 'success' && data.podcast.audio_url) {
                    const sanitizedUrl = this.sanitizeURL(data.podcast.audio_url);
                    
                    // Store current playback state only if restoreState is true
                    const wasPlaying = restoreState ? !this.audioElement.paused : false;
                    const currentTime = restoreState ? this.audioElement.currentTime : 0;
                    
                    this.audioElement.src = sanitizedUrl;
                    this.audioElement.load();
                    localStorage.setItem('currentPodcastUrl', sanitizedUrl);
                    
                    // Restore playback state only if restoreState is true
                    if (restoreState) {
                        this.audioElement.addEventListener('canplay', () => {
                            this.audioElement.currentTime = currentTime;
                            if (wasPlaying) {
                                this.audioElement.play().catch(console.error);
                            }
                        }, { once: true });
                    } else {
                        // For manual track changes, start playing from the beginning
                        this.audioElement.addEventListener('canplay', () => {
                            this.audioElement.play().catch(console.error);
                        }, { once: true });
                    }
                    
                    return data;
                }
            } catch (error) {
                console.error('Error fetching podcast:', error);
                throw error;
            }
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
