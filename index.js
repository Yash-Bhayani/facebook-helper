// 1. Function to get the high-res URL from Facebook's GraphQL API
async function fetchHighResImageUrl(photoNodeId) {
    console.log("Fetching high-res for node:", photoNodeId);

    // Extract the anti-CSRF token (fb_dtsg) from the page source.
    // Facebook requires this for POST requests.
    const pageHtml = document.documentElement.innerHTML;
    const fbDtsgMatch = pageHtml.match(/"DTSGInitialData",\[\],{"token":"([^"]+)"}/) ||
        pageHtml.match(/"fb_dtsg":"([^"]+)"/);
    const fbDtsg = fbDtsgMatch ? fbDtsgMatch[1] : null;

    if (!fbDtsg) {
        console.error("Could not find fb_dtsg token. Request will likely fail.");
        return null;
    }

    // Build the payload mimicking your curl command
    const params = new URLSearchParams();
    params.append('fb_dtsg', fbDtsg);
    params.append('fb_api_caller_class', 'RelayModern');
    params.append('fb_api_req_friendly_name', 'CometPhotoRootContentQuery');

    // The specific document ID for the Photo Viewer query
    params.append('doc_id', '26998127843180621');

    // The variables required by the query
    params.append('variables', JSON.stringify({
        "nodeID": photoNodeId,
        "scale": 1,
        "renderLocation": "comet_media_viewer"
    }));

    try {
        // Make the POST request. Cookies are sent automatically.
        const response = await fetch('https://www.facebook.com/api/graphql/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const text = await response.text();

        // Facebook GraphQL responses often return multiple JSON objects separated by newlines.
        const jsonLines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of jsonLines) {
            const data = JSON.parse(line);

            // Navigate the JSON path from your provided response
            if (data?.data?.currMedia?.image?.uri) {
                return data.data.currMedia.image.uri;
            }
        }
    } catch (error) {
        console.error("GraphQL Fetch Failed:", error);
    }

    return null;
}

// 2. Function to find images and swap them
async function upgradeImagesOnPage() {
    // Find all images on the page that look like Facebook CDN images
    const images = document.querySelectorAll('img[src*="fbcdn.net/v/"]');

    for (let img of images) {
        // Skip if we already upgraded it
        if (img.dataset.upgraded) continue;

        // Try to find the Photo ID. Usually, images are wrapped in an anchor tag <a>
        // with a URL like /photo/?fbid=876025395480976
        const parentLink = img.closest('a');
        if (!parentLink) continue;

        const urlParams = new URLSearchParams(parentLink.search);
        const fbid = urlParams.get('fbid'); // Extracts 876025395480976

        if (fbid) {
            // Mark as processing so we don't hit the API 100 times for the same image
            img.dataset.upgraded = "processing";

            // Get the high res URL
            const highResUrl = await fetchHighResImageUrl(fbid);

            if (highResUrl) {
                console.log("Swapping to high-res image!");
                img.src = highResUrl;
                img.dataset.upgraded = "true";
            } else {
                img.dataset.upgraded = "failed";
            }
        }
    }
}

// 3. Run the script periodically or when the user scrolls (since FB is a single-page app)
setInterval(upgradeImagesOnPage, 3000);