// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************使用购买的账号密码进行登录Tiktok*************************
//打码 ：https://www.bingtop.com/static/html/autojs.html
//购买 ：https://bingtop.com/account/index.html
//TK平台：http://www.tkyingxiao.com/accountManagement/accountNotLogin
//Nest平台：https://cloud.nestbrowser.com/#/account/used-list
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

// 重写console.log方法，使其同时输出到控制台和文件
console.log = function() {
    // 调用原始的console.log方法
    if (GLOBAL_LOG_CONFIG.logToConsole) {
        originalConsoleLog.apply(console, arguments);
    }
    
    // 将日志写入文件
    if (GLOBAL_LOG_CONFIG.logToFile && GLOBAL_LOG_CONFIG.enabled) {
        try {
            // 确保日志目录存在
            files.ensureDir("/sdcard/Download/log/");
            
            // 将参数转换为字符串
            var logMessage = Array.prototype.slice.call(arguments).map(function(arg) {
                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
            }).join(' ');
            
            // 添加时间戳
            var timestamp = getSystemDate("df");
            var logContent = timestamp + ": " + logMessage + "\n";
            
            // 写入文件
            files.append(GLOBAL_LOG_CONFIG.logFilePath, logContent);
            
        } catch(e) {
            // 如果写入失败，至少输出到控制台
            originalConsoleLog("日志写入文件失败：" + e);
        }
    }
};



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
        FORCE_STOP: {
            ZH_CN: "强行停止",
            ZH_TW: "強制停止", 
            EN_US: "FORCE STOP"
        },
        FORCE_STOP_CONFIRM: {
            ZH_CN: "确定",
            ZH_TW: "確定",
            EN_US: "OK"
        },
        CONFIRM: {
            ZH_CN: "确定",
            ZH_TW: "確定",
            EN_US: "OK"
        },
        ADD_TO_HOME_SCREEN: {
            ZH_CN: "添加到主屏幕",
            ZH_TW: "新增到主螢幕",
            EN_US: "ADD TO HOME SCREEN"
        },
        //Tiktok最右侧的Profile的按钮文字
        PROFILE_TEXT :{
            ZH_CN: "主页",    // 简体中文
            ZH_TW: "個人資料",    // 繁体中文
            EN_US: "Profile"   // 英文
        },

        //Loigin页面：切换账号类型，左侧是phone，右侧是email/username
        SWITCH_ACCOUNT_TYPE: {
            ZH_CN: "邮箱/用户名",
            ZH_TW: "電子郵件/使用者名稱",
            EN_US: "Email / Username"
        },

        // tiktok全球版：第一次打开Tiktok首页，会出现一个弹窗，提示"Agree and continue"  ：（tiktok亚洲版没有这个弹窗，不过也还是一起处理了）
        //  text("Agree and continue")
        //  text("同意並繼續")
        //  text("同意并继续")
        AGREE_AND_CONTINUE: {
            ZH_CN: "同意并继续",
            ZH_TW: "同意並繼續",
            EN_US: "Agree and continue"
        },
        //在每次刚刚打开页面的时候，可能因为手机已经有手机号码，所以会自动弹出一个有手机号码的dialog弹窗，提示使用手机号码，这里要处理一下
        //页面内容：
            //Continue with 
            //text("选择要登录的账号以继续：")
            //text("選取要登入的帳戶以繼續")
            //(212)591-1655
            //NONE OF THE ABOVE
        CONTINUE_WITH_PHONE_NUMBER: {
            ZH_CN: "选择要登录的账号以继续：",
            ZH_TW: "選取要登入的帳戶以繼續",
            EN_US: "Continue with"
        }

    },
    
    // 日志配置
    LOG: {
        FILENAME: "nest_task_log.txt",
        IMG_NAME: "nest_task_log.png"
    }
};

// 视频上传配置
// 账号----账号密码----邮箱----邮箱密码
var TT_LOGIN_ACCOUNT = '$${T_账号}';
var TT_LOGIN_PASSWORD = '$${T_账号密码}';
var TT_LOGIN_EMAIL = '$${T_邮箱}';
var TT_LOGIN_EMAIL_PASSWORD = '$${T_邮箱密码}';






// 全局变量
var targetPackageName = null;
var targetClassName = null;
var elementCache = new Map();
var handleErrorFlag = false;

// 视频上传统计参数
var total_target = 0;        // 需要上传的视频总数
var total_success = 0;       // 成功上传的视频数量
var fail_msg = "";           // 上传视频时出现的错误信息    



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

// 日志系统
var Logger = {
    levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
    currentLevel: 2,
    
    log: function(level, message, data) {
        data = data || null;
        if (this.levels[level] <= this.currentLevel) {
            var timestamp = getSystemDate("df");
            var logMessage = "[" + timestamp + "] [" + level + "] " + message;
            
            console.log(logMessage);
            if (data) console.log(JSON.stringify(data, null, 2));
            
            // 写入文件
            this.writeToFile(logMessage);
        }
    },
    
    error: function(msg, data) { 
        var timestamp = getSystemDate("df");
        var logMessage = "[" + timestamp + "] [ERROR] " + msg;
        console.error(logMessage);
        if (data) console.error(JSON.stringify(data, null, 2));
        this.writeToFile(logMessage);
    },
    warn: function(msg, data) { this.log('WARN', msg, data); },
    info: function(msg, data) { this.log('INFO', msg, data); },
    debug: function(msg, data) { this.log('DEBUG', msg, data); },
    
    writeToFile: function(message) {
        try {
            var logFile = CONFIG.PATHS.LOG_DIR + CONFIG.LOG.FILENAME;
            files.ensureDir(CONFIG.PATHS.LOG_DIR);
            files.append(logFile, message + "\n");
        } catch (e) {
            console.error("写入日志文件失败: " + e.message);
        }
    }
};

//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
events.on('exit', function(){
    console.hide();
    sleep(1000);

    if(handleErrorFlag){
        Logger.error("脚本执行出现异常");
        Logger.error("TikTok视频上传任务执行失败");
        Logger.error("脚本执行时间：" + new Date().toLocaleString());
    } else {
        forceStop_APP(targetPackageName);
        Logger.info("脚本功能执行结束");
        Logger.info("TikTok视频上传任务执行完成");
        Logger.info("脚本执行时间：" + new Date().toLocaleString());
    }
    
    // 清理资源
    Utils.cleanup();
    openLogActivity();
});



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
    Logger.error("===错误报告开始===");
    Logger.error("错误信息：" + e.message);
    Logger.error("错误堆栈：" + e.stack);
    Logger.error("===错误报告结束===");
    Logger.error("脚本执行Error时间：" + new Date().toLocaleString());

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
var currentEngine = engines.myEngine()
var runningEngines = engines.all()
var currentSource = currentEngine.getSource() + ''
if (runningEngines.length > 1) {
  for (var i = 0; i < runningEngines.length; i++) {
    var compareEngine = runningEngines[i];
    var compareSource = compareEngine.getSource() + ''
    if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
      // 强制关闭同名的脚本
      compareEngine.forceStop()
    }
  }
}

