local file_path = GetParam('file_path');
local modified = tonumber(GetParam('modified'));
if file_path == '' or file_path == nil or modified == nil then
    ServeError(400)
    return;
end

local stat = assert(unix.stat(file_path));

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true,
    safe = stat:mtim() == modified
}))
