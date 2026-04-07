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
//***********************Tiktok：获取个人的所有信息，包含粉丝数，点赞数，视频数量，获赞数，获赞率，作品数，作品获赞数，作品获赞率 *************************
//******************************************************************


//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


// 需要私信的粉丝总数
var total_target = 1;
// 成功私信的粉丝数量
var total_success = 0;
// 错误信息
var fail_msg = "";


//将需要获取的个人信息
var TT_User_Info = {
    "TikTok_LoginStatus": false, //登录状态
    "TikTok_InBoxCount": "", //收件箱数量
    "TikTok_UserId": "", //用户ID
    "TikTok_Nickname": "", //昵称
    "TikTok_BIO": "", //签名
    "TikTok_Followers": "", //关注者数量
    "TikTok_Fans": "", //粉丝数量
    "TikTok_Likes": "", //点赞数量
    "TikTok_VideosCount": "", //视频数量
    "TikTok_Last_Video_Url": "", //最后一个视频的URL
    "TikTok_Last_Video_Description": "", //最后一个视频的描述
    "TikTok_Last_PlayCount": "", //最后一个视频的播放数
    // "TikTok_Last_ViewCount": "", //最后一个视频的观看数
    "TikTok_Last_LikeCount": "", //最后一个视频的点赞数
    "TikTok_Last_CommentCount": "", //最后一个视频的评论数
    "TikTok_Last_FavoriteCount": "", //最后一个视频的收藏数
}



var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill'; //亚洲版TikTok包名
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically'; //全球版TikTok包名


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


//Tiktok最右侧的Profile的按钮文字
const PROFILE_TEXT = {
    ZH_CN: "主页",    // 简体中文
    ZH_TW: "個人資料",    // 繁体中文
    EN_US: "Profile"   // 英文
};

//Tiktok第三页的按钮文字
const INBOX_PAGE_TEXT = {
    ZH_CN: "收件箱",    // 简体中文
    ZH_TW: "收信匣",    // 繁体中文 text("收信匣")
    EN_US: "Inbox"   // 英文 text("Inbox")
};


//Tiktok视频的URL的按钮文字
const VIDEO_URL_TEXT = {
    ZH_CN: "复制链接",    // 简体中文:text("复制链接")
    ZH_TW: "複製連結",    // 繁体中文:text("複製連結")
    EN_US: "Copy link"   // 英文:text("Copy link")
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




//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();

//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
// console.show()

//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
events.on('exit', function () {
    console.hide()
    sleep(1000)

    if (handleErrorFlag) {
        taskLogError("-----------------脚本执行出现异常---------------");
        taskLogError("Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶---------------");
        taskLogError("脚本执行时间：" + new Date().toLocaleString());
    } else {
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



//打开Autojs的Log activity
function openLogActivity() {
    var intent = {
        action: "android.intent.action.MAIN",
        packageName: "org.autojs.autoxjs",
        className: "org.autojs.autojs.ui.log.LogActivityKt"
    };
    app.startActivity(intent);
}

function throw_error_storage_not_enough() {
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}

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
    throw new Error("未检测到TikTok安装，请先安装TikTok！");
}

sleep(random(3000, 5000))
forceStop_APP(targetPackageName)
sleep(3000)

app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});

sleep(random(3000, 5000))



function getSystemDate(a) {
    var b = new SimpleDateFormat("HH:mm:ss"), c = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    return "tf" == a ? b.format(new java.util.Date()) : "df" == a ? c.format(new java.util.Date()) : void 0;
}

//打印日志
function taskLog(_log) {
    toast(_log)
    console.log(getSystemDate("df") + ":" + _log)
    console.log(_log)


    try {
        //确保目录存在
        files.ensureDir(RPAFilePath);

        //将日志写入文件
        var logContent = getSystemDate("df") + ":" + _log + "\n";
        // var logContent = _log + "\n";
        files.append(logFilePath, logContent);

    } catch (e) {
        console.error("写入日志文件失败：" + e);
    }
}


function taskLogError(_log) {
    toast(_log);

    console.error(getSystemDate("df") + ":" + _log)
    // console.error(_log)

    try {
        //确保目录存在
        files.ensureDir(RPAFilePath);

        //将日志写入文件
        var logContent = getSystemDate("df") + ":" + "【!!!ERROR!!!】" + _log + "\n";
        // var logContent = "【!!!ERROR!!!】" + _log + "\n";
        files.append(logFilePath, logContent);

    } catch (e) {
        console.error("写入日志文件失败：" + e);
    }
}


//========================================================================================================================



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

    // taskLog("准备强杀:" + packageName + "...")
    // sleep(1000);
    // openAppSettings(packageName)
    // sleep(5000)

    // // 遍历所有可能的强制停止按钮文本
    // for (let lang in FORCE_STOP_TEXT) {
    //     let stopText = FORCE_STOP_TEXT[lang];
    //     if (text(stopText).exists()) {
    //         let forceStopBtn = text(stopText).findOne();
    //         if (forceStopBtn && forceStopBtn.clickable()) {
    //             forceStopBtn.click();
    //             sleep(1000);
                
    //             // 遍历所有可能的确认按钮文本
    //             for (let confirmLang in FORCE_STOP_CONFIRM_TEXT) {
    //                 let confirmText = FORCE_STOP_CONFIRM_TEXT[confirmLang];
    //                 if (text(confirmText).exists()) {
    //                     text(confirmText).findOne().click();
    //                     taskLog("成功点击'" + stopText + "'按钮并确认");
    //                     sleep(3000);
    //                     home();
    //                     return;
    //                 }
    //             }
    //         } else {
    //             taskLog("未找到可点击的'" + stopText + "'按钮");
    //         }
    //     } else {
    //         taskLog("未找到'" + stopText + "'按钮");
    //     }
    //     sleep(1000);
    // }

    // // 如果所有语言都尝试失败，返回主页
    // home();
}





