#include "ProjectModel.h"

namespace gravsystem
{

namespace
{
    template <typename T>
    T valueOr (const juce::var& v, T defaultValue)
    {
        if (v.isUndefined() || v.isVoid())
            return defaultValue;

        return static_cast<T> (v);
    }

    juce::String stringOr (const juce::var& v, const juce::String& defaultValue)
    {
        if (v.isUndefined() || v.isVoid())
            return defaultValue;

        return v.toString();
    }

    juce::Colour colourForTrackIndex (int index)
    {
        const juce::Colour palette[] =
        {
            juce::Colours::cyan,
            juce::Colours::magenta,
            juce::Colours::yellow,
            juce::Colours::limegreen,
            juce::Colours::orange,
            juce::Colours::violet,
            juce::Colours::lightcoral,
            juce::Colours::lightblue,
        };

        return palette[static_cast<size_t> (index) % (sizeof (palette) / sizeof (juce::Colour))];
    }

    MidiEvent parseMidiEvent (const juce::var& eventVar)
    {
        MidiEvent event;

        if (auto* eventObj = eventVar.getDynamicObject())
        {
            const auto& props = eventObj->getProperties();
            event.pitch = valueOr<int> (props.getWithDefault ("pitch", {}), 60);
            event.velocity = valueOr<int> (props.getWithDefault ("velocity", {}), 100);
            event.startBeat = valueOr<double> (props.getWithDefault ("start", {}), 0.0);
            event.durationBeats = valueOr<double> (props.getWithDefault ("duration", {}), 0.25);
        }

        return event;
    }

    InstrumentParams parseInstrumentParams (const juce::var& paramsVar)
    {
        InstrumentParams params;

        if (auto* paramsObj = paramsVar.getDynamicObject())
        {
            const auto& props = paramsObj->getProperties();
            params.attack = valueOr<double> (props.getWithDefault ("attack", {}), 0.02);
            params.decay = valueOr<double> (props.getWithDefault ("decay", {}), 0.2);
            params.sustain = valueOr<double> (props.getWithDefault ("sustain", {}), 0.7);
            params.release = valueOr<double> (props.getWithDefault ("release", {}), 0.5);
            params.cutoff = valueOr<double> (props.getWithDefault ("cutoff", {}), 20000.0);
            params.resonance = valueOr<double> (props.getWithDefault ("resonance", {}), 1.0);
            params.reverb = valueOr<double> (props.getWithDefault ("reverb", {}), 0.25);
            params.delay = valueOr<double> (props.getWithDefault ("delay", {}), 0.2);
        }

        return params;
    }

    Region parseRegion (const juce::var& regionVar)
    {
        Region region;

        if (auto* regionObj = regionVar.getDynamicObject())
        {
            const auto& props = regionObj->getProperties();
            region.id = stringOr (props.getWithDefault ("id", {}), juce::Uuid().toString());
            region.trackId = stringOr (props.getWithDefault ("trackId", {}), {});
            region.name = stringOr (props.getWithDefault ("name", {}), "Region");
            region.startBeat = valueOr<double> (props.getWithDefault ("startBeat", {}), 0.0);
            region.duration = valueOr<double> (props.getWithDefault ("duration", {}), 4.0);
            region.type = stringOr (props.getWithDefault ("type", {}), "midi");
            region.transpose = valueOr<int> (props.getWithDefault ("transpose", {}), 0);
            region.gain = static_cast<float> (valueOr<double> (props.getWithDefault ("gain", {}), 1.0));

            if (auto* events = props.getWithDefault ("midiEvents", {}).getArray())
            {
                for (const auto& eventVar : *events)
                    region.midiEvents.add (parseMidiEvent (eventVar));
            }
        }

        return region;
    }

    Track parseTrack (const juce::var& trackVar)
    {
        Track track;

        if (auto* trackObj = trackVar.getDynamicObject())
        {
            const auto& props = trackObj->getProperties();
            track.id = stringOr (props.getWithDefault ("id", {}), juce::Uuid().toString());
            track.name = stringOr (props.getWithDefault ("name", {}), "Track");
            track.type = stringOr (props.getWithDefault ("type", {}), "midi");
            track.instrument = stringOr (props.getWithDefault ("instrument", {}), {});
            track.instrumentType = stringOr (props.getWithDefault ("instrumentType", {}), {});
            track.channel = valueOr<int> (props.getWithDefault ("channel", {}), 1);
            track.volume = static_cast<float> (valueOr<double> (props.getWithDefault ("volume", {}), 1.0));
            track.pan = static_cast<float> (valueOr<double> (props.getWithDefault ("pan", {}), 0.0));
            track.mute = valueOr<bool> (props.getWithDefault ("mute", {}), false);
            track.solo = valueOr<bool> (props.getWithDefault ("solo", {}), false);
            track.instrumentParams = parseInstrumentParams (props.getWithDefault ("instrumentParams", {}));

            if (auto* regions = props.getWithDefault ("regions", {}).getArray())
            {
                for (const auto& regionVar : *regions)
                    track.regions.add (parseRegion (regionVar));
            }
        }

        return track;
    }
}

ProjectModel::ProjectModel() = default;
ProjectModel::~ProjectModel() = default;

juce::String ProjectModel::loadFromJson (const juce::String& json)
{
    juce::var parsed;
    auto result = juce::JSON::parse (json, parsed);

    if (result.failed())
        return "JSON parse error: " + result.getErrorMessage();

    if (! parsed.isObject())
        return "JSON error: expected a project object.";

    auto* projectObj = parsed.getDynamicObject();
    if (projectObj == nullptr)
        return "JSON error: could not read project object.";

    const auto& props = projectObj->getProperties();

    Project newProject;
    newProject.id = stringOr (props.getWithDefault ("id", {}), juce::Uuid().toString());
    newProject.title = stringOr (props.getWithDefault ("title", {}), "Untitled Project");
    newProject.description = stringOr (props.getWithDefault ("description", {}), {});
    newProject.style = stringOr (props.getWithDefault ("style", {}), "dance");
    newProject.bpm = valueOr<double> (props.getWithDefault ("bpm", {}), 120.0);
    newProject.key = stringOr (props.getWithDefault ("key", {}), "C");
    newProject.scale = stringOr (props.getWithDefault ("scale", {}), "minor");
    newProject.bars = valueOr<int> (props.getWithDefault ("bars", {}), 16);

    if (auto* ts = props.getWithDefault ("timeSignature", {}).getArray())
    {
        if (ts->size() >= 2)
        {
            newProject.timeSignatureNumerator = static_cast<int> (ts->getReference (0));
            newProject.timeSignatureDenominator = static_cast<int> (ts->getReference (1));
        }
    }

    if (auto* tracks = props.getWithDefault ("tracks", {}).getArray())
    {
        int trackIndex = 0;

        for (const auto& trackVar : *tracks)
        {
            Track track = parseTrack (trackVar);
            track.colour = colourForTrackIndex (trackIndex++);
            newProject.tracks.add (std::move (track));
        }
    }

    project = std::move (newProject);
    loaded = true;

    listeners.call ([this] (ProjectModelListener& l) { l.projectLoaded (this); });
    return {};
}

void ProjectModel::addListener (ProjectModelListener* listener)
{
    listeners.add (listener);
}

void ProjectModel::removeListener (ProjectModelListener* listener)
{
    listeners.remove (listener);
}

} // namespace gravsystem