sleep(3000)
taskLog("准备启动TikTok...")



function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}

// 检测并启动TikTok应用
function detectAndStartTikTok() {
    if (isAppInstalled(CONFIG.APP.GLOBAL_PACKAGE)) {
        targetPackageName = CONFIG.APP.GLOBAL_PACKAGE;
        targetClassName = CONFIG.APP.MAIN_ACTIVITY;
        taskLog("检测到已安装全球版TikTok，准备启动...");
    } else if (isAppInstalled(CONFIG.APP.ASIA_PACKAGE)) {
        targetPackageName = CONFIG.APP.ASIA_PACKAGE;
        targetClassName = CONFIG.APP.MAIN_ACTIVITY;
        taskLog("检测到已安装亚洲版TikTok，准备启动...");
    } else {
        toast("未检测到TikTok已安装，请先安装TikTok！");
        taskLog("未检测到TikTok已安装，脚本终止。");
        throw new Error("未检测到TikTok安装，请先安装TikTok！"); 
    }

    forceStop_APP(targetPackageName);
    sleep(CONFIG.TIMEOUTS.SHORT);

    app.startActivity({
        action: "android.intent.action.VIEW",
        packageName: targetPackageName,
        className: targetClassName
    });

    taskLog("等待TikTok启动完成, 等待时间：" + (CONFIG.TIMEOUTS.MEDIUM + 2000) + "s");
    sleep(random(CONFIG.TIMEOUTS.MEDIUM + 2000, CONFIG.TIMEOUTS.LONG));
}

// 执行应用检测和启动
detectAndStartTikTok();



//******************************************************************
//******************************************************************
//******************************************************************



//使用冰拓进行打码
function save_Bingtop_Pic(){
    // 申请截图权限（会弹系统录屏权限框），重试3次
    var screenCaptureSuccess = false;
    for (var retry = 0; retry < 3; retry++) {
        if (requestScreenCapture()) {
            screenCaptureSuccess = true;
            taskLog("自动化任务-申请截图权限成功，重试次数: " + retry);
            break;
        } else {
            taskLog("自动化任务-申请截图权限失败，重试次数: " + (retry + 1));
            sleep(2000); // 等待2秒后重试
        }
    }
    
    if (!screenCaptureSuccess) {
        taskLog("自动化任务-申请截图权限最终失败");
        return null;
    }

    // 查找所有FrameLayout控件
    var frameLayouts = className("android.widget.FrameLayout").find();
    if (frameLayouts.length == 0) {
        taskLog("自动化任务-未找到FrameLayout控件");
        return null;
    }

    // 筛选出合适的FrameLayout（排除全屏的，选择中等大小的对话框）
    var frameLayout = null;
    var screenWidth = device.width;
    var screenHeight = device.height;
    var screenArea = screenWidth * screenHeight;
    
    for (var i = 0; i < frameLayouts.length; i++) {
        var bounds = frameLayouts[i].bounds();
        var area = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
        var width = bounds.right - bounds.left;
        var height = bounds.bottom - bounds.top;
        
        taskLog("FrameLayout " + i + " 位置: " + bounds.left + "," + bounds.top + "," + bounds.right + "," + bounds.bottom + " 面积: " + area);
        
        // 排除全屏的FrameLayout，选择中等大小的对话框
        // 验证码对话框通常不会占满整个屏幕，且有一定的宽高比
        if (area < screenArea * 0.8 && area > 100000 && width > 200 && height > 200) {
            taskLog("找到合适的FrameLayout: " + i + " 面积: " + area);
            frameLayout = frameLayouts[i];
            break;
        }
    }

    if (!frameLayout) {
        taskLog("自动化任务-未找到合适的FrameLayout控件");
        return null;
    }

    // 获取最终选择的FrameLayout控件的边界
    var bounds = frameLayout.bounds();
    taskLog("选择的FrameLayout位置: " + bounds.left + "," + bounds.top + "," + bounds.right + "," + bounds.bottom);

    // 先截全屏
    var fullScreenImg = captureScreen();
    if (!fullScreenImg) {
        taskLog("自动化任务-全屏截图失败");
        return null;
    }

    // 计算裁剪区域的宽高
    var clipX = bounds.left;
    var clipY = bounds.top;
    var clipWidth = bounds.right - bounds.left;
    var clipHeight = bounds.bottom - bounds.top;
    
    taskLog("裁剪区域: x=" + clipX + ", y=" + clipY + ", width=" + clipWidth + ", height=" + clipHeight);

    // 裁剪指定区域
    var img = images.clip(fullScreenImg, clipX, clipY, clipWidth, clipHeight);
    if (!img) {
        taskLog("自动化任务-区域裁剪失败");
        fullScreenImg.recycle();
        return null;
    }
    
    // 释放全屏图片内存
    fullScreenImg.recycle();

    // 保存到相册/文件夹
    var path = RPAFilePath + "/bingtop.png" ;
    img.saveTo(path);                    // 保存
    img.recycle();                       // 回收内存
    taskLog("已保存Tiktok登陆验证码截图："+ path);

    //刷新媒体库
    sleep(3000)
    toast("开始刷新媒体库....");
    refreshMedia(RPAFilePath)
    return path
}

function use_Bingtop_code(){
    var imgPath = RPAFilePath + "/bingtop.png" ;
    var imgfp = images.read(imgPath);
    var img64 = images.toBase64(imgfp);
    var response = http.post("https://www.bingtop.com/ocr/upload/",{
        "username": "jockys",   //账号
        "password": "Yeyu0927", //密码
        "captchaData": img64,
        //验证码类型：https://www.bingtop.com/type/
        "captchaType": 1310 //滑块式图像，返回缺口位置 x,y 坐标值
    },{
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    });

    var dictdata = response.body.json();
    taskLog("冰拓打码结果: " + JSON.stringify(dictdata, null, 2));
    /*
    23:28:50.658/D: 冰拓打码结果: {
        "code": 0,
        "message": "",
        "data": {
            "captchaId": "1310-b783e8ff-1447-4b9b-a358-70ff45667617",
            "captchaType": "1310",
            "recognition": "1143,197"
        }
        }
    */
    var captchaCode = dictdata["data"]["recognition"]; // 得到验证码，存于captchaCode变量中
    return captchaCode;
}




