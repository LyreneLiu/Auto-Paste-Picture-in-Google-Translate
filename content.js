window.addEventListener('copy', callTransTab);

chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
    if (msg === 'Google Translate is active.') pastePic();
});

chrome.runtime.sendMessage('Tab is initialized.');

async function callTransTab() {
    try {
        const COPIED = await navigator.clipboard.read();
        for (let i = 0, l = COPIED.length; i < l; i ++) {
            if (!COPIED[i].types.find((v) => v.match('image'))) return;
        }
        chrome.runtime.sendMessage('Picture copied.');
    } catch (e) {
        addFocusListener(callTransTab);
    }
}

function addFocusListener(func) {
    let focus = window.addEventListener('focus', function () {
        window.removeEventListener('focus', focus);
        func();
    });
}

function pastePic() {
    document.querySelector('[aria-label="貼上剪貼簿中的圖片"]').click();
}
