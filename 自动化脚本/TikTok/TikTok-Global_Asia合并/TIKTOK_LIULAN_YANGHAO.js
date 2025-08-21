// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok首页浏览养号*************************
//******************************************************************

var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';



//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的评论内容
const TT_Watch_Count = "$${瀏覽數量}" //观看视频个数
const TT_commentFile = '$${T_留言內容}';
const TT_Like_Count = "$${點讚概率}" //点赞概率
const TT_Comment_Count = "$${留言概率}" //评论概率
const TT_Save_Count = "$${收藏概率}" //收藏概率


const TT_Watch_Author_Page= 0 //查看作者主页的概率


var targetPackageName = null;
var targetClassName = null;


//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
 events.on('exit', function(){
    console.hide()
    sleep(1000)

    if(handleErrorFlag){
        console.error("-----------------脚本执行出现异常---------------");
        console.error("Tiktok根據推薦影片，自動瀏覽養號.評論.點讚---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        forceStop_APP(targetPackageName)
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok根據推薦影片，自動瀏覽養號.評論.點讚---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

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
    toast("未检测到TikTok已安装，请先安装TikTok！");
    taskLog("未检测到TikTok已安装，脚本终止。");
    exit();
}


app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});



function clickId(a) {
    let obj_ID = id(a).boundsInside(5, 5, device.width - 5, device.height - 5);
    
    // 检查是否找到元素
    let elements = obj_ID.find();
    if (elements.empty()) {
        taskLog("没有找到元素ID ：" + a);
        return;
    }
    
    // 获取第一个匹配的元素
    let element = elements.get(0);
    let X = element.bounds().centerX();
    let Y = element.bounds().centerY();
    
    // 验证 X 和 Y 是否为正数
    if (X < 0 || Y < 0) {
        taskLog("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
        return;
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



            //className("android.widget.ImageView") fullId("com.zhiliaoapp.musically:id/czl") clickable("true")
            //className("android.widget.Button") fullId("com.ss.android.ugc.trill:id/czl") clickable("true")

            if(targetPackageName == GLOBAL_TikTokPackageName){  
                clickId(GLOBAL_TikTokPackageName + ":id/czl")
            }else{
                clickId(ASIA_TikTokPackageName + ":id/czl")
            }

            sleep(random(2000, 3000))
            back()
            sleep(random(2000, 3000))
            
            if(targetPackageName == GLOBAL_TikTokPackageName){  
                clickId(GLOBAL_TikTokPackageName + ":id/czl")
            }else{
                clickId(ASIA_TikTokPackageName + ":id/czl")
            }
    
    
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


function find_send_btn() {
    var allButtons = className("android.widget.Button").find();
    taskLog("find_send_btn allButtons长度 = " + allButtons.size())
    if (allButtons && allButtons.size() > 0) {

        // 获取最后一个按钮
        var lastButton = allButtons.get(allButtons.size() - 1);
        if (lastButton) {
            // bounds()是一个方法,需要先调用它
            var bounds = lastButton.bounds();
            click(bounds.centerX(), bounds.centerY());
        }
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
function find_btn_Text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US, findText_EN_UK){


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
             var button4 = className("android.widget.Button").text(findText_EN_UK).findOne(1000);

             if (button1) {
                 taskLog("找到" + findText_ZH_CN);
                 button1.click();
                 break; // 跳出循环
             }else if(button2){
                 taskLog("找到" + findText_ZH_TW);
                 button2.click();
                 break; // 跳出循环
             }else if(button3){
                 taskLog("找到" + findText_EN_US);
                 button3.click();
                 break; // 跳出循环
             }else if(button4){
                taskLog("找到" + findText_EN_UK);
                button4.click();
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
         // 检查计数器是否达到5
         if (loopCount >= 5) {
             // 打印一条消息并退出循环
             taskLog("循环已执行5次，即将退出循环。");

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


//强制停止TikTok 
function forceStop_APP(packageName){
    taskLog("准备强杀:" + packageName + "...")
    sleep(1000);
    app.openAppSetting(packageName)
    sleep(5000)

    //繁体
    if (text("強制停止").exists()) {
        let forceStopBtn = text("強制停止").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("確定").exists()) {
                taskLog("已经找到可点击的'強制停止'按钮！！！！！！！！！！");
                text("確定").findOne().click();
            }
        } else {
            taskLog("未找到可点击的'強制停止'按钮");
        }
    } else {
        taskLog("未找到'強制停止'按钮");
    }
    sleep(3000)

    //简体
    if (text("强行停止").exists()) {
        let forceStopBtn = text("强行停止").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("确定").exists()) {
                text("确定").findOne().click();
            }
        } else {
            taskLog("未找到可点击的'强行停止'按钮");
        }
    } else {
        taskLog("未找到'强行停止'按钮");
    }

    sleep(3000)


    //英语
    if (text("Force stop").exists()) {
        let forceStopBtn = text("Force stop").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("OK").exists()) {
                text("OK").findOne().click();
            }
        } else {
            taskLog("未找到可点击的'Force stop'按钮");
        }
    } else {
        taskLog("未找到'Force stop'按钮");
    }
    sleep(3000)

    //英语
    if (text("FORCE STOP").exists()) {
        let forceStopBtn = text("FORCE STOP").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("OK").exists()) {
                text("OK").findOne().click();
            }
        } else {
            taskLog("未找到可点击的'FORCE STOP'按钮");
        }
    } else {
        taskLog("未找到'FORCE STOP'按钮");
    }
    sleep(3000)


    home()

}



