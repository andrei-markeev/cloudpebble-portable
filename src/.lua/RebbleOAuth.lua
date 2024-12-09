local RebbleOAuth = {}

RebbleOAuth.token = nil

function RebbleOAuth.handleCallback()
    local code = GetParam('code')
    if code == nil then
        local error = GetParam('error');
        if error ~= nil then
            ServeRedirect(302, 'http://localhost:8080/rebble-oauth-callback.html?error=' .. error)
        else
            ServeError(400)
        end
    end

    local status, headers, body = Fetch('https://auth.rebble.io/oauth/token', {
        method = 'POST',
        headers = { ['Content-Type'] = 'application/x-www-form-urlencoded' },
        body = 'grant_type=authorization_code'
            .. '&code=' .. code
            .. '&client_id=b576399e9d1fdaa8e666a4dffbbdd1'
            .. '&client_secret=DaJt7qHRAxmZ4E-ZTYWm4M04GKBZ363GZgPS0kdj3qg'
            .. '&redirect_uri=http://localhost:60000/'
    })
    if status ~= 200 then
        Log(kLogWarn, 'Request to token endpoint failed: ' .. tostring(status) .. '\nHeaders: ' .. EncodeJson(headers) .. '\nBody: ' .. body)
        ServeRedirect(302, 'http://localhost:8080/rebble-oauth-callback.html?error=' .. status)
    end

    local parsed = DecodeJson(body)--[[@as any]]
    if parsed.access_token == nil then
        Log(kLogWarn, 'Token endpoint returned unexpected data: ' .. body)
        ServeRedirect(302, 'http://localhost:8080/rebble-oauth-callback.html?error=Unexpected%20data')
    end

    -- TODO: token expiration
    local _, err = Barf('.pebble/rebble_token', parsed.access_token)
    if err ~= nil then
        ServeRedirect(302, 'http://localhost:8080/rebble-oauth-callback.html?error=' .. err)
    end
    ServeRedirect(302, 'http://localhost:8080/rebble-oauth-callback.html?success=1')
end

function RebbleOAuth.getToken()
    return Slurp('.pebble/rebble_token')
end

return RebbleOAuth;