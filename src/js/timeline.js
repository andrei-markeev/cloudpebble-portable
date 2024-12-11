/**
 * Created by katharine on 19/3/15.
 */

CloudPebble.Timeline = new (function() {
    var mEditor = null;
    var mCurrentAction = null;
    var mSyncUrl = '/api/get-timeline-updates.lua';

    function setStatus(okay, text) {
        $('#timeline-status').text(text);
        if(okay) {
            $('#timeline-status').addClass('good').removeClass('bad');
        } else {
            $('#timeline-status').addClass('bad').removeClass('good');
        }
    }

    function handleTimelineResult(success) {
        var analytics = {
            'insert': 'sdk_pin_inserted',
            'delete': 'sdk_pin_deleted'
        };
        if(mCurrentAction) {
            //CloudPebble.Analytics.addEvent(analytics[mCurrentAction], {success: success});
            mCurrentAction = null;
        }
        if(success) {
            setStatus(true, "Sent pin.");
        } else {
            setStatus(false, "Pin could not be sent.");
        }
    }

    function insertPin() {
        mCurrentAction = 'insert';
        var content = mEditor.getValue();
        var json;
        try {
            json = JSON.parse(content);
        } catch(e) {
            setStatus(false, e);
            return;
        }
        if(!_.has(json, 'id')) {
            setStatus(false, "You must provide an 'id'.");
            return;
        }
        if(!_.has(json, 'time')) {
            setStatus(false, "You must specify a 'time' for the pin.");
            return;
        }
        if(!_.has(json, 'layout')) {
            setStatus(false, "You must provide a 'layout' for the pin");
            return;
        }
        setStatus(true, '');
        SharedPebble.getPebble(ConnectionType.QemuBasalt)
            .then(function(pebble) {
                pebble.once('timeline:result', handleTimelineResult);
                pebble.emu_send_pin(content);
            });
    }

    function deletePin() {
        mCurrentAction = 'delete';
        var content = mEditor.getValue();
        var id = JSON.parse(content)['id'];
        SharedPebble.getPebble(ConnectionType.QemuBasalt)
            .then(function(pebble) {
                pebble.once('timeline:result', handleTimelineResult);
                pebble.emu_delete_pin(id);
            });
    }

    var authWindow = null;
    function poll() {
        var spamInterval = setInterval(function () {
            if (authWindow.location && authWindow.location.host) {
                $(authWindow).off();
                clearInterval(spamInterval);
                console.log("there!");
                authWindow.postMessage('hi', '*');
                $(window).one('message', function (event) {
                    var queryString = event.originalEvent.data;
                    console.log('got:', queryString);
                    var params = new URLSearchParams(queryString);
                    if (params.has('success')) {
                        mAuthenticated = 1;
                        syncFromWeb();
                    } else if (params.has('error'))
                        setStatus(false, params.get('error'));
                    authWindow.close();
                });
                
            } else if (authWindow.closed) {
                console.log('it closed.');
                clearInterval(spamInterval);
                $(window).off('message');
            }
        }, 1000);
    }

    async function syncFromWeb() {

        let updatesSynced = 0;
        let successful = 0;
        let pebble = null;

        // TODO: progress bar
        try {
            
            pebble = await SharedPebble.getPebble(ConnectionType.QemuBasalt);
            
            while (true) {
                const data = await Ajax.Get(mSyncUrl);

                if (data.mustResync) {
                    mSyncUrl = data.syncURL;
                    continue;
                }

                // TODO: add timeouts, sometimes the thing gets stuck
                for (var update of data.updates) {
                    if (update.type === 'timeline.pin.create') {
                        await new Promise((resolve) => {
                            pebble.once('timeline:result', function(r) {
                                if (r) successful++;
                                resolve();
                                console.log('update synced:', r, update)
                            });
                            update.data.id = update.data.guid;
                            pebble.emu_send_pin(JSON.stringify(update.data));
                            updatesSynced++;
                        });
                    } else if (update.type === 'timeline.pin.delete') {
                        await new Promise((resolve) => {
                            pebble.once('timeline:result', function(r) {
                                if (r) successful++;
                                resolve();
                                console.log('update synced:', r, update)
                            });
                            pebble.emu_delete_pin(update.data.guid);
                            updatesSynced++;
                        });
                    } else {
                        console.error('Unsupported update type!', update)
                        updatesSynced++;
                    }
                }
                
                if (data.nextPageURL) {
                    mSyncUrl = data.nextPageURL;
                    continue;
                }

                mSyncUrl = data.syncURL;
                break;
            }
            
            setStatus(successful === updatesSynced, successful + '/' + updatesSynced + ' updates synced successfully.');

        } catch(err) {

            if (err.message === 'Rebble authentication required') {
                CloudPebble.Prompts.Confirm(gettext("Authentication required"), gettext("Timeline is synced from Rebble, you need to log in to Rebble in order to proceed."), function() {
                    authWindow = window.open(
                        "https://auth.rebble.io/oauth/authorise?response_type=code&client_id=b576399e9d1fdaa8e666a4dffbbdd1&scope=profile&redirect_uri=http://localhost:60000/",
                        "rebble_auth",
                        "width=375,height=567"
                    );
                    poll();
                });
            } else
                setStatus(false, err);

        }

    }

    this.show = function() {
        CloudPebble.Sidebar.SuspendActive();
        if(CloudPebble.Sidebar.Restore("timeline")) {
            return;
        }
        mEditor = CodeMirror.fromTextArea($('#timeline-input')[0], {
            indentUnit: USER_SETTINGS.tab_width,
            tabSize: USER_SETTINGS.tab_width,
            lineNumbers: true,
            autofocus: true,
            electricChars: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            smartIndent: true,
            indentWithTabs: !USER_SETTINGS.use_spaces,
            mode: "application/json",
            styleActiveLine: true,
            theme: USER_SETTINGS.theme
        });
        CloudPebble.Sidebar.SetActivePane($('#timeline-pane').show(), {id: 'timeline'});
        mEditor.refresh();

        $('#timeline-insert-btn').click(insertPin);
        $('#timeline-delete-btn').click(deletePin);
        $('#timeline-websync-btn').click(syncFromWeb);
    }
})();

