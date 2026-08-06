cmake_minimum_required(VERSION 3.22)
project(GRAVSYSTEM VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Fetch JUCE from the official GitHub mirror.
include(FetchContent)
FetchContent_Declare(
  JUCE
  GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
  GIT_TAG 8.0.4
  GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(JUCE)

juce_add_gui_app(GRAVSYSTEM
  PRODUCT_NAME "GRAVSYSTEM"
  COMPANY_NAME "gravsystem"
  BUNDLE_ID    "app.gravsystem.desktop"
)

target_sources(GRAVSYSTEM
  PRIVATE
    src/main.cpp
    src/MainComponent.cpp
    src/AudioEngine.cpp
    src/ProjectModel.cpp
    src/PluginHost.cpp
)

target_include_directories(GRAVSYSTEM PRIVATE src)

juce_generate_juce_header(GRAVSYSTEM)

target_link_libraries(GRAVSYSTEM
  PRIVATE
    juce::juce_core
    juce::juce_data_structures
    juce::juce_events
    juce::juce_graphics
    juce::juce_gui_basics
    juce::juce_gui_extra
    juce::juce_audio_basics
    juce::juce_audio_devices
    juce::juce_audio_formats
    juce::juce_audio_processors
    juce::juce_audio_utils
  PUBLIC
    juce::juce_recommended_config_flags
    juce::juce_recommended_lto_flags
    juce::juce_recommended_warning_flags
)

# Enable plugin hosting (VST3 / AU / CLAP requires extra setup).
target_compile_definitions(GRAVSYSTEM
  PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
    JUCE_PLUGINHOST_VST3=1
)
