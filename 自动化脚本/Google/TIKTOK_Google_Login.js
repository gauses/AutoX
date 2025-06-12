// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok首页搜索养号*************************
// mx-phone-2  - drewryapilado@gmail.com
//******************************************************************

var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';


//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"



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
        forceStop_APP(GLOBAL_TikTokPackageName)
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok根據關鍵字，搜尋影片瀏覽養號，評論，點讚---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(GLOBAL_TikTokPackageName)
    console.error("===错误报告开始===");
    console.error("错误信息：" + e);
    console.error("错误堆栈：" + e.stack);
    console.error("===错误报告结束===");
    exit()
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


// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
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
    // taskLog("检测到已安装全球版TikTok，准备启动...");


    // sleep(random(3000, 5000))
    // taskLog("准备启动全球版TikTok...");
    // app.startActivity({
    //     action: "android.intent.action.VIEW",
    //     packageName: GLOBAL_TikTokPackageName,
    //     className: "com.ss.android.ugc.aweme.main.MainActivity"
    // });

    forceStop_APP(GLOBAL_TikTokPackageName)
    sleep(3000)

} else if (isAppInstalled(ASIA_TikTokPackageName)) {
    targetPackageName = ASIA_TikTokPackageName;
    targetClassName = "com.ss.android.ugc.aweme.main.MainActivity";
    // taskLog("检测到已安装亚洲版TikTok，准备启动...");

    // sleep(random(3000, 5000))
    // taskLog("准备启动亚洲版TikTok...");
    // app.startActivity({
    //     action: "android.intent.action.VIEW",
    //     packageName: ASIA_TikTokPackageName,
    //     className: "com.ss.android.ugc.aweme.main.MainActivity"
    // });

    forceStop_APP(ASIA_TikTokPackageName)
    sleep(3000)

} else {
    toast("未检测到TikTok已安装，请先安装TikTok！");
    taskLog("未检测到TikTok已安装，脚本终止。");
    exit();
}




//强制停止TikTok 
function forceStop_APP(packageName){
    taskLog("准备强杀:" + packageName + "...")
    sleep(1000);
    openAppSettings(packageName)
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
                 clickText(findText_ZH_CN)
                 break; // 跳出循环
             }else if(button2){
                 taskLog("找到" + findText_ZH_TW);
                 taskLog("找到button2 = " + button2.clickable() );
                 clickText(findText_ZH_TW)
                 break; // 跳出循环
             }else if(button3){
                 taskLog("找到" + findText_EN_US);
                 taskLog("找到button3 = " + button3.clickable() );
                //  if(button3.clickable()) {
                //     sleep(1000);
                //     button3.click()
                //  }else{
                    clickText(findText_EN_US)
                //  }
                 
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


//通过TextView的text
function find_textview_text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

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
        var button1 = className("android.widget.TextView").text(findText_ZH_CN).findOne(1000);
        var button2 = className("android.widget.TextView").text(findText_ZH_TW).findOne(1000);
        var button3 = className("android.widget.TextView").text(findText_EN_US).findOne(1000);

         if (button1 ) {
             taskLog("找到" + findText_ZH_CN);
             taskLog("找到" + button1.clickable());
             clickText(findText_ZH_CN)
             break; // 跳出循环
         }else if(button2){
             taskLog("找到" + findText_ZH_TW);
             taskLog("找到" + button2.clickable());
             clickText(findText_ZH_TW)
             break; // 跳出循环
         }else if(button3){
             taskLog("找到" + findText_EN_US);
             taskLog("找到" + button3.clickable());
            //  clickText(findText_EN_US)
            click(button3.bounds().centerX(), button3.bounds().centerY())
             break; // 跳出循环
         }

         sleep(1000)

     }
}



