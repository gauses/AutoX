// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);






/**
 * AOSP 系统应用专用：静默开启所有权限
 */
/**
 * 1. 基础权限初始化 (只在脚本启动时运行一次)
 */
function initialSystemGrant() {
    var pkg = "org.autojs.autoxjs";
    log("正在执行初始化系统授权...");
    try {
        // 授权标准权限
        shell("pm grant " + pkg + " android.permission.READ_EXTERNAL_STORAGE");
        shell("pm grant " + pkg + " android.permission.WRITE_EXTERNAL_STORAGE");
        // 授权 AppOps 特权
        shell("appops set " + pkg + " SYSTEM_ALERT_WINDOW allow");
        shell("appops set " + pkg + " BACKGROUND_START_ACTIVITY allow");
        shell("appops set " + pkg + " MANAGE_EXTERNAL_STORAGE allow");
        //截图:adb shell appops set org.autojs.autoxjs PROJECT_MEDIA allow
        shell("appops set " + pkg + " PROJECT_MEDIA allow");
        // 加入白名单
        shell("dumpsys deviceidle whitelist +" + pkg);
        toastLog("初始权限配置完成");
    } catch (e) {
        log("初始化授权失败: " + e);
    }
}

/**
 * 2. 核心：无障碍服务守护线程 (每 1 秒检查一次)
 * 主脚本收尾时务必 stopAccessibilityMonitor()，否则子线程 AsyncTask 会一直挂住主 Looper，
 * Java 层 ScriptExecutionGlobalListener.onSuccess 不会触发。
 */
var accessibilityMonitorRunning = true;
var accessibilityMonitorThread = null;

function stopAccessibilityMonitor() {
    accessibilityMonitorRunning = false;
    if (accessibilityMonitorThread != null) {
        try {
            accessibilityMonitorThread.interrupt();
        } catch (e) {
            log("stopAccessibilityMonitor: " + e);
        }
    }
}

function startAccessibilityMonitor() {
    var pkg = "org.autojs.autoxjs";
    var serviceName = pkg + "/com.stardust.autojs.core.accessibility.AccessibilityService";

    accessibilityMonitorThread = threads.start(function () {
        log("无障碍守护线程已启动...");
        var resolver = context.getContentResolver();
        importClass(android.provider.Settings);

        while (accessibilityMonitorRunning) {
            try {
                // 读取当前已开启的服务列表
                var enabledServices = Settings.Secure.getString(resolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) || "";
                var isEnabled = Settings.Secure.getInt(resolver, Settings.Secure.ACCESSIBILITY_ENABLED, 0);

                // 如果总开关关了，或者服务不在列表里
                if (isEnabled == 0 || enabledServices.indexOf(serviceName) === -1) {
                    taskLog("检测到无障碍服务已关闭，正在尝试重新开启...");

                    // 重新构建服务字符串（保持其他已开启的服务不受影响）
                    var newServices = enabledServices;
                    if (enabledServices.indexOf(serviceName) === -1) {
                        newServices = enabledServices ? enabledServices + ":" + serviceName : serviceName;
                    }

                    // 静默写入数据库 (系统应用特权)
                    Settings.Secure.putString(resolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES, newServices);
                    Settings.Secure.putInt(resolver, Settings.Secure.ACCESSIBILITY_ENABLED, 1);

                    taskLog("无障碍服务已通过守护线程强制拉起");
                }
            } catch (err) {
                log("守护线程执行异常: " + err);
            }
            if (!accessibilityMonitorRunning) {
                break;
            }
            try {
                sleep(500);
            } catch (ie) {
                break;
            }
        }
        log("无障碍守护线程已结束");
    });
}

function isAccessibilityServiceReady() {
    try {
        var service = com.stardust.view.accessibility.AccessibilityService.Companion.getInstance();
        return service != null;
    } catch (e) {
        try {
            return auto.service != null;
        } catch (ignored) {
            return false;
        }
    }
}

function waitAccessibilityReady(timeoutMs) {
    var start = new Date().getTime();
    var lastLogTime = 0;
    while (new Date().getTime() - start < timeoutMs) {
        if (isAccessibilityServiceReady()) {
            log("无障碍服务实例已就绪");
            return true;
        }
        var now = new Date().getTime();
        if (now - lastLogTime >= 1000) {
            lastLogTime = now;
            log("等待无障碍服务实例绑定中...");
        }
        sleep(300);
    }
    return false;
}

