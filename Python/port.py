import serial
import time

# 포트 설정 (필요에 따라 변경)
port_name = "COM10"  # Windows의 경우
baudrate = 9600

# 직렬 포트 열기
ser = serial.Serial(port_name, baudrate)

# 테스트 데이터 전송
try:
    while True:
        ser.write(b'Hello, this is a test message.\n')
        time.sleep(1)  # 1초 간격으로 데이터 전송
except KeyboardInterrupt:
    print("Transmission stopped.")
finally:
    ser.close()
