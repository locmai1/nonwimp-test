// const clientId = "d2a8ebf8eb404bf99c359f1750373f54"; // LOC MAI BALLS
const clientId = "ce688dc38ebd4048bd897ab33551b980"; // TLAI

window.onload = async () => {
  let accessToken = localStorage.getItem("spotify_access_token");

  if (!accessToken) {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      try {
        accessToken = await getAccessToken(clientId, code); // Await the accessToken
        localStorage.setItem("spotify_access_token", accessToken);
        window.location.href = "/emotion.html";
      } catch (error) {
        console.error("Error obtaining access token:", error);
      }
    }
  } else {
    window.location.href = "/emotion.html";
  }

  const loginButton = document.getElementById("loginButton");
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      redirectToAuthCodeFlow(clientId);
    });
  }

  // If accessToken is available, fetch and populate profile
  if (accessToken) {
    try {
      document.getElementById("profile")!.style.display = "flex";
      // document.getElementById("generator")!.style.display = "flex";
      document.getElementById("loginSection")!.style.display = "none";
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }
};

export async function redirectToAuthCodeFlow(clientId: string) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("scope", "user-read-private user-read-email");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function getAccessToken(
  clientId: string,
  code: string
): Promise<string> {
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("code_verifier", verifier!);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const { access_token, refresh_token } = await result.json();
  // Store access token and refresh token in localStorage
  localStorage.setItem("spotify_access_token", access_token);
  localStorage.setItem("spotify_refresh_token", refresh_token);

  return access_token;
}