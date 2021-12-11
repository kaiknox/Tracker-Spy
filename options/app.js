var websiteData = {
  totalVisited: [], //all the websites you have visited (including the ones that don't track)
  totalTracking: [] //all the websites that have 1 or more trackers
}

var trackersData;
caches.open('trackers').then(function(cache) {



  // cache.add('https://kaiknox.com/trackerspy/trackers.json');

  var x = cache.match("https://kaiknox.com/trackerspy/trackers.json")
  console.log(x)
  x.then(function(result) {
    var y = result.json()
    y.then(function(result1) {
      trackersData = result1
      console.log(trackersData)
    });
  });
});


var app = angular.module('myapp', []);
app.config(function($compileProvider) {
  var imgSrcSanitizationWhitelist = /^\s*(https?|chrome-extension|chrome|file):|data:image\//;
  $compileProvider.imgSrcSanitizationWhitelist(imgSrcSanitizationWhitelist);
  $compileProvider.aHrefSanitizationWhitelist(imgSrcSanitizationWhitelist);
});




    var getTimeDifference = function(a, b, callback) {

      if (!a || a == "") var a = new Date().getTime();
      var dif = a - b;
      var unit;
      if (dif / 1000 >= 1) {
        dif = Math.trunc(dif / 1000)
        if (dif / 60 >= 1) {
          dif = Math.trunc(dif / 60)
          if (dif / 60 >= 1) {
            dif = Math.trunc(dif / 60)
            if (dif / 24 >= 1) {
              dif = Math.trunc(dif / 24)
              if (dif / 30 >= 1) {
                dif = Math.trunc(dif / 60)
              } else {
                unit = "day"
              }
            } else {
              unit = "hour"
            }
          } else {
            unit = "minute"
          }
        } else {
          unit = "second"
        }
      } else {
        unit = "milisecond"
      }
      var plural = ""
      if (dif > 1) plural = "s"
      var result = {
        value: dif,
        unit: chrome.i18n.getMessage("time_unit__" + unit + plural)
      };
      return result

    }


