local ProjectFiles = require('ProjectFiles')

local file_name = GetParam('name');
if file_name == '' or file_name == nil then
    ServeError(400)
    return;
end

local target = GetParam('target');
if target == nil then target = 'app' end

local content = GetParam('content');
if not content then
    content = ''
end

local app_info, err = ProjectFiles.getAppInfo()
if app_info == nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error=err
    }))
    return
end

local project_dir = '';
if app_info.projectType == 'native' then
    if target == 'app' then
        project_dir = 'src/c'
    elseif target == 'worker' then
        project_dir = 'worker_src/c'
    elseif target == 'pkjs' then
        project_dir = 'src/pkjs'
    end
elseif app_info.projectType == 'pebblejs' then
    if target == 'app' then
        project_dir = 'src/js'
    end
elseif app_info.projectType == 'simplyjs' then
    if target == 'app' then
        project_dir = 'src'
    end
elseif app_info.projectType == 'rocky' then
    if target == 'app' then
        project_dir = 'src/rocky'
    elseif target == 'pkjs' then
        project_dir = 'src/pkjs'
    elseif target == 'common' then
        project_dir = 'src/common'
    end
elseif app_info.projectType == 'package' then
    if target == 'app' then
        project_dir = 'src/c'
    elseif target == 'public' then
        project_dir = 'include'
    elseif target == 'pkjs' then
        project_dir = 'src/js'
    end
end

unix.makedirs(project_dir);
local file_path = project_dir .. '/' .. file_name;

local _, err = Barf(file_path, content);
if err ~= nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    local error_message = 'Failed to create file! Error ' .. tostring(err)
    if err == unix.EEXIST then
        error_message = 'File already exists in the file system! Please refresh the page.'
    end
    Write(EncodeJson({
        success=false,
        error=error_message
    }))
    return;
end

local path_under_src = file_path
if path_under_src:sub(1, 4) == 'src/' then
    path_under_src = path_under_src:sub(5)
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success=true,
    file={
        name=path_under_src,
        target=target,
        file_path=file_path
    }
}))
