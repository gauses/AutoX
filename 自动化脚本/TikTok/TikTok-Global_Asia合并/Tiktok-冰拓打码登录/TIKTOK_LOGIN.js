// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************使用购买的账号密码进行登录Tiktok*************************
//验证码识别分类：https://www.bingtop.com/type/
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

// 冰拓API调用保护变量
var bingtopApiCallInProgress = false;

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



taskLog("=== 脚本启动检查开始 ===");
taskLog("当前时间: " + new Date().toISOString());

taskLog("开始强制关闭同名的脚本...")
var currentEngine = engines.myEngine()
var runningEngines = engines.all()
var currentSource = currentEngine.getSource() + ''

taskLog("当前脚本引擎ID: " + currentEngine.id);
taskLog("当前运行中的引擎总数: " + runningEngines.length);
taskLog("当前脚本源码长度: " + currentSource.length);

if (runningEngines.length > 1) {
  taskLog("发现多个运行中的引擎，开始检查同名脚本...");
  for (var i = 0; i < runningEngines.length; i++) {
    var compareEngine = runningEngines[i];
    var compareSource = compareEngine.getSource() + ''
    taskLog("检查引擎[" + i + "]: ID=" + compareEngine.id + ", 源码长度=" + compareSource.length);
    
    if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
      taskLog("发现同名脚本，引擎ID: " + compareEngine.id + "，准备强制关闭");
      // 强制关闭同名的脚本
      compareEngine.forceStop()
      taskLog("已强制关闭同名脚本: " + compareEngine.id);
    }
  }
} else {
  taskLog("只有一个运行中的引擎，无需关闭其他脚本");
}