app.controller('mainController', function app($scope, $timeout) {

  chrome.storage.local.get("websites", function(result) {
    if (result.websites == undefined) {
      chrome.storage.local.set({
        "websites": JSON.stringify(websiteData)
      }, function() {});
    } else {
      websiteData = JSON.parse(result.websites);

    }

    //Let's just define the main data objects. Websites and trackers.
    var websites = {
      summary: {
        data: [],
        maxValue: ""
      },
      list: {
        data: websiteData.totalTracking
      }
    }

    var trackers = {
      summary: {
        data: [],
        maxValue: ""
      },
      list: {
        data: [],
        mostCommon: []
      }
    }

    chrome.storage.onChanged.addListener(function(changes, namespace) {
  if ("websites" in changes) {
    chrome.storage.local.get("websites", function(result) {
      var websiteData = JSON.parse(result.websites);
      websites.list.data = websiteData.totalTracking;
        loadAllData();
    });
  }
});
    loadAllData();
function loadAllData() {
    //Sort website list by trackers count (from big to small)
    websites.list.data.sort(function(a, b) {
      return b.trackers.length - a.trackers.length;
    });
    //When displaying data in the graph, only show the 10 first.
    if (websites.list.data.length > 10) {
      websites.summary.data = JSON.parse(JSON.stringify(websites.list.data.slice(0, 10)));
    } else {
      websites.summary.data = JSON.parse(JSON.stringify(websites.list.data));
    }

    //Get the website with highest trackers count, to display the relevant numbers in the graph
    websites.summary.maxValue = Math.max.apply(Math, websites.summary.data.map(function(o) {
      return o.trackers.length;
    }));



    //Using the website data, let's create another object to dispay the websites that use each tracker.
    for (var i = 0; i < websites.list.data.length; i++) {
      websites.list.data[i].trackers.filter(function(y) {
        var exists = false;

        if (trackers.list.data.length > 0) {
          trackers.list.data.filter(function(x) {

            if (y.url == x.url) {

              //The tracker already exists within the new object, so add the current website to it.
              exists = true;
              var numb = trackers.list.data.indexOf(x)

              //Let's check if the website already exists in the new object.
              if (x.websites.map(function(e) {
                  return e.website;
                }).indexOf(websites.list.data[i].website) == -1) {
                //Create a new object with the website data
                var c = websites.list.data[i];
                x.websites.push(c)

                var e = websites.list.data[i].trackers.map(function(e) {
                  return e.url;
                }).indexOf(x.url)
                websites.list.data[i].trackers[e] = x;

              }
            }

          })
        }
        if (exists == false || trackers.list.data.length == 0) {
          //The tracker does not exist in the new object, so add it with it's website.
          var j = JSON.parse(JSON.stringify(y))
          y.websites = [websites.list.data[i]]
          trackers.list.data.push(y)
        }
      })
    }
    console.log(websites)
    //Sort trackers list by websites count (from big to small)
    trackers.list.data.sort(function(a, b) {
      return b.websites.length - a.websites.length;
    });

    //When displaying data in the graph, only show the 10 first.
    if (trackers.list.data.length > 10) {
      trackers.summary.data = trackers.list.data.slice(0, 10).map(a => Object.assign({}, a));
    } else {
      trackers.summary.data = trackers.list.data.map(a => Object.assign({}, a));
    }

    //Get the website with highest trackers count, to display the relevant numbers in the graph
    trackers.summary.maxValue = Math.max.apply(Math, trackers.summary.data.map(function(o) {
      return o.websites.length;
    }))


    //To make things easy when displaying the graph, let's just change some of the structure of the objects. 
    websites.summary.data.filter(function(a) {
      a.data = a.trackers; //Trackers now becomes data (more general)
      a.name = a.website; //Website now becomes name (AKA item name)
      a.website = ""
    });

    trackers.summary.data.filter(function(a) {
      a.data = a.websites; //Websites now becomes data (more general)
      a.name = a.url; //URL now becomes name (AKA item name)
      a.url = ""
    });

}


    var popupAlert = function(options) {
      this.id = options.id

      this.display = function() {
        var buttons;
        if (options.buttons.length == 1) var buttons = `<button type="button" class="button action_close ` + options.buttons[0].class + `">` + options.buttons[0].text + `</button>`
        if (options.buttons.length == 2) var buttons = `<button type="button" class="button action_close ` + options.buttons[0].class + `" style="width: calc(50% - 10px); margin-right: 10px;">` + options.buttons[0].text + `</button><button type="button" class="button action_1 ` + options.buttons[1].class + `" style="width: calc(50% - 10px); margin-left: 10px;">` + options.buttons[1].text + `</button>`
        if (options.buttons.length == 3) var buttons = `<button type="button" class="button action_1 ` + options.buttons[1].class + `" style="width: 100%; margin-bottom: 10px;">` + options.buttons[1].text + `</button><button type="button" class="button action_2 ` + options.buttons[2].class + `" style="width: 100%; margin-bottom: 10px;">` + options.buttons[2].text + `</button><button type="button" class="button action_close ` + options.buttons[0].class + `" style="width: 100%;">` + options.buttons[0].text + `</button>`
        var alert = $(`
      <div class="popup-alert-overlay" id="` + options.id + `">
        <div class="popup-alert ` + options.size + `">
          <span>` + options.icon + `</span>
          <h5 style="text-align: center;">` + options.title + `</h5>
          <p style="text-align: center;">` + options.text + `</p>
          <div style="margin-top: 20px;">` + buttons + `</div>
        </div>
      </div>`);
        $("body").append(alert)
        var target = this.id
        var closeAction = function() {
          $("#" + target + " .popup-alert").css("transform", "translate(-50%, -50%) scale(0)")
          $("#" + target).css("opacity", "0")
          setTimeout(() => {
            $("#" + target).css("display", "none")
            $("#" + target).remove()
          }, 200);
        }
        $("#" + this.id + " .popup-alert .action_1").click(function() {
          options.buttons[1].function()
          closeAction()
        })
        $("#" + this.id + " .popup-alert .action_2").click(function() {
          options.buttons[2].function()
          closeAction()
        })
        $("#" + this.id + " .popup-alert .action_close").click(function() {
          closeAction();
        })
        var fired = false;
        $(document).on("keydown", function(event) {
          if (fired == false) {
            fired = true;
            console.log(event)
            event.preventDefault();
            event.stopPropagation();
            if (event.keyCode === 13) {
              fired = true;

              console.log("a")
              $("#" + options.id + " .popup-alert .default-action").click();
              $("body").focus();
            }
          }

          fired = true;

        });
        $("#" + this.id).css("display", "block")
        setTimeout(() => {
          $("#" + this.id).css("opacity", "1")
          setTimeout(() => {
            $("#" + this.id + " .popup-alert").css("transform", "translate(-50%, -50%) scale(1)")
          }, 50);
        }, 50);



        $(document).on("click", ".popup-alert-overlay", function(e) {
          if ($(e.target).is('.popup-alert-overlay')) {
            closeAction()
          }


        });
      }

    };




    var totalCookies;
    $scope.loadAllCookies = function() {
      totalCookies = [];

      if (!chrome.cookies) {
        chrome.cookies = chrome.experimental.cookies;
      }

      chrome.cookies.getAll({}, function(all_cookies) {
        var count = all_cookies.length;
        for (var i = 0; i < count; i++) {
          var cookie = all_cookies[i];
          var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
          totalCookies.push(cookie);
          //chrome.cookies.remove({"url": url, "name": cookie.name});
        }
      });


    }



    $scope.loadAllCookies();

    //Now add the objects to an angular variable.
    $scope.websites = websites;
    $scope.trackers = trackers;




    var recentLocationUseTime = Math.max.apply(Math, websites.list.data.map(function(o) {
      if (o.info && o.info.privacy.location.time !== "") {
        return o.info.privacy.location.time;
      } else {
        return 1

      }
    }))

    var recentLocationUseItemPos = websites.list.data.map(function(e) {
      if (e.info) {
        return e.info.privacy.location.time;
      }
    }).indexOf(recentLocationUseTime);



    var trackerCookies = []
    /*
    var recentLocationUseSite;
    var recentLocationUseTime;

    if (websites.list.data[recentLocationUseItemPos]) {
      recentLocationUseSite = websites.list.data[recentLocationUseItemPos].website;
      recentLocationUsegetTimeDifference("", websites.list.data[recentLocationUseItemPos].info.privacy.location.time);
    } else {
      recentLocationUseSite = false
      recentLocationUsetime = false
    }
    */


    //If there's data, display the stats
    var stats = {
      websitesTracked: Math.round((websiteData.totalTracking.length / websiteData.totalVisited.length) * 100) || 0,
      popularTracker: trackers.list.data[0],
      cookies: {
        total: 0,
        trackers: 1
      },
      recentLocationUse: {
        site: websites.list.data[recentLocationUseItemPos]?.website ?? false,
        time: false
      }
    }

//Only execute if there was a website that used user's location, othetwyse, undefined will be pased into the function that calculates timeDif
if (websites.list.data[recentLocationUseItemPos].info.privacy.location) {
  stats.recentLocationUse.time = getTimeDifference("", websites.list.data[recentLocationUseItemPos]?.info.privacy.location.time) ?? false
}

    $scope.stats = stats;





    //Update the thime passed
    (function(a) {
      setInterval(function() {
        if (websites.list.data[recentLocationUseItemPos].info.privacy.location) {

        var r = getTimeDifference("", websites.list.data[recentLocationUseItemPos]?.info.privacy.location.time)
        a(r)
      }
      }, 10000)
    })(function(r) {
      $scope.$apply(function() {
        $scope.stats.recentLocationUse.time = r
      })
    });
    setTimeout(function() {
      totalCookies.filter(function(a) {
        var matched = false;
        trackersData.filter(function(b) {
          if (b.cookies && b.cookies.indexOf(a.name) > -1 && matched == false) {
            console.log(a.name)
            trackerCookies.push(a)
            matched = true;
          } else if (b.cookies && matched == false) {
            b.cookies.filter(function(x) {
              if (a.name.match(x) && x.length > 1) {
                console.log("2------ " + a.name + " (" + x + ")")
                trackerCookies.push(a)
                matched = true;
              }
            })
          }
        });
      });
      $scope.$apply(function() {
        $scope.stats.cookies.total = totalCookies.length;
        $scope.stats.cookies.trackers = trackerCookies.length
      })




    }, 2000)


    //Let's create some complicated circle to display the % of websites you have visited that use trackers.
    //Idk how this works but it works fine
    //Written by Egor Avakumov on codepen (https://codepen.io/egorava)
    var can = document.getElementById('canvas'),
      spanProcent = document.getElementById('procent'),
      c = can.getContext('2d');
    var posX = can.width / 2,
      posY = can.height / 2,
      fps = 1,
      procent = 0,
      oneProcent = 360 / 100,
      result = oneProcent * stats.websitesTracked;

    c.lineCap = 'round';
    arcMove();

    function arcMove() {
      var deegres = 1;
      var acrInterval = setInterval(function() {
        if (stats.websitesTracked > 0) deegres += ((stats.websitesTracked + 20) / (deegres + 20) * 3);
        if (stats.websitesTracked == 0) degrees = 0;
        c.clearRect(0, 0, can.width, can.height);
        procent = deegres / oneProcent;

        spanProcent.innerHTML = procent.toFixed();

        c.beginPath();
        c.arc(posX, posY, 40, (Math.PI / 180) * 270, (Math.PI / 180) * (270 + 360));
        c.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--main-bg-group')
        c.lineWidth = '2';
        c.stroke();

        c.beginPath();
        c.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--green')
        c.lineWidth = '2';
        c.arc(posX, posY, 40, (Math.PI / 180) * 270, (Math.PI / 180) * (270 + deegres));
        c.stroke();
        if (deegres >= result) clearInterval(acrInterval);
      }, fps);

    }




    //Create an object for blocked and whitelisted trackers/sites
    var blocked = {
      trackers: []
    }

    var whiteListed = {
      trackers: []
    }
    $scope.blocked = blocked
    $scope.whiteListed = whiteListed

    //Load user settings
    var loadSettings = function() {
      chrome.storage.local.get("settings", function(result) {
        var settings;
        if (result.settings) {
          settings = JSON.parse(result.settings)
        } else {
          settings = {

          }
        }
        //Add settings as angular variable to update all UI
        $scope.settings = settings;
      });
    }

    loadSettings()



    //Load blocked or whitelisted items
    var loadBlockedItems = function() {
      chrome.storage.local.get("blocked", function(result) {
        if (result.blocked == undefined) {

        } else {
          blocked = JSON.parse(result.blocked);
          $scope.$apply(function() {

            $scope.blocked = blocked;
          })
          trackers.list.data.filter(function(a) {
            if ($scope.settings.autoBlock.enabled == true && a.owner !== "Unknown") {
              //If auto block setting is on, and tracker has identification (name...), show blocked status by default.
              //Later on when loading whitelisted items, if this item is in that list, blocked status will be modified to false
              //This is to make storing data more efficient. Instead of storing exacly every item that was blocked in autoblock process, just remember the trackers that are whitelisted, and assume that the rest are blocked.
              //This is independent from the chrome network rules rules.
              $scope.$apply(function() {
                a.blocked = true;
              })
            } else {
              //If auto block is off, set blocked status to false by default
              $scope.$apply(function() {
                a.blocked = false;
              })
              //Check if this url is in the blocked list
              blocked.trackers.filter(function(b) {
                if (a.url == b.url) {
                  $scope.$apply(function() {
                    if (b.type == "CDN") {
                      //This URL, was found in the blocked list, but the reason (type), in this case CDN, describes that user only blocked cookies.
                      //Set status to blocked cookies only
                      a.blocked = "cookies";
                    } else {
                      //URL was found in list, so block it
                      a.blocked = true;
                    }
                  })
                }
              });
            }
          });
        }
      });

      chrome.storage.local.get("whiteListed", function(result) {
        if (result.whiteListed == undefined) {} else {
          whiteListed = JSON.parse(result.whiteListed);
          console.log(whiteListed)
          $scope.$apply(function() {

            $scope.whiteListed = whiteListed;
          })
          if ($scope.settings.autoBlock.enabled == true) {
            //This is where blocked status will be modified, as previous code blocked all by default
            //Now we check the whitelist, and only modify the trackers' blocked status if found in it.
            //So then there's no need to remember every single tracker blocked status, as you can only remember the whitelisted (which is much less than rememberng all), and assume the resta are blocked.
            trackers.list.data.filter(function(a) {
              whiteListed.trackers.filter(function(b) {
                //Check if tracker URL exists in whitelist.
                if (a.url == b.url) {
                  $scope.$apply(function() {
                    if (b.type == "CDN") {
                      //This URL, was found in the whitelisted list, but the reason (type), in this case CDN, describes that user only blocked cookies. We show this in whitelisted because it is tecnically still allowed.
                      a.blocked = "cookies";
                    } else {
                      a.blocked = false;
                    }
                  })
                }
              });
            });
            console.log(whiteListed)
            console.log($scope.whiteListed)

          }

        }

      });
    }
    loadBlockedItems()

    //Change the modal view whnev viewing website data, to switch between tracjers and cookies tab.
    $scope.changeWebsiteView = function(e, view) {
      if (e !== "") {
        $(".tab").removeClass("selected");
        $(e.target).addClass("selected");
      }

      if (view == "trackers") {
        $(".tab-section-regular").css("display", "block");
        $(".tab-section-cookies").css("display", "none");
      } else if (view == "cookies") {
        $(".tab-section-regular").css("display", "none");
        $(".tab-section-cookies").css("display", "block");
      } else if (view == "auto") {
        var selected = $(".tab.selected").attr("value");

        if (!selected) selected = "regular";
        $(".tab-section-regular").css("display", "none");
        $(".tab-section-cookies").css("display", "none");
        $(".tab-section-" + selected).css("display", "block");
      }
    }


    var showModalData = function(url, dataType, trigger) {
      var info;
      var websiteInfo;
      var cookieInfo;
      var details = {
        viewing: "",
        data: ""
      }

      if (dataType == "website") {
        var i = websites.list.data.map(function(e) {
          return e.website;
        }).indexOf(url);
        var data = websites.list.data[i].trackers
        trackers.list.data.filter(function(x) {})
        var color = "green";
        var name = url;
        // if (!scope.item.website) name = scope.item;
        details.viewing = "website";
        details.data = "trackers";
        if (websites.list.data[i].info) {
          websiteInfo = websites.list.data[i].info;



          var now = new Date().getTime();
          var then = websiteInfo.privacy.location.time;
          websiteInfo.privacy.location.timeDif = getTimeDifference(now, then)



          setInterval(function() {
            var now = new Date().getTime();

            var e = getTimeDifference(now, then)
            $scope.$apply(function() {
              websiteInfo.privacy.location.timeDif = e;
            })
          }, 10000)

        }
        if (trigger !== "modal") {
          $scope.changeWebsiteView("", "auto");
}
          var siteCookies = [];
          console.log(totalCookies)
          totalCookies.filter(function(a) {


            var u = a.domain;

            if (a.domain.startsWith(".")) {
              u = a.domain.slice(1)
            }
            if (a.domain.startsWith("www.")) {
              u = a.domain.slice(4)
            }


            if (u == url) {
              siteCookies.push(a)
            }
          })
          $scope.siteCookies = siteCookies;
        
      } else if (dataType == "cookie") {
        var color = "orange";
        var name = url.name;
        cookieInfo = JSON.parse(JSON.stringify(url));
        if (!url.expirationDate) {
          cookieInfo.expirationDate = chrome.i18n.getMessage("detailsModal__cookie__info__expires__value__session");
        } else {
          var date = new Date(url.expirationDate * 1000) //Because timestamp is in seconds
          var today = new Date()
          var options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
          cookieInfo.expirationDate = date.toLocaleDateString(chrome.i18n.getUILanguage(), options).split(' ').slice(1).join(' ');;

          if (today > date) {
            cookieInfo.isExpired = true;
          }


        }
        var data = []



        totalCookies.filter(function(a) {


          if (url.name == a.name) {
            var u = a.domain;

            if (a.domain.startsWith(".")) {
              u = a.domain.slice(1)
            }
            if (a.domain.startsWith("www.")) {
              u = a.domain.slice(4)
            }

            var i = websites.list.data.map(function(e) {
              return e.website;
            }).indexOf(u);
            console.log(websites.list.data[i])
            if (i !== -1 && data.map(function(e) {
                return e.website;
              }).indexOf(u) == -1) {
              var e = websites.list.data[i].trackers[0].websites.map(function(m) {
                return m.website;
              }).indexOf(u);
              data.push(websites.list.data[i].trackers[0].websites[e])
            }




          }


        })
    //Sort website list by trackers count (from big to small)
    data.sort(function(a, b) {
      return b.trackers.length - a.trackers.length;
    });


        // if (!scope.item.website) name = scope.item;
        details.viewing = "cookie";
        details.data = "websites";
      } else if (dataType == "tracker") {
        $scope.changeWebsiteView("", "trackers");

        var i = trackers.list.data.map(function(e) {
          return e.url;
        }).indexOf(url);
        var data = trackers.list.data[i].websites
        var color = "blue";
        var name = url;
        details.viewing = "tracker";
        details.data = "websites";
        var blocked = trackers.list.data[i].blocked;
        trackersData.filter(function(a) {
          if (a.url == url) {
            info = a
          }
        })
        var cookies = false;
        var currentTrackerCookies = trackers.list.data[i].cookies
        trackerCookies.filter(function(a) {
          if (currentTrackerCookies) {
            currentTrackerCookies.filter(function(b) {
              if (b == a.name || a.name.startsWith(b) || (a.name.match(b) && b.length > 1)) {
                cookies = currentTrackerCookies;
              }
            })
          }
        })
        var isImportant = false;
        if (trackers.list.data[i].categories && trackers.list.data[i].categories.indexOf("CDN") > -1) isImportant = true;
      } else if (dataType == "blocked") {
        $scope.changeWebsiteView("", "trackers");

        var data = $scope.blocked.trackers
        var color = "red";
        var name = chrome.i18n.getMessage("blocked__title");
        details.viewing = "blocked";
        details.data = "blocked";
      } else if (dataType == "whiteListed") {
        $scope.changeWebsiteView("", "trackers");

        var data = $scope.whiteListed.trackers
        var color = "green";
        var name = chrome.i18n.getMessage("whiteListed__title");
        details.viewing = "whiteListed";
        details.data = "whiteListed";
      }
      var urlTitle = "<span class='color-text " + color + "'>" + name + "</span>";
      console.log(urlTitle)
      $timeout(function() {

        if (trigger !== "modal") {
          $scope.$apply(function() {
            $scope.detailsModal = {
              title: urlTitle,
              data: data,
              details: details,
              color: color,
              itemUrl: name,
              trigger: null,
              cookieInfo: cookieInfo,
              trackerInfo: {
                info: info,
                cookies: cookies,
                isImportant: isImportant
              },
              websiteInfo: websiteInfo
            }

          })

          if (blocked) {
            $scope.detailsModal.trackerInfo.blocked = blocked;
          }


        } else if (trigger == "modal") {
          $scope.detailsModal2 = {
            title: urlTitle,
            data: data,
            details: details,
            color: color,
            itemUrl: name,
            trigger: "modal",
            cookieInfo: cookieInfo,
            trackerInfo: {
              info: info,
              cookies: cookies,
              isImportant: isImportant
            },
            websiteInfo: websiteInfo
          }
          if (blocked) {
            $scope.detailsModal2.trackerInfo.blocked = blocked;
          }
        }
      }, 0)
    }

    $scope.clearCookie = function(data, url) {
      var trackerCookies = data;
      if (trackerCookies && trackerCookies !== false) {

        totalCookies.filter(function(a) {
          trackerCookies.filter(function(b) {
            if (b == a.name || a.name.startsWith(b) || (a.name.match(b) && b.length > 1)) {
              var url = "http" + (a.secure ? "s" : "") + "://" + a.domain + a.path;
              chrome.cookies.remove({
                "url": url,
                "name": a.name
              });
            }
          })




        })
        $scope.loadAllCookies()
        var clearCookieSuccess = new statusAlert({
          id: "clearedCookie",
          size: "sm",
          icon: "fas fa-cookie-bite color-text orange",
          text: chrome.i18n.getMessage("status__clear_cookies__success", [url])
        });

        clearCookieSuccess.display()
      } else {

        clearCookieFailed.display()
      }
    }



    $scope.unblockTracker = function(url, info) {

      if (info && info.reason == "updateData") {
        if (info.status == "success") {
          var type;
          if (!info.type) type == "manual";
          if ($scope.settings.autoBlock.enabled == false) {

            if (blocked.trackers.map(function(e) {
                return e.url
              }).indexOf(url) > -1) {
              var pos = blocked.trackers.map(function(e) {
                return e.url;
              }).indexOf(url);
              $scope.$apply(function() {
                $scope.blocked.trackers.splice(pos, 1);
                //Update data list in modal bc it does not update itself
                showModalData(url, "blocked", "")
              })
              chrome.storage.local.set({
                "blocked": JSON.stringify(blocked)
              }, function() {});
            }

          }
          if ($scope.settings.autoBlock.enabled == true && info.type !== "auto") {
            if (whiteListed.trackers.map(function(e) {
                return e.url
              }).indexOf(url) == -1 || whiteListed.trackers.length == 0) {
              var x = {
                url: url,
                type: info.type
              }
              $scope.$apply(function() {
                whiteListed.trackers.push(x);
              })
            }

            chrome.storage.local.set({
              "whiteListed": JSON.stringify(whiteListed)
            }, function() {});
          }
          var i = trackers.list.data.map(function(e) {
            return e.url;
          }).indexOf(url);
          if (i !== -1) {
            $scope.$apply(function() {
              $scope.trackers.list.data[i].blocked = false;
            })
          }
          if (!info.from || info.from !== "autoBlock") {
            unblockedSuccess.display()
            $('#detailsModal').modal('hide')


          }
        } else {
          if (!info.from || info.from !== "autoBlock") {

            //Failed
            unblockedError.display()
          }
        }


      } else {
        var matched = false;
        trackersData.filter(function(b) {
          //Find a tracker in the JSON file that matches the requested URL to be blocked 
          if (b.url == url) {
            if (matched == false) {
              matched = true;
            //Update the network request rules
            try {
              updateRules(b, "allow")
            } catch (error) {
              unblockedError.display()
            }
            } 
          }
        });

      }



    }

    $scope.attemptBlockTracker = function(url, isCdn, cookies, event) {
      var i = trackersData.map(function(e) {
        return e.url;
      }).indexOf(url);
      var isCdn;
      if (i > -1 && trackersData[i].categories) {
        isCdn = trackersData[i].categories.indexOf("CDN");
      } else {
        isCdn = -1;
      }
      if (isCdn == true || isCdn > -1) {
        if (event) {
          $(event.target).blur();
        }
        var clearCookieSuccess = new popupAlert({
          id: "clearedCookie",
          size: "md",
          icon: "<i style='text-align: center; font-size: 30px; margin-bottom: 10px; display: block;' class='fas fa-cookie-bite color-text orange'></i>",
          title: chrome.i18n.getMessage("popup__block_critical_domain__title"),
          text: chrome.i18n.getMessage("popup__block_critical_domain__text", [url]),
          buttons: [{
              text: chrome.i18n.getMessage("action_cancel"),
              function: function x() {},
              class: "primary-action blue default-action"
            },
            {
              text: chrome.i18n.getMessage("popup__block_critical_domain__action__block_anyway"),
              function: function x() {
                $scope.blockTracker(url)
              },
              class: "secondary-action red"
            },
            {
              text: chrome.i18n.getMessage("popup__block_critical_domain__action__clear_cookies"),
              function: function x() {
                $scope.blockTracker(url, "", 'cookies')
              },
              class: "secondary-action orange"
            }
          ]
        });
        clearCookieSuccess.display()

      } else {
        $scope.blockTracker(url)
      }

    }
    $scope.blockTracker = function(url, info, action) {
      //User has attempted to block a tracker
      //This will only trigger once the rules have been updated
      if (info && info.reason == "updateData") {
        if (info.status == "success") {
          var type;
          if (!info.type) type = "manual";
          if (action == "cookies") type = "CDN";

          //The item was blocked successfully, so update it the blocked list, and display message
          //If autoblock is disabled, create 
          if ($scope.settings.autoBlock.enabled == false && info.type !== "auto") {
            if (blocked.trackers.map(function(e) {
                return e.url
              }).indexOf(url) == -1 || blocked.trackers.length == 0) {
              $scope.$apply(function() {
                var x = {
                  url: url,
                  type: type
                }
                blocked.trackers.push(x);
              })
            }

            chrome.storage.local.set({
              "blocked": JSON.stringify(blocked)
            }, function() {});
          } else if ($scope.settings.autoBlock.enabled == true) {
            //If autoblock is on, and a tracker gets, blocked, it removes it from the whitelist
            //But if it's only blocking cookies (in the case of CDNs), then add it to the whitelist anyway, to remember it is only cookies
            if (action !== "cookies") {
              //IF it's blocking a tracker (not just cookies), remove it from whitelist.
              if (whiteListed.trackers.map(function(e) {
                  return e.url
                }).indexOf(url) > -1) {

                var pos = whiteListed.trackers.map(function(e) {
                  return e.url
                }).indexOf(url)
                $scope.$apply(function() {

                  whiteListed.trackers.splice(pos, 1);
                  //Update data list in modal bc it does not update itself

                  showModalData(url, "whiteListed", "")


                })

                chrome.storage.local.set({
                  "whiteListed": JSON.stringify(whiteListed)
                }, function() {});

              }
            } else {
              //If only removing cookies, and autoblock is enabled, add it to the whitelist to remember status.
              var i = whiteListed.trackers.map(function(e) {
                return e.url
              }).indexOf(url)
              //If item already exists in whitelist, replace it with new one, indication it's a CDN. (to remember status)
              if (i > -1) {
                whiteListed.trackers.splice(i, 1);
              }
              $scope.$apply(function() {
                var x = {
                  url: url,
                  type: type
                }
                whiteListed.trackers.push(x);
              })

              chrome.storage.local.set({
                "whiteListed": JSON.stringify(whiteListed)
              }, function() {});


            }

          }
          var i = trackers.list.data.map(function(e) {
            return e.url;
          }).indexOf(url);

          if (i !== -1) {
            $scope.$apply(function() {
              if (action == "cookies") {

                $scope.trackers.list.data[i].blocked = "cookies";
              } else {
                $scope.trackers.list.data[i].blocked = true;

              }
            })
          }
          if (!info.from || info.from !== "autoBlock") {
            if (action == "cookies") {
              blockedCookiesSuccess.display()

            } else {
              blockedSuccess.display()

            }
            $('#detailsModal').modal('hide')
          }
        } else {
          if (!info.from || info.from !== "autoBlock") {

            blockedError.display()
            $('#detailsModal').modal('hide')
          }
        }
      } else {
        var matches = false;
        //Check if the tracker exists in the extension rules
        trackersData.filter(function(b) {
          //Find a tracker in the JSON file that matches the requested URL to be blocked 
          if (b.url == url) {
            if (matches == false) {
            matches = true;
            //Update the network request rules
            try {
              if (!action) action = "block"
              updateRules(b, action)
            } catch (error) {
              blockedError.display()
            }
          }
          }
        });
        if (matches == false) {
          blockedUnknown.display()
        }
      }
    }
    $scope.showModalDetails = function(e, dataType, trigger, url) {
      var activeDiv;
      if (trigger !== "modal") {

        $('.secondary-details').css("transform", "translate(-50%, 100%)")
        $('.modal-content').css("transform", "scale(1)")
        setTimeout(function() {

          $('.secondary-details').css("display", "none")
        }, 150)
        activediv = $('.modal-resizable-content');
      }
      if (trigger !== "page") {
        var oldHeight = $('.modal-resizable-content').height();
        $('.modal-resizable-content').css("max-height", oldHeight);
        $('.modal-resizable-content').css("min-height", oldHeight);
      }
      if (!$(e.target).is('.button')) {
        showModalData(url, dataType, trigger)
      }
      setTimeout(function() {
        $('.modal-resizable-content').css("min-height", "unset");
        $('.modal-resizable-content').css("max-height", "unset");

        if (trigger == "modal") {
          $('.secondary-details').css("display", "block")
          setTimeout(function() {

            $('.secondary-details').css("transform", "translate(-50%, 0%)")
            $('.modal-content').css("transform", "scale(0.9)")
          }, 10)


          activediv = $('.secondary-details');
          var newHeight = activediv.height() + 50;
        } else {
          var newHeight = activediv.height();
        }
        if (trigger !== "page") $('.modal-resizable-content').height(oldHeight);

        setTimeout(function() {
          if (trigger !== "page") $('.modal-resizable-content').css("height", newHeight);

          setTimeout(function() {
            if (trigger == "modal") {
              $('.modal-resizable-content').css("max-height", newHeight);
              $('.modal-resizable-content').css("min-height", newHeight);
            }
            $('.modal-resizable-content').height('auto');
          }, 300)
        }, 50)
      }, 1)
      $('#detailsModal').modal('show')

    }


    $scope.updateSettings = function(e, setting, value) {
      chrome.storage.local.get("settings", function(result) {
        var settings;
        if (result.settings) {
          settings = JSON.parse(result.settings)
        } else {
          settings = {}
        }
        if (setting == "location-privacy") {
          if (!settings.privacy) {
            settings.privacy = {};
          }
          settings.privacy.location = $scope.settings.privacy.location;

          chrome.storage.local.set({
            "settings": JSON.stringify(settings)
          }, function() {});
        }
        if (setting == "userAgent-privacy") {
          if (!settings.privacy) {
            settings.privacy = {};
          }
          settings.privacy.userAgent = $scope.settings.privacy.userAgent;



          var operation;
          var data;

          if (settings.privacy.userAgent == true) {
            operation = "set"
            data = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
          } else {
            operation = "allow"
            data = ""
          }
          if (operation == "set") {
            chrome.declarativeNetRequest.updateDynamicRules({
              addRules: [{
                "id": 2,
                "priority": 2,
                "action": {
                  "type": "modifyHeaders",
                  "requestHeaders": [{
                    "header": "User-Agent",
                    "operation": operation,
                    "value": data
                  }, ]
                },
                "condition": {
                  "urlFilter": "*",
                  "resourceTypes": ["main_frame", "script", "sub_frame", "stylesheet", "image", "font", "object", "xmlhttprequest", "ping", "media", "other"]
                }


              }],
              removeRuleIds: [2]
            })

            chrome.runtime.sendMessage({
              setting: "updateUserAgent"
            }, function(response) {});

          } else {
            chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: [2]
            })
          }

          chrome.storage.local.set({
            "settings": JSON.stringify(settings)
          }, function() {});
        }
        if (setting == "block-cookies") {
          if (!settings.privacy) {
            settings.privacy = {};
          }
          settings.blockCookies = $scope.settings.blockCookies;
          var operation;
          if (settings.blockCookies == true) {
            operation = "remove"
            chrome.declarativeNetRequest.updateDynamicRules({
                addRules: [{
                  "id": 1,
                  "priority": 2,
                  "action": {
                    "type": "modifyHeaders",
                    "requestHeaders": [{
                      "header": "Cookie",
                      "operation": operation
                    }],
                    "responseHeaders": [{
                      "header": "Set-Cookie",
                      "operation": operation
                    }]
                  },
                  "condition": {
                    "urlFilter": "*",
                    "resourceTypes": ["main_frame", "script", "sub_frame", "stylesheet", "image", "font", "object", "xmlhttprequest", "ping", "media", "other"]
                  }


                }],
                removeRuleIds: [1]
              },
              function() {

                //After updating the rules, trigger the original function again, to save data
                if (chrome.runtime.lastError) {
                  var status = "error";
                } else {
                  var status = "success"
                }

              })
          } else {
            operation = "allow"
            chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: [1]
            })
          }




          chrome.storage.local.set({
            "settings": JSON.stringify(settings)
          }, function() {});
        }
        if (setting == "auto-block-trackers-type") {
          settings.autoBlock.type = $scope.settings.autoBlock.type;
          chrome.storage.local.set({
            "settings": JSON.stringify(settings)
          }, function() {});
          if ($scope.settings.autoBlock.type == "all") {



            whiteListed.trackers.filter(function(c) {
              var i = trackersData.map(function(e) {
                return e.url;
              }).indexOf(c.url);
              if (i > -1 && c.type == "CDN") {
                try {

                  updateRules(trackersData[i], "block", "autoBlock", "auto")
                } catch (error) {
                  errors = true;

                }
              }
            });



          } else if ($scope.settings.autoBlock.type == "exception") {

            trackersData.filter(function(a) {
              if (a.categories && a.categories.indexOf("CDN") > -1) {

                try {

                  updateRules(a, "cookies", "autoBlock", "CDN")

                } catch (error) {
                  errors = true;

                }
              }

            });


            chrome.storage.local.set({
              "whiteListed": JSON.stringify(whiteListed)
            }, function() {});

          }




        }
        if (setting == "auto-block-trackers") {
          settings.autoBlock.enabled = $scope.settings.autoBlock.enabled;

          var errors = false;
          var action;
          if (settings.autoBlock.enabled == true) {
            action = "block";
          } else {
            action = "allow"
          }


          trackersData.filter(function(b) {

            var matched = false;
            //Check if "Allow CDNs" is enabled, and tracker is CDN. 
            if ($scope.settings.autoBlock.type == "exception" && settings.autoBlock.enabled == true) {
              if (b.categories && b.categories.indexOf("CDN") > -1) {
                //If tracker is cdn, and allow cdn is enabled, block cookies
                try {
                  matched = true;
                  updateRules(b, "cookies", "autoBlock", "CDN")
                } catch (error) {
                  errors = true;
                }
              }
            }

            //If tracker is in whitelist or blocked list, update the rules based on action.
            //If autoblock is being turned on, and item is whitelisted, allow it.
            //If it's being turned off, and tracker is in blocked list, then block it.
            if (settings.autoBlock.enabled == true) {
              $scope.whiteListed.trackers.filter(function(c) {
                if (c.url == b.url) {
                  matched = true;
                  try {
                    updateRules(b, "allow", "autoBlock", false)
                  } catch (error) {
                    errors = true;
                  }
                }
              });
            } else {
              $scope.blocked.trackers.filter(function(c) {
                if (c.url == b.url) {
                  matched = true;
                  try {
                    updateRules(b, "block", "autoBlock", false)
                  } catch (error) {
                    errors = true;
                  }
                }
              });
            }

            //If item is not in blocked list or whitelist, and it's not a CDN, then allow or block it (based on autoblock status)
            if (matched == false) {

              try {
                updateRules(b, action, "autoBlock", "auto")
              } catch (error) {
                errors = true;
                if (action == "block") {

                  $scope.unblockTracker(b.url, {
                    status: "success",
                    reason: "updateData",
                    from: "autoBlock",
                    type: "failed"
                  })
                } else {

                }
              }
            }
          });


          if (errors == true) {
            if (action == "block") {
              blockedAllError.display()
            }
          } else {
            if (action == "block") {
              blockedAllSuccess.display()
            }
          }
          //loadBlockedItems()
        }


        if (setting == "auto-delete-data") {

          settings.autoDelete = $scope.settings.autoDelete;
          chrome.runtime.sendMessage({
            setting: "autoDelete"
          }, function(response) {});
        }


        chrome.storage.local.set({
          "settings": JSON.stringify(settings)
        }, function() {});
      });
    }

    var updateRules = function(item, action, from, type) {
      if (item.id) {

        var priotity;
        if (action == "block" || action == "cookies") {
          priotity = 3
        } else {
          priotity = 1
        }
        var opperation;
        if (action == "cookies") {
          opperation = {
            "type": "modifyHeaders",
            "requestHeaders": [{
              "header": "Cookie",
              "operation": "remove"
            }],
            "responseHeaders": [{
              "header": "Set-Cookie",
              "operation": "remove"
            }]
          }
        } else {

          opperation = {
            "type": action
          };
        }
        console.log(priotity)
        var status = chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [{
              "id": item.id + 2,
              "priority": priotity,
              "action": opperation,
              "condition": item.condition

            }],
            removeRuleIds: [item.id + 2]
          },
          function() {

            //After updating the rules, trigger the original function again, to save data
            if (chrome.runtime.lastError) {
              var status = "error";
            } else {
              var status = "success"
            }
            if (!from) from = "manual"

            console.log("2")
            if (type !== false) {
              if (action == "cookies" && from !== "autoBlock" || action == "allow") {
                $scope.unblockTracker(item.url, {
                  status: status,
                  reason: "updateData",
                  from: from,
                  type: type
                })
              } else if (action == "cookies" && from == "autoBlock" || action == "block") {
                $scope.blockTracker(item.url, {
                  status: status,
                  reason: "updateData",
                  from: from,
                  type: type
                }, action)
              }
            }
          })
      } else {
        throw 'nonValidRule';
      }
    }

    //PAGE TEXT
    $scope.searchList = function(text, list) {
      return function(item) {
        //return custom stuff here
        if (!text) text = ""
        if (list == "trackers") {
          if (item.name.toLowerCase().match(text.toLowerCase()) || item.url.match(text.toLowerCase()) || item.owner.toLowerCase().match(text.toLowerCase())) {
            return item;
          }
        }
        if (list == "websites") {
          if (item.website.toLowerCase().match(text.toLowerCase())) {
            return item;
          }
        }
        if (list == "cookies") {
          return item
        }
      }
    }
    var statusAlert = function(options) {
      this.id = options.id
      this.display = function() {
        var alert = $(`
      <div class="status-alert" id="` + options.id + `">
        <i style="display: inline-block; margin-right: 10px;" class="` + options.icon + `"></i>
        <span style="display: inline-block;">` + options.text + `</<pan>
      </div>`);
        $("body").append(alert)
        $("#" + this.id).css("display", "block")
        setTimeout(() => {
          $("#" + this.id).css("transform", "translate(-50%, -10px)")
        }, 50);
        setTimeout(() => {
          $("#" + this.id).css("transform", "translate(-50%, 100%)")
          setTimeout(() => {
            $("#" + this.id).css("display", "none")
            $("#" + this.id).remove()
          }, 300);
        }, 2000);
      }
    };




    var unblockedSuccess = new statusAlert({
      id: "unblockedSuccess",
      size: "sm",
      icon: "fas fa-check color-text green",
      text: chrome.i18n.getMessage("status__unblock__success")
    });
    var blockedSuccess = new statusAlert({
      id: "blockedSuccess",
      size: "sm",
      icon: "fas fa-ban color-text red",
      text: chrome.i18n.getMessage("status__block__success")
    });
    var blockedCookiesSuccess = new statusAlert({
      id: "blockedCookiesSuccess",
      size: "sm",
      icon: "fas fa-cookie-bite color-text red",
      text: chrome.i18n.getMessage("status__block_cookies__success")
    });

    var unblockedError = new statusAlert({
      id: "unblockedError",
      size: "sm",
      icon: "fas fa-times color-text red",
      text: chrome.i18n.getMessage("status__unblock__error")
    });
    var blockedError = new statusAlert({
      id: "blockedError",
      size: "sm",
      icon: "fas fa-times color-text red",
      text: chrome.i18n.getMessage("status__block__error")
    });
    var blockedUnknown = new statusAlert({
      id: "blockedUnknown",
      size: "sm",
      icon: "fas fa-times color-text red",
      text: chrome.i18n.getMessage("status__block__unknown")
    });
    var blockedAllError = new statusAlert({
      id: "blockedAllError",
      size: "sm",
      icon: "fas fa-times color-text red",
      text: chrome.i18n.getMessage("status__block__error_all")
    });
    var blockedAllSuccess = new statusAlert({
      id: "blockedAllSuccess",
      size: "sm",
      icon: "fas fa-check color-text green",
      text: chrome.i18n.getMessage("status__block__success_all")
    });
    var clearCookieFailed = new statusAlert({
      id: "clearedCookieFailed",
      size: "sm",
      icon: "fas fa-cookie-bite color-text orange",
      text: chrome.i18n.getMessage("status__clear_cookies__error")
    });

    var noQueryFound = new statusAlert({
      id: "noQueryFound",
      size: "sm",
      icon: "fas fa-ban color-text red",
      text: chrome.i18n.getMessage("status__search_query__error")
    });
















    setTimeout(function() {
      $(".main-container").css("opacity", "1")

      $scope.pageLoaded = true

      setTimeout(function() {


        let params = (new URL(document.location)).searchParams;
        let tracker = params.get('tracker'); // is the string "Jonathan Smith".
        let search = params.get('search'); // is the string "Jonathan Smith".
        var scope = angular.element($("body")).scope();

        if (tracker) {
          var match = false;
          scope.trackers.list.data.filter(function(x) {
            if (match == false) {
              if (tracker.toLowerCase().match(x.url.toLowerCase())) {
                match = true;
                scope.showModalDetails("", "tracker", "page", x.url)
              }
            }
          })
          if (match == false) {
            noQueryFound.display()
          }
        }
        if (search) {
          search = decodeURIComponent(search);
          var match = false;
          scope.websites.list.data.filter(function(x) {
            if (x.website == search && match == false) {
              match = true;
              scope.showModalDetails("", "website", "page", x.website)
            }
          })
          if (match == false) {
            scope.trackers.list.data.filter(function(x) {
              if (match == false) {

                if (x.url.toLowerCase().match(search.toLowerCase()) || x.name.toLowerCase().match(search.toLowerCase()) || x.owner.toLowerCase().match(search.toLowerCase())) {
                  match = true;
                  scope.showModalDetails("", "tracker", "page", x.url)
                }
              }
            })
          }
          if (match == false) {
            noQueryFound.display()
          }
        }


      }, 200)

    }, 100)

    var manifestData = chrome.runtime.getManifest();
    $scope.extension_version = manifestData.version;

    $scope.social = [{
        name: "Twitter",
        value: "@kai_knox_",
        icon: "fab fa-twitter",
        color: "color: #2ea1f2;",
        url: "https://twitter.com/kai_knox_"
      },
      {
        name: "Instagram",
        value: "@_kaiknox_",
        icon: "fab fa-instagram",
        color: "background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);-webkit-background-clip: text;background-clip: text;-webkit-text-fill-color: transparent;",
        url: "https://instagram.com/_kaiknox_"
      },
      {
        name: "Discord",
        value: "Join my discord server!",
        icon: "fab fa-discord",
        color: "color: #5663f7;",
        url: ""
      },
      {
        name: "Website",
        value: "kaiknox.com",
        icon: "fas fa-compass color-text orange",
        color: "",
        url: "https://kaiknox.com/"
      }
    ];
  });
});

