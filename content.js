(function() {
    'use strict';

    let cachedAudioEnabled = true;
    let cachedConfettiEnabled = true;
    let cachedPersistenceEnabled = true;
    let cachedSoundThresholds = [];
    let cachedConfettiThresholds = [];
    const audioPlayer = new Audio();

    function loadAndCacheSettings() {
        const defaultSoundThresholds = [{
                min: 34,
                max: 36,
                sound: 'audio/high-score.mp3'
            },
            {
                min: 27,
                max: 33,
                sound: 'audio/mid-high-score.mp3'
            },
            {
                min: 20,
                max: 26,
                sound: 'audio/mid-score.mp3'
            },
            {
                min: 1,
                max: 19,
                sound: 'audio/low-score.mp3'
            }
        ];
        const defaultConfettiThresholds = [{
                min: 34,
                max: 36,
                amount: 'high'
            },
            {
                min: 27,
                max: 33,
                amount: 'medium'
            },
            {
                min: 20,
                max: 26,
                amount: 'low'
            }
        ];
        chrome.storage.local.get(['audioEnabled', 'confettiEnabled', 'persistenceEnabled', 'soundThresholds', 'confettiThresholds'], (data) => {
            if (data.audioEnabled !== undefined) cachedAudioEnabled = data.audioEnabled;
            if (data.confettiEnabled !== undefined) cachedConfettiEnabled = data.confettiEnabled;
            if (data.persistenceEnabled !== undefined) cachedPersistenceEnabled = data.persistenceEnabled;
            cachedSoundThresholds = (data.soundThresholds && data.soundThresholds.length > 0) ? data.soundThresholds : defaultSoundThresholds;
            cachedConfettiThresholds = (data.confettiThresholds && data.confettiThresholds.length > 0) ? data.confettiThresholds : defaultConfettiThresholds;
        });
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'local') return;
        if (changes.audioEnabled) cachedAudioEnabled = changes.audioEnabled.newValue;
        if (changes.confettiEnabled) cachedConfettiEnabled = changes.confettiEnabled.newValue;
        if (changes.persistenceEnabled) cachedPersistenceEnabled = changes.persistenceEnabled.newValue;
        if (changes.soundThresholds) cachedSoundThresholds = changes.soundThresholds.newValue;
        if (changes.confettiThresholds) cachedConfettiThresholds = changes.confettiThresholds.newValue;
    });

    loadAndCacheSettings();

    const HIDDEN_TEXT = '?';
    const SCORE_SELECTORS = ['text.score-large', 'text.score-small', 'pwe-score-circle text.score-large', '.score-value', 'text[class*="score"]'];

    function addRevealListeners(element) {
        if (element._revealHandler) return;
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            revealScore(element, true);
        };
        element._revealHandler = handler;
        element.addEventListener('click', handler);
        element.style.cursor = 'pointer';
        const scoreX = element.getAttribute('x');
        if (scoreX) {
            const svgParent = element.closest('svg');
            if (svgParent) {
                const circle = svgParent.querySelector(`circle[cx="${scoreX}"]`);
                if (circle) {
                    circle.addEventListener('click', handler);
                    circle.style.cursor = 'pointer';
                    element._clickableCircle = circle;
                }
            }
        }
    }

    function removeRevealListeners(element) {
        if (!element._revealHandler) return;
        element.removeEventListener('click', element._revealHandler);
        element.style.cursor = 'default';
        if (element._clickableCircle) {
            element._clickableCircle.removeEventListener('click', element._revealHandler);
            element._clickableCircle.style.cursor = 'default';
        }
        delete element._revealHandler;
        delete element._clickableCircle;
    }

    function hideScores() {
        chrome.storage.local.get('revealedScores', (data) => {
            const revealedScores = data.revealedScores || [];
            SCORE_SELECTORS.forEach(selector => {
                document.querySelectorAll(selector).forEach(element => {
                    if (element.dataset.scoreHiderProcessed) return;
                    const text = element.textContent.trim();
                    if (/^\d+$/.test(text) && (parseInt(text) >= 1 && parseInt(text) <= 36 || parseInt(text) >= 2 && parseInt(text) <= 12)) {
                        if (cachedPersistenceEnabled && revealedScores.includes(getScoreId(element))) {
                            element.dataset.scoreHiderProcessed = 'true';
                            element.dataset.originalScore = text;
                            element.textContent = text;
                            element.classList.add('act-score-revealed');
                            removeRevealListeners(element);
                        } else {
                            hideScoreElement(element);
                        }
                    }
                });
            });
        });
    }

    function getScoreId(element) {
        const originalScore = (element.dataset.originalScore || element.textContent.trim()).replace(/\D/g, '');
        let sectionName = '';
        const x = element.getAttribute('x');
        if (x) {
            const svgParent = element.closest('svg');
            if (svgParent) {
                const el = svgParent.querySelector(`.section-name[x="${x}"]`);
                if (el) sectionName = el.textContent.trim();
            }
        }
        if (!sectionName) {
            const header = element.closest('.panel-section-header');
            if (header) {
                const el = header.querySelector('.panel-section-header-text');
                if (el) sectionName = el.textContent.trim();
            }
        }
        return `${window.location.pathname}-${sectionName}-${originalScore}`;
    }

    function hideScoreElement(element) {
        element.style.visibility = 'visible';
        element.dataset.scoreHiderProcessed = 'true';
        element.dataset.originalScore = element.textContent.trim();
        element.textContent = HIDDEN_TEXT;
        element.classList.add('act-score-clickable');
        addRevealListeners(element);
    }

    function revealScore(element, playSound = true, persist = true, playConfetti = true) {
        const originalScore = element.dataset.originalScore;
        if (originalScore) {
            if (persist && cachedPersistenceEnabled) {
                const scoreId = getScoreId(element);
                chrome.storage.local.get('revealedScores', (data) => {
                    const revealedScores = data.revealedScores || [];
                    if (!revealedScores.includes(scoreId)) {
                        revealedScores.push(scoreId);
                        chrome.storage.local.set({
                            revealedScores
                        });
                    }
                });
            }

            element.textContent = originalScore;
            element.classList.remove('act-score-clickable');
            element.classList.add('act-score-revealed');
            element.title = '';
            removeRevealListeners(element);

            const scoreNum = parseInt(originalScore, 10);
            const isWritingScore = scoreNum >= 2 && scoreNum <= 12;

            if (playSound && cachedAudioEnabled) {
                if (!audioPlayer.paused) {
                    audioPlayer.pause();
                    audioPlayer.currentTime = 0;
                }
                let soundSrc;
                if (isWritingScore) {
                    if (scoreNum >= 10) soundSrc = 'audio/high-score.mp3';
                    else if (scoreNum >= 8) soundSrc = 'audio/mid-high-score.mp3';
                    else if (scoreNum >= 6) soundSrc = 'audio/mid-score.mp3';
                    else soundSrc = 'audio/low-score.mp3';
                } else {
                    const threshold = cachedSoundThresholds.find(t => scoreNum >= t.min && scoreNum <= t.max);
                    if (threshold && threshold.sound) {
                        soundSrc = threshold.sound;
                    }
                }
                if (soundSrc) {
                    if (!soundSrc.startsWith('data:')) soundSrc = chrome.runtime.getURL(soundSrc);
                    audioPlayer.src = soundSrc;
                    const playPromise = audioPlayer.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => console.error("Error playing sound:", error));
                    }
                }
            }

            if (playConfetti && cachedConfettiEnabled && typeof shootConfetti === 'function') {
                let amount;
                if (isWritingScore) {
                    if (scoreNum >= 11) amount = 'high';
                    else if (scoreNum >= 8) amount = 'medium';
                    else if (scoreNum >= 6) amount = 'low';
                } else {
                    const threshold = cachedConfettiThresholds.find(t => scoreNum >= t.min && scoreNum <= t.max);
                    if (threshold) {
                        amount = threshold.amount;
                    }
                }
                if (amount) {
                    const rect = element.getBoundingClientRect();
                    const confettiAmounts = {
                        low: {
                            particleCount: 50,
                            spread: 60
                        },
                        medium: {
                            particleCount: 100,
                            spread: 100
                        },
                        high: {
                            particleCount: 200,
                            spread: 160
                        }
                    };
                    const confettiOptions = confettiAmounts[amount] || confettiAmounts.medium;
                    shootConfetti(rect.left + (rect.width / 2), rect.top + (rect.height / 2), confettiOptions);
                }
            }

            element.style.transition = 'all 0.3s ease';
            element.style.backgroundColor = '#ffff99';
            element.style.borderRadius = '3px';
            element.style.padding = '2px';
            setTimeout(() => {
                element.style.backgroundColor = '';
                element.style.borderRadius = '';
                element.style.padding = '';
            }, 1000);
        }
    }

    function showAllScores() {
        const toPersist = [];
        document.querySelectorAll('[data-original-score]').forEach(element => {
            if (element.dataset.originalScore && element.textContent === HIDDEN_TEXT) {
                revealScore(element, false, false, false);
                toPersist.push(getScoreId(element));
            }
        });
        if (cachedPersistenceEnabled && toPersist.length > 0) {
            chrome.storage.local.get('revealedScores', (data) => {
                const revealedScores = data.revealedScores || [];
                toPersist.forEach(id => {
                    if (!revealedScores.includes(id)) revealedScores.push(id);
                });
                chrome.storage.local.set({
                    revealedScores
                });
            });
        }
    }

    function hideAllScores() {
        if (!audioPlayer.paused) {
            audioPlayer.pause();
        }
        chrome.storage.local.set({
            revealedScores: []
        }, () => {
            document.querySelectorAll('[data-original-score]').forEach(element => {
                if (element.dataset.originalScore && element.textContent !== HIDDEN_TEXT) {
                    element.textContent = HIDDEN_TEXT;
                    element.classList.remove('act-score-revealed');
                    element.classList.add('act-score-clickable');
                    addRevealListeners(element);
                }
            });
        });
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'showAll') showAllScores();
        else if (request.action === 'hideAll') hideAllScores();
        else if (request.action === 'getStatus') {
            const allScores = document.querySelectorAll('[data-original-score]');
            const revealed = Array.from(allScores).filter(el => el.textContent !== HIDDEN_TEXT).length;
            sendResponse({
                hiddenCount: allScores.length - revealed,
                visibleCount: revealed,
                totalCount: allScores.length
            });
        }
        return true;
    });

    function init() {
        setTimeout(() => {
            hideScores();
            const observer = new MutationObserver((mutations) => {
                let shouldCheck = false;
                mutations.forEach((m) => {
                    if (m.type === 'childList' && m.addedNodes.length > 0) shouldCheck = true;
                });
                if (shouldCheck) setTimeout(hideScores, 100);
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }, 500);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            showAllScores();
        } else if (e.ctrlKey && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            hideAllScores();
        }
    });

})();