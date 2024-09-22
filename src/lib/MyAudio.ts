import { getAssetUrl } from '$lib/utils';
import { emit, listen } from '@tauri-apps/api/event';

export class MyAudio {
  private static instances: { [key: string]: MyAudio } = {};
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private url: string | null = null;
  public volume: number = 1;

  private constructor(private id: string) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    listen('audio-play', (event: any) => {
      if (event.payload.id === this.id) {
        this.play();
      }
    });

    listen('audio-stop', (event: any) => {
      if (event.payload.id === this.id) {
        this.stop();
      }
    });

    listen('audio-volume-change', (event: any) => {
      if (event.payload.id === this.id) {
        this.setVolume(event.payload.volume);
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

  play(): MyAudio {
    if (this.audioBuffer) {
      this.stop();
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = this.audioBuffer;
      this.source.connect(this.gainNode);
      this.source.start();
      emit('audio-play', { id: this.id });
      this.source.onended = () => {
        emit('audio-stop', { id: this.id });
      };
    }
    return this;
  }

  stop(): MyAudio {
    if (this.source) {
      this.source.stop();
      this.source = null;
      emit('audio-stop', { id: this.id });
    }
    return this;
  }

  setVolume(level: number): MyAudio {
    this.volume = level;
    this.gainNode.gain.setValueAtTime(level, this.audioContext.currentTime);
    emit('audio-volume-change', { id: this.id, volume: level });
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