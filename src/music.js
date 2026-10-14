// Procedural "epic trailer" loop built on Shepard tones: every pitched sound
// is made of octave-spaced partials under a fixed bell-shaped loudness curve,
// so the music can keep climbing while the loop quietly wraps to the start.
//
// The chords must only ever step upwards, including the step from the last
// chord back to the first. The Shepard voicing hides the octave wrap.

// Seconds of music queued on the audio thread. Generous, so throttled or
// briefly blocked timers in the page can't starve the audio.
const SCHEDULE_AHEAD = 4;
const D1 = 36.71;

// Instruments
const BRASS = {
  attack: 0.25,
  release: 0.6,
  fmin: D1,
  octaves: 5,
  sigma: 0.22,
  type: "sawtooth",
  peak: 0.045,
  swell: [300, 2000, 800],
};

const STRING_PAD = {
  attack: 0.5,
  release: 0.8,
  fmin: D1 * 4,
  octaves: 4,
  sigma: 0.25,
  type: "triangle",
  peak: 0.03,
  cutoff: 5000,
};

const SPICCATO = {
  duration: 0.07,
  attack: 0.004,
  release: 0.06,
  fmin: D1 * 2,
  octaves: 5,
  sigma: 0.2,
  type: "sawtooth",
  peak: 0.07,
  cutoff: 2800,
};

const DRUMS = {
  low: { from: 160, to: 45, decay: 0.9, noiseFrequency: 250, level: 0.9 },
  mid: { from: 230, to: 95, decay: 0.4, noiseFrequency: 600, level: 0.5 },
  high: { from: 420, to: 260, decay: 0.12, noiseFrequency: 2500, level: 0.3 },
  boom: { from: 120, to: 32, decay: 1.8, noiseFrequency: 150, level: 1.1 },
  // The softer first half of a heartbeat, the boom being the second
  lub: { from: 85, to: 45, decay: 0.3, noiseFrequency: 100, level: 0.6 },
};

// How long before the boom the "lub" of the heartbeat comes
const HEARTBEAT_GAP = 0.22;

const EVERY_SIXTEENTH = (velocity) =>
  Object.fromEntries(Array.from({ length: 16 }, (_, step) => [step, velocity]));

// Sixteenths as [chord tone index, velocity], accented 3 + 3 + 2
const ACCENT_332 = [
  [0, 1], [0, 0.45], [2, 0.6], [0, 0.9], [0, 0.45], [2, 0.6], [1, 0.9], [2, 0.6],
  [0, 1], [0, 0.45], [2, 0.6], [0, 0.9], [0, 0.45], [2, 0.6], [1, 0.9], [2, 0.7],
];

// "Taistelu": taikos, string riff and brass swells
const THEME = {
  bpm: 120,
  chords: [
    [0, 3, 7], // Dm
    [3, 7, 10], // F
    [5, 9, 12], // G
    [7, 11, 14], // A
    [8, 12, 15], // Bb
    [10, 14, 17], // C
  ],
  sustained: [BRASS, STRING_PAD],
  ostinatos: [{ ...SPICCATO, pattern: ACCENT_332 }],
  // Drum patterns: sixteenth -> velocity
  drums: [
    [DRUMS.low, { 0: 1, 6: 0.7, 8: 0.9, 14: 0.6 }],
    [DRUMS.mid, { 3: 0.5, 4: 0.8, 11: 0.5, 12: 0.8, 15: 0.6 }],
    [DRUMS.high, { 2: 0.3, 7: 0.3, 10: 0.4, 13: 0.4, 14: 0.5, 15: 0.6 }],
  ],
  gliss: { peak: 0.05, type: "triangle" },
  reverb: { seconds: 3.5, wet: 0.35 },
  finale: {
    // Everything grows over this many seconds before the finale
    buildSeconds: 120,
    // Bells chime the last seconds
    countdownSeconds: 10,
    // At full build, multipliers on top of the normal levels
    glissBoost: 3,
    brassBoost: 0.6,
    padBoost: 1,
    ostinatoBoost: 0.4,
    swellBoost: 1.5,
    // Extra drums that join as the build passes `from` (0..1)
    drums: [
      { from: 0.25, drum: DRUMS.low, pattern: { 2: 0.5, 4: 0.6, 10: 0.5, 12: 0.6 } },
      { from: 0.5, drum: DRUMS.mid, pattern: { 12: 0.5, 13: 0.6, 14: 0.8, 15: 1 } },
      { from: 0.75, drum: DRUMS.high, pattern: EVERY_SIXTEENTH(0.45) },
    ],
    // The minor key turns major for the big hit
    chord: [0, 4, 7], // D
  },
};

