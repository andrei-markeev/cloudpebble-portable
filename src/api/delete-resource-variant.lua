local ResourceVariants = require('ResourceVariants')

local file_name = GetParam('file_name');
local kind = GetParam('kind');
if file_name == '' or file_name == nil or kind == '' or kind == nil then
    ServeError(400)
    return;
end

local folder = ResourceVariants.getFolder(kind)
local file_path = path.join('resources', folder, file_name)

local _, err = unix.unlink(file_path);
if err ~= nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='Deleting file ' .. file_path .. ' failed: ' .. err:name() .. ' ' .. err:doc()
    }))
    return;
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true
}))
