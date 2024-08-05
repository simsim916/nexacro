package DAO;

import java.util.ArrayList;
import java.util.List;

public class Dept {
    public String deptname;
    public String level;
    public String history;
    public String deptcode;
    public String member;

    public List<String> getColumn(){
        List<String> column = new ArrayList<String>();
        column.add("level");
        column.add("deptname");
        column.add("history");
        column.add("deptcode");
        column.add("member");

        return column;
    }
}