//屏幕上滑
function swipe_to_up() {
    // 获取设备屏幕的宽高
    var width = device.width;
    var height = device.height;

    // 生成随机起始点
    var startX = random(width / 3, width * 2 / 3);
    var startY = random(height * 2 / 3, height * 3 / 4);

    // 生成随机结束点
    var endX = random(width / 3, width * 2 / 3);
    var endY = random(height * 1 / 3, height * 1 / 4);

    // 屏幕上滑操作
    var swipe_time = random(500, 1000);
    swipe(startX, startY, endX, endY, swipe_time);
    taskLog("开始滑动位置，x = " + startX + "；y = " + startY + "，滑动时间 = " + swipe_time)
    taskLog("结束滑动位置，x = " + endX + "；y = " + endY)

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
    for (obj_Text = text(a).boundsInside(5, 5, device.width - 5, device.height - 5); obj_Text.find().empty();) sleep(1e3);
    X = obj_Text.find().get(0).bounds().centerX(), Y = obj_Text.find().get(0).bounds().centerY(),
        Deviation = random(-5, 5), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt < 24 ? ra.tap(X1, Y1) : click(X1, Y1);
}

function clickDesc(a) {
    for (obj_Desc = desc(a).boundsInside(5, 5, device.width - 5, device.height - 5); obj_Desc.find().empty();) sleep(1e3);
    X = obj_Desc.find().get(0).bounds().centerX(), Y = obj_Desc.find().get(0).bounds().centerY(),
        Deviation = random(-5, 5), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt < 24 ? ra.tap(X1, Y1) : click(X1, Y1);
}