// --- 顺序执行 ---
initialSystemGrant();     // 初始化一次

// 前台常驻通知，降低被系统杀进程概率
(function () {
    importClass(org.autojs.autojs.external.foreground.ForegroundService);
    try {
        ForegroundService.start(context);
        log("已启动前台服务（常驻通知）");
    } catch (e) {
        log("启动前台服务失败: " + e);
    }
})();

startAccessibilityMonitor(); // 开启后台监听

if (!waitAccessibilityReady(15000)) {
    throw new Error("无障碍服务开关已开启，但服务实例在15秒内未就绪");
}

// 你的主脚本逻辑开始
log("主逻辑运行中...");

// 配置对象
var CONFIG = {
    // 应用配置
    APP: {
        GLOBAL_PACKAGE: 'com.instagram.android',
        MAIN_ACTIVITY: 'com.instagram.mainactivity.InstagramMainActivity'
    },

    
    // 路径配置
    PATHS: {
        DOWNLOAD: "/storage/emulated/0/Download/",
        TEMP_MEDIA: "A_NEST_TikTok_MEDIA",
        LOG_DIR: "/sdcard/Download/log/"
    },
    
    // 超时配置
    TIMEOUTS: {
        SHORT: 3000,
        MEDIUM: 5000,
        LONG: 10000,
        UPLOAD: 120000
    },
    
    // 重试配置
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY: 1000
    },
    
    // UI文本配置
    UI_TEXT: {
        INSTAGRAM_LIKE_BUTTON: {
            ZH_CN: ["赞", "按赞"],//className("android.widget.ImageView") desc("赞") 
            ZH_TW: ["按讚", "讚"], //className("android.widget.ImageView") desc("按讚")
            EN_US: ["Like", "Liked"], //className("android.widget.ImageView") desc("Like")
            EN_US_0: "Like" //className("android.widget.Button") desc("Like video. 3.2M likes")
        },

        INSTAGRAM_COMMENT_BUTTON: {
            ZH_CN: "阅读或添加评论",//className("android.widget.Button")  desc("阅读或添加评论。0 条评论")
            //desc("閱讀或新增評論。32 則評論")
            ZH_TW: "閱讀或新增評論", //className("android.widget.Button") desc("閱讀或新增評論。")
            // 英文版 desc 常为 "Read or add comments. 0 comments" —— 多给几条便于 contains 命中；部分机型评论入口是 ImageView
            EN_US: [
                "Read or add comments",
                "Read or add comment"
            ]
        },

        INSTAGRAM_SAVE_BUTTON: {
            ZH_CN: "将此视频添加到或移出收藏",//className("android.widget.Button") desc("将此视频添加到或移出收藏。")
            ZH_TW: "從「我的珍藏」新增或移除此影片", //className("android.widget.Button") desc("從「我的珍藏」新增或移除此影片。")
            EN_US: "Add or remove this video from Favorites" //className("android.widget.Button") desc("Add or remove this video from Favorites.")
        },

        INSTAGRAM_POST_BUTTON: {
            ZH_CN: "发布评论",//className("android.widget.Button") desc("发布评论")
            ZH_TW: "發佈評論", //className("android.widget.Button") desc("發佈評論")
            EN_US: "Post comment" //className("android.widget.Button") desc("Post comment")
        }

        

    },
    
    // 日志配置
    LOG: {
        FILENAME: "nest_task_log.txt",
        IMG_NAME: "nest_task_log.png"
    }
};



//******************************************************************
//***********************Instagram首页浏览养号*************************
//******************************************************************

var INSTAGRAM_PACKAGE_NAME = 'com.instagram.android';

//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log_" + getSystemDate("df").replace(/:/g, "-").replace(" ", "_") + ".txt"
var RPAFilePath = "/sdcard/Download/log/";
// 如果目录存在且有内容就删除
if (files.exists(RPAFilePath)) {
    files.removeDir(RPAFilePath);
}
//日志文件路径
var logFilePath = RPAFilePath + taskLogFileName;
//确保日志目录存在
files.ensureDir(RPAFilePath);


//日志文件路径
var resultPath = RPAFilePath + "nest_result_rpa.txt";
//确保日志目录存在
files.ensureDir(resultPath);


// 需要取养号的视频总数
var total_target = 0;
// 成功取养号的视频数量
var total_success = 0;
// 错误信息
var fail_msg = "";


