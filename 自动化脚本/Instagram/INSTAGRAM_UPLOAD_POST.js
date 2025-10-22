// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************上传视频*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//名稱.使用者名稱.個人簡介
const INSTAGRAM_UPLOAD_VIDEO_URL = '$${T_需要上傳影片的本地地址}';
const INSTAGRAM_UPLOAD_VIDEO_TITLE = '$${T_上傳影片的标题}';
const INSTAGRAM_UPLOAD_VIDEO_DESC = '$${T_上傳影片的說明}';


var INSTAGRAM_PACKAGE_NAME = 'com.instagram.android';


var targetPackageName = null;
var targetClassName = null;

//将需要处理的多媒体图片，单独copy一份放到这个文件夹里面，后面处理完成之后，再删除这个文件夹
var A_NEST_Instagram_MEDIA = 'A_NEST_Instagram_MEDIA';    


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
        console.error("Tiktok根據關鍵字，搜尋影片瀏覽養號，評論，點讚---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        forceStop_APP(targetPackageName)
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok根據關鍵字，搜尋影片瀏覽養號，評論，點讚---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(targetPackageName)
    console.error("===错误报告开始===");
    console.error("错误信息：" + e);
    console.error("错误堆栈：" + e.stack);
    console.error("===错误报告结束===");
    exit()
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


// 配置对象
var CONFIG = {
    

    
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
        } ,

        //是否分享到Threads
        //可能会出现一个提示，是否同步到Threads
        // var notNowBtn = find_btn_Text_base("Not now", "不要", "現在不要", "Not now")
        NOT_NOW_TO_THREADS: {
            ZH_CN: "不要",
            ZH_TW: "現在不要",
            EN_US: "Not now"
        },

        //是否分享到Facebook
        //可能会出现一个提示，是否同步到Threads
        // var notNowBtn = find_btn_Text_base("Not now", "不要", "現在不要", "Not now")
        NOT_NOW_TO_Facebook: {
            ZH_CN: "不要",
            ZH_TW: "現在不要",
            EN_US: "Not now"
        }


    },
    
    // 日志配置
    LOG: {
        FILENAME: "nest_task_log.txt",
        IMG_NAME: "nest_task_log.png"
    }
};




//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
// console.show()

// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
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
taskLog("准备检查Instagram是否已安装...")

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
}  else {
    toast("未检测到Instagram已安装，请先安装Instagram！");
    taskLog("未检测到Instagram已安装，脚本终止。");
    exit();
}

sleep(random(3000, 5000))
taskLog("检测到已安装Instagram，准备启动...");
app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});


sleep(random(5000, 8000))
openAppSettings(INSTAGRAM_PACKAGE_NAME)
sleep(random(3000, 5000))

forceStop_APP(INSTAGRAM_PACKAGE_NAME)
sleep(3000)

app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});


taskLog("等待Instagram启动完成, 等待时间：" + 13 - 15 + "s")
sleep(random(13000, 15000))
toast("本地视频地址：" + INSTAGRAM_UPLOAD_VIDEO_URL)



//******************************************************************
//******************************************************************
//******************************************************************

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


//从评论数组中，顺序挑选一条标题
function get_TITLE_comment_text(){
    let comments = [];
    // 户是否存在
    taskLog("INSTAGRAM_UPLOAD_VIDEO_TITLE评论数组 =  " + INSTAGRAM_UPLOAD_VIDEO_TITLE)
    const file = new java.io.File(INSTAGRAM_UPLOAD_VIDEO_TITLE);
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
        comments.push(INSTAGRAM_UPLOAD_VIDEO_TITLE);
    }
    
    return comments
}


//从评论数组中，顺序挑选一条描述
function get_DESC_comment_text(){
    let comments = [];
    // 户是否存在
    taskLog("INSTAGRAM_UPLOAD_VIDEO_DESC评论数组 =  " + INSTAGRAM_UPLOAD_VIDEO_DESC)
    const file = new java.io.File(INSTAGRAM_UPLOAD_VIDEO_DESC);
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
        comments.push(INSTAGRAM_UPLOAD_VIDEO_DESC);
    }
    
    return comments
}





