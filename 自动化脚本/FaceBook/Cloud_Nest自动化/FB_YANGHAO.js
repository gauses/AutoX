// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Facebook首页点赞 + 留言*************************
//******************************************************************


//******************************************************************
//***********************全局日志拦截器*************************
//******************************************************************

// 保存原始的console.log方法
var originalConsoleLog = console.log;

// 全局日志配置（稍后会在文件路径定义后更新）
var GLOBAL_LOG_CONFIG = {
    enabled: true,
    logToFile: true,
    logToConsole: true,
    logFilePath: "/sdcard/Download/log/temp_global.log"  // 临时路径，稍后会更新
};

// // 重写console.log方法，使其同时输出到控制台和文件
// console.log = function() {
//     // 调用原始的console.log方法
//     if (GLOBAL_LOG_CONFIG.logToConsole) {
//         originalConsoleLog.apply(console, arguments);
//     }
    
//     // 将日志写入文件
//     if (GLOBAL_LOG_CONFIG.logToFile && GLOBAL_LOG_CONFIG.enabled) {
//         try {
//             // 确保日志目录存在
//             files.ensureDir("/sdcard/Download/log/");
            
//             // 将参数转换为字符串
//             var logMessage = Array.prototype.slice.call(arguments).map(function(arg) {
//                 return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
//             }).join(' ');
            
//             // 添加时间戳
//             var timestamp = getSystemDate("df");
//             var logContent = timestamp + ": " + logMessage + "\n";
            
//             // 写入文件
//             files.append(GLOBAL_LOG_CONFIG.logFilePath, logContent);
            
//         } catch(e) {
//             // 如果写入失败，至少输出到控制台
//             originalConsoleLog("日志写入文件失败：" + e);
//         }
//     }
// };




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"



//用户需要输入的评论内容
const FB_Like_Count = "$${點讚機率}" //点赞概率
const FB_Comment_Count = "$${留言機率}" //评论概率
const FB_input_text = '$${T_FB_輸入留言內容}';
const FB_input_Count = "$${FB_動態頁瀏覽次數}"


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

const SEND_TEXT = {
    ZH_CN: "发送",      // 简体中文
    ZH_TW: "傳送",      // 繁体中文
    EN_US: "Send"         // 英文
};

const LIKE_TEXT = {
    ZH_CN: "Like",      // 简体中文
    ZH_TW: "讚",      // 繁体中文
    EN_US: "Like"         // 英文 
};

const LIKE_TEXT_END = {
    ZH_TW: "按住即可對留言傳達心情", // 繁体中文
};


const COMMENT_TEXT = {
    ZH_CN: "Comment",      // 简体中文
    ZH_TW: "留言",      // 繁体中文
    EN_US: "Comment"         // 英文
};

const LIKE_TEXT_LIST = {
    ZH_TW: "傳達了心情",      // 简体中文
    EN_US: "others reacted",      // 繁体中文
    EN_US_01: "reacted",         // 英文
    EN_US_02: "You and others"         // 英文

};


// 需要关注的总数
var total_target = 0;
// 成功关注的数量
var total_success = 0;
// 错误信息
var fail_msg = "";


// 计算循环次数
const loopTimes = FB_input_Count;
taskLog("自定義瀏覽总执行次数：" + loopTimes + "次");
total_target = loopTimes

var FacebookPackageName = 'com.facebook.katana';


//保证Java层和JS代码两边的日志文件一致
//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var RPAFilePath = "/sdcard/Download/log/";
// 如果目录存在且有内容就删除
if (files.exists(RPAFilePath)) {
    files.removeDir(RPAFilePath);
}
//日志文件路径
var logFilePath = RPAFilePath + taskLogFileName;
//确保日志目录存在
files.ensureDir(RPAFilePath);

// 更新全局日志配置，使用与taskLog相同的日志文件路径
GLOBAL_LOG_CONFIG.logFilePath = logFilePath;

