let shouldPlay = false;

const evenAudio = new Audio(
  new URL("../assets/clock-even.mp3", import.meta.url)
);
const oddAudio = new Audio(new URL("../assets/clock-odd.mp3", import.meta.url));

window.onload = () => {
  // const luhankaTime = Date.parse("2022-11-04T19:00:00+02:00")
  // const luhankaEnded = Date.parse("2022-11-06T15:00:00+02:00");
  const nextLuhanka = Date.parse("2024-03-15T19:00:00+02:00");
  const display = document.getElementById("timer");

  const msInMinute = 60 * 1000;
  const msInHour = 60 * msInMinute;
  const msInDay = 24 * msInHour;
  let timeToLuhanka = nextLuhanka - Date.now();

  function setTimer() {
    const days = Math.floor(timeToLuhanka / msInDay);
    const hours = Math.floor((timeToLuhanka - days * msInDay) / msInHour);
    const minutes = Math.floor(
      (timeToLuhanka - days * msInDay - hours * msInHour) / msInMinute
    );
    const seconds = Math.floor(
      (timeToLuhanka -
        days * msInDay -
        hours * msInHour -
        minutes * msInMinute) /
        1000
    );
    display.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  setTimer();

  let counter = 0;
  audioStuff();

  const id = setInterval(function () {
    timeToLuhanka += 1000; // tick 1 second down, setInterval takes the delay to trigger
    setTimer();

    if (shouldPlay) {
      if (counter % 2 === 0) {
        evenAudio.play();
      } else {
        oddAudio.play();
      }
    }

    counter++;

    if (timeToLuhanka < 1000 && timeToLuhanka > -5000) {
      clearInterval(id);
      window.location.replace("/versus.html");
      return;
    }
  }, 1000);

  // function switchToOrbs(){
  //     const title = document.getElementById("title");
  //     const timer = document.getElementById("timer");
  //     const nav = document.getElementById("nav");

  //     title.remove();
  //     timer.remove();
  //     nav.remove();

  //     const canvas = document.createElement("canvas");

  //     const wrapper = document.getElementById("wrap");
  //     wrapper.appendChild(canvas);
  //     const canvasContext = canvas.getContext("2d");

  //     const cw = document.body.clientWidth;
  //     const ch = document.body.clientHeight;

  //     canvas.width = cw;
  //     canvas.height = ch;

  //     const img1 = new Image(233,310);
  //     const img2 = new Image(233,310);
  //     const img3 = new Image(233,310);
  //     const img4 = new Image(233,310);
  //     const img5 = new Image(233,310);
  //     const img6 = new Image(233,310);
  //     const img7 = new Image(233,310);
  //     const img8 = new Image(233,310);

  //     const images = [
  //         img1,
  //         img2,
  //         img3,
  //         img4,
  //         img5,
  //         img6,
  //         img7,
  //         img8
  //     ]

  //     for(const img of images){
  //         img.addEventListener("load",loader);
  //     }

  //     let loaded = false;
  //     function loader(){
  //         if(!allLoaded){
  //             return;
  //         }
  //         if(loaded){
  //             return;
  //         }
  //         loaded = true;

  //         canvasContext.drawImage(images[getRandom(8)], 0, 0, this.width, this.height, getRandom(cw-116), getRandom(ch-155), this.width, this.height);

  //         setInterval(() => {
  //             canvasContext.drawImage(images[getRandom(8)], 0, 0, this.width, this.height, getRandom(cw-116), getRandom(ch-155), this.width, this.height);
  //         },1000)
  //     }

  //     function getRandom(ceiling){
  //         return Math.floor(Math.random()*ceiling);
  //     }

  //     function allLoaded(){
  //         return img1.complete && img2.complete && img3.complete && img4.complete && img5.complete && img6.complete && img7.complete && img8.complete
  //     }

  //     img1.src = new URL('../assets/winterorb1.jpeg', import.meta.url);
  //     img2.src = new URL('../assets/winterorb2.jpeg', import.meta.url);
  //     img3.src = new URL('../assets/winterorb3.jpeg', import.meta.url);
  //     img4.src = new URL('../assets/winterorb4.jpeg', import.meta.url);
  //     img5.src = new URL('../assets/winterorb5.jpeg', import.meta.url);
  //     img6.src = new URL('../assets/winterorb6.jpeg', import.meta.url);
  //     img7.src = new URL('../assets/winterorb7.jpeg', import.meta.url);
  //     img8.src = new URL('../assets/winterorb8.jpeg', import.meta.url);
  // }
};

function audioStuff() {
  const playButton = document.querySelector("#audio");
  const pauseButton = document.querySelector("#disable-audio");

  playButton.addEventListener("click", toggle);
  pauseButton.addEventListener("click", toggle);

  function toggle() {
    if (playButton.classList.contains("hide")) {
      playButton.classList.remove("hide");
      pauseButton.classList.add("hide");
      shouldPlay = false;
    } else {
      pauseButton.classList.remove("hide");
      playButton.classList.add("hide");
      shouldPlay = true;
    }
  }
}
