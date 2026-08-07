#include "MainComponent.h"

namespace
{
    juce::String beatToTimeString (double beat, int numerator)
    {
        const auto bar = static_cast<int> (beat / numerator);
        const auto beatInBar = static_cast<int> (std::fmod (beat, numerator)) + 1;
        const auto sixteenths = static_cast<int> (std::fmod (beat, 1.0) * 4.0);

        return juce::String (bar + 1) + ":" + juce::String (beatInBar) + ":" + juce::String (sixteenths);
    }
}

MainComponent::MainComponent()
    : audioEngine (&projectModel)
{
    addAndMakeVisible (playButton);
    addAndMakeVisible (stopButton);
    addAndMakeVisible (recordButton);
    addAndMakeVisible (loopButton);
    addAndMakeVisible (openButton);
    addAndMakeVisible (bpmLabel);
    addAndMakeVisible (timeLabel);
    addAndMakeVisible (infoLabel);
    addAndMakeVisible (trackHeaderList);
    addAndMakeVisible (timelineView);
    addAndMakeVisible (editorTabs);

#if GRAVSYSTEM_ENABLE_VST3
    addAndMakeVisible (scanVst3Button);
    addAndMakeVisible (loadB3Button);
#endif

    playButton.onClick = [this]
    {
        audioEngine.startTransport();
        updateTimeDisplay();
        logToInfoLabel ("Playing");
    };

    stopButton.onClick = [this]
    {
        audioEngine.stopTransport();
        updateTimeDisplay();
        logToInfoLabel ("Stopped");
    };

    recordButton.setClickingTogglesState (true);
    recordButton.onClick = [this]
    {
        audioEngine.setRecording (recordButton.getToggleState());
        logToInfoLabel (recordButton.getToggleState() ? "Recording armed" : "Recording disarmed");
    };

    loopButton.setClickingTogglesState (true);
    loopButton.onClick = [this]
    {
        audioEngine.setLooping (loopButton.getToggleState());
        logToInfoLabel (loopButton.getToggleState() ? "Loop on" : "Loop off");
    };

    openButton.onClick = [this] { openProject(); };

#if GRAVSYSTEM_ENABLE_VST3
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
#endif

    bpmLabel.setText ("BPM: 120", juce::dontSendNotification);
    bpmLabel.setJustificationType (juce::Justification::centred);

    timeLabel.setText ("1:1:0", juce::dontSendNotification);
    timeLabel.setJustificationType (juce::Justification::centredLeft);

    infoLabel.setText ("GRAVSYSTEM Desktop - open a project to begin", juce::dontSendNotification);

    timelineView.onRegionSelected = [this] (int trackIndex, int regionIndex)
    {
        selectRegion (trackIndex, regionIndex);
    };

    editorTabs.addTab ("Piano Roll", juce::Colours::darkgrey, &pianoRoll, false);
    editorTabs.addTab ("Step Sequencer", juce::Colours::darkgrey, &stepSequencer, false);
    editorTabs.setCurrentTabIndex (0);

    projectModel.addListener (this);

    trackHeaderList.setProject (nullptr);
    timelineView.setProject (nullptr);

    startTimerHz (30);
    setSize (1400, 900);
}

MainComponent::~MainComponent()
{
    stopTimer();
    projectModel.removeListener (this);
}

void MainComponent::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff0a0a0c));
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (8);

    auto transport = area.removeFromTop (44);
    playButton.setBounds (transport.removeFromLeft (70));
    transport.removeFromLeft (6);
    stopButton.setBounds (transport.removeFromLeft (70));
    transport.removeFromLeft (6);
    recordButton.setBounds (transport.removeFromLeft (70));
    transport.removeFromLeft (6);
    loopButton.setBounds (transport.removeFromLeft (70));
    transport.removeFromLeft (16);
    openButton.setBounds (transport.removeFromLeft (130));
    transport.removeFromLeft (16);

#if GRAVSYSTEM_ENABLE_VST3
    scanVst3Button.setBounds (transport.removeFromLeft (110));
    transport.removeFromLeft (6);
    loadB3Button.setBounds (transport.removeFromLeft (110));
    transport.removeFromLeft (16);
