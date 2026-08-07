#pragma once

#include <JuceHeader.h>

namespace gravsystem
{

struct MidiEvent
{
    int pitch = 60;
    int velocity = 100;
    double startBeat = 0.0;
    double durationBeats = 0.25;
};

struct InstrumentParams
{
    double attack = 0.02;
    double decay = 0.2;
    double sustain = 0.7;
    double release = 0.5;
    double cutoff = 20000.0;
    double resonance = 1.0;
    double reverb = 0.25;
    double delay = 0.2;
};

struct Region
{
    juce::String id;
    juce::String trackId;
    juce::String name;
    double startBeat = 0.0;
    double duration = 4.0;
    juce::String type { "midi" };
    juce::Array<MidiEvent> midiEvents;
    int transpose = 0;
    float gain = 1.0f;
};

struct Track
{
    juce::String id;
    juce::String name;
    juce::String type { "midi" };
    juce::String instrument;
    juce::String instrumentType;
    InstrumentParams instrumentParams;
    int channel = 1;
    float volume = 1.0f;
    float pan = 0.0f;
    bool mute = false;
    bool solo = false;
    juce::Colour colour { juce::Colours::grey };
    juce::Array<Region> regions;
};

struct Project
{
    juce::String id;
    juce::String title { "Untitled Project" };
    juce::String description;
    juce::String style { "dance" };
    double bpm = 120.0;
    juce::String key { "C" };
    juce::String scale { "minor" };
    int timeSignatureNumerator = 4;
    int timeSignatureDenominator = 4;
    int bars = 16;
    juce::Array<Track> tracks;
};

class ProjectModel;

class ProjectModelListener
{
public:
    virtual ~ProjectModelListener() = default;
    virtual void projectLoaded (ProjectModel* model) = 0;
};

class ProjectModel
{
public:
    ProjectModel();
    ~ProjectModel();

    /** Load a project from a JSON string in the web-app export format.
        Returns an empty string on success, or an error message on failure. */
    juce::String loadFromJson (const juce::String& json);

    const Project& getProject() const { return project; }
    Project& getProject() { return project; }

    bool isLoaded() const { return loaded; }

    void addListener (ProjectModelListener* listener);
    void removeListener (ProjectModelListener* listener);

private:
    Project project;
    bool loaded = false;
    juce::ListenerList<ProjectModelListener> listeners;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (ProjectModel)
};

} // namespace gravsystem
