package org.autojs.autojs.ui.main.log

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.viewinterop.AndroidView
import androidx.fragment.app.Fragment
import com.stardust.autojs.R as AutoJsR
import com.stardust.autojs.core.console.ConsoleView
import org.autojs.autojs.autojs.AutoJs
import org.autojs.autojs.ui.compose.theme.AutoXJsTheme
import org.autojs.autojs.ui.widget.fillMaxSize

/**
 * 主界面「日志」页：在截图红框位置展示本地执行日志，可上下滑动，新日志时自动滚到底部。
 */
class MainLogFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ComposeView(requireContext()).apply {
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
            setContent {
                AutoXJsTheme {
                    MainLogContent()
                }
            }
        }
    }

    @Composable
    private fun MainLogContent() {
        val globalConsole = remember { AutoJs.getInstance().globalConsole }
        Scaffold(modifier = Modifier.fillMaxSize()) { paddingValues ->
            AndroidView(
                modifier = Modifier
                    .padding(paddingValues)
                    .fillMaxSize(),
                factory = { context ->
                    ConsoleView(context).apply {
                        fillMaxSize()
                        setConsole(globalConsole)
                        findViewById<View>(AutoJsR.id.input_container).visibility = View.GONE
                    }
                },
                update = { view ->
                    view.colors.apply {
                        put(Log.VERBOSE, -0x203f3f40)
                        put(Log.DEBUG, -0x34000000)
                    }
                }
            )
        }
    }
}
