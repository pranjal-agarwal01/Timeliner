// Content script for Take U Forward (TUF+) problem pages
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

        // Title — TUF+ uses various heading elements
        const titleEl =
            document.querySelector('h1') ||
            document.querySelector('h2') ||
            document.querySelector('[class*="problem-title"]') ||
            document.querySelector('[class*="problemTitle"]') ||
            document.querySelector('[class*="heading"]');

        if (titleEl) {
            data.title = titleEl.textContent.trim();
        }

        // Difficulty — look for Easy/Medium/Hard badges
        const allEls = document.querySelectorAll('span, div, p, button');
        for (const el of allEls) {
            const text = el.textContent.trim();
            const cls = (el.className || '').toLowerCase();
            if (['Easy', 'Medium', 'Hard'].includes(text) &&
                (cls.includes('diff') || cls.includes('badge') || cls.includes('tag') ||
                    cls.includes('easy') || cls.includes('medium') || cls.includes('hard') ||
                    el.style.color || el.closest('[class*="diff"]') || el.closest('[class*="badge"]'))) {
                data.difficulty = text;
                break;
            }
        }

        // If not found via class, try color-based detection
        if (!data.difficulty) {
            for (const el of allEls) {
                const text = el.textContent.trim();
                if (['Easy', 'Medium', 'Hard'].includes(text)) {
                    data.difficulty = text;
                    break;
                }
            }
        }

        // Tags — look for topic tags
        const tagEls = document.querySelectorAll(
            'a[href*="/tag/"], [class*="tag"] span, [class*="topic"] span, [class*="chip"]'
        );
        tagEls.forEach((el) => {
            const tag = el.textContent.trim();
            if (tag && tag.length < 30 && !data.tags.includes(tag) && tag !== '+') {
                data.tags.push(tag);
            }
        });

        return data;
    }

    function injectButton() {
        if (buttonInjected) return;
        if (document.getElementById('dsa-tracker-btn')) return;

        const testData = extractProblemData();
        if (!testData.title) return;

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

            // Send to background worker (avoids CORS)
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

    // TUF+ uses dynamic rendering
    const observer = new MutationObserver(() => {
        injectButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(injectButton, 1500);
    setTimeout(injectButton, 3000);
    setTimeout(injectButton, 5000);
})();
