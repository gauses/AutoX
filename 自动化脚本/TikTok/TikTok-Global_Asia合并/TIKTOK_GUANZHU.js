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



//******************************************************************
//***********************Tiktok关注(根据关注列表UID的顺序，去关注用戶)*************************
//******************************************************************

// 上传字段：
// total_target 需要关注的总数
// total_success 成功关注的数量


//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的关注用户ID列表
const TT_Like_User_ID_GROUP = '$${T_用户ID列表}';

// 需要关注的总数
var total_target = 0;
// 成功关注的数量
var total_success = 0;
// 错误信息
var fail_msg = "";


var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';

//定义Follow按钮在不同语言下的文本
const FOLLOW_TEXT = {
    ZH_CN: "关注",    // 简体中文
    ZH_TW: "關注",    // 繁体中文
    EN_US: "Follow"   // 英文
};

const FORCE_STOP_TEXT = {
    ZH_CN: "强行停止",    // 简体中文
    ZH_TW: "強制停止",    // 繁体中文
    EN_US: "FORCE STOP"   // 英文
};

// 定义确认按钮文本
const FORCE_STOP_CONFIRM_TEXT = {
    ZH_CN: "确定",      // 简体中文
    ZH_TW: "確定",      // 繁体中文
    EN_US: "OK"         // 英文
};

//用户Tab按钮在不同语言下的文本
const USERS_TEXT = {
    ZH_CN: "用户",    // 简体中文
    ZH_TW: "使用者",    // 繁体中文
    EN_US: "Users"   // 英文
};

//定义Following列表的TextView在不同语言下的文本
const FOLLOWING_LIST_TEXT = {
    ZH_CN: "已关注",    // 简体中文
    ZH_TW: "關注中",    // 繁体中文
    EN_US: "Following"   // 英文
};


const TT_SEARCH_BUTTON = {
    ZH_CN: "搜索",//className("android.widget.Button") 
    ZH_TW: "搜尋", //className("android.widget.Button") text("搜尋")
    EN_US: "Search" //className("android.widget.Button") text("Search")
};

const TT_GUANZHU_BUTTON = {
    ZH_CN: "关注",//className("android.widget.Button") 
    ZH_TW: "關注", //className("android.widget.Button") text("關注")
    EN_US: "Follow" //className("android.widget.Button") 
}

// 第二页搜索入口限定控件类型：如 "android.widget.Button"、"android.widget.ImageView"；
// 设为空字符串、null 或未传参则不对 className 过滤（仅按 text/desc 匹配）。
var TT_SEARCH_WIDGET_BUTTON_CLASS = "android.widget.Button";

// 通过语言对象查找文本
function findTextByLanguages(languageObject) {
    for (let lang in languageObject) {
        let targetText = languageObject[lang];
        if (text(targetText).exists()) {
            taskLog("找到文本：" + targetText);
            let element = text(targetText).findOne();
            if (element && element.clickable()) {
                element.click();
                return true;
            } else if (element) {
                // 如果元素存在但不可点击，尝试点击其坐标
                let bounds = element.bounds();
                click(bounds.centerX(), bounds.centerY());
                return true;
            }
        }
    }
    taskLog("未找到任何匹配的文本");
    return false;
}


/** @param widgetClassName 可选，非空时与 text/desc 组合为 className(widget).text(item) */
function resolveTextSelector(item, widgetClassName) {
    if (widgetClassName) {
        return className(widgetClassName).text(item);
    }
    return text(item);
}

/** @param widgetClassName 可选，非空时与 desc 组合为 className(widget).desc(item) */
function resolveDescSelector(item, widgetClassName) {
    if (widgetClassName) {
        return className(widgetClassName).desc(item);
    }
    return desc(item);
}

