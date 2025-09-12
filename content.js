(function() {
    'use strict';

    const HIDDEN_TEXT = '?';
    
    const SCORE_SELECTORS = [
        'text.score-large',
        'text.score-small',
        'pwe-score-circle text.score-large',
        '.score-value',
        'text[class*="score"]'
    ];
    
    function addRevealListeners(element) {
        if (element._revealHandler) return;

        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            revealScore(element);
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
        delete element._clickableContainer;
    }

    function hideScores() {
        chrome.storage.local.get('revealedScores', (data) => {
            const revealedScores = data.revealedScores || [];
            
            SCORE_SELECTORS.forEach(selector => {
                const scoreElements = document.querySelectorAll(selector);
                scoreElements.forEach(element => {
                    if (element.dataset.scoreHiderProcessed) return;
                    
                    const text = element.textContent.trim();
                    if (/^\d+$/.test(text) && (parseInt(text) >= 1 && parseInt(text) <= 36 || parseInt(text) >= 2 && parseInt(text) <= 12)) {
                        const scoreId = getScoreId(element);
                        if (revealedScores.includes(scoreId)) {
                            element.dataset.scoreHiderProcessed = 'true';
                            element.dataset.originalScore = text;
                            element.classList.add('act-score-revealed');
                        } else {
                            hideScoreElement(element);
                        }
                    }
                });
            });
        });
    }
    
    function getScoreId(element) {
        const originalScore = (element.dataset.originalScore || element.textContent.trim()).replace(/\D/g,'');
        let sectionName = '';

        const x = element.getAttribute('x');
        if (x) {
            const svgParent = element.closest('svg');
            if (svgParent) {
                const sectionNameElement = svgParent.querySelector(`.section-name[x="${x}"]`);
                if (sectionNameElement) {
                    sectionName = sectionNameElement.textContent.trim();
                }
            }
        }

        if (!sectionName) {
            const header = element.closest('.panel-section-header');
            if (header) {
                const headerText = header.querySelector('.panel-section-header-text');
                if (headerText) {
                    sectionName = headerText.textContent.trim();
                }
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
    
    function revealScore(element) {
        const originalScore = element.dataset.originalScore;
        if (originalScore) {
            const scoreId = getScoreId(element);
            chrome.storage.local.get('revealedScores', (data) => {
                const revealedScores = data.revealedScores || [];
                if (!revealedScores.includes(scoreId)) {
                    revealedScores.push(scoreId);
                    chrome.storage.local.set({ revealedScores });
                }
            });

            element.textContent = originalScore;
            element.classList.remove('act-score-clickable');
            element.classList.add('act-score-revealed');
            element.title = '';

            removeRevealListeners(element);

            const rect = element.getBoundingClientRect();
            const x = rect.left + (rect.width / 2);
            const y = rect.top + (rect.height / 2);
            
            if (typeof shootConfetti === 'function') {
                shootConfetti(x, y);
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
        const hiddenScores = document.querySelectorAll('[data-original-score]');
        hiddenScores.forEach(element => {
            if (element.dataset.originalScore && element.textContent === HIDDEN_TEXT) {
                revealScore(element);
            }
        });
    }
    
    function hideAllScores() {
        chrome.storage.local.set({ revealedScores: [] }, () => {
            const revealedScores = document.querySelectorAll('[data-original-score]');
            revealedScores.forEach(element => {            
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
        if (request.action === 'showAll') {
            showAllScores();
        } else if (request.action === 'hideAll') {
            hideAllScores();
        } else if (request.action === 'getStatus') {
            const hiddenCount = document.querySelectorAll('[data-original-score]').length;
            const visibleCount = document.querySelectorAll('.act-score-revealed').length;
            sendResponse({
                hiddenCount: hiddenCount - visibleCount,
                visibleCount: visibleCount,
                totalCount: hiddenCount
            });
        }
        return true;
    });
    
    function init() {
        setTimeout(() => {
            hideScores();
        
            const observer = new MutationObserver((mutations) => {
                let shouldCheck = false;
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        shouldCheck = true;
                    }
                });
                
                if (shouldCheck) {
                    setTimeout(hideScores, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }, 500);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
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