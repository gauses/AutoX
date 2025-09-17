// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

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

//******************************************************************
//***********************Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶  *************************
//******************************************************************


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
        LOG_DIR: "/sdcard/Download/log/"
    },
    
    // 超时配置
    TIMEOUTS: {
        SHORT: 3000,
        MEDIUM: 5000,
        LONG: 10000
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
        USERS_TAB: {
            ZH_CN: "用户",
            ZH_TW: "使用者",
            EN_US: "Users"
        },
        MESSAGE: {
            ZH_CN: "消息",
            ZH_TW: "訊息",
            EN_US: "Message"
        }
    },
    
    // 日志配置
    LOG: {
        FILENAME: "nest_task_log.txt",
        IMG_NAME: "nest_task_log.png"
    }
};

// 私信配置
var TT_Like_User_ID_GROUP = '$${T_关注用户ID列表}';
var TT_Message_GROUP = '$${T_私信用户文案列表}';

// 临时兼容性常量（为了向后兼容，稍后会全部替换）
var GLOBAL_TikTokPackageName = CONFIG.APP.GLOBAL_PACKAGE;
var ASIA_TikTokPackageName = CONFIG.APP.ASIA_PACKAGE;

//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = CONFIG.LOG.FILENAME;
var taskLogImgName = CONFIG.LOG.IMG_NAME;



// 全局变量
var targetPackageName = null;
var targetClassName = null;
var elementCache = new Map();
var handleErrorFlag = false;

// 私信统计参数
var total_target = 0;        // 需要私信的用户总数
var total_success = 0;       // 成功私信的用户数量
var fail_msg = "";           // 私信时出现的错误信息

// 路径配置
var RPAFilePath = CONFIG.PATHS.LOG_DIR;
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

//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
// console.show()

//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
events.on('exit', function(){
    console.hide();
    sleep(1000);

    // 输出统计信息
    taskLog("=== 私信统计信息 ===");
    taskLog("目标私信数量：" + total_target);
    taskLog("成功私信数量：" + total_success);
    taskLog("失败数量：" + (total_target - total_success));
    if (fail_msg) {
        taskLog("失败信息：" + fail_msg);
    }
    taskLog("成功率：" + (total_target > 0 ? (total_success / total_target * 100).toFixed(2) + "%" : "0%"));
    taskLog("========================");

    if(handleErrorFlag){
        Logger.error("脚本执行出现异常");
        Logger.error("TikTok私信任务执行失败");
        Logger.error("脚本执行时间：" + new Date().toLocaleString());
    } else {
        forceStop_APP(targetPackageName);
        Logger.info("脚本功能执行结束");
        Logger.info("TikTok私信任务执行完成");
        Logger.info("脚本执行时间：" + new Date().toLocaleString());
    }
    
    // 清理资源
    Utils.cleanup();
    openLogActivity();
});

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




function getSystemDate(a) {
    var b = new SimpleDateFormat("HH:mm:ss"), c = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    return "tf" == a ? b.format(new java.util.Date()) :"df" == a ? c.format(new java.util.Date()) :void 0;
}

