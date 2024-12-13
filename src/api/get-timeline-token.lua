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

local uuid = GetParam('uuid')

local status, headers, body = Fetch('https://timeline-sync.rebble.io/v1/tokens/sandbox/' .. uuid, {
    headers = { Authorization = 'Bearer ' .. token },
})
if status ~= 200 then
    Log(kLogWarn, 'Request to timeline token endpoint failed: ' .. tostring(status) .. '\nHeaders: ' .. EncodeJson(headers) .. '\nBody: ' .. body)
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = false,
        error = 'Timeline token endpoint returned ' .. status
    }))
    return
end

local result = DecodeJson(body)--[[@as any]]
result.success = true

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson(result))