// 通过语言对象查找文本或描述（desc）
// widgetClassName：可选，见 TT_SEARCH_WIDGET_BUTTON_CLASS 说明
function findTextOrDescByLanguages(languageObject, widgetClassName) {
    for (var lang in languageObject) {
        var targetText = languageObject[lang];
        var candidates = Array.isArray(targetText) ? targetText : [targetText];

        for (var i = 0; i < candidates.length; i++) {
            var item = candidates[i];

            var textSel = resolveTextSelector(item, widgetClassName);
            if (textSel.exists()) {
                taskLog("通过 text 检测到存在：" + item);
                var textElement = textSel.findOne();
                if (!textElement) {
                    taskLog("警告：text(\"" + item + "\") exists 为真但 findOne() 为 null，将再试 desc");
                } else {
                    var tb = textElement.bounds();
                    taskLog("text 节点 clickable=" + textElement.clickable() + " id=" + textElement.id()
                        + " bounds=" + tb.left + "," + tb.top + "," + tb.right + "," + tb.bottom);
                    // TikTok 上常出现 clickable=true 但 Accessibility click() 返回 false，优先用坐标更稳
                    if (tb.width() > 0 && tb.height() > 0) {
                        click(tb.centerX(), tb.centerY());
                        taskLog("text 优先坐标点击 center=(" + tb.centerX() + "," + tb.centerY() + ")");
                        return true;
                    }
                    if (textElement.clickable()) {
                        var textClickOk = textElement.click();
                        taskLog("text 无障碍 click()（bounds 无效时兜底）返回：" + textClickOk);
                        if (textClickOk) {
                            return true;
                        }
                        taskLog("text 无障碍点击未生效，将再试 desc");
                    } else {
                        taskLog("text 节点 bounds 无效且不可点击，将再试 desc");
                    }
                }
            }

            var descSel = resolveDescSelector(item, widgetClassName);
            if (descSel.exists()) {
                taskLog("通过 desc 检测到存在：" + item);
                var descElement = descSel.findOne();
                if (!descElement) {
                    taskLog("警告：desc(\"" + item + "\") exists 为真但 findOne() 为 null，跳过该候选");
                } else {
                    var db = descElement.bounds();
                    taskLog("desc 节点 clickable=" + descElement.clickable() + " id=" + descElement.id()
                        + " bounds=" + db.left + "," + db.top + "," + db.right + "," + db.bottom);
                    if (db.width() > 0 && db.height() > 0) {
                        click(db.centerX(), db.centerY());
                        taskLog("desc 优先坐标点击 center=(" + db.centerX() + "," + db.centerY() + ")");
                        return true;
                    }
                    if (descElement.clickable()) {
                        var descClickOk = descElement.click();
                        taskLog("desc 无障碍 click()（bounds 无效时兜底）返回：" + descClickOk);
                        if (descClickOk) {
                            return true;
                        }
                        taskLog("desc 无障碍点击未生效");
                    } else {
                        taskLog("desc 节点 bounds 无效且不可点击");
                    }
                }
            }
        }
    }
    taskLog("未通过 text/desc 找到任何匹配的目标");
    return false;
}