//从评论数组中，顺序挑选一条标题
function get_TITLE_comment_text(){
    var comments = [];
    // 户是否存在
    taskLog("TT_UPLOAD_VIDEO_TITLE评论数组 =  " + TT_UPLOAD_VIDEO_TITLE)
    var file = new java.io.File(TT_UPLOAD_VIDEO_TITLE);
    if (file.exists() && file.isFile()) {
        try {
            // 读取文件内容
            var reader = new java.io.BufferedReader(new java.io.FileReader(file));
            var line;
            while ((line = reader.readLine()) !== null) {
                comments.push(line);
            }
            reader.close();
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
        }
    } else {
        // 如果文件不存在，将文件名添加到数组中
        comments.push(TT_UPLOAD_VIDEO_TITLE);
    }
    
    return comments
}


//从评论数组中，顺序挑选一条描述
function get_DESC_comment_text(){
    var comments = [];
    // 户是否存在
    taskLog("TT_UPLOAD_VIDEO_DESC评论数组 =  " + TT_UPLOAD_VIDEO_DESC)
    var file = new java.io.File(TT_UPLOAD_VIDEO_DESC);
    if (file.exists() && file.isFile()) {
        try {
            // 读取文件内容
            var reader = new java.io.BufferedReader(new java.io.FileReader(file));
            var line;
            while ((line = reader.readLine()) !== null) {
                comments.push(line);
            }
            reader.close();
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
        }
    } else {
        // 如果文件不存在，将文件名添加到数组中
        comments.push(TT_UPLOAD_VIDEO_DESC);
    }
    
    return comments
}



//删除本地临时文件夹
function deleteNestMediaFile(tempFolder) {
    if (files.exists(tempFolder)) {
        try {
            files.removeDir(tempFolder);
            Logger.info("临时文件夹删除成功: " + tempFolder);
        } catch (e) {
            Logger.error("删除临时文件夹失败: " + e.message);
        }
    } else {
        Logger.debug("临时文件夹不存在: " + tempFolder);
    }
}



/**
 * 通过指定按钮选择图片
 * @param {string} fileName 要选择的图片文件名
 */
function selectImageByButton(fileName) {
    
    try {

        taskLog("开始选择图片.....")
        var allTextView = className("android.widget.TextView").find();
        taskLog("找到allTextView: 全部 = "  + allTextView.size());
        if (allTextView && allTextView.size() > 0) {
            for (var i = 0; i < allTextView.size(); i++) {
                var textView = allTextView.get(i);
                if (textView) {
                    // taskLog("找到textView控件-Text：" + textView.text());
                    
                    //点击顶部按钮：全部
                    //TextView全部：fullId("com.zhiliaoapp.musically:id/tqg")
                    //fullId("com.ss.android.ugc.trill:id/tqj")
                    if (textView.id() == (CONFIG.APP.GLOBAL_PACKAGE +":id/tqg") || textView.id() == (CONFIG.APP.ASIA_PACKAGE +":id/tqj")) {
                        // 正确调用bounds()方法并点击
                        taskLog("找到顶部控件: 全部" );
                        var bounds = textView.bounds();
                        click(bounds.centerX(), bounds.centerY());
                        // 找到并点击后可以跳出循环
                        break;
                    }
                }
            }
        }

        sleep(3000)

        //点击对应的targetPath：A_NEST_TikTok_MEDIA
        var allListTextView = className("android.widget.TextView").find();
        taskLog("找到allListTextView: 全部 = "  + allListTextView.size());
        if (allListTextView && allListTextView.size() > 0) {
            for (var i = 0; i < allListTextView.size(); i++) {
                var listTextView = allListTextView.get(i);
                if (listTextView) {
                    // taskLog("找到listTextView控件-Text：" + listTextView.text());
                    
                    // 检查text是否为"A_NEST_TikTok_MEDIA"
                    if (listTextView.text() == CONFIG.PATHS.TEMP_MEDIA) {
                        // 正确调用bounds()方法并点击
                        taskLog("找到对应目录" );
                        var bounds = listTextView.bounds();
                        click(bounds.centerX(), bounds.centerY());
                        // 找到并点击后可以跳出循环
                        break;
                    }
                }
            }
        }else{
            return
        }


        sleep(5000);
        
        // 查找并点击指定按钮（其实只需要点击第一个图片的按钮就行了，因为肯定就是第一张图片）

        var autoSelectButton = null;
        //右上角最小的圆形按钮
        //fullId("com.ss.android.ugc.trill:id/hkm")
        //fullId("com.zhiliaoapp.musically:id/hkl")
        if(targetPackageName == CONFIG.APP.GLOBAL_PACKAGE){
            autoSelectButton = id(CONFIG.APP.GLOBAL_PACKAGE + ":id/hkl").find();
            taskLog("查找全球版选择按钮，包名：" + CONFIG.APP.GLOBAL_PACKAGE + ":id/hkl");
        }else{
            autoSelectButton = id(CONFIG.APP.ASIA_PACKAGE + ":id/hkm").find();
            taskLog("查找亚洲版选择按钮，包名：" + CONFIG.APP.ASIA_PACKAGE + ":id/hkm");
        }
        
        taskLog("找到的选择按钮数量：" + (autoSelectButton ? autoSelectButton.size() : 0));
        
        for(var i = 0; i < autoSelectButton.size(); i++) {
            var selectButton = autoSelectButton.get(i);
            taskLog("处理第 " + (i + 1) + " 个选择按钮");
            if(selectButton) {
                taskLog("找到有效的选择按钮，开始点击");
                sleep(1000)
                // 点击选择按钮
                selectButton.click();
                console.log("成功点击选择按钮");

                sleep(5000)
                //点击下一步
                // fullId("com.zhiliaoapp.musically:id/r1q")
                // fullId("com.ss.android.ugc.trill:id/r1r")
                taskLog("开始点击下一步按钮...");
                if(targetPackageName == CONFIG.APP.GLOBAL_PACKAGE){
                    clickId(CONFIG.APP.GLOBAL_PACKAGE + ":id/r1q")
                }else{
                    clickId(CONFIG.APP.ASIA_PACKAGE + ":id/r1r")
                }
                taskLog("下一步按钮点击完成");

                //发布视频时才会有这个按钮，修改头像时没有这个按钮
                sleep(5000)
                //点击下一步
                // fullId("com.zhiliaoapp.musically:id/l7a")
                // fullId("com.ss.android.ugc.trill:id/l7b")
                taskLog("开始点击第二个下一步按钮...");
                if(targetPackageName == CONFIG.APP.GLOBAL_PACKAGE){
                    clickId(CONFIG.APP.GLOBAL_PACKAGE + ":id/l7a")
                }else{
                    clickId(CONFIG.APP.ASIA_PACKAGE + ":id/l7b")
                }
                taskLog("第二个下一步按钮点击完成");


                //可能会出现一个下拉框，提示二次创作：text("確定")
                findTextByLanguages(CONFIG.UI_TEXT.CONFIRM)

                sleep(3000)
                click_Video_desc()

                sleep(5000)
                //点击Post
                //fullId("com.zhiliaoapp.musically:id/neo")
                //之前找不到ID，所以直接点击最后一个Button
                var allPostButtons = className("android.widget.Button").find();
                if (allPostButtons && allPostButtons.size() > 0) {
                    var lastPostButton = allPostButtons.get(allPostButtons.size() - 1);
                    if (lastPostButton) {
                        lastPostButton.click();
                        taskLog("Post按钮点击完成");
                    }
                }
                sleep(5000)

                // //可能会出现一个下拉框，提示是否添加到主屏幕:text("ADD TO HOME SCREEN")
                taskLog("开始查找是否添加到主屏幕.....")
                findTextByLanguages(CONFIG.UI_TEXT.ADD_TO_HOME_SCREEN)

                sleep(CONFIG.TIMEOUTS.UPLOAD) //上传需要耗时

                // 上传完成后进行截图
                taskLog("开始准备上传完成后进行截图.....")
                var screenshotPath = Nest_ScreenCapture();
                taskLog("已保存完成后的截图：" + screenshotPath);

                // 视频上传成功，增加成功计数
                total_success++;
                taskLog("视频上传成功！当前成功数量：" + total_success);

                //删除临时媒体文件夹
                var delFolder = CONFIG.PATHS.DOWNLOAD + CONFIG.PATHS.TEMP_MEDIA;
                deleteNestMediaFile(delFolder)

                break;


            }
        }
        
    } catch (e) {
        // 记录失败信息
        var errorInfo = "选择图片操作失败：" + e.message;
        fail_msg += (fail_msg ? "; " : "") + errorInfo;
        
        console.error("操作失败：" + e);
        return false;
    }
}

