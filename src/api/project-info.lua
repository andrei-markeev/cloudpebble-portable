local ProjectFiles = require('ProjectFiles')
local ResourceVariants = require('ResourceVariants')

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

local all_files = ProjectFiles.findFiles(app_info, 'all')
local files = {};
local resource_variants = {};
for _, file_info in ipairs(all_files) do
    local file_path = assert(path.join(file_info.dir, file_info.name))

    if file_info.target == 'resource' then

        if string.find(file_info.name, '~', 1, true) ~= nil then
            local root_file_name, tag_ids_or_err = ResourceVariants.findTags(file_info.name);
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
        else
            if resource_variants[file_info.name] == nil then
                resource_variants[file_info.name] = {}
            end
            table.insert(resource_variants[file_info.name], { [0] = false });
        end

    elseif file_info.target ~= 'unknown' and file_info.target ~= 'wscript' and file_info.target ~= 'manifest' then

        if ProjectFiles.isValidExtension(app_info, file_info.target, file_info.name) then
            local path_under_src = file_path
            if path_under_src:sub(1, 4) == 'src/' then
                path_under_src = path_under_src:sub(5)
            end
            local stat = assert(unix.stat(file_path));
            table.insert(files, {
                name = path_under_src,
                target = file_info.target,
                file_path = file_path,
                lastModified = stat:mtim()
            });
        end

    end
end

local resources_by_root_filename = {}
local resources = {}
local menu_icon_id = nil
if app_info.resources ~= nil and app_info.resources.media ~= nil then
    for _, r in ipairs(app_info.resources.media) do
        local skip = false
        if app_info.projectType == 'pebblejs' or app_info.projectType == 'simplyjs' then
            if r.name == 'MONO_FONT_14' or r.name == 'IMAGE_MENU_ICON' or r.name == 'IMAGE_LOGO_SPLASH' or r.name == 'IMAGE_TILE_SPLASH' then
                skip = true
            end
        end

        if not skip then
            local root_file_name = path.basename(r.file)
            local variants = {}
            if resource_variants[root_file_name] then
                variants = resource_variants[root_file_name]
            else
                variants = { { [0] = false } }
            end
            if r.menuIcon then
                menu_icon_id = r.name
            end
            local resource_id = {
                id = r.name,
                target_platforms = r.targetPlatforms,
                regex = r.characterRegex,
                tracking = r.trackingAdjust,
                compatibility = r.compatibility,
                memory_format = r.memoryFormat,
                storage_format = r.storageFormat,
                space_optimisation = r.spaceOptimization
            }
            if not resources_by_root_filename[root_file_name] then
                resources_by_root_filename[root_file_name] = {
                    id = root_file_name,
                    identifiers = { r.name },
                    file_name = root_file_name,
                    kind = r.type,
                    variants = variants,
                    resource_ids = { resource_id }
                }
                table.insert(resources, resources_by_root_filename[root_file_name])
            else
                table.insert(resources_by_root_filename[root_file_name].identifiers, r.name)
                table.insert(resources_by_root_filename[root_file_name].resource_ids, resource_id)
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
    parsed_app_keys = app_info.appKeys,
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
    menu_icon = menu_icon_id,
    source_files = files,
    resources = resources,
    supported_platforms = supported_platforms
}))
