#include <JuceHeader.h>
#include "MainComponent.h"

class GRAVSYSTEMApplication : public juce::JUCEApplication
{
public:
    GRAVSYSTEMApplication() = default;

    const juce::String getApplicationName() override       { return ProjectInfo::projectName; }
    const juce::String getApplicationVersion() override    { return ProjectInfo::versionString; }
    bool moreThanOneInstanceAllowed() override             { return true; }

    void initialise (const juce::String& commandLine) override
    {
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
