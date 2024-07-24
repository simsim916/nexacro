package excel;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

public class ExcelReader {
    public static void main(String[] args) {
        String excelFilePath = "C:\\Users\\NBL23040\\Desktop\\자바엑셀\\Java.xlsx"; // 읽어올 엑셀 파일의 경로

        try (InputStream fis = new FileInputStream(excelFilePath);
             Workbook workbook = new XSSFWorkbook(fis)) {

            Sheet sheet = workbook.getSheetAt(0); // 첫 번째 시트를 가져옵니다.

            for (Row row : sheet) { // 시트의 각 행을 순회합니다.
                for (Cell cell : row) { // 각 행의 셀을 순회합니다.
                    switch (cell.getCellType()) {
                        case STRING:
                            System.out.print(cell.getStringCellValue() + "\t");
                            break;
                        case NUMERIC:
                            if (DateUtil.isCellDateFormatted(cell)) {
                                System.out.print(cell.getDateCellValue() + "\t");
                            } else {
                                System.out.print(cell.getNumericCellValue() + "\t");
                            }
                            break;
                        case BOOLEAN:
                            System.out.print(cell.getBooleanCellValue() + "\t");
                            break;
                        case FORMULA:
                            System.out.print(cell.getCellFormula() + "\t");
                            break;
                        case BLANK:
                            System.out.print("BLANK" + "\t");
                            break;
                        default:
                            System.out.print("UNKNOWN" + "\t");
                            break;
                    }
                }
                System.out.println(); // 각 행을 읽은 후 줄바꿈
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
