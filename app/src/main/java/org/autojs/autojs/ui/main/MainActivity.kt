package org.autojs.autojs.ui.main

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Process
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsBottomHeight
import androidx.compose.foundation.layout.windowInsetsTopHeight
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.material.BottomNavigation
import androidx.compose.material.BottomNavigationItem
import androidx.compose.material.ContentAlpha
import androidx.compose.material.DrawerState
import androidx.compose.material.DropdownMenu
import androidx.compose.material.DropdownMenuItem
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.material.LocalContentAlpha
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ProvideTextStyle
import androidx.compose.material.Scaffold
import androidx.compose.material.ScaffoldState
import androidx.compose.material.Surface
import androidx.compose.material.Switch
import androidx.compose.material.Text
import androidx.compose.material.TopAppBar
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.primarySurface
import androidx.compose.material.rememberScaffoldState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.widget.ViewPager2
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.google.accompanist.systemuicontroller.rememberSystemUiController
import com.google.gson.Gson
import com.stardust.app.GlobalAppContext
import com.stardust.app.permission.DrawOverlaysPermission
import com.stardust.autojs.execution.ExecutionConfig
import com.stardust.autojs.script.ScriptSource
import com.stardust.toast
import com.stardust.view.accessibility.AccessibilityNotificationObserver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import org.autojs.autojs.App
import org.autojs.autojs.Pref
import org.autojs.autojs.alioss.LogFileUtils
import org.autojs.autojs.autojs.AutoJs
import org.autojs.autojs.external.ScriptIntents
import org.autojs.autojs.external.foreground.ForegroundService
import org.autojs.autojs.timing.TimedTaskScheduler
import org.autojs.autojs.ui.build.ProjectConfigActivity
import org.autojs.autojs.ui.common.ScriptOperations
import org.autojs.autojs.ui.compose.theme.AutoXJsTheme
import org.autojs.autojs.ui.compose.widget.MyIcon
import org.autojs.autojs.ui.compose.widget.SearchBox2
import org.autojs.autojs.ui.explorer.ExplorerViewKt
import org.autojs.autojs.ui.floating.FloatyWindowManger
import org.autojs.autojs.ui.log.LogActivityKt
import org.autojs.autojs.ui.main.components.LogButton
import org.autojs.autojs.ui.main.drawer.DrawerPage
import org.autojs.autojs.ui.main.log.MainLogFragment
import org.autojs.autojs.ui.main.scripts.ScriptListFragment
import org.autojs.autojs.ui.main.task.TaskManagerFragmentKt
import org.autojs.autojs.ui.nestjs.NestUtils
import org.autojs.autojs.ui.util.launchActivity
import org.autojs.autojs.ui.widget.fillMaxSize
import org.autojs.autoxjs.CpuInfoDetector
import org.autojs.autoxjs.R
import org.json.JSONObject
import java.io.File
import java.net.URLDecoder
import kotlin.concurrent.thread


data class BottomNavigationItem(val icon: Int, val label: String)

class MainActivity : FragmentActivity() {

    companion object {
        const val EXTRA_OPEN_LOG_TAB = "open_log_tab"

        @JvmStatic
        fun getIntent(context: Context) = Intent(context, MainActivity::class.java)
    }

    /** 由 LogActivityKt 跳转时传入，MainPage 会切到日志 tab 并清空 */
    private val requestedPageState = mutableStateOf<Int?>(null)

    private val scriptListFragment by lazy { ScriptListFragment() }
    private val taskManagerFragment by lazy { TaskManagerFragmentKt() }
    private val logListFragment by lazy { MainLogFragment() }
    private var lastBackPressedTime = 0L
    private var drawerState: DrawerState? = null
    private val viewPager: ViewPager2 by lazy { ViewPager2(this) }
    private var scope: CoroutineScope? = null
    private var permissionResult: ActivityResultLauncher<Intent>? = null

