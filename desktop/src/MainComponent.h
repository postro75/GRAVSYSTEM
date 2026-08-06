#pragma once

#include <JuceHeader.h>
#include "AudioEngine.h"
#include "PluginHost.h"

class MainComponent : public juce::Component
{
public:
    MainComponent();
    ~MainComponent() override;

    void paint (juce::Graphics& g) override;
    void resized() override;

private:
    AudioEngine audioEngine;
    gravsystem::PluginHost pluginHost;

    juce::TextButton playButton      { "Play" };
    juce::TextButton stopButton      { "Stop" };
    juce::TextButton scanVst3Button  { "Scan VST3" };
    juce::TextButton loadB3Button    { "Load B3" };
    juce::Label infoLabel;

    void logToInfoLabel (const juce::String& message);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