// 检查完整路径
function checkPath(fileName) {
    const path = "/storage/emulated/0/Download/" + fileName;
    console.log("checkPath 完整路径: " + path);
    console.log("checkPath 文件是否存在1111: " + files.exists(path));
    let file = new java.io.File(path);
    console.log("checkPath 文件是否存在2222: " + file.exists());

    // 列出目录下所有文件
    // let fileList = files.listDir("/storage/emulated/0/Download/");
    // console.log("目录下的文件: " + fileList.join("\n"));
}

// 遍历并打印出实际的文件名
function listAllFiles(dirPath) {
    let files = new java.io.File(dirPath).listFiles();
    for(let file of files) {
        console.log("文件名: " + file.getName());
        // 打印文件名的每个字符的编码
        let name = file.getName();
        for(let i = 0; i < name.length; i++) {
            console.log(name[i] + ": " + name.charCodeAt(i));
        }
    }
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

// 刷新整个存储的媒体库
function refreshAllMedia() {
    try {
        toast("开始刷新媒体库，用时5秒钟....");
        // 获取外部存储路径
        let storage = files.externalStorage();
        // 发送媒体扫描广播
        media.scanFile(storage);
        // 等待扫描完成
        sleep(5000);
        toast("媒体库刷新完成，开始下一步任务...");
    } catch (error) {
        toast("refreshAllMedia , 媒体库刷新失败，error = " + error);
    }
    
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
    saveImg()

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

    //是否找到该TextView，找到：true / 未找到：false
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
         var button1 = className("android.widget.Button").text(findText_ZH_CN).findOne(3000);
         var button2 = className("android.widget.Button").text(findText_ZH_TW).findOne(3000);
         var button3 = className("android.widget.Button").text(findText_EN_US).findOne(3000);

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
            var button1 = desc(findText_ZH_CN).findOne(3000);
            var button2 = desc(findText_ZH_TW).findOne(3000);
            var button3 = desc(findText_EN_US).findOne(3000);


             if (button1) {
                 taskLog("找到" + findText_ZH_CN);
                 taskLog("找到button1 = " + button1.clickable() );
                 if(button1.clickable()) {
                    button1.click()
                    break; // 跳出循环
                 }else{
                    taskLog("找到button1 ，但是button1不可点击,所以根据坐标点击 " );

                    var X1 = button1.bounds().centerX();
                    var Y1 = button1.bounds().centerY();
                    // 验证 X 和 Y 是否为正数
                    if (X1 < 0 || Y1 < 0) {
                        taskLog("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
                        return
                    }
                    // 生成随机偏差
                    var _X1 = X1 - random(-2, 2);
                    var _Y1 = Y1 - random(-2, 2);
                    click(Math.max(0, _X1) , Math.max(0, _Y1))// 防止偏差导致负值

                    break; // 跳出循环


                 }
             }else if(button2){
                 taskLog("找到" + findText_ZH_TW);
                 taskLog("找到button2 = " + button2.clickable() );
                 if(button2.clickable()) {
                    button2.click()
                 }else{
                    taskLog("找到button2 ，但是button2不可点击,所以根据坐标点击 " );

                    var X2 = button2.bounds().centerX();
                    var Y2 = button2.bounds().centerY();
                    // 验证 X 和 Y 是否为正数
                    if (X2 < 0 || Y2 < 0) {
                        taskLog("坐标无效，中心点X或Y为负值: X=" + X2 + ", Y=" + Y2);
                        return
                    }
                    // 生成随机偏差
                    var _X2 = X2 - random(-2, 2);
                    var _Y2 = Y2 - random(-2, 2);
                    click(Math.max(0, _X2) , Math.max(0, _Y2))// 防止偏差导致负值

                    break; // 跳出循环
                 }
                 break; // 跳出循环
             }else if(button3){
                 taskLog("找到" + findText_EN_US);
                 taskLog("找到button3 = " + button3.clickable() );
                 if(button3.clickable()) {
                    button3.click()
                 }else{
                    taskLog("找到button3 ，但是button3不可点击,所以根据坐标点击 " );

                    var X3 = button3.bounds().centerX();
                    var Y3 = button3.bounds().centerY();
                    // 验证 X 和 Y 是否为正数
                    if (X3 < 0 || Y3 < 0) {
                        taskLog("坐标无效，中心点X或Y为负值: X=" + X3 + ", Y=" + Y3);
                        return
                    }
                    // 生成随机偏差
                    var _X3 = X3 - random(-2, 2);
                    var _Y3 = Y3 - random(-2, 2);
                    click(Math.max(0, _X3) , Math.max(0, _Y3))// 防止偏差导致负值

                 }
                 break; // 跳出循环
             }

             sleep(1000)

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
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("循环已执行3次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }

         // 查找控件
        var button1 = className("android.widget.TextView").text(findText_ZH_CN).findOne(2000);
        var button2 = className("android.widget.TextView").text(findText_ZH_TW).findOne(2000);
        var button3 = className("android.widget.TextView").text(findText_EN_US).findOne(2000);

        if (button1) {
            taskLog("找到" + findText_ZH_CN);
            taskLog("找到button1 = " + button1.clickable() );
            if(button1.clickable()) {
               button1.click()
               break; // 跳出循环
            }else{
               taskLog("找到button1 ，但是button1不可点击,所以根据坐标点击 " );

               var X1 = button1.bounds().centerX();
               var Y1 = button1.bounds().centerY();
               // 验证 X 和 Y 是否为正数
               if (X1 < 0 || Y1 < 0) {
                   taskLog("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
                   return
               }
               // 生成随机偏差
               var _X1 = X1 - random(-2, 2);
               var _Y1 = Y1 - random(-2, 2);
               click(Math.max(0, _X1) , Math.max(0, _Y1))// 防止偏差导致负值

               break; // 跳出循环


            }
        }else if(button2){
            taskLog("找到" + findText_ZH_TW);
            taskLog("找到button2 = " + button2.clickable() );
            if(button2.clickable()) {
               button2.click()
            }else{
               taskLog("找到button2 ，但是button2不可点击,所以根据坐标点击 " );

               var X2 = button2.bounds().centerX();
               var Y2 = button2.bounds().centerY();
               // 验证 X 和 Y 是否为正数
               if (X2 < 0 || Y2 < 0) {
                   taskLog("坐标无效，中心点X或Y为负值: X=" + X2 + ", Y=" + Y2);
                   return
               }
               // 生成随机偏差
               var _X2 = X2 - random(-2, 2);
               var _Y2 = Y2 - random(-2, 2);
               click(Math.max(0, _X2) , Math.max(0, _Y2))// 防止偏差导致负值

               break; // 跳出循环
            }
            break; // 跳出循环
        }else if(button3){
            taskLog("找到" + findText_EN_US);
            taskLog("找到button3 = " + button3.clickable() );
            if(button3.clickable()) {
               button3.click()
            }else{
               taskLog("找到button3 ，但是button3不可点击,所以根据坐标点击 " );

               var X3 = button3.bounds().centerX();
               var Y3 = button3.bounds().centerY();
               // 验证 X 和 Y 是否为正数
               if (X3 < 0 || Y3 < 0) {
                   taskLog("坐标无效，中心点X或Y为负值: X=" + X3 + ", Y=" + Y3);
                   return
               }
               // 生成随机偏差
               var _X3 = X3 - random(-2, 2);
               var _Y3 = Y3 - random(-2, 2);
               click(Math.max(0, _X3) , Math.max(0, _Y3))// 防止偏差导致负值

            }
            break; // 跳出循环
        }
         sleep(1000)

     }
     return findText_result
}


// 已经知道底部View的id是iy8，获取到这个view，拿到宽高，再点击这个view的中心位置，即可
// className("android.widget.LinearLayout")
function click_bottom_center_for_post_video(){

    toast("开始寻找底部➕号按钮....")
    // 通过ID选择器查找控件

    let view = id("com.ss.android.ugc.trill:id/iy8").className("android.widget.LinearLayout").findOne(3000);

    if (view) {
        let bounds = view.bounds();
        let width = bounds.width();
        let height = bounds.height();
        
        console.log("控件宽度: " + width);
        console.log("控件高度: " + height);
        
        // 计算中心点坐标
        let centerX = bounds.centerX();
        let centerY = bounds.centerY();
        
        // 尝试点击，最多重试3次
        let maxRetries = 3;
        let clickSuccess = false;
        
        for (let i = 0; i < maxRetries && !clickSuccess; i++) {
            console.log("尝试第" + (i + 1) + "次点击");
            
            // 先尝试控件点击
            clickSuccess = view.click();
            
            if (!clickSuccess) {
                // 如果控件点击失败，等待短暂时间后尝试坐标点击
                sleep(500);
                click(centerX, centerY);
                
                // 等待一下看是否点击成功（可以根据实际情况判断点击后的界面变化）
                sleep(1000);
                
                // 这里可以添加判断点击是否成功的逻辑
                // 比如检查界面是否发生预期变化
                clickSuccess = true
            }
        }
        
        if (clickSuccess) {
            console.log("点击成功");
        } else {
            console.log("多次尝试后仍然点击失败");
            toast("因为一直没有找到底部的+号按钮，导致无法进入发布视频的界面，所以终止任务直接报错")
            // throw new error("因为一直没有找到底部的+号按钮，导致无法进入发布视频的界面，所以终止任务直接报错")
        }
    } else {
        console.log("未找到指定控件");
    }
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
            if(INSTAGRAM_UPLOAD_VIDEO_TITLE && 
                INSTAGRAM_UPLOAD_VIDEO_TITLE.trim() !== "" && 
                INSTAGRAM_UPLOAD_VIDEO_TITLE.trim().toLowerCase() !== "off" && 
                !INSTAGRAM_UPLOAD_VIDEO_TITLE.includes("$${")){
                    all_TT_TITLE_text = get_TITLE_comment_text()
            }

            //描述
            var all_TT_DESC_text = []
            if(INSTAGRAM_UPLOAD_VIDEO_DESC && 
                INSTAGRAM_UPLOAD_VIDEO_DESC.trim() !== "" && 
                INSTAGRAM_UPLOAD_VIDEO_DESC.trim().toLowerCase() !== "off" && 
                !INSTAGRAM_UPLOAD_VIDEO_DESC.includes("$${")){
                    all_TT_DESC_text = get_DESC_comment_text()
            }


            if(all_TT_TITLE_text.length > 0){
                var randTitleIdx = random(0, all_TT_TITLE_text.length - 1)
                var titleText = all_TT_TITLE_text[randTitleIdx];
                taskLog("标题：" + titleText);

                if(titleText.includes("$${T")){ 
                    throw_error_storage_not_enough()
                }

                //短描述
                if(textView.id() == targetPackageName + ":id/epv" || textView.id() == targetPackageName + ":id/eqx"){
                    textView.setText(titleText)
                    sleep(random(3000,5000))
                } 

            }


            if(all_TT_DESC_text.length > 0){
                var randDescIdx = random(0, all_TT_DESC_text.length - 1)
                var descText = all_TT_DESC_text[randDescIdx];
                taskLog("描述：" + descText);

                if(descText.includes("$${T")){ 
                    throw_error_storage_not_enough()
                }
                //长描述
                if(textView.id() == targetPackageName + ":id/epu" || textView.id() == targetPackageName + ":id/eqw"){
                    textView.setText(descText)
                    sleep(random(3000,5000))
                }   
            }

    
        }
    }
}

//可能会出现权限弹窗，如果弹出，那么允许
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

function swipe_up(){
    //使用多段swipe实现曲线滑动
    let screenHeight = device.height;
    let startY = Math.floor(screenHeight * 0.9);  // 起点
    let endY = Math.floor(screenHeight * 0.1);    // 终点
    let distance = startY - endY;                 // 总距离
    
    // 第一段：向右倾斜
    swipe(
        device.width / 2,    // 起点X
        startY,             // 起点Y
        device.width * 0.7,  // 终点X
        startY - distance/3, // 终点Y
        700                 // 持续时间
    );
    sleep(200);
    
    // 第二段：向左倾斜
    swipe(
        device.width * 0.7,  // 起点X
        startY - distance/3, // 起点Y
        device.width * 0.3,  // 终点X
        startY - distance*2/3, // 终点Y
        700                 // 持续时间
    );
    sleep(200);
    
    // 第三段：回到中间
    swipe(
        device.width * 0.3,  // 起点X
        startY - distance*2/3, // 起点Y
        device.width / 2,    // 终点X
        endY,               // 终点Y
        600                 // 持续时间
    );
    sleep(3000); //等待滚动完成
}

//转移视频到Nest临时文件夹
function transferVideoToNest(fileName){
    let videoPath = null;
    if (files.exists(fileName)) {
        videoPath = fileName;
    }
    
    if (!videoPath) {
        console.error("未找到指定视频：" + fileName);
        toast("未找到指定视频：" + fileName);
        //throw new error("没有找到需要上传的视频，所以异常直接退出")
        return;
    }


    //开始拷贝一份，到本地自己的文件夹来单独处理，不处理原来的图片，
    // 创建文件夹(如果不存在)
    const newFolder = "/storage/emulated/0/Download/" + A_NEST_Instagram_MEDIA;  // 替换成你想要的文件夹路径
    if(!files.exists(newFolder)){
        files.ensureDir(newFolder);
        console.log("创建文件夹: " + newFolder);
    }

    // 目标视频路径(在新文件夹中)
    const targetFileName = files.getName(videoPath);
    const targetPath = newFolder + "/" + targetFileName;
    console.log("新视频文件的绝对路径: " + targetPath);
    // 复制图片文件
    try {
        files.copy(videoPath, targetPath);
        console.log("复制成功!");
        console.log("新视频路径: " + targetPath);
        
        // 复制成功后删除原文件
        if(files.remove(videoPath)){
            console.log("原文件已删除: " + videoPath);
        } else {
            console.log("原文件删除失败: " + videoPath);
        }
    } catch(e) {
        console.error("复制失败: " + e);
    }

    sleep(3000);

    refreshMedia(newFolder)

    return targetPath
}


//start
try {

    
    swipe_up()

    taskLog("开始刷新本地媒体库.....")
    refreshMedia("/storage/emulated/0/Download/")
    sleep(random(3000,5000))

    taskLog("开始转移视频到临时文件夹,INSTAGRAM_UPLOAD_VIDEO_URL = " + INSTAGRAM_UPLOAD_VIDEO_URL)
    sleep(2000)
    taskLog("开始转移视频到本地路径...")
    var imageTempPath = transferVideoToNest(INSTAGRAM_UPLOAD_VIDEO_URL)
    sleep(5000)



    //Button:
    //fullId("com.instagram.android:id/creation_tab")
    // fullId("com.instagram.android:id/tab_icon")
    clickId(INSTAGRAM_PACKAGE_NAME + ":id/creation_tab")
    
    sleep(3000)

    taskLog("开始第一次检查权限问题 .....")
    click_permission_allow()    
    sleep(random(2000,3000))
    taskLog("开始第二次检查权限问题.....")
    click_permission_allow()    
    sleep(random(2000,3000))
    taskLog("开始第三次检查权限问题.....")
    click_permission_allow()    
    sleep(random(2000,3000))




    //fullId("com.instagram.android:id/cam_dest_feed")
    taskLog("开始选中底部点击Post按钮")
    clickId(INSTAGRAM_PACKAGE_NAME + ":id/cam_dest_feed")
    sleep(random(2000,3000))



        //右上角Next
        // fullId("com.instagram.android:id/next_button_textview")
        //fullId("com.instagram.android:id/next_button_textview")
        var next = className("android.widget.Button").id(INSTAGRAM_PACKAGE_NAME + ":id/next_button_textview").find();
        if(next){
            taskLog("已经找到Next按钮，点击Next,next个数 = " + next.size())
            next.click();
            sleep(random(2000,3000)) 
        }   
        
        sleep(random(2000,3000)) 


        taskLog("开始第一次检查权限问题 .....")
        click_permission_allow()    
        sleep(random(2000,3000))
        taskLog("开始第二次检查权限问题.....")
        click_permission_allow()    
        sleep(random(2000,3000))



        //点击右下角继续
        //fullId("com.instagram.android:id/creation_next_button")
        clickId(INSTAGRAM_PACKAGE_NAME + ":id/creation_next_button")
        sleep(random(3000,5000)) 


        //点击右下角继续
        //fullId("com.instagram.android:id/clips_right_action_button")  
        clickId(INSTAGRAM_PACKAGE_NAME + ":id/clips_right_action_button")
        sleep(random(3000,5000)) 


        //下方会弹出询问：是否分享帖子
        //fullId("com.instagram.android:id/bb_primary_action_container")
        clickId(INSTAGRAM_PACKAGE_NAME + ":id/bb_primary_action_container")
        sleep(random(3000,5000)) 


        //开始写入说明
        // fullId("com.instagram.android:id/caption_input_text_view")
        //写入说明
        //描述
        var all_TT_DESC_text = []
        if(INSTAGRAM_UPLOAD_VIDEO_DESC && 
            INSTAGRAM_UPLOAD_VIDEO_DESC.trim() !== "" && 
            INSTAGRAM_UPLOAD_VIDEO_DESC.trim().toLowerCase() !== "off" && 
            !INSTAGRAM_UPLOAD_VIDEO_DESC.includes("$${")){
                all_TT_DESC_text = get_DESC_comment_text()
        }
        
        if(all_TT_DESC_text.length > 0){
            var randDescIdx = random(0, all_TT_DESC_text.length - 1)
            var descText = all_TT_DESC_text[randDescIdx];
            taskLog("描述：" + descText);
            //长描述
            var caption_input_text_view = id(INSTAGRAM_PACKAGE_NAME + ":id/caption_input_text_view").findOne();
                taskLog("找到caption_input_text_view: " + caption_input_text_view.text());
                if(caption_input_text_view){
                    caption_input_text_view.setText(INSTAGRAM_UPLOAD_VIDEO_DESC)
                    sleep(3000)
            }
        }else{
            taskLog("没有找到描述")
        }


        //可能会出现一个提示，是否同步到Threads
        //text("Not now")
        var notNowToThreads = findTextByLanguages(CONFIG.UI_TEXT.NOT_NOW_TO_THREADS)
        if(notNowToThreads){
            taskLog("存在提示，点击Not now to Threads")
            sleep(random(2000,3000))
        }

        //可能会出现一个提示，是否同步到Facebook
        //className("android.widget.TextView") text("Not now")
        var notNowToFacebook = findTextByLanguages(CONFIG.UI_TEXT.NOT_NOW_TO_Facebook)
        if(notNowToFacebook){
            taskLog("存在提示，点击Not now to Facebook")
            sleep(random(2000,3000))
        }

        
        //底部弹窗：text("將這則和日後的貼文分享到 Facebook")
        //fullId("com.instagram.android:id/unified_onboarding_primary_button")
        clickId(INSTAGRAM_PACKAGE_NAME + ":id/unified_onboarding_primary_button")
        


        //底部分享按钮
        // className("android.widget.FrameLayout") fullId("com.instagram.android:id/share_button")  clickable("true")
        clickId(INSTAGRAM_PACKAGE_NAME + ":id/share_button")
        sleep(random(2000,3000))

        // fullId("com.instagram.android:id/share_footer_button")
        clickId(INSTAGRAM_PACKAGE_NAME + ":id/share_footer_button")
        sleep(random(2000,3000))

    
        taskLog("等待上传完成，大概15秒.....")
        sleep(random(10000,15000))

        //最最后，删除整个临时文件夹
        files.removeDir("/storage/emulated/0/Download/" + A_NEST_Instagram_MEDIA)
        toast("临时文件夹已删除")
        sleep(random(3000, 5000))
        refreshMedia("/storage/emulated/0/Download/")
        sleep(random(3000, 5000))
            






} catch (e) {
    handleError(e);
}
