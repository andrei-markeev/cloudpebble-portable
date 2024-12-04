local KB = 1024;
ProgramMaxPayloadSize(512 * KB)
LaunchBrowser()

--- PID of the qemu process
---@type number | nil
QemuPID = nil

--- PID of the phone simulator (PyPKJS) process
---@type number | nil
PhoneSimPID = nil
