// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

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
        console.error("-----------------脚本执行出现异常---------------");
        console.error("Tiktok关注：根據關注列表UID的順序，去關注用戶---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok关注：根據關注列表UID的順序，去關注用戶---------------");
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
function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}

function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(targetPackageName)
    console.error("===错误报告开始===");
    console.error("错误信息：" + e);
    console.error("错误堆栈：" + e.stack);
    console.error("===错误报告结束===");
    exit()
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
    exit();
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

    //将日志文件写入本地txt
    var logFile = new File(logFilePath);
    var logFileWriter = new FileWriter(logFile, true);
    var logFileWriter = new PrintWriter(logFileWriter);
    // logFileWriter.println(getSystemDate("df") +":" +_log);
    logFileWriter.println(_log);
    logFileWriter.close();

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
    taskLog("自动化任务-已保存："+ path);


    //刷新媒体库
    sleep(3000)
    toast("开始刷新媒体库，用时5秒钟....");
    refreshMedia(RPAFilePath)
    return path
}
// 刷新指定路径的媒体库
function refreshMedia(path) {
    taskLog("开始刷新媒体库，用时5秒钟....");
    // 发送媒体扫描广播
    media.scanFile(path);
    // 等待扫描完成
    sleep(5000);
    taskLog("媒体库刷新完成，开始下一步任务...");
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



try{
    
    taskLog("打开TikTok成功，首页会停留10-15秒...")
    sleep(random(10000, 15000))


    // 用于存储评论的数组
    let comments = [];
    // 检查文件是否存在
    toast("关注列表地址 =  " + TT_Like_User_ID_KEYWORD)
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


                    //按照要求的数量，开始准备关注用户
                    if(TT_Like_User_COUNT > 0) {
                        // 当前已关注的用户数量
                        var currentFollowCount = 0;
                        // 滑动次数计数
                        var scrollCount = 0;
                        // 最大滑动次数
                        const MAX_SCROLL_COUNT = 15;

                        // 只要没达到目标关注数量且未超过最大滑动次数，就继续执行
                        while(currentFollowCount < TT_Like_User_COUNT && scrollCount < MAX_SCROLL_COUNT) {
                            taskLog("当前已关注数量：" + currentFollowCount + "，目标数量：" + TT_Like_User_COUNT);
                            
                            //直接在当前页面，找到Follow按钮，然后点击关注
                            var allButtons = className("android.widget.Button").find();
                            taskLog("找到的按钮数量：" + allButtons.size());
                            
                            var foundFollowButtonInCurrentPage = false;
                            
                            // 遍历当前页面的所有按钮
                            for(var k = 0; k < allButtons.size(); k++) {
                                if(currentFollowCount >= TT_Like_User_COUNT) {
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
                                            taskLog("完成第 " + currentFollowCount + " 个关注");
                                            sleep(random(3000, 5000));
                                            

                                        } else {
                                            taskLog("警告：按钮坐标无效！坐标：(" + centerX + ", " + centerY + ")，设备屏幕：(" + device.width + " x " + device.height + ")");
                                        }
                                    }
                                }
                            }

                            // 如果当前页面没有找到可关注的按钮，或者还没达到目标数量，就往下滑动
                            if(!foundFollowButtonInCurrentPage || currentFollowCount < TT_Like_User_COUNT) {
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
                            if(scrollCount >= MAX_SCROLL_COUNT && currentFollowCount < TT_Like_User_COUNT) {
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
        toast("- 没有可用的搜索关键词, 忽略 - ");
        throw new Error("没有可用的搜索关键词，无法关注，所以报错")
    }

}catch(e) {
    handleError(e);
}
