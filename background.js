chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'install' || reason === 'update') {
        const TRANS = await chrome.tabs.create({
            url: 'https://translate.google.com/?sl=en&tl=fr&op=images'
        });
        chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
            if (msg === 'Picture copied.') {
                await chrome.tabs.update(TRANS.id, { active: true });
                chrome.tabs.sendMessage(TRANS.id, 'Google Translate is active.');
            }
        });
    }
});