// 添加重试机制的版本
function selectImageWithRetry(fileName) {
    var maxRetries = 1
    for (var i = 0; i < maxRetries; i++) {
        console.log("尝试第" + (i + 1) + "次选择图片");
        
        if (selectImageByButton(fileName)) {
            return true;
        }
        
        // 如果失败，等待一段时间后重试
        sleep(2000);
    }
    
    // console.error("在" + maxRetries + "次尝试后仍未能选择图片");
    return false;
}



// 刷新指定路径的媒体库
function refreshMedia(path) {
    try {
        toast("开始刷新媒体库，用时5秒钟....");
        // 发送媒体扫描广播
        media.scanFile(path);
        // 等待扫描完成
        sleep(5000);
        toast("媒体库刷新完成，开始下一步任务...");
    } catch (error) {
        toast("path = " + path + " 媒体库刷新失败，error = " + error);
    }

}






// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
}


//强制停止TikTok 
function forceStop_APP(packageName) {
    taskLog("准备强杀:" + packageName + "...");
    sleep(CONFIG.TIMEOUTS.SHORT);
    openAppSettings(packageName);
    sleep(CONFIG.TIMEOUTS.MEDIUM);

    // 使用统一的多语言点击函数
    var forceStopSuccess = Utils.clickByText(CONFIG.UI_TEXT.FORCE_STOP);
    
    if (forceStopSuccess) {
        sleep(CONFIG.TIMEOUTS.SHORT);
        
        // 点击确认按钮
        var confirmSuccess = Utils.clickByText(CONFIG.UI_TEXT.FORCE_STOP_CONFIRM);
        if (confirmSuccess) {
            taskLog("成功强制停止应用并确认");
        } else {
            taskLog("强制停止成功但确认失败");
        }
        
        sleep(CONFIG.TIMEOUTS.SHORT);
        home();
    } else {
        taskLog("未找到强制停止按钮，直接返回主页");
        home();
    }
}






function clickId(elementId) {
    taskLog("开始点击元素ID：" + elementId);

    try {
        var element = Utils.waitForElement(
            id(elementId).boundsInside(5, 5, device.width - 5, device.height - 5),
            CONFIG.TIMEOUTS.MEDIUM
        );
        
        if (!element) {
            taskLog("没有找到元素ID：" + elementId);
            return false;
        }
        
        var bounds = element.bounds();
        var centerX = bounds.centerX();
        var centerY = bounds.centerY();
        
        // 验证坐标有效性
        if (centerX < 0 || centerY < 0) {
            taskLog("坐标无效，中心点X或Y为负值: X=" + centerX + ", Y=" + centerY);
            return false;
        }

        // 使用安全的点击函数
        return Utils.safeClick(centerX, centerY);
        
    } catch (e) {
        taskLog("点击元素失败：" + e.message);
        return false;
    }
}










//打印日志
function taskLog(_log){
    // 显示toast提示
    toast(_log);
    
    // 使用console.log输出（现在会自动写入文件）
    console.log(_log);
    
    // 如果需要额外的文件写入（使用不同的文件路径），可以取消下面的注释
    /*
    try {
        //确保目录存在
        files.ensureDir(RPAFilePath);
        
        //将日志写入文件
        var logContent = getSystemDate("df") + ":" + _log + "\n";
        files.append(logFilePath, logContent);
        
    } catch(e) {
        console.error("写入日志文件失败：" + e);
    }
    */
}




function getSystemDate(a) {
    var b = new SimpleDateFormat("HH:mm:ss"), c = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    return "tf" == a ? b.format(new java.util.Date()) :"df" == a ? c.format(new java.util.Date()) :void 0;
}



//========================================================================================================================


// 通过语言对象查找文本
function findTextByLanguages(languageObject) {
    for (var lang in languageObject) {
        var targetText = languageObject[lang];
        // 如果targetText是数组，遍历数组中的每个文本
        if (Array.isArray(targetText)) {
            for (var j = 0; j < targetText.length; j++) {
                var text_item = targetText[j];
                if (text(text_item).exists()) {
                    taskLog("找到文本：" + text_item);
                    var element = text(text_item).findOne();
                    if (element && element.clickable()) {
                        element.click();
                        return true;
                    } else if (element) {
                        // 如果元素存在但不可点击，尝试点击其坐标
                        var bounds = element.bounds();
                        click(bounds.centerX(), bounds.centerY());
                        return true;
                    }
                }
            }
        } else {
            // 原来的单个文本处理逻辑
            if (text(targetText).exists()) {
                taskLog("找到文本：" + targetText);
                var element = text(targetText).findOne();
                if (element && element.clickable()) {
                    element.click();
                    return true;
                } else if (element) {
                    // 如果元素存在但不可点击，尝试点击其坐标
                    var bounds = element.bounds();
                    click(bounds.centerX(), bounds.centerY());
                    return true;
                }
            }
        }
    }
    taskLog("未找到任何匹配的文本");
    return false;
}



