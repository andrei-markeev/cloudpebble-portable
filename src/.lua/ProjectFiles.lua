local ProjectFiles = {}

---@alias TargetPlatform 'aplite' | 'basalt' | 'chalk' | 'diorite' | 'emery'

---@alias ProjectFileTarget 'unknown' | 'app' | 'pkjs' | 'worker' | 'common' | 'public' | 'resource' | 'manifest' | 'wscript'

---@alias MediaItem {
    ---file: string,
    ---name: string,
    ---type: 'raw' | 'font' | 'bitmap' | 'pbi' | 'png-trans' | 'png',
    ---menuIcon?: boolean,
    ---targetPlatforms?: TargetPlatform[] | nil,
    ---characterRegex?: string,
    ---trackingAdjust?: number,
    ---compatibility?: string,
    ---memoryFormat?: 'Smallest' | 'SmallestPalette' | '1Bit' | '8Bit' | '1BitPalette' | '2BitPalette' | '4BitPalette',
    ---storageFormat?: 'pbi' | 'png',
    ---spaceOptimization?: 'storage' | 'memory',
---}

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
    ---appKeys: [string, number][], 
    ---capabilities: string[],
    ---sdkVersion: string,
    ---targetPlatforms: ('aplite' | 'basalt' | 'chalk' | 'diorite' | 'emery')[],
    ---enableMultiJS: boolean,
    ---menu_icon: string | nil,
    ---resources: { media: MediaItem[] },
---}

---@return AppInfo
---@overload fun(): nil, string
function ProjectFiles.getAppInfo()
    local appinfo_filename = 'appinfo.json'
    local file_contents = Slurp(appinfo_filename)
    if file_contents == nil then
        appinfo_filename = 'package.json'
        file_contents = Slurp(appinfo_filename)
    end

    if file_contents == nil then
        return nil, 'Neither appinfo.json nor package.json found in the working directory!'
    end

    ---@type AppInfo
    local app_info;

    local file_object--[[@type { name: string, author: string, version: string, pebble: any } ]], err = DecodeJson(file_contents)--[[@as any]];
    if file_object ~= nil then
        if appinfo_filename == 'package.json' then
            if file_object.pebble == nil then
                return nil, 'package.json has invalid format (field "pebble" not found)!'
            end
            app_info = file_object.pebble
            app_info.shortName = file_object.name
            app_info.companyName = file_object.author
            app_info.versionLabel = file_object.version
            app_info.longName = file_object.pebble.displayName
            app_info.appKeys = file_object.pebble.messageKeys
        else
            app_info = file_object--[[@as AppInfo]]
        end
    end

    return app_info, err
end

---@param app_info AppInfo
function ProjectFiles.saveAppInfo(app_info)
    if path.exists('appinfo.json') then
        Barf('appinfo.json', EncodeJson(app_info))
        return true
    end

    local file_contents, err = Slurp('package.json')
    if err ~= nil then
        return false, err
    end

    local file_object, err = DecodeJson(file_contents)--[[@as any]];
    if err ~= nil then
        return false, err
    end

    local pkgjson_object = file_object--[[@as { name: string, author: string, version: string, pebble: any }]]
    pkgjson_object.name = app_info.shortName
    pkgjson_object.author = app_info.companyName
    pkgjson_object.version = app_info.versionLabel
    pkgjson_object.pebble.uuid = app_info.uuid
    pkgjson_object.pebble.displayName = app_info.longName
    pkgjson_object.pebble.projectType = app_info.projectType
    pkgjson_object.pebble.watchapp = app_info.watchapp
    pkgjson_object.pebble.capabilities = app_info.capabilities
    pkgjson_object.pebble.sdkVersion = app_info.sdkVersion
    pkgjson_object.pebble.messageKeys = app_info.appKeys
    pkgjson_object.pebble.enableMultiJS = app_info.enableMultiJS
    pkgjson_object.pebble.targetPlatforms = app_info.targetPlatforms
    pkgjson_object.pebble.resources = app_info.resources
    Barf('package.json', assert(EncodeJson(pkgjson_object, { pretty = true })--[[@as string]]))

end

---@param app_info AppInfo
---@param dir string
---@return ProjectFileTarget | nil
function ProjectFiles.getFileTarget(app_info, dir)

    ---@type ProjectFileTarget | nil
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
---@param target ProjectFileTarget
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
---@param find_target ProjectFileTarget | 'all'
---@return { dir: string, name: string, target: ProjectFileTarget }[]
function ProjectFiles.findFiles(app_info, find_target)

    ---@type { dir: string, name: string, target: ProjectFileTarget }[]
    local result = {}

    ---@param dir string
    ---@param target ProjectFileTarget
    local function findRecursive(dir, target)
        for name, kind in assert(unix.opendir(dir or '.')) do
            if string.sub(name, 1, 1) ~= '.' then
                if kind == unix.DT_DIR then
                    local child_target = ProjectFiles.getFileTarget(app_info, dir)
                    local child_dir = path.join(dir, name)
                    findRecursive(child_dir, child_target)
                elseif kind == unix.DT_REG then
                    local file_target = target
                    if not dir and name == 'wscript' then
                        file_target = 'wscript'
                    elseif not dir and (name == 'appinfo.json' or name == 'package.json') then
                        file_target = 'manifest'
                    end
                    if file_target == find_target or find_target == 'all' then
                        table.insert(result, { dir = dir, name = name, target = file_target })
                    end
                end
            end
        end
    end

    findRecursive(nil, 'unknown')

    return result;
end

---@param app_info AppInfo
---@param target_dir string
function ProjectFiles.copyTo(app_info, target_dir)

    local file_list = ProjectFiles.findFiles(app_info, 'all')

    for _, file_info in ipairs(file_list) do
        if file_info.target ~= 'unknown' then
            local file_path = path.join(file_info.dir, file_info.name);
            local target_file_path = path.join(target_dir, file_path)
            Log(kLogInfo, 'Copying from ' .. file_path .. ' to ' .. target_file_path)
            assert(unix.makedirs(path.join(target_dir, file_info.dir)))
            local contents = assert(Slurp(file_path))
            assert(Barf(target_file_path, contents))
        end
    end

end

return ProjectFiles;