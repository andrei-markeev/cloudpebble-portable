local ProjectFiles = require('ProjectFiles')

local app_info, err = ProjectFiles.getAppInfo();
if app_info == nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='Failed to load application manifest: ' .. err
    }))
    return;
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
---@param target 'unknown' | 'app' | 'pkjs' | 'worker' | 'common' | 'public' | 'resource'
local function readdir (dir, target)
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
                if child_target == nil then
                    child_target = target
                end

                readdir(child_dir, child_target);

            elseif kind == unix.DT_REG then

                local file_path = path.join(dir, name);

                if target == 'resource' then

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

                elseif target ~= 'unknown' then

                    if ProjectFiles.isValidExtension(app_info, target, name) then
                        local stat = assert(unix.stat(file_path));
                        if dir == '.' then file_path = name end;
                        table.insert(files, {
                            name = name,
                            target = target,
                            file_path = file_path,
                            lastModified = stat:mtim()
                        });
                    end
       
                end
            end
        end
    end
end

readdir(".", "unknown");

local resources_by_root_filename = {}
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
            local resource_id = {
                id = r.name,
                target_platforms = r.targetPlatforms,
                regex = r.characterRegex,
                tracking = r.trackingAdjust,
                compatibility = r.compatibility,
                memory_format = r.memoryFormat,
                storage_format = r.storage_format,
                space_optimisation = r.space_optimisation
            }
            if not resources_by_root_filename[r.file] then
                resources_by_root_filename[r.file] = {
                    id = path.basename(r.file),
                    identifiers = { r.name },
                    file_name = path.basename(r.file),
                    kind = r.type,
                    variants = variants,
                    resource_ids = { resource_id }
                }
                table.insert(resources, resources_by_root_filename[r.file])
            else
                table.insert(resources_by_root_filename[r.file].identifiers, r.name)
                table.insert(resources_by_root_filename[r.file].resource_ids, resource_id)
            end

        end
    end
end

local supported_platforms = { 'aplite' }
if app_info.sdkVersion ~= '2' then
    table.insert(supported_platforms, "basalt")
    table.insert(supported_platforms, "chalk")
    if app_info.projectType ~= 'pebblejs' then
        table.insert(supported_platforms, "diorite")
        table.insert(supported_platforms, "emery")
    end
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success=true,
    type=app_info.projectType,
    name=app_info.shortName,
    app_uuid = app_info.uuid,
    app_company_name = app_info.companyName,
    app_short_name = app_info.shortName,
    app_long_name = app_info.longName,
    app_version_label = app_info.versionLabel,
    app_is_watchface = app_info.watchapp.watchface,
    app_is_hidden = app_info.watchapp.hiddenApp,
    app_keys = app_info.appKeys,
    parsed_app_keys = app_info.parsed_app_keys,
    -- TODO
    -- 'app_is_shown_on_communication': project.app_is_shown_on_communication,
    app_capabilities = app_info.capabilities,
    -- TODO
    -- 'app_jshint': project.app_jshint,
    -- 'app_dependencies': project.get_dependencies(include_interdependencies=False),
    -- 'interdependencies': [p.id for p in project.project_dependencies.all()],
    sdk_version = app_info.sdkVersion,
    app_platforms = app_info.targetPlatforms,
    app_modern_multi_js = app_info.enableMultiJS,
    -- TODO
    -- 'menu_icon': project.menu_icon.id if project.menu_icon else None,
    source_files = files,
    resources = resources,
    supported_platforms = supported_platforms
}))
