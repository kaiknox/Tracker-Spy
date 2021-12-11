var s = document.createElement('script');
s.src = chrome.runtime.getURL("privacy.js");
document.documentElement.appendChild(s);
//s.remove();



    //For every page
var websiteData = {
  totalVisited: [], //all the websites you have visited (including the ones that don't track)
  totalTracking: [] //all the websites that have 1 or more trackers
}
var pageInfo = {
	privacy: {
		location: {
			used: "",
			time: "",
			realCoords: "" 
		}
	}
};

var trackers;
var status = "noData"
//Send message to background, and get tracker info
        chrome.runtime.sendMessage({
          request: "trackerData"
        }, function(response) {
        	//trackers = response.data;
        	status = "hasData"
        });

chrome.storage.local.get("websites", function(result) {
	if(result.websites == undefined) {
		chrome.storage.local.set({ "websites" : JSON.stringify(websiteData)
		}, function() {
    	});     
	}



			var result = JSON.parse(result.websites);
		var totalVisited = result.totalVisited;
		var matches = false;
		totalVisited.filter(function(x) {
  			if (x == window.location.hostname) {
  				matches = true;
  			} 
		})
		if (matches == false) {

					totalVisited.push(window.location.hostname)
		chrome.storage.local.set({ "websites" : JSON.stringify(result)
		}, function() {
    	});     
		}



});				



var pageTrackers = [];


