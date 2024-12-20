local ProjectFiles = require('ProjectFiles')

local ConcatJavascript = {}

---@param str string
local function get_line_count(str)
    local lines = 1
    for i = 1, #str do
        local c = str:sub(i, i)
        if c == '\n' then lines = lines + 1 end
    end

    return lines
end

---@param project_type ProjectType
---@param app_dir string
---@param rootfs_dir string
---@param assert_or_fail function
function ConcatJavascript.concatWithLoader(project_type, app_dir, rootfs_dir, assert_or_fail)

    local js_dir = path.join(app_dir, 'src/js') .. '/';
    local pkjs_dir = path.join(app_dir, 'src/pkjs') .. '/';
    assert_or_fail(unix.makedirs(js_dir))

    if path.exists(path.join(js_dir, 'pebble-js-app.js')) then
        assert_or_fail(unix.unlink(path.join(js_dir, 'pebble-js-app.js')))
    end

    local fd = assert_or_fail(unix.open(path.join(app_dir, 'assembled.js'), unix.O_WRONLY | unix.O_CREAT | unix.O_TRUNC, 0644))

    local loaderjs = assert_or_fail(Slurp(path.join(rootfs_dir, 'pebble/pebblejs/src/js/loader.js')))
    local line_no = get_line_count(loaderjs) + 1
    assert_or_fail(unix.write(fd, loaderjs .. '\n'))

    local jsFiles = ProjectFiles.findFilesAt(project_type, 'pkjs', app_dir)
    for _, file_info in ipairs(jsFiles) do
        local rel_dir = file_info.dir .. '/'
        if rel_dir:sub(1, #pkjs_dir) == pkjs_dir then
            rel_dir = rel_dir:sub(#pkjs_dir + 1)
        elseif rel_dir:sub(1, #js_dir) == js_dir then
            rel_dir = rel_dir:sub(#js_dir + 1)
        elseif rel_dir == pkjs_dir or rel_dir == js_dir then
            rel_dir = ''
        end
        local rel_file_path = path.join(rel_dir, file_info.name)--[[@as string]];
        local file_path_in_container = path.join(app_dir, file_info.dir, file_info.name);
        Log(kLogInfo, 'Concatenating ' .. file_path_in_container .. '...')
        local contents = assert(Slurp(file_path_in_container))
        if file_info.name:sub(-5) == '.json' then
            contents = 'module.exports = ' .. contents .. ';'
        end
        unix.write(fd, '__loader.define("' .. rel_file_path .. '", ' .. line_no .. ', function(exports, module, require) {\n')
        unix.write(fd, contents .. '\n});\n')
        line_no = line_no + get_line_count(contents) + 2
        assert_or_fail(unix.unlink(file_path_in_container))
    end

    if project_type == 'pebblejs' then
        assert_or_fail(unix.write(fd, '__loader.require("main");'))
    else
        assert_or_fail(unix.write(fd, '__loader.require("index");'))
    end

    assert_or_fail(unix.close(fd))

    assert_or_fail(unix.rename(path.join(app_dir, 'assembled.js'), path.join(js_dir, 'pebble-js-app.js')))
end

---@param project_type ProjectType
---@param app_dir string
---@param rootfs_dir string
---@param assert_and_fail function
function ConcatJavascript.concatRaw(project_type, app_dir, rootfs_dir, assert_and_fail)

    local js_dir = path.join(app_dir, 'src/js') .. '/';
    assert_and_fail(unix.makedirs(js_dir))

    -- artefact from the previous build
    if path.exists(path.join(js_dir, 'pebble-js-app.js')) then
        assert_and_fail(unix.unlink(path.join(js_dir, 'pebble-js-app.js')))
    end

    local fd = assert_and_fail(unix.open(path.join(app_dir, 'assembled.js'), unix.O_WRONLY | unix.O_CREAT | unix.O_TRUNC, 0644))

    local loaderjs = assert_and_fail(Slurp(path.join(rootfs_dir, 'pebble/pebblejs/src/js/loader.js')))
    unix.write(fd, loaderjs .. '\n')

    local jsFiles = ProjectFiles.findFilesAt(project_type, 'pkjs', app_dir)
    for _, file_info in ipairs(jsFiles) do
        if file_info.name:sub(-5) ~= '.json' then
            local file_path_in_container = path.join(app_dir, file_info.dir, file_info.name);
            Log(kLogInfo, 'Concatenating ' .. file_path_in_container .. '...')
            local contents = assert(Slurp(file_path_in_container))
            unix.write(fd, contents .. "\n")
        end
    end

    assert_and_fail(unix.close(fd))

    assert_and_fail(unix.rename(path.join(app_dir, 'assembled.js'), path.join(js_dir, 'pebble-js-app.js')))
end

return ConcatJavascript;