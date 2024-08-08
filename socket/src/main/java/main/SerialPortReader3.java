package main;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.sql.*;
import java.util.Scanner;
import java.util.Timer;
import java.util.TimerTask;

public class SerialPortReader3 {
    // 데이터 저장을 위한 StringBuilder 멤버 변수 정의
    private static final StringBuilder receivedDataBuffer = new StringBuilder();
    private static final Timer timer = new Timer();
    private static long lastReceivedTime = System.currentTimeMillis();
    private static boolean inputCheck;

    public static void main(String[] args) {
        // 파일 경로 (필요에 따라 변경)
        String filePath = "C:\\Users\\NBL23040\\Documents\\1KRCPFIISTA5500145;IS-II active Fix.txt";

        // 파일에서 데이터 읽어오기
        readFromFile(filePath);

        // 사용자 입력 대기 및 데이터 전송 처리
        Thread userInputThread = new Thread(() -> {
            try (Scanner scanner = new Scanner(System.in)) {
                while (true) {
                    System.out.println("Type '1' to process data, 'exit' to close the program.");
                    String userInput = scanner.nextLine();
                    if ("exit".equalsIgnoreCase(userInput.trim())) {
                        System.out.println("Program terminated.");
                        break;
                    } else if ("1".equals(userInput.trim())) {
                        insertData();
                        System.out.println("Data processed and inserted.");
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
                if (inputCheck && currentTime - lastReceivedTime > 1000) {
                    synchronized (receivedDataBuffer) {
                        if (inputCheck && currentTime - lastReceivedTime > 1000) {  // 이중 확인
                            System.out.println(getReceivedData());
                            insertData();
                            receivedDataBuffer.setLength(0);
                            System.out.println("Buffer cleared due to inactivity.");
                            inputCheck = !inputCheck;
                        }
                    }
                }
            }
        };
        timer.scheduleAtFixedRate(task, 0, 1000);
    }

    public static void readFromFile(String filePath) {
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = reader.readLine()) != null) {
                synchronized (receivedDataBuffer) {
                    receivedDataBuffer.append(line).append("@#"); // Assuming @# is the delimiter
                    inputCheck = true;
                    lastReceivedTime = System.currentTimeMillis();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
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
            connection.setAutoCommit(false); // 트랜잭션 시작
            String sql = "INSERT INTO MULTISCAN_TEMP(BARCODE) VALUES (?)";
            PreparedStatement preparedStatement = connection.prepareStatement(sql);

            String str = getReceivedData().toString();
            String[] barcodeList = str.split("@#");

            for (String barcode : barcodeList) {
                System.out.println(cnt + " : " + barcode);
                if (barcode != null) {
                    try {
                        preparedStatement.setString(1, barcode);
                        cnt += preparedStatement.executeUpdate(); // 한 행씩 입력
                    } catch (SQLException e) {
                        System.err.println("Error inserting barcode: " + barcode + ". Error: " + e.getMessage());
                    }
                }
            }

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
        } finally {
            if (connection != null) {
                try {
                    connection.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return cnt;
    }

    public static String getReceivedData() {
        synchronized (receivedDataBuffer) {
            return receivedDataBuffer.toString();
        }
    }
}