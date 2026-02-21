// Content script for GeeksforGeeks problem pages
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

        // Title
        const titleEl =
            document.querySelector('h3.problems_header_content__title__L2cB2') ||
            document.querySelector('.problem-statement h3') ||
            document.querySelector('.problems_header_content h3') ||
            document.querySelector('h2.problem-heading') ||
            document.querySelector('.problem_title h3') ||
            document.querySelector('h1');

        if (titleEl) {
            data.title = titleEl.textContent.trim();
        }

        // Difficulty
        const diffEl =
            document.querySelector('.problems_header_content__difficulty') ||
            document.querySelector('.problem_header_difficulty') ||
            document.querySelector('.difficulty-badge') ||
            document.querySelector('.problemPage_problem_header_spec__difficulty__tag');

        if (diffEl) {
            const text = diffEl.textContent.trim().toLowerCase();
            if (text.includes('basic') || text.includes('school') || text.includes('easy')) {
                data.difficulty = 'Easy';
            } else if (text.includes('medium')) {
                data.difficulty = 'Medium';
            } else if (text.includes('hard')) {
                data.difficulty = 'Hard';
            }
        }

        // If not found, search all elements
        if (!data.difficulty) {
            const allEls = document.querySelectorAll('span, div, p');
            for (const el of allEls) {
                const cls = (el.className || '').toLowerCase();
                const text = el.textContent.trim();
                if ((cls.includes('difficult') || cls.includes('diff')) &&
                    ['Easy', 'Medium', 'Hard', 'Basic', 'School'].includes(text)) {
                    if (text === 'Basic' || text === 'School') data.difficulty = 'Easy';
                    else data.difficulty = text;
                    break;
                }
            }
        }

        // Tags
        const tagEls = document.querySelectorAll(
            '.problems_tag_container a, .problem-tag a, .tag-list a, .tags-container a, .problemPage_tag_container a span'
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
            const { token, serverUrl } = await chrome.storage.local.get(['token', 'serverUrl']);

            if (!token || !serverUrl) {
                btn.innerHTML = '⚠️ Login in extension first!';
                setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2500);
                return;
            }

            const data = extractProblemData();

            const res = await fetch(`${serverUrl}/api/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: data.title,
                    link: data.link,
                    difficulty: data.difficulty,
                    tags: data.tags.join(', '),
                    notes: '',
                }),
            });

            const result = await res.json();

            if (res.ok) {
                btn.innerHTML = '✅ Added & Scheduled!';
                btn.classList.add('dsa-tracker-success');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('dsa-tracker-success');
                    btn.disabled = false;
                }, 3000);
            } else {
                throw new Error(result.message || 'Failed');
            }
        } catch (err) {
            btn.innerHTML = `❌ ${err.message}`;
            setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
        }
    }

    // GFG also uses dynamic rendering
    const observer = new MutationObserver(() => {
        injectButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(injectButton, 1500);
    setTimeout(injectButton, 3000);
    setTimeout(injectButton, 5000);
})();
