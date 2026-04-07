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
//***********************Tiktok关注（根据地区和关键词，然后去批量关注）*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的关注用户ID列表
const TT_Like_User_ID_KEYWORD = '$${T_需要关注指定的关键词}';
const TT_Like_User_COUNT = '$${需要关注的用户数量}'; // 每个号关注多少人 ： 如果为0，则限制关注数量是1 


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



//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "/nest_task_log_" + getSystemDate("df").replace(/:/g, "-").replace(" ", "_") + ".txt"
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
// 需要关注的总数
// 成功关注的数量
var total_success = 0;
// 错误信息
var fail_msg = "";

var resultPath = RPAFilePath + "nest_result_rpa.txt";
//确保日志目录存在
files.ensureDir(resultPath);


var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';


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


// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
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
sleep(random(8000, 10000))


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
    throw new Error("未检测到TikTok安装，脚本终止。");
}

forceStop_APP(targetPackageName)
sleep(3000)

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



//点击首页的右上角Search按钮
function click_home_search_btn(){
    var find_search_btn_count = 0
    if(find_search_btn_count > 5){
        console.error("首页寻找'搜索'按钮超过5次，抛出异常")
        throw new Error("首页寻找'搜索'按钮超过5次，抛出异常")
    }
    sleep(random(2000, 5000))

    var gz5_img_count = 0
    var targetGz5 = null; // 用于存储第二个gz5按钮
    
    var allImages = className("android.widget.ImageView").find();
    if (allImages && allImages.size() > 0) {
        taskLog("找到ImageView的总数量：" + allImages.size());
        
        for (var i = 0; i < allImages.size(); i++) {
            var img = allImages.get(i);
            if (img) {
                taskLog("第" + (i+1) + "个Image控件-Text：" + img.text() + ";ID = " + img.id());
                
                //fullId("com.zhiliaoapp.musically:id/h0i")
                //fullId("com.ss.android.ugc.trill:id/h0j")
                if (img.id() == (GLOBAL_TikTokPackageName+":id/h0i") || img.id() == (ASIA_TikTokPackageName+":id/h0j")) {
                    gz5_img_count++;
                    taskLog("这是第" + gz5_img_count + "个h0i按钮");
                    
                    // 获取父容器信息
                    var parent = img.parent();
                    taskLog("父容器类型：" + parent.className());
                    taskLog("父容器ID：" + parent.id());
                    
                    var bounds = img.bounds();
                    taskLog("元素位置：left=" + bounds.left + 
                           ", top=" + bounds.top + 
                           ", right=" + bounds.right + 
                           ", bottom=" + bounds.bottom);
                    
                    // 存储第二个gz5按钮
                    if(gz5_img_count == 2) {
                        targetGz5 = img;
                        break; // 找到第二个后就退出循环
                    }
                }
            }
        }
        
        // 点击第二个gz5按钮
        if(targetGz5) {
            taskLog("找到第二个gz5按钮，准备点击");
            var bounds = targetGz5.bounds();
            if(targetGz5.clickable()){
                targetGz5.click();
            } else {
                click(bounds.centerX(), bounds.centerY());
            }
            return;
        }
    }
    
    //如果没找到合适的按钮，尝试滑动
    taskLog("没有找到第二个gz5按钮，准备滑动屏幕");
    swipe_to_up();
    find_search_btn_count++;
    
    sleep(random(2000, 5000));
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
    var allButtons = className("android.widget.Button").find();
    if (allButtons && allButtons.size() > 0) {
        for (var i = 0; i < allButtons.size(); i++) {
            var btn = allButtons.get(i);
            if (btn) {
                // taskLog("找到Button控件-Text：" + btn.text() + ";ID = " + btn.id());
                
                // fullId("com.zhiliaoapp.musically:id/tk1")
                // fullId("com.ss.android.ugc.trill:id/tk4")
                if (btn.id() == (GLOBAL_TikTokPackageName +":id/tk1") || btn.id() == (ASIA_TikTokPackageName +":id/tk4")) {
                    // 正确调用bounds()方法并点击
                    toast("找到Button控件: 第二个页面的搜索框！" );

                    var bounds = btn.bounds();
                    click(bounds.centerX(), bounds.centerY());
                    // 找到并点击后可以跳出循环
                    break;
                }
            }
        }
    }
    sleep(random(2000, 5000))
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


//通过Button的Text
function find_btn_Text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){


    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("循环已执行3次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }

         // 查找控件
         var button1 = className("android.widget.Button").text(findText_ZH_CN).findOne(1000);
         var button2 = className("android.widget.Button").text(findText_ZH_TW).findOne(1000);
         var button3 = className("android.widget.Button").text(findText_EN_US).findOne(1000);

         if (button1) {
             taskLog("找到" + findText_ZH_CN);
             taskLog("找到button1 = " + button1.clickable() );
            //  clickText(findText_ZH_CN)
            //  click(button1.bounds().centerX(), button1.bounds().centerY())

             var X1 = button1.bounds().centerX();
             var Y1 = button1.bounds().centerY();
             
             // 验证 X 和 Y 是否为正数
             if (X1 >= 0 && Y1 >= 0) {
                click(X1, Y1)
             }else{
                taskLog("坐标无效，中心点X或Y为负值: X=" + X1 + ", Y=" + Y1);
             }
             break; // 跳出循环
         }else if(button2){
             taskLog("找到" + findText_ZH_TW);
             taskLog("找到button2 = " + button2.clickable() );

            //  clickText(findText_ZH_TW)
            var X2 = button2.bounds().centerX();
            var Y2 = button2.bounds().centerY();
            
            // 验证 X 和 Y 是否为正数
            if (X2 >= 0 && Y2 >= 0) {
               click(X2, Y2)
            }else{
               taskLog("坐标无效，中心点X或Y为负值: X=" + X2 + ", Y=" + Y2);
            }
             break; // 跳出循环
         }else if(button3){
             taskLog("找到" + findText_EN_US);
            //  clickText(findText_EN_US)
            var X3 = button3.bounds().centerX();
            var Y3 = button3.bounds().centerY();
            taskLog("找到button3 X= " + X3);
            taskLog("找到button3 Y= " + Y3);

            // 验证 X 和 Y 是否为正数
            if (X3 >= 0 && Y3 >= 0) {
               click(X3, Y3)
            }else{
               taskLog("坐标无效，中心点X或Y为负值: X=" + X3 + ", Y=" + Y3);
            }
             break; // 跳出循环
         }
         sleep(4000)

     }
}







