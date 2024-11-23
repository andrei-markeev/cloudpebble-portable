Sqlite3 = require 'lsqlite3'
function SetupSql()
    if not DB then

        DB = Sqlite3.open('.pebble/db.sqlite3')
        DB:busy_timeout(1000)
        DB:exec[[PRAGMA journal_mode=WAL]]
        DB:exec[[PRAGMA synchronous=NORMAL]]
        DB:exec[[
            CREATE TABLE builds (
                id INTEGER PRIMARY KEY,
                uuid CHAR(36),
                state INTEGER,
                started INTEGER,
                finished INTEGER NULL,
                download VARCHAR(256),
                log TEXT,
                build_dir VARCHAR(256),
                sizes TEXT
            );
        ]]

    end
end

function OnHttpRequest()
    SetupSql()
    Route()
end