//获取该用户所有的video信息，包含视频数量，视频播放量，视频点赞量，视频评论量，视频分享量，视频收藏量
//参数：videoUrl - 视频链接，如：https://vt.tiktok.com/ZSySrbSTa/
/*
function getVideoInfoInPage(videoUrl){
    try {
        taskLog("=== 开始获取视频信息 ===");
        taskLog("视频链接：" + videoUrl);
        
        // 1. 打开视频链接（会自动跳转到 TikTok App）
        taskLog("正在打开视频链接...");
        app.openUrl(videoUrl);
        sleep(random(5000, 7000)); // 等待 TikTok 打开并加载视频
        
        // 2. 等待视频播放器加载完成
        if (!waitForVideoLoad()) {
            taskLogError("视频加载超时");
            return null;
        }
        
        // 3. 提取视频数据
        var videoData = extractVideoData();
        
        // 4. 打印获取到的数据
        taskLog("=== 视频信息获取完成 ===");
        taskLog("视频数据：" + JSON.stringify(videoData, null, 2));
        
        return videoData;
        
    } catch(e) {
        taskLogError("获取视频信息失败：" + e);
        taskLogError("错误堆栈：" + e.stack);
        return null;
    }
}

// 等待视频加载完成
function waitForVideoLoad() {
    taskLog("等待视频加载...");
    var maxWait = 15; // 最大等待15秒
    var count = 0;
    
    while(count < maxWait) {
        // 检查是否有点赞按钮（说明视频已加载）
        // 全球版和亚洲版的点赞按钮可能不同，尝试多种方式
        if (desc("Like").exists() || 
            desc("like").exists() || 
            text("Like").exists() ||
            className("android.widget.ImageView").desc("Like").exists()) {
            taskLog("视频加载完成");
            sleep(random(2000, 3000)); // 额外等待确保所有数据加载
            return true;
        }
        
        // 也可以通过查找评论按钮来判断
        if (desc("Comment").exists() || desc("comment").exists()) {
            taskLog("视频加载完成（通过评论按钮检测）");
            sleep(random(2000, 3000));
            return true;
        }
        
        taskLog("等待中... (" + (count + 1) + "/" + maxWait + ")");
        sleep(1000);
        count++;
    }
    
    taskLogError("视频加载超时");
    return false;
}

// 提取视频数据
function extractVideoData() {
    var videoData = {
        author: "",           // 作者昵称
        authorId: "",         // 作者ID
        description: "",      // 视频描述
        likes: "",           // 点赞数
        comments: "",        // 评论数
        shares: "",          // 分享数
        favorites: "",       // 收藏数
        videoUrl: ""         // 视频链接
    };
    
    taskLog("开始提取视频数据...");
    
    try {
        // 1. 提取作者信息
        // videoData.author = extractAuthorInfo();
        
        // 2. 提取视频描述
        videoData.description = extractVideoDescription();
        
        // 3. 提取互动数据（点赞、评论、分享等）
        var interactionData = extractInteractionData();
        videoData.likes = interactionData.likes;
        videoData.comments = interactionData.comments;
        videoData.shares = interactionData.shares;
        videoData.favorites = interactionData.favorites;
        
    } catch(e) {
        taskLogError("提取数据时出错：" + e);
    }
    
    return videoData;
}

// 提取作者信息
function extractAuthorInfo() {
    try {
        // 方法1：通过查找作者昵称的TextView
        // 通常在视频页面左下角有作者信息
        var authorElements = className("android.widget.TextView")
            .clickable(true)
            .find();
        
        if (authorElements && authorElements.size() > 0) {
            // 遍历查找以@开头的用户ID或昵称
            for (var i = 0; i < Math.min(authorElements.size(), 10); i++) {
                var elem = authorElements.get(i);
                var text = elem.text();
                if (text && (text.startsWith("@") || text.length > 0)) {
                    taskLog("找到作者信息：" + text);
                    return text;
                }
            }
        }
        
        // 方法2：通过特定ID查找（需要根据实际UI调整）
        if (targetPackageName == ASIA_TikTokPackageName) {
            var authorView = id("com.ss.android.ugc.trill:id/author").findOne(3000);
            if (authorView && authorView.text()) {
                return authorView.text();
            }
        } else {
            var authorView = id("com.zhiliaoapp.musically:id/author").findOne(3000);
            if (authorView && authorView.text()) {
                return authorView.text();
            }
        }
        
    } catch(e) {
        taskLogError("提取作者信息失败：" + e);
    }
    
    return "未获取到作者信息";
}

// 提取视频描述
function extractVideoDescription() {
    try {
        // 视频描述通常在作者信息下方
        // 查找包含多行文本的 TextView
        var descElements = className("android.widget.TextView")
            .clickable(false)
            .find();
        
        if (descElements && descElements.size() > 0) {
            for (var i = 0; i < Math.min(descElements.size(), 20); i++) {
                var elem = descElements.get(i);
                var text = elem.text();
                // 描述通常较长，且不是纯数字
                if (text && text.length > 10 && !/^\d+$/.test(text)) {
                    // 排除一些明显不是描述的文本
                    if (!text.includes("Following") && 
                        !text.includes("Followers") && 
                        !text.includes("Likes")) {
                        taskLog("找到视频描述：" + text.substring(0, 50) + "...");
                        return text;
                    }
                }
            }
        }
    } catch(e) {
        taskLogError("提取视频描述失败：" + e);
    }
    
    return "未获取到描述";
}

// 提取互动数据（点赞、评论、分享等）
function extractInteractionData() {
    var data = {
        likes: "0",
        comments: "0",
        shares: "0",
        favorites: "0"
    };
    
    try {
        taskLog("开始提取互动数据...");
        
        // 在视频页面右侧有一列互动按钮（点赞、评论、分享、收藏）
        // 每个按钮下方通常有对应的数字
        
        // 查找所有包含数字的 TextView
        var allTextViews = className("android.widget.TextView").find();
        var numberTexts = [];
        
        if (allTextViews && allTextViews.size() > 0) {
            taskLog("找到TextView总数：" + allTextViews.size());
            
            for (var i = 0; i < allTextViews.size(); i++) {
                var textView = allTextViews.get(i);
                if (textView && textView.text()) {
                    var text = textView.text();
                    
                    // 查找包含数字的文本（可能是 123, 1.2K, 1.2M 等格式）
                    if (/\d/.test(text) && text.length < 10) {
                        // 获取控件的位置信息，右侧的互动数据Y坐标通常在屏幕中下部
                        var bounds = textView.bounds();
                        var screenHeight = device.height;
                        var screenWidth = device.width;
                        
                        // 互动按钮通常在屏幕右侧
                        if (bounds.centerX() > screenWidth * 0.7) {
                            numberTexts.push({
                                text: text,
                                y: bounds.centerY(),
                                element: textView
                            });
                            taskLog("找到可能的互动数据：" + text + " (Y:" + bounds.centerY() + ")");
                        }
                    }
                }
            }
            
            // 按Y坐标排序（从上到下）
            numberTexts.sort(function(a, b) {
                return a.y - b.y;
            });
            
            // 通常顺序是：点赞、评论、收藏/分享
            if (numberTexts.length >= 1) {
                data.likes = numberTexts[0].text;
                taskLog("点赞数：" + data.likes);
            }
            if (numberTexts.length >= 2) {
                data.comments = numberTexts[1].text;
                taskLog("评论数：" + data.comments);
            }
            if (numberTexts.length >= 3) {
                data.favorites = numberTexts[2].text;
                taskLog("收藏数：" + data.favorites);
            }
            if (numberTexts.length >= 4) {
                data.shares = numberTexts[3].text;
                taskLog("分享数：" + data.shares);
            }
        }
        
        // 方法2：通过查找按钮附近的文本
        // 尝试找到"Like"按钮，然后找其附近的数字
        if (data.likes === "0") {
            data.likes = findNumberNearButton("Like") || "0";
        }
        if (data.comments === "0") {
            data.comments = findNumberNearButton("Comment") || "0";
        }
        if (data.shares === "0") {
            data.shares = findNumberNearButton("Share") || "0";
        }
        
    } catch(e) {
        taskLogError("提取互动数据失败：" + e);
    }
    
    return data;
}

// 查找按钮附近的数字
function findNumberNearButton(buttonDesc) {
    try {
        var button = desc(buttonDesc).findOne(2000);
        if (button) {
            var bounds = button.bounds();
            // 在按钮下方查找数字
            var texts = className("android.widget.TextView")
                .boundsInside(bounds.left - 50, bounds.top, bounds.right + 50, bounds.bottom + 150)
                .find();
            
            if (texts && texts.size() > 0) {
                for (var i = 0; i < texts.size(); i++) {
                    var text = texts.get(i).text();
                    if (text && /\d/.test(text)) {
                        taskLog("在" + buttonDesc + "按钮附近找到数字：" + text);
                        return text;
                    }
                }
            }
        }
    } catch(e) {
        // 忽略错误
    }
    return null;
}

*/


//获取收件箱信息页面的收件箱数量
function getInBoxCountInfoInPage() {
    //className("android.widget.FrameLayout") - fullId("com.ss.android.ugc.trill:id/k6e") : 包含两个Textview，分别是收件匣和99+， 一个Imageview，是收件匣的logo
    //className("android.widget.FrameLayout") - fullId("com.zhiliaoapp.musically:id/k6d") : 包含两个Imageview，分别是一个红点和收件匣的logo， 一个收件匣

    var InBoxCountInfoInPage_button;
    if (targetPackageName == ASIA_TikTokPackageName) {
        InBoxCountInfoInPage_button = id("com.ss.android.ugc.trill:id/k6e").find();
    } else {
        InBoxCountInfoInPage_button = id("com.zhiliaoapp.musically:id/k6d").find();
    }

    if (InBoxCountInfoInPage_button && InBoxCountInfoInPage_button.length > 0) {
        taskLog("找到收件箱信息页面按钮，继续执行");

        //遍历InBoxCountInfoInPage_button布局内部，找到所有的Textview，查看text是否包含数字
        var container = InBoxCountInfoInPage_button.get(0);
        var allTextViews = container.find(className("android.widget.TextView"));

        if (allTextViews && allTextViews.size() > 0) {
            taskLog("在InBoxCountInfoInPage_button容器内找到TextView数量：" + allTextViews.size());
            for (var i = 0; i < allTextViews.size(); i++) {
                var textView = allTextViews.get(i);
                if (textView && textView.text()) {
                    taskLog("第" + (i + 1) + "个TextView - text = " + textView.text());
                    // 检查是否包含数字（比如99+或者1都算是包含数字）
                    if (/\d/.test(textView.text())) {
                        taskLog("  └─ 包含数字！记录：" + textView.text());
                        // 这里可以将数据保存到变量中
                        TT_User_Info.TikTok_InBoxCount = textView.text();
                    }
                }
            }
        } else {
            taskLog("在InBoxCountInfoInPage_button容器内未找到TextView");
        }

    }
    sleep(random(10000, 15000));

}


