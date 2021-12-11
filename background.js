var trackersInfoUrl = 'https://kaiknox.com/trackerspy/trackers.json';
var trackersData;


//Can't translate context menus yet for some reason :(
chrome.contextMenus.create({
      title: "Report",
      contexts: ["action"],
      id: "report"
});

chrome.contextMenus.create({
      title: "Get info",
      contexts: ["frame", "image"],
      id: "adInfo"
});
    

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    console.log(info)
    if (info.menuItemId == "report" ) {
        chrome.windows.create({ url: chrome.runtime.getURL("options/options.html"), type: 
        "popup" });
    } else if (info.menuItemId == "adInfo") {
        if (info.srcUrl || info.frameUrl) {
            var url = info.srcUrl || info.frameUrl;
console.log("e")

             var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];


    if(hostname.indexOf("www.") > -1) {
        hostname = hostname.split('www.')[1]
    }



          const newURL =  chrome.runtime.getURL("options/options.html") + "?tracker="+ encodeURIComponent(hostname);
        
  chrome.tabs.create({ url: newURL });
}
    }
})
caches.open('trackers').then(function(cache) {

        var x = cache.match(trackersInfoUrl)

x.then(function(result){

   if (result) {

var y = result.json()
  y.then(function(result1){
    trackersData = result1
  });
}
});

});


chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install") {
        //call a function to handle a first install
        setData();
            console.log("Ok2")

         caches.open('trackers').then(function(cache) {
            cache.add(trackersInfoUrl);
fetch(trackersInfoUrl)
  .then(response => response.json())
  .then(data => {
       console.log(data)

        console.log("Ok4")

   trackersData = data;
   data.filter(function(y) {
   if (y.id) {
               chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
          "id": y.id + 2,
          "priority": 2,
          "action": {
            "type": "allow"
          },

          "condition": y.condition

        }],
        removeRuleIds: [y.id + 2]
      })
            }

      })
}
  );





            chrome.alarms.create("reloadTrackersData", { periodInMinutes: 60 * 24 * 5 });
         });

    } else if (details.reason == "update") {
        //call a function to handle an update

    }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    console.log(activeInfo.tabId);

  function getTrackers() {
                return pageTrackers;
               }
        chrome.scripting.executeScript({
            target: {tabId: activeInfo.tabId},
          function: getTrackers
        }, function (result) {
         if (result && result[0].result) {
            var data = result[0].result
            chrome.action.setBadgeText({text: String(data.length)});
            chrome.action.setBadgeBackgroundColor({color: '#34c759'});
         } else {
            chrome.action.setBadgeText({text: ""});
         }
         });








});


function setData() {
   chrome.storage.local.get("settings", function (result) {
      if (result.layout == undefined) {
         var data = {
            autoBlock: {
                enabled: false,
                type: "exception"
            },
            autoDelete: "30",
            blockCookies: false,
            privacy: {
                location: true,
                userAgent: true
            }
         }
         chrome.storage.local.set({ "settings" : JSON.stringify(data)}, function() {
         });
      }
   });
   chrome.storage.local.get("websites", function (result) {
      if (result.websites == undefined) {
         var data = {
            totalVisited: [], //all the websites you have visited (including the ones that don't track)
            totalTracking: [] //all the websites that have 1 or more trackers
         }
         chrome.storage.local.set({ "websites" : JSON.stringify(data)}, function() {
         });
      }
   });

   chrome.storage.local.get("blocked", function (result) {
      if (result.blocked == undefined) {
         var data = {
            trackers: []
         }
         chrome.storage.local.set({ "blocked" : JSON.stringify(data)}, function() {
         });
      }
   });

   chrome.storage.local.get("whiteListed", function (result) {
      if (result.whiteListed == undefined) {
         var data = {
            trackers: []
         }
         chrome.storage.local.set({ "whiteListed" : JSON.stringify(data)}, function() {
         });
      }
   });

   chrome.storage.local.get("setup", function (result) {
      if (result.setup == undefined) {
         var data = {}
         chrome.storage.local.set({ "setup" : JSON.stringify(data)}, function() {
         });
      }
   });
       console.log("Ok")

}

/*
chrome.cookies.onChanged.addListener(function() {
})


*/

chrome.omnibox.onInputEntered.addListener(function(text) {
  // Encode user input for special characters , / ? : @ & = + $ #
  const newURL =  chrome.runtime.getURL("options/options.html") + "?search="+ encodeURIComponent(text);
  chrome.tabs.create({ url: newURL });
});

//Update chrome alarm when user changes time interval
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.setting == "autoDelete") {
            chrome.storage.local.get("settings", function (result) {
         if (result.settings) {
            var settings = JSON.parse(result.settings);
            chrome.alarms.clear("deleteData");
            if (settings.autoDelete < 1) {
               settings.autoDelete = 30;
            }
            var time = 60 * 24 * settings.autoDelete;
            chrome.alarms.create("deleteData", { periodInMinutes: time });
         }
      });
    }
    if (request.request == "trackerData") {


function insertData(data) {
   trackers = data;
   status = "hasData"






}



  chrome.tabs.query({
    active: true,
    windowType: "normal",
    currentWindow: true
  }, function(d) {
    console.log(d[0].id);


    chrome.scripting.executeScript({
      target: {
        tabId: d[0].id
      },
      function: insertData,
      args: [trackersData]
    }, function(result) {
                  sendResponse({status: "finished"});

    });
  });












    }
    if (request.action == "setBadge") {
            sendResponse({ok: "ok"});

  function getTrackers() {
                return pageTrackers;
               }
        chrome.scripting.executeScript({
            target: {tabId: sender.tab.id},
          function: getTrackers
        }, function (result) {
         if (result) {
            var data = result[0].result
            chrome.action.setBadgeText({text: String(data.length)});
            chrome.action.setBadgeBackgroundColor({color: '#34c759'});
         }
         });
    }
    if (request.action == "updateUserAgent") {

        chrome.storage.local.get("settings", function (result) {
         if (result.settings) {
            var settings = JSON.parse(result.settings);
            chrome.alarms.clear("updateUserAgent");
            if (settings.privacy.userAgent == true) {
                console.log("update set")
                           var time = 1;
            chrome.alarms.create("updateUserAgent", { periodInMinutes: time });
            }
         }
      });

    }
  }
);

