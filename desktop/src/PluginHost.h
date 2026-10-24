#pragma once

#include <JuceHeader.h>

namespace gravsystem
{

/**
 * Manages VST3 plugin scanning and loading using JUCE's plugin-hosting APIs.
 *
 * - AudioPluginFormatManager owns the VST3 format.
 * - KnownPluginList persists discovered plugin descriptions.
 * - PluginDirectoryScanner walks the default VST3 directories.
 */
class PluginHost
{
public:
    PluginHost();
    ~PluginHost();

    /** Scan the default VST3 directories on a background thread.
        Progress messages are delivered asynchronously on the message thread. */
    void scanVst3Plugins (std::function<void (const juce::String&)> progressCallback = {});

    /** Try to load a plugin whose name contains "B3" from the known list.
        The callback is invoked from the calling thread with the loaded instance (owned by
        PluginHost) and a status message. */
    void loadB3Plugin (std::function<void (juce::AudioPluginInstance*, const juce::String&)> callback);

    juce::KnownPluginList& getKnownPlugins()             { return knownPlugins; }
    const juce::KnownPluginList& getKnownPlugins() const { return knownPlugins; }

    juce::AudioPluginInstance* getCurrentPlugin() const noexcept { return currentPlugin.get(); }

private:
    juce::AudioPluginFormatManager formatManager;
    juce::KnownPluginList knownPlugins;
    std::unique_ptr<juce::AudioPluginInstance> currentPlugin;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PluginHost)
};

} // namespace gravsystem
