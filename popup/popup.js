document.addEventListener('DOMContentLoaded', function() {
    const showAllBtn = document.getElementById('showAll');
    const hideAllBtn = document.getElementById('hideAll');
    const statusDiv = document.getElementById('status');
    const thresholdList = document.getElementById('threshold-list');
    const addBtn = document.getElementById('add-threshold-btn');
    const saveBtn = document.getElementById('save-thresholds-btn');
    const soundBtn = document.getElementById('sound-toggle-btn');
    const confettiBtn = document.getElementById('confetti-toggle-btn');
    const confettiThresholdList = document.getElementById('confetti-threshold-list');
    const addConfettiBtn = document.getElementById('add-confetti-threshold-btn');
    const saveConfettiBtn = document.getElementById('save-confetti-thresholds-btn');
    const persistenceBtn = document.getElementById('persistence-toggle-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const audioSettingsHeader = document.getElementById('audio-settings-header');
    const confettiSettingsHeader = document.getElementById('confetti-settings-header');
    const storageSettingsHeader = document.getElementById('storage-settings-header');

    let audioFiles = [];

    function setupToggleButton(button, storageKey, updateUI) {
        chrome.storage.local.get(storageKey, (data) => {
            updateUI(data[storageKey] !== false);
        });
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            chrome.storage.local.get(storageKey, (data) => {
                const newValue = !(data[storageKey] !== false);
                chrome.storage.local.set({
                    [storageKey]: newValue
                }, () => {
                    updateUI(newValue);
                });
            });
        });
    }

    function updateIconUI(button, isEnabled, onTitle, offTitle) {
        button.title = isEnabled ? onTitle : offTitle;
        isEnabled ? button.classList.remove('muted') : button.classList.add('muted');
    }

    function validateAllRows(list, saveButton) {
        const items = Array.from(list.children);
        let allThresholds = [];
        let isOverallValid = true;
        items.forEach(w => clearError(w));
        items.forEach((w, i) => allThresholds.push({
            min: w.querySelector('.threshold-min').value,
            max: w.querySelector('.threshold-max').value,
            wrapper: w,
            index: i
        }));
        allThresholds.forEach((item, index) => {
            const {
                min,
                max,
                wrapper
            } = item;
            const minNum = min === '' ? NaN : parseInt(min, 10),
                maxNum = max === '' ? NaN : parseInt(max, 10);
            if (isNaN(minNum)) {
                setError(wrapper, 'Min score is required.', 'min');
                isOverallValid = false;
                return;
            }
            if (isNaN(maxNum)) {
                setError(wrapper, 'Max score is required.', 'max');
                isOverallValid = false;
                return;
            }
            if (minNum < 1 || minNum > 36) {
                setError(wrapper, 'Score must be between 1 and 36.', 'min');
                isOverallValid = false;
                return;
            }
            if (maxNum < 1 || maxNum > 36) {
                setError(wrapper, 'Score must be between 1 and 36.', 'max');
                isOverallValid = false;
                return;
            }
            if (minNum > maxNum) {
                setError(wrapper, `Invalid range: Min > Max.`, 'min');
                isOverallValid = false;
                return;
            }
            for (let i = 0; i < allThresholds.length; i++) {
                if (index === i) continue;
                const other = allThresholds[i],
                    otherMin = parseInt(other.min, 10),
                    otherMax = parseInt(other.max, 10);
                if (isNaN(otherMin) || isNaN(otherMax)) continue;
                if (Math.max(minNum, otherMin) <= Math.min(maxNum, otherMax)) {
                    setError(wrapper, `Range overlaps with row (${otherMin}-${otherMax}).`, 'min');
                    setError(other.wrapper, `Range overlaps with row (${minNum}-${maxNum}).`, 'min');
                    isOverallValid = false;
                    return;
                }
            }
        });
        saveButton.disabled = !isOverallValid;
        return isOverallValid;
    }

    function setError(wrapper, message, inputType) {
        wrapper.querySelector('.threshold-error').textContent = message;
        wrapper.querySelector('.threshold-error').style.display = 'block';
        wrapper.classList.add('has-error');
        const input = wrapper.querySelector('.threshold-' + inputType);
        if (input) input.classList.add('invalid-input');
    }

    function clearError(wrapper) {
        wrapper.querySelector('.threshold-error').style.display = 'none';
        wrapper.classList.remove('has-error');
        wrapper.querySelectorAll('.invalid-input').forEach(el => el.classList.remove('invalid-input'));
    }

    function populateSelect(select) {
        const v = select.value;
        select.innerHTML = '<option value="">Select Sound</option>';
        audioFiles.forEach(f => {
            const o = document.createElement('option');
            o.value = f.value;
            o.textContent = f.name;
            select.appendChild(o);
        });
        select.value = v;
    }

    function createThresholdItem(threshold = {
        min: '',
        max: '',
        sound: ''
    }) {
        const wrapper = document.createElement('div');
        wrapper.className = 'threshold-item-wrapper';
        const item = document.createElement('div');
        item.className = 'threshold-item';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'threshold-error';
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.className = 'threshold-min';
        minInput.value = threshold.min;
        minInput.placeholder = 'Min';
        const separator = document.createElement('span');
        separator.textContent = '-';
        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.className = 'threshold-max';
        maxInput.value = threshold.max;
        maxInput.placeholder = 'Max';
        const soundSelect = document.createElement('select');
        soundSelect.className = 'sound-select';
        populateSelect(soundSelect);
        if (threshold.sound) soundSelect.value = threshold.sound;
        const changeBtn = document.createElement('button');
        changeBtn.className = 'change-btn btn-secondary';
        changeBtn.textContent = 'Upload';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-secondary';
        deleteBtn.textContent = 'X';
        [minInput, maxInput, soundSelect].forEach(el => {
            el.addEventListener('input', () => validateAllRows(thresholdList, saveBtn));
            el.addEventListener('change', () => validateAllRows(thresholdList, saveBtn));
        });
        deleteBtn.onclick = () => {
            wrapper.remove();
            validateAllRows(thresholdList, saveBtn);
        };
        changeBtn.onclick = () => handleUpload(soundSelect);
        item.append(minInput, separator, maxInput, soundSelect, changeBtn, deleteBtn);
        wrapper.append(item, errorDiv);
        return wrapper;
    }

    function createConfettiThresholdItem(threshold = {
        min: '',
        max: '',
        amount: 'medium'
    }) {
        const wrapper = document.createElement('div');
        wrapper.className = 'threshold-item-wrapper';
        const item = document.createElement('div');
        item.className = 'confetti-threshold-item';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'threshold-error';
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.className = 'threshold-min';
        minInput.value = threshold.min;
        minInput.placeholder = 'Min';
        const separator = document.createElement('span');
        separator.textContent = '-';
        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.className = 'threshold-max';
        maxInput.value = threshold.max;
        maxInput.placeholder = 'Max';
        const amountSelect = document.createElement('select');
        amountSelect.className = 'confetti-amount-select';
        const amounts = ['low', 'medium', 'high'];
        amounts.forEach(amount => {
            const option = document.createElement('option');
            option.value = amount;
            option.textContent = amount.charAt(0).toUpperCase() + amount.slice(1);
            amountSelect.appendChild(option);
        });
        if (threshold.amount) amountSelect.value = threshold.amount;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-secondary';
        deleteBtn.textContent = 'X';
        [minInput, maxInput, amountSelect].forEach(el => {
            el.addEventListener('input', () => validateAllRows(confettiThresholdList, saveConfettiBtn));
            el.addEventListener('change', () => validateAllRows(confettiThresholdList, saveConfettiBtn));
        });
        deleteBtn.onclick = () => {
            wrapper.remove();
            validateAllRows(confettiThresholdList, saveConfettiBtn);
        };
        item.append(minInput, separator, maxInput, amountSelect, deleteBtn);
        wrapper.append(item, errorDiv);
        return wrapper;
    }

    function handleUpload(soundSelect) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'audio/mpeg';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            document.body.removeChild(fileInput);
            if (!file) return;
            if (file.type !== 'audio/mpeg') return alert('Please select an MP3 file.');
            const reader = new FileReader();
            reader.onload = (event) => {
                const newSound = {
                    name: file.name.replace(/\.mp3$/i, ''),
                    value: event.target.result
                };
                chrome.storage.local.get('customSounds', (data) => {
                    const customSounds = data.customSounds || [];
                    customSounds.push(newSound);
                    chrome.storage.local.set({
                        customSounds
                    }, () => {
                        audioFiles.push(newSound);
                        document.querySelectorAll('.sound-select').forEach(s => populateSelect(s));
                        soundSelect.value = newSound.value;
                        validateAllRows(thresholdList, saveBtn);
                    });
                });
            };
            reader.readAsDataURL(file);
        };
        fileInput.click();
    }

    function renderThresholds(thresholds) {
        thresholdList.innerHTML = '';
        thresholds.forEach(t => thresholdList.appendChild(createThresholdItem(t)));
        validateAllRows(thresholdList, saveBtn);
    }

    function renderConfettiThresholds(thresholds) {
        confettiThresholdList.innerHTML = '';
        thresholds.forEach(t => confettiThresholdList.appendChild(createConfettiThresholdItem(t)));
        validateAllRows(confettiThresholdList, saveConfettiBtn);
    }

    addBtn.addEventListener('click', () => {
        thresholdList.insertBefore(createThresholdItem(), thresholdList.firstChild);
        validateAllRows(thresholdList, saveBtn);
    });
    addConfettiBtn.addEventListener('click', () => {
        confettiThresholdList.insertBefore(createConfettiThresholdItem(), confettiThresholdList.firstChild);
        validateAllRows(confettiThresholdList, saveConfettiBtn);
    });

    saveBtn.addEventListener('click', () => {
        if (!validateAllRows(thresholdList, saveBtn)) return;
        const items = Array.from(thresholdList.children);
        let newThresholds = items.map(w => ({
            min: parseInt(w.querySelector('.threshold-min').value, 10),
            max: parseInt(w.querySelector('.threshold-max').value, 10),
            sound: w.querySelector('.sound-select').value
        }));
        newThresholds.sort((a, b) => b.min - a.min);
        chrome.storage.local.set({
            soundThresholds: newThresholds
        }, () => {
            renderThresholds(newThresholds);
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.style.backgroundColor = '#28a745';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = '';
            }, 1500);
        });
    });

    saveConfettiBtn.addEventListener('click', () => {
        if (!validateAllRows(confettiThresholdList, saveConfettiBtn)) return;
        const items = Array.from(confettiThresholdList.children);
        let newThresholds = items.map(w => ({
            min: parseInt(w.querySelector('.threshold-min').value, 10),
            max: parseInt(w.querySelector('.threshold-max').value, 10),
            amount: w.querySelector('.confetti-amount-select').value
        }));
        newThresholds.sort((a, b) => b.min - a.min);
        chrome.storage.local.set({
            confettiThresholds: newThresholds
        }, () => {
            renderConfettiThresholds(newThresholds);
            const originalText = saveConfettiBtn.textContent;
            saveConfettiBtn.textContent = 'Saved!';
            saveConfettiBtn.style.backgroundColor = '#28a745';
            setTimeout(() => {
                saveConfettiBtn.textContent = originalText;
                saveConfettiBtn.style.backgroundColor = '';
            }, 1500);
        });
    });

    clearDataBtn.addEventListener('click', () => {
        if (clearDataBtn.classList.contains('is-confirming')) {
            chrome.storage.local.clear(() => {
                location.reload();
            });
        } else {
            clearDataBtn.classList.add('is-confirming');
            clearDataBtn.textContent = 'Are you sure?';
            const timeoutId = setTimeout(() => {
                clearDataBtn.classList.remove('is-confirming');
                clearDataBtn.textContent = 'Clear';
            }, 3000);
            clearDataBtn.addEventListener('blur', () => {
                clearTimeout(timeoutId);
                clearDataBtn.classList.remove('is-confirming');
                clearDataBtn.textContent = 'Clear';
            }, {
                once: true
            });
        }
    });

    function initializeThresholds() {
        const defaultThresholds = [{
                min: 34,
                max: 36,
                sound: 'audio/high-score.mp3'
            },
            {
                min: 30,
                max: 33,
                sound: 'audio/mid-high-score.mp3'
            },
            {
                min: 20,
                max: 29,
                sound: 'audio/mid-score.mp3'
            },
            {
                min: 1,
                max: 19,
                sound: 'audio/low-score.mp3'
            }
        ];
        chrome.storage.local.get('soundThresholds', (data) => {
            let thresholds = data.soundThresholds && data.soundThresholds.length > 0 ? data.soundThresholds : defaultThresholds;
            thresholds.sort((a, b) => b.min - a.min);
            renderThresholds(thresholds);
        });
    }

    function initializeConfettiThresholds() {
        const defaultThresholds = [{
                min: 34,
                max: 36,
                amount: 'high'
            },
            {
                min: 30,
                max: 33,
                amount: 'medium'
            },
            {
                min: 20,
                max: 29,
                amount: 'low'
            }
        ];
        chrome.storage.local.get('confettiThresholds', (data) => {
            let thresholds = data.confettiThresholds && data.confettiThresholds.length > 0 ? data.confettiThresholds : defaultThresholds;
            thresholds.sort((a, b) => b.min - a.min);
            renderConfettiThresholds(thresholds);
        });
    }

    function loadSoundsAndInitialize() {
        fetch('../audio/index.json').then(r => r.json()).then(defaultSounds => {
            audioFiles = defaultSounds.audioFiles.map(f => ({
                name: f.replace('audio/', '').replace('.mp3', ''),
                value: f
            }));
            chrome.storage.local.get('customSounds', (data) => {
                if (data && data.customSounds) audioFiles.push(...data.customSounds);
                initializeThresholds();
            });
        }).catch(err => {
            console.error('Error loading default sounds:', err);
            chrome.storage.local.get('customSounds', (data) => {
                if (data && data.customSounds) audioFiles.push(...data.customSounds);
                initializeThresholds();
            });
        });
    }

    function updateStatus() {
        addBtn.disabled = false;
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            if (!tabs[0] || !tabs[0].id) {
                statusDiv.textContent = 'Cannot access tab';
                statusDiv.className = 'status inactive';
                [showAllBtn, hideAllBtn].forEach(b => b.disabled = true);
                return;
            }
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'getStatus'
            }, function(response) {
                if (chrome.runtime.lastError) {
                    statusDiv.textContent = 'Not on ACT website';
                    statusDiv.className = 'status inactive';
                    [showAllBtn, hideAllBtn].forEach(b => b.disabled = true);
                    return;
                }
                if (response) {
                    statusDiv.textContent = 'Extension active';
                    statusDiv.className = 'status active';
                    showAllBtn.disabled = response.hiddenCount === 0;
                    hideAllBtn.disabled = response.visibleCount === 0;
                    if (response.totalCount === 0) statusDiv.textContent = 'No scores found on page';
                }
            });
        });
    }

    function sendMessageToContentScript(action) {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: action
                }, () => {
                    if (chrome.runtime.lastError) console.error('Message failed:', chrome.runtime.lastError.message);
                    setTimeout(updateStatus, 100);
                });
            } else {
                console.error("Could not find active tab to send message to.");
            }
        });
    }

    setupToggleButton(soundBtn, 'audioEnabled', (isEnabled) => updateIconUI(soundBtn, isEnabled, 'Mute sound effects', 'Unmute sound effects'));
    setupToggleButton(confettiBtn, 'confettiEnabled', (isEnabled) => updateIconUI(confettiBtn, isEnabled, 'Disable confetti', 'Enable confetti'));
    setupToggleButton(persistenceBtn, 'persistenceEnabled', (isEnabled) => updateIconUI(persistenceBtn, isEnabled, 'Disable score persistence', 'Enable score persistence'));

    [audioSettingsHeader, confettiSettingsHeader, storageSettingsHeader].forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            header.classList.toggle('expanded');
            if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                content.style.maxHeight = '0px';
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    showAllBtn.addEventListener('click', () => sendMessageToContentScript('showAll'));
    hideAllBtn.addEventListener('click', () => sendMessageToContentScript('hideAll'));

    loadSoundsAndInitialize();
    initializeConfettiThresholds();
    updateStatus();
    const statusInterval = setInterval(updateStatus, 2000);
    window.addEventListener('beforeunload', () => clearInterval(statusInterval));
});