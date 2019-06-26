#!C:/Users/Daniel/AppData/Local/Programs/Python/Python37-32/python


import socket

socc = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

port = 5000

socc.connect(('128.54.240.232', port))

print("Content-type: text/html\n\n");

print("Hello there!")

print(socc.recv(1024))

socc.send("Hello server!".encode())


socc.close()
