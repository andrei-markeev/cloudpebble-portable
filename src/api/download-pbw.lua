local build_uuid = GetParam('uuid');
if build_uuid == '' or build_uuid == nil or #build_uuid ~= 36 then
    ServeError(400)
    return;
end

local contents = assert(Slurp('.pebble/builds/' .. build_uuid .. '.pbw'))
SetStatus(200)
SetHeader('Content-Type', 'application/octet-stream')
SetHeader('Content-Disposition', 'inline; filename="watchapp.pbw"')
Write(contents)
