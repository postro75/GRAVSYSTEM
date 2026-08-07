#pragma once

#include <JuceHeader.h>
#include "AudioEngine.h"
#include "ProjectModel.h"

#if GRAVSYSTEM_ENABLE_VST3
  #include "PluginHost.h"
#endif

class MainComponent : public juce::Component,
                      public gravsystem::ProjectModelListener,
                      public juce::Timer
{
public:
    MainComponent();
    ~MainComponent() override;

    void paint (juce::Graphics& g) override;
    void resized() override;

    void projectLoaded (gravsystem::ProjectModel* model) override;
    void timerCallback() override;

private:
    class TrackHeaderItem;

    class TrackHeaderList : public juce::Component
    {
    public:
        TrackHeaderList();

        void setProject (gravsystem::Project* projectToUse);
        void refresh();

        void paint (juce::Graphics& g) override;
        void resized() override;

    private:
        gravsystem::Project* project = nullptr;
        juce::OwnedArray<TrackHeaderItem> items;

        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (TrackHeaderList)
    };

    class TrackHeaderItem : public juce::Component,
                            private juce::Button::Listener,
                            private juce::Slider::Listener
    {
    public:
        TrackHeaderItem (gravsystem::Track* trackToUse);

        void paint (juce::Graphics& g) override;
        void resized() override;

    private:
        void buttonClicked (juce::Button* button) override;
        void sliderValueChanged (juce::Slider* slider) override;

        gravsystem::Track* track;
        juce::Label nameLabel;
        juce::TextButton muteButton { "M" };
        juce::TextButton soloButton { "S" };
        juce::Slider volumeSlider { juce::Slider::LinearVertical, juce::Slider::TextBoxBelow };

        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (TrackHeaderItem)
    };

    class TimelineView : public juce::Component
    {
    public:
        TimelineView();

        void setProject (gravsystem::Project* projectToUse);
        void setPlayheadBeat (double beat);
        void setSelectedRegion (int trackIndex, int regionIndex);

        std::function<void (int trackIndex, int regionIndex)> onRegionSelected;

        void paint (juce::Graphics& g) override;
        void mouseDown (const juce::MouseEvent& event) override;
        void resized() override;

    private:
        static constexpr int trackHeight = 64;
        static constexpr int headerWidth = 48;
        static constexpr double pixelsPerBeat = 40.0;

        gravsystem::Project* project = nullptr;
        double playheadBeat = 0.0;
        int selectedTrack = -1;
        int selectedRegion = -1;

        double beatAtX (int x) const;
        int xAtBeat (double beat) const;
        int yAtTrack (int trackIndex) const;
        int trackAtY (int y) const;
        bool findRegionAt (juce::Point<int> pos, int& trackIndex, int& regionIndex) const;

        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (TimelineView)
    };

    class PianoRoll : public juce::Component
    {
    public:
        PianoRoll();

        void setRegion (const gravsystem::Track* track, const gravsystem::Region* region);

        void paint (juce::Graphics& g) override;
        void resized() override;

    private:
        const gravsystem::Track* track = nullptr;
        const gravsystem::Region* region = nullptr;

        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PianoRoll)
    };

    class StepSequencer : public juce::Component
    {
    public:
        StepSequencer();

        void setRegion (const gravsystem::Track* track, const gravsystem::Region* region);

        void paint (juce::Graphics& g) override;
        void resized() override;

    private:
        const gravsystem::Track* track = nullptr;
        const gravsystem::Region* region = nullptr;

        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (StepSequencer)
    };

    void logToInfoLabel (const juce::String& message);
    void openProject();
    void updateProjectUI();
    void updateTimeDisplay();
    void selectRegion (int trackIndex, int regionIndex);

    gravsystem::ProjectModel projectModel;
    AudioEngine audioEngine;

#if GRAVSYSTEM_ENABLE_VST3
    gravsystem::PluginHost pluginHost;
#endif

    juce::TextButton playButton      { "Play" };
    juce::TextButton stopButton      { "Stop" };
    juce::TextButton recordButton    { "Record" };
    juce::TextButton loopButton      { "Loop" };
    juce::TextButton openButton      { "Open Project..." };
#if GRAVSYSTEM_ENABLE_VST3
    juce::TextButton scanVst3Button  { "Scan VST3" };
    juce::TextButton loadB3Button    { "Load B3" };
#endif
    juce::Label bpmLabel;
    juce::Label timeLabel;
    juce::Label infoLabel;

    TrackHeaderList trackHeaderList;
    TimelineView timelineView;
    PianoRoll pianoRoll;
    StepSequencer stepSequencer;
    juce::TabbedComponent editorTabs { juce::TabbedButtonBar::TabsAtTop };

    int selectedTrack = -1;
    int selectedRegion = -1;

    std::unique_ptr<juce::FileChooser> fileChooser;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
