local MultipartData = require("MultipartData")
local ProjectFiles = require("ProjectFiles")
local ResourceVariants = require("ResourceVariants")

local multipart_data = MultipartData.new(GetBody(), GetHeader('Content-Type'))
local file_name = multipart_data:get('file_name').value
local kind = multipart_data:get('kind').value
local resource_ids_str = multipart_data:get('resource_ids').value
local file = multipart_data:get('file').value
local new_tags_str = multipart_data:get('new_tags').value

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

local folder = ResourceVariants.getFolder(kind)
local resource_ids = assert(DecodeJson(resource_ids_str))--[[@as ResourceIdParam[] ]];
local resource_id = resource_ids[1]

Log(kLogInfo, resource_ids_str);

table.insert(app_info.resources.media, {
    name = resource_id.id,
    file = path.join(folder, file_name),
    type = kind,
    targetPlatforms = resource_id.target_platforms,
    characterRegex = resource_id.regex,
    trackingAdjust = resource_id.tracking,
    compatibility = resource_id.compatibility,
    memoryFormat = resource_id.memory_format,
    storageFormat = resource_id.storage_format,
    spaceOptimization = resource_id.space_optimisation
})

ProjectFiles.saveAppInfo(app_info)

local new_tag_ids = DecodeJson(new_tags_str)--[[@as number[] ]];
local new_file_name = ResourceVariants.getFileName(file_name, new_tag_ids)
local new_file_path = path.join('resources', folder, new_file_name)
Log(kLogInfo, 'Creating new file ' .. new_file_path)
Barf(new_file_path, file)

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true
}))
