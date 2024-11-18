import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import './App.css';
import sound from './assets/sound.wav';

function Ap() {
  const waveformRef = useRef(null);
  const timelineRef = useRef(null);
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [regionExists, setRegionExists] = useState(false);
  const [regionStart, setRegionStart] = useState('');
  const [regionEnd, setRegionEnd] = useState('');

  useEffect(() => {
    // Initialize WaveSurfer
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgb(200, 0, 200)',
      progressColor: 'rgb(100, 0, 100)',
      cursorColor: 'violet',
      plugins: [
        TimelinePlugin.create({
          container: timelineRef.current,
        }),
        RegionsPlugin.create(),
      ],
      height: 150,
      responsive: true,
    });

    ws.load(sound);

    ws.on('ready', () => {
      console.log('WaveSurfer is ready');
    });

    ws.on('region-created', () => {
      setRegionExists(true);
      updateRegionInputs(ws);
    });

    ws.on('region-updated', () => {
      const regions = ws.regions.list;
      const regionCount = Object.keys(regions).length;
      setRegionExists(regionCount > 0);
      if (regionCount > 0) {
        updateRegionInputs(ws);
      }
    });

    ws.on('region-removed', () => {
      setRegionExists(false);
      setRegionStart('');
      setRegionEnd('');
    });

    ws.on('finish', () => {
      setPlaying(false); // Set playing to false when audio ends
    });

    setWaveSurfer(ws);

    return () => {
      ws.destroy();
    };
  }, []);

  const handlePlayPause = () => {
    if (waveSurfer) {
      waveSurfer.playPause();
      setPlaying(!playing);
    }
  };

  const handleAddRegion = () => {
    if (waveSurfer && !regionExists) { // Prevent adding a region if one already exists
      const duration = waveSurfer.getDuration();
      waveSurfer.addRegion({
        start: duration / 2 - duration / 5,
        end: duration / 2,
        color: 'hsla(265, 100%, 86%, 0.4)',
        drag: true, // Allow dragging
      });
    }
  };

  const handleTrim = () => {
    if (waveSurfer) {
      const region = waveSurfer.regions.list[Object.keys(waveSurfer.regions.list)[0]];
      if (region) {
        const { start, end } = region;
        const originalBuffer = waveSurfer.backend.buffer;
        const trimmedBuffer = waveSurfer.backend.ac.createBuffer(
          originalBuffer.numberOfChannels,
          (end - start) * originalBuffer.sampleRate,
          originalBuffer.sampleRate
        );

        for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
          const channelData = originalBuffer.getChannelData(i).subarray(
            start * originalBuffer.sampleRate,
            end * originalBuffer.sampleRate
          );
          trimmedBuffer.copyToChannel(channelData, i);
        }

        waveSurfer.loadDecodedBuffer(trimmedBuffer);
        setRegionExists(false); // Reset region state after trimming
        waveSurfer.clearRegions(); // Remove all regions
        waveSurfer.pause(); // Stop playback after trimming
        setPlaying(false); // Ensure playing state is reset
      }
    }
  };

  const updateRegionInputs = (ws) => {
    const region = ws.regions.list[Object.keys(ws.regions.list)[0]];
    if (region) {
      setRegionStart(Math.floor(region.start)); // Round to whole seconds
      setRegionEnd(Math.floor(region.end)); // Round to whole seconds
    }
  };

  const handleStartChange = (e) => {
    const newStart = e.target.value === '' ? '' : parseInt(e.target.value); // Allow empty input and convert to integer
    const duration = waveSurfer.getDuration();

    // Validation: Start cannot be less than 0 or greater than audio length
    if (newStart === '' || (newStart >= 0 && newStart <= duration)) {
      setRegionStart(newStart);
      updateRegion(newStart, regionEnd);
    }
  };

  const handleEndChange = (e) => {
    const newEnd = e.target.value === '' ? '' : parseInt(e.target.value); // Allow empty input and convert to integer
    const duration = waveSurfer.getDuration();

    // Validation: End cannot be less than start or greater than audio length
    if (newEnd === '' || (newEnd >= regionStart && newEnd <= duration)) {
      setRegionEnd(newEnd);
      updateRegion(regionStart, newEnd);
    }
  };

  const updateRegion = (start, end) => {
    if (waveSurfer) {
      const region = waveSurfer.regions.list[Object.keys(waveSurfer.regions.list)[0]];
      if (region) {
        region.update({
          start: start,
          end: end,
        });
      }
    }
  };

  return (
    <div className="App">
      <div id="waveform" ref={waveformRef}></div>
      <div id="wave-timeline" ref={timelineRef}></div>

      <div className="controls">
        <button onClick={handlePlayPause}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={handleAddRegion} disabled={regionExists}> {/* Disable button if region exists */}
          Add Region
        </button>
        <button onClick={handleTrim} disabled={!regionExists}>
          Trim
        </button>

        {regionExists && (
          <div>
            <input
              type="number"
              value={regionStart === '' ? '' : regionStart} // Handle empty input correctly
              onChange={handleStartChange}
              placeholder="Start (in seconds)"
              step="1" // Allow whole number seconds input
            />
            <input
              type="number"
              value={regionEnd === '' ? '' : regionEnd}
              onChange={handleEndChange}
              placeholder="End (in seconds)"
              step="1" // Allow whole number seconds input
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Ap;