taskLog("=== 脚本启动检查结束 ===");

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
    
    // 等待一下确保权限生效
    sleep(1000);

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
    var maxRetries = 3; // 最大重试次数
    var timeoutMs = 60000; // 超时时间：1分钟
    
    taskLog("=== 冰拓API调用开始（带超时和重试机制） ===");
    taskLog("最大重试次数: " + maxRetries);
    taskLog("单次请求超时时间: " + timeoutMs + "ms");
    
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
        // 生成唯一请求ID
        var requestId = Date.now() + "_" + Math.random().toString(36).substr(2, 9) + "_attempt" + attempt;
        
        taskLog("=== 第" + attempt + "次尝试开始 ===");
        taskLog("请求ID: " + requestId);
        taskLog("当前时间: " + new Date().toISOString());
        taskLog("bingtopApiCallInProgress状态: " + bingtopApiCallInProgress);
        
        // 检查是否已经有API调用在进行中
        if (bingtopApiCallInProgress) {
            taskLog("冰拓API正在调用中，跳过重复调用，请求ID: " + requestId);
            return null;
        }
        
        // 设置API调用标志
        bingtopApiCallInProgress = true;
        taskLog("设置API调用标志为true，请求ID: " + requestId);
        
        try {
            var imgPath = RPAFilePath + "/bingtop.png" ;
            taskLog("读取图片文件: " + imgPath);
            
            var imgfp = images.read(imgPath);
            if (!imgfp) {
                taskLog("图片读取失败，请求ID: " + requestId);
                throw new Error("图片读取失败");
            }
            
            taskLog("图片读取成功，开始转换为Base64，请求ID: " + requestId);
            var img64 = images.toBase64(imgfp);
            taskLog("图片Base64转换完成，长度: " + img64.length + "，请求ID: " + requestId);
            
            // 释放图片内存
            imgfp.recycle();
            taskLog("图片内存已释放，请求ID: " + requestId);
            
            taskLog("开始调用冰拓打码API，请求ID: " + requestId);
            taskLog("API请求参数: username=jockys, captchaType=1310");
            
            // 执行API调用并设置超时控制
            var result = null;
            var startTime = Date.now();
            var timeoutReached = false;
            
            // 使用setTimeout模拟超时控制
            var timeoutId = setTimeout(function() {
                timeoutReached = true;
                taskLog("请求超时，超过" + timeoutMs + "ms，请求ID: " + requestId);
            }, timeoutMs);
            
            try {
                // var response = http.post("https://www.bingtop.com/ocr/upload/",{
                var response = http.post("http://hk.bingtop.com/ocr/upload/",{
                    "username": "jockys",   //账号
                    "password": "Yeyu0927", //密码
                    "captchaData": img64,
                    //验证码类型：https://www.bingtop.com/type/
                    "captchaType": 1310, //滑块式图像，返回缺口位置 x,y 坐标值
                    "requestId": requestId  // 添加请求ID用于跟踪
                },{
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                });

                var endTime = Date.now();
                var duration = endTime - startTime;
                taskLog("API请求完成，耗时: " + duration + "ms，请求ID: " + requestId);
                taskLog("HTTP响应状态码: " + response.statusCode);
                taskLog("HTTP响应头: " + JSON.stringify(response.headers));

                var dictdata = response.body.json();
                taskLog("冰拓打码结果: " + JSON.stringify(dictdata, null, 2));
                taskLog("请求ID: " + requestId);
                
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
                
                if (dictdata && dictdata["data"] && dictdata["data"]["recognition"]) {
                    var captchaCode = dictdata["data"]["recognition"]; // 得到验证码，存于captchaCode变量中
                    taskLog("冰拓API调用成功，返回结果: " + captchaCode + "，请求ID: " + requestId);
                    result = captchaCode;
                } else {
                    taskLog("冰拓API返回数据格式异常，请求ID: " + requestId);
                    throw new Error("API返回数据格式异常");
                }
            } catch (e) {
                taskLog("冰拓API调用异常: " + e.message + "，请求ID: " + requestId);
                taskLog("异常堆栈: " + e.stack);
                throw e;
            } finally {
                // 清除超时定时器
                clearTimeout(timeoutId);
            }
            
            // 检查是否超时
            if (timeoutReached) {
                throw new Error("请求超时，超过" + timeoutMs + "ms");
            }
            
            // 如果成功获取结果，直接返回
            if (result) {
                taskLog("=== 第" + attempt + "次尝试成功 ===");
                return result;
            }
            
        } catch (e) {
            taskLog("第" + attempt + "次尝试失败: " + e.message + "，请求ID: " + requestId);
            taskLog("异常堆栈: " + e.stack);
            
            // 如果是最后一次尝试，抛出异常
            if (attempt === maxRetries) {
                taskLog("=== 所有重试尝试都失败了 ===");
                throw new Error("冰拓API调用失败，已重试" + maxRetries + "次，最后错误: " + e.message);
            } else {
                taskLog("准备进行第" + (attempt + 1) + "次重试...");
                // 等待一段时间后重试
                sleep(2000);
            }
        } finally {
            // 无论成功还是失败，都要重置标志
            bingtopApiCallInProgress = false;
            taskLog("重置API调用标志为false，请求ID: " + requestId);
            taskLog("=== 第" + attempt + "次尝试结束 ===");
        }
    }
    
    taskLog("=== 冰拓API调用结束（所有重试都失败） ===");
    return null;
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
    // 申请截图权限（会弹系统录屏权限框），只申请一次
    if (!requestScreenCapture()) {
        taskLog("自动化任务-申请截图权限失败");
        return null; // 如果权限申请失败，直接返回null
    }

    // 截一张整屏
    var img = captureScreen();           // 返回 Image 对象
    if (!img) {
        taskLog("自动化任务-截图失败");
        return null; // 如果截图失败，直接返回null
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
                        taskLog("找到底部控件: continue" );
                        button.click();
                        // break;
                    }
                }
            }
        }
        sleep(random(5000, 8000))


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
        sleep(random(50000, 80000))


        //此时出现验证码，开始使用冰拓进行打码
        taskLog("=== 开始验证码处理流程 ===");
        taskLog("当前时间: " + new Date().toISOString());
        
        //1.先截图，保存
        taskLog("步骤1: 开始截图验证码");
        var screenshotResult = save_Bingtop_Pic();
        if (!screenshotResult) {
            taskLog("截图失败，无法进行冰拓打码");
            throw new Error("验证码截图失败");
        }
        taskLog("验证码截图成功，文件路径: " + screenshotResult);

        //2.调用冰拓打码
        taskLog("步骤2: 开始调用冰拓打码API");
        taskLog("调用前bingtopApiCallInProgress状态: " + bingtopApiCallInProgress);
        
        var captchaCode = use_Bingtop_code();
        
        taskLog("冰拓打码API调用完成，返回结果: " + captchaCode);
        taskLog("调用后bingtopApiCallInProgress状态: " + bingtopApiCallInProgress);
        
        if(captchaCode){
            taskLog("冰拓打码成功，坐标: " + captchaCode);
            
            //3.执行滑块移动
            taskLog("步骤3: 开始执行滑块移动");
            var moveResult = performSliderMove(captchaCode);
            if(moveResult){
                taskLog("滑块移动成功，等待验证码系统验证...");
                // 给足够时间让滑块完全到达目标位置
                sleep(random(3000, 5000)); // 等待3-5秒，确保滑块到达目标
                taskLog("验证码验证等待完成");
            }else{
                taskLog("滑块移动失败");
            }
        }else{
            taskLog("冰拓打码失败，无法获取验证码坐标");
        }
        
        taskLog("=== 验证码处理流程结束 ===");

        
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

