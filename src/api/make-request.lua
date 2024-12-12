local url = GetHeader("X-Url")
local method = GetHeader("X-Method")
local body = GetBody();

local headers = {}
for header, value in pairs(GetHeaders()) do
    if header:lower():sub(1, 6) == 'x-cpp-' then
        Log(kLogInfo, "Adding header to request: " .. header:sub(7) .. ": " .. value)
        headers[header:sub(7)] = value;
    end
end

local responseStatus, responseHeaders, responseBody = Fetch(url, { method = method, body = body, headers = headers })

if responseStatus == nil then
    SetStatus(500)
    SetHeader("Content-Type", "text/plain")
    Write(responseHeaders--[[@as string]])
    return
end

SetStatus(responseStatus)
for header, value in pairs(responseHeaders--[[@as table<string, string>]]) do
    if header:lower() ~= "transfer-encoding" and header:lower() ~= "content-length" then
        SetHeader(header, value)
    end
end
Write(responseBody)
