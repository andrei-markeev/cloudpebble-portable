
if path.exists('.pebble/qemu_control') then
    print("Try closing Qemu...")

    local sockfd = unix.socket()
    assert(unix.connect(sockfd, ResolveIp('127.0.0.1'), 12346))
    assert(unix.write(sockfd, 'quit\n'))
    assert(unix.close(sockfd));

    assert(unix.unlink('.pebble/qemu_control'))
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true
}))
