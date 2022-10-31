window.onload = () => {
    const luhankaTime = Date.parse("2022-11-04T19:00:00+03:00")
    const display = document.getElementById("timer");
    
    const msInMinute = 60 * 1000;
    const msInHour = 60 * msInMinute;
    const msInDay = 24 * msInHour;
    let luhankaanAikaaMs = luhankaTime - Date.now();

    function setTimer(){
        const days = Math.floor(luhankaanAikaaMs / msInDay);
        const hours = Math.floor((luhankaanAikaaMs - days * msInDay) / msInHour)
        const minutes = Math.floor((luhankaanAikaaMs - days * msInDay - hours * msInHour) / msInMinute);
        const seconds = Math.floor((luhankaanAikaaMs - days * msInDay - hours * msInHour - minutes * msInMinute) / 1000);
        display.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`
    }

    setTimer();
    
    const id = setInterval(function () {
        luhankaanAikaaMs -= 1000; // tick 1 second down, setInterval takes the delay to trigger
        setTimer();
        if(luhankaanAikaaMs < 1000){
            clearInterval(id);
            switchToOrbs();
            return;
        }
    }, 1000);

    function switchToOrbs(){
        const title = document.getElementById("title");
        const timer = document.getElementById("timer");
        const nav = document.getElementById("nav");

        title.remove();
        timer.remove();
        nav.remove();
        
        const canvas = document.createElement("canvas");

        const wrapper = document.getElementById("wrap");
        wrapper.appendChild(canvas);
        const canvasContext = canvas.getContext("2d");

        const cw = document.body.clientWidth;
        const ch = document.body.clientHeight;
        
        canvas.width = cw;
        canvas.height = ch;
        
        const img1 = new Image(233,310);
        const img2 = new Image(233,310);
        const img3 = new Image(233,310);
        const img4 = new Image(233,310);
        const img5 = new Image(233,310);
        const img6 = new Image(233,310);
        const img7 = new Image(233,310);
        const img8 = new Image(233,310);
        
        const images = [
            img1,
            img2,
            img3,
            img4,
            img5,
            img6,
            img7,
            img8
        ]
        
        for(const img of images){
            img.addEventListener("load",loader);
        }
        
        let loaded = false;
        function loader(){
            if(!allLoaded){
                return;
            }
            if(loaded){
                return;
            }
            loaded = true;
        
            canvasContext.drawImage(images[getRandom(8)], 0, 0, this.width, this.height, getRandom(cw-116), getRandom(ch-155), this.width, this.height);
            
            setInterval(() => {
                canvasContext.drawImage(images[getRandom(8)], 0, 0, this.width, this.height, getRandom(cw-116), getRandom(ch-155), this.width, this.height);
            },1500)
        }
        
        function getRandom(ceiling){
            return Math.floor(Math.random()*ceiling);
        }
        
        function allLoaded(){
            return img1.complete && img2.complete && img3.complete && img4.complete && img5.complete && img6.complete && img7.complete && img8.complete
        }
        
        img1.src = new URL('../assets/winterorb1.jpeg', import.meta.url);
        img2.src = new URL('../assets/winterorb2.jpeg', import.meta.url);
        img3.src = new URL('../assets/winterorb3.jpeg', import.meta.url);
        img4.src = new URL('../assets/winterorb4.jpeg', import.meta.url);
        img5.src = new URL('../assets/winterorb5.jpeg', import.meta.url);
        img6.src = new URL('../assets/winterorb6.jpeg', import.meta.url);
        img7.src = new URL('../assets/winterorb7.jpeg', import.meta.url);
        img8.src = new URL('../assets/winterorb8.jpeg', import.meta.url);
    }
}