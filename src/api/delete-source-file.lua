local file_path = GetParam('file_path');
if file_path == '' or file_path == nil then
    ServeError(400)
    return;
end

local _, err = unix.unlink(file_path);
if err ~= nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='Deleting the file failed: ' .. err:name() .. ' ' .. err:doc()
    }))
    return;
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true
}))