#endif

    bpmLabel.setBounds (transport.removeFromRight (90));
    transport.removeFromRight (12);
    timeLabel.setBounds (transport.removeFromRight (110));
    transport.removeFromRight (12);
    infoLabel.setBounds (transport);

    auto editor = area.removeFromBottom (240);
    editorTabs.setBounds (editor);

    auto centre = area;
    trackHeaderList.setBounds (centre.removeFromLeft (200));
    timelineView.setBounds (centre);
}

void MainComponent::projectLoaded (gravsystem::ProjectModel* /*model*/)
{
    updateProjectUI();
    logToInfoLabel ("Project loaded: " + projectModel.getProject().title);
}

void MainComponent::timerCallback()
{
    if (audioEngine.isPlaying())
    {
        timelineView.setPlayheadBeat (audioEngine.getCurrentBeat());
        updateTimeDisplay();
    }
}

void MainComponent::openProject()
{
    fileChooser = std::make_unique<juce::FileChooser> ("Open GRAVSYSTEM project",
                                                       juce::File::getSpecialLocation (juce::File::userDocumentsDirectory),
                                                       "*.json");

    fileChooser->launchAsync (juce::FileBrowserComponent::openMode | juce::FileBrowserComponent::canSelectFiles,
                              [this] (const juce::FileChooser& chooser)
    {
        auto file = chooser.getResult();

        if (! file.existsAsFile())
            return;

        auto json = file.loadFileAsString();
        auto error = projectModel.loadFromJson (json);

        if (error.isNotEmpty())
            logToInfoLabel ("Load failed: " + error);
    });
}

void MainComponent::updateProjectUI()
{
    auto& project = projectModel.getProject();

    audioEngine.setBpm (project.bpm);
    bpmLabel.setText ("BPM: " + juce::String (project.bpm, 1), juce::dontSendNotification);

    trackHeaderList.setProject (&project);
    timelineView.setProject (&project);

    selectedTrack = -1;
    selectedRegion = -1;
    selectRegion (-1, -1);
}

void MainComponent::updateTimeDisplay()
{
    const auto beat = audioEngine.getCurrentBeat();
    const auto& project = projectModel.getProject();
    timeLabel.setText (beatToTimeString (beat, project.timeSignatureNumerator),
                       juce::dontSendNotification);
}

void MainComponent::selectRegion (int trackIndex, int regionIndex)
{
    selectedTrack = trackIndex;
    selectedRegion = regionIndex;

    timelineView.setSelectedRegion (trackIndex, regionIndex);

    const gravsystem::Track* track = nullptr;
    const gravsystem::Region* region = nullptr;

    if (projectModel.isLoaded() && trackIndex >= 0 && regionIndex >= 0)
    {
        auto& project = projectModel.getProject();

        if (trackIndex < project.tracks.size())
        {
            track = &project.tracks.getReference (trackIndex);

            if (regionIndex < track->regions.size())
                region = &track->regions.getReference (regionIndex);
        }
    }

    pianoRoll.setRegion (track, region);
    stepSequencer.setRegion (track, region);
    pianoRoll.repaint();
    stepSequencer.repaint();
}

void MainComponent::logToInfoLabel (const juce::String& message)
{
    infoLabel.setText (message, juce::dontSendNotification);
}

//==============================================================================
// TrackHeaderItem
//==============================================================================

MainComponent::TrackHeaderItem::TrackHeaderItem (gravsystem::Track* trackToUse)
    : track (trackToUse)
{
    nameLabel.setText (track->name, juce::dontSendNotification);
    nameLabel.setJustificationType (juce::Justification::centredLeft);
    addAndMakeVisible (nameLabel);

    muteButton.setClickingTogglesState (true);
    muteButton.setToggleState (track->mute, juce::dontSendNotification);
    muteButton.setColour (juce::TextButton::buttonOnColourId, juce::Colours::red);
    muteButton.addListener (this);
    addAndMakeVisible (muteButton);

    soloButton.setClickingTogglesState (true);
    soloButton.setToggleState (track->solo, juce::dontSendNotification);
    soloButton.setColour (juce::TextButton::buttonOnColourId, juce::Colours::yellow);
    soloButton.addListener (this);
    addAndMakeVisible (soloButton);

    volumeSlider.setRange (0.0, 2.0);
    volumeSlider.setValue (track->volume, juce::dontSendNotification);
    volumeSlider.addListener (this);
    addAndMakeVisible (volumeSlider);
}

