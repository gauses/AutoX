//Date:04-03  16:27
// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

////////////////////////////////////////////////////////////////////
var chromePackageName = 'com.kiwibrowser.browser';
var chromeNewName = 'NestBrowser';
var IP_cookie_host = 'https://whoer.net/zh';
var fb_cookie_host = 'https://m.facebook.com/';
var instagram_cookie_host = 'https://instagram.com';
var threads_cookie_host = 'https://threads.net';
var gmail_cookie_host = 'https://gmail.com';

var open_cookie_host_url = ""





var COOKIE_EXT_URL =
  'https://chromewebstore.google.com/detail/cookie-editor-cookie-mana/hocoakkpjckombahpgmbhpilegeicdeh';

//会在在无障碍服务启动后继续运行。
auto.waitFor();


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

forceStop_netbrowser()



//第三步：启动Kiwi
home()
sleep(6000)

app.startActivity({
  action: "android.intent.action.VIEW",
  packageName: chromePackageName,
  className: "org.chromium.chrome.browser.ChromeTabbedActivity"
});



sleep(6000);

//可能部分设备弹出"NestBrowser不能运行在没有GMS的设备"的弹出框，需要点击确定
if (id('button1').exists()) {
  id('button1').findOne(3000).click();
}

//点击欢迎界面的"continue"按钮
var continueButtons = className("android.widget.Button").find();
if (continueButtons && continueButtons.size() > 0) {
    for (var i = 0; i < continueButtons.size(); i++) {
        var button = continueButtons.get(i);
        if (button) {
            taskLog("找到button控件-Text：" + button.text() + ";ID = " + button.id());

            //fullId("com.kiwibrowser.browser:id/signin_fre_continue_button")
            if(button.id() === "com.kiwibrowser.browser:id/signin_fre_continue_button"){
              toast('找到signin_fre_continue_button按钮');
              button.click();
              break;
            }
        }
    }
}


/////////////////////////////正式开始/////////////////////////////

sleep(6000);

//加载插件拓展
load_kiwi_extensions_from_NetWork();


//修改Kiwi的Cookie
export_COOKIE_TO_Kiwi();


//确认要导入Cookie
export_COOKIE_ensure_Cookie_Imported()





//从network文件夹下读取本地拓展CRX文件
function load_kiwi_extensions_from_NetWork() {
  toast('开始加载cookie拓展插件...');

  let COOKIE_Intent = {
    action: 'android.intent.action.VIEW',
    data: COOKIE_EXT_URL,
    packageName: chromePackageName, // 指定kiwi打开url
  };
  app.startActivity(COOKIE_Intent);
  sleep(6000);

  //1、点击界面的"添加至 Chrome"按钮
  add_extension_to_chrome();


  ///2、开始安装
  click_pop_extension_to_chrome();

  //3、检查是否安装完成
  sleep(1000);
  waitFor_extension_to_chrome();
  sleep(2000);

  //4.开始移出悬浮窗
  toast('开始移出悬浮窗...');
  console.clear();
  console.hide();
}

//点击界面的"添加至 Chrome"按钮
function find_btn_Text_base(text1, text2, text3) {
  while (true) {
    // 查找控件
    var button1 = className('android.widget.Button')
      .text(text1)
      .findOne(1000);
    var button2 = className('android.widget.Button')
      .text(text2) 
      .findOne(1000);
    var button3 = className('android.widget.Button')
      .text(text3)
      .findOne(1000);

    if (button1 && button1.enabled()) {
      button1.click();
      console.log('点击按钮: ' + text1);
      toast('点击按钮: ' + text1);
      break; // 跳出循环
    } else if (button2 && button2.enabled()) {
      button2.click();
      console.log('点击按钮: ' + text2);
      toast('点击按钮: ' + text2); 
      break; // 跳出循环
    } else if (button3 && button3.enabled()) {
      button3.click();
      console.log('点击按钮: ' + text3);
      toast('点击按钮: ' + text3);
      break; // 跳出循环
    }

    // 如果超时后仍未找到控件,重新开始循环
    toast('查找按钮超时,重新查找...');
  }
}

