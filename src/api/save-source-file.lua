local file_path = GetParam('file_path');
if file_path == '' or file_path == nil then
    ServeError(400)
    return;
end

local fd, err = unix.open(file_path, unix.O_WRONLY|unix.O_CREAT|unix.O_TRUNC, 0640);
if err ~= nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='Failed to open file! Error ' .. tostring(err)
    }))
    return;
end
local body = GetBody();
unix.write(fd, body);
local stat = assert(unix.fstat(fd));
unix.close(fd);

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success=true,
    source = body,
    modified = stat:mtim(),
    folded_lines = {}
}))