function saveDebugScreenshot(path, saveDir) {
    if (!requestScreenCapture()) {
        toast("申请截图权限失败，无法保存调试图");
        return null;
    }
    sleep(1000);
    var img = captureScreen();
    if (!img) {
        toast("截图失败");
        return null;
    }
    if (!files.exists(saveDir)) files.createWithDirs(saveDir);

    var paint = new Paint();
    paint.setStrokeWidth(6);
    paint.setColor(colors.parseColor("#FF0000"));
    paint.setStyle(Paint.Style.STROKE);
    paint.setAntiAlias(true);

    var circlePaint = new Paint();
    circlePaint.setColor(colors.parseColor("#00FF00"));
    circlePaint.setStyle(Paint.Style.FILL);
    circlePaint.setAntiAlias(true);

    var canvas = new Canvas(img);
    var pathObj = new android.graphics.Path();
    pathObj.moveTo(path[0][0], path[0][1]);
    for (var i = 1; i < path.length; i++) pathObj.lineTo(path[i][0], path[i][1]);
    canvas.drawPath(pathObj, paint);

    var start = path[0], end = path[path.length - 1];
    canvas.drawCircle(start[0], start[1], 12, circlePaint);
    canvas.drawCircle(end[0], end[1], 18, circlePaint);

    var filename = "slider_debug_" + new Date().getTime() + ".png";
    var savePath = files.join(saveDir, filename);
    images.save(img, savePath, "png", 100);
    img.recycle();

    taskLog("✅ 已保存调试截图：" + savePath);
    return savePath;
}

// ==== 兼容 Auto.js 的轨迹可视化（修正版） ====
function showGesturePath(path, durationMs) {
    if (!path || path.length === 0) return;

    // 悬浮窗画布
    var w = floaty.rawWindow(
        <canvas id="cv" layout_width="match_parent" layout_height="match_parent"/>
    );
    w.setSize(device.width, device.height);
    w.setTouchable(false);

    // 画笔
    var linePaint = new Paint();
    linePaint.setStrokeWidth(6);
    linePaint.setStyle(Paint.Style.STROKE);
    linePaint.setColor(colors.parseColor("#FF4081"));
    linePaint.setAntiAlias(true);

    var dotPaint = new Paint();
    dotPaint.setColor(colors.parseColor("#00FF00"));
    dotPaint.setStyle(Paint.Style.FILL);
    dotPaint.setAntiAlias(true);

    // 动画进度
    var idx = 1; // 当前要画到第几个点
    var total = path.length;
    var stepDelay = Math.max(8, Math.floor(durationMs / total));

    // 在 draw 回调里画图：c 是 android.graphics.Canvas
    w.cv.on("draw", function (c) {
        // 清屏：用透明色覆盖
        c.drawARGB(0, 0, 0, 0);

        if (idx <= 1) return;

        // 画线
        var pth = new android.graphics.Path();
        pth.moveTo(path[0][0], path[0][1]);
        for (var i = 1; i < idx && i < total; i++) {
            pth.lineTo(path[i][0], path[i][1]);
        }
        c.drawPath(pth, linePaint);

        // 画当前点
        if (idx < total) {
            c.drawCircle(path[idx][0], path[idx][1], 10, dotPaint);
        } else {
            // 结束时在末点加个较大的点
            c.drawCircle(path[total - 1][0], path[total - 1][1], 14, dotPaint);
        }
    });

    // 驱动动画的线程：更新 idx 并请求重绘
    var t = threads.start(function () {
        while (idx <= total) {
            ui.run(() => w.cv.invalidate()); // 请求重绘
            sleep(stepDelay);
            idx++;
        }
        // 保留2秒让你看清楚，再关闭
        sleep(2000);
        ui.run(() => w.close());
    });
}