//通过TextView的text
function find_textview_text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

    //是否找到该TextView，找到：true / 未找到：false
    var findText_result = false


    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 6) {
             // 打印一条消息并退出循环
             taskLog("循环已执行6次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }

         // 查找控件
        var button1 = className("android.widget.TextView").text(findText_ZH_CN).findOne(1000);
        var button2 = className("android.widget.TextView").text(findText_ZH_TW).findOne(1000);
        var button3 = className("android.widget.TextView").text(findText_EN_US).findOne(1000);

        if (button1) {
            taskLog("找到" + findText_ZH_CN);
            taskLog("找到button1 = " + button1.clickable() );

            var X1 = button1.bounds().centerX();
            var Y1 = button1.bounds().centerY();
            
            // 验证 X 和 Y 是否为正数
            if (X1 >= 0 && Y1 >= 0) {
               click(X1, Y1)
            }else{
               taskLog("坐标无效，中心点X或Y为负值: X=" + X1 + ", Y=" + Y1);
            }
            break; // 跳出循环
        }else if(button2){
            taskLog("找到" + findText_ZH_TW);
            taskLog("找到button2 = " + button2.clickable() );

           //  clickText(findText_ZH_TW)
           var X2 = button2.bounds().centerX();
           var Y2 = button2.bounds().centerY();
           
           // 验证 X 和 Y 是否为正数
           if (X2 >= 0 && Y2 >= 0) {
              click(X2, Y2)
           }else{
              taskLog("坐标无效，中心点X或Y为负值: X=" + X2 + ", Y=" + Y2);
           }
            break; // 跳出循环
        }else if(button3){
            taskLog("找到" + findText_EN_US);
           //  clickText(findText_EN_US)
           var X3 = button3.bounds().centerX();
           var Y3 = button3.bounds().centerY();
           taskLog("找到button3 X= " + X3);
           taskLog("找到button3 Y= " + Y3);

           // 验证 X 和 Y 是否为正数
           if (X3 >= 0 && Y3 >= 0) {
              click(X3, Y3)
           }else{
              taskLog("坐标无效，中心点X或Y为负值: X=" + X3 + ", Y=" + Y3);
           }
            break; // 跳出循环
        }

         sleep(1000)

     }
     return findText_result
}

