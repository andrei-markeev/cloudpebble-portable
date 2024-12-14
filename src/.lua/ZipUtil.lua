-- partially based on zzlib by Francois Galea <fgalea at free.fr>

---@param str string
---@param pos integer
---@return integer
local function int16le(str, pos)
    local a, b = str:byte(pos + 1, pos + 2)
    return a + (b << 8)
end

---@param str string
---@param pos integer
---@return integer
local function int32le(str, pos)
    local a, b, c, d = str:byte(pos + 1, pos + 4)
    return a + (b << 8) + (c << 16) + (d << 24)
end

local function int32ToBytes(n)
    return string.char(n & 0xFF)
        .. string.char((n >> 8) & 0xFF)
        .. string.char((n >> 16) & 0xFF)
        .. string.char((n >> 24) & 0xFF)
end

local function int16ToBytes(n)
    return string.char(n & 0xFF)
        .. string.char((n >> 8) & 0xFF)
end

---@param fd integer
---@param p integer
---@return integer, string, integer, integer, boolean, string, string
---@overload fun(fd: integer, p: integer): nil
local function nextFile(fd, p)
    local buf = assert(unix.read(fd, 46, p))
    if int32le(buf, 0) ~= 0x02014b50 then
        return nil
    end
    local packed = int16le(buf, 10) ~= 0
    local size = int32le(buf, 20)
    local namelen = int16le(buf, 28)
    local extralen = int16le(buf, 30)
    local offset = int32le(buf, 42)
    local name = assert(unix.read(fd, namelen, p + 46))
    local extra = assert(unix.read(fd, extralen, p + 46 + namelen))
    p = p + 46 + namelen + int16le(buf, 30) + int16le(buf, 32)
    return p, name, offset, size, packed, extra, buf
end

---@param fd integer
local function zipFiles(fd)
    local stat = assert(unix.fstat(fd));
    local buf = assert(unix.read(fd, 22, stat:size() - 22))
    assert(int32le(buf, 0) == 0x06054b50)
    local offset = int32le(buf, 16)
    return nextFile, fd, offset
end

local ZipUtil = {}

---@param zip_filename string
---@param file_path_inside_zip string
---@param new_file_content string
---@param target_zip_filename string
function ZipUtil.update(zip_filename, file_path_inside_zip, target_zip_filename, new_file_content)
    local fd = assert(unix.open(zip_filename, unix.O_RDONLY))
    local newFd = assert(unix.open(target_zip_filename, unix.O_WRONLY | unix.O_CREAT | unix.O_TRUNC, 0644))

    local newDir = ""
    local dirRecCount = 0
    local newOffset = 0
    for _, name, offset, size, packed, extra, dirRec in zipFiles(fd) do
        print('processing', name, ' at ', hex(offset), ', size=', size)
        if name ~= file_path_inside_zip then

            local fullSize = 30 + #name + #extra + size;
            local fileRec = assert(unix.read(fd, fullSize, offset))
            assert(unix.write(newFd, fileRec))

            local fixedDirRec = dirRec:sub(1, 42) .. int32ToBytes(newOffset) .. name .. extra
            newDir = newDir .. fixedDirRec;

            newOffset = newOffset + fullSize

        else

            assert(packed == false)

            local year, mon, mday, hour, min, sec = unix.gmtime(unix.clock_gettime())
            local msDosTime = ((year - 80) << 25) | ((mon + 1) << 21) | (mday << 16)
                | (hour << 11) | (min << 5) | (sec >> 1);

            local msDosTimeBytes = int32ToBytes(msDosTime)
            local crcBytes = int32ToBytes(Crc32(0, new_file_content))
            local sizeBytes = int32ToBytes(#new_file_content)

            local fullSize = 30 + #name + #extra + #new_file_content;
            local localFileRec = assert(unix.read(fd, 30 + #name + #extra, offset))
            local fixedLocalRec = localFileRec:sub(1, 10)
                .. msDosTimeBytes -- last modification date and time
                .. crcBytes -- crc
                .. sizeBytes -- compressed size
                .. sizeBytes -- uncompressed size
                .. localFileRec:sub(27)

            assert(unix.write(newFd, fixedLocalRec))
            assert(unix.write(newFd, new_file_content))

            local fixedDirRec = dirRec:sub(1, 12)
                .. msDosTimeBytes -- last modification date and time
                .. crcBytes -- crc
                .. sizeBytes -- compressed size
                .. sizeBytes -- uncompressed size
                .. dirRec:sub(29, 42)
                .. int32ToBytes(newOffset)
                .. name
                .. extra
            newDir = newDir .. fixedDirRec;

            newOffset = newOffset + fullSize

        end
        dirRecCount = dirRecCount + 1
    end

    assert(unix.close(fd))

    local endOfNewDir = '\x50\x4b\x05\x06\x00\x00\x00\x00' .. int16ToBytes(dirRecCount) .. int16ToBytes(dirRecCount) .. int32ToBytes(#newDir) .. int32ToBytes(newOffset) .. '\x00\x00';
    assert(#endOfNewDir == 22)

    assert(unix.write(newFd, newDir))
    assert(unix.write(newFd, endOfNewDir))
    assert(unix.close(newFd))
end

return ZipUtil;
