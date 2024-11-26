local ProjectFiles = {}

---@alias AppInfo {
    ---projectType: 'native' | 'rocky' | 'package' | 'pebblejs' | 'simplyjs',
    ---name: string,
    ---last_modified: number,
    ---uuid: string,
    ---companyName: string,
    ---shortName: string,
    ---longName: string,
    ---versionLabel: string,
    ---watchapp: { watchface: boolean, hiddenApp: boolean },
    ---capabilities: string[],
    ---sdkVersion: string,
    ---targetPlatforms: ('aplite' | 'basalt' | 'chalk' | 'diorite' | 'emery')[],
    ---enableMultiJS: boolean,
    ---menu_icon: string | nil,
    ---resources: {media: any} | nil}

---@return AppInfo
---@overload fun(): nil, string
function ProjectFiles.getAppInfo()
    local appinfo_filename = 'appinfo.json'
    local file_contents = Slurp(appinfo_filename)
    if file_contents == nil then
        appinfo_filename = 'package.json'
        file_contents = Slurp(appinfo_filename, unix.O_RDONLY)
    end

    if file_contents == nil then
        return nil, 'Neither appinfo.json nor package.json found in the working directory!'
    end

    local app_info, err = DecodeJson(file_contents)--[[@as any]];
    if appinfo_filename == 'package.json' and app_info ~= nil then
        app_info = app_info--[[@as any]].pebble
    end
   
    return app_info, err
end

---@param app_info AppInfo
---@param dir string
function ProjectFiles.getFileTarget(app_info, dir)
    local target = nil;

    if app_info.projectType == 'package' and dir == 'src/resources' then
        target = 'resource'
    elseif app_info.projectType ~= 'package' and dir == 'resources' then
        target = 'resource'
    elseif app_info.projectType == 'native' then
        if dir == 'src' then
            target = 'app'
        elseif dir == 'src/pkjs' or dir == 'src/js' then
            target = 'pkjs'
        elseif dir == 'worker_src/c' then
            target = 'worker'
        end
    elseif app_info.projectType == 'simplyjs' and dir == 'src/js' then
        target = 'app'
    elseif app_info.projectType == 'pebblejs' and dir == 'src' then
        target = 'app'
    elseif app_info.projectType == 'rocky' then
        if dir == 'src/rocky' then
            target = 'app'
        elseif dir == 'src/pkjs' then
            target = 'pkjs'
        elseif dir == 'src/common' then
            target = 'common'
        end
    elseif app_info.projectType == 'package' then
        if dir == 'src/c' then
            target = 'app'
        elseif dir == 'src/js' then
            target = 'pkjs'
        elseif dir == 'include' then
            target = 'public'
        end
    end

    return target;
end

---@param app_info AppInfo
---@param target 'unknown' | 'app' | 'pkjs' | 'worker' | 'common' | 'public' | 'resource'
---@param file_name string
function ProjectFiles.isValidExtension(app_info, target, file_name)

    if target == 'unknown' or target == 'resource' then
        return true
    end

    local is_js_target = target == 'pkjs' or target == 'common'
    local is_js_project = app_info.projectType == 'pebblejs' or app_info.projectType == 'simplyjs' or app_info.projectType == 'rocky'
    
    if is_js_project or is_js_target then
        return string.sub(file_name, -3) == '.js' or string.sub(file_name, -5) == '.json'
    else
        return string.sub(file_name, -2) == '.c' or string.sub(file_name, -2) == '.h'
    end

end

---@param app_info AppInfo
---@param target_dir string
function ProjectFiles.copyTo(app_info, target_dir)

    ---@param dir string
    ---@param target 'unknown' | 'app' | 'pkjs' | 'worker' | 'common' | 'public' | 'resource'
    local function copy_project_files (dir, target)
        for name, kind in assert(unix.opendir(dir)) do
            if string.sub(name, 1, 1) ~= '.' then
                if kind == unix.DT_DIR then
                    local child_dir = ''
                    if dir == '.' then
                        child_dir = name
                    else
                        child_dir = path.join(dir, name)
                    end

                    local child_target = ProjectFiles.getFileTarget(app_info, dir);
                    copy_project_files(child_dir, child_target)
                elseif kind == unix.DT_REG then
                    local base_dir = dir
                    if base_dir == '.' then
                        base_dir = ''
                    end
                    local is_package_json = base_dir == '' and name == 'package.json';
                    local is_appinfo_json = base_dir == '' and name == 'appinfo.json';
                    local is_wscript = base_dir == '' and name == 'wscript';
                    if is_package_json or is_appinfo_json or is_wscript or target ~= 'unknown' then
                        Log(kLogInfo, 'Copying from ' .. path.join(base_dir, name) .. ' to ' .. path.join(target_dir, base_dir, name))
                        assert(unix.makedirs(path.join(target_dir, base_dir)))
                        local contents = assert(Slurp(path.join(base_dir, name)))
                        assert(Barf(path.join(target_dir, base_dir, name), contents))
                    end
                end
            end
        end
    end

    copy_project_files('.', 'unknown')

end

return ProjectFiles;