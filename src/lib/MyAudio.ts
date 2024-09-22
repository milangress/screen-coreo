import { getAssetUrl } from '$lib/utils';
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

  private constructor(private id: string) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    listen('audio-play', (event: any) => {
      if (event.payload.id === this.id && event.payload.eventId !== this.lastEventId) {
        this.play(event.payload.eventId);
      }
    });

    listen('audio-stop', (event: any) => {
      if (event.payload.id === this.id && event.payload.eventId !== this.lastEventId) {
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
    this.url = url;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    emit('audio-loaded', { id: this.id, url });
    return this;
  }

  play(eventId: string | null = null): MyAudio {
    if (this.audioBuffer) {
      this.stop();
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = this.audioBuffer;
      this.source.connect(this.gainNode);
      this.source.start();
      const newEventId = eventId || uuidv4();
      this.lastEventId = newEventId;
      emit('audio-play', { id: this.id, eventId: newEventId });
      this.source.onended = () => {
        const stopEventId = uuidv4();
        this.lastEventId = stopEventId;
        emit('audio-stop', { id: this.id, eventId: stopEventId });
      };
    }
    return this;
  }

  stop(eventId: string | null = null): MyAudio {
    if (this.source) {
      this.source.stop();
      this.source = null;
      const newEventId = eventId || uuidv4();
      this.lastEventId = newEventId;
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