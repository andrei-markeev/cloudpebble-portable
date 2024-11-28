local DownloadBundle = {}

local function StartWindows(container_dir)
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

    if not path.exists(curl_path) then
        return 'error', curl_path .. ' not found!'
    elseif not path.exists(tar_path) then
        return 'error', tar_path .. ' not found!'
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

        local fd = unix.open('.pebble/download.log', unix.O_WRONLY | unix.O_CREAT, 0644)
        unix.dup(fd, 1)
        unix.dup(fd, 2)
        unix.close(fd)

        local _, err = unix.execve(curl_path, {
            curl_path,
            '-Ls',
            'https://github.com/andrei-markeev/pebblesdk-container/archive/refs/heads/main.tar.gz',
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

    -- final fork: unpacking with tar
    if assert(unix.fork()) == 0 then
        Barf(status_filename, 'Unpacking Pebble SDK container bundle...');

        Log(kLogInfo, tar_path)
        Log(kLogInfo, path.join(container_dir, 'pebblesdk-container.tar.gz'))
        -- local fd = unix.open('.pebble/extract.log', unix.O_WRONLY | unix.O_CREAT, 0644)
        -- unix.dup(fd, 1)
        -- unix.dup(fd, 2)
        -- unix.close(fd)

        local _, err = unix.execve(tar_path, {
            tar_path,
            'zxf',
            path.join(container_dir, 'pebblesdk-container.tar.gz'),
            '--strip',
            '1',
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
    if not path.exists(path.join(container_dir, 'rootfs/pebble')) then
        Barf(status_filename, 'Error: unpacking failed!');
        return
    end
    Log(kLogInfo, 'done waiting: tar finished executing')

    Barf(status_filename, 'ready');
end

function DownloadBundle.Check(target_dir)
    local host_os = GetHostOs()
    if host_os == 'WINDOWS' then
        return StartWindows(target_dir)
    else
        return nil, 'Operating system ' .. host_os .. ' is not yet supported!'
    end
end

return DownloadBundle;