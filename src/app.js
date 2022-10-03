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
            return;
        }
    }, 1000);
}