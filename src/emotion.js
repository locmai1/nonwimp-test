var detector;
var emotion;

window.onload = function () {
  const signOutButton = document.getElementById("signOutButton");
  if (signOutButton) {
    signOutButton.addEventListener("click", () => {
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
      window.location.href = "/";
    });
  }

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

  divRoot.classList.add("flipped");

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
        const emotions = faces[0].emotions;

        const firstSixEmotions = Object.fromEntries(
          Object.entries(emotions).slice(0, 6)
        );

        const topEmotion = Object.keys(firstSixEmotions).reduce((a, b) =>
          firstSixEmotions[a] > firstSixEmotions[b] ? a : b
        );

        const allZeros = Object.values(firstSixEmotions).every(
          (value) => value === 0
        );

        if (allZeros) {
          document.getElementById("results").innerHTML += "normal<br />";
        } else {
          document.getElementById("results").innerHTML +=
            topEmotion + " - " + emotions[topEmotion].toFixed(0) + "%<br />";

          emotion = topEmotion;
        }
      }
    }
  );
};

function onStart() {
  if (detector && !detector.isRunning) {
    document.getElementById("results").innerHTML = "";
    detector.start();
  }
  console.log("Clicked the start button");
}

function onStop() {
  console.log("Clicked the stop button");
  if (detector && detector.isRunning) {
    detector.removeEventListener();
    detector.stop();
  }
}

function fetchSpotifyRecommendations() {
  const accessToken = localStorage.getItem("spotify_access_token");
  if (!accessToken) {
    console.error("No access token available for Spotify API call.");
    return;
  }

  const emotionToGenreMap = {
    joy: "pop",
    sadness: "blues",
    disgust: "grindcore",
    contempt: "grunge",
    anger: "heavy-metal",
    fear: "dark-ambient",
    surprise: "experimental",
  };

  const seedGenres = emotionToGenreMap[emotion.toLowerCase()];

  if (!seedGenres) {
    console.error("No corresponding genre found for the detected emotion.");
    return;
  }

  const apiUrl = `https://api.spotify.com/v1/recommendations?limit=3&seed_genres=${encodeURIComponent(
    seedGenres
  )}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Spotify recommendations:", data);
      document.getElementById("card1-title").innerHTML = data.tracks[0].name;
      document.getElementById("card2-title").innerHTML = data.tracks[1].name;
      document.getElementById("card3-title").innerHTML = data.tracks[2].name;
      document.getElementById("artist1").innerHTML =
        data.tracks[0].artists[0].name;
      document.getElementById("artist2").innerHTML =
        data.tracks[1].artists[0].name;
      document.getElementById("artist3").innerHTML =
        data.tracks[2].artists[0].name;
      document.getElementById("card-img1").src =
        data.tracks[0].album.images[0].url;
      document.getElementById("card-img2").src =
        data.tracks[1].album.images[0].url;
      document.getElementById("card-img3").src =
        data.tracks[2].album.images[0].url;
    })
    .catch((error) => {
      console.error("Error fetching recommendations from Spotify:", error);
    });
}

function fetchRecommendationsBasedOnEmotion() {
  fetchSpotifyRecommendations(yourDetectedEmotion);
}
