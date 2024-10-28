interface Podcast {
    id: string;
    date: string;
    title: string;
    status: string;
}

interface ApiResponse {
    success: boolean;
    message?: string;
    error?: string;
}