chrome.alarms.onAlarm.addListener((alarm) => {
   if (alarm.name == "deleteData") {
      console.log("deleting data...")
        chrome.storage.local.get("websites", function(result) {
         if (result.websites == undefined) {
            chrome.storage.local.set({
               "websites": JSON.stringify(websiteData)
            }, function () {});
         } else {
            var websiteData = {
               totalVisited: [], //all the websites you have visited (including the ones that don't track)
               totalTracking: [] //all the websites that have 1 or more trackers
            }

                chrome.storage.local.set({
      "websites": JSON.stringify(websiteData)
    }, function () {});
         }
  });

   } else if (alarm.name == "updateUserAgent") {

    var userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 Edge/12.246",
    "Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36"
    ];
    var item = userAgents[Math.floor(Math.random()*userAgents.length)];
                                console.log("update complete semi")
                                console.log(item)

        chrome.storage.local.get("settings", function (result) {
         if (result.settings) {
            var settings = JSON.parse(result.settings);
            if (settings.privacy.userAgent == true) {
                                console.log("update complete")

chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
          "id": 2,
          "priority": 2,
          "action": {
            "type": "modifyHeaders",
              "requestHeaders": [
                { "header": "User-Agent", "operation": "set", "value": item },
              ]
          },
          "condition": {"urlFilter": "*", "resourceTypes": ["main_frame", "script", "sub_frame", "stylesheet", "image", "font", "object", "xmlhttprequest", "ping", "media", "other"] }


        }],
        removeRuleIds: [2]
      })
            } else {
                chrome.alarms.clear("updateUserAgent");
                  chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [2]
      })
            }
         }
      });

   } else if (alarm.name = "reloadTrackersData") {
      caches.open('trackers').then(function(cache) {




         //If autoBlock is on, update all the rules 
         chrome.storage.local.get("settings", function(result) {
            var settings = [];
            if (result.settings) {
               settings = JSON.parse(result.settings)
            }
            if (settings.autoBlock.enabled == true) {
         chrome.storage.local.get("whiteListed", function(result) {
            var whitelisted = []
            if (result.whiteListed) {
               var whitelisted = JSON.parse(result.whiteListed)
            }
             var trackersData; 
fetch(trackersInfoUrl)
  .then(response => response.json())
  .then(data => {
   trackersData = data;
            caches.delete(trackersInfoUrl);
         cache.add(trackersInfoUrl);
            data.filter(function(y) {



               var action = "block";
               whitelisted.filter(function(z) {
                  if (y.url == z.url && z.type !== "failed") {
                     action = "allow";
                  }
               })


               try {


      var priotity;
      if (action == "block") {
        priotity = 3
      } else {
        priotity = 1
      }
var status = chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
          "id": y.id + 2,
          "priority": priotity,
          "action": {
            "type": action
          },
          "condition": y.condition

        }],
        removeRuleIds: [y.id + 2]
      },
      function() {

        //After updating the rules, trigger the original function again, to save data
        if (chrome.runtime.lastError) {
          var status = "error";
        } else {
          var status = "success"
        }
  
        if (action == "allow") {

        } else if (action == "block") {
                    var i = whitelisted.map(function(e) {
          return e.url;
        }).indexOf(y.url);
        if (i > -1) {
            whitelisted.splice(i, 1);
        }


      }
      })



            } catch (error) {
                whitelisted.push(y)
                chrome.storage.local.set({
                  "whiteListed": JSON.stringify(whiteListed)
                }, function() {});
            }




            })
         }
);


         });
   } else {




   chrome.storage.local.get("blocked", function(result) {
            var blocked = []
            if (result.blocked) {
               var blocked = JSON.parse(result.blocked)
            }
             var trackersData; 
fetch(trackersInfoUrl)
  .then(response => response.json())
  .then(data => {
   trackersData = data;
            data.filter(function(y) {



               var action = "allow";
               blocked.filter(function(z) {
                  if (y.url == z.url) {
                     action = "block";
                  }
               })


               try {


      var priotity;
      if (action == "block") {
        priotity = 3
      } else {
        priotity = 1
      }
var status = chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
          "id": y.id + 2,
          "priority": priotity,
          "action": {
            "type": action
          },
          "condition": y.condition

        }],
        removeRuleIds: [y.id + 2]
      },
      function() {

        //After updating the rules, trigger the original function again, to save data
        if (chrome.runtime.lastError) {
          var status = "error";
        } else {
          var status = "success"
        }
  
        if (action == "allow") {

        } else if (action == "block") {
                    var i = blocked.map(function(e) {
          return e.url;
        }).indexOf(y.url);
        if (i == -1) {
            blocked.push(y);
        }


      }
      })



            } catch (error) {
                                    var i = blocked.map(function(e) {
          return e.url;
        }).indexOf(y.url);
                blocked.splice(i, 1);
                chrome.storage.local.set({
                  "blocked": JSON.stringify(blocked)
                }, function() {});
            }




            })
         }
);


         });





   }
         });





      });
   }
});
