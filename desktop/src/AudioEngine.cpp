#include "AudioEngine.h"

AudioEngine::AudioEngine()
{
    auto result = deviceManager.initialise (0, 2, nullptr, true);
    juce::ignoreUnused (result);
    deviceManager.addAudioCallback (this);
}

AudioEngine::~AudioEngine()
{
    deviceManager.removeAudioCallback (this);
}

void AudioEngine::startTransport()
{
    playing = true;
}

void AudioEngine::stopTransport()
{
    playing = false;
    currentSample = 0;
}

bool AudioEngine::isPlaying() const
{
    return playing;
}

void AudioEngine::audioDeviceAboutToStart (juce::AudioIODevice* device)
{
    sampleRate = device->getCurrentSampleRate();
    currentSample = 0;
}

void AudioEngine::audioDeviceStopped()
{
    currentSample = 0;
}

void AudioEngine::audioDeviceIOCallbackWithContext (const float* const* /*inputChannelData*/,
                                                    int /*numInputChannels*/,
                                                    float* const* outputChannelData,
                                                    int numOutputChannels,
                                                    int numSamples,
                                                    const juce::AudioIODeviceCallbackContext& /*context*/)
{
    for (int ch = 0; ch < numOutputChannels; ++ch)
    {
        if (outputChannelData[ch] != nullptr)
            juce::FloatVectorOperations::clear (outputChannelData[ch], numSamples);
    }

    if (! playing)
        return;

    // Simple metronome click on every quarter note.
    const double bpm = 120.0;
    const double samplesPerBeat = sampleRate * 60.0 / bpm;

    for (int i = 0; i < numSamples; ++i)
    {
        const auto beatSample = static_cast<int64> (currentSample % static_cast<int64> (samplesPerBeat));
        const float click = (beatSample < 1000) ? 0.3f * (1.0f - beatSample / 1000.0f) : 0.0f;

        for (int ch = 0; ch < numOutputChannels; ++ch)
            outputChannelData[ch][i] += click;

        ++currentSample;
    }
}
