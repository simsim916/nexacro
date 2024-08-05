package excel;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class AuthWriter {

    public static void main(String[] args) {

        OracleConnection oracleConnection = new OracleConnection();
        List<ResultDAO> list = oracleConnection.getMenu("코리아사업본부");

        for (ResultDAO result : list) {
            System.out.println(result.메뉴이름);
        }
        int cnt = 1;
        String filePath = "C:\\Users\\N2406009\\Desktop\\권한\\auth"+ cnt +".xlsx";
        List<String> menuNames = new ArrayList<>();
        List<String> menuNames2 = new ArrayList<>();
        Scanner scanner = new Scanner(System.in);

        while (true) {
            System.out.println("현재 auth" + cnt++ +"작업중입니다.");
            System.out.println("1 입력 데이터를 입력하세요");
            String text1 = scanner.nextLine();
            System.out.println("2 입력 데이터를 입력하세요");
            String text2 = scanner.nextLine();
            System.out.println("3 입력 데이터를 입력하세요");
            String text3 = scanner.nextLine();
            System.out.println("메뉴1 이름을 입력하세요. 입력을 마치려면 빈 줄을 입력하세요:");

            while (true) {
                String line = scanner.nextLine();
                if (line.isEmpty()) {
                    break;
                }
                if (line.charAt(0) == '1') {
                    return;
                }
                menuNames.add(line);
            }

            System.out.println("메뉴2 이름을 입력하세요. 입력을 마치려면 빈 줄을 입력하세요:");

            while (true) {
                String line = scanner.nextLine();
                if (line.isEmpty()) {
                    break;
                }
                menuNames2.add(line);
            }

            try (FileInputStream fis = new FileInputStream(new File(filePath));
                 XSSFWorkbook workbook = new XSSFWorkbook(fis)) {

                XSSFSheet sheet = workbook.getSheetAt(0);
                int numRows = sheet.getPhysicalNumberOfRows();

                // 2행의 첫 번째 비어있는 열 찾기
                int firstEmptyCol = -1;
                Row secondRow = sheet.getRow(1); // 2행은 인덱스 1
                if (secondRow != null) {
                    for (int colIndex = 0; colIndex < secondRow.getLastCellNum(); colIndex++) {
                        Cell cell = secondRow.getCell(colIndex);
                        if (cell == null || cell.getCellType() == CellType.BLANK) {
                            firstEmptyCol = colIndex;
                            break;
                        }
                    }
                }

                if (firstEmptyCol == -1) {
                    firstEmptyCol = secondRow.getLastCellNum();
                }

                int insertcell1 = firstEmptyCol;
                int insertcell2 = insertcell1 + 1;
                int insertcell3 = insertcell2 + 1;

                // 스타일 설정
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setFontName("a고딕13");
                font.setFontHeightInPoints((short) 10);
                style.setFont(font);
                style.setAlignment(HorizontalAlignment.CENTER);

                for (int i = 0; i < numRows; i++) {
                    Row row = sheet.getRow(i);
                    if (row != null) {
                        Cell cell = row.getCell(3); // D열이 4번째 열이므로 인덱스는 3
                        if (cell != null && menuNames.contains(cell.getStringCellValue())) {
                            Cell targetCell = row.createCell(insertcell1);
                            Cell targetCell2 = row.createCell(insertcell2);
                            targetCell.setCellValue(text1);
                            targetCell2.setCellValue(text2);
                            targetCell.setCellStyle(style);
                            targetCell2.setCellStyle(style);
                            menuNames.remove(cell.getStringCellValue());
                        }
                        if (cell != null && menuNames2.contains(cell.getStringCellValue())) {
                            Cell targetCell3 = row.createCell(insertcell3);
                            targetCell3.setCellValue(text3);
                            targetCell3.setCellStyle(style);
                            menuNames2.remove(cell.getStringCellValue());
                        }
                    }
                }
                System.out.println("메뉴1 : " + menuNames.toString());
                System.out.println("메뉴2 : " + menuNames2.toString());

                // 열 너비 자동 맞춤
                sheet.autoSizeColumn(insertcell1);
                sheet.autoSizeColumn(insertcell2);
                sheet.autoSizeColumn(insertcell3);

                try (FileOutputStream fos = new FileOutputStream(new File("C:\\Users\\N2406009\\Desktop\\권한\\auth" + cnt + ".xlsx"))) {
                    workbook.write(fos);
                    System.out.println("작업 완료");
                }

            } catch (IOException e) {
                e.printStackTrace();
            }

        }
    }

    public static int columnToIndex(String column) {
        int index = 0;
        for (int i = 0; i < column.length(); i++) {
            index = index * 26 + (column.charAt(i) - 'A' + 1);
        }
        return index - 1; // 0-based index
    }
}
