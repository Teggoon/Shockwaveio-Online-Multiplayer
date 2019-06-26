#!/usr/bin/python

import socket

socc = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

port = 5000

socc.bind(('0.0.0.0', 5000))


socc.listen(2)
print("socket is listening")

while True:
	conn, addr = socc.accept()
	print("Received connection! from")
	print(addr)
	conn.send("Hello there!".encode())
	print(conn.recv(1024))
	conn.close()
