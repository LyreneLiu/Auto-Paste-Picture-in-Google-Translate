let config;

async function init() {
    await getConfig();
    window.addEventListener('copy', callTransTab);
    chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
        if (msg === config.msgs.transPageActive) pastePic();
    });
    chrome.runtime.sendMessage(config.msgs.tabInit);
}

async function callTransTab() {
    try {
        const COPIED = await navigator.clipboard.read();
        for (let i = 0, l = COPIED.length; i < l; i ++) {
            if (!COPIED[i].types.find((v) => v.match('image'))) return;
        }
        chrome.runtime.sendMessage(config.msgs.picCopied);
    } catch (e) { // if Chrome haven't got the clipboard permission
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
    document.querySelector(`[aria-label="${config.custom.btnAriaLabel}"]`).click();
}

function getConfig() {
    return new Promise((reslove, reject) => {
        let setConfig = async function (msg, sender, sendResponse) {
            if (msg.msg !== 'config') return;
            chrome.runtime.onMessage.removeListener(setConfig);
            config = msg.data;
            reslove();
        };
        chrome.runtime.onMessage.addListener(setConfig);
        chrome.runtime.sendMessage('config');    
    });
}

init();
