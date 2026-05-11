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
//***********************Tiktok关注*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"

// 需要取养号的视频总数
var total_target = 0;
// 成功取养号的视频数量
var total_success = 0;
// 错误信息
var fail_msg = "";


const USERS_TEXT = {
    ZH_CN: "账户",    // 简体中文
    ZH_TW: "帳號",    // 繁体中文
    EN_US: "Accounts"   // 英文
};


//可以点击关注的按钮文字
const FOLLOW_TEXT = {
    ZH_CN: "关注",    // 简体中文
    ZH_TW: "追蹤",    // 繁体中文
    EN_US: "Follow"   // 英文
};

//点击关注的按钮文字是关注中
const FOLLOWING_TEXT = {
    ZH_CN: "已关注",    // 简体中文
    ZH_TW: "追蹤中",    // 繁体中文 text("追蹤中")
    EN_US: "Following"   // 英文
};

//用户需要输入的关注用户ID列表
const TT_Like_User_ID_GROUP = '$${T_用户ID列表}';

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
        console.error("-----------------脚本执行出现异常---------------");
        console.error("Tiktok关注：根據關注列表UID的順序，去關注用戶---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        console.log("-----------------脚本功能执行结束：---------------");
        console.error("Tiktok关注：根據關注列表UID的順序，去關注用戶---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
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


function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(INSTAGRAM_PACKAGE_NAME)
    console.error("===错误报告开始===");
    console.error("错误信息：" + e);
    console.error("错误堆栈：" + e.stack);
    console.error("===错误报告结束===");
    exit()
}


function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}


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

// 控件文案是否与多语言表中的某一则完全一致（先 trim）
function textMatchesLanguageObject(btnText, languageObject) {
    var t = String(btnText == null ? "" : btnText).trim();
    for (var lang in languageObject) {
        if (t === languageObject[lang]) return true;
    }
    return false;
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
taskLog("准备启动Instagram...")

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
// openAppSetting(targetPackageName)
// sleep(random(3000, 5000))

forceStop_APP(targetPackageName)
sleep(3000)

sleep(1000);
auto.waitFor();
taskLog("无障碍已就绪，准备启动 Instagram");


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






//点击首页的右上角Search按钮
function click_home_search_btn(){
    //点击搜索按钮
    //fullId("com.instagram.android:id/search_tab")
    clickId("com.instagram.android:id/search_tab")
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


//输入需要关注的用户ID之后，找到第一个User的LinearLayout
//className("android.widget.Button") fullId("com.instagram.android:id/row_search_user_container") clickable("true")
//头像：(但是不能点头像，因为部分头像，点击之后，会是一个别的页面，不是主页面)
//var allButton = className("android.widget.Button").id("com.instagram.android:id/row_search_avatar_with_ring").find();
function click_LinearLayout_GUANZHU(){

    var clickSuccess = false
    sleep(random(2000, 5000))
    var allButton = className("android.widget.Button").id("com.instagram.android:id/row_search_user_container").find();
    taskLog("当前页面的用户数量 = " + allButton.size());

    if (allButton && allButton.size() > 0) {
        for (var i = 0; i < allButton.size(); i++) {
            var button = allButton.get(i);
            if (button) {
                button.click()
                clickSuccess = true
                break;
            
        }
    }
         sleep(random(2000, 5000))
    }else{
        taskLog("没有找到头像控件，直接回退上一页")
    }

    return clickSuccess

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

    var findText_result = false

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
                findText_result = true  
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
               findText_result = true
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
               findText_result = true   
            }else{
               taskLog("坐标无效，中心点X或Y为负值: X=" + X3 + ", Y=" + Y3);
            }
             break; // 跳出循环
         }
         sleep(4000)

     }

     return findText_result
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



function get_all_TT_User_ID_text(){
    let comments = [];
    // 户是否存在
    // taskLog("Ins评论数组 =  " + TT_Like_User_ID_GROUP)
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

    if (TT_Like_User_ID_GROUP.trim().toLowerCase() == 'off') {
        comments = [];
    }
    
    return comments
}


