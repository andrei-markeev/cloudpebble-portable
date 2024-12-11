local ProjectFiles = require('ProjectFiles')
local DownloadBundle = require('DownloadBundle')
local NpmInstall = require('NpmInstall')
local ConcatJavascript = require('ConcatJavascript')
local IncrementalBuild = require('IncrementalBuild')

local can_skip = tonumber(GetParam('can_skip')) == 1

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

local build_info = { type = 'full' }
local container_app_dir = path.join(rootfs_dir, 'pebble/app');
-- if last build was a success, let's try to build incrementally
if lastId ~= 0 and builds[1].state == 3 and path.exists(container_app_dir) then
    build_info = IncrementalBuild.detectBuildType(app_info, container_app_dir)
    Log(kLogInfo, 'Build type determined as ' .. build_info.type)
    if can_skip and build_info.type == 'unchanged' then
        SetStatus(200)
        SetHeader('Content-Type', 'application/json; charset=utf-8')
        Write(EncodeJson({
            success = true,
            reason = "Files weren't changed. Skipping the build"
        }))
        return
    end
end

assert(unix.makedirs('.pebble/builds'))

local build_uuid = UuidV4();
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

local assembled_dir = path.join(rootfs_dir, 'pebble/assembled');

-- TODO: handle build_type == 'only_js'
if not build_info or build_info.type == 'full' then
    if path.exists(container_app_dir) then
        assert_fail_build(unix.rmrf(container_app_dir));
        assert_fail_build(unix.rmrf(assembled_dir));
    end
    assert_fail_build(unix.mkdir(container_app_dir));
    assert_fail_build(unix.mkdir(assembled_dir));
    assert_fail_build(unix.makedirs(path.join(assembled_dir, 'resources/fonts')))
    assert_fail_build(unix.makedirs(path.join(assembled_dir, 'resources/images')))
    assert_fail_build(unix.makedirs(path.join(assembled_dir, 'resources/data')))

    ProjectFiles.copyTo(app_info, container_app_dir)
    ProjectFiles.copyTo(app_info, assembled_dir)
else
    for _, file_path in ipairs(build_info.remove) do
        assert_fail_build(unix.unlink(path.join(container_app_dir, file_path)))
        assert_fail_build(unix.unlink(path.join(assembled_dir, file_path)))
    end
    for _, file_path in ipairs(build_info.copy) do
        ProjectFiles.copyOneFile(file_path, container_app_dir)
        ProjectFiles.copyOneFile(file_path, assembled_dir)
    end
end

-- TODO: concat JS also for PebbleJs projects
if app_info.enableMultiJS and app_info.projectType == 'native' then
    NpmInstall.installTo(app_info, path.join(container_app_dir, 'src/pkjs'), assert_fail_build)
    app_info.enableMultiJS = false
    app_info.dependencies = {}
    ProjectFiles.saveAppInfoTo(app_info, container_app_dir)
    ConcatJavascript.concat(app_info, container_app_dir, rootfs_dir, assert_fail_build)
    -- TODO: always use standard wscript same as original CloudPebble is doing
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

    local build_dir = path.join(rootfs_dir, 'pebble/assembled/build')
    local pbw = assert_fail_build(Slurp(path.join(build_dir, 'assembled.pbw')))
    assert_fail_build(Barf('.pebble/builds/' .. build_uuid .. '.pbw', pbw))
    local pjs = assert_fail_build(Slurp(path.join(build_dir, 'pebble-js-app.js')))
    assert_fail_build(Barf('.pebble/builds/' .. build_uuid .. '.js', pjs))
    local sizeInfo = {}
    for _, p in ipairs(app_info.targetPlatforms) do
        local app_stat = assert_fail_build(unix.stat(path.join(build_dir, p, 'pebble-app.bin')))
        local res_stat = assert_fail_build(unix.stat(path.join(build_dir, p, 'app_resources.pbpack')))
        sizeInfo[p] = { app = app_stat:size(), resources = res_stat:size() }
    end
    current_build.state = 3
    current_build.finished = math.floor(GetTime() * 1000)
    current_build.sizes = sizeInfo
    assert(Barf(build_db_filename, EncodeJson(builds)))
    Log(kLogWarn, 'finalization complete')

end
