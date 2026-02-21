// Content script for LeetCode problem pages
// Scrapes title, difficulty, tags, and link, then injects an "Add to DSA Tracker" button

(function () {
    'use strict';

    let buttonInjected = false;

    function extractProblemData() {
        const data = {
            title: '',
            difficulty: '',
            tags: [],
            link: window.location.href.split('?')[0],
        };

        // Title — LeetCode uses various selectors depending on version
        const titleEl =
            document.querySelector('[data-cy="question-title"]') ||
            document.querySelector('div[class*="text-title-large"]') ||
            document.querySelector('span[class*="text-title-large"]') ||
            document.querySelector('a[class*="text-title-large"]') ||
            document.querySelector('.css-v3d350') ||
            document.querySelector('div[data-track-load="description_content"] h4') ||
            document.querySelector('[class*="flexlayout__tab"] [class*="title"]');

        if (titleEl) {
            // Remove the problem number prefix if present (e.g. "1. Two Sum" → "Two Sum")
            data.title = titleEl.textContent.trim().replace(/^\d+\.\s*/, '');
        }

        // Difficulty
        const diffEl =
            document.querySelector('div[class*="text-difficulty"]') ||
            document.querySelector('[diff]') ||
            document.querySelector('span[class*="text-olive"]') ||    // Easy
            document.querySelector('span[class*="text-yellow"]') ||   // Medium
            document.querySelector('span[class*="text-pink"]');       // Hard

        if (diffEl) {
            const text = diffEl.textContent.trim().toLowerCase();
            if (text.includes('easy')) data.difficulty = 'Easy';
            else if (text.includes('medium')) data.difficulty = 'Medium';
            else if (text.includes('hard')) data.difficulty = 'Hard';
        }

        // If difficulty not found via element, try looking for colored spans
        if (!data.difficulty) {
            const allSpans = document.querySelectorAll('span');
            for (const span of allSpans) {
                const t = span.textContent.trim();
                if (['Easy', 'Medium', 'Hard'].includes(t)) {
                    data.difficulty = t;
                    break;
                }
            }
        }

        // Tags — LeetCode shows topic tags
        const tagEls = document.querySelectorAll('a[class*="topic-tag"], a[href*="/tag/"] span, div[class*="tag__"] a');
        tagEls.forEach((el) => {
            const tag = el.textContent.trim();
            if (tag && !data.tags.includes(tag)) {
                data.tags.push(tag);
            }
        });

        return data;
    }

    function injectButton() {
        if (buttonInjected) return;
        if (document.getElementById('dsa-tracker-btn')) return;

        // Wait until we can find a title
        const testData = extractProblemData();
        if (!testData.title) return; // Not ready yet

        buttonInjected = true;

        const btn = document.createElement('button');
        btn.id = 'dsa-tracker-btn';
        btn.innerHTML = '➕ Add to DSA Tracker';
        btn.className = 'dsa-tracker-fab';
        document.body.appendChild(btn);

        btn.addEventListener('click', handleAdd);
    }

    async function handleAdd() {
        const btn = document.getElementById('dsa-tracker-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Adding...';
        btn.disabled = true;

        try {
            const data = extractProblemData();

            // Send to background worker (avoids CORS — background has chrome-extension:// origin)
            const response = await chrome.runtime.sendMessage({
                type: 'ADD_QUESTION',
                data: {
                    title: data.title,
                    link: data.link,
                    difficulty: data.difficulty,
                    tags: data.tags.join(', '),
                    notes: '',
                },
            });

            if (response.success) {
                btn.innerHTML = '✅ Added & Scheduled!';
                btn.classList.add('dsa-tracker-success');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('dsa-tracker-success');
                    btn.disabled = false;
                }, 3000);
            } else {
                throw new Error(response.error || 'Failed');
            }
        } catch (err) {
            btn.innerHTML = `❌ ${err.message}`;
            setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
        }
    }

    // LeetCode uses React and dynamically renders content
    // Use MutationObserver to wait for the problem to load
    const observer = new MutationObserver(() => {
        injectButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also try immediately and after a delay
    setTimeout(injectButton, 1500);
    setTimeout(injectButton, 3000);
    setTimeout(injectButton, 5000);
})();
