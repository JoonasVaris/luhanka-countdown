window.onload = () => {

    const dragon = new URL('../assets/dragon.png', import.meta.url);
    const angel = new URL('../assets/angel.png', import.meta.url);
    const construct = new URL('../assets/construct.png', import.meta.url);
    const elf = new URL('../assets/elf.png', import.meta.url);
    const goblin = new URL('../assets/goblin.png', import.meta.url);
    const human = new URL('../assets/human.png', import.meta.url);
    const merfolk = new URL('../assets/merfolk.png', import.meta.url);
    const ninja = new URL('../assets/ninja.png', import.meta.url);
    const sliver = new URL('../assets/sliver.png', import.meta.url);
    const soldier = new URL('../assets/soldier.png', import.meta.url);
    const thopter = new URL('../assets/thopter.png', import.meta.url);
    const zombie = new URL('../assets/zombie.png', import.meta.url);
    const defaultBack = new URL('../assets/default.png', import.meta.url);

    const tribes = [
        {
            name: "Dragon",
            visible: false,
            img: `url(${dragon.href})`,
        },
        {
            name: "Angel",
            visible: false,
            img: `url(${angel.href})`
        },
        {
            name: "Construct",
            visible: false,
            img: `url(${construct.href})`
        },
        {
            name: "Elf",
            visible: false,
            img: `url(${elf.href})`
        },
        {
            name: "Goblin",
            visible: false,
            img: `url(${goblin.href})`
        },
        {
            name: "Human",
            visible: false,
            img: `url(${human.href})`
        },
        {
            name: "Merfolk",
            visible: false,
            img: `url(${merfolk.href})`
        },
        {
            name: "Ninja",
            visible: false,
            img: `url(${ninja.href})`
        },
        {
            name: "Sliver",
            visible: false,
            img: `url(${sliver.href})`
        },
        {
            name: "Soldier",
            visible: false,
            img: `url(${soldier.href})`
        },
        {
            name: "Thopter",
            visible: false,
            img: `url(${thopter.href})`
        },
        {
            name: "Zombie",
            visible: false,
            img: `url(${zombie.href})`
        },
    ]

    const ui = {
        currentSlot: 1,
        slot1Prev: undefined,
        slot2Prev: undefined,
        slot3Prev: undefined,
        slot4Prev: undefined,
    }

    const slot1 = document.getElementById("slot1");
    slot1.style.backgroundImage = `url(${defaultBack.href})`;
    const slot2 = document.getElementById("slot2");
    slot2.style.backgroundImage = `url(${defaultBack.href})`;
    const slot3 = document.getElementById("slot3");
    slot3.style.backgroundImage = `url(${defaultBack.href})`;
    const slot4 = document.getElementById("slot4");
    slot4.style.backgroundImage = `url(${defaultBack.href})`;

    function getRandomInvisible(){
        const invisibles = tribes.filter((tribe) => !tribe.visible);
        const entry = invisibles[Math.floor(Math.random()*invisibles.length)];
        if(entry){
            entry.visible = true;
            return entry;
        }
        return undefined;
    }

    /**
    * 
    * @param {
    *    tribe: {
    *      name: string
    *      img: string
    *    },
    *    parent: HTMLElement
    * } params 
    */
   function addImg(params){
       const child = document.createElement("div");
       child.style.backgroundImage = params.tribe.img;
       child.classList.add("slot-child");
       
       const tribe = document.createElement("span");
       tribe.className = "tribe";
       tribe.innerHTML = params.tribe.name;
   
       child.appendChild(tribe);
       
       if(params.parent.childNodes.length > 0){
           let oldchildren = params.parent.childNodes;
           for (const node of oldchildren){
                const tribeName = node.childNodes[0].innerHTML; // should be span
                const release = tribes.find((tribe) => tribe.name === tribeName);
                release.visible = false;
               node.remove();
           }
       }
   
       params.parent.appendChild(child);
   
       setTimeout(() => {
           child.classList.add("slot-child__visible");
       }, 1000);
   }

    setInterval(function (ui) {
        console.log(ui);
        if(ui.currentSlot === 1){            
            const randomTribe = getRandomInvisible();

            addImg({tribe: randomTribe, parent: slot1});
            ui.currentSlot = 2;
        } else if(ui.currentSlot === 2){
            const randomTribe = getRandomInvisible();
            addImg({tribe: randomTribe, parent: slot2});
            ui.currentSlot = 3;
        }else if(ui.currentSlot === 3){
            const randomTribe = getRandomInvisible();
            addImg({tribe: randomTribe, parent: slot3});
            ui.currentSlot = 4;
        }else if(ui.currentSlot === 4){
            const randomTribe = getRandomInvisible();
            addImg({tribe: randomTribe, parent: slot4});
            ui.currentSlot = 1;
        }
    }, 3000, ui);
}

