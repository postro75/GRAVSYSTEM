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

struct Region
{
    juce::String id;
    juce::String name;
    double startBeat = 0.0;
    double duration = 4.0;
    juce::Array<MidiEvent> midiEvents;
};

struct Track
{
    juce::String id;
    juce::String name;
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
    juce::String title;
    double bpm = 120.0;
    int bars = 16;
    juce::String key = "C";
    juce::String scale = "minor";
    juce::Array<Track> tracks;
};

} // namespace gravsystem