//获取收件箱详细信息
function getInBoxInfo() {
    //fullId("com.zhiliaoapp.musically:id/k6d") - className("android.widget.FrameLayout") - clickable("true")
    //fullId("com.ss.android.ugc.trill:id/k6e") - className("android.widget.FrameLayout") - clickable("true")


    var InBox_button;
    if (targetPackageName == ASIA_TikTokPackageName) {
        InBox_button = id("com.ss.android.ugc.trill:id/k6e").find();
    } else {
        InBox_button = id("com.zhiliaoapp.musically:id/k6d").find();
    }

    if (InBox_button && InBox_button.length > 0) {
        taskLog("找到收件箱按钮，继续执行");
        InBox_button.click();
        sleep(random(2000, 3000));


        //新粉丝人数的布局：fullId("com.ss.android.ugc.trill:id/ol5") - 24
        //新活动的布局：fullId("com.ss.android.ugc.trill:id/ol5") - 99+
        //新讯息的布局：fullId("com.ss.android.ugc.trill:id/pg0") - 4

        // 遍历所有控件，查找包含数字的控件
        taskLog("开始遍历收件箱页面的所有控件...");

        // 方法1：查找所有TextView控件
        var allTextViews = className("android.widget.TextView").find();
        if (allTextViews && allTextViews.size() > 0) {
            taskLog("找到TextView控件总数：" + allTextViews.size());
            for (var i = 0; i < allTextViews.size(); i++) {
                var textView = allTextViews.get(i);
                if (textView && textView.text()) {
                    var text = textView.text();
                    // 只输出包含数字的控件
                    if (/\d/.test(text)) {
                        taskLog("第" + (i + 1) + "个TextView - Text: " + text +
                            " | ID: " + textView.id() +
                            " | ClassName: " + textView.className() +
                            " | Clickable: " + textView.clickable());

                        // 获取父容器信息
                        var parent = textView.parent();
                        if (parent) {
                            taskLog("  父容器 - ID: " + parent.id() +
                                " | ClassName: " + parent.className());
                        }
                    }
                }
            }
        }

        taskLog("---分隔线---");

        // 方法2：根据已知ID查找控件
        taskLog("开始根据ID查找控件...");

        // 查找新粉丝/新活动的控件 (ol5)
        var ol5_controls;
        if (targetPackageName == ASIA_TikTokPackageName) {
            ol5_controls = id("com.ss.android.ugc.trill:id/ol5").find();
        } else {
            ol5_controls = id("com.zhiliaoapp.musically:id/ol5").find();
        }

        if (ol5_controls && ol5_controls.size() > 0) {
            taskLog("找到ol5控件数量：" + ol5_controls.size());
            for (var j = 0; j < ol5_controls.size(); j++) {
                var control = ol5_controls.get(j);
                if (control) {
                    taskLog("第" + (j + 1) + "个ol5控件 - Text: " + control.text() +
                        " | ID: " + control.id() +
                        " | ClassName: " + control.className());
                }
            }
        } else {
            taskLog("未找到ol5控件");
        }

        // 查找新讯息的控件 (pg0)
        var pg0_controls;
        if (targetPackageName == ASIA_TikTokPackageName) {
            pg0_controls = id("com.ss.android.ugc.trill:id/pg0").find();
        } else {
            pg0_controls = id("com.zhiliaoapp.musically:id/pg0").find();
        }

        if (pg0_controls && pg0_controls.size() > 0) {
            taskLog("找到pg0控件数量：" + pg0_controls.size());
            for (var k = 0; k < pg0_controls.size(); k++) {
                var control = pg0_controls.get(k);
                if (control) {
                    taskLog("第" + (k + 1) + "个pg0控件 - Text: " + control.text() +
                        " | ID: " + control.id() +
                        " | ClassName: " + control.className());
                }
            }
        } else {
            taskLog("未找到pg0控件");
        }



    }
    sleep(random(2000, 3000));

}