void MainComponent::TrackHeaderItem::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colours::darkgrey.darker (0.8f));
    g.setColour (track->colour);
    g.fillRect (getLocalBounds().removeFromLeft (4));
    g.setColour (juce::Colours::white);
    g.drawRect (getLocalBounds(), 1);
}

void MainComponent::TrackHeaderItem::resized()
{
    auto area = getLocalBounds().withTrimmedLeft (8).reduced (4);
    nameLabel.setBounds (area.removeFromTop (20));

    auto buttons = area.removeFromBottom (24);
    muteButton.setBounds (buttons.removeFromLeft (30));
    buttons.removeFromLeft (4);
    soloButton.setBounds (buttons.removeFromLeft (30));

    area.removeFromBottom (4);
    volumeSlider.setBounds (area.withWidth (34).withCentre (area.getCentre()));
}

void MainComponent::TrackHeaderItem::buttonClicked (juce::Button* button)
{
    if (button == &muteButton)
        track->mute = muteButton.getToggleState();
    else if (button == &soloButton)
        track->solo = soloButton.getToggleState();
}

void MainComponent::TrackHeaderItem::sliderValueChanged (juce::Slider* /*slider*/)
{
    track->volume = static_cast<float> (volumeSlider.getValue());
}

//==============================================================================
// TrackHeaderList
//==============================================================================

MainComponent::TrackHeaderList::TrackHeaderList() = default;

void MainComponent::TrackHeaderList::setProject (gravsystem::Project* projectToUse)
{
    project = projectToUse;
    refresh();
}

void MainComponent::TrackHeaderList::refresh()
{
    items.clear();

    if (project == nullptr)
        return;

    for (auto& track : project->tracks)
    {
        auto* item = new TrackHeaderItem (&track);
        addAndMakeVisible (item);
        items.add (item);
    }

    resized();
}

void MainComponent::TrackHeaderList::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colours::black);
}

void MainComponent::TrackHeaderList::resized()
{
    auto area = getLocalBounds();
    const auto itemHeight = 64;

    for (auto* item : items)
        item->setBounds (area.removeFromTop (itemHeight));
}

//==============================================================================
// TimelineView
//==============================================================================

MainComponent::TimelineView::TimelineView() = default;

void MainComponent::TimelineView::setProject (gravsystem::Project* projectToUse)
{
    project = projectToUse;
    selectedTrack = -1;
    selectedRegion = -1;
    repaint();
}

void MainComponent::TimelineView::setPlayheadBeat (double beat)
{
    playheadBeat = beat;
    repaint();
}

void MainComponent::TimelineView::setSelectedRegion (int trackIndex, int regionIndex)
{
    selectedTrack = trackIndex;
    selectedRegion = regionIndex;
    repaint();
}

