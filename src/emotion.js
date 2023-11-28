/*
 * Must run on a remote server, and access via https not http.
 */

// Make this global so callback functions can access
var detector;

window.onload = function () {
  const accessToken = localStorage.getItem("spotify_access_token");
  if (!accessToken) {
    window.location.href = "/";
    return;
  }

  let divRoot = document.getElementById("affdex_elements");

  let width = 640;
  let height = 480;

  //Construct a CameraDetector and specify the image width / height and face detector mode.
  detector = new affdex.CameraDetector(
    divRoot,
    width,
    height,
    affdex.FaceDetectorMode.LARGE_FACES
  );

  //Enable detection of all Expressions, Emotions and Emojis classifiers.
  detector.detectAllEmotions();
  detector.detectAllExpressions();
  detector.detectAllEmojis();
  detector.detectAllAppearance();

  //Add a callback to notify when the detector is initialized and ready for runing.
  detector.addEventListener("onInitializeSuccess", function () {
    document.getElementById("results").innerHTML =
      "The detector reports initialized";
  });

  //Add a callback to notify when camera access is allowed
  detector.addEventListener("onWebcamConnectSuccess", function () {
    document.getElementById("results").innerHTML = "Webcam access allowed";
  });

  //Add a callback to notify when camera access is denied
  detector.addEventListener("onWebcamConnectFailure", function () {
    document.getElementById("results").innerHTML = "webcam denied";
    console.log("Webcam access denied");
  });

  //Add a callback to notify when detector is stopped
  detector.addEventListener("onStopSuccess", function () {
    document.getElementById("results").innerHTML =
      "The detector reports stopped";
    document.getElementById("results").innerHTML = "";
  });

  //Add a callback to receive the results from processing an image.
  //The faces object contains the list of the faces detected in an image.
  //Faces object contains probabilities for all the different expressions, emotions and appearance metrics
  detector.addEventListener(
    "onImageResultsSuccess",
    function (faces, image, timestamp) {
      document.getElementById("results").innerHTML = "";
      if (faces.length > 0) {
        // document.getElementById("results").innerHTML +=
        //   "Appearance: " + JSON.stringify(faces[0].appearance) + "<br />";

        const emotions = faces[0].emotions;

        // Extract the first 6 key-value pairs
        const firstSixEmotions = Object.fromEntries(
          Object.entries(emotions).slice(0, 6)
        );

        // Find the top emotion based on values
        const topEmotion = Object.keys(firstSixEmotions).reduce((a, b) =>
          firstSixEmotions[a] > firstSixEmotions[b] ? a : b
        );

        // Check if all first 6 emotion values are 0
        const allZeros = Object.values(firstSixEmotions).every(
          (value) => value === 0
        );

        // Display the result
        if (allZeros) {
          document.getElementById("results").innerHTML +=
            "Top Emotion: normal<br />";
        } else {
          document.getElementById("results").innerHTML +=
            "Top Emotion: " +
            topEmotion +
            " - " +
            emotions[topEmotion].toFixed(0) +
            "%<br />";
        }

        // document.getElementById("results").innerHTML +=
        //   "Expressions: " +
        //   JSON.stringify(faces[0].expressions, function (key, val) {
        //     return val.toFixed ? Number(val.toFixed(0)) : val;
        //   }) +
        //   "<br />";
        // document.getElementById("results").innerHTML +=
        //   "Emoji: " + faces[0].emojis.dominantEmoji;

        // if (faces[0].emotions["joy"] > 75) {
        //   document.getElementById("myuitext").innerHTML = "Happy!!!";
        // } else {
        //   document.getElementById("myuitext").innerHTML = "";
        // }
      }
    }
  );
};

//function executes when Start button is pushed.
function onStart() {
  if (detector && !detector.isRunning) {
    document.getElementById("results").innerHTML = "";
    detector.start();
  }
  console.log("Clicked the start button");
}

//function executes when the Stop button is pushed.
function onStop() {
  console.log("Clicked the stop button");
  if (detector && detector.isRunning) {
    detector.removeEventListener();
    detector.stop();
  }
}
