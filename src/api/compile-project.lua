local ProjectFiles = require('ProjectFiles')
local DownloadBundle = require('DownloadBundle')
local NpmInstall = require('NpmInstall')
local ConcatJavascript = require('ConcatJavascript')

local host_os = GetHostOs();
if host_os ~= 'WINDOWS' then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = false,
        error = 'Compilation on ' .. host_os .. ' is not supported yet!'
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

local app_info = assert(ProjectFiles.getAppInfo())

if not path.exists(path.join(rootfs_dir, 'pebble/compile_' .. app_info.projectType .. '.sh')) then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = false,
        error = 'Compilation of ' .. app_info.projectType .. ' projects is not supported yet!'
    }))
    return
end

if app_info.enableMultiJS and app_info.projectType ~= 'native' then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = false,
        error = 'Compilation of projects of type ' .. app_info.projectType .. ' with enableMultiJS is not supported yet!'
    }))
    return
end

local build_uuid = UuidV4();

local build_db_filename = '.pebble/builds/db.json';
---@type any
local builds = Slurp(build_db_filename)

local lastId = 0
if builds ~= nil then
    builds = assert(DecodeJson(builds))--[[@as any]]
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

local function assert_fail_build(...)
    local arg = {...}
    local val = arg[1]
    local err = arg[2]
    if val == nil or val == false then
        current_build.state = 2
        current_build.finished = math.floor(GetTime() * 1000)
        assert(Barf(build_db_filename, EncodeJson(builds)))
        if type(err) ~= 'string' then
            err = err:name() .. ' ' .. err:doc()
        end
        if not path.exists(build_log) then
            Barf(build_log, err);
        else
            Barf(build_log, Slurp(build_log) .. '\n' .. err);
        end
        error(err)
    end
    return table.unpack(arg)
end

if assert_fail_build(unix.fork()) ~= 0 then

    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = true
    }))
    return
end

-- in the child process

local container_app_dir = path.join(rootfs_dir, 'pebble/app');
if path.exists(container_app_dir) then
    assert_fail_build(unix.rmrf(container_app_dir));
end
assert_fail_build(unix.mkdir(container_app_dir));

ProjectFiles.copyTo(app_info, container_app_dir)

if app_info.enableMultiJS and app_info.projectType == 'native' then
    NpmInstall.installTo(app_info, path.join(container_app_dir, 'src/pkjs'), assert_fail_build)
    app_info.enableMultiJS = false
    app_info.dependencies = {}
    ProjectFiles.saveAppInfoTo(app_info, container_app_dir)
    ConcatJavascript.concat(app_info, container_app_dir, rootfs_dir, assert_fail_build)
    -- TODO: patch wscript
    -- ctx.pbl_bundle(binaries=binaries, js='src/js/pebble-js-app.js')
end

if host_os == 'WINDOWS' then

    local wsl_path = '/C/WINDOWS/system32/wsl.exe';
    if not path.exists(wsl_path) then
        Log(kLogError, 'Fatal error: WSL not found at ' .. wsl_path .. '!');
        assert(Barf(build_log, 'Fatal error: WSL not found at ' .. wsl_path .. '!\n'))
        current_build.state = 2
        current_build.finished = math.floor(GetTime() * 1000)
        assert(Barf(build_db_filename, EncodeJson(builds)))
        return
    end

    if assert_fail_build(unix.fork()) == 0 then

        local fd = unix.open(build_log, unix.O_WRONLY | unix.O_CREAT, 0644)
        unix.dup(fd, 1)
        unix.dup(fd, 2)
        unix.close(fd)

        local _, err = unix.execve(wsl_path, {
            wsl_path,
            '--user', 'root',
            '--',
            'sh', '-c', 'chroot /mnt/c/' .. string.sub(rootfs_dir, 4) .. ' sh -c pebble/compile_' .. app_info.projectType .. '.sh'
        })

        if err ~= nil then
            print('Fatal error: failed to execute WSL command: ' .. err:name() .. ' ' .. err:doc())
            current_build.state = 2
            current_build.finished = math.floor(GetTime() * 1000)
            assert(Barf(build_db_filename, EncodeJson(builds)))
            return
        end

        unix.exit(127)
    end

    Log(kLogWarn, 'waiting for subprocess')
    assert_fail_build(unix.wait())
    Log(kLogWarn, 'done waiting')

    local build_dir = path.join(rootfs_dir, 'pebble/assembled/build');
    assert_fail_build(unix.rename(path.join(build_dir, 'assembled.pbw'), '.pebble/builds/' .. build_uuid .. '.pbw'))
    local sizeInfo = {}
    for _, p in ipairs(app_info.targetPlatforms) do
        local app_stat = assert_fail_build(unix.stat(path.join(build_dir, p, 'pebble-app.bin')))
        local res_stat = assert_fail_build(unix.stat(path.join(build_dir, p, 'app_resources.pbpack')))
        sizeInfo[p] = { app = app_stat:size(), resources = res_stat:size() }
    end
    assert_fail_build(unix.rmrf(path.join(rootfs_dir, 'pebble/assembled')))
    current_build.state = 3
    current_build.finished = math.floor(GetTime() * 1000)
    current_build.sizes = sizeInfo
    assert(Barf(build_db_filename, EncodeJson(builds)))
    Log(kLogWarn, 'finalization complete')

end