//获取需要关注的用户数量
function get_TT_Like_User_COUNT(){
    let Like_User_COUNT = 0;
    const file = new java.io.File(TT_Like_User_COUNT);
    if (file.exists() && file.isFile()) {
        try {
            // 读取文件内容
            const reader = new java.io.BufferedReader(new java.io.FileReader(file));
            let line;
            while ((line = reader.readLine()) !== null) {
                Like_User_COUNT = line;
            }
            reader.close();
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
        }
    } else {
        // 如果文件不存在，将文件名添加到数组中
        Like_User_COUNT = 0;
    }
    
    return Like_User_COUNT
}


try{
    
    taskLog("打开TikTok成功，首页会停留10-15秒...")
    sleep(random(10000, 15000))


    // 用于存储评论的数组
    let comments = [];
    // 检查文件是否存在
    taskLog("关注关键词 =  " + TT_Like_User_ID_KEYWORD)
    taskLog("关注用户数量 =  " + TT_Like_User_COUNT)
    const file = new java.io.File(TT_Like_User_ID_KEYWORD);
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
        comments.push(TT_Like_User_ID_KEYWORD);
    }

    if(comments.includes("$${T")){ 
        throw_error_storage_not_enough()
    }

    // 如果TT_Like_User_ID_KEYWORD等于'off'
    if (TT_Like_User_ID_KEYWORD.trim().toLowerCase() == 'off') {
        comments = [];
    }

    taskLog("可用的关注关键词, 一共的数量有： " + comments.length);

    taskLog("开始点击首页搜索按钮")
    click_home_search_btn()
    sleep(random(2000, 4000))

    // 按照顺序开始执行搜索User-ID
    toast("- 找到可用的搜索关键词, 一共的数量有： " + comments.length);
    if (comments.length > 0) {
        taskLog("- 找到可用的搜索关键词, 开始搜索观看 - ");
        for (var randIdx = 0; randIdx < comments.length; randIdx++) {
            var commentText = comments[randIdx];
            taskLog("- 找到可用的搜索关键词: "+commentText+", 开始搜索 - ");
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


                    // var Like_User_COUNT = get_TT_Like_User_COUNT();
                    var Like_User_COUNT = TT_Like_User_COUNT;
                    var total_target = Like_User_COUNT; // 此次需要关注的用户数量



                    taskLog("此次需要关注的用户数量：" + Like_User_COUNT);
                    if(Like_User_COUNT <= 0) {
                        throw new Error("需要关注的用户数量为0，无法关注，所以报错")
                    }
                    //按照要求的数量，开始准备关注用户
                    if(Like_User_COUNT > 0) {
                        // 当前已关注的用户数量
                        var currentFollowCount = 0;
                        // 滑动次数计数
                        var scrollCount = 0;
                        // 最大滑动次数
                        const MAX_SCROLL_COUNT = 15;

                        // 只要没达到目标关注数量且未超过最大滑动次数，就继续执行
                        while(currentFollowCount < Like_User_COUNT && scrollCount < MAX_SCROLL_COUNT) {
                            taskLog("当前已关注数量：" + currentFollowCount + "，目标数量：" + Like_User_COUNT);
                            
                            //直接在当前页面，找到Follow按钮，然后点击关注
                            var allButtons = className("android.widget.Button").find();
                            taskLog("找到的按钮数量：" + allButtons.size());
                            
                            var foundFollowButtonInCurrentPage = false;
                            
                            // 遍历当前页面的所有按钮
                            for(var k = 0; k < allButtons.size(); k++) {
                                if(currentFollowCount >= Like_User_COUNT) {
                                    taskLog("已达到目标关注数量，停止任务！");
                                    Nest_ScreenCapture()
                                    sleep(random(3000, 5000))
                                    break;
                                }

                                var button = allButtons.get(k);
                                if(button) {
                                    // taskLog("当前Button Text: " + button.text() );
                                    if(Object.values(FOLLOW_TEXT).includes(button.text())) {
                                        foundFollowButtonInCurrentPage = true;
                                        
                                        // 获取按钮的边界
                                        var bounds = button.bounds();
                                        var centerX = bounds.centerX();
                                        var centerY = bounds.centerY();
                                        
                                        // 检查坐标值是否有效
                                        if(centerX > 0 && centerY > 0 && centerX < device.width && centerY < device.height) {
                                            taskLog("准备点击按钮，坐标：(" + centerX + ", " + centerY + ")");
                                            taskLog("按钮边界信息：left=" + bounds.left + ", top=" + bounds.top + 
                                                  ", right=" + bounds.right + ", bottom=" + bounds.bottom);
                                            
                                            click(centerX, centerY);
                                            currentFollowCount++;
                                            total_success++;
                                            taskLog("完成第 " + currentFollowCount + " 个关注，总共成功关注：" + total_success + " 个");
                                            sleep(random(3000, 5000));
                                            

                                        } else {
                                            taskLog("警告：按钮坐标无效！坐标：(" + centerX + ", " + centerY + ")，设备屏幕：(" + device.width + " x " + device.height + ")");
                                        }
                                    }
                                }
                            }

                            // 如果当前页面没有找到可关注的按钮，或者还没达到目标数量，就往下滑动
                            if(!foundFollowButtonInCurrentPage || currentFollowCount < Like_User_COUNT) {
                                scrollCount++;
                                taskLog("往下滑动第 " + scrollCount + " 次");
                                // 确保滑动的起点和终点都在屏幕范围内
                                var startY = Math.floor(device.height * 0.7);  // 起点在屏幕70%位置
                                var endY = Math.floor(device.height * 0.3);    // 终点在屏幕30%位置
                                var centerX = Math.floor(device.width / 2);    // 水平中心点
                                
                                taskLog("开始滑动，起点坐标：(" + centerX + ", " + startY + ")，终点坐标：(" + centerX + ", " + endY + ")");
                                swipe(centerX, startY, centerX, endY, 1000);
                                sleep(random(2000, 3000));
                            }

                            // 如果达到最大滑动次数但还未完成目标，提示用户
                            if(scrollCount >= MAX_SCROLL_COUNT && currentFollowCount < Like_User_COUNT) {
                                taskLog("已达到最大滑动次数（" + MAX_SCROLL_COUNT + "次），但只完成了 " + currentFollowCount + " 个关注，任务终止！");
                                break;
                            }
                        }
                    }



                }
            }


        }
        
    }else{
        Nest_ScreenCapture()
        sleep(random(3000, 5000))
        taskLog("- 没有可用的搜索关键词, 忽略 - ");
        throw new Error("没有可用的搜索关键词，无法关注，所以报错")
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
    stopAccessibilityMonitor();
}
