// ==UserScript==
// @name         [Skylinetv.live] Simple chat enhancer
// @namespace    https://github.com/s644/sltv
// @version      0.82
// @description  Simple chat enhancement with @userhandle support, the ability to click on usernames for easy address and clickable urls
// @author       Arno_Nuehm
// @match        https://skylinetv.live/dabei/*
// @license      https://creativecommons.org/licenses/by-nc-sa/4.0/
// @updateURL    https://github.com/s644/sltv/raw/master/stvl_simple_chat_enhancer.user.js
// @supportURL   https://github.com/s644/sltv/issues
// @grant        GM_log
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    //'use strict';

    var unread = 0;
    var unreadPriority = 0;
    var origTitle = document.title;

     // prototype upper first char
    String.prototype.ucFirst = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    // prototype rgb to hex color
    String.prototype.toHexColor = function() {
        var color = this.parseRgb();
        return color.r.toString(16) + color.g.toString(16) + color.b.toString(16);
    }

    // prototype hex to rgb color
    String.prototype.toRgbColor = function() {
        var color = this.match(/.*#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2}).*/i);
        this.r = parseInt(color[1], 16);
        this.g = parseInt(color[2], 16);
        this.b = parseInt(color[3], 16);
        return this;
    }

    // prototype parse rgb values from css rgb string
    String.prototype.parseRgb = function() {
        var color = this.match(/.*rgb\(([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\).*/);
        this.r = parseInt(color[1]);
        this.g = parseInt(color[2]);
        this.b = parseInt(color[3]);
        return this;
    }

    // detect saving support
    var isTampermonkey = (typeof GM_getValue === "function");
    var showWarning = true;

    function setValue(name, value) {
        if(isTampermonkey) {
            GM_setValue(name, value);
        } else if(showWarning) {
            alert("Your addon doesn't support saving, however you can use this function until reloading the page :(\n\nConsider using https://www.tampermonkey.net/ for full support!");
            showWarning = false;
        }
    }

    function getValue(name, def) {
      	return isTampermonkey ? GM_getValue(name, def):def;
    }

    var urlRegex = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|live|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om|me)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[äüöÜÄÖa-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/i

    // get nick name
    var user = document.getElementsByClassName("nicknamenangabe")[0].innerHTML;
    var chat = document.querySelector('div#chatinhalt');

    // add our css styles to document
    var style = document.createElement('style');
    style.innerText = '.hand{cursor:pointer;}#optionList{padding: 0 10px;}#optionList>i{;margin:0 2px 0 2px;}.hide{display:none;}';
    document.body.appendChild(style);

    // option container
    var specialNicks = ["fa-youtube","fa-twitch","fa-robot","fa-pray"];
    var specialClass = ["ytMsg","twitMsg","botMsg","guestMsg"];
    var specialNames = ["Youtube","Twitch","Bot","Gast"];
    var specialOptions = [];

    var optionDiv = document.createElement('div');
    optionDiv.id = "optionList";
    optionDiv.innerText = "Optionen: "

    // message filter
    specialNicks.forEach(function(nickType,i) {
        var icon = document.createElement('i');
        specialOptions[i] = getValue("show" + specialClass[i].ucFirst(),true);
        icon.classList.add("hand",i<2?"fa":"fas",nickType);
        icon.dataset.tgl = specialClass[i];
        icon.dataset.set = specialOptions[i];
        icon.id = "tgl" + specialClass[i].ucFirst();
        icon.addEventListener("click", function(){
            var msgs = chat.getElementsByClassName(this.dataset.tgl);
            if(this.dataset.set === "true") {
                setValue("show" + specialClass[i].ucFirst(),false);
                this.dataset.set = false;
                specialOptions[i] = false;
                this.style.color = "#990000";
                Array.prototype.forEach.call(msgs,function(msg) {msg.classList.add("hide")});
            } else {
                setValue("show" + specialClass[i].ucFirst(),true);
                specialOptions[i] = true;
                this.dataset.set = true;
                this.style.color = "#009933";
                Array.prototype.forEach.call(msgs,function(msg) {msg.classList.remove("hide")});
            }
            chat.scrollTop = chat.scrollHeight;
        });
        icon.title = "Sichtbarkeit von " + specialNames[i] + " Nachrichten umschalten";
        icon.style.color = specialOptions[i]?"#009933":"#990000";
        optionDiv.appendChild(icon);
    });

    optionDiv.appendChild(document.createTextNode(" | "));

    // shorten links
    var optionShortLink = getValue("shortenLink",true);
    var icon = document.createElement('i');
    icon.classList.add("hand","fas","fa-compress-alt");
    icon.addEventListener("click", function(){
        if(optionShortLink) {
            setValue("shortenLink",false);
            optionShortLink = false;
            this.style.color = "#990000";
            icon.title = "Links in Nachrichten werden gekürzt";
        } else {
            setValue("shortenLink",true);
            optionShortLink = true;
            this.style.color = "#009933";
            icon.title = "Links in Nachrichten werden vollständig angezeigt";
        }
    });
    icon.title = "Links in Nachrichten werden " + (optionShortLink ? "gekürzt" : "vollständig angezeigt");
    icon.style.color = optionShortLink?"#009933":"#990000";
    optionDiv.appendChild(icon);

    optionDiv.appendChild(document.createTextNode(" | "));

    // personal search strings
    var optionSearch = getValue("searchString","").split(",");
    icon = document.createElement('i');
    icon.classList.add("hand","fas","fa-search");
    icon.addEventListener("click", function(){
        var keywords = prompt("Hier kannst du - mit Komma getrennt - Wörter eingeben,\nwelche in Nachrichten gesucht und hervorgehoben werden.\nBeispiel: wert1,@youtubenick", optionSearch.join(","));
        setValue("searchString", keywords?keywords:"");
        optionSearch = keywords.split(",");
    });
    icon.title = "Definiere eigene Schlüsselwörter";
    optionDiv.appendChild(icon);

    optionDiv.style.marginTop = "-34px";
    optionDiv.classList.add("panel","panel-default");
    chat.parentNode.insertBefore(optionDiv,chat);

    // style fix
    chat.style.marginTop = "-15px";
    chat.style.height = (parseInt(chat.style.height) - parseInt(optionDiv.offsetHeight) - 12).toString() + "px";

    //observer chatlist
    var observeChat = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {

            // only process messages
            if(mutation.addedNodes.length >= 5 && mutation.removedNodes.length === 0) {
                 // create our own message container
                var msg = document.createElement('div');

                // parse nick
                var nickNode = mutation.addedNodes[2];
                var nickColor = nickNode.style.color;
                var specialNick = -1;

                // detect youtube, twitch, bot
                if(nickNode.getElementsByClassName("fa-youtube").length) {
                    msg.classList.add("ytMsg");
                    specialNick = 0;
                } else if(nickNode.getElementsByClassName("fa-twitch").length) {
                    msg.classList.add("twitMsg");
                    specialNick = 1;
                } else if(nickNode.getElementsByClassName("fa-robot").length) {
                    msg.classList.add("botMsg");
                    specialNick = 2;
                } else if(/^Gast\d{1,4}$/m.test(nickNode.innerText)) {
                    msg.classList.add("guestMsg");
                    specialNick = 3;
                }

                // hide filtered messages
                if(specialNick !== -1 && !specialOptions[specialNick]) {
                    msg.classList.add("hide");
                }

                // add click event for real users
                if(specialNick == -1) {
                    nickNode.addEventListener("click", function(){addNickHandle(nickNode.innerText)}, false);
                    nickNode.classList.add("hand");
                    nickNode.title = "@" + nickNode.innerText + " einfügen";
                }

                // make nicknames slightly brighter if contrast is to low
                var contrast = testContrast("rgb(10,10,10)",nickColor);
                var contrastThreshold = 80;

                if( contrast < contrastThreshold) {
                    nickNode.style.color = pSBC((contrastThreshold - contrast)/100, nickColor);
                }

                mutation.addedNodes.forEach(function(node, i) {

                    // delete original node...
                    if(mutation.target.contains(node)) {
                        // under 80 messages
                        mutation.target.removeChild(node);
                    } else {
                        // over 80 message
                        while (chat.lastChild && chat.lastChild.nodeName !== "DIV") {
                            chat.removeChild(chat.lastChild);
                        }
                    }

                    // ..and create a new one
                    if(node.nodeName === "#text") {

                        // wrap text nodes in span container
                        var wrapNode = document.createElement('span');

                        // check for priority messages
                        if(~node.data.indexOf("@" + user)) {
                            unreadPriority++;
                        }

                        var text = node.data.replace(/</g,"&lt;").replace("@" + user, '<span class="badge">' + user + '</span>');
                        var urlMatch = text.match(urlRegex);

                        // make links clickable
                        if(urlMatch) {
                            // shorten if option set
                            if(optionShortLink) {
                                text = text.replace.replace(urlRegex,"<a href=\"" + (/https?/.test(urlMatch[0])?"":"http://") + ""+urlMatch[0]+"\" target=\"_blank\">$3</a>");
                            } else {
                                text = text.replace(urlRegex,"<a href=\"" + (/https?/.test(urlMatch[0])?"":"http://") + ""+urlMatch[0]+"\" target=\"_blank\">" + urlMatch[0] + "</a>");
                            }
                        }

                        // search for keywords
                        optionSearch.forEach(function(key){
                            if(~text.indexOf(key)) {
                               unreadPriority++;
                            }
                            text = text.replace(key,'<span class="badge">' + key + '</span>');
                        });

                        // highlight my user name
                        wrapNode.innerHTML = text;
                        msg.appendChild(wrapNode);
                    } else if(node.nodeName !== "BR") {
                        msg.appendChild(node);
                    }

                });

                // append our message container
                mutation.target.appendChild(msg);

                // delete old messages
                if(chat.querySelectorAll('div').length > 500) {
                    chat.removeChild(chat.firstChild);
                }

                if(document.visibilityState == "hidden" && (specialNick == -1 || specialOptions[specialNick])) {
                    unread++;
                    document.title = "(" + unread.toString() + (unreadPriority > 0 ? ("|*" + unreadPriority.toString()):"") + ") - " + origTitle;
                } else {
                    unreadPriority = 0;
                }
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

    function focusChanged() {
        // handle focus changes
        if (document.visibilityState !== "hidden") {
            unread = 0;
            unreadPriority = 0;
            document.title = origTitle;
        }
    }

    // test color contrast https://www.w3.org/TR/AERT/#color-contrast
    function testContrast(rgb1, rgb2) {
        var c1 = rgb1.parseRgb();
        var c2 = rgb2.parseRgb();

        var val1 = (c1.r*299 + c1.g*587 + c1.b*14) / 1000;
        var val2 = (c2.r*299 + c2.g*587 + c2.b*14) / 1000;

        return Math.abs(parseFloat(val1 - val2));
    }

    // brighten up colors https://stackoverflow.com/a/13542669
    const pSBC=(p,c0,c1,l)=>{
        let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
        if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
        if(!this.pSBCr)this.pSBCr=(d)=>{
            let n=d.length,x={};
            if(n>9){
                [r,g,b,a]=d=d.split(","),n=d.length;
                if(n<3||n>4)return null;
                x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
            }else{
                if(n==8||n==6||n<4)return null;
                if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
                d=i(d.slice(1),16);
                if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
                else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
            }return x};
        h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=this.pSBCr(c0),P=p<0,t=c1&&c1!="c"?this.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
        if(!f||!t)return null;
        if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
        else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
        a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
        if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
        else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
    }

    document.addEventListener('visibilitychange', focusChanged, false);

})();
