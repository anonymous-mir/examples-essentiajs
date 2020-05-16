/* If you're feeling fancy you can add interactivity 
    to your site with Javascript */
// Write Javascript code!

let essentia;
let audioURL = "https://freesound.org/data/previews/328/328857_230356-lq.mp3";

let audioData;
let audioCtx = new AudioContext();


let isComputed = false;

// callback function which compute the log mel spectrogram of input audioURL on a button.onclick event
async function onClickFeatureExtractor() {
  // load audio file from an url
  audioData = await essentia.getAudioChannelDataFromURL(audioURL, audioCtx);
  
  let audioVector = essentia.arrayToVector(audioData);
  // compute onset detection
  let superFluxExtractor = essentia.SuperFluxExtractor(audioVector);
  
  let onsetTimes = essentia.vectorToArray(superFluxExtractor.onsets);
  console.log(onsetTimes);
  
  $("#results").html("<p> Onset Times: " + onsetTimes.join(', ') + " </p>");
  
  isComputed = true;
}

$(document).ready(function() {

  // Now let's load the essentia wasm back-end, if so create UI elements for computing features
  EssentiaModule().then(async function(WasmModule) {
    // populate html audio player with audio
    let player = document.getElementById("audioPlayer");
    player.src = audioURL;
    player.load();

    essentia = new Essentia(WasmModule);

    // essentia version log to html div
    $("#logDiv").html(
      "<h5 class='ui white'> essentia-" + essentia.version + " wasm backend loaded ... </h5>"
    );

    $("#logDiv").append(
      '<button id="btn" class="ui white inverted button">Compute onsets </button>'
    );

    var button = document.getElementById("btn");

    // add onclick event handler to comoute button
    button.addEventListener("click", () => onClickFeatureExtractor(), false);
  });
});
