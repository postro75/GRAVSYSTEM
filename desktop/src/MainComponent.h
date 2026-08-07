#pragma once

#include <JuceHeader.h>
#include "AudioEngine.h"

#if GRAVSYSTEM_ENABLE_VST3
  #include "PluginHost.h"
#endif

class MainComponent : public juce::Component
{
public:
    MainComponent();
    ~MainComponent() override;

    void paint (juce::Graphics& g) override;
    void resized() override;

private:
    AudioEngine audioEngine;

#if GRAVSYSTEM_ENABLE_VST3
    gravsystem::PluginHost pluginHost;
#endif

    juce::TextButton playButton      { "Play" };
    juce::TextButton stopButton      { "Stop" };
#if GRAVSYSTEM_ENABLE_VST3
    juce::TextButton scanVst3Button  { "Scan VST3" };
    juce::TextButton loadB3Button    { "Load B3" };
#endif
    juce::Label infoLabel;

    void logToInfoLabel (const juce::String& message);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
