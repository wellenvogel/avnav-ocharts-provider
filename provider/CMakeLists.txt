# ---------------------------------------------------------------------------
# Author:      Dave Register DEB / Andreas Vogel
# config from: antonm - Anton Martchukov <anton@martchukov.com>
# Update:      sethdart (Jean-Eudes Onfray)
#                 with parts from balp (Anders Arnholm)
# ***************************************************************************
# - Copyright (C) 2010 by David S. Register                               *
#                 2020 by Andreas Vogel                                   *
# - This program is free software; you can redistribute it and/or modify  *
# - it under the terms of the GNU General Public License as published by  *
# - the Free Software Foundation; either version 2 of the License, or     *
# - (at your option) any later version.                                   *
# - *
# - This program is distributed in the hope that it will be useful,       *
# - but WITHOUT ANY WARRANTY; without even the implied warranty of        *
# - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
# - GNU General Public License for more details.                          *
# - *
# - You should have received a copy of the GNU General Public License     *
# - along with this program; if not, write to the                         *
# - Free Software Foundation, Inc.,                                       *
# - 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301,  USA.         *
# ***************************************************************************
#[[

Configuring AvNav Ocharts Provider
===================

Help:
    AvNavOchartsProvider configuration options can be listed using
        cmake -LH  | grep -B1 AVNAV_


Installation paths:
  - Use CMAKE_INSTALL_LIBDIR to change the base directory for plugins;
    defaults to library location on most platforms, but is 'lib' on
    Debian.

Bundled libraries:
  - AVNAV_USE_BUNDLED_LIBS forces use of external/bundled libraries including
    wxsvg and liblz4. It's either:
      - ON => use all bundled libraries.
      - OFF => Always use external (system) libraries if available.
      - A comma-separated list of libraries where the bundled variant
        should be used. For other libraries, system libs is preferred.
  - If found, the system tinyxml library is used unconditionally.

Documentation:
  - AVNAV_BUNDLE_DOCS governs inclusion of docs in the package.
  


To build for android, use something like:
    $cmake -DUSE_GARMINHOST=OFF
        -D_wx_selected_config=androideabi-qt
        -DCMAKE_TOOLCHAIN_FILE=../buildandroid/build_android.cmake
        -DwxQt_Build=build_android_53
       	-DwxQt_Base=/home/dsr/Projects/wxqt/wxWidgets
        -DQt_Base /home/dsr/Qt/5.3)
        ..

Silent/Verbose builds:
    cmake's handling of these issues is underwhelming. On most platforms the
    builds are by default verbose. Use 'cmake AVNAV_VERBOSE=OFF' to make
    a silent build. The AVNAV_VERBOSE value can be overridden using
    'make VERBOSE=1' or 'make -s'
#]]
#[[
TODO:
- Profiling opt
- test with Win & OSX
USE_GLU_TESS
USE_GLU_DLL
I also find it deficient in some areas. For instance, I cannot make it
output a VS project with certain compile switches set as desired,
namely /MT vs /MD. This means I must manually set this and other compiler
options after the CMake step. Sometimes I forget. Grrr...
set /MT for Release build, and /MTd for debug.
Is this still problem? If so, generator expressions seem to be the solution.
#]]

cmake_minimum_required(VERSION 3.1.1)
cmake_policy(SET CMP0043 NEW)
cmake_policy(SET CMP0025 NEW)
if (POLICY CMP0057)
  cmake_policy(SET CMP0057 NEW)
endif ()
if (POLICY CMP0077)
  cmake_policy(SET CMP0077 NEW)
endif ()

message(STATUS "CMAKE_BUILD_TYPE: ${CMAKE_BUILD_TYPE}")

# Prefer libGL.so to libOpenGL.so, see CMP0072
set(OpenGL_GL_PREFERENCE "LEGACY")

option(AVNAV_USE_GL "Enable OpenGL support" ON)
project(AvnavOchartsProvider)

if (AVNAV_VERBOSE)
  set(CMAKE_VERBOSE_MAKEFILE ON)
endif ()

message(STATUS "cmake version: ${CMAKE_VERSION}")

if (APPLE)
  set(PACKAGE_NAME AvnavOchartsProvider)
else (APPLE)
  set(PACKAGE_NAME AvnavOchartsProvider)
endif (APPLE)

# Locations where cmake looks for cmake modules.
set(
  CMAKE_MODULE_PATH
  ${CMAKE_SOURCE_DIR}/build
  ${CMAKE_SOURCE_DIR}/
  ${CMAKE_SOURCE_DIR}/cmake
)

IF(DEFINED _wx_selected_config)
  MESSAGE (STATUS "selected config ${_wx_selected_config}")
  IF(_wx_selected_config MATCHES "androideabi-qt")
    MESSAGE (STATUS "Building for wxQt-Android")
    SET(QT_ANDROID "ON")
  ENDIF(_wx_selected_config MATCHES "androideabi-qt")
ENDIF(DEFINED _wx_selected_config)

include(FindPkgConfig)
include(CMakeDependentOption)

#
# Options
#


option(AVNAV_VERBOSE "Make verbose builds"  ON)
option(AVNAV_PEDANTIC "Enable more compiler warnings" OFF)

set(AVNAV_PACKAGE_RELEASE "1" CACHE STRING "Package release number")

if (NOT WIN32 AND NOT APPLE AND NOT QT_ANDROID)
  option(AVNAV_FORCE_GTK3 "Force the build to use GTK3" OFF)
endif ()

if (NOT WIN32 AND NOT APPLE)
  set(PA_DEFAULT "ON")
endif ()

set(
  AVNAV_WXWIDGETS_FORCE_VERSION
  CACHE STRING "Force usage of a specific wxWidgets version."
)

set(
  AVNAV_WXWIDGETS_OPTIONS
  CACHE STRING "Additional flags to wxWidgets_CONFIG_OPTIONS"
)

if (WIN32 AND NOT UNIX)
  option(AVNAV_BUNDLE_WXDLLS "Bundle the prebuilt WX DLLs" ON)
  option(AVNAV_BUNDLE_VCDLLS "Bundle the VC redistributable libraries" ON)
  option(
    BUNDLE_LIBARCHIVEDLLS "Bundle the prebuilt LibArchive and LibLZMA DLLs" ON
  )
