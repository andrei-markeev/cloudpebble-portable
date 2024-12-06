local KB = 1024;
ProgramMaxPayloadSize(512 * KB)
LaunchBrowser()

if path.exists('.pebble/qemu_control') then
    assert(unix.unlink('.pebble/qemu_control'))
end