//给视频输入desc内容
function click_Video_desc(){
    taskLog("开始准备输入视频描述")

    sleep(3000)
    //短描述：fullId("com.zhiliaoapp.musically:id/epv")
    //fullId("com.ss.android.ugc.trill:id/eqx")


    //长描述：fullId("com.zhiliaoapp.musically:id/epu")
    //fullId("com.ss.android.ugc.trill:id/eqw")

    var autoCompleteTextViews = className("android.widget.EditText").find();
    for(var i = 0; i < autoCompleteTextViews.size(); i++) {
        var textView = autoCompleteTextViews.get(i);
        if(textView) {

            sleep(1000)

            //标题
            var all_TT_TITLE_text = []
            if(TT_UPLOAD_VIDEO_TITLE && 
                TT_UPLOAD_VIDEO_TITLE.trim() !== "" && 
                TT_UPLOAD_VIDEO_TITLE.trim().toLowerCase() !== "off" && 
                !TT_UPLOAD_VIDEO_TITLE.includes("$${")){
                    all_TT_TITLE_text = get_TITLE_comment_text()
            }

            //描述
            var all_TT_DESC_text = []
            if(TT_UPLOAD_VIDEO_DESC && 
                TT_UPLOAD_VIDEO_DESC.trim() !== "" && 
                TT_UPLOAD_VIDEO_DESC.trim().toLowerCase() !== "off" && 
                !TT_UPLOAD_VIDEO_DESC.includes("$${")){
                    all_TT_DESC_text = get_DESC_comment_text()
            }


            if(all_TT_TITLE_text.length > 0){
                var randTitleIdx = random(0, all_TT_TITLE_text.length - 1)
                var titleText = all_TT_TITLE_text[randTitleIdx];

                if(titleText.includes("$${T")){ 
                    throw_error_storage_not_enough()
                }
                taskLog("标题：" + titleText);
                //短描述：fullId("com.zhiliaoapp.musically:id/eqw")
                //fullId("com.ss.android.ugc.trill:id/eqx")
                if(textView.id() == CONFIG.APP.GLOBAL_PACKAGE + ":id/eqw" || textView.id() == CONFIG.APP.ASIA_PACKAGE + ":id/eqx"){
                    textView.setText(titleText)
                    sleep(random(3000,5000))
                } 

            }


            if(all_TT_DESC_text.length > 0){
                var randDescIdx = random(0, all_TT_DESC_text.length - 1)
                var descText = all_TT_DESC_text[randDescIdx];

                if(descText.includes("$${T")){ 
                    throw_error_storage_not_enough()
                }
                taskLog("描述：" + descText);
                //长描述：fullId("com.zhiliaoapp.musically:id/eqv")
                //fullId("com.ss.android.ugc.trill:id/eqw")
                if(textView.id() == CONFIG.APP.GLOBAL_PACKAGE + ":id/eqv" || textView.id() == CONFIG.APP.ASIA_PACKAGE + ":id/eqw"){
                    textView.setText(descText)
                    sleep(random(5000,10000))
                }   
            }

    
        }
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
    for (var i = 0; i < 3; i++) {
        if (quickClickPermission()) {
            taskLog("权限处理成功");
            return;
        }
        sleep(1000); // 短暂等待后重试
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


// 主执行函数
function main() {
    try {
        // 设置目标上传数量（当前脚本每次只上传一个视频）
        total_target = 1;
        taskLog("开始执行TikTok账号密码登录任务：" + total_target);
        taskLog("账号：" + TT_LOGIN_ACCOUNT);
        taskLog("密码：" + TT_LOGIN_PASSWORD);  

        sleep(random(3000, 5000))
        //打开之后，底部会有一个Agree and continue
        //国际版没有这个按钮，亚洲版有这个按钮，但都还是一起处理了
        var agree_and_continue = findTextByLanguages(CONFIG.UI_TEXT.AGREE_AND_CONTINUE)
        if(agree_and_continue){
            taskLog("找到Agree and continue按钮，并且点击")
        }else{
            taskLog("没有找到Agree and continue按钮，直接跳过")
        }
        sleep(random(3000, 5000))



        //继续打开之后，会出现类别，需要自己选择
        //fullId("com.ss.android.ugc.trill:id/bub")
        //国际版没有这个按钮，亚洲版有这个按钮，如果亚洲版有这个按钮，则点击,国际版则不点击 ，通过包名判断
        if(targetPackageName == CONFIG.APP.ASIA_PACKAGE){

            // 点击：text("跳过")
            clickId(CONFIG.APP.ASIA_PACKAGE + ":id/bub")
            sleep(random(3000, 5000))


            // 点击：text("开始观看")
            // fullId("com.ss.android.ugc.trill:id/qeh")
            clickId(CONFIG.APP.ASIA_PACKAGE + ":id/qeh")
            sleep(random(3000, 5000))

        }
        sleep(random(8000, 10000))
        //继续打开之后，可能会出现提示往上滑动
        swipe_to_up()
        sleep(random(8000, 10000))



        taskLog("开始点击首页最右侧Profile按钮")
        var profile_btn = findTextByLanguages(CONFIG.UI_TEXT.PROFILE_TEXT)
    // if(profile_btn){
        sleep(random(5000, 8000))


        //在每次刚刚打开页面的时候，可能因为手机已经有手机号码，所以会自动弹出一个有手机号码的dialog弹窗，提示使用手机号码，这里要处理一下
        //页面内容：
            //Continue with 
            //(212)591-1655
            //NONE OF THE ABOVE
        //fullId("com.google.android.gms:id/credentials_hint_picker_title")
        var continue_with_phone_number = findTextByLanguages(CONFIG.UI_TEXT.CONTINUE_WITH_PHONE_NUMBER)
        if(continue_with_phone_number){
            taskLog("找到Continue with phone number按钮，点击一次回退按钮")
            back()
        }else{
            taskLog("没有找到Continue with phone number按钮，直接跳过")
        }
        sleep(random(5000, 8000))



        //开始点击：desc("Use phone / email / username")
        //className("android.widget.TextView")
        //fullId("com.ss.android.ugc.trill:id/cee")
        //fullId("com.zhiliaoapp.musically:id/cee")
        //如果有这个按钮对应的ID，则点击，如果没有，则不点击
        var allTextView = className("android.widget.TextView").find();
        taskLog("找到allTextView: 全部 = "  + allTextView.size());
        if (allTextView && allTextView.size() > 0) {
            for (var i = 0; i < allTextView.size(); i++) {
                var textView = allTextView.get(i);
                if (textView) {                    
                    if (textView.id() == (CONFIG.APP.GLOBAL_PACKAGE +":id/cee") || textView.id() == (CONFIG.APP.ASIA_PACKAGE +":id/cee")) {
                        // 正确调用bounds()方法并点击
                        taskLog("找到顶部控件: Use phone / email / username" );
                        var bounds = textView.bounds();
                        click(bounds.centerX(), bounds.centerY());
                        // 找到并点击后可以跳出循环
                        break;
                    }
                }
            }
        }
        sleep(random(3000, 5000))

       
        //开始切换账号类型
        var allTextView = className("android.widget.TextView").find();
        taskLog("开始切换账号类型: 全部 = "  + allTextView.size());
        if (allTextView && allTextView.size() > 0) {
            for (var i = 0; i < allTextView.size(); i++) {
                var textView = allTextView.get(i);
                if (textView) {
                    taskLog("开始切换账号类型:  text = " + textView.text() + "，ID = " + textView.id());
                }
            }
        }
        sleep(random(3000, 5000))
        var switch_account_type = findTextByLanguages(CONFIG.UI_TEXT.SWITCH_ACCOUNT_TYPE)
        if(!switch_account_type){
            taskLog("没有找到切换账号类型按钮")
            throw new Error("没有找到切换账号类型按钮，请重试")
        }

        sleep(random(3000, 5000))



        //开始输入账号：className("android.widget.EditText")
        //找到所有的EditText，如果有，则输入账号，如果没有，则不输入
        var allEditText = className("android.widget.EditText").find();
        taskLog("找到allEditText: 全部 = "  + allEditText.size());
        if (allEditText && allEditText.size() > 0) {
            for (var i = 0; i < allEditText.size(); i++) {
                var editText = allEditText.get(i);
                if (editText) {
                    editText.setText(TT_LOGIN_ACCOUNT);
                }
            }
        }
        sleep(random(3000, 5000))



        //输入用户名之后，点击continue:className("android.widget.Button")
        //fullId("com.zhiliaoapp.musically:id/dn1")
        //fullId("com.ss.android.ugc.trill:id/dn2")
        var allButton = className("android.widget.Button").find();
        taskLog("找到allButton: 全部 = "  + allButton.size());
        if (allButton && allButton.size() > 0) {
            for (var i = 0; i < allButton.size(); i++) {
                var button = allButton.get(i);
                if (button) {
                    if (button.id() == (CONFIG.APP.GLOBAL_PACKAGE +":id/dn1") || button.id() == (CONFIG.APP.ASIA_PACKAGE +":id/dn2")) {
                        taskLog("找到顶部控件: continue" );
                        button.click();
                        // break;
                    }
                }
            }
        }
        sleep(random(3000, 5000))


        //开始输入密码
        var allEditText = className("android.widget.EditText").find();
        taskLog("找到allEditText: 全部 = "  + allEditText.size());
        if (allEditText && allEditText.size() > 0) {
            for (var i = 0; i < allEditText.size(); i++) {
                var editText = allEditText.get(i);
                if (editText) {
                    editText.setText(TT_LOGIN_PASSWORD);
                }
            }
        }
        sleep(random(3000, 5000))



        //输入密码之后：点击continue
        //fullId("com.zhiliaoapp.musically:id/dn1")
        //fullId("com.ss.android.ugc.trill:id/dn2")
        var allButton = className("android.widget.Button").find();
        taskLog("找到allButton: 全部 = "  + allButton.size());
        if (allButton && allButton.size() > 0) {
            for (var i = 0; i < allButton.size(); i++) {
                var button = allButton.get(i);
                if (button) {
                    if (button.id() == (CONFIG.APP.GLOBAL_PACKAGE +":id/dn1") || button.id() == (CONFIG.APP.ASIA_PACKAGE +":id/dn2")) {
                        taskLog("找到控件: continue" );
                        // var bounds = button.bounds();
                        // click(bounds.centerX(), bounds.centerY());
                        button.click();
                        // break;
                    }
                }
            }
        }
        sleep(random(45000, 60000))


        //此时出现验证码，开始使用冰拓进行打码
        //1.先截图，保存
        save_Bingtop_Pic();

        //2.调用冰拓打码
        var captchaCode = use_Bingtop_code();
        taskLog("冰拓打码结果: " + captchaCode);
        if(captchaCode){
            taskLog("冰拓打码成功");
            
            //3.执行滑块移动
            var moveResult = performSliderMove(captchaCode);
            if(moveResult){
                taskLog("滑块移动成功，等待验证码系统验证...");
                sleep(random(3000, 5000)); // 等待3-5秒，配合拖拽后的4-6秒等待
                taskLog("验证码验证等待完成");
            }else{
                taskLog("滑块移动失败");
            }
        }else{
            taskLog("冰拓打码失败");
        }

        
        sleep(random(800000, 1000000))






        













    // }else{
    //     Nest_ScreenCapture()
    //     sleep(random(3000, 5000))
    //     taskLog("没有找到首页最右侧Profile按钮")
    //     throw new Error("没有找到首页最右侧Profile按钮")
    // }



















        


        

        // // 处理权限问题
        // taskLog("开始处理权限问题.....");
        // click_permission_allow();
        // sleep(CONFIG.TIMEOUTS.SHORT);

        // // 刷新媒体库
        // taskLog("开始刷新本地媒体库.....");
        // refreshMedia(CONFIG.PATHS.DOWNLOAD);
        // sleep(CONFIG.TIMEOUTS.SHORT);

        

        Logger.info("TikTok账号密码登录任务执行完成");


    } catch (e) {
        Logger.error("主执行函数发生错误", e);
        if (e.message === "TASK_COMPLETED") {
            taskLog("任务正常完成");
        } else {
            handleError(e);
        }
    } finally {
        // 清理资源
        Utils.cleanup();

        // 输出统计信息
        taskLog("=== 视频上传统计信息 ===");
        taskLog("目标上传数量：" + total_target);
        taskLog("成功上传数量：" + total_success);
        taskLog("失败数量：" + (total_target - total_success));
        if (fail_msg) {
            taskLog("失败信息：" + fail_msg);
        }
        taskLog("成功率：" + (total_target > 0 ? (total_success / total_target * 100).toFixed(2) + "%" : "0%"));
        taskLog("========================");


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
}

/**
 * 执行滑块移动操作
 * @param {string} captchaCode 冰拓返回的坐标字符串，格式如 "1143,197"（基于截图的相对坐标）
 * @returns {boolean} 移动是否成功
 */
function performSliderMove(captchaCode) {
    try {
        taskLog("开始执行滑块移动，坐标：" + captchaCode);
        
        // 解析坐标
        var coords = captchaCode.split(',');
        if (coords.length !== 2) {
            taskLog("坐标格式错误：" + captchaCode);
            return false;
        }
        
        var relativeX = parseInt(coords[0]);
        var relativeY = parseInt(coords[1]);
        
        if (isNaN(relativeX) || isNaN(relativeY)) {
            taskLog("坐标解析失败：" + captchaCode);
            return false;
        }
        
        taskLog("冰拓返回的相对坐标：X=" + relativeX + ", Y=" + relativeY);
        
        // 获取FrameLayout的位置信息（需要与截图时保持一致）
        var frameLayouts = className("android.widget.FrameLayout").find();
        if (frameLayouts.length == 0) {
            taskLog("未找到FrameLayout控件");
            return false;
        }
        
        // 使用与截图时相同的逻辑找到FrameLayout
        var frameLayout = null;
        var screenWidth = device.width;
        var screenHeight = device.height;
        var screenArea = screenWidth * screenHeight;
        
        for (var i = 0; i < frameLayouts.length; i++) {
            var bounds = frameLayouts[i].bounds();
            var area = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
            var width = bounds.right - bounds.left;
            var height = bounds.bottom - bounds.top;
            
            if (area < screenArea * 0.8 && area > 100000 && width > 200 && height > 200) {
                frameLayout = frameLayouts[i];
                break;
            }
        }
        
        if (!frameLayout) {
            taskLog("未找到合适的FrameLayout控件");
            return false;
        }
        
        // 获取FrameLayout的边界
        var frameBounds = frameLayout.bounds();
        taskLog("FrameLayout位置：" + frameBounds.left + "," + frameBounds.top + "," + frameBounds.right + "," + frameBounds.bottom);
        
        // 将相对坐标转换为屏幕绝对坐标
        var targetX = frameBounds.left + relativeX;
        var targetY = frameBounds.top + relativeY;
        
        taskLog("冰拓返回的绝对坐标：X=" + targetX + ", Y=" + targetY);

        
        // 查找滑块元素（通常是可拖拽的拼图块）
        var sliderElement = findSliderElement();
        if (!sliderElement) {
            taskLog("未找到滑块元素");
            return false;
        }
        
        // 获取滑块当前位置
        var sliderBounds = sliderElement.bounds();
        var startX = sliderBounds.centerX();
        var startY = sliderBounds.centerY();
        
        taskLog("滑块当前位置：X=" + startX + ", Y=" + startY);
        taskLog("冰拓返回的目标位置：X=" + targetX + ", Y=" + targetY);
        
        // 计算移动距离 - 滑块验证码只需要水平移动
        var deltaX = targetX - startX;
        var deltaY = 0; // 滑块验证码通常不需要垂直移动，保持Y坐标不变
        
        taskLog("移动距离：deltaX=" + deltaX + ", deltaY=" + deltaY);
        
        // 执行拖拽操作 - 保持Y坐标不变，只移动X坐标
        var dragResult = performDrag(startX, startY, targetX, startY);
        
        if (dragResult) {
            taskLog("滑块拖拽完成");
            return true;
        } else {
            taskLog("滑块拖拽失败");
            return false;
        }
        
    } catch (e) {
        taskLog("滑块移动异常：" + e.message);
        return false;
    }
}

/**
 * 查找滑块元素
 * @returns {Object} 滑块元素对象
 */
function findSliderElement() {
    try {
        taskLog("开始查找滑块元素...");
        
        // 等待验证码对话框完全加载
        taskLog("等待验证码对话框加载...");
        sleep(2000);
        
        // 方法1：查找所有可拖拽的元素（简化版）
        taskLog("方法1：查找可拖拽的元素");
        var elementTypes = [
            "android.view.View",
            "android.widget.ImageView", 
            "android.widget.Button",
            "android.widget.TextView",
            "android.widget.LinearLayout",
            "android.widget.RelativeLayout",
            "android.widget.FrameLayout"
        ];
        
        for (var typeIndex = 0; typeIndex < elementTypes.length; typeIndex++) {
            var elementType = elementTypes[typeIndex];
            taskLog("查找元素类型: " + elementType);
            
            var elements = className(elementType).find();
            taskLog("找到" + elementType + "元素总数：" + (elements ? elements.size() : 0));
            
            if (elements && elements.size() > 0) {
                for (var i = 0; i < elements.size(); i++) {
                    var element = elements.get(i);
                    if (element) {
                        var bounds = element.bounds();
                        var isClickable = element.clickable();
                        var desc = element.desc();
                        var text = element.text();
                        var id = element.id();
                        
                        // 简化判断：只要是合理大小的元素就认为是可拖拽的
                        if (bounds.height() > 50 && bounds.height() < 200 && 
                            bounds.width() > 50 && bounds.width() < 300) {
                            taskLog("发现可拖拽元素[" + i + "]: 类型=" + elementType + 
                                   ", 高度=" + bounds.height() + ", 宽度=" + bounds.width() + 
                                   ", clickable=" + isClickable);
                            return element;
                        }
                    }
                }
            }
        }
        
        // 方法2：查找所有Button元素（简化版）
        taskLog("方法2：查找所有Button元素");
        var allButtonElements = className("android.widget.Button").find();
        taskLog("找到所有Button元素总数：" + (allButtonElements ? allButtonElements.size() : 0));
        
        if (allButtonElements && allButtonElements.size() > 0) {
            for (var k = 0; k < allButtonElements.size(); k++) {
                var element = allButtonElements.get(k);
                if (element) {
                    var bounds = element.bounds();
                    var isClickable = element.clickable();
                    
                    // 简化判断：只要是合理大小的Button就认为是可拖拽的
                    if (bounds.height() > 50 && bounds.height() < 200 && 
                        bounds.width() > 50 && bounds.width() < 300) {
                        taskLog("发现可拖拽Button元素[" + k + "]: 高度=" + bounds.height() + ", 宽度=" + bounds.width() + ", clickable=" + isClickable);
                        return element;
                    }
                }
            }
        }
        
        // 方法3：查找所有ImageView元素
        taskLog("方法3：查找所有ImageView元素");
        var allImageElements = className("android.widget.ImageView").find();
        taskLog("找到所有ImageView元素总数：" + (allImageElements ? allImageElements.size() : 0));
        
        if (allImageElements && allImageElements.size() > 0) {
            for (var m = 0; m < allImageElements.size(); m++) {
                var element = allImageElements.get(m);
                if (element) {
                    var bounds = element.bounds();
                    var isClickable = element.clickable();
                    
                    // 简化判断：只要是合理大小的ImageView就认为是可拖拽的
                    if (bounds.height() > 50 && bounds.height() < 200 && 
                        bounds.width() > 50 && bounds.width() < 300) {
                        taskLog("发现可拖拽ImageView元素[" + m + "]: 高度=" + bounds.height() + ", 宽度=" + bounds.width() + ", clickable=" + isClickable);
                        return element;
                    }
                }
            }
        }
        
        // 方法4：如果前面都没找到，直接使用第一个合理大小的元素
        taskLog("方法4：查找任意合理大小的元素");
        var allElements = className("android.view.View").find();
        taskLog("找到所有View元素总数：" + (allElements ? allElements.size() : 0));
        
        if (allElements && allElements.size() > 0) {
            for (var n = 0; n < allElements.size(); n++) {
                var element = allElements.get(n);
                if (element) {
                    var bounds = element.bounds();
                    var isClickable = element.clickable();
                    
                    // 只要是合理大小的元素就认为是可拖拽的
                    if (bounds.height() > 30 && bounds.height() < 300 && 
                        bounds.width() > 30 && bounds.width() < 500) {
                        taskLog("发现可拖拽View元素[" + n + "]: 高度=" + bounds.height() + ", 宽度=" + bounds.width() + ", clickable=" + isClickable);
                        return element;
                    }
                }
            }
        }
        
        // 方法5：如果还是找不到，返回null
        taskLog("方法5：未找到任何可拖拽的元素");
        return null;
        
    } catch (e) {
        taskLog("查找滑块元素异常：" + e.message);
        return null;
    }
}

/**
 * 执行拖拽操作
 * @param {number} startX 起始X坐标
 * @param {number} startY 起始Y坐标
 * @param {number} endX 结束X坐标
 * @param {number} endY 结束Y坐标
 * @returns {boolean} 拖拽是否成功
 */
function performDrag(startX, startY, endX, endY) {
    try {
        taskLog("开始执行拖拽：从(" + startX + "," + startY + ")到(" + endX + "," + endY + ")");
        
        // 添加随机偏移，模拟人类操作
        var randomOffset = 3;
        startX += random(-randomOffset, randomOffset);
        startY += random(-randomOffset, randomOffset);
        endX += random(-randomOffset, randomOffset);
        endY += random(-randomOffset, randomOffset);
        
        // 确保坐标在屏幕范围内
        startX = Math.max(0, Math.min(startX, device.width));
        startY = Math.max(0, Math.min(startY, device.height));
        endX = Math.max(0, Math.min(endX, device.width));
        endY = Math.max(0, Math.min(endY, device.height));
        
        taskLog("调整后坐标：从(" + startX + "," + startY + ")到(" + endX + "," + endY + ")");
        
        // 方法1：使用手势模拟实现更自然的拖拽
        taskLog("使用手势模拟实现更自然的拖拽");
        
        try {
            // 使用手势API模拟更自然的拖拽
            var totalDuration = random(2500, 4000); // 更长的拖拽时间
            var steps = 15; // 更多步骤，让轨迹更平滑
            
            // 计算轨迹点，使用贝塞尔曲线模拟自然轨迹
            var points = [];
            for (var i = 0; i <= steps; i++) {
                var progress = i / steps;
                
                // 使用缓动函数，开始慢，中间快，结束慢
                var easeProgress;
                if (progress < 0.5) {
                    easeProgress = 2 * progress * progress;
                } else {
                    easeProgress = 1 - Math.pow(-2 * progress + 2, 2) / 2;
                }
                
                // 添加轻微的随机偏移，模拟手抖
                var randomOffsetX = random(-2, 2);
                var randomOffsetY = random(-1, 1);
                
                var currentX = startX + (endX - startX) * easeProgress + randomOffsetX;
                var currentY = startY + (endY - startY) * easeProgress + randomOffsetY;
                
                // 确保坐标在屏幕范围内
                currentX = Math.max(0, Math.min(currentX, device.width));
                currentY = Math.max(0, Math.min(currentY, device.height));
                
                points.push([currentX, currentY]);
            }
            
            // 使用手势API执行拖拽
            var gesturePoints = [];
            for (var k = 0; k < points.length; k++) {
                gesturePoints.push(points[k]);
            }
            
            // 执行手势拖拽
            gesture(totalDuration, gesturePoints);
            taskLog("手势拖拽执行完成");
            
        } catch (e) {
            taskLog("手势拖拽失败，尝试分段swipe: " + e.message);
            
            // 备用方法：使用分段swipe
            var segments = 8; // 更多分段
            var segmentTime = random(200, 400); // 每段时间随机化
            
            // 计算分段点
            var points = [];
            for (var i = 0; i <= segments; i++) {
                var progress = i / segments;
                
                // 添加随机偏移
                var randomOffsetX = random(-3, 3);
                var randomOffsetY = random(-2, 2);
                
                var currentX = startX + (endX - startX) * progress + randomOffsetX;
                var currentY = startY + (endY - startY) * progress + randomOffsetY;
                
                currentX = Math.max(0, Math.min(currentX, device.width));
                currentY = Math.max(0, Math.min(currentY, device.height));
                
                points.push([currentX, currentY]);
            }
            
            // 分段执行，每段之间添加随机停顿
            for (var j = 0; j < points.length - 1; j++) {
                var currentPoint = points[j];
                var nextPoint = points[j + 1];
                
                swipe(currentPoint[0], currentPoint[1], nextPoint[0], nextPoint[1], segmentTime);
                
                // 随机停顿，模拟人类操作
                if (j < points.length - 2) {
                    sleep(random(80, 200));
                }
            }
            
            taskLog("分段swipe拖拽执行完成");
        }
        
        // 拖拽完成后，在目标位置停留一段时间，模拟人类操作
        taskLog("拖拽到指定位置，在目标位置停留等待验证...");
        sleep(random(1000, 2000)); // 在目标位置停留1-2秒
        
        // 然后等待验证码系统检查
        taskLog("等待验证码系统检查...");
        sleep(random(3000, 5000)); // 再等待3-5秒让验证码系统检查
        
        taskLog("简单swipe拖拽执行完成");
        return true;
        
    } catch (e) {
        taskLog("手势拖拽异常：" + e.message);
        
        // 备用方法：使用多点触控模拟
        try {
            taskLog("尝试使用多点触控模拟方法");
            
            // 按下
            press(startX, startY, 100);
            sleep(random(50, 150));
            
            // 分段移动
            var segments = 10;
            for (var i = 1; i <= segments; i++) {
                var progress = i / segments;
                
                // 使用缓动函数
                var easeProgress = progress * progress * (3 - 2 * progress);
                
                var currentX = startX + (endX - startX) * easeProgress;
                var currentY = startY + (endY - startY) * easeProgress;
                
                // 添加随机偏移
                currentX += random(-2, 2);
                currentY += random(-1, 1);
                
                // 确保坐标在屏幕范围内
                currentX = Math.max(0, Math.min(currentX, device.width));
                currentY = Math.max(0, Math.min(currentY, device.height));
                
                // 移动手指
                gesture(50, [currentX, currentY]);
                sleep(random(30, 80));
            }
            
            // 抬起
            sleep(random(100, 200));
            
            // 拖拽完成后，在目标位置停留一段时间，模拟人类操作
            taskLog("多点触控拖拽到指定位置，在目标位置停留等待验证...");
            sleep(random(1000, 2000)); // 在目标位置停留1-2秒
            
            // 然后等待验证码系统检查
            taskLog("等待验证码系统检查...");
            sleep(random(3000, 5000)); // 再等待3-5秒让验证码系统检查
            
            taskLog("多点触控执行完成");
            return true;
        } catch (e2) {
            taskLog("所有拖拽方法都失败：" + e2.message);
            return false;
        }
    }
}

// 执行主函数
main();


