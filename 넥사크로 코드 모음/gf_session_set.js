gf_session_set = function (arg_session, arg_svc, arg_callback) {
    var objDelete = this.removeChild("ds_session_para_bds");

    var ds_session_para_bds = new Dataset;
    var vi_idx = this.addChild("ds_session_para_bds", ds_session_para_bds);
    ds_session_para_bds.addColumn("arg_code", "string", 120);
    ds_session_para_bds.clearData();

    var vs_ds_name, vs_code_name;
    var v_outdataset = "";
    var vi_row = ds_session_para_bds.addRow();

    ds_session_para_bds.setColumn(vi_row, 'arg_code', arg_session.trim(" "));

    v_SvcAct = "Common/common_session_get_1q.jsp";    // 
    v_InDataset = "ds_para=ds_session_para_bds";     // 반드시 기술할것
    v_outdataset = "ds_session_para_bds=output1";
    v_Argument = "";

    this.gf_Transaction_sync(arg_svc, v_SvcAct, v_InDataset, v_outdataset, arg_callback);
    var vs_ret;
    if (ds_session_para_bds.rowcount < 0) {
        vs_ret = "";
    }
    else {
        vs_ret = ds_session_para_bds.getColumn(0, 'ARG_CODE');
        if (NXCore.isEmpty(vs_ret)) vs_ret = "";
        else vs_ret = vs_ret.trim(" ");
    }
    var objDelete = this.removeChild("ds_session_para_bds");
    return vs_ret;
}