// widgetClassName：可选，见 TT_SEARCH_WIDGET_BUTTON_CLASS；不传则与 findTextOrDescByLanguages 第二参一致用法
function findTextOrDescByLanguagesWithRetry(languageObject, maxRetries, delayMs, failMessage, widgetClassName) {
    if (widgetClassName) {
        taskLog("text/desc 匹配已限定 className=" + widgetClassName);
    } else {
        taskLog("text/desc 匹配未限定控件类型（仅按文案）");
    }
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
        taskLog("开始第" + attempt + "次检测 text/desc 目标...");
        if (findTextOrDescByLanguages(languageObject, widgetClassName)) {
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



//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

// 会在无障碍服务实例真正就绪后继续运行，避免开关已开但服务未绑定时报错。


//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
// 注册退出事件监听器
events.on('exit', function(){
    console.hide()
    sleep(1000)

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

//打开Autojs的Log activity
function openLogActivity() {
    var intent = {
        action: "android.intent.action.MAIN",
        packageName: "org.autojs.autoxjs",
        className: "org.autojs.autojs.ui.log.LogActivityKt"
    };
    app.startActivity(intent);
}
function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}


function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(targetPackageName)
    taskLogError("===错误报告开始===");
    fail_msg += "错误信息：" + e + "\n"; 
    taskLogError("错误信息：" + e);
    fail_msg += "错误堆栈：" + e.stack + "\n";
    taskLogError("错误堆栈：" + e.stack);
    fail_msg += "===错误报告结束===" + "\n";
    taskLogError("===错误报告结束===");
    fail_msg += "===错误报告结束===" + "\n";
    taskLog("脚本执行Error时间：" + new Date().toLocaleString());
}





//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
//  console.show()


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
taskLog("准备启动TikTok...")

var targetPackageName = null;
var targetClassName = null;

function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}

if (isAppInstalled(GLOBAL_TikTokPackageName)) {
    targetPackageName = GLOBAL_TikTokPackageName;
    targetClassName = "com.ss.android.ugc.aweme.main.MainActivity";
    taskLog("检测到已安装全球版TikTok，准备启动...");
} else if (isAppInstalled(ASIA_TikTokPackageName)) {
    targetPackageName = ASIA_TikTokPackageName;
    targetClassName = "com.ss.android.ugc.aweme.main.MainActivity";
    taskLog("检测到已安装亚洲版TikTok，准备启动...");
} else {
    toast("未检测到TikTok已安装，请先安装TikTok！");
    taskLog("未检测到TikTok已安装，脚本终止。");
    throw new Error("未检测到TikTok未安装，请先安装TikTok！");
}

forceStop_APP(targetPackageName)
sleep(3000)

app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});


sleep(random(3000, 5000))

// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
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



/**
 * 在屏幕「上方条带」内找 ImageView，取水平方向最靠右的一个，作为首页搜索（放大镜）。
 * 不依赖 resource id（版本间 id 会变）。
 * @param topRatio 视为「顶部栏」的屏幕高度比例，默认 0.22
 * @param minRightRatio 中心点至少在此比例右侧，避免点到左侧 Tab 图标，默认 0.72
 */
function findHomeTopRightSearchImageView(topRatio, minRightRatio) {
    topRatio = topRatio == null ? 0.22 : topRatio;
    minRightRatio = minRightRatio == null ? 0.72 : minRightRatio;
    var w = device.width;
    var h = device.height;
    var allImages = className("android.widget.ImageView").find();
    if (!allImages || allImages.size() === 0) return null;

    var best = null;
    var bestCx = -1;
    for (var i = 0; i < allImages.size(); i++) {
        var img = allImages.get(i);
        if (!img) continue;
        var b = null;
        try {
            b = img.bounds();
        } catch (e) {
            continue;
        }
        if (b.left >= b.right || b.top >= b.bottom) continue;
        var bw = b.right - b.left;
        var bh = b.bottom - b.top;
        if (bw < 8 || bh < 8 || bw > w * 0.5) continue;

        // 须在屏幕可见且位于上方区域（状态栏 + 顶栏 + Tab）
        if (b.top > h * topRatio) continue;
        var cx = (b.left + b.right) / 2;
        if (cx < w * minRightRatio) continue;

        if (cx > bestCx) {
            bestCx = cx;
            best = img;
        }
    }
    if (best) {
        try {
            var bb = best.bounds();
            taskLog(
                "findHomeTopRightSearchImageView 选中 center=(" +
                    (bb.left + bb.right) / 2 +
                    "," +
                    (bb.top + bb.bottom) / 2 +
                    ") bounds=[" +
                    bb.left +
                    "," +
                    bb.top +
                    "," +
                    bb.right +
                    "," +
                    bb.bottom +
                    "]"
            );
        } catch (e2) {}
    }
    return best;
}

