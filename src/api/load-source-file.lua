local file_path = GetParam('file_path');
if file_path == '' or file_path == nil then
    ServeError(400)
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
local file_contents = ''
repeat
    local next_chunk, err = unix.read(fd);
    if err then
        SetStatus(200)
        SetHeader('Content-Type', 'application/json; charset=utf-8')
        Write(EncodeJson({
            success=false,
            error='Reading from file ' .. file_path .. ' failed! Error ' .. tostring(err)
        }))
        return;
    end
    file_contents = file_contents .. next_chunk
until next_chunk == ''
local stat = assert(unix.fstat(fd));
unix.close(fd);

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success=true,
    source = file_contents,
    modified = stat:mtim(),
    folded_lines = {}
}))
