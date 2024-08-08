import com.fazecast.jSerialComm.SerialPort;
import java.io.InputStream;
import java.io.OutputStream;

public class SerialCommunication {
    public static void main(String[] args) {
        SerialPort port11 = SerialPort.getCommPort("COM11");
        SerialPort port9 = SerialPort.getCommPort("COM9");

        configurePort(port11);
        configurePort(port9);

        Thread port11Thread = new Thread(new SerialReaderWriter(port11, "Hello from COM11"));
        Thread port9Thread = new Thread(new SerialReaderWriter(port9, "Hello from COM9"));

        port11Thread.start();
        port9Thread.start();
    }

    private static void configurePort(SerialPort port) {
        port.setComPortParameters(115200, 8, SerialPort.ONE_STOP_BIT, SerialPort.NO_PARITY);
        port.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 1000, 0);
        if (!port.openPort()) {
            System.err.println("Failed to open port " + port.getSystemPortName());
            System.exit(1);
        } else {
            System.out.println("Successfully opened port " + port.getSystemPortName());
        }
    }
}

class SerialReaderWriter implements Runnable {
    private SerialPort port;
    private String message;

    public SerialReaderWriter(SerialPort port, String message) {
        this.port = port;
        this.message = message;
    }

    @Override
    public void run() {
        try (InputStream in = port.getInputStream(); OutputStream out = port.getOutputStream()) {
            byte[] buffer = new byte[1024];
            int len;

            // Send initial message to test communication
            out.write(message.getBytes());
            out.flush();

            while ((len = in.read(buffer)) > -1) {
                String receivedData = new String(buffer, 0, len);
                System.out.println("Received on port " + port.getSystemPortName() + ": " + receivedData);
                String responseData = "Echo from port " + port.getSystemPortName() + ": " + receivedData;
                out.write(responseData.getBytes());
                out.flush();
            }
        } catch (com.fazecast.jSerialComm.SerialPortTimeoutException e) {
            System.err.println("Timeout on port " + port.getSystemPortName() + ": " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error on port " + port.getSystemPortName());
            e.printStackTrace();
        } finally {
            port.closePort();
        }
    }
}
