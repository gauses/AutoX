
////////////////////////////////////////////////////////////////////
var chromePackageName = "com.kiwibrowser.browser";
var chromeNewName = "NestBrowser"
var fb_cookie_host = "https://facebook.com"


var COOKIE_EXT_URL = "https://chromewebstore.google.com/detail/cookiedough/hacigcgfiefikmkmmmncaiaijoffndpl"


//会在在无障碍服务启动后继续运行。
auto.waitFor();


//第三步：启动Kiwi
launch("com.kiwibrowser.browser");
sleep(3000);


//可能部分设备弹出“NestBrowser不能运行在没有GMS的设备”的弹出框，需要点击确定
if(id("button1").exists()){
    id("button1").findOne().click()
}


//点击欢迎界面的“continue”按钮
sleep(3000);
className("androidx.recyclerview.widget.RecyclerView").findOne().children().forEach(child => {
     var target = child.findOne(id("signin_fre_continue_button"));
     //console.log
     console.log("点击欢迎界面的“continue”按钮")
     toast("点击欢迎界面的“continue”按钮")
     //第一次打开
     if(target){
         target.click();
     }
});



/////////////////////////////正式开始/////////////////////////////


//加载插件拓展
load_kiwi_extensions_from_NetWork()

//修改Kiwi的Cookie
export_COOKIE_TO_Kiwi()



//从network文件夹下读取本地拓展CRX文件
function load_kiwi_extensions_from_NetWork() {

    toast("开始加载cookie拓展插件...")

    let COOKIE_Intent = {
            action: "android.intent.action.VIEW",
            data: COOKIE_EXT_URL,
            packageName: chromePackageName, // 指定kiwi打开url
        };
    app.startActivity(COOKIE_Intent);
    sleep(3000)

    //1、点击界面的“添加至 Chrome”按钮
    add_extension_to_chrome()


    ///2、开始安装
    click_pop_extension_to_chrome()

    //3、检查是否安装完成
    sleep(1000)
    waitFor_extension_to_chrome()
    sleep(2000)


}

//等待界面的“从Chrome中移除”按钮已经安装完成，界面元素会变化
function waitFor_extension_to_chrome(){
     toast("开始检查插件拓展是否已经安装完成...");

         while (true) {
             // 查找控件
             var button1 = className("android.widget.Button").text("从Chrome中移除").findOne(1000);
             var button2 = className("android.widget.Button").text("Remove from Chrome").findOne(1000);
             var button3 = className("android.widget.Button").text("從 Chrome 中移除").findOne(1000);
             
             if (button1 && button1.enabled()) {
                 console.log("插件安装完成，此时界面显示‘从Chrome中移除’");
                 toast("插件安装完成，此时界面显示‘从Chrome中移除’");
                 break; // 跳出循环
             }else if(button2 && button2.enabled()){
                 console.log("插件安装完成，此时界面显示‘Remove from Chrome’");
                 toast("插件安装完成，此时界面显示‘Remove from Chrome’");
                 break; // 跳出循环
             }else if(button3 && button2.enabled()){
                 console.log("插件安装完成，此时界面显示‘从Chrome中移除’");
                 toast("插件安装完成，此时界面显示‘从Chrome中移除’");
                 break; // 跳出循环
             }

             // 如果超时后仍未找到控件，重新开始循环
             toast("检查‘从Chrome中移除’按钮超时，重新检查...");
         }


}



