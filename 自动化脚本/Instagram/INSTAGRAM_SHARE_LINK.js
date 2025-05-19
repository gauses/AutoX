// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************指定圖片or視屏 （點愛心、評論）
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"
var chromePackageName = 'com.kiwibrowser.browser';

//名稱.使用者名稱.個人簡介
const TT_VIDEO_URL = '$${T_指定视频链接/直播間鏈接}';
const TT_VIDEO_SHARE_TEXT = '$${T_分享文案}';


var INSTAGRAM_PACKAGE_NAME = 'com.instagram.android';


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
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok根據關鍵字，搜尋影片瀏覽養號，評論，點讚---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
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
openAppSetting(targetPackageName)
sleep(random(3000, 5000))
forceStop_APP(targetPackageName)
sleep(3000)

sleep(random(3000, 5000))
openAppSetting(chromePackageName)
sleep(random(3000, 5000))
forceStop_APP(chromePackageName)
sleep(3000)


// app.startActivity({
//     action: "android.intent.action.VIEW",
//     packageName: targetPackageName,
//     className: targetClassName
// });


sleep(random(3000, 5000))


//******************************************************************
//******************************************************************
//******************************************************************

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


//推荐好友的弹窗，直接关闭
function close_friend_suggest(){
    if(id("c67").exists()){
        sleep(3000)
        id("c67").click()
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
        var button1 = className("android.widget.TextView").text(findText_ZH_CN).findOne(1000);
        var button2 = className("android.widget.TextView").text(findText_ZH_TW).findOne(1000);
        var button3 = className("android.widget.TextView").text(findText_EN_US).findOne(1000);

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

function firstOpenBrowser(){
    app.startActivity({
        action: "android.intent.action.VIEW",
        packageName: chromePackageName,
        className: "org.chromium.chrome.browser.ChromeTabbedActivity"
      });

      sleep(3000);

    //   //可能部分设备弹出"NestBrowser不能运行在没有GMS的设备"的弹出框，需要点击确定
    //   if (id('button1').exists()) {
    //     id('button1').findOne(3000).click();
    //   }
      
      //可能存在欢迎界面的"continue"按钮，点击
      if(id("com.kiwibrowser.browser:id/signin_fre_continue_button").exists()){
        toast("存在欢迎界面的continue按钮，点击")
        id("com.kiwibrowser.browser:id/signin_fre_continue_button").findOne().click()
      }else{
        toast("不存在欢迎界面的continue按钮")
      }


}

function openBrowser(url){

    app.startActivity({
        action: "android.intent.action.VIEW",
        data: url,
        packageName: chromePackageName,
        className: "org.chromium.chrome.browser.ChromeTabbedActivity",
        flags: [
          "activity_new_task",
          "activity_clear_top"
          ],
      extras: {
          // 设置打开方式偏好
          "browser.application_id": targetPackageName,  
          "create_new_tab": true,
          "open_in_external_app": true
      }
      });
}


//从视频列表数组中，顺序挑选一条
function get_all_video_link(){
    // 用于存储用户的数组
    let comments = [];
    // 户是否存在
    const file = new java.io.File(TT_VIDEO_URL);
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
        comments.push(TT_VIDEO_URL);
    }

    
    return comments
}


//点击点赞按钮
function click_Like_Btn(){
    taskLog("开始准备点赞视频")
    //fullId("com.instagram.android:id/row_feed_button_like")
    clickId("com.instagram.android:id/row_feed_button_like")

}

//从评论列表数组中，随机挑选一条内容，翻译
function get_post_text(){
    // 用于存储私信用户的数组
    let comments = [];
    const file = new java.io.File(TT_VIDEO_SHARE_TEXT);
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
        comments.push(TT_VIDEO_SHARE_TEXT);
    }
    return comments

}


