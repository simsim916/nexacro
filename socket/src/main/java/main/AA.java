package main;

import com.fazecast.jSerialComm.SerialPort;

import java.io.InputStream;
import java.io.OutputStream;

public class AA {
    public static void main(String[] args) {
        String portName1 = "COM9";
        String portName2 = "COM11";

        SerialPort listenPort1 = SerialPort.getCommPort(portName1);
        SerialPort listenPort2 = SerialPort.getCommPort(portName2);

        if (listenPort1.openPort() && listenPort2.openPort()) {
            System.out.println("Ports are open and ready.");
        } else {
            System.out.println("Failed to open ports.");
            return;
        }

        new Thread(new SerialPortThread(listenPort1, listenPort2)).start();
        new Thread(new SerialPortThread(listenPort2, listenPort1)).start();
    }
}

class SerialPortThread implements Runnable {
    private SerialPort listenPort;
    private SerialPort sendPort;

    public SerialPortThread(SerialPort listenPort, SerialPort sendPort) {
        this.listenPort = listenPort;
        this.sendPort = sendPort;
    }

    @Override
    public void run() {
        listenPort.setComPortParameters(115200, 8, SerialPort.ONE_STOP_BIT, SerialPort.NO_PARITY);
        listenPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 1000, 0); // Increased timeout
        sendPort.setComPortParameters(115200, 8, SerialPort.ONE_STOP_BIT, SerialPort.NO_PARITY);
        sendPort.setComPortTimeouts(SerialPort.TIMEOUT_WRITE_BLOCKING, 1000, 0);

        System.out.println("Listening on port " + listenPort.getSystemPortName());

        try (InputStream in = listenPort.getInputStream();
             OutputStream out = sendPort.getOutputStream()) {

            byte[] buffer = new byte[1024];
            int bytesRead;

            while (!Thread.currentThread().isInterrupted()) {
                try {
                    bytesRead = in.read(buffer);
                    if (bytesRead > 0) {
                        String receivedData = new String(buffer, 0, bytesRead);
                        System.out.println("Received on " + listenPort.getSystemPortName() + ": " + receivedData);

                        out.write(receivedData.getBytes());
                        out.flush();
                        System.out.println("Sent to " + sendPort.getSystemPortName() + ": " + receivedData);
                    }
                } catch (Exception e) {
                    // Quietly handle timeout without printing an error
                    if (!(e instanceof com.fazecast.jSerialComm.SerialPortTimeoutException)) {
                        e.printStackTrace();
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
