// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Facebook個人發文*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的评论内容
const FB_input_text = '$${T_FB_输入文案}';
const FB_input_IMAGE = '$${T_FB_图片地址}';

var FacebookPackageName = 'com.facebook.katana';
//将需要处理的多媒体图片，单独copy一份放到这个文件夹里面，后面处理完成之后，再删除这个文件夹
var A_NEST_FaceBook_MEDIA = 'A_NEST_FaceBook_MEDIA'; 


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
        console.error("Facebook個人發文以及图片---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        forceStop_FaceBook()
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Facebook個人發文以及图片---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
    forceStop_FaceBook()
    console.error("===错误报告开始===");
    console.error("错误信息：" + e);
    console.error("错误堆栈：" + e.stack);
    console.error("===错误报告结束===");
    exit()
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

sleep(random(3000, 5000))



    taskLog("打开Facebook成功...")
 
    //发布content
    //className("android.widget.Button").desc("Make a post on Facebook").findOne().click()
    //desc("在 Facebook 撰寫貼文")
    find_btn_desc_base("Make a post on Facebook", "在 Facebook 撰寫貼文", "發布到 Facebook")
    sleep(5000)


    // // 获取屏幕的宽度和高度
    // let screenWidth = device.width;
    // let screenHeight = device.height;
    // taskLog("屏幕区域的宽高坐标: (" + screenWidth + ", " + screenHeight + ")");
    // // 计算屏幕上方2/3区域的底部位置
    // let twoThirdsHeight = screenHeight * (2/3);
    // // 计算该区域的中心点坐标
    // let centerX = screenWidth / 2;
    // let centerY = twoThirdsHeight - (screenHeight / 3) / 2;
    // // 打印屏幕上方2/3区域的中心点坐标
    // taskLog("准备点击屏幕上方2/3区域的中心点坐标: (" + centerX + ", " + centerY + ")");
    // click(centerX,centerY)


    var postContent = read_FB_input_text()
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


    taskLog("准备点击下一步....");
    sleep(5000)
    find_btn_desc_base("下一步", "下一步" , "NEXT")

    //className("android.widget.Button").desc("POST").findOne().click()
    taskLog("准备点击POST....");
    sleep(5000)
    //className("android.view.ViewGroup").text("POST").findOne().click()
    //desc("發佈")
    find_viewGroup_text_base("POST", "發佈" , "發布")


    taskLog("等待分享结果，大约60s左右....");
    sleep(random(50000,60000))


    //删除临时图片库 :A_NEST_FaceBook_MEDIA
    delete_temp_image("/storage/emulated/0/Download/" + A_NEST_FaceBook_MEDIA)





function post_Image(){
    taskLog("FB_input_IMAGE的实际值: " + FB_input_IMAGE)
    
    // 检查是否是有效的图片路径（不是模板字符串且文件存在）
    if(FB_input_IMAGE && 
        FB_input_IMAGE.trim() !== "" && 
        FB_input_IMAGE.trim().toLowerCase() !== "off" && 
        !FB_input_IMAGE.includes("$${")){
            taskLog("检测到有效的图片路径，准备处理图片...")

            taskLog("开始刷新媒体库，用时5秒钟....")
            refreshMedia("/storage/emulated/0/Download/")
            //FB_input_IMAGE的实际值: /sdcard/Download/01
            var transferImage = transferHeadImageToNest(FB_input_IMAGE)
            // taskLog("transferImage = " + transferImage)

            // sleep(random(5000, 10000))


            if(transferImage){
                taskLog("转移图片成功，开始处理图片...")
                sleep(random(3000, 5000))

                //className("android.widget.Button").desc("Photo/video").findOne().click()
                taskLog("准备点击 - 相片／影片....")
                find_btn_desc_base("Photo/video", "相片／影片", "Photo/video")
                sleep(random(3000, 5000))

                //点击权限
                //className("android.widget.Button").desc("Allow access").findOne().click()
                taskLog("准备检查权限....")
                find_btn_desc_base("Allow access", "允許存取", "Allow access")
                // sleep(3000)

                //再次点击权限
                // id("(name removed)").className("android.widget.Button").text("ALLOW").findOne().click()
                find_btn_Text_base("ALLOW", "允許", "ALLOW")
                // sleep(3000)

                //系统弹窗
                find_btn_Text_base("允许", "允許", "Allow")
                // sleep(3000)


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
                                    click(bounds.centerX(), bounds.centerY());
                                    // 找到并点击后可以跳出循环
                                    break;
                                }
                            }
                        }
                    }

                    sleep(random(3000, 5000))


                    //选择图片
                    find_btn_desc_base("Select multiple", "選擇多張", "Select multiple")
                    sleep(random(3000, 5000))

                    //选中所有图片
                    className("android.widget.GridView").findOne().children().forEach(child => {
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
                        
                        if (buttonDesc.indexOf("Photo taken on") !== -1 || buttonDesc.indexOf("的相片") !== -1)  {
                            taskLog("找到目标图片：" + buttonDesc);
                            var bounds = button.bounds();
                            if (bounds) {
                                click(bounds.centerX(), bounds.centerY());
                                taskLog("点击坐标：" + bounds.centerX() + ", " + bounds.centerY());
                                sleep(random(2000, 3000));
                            }
                        }
                        sleep(random(3000, 5000));
                    });



                    //点击Nest
                    //className("android.widget.Button").desc("Next").findOne().click()
                    find_btn_desc_base("Next", "下一步", "Next")
                    sleep(random(3000, 5000))

                });
            

                

            }else{
                taskLog("转移图片失败，脚本终止。")
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
    toast("媒体库刷新完成，开始下一步任务...");
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

    // 删除原文件夹
    try {
        files.removeDir(folderPath);
        taskLog("删除原文件夹成功: " + folderPath);
    } catch(e) {
        console.error("删除原文件夹失败: " + e);
        // 复制成功但删除失败，也算部分成功
    }

    // 刷新媒体库
    sleep(3000);
    taskLog("重新刷新媒体库，用时5秒钟....");
    refreshMedia(newFolder);

    return true;
}



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
             var button1 = className("android.widget.Button").desc(findText_ZH_CN).findOne(1000);
             var button2 = className("android.widget.Button").desc(findText_ZH_TW).findOne(1000);
             var button3 = className("android.widget.Button").desc(findText_EN_US).findOne(1000);
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



//读取本地txt的文本内容
function read_FB_input_text(){

    //输入文案
    let postContent = "";
    const file = new java.io.File(FB_input_text);
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
        postContent = FB_input_text;
    }

    return postContent



}


//强制停止TikTok 
function forceStop_APP(packageName){
    taskLog("准备强杀:" + packageName + "...")
    sleep(1000);
    openAppSettings(packageName)
    sleep(random(3000, 5000))

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

//删除临时图片文件夹
function delete_temp_image(folderPath) {
    taskLog("准备删除临时文件夹: " + folderPath);
    toast("准备删除临时文件夹: " + folderPath);
    
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


//通过Button的Desc
function find_viewGroup_text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

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
         var button1 = className("android.view.ViewGroup").text(findText_ZH_CN).findOne(1000);
         var button2 = className("android.view.ViewGroup").text(findText_ZH_TW).findOne(1000);
         var button3 = className("android.view.ViewGroup").text(findText_EN_US).findOne(1000);
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