// ===== 人性化手势轨迹函数 =====
function performGestureLikeHuman(startX, startY, endX, endY) {
    const totalTime = 1400 + random(100, 300); // 拖动总时长
    const steps = 25; // 分段数
    const path = [];
    const totalDist = endX - startX;

    for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        // 缓入缓出公式
        const ease = Math.pow(progress, 0.8) * (3 - 2 * progress);
        const currentX = startX + totalDist * ease;
        const currentY = startY + random(-1, 1); // 模拟手抖
        path.push([Math.round(currentX), Math.round(currentY)]);
    }

    sleep(200); // 模拟手指按下停顿
    gesture(totalTime, path); // 执行手势
}




/**
 * TikTok 滑块验证 - 只拖一个滑块的最简版
 */
function performSliderMove(captchaCode) {
    taskLog("=== 开始执行滑块移动（只拖一个滑块版） ===");
    taskLog("冰拓返回坐标：" + captchaCode);

    // 解析冰拓返回的坐标
    const coords = captchaCode.split(",");
    const relativeX = parseInt(coords[0]);
    if (isNaN(relativeX)) throw new Error("坐标解析失败：" + captchaCode);

    // 尝试查找唯一的滑块控件
    taskLog("开始查找滑块控件...");
    let slider = null;
    for (let i = 0; i < 10; i++) {
        // TikTok 滑块一般是 android.view.View 且 clickable
        let candidates = className("android.view.View")
            .clickable(true)
            .visibleToUser(true)
            .find();
        if (candidates.length > 0) {
            // 取第一个较大的（宽高 80~200 的）
            for (let v of candidates) {
                let b = v.bounds();
                if (b.width() >= 80 && b.width() <= 200 && b.height() >= 80 && b.height() <= 200) {
                    slider = v;
                    break;
                }
            }
        }
        if (slider) break;
        sleep(500);
    }

    if (!slider) throw new Error("未找到滑块控件");

    // 获取滑块中心坐标
    const sb = slider.bounds();
    const startX = Math.round(sb.centerX());
    const startY = Math.round(sb.centerY());
    taskLog(`✅ 找到滑块: (${startX},${startY}), 宽=${sb.width()}, 高=${sb.height()}`);

    // 计算终点坐标
    const endX = startX + relativeX - 8; // -8 是微调防止超出
    const endY = startY;
    taskLog(`开始拖动滑块 → (${startX},${startY}) → (${endX},${endY})`);

    // 执行手势拖动
    gesture(1200, [startX, startY], [endX, endY]);

    sleep(2500);
    taskLog("=== performSliderMove 滑块拖拽结束 ===");
}









/**
 * 模拟人类拖拽行为（带轨迹、速度变化）
 * @param {number} startX 起点X
 * @param {number} startY 起点Y
 * @param {number} endX   终点X
 * @param {number} endY   终点Y
 * @param {number} duration 拖动时长（毫秒）
 */
function performHumanDrag(startX, startY, endX, endY, duration) {
    try {
        // 确保触控模块可用
        if (typeof ra === "undefined") {
            ra = new RootAutomator();
        }

        var steps = random(18, 28); // 模拟人类手指多段拖动
        var stepX = (endX - startX) / steps;
        var stepY = (endY - startY) / steps;
        var delay = duration / steps;

        ra.touchDown(startX, startY);

        for (var i = 0; i < steps; i++) {
            // 模拟人手轨迹微抖动
            var moveX = startX + stepX * i + random(-1, 1);
            var moveY = startY + stepY * i + random(-1, 1);

            // 模拟加速-减速曲线（前快后慢）
            var speedFactor = Math.sin((i / steps) * Math.PI);
            ra.touchMove(moveX, moveY);
            sleep(delay * speedFactor * random(0.8, 1.3));
        }

        ra.touchUp(endX, endY);
        taskLog("人类拖动完成，路径：" + steps + "步，总时长约" + duration + "ms");

    } catch (e) {
        taskLog("模拟人类拖拽异常：" + e.message);
    }
}


