const clientId = "d2a8ebf8eb404bf99c359f1750373f54"; // LOC MAI BALLS
// const clientId = "ce688dc38ebd4048bd897ab33551b980"; // TLAI

window.onload = async () => {
  let accessToken = localStorage.getItem("spotify_access_token");

  if (!accessToken) {
    const params = new URLSearchParams(window.location.search); 
    const code = params.get("code"); 

    if (code) {
      try {
        accessToken = await getAccessToken(clientId, code); // Await the accessToken
        localStorage.setItem("spotify_access_token", accessToken);
      } catch (error) { 
        console.error("Error obtaining access token:", error); 
      }

    }
  }

 
  const loginButton = document.getElementById('loginButton'); 
  if (loginButton) { 
    loginButton.style.display = 'block';
    loginButton.addEventListener('click', () => { 
      redirectToAuthCodeFlow(clientId); 
    }); 
  }
  const signOutButton = document.getElementById('signOutButton');
  if (signOutButton) {
    signOutButton.addEventListener('click', () => {
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
      window.location.href = '/'; 
    });
  }

  // If accessToken is available, fetch and populate profile
  if (accessToken) {
    try {
      const profile = await fetchProfile(accessToken); // Await the profile
      populateUI(profile); 

      document.getElementById("profile")!.style.display = "flex"; 
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

  const { access_token, expires_in, refresh_token } = await result.json();
  // Store access token and refresh token in localStorage
  localStorage.setItem("spotify_access_token", access_token);
  localStorage.setItem("spotify_refresh_token", refresh_token);

  // Set a timeout to refresh the token before it expires
  setTimeout(() => refreshAccessToken(refresh_token), (expires_in - 300) * 1000); // Refresh 5 minutes before expiry

  return access_token;
}

async function refreshAccessToken(refreshToken: string) { // WORK IN PROGRESS
  const clientId = "d2a8ebf8eb404bf99c359f1750373f54"; // Your Spotify Client ID
  const clientSecret = ""; // bad practice

  const basicAuth = btoa(`${clientId}:${clientSecret}`);
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: params
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('spotify_access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }
      setTimeout(() => refreshAccessToken(data.refresh_token || refreshToken), (data.expires_in - 300) * 1000);
    } else {
      console.error('Failed to refresh token:', data);
    }
  } catch (error) {
    console.error('Error during token refresh:', error);
  }
}

async function fetchProfile(token: string): Promise<any> {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return await result.json();
}

function populateUI(profile: any) {

  document.getElementById("displayName")!.innerText = profile.display_name;
  if (profile.images[0]) {
    const profileImage = new Image(200, 200);
    profileImage.src = profile.images[0].url;
    document.getElementById("avatar")!.appendChild(profileImage);
  }
  document.getElementById("id")!.innerText = profile.id;
  document.getElementById("email")!.innerText = profile.email;
  document.getElementById("uri")!.innerText = profile.uri;
  document
    .getElementById("uri")!
    .setAttribute("href", profile.external_urls.spotify);
  document.getElementById("url")!.innerText = profile.href;
  document.getElementById("url")!.setAttribute("href", profile.href);
  document.getElementById("imgUrl")!.innerText =
    profile.images[0]?.url ?? "(no profile image)";
}
