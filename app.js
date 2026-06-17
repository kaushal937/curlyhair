const node_fetch_1 = require("node-fetch");
const fs = require("fs");
const path = require("path");

let setdata = {
    targeturl : "",
    rate : NaN,
    total : NaN,
    warn : true
}

const sleep = async (milliseconds) => {
    await new Promise(resolve => {
        return setTimeout(resolve, milliseconds);
    });
};

fs.readFile("./config.json", 'utf-8', (err, data)=>{
    if(err){
        console.log(err)
        return
    }else{
        let tempstore = JSON.parse(data)
        setdata.targeturl = tempstore.targeturl
        setdata.rate = parseInt(tempstore.rate)
        setdata.total = parseInt(tempstore.total)
        setdata.warn = tempstore.warn
    }
    main()
})

async function main(){
    if(setdata.rate>=500 && setdata.total >= 7500 && setdata.warn==true){
        console.log("WARNING: Rate is too high! your computer might overheat")
        console.log("cancel if you want to, by pressing Ctrl + C, or else continuing in 15 seconds")

        await sleep(15000)
    }

    for (let i = 0; i < setdata.total; i++) {
    
        fetch(setdata.targeturl)
        console.log(i+1)

        await sleep(1000/setdata.rate)
    }

    console.log(`Sent ${setdata.total} requests at the rate of ${setdata.rate} requests per second to ${setdata.targeturl}`)
}