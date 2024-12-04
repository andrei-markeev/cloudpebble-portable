local DownloadBundle = {}

local function startWindows(container_dir)
    local status_filename = path.join(container_dir, 'status');
    local status_contents = Slurp(status_filename)

    if status_contents ~= nil then
        if status_contents == 'ready' then
            return 'ready'
        elseif status_contents:sub(1, 5) == 'Error' then
            assert(unix.unlink(status_filename)) -- delete the file so that we can retry
            return 'error', status_contents:sub(7)
        else
            return 'progress', status_contents
        end
    end
   
    -- let's check the prerequisites first
    local curl_path = '/C/Windows/system32/curl.exe';
    local tar_path = '/C/Windows/system32/tar.exe';
    local wsl_path = '/C/Windows/system32/wsl.exe';

    if not path.exists(curl_path) then
        return 'error', curl_path .. ' not found!'
    elseif not path.exists(tar_path) then
        return 'error', tar_path .. ' not found!'
    elseif not path.exists(wsl_path) then
        return 'error', wsl_path .. ' not found!'
    end

    -- create folder
    local _, err = unix.makedirs(container_dir);
    if err ~= nil then
        return 'error', 'Creating folder ' .. container_dir .. '  failed: ' .. err
    end

    -- start downloading and unpacking container in a child process
    if assert(unix.fork()) ~= 0 then
        return 'progress', 'Preparing to download Pebble SDK container bundle...'
    end

    -- child process

    -- forking one more time: downloading
    if assert(unix.fork()) == 0 then
        Barf(status_filename, 'Downloading Pebble SDK container bundle...');

        local _, err = unix.execve(curl_path, {
            curl_path,
            '-Ls',
            'https://github.com/andrei-markeev/cloudpebble-portable/releases/download/latest/pebblesdk-container.tar.gz',
            '-o',
            path.join(container_dir, 'pebblesdk-container.tar.gz')
        })

        if err ~= nil then
            local status_text = 'Error: failed to execute curl: ' .. err:name() .. ' ' .. err:doc()
            Log(kLogError, status_text)
            Barf(status_filename, status_text);
            return
        end

        unix.exit(127)
    end

    Log(kLogInfo, 'waiting for curl')
    unix.wait();
    if not path.exists(path.join(container_dir, 'pebblesdk-container.tar.gz')) then
        Barf(status_filename, 'Error: download failed!');
        return
    end
    Log(kLogInfo, 'done waiting: curl finished executing')

    -- unpacking with tar
    if assert(unix.fork()) == 0 then
        Barf(status_filename, 'Unpacking Pebble SDK container bundle...');

        local _, err = unix.execve(tar_path, {
            tar_path,
            'zxf',
            path.join(container_dir, 'pebblesdk-container.tar.gz'),
            '-C',
            container_dir
        })

        if err ~= nil then
            local status_text = 'Fatal error: failed to execute tar: ' .. err:name() .. ' ' .. err:doc()
            Log(kLogError, status_text)
            Barf(status_filename, status_text);
            return
        end

        unix.exit(127)
    end

    Log(kLogInfo, 'waiting for tar')
    unix.wait();
    if not path.exists(path.join(container_dir, 'rootfs/pebble/init.sh')) then
        Barf(status_filename, 'Error: unpacking failed!');
        return
    end
    Log(kLogInfo, 'done waiting: tar finished executing')

    assert(unix.unlink(path.join(container_dir, 'pebblesdk-container.tar.gz')))

    -- run init.sh script
    if assert(unix.fork()) == 0 then
        Barf(status_filename, 'Initializing the bundle...');

        local _, err = unix.execve(wsl_path, {
            wsl_path,
            '--user', 'root',
            '--',
            'sh', '-c', 'chroot /mnt/c/' .. string.sub(path.join(container_dir, 'rootfs'), 4) .. ' sh -c pebble/init.sh'
        })

        if err ~= nil then
            local status_text = 'Error: failed to execute wsl: ' .. err:name() .. ' ' .. err:doc()
            Log(kLogError, status_text)
            Barf(status_filename, status_text);
            return
        end

        unix.exit(127)
    end

    Log(kLogInfo, 'waiting for wsl')
    unix.wait();
    if not path.exists(path.join(container_dir, 'rootfs/pebble/sdk3/pebble/aplite/qemu/qemu_spi_flash.bin')) then
        Barf(status_filename, 'Error: bundle init script has failed!');
        return
    end
    Log(kLogInfo, 'done waiting: wsl finished executing')

    Barf(status_filename, 'ready');
end

function DownloadBundle.check(target_dir)
    local host_os = GetHostOs()
    if host_os == 'WINDOWS' then
        return startWindows(target_dir)
    else
        return nil, 'Operating system ' .. host_os .. ' is not yet supported!'
    end
end

function DownloadBundle.getContainerDir()
    local home_dir;
    local host_os = GetHostOs()
    if host_os == 'WINDOWS' then
        home_dir = os.getenv("USERPROFILE");
    else
        home_dir = os.getenv("HOME");
    end

    if home_dir == nil then
        Log(kLogWarn, 'User home directory not found!')
        home_dir = ''
    end

    return path.join(home_dir, '.pebble/pebblesdk-container')
end

return DownloadBundle;