/**
 * 查找滑块元素
 * @returns {Object} 滑块元素对象
 */
// function findSliderElement() {
//     try {
//         taskLog("开始查找滑块元素...");
        
//         // 等待验证码对话框完全加载
//         taskLog("等待验证码对话框加载...");
//         sleep(2000);
        
//         // 方法1：查找所有可拖拽的元素，收集所有候选元素
//         taskLog("方法1：查找所有可拖拽的元素");
//         var elementTypes = [
//             "android.view.View",
//             "android.widget.ImageView", 
//             "android.widget.Button",
//             "android.widget.TextView",
//             "android.widget.LinearLayout",
//             "android.widget.RelativeLayout",
//             "android.widget.FrameLayout"
//         ];
        
//         var candidateElements = []; // 存储所有候选滑块元素
        
//         for (var typeIndex = 0; typeIndex < elementTypes.length; typeIndex++) {
//             var elementType = elementTypes[typeIndex];
//             taskLog("查找元素类型: " + elementType);
            
//             var elements = className(elementType).find();
//             taskLog("找到" + elementType + "元素总数：" + (elements ? elements.size() : 0));
            
//             if (elements && elements.size() > 0) {
//                 for (var i = 0; i < elements.size(); i++) {
//                     var element = elements.get(i);
//                     if (element) {
//                         var bounds = element.bounds();
//                         var isClickable = element.clickable();
//                         var desc = element.desc();
//                         var text = element.text();
//                         var id = element.id();
                        
//                         // 简化判断：只要是合理大小的元素就认为是可拖拽的
//                         if (bounds.height() > 50 && bounds.height() < 200 && 
//                             bounds.width() > 50 && bounds.width() < 300) {
//                             taskLog("发现候选滑块元素[" + i + "]: 类型=" + elementType + 
//                                    ", 高度=" + bounds.height() + ", 宽度=" + bounds.width() + 
//                                    ", clickable=" + isClickable + ", 位置=(" + bounds.left + "," + bounds.top + ")");
//                             candidateElements.push({
//                                 element: element,
//                                 type: elementType,
//                                 index: i,
//                                 bounds: bounds,
//                                 clickable: isClickable
//                             });
//                         }
//                     }
//                 }
//             }
//         }
        
//         // 选择第二个滑块（索引为1）
//         if (candidateElements.length >= 2) {
//             taskLog("找到" + candidateElements.length + "个候选滑块元素，选择第二个滑块（索引1）");
//             var secondSlider = candidateElements[1];
//             taskLog("选择的第二个滑块：类型=" + secondSlider.type + "，位置=(" + secondSlider.bounds.left + "," + secondSlider.bounds.top + ")，大小=" + secondSlider.bounds.width() + "x" + secondSlider.bounds.height());
//             return secondSlider.element;
//         } else if (candidateElements.length === 1) {
//             taskLog("只找到1个候选滑块元素，使用第一个滑块");
//             return candidateElements[0].element;
//         }
        
//         // 方法2：查找所有Button元素（简化版）
//         taskLog("方法2：查找所有Button元素");
//         var allButtonElements = className("android.widget.Button").find();
//         taskLog("找到所有Button元素总数：" + (allButtonElements ? allButtonElements.size() : 0));
        
//         if (allButtonElements && allButtonElements.size() > 0) {
//             var buttonCandidates = [];
//             for (var k = 0; k < allButtonElements.size(); k++) {
//                 var element = allButtonElements.get(k);
//                 if (element) {
//                     var bounds = element.bounds();
//                     var isClickable = element.clickable();
                    
//                     // 简化判断：只要是合理大小的Button就认为是可拖拽的
//                     if (bounds.height() > 50 && bounds.height() < 200 && 
//                         bounds.width() > 50 && bounds.width() < 300) {
//                         taskLog("发现候选Button滑块元素[" + k + "]: 高度=" + bounds.height() + ", 宽度=" + bounds.width() + ", clickable=" + isClickable + ", 位置=(" + bounds.left + "," + bounds.top + ")");
//                         buttonCandidates.push({
//                             element: element,
//                             bounds: bounds,
//                             clickable: isClickable
//                         });
//                     }
//                 }
//             }
            
