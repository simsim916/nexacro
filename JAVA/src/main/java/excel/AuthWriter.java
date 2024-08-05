package excel;

import DAO.Dept;
import DAO.Emp;
import DAO.Menu;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AuthWriter {
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

            int rowNum = 1;
            for (Dept dept : deptList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(dept.level);
                row.createCell(1).setCellValue(dept.history);
                row.createCell(2).setCellValue(dept.deptname);
                row.createCell(3).setCellValue(dept.deptcode);
                row.createCell(4).setCellValue(dept.member);

                if (Integer.parseInt(dept.member) > 0) {
                    // 새 시트 추가
                    XSSFSheet sheetMenu = workbook.createSheet(dept.deptname);
                    List<Emp> empList = oracleConnection.getDeptMember(dept.deptcode);
                    List<Menu> menuList = oracleConnection.getMenu(empList);

                    Row emp1 = sheetMenu.createRow(0);
                    emp1.createCell(3).setCellValue("사원명");
                    Row emp2 = sheetMenu.createRow(1);
                    emp2.createCell(3).setCellValue("직책");
                    Row emp3 = sheetMenu.createRow(2);
                    emp3.createCell(3).setCellValue("직급");
                    Row emp4 = sheetMenu.createRow(3);
                    Row emp_ETC = sheetMenu.createRow(4);
                    emp4.createCell(3).setCellValue("보유한 메뉴 갯수");
                    Row emp5 = sheetMenu.createRow(5);
                    int colNum = 4;
                    Map<String, Integer> EmpMap = new HashMap<String, Integer>();
                    for (Emp emp : empList) {
                        emp1.createCell(colNum).setCellValue(emp.EMPNAME);
                        emp2.createCell(colNum).setCellValue(emp.JOBKINDNAME);
                        emp3.createCell(colNum).setCellValue(emp.GRADENAME);
                        emp4.createCell(colNum).setCellValue(emp.MENUCNT);
                        emp_ETC.createCell(colNum).setCellValue(oracleConnection.getETC(emp.EMPNO));
                        emp5.createCell(colNum).setCellValue(emp.EMPNO);
                        EmpMap.put(emp.EMPNO, colNum);
                        colNum++;
                    }

                    int rowNumMenu = 6;
                    for (Menu menu : menuList) {
                        Row rowMenu = sheetMenu.createRow(rowNumMenu);
                        rowMenu.createCell(0).setCellValue(menu.MAIN_ID);
                        rowMenu.createCell(1).setCellValue(menu.SUB1_ID);
                        rowMenu.createCell(2).setCellValue(menu.SUB2_ID);
                        rowMenu.createCell(3).setCellValue(menu.SUB2_NAME);
                        int mapNum = 4;
                        for (Map.Entry<String, String> entry : menu.Emp.entrySet()){
                            rowMenu.createCell(EmpMap.get(entry.getKey())).setCellValue(entry.getValue());
                            mapNum++;
                        }
                        rowMenu.createCell(mapNum).setCellFormula("COUNTA(" + CellReference.convertNumToColString(4) + (rowNumMenu+1) + ":" + CellReference.convertNumToColString(mapNum - 1) + (rowNumMenu+1) + ")");
                        rowNumMenu++;
                    }

                    for (int col = 0; col < menuList.get(0).getColumn().size(); col++) {
                        Cell targetCell = emp5.createCell(col);
                        targetCell.setCellValue(menuList.get(0).getColumn().get(col));
                        sheetMenu.autoSizeColumn(col);
                    }

                    for(int i = 0; i < 3 ; i++){
                        sheetMenu.setColumnHidden(i, true);
                    }
                }
            }

            Row row0 = sheet.createRow(0);
            for (int col = 0; col < deptList.get(0).getColumn().size(); col++) {
                Cell targetCell = row0.createCell(col);
                targetCell.setCellValue(deptList.get(0).getColumn().get(col));
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
