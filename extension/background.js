// Background service worker — handles API calls from content scripts
// Requests made here originate from chrome-extension:// (bypassing page CORS)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ADD_QUESTION') {
        handleAddQuestion(message.data).then(sendResponse);
        return true; // keep channel open for async response
    }
});

async function handleAddQuestion(data) {
    try {
        const stored = await chrome.storage.local.get(['token', 'serverUrl']);

        if (!stored.token || !stored.serverUrl) {
            return { success: false, error: 'Login in extension first!' };
        }

        const res = await fetch(`${stored.serverUrl}/api/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${stored.token}`,
            },
            body: JSON.stringify({
                ...data,
                solvedDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD in user's local timezone
            }),
        });

        const result = await res.json();

        if (res.ok) {
            return { success: true };
        } else {
            return { success: false, error: result.message || 'Failed to add' };
        }
    } catch (err) {
        return { success: false, error: err.message || 'Network error' };
    }
}
