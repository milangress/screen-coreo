import { getAssetUrl } from '$lib/utils';

class MyAudio {
  private static instances: Map<string, MyAudio> = new Map();
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private isPlaying: boolean = false;
  private looping: boolean = false;

  private constructor(private id: string) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }
  static getInstance(id: string): MyAudio {
    if (!MyAudio.instances.has(id)) {
      MyAudio.instances.set(id, new MyAudio(id));
    }
    return MyAudio.instances.get(id)!;
  }

  async load(url: string): Promise<MyAudio> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    return this;
  }

  play(): MyAudio {
    if (this.audioBuffer) {
      if (this.sourceNode) {
        this.sourceNode.stop();
      }
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;
      this.sourceNode.loop = this.looping;
      this.sourceNode.connect(this.gainNode);
      this.sourceNode.start();
      this.isPlaying = true;

      this.sourceNode.onended = () => {
        if (!this.looping) {
          this.isPlaying = false;
        }
      };
    }
    return this;
  }

  pause(): MyAudio {
    if (this.sourceNode && this.isPlaying) {
      this.sourceNode.stop();
      this.isPlaying = false;
    }
    return this;
  }

  loop(shouldLoop: boolean = true): MyAudio {
    this.looping = shouldLoop;
    if (this.sourceNode) {
      this.sourceNode.loop = this.looping;
    }
    return this;
  }

  volume(level: number): MyAudio {
    if (level >= 0 && level <= 1) {
      this.gainNode.gain.setValueAtTime(level, this.audioContext.currentTime);
    }
    return this;
  }
}

export default async function(id: string, url?: string): Promise<MyAudio> {
  const instance = MyAudio.getInstance(id);
  if (url) {
    await instance.load(url);
  }
  return instance;
}