endif ()

if (CMAKE_VERSION VERSION_GREATER 3.4)
  option(AVNAV_ENABLE_CLANG_TIDY "Add clang-tidy automatically to builds" OFF)
  set(ENABLE_SANITIZER "none" CACHE STRING "Add clang sanitizer to the build")
endif ()

if (CMAKE_VERSION VERSION_GREATER 3.9)
  option(AVNAV_ENABLE_CPPCHECK "Add cppcheck automatically to builds" OFF)
endif ()

if (NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
  set(
    CMAKE_BUILD_TYPE RelWithDebInfo
    CACHE
      STRING
      "Choose type of build: None Debug Release RelWithDebInfo MinSizeRel."
    FORCE
  )
  # Set the possible values of build type for cmake-gui
  set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS
    "Debug" "Release" "MinSizeRel" "RelWithDebInfo")
endif (NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)

if (APPLE)
  option(AVNAV_USE_LIBCPP "Use libc++ instead of libstdc++ on macOS" ON)
endif ()

option(AVNAV_EXTERNAL_CURL "Use external libcurl" OFF)

if (NOT CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX ${TENTATIVE_PREFIX})
endif (NOT CMAKE_INSTALL_PREFIX)





option(AVNAV_USE_CURL "Use Curl libraries" ON)


#
# Language, compiler and static checkers setup
#

include(GetArch)
getarch()
message(STATUS "*** Build Architecture is ${ARCH}")

set(CMAKE_CXX_STANDARD 11)
message(STATUS "Setting C++11 standard via cmake standard mechanism")
if (NOT MSVC)
  set(OBJ_VISIBILITY "-fvisibility=hidden")
endif ()

if (CMAKE_VERSION VERSION_GREATER 3.4)
  if (AVNAV_ENABLE_CLANG_TIDY)
    find_program(
      CLANG_TIDY_EXE
      NAMES "clang-tidy"
      PATHS /usr/local/opt/llvm/bin
    )
    if (CLANG_TIDY_EXE)
      message(STATUS "clang-tidy found: ${CLANG_TIDY_EXE}")
      # For more, see http://clang.llvm.org/extra/clang-tidy/
      # set(CLANG_TIDY_CHECKS "-*,modernize-*")
      set(CLANG_TIDY_CHECKS "-*,performance-*")
      set(
        CMAKE_CXX_CLANG_TIDY
        "${CLANG_TIDY_EXE};-checks=${CLANG_TIDY_CHECKS};-header-filter='${CMAKE_SOURCE_DIR}/*'"
        CACHE STRING ""
        FORCE
      )
    else ()
      message(AUTHOR_WARNING "clang-tidy not found!")
      set(CMAKE_CXX_CLANG_TIDY "" CACHE STRING "" FORCE) # delete it
    endif ()
  endif ()
endif ()

if (CMAKE_VERSION VERSION_GREATER 3.4)
  # Add support for address etc sanitizers, part 1/2 (other half after
  # ADD_EXECUTABLE)
  set_property(
    CACHE ENABLE_SANITIZER
    PROPERTY
      STRINGS
      none
      address
      memory
      thread
      undefined
  )
  if (NOT "${ENABLE_SANITIZER}" MATCHES "none")
    add_compile_options(-fsanitize=${ENABLE_SANITIZER})
  endif ()
endif ()

if (CMAKE_VERSION VERSION_GREATER 3.9)
  if (AVNAV_ENABLE_CPPCHECK)
    find_program(CPPCHECK_EXECUTABLE NAMES "cppcheck")
    set(CMAKE_CXX_CPPCHECK ${CPPCHECK_EXECUTABLE})
  endif ()
endif ()

message(STATUS "Default compiler options:")
message(STATUS "CMAKE_CXX_FLAGS: ${CMAKE_CXX_FLAGS}")
message(STATUS "CMAKE_CXX_FLAGS_DEBUG: ${CMAKE_CXX_FLAGS_DEBUG}")
message(STATUS "CMAKE_CXX_FLAGS_MINSIZEREL: ${CMAKE_CXX_FLAGS_MINSIZEREL}")
message(STATUS "CMAKE_CXX_FLAGS_RELEASE: ${CMAKE_CXX_FLAGS_RELEASE}")
message(
  STATUS "CMAKE_CXX_FLAGS_RELWITHDEBINFO: ${CMAKE_CXX_FLAGS_RELWITHDEBINFO}"
)
# ADD_COMPILE_OPTIONS( "-Wall" "-ansi" "-pedantic" "-Wno-variadic-macros" )
# TODO: Should we use  -fno-stack-protector IF NOT DEBUGGING CFLAGS="-O2
# -march=native"
if (NOT WIN32 AND NOT APPLE)
  set (CMAKE_EXE_LINKER_FLAGS "-Wl,-z,defs ")
  add_compile_options("-Wall")
  if (NOT AVNAV_PEDANTIC)
    add_compile_options(
      "-Wno-unused"
      "-fexceptions"
      "-rdynamic"
      "-fno-strict-aliasing"
      "-Wno-deprecated-declarations"
    )
  endif ()
  if (CMAKE_BUILD_TYPE MATCHES "Debug")
    add_compile_options("-O0")
  endif ()

  add_definitions(" -DPREFIX=\\\"${CMAKE_INSTALL_PREFIX}\\\"")
  # profiling with gprof ADD_COMPILE_OPTIONS( -pg ) SET(CMAKE_EXE_LINKER_FLAGS
  # -pg) profiling with gcov ADD_COMPILE_OPTIONS( "-fprofile-arcs -ftest-
  # coverage" ) SET(EXTRA_LIBS ${EXTRA_LIBS} "gcov")
endif (NOT WIN32 AND NOT APPLE)