app.controller('popupController', function app($scope) {

  $scope.goToTracker = function(url) {
    const newURL = chrome.runtime.getURL("options/options.html") + "?tracker=" + encodeURIComponent(url);
    chrome.tabs.create({
      url: newURL
    });
  }

  function getTrackers() {
    return [pageTrackers, pageInfo];
  }
  $scope.trackerCount = 15;

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
      function: getTrackers
    }, function(result) {
      console.log(result)
      var scope = angular.element($("body")).scope();
      var data = result[0].result[0]
      var info = result[0].result[1]
      scope.$apply(function() {
        scope.trackers = data
        scope.info = info
                var now = new Date().getTime();
          var then = info.privacy.location.time;
          scope.info.privacy.location.timeDif = getTimeDifference(now, then) 

        
      })

      chrome.storage.local.get("settings", function(result) {
        var settings;
        if (result.settings) {
          settings = JSON.parse(result.settings)
        } else {
          settings = {

          }
        }
        //Add settings as angular variable to update all UI
        $scope.settings = settings;


        if ($scope.settings.autoBlock.enabled == true) {

          chrome.storage.local.get("whiteListed", function(result) {
            scope.$apply(function() {
              scope.blocked = JSON.parse(JSON.stringify(data));
            })
            if (result.whiteListed) {
              var whiteListed = JSON.parse(result.whiteListed)
              if (whiteListed.trackers.length > 0) {
                data.filter(function(y) {
                  whiteListed.trackers.filter(function(x) {
                    if (x == y.url) {
                      var i = data.indexOf(y);
                      scope.$apply(function() {
                        scope.blocked.splice(i, 1);
                      })
                    }
                  });
                });
              }
            }
          });

        } else {
          chrome.storage.local.get("blocked", function(result) {
            scope.$apply(function() {
              scope.blocked = []
            })
            if (result.blocked) {
              var blocked = JSON.parse(result.blocked)
              if (blocked.trackers.length > 0) {
                data.filter(function(y) {
                  blocked.trackers.filter(function(x) {
                    if (x == y.url) {
                      var i = data.indexOf(y);
                      scope.blocked.push(y)
                    }
                  });
                });
              }
            }
          });
        }
      });



    });
  });


});




