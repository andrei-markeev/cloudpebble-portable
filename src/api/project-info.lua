local fd, err = unix.open('appinfo.json', unix.O_RDONLY)
if err then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='appinfo.json not found in the working directory!'
    }))
    return;
end;

local file_contents = unix.read(fd);
unix.close(fd);

local app_info = DecodeJson(file_contents);
if app_info == nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='appinfo.json contains incorrect json: ' .. err
    }))
    return;
end

local files = {};
function readdir (dir, target)
    for name, kind, ino, off in assert(unix.opendir(dir)) do
        if string.sub(name, 1, 1) ~= '.' and name ~= "appinfo.json" and name ~= 'cloudpebble-portable.com' and name ~= 'resources' then
            if kind == unix.DT_DIR then
                local child_dir = ''
                local child_target = target

                if dir == '.' then
                    child_dir = name
                else
                    child_dir = path.join(dir, name)
                end

                if app_info.projectType == 'native' and child_dir == 'worker_src/c' then
                    child_target = 'worker'
                elseif child_dir == 'src/pkjs' then
                    child_target = 'pkjs'
                elseif app_info.projectType == 'rocky' and child_dir == 'src/common' then
                    child_target = 'common'
                elseif app_info.projectType == 'package' and child_dir == 'include' then
                    child_target = 'public'
                elseif app_info.projectType == 'package' and child_dir == 'src/js' then
                    child_target = 'pkjs'
                end

                readdir(child_dir, child_target);
            elseif kind == unix.DT_REG then

                local stat = assert(unix.fstat(fd));
                local file_path = path.join(dir, name);
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

readdir(".", "app");

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
    -- TODO
    -- 'app_modern_multi_js': project.app_modern_multi_js,
    -- 'menu_icon': project.menu_icon.id if project.menu_icon else None,
    source_files = files
    -- resources: [{
                --       'id': x.id,
                --       'file_name': x.file_name,
                --       'kind': x.kind,
                --       'identifiers': [y.resource_id for y in x.identifiers.all()],
                --       'extra': {y.resource_id: y.get_options_dict(with_id=False) for y in x.identifiers.all()},
                --       'variants': [y.get_tags() for y in x.variants.all()],
                --   } for x in resources],
    -- TODO is it different from targetPlatforms?
    -- 'supported_platforms': project.supported_platforms

}))
