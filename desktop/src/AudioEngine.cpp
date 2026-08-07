#include "AudioEngine.h"

AudioEngine::AudioEngine (gravsystem::ProjectModel* model)
    : projectModel (model)
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

    juce::ScopedLock lock (voiceLock);

    for (auto& voice : voices)
        voice.active = false;
}

bool AudioEngine::isPlaying() const
{
    return playing;
}

void AudioEngine::setLooping (bool shouldLoop)
{
    looping = shouldLoop;
}

bool AudioEngine::isLooping() const
{
    return looping;
}

void AudioEngine::setRecording (bool shouldRecord)
{
    recording = shouldRecord;
}

bool AudioEngine::isRecording() const
{
    return recording;
}

double AudioEngine::getCurrentBeat() const
{
    const auto localBpm = bpm.load();

    if (localBpm <= 0.0)
        return 0.0;

    return static_cast<double> (currentSample.load()) * localBpm / (sampleRate * 60.0);
}

double AudioEngine::getBpm() const
{
    return bpm.load();
}

void AudioEngine::setBpm (double newBpm)
{
    bpm = juce::jmax (1.0, newBpm);
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

void AudioEngine::audioDeviceIOCallbackWithContext (const float* const* inputChannelData,
                                                    int numInputChannels,
                                                    float* const* outputChannelData,
                                                    int numOutputChannels,
                                                    int numSamples,
                                                    const juce::AudioIODeviceCallbackContext& context)
{
    juce::ignoreUnused (inputChannelData, numInputChannels, context);

    processBlock (outputChannelData, numOutputChannels, numSamples);
}

void AudioEngine::processBlock (float* const* outputChannelData,
                                int numOutputChannels,
                                int numSamples)
{
    for (int ch = 0; ch < numOutputChannels; ++ch)
    {
        if (outputChannelData[ch] != nullptr)
            juce::FloatVectorOperations::clear (outputChannelData[ch], numSamples);
    }

    if (! playing)
        return;

    const auto localBpm = bpm.load();
    const auto beatsPerSecond = localBpm / 60.0;
    const auto samplesPerBeat = sampleRate / beatsPerSecond;
    const auto beatIncrement = beatsPerSecond / sampleRate;

    const gravsystem::Project* project = nullptr;

    if (projectModel != nullptr && projectModel->isLoaded())
        project = &projectModel->getProject();

    const auto totalBeats = project != nullptr
                                ? static_cast<double> (project->bars * project->timeSignatureNumerator)
                                : std::numeric_limits<double>::max();

    for (int i = 0; i < numSamples; ++i)
    {
        const auto beat = static_cast<double> (currentSample.load()) * beatIncrement;

        if (project != nullptr && beat >= totalBeats)
        {
            if (looping.load())
            {
                currentSample = 0;
                continue;
            }

            playing = false;
            currentSample = 0;
            break;
        }

        // Trigger new notes whose start falls inside this sample's beat window.
        if (project != nullptr)
        {
            for (const auto& track : project->tracks)
            {
                if (track.mute)
                    continue;

                for (const auto& region : track.regions)
                {
                    if (region.type != "midi")
                        continue;

                    if (beat < region.startBeat || beat >= region.startBeat + region.duration)
                        continue;

                    for (const auto& event : region.midiEvents)
                    {
                        const auto eventStart = region.startBeat + event.startBeat;

                        if (eventStart >= beat && eventStart < beat + beatIncrement)
                            triggerEvent (track, region, event);
                    }
                }
            }
        }

        // Render active voices.
        float leftSample = 0.0f;
        float rightSample = 0.0f;

        {
            juce::ScopedLock lock (voiceLock);

            for (auto& voice : voices)
            {
                if (! voice.active)
                    continue;

                const auto env = envelopeForVoice (voice);

                if (env <= 0.0f)
                {
                    voice.active = false;
                    continue;
                }

                float osc = 0.0f;

                if (voice.isDrum)
                {
                    osc = static_cast<float> ((juce::Random::getSystemRandom().nextDouble() * 2.0 - 1.0));
                }
                else
                {
                    osc = static_cast<float> (std::sin (voice.phase));
                    voice.phase += juce::MathConstants<double>::twoPi * voice.frequency / sampleRate;

                    if (voice.phase >= juce::MathConstants<double>::twoPi)
                        voice.phase -= juce::MathConstants<double>::twoPi;
                }

                const auto panAngle = (voice.pan + 1.0) * juce::MathConstants<double>::pi / 4.0;
                const auto leftGain = static_cast<float> (std::cos (panAngle));
                const auto rightGain = static_cast<float> (std::sin (panAngle));

                leftSample += osc * env * voice.amplitude * leftGain;
                rightSample += osc * env * voice.amplitude * rightGain;

                ++voice.ageSamples;

                if (voice.ageSamples >= voice.durationSamples + voice.releaseSamples)
                    voice.active = false;
            }
        }

        // Simple click metronome on every quarter note.
        const auto beatSample = static_cast<int> (std::fmod (beat, 1.0) * samplesPerBeat);
        const float click = (beatSample < 800) ? 0.25f * (1.0f - beatSample / 800.0f) : 0.0f;
        leftSample += click;
        rightSample += click;

        if (numOutputChannels > 0 && outputChannelData[0] != nullptr)
            outputChannelData[0][i] += leftSample;

        if (numOutputChannels > 1 && outputChannelData[1] != nullptr)
            outputChannelData[1][i] += rightSample;

        ++currentSample;
    }
}

void AudioEngine::triggerEvent (const gravsystem::Track& track,
                                const gravsystem::Region& region,
                                const gravsystem::MidiEvent& event)
{
    const auto note = juce::jlimit (0, 127, event.pitch + region.transpose);
    const auto isDrum = track.instrumentType == "drums";

    Voice voice;
    voice.active = true;
    voice.isDrum = isDrum;
    voice.frequency = midiNoteToFrequency (note);
    voice.amplitude = juce::jmap (static_cast<float> (event.velocity), 0.0f, 127.0f, 0.0f, 0.25f);
    voice.pan = track.pan;
    voice.durationSamples = static_cast<int> (event.durationBeats * sampleRate * 60.0 / bpm.load());

    if (isDrum)
    {
        voice.attackSamples = sampleRate * 0.001;
        voice.decaySamples = sampleRate * 0.05;
        voice.sustainLevel = 0.0;
        voice.releaseSamples = static_cast<int> (sampleRate * 0.02);
    }
    else
    {
        voice.attackSamples = sampleRate * track.instrumentParams.attack;
        voice.decaySamples = sampleRate * track.instrumentParams.decay;
        voice.sustainLevel = track.instrumentParams.sustain;
        voice.releaseSamples = static_cast<int> (sampleRate * track.instrumentParams.release);
    }

    juce::ScopedLock lock (voiceLock);

    bool inserted = false;

    for (auto& slot : voices)
    {
        if (! slot.active)
        {
            slot = voice;
            inserted = true;
            break;
        }
    }

    if (! inserted)
    {
        if (voices.size() < 64)
            voices.add (voice);
        else
            voices.getReference (0) = voice; // Steal oldest voice.
    }
}

void AudioEngine::renderMetronome (float* const* /*outputChannelData*/,
                                   int /*numOutputChannels*/,
                                   int /*numSamples*/)
{
    // Metronome is rendered inline inside processBlock.
}

double AudioEngine::midiNoteToFrequency (int note)
{
    return 440.0 * std::pow (2.0, (note - 69.0) / 12.0);
}

float AudioEngine::envelopeForVoice (const Voice& voice)
{
    const auto age = static_cast<double> (voice.ageSamples);

    if (age < voice.attackSamples)
    {
        if (voice.attackSamples <= 0.0)
            return 1.0f;

        return static_cast<float> (age / voice.attackSamples);
    }

    if (age < voice.attackSamples + voice.decaySamples)
    {
        if (voice.decaySamples <= 0.0)
            return static_cast<float> (voice.sustainLevel);

        const auto t = (age - voice.attackSamples) / voice.decaySamples;
        return static_cast<float> (1.0 - (1.0 - voice.sustainLevel) * t);
    }

    if (age < voice.durationSamples)
    {
        return static_cast<float> (voice.sustainLevel);
    }

    if (age < voice.durationSamples + voice.releaseSamples)
    {
        if (voice.releaseSamples <= 0.0)
            return 0.0f;

        const auto t = (age - voice.durationSamples) / voice.releaseSamples;
        return static_cast<float> (voice.sustainLevel * (1.0 - t));
    }

    return 0.0f;
}
