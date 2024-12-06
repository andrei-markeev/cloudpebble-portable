local DownloadBundle = require('DownloadBundle')

local platform = GetParam('platform')

if platform ~= 'aplite' and platform ~= 'basalt' and platform ~= 'chalk' and platform ~= 'diorite' and platform ~= 'emery' then
    ServeError(400)
end

local host_os = GetHostOs()
if host_os ~= 'WINDOWS' then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = false,
        error = 'Emulation on ' .. host_os .. ' is not supported yet!'
    }))
    return
end

local container_dir = DownloadBundle.getContainerDir()
local rootfs_dir = path.join(container_dir, 'rootfs')

local status, text = DownloadBundle.check(container_dir)
if status ~= 'ready' then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    if status == 'error' then
        Write(EncodeJson({
            success = false,
            error = text
        }))
    else
        Write(EncodeJson({
            success = true,
            progress = text
        }))
    end
    return
end

if host_os == 'WINDOWS' then
    if path.exists('.pebble/qemu_control') then
        SetStatus(200)
        SetHeader('Content-Type', 'application/json; charset=utf-8')
        Write(EncodeJson({
            success = true,
            vnc_ws_port = 5901,
            pypkjs_port = 5902
        }))
        return
    end

    assert(Barf('.pebble/qemu_control', '1'))

    local wsl_path = '/C/WINDOWS/system32/wsl.exe';
    if not path.exists(wsl_path) then
        SetStatus(200)
        SetHeader('Content-Type', 'application/json; charset=utf-8')
        Write(EncodeJson({
            success = false,
            error = 'WSL not detected at ' .. wsl_path .. '!'
        }))
        return
    end

    if unix.fork() == 0 then

        Log(kLogInfo, "in the child")

        if assert(unix.fork()) == 0 then

            local fd = unix.open('/dev/null', unix.O_RDONLY)
            unix.dup(fd, 0);
            unix.close(fd);

            Log(kLogInfo, "spawning qemu: " .. wsl_path .. ' --user root -- sh -c "chroot /mnt/c/' .. string.sub(rootfs_dir, 4) .. ' sh -c pebble/emulate_' .. platform .. '.sh"')
            local _, err = unix.execve(wsl_path, {
                wsl_path,
                '--user', 'root',
                '--',
                'sh', '-c', 'chroot /mnt/c/' .. string.sub(rootfs_dir, 4) .. ' sh -c pebble/emulate_' .. platform .. '.sh'
            })

            if err ~= nil then
                Log(kLogError, 'Failed to execute WSL: ' .. err:name() .. ' ' .. err:doc())
                return
            end

            unix.exit(127)
        end

        Sleep(3)

        if assert(unix.fork()) == 0 then

            local fd = unix.open('/dev/null', unix.O_RDONLY)
            unix.dup(fd, 0);
            unix.close(fd);

            Log(kLogInfo, "spawning phonesim: " .. wsl_path .. ' --user root -- sh -c "chroot /mnt/c/' .. string.sub(rootfs_dir, 4) .. ' sh -c pebble/run_pypkjs.sh"')

            local phonesim_log = '.pebble/phonesim.log'
            local fd = unix.open(phonesim_log, unix.O_WRONLY | unix.O_CREAT, 0644)
            unix.dup(fd, 1)
            unix.dup(fd, 2)
            unix.close(fd)

            local _, err = unix.execve(wsl_path, {
                wsl_path,
                '--user', 'root',
                '--',
                'sh', '-c', 'chroot /mnt/c/' .. string.sub(rootfs_dir, 4) .. ' sh -c pebble/run_pypkjs.sh'
            })

            if err ~= nil then
                Log(kLogError, 'Failed to execute WSL: ' .. err:name() .. ' ' .. err:doc())
                return
            end

            unix.exit(127)
        end

        Log(kLogInfo, "start waiting for qemu and phonesim")

        unix.wait()

        Log(kLogInfo, "end executing launch-emulator child")
        return
    end

end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true,
    vnc_ws_port = 5901,
    pypkjs_port = 5902,
    spawned = true
}))
