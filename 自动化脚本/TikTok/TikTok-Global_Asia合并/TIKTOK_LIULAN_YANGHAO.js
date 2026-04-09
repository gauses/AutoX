// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok首页浏览养号*************************
//******************************************************************


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
        ASIA_PACKAGE: 'com.ss.android.ugc.trill',
        GLOBAL_PACKAGE: 'com.zhiliaoapp.musically',
        MAIN_ACTIVITY: 'com.ss.android.ugc.aweme.main.MainActivity'
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
        TT_LIKE_BUTTON: {
            ZH_CN: ["赞", "按赞"],//className("android.widget.ImageView") desc("赞") 
            ZH_TW: ["按讚", "讚"], //className("android.widget.ImageView") desc("按讚")
            EN_US: ["Like", "Liked"], //className("android.widget.ImageView") desc("Like")
            EN_US_0: "Like" //className("android.widget.Button") desc("Like video. 3.2M likes")
        },

        TT_COMMENT_BUTTON: {
            ZH_CN: "阅读或添加评论",//className("android.widget.Button")  desc("阅读或添加评论。0 条评论")
            ZH_TW: "閱讀或新增評論", //className("android.widget.Button") desc("閱讀或新增評論。")
            EN_US: "Read or add comments" //className("android.widget.Button") desc("Read or add comments. 14K comments")
        },

        TT_SAVE_BUTTON: {
            ZH_CN: "将此视频添加到或移出收藏",//className("android.widget.Button") desc("将此视频添加到或移出收藏。")
            ZH_TW: "從「我的珍藏」新增或移除此影片", //className("android.widget.Button") desc("從「我的珍藏」新增或移除此影片。")
            EN_US: "Add or remove this video from Favorites" //className("android.widget.Button") desc("Add or remove this video from Favorites.")
        },

        TT_POST_BUTTON: {
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



var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';

// 需要取养号的视频总数
var total_target = 0;
// 成功取养号的视频数量
var total_success = 0;
// 错误信息
var fail_msg = "";

//任何开始和结束时间
var taskStartTime = "";
var taskEndTime = "";




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




//用户需要输入的评论内容
const TT_Watch_Count = "$${瀏覽數量}" //观看视频个数
const TT_commentFile = '$${T_留言內容}';
const TT_Like_Count = "$${點讚概率}" //点赞概率
const TT_Comment_Count = "$${留言概率}" //评论概率
const TT_Save_Count = "$${收藏概率}" //收藏概率


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
    console.hide();
    if(handleErrorFlag){
        taskLogError("-----------------脚本执行出现异常---------------");
        taskLogError("Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶---------------");
        taskLogError("脚本执行时间：" + new Date().toLocaleString());
    }else{
        taskLog("-----------------脚本功能执行结束：---------------");
        taskLog("Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶---------------");
        taskLog("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

// 第一次：注册完 exit 后立刻等无障碍连上，再跑后面所有逻辑（避免未就绪就调 auto.*）
auto.waitFor();

function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}

//打印日志
function taskLog(_log){
    toast(_log)
    console.log(getSystemDate("df") +":" +_log)
    console.log(_log)


    try {
        //确保目录存在
        files.ensureDir(RPAFilePath);
        
        //将日志写入文件
        var logContent = getSystemDate("df") + ":" + _log + "\n";
        // var logContent = _log + "\n";
        files.append(logFilePath, logContent);
        
    } catch(e) {
        console.error("写入日志文件失败：" + e);
    }
}


function taskLogError(_log){
    toast(_log);
    
    console.error(getSystemDate("df") +":" +_log)
    // console.error(_log)

    try {
        //确保目录存在
        files.ensureDir(RPAFilePath);
        
        //将日志写入文件
        var logContent = getSystemDate("df") + ":" + "【!!!ERROR!!!】" + _log + "\n";
        // var logContent = "【!!!ERROR!!!】" + _log + "\n";
        files.append(logFilePath, logContent);
        
    } catch(e) {
        console.error("写入日志文件失败：" + e);
    }
}

function handleError(e) {
    handleErrorFlag = true
    
    // 先记录错误信息，确保即使后续操作失败也能保存错误信息
    taskLogError("===错误报告开始===");
    fail_msg += "错误信息：" + e + "\n"; 
    taskLogError("错误信息：" + e);
    fail_msg += "错误堆栈：" + e.stack + "\n";
    taskLogError("错误堆栈：" + e.stack);
    fail_msg += "===错误报告结束===" + "\n";
    taskLogError("===错误报告结束===");
    fail_msg += "===错误报告结束===" + "\n";
    taskLog("脚本执行Error时间：" + new Date().toLocaleString());
    
    // 尝试强制停止应用，但即使失败也不影响错误信息的记录
    try {
        forceStop_APP(targetPackageName)
    } catch(forceStopError) {
        taskLogError("强制停止应用时发生错误：" + forceStopError);
        fail_msg += "强制停止应用时发生错误：" + forceStopError + "\n";
    }
}

//开始录屏截图到本地
function Nest_ScreenCapture(){
    taskLog("Nest_ScreenCapture 开始截图操作.");
    // 申请截图权限（会弹系统录屏权限框）
    if (!requestScreenCapture()) {
        taskLog("自动化任务-申请截图权限失败");
    }

    // 申请截图权限（会弹系统录屏权限框）
    if (!requestScreenCapture()) {
        taskLog("自动化任务-申请截图权限失败");
    }

    // 截一张整屏
    var img = captureScreen();           // 返回 Image 对象
    if (!img) {
        taskLog("自动化任务-截图失败");
    }

    // 保存到相册/文件夹
    // var dir = "/sdcard/Pictures";
    // files.ensureDir(dir);
    // var path = dir + "/nestshot_" + Date.now() + ".png";
    var path = RPAFilePath + "/nestshot_rpa.png";
    img.saveTo(path);                    // 保存
    img.recycle();                       // 回收内存
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


// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
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




function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
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



function clickByUiTextAndClassWithRetry(languageObject, classNameStr, maxRetries, delayMs, failMessage, matchMode) {
    maxRetries = maxRetries || 10;
    delayMs = delayMs || 1000;
    matchMode = matchMode || "fuzzy_half"; // fuzzy_half | exact | half_prefix | contains

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

    function hitAndClickOnNodes(nodes) {
        if (!nodes) return false;
        for (var n = 0; n < nodes.size(); n++) {
            var node = nodes.get(n);
            if (!node) continue;

            var t = "";
            var d = "";
            try { t = node.text() || ""; } catch (e1) {}
            try { d = node.desc() || ""; } catch (e2) {}

            for (var j = 0; j < targetTexts.length; j++) {
                var target = targetTexts[j];
                var textHit = isMatchedByMode(t, target);
                var descHit = isMatchedByMode(d, target);
                if (textHit || descHit) {
                    try {
                        if (node.click && node.click()) return true;
                    } catch (e3) {}
                    try {
                        var b = node.bounds();
                        click(b.centerX(), b.centerY());
                        return true;
                    } catch (e4) {}
                }
            }
        }
        return false;
    }

    for (var attempt = 1; attempt <= maxRetries; attempt++) {
        taskLog("开始第" + attempt + "次查找" + classNameStr + "并按UI_TEXT点击，匹配模式=" + matchMode + "...");
        var nodes = className(classNameStr).find();
        if (hitAndClickOnNodes(nodes)) {
            taskLog("命中并点击成功：" + classNameStr);
            return true;
        }
        if (attempt < maxRetries) sleep(delayMs);
    }

    taskLogError(failMessage || ("连续" + maxRetries + "次点击失败"));
    return false;
}

//点击点赞按钮
function click_Like_Btn(){
    taskLog("开始准备点赞视频");
    if (!clickByUiTextAndClassWithRetry(
        CONFIG.UI_TEXT.TT_LIKE_BUTTON,
        "android.widget.ImageView",
        3,
        1000,
        "点赞按钮点击失败",
        "exact"
    )) {
        // throw new Error("点赞按钮点击失败");
        taskLogError("点赞按钮点击失败");
    }
}


//点击收藏按钮
function click_Save_Btn(){
    taskLog("开始准备收藏视频");
    if (!clickByUiTextAndClassWithRetry(
        CONFIG.UI_TEXT.TT_SAVE_BUTTON,
        "android.widget.Button",
        3,
        1000,
        "收藏按钮点击失败",
        "contains"
    )) {
        // throw new Error("收藏按钮点击失败");
        taskLogError("收藏按钮点击失败");
    }
}



//点击Post评论按钮
function click_Post_Comment_Btn(){
    taskLog("开始准备Post评论按钮");
    if (!clickByUiTextAndClassWithRetry(
        CONFIG.UI_TEXT.TT_POST_BUTTON,
        "android.widget.Button",
        3,
        1000,
        "评论按钮点击失败",
        "exact"
    )) {
        // 如果没有通过文本命中发送按钮，则改为“以 EditText 为锚点，找其右侧同一行按钮”
        // 若计算出的坐标越界（如负数），则本轮直接跳过 Post，避免抛异常中断流程
        try {
            var editTexts = className("android.widget.EditText").find();
            taskLog("find_send_btn editTexts长度 = " + (editTexts ? editTexts.size() : 0));
            if (editTexts && editTexts.size() > 0) {
                var input = editTexts.get(editTexts.size() - 1);
                if (input) {
                    var inputBounds = input.bounds();
                    var allButtons = className("android.widget.Button").find();
                    taskLog("find_send_btn allButtons长度 = " + (allButtons ? allButtons.size() : 0));

                    var targetBtn = null;
                    var minDx = 999999;
                    if (allButtons && allButtons.size() > 0) {
                        for (var i = 0; i < allButtons.size(); i++) {
                            var btn = allButtons.get(i);
                            if (!btn) continue;
                            var b = btn.bounds();
                            var isRight = b.left >= inputBounds.right - 10;
                            var overlapY = !(b.bottom < inputBounds.top || b.top > inputBounds.bottom);
                            if (isRight && overlapY) {
                                var dx = b.left - inputBounds.right;
                                if (dx < minDx) {
                                    minDx = dx;
                                    targetBtn = btn;
                                }
                            }
                        }
                    }

                    if (targetBtn) {
                        var tb = targetBtn.bounds();
                        var tx = tb.centerX();
                        var ty = tb.centerY();
                        if (tx >= 0 && ty >= 0 && tx <= device.width && ty <= device.height) {
                            taskLog("find_send_btn 命中右侧按钮，点击坐标: " + tx + "," + ty);
                            click(tx, ty);
                        } else {
                            taskLog("find_send_btn 目标按钮坐标越界，跳过本次Post: " + tx + "," + ty);
                            return;
                        }
                    } else {
                        var x = parseInt(inputBounds.right + 45);
                        var y = parseInt((inputBounds.top + inputBounds.bottom) / 2);
                        if (x >= 0 && y >= 0 && x <= device.width && y <= device.height) {
                            taskLog("find_send_btn 未命中右侧Button，兜底点击坐标: " + x + "," + y);
                            click(x, y);
                        } else {
                            taskLog("find_send_btn 兜底坐标越界，跳过本次Post: " + x + "," + y);
                            return;
                        }
                    }
                }
            } else {
                taskLog("find_send_btn 未找到EditText，无法执行右侧定位");
            }
        } catch (e) {
            taskLog("find_send_btn 发送按钮定位异常，跳过本次Post: " + e);
            return;
        }
    }
}





//点击评论按钮
function click_Comment_Btn(commentText){
    taskLog("开始准备评论视频")
    if (!clickByUiTextAndClassWithRetry(
        CONFIG.UI_TEXT.TT_COMMENT_BUTTON,
        "android.widget.Button",
        3,
        1000,
        "评论按钮点击失败",
        "contains"
    )) {
        taskLog("评论按钮点击失败（>=50%匹配），直接返回");
    }
    

    sleep(5000)
    var autoCompleteTextViews = className("android.widget.EditText").find();
    taskLog("autoCompleteTextViews长度 = " + autoCompleteTextViews.size())

    //如果某个tiktok视频，0评论，自己是首评，那么界面会有两个"android.widget.EditText"
    if(autoCompleteTextViews.size() >0){
        var textView = autoCompleteTextViews.get(autoCompleteTextViews.size() - 1);
        if(textView) {
            taskLog("找到TextView控件-Text："+ textView.text());
            sleep(3000)
            taskLog("评论控件，设置内容：" +commentText );
            textView.setText(commentText)
            sleep(5000)
    
            click_Post_Comment_Btn()

            sleep(random(2000, 3000))
            back()
            sleep(random(2000, 3000))
            
            click_Post_Comment_Btn()
            sleep(random(2000, 3000))


            Nest_ScreenCapture()
            sleep(random(2000, 3000))
    
            var clickX = device.width  - 100 ; 
            var clickY = device.width /4; 
            taskLog("开始准备点击屏幕 clickX = " + clickX)
            taskLog("开始准备点击屏幕 clickY = " + clickY)
            click(clickX, clickY);
                
                
        }
    }else{
        //页面没有评论按钮，直接返回
        taskLog("页面没有评论按钮，直接返回")
        back()
        sleep(random(2000, 3000))
    }
   
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
    saveImg()

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

// 通过语言对象查找文本或描述（desc）
function findTextOrDescByLanguages(languageObject) {
    for (var lang in languageObject) {
        var targetText = languageObject[lang];
        var candidates = Array.isArray(targetText) ? targetText : [targetText];

        for (var i = 0; i < candidates.length; i++) {
            var item = candidates[i];

            if (text(item).exists()) {
                taskLog("通过 text 找到目标：" + item);
                var textElement = text(item).findOne();
                if (textElement && textElement.clickable()) {
                    textElement.click();
                    return true;
                } else if (textElement) {
                    var textBounds = textElement.bounds();
                    click(textBounds.centerX(), textBounds.centerY());
                    return true;
                }
            }

            if (desc(item).exists()) {
                taskLog("通过 desc 找到目标：" + item);
                var descElement = desc(item).findOne();
                if (descElement && descElement.clickable()) {
                    descElement.click();
                    return true;
                } else if (descElement) {
                    var descBounds = descElement.bounds();
                    click(descBounds.centerX(), descBounds.centerY());
                    return true;
                }
            }
        }
    }
    taskLog("未通过 text/desc 找到任何匹配的目标");
    return false;
}

function findTextOrDescByLanguagesWithRetry(languageObject, maxRetries, delayMs, failMessage) {
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
        taskLog("开始第" + attempt + "次检测 text/desc 目标...");
        if (findTextOrDescByLanguages(languageObject)) {
            taskLog("第" + attempt + "次 text/desc 检测成功");
            return true;
        }
        if (attempt < maxRetries) {
            taskLog("第" + attempt + "次 text/desc 检测失败，等待" + delayMs + "毫秒后重试");
            sleep(delayMs);
        }
    }
    taskLogError(failMessage || ("连续" + maxRetries + "次 text/desc 检测失败"));
    return false;
}




//从评论数组中，顺序挑选一条内容
function get_all_TT_comment_text(){
    let comments = [];
    // 户是否存在
    taskLog("TT评论数组 =  " + TT_commentFile)
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
    
    return comments
}



try {

    if(TT_Watch_Count <=0){
        throw new Error("TT_Watch_Count 不能小于等于0");
    }else{
        taskLog("需要观看的视频总数： = " + TT_Watch_Count);
        total_target = TT_Watch_Count;
    }



    sleep(3000)
    taskLog("准备检查TikTok是否已安装...")

    if (isAppInstalled(GLOBAL_TikTokPackageName)) {
        targetPackageName = GLOBAL_TikTokPackageName;
        targetClassName = "com.ss.android.ugc.aweme.main.MainActivity";
        taskLog("检测到已安装全球版TikTok，准备启动...");

        forceStop_APP(GLOBAL_TikTokPackageName)
        sleep(3000)

    } else if (isAppInstalled(ASIA_TikTokPackageName)) {
        targetPackageName = ASIA_TikTokPackageName;
        targetClassName = "com.ss.android.ugc.aweme.main.MainActivity";
        taskLog("检测到已安装亚洲版TikTok，准备启动...");

        forceStop_APP(ASIA_TikTokPackageName)
        sleep(3000)

    } else {
        toast("未检测到TikTok已安装，请先安装TikTok！");
        taskLog("未检测到TikTok已安装，脚本终止。");
        throw new Error("未检测到TikTok安装，脚本终止。");
        
    }

    // 第二次：强杀 TikTok、切前台等可能让无障碍短暂断连，启动 App 与截图前再等一次（已连接则立刻返回）
    sleep(1000);
    auto.waitFor();
    taskLog("无障碍已就绪，准备启动 TikTok");

    app.startActivity({
        action: "android.intent.action.VIEW",
        packageName: targetPackageName,
        className: targetClassName
    });

    Nest_ScreenCapture() //启动截图 ，保证有一个Notification通知栏
    auto.waitFor(); //等待无障碍连接



    taskStartTime = new Date().getTime();
    taskLog("任务开始时间：" + taskStartTime);
    
    var all_TT_comment_text = []

    if(TT_commentFile && 
        TT_commentFile.trim() !== "" && 
        TT_commentFile.trim().toLowerCase() !== "off" && 
        !TT_commentFile.includes("$${")){
            all_TT_comment_text = get_all_TT_comment_text()
        }

    if(all_TT_comment_text.includes("$${T")){ 
        throw_error_storage_not_enough()
    }    
    
    // 输出结果，用于调试
    if(all_TT_comment_text.length > 0){
        taskLog("评论文案数量 = " + all_TT_comment_text.length);
    }else{
        taskLog("没有找到评论文案，所以将只会执行点赞")
    }




    //开始观看
    var count = 0;
    do {
        // 将 count 加 1
        taskLog("开始观看第"+count+"个TikTok视频")
        count++;
        
        Nest_ScreenCapture()
        sleep(random(10000, 15000))
        total_success++

        if (Math.random() * 100 < TT_Like_Count)  {
            taskLog("开始触发点赞概率")
            click_Like_Btn()
            sleep(random(3000, 5000))
        }
        if (Math.random() * 100 < TT_Save_Count)  {
            taskLog("开始触发保存视频概率")
            click_Save_Btn()
            sleep(random(3000, 5000))
        }else{
            taskLog("本次不触发保存视频概率")
        }
        if (Math.random() * 100 < TT_Comment_Count)  {
            taskLog("开始触发评论视频概率")
            taskLog("评论文案的总个数："+all_TT_comment_text.length)
            if (all_TT_comment_text.length > 0) {

                taskLog("- 找到可用评论文案, 开始评论 - ");
                var randIdx = random(0, all_TT_comment_text.length - 1)
                taskLog("评论文案的下标randIdx："+randIdx)
                var commentText = all_TT_comment_text[randIdx];
                taskLog("随机评论文案 :" + commentText);
                click_Comment_Btn(commentText)
                sleep(random(5000, 8000))
            }else{
                taskLog(`- 没有可用评论文案, 忽略 - `);
            }
        }


        // 获取设备屏幕的宽高
        var width = device.width;
        var height = device.height;

        // 生成随机起始点
        var startX = random(width / 3 , width * 2 / 3);
        var startY = random(height * 2 / 3, height * 3 / 4);

        // 生成随机结束点
        var endX = random(width / 3 , width * 2 / 3);
        var endY = random(height * 1 / 3, height * 1 / 4);

        // 屏幕上滑操作
        swipe(startX, startY, endX, endY, 500);
        taskLog("开始滑动位置，x = "+startX+"；y = " + startY)
        taskLog("结束滑动位置，x = "+endX+"；y = " + endY)



    } while (count < TT_Watch_Count); // 当 count 小于 TT_Watch_Count 时继续循环


} catch(e) {
    if (e.message === "TASK_COMPLETED") {
        taskLog("任务正常完成");
    } else {
        handleError(e);
    }
}finally{
    taskLog("保存统计结果到备用路径..." );
    
    taskEndTime = new Date().getTime();
    taskLog("任务结束时间：" + taskEndTime);
    taskLog("任务执行时间：" + (taskEndTime - taskStartTime) + "毫秒");


    try {
        var result = {
            total_target: total_target,
            total_success: total_success,
            fail_msg: fail_msg,
            taskStartTime: taskStartTime,
            taskEndTime: taskEndTime
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
    sleep(random(3000, 5000));
    openLogActivity()
    stopAccessibilityMonitor();
}