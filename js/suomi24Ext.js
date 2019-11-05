(function() {
    'use strict';
    window.addEventListener('load', ()=>{
        /** Get a date from a comment user info container */
        let timeMaker = container => {
            let tEl = container.querySelector("time"); //".ThreadUser__Timestamp-sugcdk-1");
            if (!tEl) return new Date(0);
            let tStr = tEl.innerText.trim().toLocaleLowerCase();
            let year, month, day, hour, minute;
            let currDate = new Date();
            if (tStr.substring(0, 6) === "tänään") {
                year = currDate.getFullYear();
                month = currDate.getMonth();
                day = currDate.getDate();
            } else if (tStr.substring(0, 5) === "eilen") {
                let yesterDate = new Date(+currDate-86400000) //1000*60*60*24 = one full day
                year = yesterDate.getFullYear();
                month = yesterDate.getMonth();
                day = yesterDate.getDate();
            } else {
                let dateStr = tStr.split(" ")[0];
                [day, month, year] = dateStr.split(".").map(x=>parseInt(x));
                month -= 1; //moth is zero-based!
            }
            let timeStr = tStr.split(" ")[1];
            [hour, minute] = timeStr.split(":").map(x=>parseInt(x));
            return new Date(year, month, day, hour, minute);
        };
        /** Array of all user info containers sorted by timestamp */
        let getAllUserInfos = () => {
            let ret = Array.from(document.querySelectorAll("section ul li")).filter(el=>(/ThreadComment/i).test(el.classList.toString()));
            ret.forEach(c=>{c.dateForSorting = timeMaker(c);});
            ret.sort((a,b)=>+a.dateForSorting-b.dateForSorting);
            return ret;
        };
        var showPostIndexInfo = function(postNumber, totalPosts, postContainer) {
            var percent = postNumber/totalPosts*100;
            var perBarHtml = "<progress class='percentBar' max='100' value='"+percent+"'></progress>";
            postIndexInfo.innerHTML = ("<span class='percentBarHolder'>"+perBarHtml+"<p class='textPercentInside'>"+Math.round(percent)+"%</p></span> Aktiivi viesti "+postNumber+"/"+totalPosts);
            postIndexInfo.style.display = "block";
            postContainer.insertAdjacentElement("afterbegin", postIndexInfo);
        };
        /**
* scroll the page to the @postIndex'th user info container, ordering by timestamp
*/
        var moveInfoToUserPost = function(postIndex) {
            var userEls = getAllUserInfos();
            var elsN = userEls.length;
            if (elsN>0) {
                var elInd = (postIndex%elsN+elsN)%elsN;
                var el = userEls[elInd];
                showPostIndexInfo(elInd+1, elsN, el);
                var topPos = el.offsetTop; //el.getBoundingClientRect().top + window.scrollY;
                window.scrollTo(window.scrollX, topPos);
            }
        };
        var setKeyboardFindMsgListener = function() {
            let ob = {
                useKeyboard: true,
                prevKeyCode: {
                    code: 33, //PG UP
                    alt: false,
                    ctrl: false,
                    shift: false,
                },
                nextKeyCode: {
                    code: 34, //PG DOWN
                    alt: false,
                    ctrl: false,
                    shift: false,
                },

            };
            if (ob && ob.useKeyboard) {
                var postInd = 0; //assume want to go to the most recent (with prev button) first

                var checkKeyCodeFunc = function(keyCode, event) {
                    if (!keyCode) return false;
                    return event.keyCode === keyCode.code
                    && event.altKey === keyCode.alt
                    && event.ctrlKey === keyCode.ctrl
                    && event.shiftKey === keyCode.shift;
                };
                var onKeyDownFunc = function(postIndIncr, event) {
                    postInd += postIndIncr;
                    moveInfoToUserPost(postInd);
                    event.preventDefault();
                };
                var keyListener = function(event) {
                    //console.log("key down", event.keyCode);
                    if (checkKeyCodeFunc(ob.prevKeyCode, event)) {
                        onKeyDownFunc(-1, event);
                    } else if (checkKeyCodeFunc(ob.nextKeyCode, event)) {
                        onKeyDownFunc(1, event);
                    }
                };
                document.body.addEventListener("keydown", keyListener);
            }
        };
        let postIndexInfo, postIndexInput;
        postIndexInfo = document.createElement("div");
        postIndexInfo.id = "postIndexInfo";
        postIndexInfo.style.display = "none";
        postIndexInfo.innerHTML = "<span class=percentBar>0%</span> Aktiivi viesti 0/0";
        document.body.appendChild(postIndexInfo);
        //TODO how to hide, this way won't allow to click for input
        //document.body.addEventListener("click", _=>postIndexInfo.style.display="none");
        postIndexInput = document.createElement("input");
        postIndexInfo.tabIndex = 12;
        postIndexInfo.addEventListener("keydown", function(evt) {
            if (evt.keyCode===13) {
                if (postIndexInfo.getElementsByTagName("input").length) {
                    //why won't postIndexInfo.value work here?? Why have to get the input like this:
                    let postIndex = parseInt(postIndexInfo.getElementsByTagName("input")[0].value)-1;
                    if (Number.isInteger(postIndex)) moveInfoToUserPost(postIndex);
                }
            }
        });
        var postIndexClickHandler = evt=>{
            evt.preventDefault();
            if (!postIndexInfo.getElementsByTagName("input").length) {
                var endPart = postIndexInfo.textContent.split("/")[1];
                postIndexInfo.innerHTML = "Mene viestiin ";
                postIndexInfo.appendChild(postIndexInput);
                postIndexInfo.innerHTML += "/"+endPart;
            }
            postIndexInfo.getElementsByTagName("input")[0].focus();
        };
        postIndexInfo.addEventListener("click", postIndexClickHandler);
        // set keyboard control of finding most recent posts
        setKeyboardFindMsgListener();
        let readMoreButt = document.querySelectorAll("main article p")[0]; //document.querySelector("button.ThreadBody__ReadMoreButton-sc-1mjl49q-2.bzkVHZ");
        if (readMoreButt) {
            //console.log("Clicking read more", readMoreButt);
            readMoreButt.click();
        }
        
    });
})();
