gf_combo_head_Async = function (arg_head, arg_column, arg_cbo, arg_jsp, arg_para, arg_db) {
    this.gf_combo_head_comm(arg_head, arg_column, arg_cbo, arg_jsp, arg_para, true, arg_db);
}

gf_combo_head_comm = function (
    arg_head,   // 연결한 부모 데이터셋     this.parent.parent.ds_Master
    arg_column, // 데이터 셋의 column      "JOBKINDCODE"
    arg_cbo,    // 콤보박스의 obj          this.Div_Master.cbo_jobkind
    arg_jsp,    // jsp                    "co_dddw_jobkind"
    arg_para,   // 보통 빈문자열            ""
    arg_type,   // 1 : 비동기 / 0 : 동기    1
    arg_db      // DB연결 정보
) {
    var vs_arg_jsp = arg_jsp;           // inner 데이타셋을 사용할경우 "@" 가 있으면 inner 데이타 셋이다.

    var vs_ds_combo_para_bds = "_ds_" + arg_cbo.id + "_bds";  // 콤보 조회하기위해 아규먼트를 넘기기위한 데이타 셋 생성 
    var vs_ds_combo_out_bds = "_ds_" + arg_cbo.id + "_out";   // 조회결과값의 데이타셋
    var arg_svc = "_svc_" + arg_cbo.id + "_out";
    var arg_callback = "_ff_callback_combo_head";

    var objDelete = this.removeChild(vs_ds_combo_para_bds);     // 파라메터
    objDelete = this.removeChild(vs_ds_combo_out_bds);      // 콤보 데이타셋
    var bind1 = this.removeChild(vs_ds_combo_out_bds + "bo");     // 해드와 바인드

    var ds_combo_para_bds = new Dataset;                      // 파라메터 데이타셋 생성 
    ds_combo_para_bds.set_name(vs_ds_combo_para_bds);
    var vi_idx = this.addChild(ds_combo_para_bds.name, ds_combo_para_bds);

    var combo_para = new Array();

    combo_para = arg_para.split("|");

    for (i = 0; i < combo_para.length; i++) {
        ds_combo_para_bds.addColumn("ARG_CODE" + (i + 1), "string", 120);
    }
    ds_combo_para_bds.clearData();

    var ds_combo_out_bds = new Dataset();          // 콤보데이타셋 생성 
    ds_combo_out_bds.set_name(vs_ds_combo_out_bds);
    var vi_idx = this.addChild(ds_combo_out_bds.name, ds_combo_out_bds);

    var objBindItem = new BindItem();
    vi_idx = this.addChild(vs_ds_combo_out_bds + "bo", objBindItem);



    var vs_form_name = this.name;     // form name 부터 상위 
    var vs_parent = arg_cbo.parent;
    var vs_bindid = arg_cbo.name;
    do {
        if (vs_form_name == vs_parent.name) break;
        vs_bindid = vs_parent.name + "." + vs_bindid;
        vs_parent = vs_parent.parent
    } while (vs_parent.name != vs_form_name)

    objBindItem.init(vs_ds_combo_out_bds + "b1", vs_bindid, "value", arg_head.id, arg_column);
    objBindItem.bind();

    arg_cbo.set_innerdataset("");
    arg_cbo.set_innerdataset(vs_ds_combo_out_bds);
    arg_cbo.set_codecolumn("CODE");
    arg_cbo.set_datacolumn("DATA");

    var v_outdataset = "";
    var vs_combo_condition = "";
    // 아규먼트 갯수만큼 루핑

    for (var i = 0; i < combo_para.length; i++) {
        if (i == 0)
            var vi_row = ds_combo_para_bds.addRow();
        ds_combo_para_bds.setColumn(0, 'ARG_CODE' + (i + 1), combo_para[i].trim(" "));
        if (i == combo_para.length - 1)
            vs_combo_condition = combo_para[i].trim(" ");
    }

    v_outdataset = vs_ds_combo_out_bds + "=output1";

    v_SvcAct = "co/dddw/" + arg_jsp + "_1q.jsp";

    if (!NXCore.isEmpty(arg_db)) {                          // 인사일경우 주소를 바꾼다.
        if (arg_db == 1)                                    // 인사일 경우
            v_SvcAct = "hr/co/dddw/" + arg_jsp + "_1q.jsp";
        if (arg_db == 11)                                    // 인사일 경우
            v_SvcAct = "fa/co/dddw/" + arg_jsp + "_1q.jsp";

    }

    if (!NXCore.isEmpty(arg_db)) {
        var vs_arg_db = arg_db + "";
        v_SvcAct += "?dbconn=" + vs_arg_db.substr(0, 1);
    }

    v_InDataset = "ds_para=" + vs_ds_combo_para_bds;     // 반드시 기술할것
    v_Argument = "";

    var nIndex;
    nIndex = vs_arg_jsp.indexOf("@");  // inner 데이타셋을 사용하느냐?
    if (nIndex == -1) {
        if (arg_type)
            this.gf_Transaction_Async(arg_svc, v_SvcAct, v_InDataset, v_outdataset, arg_callback);
        else {
            this.gf_Transaction_sync(arg_svc, v_SvcAct, v_InDataset, v_outdataset, arg_callback);
        }
    }
    else {    // inner dataset를 강제로 만듬.
        var vb_true;
        vb_true = ds_combo_out_bds.addColumn("CODE", "string", 120);
        ds_combo_out_bds.addColumn("DATA", "string", 120);
        var va_row_arr = new Array();             // 로우 단위 스플릿 "@"
        var va_col_arr = new Array();             // 1로우를 컬럼으로 스플릿 "^"

        va_row_arr = vs_arg_jsp.split("@");

        for (var i = 0; i < va_row_arr.length; i++) {
            va_col_arr = va_row_arr[i].split("^");
            var vi_row = ds_combo_out_bds.addRow();
            ds_combo_out_bds.setColumn(vi_row, "CODE", va_col_arr[0]);
            //ds_combo_out_bds.setColumn(vi_row,"DATA",this.gf_get_trans_word(va_col_arr[1]));4
            ds_combo_out_bds.setColumn(vi_row, "DATA", this.gf_get_trans_meta_word(va_col_arr[1]));


        }
    }

    if (vs_combo_condition.substr(0, 1) == "@") {
        if (vs_combo_condition.substr(1, 1) == 'N') {
            ds_combo_out_bds.insertRow(0);
            ds_combo_out_bds.setColumn(0, "CODE", "");
            ds_combo_out_bds.setColumn(0, "DATA", "");
        }
        else if (vs_combo_condition.substr(1, 1) == 'A') {
            ds_combo_out_bds.insertRow(0);
            ds_combo_out_bds.setColumn(0, "CODE", "%");
            ds_combo_out_bds.setColumn(0, "DATA", this.gf_get_trans_meta_word("전체"));
        }
    }
    var objDelete = this.removeChild(vs_ds_combo_para_bds);

}