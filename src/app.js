import { runCountdown } from "./countdown.js";
import { createHypeMusic } from "./music.js";

const LUHANKA_NUMBER = 14;
// Finnish time is UTC+2 in late October (DST ends on the last Sunday of October)
const LUHANKA_START = Date.parse("2026-10-30T18:00:00+02:00");
const LUHANKA_END = Date.parse("2026-11-01T15:00:00+02:00");

runCountdown({
  number: LUHANKA_NUMBER,
  start: LUHANKA_START,
  end: LUHANKA_END,
});

const music = createHypeMusic({ finale: LUHANKA_START });

const playButton = document.querySelector("#audio");
const pauseButton = document.querySelector("#disable-audio");

playButton.addEventListener("click", () => {
  playButton.classList.add("hide");
  pauseButton.classList.remove("hide");
  music.start();
});

pauseButton.addEventListener("click", () => {
  pauseButton.classList.add("hide");
  playButton.classList.remove("hide");
  music.stop();
});
