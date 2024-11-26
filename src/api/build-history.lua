---@type any
local builds = Slurp('.pebble/builds/db.json')
local modified = nil

if builds ~= nil then
    builds = DecodeJson(builds)--[[@as any]]
    local last_log_stat = unix.stat('.pebble/builds/' .. builds[1].uuid .. '.log');
    if last_log_stat ~= nil then
        modified = last_log_stat:mtim()
    end
else
    builds = {[0] = false}
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true,
    builds = builds,
    modified = modified
}))
