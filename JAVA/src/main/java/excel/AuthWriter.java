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
            Cell cell;

            // 스타일 설정
            CellStyle style_AlignCenter = workbook.createCellStyle();
            style_AlignCenter.setAlignment(HorizontalAlignment.CENTER);

            CellStyle style_ColorRed = workbook.createCellStyle();
            Font redfont = workbook.createFont();
            redfont.setColor(IndexedColors.RED.getIndex());
            style_ColorRed.setAlignment(HorizontalAlignment.CENTER);
            style_ColorRed.setFont(redfont);

            int rowNum = 1;
            for (Dept dept : deptList) {
                Row row = sheet.createRow(rowNum++);
                //부서레벨
                cell = row.createCell(0);
                cell.setCellValue(dept.level);
                cell.setCellStyle(style_AlignCenter);
                //조직도
                row.createCell(1).setCellValue(dept.history);
                //부서명
                cell = row.createCell(2);
                cell.setCellValue(dept.deptname);
                cell.setCellStyle(style_AlignCenter);
                //부서코드
                cell=row.createCell(3);
                cell.setCellValue(dept.deptcode);
                cell.setCellStyle(style_AlignCenter);
                //부서인원
                cell=row.createCell(4);
                cell.setCellValue(dept.member);
                cell.setCellStyle(style_AlignCenter);

                //부서별 시트 작성
                if (Integer.parseInt(dept.member) > 0) {
                    // 새 시트 추가
                    XSSFSheet sheetMenu = workbook.createSheet(dept.deptname);
                    List<Emp> empList = oracleConnection.getDeptMember(dept.deptcode);
                    List<Menu> menuList = oracleConnection.getMenu(empList);

                    Row emp1 = sheetMenu.createRow(0);
                    cell = emp1.createCell(3);
                    cell.setCellValue("사원명");
                    cell.setCellStyle(style_AlignCenter);

                    Row emp2 = sheetMenu.createRow(1);
                    cell = emp2.createCell(3);
                    cell.setCellValue("직책");
                    cell.setCellStyle(style_AlignCenter);

                    Row emp3 = sheetMenu.createRow(2);
                    cell = emp3.createCell(3);
                    cell.setCellValue("직급");
                    cell.setCellStyle(style_AlignCenter);

                    Row emp4 = sheetMenu.createRow(3);

                    Row emp_ETC = sheetMenu.createRow(4);
                    cell = emp4.createCell(3);
                    cell.setCellValue("보유한 메뉴 갯수");
                    cell.setCellStyle(style_AlignCenter);

                    Row emp5 = sheetMenu.createRow(5);

                    int colNum = 4;
                    Map<String, Integer> EmpMap = new HashMap<>();
                    for (Emp emp : empList) {
                        //사원명
                        cell = emp1.createCell(colNum);
                        cell.setCellValue(emp.EMPNAME);
                        cell.setCellStyle(style_AlignCenter);
                        //직급
                        cell = emp2.createCell(colNum);
                        cell.setCellValue(emp.JOBKINDNAME);
                        cell.setCellStyle(style_AlignCenter);
                        //직책
                        cell = emp3.createCell(colNum);
                        cell.setCellValue(emp.GRADENAME);
                        cell.setCellStyle(style_AlignCenter);
                        //메뉴 갯수
                        cell = emp4.createCell(colNum);
                        cell.setCellValue(emp.MENUCNT);
                        cell.setCellStyle(style_AlignCenter);
                        //특이사항
                        cell.setCellValue(oracleConnection.getETC(emp.EMPNO)==null?null:oracleConnection.getETC(emp.EMPNO).replace(",","\n"));
                        cell.setCellStyle(style_AlignCenter);
                        //사번
                        cell = emp5.createCell(colNum);
                        cell.setCellValue(emp.EMPNO);

                        EmpMap.put(emp.EMPNO, colNum); // 정확한 자료 기입을 위한 Map등록
                        colNum++;
                    }

                    int rowNumMenu = 6;
                    for (Menu menu : menuList) {
                        Row rowMenu = sheetMenu.createRow(rowNumMenu);
                        //메인코드
                        cell = rowMenu.createCell(0);
                        cell.setCellValue(menu.MAIN_ID);
                        cell.setCellStyle(style_AlignCenter);
                        //서브1코드
                        cell = rowMenu.createCell(1);
                        cell.setCellValue(menu.SUB1_ID);
                        cell.setCellStyle(style_AlignCenter);
                        //서브2코드
                        cell = rowMenu.createCell(2);
                        cell.setCellValue(menu.SUB2_ID);
                        cell.setCellStyle(style_AlignCenter);
                        //메뉴이름
                        cell = rowMenu.createCell(3);
                        cell.setCellValue(menu.SUB2_NAME);
                        cell.setCellStyle(style_AlignCenter);

                        int mapNum = 4;
                        for (Map.Entry<String, String> entry : menu.Emp.entrySet()){
                            cell = rowMenu.createCell(EmpMap.get(entry.getKey()));
                            if(entry.getValue() != null && entry.getValue().indexOf("null") < 0){
                                cell.setCellValue("O");
                                cell.setCellStyle(style_AlignCenter);
                            } else if (entry.getValue() != null) {
                                cell.setCellValue("O");
                                if(menu.SUB2_ID.equals("0") || menu.SUB2_ID.equals("99") || menu.SUB2_ID.equals("100")){
                                    cell.setCellStyle(style_AlignCenter);
                                } else {
                                    cell.setCellStyle(style_ColorRed);
                                }
                            }
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
