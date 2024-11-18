import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { WaveSurfer, WaveForm, Region } from "wavesurfer-react";
import "./App.css";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import sound from './assets/sound.wav';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);  // New state to track play/pause

  const plugins = useMemo(() => {
    return [
      {
        key: "regions",
        plugin: RegionsPlugin,
        options: { dragSelection: true },
      },
    ];
  }, []);

  const [regions, setRegions] = useState([
    {
      id: "region-1",
      start: 0,
      end: 0,
      color: "#d9eaf8",
      data: {
        systemRegionId: 31,
      },
    },
  ]);

  const regionsRef = useRef(regions);
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("00:00:00");

  useEffect(() => {
    regionsRef.current = regions;
  }, [regions]);

  const regionCreatedHandler = useCallback(
    (region) => {
      if (region.data.systemRegionId) return;

      setRegions([
        { ...region, data: { ...region.data, systemRegionId: -1 } },
      ]);
    },
    []
  );

  const wavesurferRef = useRef();

  const handleWSMount = useCallback(
    (waveSurfer) => {
      wavesurferRef.current = waveSurfer;

      if (wavesurferRef.current) {
        wavesurferRef.current.load(sound);

        wavesurferRef.current.on("region-created", regionCreatedHandler);

        wavesurferRef.current.on("ready", () => {
          setIsLoaded(true);
          
          const duration = wavesurferRef.current.getDuration();
          setAudioDuration(duration);

          const middleStart = duration / 4;
          const middleEnd = middleStart + duration / 2;

          setRegions([
            {
              id: "region-1",
              start: middleStart,
              end: middleEnd,
              color: "rgba(0, 0, 255, 0.1)",
              data: {
                systemRegionId: 31,
              },
            },
          ]);
        });

        wavesurferRef.current.on("finish", () => {
          setIsPlaying(false); // Reset to play state when audio finishes
        });

        if (window) {
          window.surferidze = wavesurferRef.current;
        }
      }
    },
    [regionCreatedHandler]
  );

  const playPauseHandler = useCallback(() => {
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const convertToSeconds = (time) => {
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const handleUpdateRegion = () => {
    const startInSeconds = convertToSeconds(startTime);
    const endInSeconds = convertToSeconds(endTime);

    if (startInSeconds < 0 || startInSeconds > audioDuration) {
      alert(`Start time must be between 0 and ${audioDuration} seconds.`);
      return;
    }

    if (endInSeconds < 0 || endInSeconds > audioDuration) {
      alert(`End time must be between 0 and ${audioDuration} seconds.`);
      return;
    }

    if (startInSeconds >= endInSeconds) {
      alert("End time must be greater than start time.");
      return;
    }

    setRegions((prevRegions) =>
      prevRegions.map((region) =>
        region.id === "region-1"
          ? { ...region, start: startInSeconds, end: endInSeconds }
          : region
      )
    );
  };

  const isValidTimeFormat = (time) => {
    const regex = /^([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
    return regex.test(time);
  };

  return (
    <div className="App">
      <WaveSurfer
        plugins={plugins}
        onMount={handleWSMount}
        cursorColor="transparent"
        container="#waveform"
        waveColor="#71b7f1"
        progressColor="#1e5f9f"
      >
        <WaveForm>
          {isLoaded &&
            regions.map((regionProps) => (
              <Region key={regionProps.id} {...regionProps} />
            ))}
        </WaveForm>
      </WaveSurfer>
      <div>
        <button onClick={playPauseHandler}>
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
      <div>
        <label>
          Start Time (hh:mm:ss):
          <input
            type="text"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="00:00:00"
          />
        </label>
        <label>
          End Time (hh:mm:ss):
          <input
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="00:00:00"
          />
        </label>
        <button onClick={handleUpdateRegion} disabled={!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)}>
          Update Region
        </button>
        {!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime) ? (
          <p style={{ color: "red" }}>Invalid time format. Use hh:mm:ss.</p>
        ) : null}
      </div>
    </div>
  );
}

export default App;