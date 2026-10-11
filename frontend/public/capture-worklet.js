class CaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.frameSize = options.processorOptions.frameSize;
    this.frame = new Float32Array(this.frameSize);
    this.index = 0;
  }

  process(inputs) {
    const channel = inputs[0][0];
    if (!channel) {
      return true;
    }
    for (let i = 0; i < channel.length; i++) {
      this.frame[this.index] = channel[i];
      this.index++;
      if (this.index === this.frameSize) {
        this.port.postMessage(this.frame);
        this.frame = new Float32Array(this.frameSize);
        this.index = 0;
      }
    }
    return true;
  }
}

registerProcessor("capture-processor", CaptureProcessor);