//             // 如果有多个Button候选，选择最合适的
//             if (buttonCandidates.length > 0) {
//                 if (buttonCandidates.length > 1) {
//                     taskLog("找到" + buttonCandidates.length + "个候选Button滑块元素，选择最合适的");
//                     // 优先选择可点击的
//                     for (var l = 0; l < buttonCandidates.length; l++) {
//                         if (buttonCandidates[l].clickable) {
//                             taskLog("选择可点击的Button滑块元素[" + l + "]");
//                             return buttonCandidates[l].element;
//                         }
//                     }
//                     // 如果没有可点击的，选择位置最靠右的
//                     var rightmostButton = buttonCandidates[0];
//                     for (var m = 1; m < buttonCandidates.length; m++) {
//                         if (buttonCandidates[m].bounds.left > rightmostButton.bounds.left) {
//                             rightmostButton = buttonCandidates[m];
//                         }
//                     }
//                     taskLog("选择位置最靠右的Button滑块元素");
//                     return rightmostButton.element;
//                 } else {
//                     taskLog("找到1个候选Button滑块元素");
//                     return buttonCandidates[0].element;
//                 }
//             }
//         }
        
//         // 方法3：查找所有ImageView元素
//         taskLog("方法3：查找所有ImageView元素");
//         var allImageElements = className("android.widget.ImageView").find();
//         taskLog("找到所有ImageView元素总数：" + (allImageElements ? allImageElements.size() : 0));
        
//         if (allImageElements && allImageElements.size() > 0) {
//             var imageCandidates = [];
//             for (var m = 0; m < allImageElements.size(); m++) {
//                 var element = allImageElements.get(m);
//                 if (element) {
//                     var bounds = element.bounds();
//                     var isClickable = element.clickable();
                    
//                     // 简化判断：只要是合理大小的ImageView就认为是可拖拽的
//                     if (bounds.height() > 50 && bounds.height() < 200 && 
//                         bounds.width() > 50 && bounds.width() < 300) {
//                         taskLog("发现候选ImageView滑块元素[" + m + "]: 高度=" + bounds.height() + ", 宽度=" + bounds.width() + ", clickable=" + isClickable + ", 位置=(" + bounds.left + "," + bounds.top + ")");
//                         imageCandidates.push({
//                             element: element,
//                             bounds: bounds,
//                             clickable: isClickable
//                         });
//                     }
//                 }
//             }
            
//             // 如果有多个ImageView候选，选择最合适的
//             if (imageCandidates.length > 0) {
//                 if (imageCandidates.length > 1) {
//                     taskLog("找到" + imageCandidates.length + "个候选ImageView滑块元素，选择最合适的");
//                     // 优先选择可点击的
//                     for (var n = 0; n < imageCandidates.length; n++) {
//                         if (imageCandidates[n].clickable) {
//                             taskLog("选择可点击的ImageView滑块元素[" + n + "]");
//                             return imageCandidates[n].element;
//                         }
//                     }
//                     // 如果没有可点击的，选择位置最靠右的
//                     var rightmostImage = imageCandidates[0];
//                     for (var o = 1; o < imageCandidates.length; o++) {
//                         if (imageCandidates[o].bounds.left > rightmostImage.bounds.left) {
//                             rightmostImage = imageCandidates[o];
//                         }
//                     }
//                     taskLog("选择位置最靠右的ImageView滑块元素");
//                     return rightmostImage.element;
//                 } else {
//                     taskLog("找到1个候选ImageView滑块元素");
//                     return imageCandidates[0].element;
//                 }
//             }
//         }
        
//         // 方法4：如果前面都没找到，直接使用第一个合理大小的元素
//         taskLog("方法4：查找任意合理大小的元素");
//         var allElements = className("android.view.View").find();
//         taskLog("找到所有View元素总数：" + (allElements ? allElements.size() : 0));
        
