import { getAssetUrl } from '$lib/utils/utils';
import { emit, listen } from '@tauri-apps/api/event';
import { v4 as uuidv4 } from 'uuid';

export class MyAudio {
  private static instances: { [key: string]: MyAudio } = {};
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private url: string | null = null;
  public volume: number = 1;
  private lastEventId: string | null = null;
  private lastEmittedEventId: string | null = null;
  private lastActionTime: number = 0;
  private readonly DEBOUNCE_TIME = 100; // milliseconds
  private isLoaded: boolean = false;
  private isPlaying: boolean = false;

  private constructor(private id: string) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    listen('audio-play', (event: any) => {
      if (event.payload.id === this.id && event.payload.eventId !== this.lastEmittedEventId) {
        this.play(event.payload.eventId);
      }
    });

    listen('audio-stop', (event: any) => {
      if (event.payload.id === this.id && event.payload.eventId !== this.lastEmittedEventId) {
        this.stop(event.payload.eventId);
      }
    });

    listen('audio-volume-change', (event: any) => {
      if (event.payload.id === this.id && event.payload.eventId !== this.lastEventId) {
        this.setVolume(event.payload.volume, event.payload.eventId);
      }
    });
  }

  static getInstance(id: string): MyAudio {
    if (!MyAudio.instances[id]) {
      MyAudio.instances[id] = new MyAudio(id);
      emit('audio-instance-created', { id });
    }
    return MyAudio.instances[id];
  }

  async load(url: string): Promise<MyAudio> {
    // Early escape if already loaded
    if (this.isLoaded && this.url === url) {
      console.log(`Audio ${this.id} already loaded`);
      return this;
    }

    this.url = url;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.isLoaded = true;
    emit('audio-loaded', { id: this.id, url });
    return this;
  }

  play(eventId: string | null = null): MyAudio {
    const now = Date.now();
    if (now - this.lastActionTime < this.DEBOUNCE_TIME) {
      return this;
    }
    this.lastActionTime = now;

    // Early escape if already playing
    if (this.isPlaying) {
      console.log(`Audio ${this.id} is already playing`);
      return this;
    }

    if (this.audioBuffer) {
      this.stop();
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = this.audioBuffer;
      this.source.connect(this.gainNode);
      this.source.start();
      this.isPlaying = true;
      const newEventId = eventId || uuidv4();
      this.lastEmittedEventId = newEventId;
      emit('audio-play', { id: this.id, eventId: newEventId });
      this.source.onended = () => {
        this.isPlaying = false;
        const stopEventId = uuidv4();
        this.lastEmittedEventId = stopEventId;
        emit('audio-stop', { id: this.id, eventId: stopEventId });
      };
    } else {
      console.warn(`Attempted to play audio ${this.id} before it was loaded`);
    }
    return this;
  }

  stop(eventId: string | null = null): MyAudio {
    const now = Date.now();
    if (now - this.lastActionTime < this.DEBOUNCE_TIME) {
      return this;
    }
    this.lastActionTime = now;

    if (this.source && this.isPlaying) {
      this.source.stop();
      this.source = null;
      this.isPlaying = false;
      const newEventId = eventId || uuidv4();
      this.lastEmittedEventId = newEventId;
      emit('audio-stop', { id: this.id, eventId: newEventId });
    }
    return this;
  }

  setVolume(level: number, eventId: string | null = null): MyAudio {
    this.volume = level;
    this.gainNode.gain.setValueAtTime(level, this.audioContext.currentTime);
    const newEventId = eventId || uuidv4();
    this.lastEventId = newEventId;
    emit('audio-volume-change', { id: this.id, volume: level, eventId: newEventId });
    return this;
  }

  getVolume(): number {
    return this.volume;
  }

  getId(): string {
    return this.id;
  }

  getUrl(): string | null {
    return this.url;
  }
}

export default function(id: string): MyAudio {
  return MyAudio.getInstance(id);
}