$( document ).ready(function() {

function onLoad(loading, loaded) {
    if(document.readyState === 'complete'){
        return loaded();
    }
    loading();
    if (window.addEventListener) {
        window.addEventListener('load', loaded, false);
    }
    else if (window.attachEvent) {
        window.attachEvent('onload', loaded);
    }
};

onLoad(function(){
   console.log('I am waiting for the page to be loaded');
},
function(){
    console.log('The page is loaded');

    init();
function init() {
	setTimeout(function(){
if (status == "hasData") {

			findTrackers();

                  document.querySelector('body').addEventListener('happyCat', function(e) {
    chrome.storage.local.get("settings", function(result) {


        var result = JSON.parse(result.settings);
        if (result.privacy.location == false) {
            navigator.geolocation.getCurrentPosition(showPosition);

            function showPosition(s) {
                var x = {
                    coords: {
                        accuracy: s.coords.accuracy,
                        altitude: s.coords.altitude,
                        altitudeAccuracy: s.coords.altitudeAccuracy,
                        heading: s.coords.heading,
                        latitude: s.coords.latitude,
                        longitude: s.coords.longitude,
                        speed: s.coords.speed,
                    },
                    timestamp: s.timestamp
                };
                document.querySelector("body").dispatchEvent(new CustomEvent('happyCat2', {
                    bubbles: true,
                    detail: {
                        coords: x
                    }
                }))
                pageInfo.privacy.location.used = true;
                pageInfo.privacy.location.time = new Date().getTime();
                pageInfo.privacy.location.realCoords = true;
                saveTrackers("update")
            }
        } else {
            var locations = [
				{latitude: 35.6895, longitude: 139.6917}, //Tokyo
				{latitude: 35.69367428036517, longitude: 139.7774434089661}, //Tokyo #2
				{latitude: 35.72644736208901, longitude: 139.73716735839847}, //Tokyo #3

				{latitude: 36.7014631, longitude: -118.755997}, //California
				{latitude: 38.56984412871528, longitude: -121.47831916809083}, //California #2
				{latitude: 38.55179018194658, longitude: -121.44407272338869}, //California #3

				{latitude: 41.385063, longitude: 2.173404}, //Barcelona
				{latitude: 41.385494680020976, longitude: 2.158298492431641}, //Barcelona #2
				{latitude: 41.404468877295024, longitude: 2.158872485160828}, //Barcelona #3

				{latitude: 40.4167047, longitude: -3.7035825}, //Madrid
				{latitude: 40.4295457908014, longitude: -3.698953986167908}, //Madrid #2
				{latitude: 40.44891472814538, longitude: -3.6998391151428227} //Madrid #3
            ]
            var location = locations[Math.floor(Math.random() * locations.length)];
            var s = {
                coords: {
                    latitude: location.latitude,
                    longitude: location.longitude
                }
            };
            document.querySelector("body").dispatchEvent(new CustomEvent('happyCat2', {
                bubbles: true,
                detail: {
                    coords: s
                }
            }))
            pageInfo.privacy.location.used = true;
            pageInfo.privacy.location.time = new Date().getTime();
            pageInfo.privacy.location.realCoords = false;
            saveTrackers("update")
        }

    });


});






		chrome.storage.local.get("websites", function(result) {
		var websites = JSON.parse(result.websites);
	});

		setInterval(function() {
						findTrackers();

		}, 30000)
} else {
	init();
}



   }, 2000)
}
});




});
function findTrackers() {
	var hasTrackers = false;
	//Try to find scripts or fake images


		//Get all links
		var links = $("link");
		for (var i = 0; i < links.length;  i++) {
			//Get script data
  			var link = $("link").eq(i);
  			var linkUrl = link.attr("href");


  			trackers.filter(function (a) {
      			var tracker = a;
  				var trackerUrl = tracker.url;
   				if (linkUrl && linkUrl.match(trackerUrl)) {
  						hasTrackers = true;
  					createTracker(linkUrl, "link")
  				} else {
  					 if (a.alternativeUrls) {

  						a.alternativeUrls.filter(function (b) {
   							if (linkUrl && linkUrl.match(b)) {

  								hasTrackers = true;
  								createTracker(linkUrl, "link")
  							}
  						});
  					}
  				}
  			});
		}


		//Get all images
    	var images = $("img");
		for (var i = 0; i < images.length;  i++) {
			//Get image data for each image
  			var image = $("img").eq(i);
  			var imgWidth = image.width()
  			var imgHeight =  image.height()
  			var imageSizes = [imgWidth, imgHeight];
  			var imgUrl = image.attr("src");
  			// This checks if "image" url is an actual image and not some random request.
  			var isImage = /.png|.jpg|.jpeg|.bmp|.gif|.svg/g.test(imgUrl)
  			//if image URL dosen't link to an image
  			if (isImage !== true) { 
  				// If image size is 0 or 1
  	 			if( imageSizes.indexOf(0) > -1 || imageSizes.indexOf(1) > -1 || image.css("display") == "none") {
  					//At this point, the image does not link to an image, and has is "invisible". Possibly being a tracker.
  						if (imgUrl) {
  							 hasTrackers = true;
  					  		createTracker(imgUrl, "image")
  						}
  				}
  			}


  			  trackers.filter(function (a) {
      			var tracker = a;
  				var trackerUrl = tracker.url;

   				if (imgUrl && imgUrl.match(trackerUrl)) {
  						hasTrackers = true;
  					createTracker(imgUrl, "image")
  				} else {
  					 if (a.alternativeUrls) {

  						a.alternativeUrls.filter(function (b) {
   							if (imgUrl && imgUrl.match(b)) {

  								hasTrackers = true;
  								createTracker(imgUrl, "image")
  							}
  						});
  					}
  				}
  			});
		}





		//Get all scripts
		var scripts = $("script");
		for (var i = 0; i < scripts.length;  i++) {
			//Get script data
  			var script = $("script").eq(i);
  			var scriptUrl = script.attr("src");


  			trackers.filter(function (a) {
      			var tracker = a;
  				var trackerUrl = tracker.url;
   				if (scriptUrl && scriptUrl.match(trackerUrl)) {
  						hasTrackers = true;
  					createTracker(scriptUrl, "script")
  				} else {
  					 if (a.alternativeUrls) {

  						a.alternativeUrls.filter(function (b) {
   							if (scriptUrl && scriptUrl.match(b)) {

  								hasTrackers = true;
  								createTracker(scriptUrl, "script")
  							}
  						});
  					}
  				}
  			});
		}


		//Get all iframes
		var frames = $("iframe");
		for (var i = 0; i < frames.length;  i++) {
			//Get script data
  			var frame = $("iframe").eq(i);
  			var frameUrl = frame.attr("src");


  			trackers.filter(function (a) {
      			var tracker = a;
  				var trackerUrl = tracker.url;
   				if (frameUrl && frameUrl.match(trackerUrl)) {
  						hasTrackers = true;
  					createTracker(frameUrl, "iframe")
  				} else {
  					 if (a.alternativeUrls) {

  						a.alternativeUrls.filter(function (b) {
   							if (frameUrl && frameUrl.match(b)) {

  								hasTrackers = true;
  								createTracker(frameUrl, "iframe")
  							}
  						});
  					}
  				}
  			});
		}

function captureNetworkRequest(e) {
    var capture_network_request = [];
    var capture_resource = performance.getEntriesByType("resource");
    for (var i = 0; i < capture_resource.length; i++) {
             trackers.filter(function (a) {
      			var tracker = a;
  				var trackerUrl = tracker.url;
  				console.log(capture_resource[i].name)
   				if (capture_resource[i].name && capture_resource[i].name.match(trackerUrl)) {
   					console.log(true)
  						hasTrackers = true;
  					createTracker(capture_resource[i].name, capture_resource[i].initiatorType)
  				} else {
  					 if (a.alternativeUrls) {

  						a.alternativeUrls.filter(function (b) {
   							if (capture_resource[i].name && capture_resource[i].name.match(b)) {

  								hasTrackers = true;
  								createTracker(capture_resource[i].name, capture_resource[i].initiatorType)
  							}
  						});
  					}
  				}
  			});



    }
    return capture_network_request;
}
captureNetworkRequest()


if (hasTrackers == true) {
	saveTrackers()

}

}
function extractHostname(url) {
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

    if (hostname.length < 1) {
    	hostname = window.location.hostname;
    }
 	if(hostname.indexOf("www.") > -1) {
		hostname = hostname.split('www.')[1]
	}
    return hostname;
}
function createTracker(url, type) {
	var trackerObject;
	var exists = false;

    trackers.filter(function(x) {
  		if (url.match(x.url)) {

  			x.type = type;
  			trackerObject = x;

  			exists = true;
  				if (pageTrackers.map(function(e) { return e.url; }).indexOf(x.url) == -1) {
	pageTrackers.push(trackerObject);

				}
  		} else {
  			if (x.alternativeUrls) {
  				x.alternativeUrls.filter(function(y) {
  					if (url.match(y)) {
  						x.type = type;
  						trackerObject = x;

  						exists = true;
  				if (pageTrackers.map(function(e) { return e.url; }).indexOf(y.url) == -1) {
	pageTrackers.push(trackerObject);

				}  					}
				})
  			}

  		}
	})

	if (exists == false) {
		trackerObject = {
		name: "Unknown",
		owner: "Unknown",
		url: extractHostname(url)
	}
		trackerObject.type = type;
  				if (pageTrackers.map(function(e) { return e.url; }).indexOf(url) == -1) {
	pageTrackers.push(trackerObject);

				}
		}
}	



