// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************個人主頁留言點讚************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//需要添加的用户好友
const FB_Group_links = '$${T_FB_輸入個人頁網址}'; //https://www.facebook.com/liao.fu.da.573941
const FB_group_comment_text = '$${T_FB_輸入留言內容}';
const FB_Watch_Count = "$${瀏覽數量}" //个人主页浏览查看次数 ，比如5-10次，那么就是刷5-10个帖子


const FB_Like_Count = "$${點讚概率}" //点赞概率
const FB_Comment_Count = "$${留言概率}" //评论概率
const FB_Share_Count = "$${分享概率}" //分享概率




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



const LIKE_TEXT = {
    ZH_CN: "Like",      // 简体中文
    ZH_TW: "讚",      // 繁体中文
    ZH_TW_02: "點按兩下並按住",      // 繁体中文
    ZH_TW_03: "Double tap and hold",      // 繁体中文
    EN_US: "Like"         // 英文 
};


const SHARE_TEXT = {
    ZH_CN: "Share",      // 简体中文
    ZH_TW: "分享",      // 繁体中文
    EN_US: "Share"         // 英文 
};


const SHARE_GROUP_TEXT = {
    ZH_CN: "Group",      // 简体中文
    ZH_TW: "社團",      // 繁体中文
    EN_US: "Group"         // 英文 
};


//desc("繼續") desc("Next")
const SHARE_GROUP_DESC_TEXT = {
    ZH_CN: "Next",      // 简体中文
    ZH_TW: "繼續",      // 繁体中文
    EN_US: "Next"         // 英文 
};

//desc("POST") desc("發佈")
const SHARE_GROUP_POST_TEXT = {
    ZH_CN: "POST",      // 简体中文
    ZH_TW: "發佈",      // 繁体中文
    EN_US: "POST"         // 英文 
};


const COMMENT_TEXT = {
    ZH_CN: "Comment",      // 简体中文
    ZH_TW: "留言",      // 繁体中文
    EN_US: "Comment"         // 英文
};

const SEND_TEXT = {
    ZH_CN: "发送",      // 简体中文
    ZH_TW: "傳送",      // 繁体中文
    EN_US: "Send"         // 英文
};


    //className("android.view.ViewGroup") desc("你和其他1人都傳達了心情")
    //className("android.view.ViewGroup") desc("吴烽傳達了心情")
    //className("android.view.ViewGroup") desc("You and 18 others reacted")
    //className("android.view.ViewGroup") desc("You and others")
    //className("android.view.ViewGroup") desc("郭芷涵 reacted")
const LIKE_TEXT_LIST = {
    ZH_TW: "傳達了心情",      // 简体中文
    EN_US: "others reacted",      // 繁体中文
    EN_US_01: "reacted",         // 英文
    EN_US_02: "You and others"         // 英文

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

if (isAppInstalled(FacebookPackageName)) {
    targetPackageName = FacebookPackageName;
    targetClassName = "com.facebook.katana.activity.FbMainTabActivity";
    taskLog("检测到已安装Facebook，准备启动...");
} else {
    toast("未检测到Facebook已安装，请先安装Facebook！");
    taskLog("未检测到Facebook已安装，脚本终止。");
    exit();
}

// sleep(random(5000, 8000))
// openAppSettings(FacebookPackageName)
// sleep(random(3000, 5000))

forceStop_APP(FacebookPackageName)
sleep(3000)

app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});