//执行结果文件路径
var resultPath = RPAFilePath + "nest_result_rpa.txt";
//确保日志目录存在
files.ensureDir(resultPath);


//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();

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
taskLog("准备启动Facebook...")

var targetPackageName = null;
var targetClassName = null;

function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}


//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
events.on('exit', function(){

    taskLog("脚本执行结束，准备关闭日志窗口...");
    // openLogActivity();
    
    console.hide()
    sleep(1000)

    if(handleErrorFlag){
        taskLogError("-----------------脚本执行出现异常---------------");
        taskLogError("Facebook首页点赞 + 留言---------------");
        taskLogError("脚本执行时间：" + new Date().toLocaleString());
    }else{
        taskLog("-----------------脚本功能执行结束：---------------");
        taskLog("Facebook首页点赞 + 留言---------------");
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



// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
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


function openFacebookLink_test(fbUrl){
    taskLog("准备打开链接 = " + fbUrl)
    
    // 通用的打开方法
    function tryOpenUrl(uri, methodName) {
        taskLog("尝试方法: " + methodName)
        try {
            var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
            intent.setData(android.net.Uri.parse(uri));
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.setPackage("com.facebook.katana");
            
            app.startActivity(intent);
            sleep(3000) // 等待页面加载
            
            if(checkUserPageLoaded()) {
                taskLog(methodName + "打开成功并验证页面加载完成");
                return true;
            } else {
                taskLog(methodName + "打开但页面未正确加载");
            }
        } catch (e) {
            taskLog(methodName + "失败: " + e);
        }
        return false;
    }
    
    // profile.php 格式，直接使用标准 Intent
    if(fbUrl.includes("profile.php")) {
        taskLog("检测到 profile.php 格式链接")
        return tryOpenUrl(fbUrl, "标准Intent");
    }
    
    // 用户名格式链接（不包含特殊路径）
    if(fbUrl.includes("facebook.com/") && 
       !fbUrl.includes("profile.php") && 
       !fbUrl.includes("share/") && 
       !fbUrl.includes("groups/") &&
       !fbUrl.includes("watch/")) {
        
        var username = fbUrl.split("facebook.com/")[1].split("?")[0].replace(/\//g, "");
        taskLog("检测到用户名格式链接，用户名: " + username)
        
        // 依次尝试3种方法
        var methods = [
            { uri: "fb://profile/" + username, name: "深度链接" },
            { uri: "fb://facewebmodal/f?href=" + encodeURIComponent(fbUrl), name: "WebModal" },
            { uri: fbUrl, name: "标准Intent" }
        ];
        
        for(var i = 0; i < methods.length; i++) {
            if(tryOpenUrl(methods[i].uri, methods[i].name)) {
                return true;
            }
        }
    }
    
    // 所有方法都失败
    taskLog("所有方法都失败，跳过链接 = " + fbUrl);
    return false;
}

// 验证用户页面是否正确加载
function checkUserPageLoaded() {
    taskLog("验证页面是否正确加载...")
    sleep(2000)
    
    // 检查是否存在关注/追蹤/讚按钮（说明是用户页面）
    var followBtn = className("android.widget.Button").desc("追蹤").exists() ||
                    className("android.widget.Button").desc("Follow").exists() ||
                    className("android.widget.Button").desc("讚").exists() ||
                    className("android.widget.Button").desc("Like").exists() ||
                    className("android.view.View").desc("追蹤").exists() ||
                    className("android.view.View").desc("Follow").exists() ||
                    className("android.view.View").desc("Like").exists() ||
                    //text("Add friend") 
                    className("android.view.View").desc("Add friend").exists() ||
                    className("android.widget.Button").desc("Add friend").exists() ||
                    // desc("加朋友")
                    className("android.view.View").desc("加朋友").exists() ||
                    className("android.widget.Button").desc("加朋友").exists()
                    

    
    if(followBtn) {
        taskLog("页面验证成功：找到追蹤/讚按钮")
        return true
    }
    
    taskLog("页面验证失败：未找到追蹤/讚按钮")
    return false
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



//跳转到Watch页面
function jump_to_watch_page(){
    openFacebookLink_test("fb://watch")

    var swipeCount = random(5, 8)
    for(let i = 0; i < swipeCount; i++){
        taskLog("watch页面滑动观看次数：" + (i + 1) + "/" + swipeCount)
        swipe_up()
        sleep(random(5000, 8000))
    } 

}


//打开好友列表
function jump_to_friends_page(){
    openFacebookLink_test("fb://friends")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//打开通知列表
function jump_to_notifications_page(){
    openFacebookLink_test("fb://notifications")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//搜索关键词
function search_keyword(keyword){
    openFacebookLink_test("fb://search?q=" + keyword)
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//打开动态首页
function jump_to_home_page(){
    openFacebookLink_test("fb://feed")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//打开群组列表
function jump_to_groups_page(){
    openFacebookLink_test("fb://groups")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//打开好友请求列表
function jump_to_friends_requests_page(){
    openFacebookLink_test("fb://friends/requests")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}


//打开活动列表
function jump_to_events_page(){
    openFacebookLink_test("fb://events")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}


//打开消息列表
function jump_to_messages_page(){
    openFacebookLink_test("fb://messages")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}


//打开页面列表
function jump_to_pages_page(){
    openFacebookLink_test("fb://pages")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//随机跳转页面的功能封装
function random_jump_pages(options) {
    // 如果没有传入options，使用空对象
    options = options || {};
    
    // 默认配置
    var minJumps = options.minJumps || 3;           // 最少跳转页面数
    var maxJumps = options.maxJumps || 5;           // 最多跳转页面数
    var keywords = options.keywords || ["lolita", "fashion", "style", "beauty"]; // 搜索关键词池
    var sleepTimeMin = (options.sleepTime && options.sleepTime.min) || 3000;    // 最小等待时间
    var sleepTimeMax = (options.sleepTime && options.sleepTime.max) || 5000;    // 最大等待时间
    var swipeCountMin = (options.swipeOptions && options.swipeOptions.count && options.swipeOptions.count.min) || 1;  // 最少滑动次数
    var swipeCountMax = (options.swipeOptions && options.swipeOptions.count && options.swipeOptions.count.max) || 3;  // 最多滑动次数
    
    // 随机确定本次跳转的页面数量
    var jumpCount = random(minJumps, maxJumps);
    
    // 随机选择一个搜索关键词
    var keyword = keywords[Math.floor(Math.random() * keywords.length)];

    taskLog("开始随机跳转到各个页面，计划跳转" + jumpCount + "个页面")

    // 定义所有可能的跳转操作
    const jumpOperations = [
        {
            name: "Watch页面",
            func: jump_to_watch_page
        },
        {
            name: "好友列表页面",
            func: jump_to_friends_page
        },
        {
            name: "通知列表页面",
            func: () => {
                jump_to_notifications_page();
                search_keyword(keyword);
            }
        },
        {
            name: "群组页面",
            func: jump_to_groups_page
        },
        {
            name: "好友请求页面",
            func: jump_to_friends_requests_page
        },
        {
            name: "活动页面",
            func: jump_to_events_page
        },
        {
            name: "消息页面",
            func: jump_to_messages_page
        },
        {
            name: "页面列表页面",
            func: jump_to_pages_page
        }
    ];

    // 参数验证
    if (jumpCount > jumpOperations.length) {
        jumpCount = jumpOperations.length;
        taskLog("警告：请求的跳转页面数量超过可用页面数量，已自动调整为" + jumpCount);
    }

    // 随机打乱数组
    let shuffledOperations = jumpOperations.slice();
    for (let i = shuffledOperations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOperations[i], shuffledOperations[j]] = [shuffledOperations[j], shuffledOperations[i]];
    }

    // 选择指定数量的操作执行
    for (let i = 0; i < jumpCount; i++) {
        const operation = shuffledOperations[i];
        taskLog("跳转到" + operation.name);
        operation.func();
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

function clickId(a) {
    for (obj_ID = id(a).boundsInside(5, 5, device.width-5, device.height-5); obj_ID.find().empty(); ) sleep(1e3);
    X = obj_ID.find().get(0).bounds().centerX(), Y = obj_ID.find().get(0).bounds().centerY(),
    Deviation = random(-10, 10), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
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
    // //将task的截图上报
    // var res = http.postMultipart(url, {
    //     taskId: "xxxxxxxxxxx",
    //     file: open("/sdcard/Download/" + taskLogImgName)
    // });
    // log(res.body.string());

    console.hide()
    forceStop_APP(FacebookPackageName)
    sleep(3000)

}



//从评论列表数组中，随机挑选一条内容
function get_post_text(){
    // 用于存储用户的数组
    let comments = [];
    // 户是否存在
    const file = new java.io.File(FB_input_text);
    if (file.exists() && file.isFile()) {
        try {
            // 读取文件内容
            const reader = new java.io.BufferedReader(new java.io.FileReader(file));
            let line;
            while ((line = reader.readLine()) !== null) {
                // 去除首尾空格后判断是否为空行
                if (line.trim() !== "") {
                    comments.push(line);
                }
            }
            reader.close();
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
        }
    } else {
        // 如果文件不存在，将文件名添加到数组中
        comments.push(FB_input_text);
    }    
    return comments
}



function swipe_up(options){
    //如果没有传入options，使用空对象
    options = options || {};
    
    //默认配置
    var startYPercent = options.startYPercent || 0.9;    // 起点Y位置（屏幕高度的百分比）
    var endYPercent = options.endYPercent || 0.1;      // 终点Y位置（屏幕高度的百分比）
    var maxOffsetX = options.maxOffsetX || 0.2;       // 最大X轴偏移量（屏幕宽度的百分比）
    var durationFirst = (options.duration && options.duration.first) || 700;  // 第一段滑动持续时间
    var durationSecond = (options.duration && options.duration.second) || 700; // 第二段滑动持续时间
    var durationThird = (options.duration && options.duration.third) || 600;  // 第三段滑动持续时间
    var interval = options.interval || 200;         // 段与段之间的间隔时间
    var endDelay = options.endDelay || random(2000, 3000);  // 滑动完成后的等待时间
    
    var screenHeight = device.height;
    var screenWidth = device.width;
    var startY = Math.floor(screenHeight * startYPercent);
    var endY = Math.floor(screenHeight * endYPercent);
    var distance = startY - endY;
    
    // 随机生成X轴偏移量，使滑动轨迹更自然
    var offsetX = screenWidth * maxOffsetX * (Math.random() > 0.5 ? 1 : -1);
    var centerX = screenWidth / 2;
    
    try {
        // 第一段：偏向一侧
        swipe(
            centerX,
            startY,
            centerX + offsetX,
            startY - distance/3,
            durationFirst
        );
        sleep(interval);
        
        // 第二段：偏向另一侧
        swipe(
            centerX + offsetX,
            startY - distance/3,
            centerX - offsetX,
            startY - distance*2/3,
            durationSecond
        );
        sleep(interval);
        
        // 第三段：回到中间
        swipe(
            centerX - offsetX,
            startY - distance*2/3,
            centerX,
            endY,
            durationThird
        );
        
        // 等待滑动完成
        sleep(endDelay);
        return true;
    } catch(e) {
        taskLog("滑动失败：" + e.message);
        return false;
    }
}




//强制停止
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



function click_send_button(){

    var isSuccess = false
    //发送
    sleep(random(2000, 3000))
    var clickSendTextBtn = findTextByLanguages(SEND_TEXT)
    sleep(random(2000, 3000))

    if(!clickSendTextBtn){

        //直接点击最后一个按钮
        var nextBtnList = className("android.widget.Button").find();
            if(nextBtnList && nextBtnList.size() > 0){
                nextBtnList.get(nextBtnList.size() - 1).click(); //直接点击最后一个按钮
                sleep(random(3000, 5000))
            }else{
                isSuccess = false
            }

    }else{
        isSuccess = false
    }

    return isSuccess

}


//找到当前页面是否有相同的评论内容，如果有，则不进行评论，返回true，否则返回false
function find_same_post_text(postText){
    //className("android.view.ViewGroup") desc("容易髒污變黃。")
    //找到所有可见的ViewGroup，分析出desc的文本内容，如果存在相同的文本内容，则返回true，否则返回false
    //postText 内容就是需要评论的内容 使用get_all_groups_comment_text()函数获取，返回的是数组
    var viewGroupList = className("android.view.ViewGroup").find()
    if(viewGroupList && viewGroupList.length > 0) {
        // 限制最多检查的元素数量，避免性能问题
        var maxCheckCount = Math.min(viewGroupList.length, 50); // 最多检查50个元素
        var checkedCount = 0;
        
        for(var i = 0; i < viewGroupList.length && checkedCount < maxCheckCount; i++) {
            var viewGroup = viewGroupList[i]
            
            // 只处理可见的 ViewGroup，跳过不可见的元素
            try {
                if(!viewGroup.visibleToUser()) {
                    continue; // 跳过不可见的元素
                }
            } catch(e) {
                // 如果 visibleToUser() 方法不存在或出错，尝试检查 bounds
                try {
                    var bounds = viewGroup.bounds();
                    if(!bounds || bounds.width() <= 0 || bounds.height() <= 0) {
                        continue; // 跳过无效或不可见的元素
                    }
                } catch(e2) {
                    continue; // 如果检查失败，跳过该元素
                }
            }
            
            checkedCount++; // 增加已检查的可见元素计数
            
            var descText = viewGroup.desc() || ""
            
            // postText 是数组，需要检查数组中是否有元素等于或包含 descText
            if(Array.isArray(postText)) {
                // 跳过空字符串或过短的 descText，避免误匹配
                if(!descText || descText.trim() === "" || descText.trim().length < 2) {
                    continue; // 跳过这个 viewGroup，继续检查下一个
                }
                
                // 检查数组中是否有任何元素等于 descText（精确匹配）
                if(postText.includes(descText)) {
                    taskLog("找到相同的评论内容: " + descText)
                    return true
                }
                
                // 或者检查数组中是否有任何元素包含 descText（部分匹配）
                // 只有当 descText 长度足够时才进行部分匹配，避免误匹配
                if(descText.trim().length >= 1) {
                    for(var j = 0; j < postText.length; j++) {
                        if(postText[j] && typeof postText[j] === 'string' && postText[j].includes(descText)) {
                            taskLog("找到相同的评论内容（部分匹配）: " + descText)
                            return true
                        }
                    }
                }
            } else if(postText && typeof postText === 'string') {
                // 如果 postText 是字符串，直接比较
                // 跳过空字符串或过短的 descText，避免误匹配
                if(!descText || descText.trim() === "" || descText.trim().length < 3) {
                    continue; // 跳过这个 viewGroup，继续检查下一个
                }
                if(postText.includes(descText)) {
                    taskLog("找到相同的评论内容: " + descText)
                    return true
                }
            }
        }
    }
    taskLog("未找到相同的评论内容")
    return false


}


//找到当前页面是否有相同的点赞内容，如果有，则不进行点赞，返回true，否则返回false
function find_same_like_text(likeText){
    //检查是不是已经点赞过
    //className("android.view.ViewGroup") desc("你和其他1人都傳達了心情")
    //className("android.view.ViewGroup") desc("吴烽傳達了心情")
    //className("android.view.ViewGroup") desc("You and 18 others reacted")
    //className("android.view.ViewGroup") desc("You and others")
    //className("android.view.ViewGroup") desc("郭芷涵 reacted")

    //检查ViewGroup的desc，只要包含了以下字段即可，不需要完全一致 :LIKE_TEXT_LIST
    var viewGroupList = className("android.view.ViewGroup").find()
    if(viewGroupList && viewGroupList.length > 0) {
        for(var i = 0; i < viewGroupList.length; i++) {
            var viewGroup = viewGroupList[i]
            
            // 只处理可见的 ViewGroup，跳过不可见的元素
            try {
                if(!viewGroup.visibleToUser()) {
                    continue; // 跳过不可见的元素
                }
            } catch(e) {
                // 如果 visibleToUser() 方法不存在或出错，尝试检查 bounds
                try {
                    var bounds = viewGroup.bounds();
                    if(!bounds || bounds.width() <= 0 || bounds.height() <= 0) {
                        continue; // 跳过无效或不可见的元素
                    }
                } catch(e2) {
                    continue; // 如果检查失败，跳过该元素
                }
            }
            
            var descText = viewGroup.desc() || ""
            
            // 检查 descText 是否包含 LIKE_TEXT_LIST 中的任何一个值
            if(descText && descText.trim() !== "") {
                for(var key in LIKE_TEXT_LIST) {
                    if(LIKE_TEXT_LIST.hasOwnProperty(key)) {
                        var likeText = LIKE_TEXT_LIST[key];
                        if(likeText && descText.includes(likeText)) {
                            taskLog("找到点赞内容: " + descText , "直接退出点赞功能")
                            return true
                        }
                    }
                }
            }
        }
    }   
    taskLog("未找到点赞内容")
    return false


}





try{

    if (isAppInstalled(FacebookPackageName)) {
        targetPackageName = FacebookPackageName;
        targetClassName = "com.facebook.katana.activity.FbMainTabActivity";
        taskLog("检测到已安装Facebook，准备启动...");
    } else {
        toast("未检测到Facebook已安装，请先安装Facebook！");
        taskLog("未检测到Facebook已安装，脚本终止。");
        exit();
    }
    
    sleep(random(3000, 5000))
    forceStop_APP(targetPackageName)
    sleep(3000)
    
    app.startActivity({
        action: "android.intent.action.VIEW",
        packageName: targetPackageName,
        className: targetClassName
    });

    taskLog("评论概率：" + FB_Comment_Count)
    taskLog("点赞概率：" + FB_Like_Count)
    
    
    // 开始主循环
    var commentTextArrays = get_post_text()
    
    if(commentTextArrays.includes("$${T")){ 
        throw_error_storage_not_enough()
    }

    
    
    // 执行随机跳转（默认跳转3个页面）
    // random_jump_pages()
    
    // jump_to_home_page()
    sleep(random(3000, 5000))
    // swipe_up()
    // sleep(random(5000, 8000))
    // random_jump_pages()
    // sleep(random(5000, 8000))
    // jump_to_home_page()
    // sleep(random(3000, 5000))

    taskLog("评论文案个数：" + commentTextArrays.length)
    taskLog("循环次数：" + loopTimes)


    for(let currentLoop = 1; currentLoop <= loopTimes; currentLoop++) {
        toast("开始第 " + currentLoop + "/" + loopTimes + " 次执行");    
        // sleep(random(3000, 5000))
    
        
        // if(currentLoop % 5 == 0){
        //     random_jump_pages()
        // }
        // jump_to_home_page()
    
    
        toast("开始模拟滑动")
        swipe_up()
    
    
        // sleep(5000)
    
        //检查是不是有点赞按钮
        var likeBtnList = className("android.widget.Button").find();
        if(likeBtnList.size() > 0){
            for(var i = 0; i < likeBtnList.size(); i++) {
                var likeBtn = likeBtnList.get(i);
                if(likeBtn){
                    var descText = likeBtn.desc() || "";
                    if (Object.values(LIKE_TEXT).some(text => descText.startsWith(text)) 
                        || Object.values(LIKE_TEXT_END).some(text => descText.includes(text)))  {


                        if(find_same_like_text(LIKE_TEXT_LIST)){
                            taskLog("找到相同的点赞内容，直接退出点赞功能")
                        }else{
                            total_success++
                            taskLog("通过点赞按钮，检查total_success = " + total_success )

                            if (Math.random() * 100 < FB_Like_Count)  {
                                taskLog("开始触发点赞概率")
                                click(likeBtn.bounds().centerX() , likeBtn.bounds().centerY())  
                                sleep(random(2000, 4000))
                            }else{
                                taskLog("虽然找到点赞按钮，没有触发点赞概率")
                            }


                        }

                        
    
                    }else if(Object.values(COMMENT_TEXT).some(text => descText.startsWith(text))){
    
                        if (Math.random() * 100 < FB_Comment_Count)  { 
    
                            if(FB_input_text && 
                                FB_input_text.trim() !== "" && 
                                FB_input_text.trim().toLowerCase() !== "off" && 
                                !FB_input_text.includes("$${")){
    
                                    if(commentTextArrays.length > 0){
    
                                        click(likeBtn.bounds().centerX() , likeBtn.bounds().centerY())  
                                        sleep(random(3000, 5000))

                                        //寻找当前页面是否有重复的评论内容
                                        var findSamePostText = find_same_post_text(commentTextArrays)
                                        if(findSamePostText){
                                            taskLog("找到相同的评论内容，直接退出评论，直接进行下一个Link的任务")
                                            sleep(random(3000, 5000))
                                            back()
                                            sleep(random(3000, 5000))
                                            back()
                                        }else{
                                                        
                                            var randIdx = random(0, commentTextArrays.length - 1)
                                            var messageText = commentTextArrays[randIdx];
                                
                                            toast("评论文案：" + messageText)
                                            sleep(random(2000, 3000))
                                
                                            var autoCompleteTextViews = className("android.widget.AutoCompleteTextView").find();
                                            if(autoCompleteTextViews.size() > 0 ){
                                                for(var j = 0; j < autoCompleteTextViews.size(); j++) {
                                                    var textView = autoCompleteTextViews.get(j);
                                                    if(textView) {

                                                        taskLog("找到AutoCompleteTextView控件-Text："+ textView.text());
                                                        sleep(random(1000, 2000))
                                                        textView.setText(messageText)
                                                    }
                                                }
                                            }
                                    
                                            //发送
                                            click_send_button()
                                            
                                            sleep(random(3000, 5000))
                                            back() //键盘收起

                                            sleep(random(2000, 3000))
                                            back() //返回上一个页面



                                        }


            
                                    }else{
                                        taskLog("评论文案为空，所以不点击评论按钮");
                                    }
    
                                }else{
                                    taskLog("没有填写输入内容或者输入内容有误，所以跳过输入内容")
                                }
    
    
    
    
                        }else{
                            taskLog("虽然找到评论按钮，没有触发评论概率")
                        }
                        break;
    
                    }else{
                        taskLog("没有找到点赞或者评论按钮，直接下一个循环页面")
                    }
                }
            }
    
    
        }else{
            taskLog("没有找到任何ViewGroup，直接下一个循环页面")
        }
    
        if(currentLoop < loopTimes) {
            taskLog("等待5秒后开始下一次循环...");
            sleep(5000);
        }
        
    }
    
    taskLog("所有循环执行完毕，准备结束任务...");
    Nest_ScreenCapture()
    sleep(random(3000, 5000))


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
    
    // 显式退出脚本，触发 exit 事件
    // taskLog("准备退出脚本...");
    forceStop_APP(targetPackageName)
}

