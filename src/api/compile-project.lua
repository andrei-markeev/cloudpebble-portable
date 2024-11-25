local host_os = GetHostOs();
if host_os ~= 'WINDOWS' then
    SetStatus(400)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = false,
        error = 'Compilation on ' .. host_os .. ' is not supported yet!'
    }))
end

local build_uuid = UuidV4();

local build_db_filename = '.pebble/builds/db.json';
---@type any
local builds = Slurp(build_db_filename)

local lastId = 0
if builds ~= nil then
    builds = assert(DecodeJson(builds))
    lastId = builds[1].id
else
    builds = {}
end

assert(unix.makedirs('.pebble/builds'))

local current_build = { id = lastId + 1, uuid = build_uuid, state = 1, started = math.floor(GetTime() * 1000) };
table.insert(builds, 1, current_build)
if #builds > 10 then
    table.remove(builds, #builds)
end
assert(Barf(build_db_filename, EncodeJson(builds)))

local build_log = '.pebble/builds/' .. build_uuid .. '.log';

-- TODO:
-- create .pebble/pebblesdk-container if needed
-- and update .pebble/pebblesdk-container/rootfs/pebble/app
-- (for now done via script)

if assert(unix.fork()) ~= 0 then

    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = true
    }))
    return
else

    if host_os == 'WINDOWS' then

        local wsl_path = '/C/WINDOWS/system32/wsl.exe';
        local _, err = unix.stat(wsl_path);
        if err ~= nil then
            Log(kLogWarn, 'Fatal error: WSL not detected at ' .. wsl_path .. '! ' .. err:name() .. ' ' .. err:doc());
            Barf(build_log, 'Fatal error: WSL not detected at ! ' .. err:name() .. ' ' .. err:doc() .. '\n')
            current_build.state = 2
            current_build.finished = math.floor(GetTime() * 1000)
            assert(Barf(build_db_filename, EncodeJson(builds)))
            return
        end

        if assert(unix.fork()) == 0 then

            Log(kLogWarn, 'in exec child process');

            local fd = unix.open(build_log, unix.O_WRONLY | unix.O_CREAT, 0644)
            unix.dup(fd, 1)
            unix.dup(fd, 2)
            unix.close(fd)

            local _, err = unix.execve(wsl_path, {
                wsl_path,
                '--user', 'root',
                '--',
                'chroot', '.pebble/pebblesdk-container/rootfs', 'sh', '-c', 'pebble/compile_app.sh'
            })

            if err ~= nil then
                print('Fatal error: failed to execute WSL command: ' .. err:name() .. ' ' .. err:doc())
                current_build.state = 2
                current_build.finished = math.floor(GetTime() * 1000)
                assert(Barf(build_db_filename, EncodeJson(builds)))
                return
            end

            unix.exit(127)
        else
            Log(kLogWarn, 'waiting for subprocess')
            assert(unix.wait())
            Log(kLogWarn, 'done waiting')
            assert(unix.rename('.pebble/pebblesdk-container/rootfs/pebble/assembled/build/assembled.pbw', '.pebble/builds/' .. build_uuid .. '.pbw'))
            ---@type any
            local appinfo = assert(DecodeJson(Slurp('appinfo.json')))
            local sizeInfo = {}
            for _, p in ipairs(appinfo.targetPlatforms) do
                local app_stat = assert(unix.stat('.pebble/pebblesdk-container/rootfs/pebble/assembled/build/' .. p .. '/pebble-app.bin'))
                local res_stat = assert(unix.stat('.pebble/pebblesdk-container/rootfs/pebble/assembled/build/' .. p .. '/app_resources.pbpack'))
                sizeInfo[p] = { app = app_stat:size(), resources = res_stat:size() }
            end
            Log(kLogWarn, 'files copied')
            assert(unix.rmrf('.pebble/pebblesdk-container/rootfs/pebble/assembled'))
            Log(kLogWarn, 'build dir removed')
            current_build.state = 3
            current_build.finished = math.floor(GetTime() * 1000)
            current_build.sizes = sizeInfo
            assert(Barf(build_db_filename, EncodeJson(builds)))
            Log(kLogWarn, 'db updated')
        end
    end

end