//获取个人中心信息
function getUserInfo() {

    //开始寻找用户所有的关注用户列表的TextView
    // 循环等待直到找到FOLLOWING_TEXT按钮
    var maxWaitAttempts = 10; // 最大等待尝试次数
    var waitAttempt = 0;
    var Profile_text_button = null;

    while (waitAttempt < maxWaitAttempts) {
        Profile_text_button = findTextByLanguages(PROFILE_TEXT);
        if (Profile_text_button) {
            taskLog("找到个人中心按钮，继续执行");
            break;
        } else {
            waitAttempt++;
            taskLog("第" + waitAttempt + "次尝试：未找到个人中心按钮，等待后重试...");
            sleep(random(3000, 5000)); // 每次等待3-5秒
        }
    }

    if (Profile_text_button) {

        //寻找个人中心的昵称，需要寻找ID来获取对应的昵称
        //fullId("com.ss.android.ugc.trill:id/n83") - className("android.widget.Button") - text("Jockey0o0") - Global版本
        //fullId("com.zhiliaoapp.musically:id/n82") - className("android.widget.Button") - text("Karen") - Asia版本
        // 根据包名判断使用哪个ID
        var Nickname_button;
        if (targetPackageName == GLOBAL_TikTokPackageName) {
            Nickname_button = id("com.zhiliaoapp.musically:id/n82").find();
        } else {
            Nickname_button = id("com.ss.android.ugc.trill:id/n83").find();
        }

        if (Nickname_button && Nickname_button.length > 0) {
            taskLog("找到个人中心昵称按钮，继续执行");
            var Nickname = Nickname_button.get(0).text();
            taskLog("个人中心昵称 = " + Nickname);
            TT_User_Info.TikTok_LoginStatus = true;
            TT_User_Info.TikTok_Nickname = Nickname;
        }

        sleep(random(2000, 3000));





        //寻找个人中心的UserId，需要寻找ID来获取对应的UserId
        //fullId("com.ss.android.ugc.trill:id/n9r") - className("android.widget.Button") - text("@jockey0o0")
        //fullId("com.zhiliaoapp.musically:id/n9q") - className("android.widget.Button") - text("@user454433939")
        var UserId_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            UserId_button = id("com.ss.android.ugc.trill:id/n9r").find();
        } else {
            UserId_button = id("com.zhiliaoapp.musically:id/n9q").find();
        }

        if (UserId_button && UserId_button.length > 0) {
            taskLog("找到个人中心UserId按钮，继续执行");
            var UserId = UserId_button.get(0).text();
            taskLog("个人中心UserId = " + UserId);
            TT_User_Info.TikTok_UserId = UserId;
        } else {
            taskLog("没有找到个人中心UserId按钮，说明当前页面出现异常，直接退出");
            TT_User_Info.TikTok_LoginStatus = false;

            taskLog("准备进行错误截图...");
            var screenshotPath = Nest_ScreenCapture();
            taskLog("已保存错误截图：" + screenshotPath);
            sleep(random(3000, 5000))
            throw new Error("没有找到个人中心UserId按钮，说明当前页面出现异常，直接退出")
        }

        sleep(random(2000, 3000));


        // 寻找用户个人中心的Followers按钮对应的数量
        //fullId("com.ss.android.ugc.trill:id/n8q") -className("android.widget.TextView") -- text("29")
        //fullId("com.zhiliaoapp.musically:id/n8p") -className("android.widget.TextView") -- text("0")
        var Followers_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            Followers_button = id("com.ss.android.ugc.trill:id/n8q").find();
        } else {
            Followers_button = id("com.zhiliaoapp.musically:id/n8p").find();
        }
        if (Followers_button && Followers_button.length > 0) {
            taskLog("找到个人中心Followers按钮，继续执行");
            taskLog("找到个人中心Followers按钮，继续执行, Followers_button长度 = " + Followers_button.length);
            var Followers = Followers_button.get(0).text();
            taskLog("个人中心Followers = " + Followers);
            TT_User_Info.TikTok_Followers = Followers;
        }
        sleep(random(2000, 3000));




        //寻找用户个人中心的粉丝数 需要寻找ID来获取对应的粉丝数
        //fullId("com.ss.android.ugc.trill:id/n51") - className("android.widget.TextView") - text("92") 
        //fullId("com.zhiliaoapp.musically:id/n50") - className("android.widget.TextView") - text("0")
        var Fans_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            Fans_button = id("com.ss.android.ugc.trill:id/n51").find();
        } else {
            Fans_button = id("com.zhiliaoapp.musically:id/n50").find();
        }
        if (Fans_button && Fans_button.length > 0) {
            taskLog("找到个人中心Fans按钮，继续执行");
            var Fans = Fans_button.get(0).text();
            taskLog("个人中心Fans = " + Fans);
            TT_User_Info.TikTok_Fans = Fans;
        }
        sleep(random(2000, 3000));




        //寻找用户个人中心的被赞数量 需要寻找ID来获取对应的被赞数量
        //fullId("com.ss.android.ugc.trill:id/n8q") - className("android.widget.TextView") - text("306")
        //fullId("com.zhiliaoapp.musically:id/n8p") - className("android.widget.TextView") - text("0")

        var Likes_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            Likes_button = id("com.ss.android.ugc.trill:id/n8q").find();
        } else {
            Likes_button = id("com.zhiliaoapp.musically:id/n8p").find();
        }
        if (Likes_button && Likes_button.length > 0) {
            taskLog("找到个人中心Likes按钮，继续执行");
            var Likes = Likes_button.get(1).text();
            taskLog("个人中心Likes = " + Likes);
            TT_User_Info.TikTok_Likes = Likes;
        }
        sleep(random(10000, 15000));



        //寻找用户个人中心的签名 需要寻找ID来获取对应的签名
        //编辑：fullId("com.ss.android.ugc.trill:id/n9q") - className("android.widget.LinearLayout") - clickable("false")
        //fullId("com.ss.android.ugc.trill:id/iv0") - className("android.widget.TextView") - text("lolo")


        //编辑：fullId("com.zhiliaoapp.musically:id/n9p") - className("android.widget.LinearLayout") - clickable("false")
        //fullId("com.zhiliaoapp.musically:id/iuz") - className("android.widget.TextView") - text("Add a bio")

        total_success = 1

    } else {
        TT_User_Info.TikTok_LoginStatus = false;
        taskLog("准备进行错误截图...");
        var screenshotPath = Nest_ScreenCapture();
        taskLog("已保存错误截图：" + screenshotPath);
        sleep(random(3000, 5000))
        taskLog("没有找到用户个人中心的Follow列表的TextView")
        throw new Error("没有找到用户个人中心的Follow列表的TextView")
    }

}