//         if (allElements && allElements.size() > 0) {
//             for (var n = 0; n < allElements.size(); n++) {
//                 var element = allElements.get(n);
//                 if (element) {
//                     var bounds = element.bounds();
//                     var isClickable = element.clickable();
                    
//                     // 只要是合理大小的元素就认为是可拖拽的
//                     if (bounds.height() > 30 && bounds.height() < 300 && 
//                         bounds.width() > 30 && bounds.width() < 500) {
//                         taskLog("发现可拖拽View元素[" + n + "]: 高度=" + bounds.height() + ", 宽度=" + bounds.width() + ", clickable=" + isClickable);
//                         return element;
//                     }
//                 }
//             }
//         }
        
//         // 方法5：如果还是找不到，返回null
//         taskLog("方法5：未找到任何可拖拽的元素");
//         return null;
        
//     } catch (e) {
//         taskLog("查找滑块元素异常：" + e.message);
//         return null;
//     }
// }

/**
 * 查找 TikTok 滑块控件
 * @returns {UiObject|null}
 */
function findSliderElement() {
    // 常见滑块控件类型组合
    const sliderCandidates = [
        className("android.widget.ImageView"),
        className("android.view.View"),
        className("android.widget.FrameLayout")
    ];

    for (let finder of sliderCandidates) {
        var list = finder.visibleToUser(true).find();
        for (let i = 0; i < list.length; i++) {
            var b = list[i].bounds();
            var w = b.width(), h = b.height();

            // 滑块通常宽高在 80~180 范围内（中间小块）
            if (w > 60 && w < 200 && h > 60 && h < 200) {
                taskLog("✅ 找到可能的滑块元素: " + JSON.stringify(b));
                return list[i];
            }
        }
    }

    taskLog("⚠ 未检测到滑块元素，稍后重试");
    return null;
}



/**
 * 缓动函数 - 三次贝塞尔曲线，让移动更加自然
 * @param {number} t 进度值 (0-1)
 * @returns {number} 缓动后的进度值
 */
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * 执行拖拽操作 - 专门针对滑块验证码优化
 * @param {number} startX 起始X坐标
 * @param {number} startY 起始Y坐标
 * @param {number} endX 结束X坐标
 * @param {number} endY 结束Y坐标
 * @returns {boolean} 拖拽是否成功
 */
