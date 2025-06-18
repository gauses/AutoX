// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************FaceBook加入社團(連結)************************
// 連結加社團

// 1 需可自動打勾社團條約(有條約自動勾 無條約直接略過)
// 2 需可自動自定義回答社團問題 (有幾個問答就回答幾個)
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//需要添加的用户好友
const FB_input_text = '$${T_FB_输入需要添加的所有Group}';

// 添加全局索引计数器
let commentIndex = 0;

var FacebookPackageName = 'com.facebook.katana';

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

function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
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


function openFacebookLink_test(fbUrl){


    //是否打开成功，如果打开失败，那么直接进行下一个任务
    var openUrlFlag = false

    taskLog("准备打开链接 = " + fbUrl)
    var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/watch/huacemedia/")); //不行
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/samsul.ujex"));  //加好友，异常
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/share/r/1CdK7F3fRp/"));  //Reels -OK
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/groups/850798899131453/"));  //Group -OK
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/share/v/16cLEnDJoT/"));   //Live - OK
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/profile.php?id=100079449592509"));  //Friend - OK
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/share/v/14Dj3UQ6q2b/"));  //watch - OK（https://www.facebook.com/watch/?v=689492360538949&rdid=PU3MOv69wqSgVeh5）
    
    intent.setData(android.net.Uri.parse(fbUrl));
    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
    intent.setPackage("com.facebook.katana");
    try {
        app.startActivity(intent);
        openUrlFlag = true
    } catch (e) {

        // 如果 Facebook App 无法处理，则用浏览器打开
        taskLog("Facebook无法处理该链接，所以跳过 = " + fbUrl);
        // var browserIntent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(fbUrl));
        // browserIntent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        // app.startActivity(browserIntent);
        // openUrlFlag = true
    }

    return openUrlFlag
}



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




    var all_friends = get_all_friedns()
    taskLog("所有Group数量 = " + all_friends.length)
    sleep(random(3000, 5000))
    


    for(var i = 0; i < all_friends.length; i++){
        sleep(random(3000, 5000))

        var friend_info_link = all_friends[i]
        toast("当前Group信息 = " + friend_info_link)
        sleep(random(3000, 5000))

        var openUrlFlag = openFacebookLink_test(friend_info_link)
        if(openUrlFlag){
            taskLog("正在加载当前Group页面信息..." )
            sleep(random(5000, 8000))

            //测试：https://www.facebook.com/groups/403644813716642/
            //className("android.view.ViewGroup").text("Join group").findOne().click()
            //desc("加入社團")
            find_viewGroup_desc_base("加入社團","Join group","Join group")
            sleep(random(3000, 5000))

            //测试：https://www.facebook.com/groups/232736963482941
            answer_all_questions()

        }else{
            taskLog("打开链接失败，跳过 = " + friend_info_link)
        }


    }


    
toast("所有循环执行完毕，准备结束任务...");
stopCurrentTask()





//打印日志
function taskLog(_log){
    toast(_log) 
    console.log(getSystemDate("df") +":" +_log)
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


//通过Button的Text
function find_btn_Text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

        var loopCount  = 0

         while (true) {
             taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
             // 检查计数器是否达到3
             if (loopCount >= 3) {
                 // 打印一条消息并退出循环
                 taskLog("寻找" + findText_ZH_CN + "按钮失败");
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
             }

             sleep(1000)

         }
}



//通过Button的Desc
function find_btn_desc_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

        var findBtn = false

        var loopCount  = 0

         while (true) {
             taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
             // 检查计数器是否达到3
             if (loopCount >= 3) {
                 // 打印一条消息并退出循环
                 taskLog("寻找" + findText_ZH_CN + "按钮失败");
                 taskLog("循环已执行3次，即将退出循环。");

                 //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
                break;
             }


             // 查找控件
             var button1 = className("android.widget.Button").desc(findText_ZH_CN).findOne(1000);
             var button2 = className("android.widget.Button").desc(findText_ZH_TW).findOne(1000);
             var button3 = className("android.widget.Button").desc(findText_EN_US).findOne(1000);
             if (button1) {
                 findBtn = true
                 taskLog("找到" + findText_ZH_CN);
                 button1.click();
                 break; // 跳出循环
             }else if(button2){
                 findBtn = true
                 taskLog("找到" + findText_ZH_TW);
                 button2.click();
                 break; // 跳出循环
             }else if(button3){
                 findBtn = true
                 taskLog("找到" + findText_EN_US);
                 button3.click();
                 break; // 跳出循环
             }

             sleep(1000)

         }

         return findBtn

}


//从好友列表数组中，顺序挑选一条内容
function get_post_text(){
    // 用于存储私信用户的数组
    let comments = [];
    // 私信用户是否存在
    taskLog("私信用户地址 =  " + FB_input_text)
    const file = new java.io.File(FB_input_text);
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
        comments.push(FB_input_text);
    }
    
    // 使用顺序索引获取消息
    var messageText = comments[commentIndex % comments.length];
    // 增加索引计数
    commentIndex++;
    
    return messageText
}