// Endless glissando spread over this many octaves, one octave per loop
const GLISS_OCTAVES = 7;
const GLISS_SIGMA = 0.15;

// Loudness of a partial at position x (0..1) across the Shepard range
function bell(x, sigma) {
  return Math.exp(-((x - 0.5) ** 2) / (2 * sigma ** 2));
}

function createNoiseBuffer(ctx, seconds) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createReverb(ctx, seconds) {
  const length = ctx.sampleRate * seconds;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

// Partials quieter than this are not worth an oscillator
const MIN_PARTIAL_WEIGHT = 0.02;

function shepardNote(ctx, destination, time, semitone, duration, sound, peak) {
  const { attack, release, fmin, octaves, sigma, type } = sound;
  const end = time + duration + release;

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(peak, time + attack);
  envelope.gain.setValueAtTime(peak, time + duration);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  envelope.connect(destination);

  const pitchClass = (((semitone % 12) + 12) % 12) / 12;
  for (let octave = 0; octave < octaves; octave++) {
    const position = octave + pitchClass;
    const loudness = bell(position / octaves, sigma);
    if (loudness < MIN_PARTIAL_WEIGHT) {
      continue;
    }
    const oscillator = ctx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = fmin * 2 ** position;
    const weight = ctx.createGain();
    weight.gain.value = loudness;
    oscillator.connect(weight).connect(envelope);
    oscillator.start(time);
    oscillator.stop(end + 0.05);
  }
}

// One partial of the endless glissando. Each voice lives for GLISS_OCTAVES
// loops, sweeping the whole range and fading in and out at the edges, so no
// voice ever starts or stops audibly. `offset` lets us join a voice midway.
function glissVoice(ctx, destination, startTime, offset, loop, gliss) {
  const life = GLISS_OCTAVES * loop;
  const remaining = life - offset;

  const oscillator = ctx.createOscillator();
  oscillator.type = gliss.type;
  oscillator.frequency.setValueAtTime(D1 * 2 ** (offset / loop), startTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    D1 * 2 ** GLISS_OCTAVES,
    startTime + remaining
  );

  const curve = new Float32Array(512);
  for (let i = 0; i < curve.length; i++) {
    const x = (offset + (remaining * i) / (curve.length - 1)) / life;
    curve[i] = bell(x, GLISS_SIGMA) * gliss.peak;
  }
  const gain = ctx.createGain();
  gain.gain.setValueCurveAtTime(curve, startTime, remaining);

  oscillator.connect(gain).connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + remaining);
}

function drumHit(ctx, destination, noise, time, velocity, drum) {
  const body = ctx.createOscillator();
  body.frequency.setValueAtTime(drum.from, time);
  body.frequency.exponentialRampToValueAtTime(drum.to, time + 0.12);
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(velocity * drum.level, time);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + drum.decay);
  body.connect(bodyGain).connect(destination);
  body.start(time);
  body.stop(time + drum.decay);

  const hit = ctx.createBufferSource();
  hit.buffer = noise;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = drum.noiseFrequency;
  const hitGain = ctx.createGain();
  hitGain.gain.setValueAtTime(velocity * drum.level * 0.6, time);
  hitGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
  hit.connect(band).connect(hitGain).connect(destination);
  hit.start(time);
  hit.stop(time + 0.1);
}

function crash(ctx, destination, noise, time) {
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 4000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 3);
  source.connect(filter).connect(gain).connect(destination);
  source.start(time);
  source.stop(time + 3);
}

