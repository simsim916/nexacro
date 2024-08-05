gf_Procedure_sync = function (arg_proc_name, arg_parm, svc_id, arg_callback, arg_db) {
    var objDelete = this.removeChild("ds_procedure_para_bds");

    var ds_procedure_para_bds = new Dataset;
    var vi_idx1 = this.addChild("ds_procedure_para_bds", ds_procedure_para_bds);
    ds_procedure_para_bds.addColumn("ARG_VALUE", "string", 250);
    var va_arr = arg_parm.split("|");
    var vi_nrow;
    for (var i = 0; i < va_arr.length; i++) {
        vi_nrow = ds_procedure_para_bds.addRow();
        ds_procedure_para_bds.setColumn(vi_nrow, 'ARG_VALUE', va_arr[i]);
    }
    // 프로시져명을 0번째로우에 값을 넣어줌     
    ds_procedure_para_bds.insertRow(0);
    ds_procedure_para_bds.setColumn(0, 0, arg_proc_name.toUpperCase());

    objDelete = this.removeChild("ds_procedures_return_bds");

    var ds_procedures_return_bds = new Dataset;
    var vi_idx = this.addChild("ds_procedures_return_bds", ds_procedures_return_bds);

    var ds_head = ds_procedure_para_bds.id;
    var v_SvcAct, v_InDataset, v_outdataset, v_Argument;

    v_SvcAct = "Common/common_procedure_1tr.jsp";    // 

    if (!NXCore.isEmpty(arg_db))
        v_SvcAct += "?dbconn=" + arg_db;

    v_InDataset = "ds_para=ds_procedure_para_bds";     // 반드시 기술할것
    v_outdataset = "ds_procedures_return_bds=output1";
    v_Argument = "";


    this.gf_Transaction_sync(svc_id, v_SvcAct, v_InDataset, v_outdataset, arg_callback);


    var vs_retu;
    if (ds_procedures_return_bds.rowcount > 0) {
        vs_retu = ds_procedures_return_bds.getColumn(0, 0);
        application.gvs_clipboard = ds_procedures_return_bds.getColumn(0, 1);		//dbms_output.put_line 값 셋팅
    }
    else vs_retu = "";

    var objDelete = this.removeChild("ds_procedures_return_bds");
    var objDelete = this.removeChild("ds_procedure_para_bds");
    return vs_retu;
}
