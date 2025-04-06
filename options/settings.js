// DATA

const editPage = document.getElementById("settings");

const blocklist = document.getElementById("blocklist");

const lavenderBox = document.getElementById("colorLavender");
const sageBox = document.getElementById("colorSage");
const grapeBox = document.getElementById("colorGrape");
const flamingoBox = document.getElementById("colorFlamingo");
const bananaBox = document.getElementById("colorBanana");
const tangerineBox = document.getElementById("colorTangerine");
const peacockBox = document.getElementById("colorPeacock");
const graphiteBox = document.getElementById("colorGraphite");
const blueberryBox = document.getElementById("colorBlueberry");
const basilBox = document.getElementById("colorBasil");
const tomatoBox = document.getElementById("colorTomato");

const titleTags = document.getElementById("titleTags");
const descriptionTags = document.getElementById("descriptionTags");

const sleepTimes = document.getElementById("sleepSchedule");
const strictSleepBox = document.getElementById("strictSleep");

const blockstyleSelector = document.getElementById("blockBehavior");
const strictBlockBox = document.getElementById("strictBlock");

const saveButton = document.getElementById("save");

// FUNCTIONS

const restoreOptions = () => {
  chrome.storage.sync.get(
    [
      "blocklist",
      "titletags",
      "descriptiontags",
      "activecolors",
      "sleepstats",
      "blockbehavior",
      "strictblock",
    ],
    (results) => {
      blocklist.value = results.blocklist ? results.blocklist.join("\n") : "";
      titleTags.value = results.titletags ? results.titletags.join("\n") : "";
      descriptionTags.value = results.descriptiontags
        ? results.descriptiontags.join("\n")
        : "";

      if (results.activecolors) {
        lavenderBox.checked = results.activecolors[1]
          ? results.activecolors[1]
          : false;
        sageBox.checked = results.activecolors[2]
          ? results.activecolors[2]
          : false;
        grapeBox.checked = results.activecolors[3]
          ? results.activecolors[3]
          : false;
        flamingoBox.checked = results.activecolors[4]
          ? results.activecolors[4]
          : false;
        bananaBox.checked = results.activecolors[5]
          ? results.activecolors[5]
          : false;
        tangerineBox.checked = results.activecolors[6]
          ? results.activecolors[6]
          : false;
        peacockBox.checked = results.activecolors[7]
          ? results.activecolors[7]
          : false;
        graphiteBox.checked = results.activecolors[8]
          ? results.activecolors[8]
          : false;
        blueberryBox.checked = results.activecolors[9]
          ? results.activecolors[9]
          : false;
        basilBox.checked = results.activecolors[10]
          ? results.activecolors[10]
          : false;
        tomatoBox.checked = results.activecolors[11]
          ? results.activecolors[11]
          : false;
      } else {
        lavenderBox.checked = false;
        sageBox.checked = false;
        grapeBox.checked = false;
        flamingoBox.checked = false;
        bananaBox.checked = false;
        tangerineBox.checked = false;
        peacockBox.checked = false;
        graphiteBox.checked = false;
        blueberryBox.checked = false;
        basilBox.checked = false;
        tomatoBox.checked = false;
      }

      if (results.sleepstats) {
        sleepTimes.value = results.sleepstats.time
          ? results.sleepstats.time
          : "";
        strictSleepBox.checked = results.sleepstats.strict
          ? results.sleepstats.strict
          : false;
      }

      blockstyleSelector.value = results.blockstyle
        ? results.blockstyle
        : "blank";

      strictBlockBox.checked = results.strictblock
        ? results.strictblock
        : false;
    }
  );

  chrome.storage.local.get(["blocking"], (results) => {
    editPage.disabled =
      strictBlockBox.checked && results.blocking ? true : false;
  });
};

const saveOptions = () => {
  const blocklistSet = blocklist.value.split("\n");
  const titleTagsSet = titleTags.value.split("\n");
  const descriptionTagsSet = descriptionTags.value.split("\n");

  const activeColors = {
    1: lavenderBox.checked,
    2: sageBox.checked,
    3: grapeBox.checked,
    4: flamingoBox.checked,
    5: bananaBox.checked,
    6: tangerineBox.checked,
    7: peacockBox.checked,
    8: graphiteBox.checked,
    9: blueberryBox.checked,
    10: basilBox.checked,
    11: tomatoBox.checked,
  };

  const sleepStats = {
    time: sleepTimes.value,
    strict: strictSleepBox.checked,
  };

  const strictBlock = strictBlockBox.checked;

  chrome.storage.sync.set(
    {
      blocklist: blocklistSet,
      titletags: titleTagsSet,
      descriptiontags: descriptionTagsSet,
      activecolors: activeColors,
      sleepstats: sleepStats,
      strictblock: strictBlock,
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 750);
    }
  );
};

// LISTENERS

document.addEventListener("DOMContentLoaded", restoreOptions);
saveButton.addEventListener("click", saveOptions);
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    saveOptions();
  }
});