//从好友列表数组中，顺序挑选一条内容
function get_all_friedns(){
    // 用于存储用户的数组
    let comments = [];
    // 户是否存在
    taskLog("用户地址 =  " + FB_input_text)
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


//通过Button的Desc
function find_viewGroup_desc_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

    var findBtn = false

    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("寻找" + findText_ZH_CN + "按钮失败");
             taskLog("循环已执行3次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }


         // 查找控件
         var button1 = className("android.view.ViewGroup").desc(findText_ZH_CN).findOne(1000);
         var button2 = className("android.view.ViewGroup").desc(findText_ZH_TW).findOne(1000);
         var button3 = className("android.view.ViewGroup").desc(findText_EN_US).findOne(1000);
         if (button1) {
             findBtn = true
             taskLog("找到" + findText_ZH_CN);
             click(button1.bounds().centerX() , button1.bounds().centerY())
             break; // 跳出循环
         }else if(button2){
             findBtn = true
             taskLog("找到" + findText_ZH_TW);
             click(button2.bounds().centerX() , button2.bounds().centerY())
             break; // 跳出循环
         }else if(button3){
             findBtn = true
             taskLog("找到" + findText_EN_US);
             click(button3.bounds().centerX() , button3.bounds().centerY())
             break; // 跳出循环
         }

         sleep(1000)

     }

     return findBtn

}

//通过View的Desc
function find_view_desc_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

    var findBtn = false

    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("寻找" + findText_ZH_CN + "按钮失败");
             taskLog("循环已执行3次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }


         // 查找控件
         var button1 = className("android.view.View").desc(findText_ZH_CN).findOne(1000);
         var button2 = className("android.view.View").desc(findText_ZH_TW).findOne(1000);
         var button3 = className("android.view.View").desc(findText_EN_US).findOne(1000);
         if (button1) {
             findBtn = true
             taskLog("找到" + findText_ZH_CN);
             click(button1.bounds().centerX() , button1.bounds().centerY())
             break; // 跳出循环
         }else if(button2){
             findBtn = true
             taskLog("找到" + findText_ZH_TW);
             click(button2.bounds().centerX() , button2.bounds().centerY())
             break; // 跳出循环
         }else if(button3){
             findBtn = true
             taskLog("找到" + findText_EN_US);
             click(button3.bounds().centerX() , button3.bounds().centerY())
             break; // 跳出循环
         }

         sleep(1000)

     }

     return findBtn

}



//通过View的text
function find_view_text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

    var findBtn = false

    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("寻找" + findText_ZH_CN + "按钮失败");
             taskLog("循环已执行3次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }


         // 查找控件
         var button1 = className("android.view.View").text(findText_ZH_CN).findOne(1000);
         var button2 = className("android.view.View").text(findText_ZH_TW).findOne(1000);
         var button3 = className("android.view.View").text(findText_EN_US).findOne(1000);
         if (button1) {
             findBtn = true
             taskLog("找到" + findText_ZH_CN);
             click(button1.bounds().centerX() , button1.bounds().centerY())
             break; // 跳出循环
         }else if(button2){
             findBtn = true
             taskLog("找到" + findText_ZH_TW);
             click(button2.bounds().centerX() , button2.bounds().centerY())
             break; // 跳出循环
         }else if(button3){
             findBtn = true
             taskLog("找到" + findText_EN_US);
             click(button3.bounds().centerX() , button3.bounds().centerY())
             break; // 跳出循环
         }

         sleep(1000)

     }

     return findBtn

}




//强制停止TikTok 
function forceStop_APP(packageName){
    taskLog("准备强杀:" + packageName + "...")
    sleep(1000);
    openAppSettings(packageName)
    sleep(5000)

    //繁体
    if (text("強行停止").exists()) {
        let forceStopBtn = text("強行停止").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("確定").exists()) {
                taskLog("已经找到可点击的'強行停止'按钮！！！！！！！！！！");
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



//回答当然页面的所有EditText的所有问题，填入内容
function answer_all_questions(){
    //获取当前页面所有EditText
    var editTexts = className("android.widget.EditText").find()
    toast("当前页面所有输入框个数 = " + editTexts.length)

    if(editTexts.length == 0){
        taskLog("当前页面没有EditText")
        return
    }
    
    //遍历所有EditText
    for(var i = 0; i < editTexts.length; i++){
        var editText = editTexts[i]
        
        //检查EditText是否可见
        if(!editText.visibleToUser()){
            //如果不可见,尝试滚动屏幕
            let screenHeight = device.height;
            let startY = screenHeight * 0.8;  // 从屏幕80%的位置开始
            let endY = screenHeight * 0.2;    // 滑动到屏幕20%的位置
            
            swipe(device.width / 2, startY, device.width / 2, endY, 500);
            sleep(random(1000, 3000)) //等待滚动完成
            
            //重新获取EditText列表
            editTexts = className("android.widget.EditText").find()
            if(i < editTexts.length) {
                editText = editTexts[i]
            }
        }
        
        //再次检查是否可见
        if(editText && editText.visibleToUser()){
            //填入内容
            editText.setText("YES, This is awesome! 😎")            
            sleep(random(3000, 5000))
        } else {
            taskLog("警告:第" + (i+1) + "个EditText仍然不可见或已不存在,跳过此项")
        }
    }
    
    //检查是否还有未填写的EditText
    var remainingEditTexts = className("android.widget.EditText").find()
    if(remainingEditTexts.length > 0){
        taskLog("注意:页面上可能还有" + remainingEditTexts.length + "个未处理的EditText")
    }
    
    sleep(random(8000, 10000))

    //点击同意的checkbook
    // className("android.view.View").text("I agree to the group rules").findOne().click()
    find_view_text_base("I agree to the group rules","我同意社團規則","I agree to the group rules")
    sleep(random(3000, 5000))

    //点击提交按钮
    toast("开始检测submit按钮")

    //Facebook语言是英语时：View - Submit
    find_view_desc_base("Submit","提交","Submit")

    //Facebook语言是繁体时：ViewGroup - 提交
    find_viewGroup_desc_base("提交","Submit","Submit")   
    
    sleep(random(8000, 10000))
}
