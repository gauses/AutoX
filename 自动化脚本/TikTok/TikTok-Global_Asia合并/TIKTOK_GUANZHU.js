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

//会在在无障碍服务启动后继续运行。
auto.waitFor();


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
    taskLog("准备强杀:" + packageName + "...")
    sleep(1000);
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


//输入需要关注的用户ID之后，找到第一个User的LinearLayout
function click_LinearLayout_GUANZHU(){

    sleep(random(2000, 5000))
    var allLinearLayout = className("android.widget.LinearLayout").find();
    if (allLinearLayout && allLinearLayout.size() > 0) {
        for (var i = 0; i < allLinearLayout.size(); i++) {
            var linearLayout = allLinearLayout.get(i);
            if (linearLayout) {
                taskLog("找到linearLayout控件-Text：" + linearLayout.text() + ";ID = " + linearLayout.id());
                
				//fullId("com.zhiliaoapp.musically:id/iz8")
                //fullId("com.ss.android.ugc.trill:id/iz9")

                if (linearLayout.id() == (GLOBAL_TikTokPackageName +":id/iz8") || linearLayout.id() == (ASIA_TikTokPackageName +":id/iz9")) {
                    var linearLayout_click = clickId(linearLayout.id())
                    if (linearLayout_click) {
                        taskLog("找到LinearLayout控件:开始点击第一个" );
                        break;
                }
                
            }
        }
    }
    sleep(random(2000, 5000))
}
}


//进入个人主页之后，查看是否已经是关注状态了
function click_LinearLayout_GUANZHU_IN_Author_Page(commentText){

    sleep(random(2000, 5000))
    //className("android.widget.TextView")
    var allTextView = className("android.widget.TextView").find();
    if (allTextView && allTextView.size() > 0) {
        for (var i = 0; i < allTextView.size(); i++) {
            var textView = allTextView.get(i);
            if (textView) {
                // taskLog("找到textView控件-Text：" + textView.text() + ";ID = " + textView.id());
                
				//fullId("com.zhiliaoapp.musically:id/dmt")
                //fullId("com.ss.android.ugc.trill:id/dmu")

                if (textView.id() == (GLOBAL_TikTokPackageName +":id/dmt") || textView.id() == (ASIA_TikTokPackageName +":id/dmu")) {
                    taskLog("找到TextView控件:开始点击第一个， textView = " + commentText + "， textView.text() = " + textView.text() );

                        if(Object.values(FOLLOW_TEXT).includes(textView.text())) {
                            taskLog("找到关注按钮，开始点击：" +  commentText + "， textView.text() = " + textView.text())
                            var textView_click = clickId(textView.id())

                            total_success++;
                            taskLog("成功关注数量更新为：" + total_success);   

                            Nest_ScreenCapture()
                            sleep(random(3000, 5000))

                            break;

                        }
                        // else if(Object.values(FOLLOWING_LIST_TEXT).includes(textView.text())) {
                        //     fail_msg += commentText + "已经关注了，直接跳过" + "\n";
                        //     taskLog(commentText + "已经关注了，直接跳过")
                        //     break;
                            
                        // }
                        
                        else{
                            fail_msg += commentText + "已经关注了，直接跳过" + "\n";
                            taskLog(commentText + "已经关注了，直接跳过")
                            break;
                        }

                    }
            }
        }
    }
    sleep(random(2000, 5000))
}




function click_back_btn(){
    // 获取所有相同id的控件（
    let targets = id("arv").find();
    // 通过索引获取指定的那个，比如第二个就是[1]
    let target = targets[0];
    if (target) {
        taskLog("已经找到返回按钮 " )
        // 获取控件的坐标信息
        let bounds = target.bounds();
        
        // 计算控件中心点坐标
        let centerX = bounds.centerX();
        let centerY = bounds.centerY();
        
        // 使用click函数模拟点击中心点位置
        taskLog("已经找到返回按钮 centerX = " +centerX)
        taskLog("已经找到返回按钮 centerY = " +centerY)
        click(centerX, centerY);
        
        // 或者使用press函数来模拟按压
        // press(centerX, centerY, 100); // 100是按压时长(毫秒)
    }else{
        taskLog("没有找到首页搜索确认按钮,所以直接back " )
        back()
    }

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
    var path = RPAFilePath + "/nestshot_" + Date.now() + ".png";
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

                    click_LinearLayout_GUANZHU()

                    sleep(random(3000, 5000))

                    click_LinearLayout_GUANZHU_IN_Author_Page(commentText)
                    sleep(random(3000, 5000))
                    
                    sleep(random(3000, 5000))
                    back()
                    sleep(random(3000, 5000))
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
}
