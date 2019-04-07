const COLL_BUTT_SIZE = 23; //diameter of collapse/expand buttons in pixels

var addCollapsing = function() {
    var indentMarkers = document.querySelectorAll(".indented");
    for (let inde of indentMarkers) {
        inde.style.display = "none"; //hide these so they don't come on top of buttons
    }
    
    var colls = document.querySelectorAll(".comments-header");
    var commConts = document.querySelectorAll(".comments-container");
    
    //move comments headers one level up to same level as indents
    for (let c of colls) {
        c.parentElement.parentElement.children[0].before(c);
    }
    
    var infoHolders = Array.from(colls).map((_,i)=>{
        return {
            collapsed: false,
            toggle: _=>{infoHolders[i].collapsed=!infoHolders[i].collapsed}
        };
    });
    
    
    var setButtBg = function(butt, url) {
        butt.style.background = "transparent url("+url+") no-repeat center"; //center seems to work
        butt.style.backgroundSize = COLL_BUTT_SIZE+"px "+ COLL_BUTT_SIZE+"px";
    };
    
    var makeCollButt = function(i) {
        var b = document.createElement("button");
        b.classList.add("collapseButton");
        b.setAttribute("collapsed", false);
        b.onclick = function() {
            infoHolders[i].toggle();
            let isColl = infoHolders[i].collapsed;
            //commConts[i].style.display = isColl ? "none" : "block";
            commConts[i].classList.toggle("hiddenWithLankkiMiukku");
            collButts[i].setAttribute("collapsed", isColl);
            let urlOfImg = chrome.extension.getURL(isColl ? "img/expand.png" : "img/collapse.png");
            //console.log("got url "+urlOfImg);
            setButtBg(b, urlOfImg);
        };
        let urlOfImg = chrome.extension.getURL("img/collapse.png");
        //console.log("got url "+urlOfImg);
        b.style.width = COLL_BUTT_SIZE+"px";
        b.style.height = COLL_BUTT_SIZE+"px";
        setButtBg(b, urlOfImg);
        return b;
    };
    
    var collButts = Array.from(colls).map((_,i)=>makeCollButt(i));
    
    for (let i=0; i<collButts.length; i++) {
        colls[i].after(collButts[i]);
    };
    
};


var keyForStorage = "lankki_miukku_romahdutus_buttonit";
chrome.storage.sync.get([keyForStorage], function(result) {
    let res = result[keyForStorage];
    if (res || res===undefined) addCollapsing();
});

