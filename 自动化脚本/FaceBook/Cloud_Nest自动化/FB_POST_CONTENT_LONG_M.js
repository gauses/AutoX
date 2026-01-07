// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Facebook個人發文（长文本，将txt文本分段）*************************
//该脚本用于https://cloud.nestbrowser.com/#/tk/accounts的自动化
//******************************************************************

// 刷新媒体库：
// adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download


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
const FB_input_text = '$${T_FB_输入文案}'; //用户需要输入的评论内容，就是T开头
const FB_input_IMAGE = '$${M_FB_图片地址}'; //用户需要输入的图片地址，就是M开头

// 配置对象
var CONFIG = {

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

    // 日志配置
    LOG: {
        FILENAME: "nest_task_log.txt",
        IMG_NAME: "nest_task_log.png"
    }

}


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


// 定义发布按钮文本
const SEND_TEXT = {
    ZH_CN: "发布",      // 简体中文
    ZH_TW: "發佈",      // 繁体中文
    EN_US: "Post"         // 英文
}



const POST_TO_EVERYONE_NEXT = {
    ZH_CN: "下一步",      // 简体中文
    ZH_TW: "繼續",      // 繁体中文
    EN_US: "NEXT"         // 英文
}

// 定义分享對象文本
const POST_TO_EVERYONE_TEXT = {
    ZH_CN: "所有人",      // 简体中文
    ZH_TW: "所有人",      // 繁体中文
    EN_US: "Public"         // 英文
}

// 定义分享對象文本
const POST_TO_EVERYONE_TEXT_DONE = {
    ZH_CN: "完成",      // 简体中文
    ZH_TW: "完成",      // 繁体中文
    EN_US: "Done"         // 英文
}

//POST_TO_EVERYONE_TEXT_FINISHED
const POST_TO_EVERYONE_TEXT_FINISHED = {
    ZH_CN: "完成",      // 简体中文
    ZH_TW: "完成",      // 繁体中文
    EN_US: "Done"         // 英文
}

// 需要的执行次数总数
var total_target = 0;
// 成功的数量
var total_success = 0;
// 错误信息
var fail_msg = "";


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




var FacebookPackageName = 'com.facebook.katana';
//将需要处理的多媒体图片，单独copy一份放到这个文件夹里面，后面处理完成之后，再删除这个文件夹
var A_NEST_FaceBook_MEDIA = 'A_NEST_FaceBook_MEDIA'; 

//选中图片时候，包含视频的个数这样来决定需要sleep多长时间
var containVideoCount  = 0


//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();
// 工具函数库
var Utils = {
    // 重试装饰器
    withRetry: function(fn, maxRetries, delay) {
        maxRetries = maxRetries || CONFIG.RETRY.MAX_ATTEMPTS;
        delay = delay || CONFIG.RETRY.DELAY;
        
        return function() {
            var args = Array.prototype.slice.call(arguments);
            for (var i = 0; i < maxRetries; i++) {
                try {
                    return fn.apply(this, args);
                } catch (error) {
                    if (i === maxRetries - 1) throw error;
                    taskLog("重试第" + (i + 1) + "次: " + error.message);
                    sleep(delay * (i + 1));
                }
            }
        };
    },

    // 智能等待元素
    waitForElement: function(selector, timeout, interval) {
        timeout = timeout || CONFIG.TIMEOUTS.LONG;
        interval = interval || 500;
        
        var startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            var element = selector.findOne(interval);
            if (element) return element;
        }
        throw new Error("元素未找到，超时" + timeout + "ms");
    },

    // 统一的多语言点击函数
    clickByText: function(texts, elementType) {
        elementType = elementType || "Button";
        // 使用新的findTextByLanguages函数
        return findTextByLanguages(texts);
    },

    // 安全的坐标点击
    safeClick: function(x, y, deviation) {
        deviation = deviation || 2;
        var finalX = Math.max(0, x + random(-deviation, deviation));
        var finalY = Math.max(0, y + random(-deviation, deviation));
        
        try {
            device.sdkInt < 24 ? ra.tap(finalX, finalY) : click(finalX, finalY);
            return true;
        } catch (e) {
            taskLog("点击操作失败：" + e.message);
            return false;
        }
    },

    // 清理资源
    cleanup: function() {
        // 清理临时文件
        var tempFolder = CONFIG.PATHS.DOWNLOAD + CONFIG.PATHS.TEMP_MEDIA;
        if (files.exists(tempFolder)) {
            files.removeDir(tempFolder);
            taskLog("清理临时文件夹完成");
        }
        
        // 清理缓存
        elementCache.clear();
        
        // 强制垃圾回收
        if (typeof gc === 'function') {
            gc();
        }
    }
};