try{
    
    taskLog("打开Instagram成功，首页会停留10-15秒...")
    sleep(random(10000, 15000))


    // 如果get_all_TT_User_ID_text等于'off'，则清空用户USER_ID列表
    
    var UserIDList = get_all_TT_User_ID_text()  
    if(UserIDList.includes("$${T")){ 
        throw_error_storage_not_enough()
    }
    taskLog("可用的搜索用户ID, 一共的数量有： " + UserIDList.length);


    taskLog("开始点击首页搜索按钮")
    click_home_search_btn()
    sleep(random(2000, 4000))

    
    // 按照顺序开始执行搜索User-ID
    if (UserIDList.length > 0) {

        //要删除UserIDList中所有的空格
        UserIDList = UserIDList.map(item => item.trim());


        taskLog("- 找到可用的搜索用户ID, UserIDList.length = " + UserIDList.length);
        for (var randIdx = 0; randIdx < UserIDList.length; randIdx++) {
            var commentText = UserIDList[randIdx];
            taskLog("- 找到可用的搜索用户ID: "+commentText+", 开始搜索 - ");


            //点击顶部的搜索框
            clickId("com.instagram.android:id/action_bar_search_hints_text_layout")
            sleep(random(3000, 5000))


            var search_edit = className("android.widget.EditText").id("com.instagram.android:id/action_bar_search_edit_text").findOne()
            if(search_edit){
                taskLog("找到搜索框控件，开始点击搜索框控件")
                search_edit.click()
                sleep(random(3000, 5000))

                // 清空搜索框内容
                search_edit.setText("")
                sleep(random(3000, 5000))
                taskLog("搜索控件，设置内容：" +commentText );

                // 输入搜索内容，注意要删除@符号
                if(commentText.startsWith("@")){
                    search_edit.setText(commentText.substring(1));
                    sleep(random(3000, 5000))
                }else{
                    search_edit.setText(commentText);
                    sleep(random(3000, 5000))
                }



                //点击左上角的放大镜，进行搜索
                // className("android.widget.ImageView") : fullId("com.instagram.android:id/row_search_profile_image")
                var search_profile_image = className("android.widget.ImageView").id("com.instagram.android:id/row_search_profile_image").find()  
                if(search_profile_image.length > 0){
                    taskLog("找到搜索头像控件，开始点击搜索头像控件, search_profile_image.length = " + search_profile_image.length)
                    click(search_profile_image[0].bounds().centerX(), search_profile_image[0].bounds().centerY()) //点击第一个，而且clickable是false
                    sleep(random(3000, 5000))

                     //用户Tab按钮在不同语言下的文本
                    taskLog("开始点击用户Tab按钮")                    
                    var user_tab_btn = findTextByLanguages(USERS_TEXT)

                    if(user_tab_btn){
                        sleep(random(3000, 5000))

                        taskLog("找到用户Tab按钮，开始点击用户Tab按钮")
                        sleep(random(3000, 5000))

                        var clickHeadSuccess = click_LinearLayout_GUANZHU()
                        if(clickHeadSuccess){
                            taskLog("点击头像成功，开始点击Follow按钮")
                            sleep(random(5000, 8000))

                            //页面可能还会有很多个Textview，内容文字是Follow
                            //所以要加过滤：className("android.widget.TextView") fullId("com.instagram.android:id/profile_header_follow_button") 
                            var follow_btn = className("android.widget.TextView").id("com.instagram.android:id/profile_header_follow_button").find()
                            if(follow_btn.length > 0){
                                taskLog("找到Follow按钮，要先判断Follow按钮是否是关注中")
                                sleep(random(3000, 5000))
                                var follow_btn_text = follow_btn[0].text()
                                if(textMatchesLanguageObject(follow_btn_text, FOLLOW_TEXT)){
                                    taskLog("Follow按钮是关注，开始点击Follow按钮")
                                    follow_btn[0].click()
                                
                                }else{
                                    taskLog("Follow按钮是关注中，跳过点击Follow按钮，开始下一个用户的Follow行为！！！");
                                }
                                    sleep(random(3000, 5000))
                                    back()
                                    sleep(random(2000, 4000))
                                    continue;


                            }else{
                                taskLog("没有找到Follow按钮，终止本次操作，开始下一个用户的Follow行为！！！");
                                continue;
                            }
                        }else{
                            back()
                            sleep(random(2000, 4000))
                            taskLog("点击头像失败，终止本次操作，开始下一个用户的Follow行为！！！");
                            continue;
                        }

                    }else{
                        taskLog("没有找到用户Tab按钮，终止本次操作，开始下一个用户的Follow行为！！！");
                        continue;
                    }

                    sleep(random(3000, 5000))


                }else{
                    taskLog("没有找到搜索头像控件，终止本次操作，开始下一个用户的Follow行为！！！");
                    continue;
                }


            }else{
                taskLog("没有找到搜索框控件，终止本次操作，开始下一个用户的Follow行为！！！");
                continue;
            }


        }
        
    }else{
        toast("- 没有可用的搜索用户ID, 忽略 - ");
        throw new error("没有可用的搜索用户ID，无法关注，所以报错")
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