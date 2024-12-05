local ProjectFiles = require('ProjectFiles')

local sdk_version = GetParam('sdk_version')
local app_short_name = GetParam('app_short_name')
local app_long_name = GetParam('app_long_name')
local app_company_name = GetParam('app_company_name')
local app_version_label = GetParam('app_version_label')
local app_uuid = GetParam('app_uuid')
local app_capabilities = GetParam('app_capabilities')
local app_is_watchface = GetParam('app_is_watchface')
local app_is_hidden = GetParam('app_is_hidden')
local app_is_shown_on_communication = GetParam('app_is_shown_on_communication')
local app_keys = GetParam('app_keys')
local menu_icon = GetParam('menu_icon')
local app_platforms = GetParam('app_platforms')
local app_modern_multi_js = GetParam('app_modern_multi_js')

local app_info = assert(ProjectFiles.getAppInfo())

app_info.uuid = app_uuid
app_info.companyName = app_company_name
app_info.shortName = app_short_name
app_info.longName = app_long_name
app_info.versionLabel = app_version_label
app_info.sdkVersion = sdk_version
app_info.watchapp.watchface = app_is_watchface == "1"
app_info.watchapp.hiddenApp = app_is_hidden == "1"
app_info.watchapp.onlyShownOnCommunication = app_is_shown_on_communication == "1"
app_info.enableMultiJS = app_modern_multi_js == "1"
app_info.capabilities = DecodeJson(app_capabilities)--[[@as any]]
app_info.targetPlatforms = DecodeJson(app_platforms)--[[@as any]]
app_info.appKeys = DecodeJson(app_keys)--[[@as any]]

for _, r in ipairs(app_info.resources.media) do
    r.menuIcon = nil
    if menu_icon == path.basename(r.file) then
        r.menuIcon = true
    end
end

local _, err = ProjectFiles.saveAppInfo(app_info)
if err ~= nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = true,
        error = 'Saving failed: ' .. err:name() .. ' ' .. err:doc()
    }))
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true
}))