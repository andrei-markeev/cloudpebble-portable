local file_path = GetParam('file_path');
local old_name = GetParam('old_name');
local new_name = GetParam('new_name');
local modified = tonumber(GetParam('modified'));
if file_path == '' or file_path == nil or old_name == nil or old_name == '' or new_name == nil or modified == nil then
    ServeError(400)
    return;
end

if new_name == '' then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='File name should not be empty!'
    }))
    return;
end

local project_dir = file_path:sub(1, #file_path - #old_name);
local new_file_path = project_dir .. new_name;

local stat = assert(unix.stat(file_path));
if stat:mtim() ~= modified then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='File was modified since last save! Please either reload or save before renaming.'
    }))
    return;
end

local success, err = unix.rename(file_path, new_file_path);
if err ~= nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='Renaming the file failed: ' .. err:name() .. ' ' .. err:doc()
    }))
    return;
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true,
    file_path = new_file_path,
    modified = stat:mtim()
}))
