// DATA

let blocklistSet = [];
let blockTagsSet = [];
let blockColorsSet = [];

// FUNCTIONS

const updateBlocking = async () => {
  const tabBlocked = await checkTabs();
  const strictSleep = await checkStrictSleep();
  const onWorkBlock = await checkActiveBlock();
  const sleeping = await checkSleep();


  const blocking = onWorkBlock || sleeping;

  chrome.storage.local.get(["blocking"], (result) => {
    if (result && result.blocking !== blocking) {
      chrome.storage.local.set({ blocking: blocking ? true : false });
    }
  });

  let blocktype = "blank";

  chrome.storage.sync.get(["blocktype"], (result) => {
    if (result && result.blocktype) {
      blocktype = result.blocktype;
    }
  });

  if (blocking && tabBlocked) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        if (blocktype === "blank") {
          chrome.tabs.update(tabs[0].id, { url: "about://blank" });
        } else if (blocktype === "close") {
          chrome.tabs.remove(tabs[0].id);
        } else {
          chrome.tabs.update(tabs[0].id, { url: "about://blank" });
        }
      }
    });
  }

  if (strictSleep && sleeping) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.update(tabs[0].id, { url: "about://blank" });
      }
    });
  }
};

const switchToBlankTab = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url: "about://blank" });
    }
  });
};

const checkTabs = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["blocklist", "titletags", "descriptiontags"],
      (result) => {
        const blocklistSet = result.blocklist ? result.blocklist : [];

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].url) {
            const currentTab = new URL(tabs[0].url).hostname;
            resolve(blocklistSet.includes(currentTab));
          } else {
            resolve(false);
          }
        });
      }
    );
  });
};

const checkStrictSleep = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["sleepstats"], (result) => {
      if (result.sleepstats && result.sleepstats.strict) {
        resolve(true);
      }
    });
    resolve(false);
  });
};

const checkActiveBlock = async () => {
  const currentBlocks = await getCurrentBlocks();
  console.log(currentBlocks)

  if (currentBlocks && currentBlocks.length > 0) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ["titletags", "descriptiontags", "activecolors"],
        (result) => {
          const titleTags = result.titletags || [];
          const descriptionTags = result.descriptiontags || [];

          for (const event of currentBlocks) {
            const titleMatch = event.summary
              ? titleTags.some((tag) => event.summary.includes(tag) && tag !== '')
              : false;
            const descriptionMatch = event.description
              ? descriptionTags.some((tag) => event.description.includes(tag) && tag !== '')
              : false;
            const colorMatch = result.activecolors
              ? result.activecolors[event.colorId]
              : false;

            if (titleMatch || descriptionMatch || colorMatch) {
              resolve(true);
              return;
            }
          }

          resolve(false);
        }
      );
    });
  }

  return false;
};

const getCurrentBlocks = async () => {
    try {
      const results = await chrome.storage.sync.get(["accessToken"]);
      if (results && results.accessToken) {
        const now = new Date();
        const endOfDay = new Date(now).setHours(23, 59, 59, 999);
  
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${new Date(
          endOfDay
        ).toISOString()}&singleEvents=true&orderBy=startTime`;
  
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${results.accessToken}`,
          },
        });
  
        if (!response.ok) {
          throw new Error(`Error fetching events: ${response.statusText}`);
        }
  
        const listOfEvents = await response.json();
        const currentEvents = [];
  
        if (listOfEvents && listOfEvents.items) {
          for (const event of listOfEvents.items) {
            const start = new Date(event.start.dateTime);
            const end = new Date(event.end.dateTime);
            const currentTime = new Date();
  
            if (currentTime >= start && currentTime <= end) {
              currentEvents.push(event);
            }
          }
        }
  
        return currentEvents;
      }
    } catch (error) {
      console.error("Failed to get current blocks:", error);
      return [];
    }
  };  

const checkSleep = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["sleepstats"], (result) => {
      if (
        result?.sleepstats?.time !== undefined &&
        result.sleepstats.time.length !== 0
      ) {
        let regex = new RegExp(
          "^([0-1][0-9]|2[0-3]):([0-5][0-9])-([0-1][0-9]|2[0-3]):([0-5][0-9])$"
        );
        if (!regex.test(result.sleepstats.time)) {
          resolve(false);
        }

        const [start, end] = result.sleepstats.time.split("-");
        const [startHours, startMinutes] = start.split(":");
        const [endHours, endMinutes] = end.split(":");

        let sleep = new Date();
        let awake = new Date(sleep);

        sleep.setHours(startHours, startMinutes, 0, 0);
        awake.setHours(endHours, endMinutes, 0, 0);

        const now = new Date();
        console.log(sleep, awake, now);

        if (sleep > awake) {
          // Normal sleep
          resolve(sleep <= now || now < awake);
        } else {
          // Sleep and wake before/after midnight
          resolve(sleep <= now && now < awake);
        }
      }
      resolve(false);
    });
  });
};

const updateRefresh = async () => {
  let time = await tickRefreshTimer();
  if (time < 600) await refreshAccessToken();
  time = await tickRefreshTimer();
};

const refreshAccessToken = async () => {
  chrome.storage.sync.get(["refreshToken"], async (result) => {
    if (!result.refreshToken) {
      console.error("No refresh token found.");
      return;
    }

    const refreshToken = result.refreshToken;
    const tokenUrl = "https://oauth2.googleapis.com/token";

    const config = await fetch("../config.json");
    const configData = await config.json();

    const client_secret = configData.client_secret;

    const params = new URLSearchParams();
    params.append("client_secret", client_secret);
    params.append(
      "client_id",
      "781492178861-7neq97l6dv2proi74vtlmllpj81gbtti.apps.googleusercontent.com"
    );
    params.append("refresh_token", refreshToken);
    params.append("grant_type", "refresh_token");

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const data = await response.json();

      if (data.access_token) {
        chrome.storage.sync.set({ accessToken: data.access_token });
        chrome.storage.local.set({ refreshtimer: data.expires_in });
        // console.log("New access token set:", data.access_token);
      } else {
        console.error("Failed to refresh token:", data);
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  });
};

const tickRefreshTimer = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["refreshtimer"], (result) => {
      if (result && result.refreshtimer) {
        const newTime = result.refreshtimer - 0.5;
        chrome.storage.local.set({ refreshtimer: newTime });
        resolve(newTime);
      } else {
        resolve(-1);
      }
    });
  });
};

// ALARMS

chrome.alarms.create("blockChecker", { periodInMinutes: 1 / 60 });

chrome.alarms.create("refreshAccessToken", { periodInMinutes: 30 });

chrome.alarms.create("checkRefresh", { periodInMinutes: 1 / 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "blockChecker") {
    await updateBlocking();
  }
  if (alarm.name === "refreshAccessToken") {
    await refreshAccessToken();
  }
  if (alarm.name === "checkRefresh") {
    await updateRefresh();
  }
});
