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
end

local updated_dir = ResourceVariants.getFolder(kind)
local updated_file_path = path.join(updated_dir, updated_file_name);

---@type MediaItem[]
local new_media = {}
for _, r in ipairs(app_info.resources.media) do
    if path.basename(r.file) == file_name then
        local resource_id = resource_ids_dict[r.name]
        if resource_id then
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

---@param dir string
---@param target 'unknown' | 'app' | 'pkjs' | 'worker' | 'common' | 'public' | 'resource'
local function readdir (dir, target)
    for name, kind in assert(unix.opendir(dir or '.')) do
        if string.sub(name, 1, 1) ~= '.' then
            if kind == unix.DT_DIR then
                local child_target = ProjectFiles.getFileTarget(app_info, dir)
                local child_dir = path.join(dir, name)
                readdir(child_dir, child_target)
            elseif kind == unix.DT_REG then
                if target == 'resource' then
                    local root_fname, tags = ResourceVariants.findTags(name);
                    if root_fname == file_name then
                        for _, v in ipairs(variants) do
                            local old_tags = v[1]
                            local new_tags = v[2]
                            if arrayEqual(old_tags, tags) then
                                local updated_file_path_with_tags = path.join(dir, ResourceVariants.getFileName(updated_file_name, new_tags));
                                Log(kLogInfo, 'Renaming ' .. path.join(dir, name) .. ' to ' .. updated_file_path_with_tags)
                                assert(unix.rename(path.join(dir, name), updated_file_path_with_tags));
                            end
                        end
                        for _, v in ipairs(replacements) do
                            local repl_tags = v[1]
                            local repl_index = v[2]
                            if arrayEqual(repl_tags, tags) then
                                Log(kLogInfo, 'Replacing file ' .. path.join(dir, name))
                                Barf(path.join(dir, name), replacement_files[repl_index + 1])
                            end
                        end
                    end
                end
            end
        end
    end
end

readdir(nil, "unknown");

if file ~= nil and new_tags ~= nil then
    local new_tag_ids = DecodeJson(new_tags.value)--[[@as number[] ]];
    local new_file_name = ResourceVariants.getFileName(file_name, new_tag_ids)
    local new_folder = ResourceVariants.getFolder(kind)
    local new_file_path = path.join('resources', new_folder, new_file_name)
    Log(kLogInfo, 'Creating new file ' .. new_file_path)
    Barf(new_file_path, file.value)
end

--TODO: response

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true
}))
