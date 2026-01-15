// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************社團動態文章留言************************
// 1 導入社團連結有幾個就執行幾個

// 2 每個社團由上往下貼文進行留言 需可設置幾篇文章留言數量 內容前面需要tag版主(在手機鍵盤按@就能選擇版主)

// 3 留言內容可文字or圖片 
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//需要添加的用户好友
// const FB_Group_links = '$${T_FB_输入需要動態文章留言的所有Group}';
const FB_Group_links = '$${T_FB_輸入指定社團網址}';
const FB_common_count = '$${FB_留言數量}';
const FB_group_comment_text = '$${T_FB_輸入留言內容}';
const FB_input_IMAGE = '$${T_FB_輸入圖片地址}';
const FB_Like_Count = "$${點讚機率}" //点赞概率


const LIKE_TEXT = {
    ZH_CN: "Like",      // 简体中文
    ZH_TW: "讚",      // 繁体中文
    EN_US: "Like"         // 英文 
};

const LIKE_TEXT_END = {
    ZH_TW: "按住即可對留言傳達心情", // 繁体中文
};



// 添加全局索引计数器
let commentIndex = 0;

var FacebookPackageName = 'com.facebook.katana';
var A_NEST_FaceBook_MEDIA = 'A_NEST_FaceBook_MEDIA'; 

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


// 注册退出事件监听器
events.on('exit', function(){

    taskLog("脚本执行结束，准备关闭日志窗口...");
    // openLogActivity();
    forceStop_APP(FacebookPackageName)
    
    console.hide()
    sleep(1000)

    if(handleErrorFlag){
        taskLogError("-----------------脚本执行出现异常---------------");
        taskLogError("Facebook首页点赞 + 留言---------------");
        taskLogError("脚本执行时间：" + new Date().toLocaleString());
    }else{
        taskLog("-----------------脚本功能执行结束：---------------");
        taskLog("Facebook首页点赞 + 留言---------------");
        taskLog("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();

});


sleep(3000)
taskLog("准备启动Facebook...")

var targetPackageName = null;
var targetClassName = null;


// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
}

function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
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


function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}

if (isAppInstalled(FacebookPackageName)) {
    targetPackageName = FacebookPackageName;
    targetClassName = "com.facebook.katana.activity.FbMainTabActivity";
    taskLog("检测到已安装Facebook，准备启动...");
} else {
    taskLog("未检测到Facebook已安装，请先安装Facebook！");
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


    var all_friends = get_all_groups()
    taskLog("所有Group数量 = " + all_friends.length)
    sleep(random(3000, 5000))   


    for(var i = 0; i < all_friends.length; i++){
        sleep(random(3000, 5000))

        var friend_info_link = all_friends[i]
        taskLog("当前Group信息 = " + friend_info_link)
        sleep(random(3000, 5000))

        var openUrlFlag = openFacebookLink_test(friend_info_link)
        if(openUrlFlag){
            taskLog("正在加载当前Group页面信息..." )
            sleep(random(5000, 8000))
            fina_all_Comment()
        }else{
            taskLog("打开链接失败，跳过 = " + friend_info_link)
        }


    }


//删除临时图片库 :A_NEST_FaceBook_MEDIA
sleep(random(3000, 5000))
delete_temp_image("/storage/emulated/0/Download/" + A_NEST_FaceBook_MEDIA)  
taskLog("所有循环执行完毕，准备结束任务...");
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
        taskLog("请求截图失败");
    }else{
        taskLog("请求截图");
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
function get_all_groups(){
    // 用于存储用户的数组
    let comments = [];
    // 户是否存在
    taskLog("用户地址 =  " + FB_Group_links)
    const file = new java.io.File(FB_Group_links);
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
        comments.push(FB_Group_links);
    }
    
    return comments
}

