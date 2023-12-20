

class RecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = [[]];
        this.port.onmessage = (event) => {
            if (event.data === 'get-buffer') {
                this.port.postMessage(this.buffer);
            }
        };
    }

    process(inputs) {
        if (inputs[0].length === 0) {
            return true;
        }
        for (let samp of inputs[0][0]) {
            this.buffer[0].push(samp);
        }
        return true;
    }
}


registerProcessor('recorder', RecorderProcessor);

