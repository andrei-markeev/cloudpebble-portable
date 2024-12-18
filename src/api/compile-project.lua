local ProjectFiles = require('ProjectFiles')
local DownloadBundle = require('DownloadBundle')
local NpmInstall = require('NpmInstall')
local ConcatJavascript = require('ConcatJavascript')
local IncrementalBuild = require('IncrementalBuild')
local ZipUtil = require('ZipUtil')

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

if app_info.projectType ~= 'native' and app_info.projectType ~= 'pebblejs' then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = false,
        error = 'Compilation of ' .. app_info.projectType .. ' projects is not supported yet!'
    }))
    return
end

local build_db_filename = '.pebble/builds/db.json';
---@type any
local builds = Slurp(build_db_filename)

local previousBuildId = 0
local previousBuild
if builds ~= nil then
    builds = assert(DecodeJson(builds))--[[@as any]]
    previousBuildId = builds[1].id
    previousBuild = builds[1]
else
    builds = {}
end

local build_info = { type = 'full' }
local assembled_dir = path.join(rootfs_dir, 'pebble/assembled');
-- if previous build was a success, let's try to build incrementally
if previousBuildId ~= 0 and previousBuild.state == 3 and path.exists(assembled_dir) then
    build_info = IncrementalBuild.detectBuildType(app_info, assembled_dir)
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
local current_build = { id = previousBuildId + 1, uuid = build_uuid, state = 1, started = math.floor(GetTime() * 1000) };
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

----------------------------- in the child process --------------------------------------

local function append_to_log(text)
    Log(kLogInfo, '[BUILD LOG] ' .. text)
    local log_fd, err = unix.open(build_log, unix.O_WRONLY | unix.O_CREAT | unix.O_APPEND, 0644)
    if err then
        Log(kLogInfo, 'Cannot open build log! ' .. err:name() .. ' ' .. err:doc())
        return
    end
    local _, err = unix.write(log_fd, text .. '\n')
    if err then
        Log(kLogInfo, 'Failed writing to the build log! ' .. err:name() .. ' ' .. err:doc())
        return
    end
    local _, err = unix.close(log_fd)
    if err then
        Log(kLogInfo, 'Closing the build log file failed! ' .. err:name() .. ' ' .. err:doc())
        return
    end
end

append_to_log('Build type determined as ' .. build_info.type)

if not build_info or build_info.type == 'full' then
    if path.exists(assembled_dir) then
        assert_fail_build(unix.rmrf(assembled_dir));
    end
    assert_fail_build(unix.mkdir(assembled_dir));
    assert_fail_build(unix.mkdir(path.join(assembled_dir, 'resources')))
    assert_fail_build(unix.mkdir(path.join(assembled_dir, 'resources/fonts')))
    assert_fail_build(unix.mkdir(path.join(assembled_dir, 'resources/images')))
    assert_fail_build(unix.mkdir(path.join(assembled_dir, 'resources/data')))

    if app_info.projectType == 'pebblejs' then
        local pebblejs_src_dir = path.join(rootfs_dir, 'pebble/pebblejs')
        local files = ProjectFiles.findFilesAt('native', 'all', pebblejs_src_dir)
        for _, fileInfo in ipairs(files) do
            if fileInfo.target ~= 'manifest' then
                local relative_file_path = path.join(fileInfo.dir, fileInfo.name):sub(#pebblejs_src_dir + 2);
                ProjectFiles.copyOneFile(pebblejs_src_dir, relative_file_path, assembled_dir)
            end
        end
    end

    ProjectFiles.copyTo(app_info.projectType, assembled_dir)
    local wscript
    if app_info.projectType == 'pebblejs' then
        wscript = LoadAsset('.templates/wscript_pebblejs')
    else
        wscript = LoadAsset('.templates/wscript')
    end
    assert_fail_build(Barf(path.join(assembled_dir, 'wscript'), wscript))
else
    for _, file_path in ipairs(build_info.remove) do
        assert_fail_build(unix.unlink(path.join(assembled_dir, file_path)))
    end
    for _, file_path in ipairs(build_info.copy) do
        ProjectFiles.copyOneFile(nil, file_path, assembled_dir)
    end
end

if app_info.projectType == 'native' then
    if app_info.enableMultiJS then
        NpmInstall.installTo(app_info, path.join(assembled_dir, 'src/pkjs'), assert_fail_build)
        app_info.enableMultiJS = false
        app_info.dependencies = {}
        ProjectFiles.saveAppInfoTo(app_info, assembled_dir)
        ConcatJavascript.concatWithLoader(app_info.projectType, assembled_dir, rootfs_dir, assert_fail_build)
    else
        ConcatJavascript.concatRaw(app_info.projectType, assembled_dir, rootfs_dir, assert_fail_build)
    end
elseif app_info.projectType == 'pebblejs' then
    ConcatJavascript.concatWithLoader(app_info.projectType, assembled_dir, rootfs_dir, assert_fail_build)
end

if build_info.type == 'only_js' then
    local pjs = assert_fail_build(Slurp(path.join(assembled_dir, 'src/js/pebble-js-app.js')))
    assert_fail_build(unix.rename(path.join(assembled_dir, 'src/js/pebble-js-app.js'), '.pebble/builds/' .. build_uuid .. '.js'))

    local build_dir = path.join(assembled_dir, 'build')
    local pbw_file_path = path.join(build_dir, 'assembled.pbw');
    Log(kLogInfo, 'update zip started')
    ZipUtil.update(pbw_file_path, 'pebble-js-app.js', '.pebble/builds/' .. build_uuid .. '.pbw', pjs)
    Log(kLogInfo, 'update zip ended')

    current_build.state = 3
    current_build.finished = math.floor(GetTime() * 1000)
    current_build.sizes = previousBuild.sizes
    assert(Barf(build_db_filename, EncodeJson(builds)))
    return
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
            'sh', '-c', 'chroot /mnt/c/' .. string.sub(rootfs_dir, 4) .. ' sh -c pebble/compile.sh'
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
    assert_fail_build(unix.rename(path.join(assembled_dir, 'src/js/pebble-js-app.js'), '.pebble/builds/' .. build_uuid .. '.js'))
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
