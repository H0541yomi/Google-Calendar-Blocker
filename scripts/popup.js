document.addEventListener("DOMContentLoaded", function () {
  // POPUP ELEMENTS
  const settingsButton = document.getElementById("settings");
  const loginButton = document.getElementById("connect-to-google");
  const addSiteButton = document.getElementById("add-site");

  // FUNCTIONS

  const onLaunchWebAuthFlow = async () => {
    try {
      const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
      const clientId =
        "781492178861-7neq97l6dv2proi74vtlmllpj81gbtti.apps.googleusercontent.com";

      // Note: this needs to match the one used on the server (below)
      // note the lack of a trailing slash
      const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`;

      const state = Math.random().toString(36).substring(7);

      const scopes =
        "profile email openid https://www.googleapis.com/auth/calendar";

      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);

      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("include_granted_scopes", "true");
      authUrl.searchParams.set("prompt", "consent");

      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.href,
          interactive: true,
        },
        async (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            return new Error(
              `WebAuthFlow failed: ${chrome.runtime.lastError.message}`
            );
          }

          const params = new URLSearchParams(redirectUrl.split("?")[1]);
          const code = params.get("code");

          if (!code) {
            return new Error("No code found");
          }

          tokens = await exchangeCodeForToken(code);
          saveTokens(tokens);
        }
      );
    } catch (error) {
      throw new Error(`Sign-in failed: ${error.message}`);
    }
  };

  const exchangeCodeForToken = async (code) => {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const clientId =
      "781492178861-7neq97l6dv2proi74vtlmllpj81gbtti.apps.googleusercontent.com";
    const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`;

    const secretFile = await fetch("../config.json");

    if (!secretFile.ok) {
      throw new Error("Failed to fetch client secret.");
    }

    const secretData = await secretFile.json();
    const clientSecret = secretData.client_secret;

    const formData = new FormData();
    formData.append("code", code);
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("redirect_uri", redirectUri);
    formData.append("grant_type", "authorization_code");

    const response = await fetch(tokenUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Error exchanging code for token: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  };

  const saveTokens = (tokens) => {
    // Store tokens in Chrome's storage or another secure location
    chrome.storage.sync.set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
  };

  const addWebsite = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentTab = new URL(tabs[0].url).hostname;

        chrome.storage.sync.get(["blocklist"]).then((results) => {
          let blocklist = results.blocklist ? results.blocklist : [];
          if (!blocklist.includes(currentTab)) {
            blocklist.push(currentTab);
          }

          chrome.storage.sync.set({ blocklist: blocklist });
        });
      }
    });
  };

  // LISTENERS

  settingsButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  loginButton.addEventListener("click", onLaunchWebAuthFlow);

  addSiteButton.addEventListener("click", addWebsite);
});
