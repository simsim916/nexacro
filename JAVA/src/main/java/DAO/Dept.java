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
        column.add("부서레벨");
        column.add("조직도");
        column.add("부서명");
        column.add("부서코드");
        column.add("부서인원");

        return column;
    }
}