//可能会出现权限弹窗，如果弹出，那么允许
function click_permission_allow(){
    toast("开始处理权限问题.....")

    // var allListTextView = className("android.widget.TextView").find();
    // taskLog("找到权限allListTextView: 全部 = "  + allListTextView.size());

    // for(var i = 0; i < allListTextView.size(); i++){
    //     var textView = allListTextView.get(i);
    //     taskLog("找到权限textView: " + textView.text());
    // }

    // 找到所有按钮
    var allListButton = className("android.widget.Button").find();
    taskLog("找到权限allListButton: 全部 = "  + allListButton.size());

    for(var i = 0; i < allListButton.size(); i++){
        var button = allListButton.get(i);
        taskLog("找到权限button: " + button.text());
    }
    

    // 等待权限弹窗出现
    let allow_tw = textContains("使用應用程式時").findOne(3000);
    if(allow_tw){
        // taskLog("点击 - 使用應用程式時")
        // allow_tw.click();
        back()
    }

    
    // 等待权限弹窗出现
    let allow_tw_02 = textContains("允許").findOne(3000);
    if(allow_tw_02){
        // // 获取控件的文本内容
        // taskLog("点击 - 允許")
        // let btnText_tw = allow_tw_02.text();
        // // 检查文本是否包含"不允许"，如果不包含才点击
        // if(!btnText_tw.includes("不允許")){
        //     allow_tw_02.click();
        // }
        back()
    }



    // 等待权限弹窗出现
    let allow_en = textContains("ONLY THIS TIME").findOne(3000);
    if(allow_en){
        // taskLog("点击 - ONLY THIS TIME")
        // allow_en.click();
        back()
    }


    // 等待权限弹窗出现
    let allow_en_02 = textContains("ALLOW").findOne(5000);
    if(allow_en_02){
        // // 获取控件的文本内容
        // taskLog("点击 - ALLOW")
        // let btnText_en = allow_en_02.text();
        // // 检查文本是否包含"不允许"，如果不包含才点击
        // if(!btnText_en.includes("DON'T ALLOW")){
        //     allow_en_02.click();
        // }
        back()
    }



}







