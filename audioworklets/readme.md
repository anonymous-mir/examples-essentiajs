# An example  of using Audio Worklet + Essentia.js 


## Implementation

### `AudioWorkletNode` example for Essentia.js

#### essentia-worklet-node.js

```javascript
// Sample EssentiaNodeFactory design pattern

// path to your AudioWorkletProcessor scripts
const workletUrl = "essentia-worklet-processor.js"

export class EssentiaNodeFactory {
  static async create(context) {
    class EssentiaNode extends AudioWorkletNode {
      constructor(context) {
        super(context, 'essentia-worklet-processor');
      }
    }
    try {
      await context.audioWorklet.addModule(workletUrl);
    } catch(e) {
      console.log(e);
    }
    return new EssentiaNode(context);
  }
}
```

### `AudioWorkletProcessor` example for Essentia.js

#### essentia-worklet-processor.js

```javascript
// import EssentiaWASM
import { EssentiaWASM } from "essentia-wasm.module.js";
// import Essentia JS API interface
import Essentia from "essentia.js-core.es.js";

let essentia = new Essentia(EssentiaWASM);

/**
 * A simple demonstration of using essentia.js as AudioWorkletProcessor.
 *
 * @class EssentiaWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class EssentiaWorkletProcessor extends AudioWorkletProcessor {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.essentia = essentia;
    console.log('Backend - essentia:' + this.essentia.version); 
    this.port.onmessage = e => {
      // onmessage callback for message port communication between audio node
    };
  }
  /**
   * System-invoked process callback function.
   * @param  {Array} inputs Incoming audio stream.
   * @param  {Array} outputs Outgoing audio stream.
   * @param  {Object} parameters AudioParam data.
   * @return {Boolean} Active source flag.
   */
  process(inputs, outputs, parameters) {

    let input = inputs[0];
    let output = outputs[0];

    // Write your essentia.js processing code here
     
    // convert the input audio frame array from channel 0 to essentia vector
    let vectorInput = this.essentia.arrayToVector(input[0]);

    // In this case we apply a traingular windowing function to every input audio frame
    // check https://essentia.upf.edu/reference/std_Windowing.html
    let windowedFrame = this.essentia.Windowing(vectorInput, // input audio frame
                                                // parameters
                                                true, // normalized
                                                128, // size
                                                'triangular', // type
                                                0, // zeroPadding
                                                true); // zeroPhase 

    // write your custom essentia.js processing here

    // convert the output back to float32 typed array
    let outputArray = this.essentia.vectorToArray(windowedFrame.frame);

    console.log("Processed audio buffer stream using essentia.js worklet with size: " + outputArray.length + " frames.");
    
    // copy converted array to the output channel 0
    output[0].set(outputArray);

    return true;
  }
}
registerProcessor('essentia-worklet-processor', EssentiaWorkletProcessor);
```


## Usage

A simplified example on how to use the pre-defined audio worklet nodes in a webpage.

```html
<!DOCTYPE html>
<html>
  <head>
    <body>
      <h1>Audio Worklet + Essentia.js</h1>
      <br />
      <center>
        <button>
          Start/Stop<button>
            <\center>
            <script type="module">
              import { EssentiaNodeFactory } from "essentia-worklet-node.js";

              let audioContext;
              let gumStream;

              document
                .querySelector("button")
                .addEventListener("click", function() {
                  if (!audioContext) {
                    audioContext = new AudioContext();
                    startEssentiaAnalyser(audioContext).then(() =>
                      console.log("essentia analyzer started")
                    );
                    return;
                  }
                  if (audioContext.state === "running") {
                    console.log("Suspending audio context ...");
                    audioContext.suspend().then(function() {
                      // Audio suspended
                    });
                  } else if (audioContext.state === "suspended") {
                    console.log("resuming audio context");
                    audioContext.resume().then(function() {
                      startEssentiaAnalyser(audioContext).then(() =>
                        console.log("essentia analyzer started")
                      );
                      // Audio resumed
                      return;
                    });
                  }
                });

              // connect the nodes
              async function startEssentiaAnalyser(audioContext) {
                // cross-browser support
                navigator.getUserMedia =
                  navigator.getUserMedia ||
                  navigator.webkitGetUserMedia ||
                  navigator.mozGetUserMedia ||
                  navigator.msGetUserMedia;
                window.URL =
                  window.URL ||
                  window.webkitURL ||
                  window.mozURL ||
                  window.msURL;
                if (navigator.getUserMedia) {
                  console.log("Initializing mic input stream ...");
                  navigator.getUserMedia(
                    { audio: true, video: false },
                    async function(stream) {
                      gumStream = stream;
                      if (gumStream.active) {
                        console.log("Sample Rate = " + audioContext.sampleRate);
                        var micNode = audioContext.createMediaStreamSource(stream);
                        // create essentia node factory
                        console.log(
                          "Creating EssentiaNodeFactory instance ..."
                        );
                        let essentiaNode = await EssentiaNodeFactory.create(audioContext);

                        console.log(
                          "Mic => essentiaWorklet => audioContext.destination ...."
                        );
                        console.log(
                          "Applying triangular windowing to microphone input ...."
                        );
                        // connect mic stream to essentia node
                        micNode.connect(essentiaNode);
                        // If it isn't connected to destination, the worklet is not executed
                        essentiaNode.connect(audioContext.destination);
                      } else {
                        throw "Mic stream not active";
                      }
                    },
                    function(message) {
                      throw "Could not access microphone - " + message;
                    }
                  );
                } else {
                  throw "Could not access microphone - getUserMedia not available";
                }
              }
            </script>
            <\body> <\head> <\html>
          </button>
        </button>
      </center>
    </body>
  </head>
</html>

```
