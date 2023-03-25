// ==UserScript==
// @name         [ONCHE] Blacklist
// @version      0.1.2
// @description  Script pour https://onche.org, ajoute une liste noire locale au navigateur utilisé
// @author       Programmafion
// @match        https://onche.org/forum/*
// @match        https://onche.org/topic/*
// @downloadURL  https://codeberg.org/programmafion1/onche_liste-noire/raw/branch/main/onche_blacklist.user.js
// @updateURL    https://codeberg.org/programmafion1/onche_liste-noire/raw/branch/main/onche_blacklist.meta.js
// @icon         https://risibank.fr/cache/medias/0/6/676/67632/full.png
// @grant        GM_addStyle
// ==/UserScript==

// ==UserScript==
// @name         [ONCHE] Blacklist
// @version      0.1.2
// @description  Script pour https://onche.org, ajoute une liste noire, locale au navigateur utilisé.
// @author       Programmafion
// @match        https://onche.org/topic/*
// @downloadURL  https://codeberg.org/programmafion1/onche_liste-noire/raw/branch/main/onche_blacklist.user.js
// @updateURL    https://codeberg.org/programmafion1/onche_liste-noire/raw/branch/main/onche_blacklist.meta.js
// @icon         https://risibank.fr/cache/medias/0/6/676/67632/full.png
// @grant        GM_addStyle
// ==/UserScript==


GM_addStyle('.mdi-account-minus-outline::before {font-family: "material design icons"; content: "\\F0AEC";}.mdi-eye-off-outline::before {font-family: "material design icons"; content: "\\F06D1";}');


// ====== bouton paramètres ======
const id = location.pathname.includes('/forum/') ? 'forum' : 'topic';

document.getElementById(id).style.overflow = 'inherit';
document.querySelector('.title.is_sticky').style.overflow = 'inherit';

const settingsButton = new DOMParser().parseFromString(
    `<div title="Liste noire" class="mdi mdi-cog clickable" style="padding: 6px; cursor: pointer; position: relative;" onmouseenter="this.style.color='#fff';" onmouseout="this.style.color='#71c2fb';">
        <textarea placeholder="Listez chaque pseudo séparé d'une virgule" style="position: absolute; top: 80%; left: -90px; width: 200px; height: 100px; background-color: #fff; border: 1px solid #ccc; box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3); display: none; z-index: 1;"></textarea>
    </div>`, 'text/html').body.firstChild;

settingsButton.addEventListener('click', onSettingsButtonClick);
document.querySelector('.title .right').prepend(settingsButton);

new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type !== 'childList' || !mutation.addedNodes.length) {
            continue;
        }
        const addedNode = mutation.addedNodes[0];
        if (!addedNode.classList.contains('sticky-container')) {
            continue;
        }
        // addedNode.querySelector('.mdi-cog.clickable').addEventListener('click', onSettingsButtonClick);
        addedNode.querySelector('.mdi-cog.clickable').remove();
    }
}).observe(document.getElementById(id), { childList: true, subtree: true });


function onSettingsButtonClick(event) {
    const textAreaEl = this.firstElementChild;
    if (event.target === textAreaEl) {
        return;
    }
    event.stopPropagation();

    textAreaEl.value = localStorage.getItem('blacklist_userscript.blacklist') ?? '';
    textAreaEl.style.display = textAreaEl.style.display === 'block' ? 'none' : 'block';

    document.addEventListener('mousedown', event => {
        if (event.target !== textAreaEl && event.target !== this) {
            textAreaEl.style.display = 'none';
        }
    });

    textAreaEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const normalizedNicknames = Array.from(new Set(textAreaEl.value.replace(/^,+|,+$/g, '').replaceAll(' ', '').replaceAll(',,', ',').toLowerCase().split(','))).join(',');
            localStorage.setItem('blacklist_userscript.blacklist', normalizedNicknames);
            textAreaEl.style.backgroundColor = '#28a745';
            requestAnimationFrame(() => {
                textAreaEl.style.transition = 'background-color 1s ease-in';
                textAreaEl.style.backgroundColor = 'white';
                textAreaEl.addEventListener('transitionend', () => {
                    textAreaEl.style.transition = '';
                }, {once: true});
            });
            textAreaEl.value = normalizedNicknames;
            if (location.pathname.includes('/topic/')) {
                updateWhitelistedMessagesState();
                updateBlacklistedMessagesState();
            } else {
                updateTopicsState();
            }
        }
    });
}



