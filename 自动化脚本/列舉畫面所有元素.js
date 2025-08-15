// =====================
// 畫面元素偵測工具
// =====================
function logWithTime(msg) {
    let now = new Date();
    let tstr = now.toLocaleTimeString();
    log("[" + tstr + "] " + msg);
}

function logAllElements() {
    logWithTime("===== 畫面上所有元素開始列舉 =====");
    let allObjs = [];
    try {
        // text 元素
        allObjs = allObjs.concat(textMatches(/.*/).find().toArray());
        // desc 元素
        allObjs = allObjs.concat(descMatches(/.*/).find().toArray());
        // id 元素
        allObjs = allObjs.concat(idMatches(/.*/).find().toArray());
        // className 元素
        let allNodes = classNameMatches(/.*/).find();
        for (let i = 0; i < allNodes.size(); i++) {
            allObjs.push(allNodes.get(i));
        }
    } catch (e) {
        logWithTime("錯誤：" + e);
    }
    // 過濾重複
    let uniqueObjs = [];
    let seen = new Set();
    for (let i = 0; i < allObjs.length; i++) {
        let hash = (allObjs[i].text() || "") + (allObjs[i].desc() || "") + (allObjs[i].id() || "") + allObjs[i].className();
        if (!seen.has(hash)) {
            uniqueObjs.push(allObjs[i]);
            seen.add(hash);
        }
    }
    for (let i = 0; i < uniqueObjs.length; i++) {
        let obj = uniqueObjs[i];
        try {
            let info = `[${i + 1}] `;
            if (obj.text()) info += "text: " + obj.text() + "; ";
            if (obj.desc()) info += "desc: " + obj.desc() + "; ";
            if (obj.id()) info += "id: " + obj.id() + "; ";
            info += "class: " + obj.className();
            log(info);
        } catch (e) {
            logWithTime("元素列舉錯誤: " + e);
        }
    }
    logWithTime("===== 元素列舉結束 =====");
}

// ======= 主程序 ==========
// 啟動指定 App
const PACKAGE = "com.android.vending"; // Play 商店
logWithTime(`啟動 App: ${PACKAGE}`);
app.launchPackage(PACKAGE);
logWithTime("等待 10 秒讓頁面完全載入...");
sleep(10000);

// 開始偵測並列舉畫面所有元素
logAllElements();
