
////////////////////////////////////////////////////////////////////
var chromePackageName = "com.kiwibrowser.browser";
var chromeNewName = "NestBrowser"
var google_cookie_host = "https://gmail.com"


var COOKIE_EXT_URL = "https://chromewebstore.google.com/detail/cookiedough/hacigcgfiefikmkmmmncaiaijoffndpl"


//会在在无障碍服务启动后继续运行。
auto.waitFor();


//第三步：启动Kiwi
launch("com.kiwibrowser.browser");
sleep(3000);


// //可能部分设备弹出“NestBrowser不能运行在没有GMS的设备”的弹出框，需要点击确定
// if(id("button1").exists()){
//     id("button1").findOne().click()
// }


// //点击欢迎界面的“continue”按钮
// sleep(3000);
// className("androidx.recyclerview.widget.RecyclerView").findOne().children().forEach(child => {
//      var target = child.findOne(id("signin_fre_continue_button"));
//      //console.log
//      console.log("点击欢迎界面的“continue”按钮")
//      toast("点击欢迎界面的“continue”按钮")
//      //第一次打开
//      if(target){
//          target.click();
//      }
// });



/////////////////////////////正式开始/////////////////////////////


//加载插件拓展
// load_kiwi_extensions_from_NetWork()

//修改Kiwi的Cookie
export_COOKIE_TO_Kiwi()




/////////////////////////
function export_COOKIE_TO_Kiwi(){

    //1.先点开fb
    toast("开始打开google.com网站...");
    let fb_mobile_Intent = {
        action: "android.intent.action.VIEW",
        data: google_cookie_host,
        packageName: chromePackageName, // 指定kiwi打开url
    };

    app.startActivity(fb_mobile_Intent);
    toast("正在打开google.com网站...");
    sleep(2000);

    //**************开始更新Cookie,目前是根据坐标来点击*****************//
    //2.把Cookie的JSON转换成Header
    var cookieJsonFilePath = '/data/local/tmp/cookies.txt';
    // toast("读取云端cookieJsonFilePath = " + cookieJsonFilePath)
    var NestCookie = jsonCookiesToHeader(cookieJsonFilePath);


    //直接这样set，是OK的；
    toast("读取云端Cookie = " + NestCookie)




     //3.右侧抽屉页面滑动到底部
     toast("开始打开右侧按钮Button...");
     var menu_button_wrapper_xy = id("menu_button_wrapper").findOne().bounds();
     click(menu_button_wrapper_xy.centerX(), menu_button_wrapper_xy.centerY());
     toast("点击右侧按钮Button...");
     sleep(3000);



     //4.往下滑动
     var listView = className("ListView").id("app_menu_list");
     toast("点击往下滑动菜单列表，滑到最下面...");
     listView.scrollBackward();
     listView.scrollForward();
     sleep(3000);




    //5.Cookiedough的按钮整体布局
    var UA_Text = id("menu_item_text").className("android.widget.TextView").text("Cookiedough").findOne()
    var UA_Text_centerX = UA_Text.bounds().centerX();
    var UA_Text_centerY = UA_Text.bounds().centerY();
    click(UA_Text_centerX, UA_Text_centerY);
    toast("点击往下滑动菜单列表，滑到最下面...");
    sleep(3000);


    //5.开始填入cookie并保存
    var object = className("android.widget.EditText").find();
    if (!object.empty()) {
        object.forEach(function(currentValue, index) {
            currentValue.setText(NestCookie)
            toast("找到设置Cookie的编辑框，开始填入云端Cookie...");
        })
    } else {
        toast("没找到可以设置Cookie的编辑框");
    }
    sleep(3000);

    //6.保存
    className("android.widget.Button").text("Set Cookies").findOne().click() //保存
    toast("点击底部保存按钮....");
    sleep(8000);


    //7.再次点开Facebook.com
    let fbIntent = {
        action: "android.intent.action.VIEW",
        data: google_cookie_host,
        packageName: chromePackageName, // 指定kiwi打开url
    };
    toast("第二次打开Facebook.com网站，额可以检查此时Facebook是否处于登陆状态...");
    app.startActivity(fbIntent);
    sleep(8000);
    toast("如果较长时间卡住在Facebook首页的启动页面，请耐心等待几秒钟，不需要操作，会自动刷新到首页面....");




}



//判断右侧Listview底部Cookiedough控件是否存在，有可能打开Facebook.com太快，导致可能Cookiedough还没有安装完成
function judgeCookiedoughExists(){

    while(true){

        //1.先点开fb
        toast("开始打开Facebook.com网站...");
        let fb_mobile_Intent = {
            action: "android.intent.action.VIEW",
            data: google_cookie_host,
            packageName: chromePackageName, // 指定kiwi打开url
        };

        app.startActivity(fb_mobile_Intent);
        toast("正在打开Facebook.com网站...");
        sleep(2000);

        //3.右侧抽屉页面滑动到底部
         toast("开始打开右侧按钮Button...");
         var menu_button_wrapper_xy = id("menu_button_wrapper").findOne().bounds();
         click(menu_button_wrapper_xy.centerX(), menu_button_wrapper_xy.centerY());
         toast("点击右侧按钮Button...");
         sleep(3000);



         //4.往下滑动
         var listView = className("ListView").id("app_menu_list");
         toast("点击往下滑动菜单列表，滑到最下面...");
         listView.scrollBackward();
         listView.scrollForward();
         sleep(3000);



        //5.Cookiedough的按钮整体布局
        var UA_Text = id("menu_item_text").className("android.widget.TextView").text("Cookiedough").findOne()
        if(UA_Text.exists()){
              var UA_Text_centerX = UA_Text.bounds().centerX();
              var UA_Text_centerY = UA_Text.bounds().centerY();
              click(UA_Text_centerX, UA_Text_centerY);
              toast("点击往下滑动菜单列表，滑到最下面...");
              sleep(3000);
              break
        }



    }

}





//将Cookie的JSON转换成Header-String类型
function jsonCookiesToHeader(jsonFilePath) {
    var jsonData = ""
    try {

        // 读取 JSON 文件内容
        jsonData = files.read(jsonFilePath);
        const cookiesData = JSON.parse(jsonData);


        // 构建 Header 字符串
        let headerString = '';
        cookiesData.forEach(cookie => {

            //移除__Secure-ENID，否则导入FB会失败
            // if (cookie.domain.includes('facebook') || cookie.domain.includes('fb')) {
            if (cookie.domain.includes('google')) {
                //log:Failed to parse or set cookie named "__Secure-ENID"
               if(cookie.name != "__Host-GAPS"){
                   headerString += `${cookie.name}=${cookie.value}; `;
               }
               if(cookie.name != "__Secure-1PSIDTS" || cookie.name != "__Secure-3PSIDTS" || cookie.name != "__Secure-s_a" 
                || cookie.name != "__Secure-3PAPISID" || cookie.name != "__Secure-3PSID" || cookie.name != "__Secure-OSID"
                || cookie.name != "__Secure-1PSIDTS" || cookie.name != "__Secure-3PSIDTS"|| cookie.name != "__Secure-3PSIDCC"
                || cookie.name != "__Secure-1PSID"|| cookie.name != "__Secure-3PSID"
               ){
                   headerString += `${cookie.name}=${cookie.value}; `;
               }


            }

        });

        // 移除末尾多余的分号和空格
        headerString = headerString.trim().slice(0, -1);

        return headerString;
    } catch (error) {
        toast('Error reading COOKIE JSON file:', error);
        return '';
    }
}