try {
    app.launchPackage(targetPackageName)
    sleep(random(3000, 5000))

    //1.首页：text("同意並繼續")  clickable("true")
    //fullId("com.ss.android.ugc.trill:id/d7o")
    //fullId("com.zhiliaoapp.musically:id/d7n")
    if(targetPackageName == ASIA_TikTokPackageName){      
        var agreeBtn = className("android.widget.Button").id("com.ss.android.ugc.trill:id/d7o").findOne(3000);
    }else{
        var agreeBtn = className("android.widget.Button").id("com.zhiliaoapp.musically:id/d7n").findOne(3000);
    }
    if(agreeBtn){
        agreeBtn.click();
        sleep(random(6000, 8000))
    }


    //2.跳过 clickable("true")
    //fullId("com.ss.android.ugc.trill:id/bub")
    //fullId("com.zhiliaoapp.musically:id/bub")
    if(targetPackageName == ASIA_TikTokPackageName){      
        var skipBtn = className("android.widget.Button").id("com.ss.android.ugc.trill:id/bub").findOne(3000);
    }else{
        var skipBtn = className("android.widget.Button").id("com.zhiliaoapp.musically:id/bub").findOne(3000);
    }
    if(skipBtn){
        skipBtn.click();
        sleep(random(6000, 8000))
    }


    //3.text("開始觀看")
    //fullId("com.ss.android.ugc.trill:id/qeh")
    //fullId("com.zhiliaoapp.musically:id/qeg")
    if(targetPackageName == ASIA_TikTokPackageName){      
        var startWatchBtn = className("android.widget.Button").id("com.ss.android.ugc.trill:id/qeh").findOne(3000);
    }else{
        var startWatchBtn = className("android.widget.Button").id("com.zhiliaoapp.musically:id/qeg").findOne(3000);
    }
    if(startWatchBtn){
        startWatchBtn.click();
        sleep(random(6000, 8000))
    }


    //可能会有一个新手引导的动画，导致无法点击“個人資料”，所以需要滑动一下
    swipe_to_up()
    sleep(random(3000, 5000))

    swipe_to_up()
    sleep(random(3000, 5000))




    //4.点击最右侧：個人資料
    find_btn_desc_base("個人資料","Profile","主页")
    sleep(random(5000, 7000))


    //5点击使用：desc("使用 Google 繼續")  clickable("true")
    //fullId("com.ss.android.ugc.trill:id/d8t")
    //fullId("com.zhiliaoapp.musically:id/d8s")
    if(targetPackageName == ASIA_TikTokPackageName){      
        var useGoogleBtnList = className("android.widget.Button").id("com.ss.android.ugc.trill:id/d8t").find();
    }else{
        var useGoogleBtnList = className("android.widget.Button").id("com.zhiliaoapp.musically:id/d8s").find();
    }
    //注意：界面可能会有三个登陆按钮，三个按钮的ID都是"com.ss.android.ugc.trill:id/d8t"，但是desc是不同的
    //desc("Continue with Google")
    taskLog("useGoogleBtnList: " + useGoogleBtnList.size());
    for(var i = 0; i < useGoogleBtnList.size(); i++){
        var useGoogleBtn = useGoogleBtnList.get(i);
        taskLog("useGoogleBtn: " + useGoogleBtn.desc());
        if(useGoogleBtn && useGoogleBtn.desc().includes("Google")){
            useGoogleBtn.click();
            sleep(random(3000, 5000))
            break;
        }
    }

    sleep(random(13000, 15000))

    //6.(1)第一种登陆形式 ：直接在底部弹出google的身份框
    // 点击：类似 text("以「Qadir」的身分登入繼續使用")
    // fullId("com.google.android.gms:id/continue_button") clickable("true") 
    var continueBtn = className("android.widget.Button").id("com.google.android.gms:id/continue_button").findOne(5000);
    if(continueBtn){
        continueBtn.click();
        sleep(random(3000, 5000))
    }


    //(2)第二种登陆形式 ：在中间弹出google的身份框 - "選擇帳戶，以繼續使用「TikTok」
    // 点击：类似 text("以「Qadir」的身分登入繼續使用")
    // fullId("com.google.android.gms:id/container") clickable("true")  className("android.widget.LinearLayout")
    var googleLoginBtn = className("android.widget.LinearLayout").id("com.google.android.gms:id/container").findOne(5000);
    if(googleLoginBtn){
        googleLoginBtn.click();
        sleep(random(3000, 5000))
    }

    

    sleep(random(13000, 15000))

    //7.可能会出现权限:是否允许Tiktok获取你的联络人
    taskLog("开始处理权限问题.....")
    click_permission_allow() 



    //8.设置生日
    var yearSeekBar = className("android.widget.SeekBar").id("com.ss.android.ugc.trill:id/v44").findOne(3000);
    if (yearSeekBar) {
        let minYear = 1900;
        let maxYear = 2024;
        let targetYear = random(1980, 2000); // 1980-2000之间的随机整数
        let currentYear = 2024; // 当前初始显示的年份

        let bounds = yearSeekBar.bounds();
        let centerX = bounds.centerX();

        // 数字高度一般是控件高度的1/3
        let numberHeight = bounds.height() / 3;
        let startY = bounds.top + numberHeight * 1.5; // 2024数字正中间
        let step = numberHeight; // 每次滑动一个数字的高度

        taskLog("控件中心X: " + centerX + ", 2024数字中心Y: " + startY + ", 单位步长: " + step);

        // 先点击激活控件
        click(centerX, startY);
        sleep(500);

        let delta = currentYear - targetYear;

        for (let i = 0; i < Math.abs(delta); i++) {
            if (delta > 0) {
                // 选中2024，手指从2024数字正中间往下滑动，年份变小
                let endY = startY + step;
                taskLog("第" + (i+1) + "次滑动: startY=" + startY + ", endY=" + endY);
                swipe(centerX, startY, centerX, endY, 300);
                sleep(500);
            } else {
                // 选中2024，手指从2024数字正中间往上滑动，年份变大
                let endY = startY - step;
                taskLog("第" + (i+1) + "次滑动: startY=" + startY + ", endY=" + endY);
                swipe(centerX, startY, centerX, endY, 300);
                sleep(500);
            }
            sleep(random(1000, 2000));
            
        }
        taskLog("已尝试滑动设置年份为：" + targetYear);
    } else {
        taskLog("未找到年份SeekBar控件");
    }



    //9.设置好生日之后，点击"继续"
    //fullId("com.ss.android.ugc.trill:id/a8r")  className("android.widget.Button")  clickable("true")
    var continueBtn = className("android.widget.Button").id("com.ss.android.ugc.trill:id/a8r").findOne(3000);
    if(continueBtn){
        continueBtn.click();
        sleep(random(3000, 5000))
    }

    
    sleep(random(13000, 15000))

    //10.设置名字，默认就已经有名字了
    //fullId("com.ss.android.ugc.trill:id/dn2") className("android.widget.Button") clickable("true")
    var nameBtn = className("android.widget.Button").id("com.ss.android.ugc.trill:id/dn2").findOne(3000);
    if(nameBtn){
        nameBtn.click();
        sleep(random(3000, 5000))
    }

    sleep(random(15000, 20000))
    
    //7.可能会出现权限:是否允许Tiktok获取你的联络人
    taskLog("开始处理权限问题.....")
    click_permission_allow() 


    sleep(random(50000, 600000))


    } catch (e) {
        handleError(e);
}
