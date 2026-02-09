// build-logic 为 includeBuild 的根项目，默认没有 clean 任务。
// 提供空 clean 任务，避免根工程执行 clean 时报 :build-logic:clean 找不到。
tasks.register("clean", Delete::class) {
    delete(layout.buildDirectory)
}
