var global = this;

runtime.init();

(function () {
    //重定向importClass使得其支持字符串参数
    global.importClass =
        (function () {
            var __importClass__ = importClass;
            return function (pack) {
                if (typeof (pack) == "string") {
                    __importClass__(Packages[pack]);
                } else {
                    __importClass__(pack);
                }
            }
        })();

    //内部函数
    global.__asGlobal__ = function (obj, functions) {
        var len = functions.length;
        for (var i = 0; i < len; i++) {
            var funcName = functions[i];
            var func = obj[funcName]
            if (!func) {
                continue;
            }
            global[funcName] = func.bind(obj);
        }
    }

    global.__exitIfError__ = function (action, defReturnValue) {
        try {
            return action();
        } catch (err) {
            if (err instanceof java.lang.Throwable) {
                exit(err);
            } else if (err instanceof Error) {
                exit(new org.mozilla.javascript.EvaluatorException(err.name + ": " + err.message, err.fileName, err.lineNumber));
            } else {
                exit();
            }
            return defReturnValue;
        }
    };

    // 初始化基础模块
    global.timers = require('__timers__.js')(runtime, global);

    //初始化不依赖环境的模块
    global.JSON = require('__json2__.js');
    global.util = global.$util = require('__util__.js');
    global.device = runtime.device;

    global.process = require('process')
    global.Promise = require('bluebird');


    //初始化全局函数
    require("__globals__")(runtime, global);
    // 启动时只加载核心模块，images 改为懒加载以降低不涉及找图/截屏脚本的内存占用
    (function (scope) {
        var modules = ['app', 'automator', 'console', 'dialogs', 'files', 'io', 'selector', 'shell', 'web', 'ui',
            "threads", "events", "engines", "floaty",
            "continuation", "$base64", "$crypto"];
        var len = modules.length;
        for (var i = 0; i < len; i++) {
            var m = modules[i];
            let module = require('__' + m + '__')(scope.runtime, scope);
            scope[m] = module;
            if (!m.startsWith('$')) {
                scope['$' + m] = module;
            }
        }
    })(global);

    // 重型/可选模块懒加载：首次访问时才 require，避免未使用时加载 Paddle/OCR/Images 等
    (function () {
        var lazyNames = ['images', 'paddle', 'sensors', 'media', 'plugins', 'RootAutomator', 'http', 'storages', '$zip'];
        for (var i = 0; i < lazyNames.length; i++) {
            (function (name) {
                var cached;
                Object.defineProperty(global, name, {
                    get: function () {
                        if (!cached) {
                            if (typeof console !== 'undefined' && console.log) {
                                console.log('AUTOX_PERF: 懒加载模块首次加载: ' + name);
                            }
                            cached = require('__' + name + '__')(runtime, global);
                            global['$' + name] = cached;
                        }
                        return cached;
                    },
                    configurable: true,
                    enumerable: true
                });
            })(lazyNames[i]);
        }
    })();

    // images 懒加载后，requestScreenCapture/captureScreen 等不再在启动时挂到全局；这里为常用名加懒 getter，兼容直接写 requestScreenCapture() 的脚本
    (function () {
        var imageGlobalNames = ['requestScreenCapture', 'captureScreen', 'findImage', 'findImageInRegion', 'findColor', 'findColorInRegion', 'findColorEquals', 'findMultiColors'];
        for (var i = 0; i < imageGlobalNames.length; i++) {
            (function (name) {
                if (global[name] !== undefined) return;
                Object.defineProperty(global, name, {
                    get: function () {
                        var im = global.images;
                        return im && im[name];
                    },
                    configurable: true,
                    enumerable: true
                });
            })(imageGlobalNames[i]);
        }
    })();

    importClass(android.view.KeyEvent);
    importClass(com.stardust.autojs.core.util.Shell);
    importClass(android.graphics.Paint);
    Canvas = com.stardust.autojs.core.graphics.ScriptCanvas;
    Image = com.stardust.autojs.core.image.ImageWrapper;
    OkHttpClient = Packages["okhttp3"].OkHttpClient;
    Intent = android.content.Intent;

    //重定向require以便支持相对路径和npm模块
    Module = require("jvm-npm.js");
    require = Module.require;


})();