//用户需要输入的评论内容
const TT_Watch_Count = "$${瀏覽數量}" //观看视频个数
const TT_commentFile = '$${T_輸入留言內容}';
const TT_Like_Count = "$${點愛心機率}" //点赞概率
const TT_Comment_Count = "$${留言機率}" //评论概率
const TT_Save_Count = "$${點收藏機率}" //收藏概率


// 计算循环次数
const loopTimes = TT_Watch_Count;
total_target = TT_Watch_Count;
taskLog("需要观看的视频总数： = " + total_target);


var targetPackageName = null;
var targetClassName = null;



//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
 events.on('exit', function(){
    console.hide()
    sleep(1000)

    if(handleErrorFlag){
        console.error("-----------------脚本执行出现异常---------------");
        console.error("Tiktok根據推薦影片，自動瀏覽養號.評論.點讚---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        forceStop_APP(targetPackageName)
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok根據推薦影片，自動瀏覽養號.評論.點讚---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(targetPackageName)
    console.error("===错误报告开始===");
    console.error("错误信息：" + e);
    console.error("错误堆栈：" + e.stack);
    console.error("===错误报告结束===");
    exit()
}

function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}


//打开Autojs的Log activity
function openLogActivity() {
    var intent = {
        action: "android.intent.action.MAIN",
        packageName: "org.autojs.autoxjs",
        className: "org.autojs.autojs.ui.log.LogActivityKt"
    };
    app.startActivity(intent);
}


//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
// console.show()


taskLog("开始强制关闭同名的脚本...")
let currentEngine = engines.myEngine()
let runningEngines = engines.all()
let currentSource = currentEngine.getSource() + ''
if (runningEngines.length > 1) {
  runningEngines.forEach(compareEngine => {
    let compareSource = compareEngine.getSource() + ''
    if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
      // 强制关闭同名的脚本
      compareEngine.forceStop()
    }
  })
}


sleep(3000)
taskLog("准备启动Instagram...")



function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}

if (isAppInstalled(INSTAGRAM_PACKAGE_NAME)) {
    targetPackageName = INSTAGRAM_PACKAGE_NAME;
    targetClassName = "com.instagram.mainactivity.InstagramMainActivity";
    taskLog("检测到已安装Instagram，准备启动...");
} else {
    toast("未检测到Instagram已安装，请先安装Instagram！");
    taskLog("未检测到Instagram已安装，脚本终止。");
    exit();
}

sleep(random(3000, 5000))

forceStop_APP(targetPackageName)
sleep(3000)

 // 第二次：强杀 TikTok、切前台等可能让无障碍短暂断连，启动 App 与截图前再等一次（已连接则立刻返回）
 sleep(1000);
 auto.waitFor();
 taskLog("无障碍已就绪，准备启动 Instagram");

app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});


sleep(random(3000, 5000))


//开始录屏截图到本地
function Nest_ScreenCapture(){
    var path = RPAFilePath + "/nestshot_" + Date.now() + ".png";
    files.ensureDir(RPAFilePath);

    try {
        var cmd = 'screencap -p "' + path + '"';
        taskLog("开始执行 shell 截图命令: " + cmd);
        var result = shell(cmd);
        var code = result ? result.code : "null";
        var stdout = result ? result.result : "";
        var stderr = result ? result.error : "";

        taskLog("shell截图返回码 code=" + code);
        if (stdout) {
            log("shell截图 stdout: " + stdout);
        }
        if (stderr) {
            log("shell截图 stderr: " + stderr);
        }

        if (!result || code !== 0) {
            taskLog("自动化任务-shell截图失败，跳过截图");
            return null;
        }

        if (!files.exists(path)) {
            taskLog("自动化任务-shell截图未生成文件，跳过截图");
            return null;
        }
    } catch (e) {
        taskLogError("自动化任务-shell截图异常: " + e);
        return null;
    }

    taskLog("自动化任务已经完成-已保存截图："+ path);


    //刷新媒体库
    sleep(3000)
    toast("开始刷新媒体库....");
    refreshMedia(RPAFilePath)
    return path
}
// 刷新指定路径的媒体库
function refreshMedia(path) {
    taskLog("开始刷新媒体库....");
    // 发送媒体扫描广播
    media.scanFile(path);
    // 等待扫描完成
    sleep(5000);
    taskLog("媒体库刷新完成.");
}