//等待界面的"从Chrome中移除"按钮已经安装完成，界面元素会变化
function waitFor_extension_to_chrome() {
  toast('开始检查插件拓展是否已经安装完成...');

  while (true) {
    // 查找控件
    var button1 = className('android.widget.Button')
      .text('从Chrome中移除')
      .findOne(1000);
    var button2 = className('android.widget.Button')
      .text('Remove from Chrome')
      .findOne(1000);
    var button3 = className('android.widget.Button')
      .text('從 Chrome 中移除')
      .findOne(1000);

    if (button1 && button1.enabled()) {
      console.log('插件安装完成，此时界面显示“从Chrome中移除”');
      toast('插件安装完成，此时界面显示“从Chrome中移除”');
      break; // 跳出循环
    } else if (button2 && button2.enabled()) {
      console.log('插件安装完成，此时界面显示“Remove from Chrome”');
      toast('插件安装完成，此时界面显示“Remove from Chrome”');
      break; // 跳出循环
    } else if (button3 && button3.enabled()) {
      console.log('插件安装完成，此时界面显示“从Chrome中移除”');
      toast('插件安装完成，此时界面显示“从Chrome中移除”');
      break; // 跳出循环
    }

    // 如果超时后仍未找到控件，重新开始循环
    toast('检查“从Chrome中移除”按钮超时，重新检查...');
  }
}


//点击界面的"添加至 Chrome"按钮
function add_extension_to_chrome() {
    toast('开始执行点击"添加至 Chrome"按钮');
    console.log('开始执行点击"添加至 Chrome"按钮');

    find_btn_Text_base("添加至 Chrome","Add to Chrome","加到 Chrome")//text("關注")

}

//点击popup界面positive_button
function click_pop_extension_to_chrome() {
  toast('开始执行点击popup界面的"确认"按钮');

  sleep(2000);
  while (true) {
    // 查找控件
    var positive_button = id('positive_button').findOne();
    if (positive_button && positive_button.enabled()) {
      sleep(1000);
      positive_button.click();
      toast('positive_button控件被点击！');
      break; // 跳出循环
    }
    // 如果超时后仍未找到控件，重新开始循环
    add_extension_to_chrome();
    toast('检查positive_button控件超时，重新检查...');
  }
}