try {

    var all_friends = get_all_groups()
    toast("所有Link数量 = " + all_friends.length)
    sleep(2000)
    var all_group_comment_text = get_all_groups_comment_text()

    if(all_group_comment_text.includes("$${T")){ 
        throw_error_storage_not_enough()
    }



    toast("所有评论数量 = " + all_group_comment_text.length)
    sleep(2000) 


    for(var i = 0; i < all_friends.length; i++){
        sleep(5000)

        var friend_info_link = all_friends[i]
        toast("当前Group信息 = " + friend_info_link)
        sleep(5000)

        var openFacebookLink_result = openFacebookLink_test(friend_info_link)
        sleep(10000)
        if(!openFacebookLink_result){
            taskLog("打开个人主页失败，跳过当前Link: " + friend_info_link)
            continue
        }else{
            taskLog("打开个人主页成功，开始浏览个人主页")

            var watchCount = parseInt(FB_Watch_Count) || 1; // 转换为数字，默认为1
            taskLog("个人主页浏览查看次数: " + watchCount)
            for(var j = 0; j < watchCount; j++){
    
                //点赞
                var likeProbability = parseFloat(FB_Like_Count) || 0; // 转换为数字，默认为0
                var shouldLike = Math.random() * 100 < likeProbability;
                if (shouldLike)  {
                    taskLog("开始触发点赞概率 (" + likeProbability + "%)，将点击点赞按钮")
                    find_like_button(shouldLike)
                    sleep(random(1000, 3000))   
                } else {
                    taskLog("未触发点赞概率 (" + likeProbability + "%)，将查找但不点击点赞按钮")
                }
                
    
                //评论
                var commentProbability = parseFloat(FB_Comment_Count) || 0; // 转换为数字，默认为0
                if (Math.random() * 100 < commentProbability)  {
                    taskLog("开始触发评论概率 (" + commentProbability + "%)")
                    if(FB_group_comment_text && FB_group_comment_text.trim() !== "" 
                    && FB_group_comment_text.trim().toLowerCase() !== "off"){
                        var commentButton = find_btn_desc_base("Comment", "留言")
                        if(commentButton){
                            //评论
                            find_post_button()
                        }else{
                            taskLog("当前Group没有评论，跳过评论功能")
                        }
                    }
                }else{
                    taskLog("未触发评论概率 (" + commentProbability + "%)")
                }



                //分享
                var shareProbability = parseFloat(FB_Share_Count) || 0; // 转换为数字，默认为0
                if (Math.random() * 100 < shareProbability)  {
                    taskLog("开始触发分享概率 (" + shareProbability + "%)")
                    var findShareButtonResult = find_share_button(true)
                    if(findShareButtonResult){
                        taskLog("找到分享按钮，点击分享按钮")
                        sleep(random(1000, 3000))
                        var clickGroupButtonResult = findTextByLanguages(SHARE_GROUP_TEXT)
                        if(clickGroupButtonResult){
                            taskLog("找到社團按钮，点击社團按钮")
                            sleep(random(3000, 5000))
                            
                            //找到页面所有的checkBox并尝试点击：className("android.widget.CheckBox") ，最多只能点5个
                            // 每次点击后页面会变化，需要重新查找CheckBox，并从下一个索引开始点击
                            var startIndex = 0 // 起始索引，每次循环递增
                            for(var k = 0; k < 5; k++){ //最多点击5个
                                // 每次循环重新查找所有CheckBox
                                var checkBoxList = className("android.widget.CheckBox").find()
                                if(checkBoxList && checkBoxList.length > 0){
                                    // 从startIndex开始查找可见的CheckBox并点击
                                    var foundCheckBox = false
                                    for(var i = startIndex; i < checkBoxList.length; i++){
                                        var checkBox = checkBoxList[i]
                                        if(checkBox && checkBox.visibleToUser()){
                                            // 由于复选框的clickable属性为false，使用坐标点击
                                            taskLog("找到第 " + (k + 1) + " 个CheckBox（索引 " + i + "），准备点击")
                                            click(checkBox.bounds().centerX(), checkBox.bounds().centerY())
                                            sleep(random(1000, 3000))
                                            foundCheckBox = true
                                            startIndex = i + 1 // 下次从下一个索引开始
                                            break // 点击后跳出内层循环，等待页面变化后继续外层循环
                                        }
                                    }
                                    // 如果没找到可见的CheckBox，退出循环
                                    if(!foundCheckBox){
                                        taskLog("未找到可见的CheckBox，停止点击")
                                        break
                                    }
                                } else {
                                    taskLog("未找到CheckBox，停止点击")
                                    break
                                }
                            }


                            //点击底部继续按钮
                            //className("android.widget.Button") desc("繼續") desc("Next")
                            // var findContinueButtonResult = find_btn_desc_base("Next", "繼續")
                            var findContinueButtonResult = findTextByLanguages(SHARE_GROUP_DESC_TEXT)
                            if(findContinueButtonResult){
                                taskLog("找到继续按钮，点击继续按钮")
                                sleep(random(3000, 5000))

                                //点击右上角发布按钮
                                //className("android.widget.Button") desc("POST") clickable("true")
                                var findPostButtonResult = findTextByLanguages(SHARE_GROUP_POST_TEXT)
                                if(findPostButtonResult){
                                    taskLog("找到发布按钮，点击发布按钮")
                                    sleep(random(3000, 5000))
                                }

                            }else{
                                taskLog("未找到继续按钮，跳过继续功能")
                            }





                        



                        }else{
                            taskLog("未找到社團按钮，跳过社團功能")
                            back()
                        }


                        //寻找Group按钮


                    }else{
                        taskLog("未找到分享按钮，跳过分享功能")
                    }
                }else{
                    taskLog("未触发分享概率 (" + shareProbability + "%)")
                }
                sleep(random(3000, 5000))
                swipe_up()
                sleep(random(1000, 3000))
            }

        }



        

    }


        
    toast("所有循环执行完毕，准备结束任务...");
    stopCurrentTask()
} catch (e) {
    handleError(e)
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
    forceStop_APP(FacebookPackageName)
    sleep(3000)
}


//通过Button的Text
function find_btn_Text_base(findText_ZH_TW, findText_EN_US){

        var loopCount  = 0

         while (true) {
             taskLog(findText_ZH_TW + " - 循环寻找执行：" + (++loopCount));
             // 检查计数器是否达到3
             if (loopCount >= 3) {
                 // 打印一条消息并退出循环
                 taskLog("寻找" + findText_ZH_TW + "按钮失败");
                 taskLog("循环已执行3次，即将退出循环。");
                 break;
             }


             // 查找控件
             var button1 = className("android.widget.Button").text(findText_ZH_TW).findOne(1000);
             var button2 = className("android.widget.Button").text(findText_EN_US).findOne(1000);
             if (button1) {
                 taskLog("找到" + findText_ZH_CN);
                 button1.click();
                 break; // 跳出循环
             }else if(button2){
                 taskLog("找到" + findText_ZH_TW);
                 button2.click();
                 break; // 跳出循环
             }

             sleep(1000)

         }
}