function performDrag(startX, startY, endX, endY) {
    try {
        taskLog("开始执行滑块拖拽：从(" + startX + "," + startY + ")到(" + endX + "," + endY + ")");
        
        // 确保坐标在屏幕范围内
        startX = Math.max(0, Math.min(startX, device.width));
        startY = Math.max(0, Math.min(startY, device.height));
        endX = Math.max(0, Math.min(endX, device.width));
        endY = Math.max(0, Math.min(endY, device.height));
        
        // 计算移动距离
        var deltaX = endX - startX;
        var deltaY = endY - startY;
        var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        taskLog("移动距离：" + distance + "像素，deltaX=" + deltaX + ", deltaY=" + deltaY);
        
        // 强制执行拖拽操作，确保拖拽能够正常进行
        taskLog("开始强制拖拽操作");
        taskLog("拖拽参数：起始(" + startX + "," + startY + ")，目标(" + endX + "," + endY + ")，距离=" + distance);
        
        // 确保坐标有效
        if (startX < 0 || startY < 0 || endX < 0 || endY < 0) {
            taskLog("坐标无效，无法执行拖拽");
            return false;
        }
        
        // 使用最简单直接的拖拽方法
        taskLog("执行单次直接拖拽");
        var dragDuration = Math.max(2000, Math.min(5000, distance * 2));
        taskLog("拖拽持续时间：" + dragDuration + "ms");
        
        try {
            // 使用gesture精确拖拽方法，但保持快速移动
            taskLog("使用gesture精确快速拖拽方法");
            
            // 创建精确的拖拽路径点 - 平衡精度和速度
            var path = [];
            var steps = Math.max(4, Math.min(10, Math.floor(distance / 15))); // 适中的步数，保证精度
            
            for (var step = 0; step <= steps; step++) {
                var progress = step / steps;
                // 使用轻微的缓动，让移动更自然但不会太慢
                var easedProgress = easeInOutQuad(progress);
                var currentX = Math.round(startX + (endX - startX) * easedProgress);
                var currentY = Math.round(startY + (endY - startY) * easedProgress);
                path.push([currentX, currentY]);
            }
            
            taskLog("精确拖拽路径点数：" + path.length);
            taskLog("拖拽路径：" + JSON.stringify(path));
            
            // 执行gesture拖拽 - 使用适中的速度，确保到达目标位置
            var fastDuration = Math.max(2000, Math.min(4000, distance * 2.5)); // 稍微慢一点，确保到达目标
            taskLog("精确拖拽持续时间：" + fastDuration + "ms");
            gesture(fastDuration, path);
            taskLog("精确gesture拖拽完成");
            
            // 等待拖拽完成，确保滑块到达目标位置
            sleep(800);
            taskLog("拖拽操作完成，等待系统响应");
            
        } catch (gestureError) {
            taskLog("主要gesture拖拽失败：" + gestureError.message);
            taskLog("尝试备用gesture方案");
            
            // 备用方案：使用更简单的gesture路径
            try {
                var simplePath = [
                    [startX, startY],
                    [Math.round((startX + endX) / 2), Math.round((startY + endY) / 2)],
                    [endX, endY]
                ];
                var simpleDuration = Math.max(1800, Math.min(3500, distance * 2.2));
                taskLog("备用gesture路径：" + JSON.stringify(simplePath));
                taskLog("备用gesture持续时间：" + simpleDuration + "ms");
                gesture(simpleDuration, simplePath);
                taskLog("备用gesture拖拽完成");
                sleep(600);
            } catch (backupError) {
                taskLog("备用gesture也失败：" + backupError.message);
                return false;
            }
        }
        
        // 等待验证码系统处理 - 给足够时间让滑块到达目标位置
        taskLog("等待验证码系统验证...");
        sleep(random(2000, 3500));
        
        taskLog("滑块拖拽执行完成");
        return true;
        
    } catch (e) {
        taskLog("滑块拖拽异常：" + e.message);
        
        // 备用方案：强制gesture拖拽
        try {
            taskLog("尝试备用方案：强制gesture拖拽");
            var simpleDuration = Math.max(2500, Math.min(5000, distance * 3));
            
            // 方法1：尝试简单gesture
            try {
                var simplePath = [
                    [startX, startY],
                    [endX, endY]
                ];
                gesture(simpleDuration, simplePath);
                taskLog("备用简单gesture拖拽完成");
            } catch (gestureError) {
                taskLog("备用简单gesture失败：" + gestureError.message);
                
                // 方法2：尝试多点gesture
                try {
                    var multiPath = [
                        [startX, startY],
                        [Math.round(startX + (endX - startX) * 0.3), Math.round(startY + (endY - startY) * 0.3)],
                        [Math.round(startX + (endX - startX) * 0.7), Math.round(startY + (endY - startY) * 0.7)],
                        [endX, endY]
                    ];
                    gesture(simpleDuration, multiPath);
                    taskLog("备用多点gesture拖拽完成");
                } catch (multiGestureError) {
                    taskLog("备用多点gesture也失败：" + multiGestureError.message);
                    
                    // 方法3：尝试多次点击
                    taskLog("尝试多次点击方法");
                    var steps = Math.max(3, Math.min(6, Math.floor(distance / 30)));
                    for (var k = 0; k < steps; k++) {
                        var progress = k / (steps - 1);
                        var currentX = Math.round(startX + (endX - startX) * progress);
                        var currentY = Math.round(startY + (endY - startY) * progress);
                        click(currentX, currentY);
                        sleep(150);
                    }
                    taskLog("多次点击拖拽完成");
                }
            }
            
            sleep(1000);
            taskLog("备用拖拽完成");
            return true;
        } catch (e2) {
            taskLog("所有拖拽方法都失败：" + e2.message);
            return false;
        }
    }
}

/**
 * 缓动函数：二次缓动（开始慢，中间快，结束慢）
 * @param {number} t 进度值 (0-1)
 * @returns {number} 缓动后的进度值
 */
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * 缓动函数：三次缓动（更平滑的曲线）
 * @param {number} t 进度值 (0-1)
 * @returns {number} 缓动后的进度值
 */
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 执行主函数
main();