//打印日志
function taskLog(_log){
    // 显示toast提示
    toast(_log);
    
    // 使用console.log输出（现在会自动写入文件）
    console.log(_log);
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

    //========================================================================================================================


    //结束当前任务
    function stopCurrentTask(){
        // saveImg()

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
                    
                    sleep(1000);  // 点击前等待
                    click(button1.bounds().centerX(), button1.bounds().centerY())
                    sleep(1000);  // 点击后等待
                    break; // 跳出循环
                }else if(button2){
                    taskLog("找到" + findText_ZH_TW);
                    taskLog("找到button2 = " + button2.clickable() );
                    taskLog("找到button2 centerX= " + button2.bounds().centerX() );
                    taskLog("找到button2 centerY= " + button2.bounds().centerY() );

                    clickText(findText_ZH_TW)
                    //  click(button2.bounds().centerX(), button2.bounds().centerY())
                    break; // 跳出循环
                }else if(button3){
                    taskLog("找到" + findText_EN_US);
                    taskLog("找到button3 = " + button3.clickable() );
                    //  clickText(findText_EN_US)
                    sleep(1000);  // 点击前等待
                    click(button3.bounds().centerX(), button3.bounds().centerY())
                    sleep(1000);  // 点击后等待
                    break; // 跳出循环
                }
                sleep(1000)

            }
    }



    //通过Button的Desc
    function find_btn_desc_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

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
                //  var button1 = className("android.widget.Button").desc(findText_ZH_CN).findOne(1000);
                //  var button2 = className("android.widget.Button").desc(findText_ZH_TW).findOne(1000);
                //  var button3 = className("android.widget.Button").desc(findText_EN_US).findOne(1000);
                var button1 = desc(findText_ZH_CN).findOne(1000);
                var button2 = desc(findText_ZH_TW).findOne(1000);
                var button3 = desc(findText_EN_US).findOne(1000);


                if (button1) {
                    taskLog("找到" + findText_ZH_CN);
                    taskLog("找到button1 = " + button1.clickable() );
                    clickDesc(findText_ZH_CN)
                    break; // 跳出循环
                }else if(button2){
                    taskLog("找到" + findText_ZH_TW);
                    taskLog("找到button2 = " + button2.clickable() );
                    clickDesc(findText_ZH_TW)
                    break; // 跳出循环
                }else if(button3){
                    taskLog("找到" + findText_EN_US);
                    taskLog("找到button3 = " + button3.clickable() );
                    clickDesc(findText_EN_US)
                    break; // 跳出循环
                }

                sleep(1000)

            }
    }




    //通过TextView的text
    function find_textview_text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){
        //是否找到该TextView，找到：true / 未找到：false
        var findText_result = false
        var loopCount = 0

        while (true) {
            taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
            if (loopCount >= 3) {
                taskLog("循环已执行3次，即将退出循环。");
                break;
            }

            // 使用正则表达式匹配可能带有前导空格的文本
            var button1 = textMatches("^\\s*" + findText_ZH_CN + "$").className("android.widget.TextView").findOne(1000);
            var button2 = textMatches("^\\s*" + findText_ZH_TW + "$").className("android.widget.TextView").findOne(1000);
            var button3 = textMatches("^\\s*" + findText_EN_US + "$").className("android.widget.TextView").findOne(1000);

            if (button1) {
                taskLog("找到" + findText_ZH_CN);
                taskLog("找到" + button1.clickable());
                click(button1.bounds().centerX(), button1.bounds().centerY());
                findText_result = true
                break;
            } else if(button2) {
                taskLog("找到" + findText_ZH_TW);
                taskLog("找到" + button2.clickable());
                click(button2.bounds().centerX(), button2.bounds().centerY());
                findText_result = true
                break;
            } else if(button3) {
                taskLog("找到" + findText_EN_US);
                taskLog("找到" + button3.clickable());
                click(button3.bounds().centerX(), button3.bounds().centerY());
                findText_result = true
                break;
            }

            sleep(1000)
        }
        return findText_result
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


    

 //点击首页的右上角Search按钮
function click_home_search_btn(){
    var find_search_btn_count = 0
    if(find_search_btn_count > 5){
        console.error("首页寻找'搜索'按钮超过5次，抛出异常")
        throw new error("首页寻找'搜索'按钮超过5次，抛出异常")
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
                if (img.id() == (CONFIG.APP.GLOBAL_PACKAGE+":id/h0i") || img.id() == (CONFIG.APP.ASIA_PACKAGE+":id/h0j")) {
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
                if (btn.id() == (CONFIG.APP.GLOBAL_PACKAGE +":id/tk1") || btn.id() == (CONFIG.APP.ASIA_PACKAGE +":id/tk4")) {
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

                if (linearLayout.id() == (CONFIG.APP.GLOBAL_PACKAGE +":id/iz8") || linearLayout.id() == (CONFIG.APP.ASIA_PACKAGE +":id/iz9")) {
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
        clickId("dh4") 
    }



    //点击评论按钮
    function click_Comment_Btn(commentText){
        taskLog("开始准备评论视频")
        clickId("cgq")

        sleep(5000)
        var autoCompleteTextViews = className("android.widget.EditText").find();
        for(var i = 0; i < autoCompleteTextViews.size(); i++) {
            var textView = autoCompleteTextViews.get(i);
            if(textView) {
                taskLog("找到TextView控件-Text："+ textView.text());
                sleep(1000)
                taskLog("评论控件，设置内容：" +commentText );
                textView.setText(commentText)
                sleep(10000)

                var flag = clickId("cik") //发送按钮
                // if(flag){
                //     sleep(3000)
                //     back();
                // }

                sleep(2000)
                // clickId("aru") //评论区右上角关闭按钮

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
        // id("egc").className("android.widget.ImageView").findOne().click()
        clickId("egc")

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



    //获取私信列表
function get_all_comments(){
    // 用于存储用户的数组
    let comments = [];
    // 户是否存在
    const file = new java.io.File(TT_Message_GROUP);
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
        comments.push(TT_Message_GROUP);
    }
    
    return comments
}



    //获取私信对象
    function get_all_TT_Users(){
        // 用于存储用户的数组
        let comments = [];
        // 户是否存在
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
        
        return comments
    }


// 主执行函数
function main() {
    try {
    
    

    // 设置目标私信数量
    var all_TT_Comment_TEXT = get_all_comments()
    if(all_TT_Comment_TEXT.includes("$${T")){ 
        throw_error_storage_not_enough()
    }
    
    var all_TT_Users = get_all_TT_Users()
    if(all_TT_Users.includes("$${T")){ 
        throw_error_storage_not_enough()
    }
    
    total_target = all_TT_Users.length;
    taskLog("开始执行TikTok私信任务，目标私信数量：" + total_target);
    Logger.info("开始执行TikTok私信任务");
    
    toast("所有需要私信的文本数量 = " + all_TT_Comment_TEXT.length)
    sleep(random(2000,3000))
    toast("所有需要私信的用户数量 = " + all_TT_Users.length)
    sleep(random(2000,3000))



    if(all_TT_Comment_TEXT.length == 0){
        toast("没有需要私信的文本内容") 
        stopCurrentTask()
    } else if(all_TT_Users.length == 0){
        toast("没有需要私信的用户") 
        stopCurrentTask()
    } else{
        sleep(random(2000, 4000))
        click_home_search_btn()
        sleep(random(2000, 4000))



        // 按照顺序开始执行搜索User-ID
        taskLog("- 找到可用的搜索用户, 开始搜索 - ");
        for (var index_user = 0; index_user < all_TT_Users.length; index_user++) {
            var userId = all_TT_Users[index_user];
            taskLog("开始准备获取all_TT_Users的ID = " + userId)
            sleep(random(2000, 4000))

            taskLog("开始准备点击首页搜索按钮")
            var search_edits = className("android.widget.EditText").find();
            for(var i = 0; i < search_edits.size(); i++) {
                var search_edit = search_edits.get(i);
                if(search_edit) {
                    sleep(1000)
                    taskLog("搜索控件，设置用户NAME：" +userId );
                    search_edit.setText(userId)    
                    sleep(random(5000, 8000))
                    
                    taskLog("开始点击Search按钮")
                    click_Second_search_btn()

                    sleep(random(5000, 8000))
                    taskLog("开始点击视频Tab按钮")
                    var findMSGTextResult = find_textview_text_base("用户","使用者","Users")
                    if(!findMSGTextResult) {
                        taskLog("没有找到用户Tab控件，终止本次操作，开始下一个用户的私信行为！！！");
                        back()    
                        break
                    }

                    sleep(random(5000, 8000))
                    //直接点击第一个关注按钮
                    click_LinearLayout_GUANZHU()
                    sleep(random(2000, 4000))

        
                    //text("消息")：点击User的主页的"消息"按钮，准备发信息
                    var findMSGTextResult = find_textview_text_base("訊息", "Message", "消息")
                    if(!findMSGTextResult) {
                        taskLog("没有找到消息控件，终止本次操作，开始下一个用户的私信行为！！！");
                        sleep(3000)
                        back()
                        sleep(1000)
                        back()
                        sleep(3000)
                        break
                    }
                    sleep(random(2000, 4000))

                    var autoCompleteTextViews = className("android.widget.EditText").find();
                    if(autoCompleteTextViews.size() == 0){//这种场景对应的用户：mrbeast
                        taskLog("没有找到訊息控件，终止本次操作，开始下一个用户的私信行为！！！");               
                        back()
                        sleep(random(2000, 4000))
                        back()
                        sleep(random(2000, 4000))
                        back()
                        sleep(1000)
                        break
                    }else{
                        for(var i = 0; i < autoCompleteTextViews.size(); i++) {
                            var textView = autoCompleteTextViews.get(i);
                            if(textView) {
                                taskLog("找到TextView控件-Text："+ textView.text());
                                sleep(1000)

                                var randIdx = random(0, all_TT_Comment_TEXT.length - 1)
                                taskLog("评论文案的下标randIdx："+randIdx)
                                var messageText = all_TT_Comment_TEXT[randIdx];

                                taskLog("评论控件，设置内容：" +messageText );

                                textView.setText(messageText)
                                sleep(random(2000, 4000))

                                var allImages = className("android.widget.ImageView").find();
                                if (allImages && allImages.size() > 0) {
                                    var lastIndex = allImages.size() - 1;
                                    var lastImg = allImages.get(lastIndex);
                                    if (lastImg) {
                                        var bounds = lastImg.bounds();
                                        if (lastImg.clickable()) {
                                            lastImg.click();
                                        } else {
                                            click(bounds.centerX(), bounds.centerY());
                                        }

                                        }
                                }

                                sleep(3000)
                                
                                // 私信发送成功，增加成功计数
                                total_success++;
                                taskLog("私信发送成功！当前成功数量：" + total_success);

                                //开始截图
                                sleep(random(3000, 5000))
                                var screenshotPath = Nest_ScreenCapture();
                                taskLog("已保存完成后的截图：" + screenshotPath);
                                sleep(random(3000, 5000))



                                
                                back()      
                                sleep(1000)
                                back()
                                sleep(1000)
                                back()
                                sleep(5000)
                        }
                    }


                    }

                }
            }


        }

    }




 
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
        taskLog("=== 私信统计信息 ===");
        taskLog("目标私信数量：" + total_target);
        taskLog("成功私信数量：" + total_success);
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

// 执行主函数
main();