//通过Button的Desc
function find_btn_desc_base(findText_ZH_TW, findText_ZH_US){

        var findBtn = false

        var loopCount  = 0

         while (true) {
             taskLog(findText_ZH_TW + " - 循环寻找执行：" + (++loopCount));
             // 检查计数器是否达到3
             if (loopCount >= 3) {
                 // 打印一条消息并退出循环
                 taskLog("寻找" + findText_ZH_TW + "按钮失败");
                 taskLog("循环已执行3次，即将退出循环。");
                 break;
             }


             // 查找控件
             var button1 = className("android.widget.Button").desc(findText_ZH_TW).findOne(1000);
             var button2 = className("android.widget.Button").desc(findText_ZH_US).findOne(1000);
             if (button1) {
                 findBtn = true
                 taskLog("找到" + findText_ZH_TW);

                 if (button1 && button1.clickable()) {
                    button1.click();
                    return true;
                } else if (button1) {
                    // 如果元素存在但不可点击，尝试点击其坐标
                    let bounds = button1.bounds();
                    click(bounds.centerX(), bounds.centerY());
                    return true;
                }
                 break; // 跳出循环
             }else if(button2){
                 findBtn = true
                 taskLog("找到" + findText_ZH_US);
                 if (button2 && button2.clickable()) {
                    button2.click();
                    return true;
                } else if (button2) {
                    // 如果元素存在但不可点击，尝试点击其坐标
                    let bounds = button2.bounds();
                    click(bounds.centerX(), bounds.centerY());
                    return true;
                }

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
                comments.push(line);
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
function get_all_groups_comment_text() {
    taskLog("文案内容 = " + FB_group_comment_text);
    
    // 如果变量未被替换（以 $${T_ 开头），说明配置有问题
    if (FB_group_comment_text.startsWith("$${T_") || FB_group_comment_text.startsWith("${T_")) {
        throw new Error("文案变量未被正确替换，请检查配置：" + FB_group_comment_text);
    }
    
    // 如果为空，直接返回
    if (!FB_group_comment_text || FB_group_comment_text.trim() === "") {
        taskLog("文案内容为空");
        return "";
    }

    // 用于存储用户的数组
    let comments = [];
    const file = new java.io.File(FB_group_comment_text);
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
        comments.push(FB_group_comment_text);
    }    
    return comments

}

//会直接打开FaceBook的内置WebView，所以弃用
function openFacebookLink(){
    var fbUrl = "https://www.facebook.com/reel/689492360538949";
    var fbSchemeUrl = "fb://facewebmodal/f?href=" + encodeURIComponent(fbUrl);

    try {
        var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse(fbSchemeUrl));
        intent.setPackage("com.facebook.katana"); // 强制用Facebook App打开
        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        app.startActivity(intent);
    } catch (e) {
        app.viewFile(fbUrl);
    }
}

// 获取 302 重定向后的真实 URL
function getRedirectUrl(originalUrl) {
    taskLog("开始获取重定向后的真实 URL: " + originalUrl)
    try {
        // 使用 HTTP GET 请求，AutoX 会自动跟随重定向
        var response = http.get(originalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            maxRedirects: 10 // 允许最多 10 次重定向
        });
        
        // 获取最终的重定向 URL
        // response.url 应该包含最终的重定向 URL
        var finalUrl = String(originalUrl); // 确保是 JavaScript 字符串
        
        if(response && response.url) {
            finalUrl = String(response.url); // 转换为 JavaScript 字符串
        } else if(response && response.statusCode >= 300 && response.statusCode < 400) {
            // 如果状态码是 3xx，尝试从响应头获取 Location
            var location = null;
            if(response.headers) {
                location = response.headers['Location'] || response.headers['location'] || response.headers['LOCATION'];
            }
            
            if(location) {
                // 转换为 JavaScript 字符串
                location = String(location);
                
                // 如果是相对路径，需要拼接完整 URL
                if(location.startsWith('/')) {
                    try {
                        var urlObj = new java.net.URL(originalUrl);
                        finalUrl = urlObj.getProtocol() + '://' + urlObj.getHost() + location;
                    } catch (e) {
                        finalUrl = location;
                    }
                } else if(location.startsWith('http://') || location.startsWith('https://')) {
                    finalUrl = location;
                } else {
                    finalUrl = location;
                }
            }
        }
        
        // 确保 finalUrl 是 JavaScript 字符串
        finalUrl = String(finalUrl);
        
        
        taskLog("原始 URL: " + originalUrl)
        taskLog("重定向后的真实 URL: " + finalUrl)
        
        // 如果重定向后的 URL 和原始 URL 不同，返回新的 URL
        if(finalUrl && finalUrl !== originalUrl && finalUrl.trim() !== '') {
            return finalUrl;
        }
        
        taskLog("未检测到重定向，使用原始 URL")
        return originalUrl;
    } catch (e) {
        taskLog("获取重定向 URL 失败: " + e);
        taskLog("错误详情: " + (e.stack || e.toString()));
        taskLog("使用原始 URL: " + originalUrl);
        return originalUrl;
    }
}


// function openFacebookLink_test_02(fbUrl){
//     taskLog("准备打开链接 = " + fbUrl)
//     var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
//     // intent.setData(android.net.Uri.parse("https://www.facebook.com/watch/huacemedia/")); //不行
//     // intent.setData(android.net.Uri.parse("https://www.facebook.com/share/r/1CdK7F3fRp/"));  //Reels -OK
//     // intent.setData(android.net.Uri.parse("https://www.facebook.com/groups/850798899131453/"));  //Group -OK
//     // intent.setData(android.net.Uri.parse("https://www.facebook.com/share/v/16cLEnDJoT/"));   //Live - OK
//     // intent.setData(android.net.Uri.parse("https://www.facebook.com/profile.php?id=100079449592509"));  //Friend - OK
//     // intent.setData(android.net.Uri.parse("https://www.facebook.com/share/v/14Dj3UQ6q2b/"));  //watch - OK（https://www.facebook.com/watch/?v=689492360538949&rdid=PU3MOv69wqSgVeh5）
//     intent.setData(android.net.Uri.parse(fbUrl));

//     intent.setPackage("com.facebook.katana");
//     intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
//     app.startActivity(intent);
// }



