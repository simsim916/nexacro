gfz_use_print = function (arg_companycode, arg_Lineno) {
    var objDelete = this.removeChild("ds_select_temp_bds");
    var ds_select_temp_bds = new Dataset;
    var vi_idx = this.addChild("ds_select_temp_bds", ds_select_temp_bds);

    vSql = " SELECT DATANAME  ";
    vSql += "   FROM SYSCNFG WHERE SYSGU = 'A' ";
    vSql += "                 AND SERIAL = 5 AND LINENO <> '00' AND LINENO = DECODE('" + arg_Lineno + "','1','01','02') ";
    vSql = "ds_select_temp_bds : " + vSql;

    this.gf_SelectSql_sync(vSql, "SELECT_kfzsyscnfg", "gfa_Callback_sync", 1);
    if (gvi_ErrorCode < 0 || ds_select_temp_bds.rowcount == 0) {
        var objDelete = this.removeChild("ds_select_temp_bds");
        return -1;
    }
    var Dataname = ds_select_temp_bds.getColumn(0, "DATANAME");
    var objDelete = this.removeChild("ds_select_temp_bds");

    return Dataname;
}
