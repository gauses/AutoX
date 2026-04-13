// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok首页搜索养号*************************
// mx-phone-2  - drewryapilado@gmail.com
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

// 你的主脚本逻辑开始
log("主逻辑运行中...");



// 需要搜索的关键字数量
var total_target = 0;
// 成功搜索的关键字数量
var total_success = 0;
// 错误信息
var fail_msg = "";  


var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';


//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的评论内容
const TT_searchFile = '$${T_搜尋關鍵字}';
const TT_Watch_Count = "$${視頻瀏覽數量}" //观看视频个数


const TT_commentFile = '$${T_評論內容}';
const TT_Like_Count = "$${點讚概率}" //点赞概率
const TT_Save_Count = "$${收藏概率}" //收藏概率
const TT_Comment_Count = "$${評論概率}" //评论概率


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
            //desc("閱讀或新增評論。32 則評論")
            ZH_TW: "閱讀或新增評論", //className("android.widget.Button") desc("閱讀或新增評論。")
            // 英文版 desc 常为 "Read or add comments. 0 comments" —— 多给几条便于 contains 命中；部分机型评论入口是 ImageView
            EN_US: [
                "Read or add comments",
                "Read or add comment"
            ]
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



// 第二页搜索入口限定控件类型：如 "android.widget.Button"、"android.widget.ImageView"；
// 设为空字符串、null 或未传参则不对 className 过滤（仅按 text/desc 匹配）。
var TT_SEARCH_WIDGET_BUTTON_CLASS = "android.widget.Button";



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


//find_textview_text_base("影片","Videos","视频")
const VIDEO_TEXT = {
    ZH_CN: "影片",    // 简体中文
    ZH_TW: "视频",    // 繁体中文
    EN_US: "Videos"   // 英文
};



const TT_SEARCH_BUTTON = {
    ZH_CN: "搜索",//className("android.widget.Button") 
    ZH_TW: "搜尋", //className("android.widget.Button") text("搜尋")
    EN_US: "Search" //className("android.widget.Button") text("Search")
};

