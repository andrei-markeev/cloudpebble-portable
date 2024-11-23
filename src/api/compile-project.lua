-- compile in a separate process
if assert(unix.fork()) == 0 then
    -- child process
    local pbw_file_name = 'build_' .. GetTime() .. '.pbw';
    Log(kLogWarn, 'child')

    -- local pbwdb = Sqlite3.open_memory()
    -- local stmt = pbwdb:prepare("CREATE VIRTUAL TABLE pbw USING zipfile(?)")
    -- stmt:bind(1, pbw_file_name)
    -- stmt:finalize()

    -- -- TODO: compile files and add them
    -- stmt = pbwdb:prepare("INSERT INTO pbw(name, data) VALUES(?, ?)")
    -- stmt:bind_values('test.txt', 'Hello world!')
    -- stmt:step()
    -- stmt:finalize()

else
    -- parent process, return response
    local result = DB:exec("INSERT INTO builds(state, started) VALUES(1, " .. tostring(math.floor(GetTime())) .. ")")
    if result ~= Sqlite3.OK then
        SetStatus(200)
        SetHeader('Content-Type', 'application/json; charset=utf-8')
        Write(EncodeJson({
            success = false,
            error = 'Insert failed: ' .. tostring(result)
        }))
        return;
    end

-- id = build.id,
-- uuid = build.uuid,
-- state = build.state,
    -- 1 = Pending
    -- 2 = Failed
    -- 3 = Succeeded
-- started = str(build.started),
-- finished = str(build.finished) if build.finished else None,
-- download = build.pbw_url,
-- log = build.build_log_url,
-- build_dir = build.get_url(),
-- sizes = build.get_sizes()

-- "aplite": {
--     "app": 17374,
--     "resources": 11643,
--     "total": null,
--     "worker": null
--   },
--   "basalt": {
--     "app": 17806,
--     "resources": 10356,
--     "total": null,
--     "worker": null
--   },
--   "chalk": {
--     "app": 18078,
--     "resources": 10356,
--     "total": null,
--     "worker": null
--   }

    SetStatus(200)
    SetHeader('Content-Type', 'application/json; charset=utf-8')
    Write(EncodeJson({
        success = true
    }))
end