//点击界面的“添加至 Chrome”按钮
function add_extension_to_chrome(){
    toast("开始执行点击“添加至 Chrome”按钮");
    console.log("开始执行点击“添加至 Chrome”按钮")
    //console.log

    while (true) {
        // 查找控件，设置超时时间为10秒
        console.log("开始findone“添加至 Chrome”按钮")
        var button1 = className("android.widget.Button").text("添加至 Chrome").findOne(1000);
        toast("正在寻找‘添加至 Chrome’控件是否存在... " );
        toast("添加至 Chrome-1 =  " + button1 );
        console.log("正在寻找‘添加至 Chrome’控件是否存在... " );
        console.log("添加至 Chrome-1 =  " + button1 );

        if (button1 && button1.enabled()) {
            button1.click()
            toast("‘添加至 Chrome’控件被点击！");
            console.log("‘添加至 Chrome’控件被点击！" );
            break; // 跳出循环
        }else{
            toast("‘添加至 Chrome’控件没有找到或者暂时不可点击");
            console.log("‘添加至 Chrome’控件没有找到或者暂时不可点击");

        }

        var button2 = className("android.widget.Button").text("Add to Chrome").findOne(1000);
        toast("正在寻找‘Add to Chrome’控件是否存在button2 = " + button2);
        toast("添加至 Chrome-2 =  " + button2 );
        console.log("正在寻找‘Add to Chrome’控件是否存在button2 = " + button2);
        console.log("添加至 Chrome-2 =  " + button2 );
        if (button2 && button2.enabled()) {
            button2.click()
            toast("‘添加至 Chrome’控件被点击！");
            break; // 跳出循环
        }else{
            toast("‘添加至 Chrome’控件没有找到或者暂时不可点击");
        }



        var button3 = className("android.widget.Button").text("加到 Chrome").findOne(1000);
        toast("正在寻找‘加到 Chrome’控件是否存在button3 = " + button3);
        toast("添加至 Chrome-3 =  " + button3 );
        console.log("正在寻找‘加到 Chrome’控件是否存在button3 = " + button3);
        console.log("添加至 Chrome-3 =  " + button3 );
        if (button3 && button3.enabled()) {
            button3.click()
            toast("‘添加至 Chrome’控件被点击！");
            break; // 跳出循环
        }else{
            toast("‘添加至 Chrome’控件没有找到或者暂时不可点击");
       }

        // 如果超时后仍未找到控件，重新开始循环
        toast("检查“添加至 Chrome”控件超时，开始重新检查...");
        sleep(2000); // 每2秒检查一次
    }

}


//点击popup界面positive_button
function click_pop_extension_to_chrome(){
    toast("开始执行点击popup界面的“确认”按钮");

    sleep(2000)
    while (true) {
        // 查找控件
        var positive_button = id("positive_button").findOne();
        if (positive_button && positive_button.enabled()) {
            sleep(1000)
            positive_button.click()
            toast("positive_button控件被点击！");
            break; // 跳出循环
        }
        // 如果超时后仍未找到控件，重新开始循环
        add_extension_to_chrome()
        toast("检查positive_button控件超时，重新检查...");
    }


}


/////////////////////////
function export_COOKIE_TO_Kiwi(){

    //1.先点开fb
    toast("开始打开Facebook.com网站...");
    let fb_mobile_Intent = {
        action: "android.intent.action.VIEW",
        data: fb_cookie_host,
        packageName: chromePackageName, // 指定kiwi打开url
    };

    app.startActivity(fb_mobile_Intent);
    toast("正在打开Facebook.com网站...");
    sleep(2000);

    //**************开始更新Cookie,目前是根据坐标来点击*****************//
    //2.把Cookie的JSON转换成Header
    var cookieJsonFilePath = '/data/local/tmp/cookies.txt';
    toast("读取云端cookieJsonFilePath = " + cookieJsonFilePath)
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
        data: fb_cookie_host,
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
            data: fb_cookie_host,
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
            if (cookie.domain.includes('facebook')) {
                //log:Failed to parse or set cookie named "__Secure-ENID"
//                if(cookie.name != "__Secure-ENID"){
//                    headerString += `${cookie.name}=${cookie.value}; `;
//                }
				//1009:只保留必要的几个参数，否则打开之后，有几率会打开空白
				if(cookie.name == "c_user"){
                    headerString += `${cookie.name}=${cookie.value}; `;
                }
                if(cookie.name == "sb"){
                    headerString += `${cookie.name}=${cookie.value}; `;
                }
                if(cookie.name == "datr"){
                    headerString += `${cookie.name}=${cookie.value}; `;
                }
                if(cookie.name == "ps_n"){
                    headerString += `${cookie.name}=${cookie.value}; `;
                }
                if(cookie.name == "ps_l"){
                    headerString += `${cookie.name}=${cookie.value}; `;
                }
                if(cookie.name == "xs"){
                    headerString += `${cookie.name}=${cookie.value}; `;
                }
                if(cookie.name == "fr"){
                    headerString += `${cookie.name}=${cookie.value}; `;
                }

                //卖号不包含该参数
                if(cookie.name == "wd"){
                    headerString += `${cookie.name}=${cookie.value}; `;
                }
                if(cookie.name == "dpr"){
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


