// ==UserScript==
// @name         [Skylinetv.live] Simple chat enhancer
// @namespace    https://github.com/s644/sltv
// @version      0.67
// @description  Simple chat enhancement with @userhandle support, the ability to click on usernames for easy address and clickable urls
// @author       Arno_Nuehm
// @match        https://skylinetv.live/dabei/*
// @license      https://creativecommons.org/licenses/by-nc-sa/4.0/
// @updateURL    https://github.com/s644/sltv/raw/master/stvl_simple_chat_enhancer.user.js
// @supportURL   https://github.com/s644/sltv/issues
// @grant        GM_log
// ==/UserScript==

(function() {
    //'use strict';

    var unread = 0;
    var unreadPriority = 0;
    var origTitle = document.title;


    var urlRegex = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%_\+~#=]{1,256}\.[-zA-Z()]{2,6}\b([äüößÄÜÖa-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i
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
                var nickColor = nickNode.style.color;

                // add click event
                nickNode.addEventListener("click", function(){addNickHandle(nickNode.innerText)}, false);
                nickNode.style.cursor = "pointer";
                nickNode.title = "@" + nickNode.innerText + " einfügen";

                // make nicknames slightly brighter if contrast is to low
                var contrast = testContrast("rgb(10,10,10)",nickColor);
                var contrastThreshold = 80;

                if( contrast < contrastThreshold) {
                    nickNode.style.color = pSBC((contrastThreshold - contrast)/100, nickColor);
                }

                // create our own message container
                var msg = document.createElement('div');

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

                        var text = node.data.replace("@" + user, '<span class="badge">' + user + '</span>');
                        var urlMatch = text.match(urlRegex);

                        if(urlMatch) {
                            if(/https?/.test(urlMatch[0])) {
                                text = text.replace(urlRegex,"<a href=\""+urlMatch[0]+"\" target=\"_blank\">"+urlMatch[0]+"</a>");
                            } else {
                                text = text.replace(urlRegex,"<a href=\"http://"+urlMatch[0]+"\" target=\"_blank\">"+urlMatch[0]+"</a>");
                            }
                        }

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

                if(document.visibilityState == "hidden") {
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
