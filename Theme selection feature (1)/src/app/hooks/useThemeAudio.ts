import { useEffect, useRef, useCallback } from 'react';
import type { AudioType } from '../App';

export function useThemeAudio(audioType: AudioType, enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const playingNodesRef = useRef<Array<AudioBufferSourceNode | OscillatorNode>>([]);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const killNodes = useCallback(() => {
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
    playingNodesRef.current.forEach(node => {
      try { node.stop(); } catch {}
    });
    playingNodesRef.current = [];
  }, []);

  const fadeOutAndStop = useCallback(() => {
    if (!masterGainRef.current || !ctxRef.current) return;
    const gain = masterGainRef.current;
    const now = ctxRef.current.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0, now, 0.15);
    cleanupTimerRef.current = setTimeout(killNodes, 800);
  }, [killNodes]);

  const startAudio = useCallback((type: AudioType) => {
    killNodes();

    const ctx = getCtx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    const now = ctx.currentTime;
    master.gain.setTargetAtTime(0.9, now, 0.4);

    if (type === 'binaural') {
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.04;
      oscGain.connect(master);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 200;
      osc1.connect(oscGain);
      osc1.start();

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 204;
      osc2.connect(oscGain);
      osc2.start();

      playingNodesRef.current = [osc1, osc2];
    }

    if (type === 'fire') {
      const bufLen = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 280;
      lp.Q.value = 0.3;

      const fireGain = ctx.createGain();
      fireGain.gain.value = 0.18;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.4;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.06;
      lfo.connect(lfoGain);
      lfoGain.connect(fireGain.gain);

      src.connect(lp);
      lp.connect(fireGain);
      fireGain.connect(master);
      src.start();
      lfo.start();

      playingNodesRef.current = [src, lfo];
    }

    if (type === 'white-noise') {
      const bufLen = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 500;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.07;

      src.connect(hp);
      hp.connect(noiseGain);
      noiseGain.connect(master);
      src.start();

      playingNodesRef.current = [src];
    }

    if (type === 'rain') {
      const bufLen = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufLen; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.9690 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.310486;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1200;

      const rainGain = ctx.createGain();
      rainGain.gain.value = 0.22;

      src.connect(hp);
      hp.connect(rainGain);
      rainGain.connect(master);
      src.start();

      playingNodesRef.current = [src];
    }

    // Night City: distant traffic rumble + neon electric hum
    if (type === 'city') {
      const nodes: Array<AudioBufferSourceNode | OscillatorNode> = [];

      // Low traffic rumble (brown noise, very lowpass)
      const rumbleLen = ctx.sampleRate * 4;
      const rumbleBuf = ctx.createBuffer(1, rumbleLen, ctx.sampleRate);
      const rumbleData = rumbleBuf.getChannelData(0);
      let prev = 0;
      for (let i = 0; i < rumbleLen; i++) {
        const w = Math.random() * 2 - 1;
        prev = (prev + 0.02 * w) / 1.02;
        rumbleData[i] = prev * 3.5;
      }
      const rumbleSrc = ctx.createBufferSource();
      rumbleSrc.buffer = rumbleBuf;
      rumbleSrc.loop = true;
      const rumbleLp = ctx.createBiquadFilter();
      rumbleLp.type = 'lowpass';
      rumbleLp.frequency.value = 120;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0.25;
      rumbleSrc.connect(rumbleLp);
      rumbleLp.connect(rumbleGain);
      rumbleGain.connect(master);
      rumbleSrc.start();
      nodes.push(rumbleSrc);

      // Electric neon hum: 60Hz + harmonics
      const humOsc = ctx.createOscillator();
      humOsc.type = 'sawtooth';
      humOsc.frequency.value = 60;
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'bandpass';
      humFilter.frequency.value = 180;
      humFilter.Q.value = 8;
      const humGain = ctx.createGain();
      humGain.gain.value = 0.018;
      humOsc.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(master);
      humOsc.start();
      nodes.push(humOsc);

      // Mid-range city noise (voices, distant)
      const cityLen = ctx.sampleRate * 3;
      const cityBuf = ctx.createBuffer(1, cityLen, ctx.sampleRate);
      const cityData = cityBuf.getChannelData(0);
      for (let i = 0; i < cityLen; i++) cityData[i] = Math.random() * 2 - 1;
      const citySrc = ctx.createBufferSource();
      citySrc.buffer = cityBuf;
      citySrc.loop = true;
      const cityBp = ctx.createBiquadFilter();
      cityBp.type = 'bandpass';
      cityBp.frequency.value = 800;
      cityBp.Q.value = 0.4;
      const cityGain = ctx.createGain();
      cityGain.gain.value = 0.05;
      // Slow LFO to simulate passing traffic
      const cityLfo = ctx.createOscillator();
      cityLfo.type = 'sine';
      cityLfo.frequency.value = 0.15;
      const cityLfoGain = ctx.createGain();
      cityLfoGain.gain.value = 0.03;
      cityLfo.connect(cityLfoGain);
      cityLfoGain.connect(cityGain.gain);
      citySrc.connect(cityBp);
      cityBp.connect(cityGain);
      cityGain.connect(master);
      citySrc.start();
      cityLfo.start();
      nodes.push(citySrc, cityLfo);

      playingNodesRef.current = nodes;
    }

    // Forest: rustling leaves + distant stream
    if (type === 'forest') {
      const nodes: Array<AudioBufferSourceNode | OscillatorNode> = [];

      // Rustling leaves: pink noise, highpass
      const leafLen = ctx.sampleRate * 5;
      const leafBuf = ctx.createBuffer(1, leafLen, ctx.sampleRate);
      const leafData = leafBuf.getChannelData(0);
      let bl0 = 0, bl1 = 0, bl2 = 0, bl3 = 0, bl4 = 0, bl5 = 0, bl6 = 0;
      for (let i = 0; i < leafLen; i++) {
        const w = Math.random() * 2 - 1;
        bl0 = 0.99886 * bl0 + w * 0.0555179;
        bl1 = 0.99332 * bl1 + w * 0.0750759;
        bl2 = 0.969 * bl2 + w * 0.153852;
        bl3 = 0.8665 * bl3 + w * 0.310486;
        bl4 = 0.55 * bl4 + w * 0.5329522;
        bl5 = -0.7616 * bl5 - w * 0.016898;
        leafData[i] = (bl0 + bl1 + bl2 + bl3 + bl4 + bl5 + bl6 + w * 0.5362) * 0.11;
        bl6 = w * 0.115926;
      }
      const leafSrc = ctx.createBufferSource();
      leafSrc.buffer = leafBuf;
      leafSrc.loop = true;
      const leafHp = ctx.createBiquadFilter();
      leafHp.type = 'highpass';
      leafHp.frequency.value = 2000;
      const leafGain = ctx.createGain();
      leafGain.gain.value = 0.3;
      // Wind LFO
      const windLfo = ctx.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.value = 0.07;
      const windLfoGain = ctx.createGain();
      windLfoGain.gain.value = 0.15;
      windLfo.connect(windLfoGain);
      windLfoGain.connect(leafGain.gain);
      leafSrc.connect(leafHp);
      leafHp.connect(leafGain);
      leafGain.connect(master);
      leafSrc.start();
      windLfo.start();
      nodes.push(leafSrc, windLfo);

      // Stream: lowpass noise
      const streamLen = ctx.sampleRate * 3;
      const streamBuf = ctx.createBuffer(1, streamLen, ctx.sampleRate);
      const streamData = streamBuf.getChannelData(0);
      for (let i = 0; i < streamLen; i++) streamData[i] = Math.random() * 2 - 1;
      const streamSrc = ctx.createBufferSource();
      streamSrc.buffer = streamBuf;
      streamSrc.loop = true;
      const streamLp = ctx.createBiquadFilter();
      streamLp.type = 'bandpass';
      streamLp.frequency.value = 600;
      streamLp.Q.value = 0.7;
      const streamGain = ctx.createGain();
      streamGain.gain.value = 0.12;
      streamSrc.connect(streamLp);
      streamLp.connect(streamGain);
      streamGain.connect(master);
      streamSrc.start();
      nodes.push(streamSrc);

      playingNodesRef.current = nodes;
    }

    // Cafe: warm mid-range chatter + soft background music hum
    if (type === 'cafe') {
      const nodes: Array<AudioBufferSourceNode | OscillatorNode> = [];

      // Chatter: bandpass noise around speech frequencies
      const chatterLen = ctx.sampleRate * 4;
      const chatterBuf = ctx.createBuffer(1, chatterLen, ctx.sampleRate);
      const chatterData = chatterBuf.getChannelData(0);
      for (let i = 0; i < chatterLen; i++) chatterData[i] = Math.random() * 2 - 1;
      const chatterSrc = ctx.createBufferSource();
      chatterSrc.buffer = chatterBuf;
      chatterSrc.loop = true;
      const chatterBp = ctx.createBiquadFilter();
      chatterBp.type = 'bandpass';
      chatterBp.frequency.value = 1200;
      chatterBp.Q.value = 0.5;
      const chatterGain = ctx.createGain();
      chatterGain.gain.value = 0.09;
      // Slow natural variation
      const chatLfo = ctx.createOscillator();
      chatLfo.type = 'sine';
      chatLfo.frequency.value = 0.2;
      const chatLfoG = ctx.createGain();
      chatLfoG.gain.value = 0.04;
      chatLfo.connect(chatLfoG);
      chatLfoG.connect(chatterGain.gain);
      chatterSrc.connect(chatterBp);
      chatterBp.connect(chatterGain);
      chatterGain.connect(master);
      chatterSrc.start();
      chatLfo.start();
      nodes.push(chatterSrc, chatLfo);

      // Espresso machine low hiss
      const hissLen = ctx.sampleRate * 2;
      const hissBuf = ctx.createBuffer(1, hissLen, ctx.sampleRate);
      const hissData = hissBuf.getChannelData(0);
      for (let i = 0; i < hissLen; i++) hissData[i] = Math.random() * 2 - 1;
      const hissSrc = ctx.createBufferSource();
      hissSrc.buffer = hissBuf;
      hissSrc.loop = true;
      const hissHp = ctx.createBiquadFilter();
      hissHp.type = 'highpass';
      hissHp.frequency.value = 3000;
      const hissGain = ctx.createGain();
      hissGain.gain.value = 0.04;
      hissSrc.connect(hissHp);
      hissHp.connect(hissGain);
      hissGain.connect(master);
      hissSrc.start();
      nodes.push(hissSrc);

      // Warm low hum (HVAC / refrigerator)
      const humOsc = ctx.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.value = 55;
      const humGain = ctx.createGain();
      humGain.gain.value = 0.025;
      humOsc.connect(humGain);
      humGain.connect(master);
      humOsc.start();
      nodes.push(humOsc);

      playingNodesRef.current = nodes;
    }

    // Space Station: deep machinery hum + pressurization tone
    if (type === 'space') {
      const nodes: Array<AudioBufferSourceNode | OscillatorNode> = [];

      // Deep sub-bass machinery hum
      const hum1 = ctx.createOscillator();
      hum1.type = 'sine';
      hum1.frequency.value = 40;
      const humGain1 = ctx.createGain();
      humGain1.gain.value = 0.12;
      hum1.connect(humGain1);
      humGain1.connect(master);
      hum1.start();
      nodes.push(hum1);

      const hum2 = ctx.createOscillator();
      hum2.type = 'sine';
      hum2.frequency.value = 80;
      const humGain2 = ctx.createGain();
      humGain2.gain.value = 0.06;
      hum2.connect(humGain2);
      humGain2.connect(master);
      hum2.start();
      nodes.push(hum2);

      // Life support hiss (filtered white noise)
      const hissLen = ctx.sampleRate * 3;
      const hissBuf = ctx.createBuffer(1, hissLen, ctx.sampleRate);
      const hissData = hissBuf.getChannelData(0);
      for (let i = 0; i < hissLen; i++) hissData[i] = Math.random() * 2 - 1;
      const hissSrc = ctx.createBufferSource();
      hissSrc.buffer = hissBuf;
      hissSrc.loop = true;
      const hissBp = ctx.createBiquadFilter();
      hissBp.type = 'bandpass';
      hissBp.frequency.value = 300;
      hissBp.Q.value = 1.5;
      const hissGain = ctx.createGain();
      hissGain.gain.value = 0.06;
      hissSrc.connect(hissBp);
      hissBp.connect(hissGain);
      hissGain.connect(master);
      hissSrc.start();
      nodes.push(hissSrc);

      // Slow pulsing LFO on overall volume (heartbeat of the station)
      const pulseLfo = ctx.createOscillator();
      pulseLfo.type = 'sine';
      pulseLfo.frequency.value = 0.05;
      const pulseLfoGain = ctx.createGain();
      pulseLfoGain.gain.value = 0.08;
      pulseLfo.connect(pulseLfoGain);
      pulseLfoGain.connect(master.gain);
      pulseLfo.start();
      nodes.push(pulseLfo);

      playingNodesRef.current = nodes;
    }
  }, [getCtx, killNodes]);

  useEffect(() => {
    if (enabled) {
      startAudio(audioType);
    } else {
      fadeOutAndStop();
    }
    return () => {
      fadeOutAndStop();
    };
  }, [enabled, audioType]);

  useEffect(() => {
    return () => {
      killNodes();
      ctxRef.current?.close().catch(() => {});
    };
  }, []);
}
