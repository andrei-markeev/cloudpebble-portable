---@type any
local builds = Slurp('.pebble/builds/db.json')

if builds ~= nil then
    builds = DecodeJson(builds)
else
    builds = {[0] = false}
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true,
    builds = builds
}))
