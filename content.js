let config;
let contentmenuTimeout = null;

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
        clearTimeout(contentmenuTimeout);
        await clearClipboard();
        contentmenuTimeout = setTimeout(onClipboardChanged, 500);
    });
}

async function onClipboardChanged() {
    let current = await getCopied() || null;
    if (!!current) current = await clipboard2Blob(current);
    if (!!current) return callTransTab();
    contentmenuTimeout = setTimeout(onClipboardChanged, 500);
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
    clearTimeout(contentmenuTimeout);
    try {
        const data = getCopied(true);
        for (let i = 0, l = data.length; i < l; i ++) {
            if (!data[i].types.find((v) => v.match('image'))) return;
        }
        chrome.runtime.sendMessage(config.msgs.picCopied);
    } catch (e) { // if Chrome haven't got the clipboard permission
        addFocusListener(callTransTab);
    }
}

function addFocusListener(func) {
    let focus = function () {
        window.removeEventListener('focus', focus);
        func();
    };
    window.addEventListener('focus', focus);
}

function pastePic() {
    getBtn().click();
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

function getBtn() {
    return document.querySelector(`[aria-label="${config.custom.btnAriaLabel}"]`);
}

async function hasPermission() {
    const permission = await navigator.permissions.query({
        name: 'clipboard-read',
        allowWithoutGesture: false
    });
    return permission.state === 'granted';
}


async function getCopied(throwing = false) {
    if (!await hasPermission()) return;
    try {
        return await navigator.clipboard.read();
    } catch (e) {
        if (!throwing) return;
        throw Error(e);
    }
}

async function clipboard2Blob(data) {
    let text = '';
    for (let i = 0, il = data.length; i < il; i ++) {
        for (let j = 0, jl = data[i].types.length; j < jl; j ++) {
            const blob = await data[i].getType(data[i].types[j]);
            text += await blob.text();
        }    
    }
    return text;
}

async function clearClipboard() {
    if (!await hasPermission()) return;
    let item = new ClipboardItem({
        'text/plain': new Blob([''], { type: 'text/plain' })
    });
    await navigator.clipboard.write([item]);
    return '';
}

init();
window.addEventListener('load', onLoad, false);
