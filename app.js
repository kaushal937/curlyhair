const cluster = require("cluster")
const fs = require("fs");

let sentCount = 0;
let totalCount = 0;

function printLog(){
    process.stdout.write(`\rProgress: ${sentCount}/${totalCount}`);
}

const parallelLength = require("os").cpus().length

if(cluster.isPrimary){
    for(let i = 0; i < parallelLength; i++){
        cluster.fork();
    }
}else{
    mainWrapper();
}

//main-func
function mainWrapper(){

const fakeIP = "203.0.113.50"

let setdata = {
    targeturl: "",
    rate: NaN,
    total: NaN,
    warn: true
};

const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

fs.readFile("./config.json", 'utf-8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    let tempstore = JSON.parse(data);
    setdata.targeturl = tempstore.targeturl;
    setdata.rate = parseInt(tempstore.rate);
    setdata.total = parseInt(tempstore.total);
    setdata.warn = tempstore.warn;
    totalCount = parseInt(tempstore.total)
    main();
});

async function main() {
    if (setdata.rate >= 500 && setdata.total >= 7500 && setdata.warn === true) {
        console.log("WARNING: Rate is high. Client-side drops will heavily stress proxy connection tables.");
        console.log("Continuing in 5 seconds... Press Ctrl + C to cancel.");
        await sleep(5000);
    }

    console.log(`Starting execution: Target total of ${setdata.total} requests.`);

    // Batching logic overcomes setTimeout latency limitations for high RPS
    
    const intervalMs = 50; // Fire in chunks every 50ms to keep timing accurate
    const chunkFactor = setdata.rate * (intervalMs / 1000);

    const timer = setInterval(() => {
        for (let i = 0; i < chunkFactor; i++) {
            if (sentCount >= setdata.total) {
                clearInterval(timer);
                console.log(`\nFinished. Sent ${sentCount} requests to ${setdata.targeturl}`);
                return;
            }

            sendAndAbortMidFlight(setdata.targeturl);
            sentCount++;
        }
    }, intervalMs);
}

function sendAndAbortMidFlight(url) {
    const controller = new AbortController();

    // Configure fetch to pass the abort signal
    fetch(url, {
        signal: controller.signal,
        // Removes standard browser-like session/cookie validation tracking bottlenecks
        keepalive: false,
        headers: {
            // Simulates traffic originating from a different client IP
            'X-Forwarded-For': fakeIP,
            'X-Real-IP': fakeIP,
            // Simulates different user devices
            'User-Agent': 'MockTestClient/1.0'
        }
    })
        .catch(() => {
            // Silently swallow the expected 'AbortError' to prevent console noise
        });

    // Abort IMMEDIATELY after execution stack clears. 
    // This pushes the connection out, but prevents the machine from downloading the payload.
    setImmediate(() => {
        controller.abort();
    });
}
}