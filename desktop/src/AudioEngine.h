#pragma once

#include <JuceHeader.h>
#include "ProjectModel.h"

class AudioEngine : private juce::AudioIODeviceCallback
{
public:
    explicit AudioEngine (gravsystem::ProjectModel* projectModel);
    ~AudioEngine() override;

    void startTransport();
    void stopTransport();
    bool isPlaying() const;

    void setLooping (bool shouldLoop);
    bool isLooping() const;

    void setRecording (bool shouldRecord);
    bool isRecording() const;

    double getCurrentBeat() const;

    double getBpm() const;
    void setBpm (double newBpm);

    /** Render the loaded project offline to a WAV file for the given duration.
        Returns an empty string on success, or an error message. */
    juce::String renderToFile (const juce::File& outputFile, double seconds);

private:
    void audioDeviceIOCallbackWithContext (const float* const* inputChannelData,
                                           int numInputChannels,
                                           float* const* outputChannelData,
                                           int numOutputChannels,
                                           int numSamples,
                                           const juce::AudioIODeviceCallbackContext& context) override;

    void audioDeviceAboutToStart (juce::AudioIODevice* device) override;
    void audioDeviceStopped() override;

    void processBlock (float* const* outputChannelData,
                       int numOutputChannels,
                       int numSamples);

    void triggerEvent (const gravsystem::Track& track,
                       const gravsystem::Region& region,
                       const gravsystem::MidiEvent& event);

    void renderMetronome (float* const* outputChannelData,
                          int numOutputChannels,
                          int numSamples);

    struct Voice
    {
        bool active = false;
        bool isDrum = false;
        double frequency = 440.0;
        double phase = 0.0;
        float amplitude = 0.0f;
        double pan = 0.0;

        int ageSamples = 0;
        int durationSamples = 0;
        int releaseSamples = 0;

        double attackSamples = 0.0;
        double decaySamples = 0.0;
        double sustainLevel = 0.7;
    };

    static double midiNoteToFrequency (int note);
    static float envelopeForVoice (const Voice& voice);

    gravsystem::ProjectModel* projectModel;
    juce::AudioDeviceManager deviceManager;
    std::atomic<bool> playing { false };
    std::atomic<bool> looping { false };
    std::atomic<bool> recording { false };
    std::atomic<double> bpm { 120.0 };
    double sampleRate = 44100.0;
    std::atomic<int64> currentSample { 0 };

    juce::Array<Voice> voices;
    juce::CriticalSection voiceLock;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (AudioEngine)
};
