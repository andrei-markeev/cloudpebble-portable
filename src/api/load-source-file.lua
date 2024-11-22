local file_path = GetParam('file_path');
if file_path == '' or file_path == nil then
    SetStatus(400)
    return;
end

local fd, err = unix.open(file_path, unix.O_RDONLY);
if err ~= nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='Failed to open file! Error ' .. tostring(err)
    }))
    return;
end
local file_contents = unix.read(fd);
unix.close(fd);

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success=true,
    source = file_contents,
    -- TODO: 'modified': time.mktime(source_file.last_modified.utctimetuple()),
    folded_lines = {}
}))
