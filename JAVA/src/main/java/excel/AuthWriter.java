package excel;

import DAO.Dept;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;

public class ExcelUpdate2 {
    public static void main(String[] args) throws IOException {
        OracleConnection oracleConnection = new OracleConnection();
        List<Dept> topDeptList = oracleConnection.getTopDept();
        List<Dept> deptList = oracleConnection.getAllDept(topDeptList);

        String filePath = "C:\\Users\\NBL23040\\Desktop\\작업중\\04_권한\\권한정리.xlsx";

        try (FileInputStream fis = new FileInputStream(new File(filePath)); XSSFWorkbook workbook = new XSSFWorkbook(fis)) {

            XSSFSheet sheet = workbook.getSheetAt(0);
            int numRows = sheet.getPhysicalNumberOfRows();

            // 스타일 설정
            CellStyle style = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setFontName("a고딕13");
            font.setFontHeightInPoints((short) 10);
            style.setFont(font);
            style.setAlignment(HorizontalAlignment.CENTER);


            Row row0 = sheet.createRow(0);
            for (int col = 0; col < deptList.get(0).getColumn().size() ; col++) {
                Cell targetCell = row0.createCell(col);
                targetCell.setCellValue(deptList.get(0).getColumn().get(col));
            }

            int rowNum = 1;
            for (Dept dept : deptList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(dept.level);
                row.createCell(1).setCellValue(dept.history);
                row.createCell(2).setCellValue(dept.deptname);
                row.createCell(3).setCellValue(dept.deptcode);
                row.createCell(4).setCellValue(dept.member);
            }
            try (FileOutputStream fos = new FileOutputStream(new File(filePath))) {
                workbook.write(fos);
                System.out.println("작업 완료");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}
