local build_uuid = GetParam('uuid');
if build_uuid == '' or build_uuid == nil or #build_uuid ~= 36 then
    ServeError(400)
    return;
end

local contents = assert(Slurp('.pebble/builds/' .. build_uuid .. '.log'))
local stat = assert(unix.stat('.pebble/builds/' .. build_uuid .. '.log'))
SetStatus(200)
SetHeader('Content-Type', 'text/plain; charset=utf-8')
Write(EncodeJson({
    success = true,
    log = contents,
    modified = stat:mtim()
}))
