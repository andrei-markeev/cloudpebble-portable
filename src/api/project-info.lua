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
    ---app_modern_multi_js: boolean,
    ---menu_icon: string | nil,
    ---resources: {media: any} | nil}


local appinfo_filename = 'appinfo.json'
local file_contents = Slurp(appinfo_filename)
if file_contents == nil then

    appinfo_filename = 'package.json'
    file_contents = Slurp(appinfo_filename, unix.O_RDONLY)

    if file_contents == nil then
        SetStatus(200)
        SetHeader('Content-Type', 'application/json; charset=utf-8')
        Write(EncodeJson({
            success=false,
            error='Neither appinfo.json nor package.json found in the working directory!'
        }))
        return;
    end
end;

---@type AppInfo
local app_info, err = DecodeJson(file_contents)--[[@as any]];
if app_info == nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error=appinfo_filename .. ' contains incorrect json: ' .. err
    }))
    return;
end

if appinfo_filename == 'package.json' then
    app_info = app_info--[[@as any]].pebble
end

local tag_map = {
    ['bw'] = 'VARIANT_MONOCHROME',
    ['color'] = 'VARIANT_COLOUR',
    ['rect'] = 'VARIANT_RECT',
    ['round'] = 'VARIANT_ROUND',
    ['aplite'] = 'VARIANT_APLITE',
    ['basalt'] = 'VARIANT_BASALT',
    ['chalk'] = 'VARIANT_CHALK',
    ['diorite'] = 'VARIANT_DIORITE',
    ['emery'] = 'VARIANT_EMERY',
    ['mic'] = 'VARIANT_MIC',
    ['strap'] = 'VARIANT_STRAP',
    ['strappower'] = 'VARIANT_STRAPPOWER',
    ['compass'] = 'VARIANT_COMPASS',
    ['health'] = 'VARIANT_HEALTH',
    ['144w'] = 'VARIANT_144W',
    ['168h'] = 'VARIANT_168H',
    ['180w'] = 'VARIANT_180W',
    ['180h'] = 'VARIANT_180H',
    ['200w'] = 'VARIANT_200W',
    ['228h'] = 'VARIANT_228H',
}

---@param file_name string
---@return string, string[]
---@overload fun(file_name: string): nil, string
local function find_tags (file_name)
    local tag_ids = {}
    local file_name_without_ext, all_tags, ext = string.match(file_name, '^([^~]+)~([^%.]+)%..+$')
    local root_file_name = file_name_without_ext .. '.' .. ext
    for tag in string.gmatch(all_tags, "[^~]+") do
        if tag_map[tag] == nil then
            return nil, 'resource ' .. root_file_name .. ' has incorrect tag ' .. tag .. '!'
        end
        table.insert(tag_ids, tag_map[tag])
    end
    return root_file_name, tag_ids
end

local files = {};
local resource_variants = {};
---@param dir string
---@param target 'unknown' | 'app' | 'pkjs' | 'worker' | 'common' | 'public'
---@param type 'file' | 'resource'
local function readdir (dir, target, type)
    for name, kind in assert(unix.opendir(dir)) do
        if string.sub(name, 1, 1) ~= '.' then
            if kind == unix.DT_DIR then

                local child_dir = ''
                local child_target = target
                local child_type = type

                if dir == '.' then
                    child_dir = name
                else
                    child_dir = path.join(dir, name)
                end

                if app_info.projectType == 'package' and child_dir == 'src/resources' then
                    child_type = 'resource'
                elseif app_info.projectType ~= 'package' and child_dir == 'resources' then
                    child_type = 'resource'
                end

                if app_info.projectType == 'native' then
                    if child_dir == 'src' then
                        child_target = 'app'
                    elseif child_dir == 'src/pkjs' or child_dir == 'src/js' then
                        child_target = 'pkjs'
                    elseif child_dir == 'worker_src/c' then
                        child_target = 'worker'
                    end
                elseif app_info.projectType == 'simplyjs' and child_dir == 'src/js' then
                    child_target = 'app'
                elseif app_info.projectType == 'pebblejs' and child_dir == 'src' then
                    child_target = 'app'
                elseif app_info.projectType == 'rocky' then
                    if child_dir == 'src/rocky' then
                        child_target = 'app'
                    elseif child_dir == 'src/pkjs' then
                        child_target = 'pkjs'
                    elseif child_dir == 'src/common' then
                        child_target = 'common'
                    end
                elseif app_info.projectType == 'package' then
                    if child_dir == 'src/c' then
                        child_target = 'app'
                    elseif child_dir == 'src/js' then
                        child_target = 'pkjs'
                    elseif child_dir == 'include' then
                        child_target = 'public'
                    end
                end

                readdir(child_dir, child_target, child_type);

            elseif kind == unix.DT_REG then

                local file_path = path.join(dir, name);

                if type == 'file' then

                    local is_js_target = target == 'pkjs' or target == 'common'
                    local is_js_project = app_info.projectType == 'pebblejs' or app_info.projectType == 'simplyjs' or app_info.projectType == 'rocky'
                    local is_valid_file
                    if is_js_project or is_js_target then
                        is_valid_file = string.sub(name, -3) == '.js' or string.sub(name, -5) == '.json'
                    else
                        is_valid_file = string.sub(name, -2) == '.c' or string.sub(name, -2) == '.h'
                    end

                    if is_valid_file then
                        local stat = assert(unix.stat(file_path));
                        if dir == '.' then file_path = name end;
                        table.insert(files, {
                            name = name,
                            target = target,
                            file_path = file_path,
                            lastModified = stat:mtim()
                        });
                    end

                elseif type == 'resource' then

                    if string.find(name, '~', 1, true) ~= nil then
                        local root_file_name, tag_ids_or_err = find_tags(name);
                        if root_file_name == nil then
                            SetStatus(200)
                            SetHeader('Content-Type', 'application/json; charset=utf-8')
                            Write(EncodeJson({
                                success=false,
                                error=tag_ids_or_err
                            }))
                            return
                        end

                        if resource_variants[root_file_name] == nil then
                            resource_variants[root_file_name] = {}
                        end
                        table.insert(resource_variants[root_file_name], tag_ids_or_err);
                    end
        
                end
            end
        end
    end
