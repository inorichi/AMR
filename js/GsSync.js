﻿function GsSync (_opt) {

    // Notes, functions return _gssync incase you ever wanted to do something which resembled the builder pattern.

    this.options = {};

    /** Initializes GsSync,.
     * @param _19 the option _opt in parent scope.
     * @scope Internal
     * */
    this.initialize = function (_19) {
        this.options.debug = 4; // -1 nothing ever, 0 error, 1 warn 2 info 4 trace
        this.options.instantSync = true; // debug only
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
        if (this.timer) {
            return _gssync;
        }
        console.log("Setting timer to run " + this.options.interval);
        this.timer = setInterval(function () {
            _gssync.options.debug >= 0 && console.log("GsSync Tick");
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

    /** Starts the sync operation, called by timer def in setupTimer()
     * @scope internal
     */
    this.doSync = function ()
    {
        var _gssync = this;
        _gssync.options.debug >= 0 && console.log("GsSync Tick: doSync");
        // Check to ensure ((new Date().getTime() - this.options.getUpdate()) < this.options.idleInterval
//        if (!_34 && this.options.testNetwork && !this.folder) {
//            return this.testNetwork()
//        }
        if (_gssync.doingSync)
        {
            _gssync.options.debug >= 0 && console.log("Skipping sync already one in progress.");
            return _gssync;
        }
        _gssync.doingSync = true;
        if (!_gssync.activeMangaSheetUrl)
        {
            this.getWorkbook();
        }
        return _gssync;
    };

    /** Adds an entry to the bottom of the spreadsheet
     * @scope internal
     * @param key the work book key
     * @param value an object with the values to add
     */
    this.addToGS = function (key, value) {
        var _gssync = this;
        var keyRegex = new RegExp("full/([A-Za-z0-9_-]+)$");
        _gssync.options.debug >= 2 && console.log(_gssync.activeMangaSheetUrl);
        var sheetKey = keyRegex.exec(_gssync.activeMangaSheetUrl)[1];
        var url = "http://spreadsheets.google.com/feeds/list/"+key+"/"+sheetKey+"/private/full";
        _gssync.options.debug >= 4 && console.log(url);
        var map = $(['mirror', 'name', 'url', 'lastChapterReadURL', 'lastChapterReadName', 'read', 'update', 'ts', 'display', 'cats'])
            .map(function () {
                return '<gsx:' + this.toLowerCase() + '>' + value[this] + '</gsx:' + this.toLowerCase() + '>';
            });
        _gssync.options.debug >= 4 && console.log(map);
        var row = '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:gsx="http://schemas.google.com/spreadsheets/2006/extended"> ' +
                map.toArray().join() +
                '</entry>';
        _gssync.options.debug >= 4 && console.log(row);
        $.ajax({
            url: url,
            accepts: {
                xml: "application/xml"
            },
            type: "POST",
            contentType: "application/atom+xml",
            data: row,
            success: function (data, textStatus, jqXHR)
            {
                return _gssync;
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                _gssync.options.debug >= 1 && console.log(textStatus);
                _gssync.options.debug >= 1 && console.log(errorThrown);
                _gssync.options.debug >= 4 && console.log(jqXHR);
            },
            timeout: _gssync.options.timeout
        });

        return _gssync;
    };
    /** Fetches the active mangga then syncs
     * @param key workbook key to be helpful.
     * @param forceWrite another way of saying, don't delete
     * @scope internal
     * @return reference to object
     */
    this.syncActiveManga = function (key, forceWrite) {
        var _gssync = this;
        _gssync.options.debug >= 2 && console.log(_gssync.activeMangaSheetUrl);
        var keyRegex = new RegExp("full/([A-Za-z0-9_-]+)$");
        var sheetKey = keyRegex.exec(_gssync.activeMangaSheetUrl)[1];
        var url = "http://spreadsheets.google.com/feeds/list/" + key + "/" + sheetKey + "/private/full";
        _gssync.options.debug >= 2 && console.log("Syncing: " + url);

        $.ajax({
            url: url,
            accepts: {
                xml: "application/xml"
            },
            type: "GET",
            success: function (data, textStatus, jqXHR)
            {
                var response = $(data);
                var actionMap = {};
                var actionQueue = [];
                response.find("entry").each(function (index, value)
                {
                    var url = $(value).find("url");
                    actionMap[url] = {
                        url: $(value).find("url"),
                        name: $(value).find("name"),
                        mirror: $(value).find("mirror"),
                        lastChapterReadUrl: $(value).find("lastChapterReadUrl"),
                        lastChapterReadName: $(value).find("lastChapterReadName"),
                        read: $(value).find("read"),
                        update: $(value).find("update"),
                        ts: $(value).find("ts"),
                        display: $(value).find("display"),
                        cats: $(value).find("cats"),
                        source: "gs"
                    };
                });

                var curCollection = JSON.parse(_gssync.options.collect());
                _gssync.options.debug >= 4 && console.log(actionMap);
                _gssync.options.debug >= 4 && console.log(curCollection);
                $.each(curCollection, function (index, value)
                {
                    if (!actionMap[value.url])
                    {
                        // OK it doesn't exist in remote
                        if (forceWrite)
                        {
                            // Skip deletion check just write it.
                            var temp = value;
                            temp['action'] = 'addToGS';
                            actionQueue.push(temp);
                        } else {
                            //TODO: TBC
                        }
                    } else {
                        // Exists in both
                        //TODO:
                    }
                });

                $.each(actionQueue, function (index, value)
                {
                    switch (value.action)
                    {
                        case 'addToGS':
                            _gssync.addToGS(key, value);
                            break;
                    }
                });

                //TODO: == Got a response ==

                // UPdate synced at time
//                                _37.syncedAt = ts;

                // If no bookmarks found or invalid write
//                        _35.options.debug >= 1 && console.log("NO BOOKMARK FOUND > WRITING");
//                        _35.options.collectThenWrite();
//                        return _35.options.onError("MISSING BOOKMARK")

                // update synced
//                _35.synced = _37.syncedAt;
                _gssync.doingSync = false;

            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                _gssync.options.debug >= 1 && console.log(textStatus);
                _gssync.options.debug >= 1 && console.log(errorThrown);
                _gssync.doingSync = false;
            },
            timeout: _gssync.options.timeout
        });


        return _gssync;
    };

    /** Creates the required sheets
     * @param key to be helpful.
     * @param storeKey key to store it in _gssync with
     * @scope internal
     * @return reference to object
     */
    this.createSheet = function (key, storeKey, values, lamba) {
        var _gssync = this;
        var url = "http://spreadsheets.google.com/feeds/worksheets/"+key+"/private/full";
        var content = '<entry xmlns="http://www.w3.org/2005/Atom" '+
            'xmlns:gs="http://schemas.google.com/spreadsheets/2006"> '+
            '<title>'+values['title']+'</title> '+
            '<gs:rowCount>50</gs:rowCount> '+
            '<gs:colCount>10</gs:colCount> '+
            '</entry>';
        _gssync.options.debug >= 4 && console.log(url);
        _gssync.options.debug >= 4 && console.log(content);
        $.ajax({
            url: url,
            accepts: {
                xml: "application/xml"
            },
            data: content,
            contentType: "application/atom+xml",
            type: "POST",
            success: function (data, textStatus, jqXHR)
            {
                var response = $(data);
                _gssync.options.debug >= 2 && console.log("Got created sheet" + storeKey);
                response.find("entry").each(function (index, value)
                {
                    var each = $(value);
                    _gssync[storeKey] = each.find("id").text();
                });
                if (lamba)
                {
                    return lamba();
                }
                return _gssync.createSheets(key, false); // Go back to continue the next step
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                _gssync.options.debug >= 1 && console.log(textStatus);
                _gssync.options.debug >= 1 && console.log(errorThrown);
                _gssync.options.debug >= 4 && console.log(jqXHR);
                _gssync.doingSync = false;
            },
            timeout: _gssync.options.timeout
        });
        return _gssync;
    };

    /** Creates a update cell XML query..
     * @scope internal
     * @param url the URL for the worksheet
     * @param row the row to update from 1 onwards
     * @param col the column to update from 1 onwards
     * @param version the version - not used atm
     * @param data The data to update the cell with
     * @param batch boolean if this is part of a batch request. put false in batch in V3 of spreedsheet API has been broken since 2011.
     * @returns Formatted string
     */
    this.createCellEntry = function (url, row, col, version, data, batch) {
        if (batch)
        {
            return 		'        <entry>\n' +
                        '            <batch:id>'+ String.fromCharCode('a'.charCodeAt(0) + (row-1)) +col+'</batch:id>\n' +
                        '            <batch:operation type="update" />\n' +
                        '            <id>'+url+'/R'+row+'C'+col+'</id>\n' +
                        '            <link rel="edit" type="application/atom+xml" href="'+url+'/R'+row+'C'+col+'/'+version+'" />\n' +
                        '            <gs:cell row="'+row+'" col="'+col+'" inputValue="'+ escape(data)+'" />\n' +
                        '        </entry>\n';
        } else {
            return 		'<entry xmlns="http://www.w3.org/2005/Atom" xmlns:gs="http://schemas.google.com/spreadsheets/2006">\n' +
                        '    <id>'+url+'/R'+row+'C'+col+'</id>\n' +
                        '    <link rel="edit" type="application/atom+xml" href="'+url+'/R'+row+'C'+col+'" />\n' +
                        '    <gs:cell row="'+row+'" col="'+col+'" inputValue="'+ escape(data)+'" />\n' +
                        '</entry>\n';
        }
    };

    /** Initializes the manga sheet.... A fancy name for installing the columns , the let's loop until everythings gone version.
     * @scope internal
     * @param key workbook key....
     * @returns {*}
     */
    this.initActiveMangaSheet = function (key) {
        var _gssync = this;
        var keyRegex = new RegExp("full/([A-Za-z0-9_-]+)$");
        _gssync.options.debug >= 2 && console.log(_gssync.activeMangaSheetUrl);
        var sheetKey = keyRegex.exec(_gssync.activeMangaSheetUrl)[1];

        var url = "http://spreadsheets.google.com/feeds/cells/"+key+"/"+sheetKey+"/private/full";
        _gssync.options.debug >= 4 && console.log(url);

        var batch = false;
        var queue = [
            _gssync.createCellEntry(url, 1, 1, 0, "mirror", batch),
            _gssync.createCellEntry(url, 1, 2, 0, "name", batch),
            _gssync.createCellEntry(url, 1, 3, 0, "url", batch),
            _gssync.createCellEntry(url, 1, 4, 0, "lastChapterReadURL", batch),
            _gssync.createCellEntry(url, 1, 5, 0, "lastChapterReadName", batch),
            _gssync.createCellEntry(url, 1, 6, 0, "read", batch),
            _gssync.createCellEntry(url, 1, 7, 0, "update", batch),
            _gssync.createCellEntry(url, 1, 8, 0, "ts", batch),
            _gssync.createCellEntry(url, 1, 9, 0, "display", batch),
            _gssync.createCellEntry(url, 1, 10, 0, "cats", batch) ];


        var initActiveMangaSheetRecurs = function ()
        {
            _gssync.options.debug >= 2 && console.log("Recurs");
            $.ajax({
                url: url,
                accepts: {
                    xml: "application/xml"
                },
                type: "POST",
                contentType: "application/atom+xml",
                data: queue.pop(),
                success: function (data, textStatus, jqXHR)
                {
                    if (queue.length > 0)
                    {
                        return initActiveMangaSheetRecurs();
                    }
                    return _gssync.createSheets(key, true);
                },
                error: function(jqXHR, textStatus, errorThrown)
                {
                    _gssync.options.debug >= 1 && console.log(textStatus);
                    _gssync.options.debug >= 1 && console.log(errorThrown);
                    _gssync.options.debug >= 4 && console.log(jqXHR);
                    _gssync.options.debug >= 4 && console.log(content);
                    _gssync.doingSync = false;
                },
                timeout: _gssync.options.timeout
            });
        };
        initActiveMangaSheetRecurs();
        return _gssync;
    };
    /** Initializes the manga sheet.... A fancy name for installing the columns - Batch version.. Broken.
     * @scope internal
     * @param key workbook key....
     * @returns {*}
     */
    this.initActiveMangaSheetBatch = function (key) {
        var _gssync = this;
        var keyRegex = new RegExp("full/([A-Za-z0-9_-]+)$");
        _gssync.options.debug >= 2 && console.log(_gssync.activeMangaSheetUrl);
        var sheetKey = keyRegex.exec(_gssync.activeMangaSheetUrl)[1];

        var url = "http://spreadsheets.google.com/feeds/cells/"+key+"/"+sheetKey+"/private/full";
        _gssync.options.debug >= 4 && console.log(url);

        var batch = true;
        var content = '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:batch="http://schemas.google.com/gdata/batch" xmlns:gs="http://schemas.google.com/spreadsheets/2006">\n' +
            '            <id>'+url+'</id>\n' +
            _gssync.createCellEntry(url, 1, 1, 0, "mirror", batch) +
            _gssync.createCellEntry(url, 1, 2, 0, "name", batch) +
            _gssync.createCellEntry(url, 1, 3, 0, "url", batch) +
            _gssync.createCellEntry(url, 1, 4, 0, "lastChapterReadURL", batch) +
            _gssync.createCellEntry(url, 1, 5, 0, "lastChapterReadName", batch) +
            _gssync.createCellEntry(url, 1, 6, 0, "read", batch) +
            _gssync.createCellEntry(url, 1, 7, 0, "update", batch) +
            _gssync.createCellEntry(url, 1, 8, 0, "ts", batch) +
            _gssync.createCellEntry(url, 1, 9, 0, "display", batch) +
            _gssync.createCellEntry(url, 1, 10, 0, "cats", batch) +
		    '</feed>';

        $.ajax({
            url: url + "/batch",
            accepts: {
                xml: "application/xml"
            },
            type: "PUT",
            contentType: "application/atom+xml",
            data: content,
            success: function (data, textStatus, jqXHR)
            {
                var response = $(data);
                //TODO: check output
                return _gssync.createSheets(key, true);
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                _gssync.options.debug >= 1 && console.log(textStatus);
                _gssync.options.debug >= 1 && console.log(errorThrown);
                _gssync.options.debug >= 4 && console.log(jqXHR);
                _gssync.options.debug >= 4 && console.log(content);
                _gssync.doingSync = false;
            },
            timeout: _gssync.options.timeout
        });

        return _gssync;
    };
    /** Initializes the amr meta sheet.... A fancy name for NOT installing the columns
     * @scope internal
     * @param key workbook key....
     * @returns {*}
     */
    this.initMetaSheet = function (key, forceWrite) {
        var _gssync = this;
        // Do nothing atm
        return _gssync.createSheets(key, forceWrite);
    };
    /** Creates the required sheets
     * @param key to be helpful.
     * @scope internal
     * @return reference to object
     */
    this.createSheets = function (key, forceWrite) {
        var _gssync = this;
        // Called recursively through each step..
        _gssync.options.debug >= 1 && console.log("create Sheets");
        if (!_gssync.amrMetaSheetUrl)
        {
            _gssync.options.debug >= 2 && console.log("Creating meta");
            return _gssync.createSheet(key, "amrMetaSheetUrl", { title: "AMRMeta" }, function () { _gssync.initMetaSheet(key, forceWrite); } );
        }
        if (!_gssync.activeMangaSheetUrl)
        {
            _gssync.options.debug >= 2 && console.log("Creating active manga");
            return _gssync.createSheet(key, "activeMangaSheetUrl", { title: "ActiveManga" }, function () {  _gssync.initActiveMangaSheet(key); } );
            // This doesn't call createSheets() again - it goes straight on to populate data.
        }
        return _gssync.syncActiveManga(key, forceWrite); // Continue on to where we were.
    };
    /** Fetches workbook so we can find the sheets, if any are missing creates them. Passes flow onto "syncActiveManga"
     * @scope internal
     * @return reference to object
     */
    this.getWorkbook = function () {
        var _gssync = this;
        var url = this.options.getGSUrl();
        var keyRegex = new RegExp("key=([A-Za-z0-9_-]+)");
        var key = keyRegex.exec(url)[1];
        _gssync.options.debug >= 4 && console.log( "http://spreadsheets.google.com/feeds/worksheets/"+key+"/private/full");
        $.ajax({
            url: "http://spreadsheets.google.com/feeds/worksheets/"+key+"/private/full",
            accepts: {
                xml: "application/xml"
            },
            type: "GET",
            success: function (data, textStatus, jqXHR)
            {
                var response = $(data);
                _gssync.options.debug >= 2 && console.log("Got books.");
                response.find("entry").each(function (index, value)
                {
                    var each = $(value);
                    var title = each.find("title").text();
                    if (title === "ActiveManga")
                    {
                        _gssync.activeMangaSheetUrl = each.find("id").text();
                    }
                    if (title === "AMRMeta")
                    {
                        _gssync.amrMetaSheetUrl = each.find("id").text();
                    }
                });
                if (!_gssync.activeMangaSheetUrl || !_gssync.amrMetaSheetUrl)
                {
                    return _gssync.createSheets(key, false);
                }
                return _gssync.syncActiveManga(key, false);
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                _gssync.options.debug >= 1 && console.log(textStatus);
                _gssync.options.debug >= 1 && console.log(errorThrown);
                _gssync.doingSync = false;
            },
            timeout: _gssync.options.timeout
        });
    }

    /** Starts timer, and if bookmark hook hasn't been registered. Register it. Called by background.js on param save,
     * init(), and locally by traverse(), and attach()
     * @scope public
     * @returns self or result of attach().
     */
    this.start = function () {
        this.setupTimer();
        this.isRunning = true;
        if (this.options.instantSync)
        {
            this.doSync();
        }
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

    this.initialize(_opt);
    return this
};