//点击评论按钮
function click_Comment_Btn(commentText){

    
    sleep(random(2000 , 3000))

    taskLog("开始准备评论视频")
    //fullId("com.instagram.android:id/row_feed_button_comment")
    clickId("com.instagram.android:id/row_feed_button_comment")


    sleep(5000)
    //className("android.widget.AutoCompleteTextView")
    var autoCompleteTextViews = className("android.widget.AutoCompleteTextView").find();
    taskLog("autoCompleteTextViews长度 = " + autoCompleteTextViews.size())


    if(autoCompleteTextViews.size() >0){
        var textView = autoCompleteTextViews.get(autoCompleteTextViews.size() - 1);
        if(textView) {
            taskLog("找到TextView控件-Text："+ textView.text());
            textView.click()
            sleep(1000)
            taskLog("评论控件，设置内容：" +commentText );
            textView.setText(commentText)
            sleep(5000)
    
    
            //发送按钮
            //fullId("com.instagram.android:id/layout_comment_thread_post_button_icon")
            clickId("com.instagram.android:id/layout_comment_thread_post_button_icon")

            sleep(random(2000, 3000))

                
            }
    }
   
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


//有可能传入的是一个reel视频，就是一个完全不同的布局
//https://www.instagram.com/reel/DJEmRtNT_rC/?utm_source=ig_web_copy_link
function click_reels_vide(){

    //点赞：className("android.widget.ImageView") fullId("com.instagram.android:id/like_button") clickable("true")
    var likeBtnList = className("android.widget.ImageView").id("com.instagram.android:id/like_button").find()
    if(likeBtnList.size() > 0){
        taskLog("当前页面有like按钮坐标 = " + likeBtnList.get(0).bounds().centerX() + " " + likeBtnList.get(0).bounds().centerY() )
        sleep(random(3000, 5000))
        clickId(likeBtnList.get(0))
    }

    //评论：className("android.widget.ImageView") fullId("com.instagram.android:id/comment_button") clickable("true")   
    var commentBtnList = className("android.widget.ImageView").id("com.instagram.android:id/comment_button").find()
    if(commentBtnList.size() > 0){
        taskLog("当前页面有comment按钮坐标 = " + commentBtnList.get(0).bounds().centerX() + " " + commentBtnList.get(0).bounds().centerY() )
        sleep(random(3000, 5000))
        clickId(commentBtnList.get(0))
    }


    //如果评论文案不为空，则随机挑选一条，翻译，然后点击评论按钮
    if(commentTextArrays.length > 0){

        var randIdx = random(0, commentTextArrays.length - 1)
        var messageText = commentTextArrays[randIdx];

        toast("评论文案：" + messageText)
        taskLog("准备点击评论按钮....");
        
        sleep(5000)
        var autoCompleteTextViews = className("android.widget.AutoCompleteTextView").find();
        taskLog("autoCompleteTextViews长度 = " + autoCompleteTextViews.size())

        if(autoCompleteTextViews.size() >0){
            var textView = autoCompleteTextViews.get(autoCompleteTextViews.size() - 1);
            if(textView) {
                taskLog("找到TextView控件-Text："+ textView.text());
                textView.click()
                sleep(1000)
                taskLog("评论控件，设置内容：" +commentText );
                textView.setText(commentText)
                sleep(5000)
        
        
                //发送按钮
                //fullId("com.instagram.android:id/layout_comment_thread_post_button_icon")
                clickId("com.instagram.android:id/layout_comment_thread_post_button_icon")

                sleep(random(2000, 3000))

                    
                }
        }


        taskLog("等待5秒后，准备返回上一个页面")
        sleep(random(3000, 5000))
    }else{
        toast("评论文案为空，所以不点击评论按钮");
    }




}




try {

   
    //用浏览器打开链接
    taskLog("检测是否第一次打开浏览器...")
    firstOpenBrowser()
    sleep(5000)

        
    taskLog("打开浏览器成功...")
    sleep(5000)

    var all_TT_VIDEO_LINK = get_all_video_link()
    taskLog("所有需要分享的视频数量 = " + all_TT_VIDEO_LINK.length)
    sleep(5000)
    
    if(all_TT_VIDEO_LINK.length == 0){
        taskLog("没有需要分享的视频") 
        stopCurrentTask()
    }else{

         // 开始主循环
        var commentTextArrays = get_post_text()
        toast("评论文案个数：" + commentTextArrays.length)

        for(var i = 0; i < all_TT_VIDEO_LINK.length; i++){
            taskLog("当前Instagram帖子在第" + (i+1) + "个 = " + all_TT_VIDEO_LINK[i])      
            var video_info_link = all_TT_VIDEO_LINK[i]
            sleep(2000)


            taskLog("准备打开Instagram帖子链接：" + video_info_link)      
            openBrowser(video_info_link)
            sleep(random(5000,8000))

            //可能需要点击一下浏览器界面的"開啟 Instagram"
            find_btn_Text_base("開啟 Instagram","Open Instagram","開啟應用程式")
            toast("出现開啟 Instagram按钮，点击.")

            //可能会出现"Continue"按钮，点击：fullId("com.kiwibrowser.browser:id/message_primary_button")
            if(id("com.kiwibrowser.browser:id/message_primary_button").exists()){
                toast("出现Continue按钮，点击.")
                id("com.kiwibrowser.browser:id/message_primary_button").findOne().click()
            }
            sleep(5000)


            taskLog("打开Instagram成功...")
            sleep(random(10000,15000))

            //需要页面有没有like按钮
            //className("android.widget.Button") fullId("com.instagram.android:id/row_feed_button_like") clickable("false")
            var likeBtnList = className("android.widget.Button").id("com.instagram.android:id/row_feed_button_like").find()
            // var likeBtnList = id("com.instagram.android:id/row_feed_button_like").className("android.widget.Button").find()
            taskLog("当前页面的likeBtn数量 = " + likeBtnList.size() )
            sleep(random(3000, 5000))


            var commentBtnList = className("android.widget.Button").id("com.instagram.android:id/row_feed_button_comment").find()
            taskLog("当前页面的commentBtn数量 = " + commentBtnList.size()  )
            sleep(random(3000, 5000))


            if(likeBtnList.size() > 0){


                taskLog("当前页面有like按钮坐标 = " + likeBtnList.get(0).bounds().centerX() + " " + likeBtnList.get(0).bounds().centerY() )
                taskLog("当前设备坐标 = " + device.width + " " + device.height )
                sleep(random(3000, 5000))
                click(likeBtnList.get(0).bounds().centerX(), likeBtnList.get(0).bounds().centerY())
                sleep(300000000000000)

                //直接连续双击屏幕中间位置，也可以作为点赞
                // click(device.width / 2, device.height / 2)
                // sleep(500)
                // click(device.width / 2, device.height / 2)
                // sleep(random(3000, 5000))

                //如果评论文案不为空，则随机挑选一条，翻译，然后点击评论按钮
                if(commentTextArrays.length > 0){

                    var randIdx = random(0, commentTextArrays.length - 1)
                    var messageText = commentTextArrays[randIdx];

                    toast("评论文案：" + messageText)
                    taskLog("准备点击评论按钮....");
                    click_Comment_Btn(messageText)

                    taskLog("等待5秒后，准备返回上一个页面")
                    sleep(random(3000, 5000))
                }else{
                    toast("评论文案为空，所以不点击评论按钮");
                }



            }else{
                taskLog("当前页面没有like按钮，往上滑动，继续寻找like按钮")
                swipe_up()
                sleep(random(3000, 5000))
                var likeBtnList02 = className("android.widget.Button").id("com.instagram.android:id/row_feed_button_like").find()
                taskLog("当前页面的likeBtn数量 = " + likeBtnList.size() )

                if(likeBtnList02.size() > 0){
                    taskLog("当前页面有like按钮，开始点赞")
                    taskLog("当前页面有like按钮坐标 = " + likeBtnList02.get(0).bounds().centerX() + " " + likeBtnList02.get(0).bounds().centerY() )
                    clickId(likeBtnList02.get(0))



                    //如果评论文案不为空，则随机挑选一条，翻译，然后点击评论按钮
                    if(commentTextArrays.length > 0){

                        var randIdx = random(0, commentTextArrays.length - 1)
                        var messageText = commentTextArrays[randIdx];

                        toast("评论文案：" + messageText)
                        taskLog("准备点击评论按钮....");
                        click_Comment_Btn(messageText)

                        taskLog("等待5秒后，准备返回上一个页面")
                        sleep(random(3000, 5000))
                    }else{
                        toast("评论文案为空，所以不点击评论按钮");
                    }



                }else{
                    taskLog("当前页面没有like按钮，不再处理")
                }
                }
            
            

        }

    }

    
    
} catch (e) {
    handleError(e);
}