end

readdir(".", "unknown", "file");

local resources = {}
if app_info.resources ~= nil and app_info.resources.media ~= nil then
    for _, r in ipairs(app_info.resources.media) do
        local skip = false
        if app_info.projectType == 'pebblejs' or app_info.projectType == 'simplyjs' then
            if r.name == 'MONO_FONT_14' or r.name == 'IMAGE_MENU_ICON' or r.name == 'IMAGE_LOGO_SPLASH' or r.name == 'IMAGE_TILE_SPLASH' then
                skip = true
            end
        end

        if not skip then
            local variants = {}
            if resource_variants[r.file] then
                variants = resource_variants[r.file]
            else
                variants = { { [0] = false } }
            end

            table.insert(resources, {
                id = r.name,
                identifiers = { r.name },
                file_name = path.basename(r.file),
                kind = r.type,
                variants = variants,
                resource_ids = { [0] = false}
            })
        end
        -- TODO
        -- 'extra': {y.resource_id: y.get_options_dict(with_id=False) for y in x.identifiers.all()},
            -- target_platforms: ('aplite'|'basalt'|'chalk'|'diorite'|'emery')[]
            -- regex: string (which characters to include into the font, e.g. '[0-9:-]')
            -- tracking: boolean
            -- compatibility: ''
            -- memory_format: 'Smallest' | 'SmallestPalette' | '1Bit' | '8Bit' | '1BitPalette' | '2BitPalette' | '4BitPalette'
            -- storage_format: 'pbi' | 'png' | null
            -- space_optimization: 'storage' | 'memory' | null
    end
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success=true,
    type=app_info.projectType,
    name=app_info.shortName,
    -- TODO 'last_modified': str(project.last_modified),
    app_uuid = app_info.uuid,
    app_company_name = app_info.companyName,
    app_short_name = app_info.shortName,
    app_long_name = app_info.longName,
    app_version_label = app_info.versionLabel,
    app_is_watchface = app_info.watchapp.watchface,
    app_is_hidden = app_info.watchapp.hiddenApp,
    -- TODO
    -- app_keys: app_info.appKeys,
    -- parsed_app_keys: ?,
    -- 'app_is_shown_on_communication': project.app_is_shown_on_communication,
    app_capabilities = app_info.capabilities,
    -- TODO
    -- 'app_jshint': project.app_jshint,
    -- 'app_dependencies': project.get_dependencies(include_interdependencies=False),
    -- 'interdependencies': [p.id for p in project.project_dependencies.all()],
    sdk_version = app_info.sdkVersion,
    app_platforms = app_info.targetPlatforms,
    app_modern_multi_js = app_info.app_modern_multi_js,
    -- TODO
    -- 'menu_icon': project.menu_icon.id if project.menu_icon else None,
    source_files = files,
    resources = resources,
    -- TODO is it different from targetPlatforms?
    -- 'supported_platforms': project.supported_platforms

}))
