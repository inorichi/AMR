function GsSync (_opt) {

    this.options = {};

    /** Initializes GsSync, part of function In BSync also traverses bookmark folders by 1 level.
     * @param _19 the option _opt in parent scope.
     * @scope Internal
     * */
    this.initialize = function (_19) {
        this.options.debug = false;
        this.options.idleInterval = 30000;
        this.options.interval = 300000;
        this.options.networkTimeout = 3000;
        this.options.testNetwork = false;
        this.setOptions(_19);
        return this
    }

    /** Sets up the timer if not already running.
     * @scope Internal
     * @returns Self
     */
    this.setupTimer = function () {
        var _gssync = this;
        if (this.isTimerRunning) {
            return _gssync;
        }
        this.isTimerRunning = true;

        this.timer = setInterval(function () {
            _gssync.doSync();
        }, this.options.interval);
        return _gssync;
    }
    /** Tests for network activity via google's favicon. Uses the traverse function if network is up; passing "true"
     * @scope Internal
     * @returns self, after setting up a callback to http request
     */
    this.ifNetworkThen = function (lamba) {
        var xhr = new XMLHttpRequest(),
            _gssync = this;
        var _27 = setTimeout(function () {
                _gssync.error("NO_NETWORK");
                return this
            }, this.options.networkTimeout);
        xhr.open("GET", "http://www.google.com/favicon.ico", true);
        xhr.send();
        xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    clearTimeout(_27);
                    _27 = null;
                    if (xhr.responseText.length > 100) {
                        lamba();
                    }
                }
            };
        return this
    }

    /** Starts the sync operation, called by start(), and TBA
     * @scope internal
     */
    this.doSync = function ()
    {
        console.log("GsSync Tick");
        // Check to ensure ((new Date().getTime() - this.options.getUpdate()) < this.options.idleInterval
//        if (!_34 && this.options.testNetwork && !this.folder) {
//            return this.testNetwork()
//        }
    }

    /**
     * @scope internal
     */
    this.getSpreadsheet = function () {

        var url = this.option.getGSUrl();


        // == Got a response ==

        // UPdate synced at time
//                                _37.syncedAt = ts;

        // If no bookmarks found or invalid write
//                        _35.options.debug && console.log("NO BOOKMARK FOUND > WRITING");
//                        _35.options.onWrite();
//                        return _35.options.onError("MISSING BOOKMARK")

        // update synced
//                _35.synced = _37.syncedAt;
    }
    /** Core logic deciding what should be done, and adding meta data to the objects being stored.
     * @scope internal
     * @param _syncData The object that contains an array of items to sync. This is wrapped by bsync
     * @returns self or undef if error
     */
    this.process = function (_syncData) {
        var _json, _gssync = this;
        if (!(_json = this.getJSON(_syncData))) {
            _gssync.options.debug && console.log(" NO CONTENT FOUND > WRITING");
            this.options.onWrite();
            //return this.options.onError("NO CONTENT")
            console.log("BSYNC ERROR : "+" NO CONTENT");
            return;
        }
        this.content = _json;
        var _previousSync = this.syncedAt;
        this.syncedAt = _syncData.syncedAt;
        if (0) {
            if (this.shouldRead()) {
                this.syncedAtPrevious = _previousSync;
                this.markTimestamp();
                this.bookmark = _syncData;
                this.options.onRead(_json, _syncData)
            } else {
                if (this.shouldWrite()) {
                    this.options.onWrite(_json, _syncData)
                } else {
                    _gssync.options.debug && console.log(" NOTHING TO DO :) ")
                }
            }
        } else {
            if (this.shouldWrite()) {
                _gssync.options.debug && console.log("\nAbout to write");
                this.options.onWrite(_json, _syncData)
            } else {
                if (this.shouldRead()) {
                    _gssync.options.debug && console.log("\nAbout to read");
                    this.syncedAtPrevious = this.syncedAt;
                    this.markTimestamp();
                    this.bookmark = _syncData;
                    this.options.onRead(_json, _syncData)
                } else {
                    _gssync.options.debug && console.log(" NOTHING TO DO :) ")
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
     * @param _storeObj Object to write to bookmark.
     * @returns self or false on error
     */
    this.write = function (_storeObj) {
        var _gssync = this;
        if (this.content) {
            if (JSON.stringify(this.content) === JSON.stringify(_storeObj)) {
                _gssync.options.debug && console.log("SORRY SAME CONTENT / BAILING OUT");
                return false
            }
        }
        this.syncedAtPrevious = this.syncedAt;
        this.syncedAt = this.options.getUpdate() || new Date().getTime();


        /// SYNC CODE HERE


        _gssync.options.debug && console.log("\nWROTE > " + JSON.stringify(_storeObj));
        this.markTimestamp(true);
        return this
    }
    /** Starts timer, and if bookmark hook hasn't been registered. Register it. Called by background.js on param save,
     * init(), and locally by traverse(), and attach()
     * @scope public
     * @returns self or result of attach().
     */
    this.start = function () {
        this.setupTimer();
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
        clearInterval(this.timer);
        this.timer = null;
        this.isRunning = false;
        return this
    }
    /** Copies options provided by constructor into code. called by initialize() only
     * @scope internal
     * @param _settings map of values to set
     * @returns {*}
     */
    this.setOptions = function (_settings) {
        for (var i in _settings) {
                if (typeof(_settings[i]) == "function") {
                    this.options[i] = _settings[i].bind(this)
                } else {
                    this.options[i] = _settings[i]
                }
            }
        return this
    }
    /** Called by Process() and write(). Updates timestamps in data structure depending on source
     * @scope internal
     * @param _writeOp boolean, true if called from write()
     * @returns self
     */
    this.markTimestamp = function (_writeOp) {
        this["synced" + (_writeOp ? "To" : "From")] = new Date().getTime();
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
            _result = "";
        _56 = _56.replace(/^.*?void\('(.*?)'\);void.*?$/, "$1");
        //_56 = _56.replace(new RegExp(this.options.newLine, "g"), String.fromCharCode(10));
        //console.log("JSON to parse : " + _56);
        if (_56) {
                try {
                    _result = JSON.parse(_56)
                } catch (ex) {
                    //console.log("Erreur de parsing JSON -->''");
                    _result = ""
                }
            }
        return _result;
    }

    this.initialize(_opt);
    return this
};
