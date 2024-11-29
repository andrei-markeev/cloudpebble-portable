local file_name = GetParam('file_name');
local kind = GetParam('kind');
if file_name == '' or file_name == nil or kind == '' or kind == nil then
    ServeError(400)
    return;
end

local folder;
local ctype;
if kind == 'font' then
    folder = 'resources/fonts'
    ctype = 'application/octet-stream'
elseif kind == 'raw' then
    folder = 'resources/data'
    ctype = 'application/octet-stream'
else
    folder = 'resources/images'
    ctype = 'image/png'
end

local file_path = path.join(folder, file_name)
local contents = assert(Slurp(file_path))

SetStatus(200)
SetHeader('Content-Type', ctype)
SetHeader('Content-Disposition', 'attachment; filename="' .. file_name .. '"')
Write(contents)