function getclipText() {
    // 注意：Android 10+ (API 29) 需要应用在前台才能读取剪贴板

    // // 尝试使用 AutoJS 的方式申请权限（虽然通常不需要）
    // try {
    //     // 确保应用有存储权限（某些情况下可能有关）
    //     if (device.sdkInt >= 23) {
    //         // Android 6.0+ 动态申请权限
    //         var hasPermission = runtime.requestPermissions([
    //             "android.permission.READ_CLIPBOARD"
    //         ]);

    //         if (!hasPermission) {
    //             taskLog("剪贴板权限未授予，可能影响某些功能");
    //         }
    //     }
    // } catch(e) {
    //     taskLog("权限检查异常：" + e);
    // }

    try {
        // 动态申请读取剪贴板权限 (Android 10+ 不需要权限申请，但保留兼容旧版本)
        if (device.sdkInt >= 23 && device.sdkInt < 29) {
            runtime.requestPermissions(["android.permission.READ_CLIPBOARD"]);
        }
    } catch (e) {
        taskLog("权限申请异常（可忽略）：" + e);
    }

    sleep(1000); // 等待权限弹窗出现（部分系统需要）
    taskLog("当前剪贴板：" + getClip());

    // 等待一下，确保权限生效
    sleep(500);

    var text = "";
    try {

        var cm = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
        if (!cm || !cm.hasPrimaryClip()) return "";

        var clipData = cm.getPrimaryClip();
        if (!clipData || clipData.getItemCount() <= 0) return "";

        var item = clipData.getItemAt(0);

        // 先 coerceToText
        var coerced = item.coerceToText(context);
        if (coerced != null) {
            text = String(coerced);
            taskLog("剪贴板内容：" + text);
            return text;
        }

        // 再 getText
        var clipText = item.getText();
        if (clipText != null) {
            text = clipText.toString();
            taskLog("剪贴板内容：" + text);
            return text;
        }

        // 再尝试 URI
        var uri = item.getUri && item.getUri();
        if (uri) {
            var cr = context.getContentResolver();
            var ins = cr.openInputStream(uri);
            if (ins) {
                var scanner = new java.util.Scanner(ins, "UTF-8").useDelimiter("\\A");
                text = scanner.hasNext() ? String(scanner.next()) : "";
                ins.close();
                taskLog("剪贴板(URI)内容：" + text);
                return text;
            }
        }
        taskLog("剪贴板文本为null/不可读");
    } catch (e) {
        taskLogError("获取剪贴板失败：" + e);
    }
    return text;
}



//获取用户多少个视频总数,通过查找girdview内有多少个framelayout来查找
function getUserVideosCountByGirdview() {
    //fullId("com.zhiliaoapp.musically:id/fh3") - className("android.widget.GridView")
    //fullId("com.zhiliaoapp.musically:id/d8s") - fullId("com.zhiliaoapp.musically:id/d8s")


    //fullId("com.ss.android.ugc.trill:id/fh4") - className("android.widget.FrameLayout")
    //fullId("com.ss.android.ugc.trill:id/d8t") - className("android.widget.FrameLayout")

    var gridViewId, frameLayoutId;

    if (targetPackageName == ASIA_TikTokPackageName) {
        gridViewId = "com.ss.android.ugc.trill:id/fh4";
        frameLayoutId = "com.ss.android.ugc.trill:id/d8t";
    } else {
        gridViewId = "com.zhiliaoapp.musically:id/fh3";
        frameLayoutId = "com.zhiliaoapp.musically:id/d8s";
    }

    // 查找 GridView
    var gridView = id(gridViewId).className("android.widget.GridView").findOne(3000);

    if (gridView) {
        taskLog("找到 GridView");

        // 获取 GridView 的直接子元素个数
        var childCount = gridView.childCount();
        taskLog("GridView 内找到 FrameLayout 个数: " + childCount);
        TT_User_Info.TikTok_VideosCount = childCount;
    } else {
        taskLog("没有找到 GridView");
        TT_User_Info.TikTok_VideosCount = 0;
    }

    sleep(random(2000, 3000));
}


//获取用户多少个视频
function getUserVideosCount() {
    // fullId("com.ss.android.ugc.trill:id/tdi") - fullId("com.ss.android.ugc.trill:id/tdi") - text("227")
    // fullId("com.zhiliaoapp.musically:id/tdg") - fullId("com.zhiliaoapp.musically:id/tdg") - text("23")

    // 使用对象来存储已经遇到的视频text（用于去重）
    var uniqueVideos = {};
    var videoCount = 0;

    // 滑动3次来获取所有视频
    for (var i = 0; i < 3; i++) {
        taskLog("第 " + (i + 1) + " 次获取视频数据");

        var PlayCount_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            PlayCount_button = id("com.ss.android.ugc.trill:id/tdi").find();
        } else {
            PlayCount_button = id("com.zhiliaoapp.musically:id/tdg").find();
        }

        if (PlayCount_button && PlayCount_button.length > 0) {
            taskLog("找到 " + PlayCount_button.length + " 个播放数按钮");

            // 遍历所有找到的按钮，通过text去重
            for (var j = 0; j < PlayCount_button.length; j++) {
                var textContent = PlayCount_button[j].text();
                if (textContent && !uniqueVideos[textContent]) {
                    uniqueVideos[textContent] = true;
                    videoCount++;
                    taskLog("找到新视频，播放数: " + textContent + ", 当前累计: " + videoCount);
                }
            }
        } else {
            taskLog("没有找到播放数按钮");
        }

        // 如果不是最后一次，则往下滑动加载更多视频
        if (i < 2) {
            taskLog("往下滑动加载更多视频");
            swipe(device.width / 2, device.height * 0.7, device.width / 2, device.height * 0.3, 500);
            sleep(random(1500, 2500));
        }
    }

    TT_User_Info.TikTok_VideosCount = videoCount;
    taskLog("视频总数（去重后）: " + videoCount);
    sleep(random(2000, 3000));
}


