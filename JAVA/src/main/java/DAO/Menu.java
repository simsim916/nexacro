package DAO;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Menu {
    public String MAIN_ID;
    public String SUB1_ID;
    public String SUB2_ID;
    public String SUB2_NAME;
    public String IO_GUBUN;
    public String SEQ_NO;
    public String MENU_LVL;
    public String USEDATE;
    public Map<String, String> Emp;

    public List<String> getColumn(){
        List<String> column = new ArrayList<String>();
        column.add("메인코드");
        column.add("서브1코드");
        column.add("서브2코드");
        column.add("메뉴이름");

        return column;
    }
}