if (MINGW)
  add_compile_options("-Wall")
  if (NOT AVNAV_PEDANTIC)
    add_compile_options(
      "-Wno-unused"
      "-Wno-cpp"
      "-fexceptions"
      "-fno-strict-aliasing"
    )
  endif ()
  add_definitions("-DPSAPI_VERSION=1")
  add_definitions("-DUNICODE" "-D_UNICODE")
endif (MINGW)

if (APPLE)
  add_compile_options("-Wall")
  if (NOT AVNAV_PEDANTIC)
    add_compile_options(
      "-Wno-unused"
      "-fexceptions"
      "-Wno-overloaded-virtual"
      "-fno-strict-aliasing"
      "-Wno-deprecated"
      "-Wno-deprecated-declarations"
      "-Wno-unknown-pragmas"
      "-D_WCHAR_H_CPLUSPLUS_98_CONFORMANCE_"
    )
  endif ()
endif (APPLE)

if (APPLE)
  set(CMAKE_C_FLAGS "-O2 -arch ${ARCH}")
  set(CMAKE_C_FLAGS_DEBUG "-g -O0 -arch ${ARCH}")
  set(CMAKE_C_FLAGS_MINSIZEREL "-O2 -arch ${ARCH}")
  set(CMAKE_C_FLAGS_RELEASE "-O3 -arch ${ARCH}")
  set(CMAKE_C_FLAGS_RELWITHDEBINFO "-g -O3 -arch ${ARCH}")

  if (AVNAV_USE_LIBCPP)
    set(AVNAV_LIBCPP "-stdlib=libc++")
  endif (AVNAV_USE_LIBCPP)
  set(CMAKE_CXX_FLAGS "-O2 ${AVNAV_LIBCPP} -arch ${ARCH}")
  set(CMAKE_CXX_FLAGS_DEBUG "-g -O0 ${AVNAV_LIBCPP} -arch ${ARCH}")
  set(CMAKE_CXX_FLAGS_MINSIZEREL "-O2 ${AVNAV_LIBCPP} -arch ${ARCH}")
  set(CMAKE_CXX_FLAGS_RELEASE "-O3 ${AVNAV_LIBCPP} -arch ${ARCH}")
  set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "-g -O3 ${AVNAV_LIBCPP} -arch ${ARCH}")

  set(
    CMAKE_EXE_LINKER_FLAGS
    "-O2 ${AVNAV_LIBCPP} -arch ${ARCH} ${CMAKE_EXE_LINKER_FLAGS}"
  )
  set(CMAKE_SHARED_LINKER_FLAGS "-O2 ${AVNAV_LIBCPP} -arch ${ARCH}")
  set(CMAKE_MODULE_LINKER_FLAGS "-O2 ${AVNAV_LIBCPP} -arch ${ARCH}")
endif (APPLE)

if (MSVC)
  add_definitions(-D__MSVC__)
  add_definitions(-D_CRT_NONSTDC_NO_DEPRECATE -D_CRT_SECURE_NO_DEPRECATE)
  add_definitions(-DPSAPI_VERSION=1)
endif (MSVC)

if (MSVC)
  set(CMAKE_C_FLAGS_DEBUG "/MP /MDd /Ob0 /Od  /D_DEBUG  /Zi /RTC1")
  set(CMAKE_C_FLAGS_MINSIZEREL "/MP /MD  /O1  /Ob1 /D NDEBUG")
  set(CMAKE_C_FLAGS_RELEASE "/MP /MD  /O2  /Ob2 /D NDEBUG /Zi /wd8051 /wd4068")
  set(CMAKE_C_FLAGS_RELWITHDEBINFO "/MP /MD  /O2  /Ob1 /D NDEBUG /Zi")
  set(CMAKE_CXX_FLAGS_DEBUG "/MP /MDd /Ob0 /Od  /D_DEBUG  /Zi /RTC1 /EHa")
  set(CMAKE_CXX_FLAGS_MINSIZEREL "/MP /MD  /O1  /Ob1 /D NDEBUG /EHa")
  set(CMAKE_CXX_FLAGS_RELEASE "/MP /MD  /O2  /Ob2 /D NDEBUG /Zi /EHa")
  set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "/MP /MD  /O2  /Ob1 /D NDEBUG /Zi /EHa")
  set(CMAKE_EXE_LINKER_FLAGS "/DEBUG ${CMAKE_EXE_LINKER_FLAGS}")
endif (MSVC)


if (QT_ANDROID)
  set(CMAKE_BUILD_TYPE Debug)
  add_definitions(-D__WXQT__)
  add_definitions(-D__AVNAV__ANDROID__)
  add_definitions(-DANDROID)
  set(CMAKE_CXX_FLAGS "-pthread -fPIC -O2")

  add_compile_options("-Wno-inconsistent-missing-override"
        "-Wno-potentially-evaluated-expression"
        "-Wno-overloaded-virtual"
        "-Wno-unused-command-line-argument"
        "-Wno-unknown-pragmas"
        "-O3"
        "-fPIC"
  )
  set(CMAKE_SHARED_LINKER_FLAGS "-Wl,-soname,libavnavprovider.so ")
endif (QT_ANDROID)


#
# Installation directory setup
#
if (NOT WIN32 AND NOT APPLE AND NOT QT_ANDROID)
    if (EXISTS "/usr/lib64")
        set(_LIBDIRS "~/.local/lib:/usr/local/lib64:/usr/lib64")
    elseif (EXISTS "/usr/lib/arm-linux-gnueabihf")
        set(_LIBDIRS "~/.local/lib:/usr/local/lib:/usr/lib/arm-linux-gnueabihf:/usr/lib")
    else ()
        set(_LIBDIRS "~/.local/lib:/usr/local/lib:/usr/lib")	
    endif ()
    set(AVNAV_LINUX_LOAD_PATH "${_LIBDIRS}"
        CACHE STRING "Plugin libraries directories (${_LIBDIRS})"
    )
endif ()


set(
  LINUX_LIB_PATHS
  /usr/local/lib
  /usr/local/lib64
  /usr/lib/i386-linux-gnu
  /usr/lib/x86_64-linux-gnu
  /usr/lib
  /usr/lib64
)


