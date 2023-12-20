

const TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_API_KEY = "YOUR_KEY_HERE";
// set this to true if you want to check the audio your mic is producing
const DOWNLOAD = false;

let recording = false;
let recorder = null;
let source = null;


document.getElementById("record").onclick = function onclick_record() {
    record_audio().catch(
        (e) => console.error(e)
    );
};


async function record_audio() {
    if (recording) {
        source.disconnect();
        recorder.port.postMessage('get-buffer');
        recording = false;
        recorder = null;
        source = null;
        document.getElementById("record").style.border = "none";
        return;
    }
    recording = true;
    document.getElementById("record").style.border = "1px solid red";

    const ac = new AudioContext();
    await ac.audioWorklet.addModule('recorder.js');
    recorder = new AudioWorkletNode(ac, 'recorder');
    const stream = await navigator.mediaDevices.getUserMedia(
        {audio: true}
    );
    recorder.port.onmessage = (event) => {
        console.log(event.data);
        process_buffer(event.data).catch(
            (e) => console.error(e)
        );
    };
    source = ac.createMediaStreamSource(stream);
    source.connect(recorder);
}


async function process_buffer(buffer) {
    const encoder = new WavAudioEncoder(44100, 1);
    encoder.encode(buffer);
    console.log(buffer[0].length);
    const audio_blob = encoder.finish();

    if (DOWNLOAD) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(audio_blob);
        a.download = 'audio.wav';
        a.textContent = 'Download audio.wav';
        document.body.appendChild(a);
    } else {
        console.log("Sending audio to OpenAI...", audio_blob);

        const form_data = new FormData();
        form_data.append("file", audio_blob, 'audio.wav');
        form_data.append("model", "whisper-1");

        try {
            const response = await fetch(TRANSCRIBE_URL, {
                method: "POST",
                body: form_data,
                headers: {
                    "authorization": `Bearer ${OPENAI_API_KEY}`,
                },
            });
            const text = await response.json();
            console.log("OpenAI response:", text);
            document.getElementById("input").value = text.text;
        } catch (error) {
            console.error(error)
        }
        
    }
}

