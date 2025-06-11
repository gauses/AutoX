// 引入 java 库
importClass(java.lang.System);
importClass(java.util.Arrays);
importClass(javax.crypto.Mac);
importClass(javax.crypto.spec.SecretKeySpec);
// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);



//打印日志
function taskLog(_log){
    toast(_log)
    console.log(getSystemDate("df") +":" +_log)

    //通过日志判断任务有没有结束：

}
function getSystemDate(a) {
    var b = new SimpleDateFormat("HH:mm:ss"), c = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    return "tf" == a ? b.format(new java.util.Date()) :"df" == a ? c.format(new java.util.Date()) :void 0;
}



// Base32 解码
function base32Decode(base32) {
    var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    var buffer = 0, bitsLeft = 0, output = [];

    base32 = base32.replace(/=+$/, '').toUpperCase();

    for (var i = 0; i < base32.length; i++) {
        var val = alphabet.indexOf(base32.charAt(i));
        if (val === -1) continue;
        buffer = (buffer << 5) | val;
        bitsLeft += 5;
        if (bitsLeft >= 8) {
            output.push((buffer >> (bitsLeft - 8)) & 0xff);
            bitsLeft -= 8;
        }
    }
    // 返回 JS 数组
    return output;
}

// 生成 TOTP 密码
function generateTOTP(base32Key) {
    var keyArr = base32Decode(base32Key);
    var key = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, keyArr.length);
    for (var i = 0; i < keyArr.length; i++) {
        key[i] = keyArr[i] > 127 ? keyArr[i] - 256 : keyArr[i];
    }

    var epoch = Math.floor(java.lang.System.currentTimeMillis() / 1000);
    var time = Math.floor(epoch / 30);

    var timeBytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 8);
    for (var i = 7; i >= 0; i--) {
        var v = time & 0xff;
        timeBytes[i] = v > 127 ? v - 256 : v;
        time = time >> 8;
    }

    var mac = javax.crypto.Mac.getInstance("HmacSHA1");
    var keySpec = new javax.crypto.spec.SecretKeySpec(key, "HmacSHA1");
    mac.init(keySpec);
    var hash = mac.doFinal(timeBytes);

    var offset = hash[hash.length - 1] & 0xf;
    var binary = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);

    var otp = binary % 1000000;
    return ("000000" + otp).slice(-6);
}

// // 示例用法
// var key = "32xy nmjl vppw l65p ksto 7zus r5i2 ff2g";
// console.log("当前 OTP 是: " + generateTOTP(key));
// sleep(3000);


//-------------------------------------------------------------
//-------------------------------------------------------------



//******************************************************************
//***********************Google账号登录*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的关注用户ID列表
const GOOGLE_ACCOUNT_PASSWORD_2FA = '$${Google账号密码2FA}';

var GOOGLE_PACKAGE_NAME =  'com.android.vending';