// 通过语言对象查找文本
function findTextByLanguages(languageObject) {
    for (let lang in languageObject) {
        let targetText = languageObject[lang];
        
        // 先尝试精确匹配
        let element = text(targetText).findOne(500);
        
        // 如果精确匹配不到，尝试忽略大小写匹配
        if (!element) {
            // 使用正则表达式进行大小写不敏感匹配
            let regexPattern = "(?i)^" + targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$";
            element = textMatches(regexPattern).findOne(500);
            if (element) {
                taskLog("通过忽略大小写找到文本：" + targetText + " | 实际文本：" + element.text());
            }
        } else {
            taskLog("找到文本：" + targetText);
        }
        
        if (element) {
            if (element.clickable()) {
                element.click();
                return true;
            } else {
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

function openFacebookLink_test(fbUrl){
    taskLog("准备打开链接 = " + fbUrl)
    
    // 通用的打开方法
    function tryOpenUrl(uri, methodName) {
        taskLog("尝试方法: " + methodName)
        try {
            var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
            intent.setData(android.net.Uri.parse(uri));
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.setPackage("com.facebook.katana");
            
            app.startActivity(intent);
            sleep(6000) // 增加等待时间到 6 秒，给页面更多加载时间
            
            // 简单验证：检查页面是否加载（通过检查是否存在常见的 Facebook 页面元素）
            // 不关心页面类型，只关心能否正常打开
            var pageLoaded = className("android.view.View").exists() || 
                           className("android.widget.Button").exists() ||
                           className("android.widget.TextView").exists();
            
            if(pageLoaded) {
                taskLog(methodName + "打开成功，页面已加载");
                return true;
            } else {
                taskLog(methodName + "打开但页面可能未正确加载");
                // 即使检测不到元素，也认为可能加载成功（因为检测可能不准确）
                return true;
            }
        } catch (e) {
            taskLog(methodName + "失败: " + e);
        }
        return false;
    }
    
    // 用户名格式链接（尝试多种方式）
    if(fbUrl.includes("facebook.com/") && 
       !fbUrl.includes("profile.php") && 
       !fbUrl.includes("share/") && 
       !fbUrl.includes("groups/") &&
       !fbUrl.includes("watch/")) {
        
        var username = fbUrl.split("facebook.com/")[1].split("?")[0].replace(/\//g, "");
        taskLog("检测到用户名格式链接，用户名: " + username)
        
        // 尝试多种方式打开，按优先级排序
        var methods = [
            // 方法1: WebModal（Facebook 推荐的方式，最可靠）
            { uri: "fb://facewebmodal/f?href=" + encodeURIComponent(fbUrl), name: "WebModal" },
            // 方法2: 深度链接（可能对某些用户名无效）
            { uri: "fb://profile/" + username, name: "深度链接" },
            // 方法3: 标准 Intent（最后尝试）
            { uri: fbUrl, name: "标准Intent" }
        ];
        
        for(var i = 0; i < methods.length; i++) {
            taskLog("尝试方法 " + (i + 1) + "/" + methods.length + ": " + methods[i].name)
            if(tryOpenUrl(methods[i].uri, methods[i].name)) {
                // 等待更长时间让页面完全加载（特别是头像元素）
                taskLog("等待页面完全加载...")
                sleep(8000) // 增加到 8 秒
                
                // 多次验证，给页面更多时间加载
                var pageLoaded = false;
                var maxRetries = 3; // 最多重试 3 次
                for(var retry = 0; retry < maxRetries; retry++) {
                    pageLoaded = checkUserPageLoaded();
                    if(pageLoaded) {
                        taskLog("成功打开用户页面（第 " + (retry + 1) + " 次验证成功）");
                        return true;
                    } else {
                        if(retry < maxRetries - 1) {
                            taskLog("验证失败，等待 " + (3 + retry * 2) + " 秒后重试验证...");
                            sleep(3000 + retry * 2000); // 每次重试等待时间递增
                        }
                    }
                }
                
                // 如果第一个方法（WebModal）验证失败，但页面可能已经打开，不要立即尝试下一个方法
                // 因为再次调用 startActivity 会覆盖当前页面，导致返回主界面
                if(i === 0) {
                    taskLog("WebModal 方法已打开页面，但验证失败。为避免覆盖当前页面，不再尝试其他方法");
                    taskLog("页面可能正在加载中，继续执行后续操作");
                    return true; // 即使验证失败也返回 true，避免覆盖当前页面
                } else {
                    taskLog("页面已打开但验证失败，继续尝试下一个方法");
                    // 如果验证失败，尝试下一个方法
                    continue;
                }
            }
            sleep(2000) // 在尝试下一个方法前等待
        }
        
        taskLog("所有方法都尝试过了，但未能成功打开用户页面")
        return false;
    }
    
    // profile.php 格式，直接使用标准 Intent
    if(fbUrl.includes("profile.php")) {
        taskLog("检测到 profile.php 格式链接")
        return tryOpenUrl(fbUrl, "标准Intent");
    }
    
    // share/ 格式链接（Post、Reels、Live、Watch等）
    if(fbUrl.includes("share/")) {
        taskLog("检测到 share/ 格式链接")
        
        // 尝试多种方式打开
        var methods = [
            // 方法1: 使用 WebModal
            { uri: "fb://facewebmodal/f?href=" + encodeURIComponent(fbUrl), name: "WebModal" },
            // 方法2: 标准 Intent
            { uri: fbUrl, name: "标准Intent" }
        ];
        
        for(var i = 0; i < methods.length; i++) {
            taskLog("尝试方法 " + (i + 1) + "/" + methods.length + ": " + methods[i].name)
            if(tryOpenUrl(methods[i].uri, methods[i].name)) {
                return true;
            }
            sleep(2000) // 在尝试下一个方法前等待
        }
        
        taskLog("所有方法都尝试过了，但未能成功打开页面")
        return false;
    }
    
    // groups/ 格式链接
    if(fbUrl.includes("groups/")) {
        taskLog("检测到 groups/ 格式链接")
        return tryOpenUrl(fbUrl, "标准Intent");
    }
    
    // watch/ 格式链接
    if(fbUrl.includes("watch/")) {
        taskLog("检测到 watch/ 格式链接")
        return tryOpenUrl(fbUrl, "标准Intent");
    }
    
    // 所有方法都失败
    taskLog("所有方法都失败，跳过链接 = " + fbUrl);
    return false;
}


// 验证用户页面是否正确加载：通过检查头像来判断
//className("android.widget.ImageView") desc("Profile picture") clickable("false")
function checkUserPageLoaded() {
    taskLog("验证页面是否正确加载（检查头像）...")
    
    // 等待页面加载，给头像元素更多时间出现
    sleep(3000)
    
    // 通过检查头像来判断页面是否加载成功
    // 尝试多种可能的描述文本（不同语言版本）
    var profilePicture = className("android.widget.ImageView")
                        .desc("Profile picture")
                        .clickable(false)
                        .exists() ||
                        className("android.widget.ImageView")
                        .descMatches(".*[Pp]rofile.*[Pp]icture.*")
                        .clickable(false)
                        .exists() ||
                        className("android.widget.ImageView")
                        .descMatches(".*头像.*")
                        .clickable(false)
                        .exists()
    
    if(profilePicture) {
        taskLog("页面验证成功：找到用户头像（Profile picture）")
        return true
    }
    
    taskLog("页面验证失败：未找到用户头像（Profile picture）")
    return false
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



//通过View的Desc
function find_view_desc_base(findText_ZH_TW, findText_EN_US){

    var findBtn = false

    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_TW + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("寻找" + findText_ZH_TW + "按钮失败");
             taskLog("循环已执行3次，即将退出循环。");
             break;
         }


         // 查找控件
         var button1 = className("android.view.View").desc(findText_ZH_TW).findOne(1000);
         var button2 = className("android.view.View").desc(findText_EN_US).findOne(1000);
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
         }

         sleep(1000)

     }

     return findBtn

}






//强制停止
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



//通过Button的Desc
function find_viewGroup_desc_base(findText_ZH_TW, findText_EN_US){

    var findBtn = false

    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_TW + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("寻找" + findText_ZH_TW + "按钮失败");
             taskLog("循环已执行3次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }


         // 查找控件
         var button1 = className("android.view.ViewGroup").desc(findText_ZH_TW).findOne(1000);
         var button2 = className("android.view.ViewGroup").desc(findText_EN_US).findOne(1000);
         if (button1) {
             findBtn = true
             taskLog("找到" + findText_ZH_TW);
             click(button1.bounds().centerX() , button1.bounds().centerY())
             break; // 跳出循环
         }else if(button2){
             findBtn = true
             taskLog("找到" + findText_EN_US);
             click(button2.bounds().centerX() , button2.bounds().centerY())
             break; // 跳出循环
         }

         sleep(1000)

     }

     return findBtn

}


function find_share_button(shouldClick){
     // shouldClick: true 表示找到按钮后点击，false 表示找到按钮但不点击
    // 默认值为 true，保持向后兼容
    if(shouldClick === undefined) {
        shouldClick = true;
    }
    
    taskLog("开始寻找分享按钮... (是否点击: " + shouldClick + ")")
    
    // 统一的匹配函数：检查描述文本是否匹配 LIKE_TEXT 中的任何值
    function isLikeButtonMatch(descText) {
        if(!descText || descText.trim() === "") {
            return false
        }
        
        // 使用 LIKE_TEXT 中的所有值进行匹配
        // 支持完全匹配、开头匹配、包含匹配（用于匹配 "讚」按鈕" 中包含 "讚" 的情况）
        return Object.values(SHARE_TEXT).some(function(text) {
            return descText === text || 
                   descText.startsWith(text) || 
                   descText.indexOf(text) !== -1
        })
    }
    
    // 等待页面加载
    sleep(random(1000, 3000))
    
    // 先尝试查找 Button 类型的点赞按钮
    var buttonList = className("android.widget.Button").find()
    if(buttonList && buttonList.length > 0) {
        for(var i = 0; i < buttonList.length; i++) {
            var btn = buttonList[i]
            if(btn && btn.visibleToUser()) {
                var descText = btn.desc() || ""
                taskLog("检查按钮描述: " + descText)
                
                if(isLikeButtonMatch(descText)) {
                    taskLog("找到分享按钮: " + descText)
                    if(shouldClick) {
                        click(btn.bounds().centerX(), btn.bounds().centerY())
                        sleep(random(2000, 3000))
                        taskLog("已点击分享按钮")
                    } else {
                        taskLog("找到分享按钮但未点击（shouldClick=false）")
                    }
                    return true // 找到按钮后返回 true
                }
            }
        }
    }
    
    // 如果 Button 中没找到，尝试查找 ViewGroup 类型的点赞按钮
    var viewGroupList = className("android.view.ViewGroup").find()
    if(viewGroupList && viewGroupList.length > 0) {
        for(var i = 0; i < viewGroupList.length; i++) {
            var viewGroup = viewGroupList[i]
            if(viewGroup && viewGroup.visibleToUser()) {
                var descText = viewGroup.desc() || ""
                
                if(isLikeButtonMatch(descText)) {
                    taskLog("找到分享ViewGroup: " + descText)
                    if(shouldClick) {
                        click(viewGroup.bounds().centerX(), viewGroup.bounds().centerY())
                        sleep(random(2000, 3000))
                        taskLog("已点击分享按钮")
                    } else {
                        taskLog("找到分享按钮但未点击（shouldClick=false）")
                    }
                    return true // 找到按钮后返回 true
                }
            }
        }
    }
    
    taskLog("未找到分享按钮，退出分享功能")
    return false // 未找到按钮返回 false



    
}



//找到当前页面是否有相同的点赞内容，如果有，则不进行点赞，返回true，否则返回false
function find_same_like_text(likeText){
    //检查是不是已经点赞过
    //className("android.view.ViewGroup") desc("你和其他1人都傳達了心情")
    //className("android.view.ViewGroup") desc("吴烽傳達了心情")
    //className("android.view.ViewGroup") desc("You and 18 others reacted")
    //className("android.view.ViewGroup") desc("You and others")
    //className("android.view.ViewGroup") desc("郭芷涵 reacted")

    //检查ViewGroup的desc，只要包含了以下字段即可，不需要完全一致 :LIKE_TEXT_LIST
    var viewGroupList = className("android.view.ViewGroup").find()
    if(viewGroupList && viewGroupList.length > 0) {
        for(var i = 0; i < viewGroupList.length; i++) {
            var viewGroup = viewGroupList[i]
            
            // 只处理可见的 ViewGroup，跳过不可见的元素
            try {
                if(!viewGroup.visibleToUser()) {
                    continue; // 跳过不可见的元素
                }
            } catch(e) {
                // 如果 visibleToUser() 方法不存在或出错，尝试检查 bounds
                try {
                    var bounds = viewGroup.bounds();
                    if(!bounds || bounds.width() <= 0 || bounds.height() <= 0) {
                        continue; // 跳过无效或不可见的元素
                    }
                } catch(e2) {
                    continue; // 如果检查失败，跳过该元素
                }
            }
            
            var descText = viewGroup.desc() || ""
            
            // 检查 descText 是否包含 LIKE_TEXT_LIST 中的任何一个值
            if(descText && descText.trim() !== "") {
                for(var key in LIKE_TEXT_LIST) {
                    if(LIKE_TEXT_LIST.hasOwnProperty(key)) {
                        var likeText = LIKE_TEXT_LIST[key];
                        if(likeText && descText.includes(likeText)) {
                            taskLog("找到点赞内容: " + descText , "直接退出点赞功能")
                            return true
                        }
                    }
                }
            }
        }
    }   
    taskLog("未找到点赞内容")
    return false


}


function find_like_button(shouldClick){
    // shouldClick: true 表示找到按钮后点击，false 表示找到按钮但不点击
    // 默认值为 true，保持向后兼容
    if(shouldClick === undefined) {
        shouldClick = true;
    }


    if(find_same_like_text(LIKE_TEXT_LIST)){
        taskLog("找到相同的点赞内容，直接退出点赞功能")
        return true
    }

    
    
    taskLog("开始寻找点赞按钮... (是否点击: " + shouldClick + ")")
    
    // 统一的匹配函数：检查描述文本是否匹配 LIKE_TEXT 中的任何值
    function isLikeButtonMatch(descText) {
        if(!descText || descText.trim() === "") {
            return false
        }
        
        // 使用 LIKE_TEXT 中的所有值进行匹配
        // 支持完全匹配、开头匹配、包含匹配（用于匹配 "讚」按鈕" 中包含 "讚" 的情况）
        return Object.values(LIKE_TEXT).some(function(text) {
            return descText === text || 
                   descText.startsWith(text) || 
                   descText.indexOf(text) !== -1
        })
    }
    
    // 等待页面加载
    sleep(random(1000, 3000))
    
    // 先尝试查找 Button 类型的点赞按钮
    var buttonList = className("android.widget.Button").find()
    if(buttonList && buttonList.length > 0) {
        for(var i = 0; i < buttonList.length; i++) {
            var btn = buttonList[i]
            if(btn && btn.visibleToUser()) {
                var descText = btn.desc() || ""
                taskLog("检查按钮描述: " + descText)
                
                if(isLikeButtonMatch(descText)) {
                    taskLog("找到点赞按钮: " + descText)
                    if(shouldClick) {
                        click(btn.bounds().centerX(), btn.bounds().centerY())
                        sleep(random(2000, 3000))
                        taskLog("已点击点赞按钮")
                    } else {
                        taskLog("找到点赞按钮但未点击（shouldClick=false）")
                    }
                    return true // 找到按钮后返回 true
                }
            }
        }
    }
    
    // 如果 Button 中没找到，尝试查找 ViewGroup 类型的点赞按钮
    var viewGroupList = className("android.view.ViewGroup").find()
    if(viewGroupList && viewGroupList.length > 0) {
        for(var i = 0; i < viewGroupList.length; i++) {
            var viewGroup = viewGroupList[i]
            if(viewGroup && viewGroup.visibleToUser()) {
                var descText = viewGroup.desc() || ""
                
                if(isLikeButtonMatch(descText)) {
                    taskLog("找到点赞ViewGroup: " + descText)
                    if(shouldClick) {
                        click(viewGroup.bounds().centerX(), viewGroup.bounds().centerY())
                        sleep(random(2000, 3000))
                        taskLog("已点击点赞按钮")
                    } else {
                        taskLog("找到点赞按钮但未点击（shouldClick=false）")
                    }
                    return true // 找到按钮后返回 true
                }
            }
        }
    }
    
    taskLog("未找到点赞按钮，退出点赞功能")
    return false // 未找到按钮返回 false
}


//找到当前页面是否有相同的评论内容，如果有，则不进行评论，返回true，否则返回false
function find_same_post_text(postText){
    //className("android.view.ViewGroup") desc("容易髒污變黃。")
    //找到所有可见的ViewGroup，分析出desc的文本内容，如果存在相同的文本内容，则返回true，否则返回false
    //postText 内容就是需要评论的内容 使用get_all_groups_comment_text()函数获取，返回的是数组
    var viewGroupList = className("android.view.ViewGroup").find()
    if(viewGroupList && viewGroupList.length > 0) {
        // 限制最多检查的元素数量，避免性能问题
        var maxCheckCount = Math.min(viewGroupList.length, 50); // 最多检查50个元素
        var checkedCount = 0;
        
        for(var i = 0; i < viewGroupList.length && checkedCount < maxCheckCount; i++) {
            var viewGroup = viewGroupList[i]
            
            // 只处理可见的 ViewGroup，跳过不可见的元素
            try {
                if(!viewGroup.visibleToUser()) {
                    continue; // 跳过不可见的元素
                }
            } catch(e) {
                // 如果 visibleToUser() 方法不存在或出错，尝试检查 bounds
                try {
                    var bounds = viewGroup.bounds();
                    if(!bounds || bounds.width() <= 0 || bounds.height() <= 0) {
                        continue; // 跳过无效或不可见的元素
                    }
                } catch(e2) {
                    continue; // 如果检查失败，跳过该元素
                }
            }
            
            checkedCount++; // 增加已检查的可见元素计数
            
            var descText = viewGroup.desc() || ""
            
            // postText 是数组，需要检查数组中是否有元素等于或包含 descText
            if(Array.isArray(postText)) {
                // 跳过空字符串或过短的 descText，避免误匹配
                if(!descText || descText.trim() === "" || descText.trim().length < 2) {
                    continue; // 跳过这个 viewGroup，继续检查下一个
                }
                
                // 检查数组中是否有任何元素等于 descText（精确匹配）
                if(postText.includes(descText)) {
                    taskLog("找到相同的评论内容: " + descText)
                    return true
                }
                
                // 或者检查数组中是否有任何元素等于 descText（精确匹配）
                // 只有当 descText 长度足够时才进行精确匹配，避免误匹配
                if(descText.trim().length >= 1) {
                    for(var j = 0; j < postText.length; j++) {
                        if(postText[j] && typeof postText[j] === 'string' && postText[j].trim() === descText.trim()) {
                            taskLog("找到相同的评论内容（精确匹配）: " + descText)
                            return true
                        }
                    }
                }
            } else if(postText && typeof postText === 'string') {
                // 如果 postText 是字符串，直接比较
                // 跳过空字符串或过短的 descText，避免误匹配
                if(!descText || descText.trim() === "" || descText.trim().length < 3) {
                    continue; // 跳过这个 viewGroup，继续检查下一个
                }
                if(postText.includes(descText)) {
                    taskLog("找到相同的评论内容: " + descText)
                    return true
                }
            }
        }
    }
    taskLog("未找到相同的评论内容")
    return false


}




//找到在Group群组发表po文的按钮
function find_post_button(){

    var all_group_comment_text = get_all_groups_comment_text()
    toast("所有评论数量 = " + all_group_comment_text.length)
    sleep(5000) 

    //寻找当前页面是否有重复的评论内容
    var findSamePostText = find_same_post_text(all_group_comment_text)
    if(findSamePostText){
        taskLog("找到相同的评论内容，直接退出评论，直接进行下一个Link的任务")
        sleep(random(3000, 5000))
        back()
        sleep(random(3000, 5000))
        back()
        return true
    }



    var all_AutoCompleteTextView = className("android.widget.AutoCompleteTextView").findOne(15000) // 添加15秒超时
    if(all_AutoCompleteTextView){
        //已经点击过了，准备输入文字和图片
        taskLog("准备输入分享内容....");
        //text("Create a public post…")
        className("android.widget.AutoCompleteTextView").findOne().click()
        sleep(5000)
        className("android.widget.AutoCompleteTextView").findOne().setText("")
        sleep(5000)


        
        
        var randIdx = random(0, all_group_comment_text.length - 1)
        var messageText = all_group_comment_text[randIdx];
        toast("输入内容 = " + messageText);

        className("android.widget.AutoCompleteTextView").findOne().setText(messageText)
        sleep(5000)

        //检查是否需要发图片
        // post_Image()

    
        // className("android.widget.Button").desc("Send").findOne().click()
        // find_btn_desc_base("Send", "傳送")
        taskLog("开始点击发送按钮....")
        click_send_button()
    
    
        // //删除临时图片库 :A_NEST_FaceBook_MEDIA
        // sleep(10000)
        // delete_temp_image("/storage/emulated/0/Download/" + A_NEST_FaceBook_MEDIA)

        sleep(random(8000, 10000))

    }else{
        toastLog("没有在Link链接中发现评论的AutoCompleteTextView，直接进行下一个Link的任务");
    }
    
}


function click_send_button(){

    var isSuccess = false
    //发送
    sleep(random(2000, 3000))
    // var clickSendTextBtn = findTextByLanguages(SEND_TEXT)
    var clickSendTextBtn = find_btn_desc_base("Send", "傳送")
    sleep(random(2000, 3000))

    if(!clickSendTextBtn){
        taskLog("未找到发送按钮，直接点击最后一个按钮....")
        //直接点击最后一个按钮
        // 注意：数组索引从 0 开始，所以最后一个元素的索引是 length - 1
        // 例如：如果有 5 个按钮，索引是 0,1,2,3,4，最后一个按钮的索引是 4 = 5-1
        var nextBtnList = className("android.widget.Button").find();
        if(nextBtnList && nextBtnList.length > 0){
            var lastIndex = nextBtnList.length - 1; // 最后一个按钮的索引
            taskLog("找到 " + nextBtnList.length + " 个按钮，点击最后一个（索引 " + lastIndex + "）")
            nextBtnList[lastIndex].click(); // 使用 JavaScript 数组访问方式
            sleep(random(3000, 5000))
            //此时已经到达具体的评论页面，需要回退到个人主页
            back() //1.收回键盘
            back() //2.回退到个人主页

            sleep(random(3000, 5000))
        }else{
            taskLog("未找到任何按钮")
            isSuccess = false
        }

    }else{
        taskLog("找到发送按钮，已经点击发送按钮....")
        isSuccess = false

        //此时已经到达具体的评论页面，需要回退到个人主页
        back() //1.收回键盘
        back() //2.回退到个人主页
        
        sleep(random(3000, 5000))
    }

    return isSuccess

}

function post_Image(){
    taskLog("开始检查图片条件判断...")    
    
    // 检查是否是有效的图片路径（不是模板字符串且文件存在）
    if(FB_input_IMAGE && 
        FB_input_IMAGE.trim() !== "" && 
        FB_input_IMAGE.trim().toLowerCase() !== "off" && 
        !FB_input_IMAGE.includes("$${")){
            taskLog("检测到有效的图片路径，准备处理图片...")

            taskLog("FB_input_IMAGE = " + FB_input_IMAGE)

            refreshMedia("/storage/emulated/0/Download/")
            // var imageTempPath = transferHeadImageToNest(FB_input_IMAGE)
            // sleep(10000)

            //className("android.widget.Button").desc("Show photos and videos").findOne().click()
            find_btn_desc_base("Show photos and videos", "顯示相片和影片")
            sleep(3000)

            //点击权限
            //className("android.widget.Button").desc("Allow access").findOne().click()
            find_btn_desc_base("Allow access", "允許存取")
            sleep(3000)

            //再次点击权限
            // id("(name removed)").className("android.widget.Button").text("ALLOW").findOne().click()
            find_btn_Text_base("ALLOW", "允許")
            sleep(3000)

            //系统弹窗
            find_btn_Text_base("允许", "Allow")
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
                
                toast("选择图片描述 = " + buttonDesc);
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
                toast("已经选中图库中的第一张图片");
                //退出图库选中，因为要点击send按钮，否则可能会点中图库的最后一张图片
                back()
                sleep(random(3000, 5000))
            } else {
                taskLog("未找到任何符合条件的图片");
                toast("未找到任何符合条件的图片");
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

//转移头像图片到Nest临时文件夹
function transferHeadImageToNest(fileName){
    let imagePath = null;
    if (files.exists(fileName)) {
        imagePath = fileName;
    }
    
    if (!imagePath) {
        console.error("未找到指定图片：" + fileName);
        toast("未找到指定图片：" + fileName);
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
    } catch(e) {
        console.error("复制失败: " + e);
    }

    sleep(3000);


    refreshMedia(newFolder)
    sleep(10000);


    // 创建文件对象并获取URI
    let file = new java.io.File(targetPath);
    let uri = app.getUriForFile(targetPath);
    
    // 创建打开图片的 Intent
    let intent = new Intent(Intent.ACTION_VIEW);
    intent.setDataAndType(uri, "image/*");
    // 添加必要的权限标志
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

    // 指定使用系统默认的图库应用
    intent.setPackage("com.android.gallery3d");  // 系统默认图库的包名
    // 如果上面的包名不生效，可以尝试：
    // intent.setPackage("com.google.android.apps.photos");  // Google Photos
    // intent.setPackage("com.sec.android.gallery3d");  // 三星图库
    // intent.setPackage("com.miui.gallery");  // 小米图库

    // 启动图片查看Activity
    // context.startActivity(intent);
    // 等待界面加载
    sleep(3000);

    return targetPath


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



//开始评论内容
function post_content(){
    //设置开始时间
    const startTime = new Date().getTime();

    //检查总时间的函数
    function checkTimeout() {
        if(new Date().getTime() - startTime > 60 * 1000) {  // 60秒 = 60 * 1000毫秒
            toast("评论操作总时间超过60秒，自动退出");
            sleep(1000)
            back()
            sleep(3000)
            return true;
        }
        toast("评论操作总时间没有超过60秒，继续进行");
        return false;
    }


    
    taskLog("准备输入评论内容....");
    toast("准备输入评论内容....");

    //尝试点击输入框
    try {
        let inputBox = className("android.widget.AutoCompleteTextView").findOne(10000); // 5秒超时
        if(inputBox) {
            inputBox.click();
            toast("点击输入框成功");
        } else {
            sleep(3000)
            toast("未找到输入框");
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

    //尝试输入文本
    try {
        var randIdx = random(0, all_group_comment_text.length - 1)
        var messageText = all_group_comment_text[randIdx];
        toast("输入内容 = " + messageText);

        //检查是不是已经到了FB提示页面
        check_comment_result()
        sleep(3000)

        let textBox = className("android.widget.AutoCompleteTextView").findOne(10000); // 5秒超时
        if(textBox) {
            textBox.setText(messageText);
        } else {
            toast("未找到输入框");
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

    //尝试点击发送按钮
    try {
        let sendBtn = className("android.widget.Button").desc("Send").findOne(10000); // 5秒超时
        if(sendBtn) {
            sendBtn.click();
        } else {
            toast("未找到发送按钮");
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

    check_comment_result()
    sleep(3000)

    back()
    sleep(3000)

    back()
}


    

//在评论之后，要检查一下，有没有出现一个新页面：desc("We removed your comment")
function check_comment_result(){
    var check_comment_result = find_view_desc_base("We removed your comment","我們移除了您的評論")
    toast("评论检查 = " + check_comment_result);
    if(check_comment_result){
        toast("评论失败");
        find_btn_desc_base("Close","關閉")
        sleep(3000)
    }else{
        toast("评论成功");
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