app.filter('trustedHtml', function($sce) {
  return function(val) {
    return $sce.trustAsHtml(val);
  };
});
app.filter('searchFilter', function(param1) {
  return function(item) {
    //return custom stuff here
    console.log(param1)
    console.log(item)
    if (param1.name.match(item.name) || param1.url.match(item.url)) {
      return item;
    }
  };
});
app.filter('i18n', function($sce) {
  return function(stringId, values) {
    var text = chrome.i18n.getMessage(stringId, values)
    return $sce.trustAsHtml(text);
  }
});
app.filter('encode', function() {
  return function(input) {
    if (input) {
      return window.encodeURIComponent(input);
    }
    return "";
  }
});
app.directive('dList', function() {

  return {
    link: function(scope, element, attribute) {

      scope.$watch(attribute.data, function() {
        scope.data = scope.$eval(attribute.data)
      });
      scope.$watch(attribute.type, function() {
        scope.type = scope.$eval(attribute.type)
      });
      scope.$watch(attribute.trigger, function() {
        scope.trigger = scope.$eval(attribute.trigger)
      });


    },
    templateUrl: 'templates/dataLists.html',
    scope: true
  };
});


app.directive('dHeader', function() {

  return {
    link: function(scope, element, attribute) {

      scope.$watch(attribute.data, function() {
        scope.data = scope.$eval(attribute.data)
      });
    },
    templateUrl: 'templates/dataHeader.html',
    scope: true
  };
});