    @OptIn(ExperimentalPermissionsApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        Log.i("MainActivity", "Pid: ${Process.myPid()}")
        if (Pref.isForegroundServiceEnabled()) ForegroundService.start(this)
        else ForegroundService.stop(this)

//        NestUtils.writeFileToSd(this)

        if (Pref.isFloatingMenuShown() && !FloatyWindowManger.isCircularMenuShowing()) {
            if (DrawOverlaysPermission.isCanDrawOverlays(this)) FloatyWindowManger.showCircularMenu()
            else Pref.setFloatingMenuShown(false)
        }
        if (intent.getBooleanExtra(EXTRA_OPEN_LOG_TAB, false)) {
            requestedPageState.value = 2
        }
        setContent {
            scope = rememberCoroutineScope()
            AutoXJsTheme {
                Surface(color = MaterialTheme.colors.background) {
                    val permission = rememberExternalStoragePermissionsState {
                        if (it) {
                            scriptListFragment.explorerView.onRefresh()
                        }
                    }
                    LaunchedEffect(key1 = Unit, block = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                            if (Environment.isExternalStorageManager()) {
                                scriptListFragment.explorerView.onRefresh()
                            } else {
                                requestManagePermission()
                            }
                        } else {
                            permission.launchMultiplePermissionRequest()
                        }
                    })
                    MainPage(
                        activity = this,
                        scriptListFragment = scriptListFragment,
                        taskManagerFragment = taskManagerFragment,
                        logListFragment = logListFragment,
                        onDrawerState = {
                            this.drawerState = it
                        },
                        viewPager = viewPager,
                        requestedPageState = this@MainActivity.requestedPageState
                    )
                }
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            permissionResult = registerForActivityResult(
                ActivityResultContracts.StartActivityForResult()
            ) {
                if (it.resultCode == Activity.RESULT_OK) {
                    if (Environment.isExternalStorageManager()) {
                        scriptListFragment.explorerView.onRefresh()
                    } else {
                        toast(this@MainActivity, R.string.text_no_file_rw_permission)
                    }
                }
            }
        }
        checkNoticePermission()


