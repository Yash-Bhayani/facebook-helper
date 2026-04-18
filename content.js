// --- CSS Definitions ---
const cssCleanFeed = `
html#facebook body .xornbnt > * {
    display: none;
}

html#facebook body .xornbnt > div[role=main] {
    display: flex;
}

html#facebook body .xornbnt > div[role=main] > .xeuugli {
    width: 100%;
}

html#facebook body .xornbnt > div[role=main] > .xeuugli .x1v0nzow {
    width: 100%;
}

html#facebook body .xornbnt > div[role=main] > .xeuugli .x1v0nzow .x6o7n8i .x1lliihq .html-div.x1c1uobl .x1n2onr6 a.x1pdlv7q > .x6ikm8r > div {
    width: 100% !important;
}

html#facebook body .xornbnt > div[role=main] > .xeuugli .x1v0nzow .x6o7n8i .x1lliihq .html-div.x1c1uobl > .x1n2onr6 > .x1n2onr6 {
    display: flex;
    display: block;
    padding-top: unset!important;
    justify-content: center;
    margin: 0 auto;
    text-align: center;
}

html#facebook body .xornbnt > div[role=main] > .xeuugli .x1v0nzow .x6o7n8i .x1lliihq .html-div.x1c1uobl > .x1n2onr6 > .x1n2onr6:not(.xl56j7k) > .x10l6tqk {
    position: static;
    display: inline-block;
    width:100%;
}

html#facebook body .xornbnt > div[role=main] > .xeuugli .x1v0nzow .x6o7n8i .x1lliihq .html-div.x1c1uobl > .x1n2onr6 > .x1n2onr6:not(.xl56j7k) > .x10l6tqk > a.x1pdlv7q {
    position: relative;
    width:100%;
}

html#facebook body .xornbnt > div[role=main] > .xeuugli .x1v0nzow .x6o7n8i .x1lliihq .html-div.x1c1uobl .x1n2onr6 a.x1pdlv7q > .x6ikm8r .x1n2onr6 {
    display: inline;
    padding-top: unset;
}

html#facebook body .xornbnt > div[role=main] > .xeuugli .x1v0nzow .x6o7n8i .x1lliihq .html-div.x1c1uobl .x1n2onr6 a.x1pdlv7q > .x6ikm8r .x1n2onr6 > .x13vifvy {
    position: relative;
}

html#facebook body .xornbnt > div[role=main] > .xeuugli .x1v0nzow .x6o7n8i .x1lliihq .html-div.x1c1uobl .x1n2onr6 a.x1pdlv7q > .x6ikm8r .x1n2onr6 > .x13vifvy img {
    display: block;
    max-width: 100%;
    width: auto !important;
    height: auto;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
}
`;

const cssFullWidth = `
html#facebook body .xornbnt > div[role=main] > .xeuugli .x1v0nzow .x6o7n8i .x1lliihq .html-div.x1c1uobl .x1n2onr6 a.x1pdlv7q > .x6ikm8r .x1n2onr6 > .x13vifvy img { width:100%!important; }
`;

// --- CSS Injection Logic ---
// --- CSS Injection Logic ---
function applyStyles(t1, t2) {
    let combinedCSS = "";
    if (t1) combinedCSS += cssCleanFeed;
    if (t2) combinedCSS += cssFullWidth;

    let styleTag = document.getElementById('fb-helper-styles');

    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'fb-helper-styles';
        styleTag.textContent = combinedCSS;

        // Safely append depending on how fast the page is loading
        const target = document.head || document.documentElement;
        target.appendChild(styleTag);
    } else {
        // If it already exists, just update the text
        styleTag.textContent = combinedCSS;
    }
}
// --- High Res Image Logic (Your original code) ---
async function fetchHighResImageUrl(photoNodeId) {
    const pageHtml = document.documentElement.innerHTML;
    const fbDtsgMatch = pageHtml.match(/"DTSGInitialData",\[\],{"token":"([^"]+)"}/) || pageHtml.match(/"fb_dtsg":"([^"]+)"/);
    const fbDtsg = fbDtsgMatch ? fbDtsgMatch[1] : null;

    if (!fbDtsg) return null;

    const params = new URLSearchParams();
    params.append('fb_dtsg', fbDtsg);
    params.append('fb_api_caller_class', 'RelayModern');
    params.append('fb_api_req_friendly_name', 'CometPhotoRootContentQuery');
    params.append('doc_id', '26998127843180621');
    params.append('variables', JSON.stringify({
        "nodeID": photoNodeId,
        "scale": 1,
        "renderLocation": "comet_media_viewer"
    }));

    try {
        const response = await fetch('https://www.facebook.com/api/graphql/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        const text = await response.text();
        const jsonLines = text.split('\n').filter(line => line.trim() !== '');
        for (const line of jsonLines) {
            const data = JSON.parse(line);
            if (data?.data?.currMedia?.image?.uri) {
                return data.data.currMedia.image.uri;
            }
        }
    } catch (error) {
        console.error("GraphQL Fetch Failed:", error);
    }
    return null;
}

async function upgradeImagesOnPage() {
    const images = document.querySelectorAll('img[src*="fbcdn.net/v/"]');
    for (let img of images) {
        if (img.dataset.upgraded) continue;
        const parentLink = img.closest('a');
        if (!parentLink) continue;
        const urlParams = new URLSearchParams(parentLink.search);
        const fbid = urlParams.get('fbid');
        if (fbid) {
            img.dataset.upgraded = "processing";
            const highResUrl = await fetchHighResImageUrl(fbid);
            if (highResUrl) {
                img.src = highResUrl;
                img.dataset.upgraded = "true";
            } else {
                img.dataset.upgraded = "failed";
            }
        }
    }
}

// --- Initialization & Listeners ---
chrome.storage.local.get(['t1', 't2', 't3'], (data) => {
    // Apply CSS dynamically immediately
    applyStyles(data.t1, data.t2);

    // If Option 3 is enabled, start the interval script
    if (data.t3) {
        setInterval(upgradeImagesOnPage, 3000);
    }
});

// Listen for toggles 1 and 2 changes to update CSS instantly without reloading
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        chrome.storage.local.get(['t1', 't2'], (data) => {
            applyStyles(data.t1, data.t2);
        });
    }
});