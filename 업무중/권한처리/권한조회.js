include "lib::common_form.xjs";

this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}

this.ff_load = function (obj) {
    this.ff_SQL("SELECT_DEPT");
    this.ff_Tran('SELECT_DEPTINFO');
    this.ff_Tran('SELECT_MENU');
}

this.ff_Tran = function (strSvcId) {
    switch (strSvcId) {
        case "SELECT_DEPTINFO":
            v_SvcAct = "01_Moon/auth/auth_1q.jsp";
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_dept=output1";  // 반드시 output1으로 기술할것
            break;
        case "SELECT_EMP":
            for (var i = this.grid_deptmenu.getCellCount("head") -1 ; i > 0; i--) {
                this.grid_deptmenu.deleteContentsCol(i);
            }
            v_SvcAct = "01_Moon/auth/auth_2q.jsp";
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_emp=output1";  // 반드시 output1으로 기술할것
            break;
        case "SELECT_MENU":
            v_SvcAct = "01_Moon/auth/auth_3q.jsp";
            v_InDataset = "ds_para=ds_emp";     // 반드시 기술할것
            v_OutDataset = "ds_deptmenu=output1";  // 반드시 output1으로 기술할것
            break;
    }
    this.gf_Transaction_sync(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");
}

this.ff_SQL = function (strID, pra1) {
    var sql;
    switch (strID) {
        case "SELECT_DEPT":
            sql = "SELECT DEPTNAME FROM P0_DEPT WHERE USETAG = '1' AND DEPTCODE = DEPTPART ORDER BY PRINTSEQ";
            this.gf_SelectSql_sync("ds_Updept : " + sql, "SELECT_DEPT", "ff_Callback_sync");
            break;
    }
}

this.ff_Callback = function (strID, ErrorCode, ErrorMsg) {
    if (ErrorCode < 0) {
        NXCore.alert('CallBack strID = ' + strID + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
        return;
    }
    switch (strID) {
        case "SELECT_DEPTINFO":
            this.ds_head.setColumn(0, "DEPTCODE", this.ds_dept.getColumn(0, "DEPTCODE"));
            this.ff_Tran('SELECT_EMP');
            break;
        case "SELECT_EMP":
            var cnt = 0;
            for (var i = 0; i < this.ds_emp.getRowCount(); i++) {
                ++cnt;
                this.grid_deptmenu.appendContentsCol(this.ds_emp.getColumn(i, "EMPNO"));
                this.grid_deptmenu.setCellProperty("head", cnt, "text", this.ds_emp.getColumn(i, "EMPNO"));
                this.grid_deptmenu.setCellProperty("body", cnt, "text", "bind:" + this.ds_emp.getColumn(i, "EMPNO"));
                this.grid_deptmenu.setFormatColProperty(cnt, "size", 70);
                this.grid_deptmenu.setCellProperty("body", cnt, "align", "center")
            }
            this.ff_Tran("SELECT_MENU");
            break;
        case "SELECT_MENU":

            break;
    }
}

this.ff_Callback_sync = function (strID, ErrorCode, ErrorMsg) {
    if (ErrorCode < 0) {
        NXCore.alert('CallBack strID = ' + strID + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
        return;
    }
    switch (strID) {
        case "SELECT_DEPT":
            this.div_head.cb_dept.set_value(this.ds_Updept.getColumn(0, "DEPTNAME"));
            this.ds_head.setColumn(0, "DEPTNAME", this.ds_Updept.getColumn(0, "DEPTNAME"));
            break;
    }
}

this.ff_onItemChanged = function (obj, e) {
    switch (obj.id) {
        case "cb_dept":
            this.ds_head.setColumn(0, "DEPTNAME", obj.value);
            this.ff_Tran('SELECT_DEPTINFO');
            this.ds_head.setColumn(0, "DEPTCODE", this.ds_dept.getColumn(e.row, "DEPTCODE"));
            break;
    }
}

this.ff_oncellclick = function (obj, e) {
    switch (obj.id) {
        case "grid_dept":
            this.ds_head.setColumn(0, "DEPTCODE", this.ds_dept.getColumn(e.row, "DEPTCODE"));
            this.ff_Tran('SELECT_EMP');
            break;
    }
}