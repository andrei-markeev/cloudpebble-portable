if QemuPID ~= nil then
    unix.kill(QemuPID, unix.SIGINT)
    QemuPID = nil
end
if PhoneSimPID ~= nil then
    unix.kill(PhoneSimPID, unix.SIGINT)
    PhoneSimPID = nil
end

SetStatus(200)
SetHeader('Content-Type', 'application/json; charset=utf-8')
Write(EncodeJson({
    success = true
}))