# set a build flag for arm architecture, to catch any rPI runtime changes
# required
if (ARCH MATCHES "arm*" AND (NOT QT_ANDROID))
  add_definitions(-DocpnARM)
endif (ARCH MATCHES "arm*" AND (NOT QT_ANDROID))

IF(DEFINED _wx_selected_config)
  IF(_wx_selected_config MATCHES "androideabi-qt")
    MESSAGE (STATUS "Qt_Base: " ${Qt_Base})
    MESSAGE (STATUS "wxQt_Base/Build: " ${wxQt_Base} "/" ${wxQt_Build})
    ADD_DEFINITIONS(-DocpnUSE_GLES)
    ADD_DEFINITIONS(-DocpnUSE_GL)
    ADD_DEFINITIONS(-DARMHF)

    SET(OPENGLES_FOUND "YES")
    SET(OPENGL_FOUND "YES")

    ADD_DEFINITIONS(-DUSE_GLU_TESS)
    SET(USE_GLES2 ON )
    MESSAGE (STATUS "Using GLESv2 for Android")
    ADD_DEFINITIONS(-DUSE_ANDROID_GLES2)
    ADD_DEFINITIONS(-DUSE_GLSL)
    INCLUDE_DIRECTORIES( ${CMAKE_SOURCE_DIR}/libs/glshim/include/GLES )

  ENDIF(_wx_selected_config MATCHES "androideabi-qt")
ENDIF(DEFINED _wx_selected_config)

if ((_wx_selected_config MATCHES "qt-armv7"))
  set(wxWidgets_FIND_COMPONENTS base core xml html adv aui)
else ()
  set(wxWidgets_FIND_COMPONENTS net xml html adv aui core base)
endif ()

if (OPENGLES_FOUND)
  set(wxWidgets_FIND_COMPONENTS ${wxWidgets_FIND_COMPONENTS} gl)
endif ()

if ((NOT OPENGLES_FOUND) AND (NOT QT_ANDROID))
  if (AVNAV_USE_GL)
    find_package(OpenGL)
  else (AVNAV_USE_GL)
    message(STATUS "OpenGL disabled by option USE_GL...")
  endif (AVNAV_USE_GL)

  if (OPENGL_FOUND)
    set(wxWidgets_FIND_COMPONENTS gl ${wxWidgets_FIND_COMPONENTS})
    include_directories(${OPENGL_INCLUDE_DIR})

    message(STATUS "Found OpenGL....")
    message(STATUS "    GL Lib: " ${OPENGL_LIBRARIES})
    message(STATUS "    GL Include: " ${OPENGL_INCLUDE_DIR})
    add_definitions(-DocpnUSE_GL)

    # We need to remove GLU from the OPENGL_LIBRARIES list
    foreach (_currentLibFile ${OPENGL_LIBRARIES})
      # MESSAGE (STATUS "    Lib File: " ${_currentLibFile})
      set(UCNAME ${_currentLibFile})
      string(TOUPPER ${UCNAME} UCNAME)
      if (NOT ${UCNAME} MATCHES "(.*)GLUXXX(.*)")
        set(
          REVISED_OPENGL_LIBRARIES ${_currentLibFile}
          ${REVISED_OPENGL_LIBRARIES}
        )
      endif ()
    endforeach (_currentLibFile)

    set(OPENGL_LIBRARIES ${REVISED_OPENGL_LIBRARIES})
    message(STATUS "    Revised GL Lib: " ${OPENGL_LIBRARIES})

  else (OPENGL_FOUND)
    message(STATUS "OpenGL not found...")
  endif (OPENGL_FOUND)

endif ()

if (NOT QT_ANDROID)
  # Find wxWidgets here, and the setting get inherited by all plugins. These
  # options can be used to set the linux widgets build type
  set(wxWidgets_USE_DEBUG OFF)
  set(wxWidgets_USE_UNICODE ON)
  set(wxWidgets_USE_UNIVERSAL OFF)
  set(wxWidgets_USE_STATIC OFF)

  if (AVNAV_WXWIDGETS_FORCE_VERSION)
      set (wxWidgets_CONFIG_OPTIONS --version=${AVNAV_WXWIDGETS_FORCE_VERSION})
  endif ()

  if (MSVC)
    # Exclude wxexpat.lib, since we use our own version. Other things are
    # excluded as well, but we don't need them
    set(wxWidgets_EXCLUDE_COMMON_LIBRARIES TRUE)
  endif (MSVC)

#  if (GTK2_FOUND)
#  set(wxWidgets_CONFIG_OPTIONS ${wxWidgets_CONFIG_OPTIONS} --toolkit=gtk2)

# if (GTK3_FOUND)
#    set(wxWidgets_CONFIG_OPTIONS ${wxWidgets_CONFIG_OPTIONS} --toolkit=gtk3)
#  endif ()
    message(STATUS "Main: ${wxWidgets_FIND_COMPONENTS}")

  find_package(wxWidgets COMPONENTS ${wxWidgets_FIND_COMPONENTS})
  add_definitions(-DwxUSE_WEBVIEW=0)
  list(REMOVE_ITEM wxWidgets_FIND_COMPONENTS webview)
  message(STATUS "Could not find wxWidgets webview add-on")
  find_package(wxWidgets COMPONENTS ${wxWidgets_FIND_COMPONENTS})
  if (MSYS)
    # Convert msys to windows paths, and handle the missing /usr
    string(
      REGEX
      REPLACE
        "/usr/local"
        ";C:/MinGW/msys/1.0/local"
        wxWidgets_INCLUDE_DIRS
        "${wxWidgets_INCLUDE_DIRS}"
    )
  endif (MSYS)
  include(${wxWidgets_USE_FILE})

  # As of cmake 3.11.2, these libraries are missing in list despite that we
  # looked for them. This is a nasty fix which might fail miserably. Assumption:
  # All builds using GTK uses unicode and wxWidgets 3.0
  if (GTK3_FOUND)
    list(APPEND wxWidgets_LIBRARIES "-lwx_gtk3u_aui-3.0")
    if (OPENGL_FOUND)
      list(APPEND wxWidgets_LIBRARIES "-lwx_gtk3u_gl-3.0")
    endif ()
  endif ()

  message(STATUS "Found wxWidgets...")
  message(STATUS " wxWidgets Include: ${wxWidgets_INCLUDE_DIRS}")
  message(STATUS " wxWidgets Libraries: ${wxWidgets_LIBRARIES}")

  # We need to remove GLU from the wxWidgets_LIBRARIES list It only appears to
  # get on the list for MSW...
  foreach (_currentLibFile ${wxWidgets_LIBRARIES})
    set(UCNAME ${_currentLibFile})
    string(TOUPPER ${UCNAME} UCNAME)
    if (NOT ${UCNAME} MATCHES "(.*)GLU(.*)")
      set(
        REVISED_wxWidgets_LIBRARIES ${REVISED_wxWidgets_LIBRARIES}
        ${_currentLibFile}
      )
    endif ()
  endforeach (_currentLibFile)
  set(wxWidgets_LIBRARIES ${REVISED_wxWidgets_LIBRARIES})

  message(STATUS " Revised wxWidgets Libraries: ${wxWidgets_LIBRARIES}")