void MainComponent::TimelineView::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff121214));

    if (project == nullptr)
    {
        g.setColour (juce::Colours::grey);
        g.setFont (16.0f);
        g.drawText ("No project loaded", getLocalBounds(), juce::Justification::centred);
        return;
    }

    const auto totalBeats = static_cast<double> (project->bars * project->timeSignatureNumerator);

    // Grid lines.
    g.setColour (juce::Colours::grey.withAlpha (0.3f));

    for (int beat = 0; beat <= static_cast<int> (totalBeats); ++beat)
    {
        const auto x = headerWidth + static_cast<int> (beat * pixelsPerBeat);
        const bool isBar = (beat % project->timeSignatureNumerator) == 0;
        g.drawLine (static_cast<float> (x), 0.0f, static_cast<float> (x), static_cast<float> (getHeight()),
                    isBar ? 2.0f : 1.0f);

        if (isBar)
        {
            g.setColour (juce::Colours::lightgrey);
            g.setFont (12.0f);
            g.drawText (juce::String (beat / project->timeSignatureNumerator + 1), x + 2, 2, 30, 16,
                        juce::Justification::centredLeft);
            g.setColour (juce::Colours::grey.withAlpha (0.3f));
        }
    }

    // Track lanes and regions.
    int trackIndex = 0;

    for (const auto& track : project->tracks)
    {
        const auto y = yAtTrack (trackIndex);
        const auto lane = juce::Rectangle<int> (0, y, getWidth(), trackHeight).reduced (1);

        g.setColour (juce::Colours::darkgrey.withAlpha (0.15f));
        g.fillRect (lane);

        for (int i = 0; i < track.regions.size(); ++i)
        {
            const auto& region = track.regions.getReference (i);
            const auto x = headerWidth + static_cast<int> (region.startBeat * pixelsPerBeat);
            const auto w = juce::jmax (2, static_cast<int> (region.duration * pixelsPerBeat));
            const auto regionBounds = juce::Rectangle<int> (x, y + 4, w, trackHeight - 8).reduced (1);

            g.setColour (track.colour.withAlpha (selectedTrack == trackIndex && selectedRegion == i ? 1.0f : 0.75f));
            g.fillRect (regionBounds);

            g.setColour (juce::Colours::white);
            g.setFont (12.0f);
            g.drawText (region.name, regionBounds.reduced (4), juce::Justification::centredLeft, true);

            if (selectedTrack == trackIndex && selectedRegion == i)
            {
                g.setColour (juce::Colours::white);
                g.drawRect (regionBounds, 2);
            }
        }

        ++trackIndex;
    }

    // Playhead.
    const auto playheadX = headerWidth + static_cast<int> (playheadBeat * pixelsPerBeat);
    g.setColour (juce::Colours::red);
    g.drawLine (static_cast<float> (playheadX), 0.0f, static_cast<float> (playheadX),
                static_cast<float> (getHeight()), 2.0f);
}

void MainComponent::TimelineView::mouseDown (const juce::MouseEvent& event)
{
    int trackIndex = -1;
    int regionIndex = -1;

    if (findRegionAt (event.getPosition(), trackIndex, regionIndex))
    {
        if (onRegionSelected)
            onRegionSelected (trackIndex, regionIndex);
    }
}

void MainComponent::TimelineView::resized()
{
    repaint();
}

double MainComponent::TimelineView::beatAtX (int x) const
{
    return static_cast<double> (x - headerWidth) / pixelsPerBeat;
}

int MainComponent::TimelineView::xAtBeat (double beat) const
{
    return headerWidth + static_cast<int> (beat * pixelsPerBeat);
}

int MainComponent::TimelineView::yAtTrack (int trackIndex) const
{
    return trackIndex * trackHeight;
}

int MainComponent::TimelineView::trackAtY (int y) const
{
    return y / trackHeight;
}

bool MainComponent::TimelineView::findRegionAt (juce::Point<int> pos, int& trackIndex, int& regionIndex) const
{
    if (project == nullptr)
        return false;

    trackIndex = trackAtY (pos.y);

    if (trackIndex < 0 || trackIndex >= project->tracks.size())
        return false;

    const auto& track = project->tracks.getReference (trackIndex);
    const auto beat = beatAtX (pos.x);

    for (int i = 0; i < track.regions.size(); ++i)
    {
        const auto& region = track.regions.getReference (i);

        if (beat >= region.startBeat && beat < region.startBeat + region.duration)
        {
            regionIndex = i;
            return true;
        }
    }

    return false;
}

//==============================================================================
// PianoRoll
//==============================================================================

MainComponent::PianoRoll::PianoRoll() = default;

void MainComponent::PianoRoll::setRegion (const gravsystem::Track* trackToUse,
                                          const gravsystem::Region* regionToUse)
{
    track = trackToUse;
    region = regionToUse;
    repaint();
}

