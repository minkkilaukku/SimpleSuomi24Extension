var cachedUserEls = [];
var cachedUserName = null;
var cachedSortBy = null;


/** Get all p.user-info-name elements with given userName (empty means get all)
*  @param userName, if non-empty, get only messages with this name
* @param sortBy, if "time" sort by posting time, otherwise in the order they appear on the page
*/
var getUserPostElems = function(userName, sortBy) {
    if (userName === cachedUserName && sortBy === cachedSortBy) {
        return cachedUserEls;
    } else {
        var userEls = Array.from(document.querySelectorAll("p.user-info-name"));
        var userNames = userEls.map(x=>x.textContent.trim());

        if (userName.length>0) { //empty userName means get all
            for (let i=0; i<userNames.length; i++) {
                if (userNames[i]!==userName) {
                    delete userEls[i];
                }
            }
            userEls = userEls.filter(x=>x);
        }

        if (sortBy==="time") {
            let timeStampGetter = el=>{
                var tSEl = el.parentElement.getElementsByClassName("user-info-timestamp")[0];
                if (tSEl) return tSEl.textContent.trim();
                return "1.1.1900 00:00";
            };
            let dateMaker = ts => {
                var [da, ti] = ts.split(" ");
                var [day, month, year] = da.split(".");
                var [hour, minute] = ti.split(":");
                //month is zero-based (doesn't affect ordering but make it still correct)
                return new Date(year, month-1, day, hour, minute, 0); //-1 converts to number
            };
            //put a date object to each element as property, so it's easy to sort them
            userEls.forEach( el=>el.datePosted = dateMaker(timeStampGetter(el)) );
            userEls.sort((a,b)=>a.datePosted-b.datePosted);
        }
        
        cachedUserEls = userEls;
        cachedUserName = userName;
        cachedSortBy = sortBy;
        
        return userEls;
    }
};



/** Get the container parent of a user-name element
* (this way also the removed messages (where user-info is hidden) will be scrolled to)
*/
var getContainerOfUserEl = function(userEl) {
    //to avoid infinite loop
    //if for some reason the userEl isn't inside an answer or comment container
    //it should always be 2 levels up, but find like this to be sure
    var maxLevelsUp = 4;
    var levelUpCounter = 0;
    var res = userEl;
    while (res && res.classList
           && !res.classList.contains("answer-container")
           && !res.classList.contains("comment-container")
           && levelUpCounter<maxLevelsUp) {
        res = res.parentElement;
        levelUpCounter++;
    }
    return res;
};



var showPostIndexInfo = function(postNumber, totalPosts, postContainer) {
    var percent = postNumber/totalPosts*100;
    var perBarHtml = "<progress class='percentBar' max='100' value='"+percent+"'></progress>";
    
    postIndexInfo.innerHTML = "<span class='percentBarHolder'>"
        +perBarHtml+
        "<p class='textPercentInside'>"+Math.round(percent)+"%"+"</p></span>"
        +" Aktiivi viesti "+postNumber+"/"+totalPosts;
    
    var bdd = postContainer.getBoundingClientRect();
    var infoBdd = postIndexInfo.getBoundingClientRect();
    postIndexInfo.style.display = "block";
    postContainer.insertAdjacentElement("afterbegin", postIndexInfo);
    /*
    var infoW = Math.max(75, infoBdd.width);
    postIndexInfo.style.left = (bdd.left-infoW-10)+"px";
    postIndexInfo.style.top = (bdd.top + window.scrollY)+"px";
    */
};


/**
* scroll the page to the @postIndex'th (in the ordering given by @sortBy)
* post of user @userName (the container of the post is used to give the scroll position).
* (empty userName means consider all posts)
*/
var scrollToUserPost = function(userName, postIndex, sortBy) {
    var userEls = getUserPostElems(userName, sortBy);
    var elsN = userEls.length;
    if (elsN>0) {
        var elInd = (postIndex%elsN+elsN)%elsN;
        var el = userEls[elInd];
        //the first post doesn't have a similar container as answers and comments
        //so it must be handled separately
        if (el === document.querySelector("p.user-info-name")) { //the starting post
            var threadHeader = document.getElementsByClassName("thread-header")[0];
            if (threadHeader) {
                var topPos = threadHeader.getBoundingClientRect().top + window.scrollY;
                window.scrollTo(0, topPos);
                showPostIndexInfo(elInd+1, elsN, el.parentElement); //use the user-info-big as container
            }
        } else {//answers and comments
            var container = getContainerOfUserEl(el);
            if (container) {
                showPostIndexInfo(elInd+1, elsN, container); //this changes the size, so put it in first
                var topPos = container.getBoundingClientRect().top + window.scrollY;
                window.scrollTo(0, topPos);
            }
        }
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
            scrollToUserPost("", postInd, "time");
            event.preventDefault();
        };
        var keyListener = function(event) {
            console.log("key down", event.keyCode);
            if (checkKeyCodeFunc(ob.prevKeyCode, event)) {
                onKeyDownFunc(-1, event);
            } else if (checkKeyCodeFunc(ob.nextKeyCode, event)) {
                onKeyDownFunc(1, event);
            }
        };
        
        document.body.addEventListener("keydown", keyListener);
    }
};



var postIndexInfo = document.createElement("div");
postIndexInfo.id = "postIndexInfo";
postIndexInfo.style.display = "none";
postIndexInfo.innerHTML = "<span class=percentBar>0%</span> Aktiivi viesti 0/0";
document.body.appendChild(postIndexInfo);


//TODO how to hide, this way won't allow to click for input
//document.body.addEventListener("click", _=>postIndexInfo.style.display="none");

var postIndexInput = document.createElement("input");
postIndexInfo.tabIndex = 12;
postIndexInfo.addEventListener("keydown", function(evt) {
    if (evt.keyCode===13) {
        if (postIndexInfo.getElementsByTagName("input").length) {
            //why won't postIndexInfo.value work here?? Why have to get the input like this:
            postIndex = parseInt(postIndexInfo.getElementsByTagName("input")[0].value)-1;
            scrollToUserPost(cachedUserName||"", postIndex, cachedSortBy||"time");
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

