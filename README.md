You can use this module to send multiple GET requests to a specific URL, to stress test it.

The config file has 4 properties :

targeturl --> the target URL
rate --> rate of sending requests to the target URL (requests/second)
total --> total number of requests to send
warn --> Send warning if the rate and total are too high, that it can overheat the computer
