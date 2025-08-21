// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************自動社團發文************************
// 1 放入社團連結,放幾個就執行幾個
// 2 發文內容可多篇隨機
// 3 可發圖片or影片
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"

//需要添加的用户好友
const FB_Group_links = '$${T_FB_输入需要動態文章发文的所有Group}';
const FB_common_count = 10 //一共有多少个Group
const FB_group_comment_text = '$${T_FB_输入動態发文的所有文本}';
const FB_input_IMAGE = '$${T_FB_图片地址}';



// 添加全局索引计数器
let commentIndex = 0;

var FacebookPackageName = 'com.facebook.katana';
//将需要处理的多媒体图片，单独copy一份放到这个文件夹里面，后面处理完成之后，再删除这个文件夹
var A_NEST_FaceBook_MEDIA = 'A_NEST_FaceBook_MEDIA'; 

//选中图片时候，包含视频的个数这样来决定需要sleep多长时间
var containVideoCount  = 0


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



    var all_friends = get_all_groups()
    toast("所有Group数量 = " + all_friends.length)
    sleep(random(3000, 5000))


    for(var i = 0; i < all_friends.length; i++){

        var friend_info_link = all_friends[i]
        toast("当前Group信息 = " + friend_info_link)
        sleep(random(1000, 3000))

        var oepnUrlFlag = openFacebookLink_test(friend_info_link)
        if(oepnUrlFlag){
            taskLog("正在加载当前Group页面信息..." )
            sleep(random(5000, 8000))
            //找到在Group群组发表po文的按钮
            find_post_button()
        }else{
            taskLog("打开链接失败，跳过 = " + friend_info_link)
        }
        

    }


//删除临时图片库 :A_NEST_FaceBook_MEDIA
sleep(random(3000, 5000))
delete_temp_image("/storage/emulated/0/Download/" + A_NEST_FaceBook_MEDIA)

sleep(random(3000, 5000))
// 删除原文件夹
try {
    files.removeDir(FB_input_IMAGE);
    taskLog("删除原文件夹成功: " + folderPath);
} catch(e) {
    console.error("删除原文件夹失败: " + e);
    // 复制成功但删除失败，也算部分成功
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

    FB_common_count = comments.length
    toast("一共有" + FB_common_count + "个Group")
    
    return comments
}