//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功



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
        console.error("Google账号登录：根據提供的Google账号密码，登录Google账号---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        console.log("-----------------脚本功能执行结束：---------------");
        console.error("Google账号登录：根據提供的Google账号密码，登录Google账号---------------");
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


function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(GOOGLE_PACKAGE_NAME)
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
taskLog("准备启动Google Play..")

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

if (isAppInstalled(GOOGLE_PACKAGE_NAME)) {
    targetPackageName = GOOGLE_PACKAGE_NAME;
    targetClassName = "com.google.android.finsky.unauthenticated.activity.UnauthenticatedMainActivity";
    taskLog("检测到已安装Google Play，准备启动...");
} else {
    toast("未检测到Google Play已安装，请先安装Google Play！");
    taskLog("未检测到Google Play已安装，脚本终止。");
    exit();
}




forceStop_APP(GOOGLE_PACKAGE_NAME)
sleep(3000)

app.launchPackage(GOOGLE_PACKAGE_NAME);
sleep(random(3000, 5000))


//强制停止
function forceStop_APP(packageName){
    taskLog("准备强杀:" + packageName + "...")
    sleep(3000);
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


//在打开Google play的时候，会弹出Checking info...，如果存在，则等待30秒，直到消失
//每隔3秒检查一次，直到消失，一共检查10次，如果10次后，Checking info...还存在，则认为Google play没有打开成功，则退出脚本
//Checking info...
//text("正在檢查資訊…")
function check_Google_play_checking_info_exist() {
    taskLog("check_Google_play_checking_info_exist start...");
    var maxTries = 60;
    var interval = 2000; // 2秒
    for (var i = 0; i < maxTries; i++) {
        taskLog("正在检查Google Play加载状态：第" + (i+1) + "/" + maxTries + "次");
        var checkingInfo = className("android.widget.TextView").id("com.google.android.gms:id/suc_layout_title").findOne(2000);
        if (checkingInfo != null) {
            var textStr = checkingInfo.text();
            if (textStr.includes("Checking info") || textStr.includes("正在檢查資訊")) {
                taskLog("检测到'Checking info...'存在");
                sleep(interval);
            } else {
                // 已经不在"Checking info..."页面，说明加载完成
                return true;
            }
        } else {
            // 没有找到该控件，说明"Checking info..."页面已经消失
            return true;
        }
    }
    taskLog("Google play未能成功打开，检测到'Checking info...'一直存在，脚本退出");
    return false;
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




try {


    //最先要解析一下GOOGLE_ACCOUNT_PASSWORD_2FA，三个信息都是以|来分割
    var GOOGLE_ACCOUNT_PASSWORD_2FA_ARRAY = GOOGLE_ACCOUNT_PASSWORD_2FA.split("|");
    var GOOGLE_ACCOUNT_EMAIL = GOOGLE_ACCOUNT_PASSWORD_2FA_ARRAY[0];
    var GOOGLE_ACCOUNT_PASSWORD = GOOGLE_ACCOUNT_PASSWORD_2FA_ARRAY[1];
    var GOOGLE_ACCOUNT_TOTP_KEY = GOOGLE_ACCOUNT_PASSWORD_2FA_ARRAY[2];

    taskLog(GOOGLE_ACCOUNT_EMAIL + "/" + GOOGLE_ACCOUNT_PASSWORD );
    
    var GOOGLE_ACCOUNT_2FA_KEY = generateTOTP(GOOGLE_ACCOUNT_TOTP_KEY);
    taskLog("当前 OTP 是: " + GOOGLE_ACCOUNT_2FA_KEY);



    //开始执行主要逻辑
    //1.点击Google play的首页登录按钮
    //className("android.widget.Button") fullId("com.android.vending:id/0_resource_name_obfuscated") clickable("true")

    var loginBtn = className("android.widget.Button").id("com.android.vending:id/0_resource_name_obfuscated").findOne();
    if(loginBtn){
        loginBtn.click();

        
        //检查页面是否存在：Checking info...，如果存在，则等待30秒，直到消失
        if(!check_Google_play_checking_info_exist()){
            taskLog("Google play未能成功打开，检测到'Checking info...'一直存在，脚本退出");
            exit();
        }
        // return true 只会让上面 if 判断为 false，继续往下执行
        taskLog("检测到'Checking info...'已经不存在，开始等待10秒");
        sleep(10000)



        //2.输入电子邮件
        //className("android.widget.EditText") fullId("identifierId")
        var allEditText = className("android.widget.EditText").find();
        if(allEditText && allEditText.size() > 0){
            for(var i = 0; i < allEditText.size(); i++){
                var editText = allEditText.get(i);
                if(editText){
                    editText.setText(GOOGLE_ACCOUNT_EMAIL);
                    sleep(random(3000, 5000))



                    //3.点击下一步
                    var nextBtnList = className("android.widget.Button").find();
                    if(nextBtnList && nextBtnList.size() > 0){
                        nextBtnList.get(nextBtnList.size() - 1).click(); //直接点击最后一个按钮
                        sleep(random(13000, 15000))


                        //4.输入密码
                        var passwordEditText = className("android.widget.EditText").find();
                        if(passwordEditText && passwordEditText.size() > 0){
                            passwordEditText.get(passwordEditText.size() - 1).setText(GOOGLE_ACCOUNT_PASSWORD);
                            sleep(random(3000, 5000))


                            //5.点击下一步
                            var nextBtnList = className("android.widget.Button").find();
                            if(nextBtnList && nextBtnList.size() > 0){
                                nextBtnList.get(nextBtnList.size() - 1).click(); //直接点击最后一个按钮
                                sleep(random(13000, 15000))
                            }



                            //6.选中：className("android.widget.TextView") text("从 Google 身份验证器应用获取验证码")
                            var totpTextView = className("android.widget.TextView").find();
                            if(totpTextView && totpTextView.size() > 0){
                                for(var i = 0; i < totpTextView.size(); i++){
                                    var totpText = totpTextView.get(i);
                                    //text("Get a verification code from the Google Authenticator app")
                                    //text("從 Google Authenticator 應用程式取得驗證碼")
                                    if (totpText.text().includes("Google Authenticator")) {
                                        totpText.click();
                                        break;  
                                        sleep(random(3000, 5000))
                                    }
                                }

                                //等待10秒
                                sleep(random(13000, 15000))



                                //7.输入TOTP
                                var totpEditText = className("android.widget.EditText").find();
                                if(totpEditText && totpEditText.size() > 0){
                                    totpEditText.get(totpEditText.size() - 1).setText(generateTOTP(GOOGLE_ACCOUNT_TOTP_KEY));
                                    sleep(random(3000, 5000))
                                } 
                                var nextBtnList = className("android.widget.Button").find();
                                if(nextBtnList && nextBtnList.size() > 0){
                                    nextBtnList.get(nextBtnList.size() - 1).click(); //直接点击最后一个按钮
                                    sleep(random(13000, 15000))
                                }

    



                                //在输入2FA之后吗，如果是中文繁体，那么需要往下滑动到最底部，然后点击"下一步"这个按钮才可以点击
                                swipe_up() //向上滑动
                                sleep(random(3000, 5000))
                                swipe_up() //向上滑动
                                sleep(random(3000, 5000))
                                swipe_up() //向上滑动
                                sleep(random(3000, 5000))


                                //在中文繁体，会有一个是否填写电话号码的弹窗，需要点击"略過"
                                //text("略過")
                                //text("Skip")
                                var skipBtn = className("android.widget.Button").text("略過").findOne(3000);
                                var skipBtn_EN = className("android.widget.Button").text("Skip").findOne(3000);
                                if(skipBtn){
                                    skipBtn.click();
                                    sleep(random(3000, 5000))
                                }else if(skipBtn_EN){
                                    skipBtn_EN.click();
                                    sleep(random(3000, 5000))
                                }

                                sleep(random(16000, 18000))



                                //8.点击下一步
                                var nextBtnList = className("android.widget.Button").find();
                                if(nextBtnList && nextBtnList.size() > 0){
                                    nextBtnList.get(nextBtnList.size() - 1).click(); //直接点击最后一个按钮
                                    sleep(random(3000, 5000))
                                }

                                sleep(random(8000, 10000))

                                //9.点击"I agree" ：className("android.widget.Button") text("I agree") clickable("true")  //英文
                                //text("我同意")
                                var agreeBtn_EN = className("android.widget.Button").text("I agree").findOne(3000); //英文
                                var agreeBtn_ZH_TW = className("android.widget.Button").text("我同意").findOne(3000); //中文繁体
                                if(agreeBtn_EN){
                                    agreeBtn_EN.click();
                                }else if(agreeBtn_ZH_TW){
                                    agreeBtn_ZH_TW.click();
                                }
                                sleep(random(8000, 10000))


                                //10.点击右下角的"ACCEPT" 
                                //text("接受")
                                var acceptBtn_EN = className("android.widget.Button").text("ACCEPT").findOne(3000); //英文
                                var acceptBtn_ZH_TW = className("android.widget.Button").text("接受").findOne(3000); //中文繁体
                                if(acceptBtn_EN){   
                                    acceptBtn_EN.click();
                                }else if(acceptBtn_ZH_TW){
                                    acceptBtn_ZH_TW.click();
                                }

                                sleep(random(8000, 10000))
                            }
                            
                        }
                    }
                }
            }
        }





    }else{
        taskLog("未找到Google play的首页登录按钮");
    }



} catch (error) {
    handleError(error)
}


