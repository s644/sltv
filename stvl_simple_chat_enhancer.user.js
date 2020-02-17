// ==UserScript==
// @name         [Skylinetv.live] Simple chat enhancer
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Simple chat enhancement with @userhandle support, the ability to click on usernames for easy address and clickable urls
// @author       Arno_Nuehm
// @match        https://skylinetv.live/dabei/
// @license      https://creativecommons.org/licenses/by-nc-sa/4.0/
// ==/UserScript==

(function() {
    //'use strict';

    var urlRegex = /((?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?((?:(?:[-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2}))|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,=]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?)/
    // get nick name
    var user = document.getElementsByClassName("nicknamenangabe")[0].innerHTML;
    
    var chat = document.querySelector('div#chatinhalt');

    // style fix 
    chat.style.marginTop = "-15px";

    //observer chatlist
    var observeChat = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {

            // only process messages
            if(mutation.addedNodes.length >= 5 && mutation.removedNodes.length === 0) {

                // parse nick
                var nickNode = mutation.addedNodes[2];

                // add click event
                nickNode.addEventListener("click", function(){addNickHandle(nickNode.innerText)}, false);
                nickNode.style.cursor = "pointer";
                nickNode.title = "@" + nickNode.innerText + " einfügen";

                // create our own message container
                var msg = document.createElement('span');

                mutation.addedNodes.forEach(function(node, i) {

                    // delete original node...
                    mutation.target.removeChild(mutation.addedNodes[i]);

                    // ..and create a new one
                    if(node.nodeName === "#text") {

                        // wrap text nodes in span container
                        var wrapNode = document.createElement('span');

                        // highlight my user name
                        wrapNode.innerHTML = node.data.replace("@" + user, '<span class="badge premium">' + user + '</span>').replace(urlRegex,"<a href=\"$1\" target=\"_blank\">$2</a>");
                        msg.appendChild(wrapNode);
                    } else {
                        msg.appendChild(node);
                    }
                });

                // append our message container
                mutation.target.appendChild(msg);
            }
        });
    });

    observeChat.observe(chat, {
         characterData: false, attributes: false, childList: true, subtree: false
    });


    function addNickHandle(name) {
        // insert nickname in fake text area and set cursor
        var editor = document.getElementsByClassName("emojionearea-editor")[0];
        editor.innerHTML = editor.innerHTML + "&nbsp;@" + name + "&nbsp;";
        editor.focus();

        var range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
})();
