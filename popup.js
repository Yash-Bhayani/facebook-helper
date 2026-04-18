document.addEventListener('DOMContentLoaded', () => {
    const t1 = document.getElementById('toggle1');
    const t2 = document.getElementById('toggle2');
    const t3 = document.getElementById('toggle3');

    const row2 = document.getElementById('row2');
    const row3 = document.getElementById('row3');

    // Load initial state
    chrome.storage.local.get(['t1', 't2', 't3'], (data) => {
        t1.checked = data.t1 || false;
        t2.checked = data.t2 || false;
        t3.checked = data.t3 || false;
        // Pass 'false' here so it doesn't reload the page when you first open the popup
        updateCascadingUI(false);
    });

    // Helper function to reload the tab
    function reloadFacebookTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].url.includes("facebook.com")) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    }

    function updateCascadingUI(shouldReloadOnChange = true) {
        // Remember T3's state before we process the cascading logic
        const previousT3State = t3.checked;

        // // Toggle 2 depends on Toggle 1
        // if (t1.checked) {
        //     t2.disabled = false;
        //     row2.classList.remove('disabled');
        // } else {
        //     t2.disabled = true;
        //     t2.checked = false;
        //     row2.classList.add('disabled');
        // }
        //
        // // Toggle 3 depends on Toggle 2
        // if (t2.checked && !t2.disabled) {
        //     t3.disabled = false;
        //     row3.classList.remove('disabled');
        // } else {
        //     t3.disabled = true;
        //     t3.checked = false;
        //     row3.classList.add('disabled');
        // }

        // Both Toggle 2 and Toggle 3 depend ONLY on Toggle 1 being enabled
        if (t1.checked) {
            // Enable Toggle 2
            t2.disabled = false;
            row2.classList.remove('disabled');

            // Enable Toggle 3
            t3.disabled = false;
            row3.classList.remove('disabled');
        } else {
            // Disable and uncheck Toggle 2
            t2.disabled = true;
            t2.checked = false;
            row2.classList.add('disabled');

            // Disable and uncheck Toggle 3
            t3.disabled = true;
            t3.checked = false;
            row3.classList.add('disabled');
        }
        saveState();

        // If T3 was forced to change state because of the cascade, trigger the reload
        if (shouldReloadOnChange && previousT3State !== t3.checked) {
            reloadFacebookTab();
        }
    }

    function saveState() {
        chrome.storage.local.set({
            t1: t1.checked,
            t2: t2.checked,
            t3: t3.checked
        });
    }

    // Pass 'true' when user interacts to allow reloads if T3 gets affected
    t1.addEventListener('change', () => updateCascadingUI(true));
    t2.addEventListener('change', () => updateCascadingUI(true));

    t3.addEventListener('change', () => {
        saveState();
        reloadFacebookTab();
    });
});