// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok关注*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';

var FaceBookPackageName = 'com.facebook.katana';
var InstagramPackageName = 'com.instagram.android';
var TwitterPackageName = 'com.twitter.android';
var ThreadsPackageName = 'com.threads.android';

var allAPP_PackageName = [ASIA_TikTokPackageName,GLOBAL_TikTokPackageName,FaceBookPackageName,InstagramPackageName,TwitterPackageName,ThreadsPackageName]

var targetPackageName = null;
var targetClassName = null;

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
        forceStopAll()
        console.log("-----------------脚本功能执行结束：---------------");
        console.error("Tiktok关注：根據關注列表UID的順序，去關注用戶---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
    forceStopAll()  
    console.error("===错误报告开始===");
    console.error("错误信息：" + e);
    console.error("错误堆栈：" + e.stack);
    console.error("===错误报告结束===");
    exit()
}




//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
//  console.show()


toast("开始强制关闭正在运行的脚本...")
let currentEngine = engines.myEngine()
let runningEngines = engines.all()
let currentSource = currentEngine.getSource() + ''
toast("当前正常运行的脚本个数: " + runningEngines.length)
if (runningEngines.length > 1) {
  runningEngines.forEach(compareEngine => {
    if (currentEngine.id !== compareEngine.id) {
      // 强制关闭所有其他脚本
      sleep(3000)
      toast("已关闭脚本ID: " + compareEngine.id)
      compareEngine.forceStop()
    }
  })
}else{
  toast("没有其他脚本在运行")
}


// toast("开始强杀执行任务的APP...")
// forceStopAll()
sleep(3000)

function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}


function forceStopAll(){

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
//打印日志
function taskLog(_log){
    console.log(getSystemDate("df") +":" +_log)
}
function getSystemDate(a) {
    var b = new SimpleDateFormat("HH:mm:ss"), c = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    return "tf" == a ? b.format(new java.util.Date()) :"df" == a ? c.format(new java.util.Date()) :void 0;
}