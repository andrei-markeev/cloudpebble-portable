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

function OnServerStop()
    if path.exists('.pebble/qemu_control') then
        print("Try closing Qemu...")
    
        local sockfd = unix.socket()
        assert(unix.connect(sockfd, ResolveIp('127.0.0.1'), 12346))
        assert(unix.write(sockfd, 'quit\n'))
        assert(unix.close(sockfd));
    
        assert(unix.unlink('.pebble/qemu_control'))
    end
end

if path.exists('.pebble/qemu_control') then
    assert(unix.unlink('.pebble/qemu_control'))
end

local build_db_filename = '.pebble/builds/db.json';
if path.exists(build_db_filename) then
    local builds = Slurp(build_db_filename)--[[@as any]]

    if builds ~= nil then
        builds = assert(DecodeJson(builds))--[[@as any]]
        if builds[1].state == 1 then
            table.remove(builds, 1)
            assert(Barf(build_db_filename, EncodeJson(builds)));
        end

        local DownloadBundle = require('DownloadBundle')
        local container_dir = DownloadBundle.getContainerDir()
        local rootfs_dir = path.join(container_dir, 'rootfs')
        local assembled_dir = path.join(rootfs_dir, 'pebble/assembled');
        if path.exists(assembled_dir) then
            unix.rmrf(assembled_dir);
        end
    end
end

LaunchBrowser()