//推荐好友的弹窗，直接关闭 - id("c9n")
function close_friend_suggest(){
    if(id("c9n").exists()){
        sleep(3000)
        id("c9n").click()
    }
}


//从评论数组中，顺序挑选一条内容
function get_all_TT_comment_text(){
    let comments = [];
    // 户是否存在
    taskLog("TT评论数组 =  " + TT_commentFile)
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



try {
    
    close_friend_suggest()

    var all_TT_comment_text = []

    if(TT_commentFile && 
        TT_commentFile.trim() !== "" && 
        TT_commentFile.trim().toLowerCase() !== "off" && 
        !TT_commentFile.includes("$${")){
            all_TT_comment_text = get_all_TT_comment_text()
        }

    if(all_TT_comment_text.includes("$${T")){ 
        throw_error_storage_not_enough()
    }    
    
    // 输出结果，用于调试
    if(all_TT_comment_text.length > 0){
        taskLog("评论文案数量 = " + all_TT_comment_text.length);
    }else{
        taskLog("没有找到评论文案，所以将只会执行点赞")
    }




    //开始观看
    var count = 1;
    do {
        // 将 count 加 1
        taskLog("开始观看第"+count+"个TikTok视频")
        count++;

        close_friend_suggest()

        sleep(random(10000, 15000))

        if (Math.random() * 100 < TT_Like_Count)  {
            taskLog("开始触发点赞概率")
            click_Like_Btn()
            sleep(random(3000, 5000))
        }
        if (Math.random() * 100 < TT_Save_Count)  {
            taskLog("开始触发保存视频概率")
            click_Save_Btn()
            sleep(random(3000, 5000))
        }else{
            taskLog("本次无法触发保存视频概率")
        }
        if (Math.random() * 100 < TT_Comment_Count)  {
            taskLog("开始触发评论视频概率")
            taskLog("评论文案的总个数："+all_TT_comment_text.length)
            if (all_TT_comment_text.length > 0) {

                taskLog("- 找到可用评论文案, 开始评论 - ");
                var randIdx = random(0, all_TT_comment_text.length - 1)
                taskLog("评论文案的下标randIdx："+randIdx)
                var commentText = all_TT_comment_text[randIdx];
                taskLog("随机评论文案 :" + commentText);
                click_Comment_Btn(commentText)
                sleep(random(5000, 8000))
            }else{
                taskLog(`- 没有可用评论文案, 忽略 - `);
            }
        }

        if (Math.random() * 100 < TT_Watch_Author_Page)  {
            taskLog("开始触发查看作者主页的概率")
            click_Author_Page_Btn()
            sleep(random(5000, 8000))
        }


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


} catch (e) {
    handleError(e);
}