/////////////////////////
function export_COOKIE_TO_Kiwi() {
  //1.先点开fb
  toast('开始打开whoer.net网站...');
  let fb_mobile_Intent = {
    action: 'android.intent.action.VIEW',
    data: IP_cookie_host,
    packageName: chromePackageName, // 指定kiwi打开url
  };

  app.startActivity(fb_mobile_Intent);
  toast('打开whoer.net网站，测试当前设备网络是否正常...');
  sleep(10000);

  //**************开始更新Cookie,目前是根据坐标来点击*****************//
  //2.把Cookie的JSON转换成Header
  var cookieJsonFilePath = '/data/local/tmp/cookies.txt';
  toast('读取云端cookieJsonFilePath = ' + cookieJsonFilePath);

  //直接这样set，是OK的；
  var NestCookie = jsonCookiesTEST(cookieJsonFilePath);
  taskLog('读取jsonCookiesTEST云端Cookie = ' + NestCookie);
  toast('读取云端Cookie = ' + NestCookie);

 

  //3.右侧抽屉页面滑动到底部
  toast('开始打开右侧按钮Button...');
  var menu_button_wrapper_xy = id('menu_button_wrapper').findOne().bounds();
  click(menu_button_wrapper_xy.centerX(), menu_button_wrapper_xy.centerY());
  toast('点击右侧按钮Button...');
  sleep(3000);

  //4.往下滑动
  var listView = className('ListView').id('app_menu_list');
  toast('点击往下滑动菜单列表，滑到最下面...');
  listView.scrollBackward();
  listView.scrollForward();
  sleep(3000);

  //5.Cookiedough的按钮整体布局
  var UA_Text = id('menu_item_text')
    .className('android.widget.TextView')
    .text('Cookie Editor - Cookie Manager')
    .findOne();
  var UA_Text_centerX = UA_Text.bounds().centerX();
  var UA_Text_centerY = UA_Text.bounds().centerY();
  click(UA_Text_centerX, UA_Text_centerY);
  toast('点击往下滑动菜单列表，滑到最下面...');
  sleep(3000);

  //6.开始移出悬浮窗
  toast('开始移出悬浮窗...');
  console.clear();
  console.hide();


  //7.点击"Import"
  sleep(5000);
  className("android.widget.Button").text("Import").findOne().click();
  sleep(5000);
  className("android.view.MenuItem").text("Import from clipboard").findOne().click();
  sleep(5000);
  //输入cookie的输入框
  var allEditText = className("android.widget.EditText").find();
    if (allEditText && allEditText.size() > 0) {
        
        // 将 Cookie 设置到剪贴板
        setClip(NestCookie);
        sleep(3000);
        
        // 获取第二个输入框的位置
        var targetInput = allEditText.get(1);
        var bounds = targetInput.bounds();
        
        // 长按输入框中心位置
        press(bounds.centerX(), bounds.centerY(), 1000);
        sleep(5000);
        
        // 点击"粘贴"选项
        if(text("粘贴").exists()) {
            text("粘贴").findOne().click();
        } else if(text("Paste").exists()) {
            text("Paste").findOne().click();
        } else if(text("貼上").exists()) {
            text("貼上").findOne().click();
        }

        for (var i = 0; i < allEditText.size(); i++) {
          var button = allEditText.get(i);
          if (button) {
              taskLog("找到button控件-Text：" + button.text() + ";ID = " + button.id());
              button.setText(NestCookie);
          }
      }

        sleep(5000);
    }

    var Buttons = className("android.widget.Button").find();
    if (Buttons && Buttons.size() > 0) {
        var importCount = 1;
        for (var i = 0; i < Buttons.size(); i++) {
            var button = Buttons.get(i);
            if (button) {
                //taskLog("找到button控件-Text：" + button.text() + ";ID = " + button.id());
                if (button.text() === "Import") {
                    importCount++;
                    if (importCount === 2) {
                        button.click();
                        break;
                    }
                }
            }
        }
    }

    
}


function export_COOKIE_ensure_Cookie_Imported() { 


  //8.点击"Allow cookies",然后点击刷新按钮
  click_pop_extension_Positive_Button()
  sleep(5000);


  var Buttons = className("android.widget.Button").find();
  if (Buttons && Buttons.size() > 0) {
      for (var i = 0; i < Buttons.size(); i++) {
          var button = Buttons.get(i);
          if (button) {
              taskLog("找到button控件-Text：" + button.text() + ";ID = " + button.id());
              if (button.text() === "Refresh") {
                    button.click();
                    break;
                
              }
          }
      }
  }

  
    // var Buttons = className("android.widget.Button").find();
    // if (Buttons && Buttons.size() > 0) {
    //     for (var i = 0; i < Buttons.size(); i++) {
    //         var button = Buttons.get(i);
    //         if (button) {
    //             taskLog("找到button控件-Text：" + button.text() + ";ID = " + button.id());
    //             if (button.text() === "Refresh") {
    //                   button.click();
    //                   break;
    //             }
    //         }
    //         // 如果没有找到 Refresh 按钮，重新执行 export_COOKIE_TO_Kiwi()
    //         if (!button || button.text() !== "Refresh") {
    //             console.log("未找到 Refresh 按钮，重新执行 export_COOKIE_TO_Kiwi()");
    //             export_COOKIE_TO_Kiwi();
    //             continue;
    //         }
    //     }
    // }


    sleep(15000)


    //7.根据导入Cookie的domain，来确定再次点开具体哪个网站
    let fbIntent = {
      action: 'android.intent.action.VIEW',
      data: open_cookie_host_url,
      packageName: chromePackageName, // 指定kiwi打开url
    };

    toast(
      'Cookie中包含的网站，可以检查此时网站是否处于登陆状态...',
    );
    app.startActivity(fbIntent);
    sleep(8000);
    toast(
      '如果较长时间卡住在网站首页的启动页面，请耐心等待几秒钟，不需要操作，会自动刷新到首页面....',
    );


}


