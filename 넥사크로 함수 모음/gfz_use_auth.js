gfz_use_auth = function (arg_companycode, arg_userid) {
    var objDelete = this.removeChild("ds_select_temp_bds");
    var ds_select_temp_bds = new Dataset;
    var vi_idx = this.addChild("ds_select_temp_bds", ds_select_temp_bds);

    vSql = " SELECT COMPANYCODE , USER_ID, NVL(DEPTYN,'N') DEPTYN, NVL(ADMINYN,'N') ADMINYN, NVL(YESANYN,'N') YESANYN, NVL(JUNYN,'N') JUNYN, NVL(TEAMYN,'N') TEAMYN , NVL(AUTOYN,'N') AUTOYN FROM KFZ_AUTHORITY  ";
    vSql += "   WHERE COMPANYCODE = 'KN'  AND USER_ID = '" + arg_userid + "' ";
    vSql = "ds_select_temp_bds : " + vSql;

    this.gf_SelectSql_sync(vSql, "SELECT_kfzsyscnfg", "gfa_Callback_sync", 1);
    if (gvi_ErrorCode < 0 || ds_select_temp_bds.rowcount == 0) {
        var objDelete = this.removeChild("ds_select_temp_bds");
        return -1;
    }
    var Dataname = ds_select_temp_bds.getColumn(0, "USER_ID") + "|" + ds_select_temp_bds.getColumn(0, "DEPTYN") + "|" + ds_select_temp_bds.getColumn(0, "ADMINYN") + "|" + ds_select_temp_bds.getColumn(0, "YESANYN") + "|" + ds_select_temp_bds.getColumn(0, "JUNYN") + "|" + ds_select_temp_bds.getColumn(0, "TEAMYN") + "|" + ds_select_temp_bds.getColumn(0, "AUTOYN");
    var objDelete = this.removeChild("ds_select_temp_bds");

    return Dataname;
}