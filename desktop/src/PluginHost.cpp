#include "PluginHost.h"

namespace gravsystem
{

PluginHost::PluginHost()
{
    formatManager.addFormat (new juce::VST3PluginFormat());
}

PluginHost::~PluginHost() = default;

static juce::AudioPluginFormat* findVst3Format (juce::AudioPluginFormatManager& manager)
{
    for (int i = 0; i < manager.getNumFormats(); ++i)
    {
        auto* format = manager.getFormat (i);

        if (format != nullptr && format->getName() == "VST3")
            return format;
    }

    return nullptr;
}

void PluginHost::scanVst3Plugins (std::function<void (const juce::String&)> progressCallback)
{
    juce::Thread::launch ([this, progressCallback]
    {
        auto* vst3Format = findVst3Format (formatManager);

        if (vst3Format == nullptr)
        {
            if (progressCallback)
                juce::MessageManager::callAsync ([progressCallback]
                {
                    progressCallback ("VST3 format is not available.");
                });
            return;
        }

        juce::FileSearchPath searchPath (vst3Format->getDefaultLocationsToSearch());
        juce::PluginDirectoryScanner scanner (knownPlugins,
                                              *vst3Format,
                                              searchPath,
                                              true,
                                              juce::File(),
                                              true);

        juce::String name;
        while (scanner.scanNextFile (true, name))
        {
            if (progressCallback)
                juce::MessageManager::callAsync ([progressCallback, name]
                {
                    progressCallback ("Scanned: " + name);
                });
        }

        if (progressCallback)
        {
            const auto count = knownPlugins.getNumTypes();
            juce::MessageManager::callAsync ([progressCallback, count]
            {
                progressCallback ("Scan complete. Found " + juce::String (count) + " plugin" + (count == 1 ? "" : "s") + ".");
            });
        }
    });
}

void PluginHost::loadB3Plugin (std::function<void (juce::AudioPluginInstance*, const juce::String&)> callback)
{
    const auto types = knownPlugins.getTypes();
    const juce::PluginDescription* b3Desc = nullptr;

    for (const auto& desc : types)
    {
        if (desc.name.containsIgnoreCase ("B3")
            || desc.descriptiveName.containsIgnoreCase ("B3"))
        {
            b3Desc = &desc;
            break;
        }
    }

    if (b3Desc == nullptr)
    {
        if (callback)
            callback (nullptr, "B3 plugin not found. Run Scan VST3 first.");
        return;
    }

    juce::String error;
    currentPlugin = formatManager.createPluginInstance (*b3Desc, 44100.0, 512, error);

    if (currentPlugin != nullptr)
    {
        if (callback)
            callback (currentPlugin.get(), "Loaded B3 plugin: " + currentPlugin->getName());
    }
    else
    {
        if (callback)
            callback (nullptr, "Failed to load B3 plugin: " + error);
    }
}

} // namespace gravsystem
