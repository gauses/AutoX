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


const TT_Watch_Author_Page= 0 //查看作者主页的概率



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
    openAppSettings(GLOBAL_TikTokPackageName)
    sleep(random(3000, 5000))

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
    openAppSettings(ASIA_TikTokPackageName)
    sleep(random(3000, 5000))

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
    taskLog("准备强杀:" + packageName + "...")
    sleep(3000);
    openAppSettings(packageName)
    sleep(5000)

    // 遍历所有可能的强制停止按钮文本
    for (let lang in FORCE_STOP_TEXT) {
        let stopText = FORCE_STOP_TEXT[lang];
        if (text(stopText).exists()) {
            let forceStopBtn = text(stopText).findOne();
            if (forceStopBtn && forceStopBtn.clickable()) {
                forceStopBtn.click();
                sleep(1000);
                
                // 遍历所有可能的确认按钮文本
                for (let confirmLang in FORCE_STOP_CONFIRM_TEXT) {
                    let confirmText = FORCE_STOP_CONFIRM_TEXT[confirmLang];
                    if (text(confirmText).exists()) {
                        text(confirmText).findOne().click();
                        taskLog("成功点击'" + stopText + "'按钮并确认");
                        sleep(3000);
                        home();
                        return;
                    }
                }
            } else {
                taskLog("未找到可点击的'" + stopText + "'按钮");
            }
        } else {
            taskLog("未找到'" + stopText + "'按钮");
        }
        sleep(1000);
    }

    // 如果所有语言都尝试失败，返回主页
    home();
}




   //点击首页的右上角Search按钮
function click_home_search_btn(){
    var find_search_btn_count = 0
    if(find_search_btn_count > 5){
        console.error("首页寻找'搜索'按钮超过5次，抛出异常")
        throw new error("首页寻找'搜索'按钮超过5次，抛出异常")
    }
    sleep(random(2000, 5000))

    var gz5_img_count = 0
    var targetGz5 = null;
    
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
                    targetGz5 = img; // 每次都赋值，最后一次就是最后一个
                    // 你可以在这里输出调试信息
                    taskLog("找到一个符合条件的h0i/h0j按钮，已暂存为targetGz5");
                }
            }
        }
        
        // 点击符合要求的gz5按钮
        if(targetGz5) {
            taskLog("找到gz5按钮，准备点击");
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
    taskLog("没有找到gz5按钮，准备滑动屏幕");
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

//点击点赞按钮
function click_Like_Btn(){
    taskLog("开始准备点赞视频")
    //fullId("com.zhiliaoapp.musically:id/e2n") 
    //fullId("com.ss.android.ugc.trill:id/e2o")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        clickId(GLOBAL_TikTokPackageName + ":id/e2n")
    }else{
        clickId(ASIA_TikTokPackageName + ":id/e2o")
    }

}

//点击评论按钮
function click_Comment_Btn(commentText){
    taskLog("开始准备评论视频")
    //fullId("com.zhiliaoapp.musically:id/cxm")
    //fullId("com.ss.android.ugc.trill:id/cxn")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        clickId(GLOBAL_TikTokPackageName + ":id/cxm")
    }else{
        clickId(ASIA_TikTokPackageName + ":id/cxn")
    }

    sleep(5000)
    var autoCompleteTextViews = className("android.widget.EditText").find();
    taskLog("autoCompleteTextViews长度 = " + autoCompleteTextViews.size())


    //如果某个tiktok视频，0评论，自己是首评，那么界面会有两个"android.widget.EditText"
    if(autoCompleteTextViews.size() >0){
        var textView = autoCompleteTextViews.get(autoCompleteTextViews.size() - 1);
        if(textView) {
            taskLog("找到TextView控件-Text："+ textView.text());
            // textView.click()
            sleep(3000)
            taskLog("评论控件，设置内容：" +commentText );
            textView.setText(commentText)
            sleep(5000)
    
    
            //发送按钮,如果某个tiktok视频，0评论，自己是首评，那么就会找不到fullId("com.zhiliaoapp.musically:id/czk")
            //所以必须要执行两次clickId(GLOBAL_TikTokPackageName + ":id/czk") ，因为0评论，和有评论的界面不一样
            // fullId("com.zhiliaoapp.musically:id/czk")
            // fullId("com.ss.android.ugc.trill:id/czl")

            if(targetPackageName == GLOBAL_TikTokPackageName){  
                clickId(GLOBAL_TikTokPackageName + ":id/czk")
            }else{
                clickId(ASIA_TikTokPackageName + ":id/czl")
            }

            sleep(random(2000, 3000))
            back()
            sleep(random(2000, 3000))
            
            if(targetPackageName == GLOBAL_TikTokPackageName){  
                clickId(GLOBAL_TikTokPackageName + ":id/czk")
            }else{
                clickId(ASIA_TikTokPackageName + ":id/czl")
            }
    
    
            sleep(random(10000, 15000))
    
    
            var clickX = device.width  - 100 ; 
            var clickY = device.width /4; 
            taskLog("开始准备点击屏幕 clickX = " + clickX)
            taskLog("开始准备点击屏幕 clickY = " + clickY)
            click(clickX, clickY);
                
                
            }
    }

    
}




//点击收藏按钮
function click_Save_Btn(){
    taskLog("开始准备收藏视频")
    //fullId("com.zhiliaoapp.musically:id/fdf")
    //fullId("com.ss.android.ugc.trill:id/fdg")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        clickId(GLOBAL_TikTokPackageName + ":id/fdf")   
    }else{
        clickId(ASIA_TikTokPackageName + ":id/fdg")
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

        if (Math.random() * 100 < TT_Watch_Author_Page)  {
            taskLog("开始触发查看作者主页的概率")
            click_Author_Page_Btn()
            sleep(random(5000, 8000))
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
                        sleep(random(5000, 8000))
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