//获取用户视频信息
function getUserVideosInfo() {

    //fullId("com.ss.android.ugc.trill:id/d8t") - className("android.widget.FrameLayout")
    //fullId("com.zhiliaoapp.musically:id/d8s") - className("android.widget.FrameLayout")

    var UserVideosInfo_button;
    if (targetPackageName == ASIA_TikTokPackageName) {
        UserVideosInfo_button = id("com.ss.android.ugc.trill:id/d8t").find();
    } else {
        UserVideosInfo_button = id("com.zhiliaoapp.musically:id/d8s").find();
    }

    if (UserVideosInfo_button && UserVideosInfo_button.length > 0) {
        taskLog("找到用户视频信息按钮，继续执行");
        TT_User_Info.TikTok_Videos = UserVideosInfo_button.length;

        //找到第一个视频，然后获取到它的信息 ： 播放数 - 点赞数 - 评论数 - 分享数 - 收藏数
        //1.获取播放数 
        // fullId("com.ss.android.ugc.trill:id/tdi") - fullId("com.ss.android.ugc.trill:id/tdi") - text("227")
        // fullId("com.zhiliaoapp.musically:id/tdg") - fullId("com.zhiliaoapp.musically:id/tdg") - text("23")
        var PlayCount_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            PlayCount_button = id("com.ss.android.ugc.trill:id/tdi").find();
        } else {
            PlayCount_button = id("com.zhiliaoapp.musically:id/tdg").find();
        }
        if (PlayCount_button && PlayCount_button.length > 0) {
            taskLog("找到播放数按钮，继续执行");
            var PlayCount = PlayCount_button.get(0).text();
            taskLog("播放数 = " + PlayCount);
        } else {
            taskLog("没有找到播放数按钮");
            PlayCount = 0;
        }
        TT_User_Info.TikTok_Last_PlayCount = PlayCount;
        sleep(random(2000, 3000));



        //2.点击视频，然后获取到它的信息 ： 播放数 - 点赞数 - 评论数 - 分享数 - 收藏数
        UserVideosInfo_button.get(0).click();
        sleep(random(2000, 3000));

        //3.获取视频的点赞数
        //fullId("com.ss.android.ugc.trill:id/e2r") - className("android.widget.Button") - text("17")
        //fullId("com.zhiliaoapp.musically:id/e2q") - className("android.widget.Button") - text("0")
        var LikeCount_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            LikeCount_button = id("com.ss.android.ugc.trill:id/e2r").find();
        } else {
            LikeCount_button = id("com.zhiliaoapp.musically:id/e2q").find();
        }
        if (LikeCount_button && LikeCount_button.length > 0) {
            taskLog("找到点赞数按钮，继续执行");
            var LikeCount = LikeCount_button.get(0).text();
            taskLog("点赞数 = " + LikeCount);
        } else {
            taskLog("没有找到点赞数按钮");
            LikeCount = 0;
        }
        TT_User_Info.TikTok_Last_LikeCount = LikeCount;
        sleep(random(2000, 3000));



        //4.获取视频的评论数
        //fullId("com.ss.android.ugc.trill:id/cww") - className("android.widget.Button") - text("2")
        //fullId("com.zhiliaoapp.musically:id/cwv") - className("android.widget.Button") - text("0")
        var CommentCount_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            CommentCount_button = id("com.ss.android.ugc.trill:id/cww").find();
        } else {
            CommentCount_button = id("com.zhiliaoapp.musically:id/cwv").find();
        }
        if (CommentCount_button && CommentCount_button.length > 0) {
            taskLog("找到评论数按钮，继续执行");
            var CommentCount = CommentCount_button.get(0).text();
            taskLog("评论数 = " + CommentCount);
        } else {
            taskLog("没有找到评论数按钮");
            CommentCount = 0;
        }
        TT_User_Info.TikTok_Last_CommentCount = CommentCount;
        sleep(random(2000, 3000));





        //5.获取视频的收藏数
        //fullId("com.ss.android.ugc.trill:id/fdo") - className("android.widget.TextView") - text("0")
        //fullId("com.zhiliaoapp.musically:id/fdn") - className("android.widget.TextView") - text("0")
        var FavoriteCount_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            FavoriteCount_button = id("com.ss.android.ugc.trill:id/fdo").find();
        } else {
            FavoriteCount_button = id("com.zhiliaoapp.musically:id/fdn").find();
        }
        if (FavoriteCount_button && FavoriteCount_button.length > 0) {
            taskLog("找到收藏数按钮，继续执行");
            var FavoriteCount = FavoriteCount_button.get(0).text();
            taskLog("收藏数 = " + FavoriteCount);
        } else {
            taskLog("没有找到收藏数按钮");
            FavoriteCount = 0;
        }
        TT_User_Info.TikTok_Last_FavoriteCount = FavoriteCount;
        sleep(random(2000, 3000));



        //6.获取视频的具体观看数（暂停该方法，可能获取不到）
        // //fullId("com.ss.android.ugc.trill:id/unn") - className("android.widget.TextView") - text("227 次觀看")
        // //fullId("com.zhiliaoapp.musically:id/unk") - className("android.widget.TextView") - text("23 views")
        // var ViewCount_button;
        // if (targetPackageName == ASIA_TikTokPackageName) {
        //     ViewCount_button = id("com.ss.android.ugc.trill:id/unn").find();
        // } else {
        //     ViewCount_button = id("com.zhiliaoapp.musically:id/unk").find();
        // }
        // if (ViewCount_button && ViewCount_button.length > 0) {
        //     taskLog("找到观看数按钮，继续执行");
        //     var ViewCount = ViewCount_button.get(0).text();
        //     taskLog("观看数 = " + ViewCount);
        // }else{
        //     taskLog("没有找到观看数按钮");
        //     ViewCount = 0;
        // }
        // TT_User_Info.Last_ViewCount = ViewCount;
        // sleep(random(2000, 3000));


        //7.获取视频的描述
        //fullId("com.zhiliaoapp.musically:id/dx5") - className("android.widget.TextView") - text("150小个子lo娘的一周穿搭合集分享,Look")
        //fullId("com.ss.android.ugc.trill:id/dx6") - className("android.widget.TextView") - text("咯咯咯咯咯")
        var Description_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            Description_button = id("com.ss.android.ugc.trill:id/dx6").find();
        } else {
            Description_button = id("com.zhiliaoapp.musically:id/dx5").find();
        }
        if (Description_button && Description_button.length > 0) {
            taskLog("找到描述按钮，继续执行");
            var Description = Description_button.get(0).text();
            taskLog("描述 = " + Description);
        } else {
            taskLog("没有找到描述按钮");
            Description = "";
        }
        TT_User_Info.TikTok_Last_Video_Description = Description;
        sleep(random(2000, 3000));





        //7.获取视频的URL：不能使用点击点击复制链接的logo按钮，因为下面一排的按钮的logo都一样，且顺序不固定
        //点击省略号：fullId("com.ss.android.ugc.trill:id/pkl") - className("android.widget.ImageView") - clickable("true")
        //点击复制链接的logo：fullId("com.ss.android.ugc.trill:id/pk3") - className("android.widget.ImageView") - clickable("false")



        //fullId("com.zhiliaoapp.musically:id/pkk") - className("android.widget.ImageView") - clickable("true")
        //fullId("com.zhiliaoapp.musically:id/pk2") - className("android.widget.ImageView") - clickable("false")
        var More_button;
        if (targetPackageName == ASIA_TikTokPackageName) {
            More_button = id("com.ss.android.ugc.trill:id/pkl").find();
        } else {
            More_button = id("com.zhiliaoapp.musically:id/pkk").find();
        }

        if (More_button && More_button.length > 0) {
            taskLog("找到省略号按钮和复制链接按钮，继续执行");
            More_button.get(0).click();
            sleep(random(3000, 5000));


            // 先获取当前剪贴板内容，用于对比
            var oldClip = getclipText();
            taskLog("点击前的剪贴板内容: " + oldClip);

            var CopyLink_button = findTextByLanguages(VIDEO_URL_TEXT);
            if (CopyLink_button) {
                taskLog("成功点击复制链接按钮，等待复制操作完成...");
                sleep(random(3000, 5000)); // 等待复制操作完成

                // 从剪贴板获取复制的视频链接（使用AutoJS内置方法）
                var Video_Url = getclipText();
                taskLog("点击后的剪贴板内容: " + Video_Url);

                // 如果剪贴板内容没有变化或为空，说明复制可能失败
                if (Video_Url === oldClip || !Video_Url) {
                    taskLogError("剪贴板内容未更新或为空，可能复制失败");
                    taskLogError("旧剪贴板: " + oldClip);
                    taskLogError("新剪贴板: " + Video_Url);
                    // 重试一次
                    sleep(3000);
                    Video_Url = getclipText();
                    taskLog("重试获取剪贴板: " + Video_Url);
                }

                TT_User_Info.TikTok_Last_Video_Url = Video_Url;
            } else {
                taskLog("没有找到复制链接按钮");
                throw new Error("没有找到复制链接按钮");
            }
        } else {
            taskLog("没有找到省略号按钮和复制链接按钮");
            throw new Error("没有找到省略号按钮和复制链接按钮");
        }


        sleep(random(10000, 15000));
        back()




    } else {
        taskLog("没有找到用户视频信息按钮");
        TT_User_Info.TikTok_Videos = 0;
    }
    sleep(random(2000, 3000));
}


