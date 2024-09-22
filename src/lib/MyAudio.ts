import { getAssetUrl } from '$lib/utils';

class MyAudio {
  private static instances: { [key: string]: MyAudio } = {};
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;

  private constructor(private id: string) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  static getInstance(id: string): MyAudio {
    if (!MyAudio.instances[id]) {
      MyAudio.instances[id] = new MyAudio(id);
    }
    return MyAudio.instances[id];
  }

  async load(url: string): Promise<MyAudio> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    return this;
  }

  play(): MyAudio {
    if (this.audioBuffer) {
      this.stop();
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = this.audioBuffer;
      this.source.connect(this.gainNode);
      this.source.start();
    }
    return this;
  }

  stop(): MyAudio {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
    return this;
  }

  volume(level: number): MyAudio {
    this.gainNode.gain.setValueAtTime(level, this.audioContext.currentTime);
    return this;
  }
}

export default function(id: string): MyAudio {
  return MyAudio.getInstance(id);
}