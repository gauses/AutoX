package org.autojs.autojs.autojs;

import android.util.Log;

import com.stardust.app.GlobalAppContext;
import com.stardust.autojs.core.console.LogFileUtils;
import com.stardust.autojs.execution.ScriptExecution;
import com.stardust.autojs.execution.ScriptExecutionListener;

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




    }

    @Override
    public void onException(ScriptExecution execution, Throwable e) {
        onFinish(execution);
        Log.d("ScriptExecutionGlobal" , "onException result ======================= " );
        Log.d("ScriptExecutionGlobal" , "onException result = " + e.toString());
        Log.d("ScriptExecutionGlobal" , "onException result = " + execution.getSource().toString());
        Log.d("ScriptExecutionGlobal" , "onException result = " + execution.getConfig().toString());
        Log.d("ScriptExecutionGlobal" , "onException result ======================= " );

        //上传文件
        LogFileUtils.INSTANCE.uploadLogFileToServer("fail");
        try {
            Thread.sleep(3000);
        } catch (InterruptedException ex) {
            throw new RuntimeException(ex);
        }
        AutoJs.getInstance().getScriptEngineService().stopAllAndToast();


    }

}