        val containerId = CpuInfoDetector.getContainerId()
        Log.d("AutoJs", "containerId = $containerId")
        Toast.makeText(this, "containerId = $containerId" , Toast.LENGTH_LONG).show()


    }

    private fun checkNoticePermission() {
        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) {
            AlertDialog.Builder(this@MainActivity)
                .setTitle("需要通知权限")
                .setMessage("高版本系统需要通知权Toast才能正常显示")
                .setPositiveButton(
                    getString(R.string.ok)
                ) { _, _ ->
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && ContextCompat.checkSelfPermission(
                            this,
                            Manifest.permission.POST_NOTIFICATIONS
                        ) != PackageManager.PERMISSION_GRANTED
                    ) {
                        requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 10086)
                    } else {
                        openNoticeSet()
                    }
                }
                .setNegativeButton(
                    R.string.cancel
                ) { _, _ -> }.create().show()
        } else {
            Log.i("Notice", "normal")
        }
    }

    private fun openNoticeSet() {
        try {
            val localIntent = Intent()
            localIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                localIntent.action = Settings.ACTION_APP_NOTIFICATION_SETTINGS
                localIntent.putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                startActivity(localIntent)
                return
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                localIntent.action = "android.settings.APP_NOTIFICATION_SETTINGS"
                localIntent.putExtra("app_package", packageName)
                localIntent.putExtra("app_uid", applicationInfo?.uid)
                startActivity(localIntent)
                return
            }
            if (Build.VERSION.SDK_INT == Build.VERSION_CODES.KITKAT) {
                localIntent.action = Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                localIntent.addCategory(Intent.CATEGORY_DEFAULT)
                localIntent.data = Uri.parse("package:" + packageName)
                startActivity(localIntent)
                return
            }
            //4.4以下没有从app跳转到应用通知设置页面的Action，可考虑跳转到应用详情页面,
            if (Build.VERSION.SDK_INT >= 9) {
                localIntent.action = "android.settings.APPLICATION_DETAILS_SETTINGS"
                localIntent.data = Uri.fromParts("package", packageName, null)
                startActivity(localIntent)
                return
            }

            localIntent.action = Intent.ACTION_VIEW
            localIntent.setClassName(
                "com.android.settings",
                "com.android.setting.InstalledAppDetails"
            )
            localIntent.putExtra("com.android.settings.ApplicationPkgName", packageName)
        } catch (e: Exception) {
            e.printStackTrace()
            toast(this, "跳转失败请手动为应用打开通知权限")
        }
    }

    private fun requestManagePermission() {
        AlertDialog.Builder(this@MainActivity)
            .setTitle("需要管理所有文件权限")
            .setMessage("由于权限变更，Android 11以上版本需要管理所有文件权限才能正常使用")
            .setPositiveButton(
                getString(R.string.ok)
            ) { _, _ ->
                val permissionIntent =
                    Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
                permissionIntent.setData(Uri.parse("package:$packageName"))
                permissionResult?.launch(permissionIntent)
            }
            .setNegativeButton(
                R.string.cancel
            ) { _, _ ->
                toast(
                    this@MainActivity,
                    R.string.text_no_file_rw_permission
                )
            }
            .create().show()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (intent.getBooleanExtra(EXTRA_OPEN_LOG_TAB, false)) {
            requestedPageState.value = 2
        }
    }

    override fun onResume() {
        super.onResume()
        TimedTaskScheduler.ensureCheckTaskWorks(application)

        var a1 = intent.getStringExtra("net_script_name")
        if (a1 == null) {
            a1 = ""
        }



        intent.getStringExtra("net_script_name")?.let {
            Log.d("sb", "MainActivity script name = $it")
            if (!TextUtils.isEmpty(it)) {

                //初始化保存日志到本地的文件
//                LogFileUtils.initLogFileName()


                val json = JSONObject(URLDecoder.decode(it, "UTF-8"))
                Log.d("sb", "MainActivity script json = $json")
                LogFileUtils.writeJsonToFile(this , "net_script_name", json.toString())

//                val scriptFilePath = NestUtils.appendNameToScript(this, json.getString("automation_id")) ////net_script_name是JSON
                val scriptFilePath = NestUtils.appendNameToScript(this, json.getString("rpa_uuid")) ////net_script_name是JSON

                Log.d("sb", "MainActivity script scriptFilePath = $scriptFilePath")
                Log.d("sb", "MainActivity script scriptFilePath.path = ${scriptFilePath?.path}")
                ScriptIntents.handleIntent(this, intent.setData(Uri.parse(scriptFilePath?.path)))
                LogActivityKt.start(this)
                // 清除 net_script_name，避免从 LogActivity 按返回键回到 MainActivity 时 onResume 再次触发执行脚本
                intent.removeExtra("net_script_name")
            }
        }
    }

    @SuppressLint("MissingSuperCall")
    override fun onBackPressed() {
        if (drawerState?.isOpen == true) {
            scope?.launch { drawerState?.close() }
            return
        }
        if (viewPager.currentItem == 0 && scriptListFragment.onBackPressed()) {
            return
        }
        if (viewPager.currentItem != 0) {
            viewPager.currentItem = 0
            return
        }
        back()
    }

    private fun back() {
        val currentTime = System.currentTimeMillis()
        val interval = currentTime - lastBackPressedTime
        if (interval > 2000) {
            lastBackPressedTime = currentTime
            Toast.makeText(
                this,
                getString(R.string.text_press_again_to_exit),
                Toast.LENGTH_SHORT
            ).show()
        } else super.onBackPressed()
    }
}