//判断右侧Listview底部Cookiedough控件是否存在，有可能打开Facebook.com太快，导致可能Cookiedough还没有安装完成
function judgeCookiedoughExists() {
  while (true) {
    //1.先点开fb
    toast('开始打开Facebook.com网站...');
    let fb_mobile_Intent = {
      action: 'android.intent.action.VIEW',
      data: fb_cookie_host,
      packageName: chromePackageName, // 指定kiwi打开url
    };

    app.startActivity(fb_mobile_Intent);
    toast('正在打开Facebook.com网站...');
    sleep(2000);

    //3.右侧抽屉页面滑动到底部
    toast('开始打开右侧按钮Button...');
    var menu_button_wrapper_xy = id('menu_button_wrapper').findOne().bounds();
    click(menu_button_wrapper_xy.centerX(), menu_button_wrapper_xy.centerY());
    toast('点击右侧按钮Button...');
    sleep(3000);

    //4.往下滑动
    var listView = className('ListView').id('app_menu_list');
    toast('点击往下滑动菜单列表，滑到最下面...');
    listView.scrollBackward();
    listView.scrollForward();
    sleep(3000);

    //5.Cookiedough的按钮整体布局
    var UA_Text = id('menu_item_text')
      .className('android.widget.TextView')
      .text('Cookiedough')
      .findOne();
    if (UA_Text.exists()) {
      var UA_Text_centerX = UA_Text.bounds().centerX();
      var UA_Text_centerY = UA_Text.bounds().centerY();
      click(UA_Text_centerX, UA_Text_centerY);
      toast('点击往下滑动菜单列表，滑到最下面...');
      sleep(3000);
      break;
    }
  }
}

function jsonCookiesTEST(jsonFilePath) {
  var jsonData = '';
  try {
    jsonData = files.read(jsonFilePath);
    const cookiesData = JSON.parse(jsonData);
    cookiesData.forEach((cookie) => {
      console.log(cookie.name + "=" + cookie.value + ";");
      if (cookie.domain.includes('.gmail.com')) {
        console.log("打开gmail.com网站...");
        open_cookie_host_url = gmail_cookie_host
      }
      if (cookie.domain.includes('.facebook.com')) {
        console.log("打开Facebook.com网站...");
        open_cookie_host_url = fb_cookie_host
      }
      if (cookie.domain.includes('.instagram.com')) {
        console.log("打开Instagram.com网站...");
        open_cookie_host_url = instagram_cookie_host
      }
      if (cookie.domain.includes('.threads.net')) {
        console.log("打开threads.net网站...");
        open_cookie_host_url = threads_cookie_host
      }
      


    });
  } catch (error) {
  }
  return jsonData;
}


//导入cookie之后，点击popup界面positive_button
function click_pop_extension_Positive_Button() {
  toast('开始执行点击popup界面的"确认"按钮');

  sleep(2000);
  var retry = 0 
  while (retry < 3) {
    // 查找控件
    var positive_button = id('positive_button').findOne();
    if (positive_button && positive_button.enabled()) {
      sleep(1000);
      positive_button.click();
      toast('positive_button控件被点击！');
      break; // 跳出循环
    }
    // 如果超时后仍未找到控件，重新开始循环
    toast('检查positive_button控件超时，重新检查...');
    retry++
  }
}




