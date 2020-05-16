// import Essentia WASM backend
import { EssentiaModule } from "../dist/essentia-wasm.module.js";
// import Essentia JS API interface
import Essentia from "../dist/essentia.js-core.es.js";

let essentia = new Essentia(EssentiaModule);

/**
 * A simple demonstration of using essentia.js wasm  Modules as AudioWorkletProcessor.
 * @class EssentiaWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class EssentiaWorkletProcessor extends AudioWorkletProcessor {

  constructor() {
    super();
    this.essentia = essentia;
    console.log('Backend - essentia:' + this.essentia.version); 
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
     
    // convert the input audio frame array from channel 0 to a std::vector<float> type for using it in essentia
    let vectorInput = this.essentia.arrayToVector(input[0]);

    // In this case we apply a traingular windowing function to every input audio frame
    // check https://essentia.upf.edu/reference/std_Windowing.html
    let windowedFrame = this.essentia.Windowing(vectorInput, // input audio frame
                                                // parameters
                                                true, // normalized
                                                1024, // size
                                                'triangular', // type
                                                0, // zeroPadding
                                                true); // zeroPhase 

    // convert the output back to float32 typed array
    let outputArray = this.essentia.vectorToArray(windowedFrame.frame);
    console.log("Processed audio buffer stream using essentia.js worklet with size: " + outputArray.length + " frames.");
    // copy converted array to the output channel 0
    output[0].set(outputArray);
    return true;
  }
}

registerProcessor('essentia-worklet-processor', EssentiaWorkletProcessor);

