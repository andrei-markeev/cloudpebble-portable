local ProjectFiles = require('ProjectFiles')
local IncrementalBuild = {}

---@param app_info AppInfo
---@param assembled_dir string
---@return { type: 'unchanged' | 'only_js' | 'incremental' | 'full', copy?: string[], remove?: string[] }
function IncrementalBuild.detectBuildType(app_info, assembled_dir)
    local old_files = ProjectFiles.findFilesAt(app_info.projectType, 'all', assembled_dir)
    local new_files = ProjectFiles.findFiles(app_info.projectType, 'all')

    local file_dict = {}
    local c_changed = false
    local js_changed = false
    local copy_files = {}

    for _, file_info in ipairs(old_files) do
        if file_info.target ~= 'unknown' then
            local file_path = assert(path.join(file_info.dir, file_info.name))
            local base_file_path = file_path:sub(#assembled_dir + 2)
            local stat, err = unix.stat(file_path)
            if err ~= nil then
                Log(kLogWarn, 'Cannot buld incrementally because stat returned error ' .. err:name() .. ' ' .. err:doc())
                return { type = 'full' }
            else
                file_dict[base_file_path] = { modified = assert(stat):mtim(), target = file_info.target, keep = false }
            end
        end
    end

    for _, file_info in ipairs(new_files) do
        if file_info.target ~= 'unknown' then
            local file_path = assert(path.join(file_info.dir, file_info.name))
            if file_dict[file_path] then
                file_dict[file_path].keep = true
                local stat, err = unix.stat(file_path)
                if err ~= nil then
                    Log(kLogWarn, 'Cannot buld incrementally because stat returned error ' .. err:name() .. ' ' .. err:doc())
                    return { type = 'full' }
                else
                    if file_dict[file_path].modified ~= assert(stat):mtim() then
                        Log(kLogWarn, 'File changed: ' .. file_path .. ' (' .. file_info.target .. ')')
                        table.insert(copy_files, file_path)
                        if file_info.target == 'resource' or file_info.target == 'manifest' then
                            return { type = 'full' }
                        elseif file_info.target ~= 'pkjs' then
                            c_changed = true
                        else
                            js_changed = true
                        end
                    end
                end
            else
                Log(kLogWarn, 'File added: ' .. file_path .. ' (' .. file_info.target .. ')')
                if file_info.target == 'resource' or file_info.target == 'manifest' then
                    return { type = 'full' }
                elseif file_info.target ~= 'pkjs' then
                    c_changed = true
                else
                    js_changed = true
                end
                table.insert(copy_files, file_path)
            end
        end
    end

    local remove_files = {}
    for file_path, file_info in pairs(file_dict) do
        if not file_info.keep then
            Log(kLogWarn, 'File removed: ' .. file_path .. ' (' .. file_info.target .. ')')
            table.insert(remove_files, file_path)
            if file_info.target == 'resource' or file_info.target == 'manifest' then
                return { type = 'full' }
            elseif file_info.target ~= 'pkjs' then
                c_changed = true
            else
                js_changed = true
            end
        end
    end

    if c_changed then
        return { type = 'incremental', copy = copy_files, remove = remove_files }
    elseif js_changed then
        return { type = 'only_js', copy = copy_files, remove = remove_files }
    else
        return { type = 'unchanged', copy = {}, remove = {} }
    end

end

return IncrementalBuild