local build_uuid = GetParam('uuid');
if build_uuid == '' or build_uuid == nil or #build_uuid ~= 36 then
    ServeError(400)
    return;
end

local contents = assert(Slurp('.pebble/builds/' .. build_uuid .. '.js'))
SetStatus(200)
SetHeader('Content-Type', 'application/javascript')
SetHeader('Content-Disposition', 'inline; filename="pebble-js-app.js"')
Write(contents)
