#include "MainComponent.h"

MainComponent::MainComponent()
{
    addAndMakeVisible (playButton);
    addAndMakeVisible (stopButton);
    addAndMakeVisible (scanVst3Button);
    addAndMakeVisible (loadB3Button);
    addAndMakeVisible (infoLabel);

    playButton.onClick = [this]
    {
        audioEngine.startTransport();
        logToInfoLabel ("Playing");
    };

    stopButton.onClick = [this]
    {
        audioEngine.stopTransport();
        logToInfoLabel ("Stopped");
    };

    scanVst3Button.onClick = [this]
    {
        logToInfoLabel ("Scanning VST3 plugins...");
        pluginHost.scanVst3Plugins ([this] (const juce::String& message)
        {
            logToInfoLabel (message);
        });
    };

    loadB3Button.onClick = [this]
    {
        logToInfoLabel ("Loading B3 plugin...");
        pluginHost.loadB3Plugin ([this] (juce::AudioPluginInstance* /*instance*/,
                                         const juce::String& message)
        {
            logToInfoLabel (message);
        });
    };

    infoLabel.setText ("GRAVSYSTEM Desktop — audio engine ready", juce::dontSendNotification);
    setSize (1400, 900);
}

MainComponent::~MainComponent() = default;

void MainComponent::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff0a0a0c));
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (20);
    auto transport = area.removeFromTop (40);

    playButton.setBounds (transport.removeFromLeft (80));
    transport.removeFromLeft (8);
    stopButton.setBounds (transport.removeFromLeft (80));
    transport.removeFromLeft (16);
    scanVst3Button.setBounds (transport.removeFromLeft (110));
    transport.removeFromLeft (8);
    loadB3Button.setBounds (transport.removeFromLeft (110));
    transport.removeFromLeft (16);
    infoLabel.setBounds (transport);
}

void MainComponent::logToInfoLabel (const juce::String& message)
{
    infoLabel.setText (message, juce::dontSendNotification);
}