//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
events.on('exit', function () {
    console.hide()
    sleep(1000)
    taskLog("-----------------脚本执行结束：---------------");
    taskLog("Facebook個人發文以及图片---------------");
    taskLog("脚本执行时间：" + new Date().toLocaleString());

    if (handleErrorFlag) {
        taskLogError("-----------------脚本执行出现异常---------------");
        taskLogError("Facebook個人發文以及图片---------------");
        taskLogError("脚本执行时间：" + new Date().toLocaleString());
    } else {
        taskLog("-----------------脚本功能执行结束：---------------");
        taskLog("Facebook個人發文以及图片---------------");
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
    handleErrorFlag = true;

    // 记录失败信息（只记录一次）
    var errorInfo = "错误信息：" + e.message + " | 错误堆栈：" + e.stack;
    fail_msg += (fail_msg ? "; " : "") + errorInfo;

    // 在出现异常时进行截图
    try {
        taskLog("检测到异常，开始截图记录错误状态...");
        var errorScreenshotPath = Nest_ScreenCapture();
        taskLog("异常截图已保存：" + errorScreenshotPath);
        fail_msg += "异常截图路径：" + errorScreenshotPath;
    } catch (screenshotError) {
        taskLog("异常截图失败：" + screenshotError.message);
        fail_msg += "异常截图失败：" + screenshotError.message;
    }

    forceStop_APP(targetPackageName);
    taskLogError("===错误报告开始===");
    fail_msg += "错误信息：" + e + "\n"; 
    taskLogError("错误信息：" + e);
    fail_msg += "错误堆栈：" + e.stack + "\n";
    taskLogError("错误堆栈：" + e.stack);
    fail_msg += "===错误报告结束===" + "\n";
    taskLogError("===错误报告结束===");
    fail_msg += "===错误报告结束===" + "\n";
    taskLogError("脚本执行Error时间：" + new Date().toLocaleString());

    // 在异常退出前保存统计结果
    try {
        var result = {
            total_target: total_target,
            total_success: total_success,
            fail_msg: fail_msg
        };
        taskLog("异常情况统计结果：" + JSON.stringify(result, null, 2));
        files.write(resultPath, JSON.stringify(result, null, 2));
        taskLog("已保存异常统计结果到：" + resultPath);
    } catch(saveError) {
        console.error("保存异常统计结果失败：" + saveError.message);
    }

    Utils.cleanup();
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
        //确保目录存在（使用文件路径，ensureDir会自动创建其父目录）
        files.ensureDir(logFilePath);
        
        //将日志写入文件
        var logContent = getSystemDate("df") + ":" + "【!!!ERROR!!!】" + _log + "\n";
        // var logContent = "【!!!ERROR!!!】" + _log + "\n";
        files.append(logFilePath, logContent);

    } catch(e) {
        console.error("写入日志文件失败：" + e);
    }
}

//可能会出现权限弹窗，如果弹出，那么允许
function click_permission_allow(){
    taskLog("开始处理权限问题.....");
    
    // 定义权限相关的文本配置
    var PERMISSION_TEXTS = {
        // 简体中文权限文本
        ZH_CN: {
            ALLOW: ["仅在使用该应用时允许", "仅限这一次", "允许"],
            DENY: ["不允许"]
        },
        // 繁体中文权限文本
        TW: {
            ALLOW: ["使用應用程式時", "僅允許這一次", "允許"],
            DENY: ["不允許"]
        },
        // 英文权限文本
        EN: {
            ALLOW: ["WHILE USING THE APP", "ONLY THIS TIME", "ALLOW"],
            DENY: ["DON'T ALLOW"]
        }
    };
    
    // 快速检查并点击权限按钮
    function quickClickPermission() {
        // 查找所有可能的权限按钮
        var allButtons = className("android.widget.Button").find();
        var allTextViews = className("android.widget.TextView").find();
        
        // 合并所有文本元素
        var allElements = [];
        for (var i = 0; i < allButtons.size(); i++) {
            allElements.push(allButtons.get(i));
        }
        for (var i = 0; i < allTextViews.size(); i++) {
            allElements.push(allTextViews.get(i));
        }
        
        // 快速遍历查找权限相关按钮
        for (var k = 0; k < allElements.length; k++) {
            var element = allElements[k];
            if (!element || !element.clickable()) continue;
            
            var text = element.text();
            if (!text) continue;
            
            // 检查是否包含允许相关的文本
            var isAllowText = false;
            // 检查简体中文
            for (var m = 0; m < PERMISSION_TEXTS.ZH_CN.ALLOW.length; m++) {
                if (text.includes(PERMISSION_TEXTS.ZH_CN.ALLOW[m])) {
                    isAllowText = true;
                    break;
                }
            }
            // 检查繁体中文
            if (!isAllowText) {
                for (var n = 0; n < PERMISSION_TEXTS.TW.ALLOW.length; n++) {
                    if (text.includes(PERMISSION_TEXTS.TW.ALLOW[n])) {
                        isAllowText = true;
                        break;
                    }
                }
            }
            // 检查英文
            if (!isAllowText) {
                for (var o = 0; o < PERMISSION_TEXTS.EN.ALLOW.length; o++) {
                    if (text.includes(PERMISSION_TEXTS.EN.ALLOW[o])) {
                        isAllowText = true;
                        break;
                    }
                }
            }
            
            // 检查是否包含拒绝相关的文本
            var isDenyText = false;
            // 检查简体中文
            for (var p = 0; p < PERMISSION_TEXTS.ZH_CN.DENY.length; p++) {
                if (text.includes(PERMISSION_TEXTS.ZH_CN.DENY[p])) {
                    isDenyText = true;
                    break;
                }
            }
            // 检查繁体中文
            if (!isDenyText) {
                for (var q = 0; q < PERMISSION_TEXTS.TW.DENY.length; q++) {
                    if (text.includes(PERMISSION_TEXTS.TW.DENY[q])) {
                        isDenyText = true;
                        break;
                    }
                }
            }
            // 检查英文
            if (!isDenyText) {
                for (var r = 0; r < PERMISSION_TEXTS.EN.DENY.length; r++) {
                    if (text.includes(PERMISSION_TEXTS.EN.DENY[r])) {
                        isDenyText = true;
                        break;
                    }
                }
            }
            
            // 如果是允许按钮且不是拒绝按钮，则点击
            if (isAllowText && !isDenyText) {
                taskLog("找到权限按钮: " + text);
                element.click();
                return true;
            }
        }
        
        return false;
    }
    
    // 使用快速检查方法，最多尝试3次
    for (var i = 0; i < 5; i++) {
        if (quickClickPermission()) {
            taskLog("权限处理成功");
            return;
        }
        sleep(random(1000, 2000)); // 短暂等待后重试
    }
    
    taskLog("未找到权限弹窗，继续执行");
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


// 通过语言对象查找文本
function findTextByLanguages(languageObject) {
    for (let lang in languageObject) {
        let targetText = languageObject[lang];
        
        // 先尝试精确匹配
        let element = text(targetText).findOne(500);
        
        // 如果精确匹配不到，尝试忽略大小写匹配
        if (!element) {
            // 使用正则表达式进行大小写不敏感匹配
            let regexPattern = "(?i)^" + targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$";
            element = textMatches(regexPattern).findOne(500);
            if (element) {
                taskLog("通过忽略大小写找到文本：" + targetText + " | 实际文本：" + element.text());
            }
        } else {
            taskLog("找到文本：" + targetText);
        }
        
        if (element) {
            if (element.clickable()) {
                element.click();
                return true;
            } else {
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

function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}

function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}

// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
}


function post_Image(){
    taskLog("FB_input_IMAGE的实际值: " + FB_input_IMAGE)
    
    // 检查是否是有效的图片路径（不是模板字符串且文件存在）
    if(FB_input_IMAGE && 
        FB_input_IMAGE.trim() !== "" && 
        FB_input_IMAGE.trim().toLowerCase() !== "off" && 
        !FB_input_IMAGE.includes("$${")){

            refreshMedia("/storage/emulated/0/Download/")
            //FB_input_IMAGE的实际值: /sdcard/Download/01
            var transferImage = transferHeadImageToNest(FB_input_IMAGE)

            if(transferImage){

                //className("android.widget.Button").desc("Photo/video").findOne().click()
                taskLog("准备点击 - 相片／影片....")
                find_btn_desc_base({ texts: ["Photo/video", "相片／影片", "圖庫", "Gallery"] })
                sleep(random(3000, 5000))

                //点击权限

                taskLog("准备检查权限....")
                find_btn_desc_base({ texts: ["Allow access", "允許存取"] })

                //再次点击权限
                // className("android.widget.Button") text("允許") clickable("true")
                find_btn_Text_base( "允許", "ALLOW")
                sleep(3000)

                sleep(random(1000, 2000))
                taskLog("开始处理权限问题，系统弹窗.....");
                click_permission_allow();
                sleep(CONFIG.TIMEOUTS.SHORT);


                className("android.widget.GridView").findOne().children().forEach(child => {
                    var target = child.findOne(className("android.widget.Spinner"));
                    if(target == null){
                        taskLog("未找到target控件，跳过");
                        return;
                    }
                    target.click();
                    sleep(5000)


                    //点击对应的targetPath：A_NEST_FaceBook_MEDIA
                    var allListTextView = className("android.view.ViewGroup").find();
                    taskLog("找到allListTextView: 全部 = "  + allListTextView.size());
                    if (allListTextView && allListTextView.size() > 0) {
                        for (var i = 0; i < allListTextView.size(); i++) {
                            var listTextView = allListTextView.get(i);
                            if (listTextView) {
                                taskLog("找到listTextView控件-Text：" + listTextView.desc());
                                
                                // 检查text是否为"A_NEST_TikTok_MEDIA"
                                if (listTextView.desc() != null && listTextView.desc().includes("A_NEST_FaceBook_MEDIA")) {
                                    // 正确调用bounds()方法并点击
                                    taskLog("找到对应目录" + listTextView.desc());
                                    var bounds = listTextView.bounds();
                                    if (isFullyVisible(bounds)) {
                                        click(bounds.centerX(), bounds.centerY());
                                        taskLog("点击坐标：" + bounds.centerX() + ", " + bounds.centerY());
                                    } else {
                                        // 可选：点击可见区域的某个点，比如top+10, left+10
                                        let x = Math.min(bounds.centerX(), device.width - 10);
                                        let y = Math.min(bounds.top + 10, device.height - 10);
                                        click(x, y);
                                        taskLog("点击部分可见图片的坐标：" + x + ", " + y);
                                    }
                                    // 找到并点击后可以跳出循环
                                    break;
                                }
                            }
                        }
                    }

                    sleep(random(3000, 5000))


                    //选择图片 - desc("選擇多個")
                    find_btn_desc_base({ texts: ["Select multiple", "選擇多個"] })
                    sleep(random(3000, 5000))

                    //选中所有图片（支持滑动选取，使用 bounds 唯一标识）
                    let selectedSet = new Set();
                    let tryCount = 0;
                    while (true) {
                        let gridView = className("android.widget.GridView").findOne();
                        let children = gridView.children();
                        let newSelected = 0;
                        for (let i = 0; i < children.size(); i++) {
                            let child = children.get(i);
                            let button = child.findOne(className("android.widget.Button"));
                            if (!button) continue;
                            let buttonDesc = button.desc();
                            let boundsStr = JSON.stringify(button.bounds());
                            if (selectedSet.has(boundsStr)) continue; // 跳过已选
                            taskLog("buttonDesc: " + buttonDesc + "，button.selected(): " + button.selected());
                            //影片：desc("在6月 27, 2025 03:22拍攝的影片")  - desc("Video taken on Jun 27, 2025 15:25")

                            if(buttonDesc.indexOf("Video taken on") !== -1 || buttonDesc.indexOf("影片") !== -1){
                                containVideoCount++;
                            }


                            if (buttonDesc.indexOf("Photo taken on") !== -1 || buttonDesc.indexOf("的相片") !== -1 || buttonDesc.indexOf("影片") !== -1 || buttonDesc.indexOf("Video taken on") !== -1) {
                                if(button.selected() === false){
                                    let bounds = button.bounds();
                                    let safePoint = getSafeClickPoint(bounds);
                                    if (safePoint) {
                                        click(safePoint.x, safePoint.y);
                                        taskLog("点击最上方可见点：" + safePoint.x + ", " + safePoint.y);
                                    } else {
                                        taskLog("Button完全不可见，跳过点击：" + JSON.stringify(bounds));
                                    }
                                    newSelected++;
                                    selectedSet.add(boundsStr);
                                }
                                sleep(1000); // 不要太长
                            }
                        }
                        if (newSelected === 0) {
                            tryCount++;
                            if (tryCount >= 3) break;
                        } else {
                            tryCount = 0;
                        }
                        swipe_up();
                        sleep(3000); // 加长等待
                    }



                    //点击Nest
                    //className("android.widget.Button").desc("Next").findOne().click()
                    //desc("繼續")
                    find_btn_desc_base({ texts: ["Next", "繼續"] })
                    sleep(random(3000, 5000))

                });

            }else{
                taskLog("转移图片失败，停止上传图片")
            }



            

            
        }
}

// 刷新指定路径的媒体库
function refreshMedia(path) {
    taskLog("开始刷新媒体库，用时5秒钟....")
    // 发送媒体扫描广播
    media.scanFile(path);
    // 等待扫描完成
    sleep(5000);
}

//转移头像图片到Nest临时文件夹（支持文件夹批量处理或单个文件，返回true/false）
function transferHeadImageToNest(inputPath){
    //inputPath: /sdcard/Download/01 (文件夹) 或 /sdcard/Download/xxx.jpg (单个文件)
    
    // 统一路径格式，去除末尾斜杠
    if (inputPath.endsWith("/")) {
        inputPath = inputPath.slice(0, -1);
    }
    // 兼容 /sdcard 和 /storage/emulated/0
    if (inputPath.startsWith("/sdcard/")) {
        inputPath = inputPath.replace("/sdcard/", "/storage/emulated/0/");
    }

    function getParentDir(path) {
        let idx = path.lastIndexOf("/");
        if (idx === -1) return "";
        return path.substring(0, idx);
    }
    
    function getFileName(path) {
        let idx = path.lastIndexOf("/");
        if (idx === -1) return path;
        return path.substring(idx + 1);
    }

    function copyDir(src, dest) {
        // 确保目录存在（路径需要以/结尾）
        files.ensureDir(dest + "/");
        
        let filesList = files.listDir(src);
        // 空值检查
        if (!filesList || filesList.length === 0) {
            taskLog("源文件夹为空或无法读取: " + src);
            return true; // 空文件夹也算复制成功
        }
        
        for (let i = 0; i < filesList.length; i++) {
            let name = filesList[i];
            let srcPath = src + "/" + name;
            let destPath = dest + "/" + name;
            if (files.isDir(srcPath)) {
                if (!copyDir(srcPath, destPath)) return false;
            } else {
                try {
                    files.copy(srcPath, destPath);
                } catch(e) {
                    console.error("复制文件失败: " + srcPath + " -> " + destPath + "，错误：" + e);
                    return false;
                }
            }
        }
        return true;
    }

    const parentDir = getParentDir(inputPath); // /storage/emulated/0/Download
    const newFolder = parentDir + "/A_NEST_FaceBook_MEDIA";

    taskLog("准备复制: " + inputPath + " -> " + newFolder);
    taskLog("files.exists结果: " + files.exists(inputPath));
    taskLog("files.isDir结果: " + files.isDir(inputPath));

    // 判断原路径是否存在
    if (!files.exists(inputPath)) {
        // 检查目标文件夹是否已存在（可能是上次运行的结果）
        if (files.exists(newFolder) && files.isDir(newFolder)) {
            // 如果原路径看起来像单个文件（有扩展名），检查目标文件夹里是否有这个文件
            var fileName = getFileName(inputPath);
            var destFilePath = newFolder + "/" + fileName;
            if (fileName.indexOf(".") > 0 && files.exists(destFilePath)) {
                taskLog("原文件不存在，但目标文件已存在，可能是上次运行的结果：" + destFilePath);
                return true;
            }
            // 目标文件夹存在但没有对应文件，也认为是上次运行的结果（可能是文件夹复制的情况）
            taskLog("原路径不存在，但目标文件夹已存在，可能是上次运行的结果，继续执行");
            return true;
        }
        console.error("原路径不存在: " + inputPath);
        toast("原路径不存在: " + inputPath);
        return false;
    }

    // 如果目标文件夹已存在，先删除
    if (files.exists(newFolder)) {
        try {
            files.removeDir(newFolder);
            taskLog("已删除原有目标文件夹: " + newFolder);
        } catch(e) {
            console.error("删除原有目标文件夹失败: " + e);
            return false;
        }
    }
    
    // 确保目标文件夹存在
    files.ensureDir(newFolder + "/");

    // 判断是文件还是文件夹
    if (files.isDir(inputPath)) {
        // 是文件夹，递归复制
        taskLog("检测到文件夹，开始递归复制...");
        if (!copyDir(inputPath, newFolder)) {
            console.error("递归复制文件夹失败");
            return false;
        }
        taskLog("复制文件夹成功: " + newFolder);

        // 删除原文件夹
        try {
            files.removeDir(inputPath);
            taskLog("删除原文件夹成功: " + inputPath);
        } catch(e) {
            console.error("删除原文件夹失败: " + e);
        }
    } else {
        // 是单个文件，复制单个文件
        taskLog("检测到单个文件，开始复制...");
        let fileName = getFileName(inputPath);
        let destPath = newFolder + "/" + fileName;
        try {
            files.copy(inputPath, destPath);
            taskLog("复制文件成功: " + destPath);
        } catch(e) {
            console.error("复制文件失败: " + inputPath + " -> " + destPath + "，错误：" + e);
            return false;
        }

        // // 删除原文件
        // try {
        //     files.remove(inputPath);
        //     taskLog("删除原文件成功: " + inputPath);
        // } catch(e) {
        //     console.error("删除原文件失败: " + e);
        // }

    }

    // 刷新媒体库
    refreshMedia(newFolder);

    return true;
}



//无论成功或者失败，最后截图一张
function saveImg(){
    taskLog("开始截图...");

    var toPath = "/sdcard/Download/" + taskLogImgName ;
    if (files.exists(toPath) ){
        taskLog("旧图片文件存在，删除");
        files.remove(toPath);
    } else {
        taskLog("旧图片文件存在");
    }


    if(!requestScreenCapture()){
        taskLog("请求截图失败...");
        toast("请求截图失败");
    }else{
        toast("请求截图");
    }
    //截图并保存
    taskLog("请求截图开始保存...");
    images.saveImage(captureScreen(), toPath);
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



//通过Button的Text（支持多语言）
function find_btn_Text_base(findText_ZH_TW, findText_EN_US, findText_ZH_CN) {
    var texts = [findText_ZH_TW, findText_EN_US, findText_ZH_CN].filter(Boolean);
    
    for (var loopCount = 1; loopCount <= 3; loopCount++) {
        taskLog(texts[0] + " - 循环寻找执行：" + loopCount);
        
        for (var i = 0; i < texts.length; i++) {
            var btn = className("android.widget.Button").text(texts[i]).findOne(1000);
            if (btn) {
                taskLog("找到按钮: " + texts[i] + "，clickable=" + btn.clickable());
                btn.click();
                return true;
            }
        }
        sleep(1000);
    }
    
    taskLog("循环查找按钮已执行3次，未找到目标按钮");
    return false;
}

// 调试：打印界面上所有按钮的信息
function debugButtons() {
    var buttons = className("android.widget.Button").find();
    taskLog("界面上共有 " + buttons.length + " 个Button");
    buttons.forEach(function(btn, index) {
        taskLog("按钮[" + index + "] text=" + btn.text() + " | desc=" + btn.desc());
    });
    
    // 也检查一下 TextView（很多"按钮"实际上是 TextView）
    var textViews = className("android.widget.TextView").find();
    taskLog("界面上共有 " + textViews.length + " 个TextView");
    textViews.forEach(function(tv, index) {
        var t = tv.text();
        if (t && (t.indexOf("post") >= 0 || t.indexOf("贴文") >= 0 || t.indexOf("Post") >= 0)) {
            taskLog("TextView[" + index + "] text=" + t + " | desc=" + tv.desc());
        }
    });
}

//通过Button的Desc（支持多语言，动态参数）
// 参数: options = { texts: ["English", "繁體中文", "简体中文", ...] }
function find_btn_desc_base(options) {
    // debugButtons();
    var texts = (options.texts || []).filter(Boolean); // 过滤空值
    taskLog("待查找的语言文本数量: " + texts.length + " | 内容: " + JSON.stringify(texts));
    
    // 点击后等待2秒
    var clickWait = 2000;
    
    for (var loopCount = 1; loopCount <= 3; loopCount++) {
        taskLog("第 " + loopCount + " 轮查找开始");
        
        for (var i = 0; i < texts.length; i++) {
            taskLog("  正在查找[" + i + "]: " + texts[i]);
            var btn = className("android.widget.Button").descContains(texts[i]).findOne(1000);
            if (btn) {
                taskLog("找到按钮(包含): " + texts[i] + " | 实际desc: " + btn.desc());
                btn.click();
                taskLog("已点击，等待页面跳转 " + clickWait + "ms");
                sleep(clickWait);
                return true;
            }
        }
        sleep(1000);
    }
    
    taskLog("循环查找按钮已执行3次，未找到目标按钮");
    return false;
}




//从评论列表数组中，随机挑选一条内容（支持文件路径或直接文本）
function get_post_text() {
    taskLog("文案内容 = " + FB_input_text);
    
    // 如果变量未被替换（以 $${T_ 开头），说明配置有问题
    if (FB_input_text.startsWith("$${T_")) {
        throw new Error("文案变量未被正确替换，请检查配置：" + FB_input_text);
    }
    
    // 如果为空，直接返回
    if (!FB_input_text || FB_input_text.trim() === "") {
        taskLog("文案内容为空");
        return "";
    }
    
    // 判断是否是文件路径（文件存在则读取，否则当作普通文本）
    if (files.exists(FB_input_text) && files.isFile(FB_input_text)) {
        try {
            var comments = files.read(FB_input_text)
                .split('\n')
                .filter(function(line) { return line.trim() !== ""; });
            
            if (comments.length > 0) {
                var messageText = comments[random(0, comments.length - 1)];
                taskLog("从文件随机挑选的内容：" + messageText);
                return messageText;
            }
            taskLog("文件内容为空");
            return "";
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
            return "";
        }
    }
    
    // 不是文件路径，直接返回文本内容
    taskLog("直接使用文本内容：" + FB_input_text);
    return FB_input_text;
}



//获取text文件的全部内容
function get_all_Txt_post_text() {
    taskLog("文案内容 = " + FB_input_text);
    
    // 如果变量未被替换（以 $${T_ 开头），说明配置有问题
    if (FB_input_text.startsWith("$${T_")) {
        throw new Error("文案变量未被正确替换，请检查配置：" + FB_input_text);
    }
    
    // 如果为空，直接返回
    if (!FB_input_text || FB_input_text.trim() === "") {
        taskLog("文案内容为空");
        return "";
    }
    
    // 处理换行符：将字符串形式的 \n 转换为真正的换行符
    function processLineBreaks(text) {
        return text.replace(/\\n/g, "\n");
    }
    
    // 判断是否是文件路径（文件存在则读取，否则当作普通文本）
    if (files.exists(FB_input_text) && files.isFile(FB_input_text)) {
        try {
            var content = files.read(FB_input_text);
            if (content && content.trim() !== "") {
                taskLog("读取文件全部内容，长度：" + content.length);
                return content; // 文件读取的内容已经包含真正的换行符
            }
            taskLog("文件内容为空");
            return "";
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
            return "";
        }
    }
    
    // 不是文件路径，处理换行符后返回文本内容
    var processedText = processLineBreaks(FB_input_text);
    taskLog("直接使用文本内容：" + processedText);
    return processedText;
}



//从评论列表数组中，随机挑选一条内容, 读取txt的全部文本内容
function read_FB_input_text(){

    //输入文案
    let postContent = "";
    const file = new java.io.File(FB_input_text);
    if (file.exists() && file.isFile()) {
        try {
            // 读取文件内容
            const reader = new java.io.BufferedReader(new java.io.FileReader(file));
            let lines = [];
            let line;
            while ((line = reader.readLine()) !== null) {
                lines.push(line);
            }
            reader.close();
            postContent = lines.join('\n'); // 使用换行符连接每行内容
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
        }
    } else {
        // 如果文件不存在，将输入内容本身作为文本
        postContent = FB_input_text;
    }

    return postContent
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


//删除临时图片文件夹
function delete_temp_image(folderPath) {
    taskLog("准备删除临时文件夹: " + folderPath);
    toast("准备删除临时文件夹: " + folderPath);
    
    if (!files.exists(folderPath)) {
        taskLog("文件夹不存在，无需删除");
        return;
    }

    try {
        // 删除文件夹及其所有内容
        files.removeDir(folderPath);
        taskLog("成功删除临时文件夹");
    } catch (e) {
        taskLog("删除临时文件夹时出错: " + e);
        console.error("删除临时文件夹时出错: " + e);
    }

}




function swipe_up(){
    //使用多段swipe实现曲线滑动
    let screenHeight = device.height;
    let x = device.width / 2;
    let startY = device.height * 0.7;
    let endY = device.height * 0.3;
    swipe(x, startY, x, endY, 600);
    sleep(3000); // 加长等待
}

function isFullyVisible(bounds) {
    return bounds.top >= 0 && bounds.left >= 0 &&
           bounds.right <= device.width && bounds.bottom <= device.height;
}

function getSafeClickPoint(bounds) {
    // 计算可见区域
    let left = Math.max(bounds.left, 0);
    let top = Math.max(bounds.top, 0);
    let right = Math.min(bounds.right, device.width);
    let bottom = Math.min(bounds.bottom, device.height);

    // 如果完全不可见，跳过
    if (left >= right || top >= bottom) return null;

    // 尽量点图片的上半部分中间
    let x = Math.floor((left + right) / 2);
    let y = top + 10; // 距离顶部10像素，避免点到边缘

    // 如果可见高度很小，点到最上面
    if ((bottom - top) < 20) y = top + 2;

    return { x, y };
}



try {

    total_target = 1
    
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

    sleep(random(3000, 5000))
    taskLog("打开Facebook成功...")
 
    //desc("在 Facebook 撰寫貼文")
    //desc("在想些什麽?建立貼文")
    //desc("Make a post on Facebook")
    var makePostBtn = find_btn_desc_base({ texts: ["Make a post", "貼文", "Create a post", "on your mind?"] })
    // if(!makePostBtn){
    //     throw new Error("未找到Facebook建立貼文按钮");
    // }
    sleep(random(5000, 6000))


    //新用戶可能会弹出一个新页面：查看分享對象
    //desc("繼續") - android.widget.Button
    var continueBtn = findTextByLanguages(POST_TO_EVERYONE_NEXT) 
    if(continueBtn){
        sleep(random(5000, 6000))
        //選擇所有人
        //desc("所有人") - android.view.View
        var postToEveryoneBtn = findTextByLanguages(POST_TO_EVERYONE_TEXT)
        if(!postToEveryoneBtn){
            throw new Error("查看分享對象,未找到所有人分享按钮");
        }
        sleep(random(5000, 6000))
        var postToEveryoneBtnDone = findTextByLanguages(POST_TO_EVERYONE_TEXT_DONE)
        if(!postToEveryoneBtnDone){
            throw new Error("找到完成按钮，但是沒有找到完成按鈕");
        }
        sleep(random(5000, 6000))    
    }
    

    var postContent = get_post_text()
    if(postContent.includes("$${T")){ 
        throw_error_storage_not_enough()
    }

    if(postContent && 
        postContent.trim() !== "" && 
        postContent.trim().toLowerCase() !== "off" && 
        !postContent.includes("$${")){
            taskLog("准备输入分享内容....");
            className("android.widget.AutoCompleteTextView").findOne().click()
            sleep(5000)
            className("android.widget.AutoCompleteTextView").findOne().setText("")
            sleep(5000)
            className("android.widget.AutoCompleteTextView").findOne().setText(postContent)
            sleep(random(5000, 10000))
    }else{
        taskLog("输入PO文内容是空，所以不需要输入文本")
    }

    //部分版本在輸入文本後，右上角會有一個提示按鈕：完成
    //需要點擊一下
    var completeBtn = findTextByLanguages(POST_TO_EVERYONE_TEXT_FINISHED)
    sleep(random(5000, 6000))



    //检查是否需要发图片
    post_Image()

    taskLog("准备点击下一步....");
    sleep(5000)
    //desc("下一步")
    find_btn_desc_base({ texts: ["繼續", "NEXT", "下一步"] })


    taskLog("准备点击POST....");
    sleep(5000)
    //find_viewGroup_text_base("POST", "發佈" , "發布")
    var sendBtn = findTextByLanguages(SEND_TEXT)
    if(!sendBtn){
        throw new Error("未找到发布按钮");
    }


    
    
    total_success = 1
    taskLog("等待分享结果，大约30s左右....");
    sleep(random(30000,50000))

    taskLog("包含视频的个数：" + containVideoCount)
    var sleepVideoTime = 1000
    if(containVideoCount > 0){
        taskLog("包含视频的个数：" + containVideoCount + "，所以需要sleep多长时间")
        sleepVideoTime = containVideoCount * 50000
    }else{
        taskLog("包含视频的个数：" + containVideoCount + "，所以不需要sleep多长时间")
    }
    sleep(sleepVideoTime)

    taskLog("准备截图...");
    Nest_ScreenCapture()
    sleep(random(12000, 15000))


    //删除临时图片库 :A_NEST_FaceBook_MEDIA
    delete_temp_image("/storage/emulated/0/Download/" + A_NEST_FaceBook_MEDIA)


    sleep(random(3000, 5000))

} catch(e) {
    if (e.message === "TASK_COMPLETED") {
        taskLog("任务正常完成");
    } else {
        handleError(e);
    }
}finally{
    try {
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
        
        taskLog("准备退出脚本...");
    } catch(finallyError) {
        console.error("finally块执行异常：" + finallyError.message);
    } finally {
        // 无论如何都要调用 exit() 以确保触发 events.on('exit') 回调
        exit();
    }
}