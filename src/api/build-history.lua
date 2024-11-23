local builds = {}

for row in DB:nrows("SELECT * FROM builds") do
    if row.sizes ~= nil then
        row.sizes = DecodeJson(row.sizes)
    end
    -- TODO: handle timestamp values
    table.insert(builds, row)
end

if next(builds) == nil then
    builds[0] = false
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true,
    builds = builds
}))