endif (NOT QT_ANDROID)

IF(QT_ANDROID)
  SET( wxWidgets_LIBRARIES

        # Link order is critical to avoid circular dependencies
    ${wxQt_Base}/${wxQt_Build}/lib/libwx_qtu_html-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwx_baseu_xml-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwx_qtu_qa-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwx_qtu_adv-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwx_qtu_core-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwx_baseu-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwx_qtu_aui-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwxexpat-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwxregexu-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwxjpeg-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwxpng-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwx_qtu_gl-3.1-arm-linux-androideabi.a
    ${wxQt_Base}/${wxQt_Build}/lib/libwx_baseu_net-3.1-arm-linux-androideabi.a

    ${Qt_Base}/${Qt_Build}/lib/libQt5Core.so
    ${Qt_Base}/${Qt_Build}/lib/libQt5OpenGL.so
    ${Qt_Base}/${Qt_Build}/lib/libQt5Widgets.so
    ${Qt_Base}/${Qt_Build}/lib/libQt5Gui.so
    ${Qt_Base}/${Qt_Build}/lib/libQt5AndroidExtras.so

    )
ENDIF(QT_ANDROID)

message(STATUS "")
message(STATUS "*** Staging to build ${PACKAGE_NAME}  ***")
message(STATUS "*** Build type: ${CMAKE_BUILD_TYPE}")
#message(STATUS "*** Will install to ${CMAKE_INSTALL_PREFIX}  ***")

IF(QT_ANDROID)
  INCLUDE_DIRECTORIES("${Qt_Base}/${Qt_Build}/include/QtCore")
  INCLUDE_DIRECTORIES("${Qt_Base}/${Qt_Build}/include")
  INCLUDE_DIRECTORIES("${Qt_Base}/${Qt_Build}/include/QtWidgets")
  INCLUDE_DIRECTORIES("${Qt_Base}/${Qt_Build}/include/QtGui")
  INCLUDE_DIRECTORIES("${Qt_Base}/${Qt_Build}/include/QtOpenGL")
  INCLUDE_DIRECTORIES("${Qt_Base}/${Qt_Build}/include/QtTest")

  INCLUDE_DIRECTORIES(
      "${wxQt_Base}/${wxQt_Build}/lib/wx/include/arm-linux-androideabi-qt-unicode-static-3.1")
  INCLUDE_DIRECTORIES("${wxQt_Base}/include")
  include_directories("${CMAKE_SOURCE_DIR}/include")


  add_definitions(-DQT_WIDGETS_LIB)
endif (QT_ANDROID)

if (NOT AVNAV_VERSION)
    set(AVNAV_VERSION "development")
endif()
add_definitions(-DAVNAV_VERSION=${AVNAV_VERSION})

set(
  HDRS
  include/ocpn-import/georef.h
  include/ocpn-import/bbox.h
  include/ocpn-import/ocpndc.h
  include/ocpn-import/pluginmanager.h
  include/ocpn-import/ocpn_types.h
  include/ocpn-import/cutil.h
  include/ocpn-import/dychart.h
  include/ocpn-import/ocpn_plugin.h
  include/ocpn-import/pi_s52s57.h
  include/ChartInfo.h
  include/Tiles.h
  include/ChartList.h
  include/Renderer.h
  include/Logger.h
  include/RefCount.h
  include/SimpleThread.h
  include/SocketHelper.h
  include/CacheHandler.h
  src/HTTPd/Worker.h
  include/RequestQueue.h
  include/ChartSetInfo.h
  include/ChartManager.h
  include/TokenHandler.h
  include/CacheFiller.h
  include/ChartSet.h
  include/MD5.h
  include/SystemHelper.h
  include/StringHelper.h
  include/ItemStatus.h
  include/StatusCollector.h
  include/UserSettingsBase.h
  include/UserSettings.h
  include/SettingsManager.h
  include/MainQueue.h
  include/Types.h
  include/ColorTable.h
  include/S57AttributeDecoder.h
  include/TestHelper.h
  include/requestHandler/RequestHandler.h
  include/requestHandler/ChartRequestHandler.h
  include/requestHandler/TokenRequestHandler.h
  include/requestHandler/ListRequestHandler.h
  include/requestHandler/StaticRequestHandler.h
  include/requestHandler/SettingsRequestHandler.h
  include/requestHandler/UploadRequestHandler.h
  src/HTTPd/HTTPServer.h
    
  ${CMAKE_BINARY_DIR}/include/config.h
)

IF (${CMAKE_BUILD_TYPE} MATCHES "Debug")
    add_definitions(-DDEBUG)
    if (NOT AVNAV_DEBUG_STANDALONE)
      set(HDRS ${HDRS} include/publicKeyDebug.h)
    else(NOT AVNAV_DEBUG_STANDALONE)
      add_definitions(-DAVNAV_DEBUG_STANDALONE)
      set(HDRS ${HDRS} include/publicKey.h)
    endif(NOT AVNAV_DEBUG_STANDALONE)  
