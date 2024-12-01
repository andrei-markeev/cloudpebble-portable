local NpmInstall = {}

---@param app_info AppInfo
---@param target_dir string
---@param assert_fail_build function
function NpmInstall.installTo(app_info, target_dir, assert_fail_build)

    local tar_path = '/C/Windows/system32/tar.exe';
    if not path.exists(tar_path) then
        assert_fail_build(false, tar_path .. ' not found!')
    end

    for package_name, version in pairs(app_info.dependencies) do

        if version:sub(1, 1) == '~' or version:sub(1, 1) == '^' then
            version = version:sub(2)
        end
        Log(kLogInfo, 'Fetching package manifest ' .. package_name .. '...')
        local status, _, response = assert_fail_build(Fetch('https://registry.npmjs.org/' .. package_name .. '/latest'))
        assert_fail_build(status == 200, 'Failed to fetch ' .. package_name .. ' from npm. Server returned ' .. status)
        local package_manifest = assert(DecodeJson(response))--[[@as any]]

        assert_fail_build(unix.makedirs('.pebble/package-cache'))
        local cache_file = '.pebble/package-cache/' .. package_name .. '-' .. package_manifest.version .. '.tgz';
        if not path.exists(cache_file) then
            Log(kLogInfo, 'Downloading ' .. package_manifest.dist.tarball .. '...')
            local status, _, response = assert_fail_build(Fetch(package_manifest.dist.tarball))
            assert_fail_build(status == 200, 'Failed to fetch ' .. cache_file .. ' from npm. Server returned ' .. status)
            assert_fail_build(Barf(cache_file, response))
        else
            Log(kLogInfo, cache_file .. ' already downloaded.')
        end

        if assert(unix.fork()) == 0 then
            local _, err = unix.execve(tar_path, {
                tar_path,
                'zxf',
                cache_file,
                '--strip',
                '1',
                '-C',
                '.pebble/package-cache',
                'package/dist.zip'
            })

            if err ~= nil then
                Log(kLogError, 'Fatal error: failed to execute tar: ' .. err:name() .. ' ' .. err:doc())
                return
            end
    
            unix.exit(127)
        end
    
        Log(kLogInfo, 'waiting for tar (package tarball)')
        unix.wait();
        Log(kLogInfo, 'done waiting')
        local dist_file = '.pebble/package-cache/dist.zip'
        assert_fail_build(path.exists(dist_file), 'Failed to extract dist.zip from ' .. cache_file)

        assert_fail_build(unix.makedirs(path.join(target_dir, package_name)))

        if assert(unix.fork()) == 0 then
            local _, err = unix.execve(tar_path, {
                tar_path,
                'zxf',
                dist_file,
                '--strip',
                '1',
                '-C',
                path.join(target_dir, package_name),
                'js' -- only [js] folder
            })

            if err ~= nil then
                Log(kLogError, 'Fatal error: failed to execute tar: ' .. err:name() .. ' ' .. err:doc())
                return
            end
    
            unix.exit(127)
        end

        Log(kLogInfo, 'waiting for tar (dist.zip)')
        unix.wait();
        Log(kLogInfo, 'done waiting')
    end

end

return NpmInstall;