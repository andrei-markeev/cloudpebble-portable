local file_name = GetParam('name');
if file_name == '' or file_name == nil then
    ServeError(400)
    return;
end

local target = GetParam('target');
if target == nil then target = 'app' end

local fd, err = unix.open('appinfo.json', unix.O_RDONLY)
if err ~= nil then
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
local app_info, err = DecodeJson(file_contents);
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

local fd, err = unix.open(file_path, unix.O_WRONLY|unix.O_CREAT|unix.O_EXCL, 0664);
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
unix.close(fd);


SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success=true,
    file={
        name=file_name,
        target=target,
        file_path=file_path
    }
}))
