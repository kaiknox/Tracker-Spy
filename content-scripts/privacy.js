 var navigator = window.navigator;
    var modifiedNavigator;
    if ('userAgent' in Navigator.prototype) {
        // Chrome 43+ moved all properties from navigator to the prototype,
        // so we have to modify the prototype instead of navigator.
        modifiedNavigator = Navigator.prototype;
    } else {
        // Chrome 42- defined the property on navigator.
        modifiedNavigator = Object.create(navigator);
        Object.defineProperty(window, 'navigator', {
            value: modifiedNavigator,
            configurable: false,
            enumerable: false,
            writable: false
        });
    }
    // Pretend to be Windows XP
    Object.defineProperties(modifiedNavigator, {
        userAgent: {
            value: navigator.userAgent.replace(/\([^)]+\)/, 'Windows NT 5.1'),
            configurable: false,
            enumerable: true,
            writable: false
        },
        appVersion: {
            value: navigator.appVersion.replace(/\([^)]+\)/, 'Windows NT 5.1'),
            configurable: false,
            enumerable: true,
            writable: false
        },
        platform: {
            value: 'Win32',
            configurable: false,
            enumerable: true,
            writable: false
        },
    });



            navigator.geolocation.getCurrentPosition = (s, r) => {

                      document.querySelector("body").dispatchEvent(new CustomEvent('happyCat', { bubbles: true, detail: { text: "happyCat" } }))
                    document.querySelector('body').addEventListener('happyCat2', function(e) {
                            console.log(e.detail)
                              s(e.detail.coords);

                        
                    });

                

};

 


   /* navigator.getUserMedia = (e) => {
        alert("Wr")
};*/