// Noise whoosh sweeping up into `end`
function riser(ctx, destination, noise, time, end) {
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(400, time);
  filter.frequency.exponentialRampToValueAtTime(8000, end);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.35, end);
  gain.gain.linearRampToValueAtTime(0, end + 0.02);
  source.connect(filter).connect(gain).connect(destination);
  source.start(time);
  source.stop(end + 0.05);
}

// Inharmonic partials of a bright bell: [frequency ratio, level, decay]
const CHIME_PARTIALS = [
  [1, 1, 2.5],
  [2, 0.5, 1.5],
  [2.76, 0.35, 1],
  [5.4, 0.2, 0.5],
  [8.93, 0.1, 0.3],
];

function chime(ctx, destination, time, frequency, velocity) {
  for (const [ratio, level, decay] of CHIME_PARTIALS) {
    const oscillator = ctx.createOscillator();
    oscillator.frequency.value = frequency * ratio;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(velocity * level * 0.15, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    oscillator.connect(gain).connect(destination);
    oscillator.start(time);
    oscillator.stop(time + decay);
  }
}

// Keeps the bars locked to the wall clock so the finale lands on the second
// the countdown hits zero: drift beyond the tolerance is nudged away a few
// milliseconds per bar, far too little to hear
const DRIFT_TOLERANCE = 0.005;
const MAX_NUDGE = 0.01;

// `finale` is a Date.now() style timestamp the music builds up to, optional
export function createHypeMusic({ finale } = {}) {
  const bar = (60 / THEME.bpm) * 4;
  const sixteenth = bar / 16;
  const loopBars = THEME.chords.length;
  const loop = bar * loopBars;
  const { finale: FINALE } = THEME;

  let ctx;
  let master;
  let bus;
  let noise;
  let timer;
  let nextBarTime;
  let barIndex;
  let nextGlissTime;
  let glissInput;
  // Set once the finale hit is scheduled, nothing plays after it
  let ended;
  // One shared lowpass per instrument instead of one per note
  let sustainedInputs;
  let ostinatoInputs;

  function createInput(sound) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = sound.swell ? sound.swell[2] : sound.cutoff;
    filter.connect(bus);
    return filter;
  }

  // The finale on the audio clock, re-measured on every call
  function finaleContextTime() {
    if (!finale) {
      return -Infinity;
    }
    const wallNow = Date.now();
    const performanceNow = performance.now();
    let contextNow =
      ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
    // Prefer the time actually coming out of the speakers right now
    const stamp = ctx.getOutputTimestamp?.();
    if (stamp && stamp.performanceTime > 0) {
      contextNow =
        stamp.contextTime + (performanceNow - stamp.performanceTime) / 1000;
    }
    return contextNow + (finale - wallNow) / 1000;
  }

  // 0 normally, rising to 1 at the finale
  function buildAt(untilFinale) {
    if (untilFinale < 0) {
      return 0;
    }
    return Math.max(0, 1 - untilFinale / FINALE.buildSeconds);
  }

  function swell(input, sound, time, openBoost) {
    const [closed, open, settled] = sound.swell;
    input.frequency.setValueAtTime(closed, time);
    input.frequency.exponentialRampToValueAtTime(open * openBoost, time + 0.4);
    input.frequency.exponentialRampToValueAtTime(settled, time + bar);
  }

  function scheduleFinaleHit(time) {
    // The music ends here: the glissando fades out under the hit and only
    // the hit is left ringing
    glissInput.gain.linearRampToValueAtTime(0, time + 1);
    ended = true;

    THEME.sustained.forEach((sound, i) => {
      const input = sustainedInputs[i];
      if (sound.swell) {
        swell(input, sound, time, 1 + FINALE.swellBoost);
      }
      for (const semitone of FINALE.chord) {
        shepardNote(
          ctx,
          input,
          time,
          semitone,
          bar * 0.75,
          { ...sound, attack: 0.02, release: 2.5 },
          sound.peak * 2
        );
      }
    });

    drumHit(ctx, bus, noise, time, 1, DRUMS.boom);
    drumHit(ctx, bus, noise, time, 1, DRUMS.low);
    crash(ctx, bus, noise, time);
  }

  function scheduleBar(index, time, untilFinale) {
    // The bars are aligned to the finale, so this is only near zero on time
    if (Math.abs(untilFinale) < bar / 4) {
      scheduleFinaleHit(time);
      return;
    }

    const barsToFinale = Math.round(untilFinale / bar);
    const chord = THEME.chords[index % loopBars];
    const build = buildAt(untilFinale);
    // Strings and the beat drop out for the last bar, leaving a drum roll
    const lastBar = barsToFinale === 1;

    glissInput.gain.linearRampToValueAtTime(
      1 + FINALE.glissBoost * buildAt(untilFinale - bar),
      time + bar
    );

    THEME.sustained.forEach((sound, i) => {
      const input = sustainedInputs[i];
      if (sound.swell) {
        swell(input, sound, time, 1 + FINALE.swellBoost * build);
      }
      const boost = sound === BRASS ? FINALE.brassBoost : FINALE.padBoost;
      for (const semitone of chord) {
        shepardNote(
          ctx,
          input,
          time,
          semitone,
          bar,
          sound,
          sound.peak * (1 + boost * build)
        );
      }
    });

    if (!lastBar) {
      THEME.ostinatos.forEach((ostinato, i) => {
        ostinato.pattern.forEach((note, step) => {
          if (note) {
            const [tone, velocity] = note;
            shepardNote(
              ctx,
              ostinatoInputs[i],
              time + step * sixteenth,
              chord[tone],
              ostinato.duration,
              ostinato,
              ostinato.peak * velocity * (1 + FINALE.ostinatoBoost * build)
            );
          }
        });
      });

      const drums = [
        ...THEME.drums,
        ...FINALE.drums
          .filter((layer) => build >= layer.from)
          .map((layer) => [layer.drum, layer.pattern]),
      ];
      for (const [drum, pattern] of drums) {
        for (const [step, velocity] of Object.entries(pattern)) {
          drumHit(ctx, bus, noise, time + step * sixteenth, velocity, drum);
        }
      }
    } else {
      // Crescendo roll into the hit
      for (let step = 0; step < 16; step++) {
        const velocity = 0.2 + (0.8 * step) / 15;
        drumHit(ctx, bus, noise, time + step * sixteenth, velocity, DRUMS.high);
        if (step >= 8) {
          drumHit(ctx, bus, noise, time + step * sixteenth, velocity, DRUMS.mid);
        }
      }
    }

    if (barsToFinale === 2) {
      riser(ctx, bus, noise, time, time + untilFinale);
    }

    if (untilFinale <= 0) {
      return;
    }

    // Every second of the countdown lands with a heartbeat: lub-BOOM
    const firstSecond = Math.max(1, Math.ceil(untilFinale - bar + sixteenth / 2));
    for (let second = firstSecond; second < untilFinale + sixteenth / 2; second++) {
      const step = Math.round((untilFinale - second) / sixteenth);
      const stepTime = time + step * sixteenth;
      if (stepTime - HEARTBEAT_GAP > ctx.currentTime) {
        drumHit(ctx, bus, noise, stepTime - HEARTBEAT_GAP, 0.7, DRUMS.lub);
      }
      drumHit(ctx, bus, noise, stepTime, 0.9, DRUMS.boom);

      // The last seconds ring in with bells following the chords upwards:
      // the root on the second, softer fifth on the half second
      if (second <= FINALE.countdownSeconds) {
        const velocity = 0.5 + 0.5 * (1 - second / FINALE.countdownSeconds);
        const toFrequency = (semitone) => D1 * 2 ** (4 + (semitone % 12) / 12);
        chime(ctx, bus, stepTime, toFrequency(chord[0]), velocity);
        chime(ctx, bus, stepTime + 0.5, toFrequency(chord[2]), velocity * 0.5);
      }
    }
  }

  function schedule() {
    if (ended) {
      return;
    }
    const now = ctx.currentTime;
    const horizon = now + SCHEDULE_AHEAD;
    const finaleTime = finaleContextTime();

    // Timers were paused for a while (sleeping laptop, frozen tab): skip the
    // missed bars instead of firing them all at once
    if (nextBarTime < now) {
      const missed = Math.ceil((now - nextBarTime) / bar);
      nextBarTime += missed * bar;
      barIndex += missed;
    }
    while (nextBarTime < horizon) {
      const untilFinale = finaleTime - nextBarTime;
      if (untilFinale > 0) {
        const drift = untilFinale - Math.round(untilFinale / bar) * bar;
        if (Math.abs(drift) > DRIFT_TOLERANCE) {
          const nudge = Math.max(-MAX_NUDGE, Math.min(MAX_NUDGE, drift));
          nextBarTime += nudge;
          nextGlissTime += nudge;
        }
      }
      scheduleBar(barIndex, nextBarTime, finaleTime - nextBarTime);
      nextBarTime += bar;
      barIndex++;
      if (ended) {
        return;
      }
    }

    // A new glissando voice enters at the bottom once per loop. A voice whose
    // entry was missed (including the ones already in motion when the music
    // starts) joins midway, so the glissando never has a gap.
    while (nextGlissTime < horizon) {
      const startTime = Math.max(nextGlissTime, now);
      const offset = startTime - nextGlissTime;
      if (offset < GLISS_OCTAVES * loop) {
        glissVoice(ctx, glissInput, startTime, offset, loop, THEME.gliss);
      }
      nextGlissTime += loop;
    }
  }

  function resume() {
    if (ctx && ctx.state !== "running") {
      ctx.resume();
    }
  }

  // Browsers may suspend audio (device change, OS audio interruption, tab in
  // the background); pick up again and top up the schedule when we can
  document.addEventListener("visibilitychange", () => {
    if (ctx && document.visibilityState === "visible") {
      resume();
      schedule();
    }
  });

  function start() {
    if (ctx) {
      return;
    }
    ctx = new AudioContext();
    ctx.addEventListener("statechange", resume);
    noise = createNoiseBuffer(ctx, 1);

    master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 2);
    const compressor = ctx.createDynamicsCompressor();
    compressor.connect(master).connect(ctx.destination);

    bus = ctx.createGain();
    bus.connect(compressor);
    const reverb = createReverb(ctx, THEME.reverb.seconds);
    const wet = ctx.createGain();
    wet.gain.value = THEME.reverb.wet;
    bus.connect(reverb).connect(wet).connect(compressor);

    sustainedInputs = THEME.sustained.map(createInput);
    ostinatoInputs = THEME.ostinatos.map(createInput);
    glissInput = ctx.createGain();
    glissInput.gain.setValueAtTime(1, ctx.currentTime);
    glissInput.connect(bus);

    // Line the bars up so that a whole number of them ends exactly at the
    // finale, and the finale falls on the first chord of the loop
    nextBarTime = ctx.currentTime + 0.1;
    barIndex = 0;
    ended = false;
    const finaleTime = finaleContextTime();
    if (finaleTime > nextBarTime) {
      const barsBefore = Math.floor((finaleTime - nextBarTime) / bar);
      nextBarTime = finaleTime - barsBefore * bar;
      barIndex = (((-barsBefore) % loopBars) + loopBars) % loopBars;
    }
    const loopStart = nextBarTime - barIndex * bar;
    nextGlissTime = loopStart - (GLISS_OCTAVES - 1) * loop;

    schedule();
    timer = setInterval(schedule, 250);
  }

  function stop() {
    if (!ctx) {
      return;
    }
    clearInterval(timer);
    const closing = ctx;
    closing.removeEventListener("statechange", resume);
    master.gain.cancelScheduledValues(closing.currentTime);
    master.gain.setValueAtTime(master.gain.value, closing.currentTime);
    master.gain.linearRampToValueAtTime(0, closing.currentTime + 0.3);
    setTimeout(() => closing.close(), 400);
    ctx = undefined;
  }

  return { start, stop };
}
