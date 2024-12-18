local MultipartData = require("MultipartData")
local ProjectFiles = require("ProjectFiles")
local ResourceVariants = require("ResourceVariants")

local file_name = GetParam('file_name')

local multipart_data = MultipartData.new(GetBody(), GetHeader('Content-Type'))
local updated_file_name = multipart_data:get('file_name').value
local kind = multipart_data:get('kind').value
local resource_ids_str = multipart_data:get('resource_ids').value
-- [tag_ids_before, tag_ids_after][]
local variants_str = multipart_data:get('variants').value
-- [tag_ids, new_file_index][]
local replacements_str = multipart_data:get('replacements').value
local replacement_files = multipart_data:get_as_array('replacement_files[]')
local file = multipart_data:get('file')
local new_tags = multipart_data:get('new_tags')

if file_name == '' or file_name == nil then
    ServeError(400)
    return;
end

if file ~= nil and new_tags == nil then
    ServeError(400)
    return;
end

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

local variants = DecodeJson(variants_str)--[[@as [ number[], number[] ][] ]]

local replacements = DecodeJson(replacements_str)--[[@as [ number[], number ][] ]]

local resource_ids = DecodeJson(resource_ids_str)--[[@as ResourceIdParam[] ]];
local resource_ids_dict = {}
for _, r in ipairs(resource_ids) do
    resource_ids_dict[r.id] = r
    r["add"] = true
end

local updated_dir = ResourceVariants.getFolder(kind)
local updated_file_path = path.join(updated_dir, updated_file_name);

---@type MediaItem[]
local new_media = {}
for _, r in ipairs(app_info.resources.media) do
    if path.basename(r.file) == file_name then
        local resource_id = resource_ids_dict[r.name]
        if resource_id then
            resource_id["add"] = false
            table.insert(new_media, {
                name = resource_id.id,
                file = updated_file_path,
                type = kind,
                menuIcon = r.menuIcon,
                targetPlatforms = resource_id.target_platforms,
                characterRegex = resource_id.regex,
                trackingAdjust = resource_id.tracking,
                compatibility = resource_id.compatibility,
                memoryFormat = resource_id.memory_format,
                storageFormat = resource_id.storage_format,
                spaceOptimization = resource_id.space_optimisation
            })
        end
    else
        table.insert(new_media, r)
    end
end

for _, rid in ipairs(resource_ids) do
    if rid["add"] then
        table.insert(new_media, {
            name = rid.id,
            file = updated_file_path,
            type = kind,
            menuIcon = false,
            targetPlatforms = rid.target_platforms,
            characterRegex = rid.regex,
            trackingAdjust = rid.tracking,
            compatibility = rid.compatibility,
            memoryFormat = rid.memory_format,
            storageFormat = rid.storage_format,
            spaceOptimization = rid.space_optimisation
        })
    end
end

app_info.resources.media = new_media
ProjectFiles.saveAppInfo(app_info)

local function arrayEqual(a1, a2)
    if #a1 ~= #a2 then
      return false
    end

    for i, v in ipairs(a1) do
      if v ~= a2[i] then
        return false
      end
    end

    return true
end

local resource_files = ProjectFiles.findFiles(app_info.projectType, 'resource')
for _, file_info in ipairs(resource_files) do
    local file_path = path.join(file_info.dir, file_info.name)
    local root_fname, tags = ResourceVariants.findTags(file_info.name);
    if root_fname == file_name then
        for _, v in ipairs(variants) do
            local old_tags = v[1]
            local new_tags = v[2]
            if arrayEqual(old_tags, tags) then
                local updated_file_path_with_tags = path.join(file_info.dir, ResourceVariants.getFileName(updated_file_name, new_tags));
                Log(kLogInfo, 'Renaming ' .. file_path .. ' to ' .. updated_file_path_with_tags)
                assert(unix.rename(file_path, updated_file_path_with_tags));
            end
        end
        for _, v in ipairs(replacements) do
            local repl_tags = v[1]
            local repl_index = v[2]
            if arrayEqual(repl_tags, tags) then
                Log(kLogInfo, 'Replacing file ' .. file_path)
                Barf(file_path, replacement_files[repl_index + 1])
            end
        end
    end
end

if file ~= nil and new_tags ~= nil then
    local new_tag_ids = DecodeJson(new_tags.value)--[[@as number[] ]];
    local new_file_name = ResourceVariants.getFileName(file_name, new_tag_ids)
    local new_folder = ResourceVariants.getFolder(kind)
    local new_file_path = path.join('resources', new_folder, new_file_name)
    Log(kLogInfo, 'Creating new file ' .. new_file_path)
    Barf(new_file_path, file.value)
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true
}))