void MainComponent::PianoRoll::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff0e0e10));

    if (region == nullptr || track == nullptr)
    {
        g.setColour (juce::Colours::grey);
        g.setFont (14.0f);
        g.drawText ("Select a region to edit", getLocalBounds(), juce::Justification::centred);
        return;
    }

    const auto lowNote = 36;
    const auto highNote = 96;
    const auto noteRange = highNote - lowNote;
    const auto rowHeight = static_cast<float> (getHeight()) / noteRange;
    const auto pixelsPerBeat = 80.0;
    const auto xOffset = 40;

    // Grid.
    g.setColour (juce::Colours::darkgrey.withAlpha (0.3f));

    for (int i = 0; i <= static_cast<int> (region->duration); ++i)
    {
        const auto x = static_cast<float> (xOffset + i * pixelsPerBeat);
        g.drawLine (x, 0.0f, x, static_cast<float> (getHeight()));
    }

    for (int note = lowNote; note <= highNote; ++note)
    {
        const auto y = static_cast<float> (highNote - note) * rowHeight;
        const bool isBlack = [note]
        {
            const auto n = note % 12;
            return n == 1 || n == 3 || n == 6 || n == 8 || n == 10;
        }();

        g.setColour (isBlack ? juce::Colours::black.withAlpha (0.4f) : juce::Colours::transparentBlack);
        g.fillRect (0.0f, y, static_cast<float> (getWidth()), rowHeight);
    }

    // Notes.
    for (const auto& event : region->midiEvents)
    {
        if (event.pitch < lowNote || event.pitch > highNote)
            continue;

        const auto x = static_cast<float> (xOffset + event.startBeat * pixelsPerBeat);
        const auto y = static_cast<float> (highNote - event.pitch) * rowHeight;
        const auto w = juce::jmax (4.0f, static_cast<float> (event.durationBeats * pixelsPerBeat));

        g.setColour (track->colour);
        g.fillRect (x, y + 1.0f, w, rowHeight - 2.0f);
        g.setColour (juce::Colours::white);
        g.drawRect (x, y + 1.0f, w, rowHeight - 2.0f, 1.0f);
    }
}

void MainComponent::PianoRoll::resized()
{
    repaint();
}

//==============================================================================
// StepSequencer
//==============================================================================

MainComponent::StepSequencer::StepSequencer() = default;

void MainComponent::StepSequencer::setRegion (const gravsystem::Track* trackToUse,
                                              const gravsystem::Region* regionToUse)
{
    track = trackToUse;
    region = regionToUse;
    repaint();
}

void MainComponent::StepSequencer::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff0e0e10));

    if (region == nullptr || track == nullptr)
    {
        g.setColour (juce::Colours::grey);
        g.setFont (14.0f);
        g.drawText ("Select a region to edit", getLocalBounds(), juce::Justification::centred);
        return;
    }

    const auto steps = 16;
    const auto rows = 12;
    const auto cellW = static_cast<float> (getWidth()) / steps;
    const auto cellH = static_cast<float> (getHeight()) / rows;

    g.setColour (juce::Colours::darkgrey.withAlpha (0.3f));

    for (int step = 0; step <= steps; ++step)
        g.drawLine (step * cellW, 0.0f, step * cellW, static_cast<float> (getHeight()));

    for (int row = 0; row <= rows; ++row)
        g.drawLine (0.0f, row * cellH, static_cast<float> (getWidth()), row * cellH);

    // Plot notes into nearest step.
    for (const auto& event : region->midiEvents)
    {
        const auto step = juce::jlimit (0, steps - 1, static_cast<int> (event.startBeat));
        const auto row = juce::jlimit (0, rows - 1, (127 - event.pitch) % rows);
        const auto x = static_cast<float> (step) * cellW;
        const auto y = static_cast<float> (row) * cellH;

        g.setColour (track->colour);
        g.fillEllipse (x + 2.0f, y + 2.0f, cellW - 4.0f, cellH - 4.0f);
        g.setColour (juce::Colours::white);
        g.drawEllipse (x + 2.0f, y + 2.0f, cellW - 4.0f, cellH - 4.0f, 1.0f);
    }
}

void MainComponent::StepSequencer::resized()
{
    repaint();
}