// ====== collapse blacklist messages ======
function updateBlacklistedMessagesState() {
    const blacklist = (localStorage.getItem('blacklist_userscript.blacklist') ?? []).split(',');
    document.querySelectorAll('.message:not(.collapsible)').forEach(message => {
        const author = message.querySelector('.message-username').textContent.toLowerCase();
        if (!blacklist.includes(author)) {
            return;
        }

        // -- BL button --
        // remove "whitelist" button if present
        message.querySelector('.mdi-eye-off-outline')?.remove();
        // add "blacklist" button if absent
        const blRemoveButtonEl = document.createElement('div');
        blRemoveButtonEl.classList.add('mdi', 'mdi-account-minus-outline');
        blRemoveButtonEl.setAttribute('title', `Retirer ${author} de la liste noire`);
        blRemoveButtonEl.addEventListener('click', event => {
            const blacklist = localStorage.getItem('blacklist_userscript.blacklist') ?? '';
            // console.log('remove', `"${blacklist}"`, author);
            localStorage.setItem('blacklist_userscript.blacklist', blacklist.replaceAll(',' + author, '').replaceAll(author + ',', '').replaceAll(author, ''));
            updateWhitelistedMessagesState();
        });
        message.querySelector('.right').prepend(blRemoveButtonEl);


        // -- collapsibility --
        message.style.display = "none";
    });
}

function updateWhitelistedMessagesState() {
    document.querySelectorAll('.message').forEach(message => {
        const author = message.querySelector('.message-username').textContent.toLowerCase();
        if ((localStorage.getItem('blacklist_userscript.blacklist') ?? '').includes(author)) {
            return;
        }

        // -- collapsibility --
        message.classList.remove('collapsible');
        message.querySelector('.mdi-chevron-right')?.click();

        // -- BL button --
        // remove "blacklist" and chevron if present
        message.querySelector('.mdi-account-minus-outline')?.remove();
        message.querySelector('.chevron')?.remove();

        // add "whitelist" button if absent
        if (message.querySelector('.mdi-eye-off-outline')) {
            return;
        }
        const blAddButtonEl = document.createElement('div');
        blAddButtonEl.classList.add('mdi', 'mdi-eye-off-outline');
        blAddButtonEl.setAttribute('title', `Ne plus voir les messages de ${author}`);
        blAddButtonEl.addEventListener('click', event => {
            const blacklist = localStorage.getItem('blacklist_userscript.blacklist') ?? '';
            // console.log('add', `"${blacklist}"`, author);
            localStorage.setItem('blacklist_userscript.blacklist', (blacklist ? blacklist + ',' : '') + author);
            updateBlacklistedMessagesState();
        });
        message.querySelector('.right').prepend(blAddButtonEl);
    });
}

function updateTopicsState() {
    const blacklist = (localStorage.getItem('blacklist_userscript.blacklist') ?? []).split(',');
    document.querySelectorAll('.topic').forEach(topic => {

        const authorEl = topic.querySelector('.topic-username');
        if (!blacklist.includes(authorEl.textContent.toLowerCase().trim())) {
            return;
        } else {
            topic.style.display = "none";

        }
        /*
        const titleEl = topic.querySelector('span:not([class])');
        topic.insertBefore(new DOMParser().parseFromString(
            `<div class="wrapper _format _spoiler">
                <div>${titleEl.textContent}</div>
            </div>`, 'text/html').body.firstChild, titleEl);
        const wrapper = topic.querySelector('.wrapper');
        topic.addEventListener('click', event => {
            if (!wrapper.classList.contains('active')) {
                event.preventDefault();
            }
        });
        titleEl.remove();

        if (!topic.parentElement.classList.contains('compact')) {
            topic.insertAdjacentHTML('beforeend',`<br><div class="_format _spoiler"><div class="topic-username">${authorEl.textContent}</div></div>`);
            authorEl.remove();
        }
        */
    });
}

const updateMessagesState = () => {
    updateWhitelistedMessagesState();
    updateBlacklistedMessagesState();
};

const fn = location.pathname.includes('/forum/') ? updateTopicsState : updateMessagesState;
window.addEventListener('load', fn);
window.addEventListener('focus', fn);