ELSE(${CMAKE_BUILD_TYPE} MATCHES "Debug")
    set(HDRS ${HDRS} include/publicKey.h)
ENDIF(${CMAKE_BUILD_TYPE} MATCHES "Debug")

set(
  SRCS
  src/ocpn-import/Viewport.cpp
  src/main.cpp
  src/ocpn-import/cutil.c
  src/ocpn-import/ocpndc.cpp
  src/ocpn-import/georef.cpp
  src/ocpn-import/pluginmanager.cpp
  src/ocpn-import/bbox.cpp
  src/ChartInfo.cpp
  src/ChartList.cpp
  src/Renderer.cpp
  src/Logger.cpp
  src/RefCount.cpp
  src/CacheHandler.cpp
  src/ChartSetInfo.cpp
  src/ChartManager.cpp
  src/TokenHandler.cpp
  src/MD5.cpp
  src/CacheFiller.cpp
  src/ChartSet.cpp
  src/SystemHelper.cpp
  src/StatusCollector.cpp
  src/SettingsManager.cpp
  src/MainQueue.cpp
  src/ColorTable.cpp
  src/S57AttributeDecoder.cpp
  src/HTTPd/Worker.cpp
  src/HTTPd/HTTPServer.cpp
  src/TestHelper.cpp
)


if (APPLE)
  if (DARWIN_VERSION LESS 16)
    message(
      STATUS "DarkMode not included, requires Mac build host Darwin >= 16"
    )
  else ()
    list(APPEND SRCS src/DarkMode.mm src/DarkMode.h)
    add_definitions(-DAVNAV_USE_DARKMODE)
  endif ()
endif (APPLE)


IF(QT_ANDROID)
  SET(HDRS ${HDRS} include/androidUTIL.h)
  SET(SRCS ${SRCS} src/androidUTIL.cpp)
ENDIF(QT_ANDROID)

IF(USE_GLES2)
    SET(HDRS ${HDRS} include/shaders.h)
    SET(SRCS ${SRCS} src/shaders.cpp)
ENDIF(USE_GLES2)

if (APPLE)
  add_executable(${PACKAGE_NAME} MACOSX_BUNDLE ${HDRS} ${SRCS})
elseif (WIN32)
  add_executable(${PACKAGE_NAME} WIN32 ${HDRS} ${SRCS})
elseif (QT_ANDROID)
  set_property(GLOBAL PROPERTY TARGET_SUPPORTS_SHARED_LIBS TRUE)
  add_library(${PACKAGE_NAME} SHARED ${HDRS} ${SRCS})
else ()
  add_executable(${PACKAGE_NAME} ${HDRS} ${SRCS})
endif ()


set_target_properties(
  ${PACKAGE_NAME}
  PROPERTIES
    ENABLE_EXPORTS 1
    OUTPUT_NAME ${PACKAGE_NAME}
    ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
)

target_include_directories(
  ${PACKAGE_NAME}
  PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include
  PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include/ocpn-import
  PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include/requestHandler
)

find_package(OpenSSL REQUIRED)
INCLUDE_DIRECTORIES(OPENSSL_INCLUDE_DIR)
target_link_libraries(${PACKAGE_NAME} PRIVATE ${OPENSSL_LIBRARIES})

IF (${CMAKE_BUILD_TYPE} MATCHES "Debug")
    if (NOT AVNAV_DEBUG_STANDALONE)
      set(TKHANDLER_SRC ${CMAKE_SOURCE_DIR}/tokenHandler/tokenHandlerDebug.js)
    else(NOT AVNAV_DEBUG_STANDALONE)
      set(TKHANDLER_SRC ${CMAKE_SOURCE_DIR}/tokenHandler/tokenHandler.js)
    endif(NOT AVNAV_DEBUG_STANDALONE)
ELSE(${CMAKE_BUILD_TYPE} MATCHES "Debug")
    set(TKHANDLER_SRC ${CMAKE_SOURCE_DIR}/tokenHandler/tokenHandler.js)
ENDIF(${CMAKE_BUILD_TYPE} MATCHES "Debug")

