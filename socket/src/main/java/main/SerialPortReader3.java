package main;

import com.fazecast.jSerialComm.SerialPort;

import java.io.InputStream;
import java.io.OutputStream;
import java.sql.*;
import java.util.Scanner;
import java.util.Timer;
import java.util.TimerTask;

public class SerialPortReader2 {
    // 데이터 저장을 위한 StringBuilder 멤버 변수 정의
    private static final StringBuilder receivedDataBuffer = new StringBuilder();
    private static final Timer timer = new Timer();
    private static long lastReceivedTime = System.currentTimeMillis();

    public static void main(String[] args) {
        // 9번 포트 (Windows에서는 COM9, Linux/Mac에서는 /dev/ttyUSB9 등)
        String portName = "COM9"; // 필요에 따라 변경

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
                                lastReceivedTime = System.currentTimeMillis();
                                receivedDataBuffer.append(receivedData);
                                System.out.println(receivedData);
                            }
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

            // TimerTask를 사용하여 1초마다 버퍼 초기화 확인
            TimerTask task = new TimerTask() {
                @Override
                public void run() {
                    long currentTime = System.currentTimeMillis();
                    System.out.println("타임 체크");
                    if (currentTime - lastReceivedTime > 1000) {
                        synchronized (receivedDataBuffer) {
                            if (currentTime - lastReceivedTime > 1000) {  // 이중 확인
                                insertData();
                                receivedDataBuffer.setLength(0);
                                System.out.println("Buffer cleared due to inactivity.");
                            }
                        }
                    }
                }
            };
            timer.scheduleAtFixedRate(task, 0, 1000);

        } else {
            System.out.println("Failed to open port " + portName);
        }
    }

    public static int insertData() {
        String jdbcUrl = "jdbc:oracle:thin:@10.7.140.31:1521:NEOHQ";
        String username = "erpman";
        String password = "erpman";
        Connection connection = null;
        int cnt = 0;
        try {
            Class.forName("oracle.jdbc.driver.OracleDriver");
            // 데이터베이스 연결
            connection = DriverManager.getConnection(jdbcUrl, username, password);
            String sql = "INSERT INTO MULTISCAN_TEMP(BARCODE) VALUES (?)";
            PreparedStatement preparedStatement = connection.prepareStatement(sql);

            String str = getReceivedData().toString();
            String[] barcodeList = str.split("@#");

            for (String barcode : barcodeList) {
                preparedStatement.setString(1, barcode);
//                preparedStatement.addBatch(); // 배치로 한번에 입력할 시 무결성 불합격 시 전부 입력안됨
                cnt = Math.max(preparedStatement.executeUpdate(), 0); // 한 행씩 입력
            }

//            preparedStatement.executeBatch(); // 배치로 한번에 입력할 시 무결성 불합격 시 전부 입력안됨
            connection.commit();
            return cnt;
        } catch (Exception e) {
            if (connection != null) {
                try {
                    connection.rollback(); // Rollback transaction on error
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            e.printStackTrace();
        }
    }

    public static String getReceivedData() {
        synchronized (receivedDataBuffer) {
            return receivedDataBuffer.toString();
        }
    }
}