//点击首页的右上角Search按钮（不按 id，按「顶部 + 最右」ImageView）
function click_home_search_btn() {
    var maxAttempts = 6;
    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
        if (attempt > 1) {
            taskLog("首页寻找搜索按钮 第" + attempt + "次重试");
        }
        sleep(random(2000, 5000));

        var target = findHomeTopRightSearchImageView();
        if (target) {
            taskLog("准备点击首页搜索 ImageView（顶部最右）");
            var bounds = null;
            try {
                bounds = target.bounds();
            } catch (eb) {}
            if (bounds) {
                try {
                    click(bounds.centerX(), bounds.centerY());
                    sleep(200);
                    return;
                } catch (e1) {}
                try {
                    if (target.clickable && target.clickable() && target.click()) return;
                } catch (e2) {}
            }
        }

        taskLog("未定位到顶部右侧搜索 ImageView，上滑后再试");
        swipe_to_up();
        sleep(random(2000, 5000));
    }
    taskLogError("首页寻找搜索按钮超过 " + maxAttempts + " 次");
    throw new Error("首页寻找搜索按钮超过 " + maxAttempts + " 次");
}



//屏幕上滑
function swipe_to_up(){
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

}

//点击第二页的右上角Search按钮
function click_Second_search_btn(){

    sleep(random(2000, 5000))
    // 点击发布按钮：通过底部导航结构查找 TikTok 底部中间的 Button
    if (!findTextOrDescByLanguagesWithRetry(TT_SEARCH_BUTTON,
        10,
        5000,
        "未找到 TikTok 第二页的右上角Search按钮",
        TT_SEARCH_WIDGET_BUTTON_CLASS)) {
        throw new Error("未找到 TikTok 第二页的右上角Search按钮");
    }
}


// 输入需要关注的用户ID之后，在用户列表 RecyclerView 内点击第一个「關注」等 Button
function click_LinearLayout_GUANZHU() {
    sleep(random(2000, 5000));
    var rv = className("androidx.recyclerview.widget.RecyclerView").findOne(8000);
    if (!rv) {
        taskLog("未找到用户列表 RecyclerView");
        sleep(random(2000, 5000));
        return;
    }
    var buttons = rv.find(className("android.widget.Button"));
    if (!buttons || buttons.size() === 0) {
        throw new Error("用户列表 RecyclerView没有找到任何Button");
    }
    var n = buttons.size();
    var tryCount = Math.min(3, n);
    taskLog("用户列表 RecyclerView 内共 " + n + " 个 Button，最多依次尝试前 " + tryCount + " 个");
    for (var idx = 0; idx < tryCount; idx++) {
        var btn = buttons.get(idx);
        var k = idx + 1;
        try {
            if (btn.clickable() && btn.click()) {
                taskLog("已点击第 " + k + " 个 Button（无障碍）");
                sleep(random(2000, 5000));
                return;
            }
            var b = btn.bounds();
            click(b.centerX(), b.centerY());
            taskLog("已点击第 " + k + " 个 Button（坐标）");
            sleep(random(2000, 5000));
            return;
        } catch (e) {
            taskLog("点击第 " + k + " 个 Button 异常: " + e);
        }
    }
    throw new Error("用户列表 RecyclerView 内前 " + tryCount + " 个 Button 均点击失败（含异常或无可点击项）");
}


//点击屏幕左上方
function click_left_top_screen(){
    // 获取屏幕宽度和高度
    var width = device.width;
    var height = device.height;

    // 定义左上角区域的边界
    var left = 200;
    var top = 200;
    var right = width / 2; // 左上区域的右边界
    var bottom = height / 2; // 左上区域的下边界

    // 生成随机坐标
    var randomX = Math.random() * (right - left) + left; // 随机 x 坐标
    var randomY = Math.random() * (bottom - top) + top; // 随机 y 坐标

    // 点击随机坐标
    click(randomX, randomY);


}




