#include <JuceHeader.h>
#include "MainComponent.h"
#include "AudioEngine.h"
#include "ProjectModel.h"
#include <iostream>

namespace
{
    juce::StringArray parseCommandLine (const juce::String& commandLine)
    {
        return juce::StringArray::fromTokens (commandLine, true);
    }

    int findRenderFlagIndex (const juce::StringArray& args)
    {
        for (int i = 0; i < args.size(); ++i)
            if (args[i] == "--render-to-wav")
                return i;

        return -1;
    }
}

class GRAVSYSTEMApplication : public juce::JUCEApplication
{
public:
    GRAVSYSTEMApplication() = default;

    const juce::String getApplicationName() override       { return ProjectInfo::projectName; }
    const juce::String getApplicationVersion() override    { return ProjectInfo::versionString; }
    bool moreThanOneInstanceAllowed() override             { return true; }

    void initialise (const juce::String& commandLine) override
    {
        auto args = parseCommandLine (commandLine);
        const auto renderIndex = findRenderFlagIndex (args);

        if (renderIndex >= 0 && renderIndex + 2 < args.size())
        {
            juce::File projectFile (args[renderIndex + 2]);
            juce::File outputFile (args[renderIndex + 1]);

            if (! projectFile.existsAsFile())
            {
                std::cerr << "Project file not found: " << projectFile.getFullPathName().toStdString() << std::endl;
                quit();
                return;
            }

            gravsystem::ProjectModel model;
            auto error = model.loadFromJson (projectFile.loadFileAsString());

            if (error.isNotEmpty())
            {
                std::cerr << "Failed to load project: " << error.toStdString() << std::endl;
                quit();
                return;
            }

            AudioEngine engine (&model);
            error = engine.renderToFile (outputFile, 8.0);

            if (error.isNotEmpty())
            {
                std::cerr << "Render failed: " << error.toStdString() << std::endl;
            }
            else
            {
                std::cout << "Rendered: " << outputFile.getFullPathName().toStdString() << std::endl;
            }

            quit();
            return;
        }

        mainWindow.reset (new MainWindow (getApplicationName(), commandLine));
    }

    void shutdown() override
    {
        mainWindow = nullptr;
    }

    void systemRequestedQuit() override
    {
        quit();
    }

    void anotherInstanceStarted (const juce::String& /*commandLine*/) override {}

    class MainWindow : public juce::DocumentWindow
    {
    public:
        explicit MainWindow (juce::String name, const juce::String& commandLine)
            : DocumentWindow (name,
                              juce::Desktop::getInstance().getDefaultLookAndFeel()
                                                          .findColour (ResizableWindow::backgroundColourId),
                              DocumentWindow::allButtons)
        {
            setUsingNativeTitleBar (true);
            auto* mainComponent = new MainComponent();
            setContentOwned (mainComponent, true);
            setResizable (true, true);
            centreWithSize (1400, 900);
            setVisible (true);

            if (commandLine.trim().isNotEmpty())
            {
                juce::File projectFile (commandLine.trim());

                if (projectFile.existsAsFile())
                    mainComponent->loadProjectFile (projectFile);
            }
        }

        void closeButtonPressed() override
        {
            JUCEApplication::getInstance()->systemRequestedQuit();
        }

    private:
        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainWindow)
    };

private:
    std::unique_ptr<MainWindow> mainWindow;
};

START_JUCE_APPLICATION (GRAVSYSTEMApplication)
