local RebbleOAuth = require('RebbleOAuth')

local token = RebbleOAuth.getToken()
if token == nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = false,
        error = 'Rebble authentication required'
    }))
    return
end

local url = GetUrl()
local queryString = ''
local startParam = url:find('?');
if startParam ~= nil then
    queryString = url:sub(startParam)
end

local status, headers, body = Fetch('https://timeline-sync.rebble.io/v1/sync' .. queryString, {
    headers = { Authorization = 'Bearer ' .. token },
})
if status ~= 200 then
    Log(kLogWarn, 'Request to timeline sync endpoint failed: ' .. tostring(status) .. '\nHeaders: ' .. EncodeJson(headers) .. '\nBody: ' .. body)
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = false,
        error = 'Timeline sync endpoint returned ' .. status
    }))
    return
end

local result = DecodeJson(body)--[[@as any]]
result.success = true
if result.syncURL ~= nil then
    result.syncURL = string.gsub(result.syncURL, 'https://timeline%-sync%.rebble%.io/v1/sync', '/api/get-timeline-updates.lua')
end
if result.nextPageURL ~= nil then
    result.nextPageURL = string.gsub(result.nextPageURL, '^https://timeline%-sync%.rebble%.io/v1/sync', '/api/get-timeline-updates.lua')
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson(result))
