let config;
let contentmenuInterval = null;

async function init() {
    await getConfig();
    chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
        if (msg === config.msgs.transPageActive) pastePic();
    });
}

function onLoad() {
    observeBtn();
    document.addEventListener('copy', callTransTab);
    document.addEventListener('contextmenu', async function (e) {
        await navigator.clipboard.writeText('');
        contentmenuInterval = setInterval(async function () {
            if (await navigator.clipboard.read()) callTransTab();
        }, 500);
    });
}

function observeBtn() {
    let btnObserver = new MutationObserver((mymutations) => {
        if (!getBtn()) return;
        btnObserver.disconnect();
        chrome.runtime.sendMessage(config.msgs.tabInit);
    });
    btnObserver.observe(document.body, {
        childList : true,
        subtree : true,
        attributes : false
    });
}

async function callTransTab() {
    try {
        clearInterval(contentmenuInterval);
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
    getBtn().click();
}

function getBtn() {
    return document.querySelector(`[aria-label="${config.custom.btnAriaLabel}"]`);
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
window.addEventListener('load', onLoad, false);