@Composable
fun MainPage(
    activity: FragmentActivity,
    scriptListFragment: ScriptListFragment,
    taskManagerFragment: TaskManagerFragmentKt,
    logListFragment: MainLogFragment,
    onDrawerState: (DrawerState) -> Unit,
    viewPager: ViewPager2,
    requestedPageState: MutableState<Int?>
) {
    val context = LocalContext.current
    val scaffoldState = rememberScaffoldState()
    onDrawerState(scaffoldState.drawerState)
    val scope = rememberCoroutineScope()

    val bottomBarItems = remember {
        getBottomItems(context)
    }
    var currentPage by remember {
        mutableStateOf(0)
    }

    LaunchedEffect(requestedPageState.value) {
        requestedPageState.value?.let { page ->
            currentPage = page
            requestedPageState.value = null
        }
    }

    SetSystemUI(scaffoldState)

    Scaffold(
        modifier = Modifier
            .fillMaxSize(),
        scaffoldState = scaffoldState,
        drawerGesturesEnabled = scaffoldState.drawerState.isOpen,
        topBar = {
            Surface(elevation = 4.dp, color = MaterialTheme.colors.primarySurface) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Spacer(
                        modifier = Modifier
                            .windowInsetsTopHeight(WindowInsets.statusBars)
                    )
                    TopBar(
                        currentPage = currentPage,
                        requestOpenDrawer = {
                            scope.launch { scaffoldState.drawerState.open() }
                        },
                        onSearch = { keyword ->
                            scriptListFragment.explorerView.setFilter { it.name.contains(keyword) }
                        },
                        scriptListFragment = scriptListFragment
                    )
                    val buildConfig = GlobalAppContext.buildConfig
                    Text(
                        text = "对应版本号：${buildConfig.VERSION_NAME}  更新日期：${buildConfig.BUILD_TIME}",
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.caption,
                        color = MaterialTheme.colors.onSurface
                    )
                }
            }
        },
        bottomBar = {
            Surface(elevation = 4.dp, color = MaterialTheme.colors.surface) {
                Column {
                    BottomBar(bottomBarItems, currentPage, onSelectedChange = { currentPage = it })
                    Spacer(
                        modifier = Modifier
                            .windowInsetsBottomHeight(WindowInsets.navigationBars)
                    )
                }
            }
        },
        drawerContent = {
            DrawerPage()
        },

        ) {
        AndroidView(
            modifier = Modifier.padding(it),
            factory = {
                viewPager.apply {
                    fillMaxSize()
                    adapter = ViewPager2Adapter(
                        activity,
                        scriptListFragment,
                        taskManagerFragment,
                        logListFragment
                    )
                    offscreenPageLimit = 2
                    isUserInputEnabled = false
                    ViewCompat.setNestedScrollingEnabled(this, true)
                }
            },
            update = { viewPager0 ->
                viewPager0.currentItem = currentPage
            }
        )
    }
}


fun showExternalStoragePermissionToast(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        Toast.makeText(
            context,
            "需要管理所有文件权限",
            Toast.LENGTH_SHORT
        ).show()
    } else {
        Toast.makeText(
            context,
            context.getString(R.string.text_please_enable_external_storage),
            Toast.LENGTH_SHORT
        ).show()
    }

}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun rememberExternalStoragePermissionsState(onPermissionsResult: (allAllow: Boolean) -> Unit) =
    rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        ),
        onPermissionsResult = { map ->
            onPermissionsResult(map.all { it.value })
        })

@Composable
private fun SetSystemUI(scaffoldState: ScaffoldState) {
    val systemUiController = rememberSystemUiController()
    val useDarkIcons =
        if (MaterialTheme.colors.isLight) {
            scaffoldState.drawerState.isOpen || scaffoldState.drawerState.isAnimationRunning
        } else false

    val navigationUseDarkIcons = MaterialTheme.colors.isLight
    SideEffect {
        systemUiController.setStatusBarColor(
            color = Color.Transparent,
            darkIcons = useDarkIcons
        )
        systemUiController.setNavigationBarColor(
            Color.Transparent,
            darkIcons = navigationUseDarkIcons
        )
    }
}

