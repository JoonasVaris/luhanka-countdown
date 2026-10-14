const PLAY_MESSAGE_MS = 3000;
const AFTER_PLAY_MESSAGE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDuration(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

// Shows the countdown to `start` in the #title and #timer elements. Returns a
// function that stops it.
export function runCountdown({ number, start, end }) {
  const title = document.getElementById("title");
  const display = document.getElementById("timer");
  // Only those who were here to watch it hit zero get the surprise
  const watchingZero = Date.now() < start;
  let timer;

  function getState(now) {
    if (now < start) {
      return {
        heading: "Seuraava Luhanka:",
        text: formatDuration(Math.ceil((start - now) / 1000)),
      };
    }
    if (watchingZero && now < start + PLAY_MESSAGE_MS) {
      return { heading: `${number}. Luhanka`, text: "SAA PELATA" };
    }
    if (now < end) {
      return {
        heading: `${number}. Luhanka käynnissä:`,
        text: formatDuration(Math.floor((now - start) / 1000)),
      };
    }
    return {
      heading: `${number}. Luhanka on ohi.`,
      text: "Nähdään ensi vuonna!",
    };
  }

  // Always derive the shown time from the wall clock, and wake up right at the
  // next whole second so the display never drifts.
  function render() {
    const now = Date.now();
    if (watchingZero && now >= start + PLAY_MESSAGE_MS) {
      window.location.href = AFTER_PLAY_MESSAGE_URL;
      return;
    }
    const state = getState(now);
    title.textContent = state.heading;
    display.textContent = state.text;
    timer = setTimeout(render, 1000 - (now % 1000));
  }

  render();

  return () => clearTimeout(timer);
}