function clickId(a) {
    let obj_ID = id(a).boundsInside(5, 5, device.width - 5, device.height - 5);
    
    // 检查是否找到元素
    let elements = obj_ID.find();
    if (elements.empty()) {
        taskLog("没有找到元素ID ：" + a);
        return;
    }
    
    // 获取第一个匹配的元素
    let element = elements.get(0);
    let X = element.bounds().centerX();
    let Y = element.bounds().centerY();
    
    // 验证 X 和 Y 是否为正数
    if (X < 0 || Y < 0) {
        taskLog("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
        return;
    }

    // 生成随机偏差
    let Deviation = random(-2, 2);
    let X1 = X - Deviation;
    let Y1 = Y - Deviation;

    // 防止偏差导致负值
    X1 = Math.max(0, X1);
    Y1 = Math.max(0, Y1);

    try {
        device.sdkInt < 24 ? ra.tap(X1, Y1) : click(X1, Y1);
    } catch (e) {
        taskLog("点击操作失败：" + e.message);
    }
}





//点击个人主页
function click_Author_Page_Btn(){
    taskLog("开始准备查看个人主页")
    clickId("qza")
    sleep(random(5000,8000))

    // 获取屏幕宽高
    var width = device.width;
    var height = device.height;
    
     // 生成随机起始点
     var startX = random(width / 3 , width * 2 / 3);
     var startY = random(height * 2 / 3, height * 3 / 4);

     // 生成随机结束点
     var endX = random(width / 3 , width * 2 / 3);
     var endY = random(height * 1 / 3, height * 1 / 4);

    // 随机选择滑动方向：上滑或下滑
    for (var i = 0; i < 2; i++) {
        var direction = random(0, 1) === 0 ? 'up' : 'down';

        if (direction === 'up') {
            // 从下往上滑动
            swipe(startX, startY, endX, endY, 500);
        } else {
            // 从上往下滑动
            swipe(startX, startY, endX, endY, 500);
        }
        
        // 暂停一段时间，避免滑动过快
        sleep(random(3000,5000));
    }

    taskLog("从视频作者主页返回")
    sleep(random(3000,5000));
    back();
}




/**
 * @param coordinateClickFirst 若为 true（如 TikTok 评论外层 Button）：命中后先 click(中心坐标) 再回退 node.click()，避免无障碍 ACTION_CLICK 无响应
 */
function clickByUiTextAndClassWithRetry(languageObject, classNameStr, maxRetries, delayMs, failMessage, matchMode, coordinateClickFirst) {
    maxRetries = maxRetries || 10;
    delayMs = delayMs || 1000;
    matchMode = matchMode || "fuzzy_half"; // fuzzy_half | exact | half_prefix | contains
    coordinateClickFirst = coordinateClickFirst === true;

    var targetTexts = [];
    for (var lang in languageObject) {
        if (!languageObject.hasOwnProperty(lang)) continue;
        var val = languageObject[lang];
        if (Array.isArray(val)) {
            for (var i = 0; i < val.length; i++) {
                if (val[i]) targetTexts.push(String(val[i]));
            }
        } else if (val) {
            targetTexts.push(String(val));
        }
    }

    function normalizeText(s) {
        if (!s) return "";
        return String(s).toLowerCase().replace(/\s+/g, "").replace(/[.,，。:：!！?？"'\-\(\)\[\]{}]/g, "");
    }

    // 目标文本在节点文本中的匹配比例（>=0.5 视为命中）
    function matchRatio(candidate, target) {
        var c = normalizeText(candidate);
        var t = normalizeText(target);
        if (!c || !t) return 0;

        if (c.indexOf(t) >= 0) return 1;
        if (t.indexOf(c) >= 0) return c.length / t.length;

        var freq = {};
        for (var i = 0; i < c.length; i++) {
            var ch = c.charAt(i);
            freq[ch] = (freq[ch] || 0) + 1;
        }

        var common = 0;
        for (var j = 0; j < t.length; j++) {
            var tch = t.charAt(j);
            if (freq[tch] > 0) {
                common++;
                freq[tch]--;
            }
        }
        return common / t.length;
    }

    function isMatchedByMode(candidate, target) {
        var c = normalizeText(candidate);
        var t = normalizeText(target);
        if (!c || !t) return false;

        if (matchMode === "exact") {
            return c === t;
        }

        if (matchMode === "half_prefix") {
            var halfLen = Math.max(1, Math.floor(c.length / 2));
            var firstHalf = c.substring(0, halfLen);
            return firstHalf.indexOf(t) >= 0 || t.indexOf(firstHalf) >= 0;
        }

        if (matchMode === "contains") {
            return c.indexOf(t) >= 0;
        }

        return matchRatio(c, t) >= 0.5;
    }

    /** 调试：打印本次 find 到的全部 Button 的 desc/text/bounds（仅 class 含 Button 时，避免 ImageView 刷屏） */
    function logAllButtonNodesDesc(nodes, attempt) {
        if (!classNameStr || classNameStr.indexOf("Button") < 0) return;
        if (!nodes || nodes.size() === 0) {
            taskLog("[UI调试-Button] 第" + attempt + "次：未找到任何 " + classNameStr);
            return;
        }
        taskLog("[UI调试-Button] 第" + attempt + "次：共 " + nodes.size() + " 个 " + classNameStr);
        for (var n = 0; n < nodes.size(); n++) {
            var node = nodes.get(n);
            if (!node) continue;
            var t = "";
            var d = "";
            try { t = node.text() || ""; } catch (e1) {}
            try { d = node.desc() || ""; } catch (e2) {}
            var bstr = "";
            try {
                var bb = node.bounds();
                bstr = "[" + bb.left + "," + bb.top + "," + bb.right + "," + bb.bottom + "]";
            } catch (e3) {}
            taskLog("[UI调试-Button] #" + n + " text=" + t + " | desc=" + d + " | bounds=" + bstr);
        }
    }

    /** 合法矩形且与屏幕有交集，排除 top>bottom 等异常节点（列表里重复模板、屏外项） */
    function isBoundsIntersectScreen(b) {
        if (!b) return false;
        var l = b.left;
        var t = b.top;
        var r = b.right;
        var bt = b.bottom;
        if (l >= r || t >= bt) return false;
        var w = device.width;
        var h = device.height;
        var il = Math.max(l, 0);
        var it = Math.max(t, 0);
        var ir = Math.min(r, w);
        var ibt = Math.min(bt, h);
        return il < ir && it < ibt;
    }

    function hitAndClickOnNodes(nodes) {
        if (!nodes) return false;
        for (var n = 0; n < nodes.size(); n++) {
            var node = nodes.get(n);
            if (!node) continue;

            var b0 = null;
            try {
                b0 = node.bounds();
            } catch (eb0) {}
            if (!isBoundsIntersectScreen(b0)) continue;

            var t = "";
            var d = "";
            try { t = node.text() || ""; } catch (e1) {}
            try { d = node.desc() || ""; } catch (e2) {}

            for (var j = 0; j < targetTexts.length; j++) {
                var target = targetTexts[j];
                var textHit = isMatchedByMode(t, target);
                var descHit = isMatchedByMode(d, target);
                if (textHit || descHit) {
                    var hitVia = textHit ? "text" : "desc";
                    var bstr = "";
                    var b = null;
                    try {
                        b = node.bounds();
                        bstr = "[" + b.left + "," + b.top + "," + b.right + "," + b.bottom + "]";
                    } catch (eb) {}
                    if (!isBoundsIntersectScreen(b)) continue;

                    function logHitDetail(extra) {
                        taskLog(
                            "[命中详情] 命中并点击成功：" + classNameStr +
                            " 节点#" + n +
                            " 匹配方式=" + hitVia +
                            " 匹配关键字=" + target +
                            " 当前text=" + t +
                            " | desc=" + d +
                            " bounds=" + bstr +
                            (extra || "")
                        );
                    }

                    if (coordinateClickFirst) {
                        try {
                            click(b.centerX(), b.centerY());
                            sleep(200);
                            logHitDetail(" (优先坐标点击 center=" + b.centerX() + "," + b.centerY() + ")");
                            return true;
                        } catch (eCoord) {}
                        try {
                            if (node.click && node.click()) {
                                logHitDetail(" (坐标失败后无障碍 click)");
                                return true;
                            }
                        } catch (e3) {}
                    } else {
                        try {
                            if (node.click && node.click()) {
                                logHitDetail(" (无障碍 click)");
                                return true;
                            }
                        } catch (e3) {}
                        try {
                            click(b.centerX(), b.centerY());
                            logHitDetail(" (坐标点击 center=" + b.centerX() + "," + b.centerY() + ")");
                            return true;
                        } catch (e4) {}
                    }
                }
            }
        }
        return false;
    }

    for (var attempt = 1; attempt <= maxRetries; attempt++) {
        taskLog("开始第" + attempt + "次查找" + classNameStr + "并按UI_TEXT点击，匹配模式=" + matchMode + "...");
        var nodes = className(classNameStr).find();
        logAllButtonNodesDesc(nodes, attempt);
        if (hitAndClickOnNodes(nodes)) {
            return true;
        }
        if (attempt < maxRetries) sleep(delayMs);
    }

    taskLogError(failMessage || ("连续" + maxRetries + "次点击失败"));
    return false;
}


//点击点赞按钮
function click_Like_Btn(){
    taskLog("开始准备点赞视频")
    //className("android.widget.Button")
    //fullId("com.instagram.android:id/row_feed_button_like")
    //fullId("com.instagram.android:id/row_feed_button_like")
    clickId("com.instagram.android:id/row_feed_button_like")
    // taskLog("开始准备点赞视频");
    // if (!clickByUiTextAndClassWithRetry(
    //     CONFIG.UI_TEXT.TT_LIKE_BUTTON,
    //     "android.widget.ImageView",
    //     3,
    //     1000,
    //     "点赞按钮点击失败",
    //     "exact"
    // )) {
    //     // throw new Error("点赞按钮点击失败");
    //     taskLogError("点赞按钮点击失败");
    // }

}



//点击评论按钮
function click_Comment_Btn(commentText){

    //提前检查一下
    check_save_btn_dialog()
    sleep(random(2000 , 3000))

    taskLog("开始准备评论视频")
    //fullId("com.instagram.android:id/row_feed_button_comment") clickable("false")
    clickId("com.instagram.android:id/row_feed_button_comment")

    sleep(5000)
    //className("android.widget.AutoCompleteTextView")
    var autoCompleteTextViews = className("android.widget.AutoCompleteTextView").find();
    taskLog("autoCompleteTextViews长度 = " + autoCompleteTextViews.size())


    if(autoCompleteTextViews.size() >0){
        var textView = autoCompleteTextViews.get(autoCompleteTextViews.size() - 1);
        if(textView) {
            taskLog("找到TextView控件-Text："+ textView.text());
            textView.click()
            sleep(1000)
            taskLog("评论控件，设置内容：" +commentText );
            textView.setText(commentText)
            sleep(5000)
    
    
            //发送按钮
            //fullId("com.instagram.android:id/layout_comment_thread_post_button_icon")
            clickId("com.instagram.android:id/layout_comment_thread_post_button_icon")


            sleep(random(2000, 3000))

            // //截图
            // Nest_ScreenCapture()
            // sleep(random(2000, 3000))


            back()
            swipe_up()
            sleep(random(2000, 3000))
            back()
            sleep(random(2000, 3000))
                
        }
    }
   
}



//点击收藏按钮
function click_Save_Btn(){
    taskLog("开始准备收藏视频")
    //fullId("com.instagram.android:id/row_feed_button_save")
    clickId("com.instagram.android:id/row_feed_button_save")

    check_save_btn_dialog()

}



function check_save_btn_dialog(){
    //可能出现一个下拉框，需要点击back

    sleep(random(3000 , 5000))
    taskLog("检查是否存在收藏下拉框")
    //fullId("com.instagram.android:id/primary_action_button")
    if(id("com.instagram.android:id/primary_action_button").exists()){
        taskLog("存在收藏下拉框，点击back")
        back()
    }else{
        taskLog("不存在收藏下拉框")
    }
}

//点击观看
function click_Watch_Btn(){
    taskLog("开始准备观看视频")
    try {
        // 判断屏幕宽高是否有效
        if (device.width > 0 && device.height > 0) {
            let centerX = Math.floor(device.width / 2);
            let centerY = Math.floor(device.height / 2);
            // 再次校验中心点
            if (centerX >= 0 && centerY >= 0) {
                click(centerX, centerY);
                taskLog("已点击屏幕中心: X=" + centerX + ", Y=" + centerY);
            } else {
                taskLog("屏幕中心坐标无效: X=" + centerX + ", Y=" + centerY);
            }
        } else {
            taskLog("获取屏幕宽高失败，无法点击中心");
        }
    } catch (e) {
        taskLog("点击屏幕中心时发生异常: " + e.message);
    }
    sleep(random(3000, 5000));
    back();
}


function find_send_btn() {
    var allButtons = className("android.widget.Button").find();
    taskLog("find_send_btn allButtons长度 = " + allButtons.size())
    if (allButtons && allButtons.size() > 0) {

        // 获取最后一个按钮
        var lastButton = allButtons.get(allButtons.size() - 1);
        if (lastButton) {
            // bounds()是一个方法,需要先调用它
            var bounds = lastButton.bounds();
            click(bounds.centerX(), bounds.centerY());
        }
    }
}



//打印日志
function taskLog(_log){
    toast(_log)
    console.log(getSystemDate("df") +":" +_log)

    //通过日志判断任务有没有结束：

}



function getSystemDate(a) {
    var b = new SimpleDateFormat("HH:mm:ss"), c = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    return "tf" == a ? b.format(new java.util.Date()) :"df" == a ? c.format(new java.util.Date()) :void 0;
}
function writeLog(a) {
    var c, b = "/sdcard/Download/log/Info_" + getSystemDate("df") + ".log";
    files.ensureDir("/sdcard/Download/log/"), files.exists(b) || files.create(b);
    try {
        c = new PrintWriter(new FileWriter(b, !0)), c.println("[" + getSystemDate("tf") + "] " + a),
        c.flush(), c.close();
    } catch (d) {
        log(d);
    }
}


function clickText(a) {
    for (obj_Text = text(a).boundsInside(5, 5, device.width-5, device.height-5); obj_Text.find().empty(); ) sleep(1e3);
    X = obj_Text.find().get(0).bounds().centerX(), Y = obj_Text.find().get(0).bounds().centerY(),
    Deviation = random(-10, 10), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
}
function clickDesc(a) {
    for (obj_Desc = desc(a).boundsInside(5, 5, device.width-5, device.height-5); obj_Desc.find().empty(); ) sleep(1e3);
    X = obj_Desc.find().get(0).bounds().centerX(), Y = obj_Desc.find().get(0).bounds().centerY(),
    Deviation = random(-10, 10), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
}

//========================================================================================================================


//结束当前任务
function stopCurrentTask(){
    // saveImg()

    sleep(3000)
//    //将task的截图上报
//    var res = http.postMultipart(url, {
//        taskId: "xxxxxxxxxxx",
//        file: open("/sdcard/Download/" + taskLogImgName)
//    });
//    log(res.body.string());

    console.hide()

}



//强制停止TikTok 
function forceStop_APP(packageName){
    try {
        var cmd = "am force-stop " + packageName;
        taskLog("准备强杀: " + packageName);
        taskLog("执行命令: " + cmd);

        var result = shell(cmd);
        var code = result ? result.code : "null";
        var stdout = result ? result.result : "";
        var stderr = result ? result.error : "";

        log("force-stop code = " + code);
        if (stdout) {
            log("force-stop result = " + stdout);
        }
        if (stderr) {
            log("force-stop error = " + stderr);
        }

        if (result && code === 0) {
            taskLog("强杀成功: " + packageName);
            return true;
        } else {
            taskLogError("强杀失败: " + packageName + (stderr ? "，error=" + stderr : ""));
            return false;
        }
    } catch (e) {
        taskLogError("强杀异常: " + e);
        return false;
    }
}



//从评论列表数组中，随机挑选一条内容，翻译
function get_post_text(){
    // 用于存储私信用户的数组
    let comments = [];


    if(TT_commentFile && 
        TT_commentFile.trim() !== "" && 
        TT_commentFile.trim().toLowerCase() !== "off" && 
        !TT_commentFile.includes("$${")){
            
                const file = new java.io.File(TT_commentFile);
                if (file.exists() && file.isFile()) {
                    try {
                        // 读取文件内容
                        const reader = new java.io.BufferedReader(new java.io.FileReader(file));
                        let line;
                        while ((line = reader.readLine()) !== null) {
                            comments.push(line);
                        }
                        reader.close();
                    } catch (e) {
                        taskLog("读取文件时发生错误：" + e.message);
                    }
                } else {
                    // 如果文件不存在，将文件名添加到数组中
                    comments.push(TT_commentFile);
                }
        }



    return comments

}

function swipe_up(){
    //使用多段swipe实现曲线滑动
    let screenHeight = device.height;
    let startY = Math.floor(screenHeight * 0.9);  // 起点
    let endY = Math.floor(screenHeight * 0.1);    // 终点
    let distance = startY - endY;                 // 总距离
    
    // 第一段：向右倾斜
    swipe(
        device.width / 2,    // 起点X
        startY,             // 起点Y
        device.width * 0.7,  // 终点X
        startY - distance/3, // 终点Y
        700                 // 持续时间
    );
    sleep(200);
    
    // 第二段：向左倾斜
    swipe(
        device.width * 0.7,  // 起点X
        startY - distance/3, // 起点Y
        device.width * 0.3,  // 终点X
        startY - distance*2/3, // 终点Y
        700                 // 持续时间
    );
    sleep(200);
    
    // 第三段：回到中间
    swipe(
        device.width * 0.3,  // 起点X
        startY - distance*2/3, // 起点Y
        device.width / 2,    // 终点X
        endY,               // 终点Y
        600                 // 持续时间
    );
    sleep(3000); //等待滚动完成
}


try {
    
    // 开始主循环
    var commentTextArrays = get_post_text()
    if(commentTextArrays.includes("$${T")){ 
        throw_error_storage_not_enough()
    }
    taskLog("评论文案个数：" + commentTextArrays.length)

    for(let currentLoop = 1; currentLoop <= loopTimes; currentLoop++) {
        toast("开始第 " + currentLoop + "/" + loopTimes + " 次执行");    

        Nest_ScreenCapture()
        sleep(random(5000, 8000))
        total_success++
        
        
        sleep(random(3000, 5000))

        taskLog("开始模拟滑动")
        swipe_up()

        check_save_btn_dialog()
        taskLog("开始准备寻找点赞按钮....");
        sleep(random(3000, 5000))

        //检查是不是有点赞按钮
        //fullId("com.instagram.android:id/row_feed_button_like")
        var likeBtnList = id("com.instagram.android:id/row_feed_button_like").className("android.widget.Button").find()
        taskLog("当前页面的likeBtn数量 = " + likeBtnList.size())





        taskLog("当前页面的点赞概率 = " + TT_Like_Count)
        taskLog("当前页面的评论概率 = " + TT_Comment_Count)
        taskLog("当前页面的保存概率 = " + TT_Save_Count)


        if(likeBtnList.size() > 0){
            if (Math.random() * 100 < TT_Like_Count)  {
                taskLog("开始触发点赞概率")
                click_Like_Btn()
            }else{
                taskLog("本次不需要触发点赞概率")
            }
            sleep(random(3000, 5000))

            if (Math.random() * 100 < TT_Save_Count)  {
                taskLog("开始触发保存视频概率")
                click_Save_Btn()
            }else{
                taskLog("本次不需要触发保存视频概率")
            }
            sleep(random(3000, 5000))

            if (Math.random() * 100 < TT_Comment_Count)  {
                taskLog("开始触发评论概率")
                
                if(commentTextArrays.length > 0){

                    var randIdx = random(0, commentTextArrays.length - 1)
                    var messageText = commentTextArrays[randIdx];

                    toast("评论文案：" + messageText)
                    toast("准备点击评论按钮....");
                    click_Comment_Btn(messageText)

                    taskLog("等待5秒后，准备返回上一个页面")
                    sleep(random(3000, 5000))
                }else{
                    toast("评论文案为空，所以不点击评论按钮");
                }
                
            }else{
                taskLog("本次不需要触发评论视频概率")
            }


            
        }else{
            taskLog("没有找到点赞按钮，直接下一次循环页面")
        }


        if(currentLoop < loopTimes) {
            taskLog("等待5秒后开始下一次循环...");
            sleep(random(3000, 5000))
        }
    }

    //截图
    Nest_ScreenCapture()
    sleep(random(3000, 5000))

    taskLog("所有循环执行完毕，准备结束任务...");
    stopCurrentTask()


} catch(e) {
    if (e.message === "TASK_COMPLETED") {
        taskLog("任务正常完成");
    } else {
        handleError(e);
    }
}finally{
    taskLog("保存统计结果到备用路径..." );
    try {
        var result = {
            total_target: total_target,
            total_success: total_success,
            fail_msg: fail_msg
        };
        // 打印统计结果
        taskLog("统计结果：" + JSON.stringify(result, null, 2));
        // 使用JSON.stringify将对象转换为JSON字符串，第三个参数2是为了美化输出格式
        files.write(resultPath, JSON.stringify(result, null, 2));
        taskLog("已保存统计结果到：" + resultPath);
    } catch(e) {
        console.error("保存统计结果失败：" + e.message);
    }
    // 刷新媒体库
    refreshMedia(RPAFilePath);
    sleep(random(3000, 5000))
    openLogActivity()
    stopAccessibilityMonitor();
}