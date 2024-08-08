package main;

import com.fazecast.jSerialComm.SerialPort;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.*;
import java.util.Scanner;

public class SerialPortReader {
    // 데이터 저장을 위한 StringBuilder 멤버 변수 정의
    private static final StringBuilder receivedDataBuffer = new StringBuilder();
    private static final String NEW_SIGNAL_PATTERN = "NEW SIGNAL"; // 새로운 신호를 식별하는 패턴

    public static void main(String[] args) {
        // 9번 포트 (Windows에서는 COM9, Linux/Mac에서는 /dev/ttyUSB9 등)
        String portName = "COM11"; // 필요에 따라 변경

        // 직렬 포트 객체 가져오기
        SerialPort serialPort = SerialPort.getCommPort(portName);

        // 포트 열기
        if (serialPort.openPort()) {
            System.out.println("Listening on port " + portName);

            // 포트 설정
            serialPort.setComPortParameters(115200, 8, SerialPort.ONE_STOP_BIT, SerialPort.NO_PARITY);
            serialPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 0, 0);

            // 새로운 스레드에서 데이터 수신
            Thread readThread = new Thread(() -> {
                try (InputStream in = serialPort.getInputStream()) {
                    byte[] buffer = new byte[2048];
                    int bytesRead;

                    while (!Thread.currentThread().isInterrupted()) {
                        bytesRead = in.read(buffer);
                        if (bytesRead > 0) {
                            String receivedData = new String(buffer, 0, bytesRead);
                            synchronized (receivedDataBuffer) {
                                if (receivedData.contains(NEW_SIGNAL_PATTERN)) {
                                    System.out.println(getReceivedData()); // 받은 데이터 출력
                                    // 새로운 신호가 감지되면 버퍼 초기화
                                    receivedDataBuffer.setLength(0);
                                }
                                receivedDataBuffer.append(receivedData);
                            }
                            System.out.println(receivedData);
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    serialPort.closePort();
                }
            });
            readThread.start();

            // 사용자 입력 대기 및 데이터 전송 처리
            Thread userInputThread = new Thread(() -> {
                try (Scanner scanner = new Scanner(System.in); OutputStream out = serialPort.getOutputStream()) {
                    while (true) {
                        System.out.println("Type '1' to send trigger, 'exit' to close the program.");
                        String userInput = scanner.nextLine();
                        if ("exit".equalsIgnoreCase(userInput.trim())) {
                            serialPort.closePort();
                            readThread.interrupt();
                            System.out.println("Port closed and program terminated.");
                            break;
                        } else if ("1".equals(userInput.trim())) {
                            String triggerString = "Trigger\r\n";
                            out.write(triggerString.getBytes());
                            out.flush();
                            System.out.println("트리거 발신 완료");
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
            userInputThread.start();

        } else {
            System.out.println("Failed to open port " + portName);
        }
    }

    public int insertData(String data) throws SQLException, ClassNotFoundException {
        String jdbcUrl = "jdbc:oracle:thin:@10.7.140.31:1521:NEOHQ";
        String username = "erpman";
        String password = "erpman";
        ResultSet resultSet;
        Class.forName("oracle.jdbc.driver.OracleDriver");
        // 데이터베이스 연결
        Connection connection = DriverManager.getConnection(jdbcUrl, username, password);
        Statement statement = connection.createStatement();

        return 0;
    }

    public static String getReceivedData() {
        synchronized (receivedDataBuffer) {
            return receivedDataBuffer.toString();
        }
    }
}
