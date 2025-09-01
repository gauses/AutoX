package org.autojs.autojs.autojs;

import android.util.Log;

import com.stardust.app.GlobalAppContext;
import com.stardust.autojs.core.console.ConsoleImpl;
import com.stardust.autojs.core.console.GlobalConsole;
import com.stardust.autojs.execution.ScriptExecution;
import com.stardust.autojs.execution.ScriptExecutionListener;

import org.apache.log4j.lf5.LogLevel;
import org.autojs.autojs.alioss.AliOSSUtils;
import org.autojs.autojs.alioss.LogFileUtils;
import org.autojs.autoxjs.R;


/**
 * Created by Stardust on 2017/5/3.
 */

public class ScriptExecutionGlobalListener implements ScriptExecutionListener {
    private static final String ENGINE_TAG_START_TIME = "org.autojs.autojs.autojs.Goodbye, World";

    @Override
    public void onStart(ScriptExecution execution) {
        execution.getEngine().setTag(ENGINE_TAG_START_TIME, System.currentTimeMillis());
    }

    @Override
    public void onSuccess(ScriptExecution execution, Object result) {
        onFinish(execution);
        Log.d("ScriptExecutionGlobal" , "onSuccess result ======================= " );
        Log.d("ScriptExecutionGlobal" , "onSuccess result = " + execution.getSource().toString());
        Log.d("ScriptExecutionGlobal" , "onSuccess result = " + execution.getConfig().toString());
        Log.d("ScriptExecutionGlobal" , "onSuccess result ======================= " );


        //执行结果日志：
//        2025-08-15 14:55:50.446 17154-17250 ScriptExecutionGlobal  D  onSuccess result =======================
//        2025-08-15 14:55:50.446 17154-17250 ScriptExecutionGlobal  D  onSuccess result = /storage/emulated/0/Download/e4d799e1-80c6-4cc3-b0e7-3a3364679458.js
//        2025-08-15 14:55:50.446 17154-17250 ScriptExecutionGlobal  D  onSuccess result = ExecutionConfig(workingDirectory=/storage/emulated/0/Download, path=[], intentFlags=0, delay=0, interval=0, loopTimes=1, scriptConfig=ScriptConfig(features=[], uiMode=false))
//        2025-08-15 14:55:50.447 17154-17250 ScriptExecutionGlobal  D  onSuccess result =======================


        //上传文件
        LogFileUtils.INSTANCE.uploadLogFileToServer("success");

        try {
            Thread.sleep(3000);
        } catch (InterruptedException ex) {
            throw new RuntimeException(ex);
        }
        AutoJs.getInstance().getScriptEngineService().stopAllAndToast();




    }

    //执行完成
    private void onFinish(ScriptExecution execution) {
        Long millis = (Long) execution.getEngine().getTag(ENGINE_TAG_START_TIME);
        if (millis == null)
            return;
        double seconds = (System.currentTimeMillis() - millis) / 1000.0;
        AutoJs.getInstance().getScriptEngineService().getGlobalConsole()
                .verbose(GlobalAppContext.getString(R.string.text_execution_finished), execution.getSource().toString(), seconds);

        AutoJs.getInstance().getScriptEngineService().getGlobalConsole().println(Log.VERBOSE, "onFinish......");
        AutoJs.getInstance().getScriptEngineService().getGlobalConsole().println(Log.VERBOSE, "任务执行时间:" +seconds);


        Log.d("ScriptExecutionGlobal" , "onFinish result ======================= " );
        Log.d("ScriptExecutionGlobal" , "onFinish result = " + execution.getSource().toString());
        Log.d("ScriptExecutionGlobal" , "onFinish result = " + execution.getConfig().toString());
        Log.d("ScriptExecutionGlobal" , "onFinish result ======================= " );



    }

    @Override
    public void onException(ScriptExecution execution, Throwable e) {
        onFinish(execution);
        Log.d("ScriptExecutionGlobal" , "onException result ======================= " );
        Log.d("ScriptExecutionGlobal" , "onException result = " + e.toString());
        Log.d("ScriptExecutionGlobal" , "onException result = " + execution.getSource().toString());
        Log.d("ScriptExecutionGlobal" , "onException result = " + execution.getConfig().toString());
        Log.d("ScriptExecutionGlobal" , "onException result ======================= " );
//        AutoJs.getInstance().getScriptEngineService().getGlobalConsole().println(Log.VERBOSE, "onException......");


//        2025-08-18 15:11:51.642 14477-14562 ScriptExecutionGlobal   org.autojs.autoxjs                   D  onException result =======================
//        2025-08-18 15:11:51.642 14477-14562 ScriptExecutionGlobal   org.autojs.autoxjs                   D  onException result = org.mozilla.javascript.JavaScriptException: Error: 测试异常 (/storage/emulated/0/Download/e4d799e1-80c6-4cc3-b0e7-3a3364679458.js#220)
//        2025-08-18 15:11:51.642 14477-14562 ScriptExecutionGlobal   org.autojs.autoxjs                   D  onException result = /storage/emulated/0/Download/e4d799e1-80c6-4cc3-b0e7-3a3364679458.js
//        2025-08-18 15:11:51.642 14477-14562 ScriptExecutionGlobal   org.autojs.autoxjs                   D  onException result = ExecutionConfig(workingDirectory=/storage/emulated/0/Download, path=[], intentFlags=0, delay=0, interval=0, loopTimes=1, scriptConfig=ScriptConfig(features=[], uiMode=false))
//        2025-08-18 15:11:51.642 14477-14562 ScriptExecutionGlobal   org.autojs.autoxjs                   D  onException result =======================



        //上传失败文件
        LogFileUtils.INSTANCE.uploadLogFileToServer("fail");
        try {
            Thread.sleep(3000);
        } catch (InterruptedException ex) {
            throw new RuntimeException(ex);
        }
        AutoJs.getInstance().getScriptEngineService().stopAllAndToast();


    }

}