function saveTrackers(reason) {
chrome.runtime.sendMessage({action: "setBadge"}, function(response) {
  console.log(response.ok);
});

	chrome.storage.local.get("websites", function(result) {

			result = JSON.parse(result.websites);
			var websites = result.totalTracking;
		var hasMatch = false;
		var editingItem;
					var website = window.location.hostname;
			if(website.indexOf("www.") > -1) {
				website = website.split('www.')[1]
			}
		if (websites.length > 0) {
		websites.filter(function(x) {
  			if (website == x.website) {
  				hasMatch = true;
  				editingItem = websites.indexOf(x);
  			} 
		})
	}
				var newPageTrackers = [];
			pageTrackers.filter(function(y) {


				if (newPageTrackers.map(function(e) { return e.url; }).indexOf(y.url) == -1) {
					newPageTrackers.push(y);

				}
			})
			pageTrackers = JSON.parse(JSON.stringify(newPageTrackers))

		if (hasMatch == false) {

			var trackerTemplate =
				{
					website: website,
					trackers: pageTrackers,
					info: pageInfo
				};
			websites.push(trackerTemplate);
			chrome.storage.local.set({ "websites" : JSON.stringify(result)
			}, function() {
    		});     



		} else if (hasMatch == true) {
console.log(pageTrackers)
			pageTrackers.filter(function(x) {
				var exists = false
				websites[editingItem].trackers.filter(function(y) {
					if (x.url == y.url) exists = true;
				})

				if (exists == false) {
					websites[editingItem].trackers.push(x)
								chrome.storage.local.set({ "websites" : JSON.stringify(result)
			}, function() {
    		});     
								
				}
			})
if (reason == "update") {
websites[editingItem].info = pageInfo;
}
								chrome.storage.local.set({ "websites" : JSON.stringify(result)
			}, function() {
    		});     
		}
	});
}
//WHEN TRACKER FOUND:
/*

*/