//从group评论数组中，顺序挑选一条内容
function get_all_groups_comment_text(){
    // 用于存储用户的数组
    let comments = [];
    // 户是否存在
    taskLog("group评论数组 =  " + FB_group_comment_text)
    const file = new java.io.File(FB_group_comment_text);
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
        comments.push(FB_group_comment_text);
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





//知道页面所有的Comment按钮
function fina_all_Comment(){
    //计数器，记录已经点击的Comment按钮数量
    let clickedCount = 0;
    //计数器，记录连续下滑未找到Comment按钮的次数
    let noCommentScrollCount = 0;
    
    //设置开始时间
    let startTime = new Date().getTime();
    //设置超时时间（60秒 * 评论次数）
    const TIMEOUT = 180 * 1000 * FB_common_count;  // 转换为毫秒

    taskLog("开始寻找Comment按钮，超时时间 = " + (TIMEOUT/1000) + "秒,评论次数 = " + FB_common_count);
    
    //循环直到点击了需要的Comment按钮次数
    var FB_group_common_count = parseInt(FB_common_count);
    while(clickedCount < FB_group_common_count){

        //检查是不是有点赞按钮
        var likeBtnList = className("android.widget.Button").find();
        if(likeBtnList.size() > 0){
            for(var i = 0; i < likeBtnList.size(); i++) {
                var likeBtn = likeBtnList.get(i);
                if(likeBtn){
                    var descText = likeBtn.desc() || "";
                    if (Object.values(LIKE_TEXT).some(text => descText.startsWith(text)) 
                        || Object.values(LIKE_TEXT_END).some(text => descText.includes(text)))  {

                        if (Math.random() * 100 < FB_Like_Count)  {
                            taskLog("开始触发点赞概率")
                            click(likeBtn.bounds().centerX() , likeBtn.bounds().centerY())  
                            sleep(random(2000, 4000))
                        }else{
                            taskLog("虽然找到点赞按钮，没有触发点赞概率")
                        }
                    }
                }
            }
        }


        //检查是否超时
        if(new Date().getTime() - startTime > TIMEOUT){
            taskLog("执行时间超过" + (TIMEOUT/1000) + "秒，自动退出");
            return;
        }

        //获取当前页面所有Comment按钮
        //繁体：className("android.widget.Button").desc("留言").findOne().click()

        var comments_eng = className("android.widget.Button").desc("Comment").find();
        var comments_zh = className("android.widget.Button").desc("留言").find();


        taskLog("当前页面所有Comment-EN按钮 = " + comments_eng.length);
        taskLog("当前页面所有Comment-ZH按钮 = " + comments_zh.length);
        
        if(comments_eng.length == 0 && comments_zh.length == 0){
            noCommentScrollCount++; // 增加未找到计数
            taskLog("当前页面没有Comment按钮，准备下滑页面，这是第" + noCommentScrollCount + "次连续未找到");
            
            //如果连续5次下滑都没找到，退出循环
            if(noCommentScrollCount >= 5){
                taskLog("连续5次下滑都未找到Comment按钮，终止任务");
                return;
            }
            
            //使用多段swipe实现曲线滑动
            swipe_up()
            
            //重新获取Comment按钮
            comments_eng = className("android.widget.Button").desc("Comment").find();
            comments_zh = className("android.widget.Button").desc("留言").find();
            
            //如果滑动后还是没有找到Comment按钮，继续下一次循环
            if(comments_eng.length == 0 && comments_zh.length == 0){
                taskLog("下滑后仍未找到Comment按钮，继续寻找");

                //检查是不是已经到了FB提示页面      
                check_comment_result()
                sleep(3000)

                continue;
            }
        }
        
        //找到Comment按钮后，点击最后一个
        if(comments_eng.length > 0 || comments_zh.length > 0){
            noCommentScrollCount = 0; // 重置未找到计数
            taskLog("找到Comment按钮，准备点击第" + (clickedCount + 1) + "次");
            if(comments_eng.length > 0){    
                comments_eng[comments_eng.length - 1].click(); // 选择最后一个元素
            }else{
                comments_zh[comments_zh.length - 1].click(); // 选择最后一个元素
            }
            post_content()
            sleep(random(3000, 5000))

            clickedCount++;
            sleep(random(3000, 5000)); //等待点击操作完成
            
            swipe_up()
        }
    }
    
    taskLog("已完成" + FB_group_common_count + "次Comment按钮的点击操作");

    check_comment_result()
    sleep(random(3000, 5000)) 

    back()
    sleep(random(3000, 5000))

    back()
}


//开始评论内容
function post_content(){
    //设置开始时间
    const startTime = new Date().getTime();

    //检查总时间的函数
    function checkTimeout() {
        if(new Date().getTime() - startTime > 60 * 1000) {  // 60秒 = 60 * 1000毫秒
            taskLog("评论操作总时间超过60秒，自动退出");
            sleep(1000)
            back()
            sleep(3000)
            return true;
        }
        taskLog("评论操作总时间没有超过60秒，继续进行");
        return false;
    }


    
    taskLog("准备输入评论内容....");
    taskLog("准备输入评论内容....");

    //尝试点击输入框
    try {
        let inputBox = className("android.widget.AutoCompleteTextView").findOne(10000); // 5秒超时
        if(inputBox) {
            inputBox.click();
            taskLog("点击输入框成功");
        } else {
            sleep(3000)
            taskLog("未找到输入框");
            sleep(1000)
            back()
            sleep(3000)
            return;
        }
    } catch(e) {
        sleep(1000);
    }
    sleep(2000);
    
    //检查超时
    if(checkTimeout()) return;

    //尝试输入文本
    try {
        var all_group_comment_text = get_all_groups_comment_text()  
        if(all_group_comment_text.includes("$${T")){ 
            throw_error_storage_not_enough()
        }
        var randIdx = random(0, all_group_comment_text.length - 1)
        var messageText = all_group_comment_text[randIdx];
        taskLog("输入内容 = " + messageText);

        //检查是不是已经到了FB提示页面
        check_comment_result()
        sleep(3000)

        //className("android.widget.AutoCompleteTextView")
        let textBoxList = className("android.widget.AutoCompleteTextView").find(); 
        if(textBoxList.length > 0) {
            textBoxList[0].click();
            sleep(random(1000, 2000))
            textBoxList[0].setText(messageText);
        } else {
            taskLog("未找到输入框");
            sleep(1000)
            back()


            sleep(3000)
            return;
        }
    } catch(e) {
        sleep(1000);
    }
    sleep(5000);
    
    //检查超时
    if(checkTimeout()) return;


    //检查是否需要发图片
    post_Image()
    sleep(2000)

    //退出图库选中，因为要点击send按钮，否则可能会点中图库的最后一张图片
    back()
    sleep(3000)



    //尝试点击发送按钮
    try {
        
        // let sendBtn = className("android.widget.Button").desc("Send").findOne(10000); // 5秒超时
        // if(sendBtn) {
        //     sendBtn.click();
        // } else {
        //     taskLog("未找到发送按钮");
        //     sleep(1000)
        //     back()
        //     sleep(3000)
        //     return;
        // }

        let sendBtn = find_btn_desc_base("Send", "傳送", "Send")
        if(!sendBtn){
            taskLog("未找到发送按钮");
            sleep(1000)
            back()
            sleep(3000)
            return;
        }


    } catch(e) {
        sleep(1000);
    }
    sleep(5000);

    // //检查超时
    // if(checkTimeout()) return;

    check_comment_result()
    sleep(3000)

    back()
    sleep(3000)

    back()
}


    

//在评论之后，要检查一下，有没有出现一个新页面：desc("We removed your comment")
function check_comment_result(){
    var check_comment_result = find_view_desc_base("We removed your comment","我們移除了您的評論","We removed your comment")
    taskLog("先检查是否处于FaceBook警告页面： = " + check_comment_result);
    if(check_comment_result){
        taskLog("目前处于FaceBook警告页面，需要关闭");
        find_btn_desc_base("Close","關閉","Close")
        sleep(random(3000, 5000))
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
    sleep(random(3000, 5000)); //等待滚动完成
}



function post_Image(){
    taskLog("开始检查图片条件判断...")
    taskLog("FB_input_IMAGE的实际值: " + FB_input_IMAGE)
    
    // 检查是否是有效的图片路径（不是模板字符串且文件存在）
    if(FB_input_IMAGE && 
        FB_input_IMAGE.trim() !== "" && 
        FB_input_IMAGE.trim().toLowerCase() !== "off" && 
        !FB_input_IMAGE.includes("$${")){
            taskLog("检测到有效的图片路径，准备处理图片...")
            taskLog("图片不是空")    

            taskLog("FB_input_IMAGE = " + FB_input_IMAGE)

            refreshMedia("/storage/emulated/0/Download/")
            var imageTempPath = transferHeadImageToNest(FB_input_IMAGE)
            sleep(10000)

            //className("android.widget.Button").desc("Show photos and videos").findOne().click()
            //desc("顯示相片和影片")
            var findImageBtn = find_btn_desc_base("Show photos and videos", "顯示相片和影片", "Show photos and videos")
            if(findImageBtn){

                sleep(5000)

                //点击权限
                //className("android.widget.Button").desc("Allow access").findOne().click()
                find_btn_desc_base("Allow access", "允許存取", "Allow access")
                sleep(3000)
    
                //再次点击权限
                // id("(name removed)").className("android.widget.Button").text("ALLOW").findOne().click()
                find_btn_Text_base("ALLOW", "允許", "ALLOW")
                sleep(3000)
    
                //系统弹窗
                find_btn_Text_base("允许", "允許", "Allow")
                sleep(3000)
    
    
    
                //选中一张图片即可
                var isPhotoSelected = false;  // 添加标志位
                className("android.widget.GridView").findOne().children().forEach(child => {
                    if (isPhotoSelected) return;  // 如果已经选中图片就跳过后续循环
    
                    var button = child.findOne(className("android.widget.Button"));
                    if (!button) {
                        taskLog("未找到Button控件，跳过");
                        return;
                    }
                    
                    var buttonDesc = button.desc();
                    if (!buttonDesc) {
                        taskLog("Button没有描述文本，跳过");
                        return;
                    }
                    
                    taskLog("选择图片描述 = " + buttonDesc);
                    taskLog("选择图片描述 = " + buttonDesc);
                    
                    if (buttonDesc.indexOf("Photo taken on") !== -1 || buttonDesc.indexOf("的相片") !== -1)  {
                        taskLog("找到目标图片：" + buttonDesc);
                        var bounds = button.bounds();
                        if (bounds) {
                            click(bounds.centerX(), bounds.centerY());
                            taskLog("点击坐标：" + bounds.centerX() + ", " + bounds.centerY());
                            isPhotoSelected = true;  // 设置标志位为true
                            sleep(2000);
                        }
                    }
                });
    
                if (isPhotoSelected) {
                    //点击Next
                    taskLog("已经选中图库中的第一张图片");
                    sleep(5000);
                } else {
                    taskLog("未找到任何符合条件的图片");
                    taskLog("未找到任何符合条件的图片");
                }

                
            }

        

            

            
        }
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

//转移头像图片到Nest临时文件夹
function transferHeadImageToNest(fileName){
    let imagePath = null;
    if (files.exists(fileName)) {
        imagePath = fileName;
    }
    
    if (!imagePath) {
        console.error("未找到指定图片：" + fileName);
        taskLog("未找到指定图片：" + fileName);
        return;
    }


    //开始拷贝一份，到本地自己的文件夹来单独处理，不处理原来的图片，
    // 创建文件夹(如果不存在)
    const newFolder = "/storage/emulated/0/Download/" + A_NEST_FaceBook_MEDIA;  // 替换成你想要的文件夹路径
    if(!files.exists(newFolder)){
        files.ensureDir(newFolder);
        console.log("创建文件夹: " + newFolder);
    }
    // 目标图片路径(在新文件夹中)
    const targetFileName = files.getName(imagePath);
    const targetPath = newFolder + "/" + targetFileName;
    console.log("新图片文件的绝对路径: " + targetPath);
    // 复制图片文件
    try {
        files.copy(imagePath, targetPath);
        console.log("复制成功!");
        console.log("新图片路径: " + targetPath);
        // 复制成功后删除原图片
        files.remove(imagePath);
        console.log("已删除原图片: " + imagePath);
    } catch(e) {
        console.error("复制失败: " + e);
    }


    refreshMedia(newFolder)

    // // 创建文件对象并获取URI
    // let file = new java.io.File(targetPath);
    // let uri = app.getUriForFile(targetPath);
    
    // // 创建打开图片的 Intent
    // let intent = new Intent(Intent.ACTION_VIEW);
    // intent.setDataAndType(uri, "image/*");
    // // 添加必要的权限标志
    // intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    // intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

    // // 指定使用系统默认的图库应用
    // intent.setPackage("com.android.gallery3d");  // 系统默认图库的包名
    // // 如果上面的包名不生效，可以尝试：
    // // intent.setPackage("com.google.android.apps.photos");  // Google Photos
    // // intent.setPackage("com.sec.android.gallery3d");  // 三星图库
    // // intent.setPackage("com.miui.gallery");  // 小米图库

    // // 启动图片查看Activity
    // // context.startActivity(intent);
    // // 等待界面加载
    // sleep(3000);

    return targetPath


}

//删除临时图片文件夹
function delete_temp_image(folderPath) {
    taskLog("准备删除临时文件夹: " + folderPath);
    taskLog("准备删除临时文件夹: " + folderPath);
    
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