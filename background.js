import * as config from './config.js';

let translateTabInit = false;
let translateTab = {};

async function initTranslateTab() {
    translateTabInit = false;
    translateTab = await chrome.tabs.create({
        url: getCustomTranslateUrl()
    });
    if (config.custom.translateInNewWindow) {
        initTranslateWindow();
    }
}

async function initTranslateWindow() {
    const chromeWindow = await chrome.windows.create({
        tabId: translateTab.id
    });
    translateTab.windowId = chromeWindow.id;
}

async function retrieveTranslateTab() {
    try {
        translateTab = await chrome.tabs.get(translateTab.id);
    } catch (e) {
        await initTranslateTab();
        await checkTranslateTab();
    }
}

function checkTranslateTab() {
    return new Promise((resolve, reject) => {
        let timer = 60 * 1000, 
            checkTab = setInterval(() => {
            timer -= 300;
            if (isCustomTimeout(checkTab, timer)) {
                return reject('Timeout: checking translate status.');
            }
            if (!translateTabInit) return;
            clearInterval(checkTab);
            resolve();
        }, 300);
    });
}

async function focusTranslateTab() {
    await chrome.windows.update(translateTab.windowId, { focused: true });
    await chrome.tabs.update(translateTab.id, { active: true });
    chrome.tabs.sendMessage(translateTab.id, config.msgs.transPageActive);
}

function setTranslateTabStatus(msg, sender) {
    if (msg !== config.msgs.tabInit) return;
    if (sender.tab.id === translateTab.id) translateTabInit = true;
}

function getCustomTranslateUrl() {
    return `${config.custom.googleTranslateUrl}?op=images`
        + `&sl=${config.custom.translateFrom}`
        + `&tl=${config.custom.translateTo}`;
}

function isCustomTimeout(interval, timer) {
    if (timer > 0) return false;
    clearInterval(interval);
    return true;
}

chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
    if (msg !== config.msgs.picCopied) return;
    await retrieveTranslateTab();
    await focusTranslateTab(msg);
});

chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
    setTranslateTabStatus(msg, sender);
});