app.directive('setupSteps', function() {

  return {
    link: function(scope, element, attribute) {

      chrome.storage.local.get("setup", function(result) {
        var setup;
        if (result.setup) {
          setup = JSON.parse(result.setup);
        } else {
          setup = {};
        }

        var steps = [{
            setupValue: "firstTime",
            stepId: "setupStart"
          },
          {
            setupValue: "autoBlock",
            stepId: "autoBlock"
          },
          {
            setupValue: "autoDelete",
            stepId: "autoDelete"
          },
          {
            setupValue: "hideLocation",
            stepId: "hideLocation"
          },
          {
            setupValue: "hideUserAgent",
            stepId: "hideUserAgent"
          },
          {
            setupValue: "firstTime",
            stepId: "trackerSearch"
          },
          {
            setupValue: "firstTime",
            stepId: "setupEnd"
          }
        ]
        var showSetup = false;
        var n = 0;


        steps.filter(function(x) {
          if (setup[x.setupValue] !== true) {
            //increase the value to target next step
            n++
            showSetup = true;
            setup[x.setupValue] = "inProgress"; //Do not set to true yet, as there could be multiple steps with same ID
            $(".setup-step[data-setup-subject='" + x.stepId + "']").attr("data-step", n)
            $(".setup-step[data-setup-subject='" + x.stepId + "']").css("z-index", n)
          }
        })
        steps.filter(function(x) {
          if (setup[x.setupValue] == "inProgress") {
            setup[x.setupValue] = true;
          }
        })
        $(".setup-step").css("display", "none");
        $(".setup-step[data-step='1']").css("display", "flex");

        $(".setup-step[data-step='1']").addClass("active")
        setTimeout(function() {
          var $scope = angular.element($("body")).scope();
          $scope.$apply(function() {
            $scope.showSetup = showSetup;
          })
        }, 10)
        if (showSetup == true) {
          $(".setup-overlay").css("display", "block")

          var totalSteps = $(".setup-step[data-step]").length;

          var buttonNext = chrome.i18n.getMessage("action_next") + "<i style='margin-left: 7px;' class='fas fa-chevron-right'></i>"
          var buttonFinish = chrome.i18n.getMessage("action_finish") + "<i style='margin-left: 7px;' class='fas fa-check-circle'></i>";

          if (1 == totalSteps) {
            $("#setup-next").html(buttonFinish)
          }

          $("#setup-next").click(function() {
            var i = $(".setup-step.active").data("step");
            if (i + 1 == totalSteps) $("#setup-next").html(buttonFinish)
            if (i == totalSteps) {



              chrome.storage.local.set({
                "setup": JSON.stringify(setup)
              }, function() {});

              angular.element(".setup-overlay").css("display", "none")

            } else {
              setTimeout(function() {
                $(".setup-step[data-step='" + i + "']").css("transform", "translate(-100%, 0)")
                $(".setup-step").removeClass("active");
                $(".setup-step[data-step='" + (i + 1) + "']").addClass("active");
                setTimeout(function() {
                  $(".setup-step[data-step='" + i + "']").css("display", "none");
                }, 300)

              }, 100)


              setTimeout(function() {
                $(".setup-step[data-step='" + (i + 1) + "']").css("transform", "translate(0, 0)")
              }, 1)
              $(".setup-step[data-step='" + i + "']").css("opacity", "0.2")

              $(".setup-step[data-step='" + (i + 1) + "']").css("display", "flex");
            }
            if (i == 1) {
              $("#setup-back").removeAttr("disabled")
            }
          })
          $("#setup-back").click(function() {
            var i = $(".setup-step.active").data("step");

            if (i - 1 == 1) {
              $("#setup-back").attr("disabled", "true")
            }
            if (i !== 1) {
              setTimeout(function() {
                $(".setup-step[data-step='" + i + "']").css("transform", "translate(100%, 0)")
                $(".setup-step").removeClass("active");
                $(".setup-step[data-step='" + (i - 1) + "']").addClass("active");
                $(".setup-step[data-step='" + (i - 1) + "']").css("opacity", "1")
                setTimeout(function() {
                  $(".setup-step[data-step='" + i + "']").css("display", "none");
                }, 300)
              }, 100)
              setTimeout(function() {
                $(".setup-step[data-step='" + (i - 1) + "']").css("transform", "translate(0, 0)")
              }, 10)
              $(".setup-step[data-step='" + (i - 1) + "']").css("display", "flex");
            }
            if (i == totalSteps) {
              $("#setup-next").html(buttonNext)
            }
          })

        } else {

        }
      });
    },
    templateUrl: 'templates/setupSteps.html',
    scope: true
  };
});


app.directive('dGraph', function() {
  return {
    link: function(scope, element, attribute) {
      setTimeout(function() {
      }, 100)
      $(document).ready(function() {
        $('[data-toggle="tooltip"]').tooltip();
      });
    },
    scope: {
      maxVal: '=maxVal',
      data: '=data',
      color: '@color'
    },
    templateUrl: 'templates/dataGraphs.html'
  };
});