private fun getBottomItems(context: Context) = mutableStateListOf(
    BottomNavigationItem(
        R.drawable.ic_home,
        context.getString(R.string.text_home)
    ),
    BottomNavigationItem(
        R.drawable.ic_manage,
        context.getString(R.string.text_management)
    ),
    BottomNavigationItem(
        R.drawable.ic_logcat,
        context.getString(R.string.text_log)
    )
)

@Composable
fun BottomBar(
    items: List<BottomNavigationItem>,
    currentSelected: Int,
    onSelectedChange: (Int) -> Unit
) {
    BottomNavigation(elevation = 0.dp, backgroundColor = MaterialTheme.colors.background) {
        items.forEachIndexed { index, item ->
            val selected = currentSelected == index
            val color = if (selected) MaterialTheme.colors.primary else Color.Gray
            BottomNavigationItem(
                selected = selected,
                onClick = {
                    if (!selected) {
                        onSelectedChange(index)
                    }
                },
                icon = {
                    Icon(
                        painter = painterResource(id = item.icon),
                        contentDescription = item.label,
                        tint = color
                    )
                },
                label = {
                    Text(text = item.label, color = color)
                }
            )
        }
    }
}

@Composable
private fun TopBar(
    currentPage: Int,
    requestOpenDrawer: () -> Unit,
    onSearch: (String) -> Unit,
    scriptListFragment: ScriptListFragment,
) {
    var isSearch by remember {
        mutableStateOf(false)
    }
    val context = LocalContext.current
    TopAppBar(elevation = 0.dp) {
        CompositionLocalProvider(
            LocalContentAlpha provides ContentAlpha.high,
        ) {
            if (!isSearch) {
                IconButton(onClick = requestOpenDrawer) {
                    Icon(
                        imageVector = Icons.Default.Menu,
                        contentDescription = stringResource(id = R.string.text_menu),
                    )
                }

                ProvideTextStyle(value = MaterialTheme.typography.h6) {
                    Text(
                        modifier = Modifier.weight(1f),
                        text = stringResource(id = R.string.app_name)
                    )
                }
                if (currentPage == 0) {
                    IconButton(onClick = { isSearch = true }) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = stringResource(id = R.string.text_search)
                        )
                    }
                }
            } else {
                IconButton(onClick = {
                    isSearch = false
                    onSearch("")
                }) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = stringResource(id = R.string.text_exit_search)
                    )
                }

                var keyword by remember {
                    mutableStateOf("")
                }
                SearchBox2(
                    value = keyword,
                    onValueChange = { keyword = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text(text = stringResource(id = R.string.text_search)) },
                    keyboardActions = KeyboardActions(onSearch = {
                        onSearch(keyword)
                    })
                )
                if (keyword.isNotEmpty()) {
                    IconButton(onClick = { keyword = "" }) {
                        Icon(
                            imageVector = Icons.Default.Clear,
                            contentDescription = null
                        )
                    }
                }
            }
            LogButton()
            when (currentPage) {
                0 -> {
                    var expanded by remember { mutableStateOf(false) }
                    Box() {
                        IconButton(onClick = { expanded = true }) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = stringResource(id = R.string.desc_more)
                            )
                        }
                        TopAppBarMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false },
                            scriptListFragment = scriptListFragment
                        )
                    }
                }
                1 -> {
                    IconButton(onClick = { AutoJs.getInstance().scriptEngineService.stopAll() }) {
                        Icon(
                            imageVector = Icons.Default.Clear,
                            contentDescription = stringResource(id = R.string.desc_more)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TopAppBarMenu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    offset: DpOffset = DpOffset.Zero,
    scriptListFragment: ScriptListFragment
) {
    DropdownMenu(expanded = expanded, onDismissRequest = onDismissRequest, offset = offset) {
        val context = LocalContext.current
        NewDirectory(context, scriptListFragment, onDismissRequest)
        NewFile(context, scriptListFragment, onDismissRequest)
        ImportFile(context, scriptListFragment, onDismissRequest)
        NewProject(context, scriptListFragment, onDismissRequest)
//        DropdownMenuItem(onClick = { /*TODO*/ }) {
//            MyIcon(
//                painter = painterResource(id = R.drawable.ic_timed_task),
//                contentDescription = stringResource(id = R.string.text_switch_timed_task_scheduler)
//            )
//            Spacer(modifier = Modifier.width(8.dp))
//            Text(text = stringResource(id = R.string.text_switch_timed_task_scheduler))
//        }
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
private fun NewDirectory(
    context: Context,
    scriptListFragment: ScriptListFragment,
    onDismissRequest: () -> Unit
) {
    val permission = rememberExternalStoragePermissionsState {
        if (it) getScriptOperations(
            context,
            scriptListFragment.explorerView
        ).newDirectory()
        else showExternalStoragePermissionToast(context)
    }
    DropdownMenuItem(onClick = {
        onDismissRequest()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (Environment.isExternalStorageManager()) {
                getScriptOperations(
                    context,
                    scriptListFragment.explorerView
                ).newDirectory()
            } else {
                showExternalStoragePermissionToast(context)
            }
        } else {
            permission.launchMultiplePermissionRequest()
        }
    }) {
        MyIcon(
            painter = painterResource(id = R.drawable.ic_floating_action_menu_dir),
            contentDescription = null
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(text = stringResource(id = R.string.text_directory))
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
private fun NewFile(
    context: Context,
    scriptListFragment: ScriptListFragment,
    onDismissRequest: () -> Unit
) {
    val permission = rememberExternalStoragePermissionsState {
        if (it) getScriptOperations(
            context,
            scriptListFragment.explorerView
        ).newFile()
        else showExternalStoragePermissionToast(context)
    }
    DropdownMenuItem(onClick = {
        onDismissRequest()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (Environment.isExternalStorageManager()) {
                getScriptOperations(
                    context,
                    scriptListFragment.explorerView
                ).newFile()
            } else {
                showExternalStoragePermissionToast(context)
            }
        } else {
            permission.launchMultiplePermissionRequest()
        }
    }) {
        MyIcon(
            painter = painterResource(id = R.drawable.ic_floating_action_menu_file),
            contentDescription = null
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(text = stringResource(id = R.string.text_file))
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
private fun ImportFile(
    context: Context,
    scriptListFragment: ScriptListFragment,
    onDismissRequest: () -> Unit
) {
    val permission = rememberExternalStoragePermissionsState {
        if (it) getScriptOperations(
            context,
            scriptListFragment.explorerView
        ).importFile()
        else showExternalStoragePermissionToast(context)
    }
    DropdownMenuItem(onClick = {
        onDismissRequest()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (Environment.isExternalStorageManager()) {
                getScriptOperations(
                    context,
                    scriptListFragment.explorerView
                ).importFile()
            } else {
                showExternalStoragePermissionToast(context)
            }
        } else {
            permission.launchMultiplePermissionRequest()
        }
    }) {
        MyIcon(
            painter = painterResource(id = R.drawable.ic_floating_action_menu_open),
            contentDescription = null
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(text = stringResource(id = R.string.text_import))
    }
}

@Composable
private fun NewProject(
    context: Context,
    scriptListFragment: ScriptListFragment,
    onDismissRequest: () -> Unit
) {
    DropdownMenuItem(onClick = {
        onDismissRequest()
        context.launchActivity<ProjectConfigActivity> {
            putExtra(
                ProjectConfigActivity.EXTRA_PARENT_DIRECTORY,
                scriptListFragment.explorerView.currentPage?.path
            )
            putExtra(ProjectConfigActivity.EXTRA_NEW_PROJECT, true)
        }
    }) {
        MyIcon(
            painter = painterResource(id = R.drawable.ic_project2),
            contentDescription = null
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(text = stringResource(id = R.string.text_project))
    }
}

private fun getScriptOperations(
    context: Context,
    explorerView: ExplorerViewKt
): ScriptOperations {
    return ScriptOperations(
        context,
        explorerView,
        explorerView.currentPage
    )
}