function clickId(a) {
    taskLog("开始点击元素ID ：" + a);

    let obj_ID = id(a).boundsInside(5, 5, device.width - 5, device.height - 5);
    
    // 检查是否找到元素
    let elements = obj_ID.find();
    if (elements.empty()) {
        taskLog("没有找到元素ID ：" + a);
        return false;
    }
    
    // 获取第一个匹配的元素
    let element = elements.get(0);
    let X = element.bounds().centerX();
    let Y = element.bounds().centerY();
    
    // 验证 X 和 Y 是否为正数
    if (X < 0 || Y < 0) {
        taskLog("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
        return false;
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
    Deviation = random(-5, 5), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
}

function clickDesc(a) {
    for (obj_Desc = desc(a).boundsInside(5, 5, device.width-5, device.height-5); obj_Desc.find().empty(); ) sleep(1e3);
    X = obj_Desc.find().get(0).bounds().centerX(), Y = obj_Desc.find().get(0).bounds().centerY(),
    Deviation = random(-5, 5), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
}

//========================================================================================================================


//结束当前任务
function stopCurrentTask(){

    sleep(3000)
//    //将task的截图上报
//    var res = http.postMultipart(url, {
//        taskId: "xxxxxxxxxxx",
//        file: open("/sdcard/Download/" + taskLogImgName)
//    });
//    log(res.body.string());

    console.hide()

}




try{
    
    taskLog("打开TikTok成功，首页会停留10-15秒...")
    sleep(random(10000, 15000))


    // 用于存储评论的数组
    let comments = [];
    // 检查文件是否存在
    toast("关注列表地址 =  " + TT_Like_User_ID_GROUP)
    const file = new java.io.File(TT_Like_User_ID_GROUP);
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
        comments.push(TT_Like_User_ID_GROUP);
    }

    if(comments.includes("$${T")){ 
        throw_error_storage_not_enough()
    }

    // 如果TT_Like_User_ID_GROUP等于'off'，则清空用户USER_ID列表
    if (TT_Like_User_ID_GROUP.trim().toLowerCase() == 'off') {
        comments = [];
    }

    taskLog("可用的搜索用户ID, 一共的数量有： " + comments.length);
    // 设置需要关注的总数
    total_target = comments.length;

    taskLog("开始点击首页搜索按钮")
    click_home_search_btn()
    sleep(random(2000, 4000))

    // 按照顺序开始执行搜索User-ID
    toast("- 找到可用的搜索用户ID, 一共的数量有： " + comments.length);
    if (comments.length > 0) {
        taskLog("- 找到可用的搜索用户ID, 开始搜索观看 - ");
        for (var randIdx = 0; randIdx < comments.length; randIdx++) {
            var commentText = comments[randIdx];
            taskLog("- 找到可用的搜索用户ID: "+commentText+", 开始搜索 - ");
            taskLog("开始准备点击首页搜索按钮")


            var search_edits = className("android.widget.EditText").find();
            for(var i = 0; i < search_edits.size(); i++) {
                var search_edit = search_edits.get(i);
                if(search_edit) {
                    taskLog("找到TextView控件-Text："+ search_edit.text());
                    sleep(1000)
                    taskLog("搜索控件，设置内容：" +commentText );
                    search_edit.setText(commentText)    
                    sleep(random(5000, 8000))
                    
                    taskLog("开始点击Search按钮")
                    click_Second_search_btn()



                    //开始观看视频
                    sleep(random(5000, 8000))
                    toast("开始点击用户Tab按钮")
                    findTextByLanguages(USERS_TEXT)

                    sleep(random(3000, 5000))

                    if (!findTextOrDescByLanguagesWithRetry(TT_GUANZHU_BUTTON,
                        10,
                        5000,
                        "未找到 TikTok 关注按钮，开始进行下一个用户的关注行为！！！",
                        TT_SEARCH_WIDGET_BUTTON_CLASS)) {
                    }

                    sleep(random(8000, 10000))
                    back()
                    sleep(random(2000, 4000))  

                }
            }


        }
        
    }else{
        Nest_ScreenCapture()
        sleep(random(3000, 5000))
        toast("- 没有可用的搜索用户ID, 忽略 - ");
        throw new Error("没有可用的搜索用户ID，无法关注，所以报错")
    }

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
