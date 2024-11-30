local ResourceVariants = {}

---@alias ResourceIdParam {
    ---id: string,
    ---target_platforms: string[],
    ---regex: string,
    ---tracking: number,
    ---compatibility: string,
    ---memory_format?: 'Smallest' | 'SmallestPalette' | '1Bit' | '8Bit' | '1BitPalette' | '2BitPalette' | '4BitPalette',
    ---storage_format?: 'pbi' | 'png',
    ---space_optimisation?: 'storage' | 'memory',
---}

local VARIANT_DEFAULT = 0
local VARIANT_MONOCHROME = 1
local VARIANT_COLOUR = 2
local VARIANT_RECT = 3
local VARIANT_ROUND = 4
local VARIANT_APLITE = 5
local VARIANT_BASALT = 6
local VARIANT_CHALK = 7
local VARIANT_DIORITE = 8
local VARIANT_EMERY = 9
local VARIANT_MIC = 10
local VARIANT_STRAP = 11
local VARIANT_STRAPPOWER = 12
local VARIANT_COMPASS = 13
local VARIANT_HEALTH = 14
local VARIANT_144W = 15
local VARIANT_168H = 16
local VARIANT_180W = 17
local VARIANT_180H = 18
local VARIANT_200W = 19
local VARIANT_228H = 20

local tag_map = {
    ['bw'] = VARIANT_MONOCHROME,
    ['color'] = VARIANT_COLOUR,
    ['rect'] = VARIANT_RECT,
    ['round'] = VARIANT_ROUND,
    ['aplite'] = VARIANT_APLITE,
    ['basalt'] = VARIANT_BASALT,
    ['chalk'] = VARIANT_CHALK,
    ['diorite'] = VARIANT_DIORITE,
    ['emery'] = VARIANT_EMERY,
    ['mic'] = VARIANT_MIC,
    ['strap'] = VARIANT_STRAP,
    ['strappower'] = VARIANT_STRAPPOWER,
    ['compass'] = VARIANT_COMPASS,
    ['health'] = VARIANT_HEALTH,
    ['144w'] = VARIANT_144W,
    ['168h'] = VARIANT_168H,
    ['180w'] = VARIANT_180W,
    ['180h'] = VARIANT_180H,
    ['200w'] = VARIANT_200W,
    ['228h'] = VARIANT_228H,
}

local tag_id_map = {
    [VARIANT_MONOCHROME] = 'bw',
    [VARIANT_COLOUR] = 'color',
    [VARIANT_RECT] = 'rect',
    [VARIANT_ROUND] = 'round',
    [VARIANT_APLITE] = 'aplite',
    [VARIANT_BASALT] = 'basalt',
    [VARIANT_CHALK] = 'chalk',
    [VARIANT_DIORITE] = 'diorite',
    [VARIANT_EMERY] = 'emery',
    [VARIANT_MIC] = 'mic',
    [VARIANT_STRAP] = 'strap',
    [VARIANT_STRAPPOWER] = 'strappower',
    [VARIANT_COMPASS] = 'compass',
    [VARIANT_HEALTH] = 'health',
    [VARIANT_144W] = '144w',
    [VARIANT_168H] = '168h',
    [VARIANT_180W] = '180w',
    [VARIANT_180H] = '180h',
    [VARIANT_200W] = '200w',
    [VARIANT_228H] = '228h',
}

---@param file_name string
---@return string, number[]
---@overload fun(file_name: string): nil, string
function ResourceVariants.findTags(file_name)
    local tag_ids = {}
    local file_name_without_ext, all_tags, ext = string.match(file_name, '^([^~]+)~([^%.]+)%.([^%.]+)$')
    if file_name_without_ext == nil then
        return file_name, {}
    end
    local root_file_name = file_name_without_ext .. '.' .. ext
    for tag in string.gmatch(all_tags, "[^~]+") do
        if tag_map[tag] == nil then
            return nil, 'resource ' .. root_file_name .. ' has incorrect tag ' .. tag .. '!'
        end
        table.insert(tag_ids, tag_map[tag])
    end
    return root_file_name, tag_ids
end

---@param root_file_name string
---@param tags number[]
function ResourceVariants.getFileName(root_file_name, tags)
    local filename, ext = assert(string.match(root_file_name, '^(.+)%.([^%.]+)$'))
    for _, tag in ipairs(tags) do
        filename = filename .. '~' .. tag_id_map[tag]
    end
    filename = filename .. '.' .. ext
    return filename
end

function ResourceVariants.getFolder(kind)
    if kind == 'font' then
        return 'fonts'
    elseif kind == 'raw' then
        return 'data'
    else
        return 'images'
    end
end

return ResourceVariants;