//读取本地txt的文本内容
function read_FB_input_text(){

    //输入文案
    let postContent = "";
    const file = new java.io.File(FB_group_comment_text);
    if (file.exists() && file.isFile()) {
        try {
            // 读取文件内容
            const reader = new java.io.BufferedReader(new java.io.FileReader(file));
            let lines = [];
            let line;
            while ((line = reader.readLine()) !== null) {
                lines.push(line);
            }
            reader.close();
            postContent = lines.join('\n'); // 使用换行符连接每行内容
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
        }
    } else {
        // 如果文件不存在，将输入内容本身作为文本
        postContent = FB_group_comment_text;
    }

    return postContent



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




//找到在Group群组发表po文的按钮
function find_post_button(){
    // className("android.widget.Button").text("Write something...").findOne().click()

    taskLog("开始寻找在Group群组发表po文的按钮...")
    var postBtn = find_btn_desc_base("Write something...","留個言吧……","Write something...")   
    if(postBtn){
        var postContent = read_FB_input_text()
        
        if(postContent.includes("$${T")){ 
            throw_error_storage_not_enough()
        }
        if(postContent && 
            postContent.trim() !== "" && 
            postContent.trim().toLowerCase() !== "off" && 
            !postContent.includes("$${")){
                taskLog("准备输入分享内容....");
                className("android.widget.AutoCompleteTextView").findOne().click()
                sleep(5000)
                className("android.widget.AutoCompleteTextView").findOne().setText("")
                sleep(5000)
                className("android.widget.AutoCompleteTextView").findOne().setText(postContent)
                sleep(random(5000, 10000))
        }else{
            taskLog("输入PO文内容是空，所以不需要输入文本")
        }

        //检查是否需要发图片
        post_Image()


        toast("准备点击POST....");
        sleep(random(3000, 5000))
        find_btn_desc_base("發佈", "POST", "發佈")


    
        taskLog("等待分享结果，大约60s左右....");
        sleep(random(50000,60000))
    
        taskLog("包含视频的个数：" + containVideoCount)
        var sleepVideoTime = 1000
        if(containVideoCount > 0){
            sleepVideoTime = containVideoCount * 50000
            taskLog("包含视频的个数：" + containVideoCount + "，所以需要sleep" + sleepVideoTime/1000 + "s")
        }else{
            taskLog("包含视频的个数：" + containVideoCount + "，所以不需要sleep")
        }
        sleep(sleepVideoTime)

    }else{
        toast("未找到在Group群组发表po文的按钮，进行下一个Group任务");
    }
    
}

function post_Image(){
    taskLog("FB_input_IMAGE的实际值: " + FB_input_IMAGE)
    
    // 检查是否是有效的图片路径（不是模板字符串且文件存在）
    if(FB_input_IMAGE && 
        FB_input_IMAGE.trim() !== "" && 
        FB_input_IMAGE.trim().toLowerCase() !== "off" && 
        !FB_input_IMAGE.includes("$${")){

            refreshMedia("/storage/emulated/0/Download/")
            //FB_input_IMAGE的实际值: /sdcard/Download/01
            var transferImage = transferHeadImageToNest(FB_input_IMAGE)

            if(transferImage){

                //className("android.widget.Button").desc("Photo/video").findOne().click()
                taskLog("准备点击 - 相片／影片....")
                find_btn_desc_base("Photo/video", "相片／影片")
                sleep(random(3000, 5000))

                //点击权限
                //className("android.widget.Button").desc("Allow access").findOne().click()
                taskLog("准备检查权限....")
                find_btn_desc_base("Allow access", "允許存取")
                // sleep(3000)

                //再次点击权限
                // className("android.widget.Button") text("允許") clickable("true")
                find_btn_Text_base( "允許", "ALLOW")
                sleep(3000)

                //系统弹窗
                find_btn_Text_base("允許", "Allow")
                sleep(3000)



                className("android.widget.GridView").findOne().children().forEach(child => {
                    var target = child.findOne(className("android.widget.Spinner"));
                    if(target == null){
                        taskLog("未找到target控件，跳过");
                        return;
                    }
                    target.click();
                    sleep(5000)


                    //点击对应的targetPath：A_NEST_FaceBook_MEDIA
                    var allListTextView = className("android.view.ViewGroup").find();
                    taskLog("找到allListTextView: 全部 = "  + allListTextView.size());
                    if (allListTextView && allListTextView.size() > 0) {
                        for (var i = 0; i < allListTextView.size(); i++) {
                            var listTextView = allListTextView.get(i);
                            if (listTextView) {
                                taskLog("找到listTextView控件-Text：" + listTextView.desc());
                                
                                // 检查text是否为"A_NEST_TikTok_MEDIA"
                                if (listTextView.desc() != null && listTextView.desc().includes("A_NEST_FaceBook_MEDIA")) {
                                    // 正确调用bounds()方法并点击
                                    taskLog("找到对应目录" + listTextView.desc());
                                    var bounds = listTextView.bounds();
                                    if (isFullyVisible(bounds)) {
                                        click(bounds.centerX(), bounds.centerY());
                                        taskLog("点击坐标：" + bounds.centerX() + ", " + bounds.centerY());
                                    } else {
                                        // 可选：点击可见区域的某个点，比如top+10, left+10
                                        let x = Math.min(bounds.centerX(), device.width - 10);
                                        let y = Math.min(bounds.top + 10, device.height - 10);
                                        click(x, y);
                                        taskLog("点击部分可见图片的坐标：" + x + ", " + y);
                                    }
                                    // 找到并点击后可以跳出循环
                                    break;
                                }
                            }
                        }
                    }

                    sleep(random(3000, 5000))


                    //选择图片 - desc("選擇多個")
                    find_btn_desc_base("Select multiple", "選擇多個")
                    sleep(random(3000, 5000))

                    //选中所有图片（支持滑动选取，使用 bounds 唯一标识）
                    let selectedSet = new Set();
                    let tryCount = 0;
                    while (true) {
                        let gridView = className("android.widget.GridView").findOne();
                        let children = gridView.children();
                        let newSelected = 0;
                        for (let i = 0; i < children.size(); i++) {
                            let child = children.get(i);
                            let button = child.findOne(className("android.widget.Button"));
                            if (!button) continue;
                            let buttonDesc = button.desc();
                            let boundsStr = JSON.stringify(button.bounds());
                            if (selectedSet.has(boundsStr)) continue; // 跳过已选
                            taskLog("buttonDesc: " + buttonDesc + "，button.selected(): " + button.selected());
                            //影片：desc("在6月 27, 2025 03:22拍攝的影片")  - desc("Video taken on Jun 27, 2025 15:25")

                            if(buttonDesc.indexOf("Video taken on") !== -1 || buttonDesc.indexOf("影片") !== -1){
                                containVideoCount++;
                            }
                            
                            if (buttonDesc.indexOf("Photo taken on") !== -1 || buttonDesc.indexOf("的相片") !== -1 || buttonDesc.indexOf("影片") !== -1 || buttonDesc.indexOf("Video taken on") !== -1) {
                                if(button.selected() === false){
                                    let bounds = button.bounds();
                                    let safePoint = getSafeClickPoint(bounds);
                                    if (safePoint) {
                                        click(safePoint.x, safePoint.y);
                                        taskLog("点击最上方可见点：" + safePoint.x + ", " + safePoint.y);
                                    } else {
                                        taskLog("Button完全不可见，跳过点击：" + JSON.stringify(bounds));
                                    }
                                    newSelected++;
                                    selectedSet.add(boundsStr);
                                }
                                sleep(1000); // 不要太长
                            }
                        }
                        if (newSelected === 0) {
                            tryCount++;
                            if (tryCount >= 3) break;
                        } else {
                            tryCount = 0;
                        }
                        swipe_up();
                        sleep(3000); // 加长等待
                    }



                    //点击Nest
                    //className("android.widget.Button").desc("Next").findOne().click()
                    //desc("繼續")
                    find_btn_desc_base("Next", "繼續")
                    sleep(random(3000, 5000))

                });  

            }else{
                taskLog("转移图片失败，停止上传图片")
            }

            
        }
}

// 刷新指定路径的媒体库
function refreshMedia(path) {
    toast("开始刷新媒体库，用时5秒钟....");
    // 发送媒体扫描广播
    media.scanFile(path);
    // 等待扫描完成
    sleep(5000);
}

//转移头像图片到Nest临时文件夹（支持文件夹批量处理，不判断扩展名，返回true/false）
function transferHeadImageToNest(folderPath){
    //folderPath: /sdcard/Download/01
    function getParentDir(path) {
        if (path.endsWith("/")) path = path.slice(0, -1);
        let idx = path.lastIndexOf("/");
        if (idx === -1) return "";
        return path.substring(0, idx);
    }

    function copyDir(src, dest) {
        files.ensureDir(dest);
        let filesList = files.listDir(src);
        for (let i = 0; i < filesList.length; i++) {
            let name = filesList[i];
            let srcPath = src + "/" + name;
            let destPath = dest + "/" + name;
            if (files.isDir(srcPath)) {
                if (!copyDir(srcPath, destPath)) return false;
            } else {
                try {
                    files.copy(srcPath, destPath);
                } catch(e) {
                    console.error("复制文件失败: " + srcPath + " -> " + destPath + "，错误：" + e);
                    return false;
                }
            }
        }
        return true;
    }

    const parentDir = getParentDir(folderPath); // /sdcard/Download
    const newFolder = parentDir + "/A_NEST_FaceBook_MEDIA";

    taskLog("准备复制文件夹: " + folderPath + " -> " + newFolder);

    // 判断原文件夹是否存在
    if (!files.exists(folderPath) || !files.isDir(folderPath)) {
        console.error("原文件夹不存在: " + folderPath);
        toast("原文件夹不存在: " + folderPath);
        return false;
    }

    // 如果目标文件夹已存在，先删除
    if (files.exists(newFolder)) {
        try {
            files.removeDir(newFolder);
            taskLog("已删除原有目标文件夹: " + newFolder);
        } catch(e) {
            console.error("删除原有目标文件夹失败: " + e);
            return false;
        }
    }

    // 递归复制文件夹
    if (!copyDir(folderPath, newFolder)) {
        console.error("递归复制文件夹失败");
        return false;
    }
    taskLog("复制文件夹成功: " + newFolder);

    // // 删除原文件夹
    // try {
    //     files.removeDir(folderPath);
    //     taskLog("删除原文件夹成功: " + folderPath);
    // } catch(e) {
    //     console.error("删除原文件夹失败: " + e);
    //     // 复制成功但删除失败，也算部分成功
    // }

    // 刷新媒体库
    refreshMedia(newFolder);

    return true;
}


//删除临时图片文件夹
function delete_temp_image(folderPath) {
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

function swipe_up(){
    //使用多段swipe实现曲线滑动
    let screenHeight = device.height;
    let x = device.width / 2;
    let startY = device.height * 0.7;
    let endY = device.height * 0.3;
    swipe(x, startY, x, endY, 600);
    sleep(3000); // 加长等待
}

function isFullyVisible(bounds) {
    return bounds.top >= 0 && bounds.left >= 0 &&
           bounds.right <= device.width && bounds.bottom <= device.height;
}

function getSafeClickPoint(bounds) {
    // 计算可见区域
    let left = Math.max(bounds.left, 0);
    let top = Math.max(bounds.top, 0);
    let right = Math.min(bounds.right, device.width);
    let bottom = Math.min(bounds.bottom, device.height);

    // 如果完全不可见，跳过
    if (left >= right || top >= bottom) return null;

    // 尽量点图片的上半部分中间
    let x = Math.floor((left + right) / 2);
    let y = top + 10; // 距离顶部10像素，避免点到边缘

    // 如果可见高度很小，点到最上面
    if ((bottom - top) < 20) y = top + 2;

    return { x, y };
}