add_custom_command(
    TARGET ${PACKAGE_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
    ${TKHANDLER_SRC}
    ${CMAKE_BINARY_DIR}/tokenHandler.js)
add_custom_command(
    TARGET ${PACKAGE_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
    ${CMAKE_SOURCE_DIR}/tokenHandler/test.html
    ${CMAKE_BINARY_DIR})
IF (${CMAKE_BUILD_TYPE} MATCHES "Debug")
add_custom_command(
  TARGET ${PACKAGE_NAME} POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E create_symlink
  ../../../gui/build/debug
  ${CMAKE_BINARY_DIR}/gui)  
ENDIF()

if (APPLE)
  target_include_directories(
    ${PACKAGE_NAME}
    PRIVATE /usr/X11/include /usr/X11/include/GL
  )
endif ()

# IF(NOT WIN32) include(OcpnFindGpsd) if (TARGET ocpn::gpsd)
# target_link_libraries(${PACKAGE_NAME} ocpn::gpsd) endif () ENDIF (NOT WIN32)

find_package(Gettext REQUIRED)


#
# Linux: set up GTK
#
if (NOT WIN32 AND NOT APPLE AND NOT QT_ANDROID)
#  include(OcpnFindGtk)
#  target_link_libraries(${PACKAGE_NAME} PRIVATE ocpn::gtk)
endif (NOT WIN32 AND NOT APPLE AND NOT QT_ANDROID)

# Search for opengles, short of running a program to test the speed of
# acceleration, I simply use gles on "native linux" arm systems
if (DEFINED _wx_selected_config)
  message(STATUS "selected config ${_wx_selected_config}")
  if (_wx_selected_config MATCHES "androideabi-qt")
    message(STATUS "Building for wxQt-Android")
    message(STATUS "Qt_Base: " ${Qt_Base})
    message(STATUS "wxQt_Base/Build:  ${wxQt_Base}/${wxQt_Build}")
    set(QT_ANDROID "ON")
  endif (_wx_selected_config MATCHES "androideabi-qt")
endif (DEFINED _wx_selected_config)

if ((_wx_selected_config MATCHES "qt-armv7"))
  set(wxWidgets_FIND_COMPONENTS base core xml html adv aui)
else ()
  set(wxWidgets_FIND_COMPONENTS net xml html adv aui core base webview)
endif ()



if (OPENGLES_FOUND)
  list(APPEND wxwidgets_FIND_COMPONENTS gl)
endif ()

if ((NOT OPENGLES_FOUND) AND (NOT QT_ANDROID))
  if (AVNAV_USE_GL)
    find_package(OpenGL)
  else (AVNAV_USE_GL)
    message(STATUS "OpenGL disabled by option USE_GL...")
  endif (AVNAV_USE_GL)

  if (OPENGL_FOUND)
    list(APPEND wxwidgets_FIND_COMPONENTS gl)
    target_include_directories(${PACKAGE_NAME} PRIVATE ${OPENGL_INCLUDE_DIR})

    message(STATUS "Found OpenGL....")
    if (AVNAV_VERBOSE)
      message(STATUS "    GL Lib: " ${OPENGL_gl_LIBRARIES})
      message(STATUS "    GL Include: " ${OPENGL_INCLUDE_DIR})
    endif ()

    set(wxWidgets_USE_LIBS gl ${wxWidgets_USE_LIBS})
    add_definitions(-DocpnUSE_GL)
    target_link_libraries(${PACKAGE_NAME} PRIVATE ${OPENGL_gl_LIBRARIES})
    target_include_directories(${PACKAGE_NAME} PRIVATE ${OPENGL_INCLUDE_DIR})
  else (OPENGL_FOUND)
    message(STATUS "OpenGL not found...")
  endif (OPENGL_FOUND)

endif ()





if (AVNAV_USE_CURL)
  if (CMAKE_HOST_WIN32)
    
    
  else (CMAKE_HOST_WIN32)
    set(AVNAV_EXTERNAL_CURL ON)
  endif (CMAKE_HOST_WIN32)

  if (NOT QT_ANDROID)
    if (AVNAV_EXTERNAL_CURL)
      find_package(CURL REQUIRED)
      target_include_directories(${PACKAGE_NAME} PRIVATE ${CURL_INCLUDE_DIRS})
    else (AVNAV_EXTERNAL_CURL)
      include("Curl")
      message(STATUS "Using bundled curl library...")
    endif (AVNAV_EXTERNAL_CURL)

    
    
    message(STATUS "Building with bundled wxcurl")
    include("Curl")
    message(STATUS "curl libs ${CURL_LIBRARIES}")	
    add_subdirectory("libs/wxcurl")
    target_link_libraries(${PACKAGE_NAME} PRIVATE -Wl,--whole-archive ocpn::wxcurl -Wl,--no-whole-archive)
    

    target_link_libraries(${PACKAGE_NAME} PRIVATE ${CURL_LIBRARIES})

    if (WIN32 AND AVNAV_EXTERNAL_CURL)
      find_library(
        CURL_LIBRARY_DLL
        NAMES
          curl
          curllib
          libcurl_imp
          curllib_static
          libcurl
        PATH_SUFFIXES dll
      )
      install(FILES ${CURL_LIBRARY_DLL} DESTINATION ".")
    endif (WIN32 AND AVNAV_EXTERNAL_CURL)
  else (NOT QT_ANDROID)
    target_include_directories( ${PACKAGE_NAME} PRIVATE ${CMAKE_SOURCE_DIR}/buildandroid/libcurl/include)
    target_link_libraries(${PACKAGE_NAME} PRIVATE ${CMAKE_SOURCE_DIR}/buildandroid/libcurl/libcurl.a)
  endif (NOT QT_ANDROID)
endif (AVNAV_USE_CURL)


if (QT_ANDROID)
  target_include_directories( ${PACKAGE_NAME} PRIVATE ${CMAKE_SOURCE_DIR}/buildandroid/libexpat/include)
endif (QT_ANDROID)



# Building for QT_ANDROID involves a cross-building environment, So the include
# directories, flags, etc must be stated explicitly without trying to locate
# them on the host build system.
if (QT_ANDROID)
  message(STATUS "Using GLESv1 for Android")
  add_definitions(-DocpnUSE_GLES)
  add_definitions(-DocpnUSE_GL)
  add_definitions(-DARMHF)

  set(OPENGLES_FOUND "YES")
  set(OPENGL_FOUND "YES")

  # SET(wxWidgets_FIND_COMPONENTS ${wxWidgets_FIND_COMPONENTS} gl )
  add_subdirectory(libs/glshim)
endif (QT_ANDROID)


if (QT_ANDROID)
  target_include_directories(${PACKAGE_NAME} PRIVATE ${CMAKE_SOURCE_DIR}/buildandroid/libarchive/include)
  target_link_libraries(${PACKAGE_NAME} PRIVATE ${CMAKE_SOURCE_DIR}/buildandroid/libarchive/libarchive.a)
else (QT_ANDROID)
  find_package(LibArchive REQUIRED)
  target_include_directories(${PACKAGE_NAME} PRIVATE ${LibArchive_INCLUDE_DIRS})
  target_link_libraries(${PACKAGE_NAME} PRIVATE ${LibArchive_LIBRARIES})
endif (QT_ANDROID)





if (MINGW)
  target_link_libraries(${PACKAGE_NAME} PRIVATE psapi winmm setupapi ws2_32)
endif ()

# TODO dnl dnl Use OpenGL tesselator or Internal tesselator dnl
# tess_internal=false tess_glu=true AC_ARG_WITH(tess_internal, [  --with-tess-
# internal    use Internal Polygon Tesselator], [tess_internal=true] )
#
# if [ "$tess_internal" = "false" ] ; then dnl  Look for and qualify an external
# GLU library echo "checking for useable OpenGLU Library" AC_CHECK_LIB(GLU,
# gluNewTess, true, dnl here true is just a nop AC_MSG_ERROR([*** libGLU not
# found.  Run configure using --with-tess-internal.]))
#
# GL_LIBS="-lGL -lGLU" AC_SUBST(GL_LIBS)
#
# GL_CFLAGS="-DUSE_GLU_TESS" AC_SUBST(GL_CFLAGS) fi

if (UNIX AND NOT APPLE)
  find_path(LIBELF_INCLUDE_DIR NAMES libelf.h gelf.h PATH_SUFFIXES libelf)
  find_library(LIBELF_LIBRARY NAMES elf)
  if (LIBELF_INCLUDE_DIR AND LIBELF_LIBRARY)
    message(STATUS "Found LibELF...")
    message(STATUS "    ELF Lib: ${LIBELF_INCLUDE_DIR}")
    message(STATUS "    ELF Include: ${LIBELF_LIBRARY}")
    target_include_directories(${PACKAGE_NAME} PUBLIC "${LIBELF_INCLUDE_DIR}")
    target_link_libraries(${PACKAGE_NAME} PRIVATE "${LIBELF_LIBRARY}")
    set(USE_LIBELF ON)   # => config.h
  else ()
    message(
      WARNING
        "Did not found LibELF, plugin compatibility check will be simplified."
    )
  endif ()
endif (UNIX AND NOT APPLE)

# Finalize config.h setup and deploy it.
include(TargetSetup)
if ("${wxWidgets_LIBRARIES}" MATCHES "gtk3u" AND PKG_TARGET STREQUAL "ubuntu")
  set(PKG_TARGET "${PKG_TARGET}-gtk3")
endif ()
configure_file(config.h.in ${CMAKE_BINARY_DIR}/include/config.h)
include_directories(BEFORE "${CMAKE_BINARY_DIR}/include")

if (NOT APPLE AND NOT QT_ANDROID)
  target_link_libraries(${PACKAGE_NAME} PRIVATE ${wxWidgets_LIBRARIES})
endif ()

if (CMAKE_HOST_WIN32)
  target_link_libraries(
    ${PACKAGE_NAME}
    PRIVATE
      setupapi.lib
      # glu32.lib
      "GLU_static" psapi.lib
  )

  # use gdi plus only on MSVC, it is not a free library
  if (MSVC)
    target_link_libraries(${PACKAGE_NAME} PRIVATE gdiplus.lib)
  endif ()

endif (CMAKE_HOST_WIN32)

if (MINGW)
  target_link_libraries(${PACKAGE_NAME} PRIVATE ${OPENGL_LIBRARIES} wsock32.lib)
endif (MINGW)

if (UNIX)
  target_link_libraries(
    ${PACKAGE_NAME}
    PRIVATE ${OPENGL_LIBRARIES} ${GETTEXT_LIBRARY} 
  )
  if (NOT APPLE AND NOT QT_ANDROID AND NOT WIN32 AND NOT X11_FOUND)
    message(STATUS "Did not find x11 libraries")
    message(
      STATUS "support for transparent toolbar in opengl mode not detected"
    )
  endif ()
endif (UNIX)

# If we build for windows systems, we also include the resource file containing
# the manifest, icon and other resources
if (MSVC)
  target_sources(${PACKAGE_NAME} PRIVATE src/opencpn.rc)
endif ()


if (APPLE)
  target_sources(${PACKAGE_NAME} PRIVATE include/macutils.h src/macutils.c)
endif ()

# Mac has trouble finding libgobject-2.0.dylib We look for it explicitely
if (xAPPLE)
  # Assume pkg-config is available.
  pkg_search_module(GOBJECT REQUIRED gobject-2.0)
  # MESSAGE (STATUS "    GOBJECT: " ${GOBJECT_LDFLAGS})

  target_compile_definitions(${PACKAGE_NAME} PRIVATE ${GOBJECT_LDFLAGS})
  target_link_libraries(${PACKAGE_NAME} PUBLIC "iconv")
endif (xAPPLE)

if (WIN32)
  target_sources(${PACKAGE_NAME} PRIVATE app.manifest)
endif (WIN32)


if (QT_ANDROID)
  target_link_libraries( ${PACKAGE_NAME} PRIVATE ${wxWidgets_LIBRARIES} )
  target_link_libraries( ${PACKAGE_NAME} PRIVATE GLESv2 EGL z)
  target_link_libraries( ${PACKAGE_NAME} PRIVATE ${OPENGL_LIBRARIES} )
  target_link_libraries( ${PACKAGE_NAME} PRIVATE NMEA0183 )
endif ()

# Sanitizers, part 2/2
if (CMAKE_VERSION VERSION_GREATER 3.4)
  if (NOT "${ENABLE_SANITIZER}" MATCHES "none")
    target_link_libraries(${PACKAGE_NAME} PRIVATE -fsanitize=${ENABLE_SANITIZER})
  endif ()
endif ()

if (LIBLZMA_FOUND)
  target_link_libraries(${PACKAGE_NAME} PRIVATE ${LIBLZMA_LIBRARY})
endif (LIBLZMA_FOUND)

# Certain older Cmake FindGTK2 modules ( e.g. cmake-2.8.0-2) do not yield all of
# the required link libraries So, add them manually.  These declarations may be
# redundant in some architectures, but do no harm.
if (UNIX)
  target_link_libraries(${PACKAGE_NAME} PRIVATE dl)
endif ()




# Dummy target necessary to make sure the ADDITIONAL_MAKE_CLEAN_FILES directive
# is executed. Apparently, the base CMakeLists.txt file must have "some" target
# to activate all the clean steps.
add_custom_target(dummy COMMENT "dummy: Done." DEPENDS ${PACKAGE_NAME})

set_directory_properties(
  dummy ADDITIONAL_MAKE_CLEAN_FILES ${CMAKE_SOURCE_DIR}/include/config.h
)

if (MSVC)
  add_custom_command(
    TARGET ${PACKAGE_NAME} POST_BUILD
    COMMAND
    cmake -E copy "${CMAKE_BINARY_DIR}/$<CONFIG>/opencpn.pdb"
    "${CMAKE_BINARY_DIR}/$<CONFIG>/${PACKAGE_NAME}-${PACKAGE_VERSION}.pdb"
  )
endif (MSVC)