//===================
//通过Button的Text
function find_btn_Text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){


  var loopCount  = 0

   while (true) {
       taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
       // 检查计数器是否达到20
       if (loopCount >= 20) {
           // 打印一条消息并退出循环
           taskLog("循环已执行20次，即将退出循环。");////
           throw new Error(findText_ZH_CN +"按钮没有找到");
           break;
       }

       // 查找控件
       var button1 = className("android.widget.Button").text(findText_ZH_CN).findOne(1000);
       var button2 = className("android.widget.Button").text(findText_ZH_TW).findOne(1000);
       var button3 = className("android.widget.Button").text(findText_EN_US).findOne(1000);

       if (button1 && button1.enabled()) {
           taskLog("找到" + findText_ZH_CN);
           taskLog("找到button1 = " + button1.clickable() );
           clickText(findText_ZH_CN)
           sleep(1000)
           button1.click()
           break; // 跳出循环
       }else if(button2 && button2.enabled()){
           taskLog("找到" + findText_ZH_TW);
           taskLog("找到button2 = " + button2.clickable() );
           clickText(findText_ZH_TW)
           sleep(1000)
           button2.click()
           break; // 跳出循环
       }else if(button3 && button3.enabled()){
           taskLog("找到" + findText_EN_US);
           taskLog("找到button3 = " + button3.clickable() );
           clickText(findText_EN_US)
           sleep(1000)
           button3.click()

           
           break; // 跳出循环
       }
       sleep(1000)

   }
}

//打印日志
function taskLog(_log){
  console.log(getSystemDate("df") +":" +_log)

  //通过日志判断任务有没有结束：
}

function getSystemDate(a) {
  var b = new SimpleDateFormat("HH:mm:ss"), c = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
  return "tf" == a ? b.format(new java.util.Date()) :"df" == a ? c.format(new java.util.Date()) :void 0;
}


function clickText(a) {
  for (obj_Text = text(a).boundsInside(5, 5, device.width-5, device.height-5); obj_Text.find().empty(); ) sleep(1e3);
  X = obj_Text.find().get(0).bounds().centerX(), Y = obj_Text.find().get(0).bounds().centerY(),
  Deviation = random(-5, 5), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
}


//强制停止NestBrowser
function forceStop_netbrowser(){
  taskLog("准备强杀NestBrowser...")
  app.openAppSetting(chromePackageName)
  sleep(5000)

  //繁体
  if (text("強制停止").exists()) {
      let forceStopBtn = text("強制停止").findOne();
      if (forceStopBtn && forceStopBtn.clickable()) {
          forceStopBtn.click();
          sleep(1000);
          // 确认操作
          if (text("確定").exists()) {
              text("確定").findOne().click();
              taskLog("已经強制停止")
              sleep(1000)
              // home()
              // return;
          }
      } else {
          taskLog("未找到可点击的'強制停止'按钮");
      }
  } else {
      taskLog("未找到'解除安裝'按钮");
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
              taskLog("已经强行停止")
          }
      } else {
          taskLog("未找到可点击的'强行停止'按钮");
      }
  } else {
      taskLog("未找到'强行停止'按钮");
  }

  sleep(1000)


  //英语
  if (text("Force stop").exists()) {
      let forceStopBtn = text("Force stop").findOne();
      if (forceStopBtn && forceStopBtn.clickable()) {
          forceStopBtn.click();
          sleep(1000);
          // 确认操作
          if (text("OK").exists()) {
              text("OK").findOne().click();
              taskLog("已经Force stop")
          }
      } else {
          taskLog("未找到可点击的'Force stop'按钮");
      }
  } else {
      taskLog("未找到'Force stop'按钮");
  }
  sleep(1000)

  //英语
  if (text("FORCE STOP").exists()) {
      let forceStopBtn = text("FORCE STOP").findOne();
      if (forceStopBtn && forceStopBtn.clickable()) {
          forceStopBtn.click();
          sleep(1000);
          // 确认操作
          if (text("OK").exists()) {
              text("OK").findOne().click();
              taskLog("已经FORCE STOP")
              sleep(1000)
          }
      } else {
          taskLog("未找到可点击的'FORCE STOP'按钮");
      }
  } else {
      taskLog("未找到'FORCE STOP'按钮");
  }
  sleep(1000)

  home()



}