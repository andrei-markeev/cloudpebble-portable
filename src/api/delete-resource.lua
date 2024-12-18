local file_name = GetParam('file_name')

local ProjectFiles = require("ProjectFiles")
local ResourceVariants = require("ResourceVariants")

local app_info, err = ProjectFiles.getAppInfo();
if app_info == nil then
    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success=false,
        error='Failed to load application manifest: ' .. err
    }))
    return;
end

---@type MediaItem[]
local new_media = {}
for _, r in ipairs(app_info.resources.media) do
    if path.basename(r.file) ~= file_name then
        table.insert(new_media, r)
    end
end

app_info.resources.media = new_media
ProjectFiles.saveAppInfo(app_info)

local resource_files = ProjectFiles.findFiles(app_info.projectType, 'resource')
for _, file_info in ipairs(resource_files) do
    local file_path = path.join(file_info.dir, file_info.name)
    local root_fname = ResourceVariants.findTags(file_info.name);
    if root_fname == file_name then
        assert(unix.unlink(file_path));
    end
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true
}))
