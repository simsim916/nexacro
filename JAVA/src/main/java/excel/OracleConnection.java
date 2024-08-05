package org.example;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class OracleConnection {
    public static List<ResultDAO> getMenu(String dept) {
        // JDBC URL, username, password 설정
        String jdbcUrl = "jdbc:oracle:thin:@10.2.2.31:1521:NEOHQ";
        String username = "erpman";
        String password = "erpman";

        // Connection, Statement, ResultSet 객체 선언
        Connection connection = null;
        Statement statement = null;
        ResultSet resultSet = null;

        try {
            // JDBC 드라이버 로드
            Class.forName("oracle.jdbc.driver.OracleDriver");

            // 데이터베이스 연결
            connection = DriverManager.getConnection(jdbcUrl, username, password);
            System.out.println("Connected to Oracle database");

            String sql = "";
            sql += "SELECT A.MAIN_ID as 메인, A.SUB1_ID as 서브1, A.SUB2_ID as 서브2, A.SUB2_NAME as 메뉴이름, C.DEPTNAME as 부서명, F.JOBKINDNAME as 직책 ";
            sql += "FROM SUB2_USER_T A, P1_MASTER B, P0_DEPT C, ERPACC.P0_GRADE D, ERPACC.P0_LEVEL E, ERPACC.P0_JOBKIND F ";
            sql += "WHERE DEPTNAME like '%"+dept+"%' ";
            sql += "    AND A.L_USERID = B.EMPNO(+) ";
            sql += "    AND B.DEPTCODE = C.DEPTCODE(+) ";
            sql += "    AND B.GRADECODE = D.GRADECODE(+) ";
            sql += "    AND B.LEVELCODE = E.LEVELCODE(+) ";
            sql += "    AND B.JOBKINDCODE = F.JOBKINDCODE(+) ";
            sql += "    AND B.RETIREDATE IS NULL ";
            sql += "GROUP BY ";
            sql += "    A.MAIN_ID, A.SUB1_ID, A.SUB2_ID, A.SUB2_NAME, C.DEPTNAME, F.JOBKINDNAME ";
            sql += "ORDER BY ";
            sql += "    MAIN_ID, ";
            sql += "    CASE ";
            sql += "        WHEN SUB1_ID = 0 THEN 0 ";
            sql += "        WHEN SUB1_ID = 99 THEN 1 ";
            sql += "        ELSE 2 ";
            sql += "    END, ";
            sql += "    SUB1_ID, ";
            sql += "    CASE ";
            sql += "        WHEN SUB2_ID = 100 THEN 0 ";
            sql += "        ELSE 1 ";
            sql += "    END, ";
            sql += "    SUB2_ID";


            // Statement 생성 및 쿼리 실행
            statement = connection.createStatement();
            resultSet = statement.executeQuery(sql);

            List<ResultDAO> list = new ArrayList<ResultDAO>();
            // 결과 출력
            while (resultSet.next()) {
                ResultDAO dao = new ResultDAO();
                dao.메인=resultSet.getInt("메인");
                dao.서브1=resultSet.getInt("서브1");
                dao.서브2=resultSet.getInt("서브2");
                dao.메뉴이름=resultSet.getString("메뉴이름");
                dao.부서명=resultSet.getString("부서명");
                dao.직책=resultSet.getString("직책");
                list.add(dao);
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            // 리소스 해제
            try {
                if (resultSet != null) resultSet.close();
                if (statement != null) statement.close();
                if (connection != null) connection.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
