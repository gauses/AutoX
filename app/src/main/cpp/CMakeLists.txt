cmake_minimum_required(VERSION 3.4.1)

# 设置C++标准
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 包含头文件目录
include_directories(${CMAKE_CURRENT_SOURCE_DIR})

# 添加编译选项
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra")

# 添加源文件
add_library(
    native-lib
    SHARED
    native-lib.cpp
)

# 查找系统库
find_library(
    log-lib
    log
)

# 链接库
target_link_libraries(
    native-lib
    ${log-lib}
)
