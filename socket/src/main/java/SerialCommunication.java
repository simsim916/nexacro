import com.fazecast.jSerialComm.SerialPort;

public class SerialCommunication {
    public static void main(String[] args) {
        SerialPort port11 = SerialPort.getCommPort("COM11");
        SerialPort port9 = SerialPort.getCommPort("COM9");

        configurePort(port11);
        configurePort(port9);

        Thread port11Thread = new Thread(new SerialReaderWriter(port11));
        Thread port9Thread = new Thread(new SerialReaderWriter(port9));

        port11Thread.start();
        port9Thread.start();
    }

    private static void configurePort(SerialPort port) {
        port.setComPortParameters(9600, 8, SerialPort.ONE_STOP_BIT, SerialPort.NO_PARITY);
        port.setComPortTimeouts(SerialPort.TIMEOUT_READ_BLOCKING, 0, 0);
        if (!port.openPort()) {
            System.err.println("Failed to open port " + port.getSystemPortName());
            System.exit(1);
        }
    }
}

class SerialReaderWriter implements Runnable {
    private SerialPort port;

    public SerialReaderWriter(SerialPort port) {
        this.port = port;
    }

    @Override
    public void run() {
        try {
            InputStream in = port.getInputStream();
            OutputStream out = port.getOutputStream();

            byte[] buffer = new byte[1024];
            int len;
            while ((len = in.read(buffer)) > -1) {
                String receivedData = new String(buffer, 0, len);
                System.out.println("Received on port " + port.getSystemPortName() + ": " + receivedData);
                String responseData = "Echo from port " + port.getSystemPortName() + ": " + receivedData;
                out.write(responseData.getBytes());
                out.flush();
            }
        } catch (Exception e) {
            System.err.println("Error on port " + port.getSystemPortName());
            e.printStackTrace();
        } finally {
            port.closePort();
        }
    }
}