// 通过语言对象查找文本
function findTextByLanguages(languageObject) {
    for (let lang in languageObject) {
        let targetText = languageObject[lang];
        // 如果targetText是数组，遍历数组中的每个文本
        if (Array.isArray(targetText)) {
            for (let text_item of targetText) {
                if (text(text_item).exists()) {
                    taskLog("找到文本：" + text_item);
                    let element = text(text_item).findOne();
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
        } else {
            // 原来的单个文本处理逻辑
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


// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
}




//开始录屏截图到本地
function Nest_ScreenCapture(){
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
    var path = RPAFilePath + "/nestshot_rpa.png" ;
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



//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();

//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

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


// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
}



sleep(3000)
taskLog("准备检查TikTok是否已安装...")



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


    sleep(random(3000, 5000))
    taskLog("准备启动全球版TikTok...");
    app.startActivity({
        action: "android.intent.action.VIEW",
        packageName: GLOBAL_TikTokPackageName,
        className: "com.ss.android.ugc.aweme.main.MainActivity"
    });


    sleep(random(5000, 8000))

    forceStop_APP(GLOBAL_TikTokPackageName)
    sleep(3000)

} else if (isAppInstalled(ASIA_TikTokPackageName)) {
    targetPackageName = ASIA_TikTokPackageName;
    targetClassName = "com.ss.android.ugc.aweme.main.MainActivity";
    taskLog("检测到已安装亚洲版TikTok，准备启动...");

    sleep(random(3000, 5000))
    taskLog("准备启动亚洲版TikTok...");
    app.startActivity({
        action: "android.intent.action.VIEW",
        packageName: ASIA_TikTokPackageName,
        className: "com.ss.android.ugc.aweme.main.MainActivity"
    });


    sleep(random(5000, 8000))
    forceStop_APP(ASIA_TikTokPackageName)
    sleep(3000)

} else {
    taskLog("未检测到TikTok已安装，脚本终止。");
    throw new Error("未检测到TikTok安装，请先安装TikTok！"); 
}


app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});


sleep(random(3000, 5000))



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


// 原「左上角随机点」：改为找 GridView 内第一个 Button，点击其中心（如搜索页标签/筛选项区域）
function click_left_top_screen() {
    sleep(random(2000, 5000));
    var grid = className("android.widget.GridView").findOne(8000);
    if (!grid) {
        throw new Error("TikTok搜索关键词之后，影片页面未找到 android.widget.GridView");
    }
    var buttons = grid.find(className("android.widget.Button"));
    if (!buttons || buttons.size() === 0) {
        throw new Error("TikTok搜索关键词之后，影片GridView页面未找到Button");
    }
    var targetBtn = null;
    var targetIdx = -1;
    for (var i = 0; i < buttons.size(); i++) {
        var btn = buttons.get(i);
        if (!btn) {
            continue;
        }
        var b = btn.bounds();
        if (b.width() > 0 && b.height() > 0) {
            targetBtn = btn;
            targetIdx = i;
            break;
        }
        taskLog("GridView 内第 " + (i + 1) + " 个 Button bounds 无效，尝试下一个");
    }
    if (!targetBtn) {
        throw new Error("GridView 内所有 Button 的 bounds 均无效");
    }
    var bb = targetBtn.bounds();
    click(bb.centerX(), bb.centerY());
    taskLog("已点击 GridView 内第 " + (targetIdx + 1) + " 个 Button 中心 (" + bb.centerX() + "," + bb.centerY() + ")");
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





/**
 * 新版 TikTok 评论入口 desc 常为 "Read or add comments. 0 comments"；用 descContains 兜底。
 */
function tryClickTikTokCommentByDesc() {
    var patterns = [
        "Read or add comments",
        "Read or add comment",
        "阅读或添加评论",
        "閱讀或新增評論"
    ];
    var threshold = device.width * 0.55;
    for (var i = 0; i < patterns.length; i++) {
        try {
            var nodes = descContains(patterns[i]).clickable(true).find();
            if (!nodes || nodes.size() === 0) continue;

            var bestNode = null;
            var bestCx = -1;
            for (var j = 0; j < nodes.size(); j++) {
                var node = nodes.get(j);
                if (!node) continue;
                var b = node.bounds();
                if (b.left >= b.right || b.top >= b.bottom) continue;
                var cx = (b.left + b.right) / 2;
                if (cx > threshold) {
                    if (cx > bestCx) {
                        bestCx = cx;
                        bestNode = node;
                    }
                }
            }
            if (bestNode) {
                var bb = bestNode.bounds();
                try {
                    click(bb.centerX(), bb.centerY());
                    sleep(200);
                    taskLog("tryClickTikTokCommentByDesc 优先坐标点击: " + patterns[i] + " center=" + bb.centerX() + "," + bb.centerY());
                    return true;
                } catch (eTap) {}
                try {
                    bestNode.click();
                    taskLog("tryClickTikTokCommentByDesc 坐标失败改用 click: " + patterns[i]);
                    return true;
                } catch (e2) {}
            }
            taskLog("tryClickTikTokCommentByDesc pattern=" + patterns[i] + " 有节点但无 centerX>" + threshold + " 的候选");
        } catch (e) {
            taskLog("tryClickTikTokCommentByDesc 异常: " + e);
        }
    }
    return false;
}

//点击评论按钮
function click_Comment_Btn(commentText){
    taskLog("开始准备评论视频")
    var commentOpened = clickByUiTextAndClassWithRetry(
        CONFIG.UI_TEXT.TT_COMMENT_BUTTON,
        "android.widget.Button",
        3,
        1000,
        "评论按钮点击失败",
        "contains",
        true
    );
    if (!commentOpened) {
        taskLog("Button 文本匹配失败，尝试 descContains 兜底...");
        commentOpened = tryClickTikTokCommentByDesc();
    }
    if (!commentOpened) {
        taskLog("评论按钮点击失败（>=50%匹配），直接返回");
        return;
    }

    sleep(10000)
    var autoCompleteTextViews = classNameContains("EditText").find();
    taskLog("EditText(含子类) 长度 = " + autoCompleteTextViews.size())

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





    //点击发送按钮
    function find_send_btn() {
        var allButtons = className("android.widget.Button").find();
        if (allButtons && allButtons.size() > 0) {
            // for (var i = 0; i < allButtons.size(); i++) {
            //     var button = allButtons.get(i);
            //     if (button) {
            //         taskLog("找到button控件-Text：" + button.text() + ";ID = " + button.id());
            //     }
            // }
            
            // 获取最后一个按钮
            var lastButton = allButtons.get(allButtons.size() - 1);
            if (lastButton) {
                // bounds()是一个方法,需要先调用它
                var bounds = lastButton.bounds();
                click(bounds.centerX(), bounds.centerY());
            }
        }
    }



    //获取评论列表
    function get_all_comments(){
        // 用于存储用户的数组
        let comments = [];
        // 户是否存在
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


        //获取关键字列表
        function get_all_keyword(){
            // 用于存储用户的数组
            let comments = [];
            // 户是否存在
            const file = new java.io.File(TT_searchFile);
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
                comments.push(TT_searchFile);
            }
            
            return comments
        }



//开始观看视频
function watch_TT_video(comments){

    total_target  = TT_Watch_Count;

    //开始观看
    var count = 1;
    do {
        // 将 count 加 1
        taskLog("开始观看第"+count+"个TikTok视频")
        count++;


        sleep(random(10000, 25000))

        if (Math.random() * 100 < TT_Like_Count)  {
            taskLog("开始触发点赞概率")
            click_Like_Btn()
            sleep(random(5000, 8000))
        }
        if (Math.random() * 100 < TT_Save_Count)  {
            taskLog("开始触发保存视频概率")
            click_Save_Btn()
            sleep(random(5000, 8000))
        }
        if (Math.random() * 100 < TT_Comment_Count)  {
            taskLog("开始触发评论视频概率")
            taskLog("评论文案的总个数："+comments.length)
            if (comments.length > 0) {

                //如果评论概率不是0，那么直接报错
                if(TT_Comment_Count > 0 && comments.includes("T_评论文案")) {
                    throw new Error("评论概率不是0，但评论内容是空，所以报错");
                }

                taskLog("- 找到可用评论文案, 开始评论 - ");
                var randIdx = random(0, comments.length - 1)
                taskLog("评论文案的下标randIdx："+randIdx)
                var commentText = comments[randIdx];
                taskLog("随机评论文案 :" + commentText);
                click_Comment_Btn(commentText)
                sleep(random(5000, 8000))
              }else{
                taskLog(`- 没有可用评论文案, 忽略 - `);

                //如果评论概率不是0，那么直接报错
                if(TT_Comment_Count > 0) {
                    throw new Error("评论概率不是0，但评论内容是空，所以报错");
                }
              }
        }


        sleep(random(3000, 5000))
        var screenshotPath = Nest_ScreenCapture();
        taskLog("已保存完成后的截图：" + screenshotPath);
        sleep(random(3000, 5000))
        total_success++;


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
}



try {
    
   
    //******************************************************************
    // 用于存储评论的数组
    var comments = get_all_comments()
    var search_text_array = get_all_keyword()

    if(comments.some(text => text.startsWith("${T_"))){ 
        throw_error_storage_not_enough()
    }

    //判断是不是${T_搜尋關鍵字}开头
    taskLog("search_text_array："+search_text_array)
    if(search_text_array.some(text => text.startsWith("${T_"))){
        throw_error_storage_not_enough()
    }

    if(search_text_array.length > 0){
        taskLog("- 找到可用的搜索关键字文案, 开始搜索观看 - ");
        for (var randIdx = 0; randIdx < search_text_array.length; randIdx++) {
            var keywordText = search_text_array[randIdx];
            taskLog("- 找到可用的搜索关键字文案: "+keywordText+", 开始搜索观看 - ");

            // 计算右上角区域的点击坐标(找不到按钮，所以只能是点击坐标)
            click_home_search_btn()
            sleep(random(5000, 8000))


            var search_edits = className("android.widget.EditText").find();
            for(var i = 0; i < search_edits.size(); i++) {
                var search_edit = search_edits.get(i);
                if(search_edit) {
                    taskLog("找到TextView控件-Text："+ search_edit.text());
                    sleep(1000)
                    taskLog("搜索控件，设置内容：" +keywordText );
                    search_edit.setText(keywordText)    
                    sleep(random(5000, 8000))
                    
                    taskLog("开始点击Search按钮")
                    click_Second_search_btn()



                    //开始观看视频
                    sleep(random(5000, 8000))
                    taskLog("开始点击视频Tab按钮")
                    // find_textview_text_base("影片","Videos","视频")
                    var video_text = findTextByLanguages(VIDEO_TEXT)
                    if(video_text){
                        taskLog("找到视频Tab按钮：" + video_text)
                        sleep(random(8000, 10000))
                        click_left_top_screen()//直接观看第一个即可
                        
                        sleep(random(5000, 8000))
                        watch_TT_video(comments)

                        //看完之后，回退回去
                        back()
                        sleep(random(2000, 3000))
                        back()
                        sleep(random(2000, 3000))

                    }else{
                        taskLog("未找到视频Tab按钮")
                    }
        
                }
            }


        }


    }else{
        taskLog("- 没有可用的搜索关键字文案, 忽略 - ");
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
}


