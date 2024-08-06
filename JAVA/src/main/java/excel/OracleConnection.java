package excel;

import DAO.Dept;
import DAO.Emp;
import DAO.Menu;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OracleConnection {
    String jdbcUrl = "jdbc:oracle:thin:@10.7.140.31:1521:NEOHQ";
    String username = "erpman";
    String password = "erpman";
    Connection connection;
    Statement statement;
    ResultSet resultSet;

    public List<Dept> getTopDept() {
        try {
            // JDBC 드라이버 로드
            Class.forName("oracle.jdbc.driver.OracleDriver");
            // 데이터베이스 연결
            connection = DriverManager.getConnection(jdbcUrl, username, password);
            statement = connection.createStatement();

            String sql = "SELECT DEPTNAME FROM P0_DEPT WHERE USETAG = '1' AND DEPTCODE = DEPTPART ORDER BY PRINTSEQ";

            resultSet = statement.executeQuery(sql);

            List<Dept> list = new ArrayList<>();
            // 결과 출력
            while (resultSet.next()) {
                Dept dao = new Dept();
                dao.deptname=resultSet.getString("DEPTNAME");
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

    public List<Dept> getAllDept(List<Dept> arg_list) {
        try {
            // JDBC 드라이버 로드
            Class.forName("oracle.jdbc.driver.OracleDriver");
            // 데이터베이스 연결
            connection = DriverManager.getConnection(jdbcUrl, username, password);
            statement = connection.createStatement();

            List<Dept> list = new ArrayList<>();

            for (Dept dept : arg_list) {
                String sql = "";

                sql += "SELECT LEVEL, \n";
                sql += "       SYS_CONNECT_BY_PATH(DEPTNAME, '-') AS HISTORY, ";
                sql += "       DEPTNAME AS DEPTNAME, ";
                sql += "       DEPTCODE AS DEPTCODE, ";
                sql += "       (SELECT COUNT(*) ";
                sql += "        FROM P1_MASTER B ";
                sql += "        WHERE A.DEPTCODE = B.DEPTCODE AND B.RETIREDATE IS NULL) AS MEMBER ";
                sql += "FROM P0_DEPT A ";
                sql += "WHERE USETAG = '1' ";
                sql += "START WITH DEPTNAME = '"+ dept.deptname +"' ";
                sql += "CONNECT BY NOCYCLE PRIOR DEPTCODE = DEPTPART ";
                sql += "ORDER SIBLINGS BY DEPTNAME";

                resultSet = statement.executeQuery(sql);
                // 결과 출력
                while (resultSet.next()) {
                    Dept dao = new Dept();
                    dao.level=resultSet.getString("LEVEL");
                    dao.history=resultSet.getString("HISTORY");
                    dao.deptname=resultSet.getString("DEPTNAME");
                    dao.deptcode=resultSet.getString("DEPTCODE");
                    dao.member=resultSet.getString("MEMBER");
                    list.add(dao);
                }
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

    public List<Menu> getMenu(List<Emp> Emp) {
        try {
            // JDBC 드라이버 로드
            Class.forName("oracle.jdbc.driver.OracleDriver");
            // 데이터베이스 연결
            connection = DriverManager.getConnection(jdbcUrl, username, password);
            statement = connection.createStatement();

            String emps = "";
            for(int i = 0; i < Emp.size(); i++){
                if(i == 0)
                    emps = Emp.get(i).EMPNO;
                else
                    emps += "','" + Emp.get(i).EMPNO;
            }

            String sql = "";
            sql += "	    SELECT     ";
            sql += "	        S.MAIN_ID,     ";
            sql += "	        S.SUB1_ID,     ";
            sql += "	        S.SUB2_ID,     ";
            sql += "	        S.SUB2_NAME,     ";
            sql += "	        S.IO_GUBUN,     ";
            sql += "	        S.SEQ_NO,     ";
            sql += "	        S.MENU_LVL     ";
        for(Emp a : Emp){
            sql += "	        ,MAX(CASE A.L_USERID     ";
            sql += "	            WHEN '" + a.EMPNO + "' THEN 'O'     ";
            sql += "	            ELSE NULL     ";
            sql += "	        END) AS "+ a.EMPNO +"     ";
            sql += "	        ,MAX(CASE      ";
            sql += "	            WHEN A.L_USERID = '" + a.EMPNO + "' THEN PH1.USEDATE     ";
            sql += "	            ELSE NULL     ";
            sql += "	        END) AS "+ a.EMPNO +"_DATE     ";
        }
            sql += "	    FROM (     ";
            sql += "	        SELECT     ";
            sql += "	            MAIN_ID,     ";
            sql += "	            SUB1_ID,     ";
            sql += "	            SUB2_ID,     ";
            sql += "	            SUB2_NAME,     ";
            sql += "	            IO_GUBUN,     ";
            sql += "	            DECODE(SUB2_ID, '0', 1, '99', 2, '100', 3, 4) AS MENU_LVL,     ";
            sql += "	            TO_NUMBER(     ";
            sql += "	                DECODE(     ";
            sql += "	                    SUB2_ID,     ";
            sql += "	                    '0', MAIN_ID || '000000000',     ";
            sql += "	                    '99', MAIN_ID || '099000000',     ";
            sql += "	                    '100', MAIN_ID || '099' || SUBSTR(TO_CHAR(SUB1_ID, '000'), 2, 3) || '000',     ";
            sql += "	                    MAIN_ID || '099' || SUBSTR(TO_CHAR(SUB1_ID, '000'), 2, 3) || SUBSTR(TO_CHAR(SUB2_ID, '000'), 2, 3)     ";
            sql += "	                )     ";
            sql += "	            ) AS SEQ_NO     ";
            sql += "	        FROM     ";
            sql += "	            SUB2_T      ";
            sql += "	    ) S     ";
            sql += "	        LEFT JOIN SUB2_USER_T A ON S.SUB2_NAME = A.SUB2_NAME AND A.L_USERID IN ('" + emps + "')     ";
            sql += "	        LEFT JOIN P1_MASTER B ON A.L_USERID = B.EMPNO AND B.RETIREDATE IS NULL    ";
            sql += "	        LEFT JOIN (    ";
            sql += "	                SELECT MAX(SDATE) AS USEDATE, SUB2_NAME, L_USERID FROM PGM_HISTORY WHERE L_USERID IN ('"+ emps +"') GROUP BY SUB2_NAME, L_USERID HAVING MAX(SDATE) >= '20240101'        ";
            sql += "	                  ) PH1 ON A.L_USERID = PH1.L_USERID AND A.SUB2_NAME = PH1.SUB2_NAME   ";
            sql += "	    GROUP BY     ";
            sql += "	        S.MAIN_ID     ";
            sql += "	        ,S.SUB1_ID     ";
            sql += "	        ,S.SUB2_ID     ";
            sql += "	        ,S.SUB2_NAME     ";
            sql += "	        ,S.IO_GUBUN     ";
            sql += "	        ,S.SEQ_NO     ";
            sql += "	        ,S.MENU_LVL     ";
            sql += "	    ORDER BY     ";
            sql += "	        S.SEQ_NO     ";
            sql += " ";

            resultSet = statement.executeQuery(sql);

            List<Menu> list = new ArrayList<Menu>();

            // 결과 출력
            while (resultSet.next()) {
                Menu dao = new Menu();
                dao.MAIN_ID=resultSet.getString("MAIN_ID");
                dao.SUB1_ID=resultSet.getString("SUB1_ID");
                dao.SUB2_ID=resultSet.getString("SUB2_ID");
                dao.SUB2_NAME=resultSet.getString("SUB2_NAME");
                dao.IO_GUBUN=resultSet.getString("IO_GUBUN");
                dao.SEQ_NO=resultSet.getString("SEQ_NO");
                dao.MENU_LVL=resultSet.getString("MENU_LVL");
                dao.Emp = new HashMap<String, String>();
                for(Emp a : Emp){
                    dao.Emp.put(a.EMPNO, resultSet.getString(a.EMPNO) != null ? resultSet.getString(a.EMPNO)+resultSet.getString(a.EMPNO+"_DATE") : null);
                }
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

    public List<Emp> getDeptMember(String deptcode) {
        try {
            // JDBC 드라이버 로드
            Class.forName("oracle.jdbc.driver.OracleDriver");
            // 데이터베이스 연결
            connection = DriverManager.getConnection(jdbcUrl, username, password);
            statement = connection.createStatement();

            String sql = "";
            sql += "	    SELECT     ";
            sql += "	        COUNT(A.EMPNO)  AS MENUCNT   ";
            sql += "	        ,A.EMPNO     ";
            sql += "	        ,A.EMPNAME     ";
            sql += "	        ,B.GRADENAME     ";
            sql += "	        ,D.JOBKINDNAME     ";
            sql += "	    FROM SUB2_USER_T S      ";
            sql += "	        LEFT JOIN P1_MASTER A ON S.L_USERID = A.EMPNO     ";
            sql += "	        LEFT JOIN ERPACC.P0_GRADE B ON A.GRADECODE = B.GRADECODE     ";
            sql += "	        LEFT JOIN ERPACC.P0_JOBKIND D ON A.JOBKINDCODE = D.JOBKINDCODE     ";
            sql += "	    WHERE      ";
            sql += "	        A.RETIREDATE IS NULL     ";
            sql += "	        AND A.DEPTCODE = '" + deptcode + "'     ";
            sql += "	    GROUP BY      ";
            sql += "	        A.EMPNO     ";
            sql += "	        ,A.EMPNAME     ";
            sql += "	        ,B.GRADENAME     ";
            sql += "	        ,D.JOBKINDNAME     ";
            sql += "	        ,A.JOBKINDCODE     ";
            sql += "	        ,A.GRADECODE     ";
            sql += "	    ORDER BY      ";
            sql += "	        CASE      ";
            sql += "	            WHEN A.JOBKINDCODE = 60 THEN 1     ";
            sql += "	            ELSE 0     ";
            sql += "	        END,     ";
            sql += "	        A.JOBKINDCODE,     ";
            sql += "	        A.GRADECODE      ";

            resultSet = statement.executeQuery(sql);

            List<Emp> list = new ArrayList<Emp>();
            // 결과 출력
            while (resultSet.next()) {
                Emp dao = new Emp();
                dao.EMPNO=resultSet.getString("EMPNO");
                dao.EMPNAME=resultSet.getString("EMPNAME");
                dao.GRADENAME=resultSet.getString("GRADENAME");
                dao.JOBKINDNAME=resultSet.getString("JOBKINDNAME");
                dao.MENUCNT=resultSet.getString("MENUCNT");
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

    public String getETC(String EMPNO) {
        try {
            // JDBC 드라이버 로드
            Class.forName("oracle.jdbc.driver.OracleDriver");
            // 데이터베이스 연결
            connection = DriverManager.getConnection(jdbcUrl, username, password);
            statement = connection.createStatement();

            String sql = "";
            sql += "	    SELECT     ";
            sql += "	        LISTAGG(ETC, ',') WITHIN GROUP (ORDER BY ETC) AS ETC_LIST  ";
            sql += "	    FROM (      ";
            sql += "	    SELECT     ";
            sql += "	        B.RFNA1 AS ETC     ";
            sql += "	    FROM REFFPF A     ";
            sql += "	        LEFT JOIN REFFPF B ON A.RFCOD = B.RFCOD AND B.RFGUB = '00'     ";
            sql += "	    WHERE A.RFNA1 = '" + EMPNO + "' OR A.RFNA2 = '" + EMPNO + "' OR A.RFNA3 = '" + EMPNO + "'      ";
            sql += "	    UNION ALL     ";
            sql += "	    SELECT '고객카드 Monitoring' AS ETC FROM ANAL_CUST_LEVEL A WHERE EMPNO = '" + EMPNO + "'      ";
            sql += "	    UNION ALL     ";
            sql += "	    SELECT '회계_부서권한' AS ETC FROM ERPACC.KFZ_AUTHORITY WHERE DEPTYN = 'Y' AND USER_ID = '" + EMPNO + "'      ";
            sql += "	    UNION ALL     ";
            sql += "	    SELECT '회계_예산권한' AS ETC FROM ERPACC.KFZ_AUTHORITY WHERE YESANYN = 'Y' AND USER_ID = '" + EMPNO + "'      ";
            sql += "	    UNION ALL     ";
            sql += "	    SELECT '회계_전표권한' AS ETC FROM ERPACC.KFZ_AUTHORITY WHERE JUNYN = 'Y' AND USER_ID = '" + EMPNO + "'      ";
            sql += "	    UNION ALL     ";
            sql += "	    SELECT '회계_팀장권한' AS ETC FROM ERPACC.KFZ_AUTHORITY WHERE TEAMYN = 'Y' AND USER_ID = '" + EMPNO + "'      ";
            sql += "	    UNION ALL     ";
            sql += "	    SELECT '회계_자동전표권한' AS ETC FROM ERPACC.KFZ_AUTHORITY WHERE AUTOYN = 'Y' AND USER_ID = '" + EMPNO + "'      ";
            sql += "	        )      ";

            resultSet = statement.executeQuery(sql);

            // 결과 출력
            while (resultSet.next()) {
                return resultSet.getString("ETC_LIST");
            }
            return "";
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