try {

    taskLog("打开TikTok成功...")
    taskLog("开始点击首页最右侧Profile按钮")

    getUserInfo() //获取个人中心信息
    // getUserVideosInfo() //获取用户视频信息
    // getUserVideosCount() //获取用户多少个视频 
    // getUserVideosCountByGirdview() //获取用户多少个视频总数
    getInBoxCountInfoInPage() //获取收件箱信息页面的收件箱数量

    //打印一下TT_User_Info
    taskLog("TT_User_Info = " + JSON.stringify(TT_User_Info, null, 2));


    // ============ 获取视频信息示例 ============
    // 如果需要获取特定视频的详细信息，取消下面代码的注释
    /*
    taskLog("========== 开始测试视频信息获取功能 ==========");
    var testVideoUrl = "https://vt.tiktok.com/ZSySrbSTa/";  // 替换为您要获取的视频链接
    var videoInfo = getVideoInfoInPage(testVideoUrl);
    
    if (videoInfo) {
        taskLog("成功获取视频信息！");
        taskLog("作者：" + videoInfo.author);
        taskLog("描述：" + videoInfo.description);
        taskLog("点赞数：" + videoInfo.likes);
        taskLog("评论数：" + videoInfo.comments);
        taskLog("分享数：" + videoInfo.shares);
        taskLog("收藏数：" + videoInfo.favorites);
        
        // 返回个人中心页面
        back();
        sleep(random(2000, 3000));
    } else {
        taskLogError("获取视频信息失败");
    }
    taskLog("========== 视频信息获取测试结束 ==========");
    */



} catch (e) {
    if (e.message === "TASK_COMPLETED") {
        taskLog("任务正常完成");
    } else {
        handleError(e);
    }
} finally {
    taskLog("保存统计结果到备用路径...");
    try {

        // if (TT_User_Info.TikTok_LoginStatus) {
        //     fail_msg = TT_User_Info;
        // } else{
        //     fail_msg = "未登录";
        // }

        var result = {
            total_target: total_target,
            total_success: total_success,
            fail_msg: fail_msg,
            TikTok_LoginStatus: TT_User_Info.TikTok_LoginStatus,
            TikTok_InBoxCount: TT_User_Info.TikTok_InBoxCount,
            TikTok_UserId: TT_User_Info.TikTok_UserId,
            TikTok_Nickname: TT_User_Info.TikTok_Nickname,
            TikTok_Followers: TT_User_Info.TikTok_Followers,
            TikTok_Fans: TT_User_Info.TikTok_Fans,
            TikTok_Likes: TT_User_Info.TikTok_Likes,
            TikTok_VideosCount: TT_User_Info.TikTok_VideosCount,
        };
        // 打印统计结果
        taskLog("统计结果：" + JSON.stringify(result, null, 2));
        // 使用JSON.stringify将对象转换为JSON字符串，第三个参数2是为了美化输出格式
        files.write(resultPath, JSON.stringify(result, null, 2));
        taskLog("已保存统计结果到：" + resultPath);
    } catch (e) {
        console.error("保存统计结果失败：" + e.message);
    }

    stopAccessibilityMonitor();

}

