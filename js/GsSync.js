// This code will be changed for the storage.sync call of Chrome.
function GsSync (_opt) {

    this.options = {};

    /** Initializes GsSync, part of function In BSync also traverses bookmark folders by 1 level.
     * @param _19 the option _opt in parent scope.
     * @scope Internal
     * */
    this.initialize = function (_19) {
        this.setOptions(_19);
        return this
    }

    /** Seems to create a hook to bookmark changes. Returned value is returned by start() if not "already attached"
     * @scope Internal
     * @returns Self with modified options OR Self with setup bookmark "create/remove" listeners
     */
    this.attach = function () {
        var _1e = this;
        if (this.isAttached) {
            return this
        }
        if (!this.options.name) {
            this.options.name = "All Mangas Reader";
            this.options.debug = false;
            this.options.deleteOther = true;
            this.options.folder = "BSync";
            this.options.idleInterval = 30000;
            this.options.interval = 300000;
            this.options.networkTimeout = 3000;
            this.options.newLine = " ";
            this.options.testNetwork = false;
            this.attach();
            return this
        }
        this.isAttached = true;
        if (!this.options.name || !this.options.folder) {
            throw ("No name (name or folder) given, bailing out");
            return
        }
        /*if (!this.options.debug && parseInt(this.options.interval) < 120 * 1000) {
            this.options.interval = 120 * 1000
        }*/
        setTimeout((function () {
            _1e.traverse()
        }), 10000);

        chrome.bookmarks.onCreated.addListener(function (id, _21) {
            var ts;
            if (_21.url && _1e.folder && _1e.folder.id == _21.parentId && (ts = _1e.isValidBookmark(_21))) {
                (function () {
                    if (_1e.bookmark && (parseInt(_1e.syncedAt) != parseInt(ts)) && (_1e.bookmark.id !== _21.id)) {
                        _1e.stop();
                        _1e.options.debug && console.log("REMOVING AND PROCEESSING ON CREATED");
                        _21.syncedAt = ts;
                        _1e.process(_21, true);
                        _1e.start()
                    } else {
                        return false
                    }
                }).delay(800, this)
            }
        });
        chrome.bookmarks.onRemoved.addListener(function (id, _24) {
            _1e.options.debug && _24.url == undefined && console.log("onRemoved self.folder.id:" + _1e.folder.id + ", id: " + id + " title:" + _24.title);
            if (_1e.folder && (id == _1e.folder.id)) {
                _1e.folder = null
            }
        });
        return this
    }
    /** Tests for network activity via google's favicon. Uses the traverse function if network is up; passing "true"
     * @scope Internal
     * @returns self, after setting up a callback to http request
     */
    this.testNetwork = function () {
        var xhr = new XMLHttpRequest(),
            _26 = this;
        var _27 = setTimeout(function () {
                _26.error("NO_NETWORK");
                return this
            }, this.options.networkTimeout);
        xhr.open("GET", "http://www.google.com/favicon.ico", true);
        xhr.send();
        xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    s;
                    clearTimeout(_27);
                    _27 = null;
                    if (xhr.responseText.length > 100) {
                        _26.traverse(true)
                    }
                }
            };
        return this
    }
    /** Part of the traverse function. Recursively calls traverse.
     * @scope internal
     * @returns Returns a this.folder, or false.
     */
    this.getFolder = function () {
        var _28 = this;
        if (this.folder) {
            return this.folder
        }
        var _29, _2a = [],
            _2b = [];
        chrome.bookmarks.getChildren(this.options.parent.toString(), function (_2c) {
                var ts = 0;
                _2c.forEach(function (_2e, _2f) {
                    if (_2e.title.match(new RegExp("^.+?\\." + "([0-9]{10,}?)$"))) {
                        _2a.push(_2e)
                    }
                    if (_2e.title === _28.options.folder && _2e.url === undefined) {
                        //console.log("Bookmark : " + _2e.title + " date : " + _2e.dateAdded + " ; curTS : " + ts);
                        if (_2e.dateAdded > ts) {
                            _29 = _2e;
                            ts = _2e.dateAdded
                        }
                        _2b.push(_2e);
                        return this
                    }
                });
                if (!_29) {
                    _29 = chrome.bookmarks.create({
                        "parentId": _28.options.parent.toString(),
                        "title": _28.options.folder
                    })
                } else {
                    _2b.forEach(function (f, _31) {
                        if (f.id !== _29.id) {
                            chrome.bookmarks.removeTree(f.id)
                        }
                    })
                }
                if (_29 && _2a) {
                    _2a.forEach(function (_32, _33) {
                        chrome.bookmarks.move(_32.id, {
                            "parentId": _29.id.toString()
                        })
                    })
                }
                _28.folder = _29;
                _28.traverse(true)
            });
        return false
    }
    /** Traverse function. Called by "attach", "getNetwork" and "getFolder" recrusive.
     * @scope internal
     * @param _34 Network is active. If the parameter is undef, and the testNetwork option is enabled, and current func
     *  isn't a folder then call test network and pass _34 as the network activity in.
     * @returns Itself. or the results of testNetwork(), getFolder() or start()
     */
    this.traverse = function (_34) {
        var _35 = this,
            _36 = [],
            _37, _38, _39 = this.folder,
            _3a;
        if (!_34 && this.options.testNetwork && !this.folder) {
                return this.testNetwork()
            }
        if (this.lastTraversed) {
                this.options.debug && console.log("TRAVERSED DIFF : " + ((new Date().getTime() - this.lastTraversed) / 1000));
                this.lastTraversed = new Date().getTime()
            } else {
                this.lastTraversed = new Date().getTime()
            }
        if (this.options.getUpdate && this.options.getUpdate() && this.syncedAt) {
                if ((new Date().getTime() - this.options.getUpdate()) < this.options.idleInterval) {
                    //console.log("WAITING FOR " + this.idleInterval + " TO GET UN-IDLE");
                    setTimeout((function () {
                        _35.traverse()
                    }), this.options.idleInterval * 2);
                    return this
                }
            }
        if (!_39) {
                return this.getFolder()
            }
        chrome.bookmarks.getChildren(_39.id.toString(), function (_3b) {
                var _3c = 0,
                    ts;
                _3b.forEach(function (_3e, _3f) {
                        //console.log("Bookmark : " + _3b.title);
                        if (ts = _35.isValidBookmark(_3e)) {
                          //console.log("Bookmark : " + _3b.title + " date : " + ts + " ; curTS : " + _3c);
                            if (_35.options.deleteOther) {
                                _36.push(_3e)
                            }
                            if (_3e.url.indexOf("void") != -1 && (ts > _3c)) {
                                _37 = _3e;
                                _37.syncedAt = ts;
                                _3c = ts
                            }
                        }
                    });
                if (!_37) {
                        _35.options.debug && console.log("NO BOOKMARK FOUND > WRITING");
                        _35.options.onWrite();
                        //return _35.options.onError("MISSING BOOKMARK")
                        _35.options.debug && console.log("BSYNC ERROR : "+"MISSING BOOKMARK");
                        return;
                    }
                if (_35.options.deleteOther) {
                        _36.forEach(function (b, i) {
                            if (String(b.id) != String(_37.id)) {
                                try {
                                    chrome.bookmarks.remove(String(b.id))
                                } catch (ex) {}
                            }
                        })
                    }
                _35.synced = _37.syncedAt;
                _35.bookmark = _35.bookmark || _37;
                return _35.process(_37)
            });
        return this.start()
    }
    /** Called by attach and traverse. Core logic deciding what should be done, and adding meta data to the objects being
     * stored.
     * @scope internal
     * @param _42 The object that contains an array of items to sync. This is wrapped by bsync
     * @param _43 Boolean, if true b/c it came from "attach" I think indicates first enable.
     * @returns self or undef if error
     */
    this.process = function (_42, _43) {
        var _44, _45 = this;
        if (!(_44 = this.getJSON(_42))) {
            _45.options.debug && console.log(" NO CONTENT FOUND > WRITING");
            this.options.onWrite();
            //return this.options.onError("NO CONTENT")
            console.log("BSYNC ERROR : "+" NO CONTENT");
            return;
        }
        this.content = _44;
        var _46 = this.syncedAt;
        this.syncedAt = _42.syncedAt;
        if (0) {
            if (this.shouldRead()) {
                this.syncedAtPrevious = _46;
                this.markTimestamp();
                this.bookmark = _42;
                this.options.onRead(_44, _42)
            } else {
                if (this.shouldWrite()) {
                    this.options.onWrite(_44, _42)
                } else {
                    _45.options.debug && console.log(" NOTHING TO DO :) ")
                }
            }
        } else {
            if (!_43 && this.shouldWrite()) {
                _45.options.debug && console.log("\nAbout to write");
                this.options.onWrite(_44, _42)
            } else {
                if (this.shouldRead()) {
                    _45.options.debug && console.log("\nAbout to read");
                    this.syncedAtPrevious = this.syncedAt;
                    this.markTimestamp();
                    this.bookmark = _42;
                    this.options.onRead(_44, _42)
                } else {
                    _45.options.debug && console.log(" NOTHING TO DO :) ")
                }
            }
        }
        return this
    }
    /** Determines if the local data should be updated from sync source. Called from Process()
     * @scope internal
     * @returns boolean; true if content is defined, and is newer than local
     */
    this.shouldRead = function () {
        if (this.options.debug) {
            console.log("\n\nChecking shouldRead()");
            console.log("this.syncedAtPrevious: " + this.syncedAtPrevious);
            console.log("this.syncedAt: " + this.syncedAt);
            console.log("his.options.getUpdate(): " + this.options.getUpdate())
        }
        return this.options.getUpdate() === undefined || (this.content && this.syncedAt > this.options.getUpdate())
    }
    /** Determines if the local data should be written to sync source. Called from Process()
     * @scope internal
     * @returns boolean; true if content is defined, and is newer than sync source
     */
    this.shouldWrite = function () {
        if (this.options.debug) {
            console.log("\n\nChecking shouldWrite()");
            console.log("this.syncedAtPrevious: " + this.syncedAtPrevious);
            console.log("this.syncedAt: " + this.syncedAt);
            console.log("his.options.getUpdate(); " + this.options.getUpdate())
        }
        return !this.content || (this.options.getUpdate() && (this.options.getUpdate() > this.syncedAt))
    }
    /** Called by inherited object in background.js in onWrite(). Deletes older bookmark, creates new one with new
     * content
     * @scope Protected
     * @param _47 Object to write to bookmark.
     * @returns self or false on error
     */
    this.write = function (_47) {
        var _48 = this;
        if (this.content) {
            if (JSON.stringify(this.content) === JSON.stringify(_47)) {
                _48.options.debug && console.log("SORRY SAME CONTENT / BAILING OUT");
                return false
            }
        }
        if (this.bookmark && this.bookmark.id) {
            try {
                chrome.bookmarks.remove(String(this.bookmark.id))
            } catch (ex) {}
        }
        this.syncedAtPrevious = this.syncedAt;
        this.syncedAt = this.options.getUpdate() || new Date().getTime();
        //console.log("resultat de getUpdate: " + this.options.getUpdate());
        var _49 = function (obj) {
            eachSync(obj, function (_4b, key) {
                if (_4b && _4b.toLowerCase && _4b.toLowerCase()) {
                    obj[key] == _4b//.replace(new RegExp("(" + String.fromCharCode(10) + "|" + String.fromCharCode(13) + ")", "g"), _48.options.newLine)
                }
            });
            return obj
        };
        //console.log("To write : " + $H(_47).toJSON());
        _47 = _49(_47);
        //console.log("To write after each : " + $H(_47).toJSON());
        //console.log("Written in bookmark : " + JSON.stringify(_47));
        chrome.bookmarks.create({
            "parentId": this.folder.id.toString(),
            "title": this.options.name + "." + this.syncedAt,
            "url": "javascript:void('" + JSON.stringify(_47) + "');void(" + (Math.random() * 1000) + ");"
        }, function (_4d) {
            _48.bookmark = _4d
        });
        _48.options.debug && console.log("\nWROTE > " + JSON.stringify(_47));
        this.markTimestamp(true);
        return this
    }
    /** Starts timer, and if bookmark hook hasn't been registered. Register it. Called by background.js on param save,
     * init(), and locally by traverse(), and attach()
     * @scope public
     * @returns self or result of attach().
     */
    this.start = function () {
        if (!this.isAttached) {
            return this.attach()
        }
        var _4e = this;
        this.timer = setTimeout(function () {
            _4e.traverse()
        }, this.options.interval);
        this.isRunning = true;
        return this
    }
    /** Starts timer, and if bookmark hook hasn't been registered. Register it. Called by background.js on param save / change,
     * and locally by and attach() (For a restart.)
     * @scope public
     * @returns self or result of attach().
     */
    this.stop = function () {
        if (!this.isRunning) {
            return this
        }
        clearTimeout(this.timer);
        this.timer = null;
        this.isRunning = false;
        return this
    }
    /** Copies options provided by constructor into code. called by initialize() only
     * @scope internal
     * @param _4f
     * @returns {*}
     */
    this.setOptions = function (_4f) {
        var _50 = this,
            fn, _52;
        for (var i in _4f) {
                if (typeof(_4f[i]) == "function") {
                    this.options[i] = _4f[i].bind(this)
                } else {
                    this.options[i] = _4f[i]
                }
            }
        return this
    }
    /** Called by Process() and write(). Updates timestamps in data structure depending on source
     * @scope internal
     * @param _54 boolean, true if called from write()
     * @returns self
     */
    this.markTimestamp = function (_54) {
        this["synced" + (_54 ? "To" : "From")] = new Date().getTime();
        return this
    }
    /** Converts a bookmarked / js-idle wrapped json structure back into something that usable. Called by process() Also
     * tests for validility
     * @scope internal
     * @param _55
     * @returns JSON object, or an empty string if a parse error occurred
     */
    this.getJSON = function (_55) {
        var _56 = _55.url,
            _57, _58 = "";
        _56 = _56.replace(/^.*?void\('(.*?)'\);void.*?$/, "$1");
        //_56 = _56.replace(new RegExp(this.options.newLine, "g"), String.fromCharCode(10));
        //console.log("JSON to parse : " + _56);
        if (_56) {
                try {
                    _58 = JSON.parse(_56)
                } catch (ex) {
                    //console.log("Erreur de parsing JSON -->''");
                    _58 = ""
                }
            }
        return _58
    }
    /** Tests to see if bookmark is a valid bsync bookmark by name. Updates last known Sync time to value
     * @scope internal
     * @param _59 bookmark object
     * @returns false if _59 is undef or not a bookmark. Otherwise the unix time of last sync.
     */
    this.isValidBookmark = function (_59) {
        var _5a;
        if (!_59) {
            return false
        }
        if (!(_5a = _59.title.match(new RegExp("^" + this.options.name + "\\." + "([0-9]{10,}?)$")))) {
            return false
        }
        _59.syncedAt = _5a[1];
        return parseInt(_5a[1])
    }
    
    this.initialize(_opt);
    return this
};
