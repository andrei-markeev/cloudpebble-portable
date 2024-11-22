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

local project_dir = '';
local files = {};
local target = 'app';
function readdir (dir)
    for name, kind, ino, off in assert(unix.opendir(dir)) do
        if name ~= '.' and name ~= '..' and name ~= 'appinfo.json' and name ~= 'cloudpebble-portable.com' then
            if kind == unix.DT_DIR then
                if project_dir == '.' then
                    project_dir = name
                else
                    project_dir = path.join(project_dir, name)
                end

                if app_info.projectType == 'native' and project_dir == 'worker_src/c' then
                    target = 'worker'
                elseif project_dir == 'src/pkjs' then
                    target = 'pkjs'
                elseif app_info.projectType == 'rocky' and project_dir == 'src/common' then
                    target = 'common'
                elseif app_info.projectType == 'package' and project_dir == 'include' then
                    target = 'public'
                elseif app_info.projectType == 'package' and project_dir == 'src/js' then
                    target = 'pkjs'
                end

                readdir(project_dir);
            elseif kind == unix.DT_REG then

                local file_path = path.join(project_dir, name);
                if project_dir == '.' then file_path = name end;
                table.insert(files, {
                    name = name,
                    target = target,
                    file_path = file_path
                    -- TODO: lastModified = time.mktime(f.last_modified.utctimetuple())
                });
            end
        end
    end
end

readdir(".");

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
