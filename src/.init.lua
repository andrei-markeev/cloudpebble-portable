local KB = 1024;
ProgramMaxPayloadSize(512 * KB)
ProgramAddr(2130706433)
ProgramPort(8080)
ProgramPort(60000)

function OnHttpRequest()
    local _, port = GetServerAddr()
    if port == 60000 then
        local RebbleOAuth = require('RebbleOAuth')
        RebbleOAuth.handleCallback();
    else
        Route()
    end
end

LaunchBrowser()

if path.exists('.pebble/qemu_control') then
    assert(unix.unlink('.pebble/qemu_control'))
end