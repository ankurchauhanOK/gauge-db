export interface GaugeConfig {
  nominal: number;
  minLimit: number;
  maxLimit: number;
  readIntervalMs?: number;
  stabilityWindow?: number;
  stabilityThreshold?: number;
}

export interface GaugeReading {
  value: number;
  timestamp: number;
  stable: boolean;
  withinTolerance: boolean;
}

type ReadingCallback = (reading: GaugeReading) => void;
type StableCallback = (reading: GaugeReading) => void;

export class GaugeSimulator {
  private config: GaugeConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readings: number[] = [];
  private onReadingCb: ReadingCallback | null = null;
  private onStableCb: StableCallback | null = null;
  private stableReported = false;
  private drift: number = 0;
  private driftDirection: number = 1;

  constructor(config: GaugeConfig) {
    this.config = {
      readIntervalMs: 180,
      stabilityWindow: 5,
      stabilityThreshold: 0.002,
      ...config,
    };
  }

  start() {
    this.drift = 0;
    this.driftDirection = Math.random() > 0.5 ? 1 : -1;
    this.stableReported = false;
    this.readings = [];

    this.intervalId = setInterval(() => this.tick(), this.config.readIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.readings = [];
    this.stableReported = false;
  }

  isRunning() {
    return this.intervalId !== null;
  }

  onReading(cb: ReadingCallback) { this.onReadingCb = cb; }
  onStable(cb: StableCallback) { this.onStableCb = cb; }

  private tick() {
    const { nominal, minLimit, maxLimit, stabilityWindow, stabilityThreshold } = this.config;

    // Simulate convergence toward nominal
    if (this.readings.length < 8) {
      // Early readings: noisy, converging
      this.drift += (Math.random() - 0.5) * 0.008;
    } else if (this.readings.length < 15) {
      // Middle: stabilize
      this.drift *= 0.85;
      this.drift += (Math.random() - 0.5) * 0.002;
    } else {
      // Late: very stable
      this.drift *= 0.9;
      this.drift += (Math.random() - 0.5) * 0.0005;
    }

    this.drift = Math.max(-0.015, Math.min(0.015, this.drift));

    // 10% chance of outlier reading (simulates real gauge noise)
    let noise = (Math.random() - 0.5) * 0.003;
    if (Math.random() < 0.1) noise = (Math.random() - 0.5) * 0.01;

    const value = parseFloat((nominal + this.drift + noise).toFixed(4));
    this.readings.push(value);
    if (this.readings.length > stabilityWindow! * 2) {
      this.readings.shift();
    }

    // Stability detection
    const window = this.readings.slice(-stabilityWindow!);
    let stable = false;
    if (window.length >= stabilityWindow!) {
      const min = Math.min(...window);
      const max = Math.max(...window);
      stable = (max - min) <= stabilityThreshold!;
    }

    const reading: GaugeReading = {
      value,
      timestamp: Date.now(),
      stable,
      withinTolerance: value >= minLimit && value <= maxLimit,
    };

    if (this.onReadingCb) this.onReadingCb(reading);

    if (stable && !this.stableReported && this.onStableCb) {
      this.stableReported = true;
      // Use the average of the stable window for the captured value
      const stableAvg = parseFloat((window.reduce((a, b) => a + b, 0) / window.length).toFixed(4));
      this.onStableCb({
        value: stableAvg,
        timestamp: Date.now(),
        stable: true,
        withinTolerance: stableAvg >= minLimit && stableAvg <= maxLimit,
      });
      this.stop();
    }
  }
}
